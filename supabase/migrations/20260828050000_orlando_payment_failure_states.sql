-- A7 Laundry Orlando — preserve unpaid Stripe outcomes without fabricating revenue.

create or replace function public.a7_orlando_record_payment_state(
  p_stripe_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_lead_id uuid,
  p_checkout_session_id text,
  p_transaction_id text,
  p_payment_status text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_duplicate boolean := false;
  v_ignored boolean := false;
begin
  if p_stripe_event_id !~ '^evt_[A-Za-z0-9_]+$'
    or p_event_type not in ('checkout.session.async_payment_failed', 'checkout.session.expired')
    or p_payment_status not in ('failed', 'void')
    or coalesce(p_checkout_session_id, '') !~ '^cs_[A-Za-z0-9_]+$'
    or (p_transaction_id is not null and p_transaction_id !~ '^pi_[A-Za-z0-9_]+$') then
    raise exception 'Invalid Stripe payment-state contract';
  end if;

  if exists (select 1 from public.a7_orlando_stripe_events where stripe_event_id = p_stripe_event_id) then
    return jsonb_build_object('duplicate', true, 'ignored', true);
  end if;

  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null or v_order.lead_id <> p_lead_id or v_order.invoice_id is null then
    raise exception 'Invoiced order required';
  end if;

  if v_order.payment_status in ('paid', 'partially_refunded', 'refunded') then
    v_ignored := true;
  else
    update public.a7_orlando_orders
      set payment_status = p_payment_status, updated_at = now(), version = version + 1
      where id = p_order_id
      returning * into v_order;
  end if;

  insert into public.a7_orlando_stripe_events (
    stripe_event_id, event_type, object_id, order_id, transaction_id, status, sanitized_payload, processed_at
  ) values (
    p_stripe_event_id, p_event_type, p_checkout_session_id, p_order_id, p_transaction_id,
    case when v_ignored then 'ignored' else 'processed' end,
    jsonb_build_object('payment_status', p_payment_status),
    coalesce(p_occurred_at, now())
  );

  return jsonb_build_object('duplicate', v_duplicate, 'ignored', v_ignored, 'order', to_jsonb(v_order));
end;
$$;

revoke all on function public.a7_orlando_record_payment_state(text,text,uuid,uuid,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_record_payment_state(text,text,uuid,uuid,text,text,text,timestamptz)
  to service_role;
