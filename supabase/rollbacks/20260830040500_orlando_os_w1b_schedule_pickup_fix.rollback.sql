-- Exceptional rollback only after the W1B application has been rolled back.
-- Restores the P0 lifecycle writer exactly; W1B pickup scheduling is unavailable again.

create or replace function public.a7_orlando_record_transition(
  p_order_id uuid,
  p_event_name text,
  p_event_id text,
  p_idempotency_key text,
  p_source_system text,
  p_payload jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_amount numeric;
  v_tip numeric;
  v_weight numeric;
begin
  if exists (select 1 from public.a7_orlando_order_events where idempotency_key = p_idempotency_key) then
    select * into v_order from public.a7_orlando_orders where id = p_order_id;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(v_order));
  end if;
  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  case p_event_name
    when 'pickup_completed' then
      if v_order.order_status not in ('accepted', 'pickup_scheduled') then raise exception 'Invalid pickup transition'; end if;
      update public.a7_orlando_orders set order_status = 'picked_up', picked_up_at = v_when,
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    when 'order_weighed' then
      v_weight := nullif(p_payload->>'actual_lbs', '')::numeric;
      if v_order.order_status <> 'picked_up' or v_weight is null or v_weight <= 0 then raise exception 'Invalid weighing transition'; end if;
      update public.a7_orlando_orders set order_status = 'weighed', actual_lbs = v_weight,
        weighed_at = v_when, updated_at = now(), version = version + 1
      where id = p_order_id returning * into v_order;
    when 'invoice_created' then
      v_amount := nullif(p_payload->>'service_amount', '')::numeric;
      v_tip := coalesce(nullif(p_payload->>'tip_amount', '')::numeric, 0);
      if coalesce(p_payload->>'invoice_id', '') = '' or v_amount is null or v_amount < 0
        or p_payload->>'currency' <> 'USD' then raise exception 'Invalid invoice transition'; end if;
      if v_order.pricing_model = 'per_lb' and v_order.order_status <> 'weighed' then raise exception 'Per-pound order must be weighed'; end if;
      update public.a7_orlando_orders set order_status = 'invoice_created', payment_status = 'invoice_created',
        invoice_id = p_payload->>'invoice_id', service_amount = v_amount, tip_amount = v_tip,
        currency = 'USD', updated_at = now(), version = version + 1
      where id = p_order_id returning * into v_order;
    when 'order_delivered' then
      if v_order.payment_status <> 'paid' or v_order.order_status not in ('invoice_created', 'ready_for_delivery') then
        raise exception 'Paid order required for delivery';
      end if;
      update public.a7_orlando_orders set order_status = 'delivered', delivered_at = v_when,
        updated_at = now(), version = version + 1 where id = p_order_id returning * into v_order;
    else raise exception 'Unsupported lifecycle event';
  end case;

  insert into public.a7_orlando_order_events (
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
