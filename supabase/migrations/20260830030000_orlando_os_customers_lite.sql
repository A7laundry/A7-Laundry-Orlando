-- A7 Orlando OS W1A.3 — Clientes Lite read model.
-- Additive, Owner-facing through the private server API, and service-role only at the database boundary.
-- No CRM table or persisted aggregate is introduced.

alter table public.a7_wa_contacts
  add column if not exists email text,
  add column if not exists email_source text;

alter table public.a7_orlando_orders
  add column if not exists is_qa boolean not null default false;

alter table public.a7_wa_contacts
  add constraint a7_wa_contacts_email_valid
  check (email is null or (length(email) <= 160 and position('@' in email) > 1)) not valid;

alter table public.a7_wa_contacts
  add constraint a7_wa_contacts_email_source_valid
  check (email_source is null or email_source in ('manual', 'stripe', 'approved_import')) not valid;

alter table public.a7_wa_contacts validate constraint a7_wa_contacts_email_valid;
alter table public.a7_wa_contacts validate constraint a7_wa_contacts_email_source_valid;

create index if not exists a7_wa_contacts_orlando_email_idx
  on public.a7_wa_contacts (unit_key, lower(email)) where email is not null;

create or replace function public.a7_orlando_order_is_qa(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(o.is_qa, false) or coalesce(
    concat_ws(' ', c.profile_name, l.operational_data->>'order_notes',
      l.operational_data->>'property', l.operational_data->>'location_notes')
      ~* '(^|[^A-Z0-9])(QA|DO NOT FULFILL|DO NOT DISPATCH)([^A-Z0-9]|$)',
    false
  )
  from public.a7_orlando_orders o
  left join public.a7_orlando_leads l on l.id = o.lead_id
  left join public.a7_wa_contacts c on c.id = o.customer_id
  where o.id = p_order_id and o.unit_key = 'orlando';
$$;

create or replace function public.a7_orlando_order_confirmed_service_revenue(p_order_id uuid)
returns numeric
language sql stable security definer set search_path = public as $$
  select case
    when public.a7_orlando_order_is_qa(o.id) then null
    when o.order_status = 'cancelled' then null
    when o.payment_status not in ('paid', 'partially_refunded', 'refunded') then null
    when p.status not in ('paid', 'partially_refunded', 'refunded') then null
    when o.service_amount is null then null
    else greatest(o.service_amount - coalesce(p.refund_total, 0), 0)
  end
  from public.a7_orlando_orders o
  left join public.a7_orlando_payments p on p.order_id = o.id
  where o.id = p_order_id and o.unit_key = 'orlando';
$$;

create or replace function public.a7_orlando_search_customers_lite(
  p_mode text,
  p_query text,
  p_limit integer default 12
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_query text := left(trim(coalesce(p_query, '')), 160);
  v_limit integer := least(greatest(coalesce(p_limit, 12), 1), 20);
  v_result jsonb;
begin
  if p_mode = 'phone_last4' then
    if v_query !~ '^[0-9]{4}$' then raise exception 'Invalid customer search'; end if;
  elsif p_mode = 'phone' then
    if v_query !~ '^[0-9]{10,15}$' then raise exception 'Invalid customer search'; end if;
  elsif p_mode = 'email' then
    if length(v_query) > 160 or position('@' in v_query) <= 1 then raise exception 'Invalid customer search'; end if;
    v_query := lower(v_query);
  elsif p_mode = 'order_number' then
    if v_query !~ '^(A7-ORL-[0-9]{4,}|MCO [0-9]{4,12})$' then raise exception 'Invalid customer search'; end if;
  elsif p_mode = 'name' then
    if length(v_query) < 3 or length(v_query) > 80 then raise exception 'Invalid customer search'; end if;
  else
    raise exception 'Invalid customer search mode';
  end if;

  select coalesce(jsonb_agg(row_data order by latest_accepted_at desc nulls last, profile_name, customer_id), '[]'::jsonb)
    into v_result
  from (
    select c.id as customer_id,
      c.profile_name,
      latest.accepted_at as latest_accepted_at,
      jsonb_build_object(
        'customer_id', c.id,
        'profile_name', c.profile_name,
        'whatsapp_last4', right(c.wa_id, 4),
        'latest_property', latest.operational_data->>'property',
        'latest_accepted_at', latest.accepted_at,
        'order_count', count(o.id) filter (
          where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)
        ),
        'confirmed_service_revenue', coalesce(sum(
          coalesce(public.a7_orlando_order_confirmed_service_revenue(o.id), 0)
        ), 0),
        'currency', 'USD'
      ) as row_data
    from public.a7_wa_contacts c
    join public.a7_orlando_orders o on o.customer_id = c.id and o.order_number is not null
    left join lateral (
      select recent.accepted_at, lead.operational_data
      from public.a7_orlando_orders recent
      join public.a7_orlando_leads lead on lead.id = recent.lead_id
      where recent.customer_id = c.id and recent.order_number is not null
        and recent.order_status <> 'cancelled'
        and not public.a7_orlando_order_is_qa(recent.id)
      order by recent.accepted_at desc, recent.id
      limit 1
    ) latest on true
    where c.unit_key = 'orlando'
      and (
        (p_mode = 'phone_last4' and right(c.wa_id, 4) = v_query)
        or (p_mode = 'phone' and c.wa_id = v_query)
        or (p_mode = 'email' and lower(c.email) = v_query)
        or (p_mode = 'order_number' and exists (
          select 1 from public.a7_orlando_orders related
          where related.customer_id = c.id and related.order_number = v_query
        ))
        or (p_mode = 'name' and strpos(lower(coalesce(c.profile_name, '')), lower(v_query)) > 0)
      )
    group by c.id, c.profile_name, c.wa_id, latest.operational_data, latest.accepted_at
    order by latest.accepted_at desc nulls last, c.profile_name, c.id
    limit v_limit
  ) matches;

  return v_result;
end;
$$;

create or replace function public.a7_orlando_get_customer_lite(p_customer_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer public.a7_wa_contacts;
  v_latest record;
  v_summary record;
  v_orders jsonb;
  v_acquisition_source text;
begin
  select * into v_customer
  from public.a7_wa_contacts
  where id = p_customer_id and unit_key = 'orlando';

  if v_customer.id is null or not exists (
    select 1 from public.a7_orlando_orders where customer_id = p_customer_id and order_number is not null
  ) then return null; end if;

  select o.customer_type, l.language, l.accommodation_type,
    l.operational_data->>'property' as property
  into v_latest
  from public.a7_orlando_orders o
  join public.a7_orlando_leads l on l.id = o.lead_id
  where o.customer_id = p_customer_id and o.order_number is not null
  order by
    (o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)) desc,
    o.accepted_at desc, o.id
  limit 1;

  select
    count(o.id) filter (where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id))::integer as order_count,
    coalesce(sum(coalesce(public.a7_orlando_order_confirmed_service_revenue(o.id), 0)), 0) as confirmed_service_revenue,
    min(o.accepted_at) filter (where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)) as first_order_at,
    max(o.accepted_at) filter (where o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)) as last_order_at
  into v_summary
  from public.a7_orlando_orders o
  where o.customer_id = p_customer_id and o.order_number is not null;

  select case
    when s.confidence = 'deterministic' and coalesce(s.first_touch->>'source', '') <> '' then
      case
        when coalesce(s.first_touch->>'medium', '') = ''
          or s.first_touch->>'medium' = s.first_touch->>'source'
          then s.first_touch->>'source'
        else (s.first_touch->>'source') || ' / ' || (s.first_touch->>'medium')
      end
    else null
  end
  into v_acquisition_source
  from public.a7_orlando_orders o
  left join public.a7_orlando_attribution_snapshots s on s.order_id = o.id
  where o.customer_id = p_customer_id and o.order_number is not null
    and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)
  order by o.accepted_at, o.id
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'order_number', o.order_number,
    'accepted_at', o.accepted_at,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'service_tier', o.service_tier,
    'property', l.operational_data->>'property',
    'accommodation_type', l.accommodation_type,
    'confirmed_service_revenue', public.a7_orlando_order_confirmed_service_revenue(o.id),
    'currency', 'USD',
    'is_qa', public.a7_orlando_order_is_qa(o.id)
  ) order by o.accepted_at desc, o.id), '[]'::jsonb)
  into v_orders
  from public.a7_orlando_orders o
  join public.a7_orlando_leads l on l.id = o.lead_id
  where o.customer_id = p_customer_id and o.order_number is not null;

  return jsonb_build_object(
    'customer_id', v_customer.id,
    'profile_name', v_customer.profile_name,
    'whatsapp_number', v_customer.wa_id,
    'email', v_customer.email,
    'language', coalesce(v_latest.language, 'unknown'),
    'customer_type', coalesce(v_latest.customer_type, 'unknown'),
    'latest_property', v_latest.property,
    'latest_accommodation_type', v_latest.accommodation_type,
    'order_count', coalesce(v_summary.order_count, 0),
    'confirmed_service_revenue', coalesce(v_summary.confirmed_service_revenue, 0),
    'currency', 'USD',
    'first_order_at', v_summary.first_order_at,
    'last_order_at', v_summary.last_order_at,
    'acquisition_source', v_acquisition_source,
    'orders', v_orders
  );
end;
$$;

revoke all on function public.a7_orlando_order_is_qa(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_order_confirmed_service_revenue(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_search_customers_lite(text,text,integer) from public, anon, authenticated;
revoke all on function public.a7_orlando_get_customer_lite(uuid) from public, anon, authenticated;
grant execute on function public.a7_orlando_order_is_qa(uuid) to service_role;
grant execute on function public.a7_orlando_order_confirmed_service_revenue(uuid) to service_role;
grant execute on function public.a7_orlando_search_customers_lite(text,text,integer) to service_role;
grant execute on function public.a7_orlando_get_customer_lite(uuid) to service_role;

comment on function public.a7_orlando_order_is_qa(uuid)
  is 'W1A.3 explicit QA exclusion: persisted flag or approved markers; no deletion.';
comment on function public.a7_orlando_order_confirmed_service_revenue(uuid)
  is 'W1A.3 confirmed net service revenue only; excludes tip, pending, cancelled and QA.';
comment on function public.a7_orlando_search_customers_lite(text,text,integer)
  is 'W1A.3 bounded private customer search; service-role only; no mutation.';
comment on function public.a7_orlando_get_customer_lite(uuid)
  is 'W1A.3 private customer summary and existing order history; service-role only; no mutation.';
