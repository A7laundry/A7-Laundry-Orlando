begin;

do $$
declare
  v_customer uuid;
  v_lead uuid;
  v_order uuid;
  v_context jsonb;
  v_created jsonb;
  v_approved jsonb;
  v_copied jsonb;
  v_draft uuid;
begin
  insert into public.a7_wa_contacts(unit_key, wa_id, profile_name)
    values ('orlando', '14075550199', 'W2 Synthetic Guest') returning id into v_customer;
  insert into public.a7_orlando_leads(
    idempotency_key, customer_id, attribution_resolution, status, lead_origin,
    service_type, customer_type, language, accommodation_type, operational_data
  ) values (
    'w2-a-sql-lead', v_customer, 'unknown', 'order_accepted', 'manual',
    'wash_fold_guest', 'guest', 'pt', 'hotel', '{"property":"Synthetic Hotel","room":"812"}'::jsonb
  ) returning id into v_lead;
  insert into public.a7_orlando_orders(
    lead_id, customer_id, order_number, service_type, customer_type, service_tier,
    pricing_model, order_status, payment_status, accepted_at, pickup_window_start,
    pickup_window_end, custody_state, production_state, operational_waiting_since, is_qa
  ) values (
    v_lead, v_customer, 'MCO 9911', 'wash_fold_guest', 'guest', 'normal',
    'per_lb', 'picked_up', 'pending', now(), now(), now() + interval '1 hour',
    'at_laundry', 'processing', now(), false
  ) returning id into v_order;

  v_context := public.a7_orlando_w2_a_context('MCO 9911');
  if v_context->>'language' <> 'pt'
    or v_context->>'whatsapp_last4' <> '0199'
    or not (v_context->'available_templates' ? 'received_at_laundry') then
    raise exception 'W2-A context contract failed';
  end if;

  v_created := public.a7_orlando_w2_a_create_draft(
    'MCO 9911', 'received_at_laundry', 'pt',
    'O pedido MCO 9911 da A7 Laundry chegou à lavanderia.',
    repeat('a', 64), 'actor_sql_owner', 'owner', 'w2-a-sql-create', now()
  );
  v_draft := (v_created->'draft'->>'id')::uuid;
  if v_created->>'duplicate' <> 'false' or v_draft is null then
    raise exception 'W2-A draft creation failed';
  end if;

  if (public.a7_orlando_w2_a_create_draft(
    'MCO 9911', 'received_at_laundry', 'pt',
    'O pedido MCO 9911 da A7 Laundry chegou à lavanderia.',
    repeat('a', 64), 'actor_sql_owner', 'owner', 'w2-a-sql-create', now()
  )->>'duplicate') <> 'true' then raise exception 'W2-A create retry failed'; end if;

  v_approved := public.a7_orlando_w2_a_act_on_draft(
    v_draft, 'approve', 1, repeat('a', 64),
    'actor_sql_owner', 'owner', 'w2-a-sql-approve', now()
  );
  if v_approved->'draft'->>'status' <> 'approved' then raise exception 'W2-A approval failed'; end if;

  v_copied := public.a7_orlando_w2_a_act_on_draft(
    v_draft, 'copy', 2, '',
    'actor_sql_owner', 'owner', 'w2-a-sql-copy', now()
  );
  if v_copied->'draft'->>'status' <> 'copied' then raise exception 'W2-A copy acknowledgement failed'; end if;
  if (select count(*) from public.a7_orlando_order_message_events where order_id = v_order) <> 3 then
    raise exception 'W2-A append-only event count failed';
  end if;
end;
$$;

rollback;
