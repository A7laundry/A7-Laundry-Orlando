-- A7-038 Packet 4 — permit invoice issuance after governed weight capture while
-- preserving the independent production axis and the existing invoice model.

create or replace function public.a7_orlando_w1c_b1_review_invoice_v2(
  p_order_number text,
  p_expected_invoice_version integer,
  p_expected_order_version integer,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_current public.a7_orlando_invoices;
  v_invoice public.a7_orlando_invoices;
  v_preview jsonb;
  v_retry jsonb;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_line jsonb;
begin
  if p_actor_role not in ('owner', 'manager') or nullif(btrim(coalesce(p_actor_id, '')), '') is null then
    raise exception 'Management authorization is required';
  end if;
  if coalesce(length(v_reason), 0) > 240 then raise exception 'Invoice reason is too long'; end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  v_retry := public.a7_orlando_w1c_b1_resolve_action_retry(
    p_order_number, 'invoice_issued', p_expected_invoice_version, p_idempotency_key, v_reason
  );
  if v_retry is not null then return v_retry; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;
  if v_order.version <> p_expected_order_version then raise exception 'Order changed before invoice review'; end if;
  if v_order.order_status = 'cancelled'
    or v_order.production_state not in ('awaiting_processing', 'processing', 'ready') then
    raise exception 'Order must be weighed before invoice review';
  end if;
  if v_order.payment_status in ('paid', 'partially_refunded', 'refunded') then
    raise exception 'Paid invoice is immutable';
  end if;

  select * into v_current from public.a7_orlando_invoices
    where order_id = v_order.id and status = 'issued' for update;
  if v_current.id is null and exists (
    select 1 from public.a7_orlando_invoices where order_id = v_order.id
  ) then
    raise exception 'Voided invoice cannot be reissued in W1C-B1';
  end if;
  if coalesce(v_current.version, 0) <> p_expected_invoice_version then
    raise exception 'Invoice version is stale';
  end if;
  if v_current.id is not null and v_reason is null then
    raise exception 'A reason is required to replace an invoice';
  end if;
  if exists (select 1 from public.a7_orlando_invoices i
      where i.order_id = v_order.id and i.payment_link_id is not null)
    or exists (select 1 from public.a7_orlando_payments p
      where p.order_id = v_order.id and p.payment_link_id is not null) then
    raise exception 'Linked invoice cannot be replaced in W1C-B1';
  end if;

  v_preview := public.a7_orlando_w1c_b1_preview(v_order.id);
  if v_current.id is not null and v_current.facts_hash = v_preview->>'facts_hash' then
    raise exception 'Invoice facts have not changed';
  end if;

  if v_current.id is not null then
    update public.a7_orlando_invoices set status = 'superseded', superseded_at = v_when,
      updated_at = now() where id = v_current.id;
  end if;
  insert into public.a7_orlando_invoices (
    order_id, version, status, supersedes_invoice_id, item_subtotal, minimum_amount,
    minimum_adjustment, service_amount, tip_amount, currency, facts_hash, reason, issued_by, issued_at
  ) values (
    v_order.id, coalesce(v_current.version, 0) + 1, 'issued', v_current.id,
    (v_preview->>'item_subtotal')::numeric, (v_preview->>'minimum_amount')::numeric,
    (v_preview->>'minimum_adjustment')::numeric, (v_preview->>'service_amount')::numeric,
    0, 'USD', v_preview->>'facts_hash', v_reason, p_actor_id, v_when
  ) returning * into v_invoice;

  for v_line in select value from jsonb_array_elements(v_preview->'lines') loop
    insert into public.a7_orlando_invoice_lines (
      invoice_id, line_number, line_type, order_item_id, label, unit,
      quantity, actual_lbs, unit_price, subtotal
    ) values (
      v_invoice.id, (v_line->>'line_number')::integer, v_line->>'line_type',
      nullif(v_line->>'order_item_id', '')::uuid, v_line->>'label', v_line->>'unit',
      nullif(v_line->>'quantity', '')::numeric, nullif(v_line->>'actual_lbs', '')::numeric,
      (v_line->>'unit_price')::numeric, (v_line->>'subtotal')::numeric
    );
  end loop;

  if v_current.id is null and v_order.invoice_id is null then
    perform public.a7_orlando_record_transition(
      v_order.id, 'invoice_created', 'invoice_created:' || md5(p_idempotency_key),
      p_idempotency_key || ':lifecycle', 'operations',
      jsonb_build_object('invoice_id', v_invoice.id, 'service_amount', v_invoice.service_amount,
        'tip_amount', 0, 'currency', 'USD'), v_when
    );
  else
    update public.a7_orlando_orders set order_status = 'invoice_created', payment_status = 'invoice_created',
      invoice_id = v_invoice.id::text, service_amount = v_invoice.service_amount, tip_amount = 0,
      currency = 'USD', updated_at = now(), version = version + 1 where id = v_order.id;
  end if;
  update public.a7_orlando_orders set current_invoice_id = v_invoice.id where id = v_order.id;

  insert into public.a7_orlando_invoice_events (
    order_id, invoice_id, action, actor_id, actor_role, idempotency_key,
    requested_version, invoice_version, facts_hash, reason, occurred_at
  ) values (
    v_order.id, v_invoice.id, 'invoice_issued', p_actor_id, p_actor_role, p_idempotency_key,
    p_expected_invoice_version, v_invoice.version, v_invoice.facts_hash, v_reason, v_when
  );
  return jsonb_build_object('duplicate', false,
    'invoice', public.a7_orlando_w1c_b1_invoice_payload(v_invoice.id));
end;
$$;

revoke all on function public.a7_orlando_w1c_b1_review_invoice_v2(
  text,integer,integer,text,text,text,text,timestamptz
) from public, anon, authenticated;
grant execute on function public.a7_orlando_w1c_b1_review_invoice_v2(
  text,integer,integer,text,text,text,text,timestamptz
) to service_role;

comment on function public.a7_orlando_w1c_b1_review_invoice_v2(
  text,integer,integer,text,text,text,text,timestamptz
) is 'A7-038 canonical invoice authority after weight; production and finance remain independent.';
