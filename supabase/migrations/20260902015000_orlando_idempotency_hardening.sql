-- A7-038 independent-review repair.
-- Hardens driver writes already introduced by 20260901040000 without replacing
-- the four-axis operational model or rewriting historical evidence.

alter table public.a7_orlando_driver_events
  add column if not exists request_fingerprint text,
  add column if not exists result_snapshot jsonb;

alter table public.a7_orlando_driver_events
  drop constraint if exists a7_orlando_driver_events_request_fingerprint_check;
alter table public.a7_orlando_driver_events
  add constraint a7_orlando_driver_events_request_fingerprint_check
  check (request_fingerprint is null or request_fingerprint ~ '^[0-9a-f]{64}$') not valid;
alter table public.a7_orlando_driver_events
  validate constraint a7_orlando_driver_events_request_fingerprint_check;

alter table public.a7_orlando_driver_events
  drop constraint if exists a7_orlando_driver_events_result_snapshot_check;
alter table public.a7_orlando_driver_events
  add constraint a7_orlando_driver_events_result_snapshot_check
  check (result_snapshot is null or jsonb_typeof(result_snapshot) = 'object') not valid;
alter table public.a7_orlando_driver_events
  validate constraint a7_orlando_driver_events_result_snapshot_check;

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

  select * into v_existing from public.a7_orlando_driver_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint is distinct from v_request_fingerprint
      or v_existing.actor_id <> p_actor_id or v_existing.actor_role <> p_actor_role then
      raise exception 'Driver idempotency conflict';
    end if;
    if v_existing.result_snapshot is null then
      raise exception 'Legacy driver retry cannot be verified';
    end if;
    return jsonb_build_object('duplicate', true, 'driver', v_existing.result_snapshot);
  end if;

  if exists (select 1 from public.a7_orlando_drivers
      where phone = p_phone and id is distinct from p_driver_id) then
    raise exception 'Driver phone is already registered';
  end if;
  if p_driver_id is null then
    insert into public.a7_orlando_drivers(
      full_name, phone, active, created_by, updated_by, created_at, updated_at
    ) values (
      btrim(p_full_name), p_phone, coalesce(p_active, true), p_actor_id, p_actor_id, v_when, v_when
    ) returning * into v_driver;
    v_action := 'driver_created';
  else
    select active into v_previous_active from public.a7_orlando_drivers
      where id = p_driver_id for update;
    if not found then raise exception 'Driver not found'; end if;
    update public.a7_orlando_drivers set
      full_name = btrim(p_full_name), phone = p_phone, active = coalesce(p_active, true),
      updated_by = p_actor_id, updated_at = v_when
    where id = p_driver_id returning * into v_driver;
    v_action := case
      when v_previous_active and not v_driver.active then 'driver_deactivated'
      when not v_previous_active and v_driver.active then 'driver_activated'
      else 'driver_updated'
    end;
  end if;

  insert into public.a7_orlando_driver_events(
    driver_id, action, actor_id, actor_role, idempotency_key,
    request_fingerprint, result_snapshot, safe_change, occurred_at
  ) values (
    v_driver.id, v_action, p_actor_id, p_actor_role, p_idempotency_key,
    v_request_fingerprint,
    jsonb_build_object('driver_id', v_driver.id, 'full_name', v_driver.full_name,
      'phone', v_driver.phone, 'active', v_driver.active,
      'created_at', v_driver.created_at, 'updated_at', v_driver.updated_at),
    jsonb_build_object('full_name', v_driver.full_name,
      'phone_last4', right(v_driver.phone, 4), 'active', v_driver.active), v_when
  );
  insert into public.a7_orlando_operator_audit(
    actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, p_actor_role, v_action, 'driver', v_driver.id, p_idempotency_key,
    jsonb_build_object('full_name', v_driver.full_name,
      'phone_last4', right(v_driver.phone, 4), 'active', v_driver.active), v_when
  );
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
    or nullif(btrim(coalesce(p_actor_id, '')), '') is null
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
    raise exception 'Invalid driver assignment contract';
  end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null or public.a7_orlando_order_is_qa(v_order.id) then
    raise exception 'Eligible order required';
  end if;

  -- Resolve an exact retry before inspecting mutable driver activity or order state.
  select * into v_existing from public.a7_orlando_driver_assignments
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.driver_id <> p_driver_id
      or v_existing.leg <> p_leg or v_existing.assigned_by <> p_actor_id
      or v_existing.actor_role <> p_actor_role then
      raise exception 'Driver assignment idempotency conflict';
    end if;
    select * into v_driver from public.a7_orlando_drivers where id = v_existing.driver_id;
    if v_driver.id is null then raise exception 'Driver assignment evidence is inconsistent'; end if;
    return jsonb_build_object('duplicate', true, 'assignment', jsonb_build_object(
      'assignment_id', v_existing.id, 'order_number', v_order.order_number,
      'driver_id', v_driver.id, 'driver_name', v_driver.full_name,
      'leg', v_existing.leg, 'assigned_at', v_existing.assigned_at));
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
  insert into public.a7_orlando_driver_assignments(
    order_id, driver_id, leg, assigned_by, actor_role, idempotency_key, assigned_at
  ) values (
    v_order.id, v_driver.id, p_leg, p_actor_id, p_actor_role, p_idempotency_key, v_when
  ) returning * into v_assignment;
  insert into public.a7_orlando_operational_events(
    order_id, action, actor_id, actor_role, idempotency_key,
    previous_state, new_state, occurred_at
  ) values (
    v_order.id, 'assign_' || p_leg || '_driver', p_actor_id, p_actor_role,
    p_idempotency_key, '{}'::jsonb,
    jsonb_build_object('driver_id', v_driver.id,
      'driver_name', v_driver.full_name, 'leg', p_leg), v_when
  );
  insert into public.a7_orlando_operator_audit(
    actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, p_actor_role, 'assign_' || p_leg || '_driver', 'order', v_order.id,
    p_idempotency_key, jsonb_build_object('order_number', v_order.order_number,
      'driver_id', v_driver.id, 'driver_name', v_driver.full_name, 'leg', p_leg), v_when
  );
  return jsonb_build_object('duplicate', false, 'assignment', jsonb_build_object(
    'assignment_id', v_assignment.id, 'order_number', v_order.order_number,
    'driver_id', v_driver.id, 'driver_name', v_driver.full_name,
    'leg', v_assignment.leg, 'assigned_at', v_assignment.assigned_at));
end;
$$;

revoke all on function public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz)
  to service_role;
grant execute on function public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz)
  to service_role;

comment on function public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz) is
  'A7-038 Owner driver authority with fail-closed request-fingerprint idempotency.';
comment on function public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz) is
  'A7-038 management assignment authority; exact retries survive later driver deactivation.';
