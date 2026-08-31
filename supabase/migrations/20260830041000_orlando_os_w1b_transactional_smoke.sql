-- A7 Orlando OS W1B — service-role-only transactional write probe.
-- The probe exercises the real W1B RPC and removes all synthetic rows before commit.

create or replace function public.a7_orlando_w1b_transactional_smoke(
  p_actor_id text,
  p_actor_role text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_contact_id uuid := gen_random_uuid();
  v_lead_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_order_number text := 'MCO 990000000000';
  v_transition_key text := 'w1b-smoke:' || p_request_id::text;
  v_first jsonb;
  v_retry jsonb;
  v_event_count integer;
  v_residue integer;
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner' or p_request_id is null then
    raise exception 'Invalid Owner smoke contract';
  end if;

  perform pg_advisory_xact_lock(hashtext('a7-orlando-w1b-transactional-smoke'));

  insert into public.a7_wa_contacts (id, unit_key, wa_id, profile_name)
  values (v_contact_id, 'orlando', 'system-smoke-' || p_request_id::text, 'System Smoke Fixture');

  insert into public.a7_orlando_leads (
    id, unit_key, idempotency_key, customer_id, attribution_resolution, status,
    lead_origin, service_type, customer_type, language, accommodation_type,
    service_area_accepted, timing_accepted, minimum_basis_accepted, operational_data
  ) values (
    v_lead_id, 'orlando', 'w1b-smoke:lead:' || p_request_id::text, v_contact_id,
    'unknown', 'order_accepted', 'manual', 'wash_fold_guest', 'guest', 'en', 'hotel',
    true, true, true, jsonb_build_object('property', 'System Smoke Fixture')
  );

  insert into public.a7_orlando_orders (
    id, unit_key, lead_id, customer_id, order_number, service_type, customer_type,
    service_tier, pricing_model, order_status, payment_status, accepted_at,
    pickup_window_start, pickup_window_end, attribution_confidence
  ) values (
    v_order_id, 'orlando', v_lead_id, v_contact_id, v_order_number,
    'wash_fold_guest', 'guest', 'normal', 'per_lb', 'accepted', 'pending', now(),
    now() + interval '1 hour', now() + interval '2 hours', 'unattributed'
  );

  v_first := public.a7_orlando_w1b_transition(
    v_order_number, 'schedule_pickup', p_actor_id, p_actor_role,
    v_transition_key, 'Transactional smoke probe', null, now()
  );
  v_retry := public.a7_orlando_w1b_transition(
    v_order_number, 'schedule_pickup', p_actor_id, p_actor_role,
    v_transition_key, 'Transactional smoke probe', null, now()
  );

  select count(*) into v_event_count
  from public.a7_orlando_operational_events
  where order_id = v_order_id and idempotency_key = v_transition_key;

  if coalesce((v_first->>'duplicate')::boolean, true)
    or not coalesce((v_retry->>'duplicate')::boolean, false)
    or v_first->'order'->>'order_status' <> 'pickup_scheduled'
    or v_first->'order'->>'custody_state' <> 'awaiting_pickup'
    or v_event_count <> 1 then
    raise exception 'W1B transactional smoke assertion failed';
  end if;

  delete from public.a7_orlando_operator_audit
  where entity_id = v_order_id and idempotency_key = v_transition_key;
  delete from public.a7_orlando_orders where id = v_order_id;
  delete from public.a7_orlando_leads where id = v_lead_id;
  delete from public.a7_wa_contacts where id = v_contact_id;

  select
    (select count(*) from public.a7_orlando_orders where id = v_order_id)
    + (select count(*) from public.a7_orlando_leads where id = v_lead_id)
    + (select count(*) from public.a7_wa_contacts where id = v_contact_id)
    + (select count(*) from public.a7_orlando_operational_events where order_id = v_order_id)
    + (select count(*) from public.a7_orlando_order_events where order_id = v_order_id)
    + (select count(*) from public.a7_orlando_operator_audit where entity_id = v_order_id)
  into v_residue;

  if v_residue <> 0 then raise exception 'W1B transactional smoke cleanup failed'; end if;

  return jsonb_build_object(
    'passed', true,
    'first_duplicate', false,
    'retry_duplicate', true,
    'event_count', v_event_count,
    'final_order_status', 'pickup_scheduled',
    'final_custody_state', 'awaiting_pickup',
    'residue_count', v_residue
  );
end;
$$;

revoke all on function public.a7_orlando_w1b_transactional_smoke(text,text,uuid)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1b_transactional_smoke(text,text,uuid)
  to service_role;

comment on function public.a7_orlando_w1b_transactional_smoke(text,text,uuid)
  is 'Owner-bound W1B write/idempotency probe; synthetic rows are deleted in the same transaction.';
