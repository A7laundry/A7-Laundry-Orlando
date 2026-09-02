-- A7-038 Round 3 — explicit Owner recovery for accepted pre-W1B orders.
-- No historical stage is inferred: the order starts governed tracking at the
-- original accepted boundary and every later transition remains explicit.

alter table public.a7_orlando_operational_events
  drop constraint if exists a7_orlando_operational_events_action_check;
alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_action_check check (action in (
    'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
    'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by',
    'assign_pickup_driver', 'assign_delivery_driver', 'manual_payment_recorded',
    'initialize_legacy_order'
  )) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_action_check;

create or replace function public.a7_orlando_initialize_legacy_order(
  p_order_number text,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_existing public.a7_orlando_operational_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_previous jsonb;
  v_new jsonb;
begin
  if p_actor_role <> 'owner'
    or nullif(btrim(coalesce(p_actor_id, '')), '') is null
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null
    or v_reason is null or length(v_reason) > 240 then
    raise exception 'Invalid legacy initialization contract';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;

  select * into v_existing from public.a7_orlando_operational_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id
      or v_existing.action <> 'initialize_legacy_order'
      or v_existing.actor_id <> p_actor_id
      or v_existing.actor_role <> p_actor_role
      or v_existing.reason is distinct from v_reason then
      raise exception 'Idempotency key conflicts with another legacy initialization';
    end if;
    return jsonb_build_object(
      'duplicate', true,
      'order', public.a7_orlando_w1c_a_order_payload(v_order.id)
    );
  end if;

  if v_order.order_status <> 'accepted'
    or v_order.custody_state is not null
    or v_order.production_state is not null then
    raise exception 'Only an accepted uninitialized legacy order can be initialized';
  end if;

  v_previous := jsonb_build_object(
    'order_status', v_order.order_status,
    'custody_state', v_order.custody_state,
    'production_state', v_order.production_state,
    'promised_by', v_order.promised_by
  );

  update public.a7_orlando_orders set
    custody_state = 'with_customer',
    production_state = 'awaiting_intake',
    operational_waiting_since = v_when,
    updated_at = now(),
    version = version + 1
  where id = v_order.id
  returning * into v_order;

  v_new := jsonb_build_object(
    'order_status', v_order.order_status,
    'custody_state', v_order.custody_state,
    'production_state', v_order.production_state,
    'promised_by', v_order.promised_by
  );

  insert into public.a7_orlando_operational_events(
    order_id, action, actor_id, actor_role, idempotency_key,
    previous_state, new_state, reason, occurred_at
  ) values (
    v_order.id, 'initialize_legacy_order', p_actor_id, p_actor_role, p_idempotency_key,
    v_previous, v_new, v_reason, v_when
  );

  insert into public.a7_orlando_operator_audit(
    actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, p_actor_role, 'initialize_legacy_order', 'order', v_order.id,
    p_idempotency_key,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'previous', v_previous,
      'new', v_new,
      'reason_present', true
    ),
    v_when
  );

  return jsonb_build_object(
    'duplicate', false,
    'order', public.a7_orlando_w1c_a_order_payload(v_order.id)
  );
end;
$$;

revoke all on function public.a7_orlando_initialize_legacy_order(text,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_initialize_legacy_order(text,text,text,text,text,timestamptz)
  to service_role;

comment on function public.a7_orlando_initialize_legacy_order(text,text,text,text,text,timestamptz) is
  'Owner-only, reason-required and idempotent start of governed tracking for accepted pre-W1B orders; no past stage is inferred.';
