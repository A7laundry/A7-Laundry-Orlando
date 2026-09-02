begin;

do $$
declare
  v_customer uuid;
  v_lead uuid;
  v_order uuid;
  v_driver uuid;
  v_result jsonb;
begin
  insert into public.a7_wa_contacts(unit_key, wa_id, profile_name)
    values ('orlando', '14075550992', 'Idempotency SQL Synthetic') returning id into v_customer;
  insert into public.a7_orlando_leads(
    idempotency_key, customer_id, attribution_resolution, status, lead_origin,
    service_type, customer_type, language, accommodation_type, operational_data
  ) values (
    'idempotency-sql-lead', v_customer, 'unknown', 'order_accepted', 'manual',
    'wash_fold_guest', 'guest', 'en', 'hotel', '{"property":"Synthetic Hotel"}'::jsonb
  ) returning id into v_lead;
  insert into public.a7_orlando_orders(
    lead_id, customer_id, order_number, service_type, customer_type, service_tier,
    pricing_model, order_status, payment_status, accepted_at,
    custody_state, production_state, operational_waiting_since, is_qa
  ) values (
    v_lead, v_customer, 'MCO 9992', 'wash_fold_guest', 'guest', 'normal',
    'per_lb', 'accepted', 'pending', now(),
    'awaiting_pickup', 'awaiting_intake', now(), false
  ) returning id into v_order;

  v_result := public.a7_orlando_record_transition(
    v_order, 'pickup_scheduled', 'pickup_scheduled:idempotency-sql',
    'idempotency-sql-pickup', 'operations', '{}'::jsonb, now()
  );
  if v_result->>'duplicate' <> 'false' then raise exception 'First pickup schedule failed'; end if;
  v_result := public.a7_orlando_record_transition(
    v_order, 'pickup_scheduled', 'pickup_scheduled:idempotency-sql',
    'idempotency-sql-pickup', 'operations', '{}'::jsonb, now()
  );
  if v_result->>'duplicate' <> 'true' then raise exception 'Pickup schedule retry was not exact'; end if;
  if (select version from public.a7_orlando_orders where id = v_order) <> 2
    or (select count(*) from public.a7_orlando_order_events
        where order_id = v_order and event_name = 'pickup_scheduled') <> 1 then
    raise exception 'Pickup schedule version/event invariant failed';
  end if;
  begin
    perform public.a7_orlando_record_transition(
      v_order, 'pickup_scheduled', 'pickup_scheduled:idempotency-sql',
      'idempotency-sql-pickup', 'operations', '{"changed":true}'::jsonb, now()
    );
    raise exception 'Conflicting pickup retry was accepted';
  exception when others then
    if sqlerrm = 'Conflicting pickup retry was accepted'
      or position('Idempotency key conflicts' in sqlerrm) = 0 then raise; end if;
  end;

  v_result := public.a7_orlando_upsert_driver(
    null, 'SQL Driver', '14075550993', true, 'owner-sql', 'owner',
    'idempotency-sql-driver', now()
  );
  v_driver := (v_result->'driver'->>'driver_id')::uuid;
  if public.a7_orlando_upsert_driver(
      null, 'SQL Driver', '14075550993', true, 'owner-sql', 'owner',
      'idempotency-sql-driver', now()
    )->>'duplicate' <> 'true' then raise exception 'Driver retry was not exact'; end if;
  begin
    perform public.a7_orlando_upsert_driver(
      null, 'Changed SQL Driver', '14075550993', true, 'owner-sql', 'owner',
      'idempotency-sql-driver', now()
    );
    raise exception 'Conflicting driver retry was accepted';
  exception when others then
    if sqlerrm = 'Conflicting driver retry was accepted'
      or position('Driver idempotency conflict' in sqlerrm) = 0 then raise; end if;
  end;

  perform public.a7_orlando_assign_driver(
    'MCO 9992', v_driver, 'pickup', 'manager-sql', 'manager',
    'idempotency-sql-assignment', now()
  );
  perform public.a7_orlando_upsert_driver(
    v_driver, 'SQL Driver', '14075550993', false, 'owner-sql', 'owner',
    'idempotency-sql-driver-disable', now()
  );
  v_result := public.a7_orlando_upsert_driver(
    null, 'SQL Driver', '14075550993', true, 'owner-sql', 'owner',
    'idempotency-sql-driver', now()
  );
  if v_result->>'duplicate' <> 'true'
    or (v_result->'driver'->>'active')::boolean is distinct from true then
    raise exception 'Driver retry did not preserve its original result snapshot';
  end if;
  if public.a7_orlando_assign_driver(
      'MCO 9992', v_driver, 'pickup', 'manager-sql', 'manager',
      'idempotency-sql-assignment', now()
    )->>'duplicate' <> 'true' then
    raise exception 'Assignment retry failed after driver deactivation';
  end if;
  begin
    perform public.a7_orlando_assign_driver(
      'MCO 9992', v_driver, 'pickup', 'owner-sql', 'owner',
      'idempotency-sql-assignment', now()
    );
    raise exception 'Conflicting assignment retry was accepted';
  exception when others then
    if sqlerrm = 'Conflicting assignment retry was accepted'
      or position('Driver assignment idempotency conflict' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;

rollback;
