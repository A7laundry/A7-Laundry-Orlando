begin;

do $$
declare
  v_customer uuid;
  v_lead uuid;
  v_order uuid;
  v_version integer;
  v_result jsonb;
  v_invoice_one uuid;
  v_invoice_two uuid;
begin
  insert into public.a7_wa_contacts(unit_key, wa_id, profile_name)
    values ('orlando', '14075550801', 'W1C B1 Synthetic Guest') returning id into v_customer;
  insert into public.a7_orlando_leads(
    idempotency_key, customer_id, attribution_resolution, status, lead_origin,
    service_type, customer_type, language, accommodation_type, operational_data
  ) values (
    'w1c-b1-sql-lead', v_customer, 'unknown', 'order_accepted', 'manual',
    'wash_fold_guest', 'guest', 'en', 'hotel', '{"property":"Synthetic Hotel"}'::jsonb
  ) returning id into v_lead;
  insert into public.a7_orlando_orders(
    lead_id, customer_id, order_number, service_type, customer_type, service_tier,
    pricing_model, order_status, payment_status, accepted_at, picked_up_at,
    actual_lbs, weighed_at, custody_state, production_state, operational_waiting_since, is_qa
  ) values (
    v_lead, v_customer, 'MCO 9981', 'wash_fold_guest', 'guest', 'normal',
    'per_lb', 'weighed', 'pending', now() - interval '8 hours', now() - interval '6 hours',
    8, now() - interval '4 hours', 'at_laundry', 'ready', now() - interval '1 hour', false
  ) returning id, version into v_order, v_version;
  insert into public.a7_orlando_order_items(
    order_id, catalog_code, catalog_version, service_type, label, quantity, unit,
    estimated_lbs, unit_price, minimum_amount, actual_lbs, weighed_at, subtotal,
    weight_version, requires_manual_review
  ) values
    (v_order, 'wash_fold_normal', 1, 'wash_fold_guest', 'Wash & Fold', null, 'lb',
      8, 3.25, 50, 8, now() - interval '4 hours', 26, 1, false),
    (v_order, 'comforter', 1, 'comforter_cleaning', 'Comforter', 1, 'piece',
      null, 20, 0, null, null, null, 0, false);

  v_result := public.a7_orlando_w1c_b1_review_invoice(
    'MCO 9981', 0, v_version, 'actor_w1c_b1_sql_owner', 'owner',
    'w1c-b1-sql-review-one', null, now()
  );
  v_invoice_one := (v_result->'invoice'->>'invoice_id')::uuid;
  if v_result->>'duplicate' <> 'false'
    or (v_result->'invoice'->>'version')::integer <> 1
    or (v_result->'invoice'->>'item_subtotal')::numeric <> 46
    or (v_result->'invoice'->>'minimum_adjustment')::numeric <> 4
    or (v_result->'invoice'->>'service_amount')::numeric <> 50 then
    raise exception 'W1C-B1 initial invoice composition failed';
  end if;
  if (select count(*) from public.a7_orlando_invoice_lines
      where invoice_id = v_invoice_one and line_type = 'minimum_adjustment') <> 1 then
    raise exception 'W1C-B1 minimum adjustment was not recorded exactly once';
  end if;
  if not exists (select 1 from public.a7_orlando_orders where id = v_order
      and current_invoice_id = v_invoice_one and payment_status = 'invoice_created'
      and service_amount = 50 and tip_amount = 0 and currency = 'USD') then
    raise exception 'W1C-B1 order header compatibility failed';
  end if;
  if (public.a7_orlando_w1c_b1_review_invoice(
      'MCO 9981', 0, v_version, 'actor_w1c_b1_sql_owner', 'owner',
      'w1c-b1-sql-review-one', null, now()
    )->>'duplicate') <> 'true' then raise exception 'W1C-B1 retry failed'; end if;
  if (select count(*) from public.a7_orlando_invoices where order_id = v_order) <> 1 then
    raise exception 'W1C-B1 retry created a duplicate invoice';
  end if;
  begin
    perform public.a7_orlando_w1c_b1_review_invoice(
      'MCO 9981', 0, v_version, 'actor_w1c_b1_sql_owner', 'owner',
      'w1c-b1-sql-review-one', 'Conflicting retry', now()
    );
    raise exception 'W1C-B1 semantic idempotency guard was not enforced';
  exception when others then
    if sqlerrm = 'W1C-B1 semantic idempotency guard was not enforced'
      or position('Idempotency key conflicts' in sqlerrm) = 0 then raise; end if;
  end;
  select version into v_version from public.a7_orlando_orders where id = v_order;
  begin
    perform public.a7_orlando_w1c_b1_review_invoice(
      'MCO 9981', 1, v_version, 'actor_w1c_b1_sql_owner', 'owner',
      'w1c-b1-sql-no-change', 'Checked without changing facts', now()
    );
    raise exception 'W1C-B1 no-change guard was not enforced';
  exception when others then
    if sqlerrm = 'W1C-B1 no-change guard was not enforced'
      or position('facts have not changed' in sqlerrm) = 0 then raise; end if;
  end;

  update public.a7_orlando_order_items set quantity = 2
    where order_id = v_order and catalog_code = 'comforter';
  select version into v_version from public.a7_orlando_orders where id = v_order;
  v_result := public.a7_orlando_w1c_b1_review_invoice(
    'MCO 9981', 1, v_version, 'actor_w1c_b1_sql_owner', 'owner',
    'w1c-b1-sql-review-two', 'Second comforter confirmed', now()
  );
  v_invoice_two := (v_result->'invoice'->>'invoice_id')::uuid;
  if (v_result->'invoice'->>'version')::integer <> 2
    or (v_result->'invoice'->>'service_amount')::numeric <> 66 then
    raise exception 'W1C-B1 replacement amount/version failed';
  end if;
  if not exists (select 1 from public.a7_orlando_invoices
      where id = v_invoice_one and status = 'superseded' and service_amount = 50) then
    raise exception 'W1C-B1 prior invoice was not preserved';
  end if;
  if (select quantity from public.a7_orlando_invoice_lines
      where invoice_id = v_invoice_one and label = 'Comforter') <> 1 then
    raise exception 'W1C-B1 prior line snapshot was rewritten';
  end if;
  if (select count(*) from public.a7_orlando_order_events
      where order_id = v_order and event_name = 'invoice_created') <> 1 then
    raise exception 'W1C-B1 emitted duplicate lifecycle invoice events';
  end if;

  v_result := public.a7_orlando_w1c_b1_void_invoice(
    'MCO 9981', 2, 'actor_w1c_b1_sql_owner', 'owner',
    'w1c-b1-sql-void', 'Customer cancelled before payment', now()
  );
  if v_result->>'duplicate' <> 'false' or v_result->'invoice'->>'status' <> 'void' then
    raise exception 'W1C-B1 void failed';
  end if;
  if not exists (select 1 from public.a7_orlando_orders where id = v_order
      and current_invoice_id is null and invoice_id is null and payment_status = 'void') then
    raise exception 'W1C-B1 void did not clear the payable header';
  end if;
  if exists (select 1 from public.a7_orlando_invoice_lines
      where label ilike '%14075550801%' or label ilike '%Synthetic Guest%') then
    raise exception 'W1C-B1 invoice lines contain customer PII';
  end if;
  select version into v_version from public.a7_orlando_orders where id = v_order;
  begin
    perform public.a7_orlando_w1c_b1_review_invoice(
      'MCO 9981', 0, v_version, 'actor_w1c_b1_sql_owner', 'owner',
      'w1c-b1-sql-reissue', null, now()
    );
    raise exception 'W1C-B1 voided-invoice reissue guard was not enforced';
  exception when others then
    if sqlerrm = 'W1C-B1 voided-invoice reissue guard was not enforced'
      or position('Voided invoice cannot be reissued' in sqlerrm) = 0 then raise; end if;
  end;
end;
$$;

rollback;
