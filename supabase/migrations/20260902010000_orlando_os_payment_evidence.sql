-- A7-038 Packet 4 — complete manual payment evidence without replacing the canonical payment axes.

-- The original P0 explicitly disabled tips. This wave activates the already-modeled
-- non-negative order tip while keeping invoice.tip_amount fixed at zero (service only).
alter table public.a7_orlando_orders
  drop constraint if exists a7_orlando_orders_tip_disabled_in_mvp;
alter table public.a7_orlando_orders
  drop constraint if exists a7_orlando_orders_tip_nonnegative;
alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_tip_nonnegative
  check (tip_amount is null or tip_amount >= 0) not valid;
alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_tip_nonnegative;

alter table public.a7_orlando_manual_payments
  add column if not exists invoice_id uuid references public.a7_orlando_invoices(id) on delete restrict,
  add column if not exists service_amount numeric,
  add column if not exists tip_amount numeric not null default 0,
  add column if not exists total_amount numeric,
  add column if not exists reference text,
  add column if not exists source text not null default 'operator_entry';

update public.a7_orlando_manual_payments m
set service_amount = coalesce(m.service_amount, o.service_amount, m.amount),
    total_amount = coalesce(m.total_amount, m.amount),
    invoice_id = coalesce(m.invoice_id, o.current_invoice_id)
from public.a7_orlando_orders o
where o.id = m.order_id
  and (m.service_amount is null or m.total_amount is null or m.invoice_id is null);

alter table public.a7_orlando_manual_payments
  drop constraint if exists a7_orlando_manual_payments_tip_valid,
  drop constraint if exists a7_orlando_manual_payments_total_valid,
  drop constraint if exists a7_orlando_manual_payments_source_valid;

alter table public.a7_orlando_manual_payments
  add constraint a7_orlando_manual_payments_tip_valid
    check (tip_amount >= 0) not valid,
  add constraint a7_orlando_manual_payments_total_valid
    check (service_amount > 0 and total_amount = service_amount + tip_amount and amount = total_amount) not valid,
  add constraint a7_orlando_manual_payments_source_valid
    check (source in ('operator_entry', 'historical_import')) not valid;

alter table public.a7_orlando_manual_payments
  validate constraint a7_orlando_manual_payments_tip_valid;
alter table public.a7_orlando_manual_payments
  validate constraint a7_orlando_manual_payments_total_valid;
alter table public.a7_orlando_manual_payments
  validate constraint a7_orlando_manual_payments_source_valid;

