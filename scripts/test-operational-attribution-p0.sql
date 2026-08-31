\set ON_ERROR_STOP on

do $$
declare
  v_attr jsonb;
  v_lead jsonb;
  v_second_lead jsonb;
  v_order jsonb;
  v_customer jsonb;
  v_customer_repeat jsonb;
  v_lead_id uuid;
  v_order_id uuid;
  v_unattributed_lead_id uuid;
  v_unattributed_order_id uuid;
  v_closed_lead_id uuid;
  v_collision_rejected boolean := false;
  v_report jsonb;
begin
  v_customer := public.a7_orlando_upsert_customer('14075550199', 'SQL Test Guest');
  v_customer_repeat := public.a7_orlando_upsert_customer('14075550199', 'SQL Test Guest Updated');
  if v_customer->>'id' is null or v_customer->>'id' <> v_customer_repeat->>'id'
    or v_customer_repeat->>'profile_name' <> 'SQL Test Guest Updated' then
    raise exception 'order-intake customer continuity failed';
  end if;

  v_attr := public.a7_upsert_attribution(
    'at_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '7KQ9W3M2HX',
    '{"entry_type":"referral","source":"google-organic","medium":"organic","landing_page":"/laundry-pickup-delivery-orlando"}'::jsonb,
    'referral|google-organic|organic|/laundry-pickup-delivery-orlando',
    'granted',
    now() + interval '30 days'
  );
  if v_attr->>'attribution_id' <> 'at_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' then
    raise exception 'attribution record was not created';
  end if;

  v_lead := public.a7_orlando_create_lead(
    'sql-lead-1', 'generate_lead:sql-1', 'order_form', null, null,
    'at_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '7KQ9W3M2HX', 'attribution_id',
    'wash_fold_guest', 'guest', 'en', 'hotel', 'tourist-corridor', '{}'::jsonb, now()
  );
  v_lead_id := (v_lead->'lead'->>'id')::uuid;
  perform public.a7_orlando_qualify_lead(
    v_lead_id, 'qualified_guest_lead:sql-1', 'sql-qualify-1', 'wash_fold_guest',
    true, true, true, now()
  );
  v_order := public.a7_orlando_accept_order(
    v_lead_id, 'order_accepted:sql-1', 'sql-accept-1', 'wash_fold_guest', 'normal',
    'per_lb', now() + interval '1 hour', now() + interval '2 hours', 20,
    '123456789.987654321', '987654321', now()
  );
  v_order_id := (v_order->'order'->>'id')::uuid;
  if (v_order->'order'->>'attribution_confidence') <> 'deterministic' then
    raise exception 'deterministic attribution was not frozen';
  end if;

  perform public.a7_orlando_record_transition(
    v_order_id, 'pickup_scheduled', 'pickup_scheduled:sql-1', 'sql-schedule-1',
    'operations', jsonb_build_object(
      'pickup_window_start', now() + interval '1 hour',
      'pickup_window_end', now() + interval '2 hours'
    ), now()
  );
  perform public.a7_orlando_record_transition(
    v_order_id, 'pickup_completed', 'pickup_completed:sql-1', 'sql-pickup-1',
    'operations', '{}'::jsonb, now()
  );
  perform public.a7_orlando_record_transition(
    v_order_id, 'order_weighed', 'order_weighed:sql-1', 'sql-weigh-1',
    'operations', '{"actual_lbs":20}'::jsonb, now()
  );
  perform public.a7_orlando_record_transition(
    v_order_id, 'invoice_created', 'invoice_created:sql-1', 'sql-invoice-1',
    'operations', '{"invoice_id":"inv-sql-1","service_amount":65,"tip_amount":0,"currency":"USD"}'::jsonb, now()
  );
  perform public.a7_orlando_record_payment(
    'evt_sql_payment_1', 'checkout.session.async_payment_succeeded', v_order_id,
    'pi_sqlstable1', 'cs_test_sql1', 'plink_sql1', 65, 'USD', now()
  );
  perform public.a7_orlando_record_payment(
    'evt_sql_payment_retry', 'checkout.session.completed', v_order_id,
    'pi_sqlstable1', 'cs_test_sql_retry', 'plink_sql1', 65, 'USD', now()
  );
  if (select count(*) from public.a7_orlando_payments where transaction_id = 'pi_sqlstable1') <> 1
    or (select count(*) from public.a7_orlando_order_events where event_id = 'purchase:pi_sqlstable1') <> 1 then
    raise exception 'payment idempotency failed';
  end if;
  if (select event_type from public.a7_orlando_stripe_events where stripe_event_id = 'evt_sql_payment_1')
    <> 'checkout.session.async_payment_succeeded' then
    raise exception 'paid Stripe event type was not preserved';
  end if;
  perform public.a7_orlando_record_transition(
    v_order_id, 'order_ready_for_delivery', 'order_ready_for_delivery:sql-1', 'sql-ready-1',
    'operations', '{}'::jsonb, now()
  );
  perform public.a7_orlando_record_transition(
    v_order_id, 'order_delivered', 'order_delivered:sql-1', 'sql-delivered-1',
    'operations', '{}'::jsonb, now()
  );

  begin
    perform public.a7_orlando_record_payment(
      'evt_sql_payment_conflict', 'checkout.session.completed', v_order_id,
      'pi_sqlconflict', 'cs_test_sql_conflict',
      'plink_sql_conflict', 65, 'USD', now()
    );
    raise exception 'second payment intent for the same order was accepted';
  exception
    when unique_violation then null;
  end;

  perform public.a7_orlando_record_refund(
    'evt_sql_refund_1', 'refund.updated', 're_sqlrefund1', 'pi_sqlstable1',
    10, 'USD', 'succeeded', now()
  );
  if (select payment_status from public.a7_orlando_orders where id = v_order_id) <> 'partially_refunded' then
    raise exception 'refund correction failed';
  end if;
  if (select event_type from public.a7_orlando_stripe_events where stripe_event_id = 'evt_sql_refund_1')
    <> 'refund.updated' then
    raise exception 'refund Stripe event type was not preserved';
  end if;

  v_lead := public.a7_orlando_create_lead(
    'sql-lead-unattributed', 'generate_lead:sql-unattributed', 'manual', null, null,
    null, null, 'unknown', 'wash_fold_guest', 'guest', 'en', null, null, '{}'::jsonb, now()
  );
  v_unattributed_lead_id := (v_lead->'lead'->>'id')::uuid;
  perform public.a7_orlando_qualify_lead(
    v_unattributed_lead_id, 'qualified_guest_lead:sql-unattributed', 'sql-qualify-unattributed',
    'wash_fold_guest', true, true, true, now()
  );
  v_order := public.a7_orlando_accept_order(
    v_unattributed_lead_id, 'order_accepted:sql-unattributed', 'sql-accept-unattributed',
    'wash_fold_guest', null, 'per_lb', null, null, null, null, null, now()
  );
  v_unattributed_order_id := (v_order->'order'->>'id')::uuid;
  if (select confidence from public.a7_orlando_attribution_snapshots where order_id = v_unattributed_order_id) <> 'unattributed' then
    raise exception 'fail-open unattributed snapshot missing';
  end if;

  if (select count(*) from public.a7_orlando_orders) <> (select count(*) from public.a7_orlando_attribution_snapshots) then
    raise exception 'snapshot coverage is below 100 percent in smoke test';
  end if;
  if exists (
    select 1 from public.a7_orlando_analytics_outbox
    where safe_payload::text ~* '(phone|email|address|room|gclid|wbraid|gbraid)'
  ) then
    raise exception 'unsafe field found in analytics outbox';
  end if;

  v_lead := public.a7_orlando_create_lead(
    'sql-lead-closed', 'generate_lead:sql-closed', 'manual', null, null,
    null, null, 'unknown', 'wash_fold_guest', 'guest', 'en', null, null, '{}'::jsonb, now()
  );
  v_closed_lead_id := (v_lead->'lead'->>'id')::uuid;
  perform public.a7_orlando_update_lead_status(
    v_closed_lead_id, 'lead_qualification_started', 'lead_qualification_started:sql-closed',
    'sql-lead-start', null, now()
  );
  perform public.a7_orlando_update_lead_status(
    v_closed_lead_id, 'lead_disqualified', 'lead_disqualified:sql-closed',
    'sql-lead-disqualified', 'outside_service_area', now()
  );
  if (select status from public.a7_orlando_leads where id = v_closed_lead_id) <> 'disqualified' then
    raise exception 'lead terminal transition failed';
  end if;

  v_second_lead := public.a7_orlando_create_lead(
    'sql-lead-idem-2', 'generate_lead:sql-idem-2', 'manual', null, null,
    null, 'ABCDEFGHJK', 'unknown', 'wash_fold_guest', 'guest', 'en', null, null,
    '{}'::jsonb, now()
  );
  begin
    perform public.a7_orlando_create_lead(
      'sql-lead-idem-2', 'generate_lead:sql-idem-2', 'whatsapp_inbound', null, null,
      null, 'ABCDEFGHJK', 'unknown', 'wash_fold_guest', 'guest', 'en', null, null,
      '{}'::jsonb, now()
    );
  exception when others then
    v_collision_rejected := position('Idempotency key conflicts' in sqlerrm) > 0;
  end;
  if not v_collision_rejected then
    raise exception 'lead idempotency collision was not rejected';
  end if;
  v_collision_rejected := false;
  begin
    perform public.a7_orlando_qualify_lead(
      (v_second_lead->'lead'->>'id')::uuid, 'qualified_guest_lead:sql-collision',
      'sql-qualify-1', 'wash_fold_guest', true, true, true, now()
    );
  exception when others then
    v_collision_rejected := position('Idempotency key conflicts' in sqlerrm) > 0;
  end;
  if not v_collision_rejected then
    raise exception 'qualification idempotency collision was not rejected';
  end if;

  v_report := public.a7_orlando_operational_funnel(now() - interval '1 day', now() + interval '1 day');
  if (v_report->'stages'->>'accepted_orders')::integer <> 2
    or (v_report->'stages'->>'paid_orders')::integer <> 1
    or (v_report->'stages'->>'service_revenue')::numeric <> 55
    or jsonb_array_length(v_report->'by_landing_page') < 1 then
    raise exception 'operational funnel aggregate is inconsistent: %', v_report;
  end if;
end;
$$;

select 'A7 Orlando operational attribution SQL smoke test passed.' as result;
