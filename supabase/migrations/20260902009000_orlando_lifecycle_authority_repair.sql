-- Repair a regression introduced by 20260830040500: that compatibility rewrite
-- omitted ready-for-delivery and cancellation from the canonical lifecycle writer.

create or replace function public.a7_orlando_record_transition(
  p_order_id uuid, p_event_name text, p_event_id text, p_idempotency_key text,
  p_source_system text, p_payload jsonb, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_existing public.a7_orlando_order_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_amount numeric; v_tip numeric; v_amount_due numeric; v_weight numeric; v_reason text;
begin
  select * into v_existing from public.a7_orlando_order_events where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.event_name <> p_event_name or v_existing.order_id <> p_order_id
      or v_existing.source_system <> p_source_system
      or v_existing.payload <> coalesce(p_payload, '{}'::jsonb) then
      raise exception 'Idempotency key conflicts with another transition';
    end if;
    select * into v_order from public.a7_orlando_orders where id = p_order_id;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(v_order));
  end if;
  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  case p_event_name
    when 'pickup_scheduled' then
      if v_order.order_status <> 'accepted' then raise exception 'Invalid pickup schedule transition'; end if;
      update public.a7_orlando_orders set order_status = 'pickup_scheduled',
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'pickup_completed' then
      if v_order.order_status not in ('accepted', 'pickup_scheduled') then raise exception 'Invalid pickup transition'; end if;
      update public.a7_orlando_orders set order_status = 'picked_up', picked_up_at = v_when,
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'order_weighed' then
      v_weight := nullif(p_payload->>'actual_lbs', '')::numeric;
      if v_order.order_status <> 'picked_up' or v_weight is null or v_weight <= 0 then raise exception 'Invalid weighing transition'; end if;
      update public.a7_orlando_orders set order_status = 'weighed', actual_lbs = v_weight,
        weighed_at = v_when, updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'invoice_created' then
      v_amount := nullif(p_payload->>'service_amount', '')::numeric;
      v_tip := coalesce(nullif(p_payload->>'tip_amount', '')::numeric, 0);
      v_amount_due := coalesce(nullif(p_payload->>'amount_due', '')::numeric, v_amount);
      if v_order.order_status = 'invoice_created' or coalesce(p_payload->>'invoice_id', '') = ''
        or v_amount is null or v_amount <= 0 or v_tip <> 0 or v_amount_due <> v_amount
        or p_payload->>'currency' <> 'USD' then raise exception 'Invalid invoice transition'; end if;
      if v_order.pricing_model = 'per_lb' and v_order.order_status <> 'weighed' then raise exception 'Per-pound order must be weighed'; end if;
      update public.a7_orlando_orders set order_status = 'invoice_created', payment_status = 'invoice_created',
        invoice_id = p_payload->>'invoice_id', service_amount = v_amount, tip_amount = 0,
        currency = 'USD', updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'order_ready_for_delivery' then
      if v_order.payment_status <> 'paid' or v_order.order_status <> 'invoice_created' then
        raise exception 'Paid invoiced order required before delivery readiness';
      end if;
      update public.a7_orlando_orders set order_status = 'ready_for_delivery',
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'order_delivered' then
      if v_order.payment_status <> 'paid' or v_order.order_status not in ('invoice_created', 'ready_for_delivery') then
        raise exception 'Paid order required for delivery';
      end if;
      update public.a7_orlando_orders set order_status = 'delivered', delivered_at = v_when,
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'order_cancelled' then
      v_reason := nullif(btrim(coalesce(p_payload->>'reason', '')), '');
      if v_order.order_status in ('delivered', 'cancelled') or v_reason is null then
        raise exception 'A cancellation reason is required before delivery';
      end if;
      update public.a7_orlando_orders set order_status = 'cancelled', cancellation_reason = v_reason,
        cancelled_at = v_when, updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    else raise exception 'Unsupported lifecycle event';
  end case;

  insert into public.a7_orlando_order_events(
    event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
  ) values (
    p_event_id, p_idempotency_key, p_event_name, p_source_system,
    v_order.lead_id, v_order.id, v_when, coalesce(p_payload, '{}'::jsonb)
  );
  return jsonb_build_object('duplicate', false, 'order', to_jsonb(v_order));
end;
$$;

revoke all on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz)
  to service_role;

comment on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz) is
  'Canonical lifecycle writer with W1B scheduling compatibility and complete ready/delivered/cancelled authority.';
