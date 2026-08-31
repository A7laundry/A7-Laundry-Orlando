-- A7 Orlando OS W1A — additive manual-sale aggregate and atomic creation RPC.

create sequence if not exists public.a7_orlando_order_number_seq start with 1000 increment by 1;

create table if not exists public.a7_orlando_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete cascade,
  catalog_code text not null,
  catalog_version integer not null check (catalog_version > 0),
  service_type text not null,
  label text not null,
  quantity numeric check (quantity is null or quantity > 0),
  unit text not null check (unit in ('lb', 'unit', 'piece')),
  estimated_lbs numeric check (estimated_lbs is null or estimated_lbs > 0),
  unit_price numeric check (unit_price is null or unit_price >= 0),
  minimum_amount numeric not null default 0 check (minimum_amount >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  requires_manual_review boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (order_id, catalog_code)
);

create table if not exists public.a7_orlando_manual_order_requests (
  submission_id uuid primary key,
  request_fingerprint text not null,
  customer_id uuid not null references public.a7_wa_contacts(id) on delete restrict,
  lead_id uuid not null unique references public.a7_orlando_leads(id) on delete restrict,
  order_id uuid not null unique references public.a7_orlando_orders(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_operator_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_role text not null check (actor_role in ('owner', 'operator')),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  idempotency_key text not null,
  safe_change jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  unique (action, idempotency_key)
);

alter table public.a7_orlando_order_items enable row level security;
alter table public.a7_orlando_manual_order_requests enable row level security;
alter table public.a7_orlando_operator_audit enable row level security;
revoke all on public.a7_orlando_order_items, public.a7_orlando_manual_order_requests,
  public.a7_orlando_operator_audit from anon, authenticated;
grant all on public.a7_orlando_order_items, public.a7_orlando_manual_order_requests,
  public.a7_orlando_operator_audit to service_role;
grant usage, select on sequence public.a7_orlando_order_number_seq to service_role;

create or replace function public.a7_orlando_create_manual_order(
  p_submission_id uuid,
  p_request_fingerprint text,
  p_actor_id text,
  p_actor_role text,
  p_wa_id text,
  p_profile_name text,
  p_language text,
  p_customer_type text,
  p_accommodation_type text,
  p_service_area_bucket text,
  p_operational_data jsonb,
  p_lead_reference text,
  p_service_type text,
  p_service_tier text,
  p_pricing_model text,
  p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz,
  p_estimated_lbs numeric,
  p_items jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing public.a7_orlando_manual_order_requests;
  v_customer jsonb;
  v_lead_result jsonb;
  v_order_result jsonb;
  v_customer_id uuid;
  v_lead_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_attribution_id text;
  v_resolution text := 'unknown';
  v_ref text := nullif(upper(coalesce(p_lead_reference, '')), '');
  v_prefix text := p_submission_id::text;
begin
  if coalesce(p_request_fingerprint, '') = '' or coalesce(p_actor_id, '') = ''
    or p_actor_role not in ('owner', 'operator') then raise exception 'Invalid operator contract'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'At least one order item is required';
  end if;

  select * into v_existing from public.a7_orlando_manual_order_requests
    where submission_id = p_submission_id;
  if v_existing.submission_id is not null then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'Idempotency key conflicts with another manual order';
    end if;
    select order_number into v_order_number from public.a7_orlando_orders where id = v_existing.order_id;
    return jsonb_build_object('duplicate', true, 'customer_id', v_existing.customer_id,
      'lead_id', v_existing.lead_id, 'order_id', v_existing.order_id,
      'order_number', v_order_number);
  end if;

  v_customer := public.a7_orlando_upsert_customer(p_wa_id, p_profile_name);
  v_customer_id := (v_customer->>'id')::uuid;
  if v_ref is not null then
    select attribution_id into v_attribution_id from public.a7_attribution_sessions
      where short_ref = v_ref and expires_at > now();
    if v_attribution_id is not null then v_resolution := 'short_ref'; end if;
  end if;

  v_lead_result := public.a7_orlando_create_lead(
    'manual:' || v_prefix, 'generate_lead:' || v_prefix, 'manual', null, v_customer_id,
    v_attribution_id, v_ref, v_resolution, p_service_type, p_customer_type, p_language,
    p_accommodation_type, p_service_area_bucket, coalesce(p_operational_data, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  );
  v_lead_id := (v_lead_result->'lead'->>'id')::uuid;

  perform public.a7_orlando_qualify_lead(
    v_lead_id, 'qualified_guest_lead:' || v_prefix, 'manual:qualify:' || v_prefix,
    p_service_type, true, true, true, coalesce(p_occurred_at, now())
  );
  v_order_result := public.a7_orlando_accept_order(
    v_lead_id, 'order_accepted:' || v_prefix, 'manual:accept:' || v_prefix,
    p_service_type, p_service_tier, p_pricing_model, p_pickup_window_start,
    p_pickup_window_end, p_estimated_lbs, null, null, coalesce(p_occurred_at, now())
  );
  v_order_id := (v_order_result->'order'->>'id')::uuid;
  v_order_number := 'A7-ORL-' || lpad(nextval('public.a7_orlando_order_number_seq')::text, 4, '0');
  update public.a7_orlando_orders set order_number = v_order_number, updated_at = now()
    where id = v_order_id and order_number is null;
  select order_number into v_order_number from public.a7_orlando_orders where id = v_order_id;

  insert into public.a7_orlando_order_items (
    order_id, catalog_code, catalog_version, service_type, label, quantity, unit,
    estimated_lbs, unit_price, minimum_amount, currency, requires_manual_review, notes
  ) select v_order_id, item->>'catalog_code', (item->>'catalog_version')::integer,
    item->>'service_type', item->>'label', nullif(item->>'quantity', '')::numeric,
    item->>'unit', nullif(item->>'estimated_lbs', '')::numeric,
    nullif(item->>'unit_price', '')::numeric, coalesce((item->>'minimum_amount')::numeric, 0),
    'USD', coalesce((item->>'requires_manual_review')::boolean, false), item->>'notes'
  from jsonb_array_elements(p_items) item;

  insert into public.a7_orlando_manual_order_requests (
    submission_id, request_fingerprint, customer_id, lead_id, order_id
  ) values (p_submission_id, p_request_fingerprint, v_customer_id, v_lead_id, v_order_id);
  insert into public.a7_orlando_operator_audit (
    actor_id, actor_role, action, entity_type, entity_id, idempotency_key, safe_change
  ) values (p_actor_id, p_actor_role, 'manual_order_created', 'order', v_order_id,
    'manual:' || v_prefix, jsonb_build_object('order_number', v_order_number,
      'item_count', jsonb_array_length(p_items), 'order_status', 'accepted'));

  return jsonb_build_object('duplicate', false, 'customer_id', v_customer_id,
    'lead_id', v_lead_id, 'order_id', v_order_id, 'order_number', v_order_number);
end;
$$;

revoke all on function public.a7_orlando_create_manual_order(uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_create_manual_order(uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,jsonb,timestamptz)
  to service_role;
