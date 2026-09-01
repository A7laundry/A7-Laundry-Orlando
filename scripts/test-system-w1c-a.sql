begin;

do $$
declare
  v_customer uuid;
  v_lead uuid;
  v_order uuid;
  v_item uuid;
  v_first jsonb;
  v_retry jsonb;
begin
  insert into public.a7_wa_contacts(unit_key, wa_id, profile_name)
    values ('orlando', '14075550501', 'W1C A Synthetic Guest') returning id into v_customer;
  insert into public.a7_orlando_leads(
    idempotency_key, customer_id, attribution_resolution, status, lead_origin,
    service_type, customer_type, language, accommodation_type, operational_data
  ) values (
    'w1c-a-sql-lead', v_customer, 'unknown', 'order_accepted', 'manual',
    'wash_fold_guest', 'guest', 'en', 'hotel', '{"property":"Synthetic Hotel"}'::jsonb
  ) returning id into v_lead;
  insert into public.a7_orlando_orders(
    lead_id, customer_id, order_number, service_type, customer_type, service_tier,
    pricing_model, order_status, payment_status, accepted_at, picked_up_at,
    custody_state, production_state, operational_waiting_since, is_qa
  ) values (
    v_lead, v_customer, 'MCO 9951', 'wash_fold_guest', 'guest', 'normal',
    'per_lb', 'picked_up', 'pending', now() - interval '4 hours', now() - interval '2 hours',
    'at_laundry', 'awaiting_weight', now() - interval '1 hour', false
  ) returning id into v_order;
  insert into public.a7_orlando_order_items(
    order_id, catalog_code, catalog_version, service_type, label, quantity, unit,
    estimated_lbs, unit_price, minimum_amount, actual_lbs, weighed_at, subtotal,
    weight_version, requires_manual_review
  ) values (
    v_order, 'wash_fold_normal', 1, 'wash_fold_guest', 'Wash & Fold', null, 'lb',
    8, 3.25, 50, null, null, null, 0, false
  ) returning id into v_item;

  v_first := public.a7_orlando_w1c_a_record_item_weight(
    'MCO 9951', v_item, 8, 0, 'actor_w1c_a_sql_owner', 'owner',
    'w1c-a-sql-weight-one', null, now()
  );
  if v_first->>'duplicate' <> 'false' or v_first->>'complete' <> 'true' then
    raise exception 'W1C-A first weight failed';
  end if;
  if not exists (
    select 1 from public.a7_orlando_orders where id = v_order
      and order_status = 'weighed' and production_state = 'awaiting_processing'
      and actual_lbs = 8 and weighed_at is not null
  ) then raise exception 'W1C-A completion state failed'; end if;
  if (select count(*) from public.a7_orlando_item_weight_events where order_id = v_order) <> 1
    or (select count(*) from public.a7_orlando_order_events
        where order_id = v_order and event_name = 'order_weighed') <> 1 then
    raise exception 'W1C-A first write event count failed';
  end if;

  -- Simulate the next real operator action before a delayed network retry arrives.
  update public.a7_orlando_orders set production_state = 'processing' where id = v_order;
  v_retry := public.a7_orlando_w1c_a_record_item_weight(
    'MCO 9951', v_item, 8, 0, 'actor_w1c_a_sql_owner', 'owner',
    'w1c-a-sql-weight-one', null, now()
  );
  if v_retry->>'duplicate' <> 'true' then
    raise exception 'W1C-A retry after advancement was not idempotent';
  end if;
  if (select count(*) from public.a7_orlando_item_weight_events where order_id = v_order) <> 1
    or (select count(*) from public.a7_orlando_order_events
        where order_id = v_order and event_name = 'order_weighed') <> 1 then
    raise exception 'W1C-A retry duplicated an event';
  end if;

  begin
    perform public.a7_orlando_w1c_a_record_item_weight(
      'MCO 9951', v_item, 9, 0, 'actor_w1c_a_sql_owner', 'owner',
      'w1c-a-sql-weight-one', null, now()
    );
    raise exception 'W1C-A conflicting retry was accepted';
  exception when others then
    if sqlerrm = 'W1C-A conflicting retry was accepted'
      or position('Idempotency key conflicts' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;

rollback;
