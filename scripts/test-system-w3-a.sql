begin;

do $$
declare
  v_customer uuid;
  v_prior_lead uuid;
  v_prior_order uuid;
  v_result jsonb;
  v_new_order uuid;
  v_new_lead uuid;
  v_submission uuid := gen_random_uuid();
  v_name text;
begin
  insert into public.a7_wa_contacts(unit_key, wa_id, profile_name)
    values ('orlando', '14075550301', 'W3 Synthetic Known Guest') returning id into v_customer;
  insert into public.a7_orlando_leads(
    idempotency_key, customer_id, attribution_resolution, status, lead_origin,
    service_type, customer_type, language, accommodation_type, operational_data
  ) values (
    'w3-a-prior-lead', v_customer, 'unknown', 'order_accepted', 'manual',
    'wash_fold_guest', 'guest', 'pt', 'hotel', '{"property":"Prior Synthetic Hotel"}'::jsonb
  ) returning id into v_prior_lead;
  insert into public.a7_orlando_orders(
    lead_id, customer_id, order_number, service_type, customer_type, service_tier,
    pricing_model, order_status, payment_status, accepted_at, pickup_window_start,
    pickup_window_end, custody_state, production_state, operational_waiting_since, is_qa
  ) values (
    v_prior_lead, v_customer, 'MCO 9921', 'wash_fold_guest', 'guest', 'normal',
    'per_lb', 'picked_up', 'pending', now() - interval '1 day', now() - interval '1 day',
    now() - interval '23 hours', 'at_laundry', 'processing', now() - interval '23 hours', false
  ) returning id into v_prior_order;

  v_result := public.a7_orlando_create_known_customer_order(
    v_submission, repeat('f', 64), 'actor_w3_sql_owner', 'owner', v_customer,
    'pt', 'guest', 'hotel', 'orlando_pending_route',
    jsonb_build_object(
      'property', 'Current Synthetic Hotel', 'pickup_location', 'bell_services',
      'pickup_window_start', now() + interval '1 hour',
      'pickup_window_end', now() + interval '2 hours',
      'needed_by', now() + interval '1 day', 'analytics_context', null
    ), null, 'wash_fold_guest', 'normal', 'per_lb',
    now() + interval '1 hour', now() + interval '2 hours', 12, 2,
    jsonb_build_array(jsonb_build_object(
      'catalog_code', 'wash_fold_normal', 'catalog_version', 1,
      'service_type', 'wash_fold_guest', 'label', 'Wash & Fold — Normal',
      'quantity', null, 'unit', 'lb', 'estimated_lbs', 12,
      'unit_price', 3.25, 'minimum_amount', 50,
      'requires_manual_review', false, 'notes', null
    )), now()
  );
  v_new_order := (v_result->>'order_id')::uuid;
  v_new_lead := (v_result->>'lead_id')::uuid;

  if v_result->>'duplicate' <> 'false' or v_result->>'customer_reused' <> 'true'
    or v_result->>'is_repeat_customer' <> 'true' then
    raise exception 'W3-A create result contract failed';
  end if;
  if v_new_order is null or v_new_lead is null or v_new_order = v_prior_order or v_new_lead = v_prior_lead then
    raise exception 'W3-A did not create distinct lead/order identities';
  end if;
  if not exists (
    select 1 from public.a7_orlando_orders
    where id = v_new_order and customer_id = v_customer and is_repeat_customer
      and order_number ~ '^MCO [0-9]+$'
  ) then raise exception 'W3-A customer continuity/repeat truth failed'; end if;
  select profile_name into v_name from public.a7_wa_contacts where id = v_customer;
  if v_name <> 'W3 Synthetic Known Guest' then raise exception 'W3-A mutated customer identity'; end if;
  if (select count(*) from public.a7_orlando_orders where customer_id = v_customer) <> 2 then
    raise exception 'W3-A order count failed';
  end if;
  if (public.a7_orlando_create_known_customer_order(
    v_submission, repeat('f', 64), 'actor_w3_sql_owner', 'owner', v_customer,
    'pt', 'guest', 'hotel', 'orlando_pending_route',
    jsonb_build_object(
      'property', 'Current Synthetic Hotel', 'pickup_location', 'bell_services',
      'pickup_window_start', now() + interval '1 hour',
      'pickup_window_end', now() + interval '2 hours',
      'needed_by', now() + interval '1 day', 'analytics_context', null
    ), null, 'wash_fold_guest', 'normal', 'per_lb',
    now() + interval '1 hour', now() + interval '2 hours', 12, 2,
    jsonb_build_array(jsonb_build_object(
      'catalog_code', 'wash_fold_normal', 'catalog_version', 1,
      'service_type', 'wash_fold_guest', 'label', 'Wash & Fold — Normal',
      'quantity', null, 'unit', 'lb', 'estimated_lbs', 12,
      'unit_price', 3.25, 'minimum_amount', 50,
      'requires_manual_review', false, 'notes', null
    )), now()
  )->>'duplicate') <> 'true' then raise exception 'W3-A retry failed'; end if;
  if (select count(*) from public.a7_orlando_orders where customer_id = v_customer) <> 2 then
    raise exception 'W3-A retry created a duplicate';
  end if;
end;
$$;

rollback;
