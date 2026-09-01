-- A7 Orlando OS — governed hotel directory and hotel KPIs.
-- Additive and service-role only. Historical free-text properties are not rewritten.

create table if not exists public.a7_orlando_hotels (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null default 'orlando' check (unit_key = 'orlando'),
  canonical_name text not null check (length(trim(canonical_name)) between 2 and 180),
  address_line text not null check (length(trim(address_line)) between 5 and 240),
  region text check (region is null or length(region) <= 100),
  aliases text[] not null default '{}',
  handoff_notes text check (handoff_notes is null or length(handoff_notes) <= 500),
  active boolean not null default true,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists a7_orlando_hotels_canonical_name_idx
  on public.a7_orlando_hotels (unit_key, lower(trim(canonical_name)));
create index if not exists a7_orlando_hotels_active_name_idx
  on public.a7_orlando_hotels (active, canonical_name);

create table if not exists public.a7_orlando_hotel_events (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.a7_orlando_hotels(id) on delete restrict,
  action text not null check (action in ('hotel_created', 'hotel_updated')),
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  snapshot jsonb not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

alter table public.a7_orlando_leads
  add column if not exists hotel_id uuid references public.a7_orlando_hotels(id) on delete restrict;
alter table public.a7_orlando_orders
  add column if not exists hotel_id uuid references public.a7_orlando_hotels(id) on delete restrict;

create index if not exists a7_orlando_leads_hotel_idx on public.a7_orlando_leads (hotel_id);
create index if not exists a7_orlando_orders_hotel_idx on public.a7_orlando_orders (hotel_id, accepted_at desc);

alter table public.a7_orlando_hotels enable row level security;
alter table public.a7_orlando_hotel_events enable row level security;
revoke all on public.a7_orlando_hotels, public.a7_orlando_hotel_events from public, anon, authenticated;
grant all on public.a7_orlando_hotels, public.a7_orlando_hotel_events to service_role;

create or replace function public.a7_orlando_capture_hotel_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_hotel_id uuid;
  v_hotel public.a7_orlando_hotels;
begin
  if tg_table_name = 'a7_orlando_leads' then
    if new.accommodation_type <> 'hotel' then
      new.hotel_id := null;
      return new;
    end if;
    if coalesce(new.operational_data->>'hotel_id', '') = '' then return new; end if;
    begin
      v_hotel_id := (new.operational_data->>'hotel_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid hotel identity';
    end;
    select * into v_hotel from public.a7_orlando_hotels
      where id = v_hotel_id and unit_key = 'orlando' and active;
    if v_hotel.id is null then raise exception 'Active hotel not found'; end if;
    if new.operational_data->>'property' is distinct from v_hotel.canonical_name
      or new.operational_data->>'property_address' is distinct from v_hotel.address_line then
      raise exception 'Hotel snapshot does not match directory';
    end if;
    new.hotel_id := v_hotel.id;
  elsif tg_table_name = 'a7_orlando_orders' then
    select l.hotel_id into v_hotel_id from public.a7_orlando_leads l where l.id = new.lead_id;
    new.hotel_id := v_hotel_id;
  end if;
  return new;
end;
$$;

drop trigger if exists a7_orlando_leads_capture_hotel on public.a7_orlando_leads;
create trigger a7_orlando_leads_capture_hotel before insert or update of accommodation_type, operational_data
  on public.a7_orlando_leads for each row execute function public.a7_orlando_capture_hotel_link();
drop trigger if exists a7_orlando_orders_capture_hotel on public.a7_orlando_orders;
create trigger a7_orlando_orders_capture_hotel before insert or update of lead_id
  on public.a7_orlando_orders for each row execute function public.a7_orlando_capture_hotel_link();

create or replace function public.a7_orlando_upsert_hotel(
  p_hotel_id uuid,
  p_canonical_name text,
  p_address_line text,
  p_region text,
  p_aliases text[],
  p_handoff_notes text,
  p_active boolean,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_hotel public.a7_orlando_hotels;
  v_name text := left(regexp_replace(trim(coalesce(p_canonical_name, '')), '\s+', ' ', 'g'), 180);
  v_address text := left(regexp_replace(trim(coalesce(p_address_line, '')), '\s+', ' ', 'g'), 240);
  v_aliases text[];
  v_action text;
  v_existing_snapshot jsonb;
begin
  if p_actor_role <> 'owner' or trim(coalesce(p_actor_id, '')) = '' then raise exception 'Owner authorization is required'; end if;
  if length(v_name) < 2 or length(v_address) < 5 then raise exception 'Hotel name and address are required'; end if;
  if trim(coalesce(p_idempotency_key, '')) = '' then raise exception 'Idempotency key is required'; end if;
  perform pg_advisory_xact_lock(hashtext('a7-orlando-hotel:' || p_idempotency_key));
  select coalesce(array_agg(alias order by lower(alias)), '{}') into v_aliases
  from (select distinct left(regexp_replace(trim(value), '\s+', ' ', 'g'), 180) alias
    from unnest(coalesce(p_aliases, '{}')) value where length(trim(value)) >= 2) clean;

  select e.snapshot into v_existing_snapshot
  from public.a7_orlando_hotel_events e where e.idempotency_key = p_idempotency_key;
  if v_existing_snapshot is not null then
    if v_existing_snapshot->>'canonical_name' is distinct from v_name
      or v_existing_snapshot->>'address_line' is distinct from v_address then
      raise exception 'Idempotency key conflicts with another hotel write';
    end if;
    return v_existing_snapshot;
  end if;

  if exists (
    select 1 from public.a7_orlando_hotels h
    where h.unit_key = 'orlando' and h.id is distinct from p_hotel_id
      and (lower(trim(h.canonical_name)) = lower(v_name)
        or lower(v_name) in (select lower(x) from unnest(h.aliases) x)
        or exists (select 1 from unnest(v_aliases) a
          where lower(a) = lower(h.canonical_name)
            or lower(a) in (select lower(x) from unnest(h.aliases) x)))
  ) then raise exception 'Hotel name or alias already exists'; end if;

  if p_hotel_id is null then
    insert into public.a7_orlando_hotels (
      canonical_name, address_line, region, aliases, handoff_notes, active, created_by, updated_by
    ) values (
      v_name, v_address, nullif(left(trim(coalesce(p_region, '')), 100), ''), v_aliases,
      nullif(left(trim(coalesce(p_handoff_notes, '')), 500), ''), coalesce(p_active, true), p_actor_id, p_actor_id
    ) returning * into v_hotel;
    v_action := 'hotel_created';
  else
    update public.a7_orlando_hotels set canonical_name = v_name, address_line = v_address,
      region = nullif(left(trim(coalesce(p_region, '')), 100), ''), aliases = v_aliases,
      handoff_notes = nullif(left(trim(coalesce(p_handoff_notes, '')), 500), ''),
      active = coalesce(p_active, active), updated_by = p_actor_id, updated_at = now()
    where id = p_hotel_id and unit_key = 'orlando' returning * into v_hotel;
    if v_hotel.id is null then raise exception 'Hotel not found'; end if;
    v_action := 'hotel_updated';
  end if;

  insert into public.a7_orlando_hotel_events (
    hotel_id, action, actor_id, actor_role, idempotency_key, snapshot, occurred_at
  ) values (v_hotel.id, v_action, p_actor_id, p_actor_role, p_idempotency_key, to_jsonb(v_hotel), p_occurred_at)
  on conflict (idempotency_key) do nothing;

  return to_jsonb(v_hotel);
end;
$$;

create or replace function public.a7_orlando_list_hotels(
  p_query text default '', p_include_inactive boolean default false, p_limit integer default 100
) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(row_data order by active desc, canonical_name), '[]'::jsonb)
  from (
  select h.active, h.canonical_name, jsonb_build_object(
    'hotel_id', h.id,
    'canonical_name', h.canonical_name,
    'address_line', h.address_line,
    'region', h.region,
    'aliases', h.aliases,
    'handoff_notes', h.handoff_notes,
    'active', h.active,
    'order_count', coalesce(k.order_count, 0),
    'confirmed_order_count', coalesce(k.confirmed_order_count, 0),
    'confirmed_service_revenue', coalesce(k.confirmed_service_revenue, 0),
    'average_confirmed_ticket', k.average_confirmed_ticket,
    'normal_orders', coalesce(k.normal_orders, 0),
    'express_orders', coalesce(k.express_orders, 0),
    'new_customer_orders', coalesce(k.new_customer_orders, 0),
    'repeat_customer_orders', coalesce(k.repeat_customer_orders, 0),
    'last_service_at', k.last_service_at,
    'currency', 'USD'
  ) as row_data
  from public.a7_orlando_hotels h
  left join lateral (
    select
      count(o.id) filter (where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer order_count,
      count(o.id) filter (where public.a7_orlando_order_confirmed_service_revenue(o.id) is not null)::integer confirmed_order_count,
      coalesce(sum(public.a7_orlando_order_confirmed_service_revenue(o.id)), 0) confirmed_service_revenue,
      avg(public.a7_orlando_order_confirmed_service_revenue(o.id)) average_confirmed_ticket,
      count(o.id) filter (where o.service_tier = 'normal' and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer normal_orders,
      count(o.id) filter (where o.service_tier = 'express' and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer express_orders,
      count(o.id) filter (where not coalesce(o.is_repeat_customer, false) and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer new_customer_orders,
      count(o.id) filter (where coalesce(o.is_repeat_customer, false) and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer repeat_customer_orders,
      max(o.accepted_at) filter (where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)) last_service_at
    from public.a7_orlando_orders o where o.hotel_id = h.id
  ) k on true
  where h.unit_key = 'orlando' and (p_include_inactive or h.active)
    and (trim(coalesce(p_query, '')) = ''
      or lower(h.canonical_name) like '%' || lower(left(trim(p_query), 160)) || '%'
      or lower(h.address_line) like '%' || lower(left(trim(p_query), 160)) || '%'
      or lower(coalesce(h.region, '')) like '%' || lower(left(trim(p_query), 160)) || '%'
      or exists (select 1 from unnest(h.aliases) a where lower(a) like '%' || lower(left(trim(p_query), 160)) || '%'))
  order by h.active desc, h.canonical_name
  limit least(greatest(coalesce(p_limit, 100), 1), 200)
  ) bounded;
$$;

revoke all on function public.a7_orlando_capture_hotel_link() from public, anon, authenticated;
revoke all on function public.a7_orlando_upsert_hotel(uuid,text,text,text,text[],text,boolean,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_list_hotels(text,boolean,integer) from public, anon, authenticated;
grant execute on function public.a7_orlando_capture_hotel_link() to service_role;
grant execute on function public.a7_orlando_upsert_hotel(uuid,text,text,text,text[],text,boolean,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_list_hotels(text,boolean,integer) to service_role;

comment on table public.a7_orlando_hotels is 'Private governed Orlando hotel directory; no guest PII.';
comment on column public.a7_orlando_leads.hotel_id is 'Stable hotel relation for new governed hotel orders; historical rows remain null.';
comment on function public.a7_orlando_list_hotels(text,boolean,integer) is 'Private directory and truthful hotel KPI read model; service-role only.';
