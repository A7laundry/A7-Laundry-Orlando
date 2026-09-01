-- W1C-A Production repair.
-- Migration 20260830050000 was recorded before the release probe and the final
-- idempotency ordering were added to its local source. Do not rewrite the
-- applied migration: repair the remote schema additively.

create or replace function public.a7_orlando_w1c_a_record_item_weight(
  p_order_number text,
  p_order_item_id uuid,
  p_actual_lbs numeric,
  p_expected_weight_version integer,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_item public.a7_orlando_order_items;
  v_existing public.a7_orlando_item_weight_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_subtotal numeric;
  v_total_lbs numeric;
  v_pending integer;
  v_lifecycle jsonb;
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner'
    or coalesce(p_idempotency_key, '') = '' or p_expected_weight_version is null
    or p_expected_weight_version < 0 or p_actual_lbs is null or p_actual_lbs <= 0 then
    raise exception 'Invalid item weight contract';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;

  select * into v_item from public.a7_orlando_order_items
    where id = p_order_item_id and order_id = v_order.id for update;
  if v_item.id is null then raise exception 'Order item not found'; end if;
  if v_item.unit <> 'lb' then raise exception 'Only per-pound items can be weighed'; end if;

  select * into v_existing from public.a7_orlando_item_weight_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.order_item_id <> v_item.id
      or v_existing.actual_lbs <> p_actual_lbs
      or v_existing.requested_version <> p_expected_weight_version
      or coalesce(v_existing.reason, '') <> coalesce(nullif(btrim(p_reason), ''), '') then
      raise exception 'Idempotency key conflicts with another item weight';
    end if;
    return jsonb_build_object('duplicate', true,
      'complete', v_order.order_status = 'weighed',
      'order', public.a7_orlando_w1c_a_order_payload(v_order.id));
  end if;

  -- Resolve exact retries before evaluating mutable workflow state.
  if v_order.custody_state <> 'at_laundry' or v_order.production_state not in ('awaiting_weight', 'awaiting_processing')
    or v_order.order_status not in ('picked_up', 'weighed') then
    raise exception 'Weight is unavailable from the current state';
  end if;

  if v_item.weight_version <> p_expected_weight_version then
    raise exception 'Item weight version conflict';
  end if;
  if v_item.actual_lbs is not null and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'A reason is required to correct item weight';
  end if;
  if v_order.order_status = 'weighed' and v_order.production_state <> 'awaiting_processing' then
    raise exception 'Weight correction is unavailable after processing starts';
  end if;

  v_subtotal := case
    when v_item.unit_price is not null and not v_item.requires_manual_review
      then round(p_actual_lbs * v_item.unit_price, 2)
    else null
  end;

  update public.a7_orlando_order_items set
    actual_lbs = p_actual_lbs,
    weighed_at = v_when,
    subtotal = v_subtotal,
    weight_version = weight_version + 1
  where id = v_item.id;

  insert into public.a7_orlando_item_weight_events (
    order_id, order_item_id, actor_id, actor_role, idempotency_key, requested_version,
    previous_actual_lbs, actual_lbs, previous_subtotal, subtotal, reason, occurred_at
  ) values (
    v_order.id, v_item.id, p_actor_id, p_actor_role, p_idempotency_key, p_expected_weight_version,
    v_item.actual_lbs, p_actual_lbs, v_item.subtotal, v_subtotal,
    nullif(btrim(coalesce(p_reason, '')), ''), v_when
  );

  select count(*) filter (where unit = 'lb' and actual_lbs is null),
    coalesce(sum(actual_lbs) filter (where unit = 'lb'), 0)
  into v_pending, v_total_lbs
  from public.a7_orlando_order_items where order_id = v_order.id;

  if v_pending = 0 then
    if v_order.order_status = 'picked_up' then
      v_lifecycle := public.a7_orlando_record_transition(
        v_order.id,
        'order_weighed',
        'order_weighed:' || md5(p_idempotency_key),
        p_idempotency_key || ':lifecycle',
        'operations',
        jsonb_build_object('actual_lbs', v_total_lbs),
        v_when
      );
    else
      update public.a7_orlando_orders set actual_lbs = v_total_lbs, weighed_at = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    end if;
    update public.a7_orlando_orders set production_state = 'awaiting_processing',
      operational_waiting_since = v_when, updated_at = now(), version = version + 1
      where id = v_order.id;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'complete', v_pending = 0,
    'pending_items', v_pending,
    'order', public.a7_orlando_w1c_a_order_payload(v_order.id)
  );
end;
$$;

