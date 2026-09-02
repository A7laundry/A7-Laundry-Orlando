-- A7 Orlando OS A7-038 — bounded operational cycle.
-- Adds driver responsibility and manual financial reconciliation without merging the four state axes.

create table if not exists public.a7_orlando_drivers (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null default 'orlando' check (unit_key = 'orlando'),
  full_name text not null check (length(btrim(full_name)) between 2 and 100),
  phone text not null unique check (phone ~ '^[0-9]{10,15}$'),
  active boolean not null default true,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_driver_events (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.a7_orlando_drivers(id) on delete restrict,
  action text not null check (action in ('driver_created', 'driver_updated', 'driver_activated', 'driver_deactivated')),
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  result_snapshot jsonb not null check (jsonb_typeof(result_snapshot) = 'object'),
  safe_change jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_driver_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  driver_id uuid not null references public.a7_orlando_drivers(id) on delete restrict,
  leg text not null check (leg in ('pickup', 'delivery')),
  assigned_by text not null,
  actor_role text not null check (actor_role in ('owner', 'manager')),
  idempotency_key text not null unique,
  assigned_at timestamptz not null,
  superseded_at timestamptz,
  check (superseded_at is null or superseded_at >= assigned_at)
);

create unique index if not exists a7_orlando_driver_assignments_active_idx
  on public.a7_orlando_driver_assignments(order_id, leg) where superseded_at is null;
create index if not exists a7_orlando_driver_assignments_driver_idx
  on public.a7_orlando_driver_assignments(driver_id, assigned_at desc);

create table if not exists public.a7_orlando_manual_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.a7_orlando_orders(id) on delete restrict,
  method text not null check (method in ('stripe', 'cash', 'zelle', 'other')),
  amount numeric not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  paid_at timestamptz not null,
  note text,
  recorded_by text not null,
  actor_role text not null check (actor_role in ('owner', 'manager')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.a7_orlando_drivers enable row level security;
alter table public.a7_orlando_driver_events enable row level security;
alter table public.a7_orlando_driver_assignments enable row level security;
alter table public.a7_orlando_manual_payments enable row level security;
revoke all on public.a7_orlando_drivers, public.a7_orlando_driver_events,
  public.a7_orlando_driver_assignments, public.a7_orlando_manual_payments
  from public, anon, authenticated;
grant all on public.a7_orlando_drivers, public.a7_orlando_driver_events,
  public.a7_orlando_driver_assignments, public.a7_orlando_manual_payments to service_role;

alter table public.a7_orlando_operational_events
  drop constraint if exists a7_orlando_operational_events_action_check;
alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_action_check check (action in (
    'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
    'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by',
    'assign_pickup_driver', 'assign_delivery_driver', 'manual_payment_recorded'
  )) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_action_check;

alter table public.a7_orlando_operational_events
  drop constraint if exists a7_orlando_operational_events_actor_role_check;
alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_actor_role_check
  check (actor_role in ('owner', 'manager', 'operator')) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_actor_role_check;

alter table public.a7_orlando_operator_audit
  drop constraint if exists a7_orlando_operator_audit_actor_role_check;
alter table public.a7_orlando_operator_audit
  add constraint a7_orlando_operator_audit_actor_role_check
  check (actor_role in ('owner', 'manager', 'operator')) not valid;
alter table public.a7_orlando_operator_audit
  validate constraint a7_orlando_operator_audit_actor_role_check;

create or replace function public.a7_orlando_list_drivers(p_include_inactive boolean default false)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'driver_id', d.id, 'full_name', d.full_name, 'phone', d.phone, 'active', d.active,
    'created_at', d.created_at, 'updated_at', d.updated_at
  ) order by d.active desc, d.full_name, d.id), '[]'::jsonb)
  from public.a7_orlando_drivers d
  where d.unit_key = 'orlando' and (coalesce(p_include_inactive, false) or d.active);
$$;