create or replace function public.a7_orlando_record_manual_payment_v2(
  p_order_number text, p_method text, p_amount numeric, p_tip_amount numeric,
  p_paid_at timestamptz, p_reference text, p_source text, p_note text,
  p_actor_id text, p_actor_role text, p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_invoice public.a7_orlando_invoices;
  v_payment public.a7_orlando_manual_payments;
  v_existing public.a7_orlando_manual_payments;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_actor_role not in ('owner', 'manager')
    or p_method not in ('stripe', 'cash', 'zelle', 'other')
    or p_source <> 'operator_entry'
    or p_amount is null or p_amount <= 0 or p_tip_amount is null or p_tip_amount < 0
    or p_paid_at is null or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null
    or (p_method in ('stripe', 'zelle') and v_reference is null)
    or coalesce(length(v_reference), 0) > 120 then
    raise exception 'Invalid manual payment contract';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null or public.a7_orlando_order_is_qa(v_order.id) then
    raise exception 'Eligible order required';
  end if;

  select * into v_existing from public.a7_orlando_manual_payments
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.method <> p_method
      or v_existing.amount <> p_amount or v_existing.tip_amount <> p_tip_amount
      or v_existing.paid_at <> p_paid_at or v_existing.reference is distinct from v_reference
      or v_existing.source <> p_source or v_existing.note is distinct from v_note
      or v_existing.recorded_by <> p_actor_id or v_existing.actor_role <> p_actor_role then
      raise exception 'Manual payment idempotency conflict';
    end if;
    return jsonb_build_object('duplicate', true, 'payment', jsonb_build_object(
      'payment_id', v_existing.id, 'order_number', v_order.order_number,
      'invoice_id', v_existing.invoice_id, 'method', v_existing.method,
      'service_amount', v_existing.service_amount, 'tip_amount', v_existing.tip_amount,
      'total_amount', v_existing.total_amount, 'currency', v_existing.currency,
      'reference', v_existing.reference, 'source', v_existing.source,
      'paid_at', v_existing.paid_at));
  end if;

  if v_order.payment_status = 'paid' then raise exception 'Order is already paid'; end if;
  if v_order.current_invoice_id is null or v_order.service_amount is null
    or v_order.payment_status not in ('invoice_created', 'failed') then
    raise exception 'Current payable invoice required';
  end if;
  select * into v_invoice from public.a7_orlando_invoices
    where id = v_order.current_invoice_id and order_id = v_order.id and status = 'issued' for share;
  if v_invoice.id is null or v_invoice.service_amount <> v_order.service_amount then
    raise exception 'Current payable invoice is inconsistent';
  end if;
  if round(v_order.service_amount + p_tip_amount, 2) <> p_amount then
    raise exception 'Payment total must equal service amount plus tip';
  end if;
  if exists (select 1 from public.a7_orlando_payments where order_id = v_order.id) then
    raise exception 'Reconciled Stripe payment already exists';
  end if;
  if exists (select 1 from public.a7_orlando_manual_payments where order_id = v_order.id) then
    raise exception 'Manual payment already exists';
  end if;

  insert into public.a7_orlando_manual_payments(
    order_id, invoice_id, method, amount, service_amount, tip_amount, total_amount,
    currency, paid_at, reference, source, note, recorded_by, actor_role,
    idempotency_key, created_at
  ) values (
    v_order.id, v_invoice.id, p_method, p_amount, v_order.service_amount, p_tip_amount,
    p_amount, 'USD', p_paid_at, v_reference, p_source,
    v_note, p_actor_id, p_actor_role,
    p_idempotency_key, v_when
  ) returning * into v_payment;

  update public.a7_orlando_orders set payment_status = 'paid',
    payment_id = 'manual_' || replace(v_payment.id::text, '-', ''), paid_at = p_paid_at,
    currency = 'USD', tip_amount = p_tip_amount, updated_at = now(), version = version + 1
  where id = v_order.id;

  insert into public.a7_orlando_operational_events(
    order_id, action, actor_id, actor_role, idempotency_key,
    previous_state, new_state, occurred_at
  ) values (
    v_order.id, 'manual_payment_recorded', p_actor_id, p_actor_role, p_idempotency_key,
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'paid', 'invoice_id', v_invoice.id,
      'method', p_method, 'service_amount', v_order.service_amount,
      'tip_amount', p_tip_amount, 'total_amount', p_amount, 'currency', 'USD',
      'source', p_source, 'reference', v_reference), p_paid_at
  );
  insert into public.a7_orlando_operator_audit(
    actor_id, actor_role, action, entity_type, entity_id,
    idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, p_actor_role, 'manual_payment_recorded', 'order', v_order.id,
    p_idempotency_key, jsonb_build_object('order_number', v_order.order_number,
      'invoice_id', v_invoice.id, 'method', p_method,
      'service_amount', v_order.service_amount, 'tip_amount', p_tip_amount,
      'total_amount', p_amount, 'currency', 'USD', 'source', p_source,
      'reference', v_reference), p_paid_at
  );
  return jsonb_build_object('duplicate', false, 'payment', jsonb_build_object(
    'payment_id', v_payment.id, 'order_number', v_order.order_number,
    'invoice_id', v_payment.invoice_id, 'method', v_payment.method,
    'service_amount', v_payment.service_amount, 'tip_amount', v_payment.tip_amount,
    'total_amount', v_payment.total_amount, 'currency', v_payment.currency,
    'reference', v_payment.reference, 'source', v_payment.source,
    'paid_at', v_payment.paid_at));
end;
$$;

create or replace function public.a7_orlando_operational_cycle_enrich_order(p_order jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_order_id uuid; v_result jsonb := p_order;
begin
  select id into v_order_id from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order->>'order_number';
  if v_order_id is null then return p_order; end if;
  return v_result || jsonb_build_object(
    'invoice_id', (select invoice_id from public.a7_orlando_orders where id = v_order_id),
    'service_amount', (select service_amount from public.a7_orlando_orders where id = v_order_id),
    'tip_amount', (select tip_amount from public.a7_orlando_orders where id = v_order_id),
    'paid_at', (select paid_at from public.a7_orlando_orders where id = v_order_id),
    'pickup_driver', (select jsonb_build_object('driver_id', d.id, 'name', d.full_name, 'assigned_at', a.assigned_at)
      from public.a7_orlando_driver_assignments a join public.a7_orlando_drivers d on d.id = a.driver_id
      where a.order_id = v_order_id and a.leg = 'pickup' and a.superseded_at is null limit 1),
    'delivery_driver', (select jsonb_build_object('driver_id', d.id, 'name', d.full_name, 'assigned_at', a.assigned_at)
      from public.a7_orlando_driver_assignments a join public.a7_orlando_drivers d on d.id = a.driver_id
      where a.order_id = v_order_id and a.leg = 'delivery' and a.superseded_at is null limit 1),
    'manual_payment', (select jsonb_build_object('method', m.method, 'amount', m.amount,
      'service_amount', m.service_amount, 'tip_amount', m.tip_amount, 'total_amount', m.total_amount,
      'invoice_id', m.invoice_id, 'reference', m.reference, 'source', m.source,
      'currency', m.currency, 'paid_at', m.paid_at)
      from public.a7_orlando_manual_payments m where m.order_id = v_order_id limit 1)
  );
end;
$$;

revoke all on function public.a7_orlando_record_manual_payment_v2(
  text,text,numeric,numeric,timestamptz,text,text,text,text,text,text,timestamptz
) from public, anon, authenticated;
grant execute on function public.a7_orlando_record_manual_payment_v2(
  text,text,numeric,numeric,timestamptz,text,text,text,text,text,text,timestamptz
) to service_role;

comment on function public.a7_orlando_record_manual_payment_v2(
  text,text,numeric,numeric,timestamptz,text,text,text,text,text,text,timestamptz
) is 'A7-038 audited manual reconciliation. Service revenue, effective tip and total remain separate.';
