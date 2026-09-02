-- W3-D local-only multi-session proof. Run only in a disposable PostgreSQL database
-- after the production schema dump and W3-D migrations have been replayed.

do $guard$
begin
  if current_database() !~ '^a7_w3d_' then
    raise exception 'W3-D concurrency probe requires a disposable a7_w3d_* database';
  end if;
end;
$guard$;

create table public.a7_w3d_concurrency_probe_state (
  route_id uuid not null,
  stop_id uuid not null,
  order_id uuid not null
);

do $fixture$
declare
  v_driver uuid := '20000000-0000-4000-8000-000000000001';
  v_contact uuid := '20000000-0000-4000-8000-000000000002';
  v_lead uuid := '20000000-0000-4000-8000-000000000003';
  v_order uuid := '20000000-0000-4000-8000-000000000004';
  v_result jsonb;
  v_route_id uuid;
  v_stop_id uuid;
  v_version integer;
begin
  insert into public.a7_wa_contacts(id, unit_key, wa_id, profile_name)
  values(v_contact, 'orlando', '15550000011', 'Route Concurrency Fixture');
  insert into public.a7_orlando_leads(
    id, idempotency_key, customer_id, status, lead_origin, service_type,
    customer_type, language, operational_data
  ) values (
    v_lead, 'route-concurrency-fixture', v_contact, 'order_accepted', 'manual',
    'guest_laundry', 'guest', 'en', '{}'::jsonb
  );
  insert into public.a7_orlando_orders(
    id, lead_id, customer_id, order_number, service_type, customer_type,
    service_tier, pricing_model, order_status, payment_status, accepted_at,
    pickup_window_start, pickup_window_end, custody_state, production_state, is_qa
  ) values (
    v_order, v_lead, v_contact, 'MCO-99101', 'guest_laundry', 'guest', 'normal',
    'per_lb', 'pickup_scheduled', 'pending', now(), now(), now() + interval '1 hour',
    'awaiting_pickup', 'awaiting_intake', false
  );
  insert into public.a7_orlando_drivers(id, full_name, phone, active, created_by, updated_by)
  values(v_driver, 'Route Concurrency Driver', '15550000012', true, 'owner', 'owner');

  v_result := public.a7_orlando_route_command(
    'create', null, jsonb_build_object('route_date', current_date, 'driver_id', v_driver),
    'owner-concurrency', 'owner', 'route-concurrency:create', now()
  );
  v_route_id := (v_result->'route'->>'route_id')::uuid;
  v_result := public.a7_orlando_route_command(
    'add_stop', v_route_id, jsonb_build_object('order_number', 'MCO-99101', 'stop_type', 'pickup'),
    'owner-concurrency', 'owner', 'route-concurrency:add', now()
  );
  select (value->>'stop_id')::uuid into v_stop_id
  from jsonb_array_elements(v_result->'route'->'stops');
  v_version := (v_result->'route'->>'version')::integer;
  perform public.a7_orlando_route_command(
    'start', v_route_id, jsonb_build_object('version', v_version),
    'owner-concurrency', 'owner', 'route-concurrency:start', now()
  );
  insert into public.a7_w3d_concurrency_probe_state values(v_route_id, v_stop_id, v_order);
end;
$fixture$;

create function public.a7_w3d_concurrency_attempt(p_actor text, p_role text, p_key text)
returns jsonb language plpgsql as $attempt$
declare
  v_state public.a7_w3d_concurrency_probe_state;
  v_result jsonb;
begin
  select * into strict v_state from public.a7_w3d_concurrency_probe_state;
  v_result := public.a7_orlando_route_command(
    'execute_stop', v_state.route_id,
    jsonb_build_object('stop_id', v_state.stop_id, 'action', 'confirm_pickup'),
    p_actor, p_role, p_key, now()
  );
  return jsonb_build_object('ok', true, 'duplicate', v_result->'duplicate');
exception when others then
  return jsonb_build_object('ok', false, 'sqlstate', sqlstate, 'error', sqlerrm);
end;
$attempt$;

select 'W3-D concurrency fixture: READY' as result;