create or replace function public.a7_orlando_upsert_driver(
  p_driver_id uuid, p_full_name text, p_phone text, p_active boolean,
  p_actor_id text, p_actor_role text, p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_driver public.a7_orlando_drivers;
  v_existing public.a7_orlando_driver_events;
  v_previous_active boolean;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_action text;
  v_request_fingerprint text := encode(sha256(convert_to(
    coalesce(p_driver_id::text, 'new') || '|' || btrim(coalesce(p_full_name, '')) || '|' ||
    coalesce(p_phone, '') || '|' || coalesce(p_active, true)::text || '|' ||
    coalesce(p_actor_id, '') || '|' || coalesce(p_actor_role, ''), 'UTF8')), 'hex');
begin
  if p_actor_role <> 'owner' or nullif(btrim(coalesce(p_actor_id, '')), '') is null
    or nullif(btrim(coalesce(p_full_name, '')), '') is null
    or p_phone !~ '^[0-9]{10,15}$' or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
    raise exception 'Invalid driver contract';
  end if;
  select * into v_existing from public.a7_orlando_driver_events where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_request_fingerprint
      or v_existing.actor_id <> p_actor_id or v_existing.actor_role <> p_actor_role then
      raise exception 'Driver idempotency conflict';
    end if;
    return jsonb_build_object('duplicate', true, 'driver', v_existing.result_snapshot);
  end if;
  if exists (select 1 from public.a7_orlando_drivers where phone = p_phone and id is distinct from p_driver_id) then
    raise exception 'Driver phone is already registered';
  end if;
  if p_driver_id is null then
    insert into public.a7_orlando_drivers(full_name, phone, active, created_by, updated_by, created_at, updated_at)
    values (btrim(p_full_name), p_phone, coalesce(p_active, true), p_actor_id, p_actor_id, v_when, v_when)
    returning * into v_driver;
    v_action := 'driver_created';
  else
    select active into v_previous_active from public.a7_orlando_drivers where id = p_driver_id for update;
    if not found then raise exception 'Driver not found'; end if;
    update public.a7_orlando_drivers set full_name = btrim(p_full_name), phone = p_phone,
      active = coalesce(p_active, true), updated_by = p_actor_id, updated_at = v_when
    where id = p_driver_id returning * into v_driver;
    v_action := case when v_previous_active and not v_driver.active then 'driver_deactivated'
      when not v_previous_active and v_driver.active then 'driver_activated' else 'driver_updated' end;
  end if;
  insert into public.a7_orlando_driver_events(driver_id, action, actor_id, actor_role,
    idempotency_key, request_fingerprint, result_snapshot, safe_change, occurred_at)
  values (v_driver.id, v_action, p_actor_id, p_actor_role, p_idempotency_key, v_request_fingerprint,
    jsonb_build_object('driver_id', v_driver.id, 'full_name', v_driver.full_name,
      'phone', v_driver.phone, 'active', v_driver.active,
      'created_at', v_driver.created_at, 'updated_at', v_driver.updated_at),
    jsonb_build_object('full_name', v_driver.full_name, 'phone_last4', right(v_driver.phone, 4), 'active', v_driver.active), v_when);
  insert into public.a7_orlando_operator_audit(actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at)
  values (p_actor_id, p_actor_role, v_action, 'driver', v_driver.id, p_idempotency_key,
    jsonb_build_object('full_name', v_driver.full_name, 'phone_last4', right(v_driver.phone, 4), 'active', v_driver.active), v_when);
  return jsonb_build_object('duplicate', false, 'driver', jsonb_build_object(
    'driver_id', v_driver.id, 'full_name', v_driver.full_name, 'phone', v_driver.phone,
    'active', v_driver.active, 'created_at', v_driver.created_at, 'updated_at', v_driver.updated_at));
end;
$$;

create or replace function public.a7_orlando_assign_driver(
  p_order_number text, p_driver_id uuid, p_leg text,
  p_actor_id text, p_actor_role text, p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_driver public.a7_orlando_drivers;
  v_assignment public.a7_orlando_driver_assignments;
  v_existing public.a7_orlando_driver_assignments;
  v_when timestamptz := coalesce(p_occurred_at, now());
begin
  if p_actor_role not in ('owner', 'manager') or p_leg not in ('pickup', 'delivery')
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'Invalid driver assignment contract'; end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null or public.a7_orlando_order_is_qa(v_order.id) then raise exception 'Eligible order required'; end if;
  select * into v_existing from public.a7_orlando_driver_assignments where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.driver_id <> p_driver_id or v_existing.leg <> p_leg
      or v_existing.assigned_by <> p_actor_id or v_existing.actor_role <> p_actor_role then
      raise exception 'Driver assignment idempotency conflict';
    end if;
    select * into v_driver from public.a7_orlando_drivers where id = v_existing.driver_id;
    return jsonb_build_object('duplicate', true, 'assignment', jsonb_build_object(
      'assignment_id', v_existing.id, 'order_number', v_order.order_number, 'driver_id', v_driver.id,
      'driver_name', v_driver.full_name, 'leg', v_existing.leg, 'assigned_at', v_existing.assigned_at));
  end if;
  select * into v_driver from public.a7_orlando_drivers where id = p_driver_id;
  if v_driver.id is null or not v_driver.active then raise exception 'Active driver required'; end if;
  if p_leg = 'pickup' and v_order.order_status not in ('accepted', 'pickup_scheduled') then
    raise exception 'Pickup driver cannot be assigned from current state';
  end if;
  if p_leg = 'delivery' and v_order.production_state <> 'ready' then
    raise exception 'Delivery driver requires ready production';
  end if;
  update public.a7_orlando_driver_assignments set superseded_at = v_when
    where order_id = v_order.id and leg = p_leg and superseded_at is null;
  insert into public.a7_orlando_driver_assignments(order_id, driver_id, leg, assigned_by,
    actor_role, idempotency_key, assigned_at)
  values (v_order.id, v_driver.id, p_leg, p_actor_id, p_actor_role, p_idempotency_key, v_when)
  returning * into v_assignment;
  insert into public.a7_orlando_operational_events(order_id, action, actor_id, actor_role,
    idempotency_key, previous_state, new_state, occurred_at)
  values (v_order.id, 'assign_' || p_leg || '_driver', p_actor_id, p_actor_role,
    p_idempotency_key, '{}'::jsonb,
    jsonb_build_object('driver_id', v_driver.id, 'driver_name', v_driver.full_name, 'leg', p_leg), v_when);
  insert into public.a7_orlando_operator_audit(actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at)
  values (p_actor_id, p_actor_role, 'assign_' || p_leg || '_driver', 'order', v_order.id,
    p_idempotency_key, jsonb_build_object('order_number', v_order.order_number,
      'driver_id', v_driver.id, 'driver_name', v_driver.full_name, 'leg', p_leg), v_when);
  return jsonb_build_object('duplicate', false, 'assignment', jsonb_build_object(
    'assignment_id', v_assignment.id, 'order_number', v_order.order_number, 'driver_id', v_driver.id,
    'driver_name', v_driver.full_name, 'leg', v_assignment.leg, 'assigned_at', v_assignment.assigned_at));
end;
$$;

create or replace function public.a7_orlando_record_manual_payment(
  p_order_number text, p_method text, p_amount numeric, p_paid_at timestamptz, p_note text,
  p_actor_id text, p_actor_role text, p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_payment public.a7_orlando_manual_payments;
  v_existing public.a7_orlando_manual_payments;
  v_when timestamptz := coalesce(p_occurred_at, now());
begin
  if p_actor_role not in ('owner', 'manager') or p_method not in ('stripe', 'cash', 'zelle', 'other')
    or p_amount is null or p_amount <= 0 or p_paid_at is null
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'Invalid manual payment contract'; end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null or public.a7_orlando_order_is_qa(v_order.id) then raise exception 'Eligible order required'; end if;
  select * into v_existing from public.a7_orlando_manual_payments where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.method <> p_method
      or v_existing.amount <> p_amount or v_existing.paid_at <> p_paid_at then raise exception 'Manual payment idempotency conflict'; end if;
    return jsonb_build_object('duplicate', true, 'payment', jsonb_build_object(
      'payment_id', v_existing.id, 'order_number', v_order.order_number, 'method', v_existing.method,
      'amount', v_existing.amount, 'currency', v_existing.currency, 'paid_at', v_existing.paid_at));
  end if;
  if v_order.payment_status = 'paid' then raise exception 'Order is already paid'; end if;
  if v_order.invoice_id is null or v_order.service_amount is null
    or v_order.payment_status not in ('invoice_created', 'failed') then raise exception 'Current payable invoice required'; end if;
  if v_order.service_amount <> p_amount then raise exception 'Payment amount must match invoice service amount'; end if;
  if exists (select 1 from public.a7_orlando_payments where order_id = v_order.id) then
    raise exception 'Reconciled Stripe payment already exists';
  end if;
  if exists (select 1 from public.a7_orlando_manual_payments where order_id = v_order.id) then
    raise exception 'Manual payment already exists';
  end if;
  insert into public.a7_orlando_manual_payments(order_id, method, amount, paid_at, note,
    recorded_by, actor_role, idempotency_key, created_at)
  values (v_order.id, p_method, p_amount, p_paid_at, nullif(btrim(coalesce(p_note, '')), ''),
    p_actor_id, p_actor_role, p_idempotency_key, v_when) returning * into v_payment;
  update public.a7_orlando_orders set payment_status = 'paid',
    payment_id = 'manual_' || replace(v_payment.id::text, '-', ''), paid_at = p_paid_at,
    currency = 'USD', tip_amount = 0, updated_at = now(), version = version + 1
  where id = v_order.id;
  insert into public.a7_orlando_operational_events(order_id, action, actor_id, actor_role,
    idempotency_key, previous_state, new_state, occurred_at)
  values (v_order.id, 'manual_payment_recorded', p_actor_id, p_actor_role, p_idempotency_key,
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'paid', 'method', p_method, 'amount', p_amount, 'currency', 'USD'), p_paid_at);
  insert into public.a7_orlando_operator_audit(actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at)
  values (p_actor_id, p_actor_role, 'manual_payment_recorded', 'order', v_order.id,
    p_idempotency_key, jsonb_build_object('order_number', v_order.order_number,
      'method', p_method, 'amount', p_amount, 'currency', 'USD'), p_paid_at);
  return jsonb_build_object('duplicate', false, 'payment', jsonb_build_object(
    'payment_id', v_payment.id, 'order_number', v_order.order_number, 'method', v_payment.method,
    'amount', v_payment.amount, 'currency', v_payment.currency, 'paid_at', v_payment.paid_at));
end;
$$;

create or replace function public.a7_orlando_operational_cycle_transition(
  p_order_number text, p_action text, p_actor_id text, p_actor_role text,
  p_idempotency_key text, p_reason text, p_promised_by timestamptz, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order_id uuid;
begin
  select id into v_order_id from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number;
  if v_order_id is null then raise exception 'Order not found'; end if;
  if p_action = 'confirm_pickup' and not exists (
    select 1 from public.a7_orlando_driver_assignments
    where order_id = v_order_id and leg = 'pickup' and superseded_at is null
  ) then raise exception 'Pickup driver assignment required'; end if;
  if p_action = 'start_delivery' and not exists (
    select 1 from public.a7_orlando_driver_assignments
    where order_id = v_order_id and leg = 'delivery' and superseded_at is null
  ) then raise exception 'Delivery driver assignment required'; end if;
  return public.a7_orlando_w1b_transition(p_order_number, p_action, p_actor_id, p_actor_role,
    p_idempotency_key, p_reason, p_promised_by, p_occurred_at);
end;
$$;

create or replace function public.a7_orlando_create_manual_order_v3(
  p_submission_id uuid, p_request_fingerprint text, p_actor_id text, p_actor_role text,
  p_wa_id text, p_profile_name text, p_language text, p_customer_type text,
  p_accommodation_type text, p_service_area_bucket text, p_operational_data jsonb,
  p_lead_reference text, p_service_type text, p_service_tier text, p_pricing_model text,
  p_pickup_window_start timestamptz, p_pickup_window_end timestamptz, p_estimated_lbs numeric,
  p_bags_expected integer, p_promised_by timestamptz, p_items jsonb, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb; v_order_id uuid;
begin
  if p_service_tier = 'express' and (p_promised_by is null or p_promised_by <= p_pickup_window_start) then
    raise exception 'Express promised delivery is required after pickup';
  end if;
  if p_service_tier <> 'express' and p_promised_by is not null then
    raise exception 'Promised delivery is reserved for Express';
  end if;
  v_result := public.a7_orlando_create_manual_order_v2(
    p_submission_id, p_request_fingerprint, p_actor_id, p_actor_role,
    p_wa_id, p_profile_name, p_language, p_customer_type, p_accommodation_type,
    p_service_area_bucket, p_operational_data || jsonb_build_object('promised_by', p_promised_by),
    p_lead_reference, p_service_type, p_service_tier, p_pricing_model,
    p_pickup_window_start, p_pickup_window_end, p_estimated_lbs, p_bags_expected,
    p_items, p_occurred_at
  );
  v_order_id := (v_result->>'order_id')::uuid;
  if not coalesce((v_result->>'duplicate')::boolean, false) and p_service_tier = 'express' then
    update public.a7_orlando_orders set promised_by = p_promised_by, promise_version = 1,
      updated_at = now() where id = v_order_id;
    insert into public.a7_orlando_operational_events(order_id, action, actor_id, actor_role,
      idempotency_key, previous_state, new_state, occurred_at)
    values (v_order_id, 'set_promised_by', p_actor_id, p_actor_role,
      'express-promise:' || p_submission_id::text, jsonb_build_object('promised_by', null),
      jsonb_build_object('promised_by', p_promised_by), p_occurred_at);
  end if;
  return v_result;
end;
$$;

-- Customer suggestion is intentionally safe for the trained Operator: the
-- browser receives only an opaque customer_ref and the protected RPC reuses
-- the contact without exposing or rewriting its identity fields.
do $known_customer_operator$
declare v_definition text; v_changed text;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'a7_orlando_create_known_customer_order';
  if v_definition is null then raise exception 'Known-customer dependency is missing'; end if;
  v_changed := replace(v_definition,
    'p_actor_role not in (''owner'', ''manager'')',
    'p_actor_role not in (''owner'', ''manager'', ''operator'')');
  v_changed := replace(v_changed,
    'p_actor_role <> ''owner''',
    'p_actor_role not in (''owner'', ''manager'', ''operator'')');
  if v_changed = v_definition then raise exception 'Known-customer authorization clause was not found'; end if;
  execute v_changed;
end;
$known_customer_operator$;

create or replace function public.a7_orlando_create_known_customer_order_v2(
  p_submission_id uuid, p_request_fingerprint text, p_actor_id text, p_actor_role text,
  p_customer_id uuid, p_language text, p_customer_type text, p_accommodation_type text,
  p_service_area_bucket text, p_operational_data jsonb, p_lead_reference text,
  p_service_type text, p_service_tier text, p_pricing_model text,
  p_pickup_window_start timestamptz, p_pickup_window_end timestamptz, p_estimated_lbs numeric,
  p_bags_expected integer, p_promised_by timestamptz, p_items jsonb, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb; v_order_id uuid;
begin
  if p_service_tier = 'express' and (p_promised_by is null or p_promised_by <= p_pickup_window_start) then
    raise exception 'Express promised delivery is required after pickup';
  end if;
  if p_service_tier <> 'express' and p_promised_by is not null then
    raise exception 'Promised delivery is reserved for Express';
  end if;
  v_result := public.a7_orlando_create_known_customer_order(
    p_submission_id, p_request_fingerprint, p_actor_id, p_actor_role, p_customer_id,
    p_language, p_customer_type, p_accommodation_type, p_service_area_bucket,
    p_operational_data || jsonb_build_object('promised_by', p_promised_by), p_lead_reference,
    p_service_type, p_service_tier, p_pricing_model, p_pickup_window_start,
    p_pickup_window_end, p_estimated_lbs, p_bags_expected, p_items, p_occurred_at
  );
  v_order_id := (v_result->>'order_id')::uuid;
  if not coalesce((v_result->>'duplicate')::boolean, false) and p_service_tier = 'express' then
    update public.a7_orlando_orders set promised_by = p_promised_by, promise_version = 1,
      updated_at = now() where id = v_order_id;
    insert into public.a7_orlando_operational_events(order_id, action, actor_id, actor_role,
      idempotency_key, previous_state, new_state, occurred_at)
    values (v_order_id, 'set_promised_by', p_actor_id, p_actor_role,
      'express-promise:' || p_submission_id::text, jsonb_build_object('promised_by', null),
      jsonb_build_object('promised_by', p_promised_by), p_occurred_at);
  end if;
  return v_result;
end;
$$;

create or replace function public.a7_orlando_operational_cycle_enrich_order(p_order jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_order_id uuid; v_result jsonb := p_order;
begin
  select id into v_order_id from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order->>'order_number';
  if v_order_id is null then return p_order; end if;
  return v_result || jsonb_build_object(
    'invoice_id', (select invoice_id from public.a7_orlando_orders where id = v_order_id),
    'service_amount', (select service_amount from public.a7_orlando_orders where id = v_order_id),
    'tip_amount', (select tip_amount from public.a7_orlando_orders where id = v_order_id),
    'paid_at', (select paid_at from public.a7_orlando_orders where id = v_order_id),
    'pickup_driver', (select jsonb_build_object('driver_id', d.id, 'name', d.full_name, 'assigned_at', a.assigned_at)
      from public.a7_orlando_driver_assignments a join public.a7_orlando_drivers d on d.id = a.driver_id
      where a.order_id = v_order_id and a.leg = 'pickup' and a.superseded_at is null limit 1),
    'delivery_driver', (select jsonb_build_object('driver_id', d.id, 'name', d.full_name, 'assigned_at', a.assigned_at)
      from public.a7_orlando_driver_assignments a join public.a7_orlando_drivers d on d.id = a.driver_id
      where a.order_id = v_order_id and a.leg = 'delivery' and a.superseded_at is null limit 1),
    'manual_payment', (select jsonb_build_object('method', m.method, 'amount', m.amount,
      'currency', m.currency, 'paid_at', m.paid_at) from public.a7_orlando_manual_payments m
      where m.order_id = v_order_id limit 1)
  );
end;
$$;

create or replace function public.a7_orlando_operational_cycle_order(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.a7_orlando_operational_cycle_enrich_order(public.a7_orlando_w1c_a_order(p_order_number));
$$;

create or replace function public.a7_orlando_operational_cycle_snapshot()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_base jsonb; v_orders jsonb;
begin
  v_base := public.a7_orlando_w1c_a_snapshot();
  select coalesce(jsonb_agg(public.a7_orlando_operational_cycle_enrich_order(item)), '[]'::jsonb)
    into v_orders from jsonb_array_elements(coalesce(v_base->'orders', '[]'::jsonb)) item;
  return jsonb_set(v_base, '{orders}', v_orders, true);
end;
$$;

create or replace function public.a7_orlando_order_confirmed_service_revenue(p_order_id uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select case
    when public.a7_orlando_order_is_qa(o.id) or o.order_status = 'cancelled' then null
    when o.payment_status not in ('paid', 'partially_refunded', 'refunded') then null
    when o.service_amount is null then null
    when p.id is not null and p.status in ('paid', 'partially_refunded', 'refunded')
      then greatest(o.service_amount - coalesce(p.refund_total, 0), 0)
    when m.id is not null then o.service_amount
    else null end
  from public.a7_orlando_orders o
  left join public.a7_orlando_payments p on p.order_id = o.id
  left join public.a7_orlando_manual_payments m on m.order_id = o.id
  where o.id = p_order_id and o.unit_key = 'orlando';
$$;

create or replace function public.a7_orlando_owner_finance(
  p_start_date date, p_end_date date
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_timezone constant text := 'America/New_York';
  v_start timestamptz; v_end timestamptz; v_now timestamptz := now(); v_result jsonb;
begin
  if p_start_date is null or p_end_date is null or p_start_date > p_end_date
    or p_end_date - p_start_date > 365 then raise exception 'Invalid finance period'; end if;
  v_start := p_start_date::timestamp at time zone v_timezone;
  v_end := (p_end_date + 1)::timestamp at time zone v_timezone;
  with real_orders as (
    select o.*, l.operational_data, h.canonical_name as hotel_name,
      public.a7_orlando_order_confirmed_service_revenue(o.id) as confirmed_service_revenue
    from public.a7_orlando_orders o
    join public.a7_orlando_leads l on l.id = o.lead_id
    left join public.a7_orlando_hotels h on h.id = o.hotel_id
    where o.unit_key = 'orlando' and o.order_number is not null and o.order_status <> 'cancelled'
      and not public.a7_orlando_order_is_qa(o.id)
  ), paid as (
    select r.*, payment.amount as payment_amount, payment.refund_total,
      payment.paid_at as authoritative_paid_at,
      case when r.operational_data ? 'historical_tip_amount'
          and (r.operational_data->>'historical_tip_amount') ~ '^[0-9]+([.][0-9]{1,2})?$'
        then (r.operational_data->>'historical_tip_amount')::numeric
        when r.tip_amount is not null then r.tip_amount else null end as confirmed_tip,
      case when s.confidence = 'deterministic' and coalesce(s.first_touch->>'source', '') <> '' then
        case when coalesce(s.first_touch->>'medium', '') in ('', s.first_touch->>'source')
          then s.first_touch->>'source'
          else (s.first_touch->>'source') || ' / ' || (s.first_touch->>'medium') end
        else 'Unattributed' end as acquisition_source
    from real_orders r
    join lateral (
      select source.amount, source.refund_total, source.paid_at
      from (
        select p.amount, p.refund_total, p.paid_at, 1 as priority
        from public.a7_orlando_payments p
        where p.order_id = r.id and p.status in ('paid', 'partially_refunded', 'refunded')
          and p.paid_at >= v_start and p.paid_at < v_end
        union all
        select m.amount, 0::numeric as refund_total, m.paid_at, 2 as priority
        from public.a7_orlando_manual_payments m
        where m.order_id = r.id and m.paid_at >= v_start and m.paid_at < v_end
          and not exists (select 1 from public.a7_orlando_payments p where p.order_id = r.id
            and p.status in ('paid', 'partially_refunded', 'refunded'))
      ) source order by source.priority, source.paid_at desc limit 1
    ) payment on true
    left join public.a7_orlando_attribution_snapshots s on s.order_id = r.id
    where r.confirmed_service_revenue is not null
  ), pending as (
    select r.* from real_orders r where r.accepted_at >= v_start and r.accepted_at < v_end
      and r.payment_status not in ('paid', 'partially_refunded', 'refunded', 'void')
  ), summary as (
    select count(*)::integer as paid_order_count, count(distinct customer_id)::integer as customer_count,
      coalesce(sum(confirmed_service_revenue), 0) as confirmed_service_revenue,
      coalesce(sum(greatest(payment_amount - coalesce(refund_total, 0), 0)), 0) as gross_received,
      sum(confirmed_tip) as confirmed_tips,
      count(*) filter (where confirmed_tip is not null)::integer as tip_known_order_count,
      count(*) filter (where not coalesce(is_repeat_customer, false))::integer as new_customer_orders,
      count(*) filter (where coalesce(is_repeat_customer, false))::integer as repeat_customer_orders,
      count(*) filter (where service_tier = 'express')::integer as express_paid_orders,
      count(*) filter (where service_tier = 'normal')::integer as normal_paid_orders
    from paid
  ), pending_summary as (
    select count(*)::integer as pending_payment_count,
      count(service_amount)::integer as pending_value_known_count, sum(service_amount) as pending_payment_value from pending
  ), service_breakdown as (
    select coalesce(service_tier, 'unknown') as bucket, count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue from paid group by coalesce(service_tier, 'unknown')
  ), hotel_breakdown as (
    select coalesce(hotel_name, 'Unmapped / other') as bucket, count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue from paid group by coalesce(hotel_name, 'Unmapped / other')
  ), source_breakdown as (
    select acquisition_source as bucket, count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue from paid group by acquisition_source
  )
  select jsonb_build_object(
    'period', jsonb_build_object('start_date', p_start_date, 'end_date', p_end_date,
      'timezone', v_timezone, 'basis', 'authoritative_paid_at'),
    'summary', jsonb_build_object('currency', 'USD', 'paid_order_count', s.paid_order_count,
      'customer_count', s.customer_count, 'confirmed_service_revenue', s.confirmed_service_revenue,
      'gross_received', s.gross_received, 'confirmed_tips', s.confirmed_tips,
      'average_service_ticket', case when s.paid_order_count > 0 then s.confirmed_service_revenue / s.paid_order_count else null end,
      'new_customer_orders', s.new_customer_orders, 'repeat_customer_orders', s.repeat_customer_orders,
      'normal_paid_orders', s.normal_paid_orders, 'express_paid_orders', s.express_paid_orders,
      'pending_payment_count', ps.pending_payment_count, 'pending_payment_value', ps.pending_payment_value),
    'availability', jsonb_build_object('status', 'current', 'service_revenue', 'current',
      'gross_received', 'current', 'tips', case when s.paid_order_count = 0 then 'no_data'
        when s.tip_known_order_count = s.paid_order_count then 'current'
        when s.tip_known_order_count = 0 then 'unavailable' else 'partial' end,
      'pending_payment_value', case when ps.pending_payment_count = 0 then 'no_data'
        when ps.pending_value_known_count = ps.pending_payment_count then 'current'
        when ps.pending_value_known_count = 0 then 'unavailable' else 'partial' end,
      'processing_fees', 'unavailable', 'net_payout', 'unavailable'),
    'breakdowns', jsonb_build_object(
      'service', coalesce((select jsonb_agg(jsonb_build_object('bucket', bucket,
        'paid_order_count', paid_order_count, 'confirmed_service_revenue', confirmed_service_revenue)
        order by confirmed_service_revenue desc, bucket) from service_breakdown), '[]'::jsonb),
      'hotel', coalesce((select jsonb_agg(jsonb_build_object('bucket', bucket,
        'paid_order_count', paid_order_count, 'confirmed_service_revenue', confirmed_service_revenue)
        order by confirmed_service_revenue desc, bucket) from hotel_breakdown), '[]'::jsonb),
      'acquisition', coalesce((select jsonb_agg(jsonb_build_object('bucket', bucket,
        'paid_order_count', paid_order_count, 'confirmed_service_revenue', confirmed_service_revenue)
        order by confirmed_service_revenue desc, bucket) from source_breakdown), '[]'::jsonb)),
    'sources', jsonb_build_array('A7 Orlando orders', 'reconciled Stripe or governed manual payments/refunds',
      'protected explicit tip facts', 'frozen attribution snapshots'),
    'freshness', jsonb_build_object('generated_at', v_now)
  ) into v_result from summary s cross join pending_summary ps;
  return v_result;
end;
$$;

revoke all on function public.a7_orlando_list_drivers(boolean) from public, anon, authenticated;
revoke all on function public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_manual_payment(text,text,numeric,timestamptz,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_operational_cycle_transition(text,text,text,text,text,text,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_create_manual_order_v3(uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_create_known_customer_order_v2(uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_operational_cycle_order(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_operational_cycle_snapshot() from public, anon, authenticated;
revoke all on function public.a7_orlando_operational_cycle_enrich_order(jsonb) from public, anon, authenticated;
grant execute on function public.a7_orlando_list_drivers(boolean) to service_role;
grant execute on function public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_manual_payment(text,text,numeric,timestamptz,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_operational_cycle_transition(text,text,text,text,text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.a7_orlando_create_manual_order_v3(uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz) to service_role;
grant execute on function public.a7_orlando_create_known_customer_order_v2(uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz) to service_role;
grant execute on function public.a7_orlando_operational_cycle_order(text) to service_role;
grant execute on function public.a7_orlando_operational_cycle_snapshot() to service_role;
grant execute on function public.a7_orlando_operational_cycle_enrich_order(jsonb) to service_role;
