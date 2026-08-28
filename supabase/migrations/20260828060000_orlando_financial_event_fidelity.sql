-- A7 Laundry Orlando — financial event fidelity and positive-value hardening.
-- Keeps the original P0 RPCs available for rollback while exposing overloads
-- that preserve the exact signed Stripe event type in the audit ledger.

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_service_amount_positive
  check (service_amount is null or service_amount > 0) not valid;

alter table public.a7_orlando_payments
  add constraint a7_orlando_payments_amount_positive
  check (amount > 0) not valid;

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_tip_disabled_in_mvp
  check (tip_amount is null or tip_amount = 0) not valid;

alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_service_amount_positive;

alter table public.a7_orlando_payments
  validate constraint a7_orlando_payments_amount_positive;

alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_tip_disabled_in_mvp;

create or replace function public.a7_orlando_record_payment(
  p_stripe_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_transaction_id text,
  p_checkout_session_id text,
  p_payment_link_id text,
  p_amount numeric,
  p_currency text,
  p_paid_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if p_event_type not in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded'
  ) then
    raise exception 'Invalid Stripe paid-event type';
  end if;

  v_result := public.a7_orlando_record_payment(
    p_stripe_event_id,
    p_order_id,
    p_transaction_id,
    p_checkout_session_id,
    p_payment_link_id,
    p_amount,
    p_currency,
    p_paid_at
  );

  update public.a7_orlando_stripe_events
    set event_type = p_event_type
    where stripe_event_id = p_stripe_event_id;

  return v_result;
end;
$$;

create or replace function public.a7_orlando_record_refund(
  p_stripe_event_id text,
  p_event_type text,
  p_refund_id text,
  p_transaction_id text,
  p_amount numeric,
  p_currency text,
  p_status text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if p_event_type not in ('refund.created', 'refund.updated') then
    raise exception 'Invalid Stripe refund-event type';
  end if;

  v_result := public.a7_orlando_record_refund(
    p_stripe_event_id,
    p_refund_id,
    p_transaction_id,
    p_amount,
    p_currency,
    p_status,
    p_occurred_at
  );

  update public.a7_orlando_stripe_events
    set event_type = p_event_type
    where stripe_event_id = p_stripe_event_id;

  return v_result;
end;
$$;

revoke all on function public.a7_orlando_record_payment(text,text,uuid,text,text,text,numeric,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_record_payment(text,text,uuid,text,text,text,numeric,text,timestamptz)
  to service_role;

revoke all on function public.a7_orlando_record_refund(text,text,text,text,numeric,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_record_refund(text,text,text,text,numeric,text,text,timestamptz)
  to service_role;