create or replace function public.a7_orlando_w1c_a_transactional_smoke(
  p_actor_id text,
  p_actor_role text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact_id uuid := gen_random_uuid();
  v_lead_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_item_id uuid := gen_random_uuid();
  v_order_number text := 'MCO 990000000001';
  v_weight_key text := 'w1c-a-smoke:' || p_request_id::text;
  v_first jsonb;
  v_retry jsonb;
  v_weight_event_count integer;
  v_lifecycle_event_count integer;
  v_order_status text;
  v_production_state text;
  v_actual_lbs numeric;
  v_residue integer;
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner' or p_request_id is null then
    raise exception 'Invalid Owner smoke contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('a7-orlando-w1c-a-transactional-smoke'));

  insert into public.a7_wa_contacts (id, unit_key, wa_id, profile_name)
  values (v_contact_id, 'orlando', 'system-weight-smoke-' || p_request_id::text, 'System Weight Smoke Fixture');

  insert into public.a7_orlando_leads (
    id, unit_key, idempotency_key, customer_id, attribution_resolution, status,
    lead_origin, service_type, customer_type, language, accommodation_type,
    service_area_accepted, timing_accepted, minimum_basis_accepted, operational_data
  ) values (
    v_lead_id, 'orlando', 'w1c-a-smoke:lead:' || p_request_id::text, v_contact_id,
    'unknown', 'order_accepted', 'manual', 'wash_fold_guest', 'guest', 'en', 'hotel',
    true, true, true, jsonb_build_object('property', 'System Weight Smoke Fixture')
  );

  insert into public.a7_orlando_orders (
    id, unit_key, lead_id, customer_id, order_number, service_type, customer_type,
    service_tier, pricing_model, order_status, payment_status, accepted_at,
    pickup_window_start, pickup_window_end, attribution_confidence,
    custody_state, production_state, operational_waiting_since
  ) values (
    v_order_id, 'orlando', v_lead_id, v_contact_id, v_order_number,
    'wash_fold_guest', 'guest', 'normal', 'per_lb', 'picked_up', 'pending', now(),
    now() - interval '2 hours', now() - interval '1 hour', 'unattributed',
    'at_laundry', 'awaiting_weight', now()
  );

  insert into public.a7_orlando_order_items (
    id, order_id, catalog_code, catalog_version, service_type, label, unit,
    estimated_lbs, unit_price, minimum_amount, currency, requires_manual_review
  ) values (
    v_item_id, v_order_id, 'wash_fold_guest', 1, 'wash_fold_guest',
    'System Weight Smoke Item', 'lb', 5, 3.25, 50, 'USD', false
  );

  v_first := public.a7_orlando_w1c_a_record_item_weight(
    v_order_number, v_item_id, 5, 0, p_actor_id, p_actor_role,
    v_weight_key, 'Transactional smoke probe', now()
  );
  v_retry := public.a7_orlando_w1c_a_record_item_weight(
    v_order_number, v_item_id, 5, 0, p_actor_id, p_actor_role,
    v_weight_key, 'Transactional smoke probe', now()
  );

  select count(*) into v_weight_event_count
  from public.a7_orlando_item_weight_events
  where order_id = v_order_id and idempotency_key = v_weight_key;
  select count(*) into v_lifecycle_event_count
  from public.a7_orlando_order_events
  where order_id = v_order_id and event_name = 'order_weighed';
  select order_status, production_state, actual_lbs
    into v_order_status, v_production_state, v_actual_lbs
  from public.a7_orlando_orders where id = v_order_id;

  if coalesce((v_first->>'duplicate')::boolean, true)
    or not coalesce((v_retry->>'duplicate')::boolean, false)
    or v_weight_event_count <> 1
    or v_lifecycle_event_count <> 1
    or v_order_status <> 'weighed'
    or v_production_state <> 'awaiting_processing'
    or v_actual_lbs <> 5 then
    raise exception 'W1C-A transactional smoke assertion failed';
  end if;

  delete from public.a7_orlando_operator_audit where entity_id = v_order_id;
  delete from public.a7_orlando_orders where id = v_order_id;
  delete from public.a7_orlando_leads where id = v_lead_id;
  delete from public.a7_wa_contacts where id = v_contact_id;

  select
    (select count(*) from public.a7_orlando_orders where id = v_order_id)
    + (select count(*) from public.a7_orlando_order_items where id = v_item_id)
    + (select count(*) from public.a7_orlando_item_weight_events where order_id = v_order_id)
    + (select count(*) from public.a7_orlando_order_events where order_id = v_order_id)
    + (select count(*) from public.a7_orlando_operational_events where order_id = v_order_id)
    + (select count(*) from public.a7_orlando_operator_audit where entity_id = v_order_id)
    + (select count(*) from public.a7_orlando_leads where id = v_lead_id)
    + (select count(*) from public.a7_wa_contacts where id = v_contact_id)
  into v_residue;

  if v_residue <> 0 then raise exception 'W1C-A transactional smoke cleanup failed'; end if;

  return jsonb_build_object(
    'passed', true,
    'first_duplicate', false,
    'retry_duplicate', true,
    'weight_event_count', v_weight_event_count,
    'lifecycle_event_count', v_lifecycle_event_count,
    'final_order_status', v_order_status,
    'final_production_state', v_production_state,
    'actual_lbs', v_actual_lbs,
    'residue_count', v_residue
  );
end;
$$;

revoke all on function public.a7_orlando_w1c_a_record_item_weight(text,uuid,numeric,integer,text,text,text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_a_transactional_smoke(text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1c_a_record_item_weight(text,uuid,numeric,integer,text,text,text,text,timestamptz)
  to service_role;
grant execute on function public.a7_orlando_w1c_a_transactional_smoke(text,text,uuid)
  to service_role;

comment on function public.a7_orlando_w1c_a_transactional_smoke(text,text,uuid)
  is 'Owner-bound W1C-A weight/idempotency probe; synthetic rows are deleted in the same transaction.';

notify pgrst, 'reload schema';
