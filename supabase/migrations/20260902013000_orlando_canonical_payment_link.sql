-- A7-038 Packet 4 — governed Payment Link ownership and signed tip reconciliation.
-- Extends the existing Stripe endpoint/webhook; it does not introduce a second payment authority.

create table if not exists public.a7_orlando_payment_links (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  invoice_id uuid not null references public.a7_orlando_invoices(id) on delete restrict,
  invoice_version integer not null check (invoice_version > 0),
  service_amount numeric not null check (service_amount > 0),
  tip_amount numeric not null default 0 check (tip_amount >= 0),
  total_amount numeric not null check (total_amount = service_amount + tip_amount),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null check (status in ('creating', 'active', 'completed', 'failed', 'inactive')),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  idempotency_key text not null unique,
  actor_id text not null,
  actor_role text not null check (actor_role in ('owner', 'manager')),
  stripe_service_price_id text,
  stripe_tip_price_id text,
  stripe_payment_link_id text unique,
  stripe_url text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status <> 'active') or (stripe_service_price_id is not null
    and stripe_payment_link_id is not null and stripe_url is not null)),
  check ((status <> 'completed') or completed_at is not null)
);

create unique index if not exists a7_orlando_payment_links_one_current_invoice_idx
  on public.a7_orlando_payment_links(invoice_id) where status in ('creating', 'active');
create index if not exists a7_orlando_payment_links_order_idx
  on public.a7_orlando_payment_links(order_id, created_at desc);

alter table public.a7_orlando_payment_links enable row level security;
revoke all on public.a7_orlando_payment_links from public, anon, authenticated;
grant all on public.a7_orlando_payment_links to service_role;

alter table public.a7_orlando_payments
  add column if not exists invoice_id uuid references public.a7_orlando_invoices(id) on delete restrict,
  add column if not exists service_amount numeric,
  add column if not exists tip_amount numeric not null default 0,
  add column if not exists total_amount numeric;

update public.a7_orlando_payments p
set invoice_id = coalesce(p.invoice_id, o.current_invoice_id),
    -- Historical Stripe rows predate explicit tip evidence. Preserve the signed
    -- amount as service rather than inferring a tip from an apparent overpayment.
    service_amount = coalesce(p.service_amount, p.amount),
    total_amount = coalesce(p.total_amount, p.amount)
from public.a7_orlando_orders o
where o.id = p.order_id
  and (p.invoice_id is null or p.service_amount is null or p.total_amount is null);

alter table public.a7_orlando_payments
  drop constraint if exists a7_orlando_payments_tip_nonnegative,
  drop constraint if exists a7_orlando_payments_amount_composition;

alter table public.a7_orlando_payments
  add constraint a7_orlando_payments_tip_nonnegative check (tip_amount >= 0) not valid,
  add constraint a7_orlando_payments_amount_composition
    check (service_amount > 0 and total_amount = service_amount + tip_amount and amount = total_amount) not valid;
alter table public.a7_orlando_payments validate constraint a7_orlando_payments_tip_nonnegative;
alter table public.a7_orlando_payments validate constraint a7_orlando_payments_amount_composition;

create or replace function public.a7_orlando_payment_link_current(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(l) from public.a7_orlando_payment_links l
  where l.order_id = p_order_id and l.status in ('creating', 'active')
  order by l.created_at desc limit 1
$$;

create or replace function public.a7_orlando_payment_link_order(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'lead_id', o.lead_id, 'order_number', o.order_number,
    'order_status', o.order_status, 'payment_status', o.payment_status,
    'invoice_id', o.invoice_id, 'current_invoice_id', o.current_invoice_id,
    'service_amount', o.service_amount, 'tip_amount', o.tip_amount,
    'currency', o.currency, 'version', o.version
  ) from public.a7_orlando_orders o
  where o.unit_key = 'orlando' and o.order_number = p_order_number limit 1
$$;

create or replace function public.a7_orlando_payment_link_by_stripe_id(p_payment_link_id text)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(l) from public.a7_orlando_payment_links l
  where l.stripe_payment_link_id = p_payment_link_id limit 1
$$;

create or replace function public.a7_orlando_payment_link_reserve(
  p_order_id uuid, p_lead_id uuid, p_invoice_id uuid,
  p_service_amount numeric, p_tip_amount numeric, p_total_amount numeric,
  p_request_fingerprint text, p_actor_id text, p_actor_role text,
  p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_invoice public.a7_orlando_invoices;
  v_link public.a7_orlando_payment_links;
begin
  if p_actor_role not in ('owner', 'manager') or nullif(btrim(coalesce(p_actor_id, '')), '') is null
    or p_request_fingerprint !~ '^[0-9a-f]{64}$'
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null
    or p_service_amount is null or p_service_amount <= 0 or p_tip_amount is null or p_tip_amount < 0
    or p_total_amount <> p_service_amount + p_tip_amount or p_total_amount < 5 or p_total_amount > 2000 then
    raise exception 'Invalid Payment Link reservation';
  end if;
  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null or v_order.lead_id <> p_lead_id
    or v_order.invoice_id <> p_invoice_id::text or v_order.current_invoice_id <> p_invoice_id
    or v_order.service_amount <> p_service_amount or upper(v_order.currency) <> 'USD'
    or v_order.payment_status not in ('invoice_created', 'failed', 'void')
    or public.a7_orlando_order_is_qa(v_order.id) then
    raise exception 'Current payable invoice is inconsistent';
  end if;
  select * into v_invoice from public.a7_orlando_invoices
    where id = p_invoice_id and order_id = p_order_id and status = 'issued' for share;
  if v_invoice.id is null or v_invoice.service_amount <> p_service_amount then
    raise exception 'Current payable invoice is required';
  end if;
  select * into v_link from public.a7_orlando_payment_links
    where invoice_id = p_invoice_id and status in ('creating', 'active') for update;
  if v_link.id is not null then
    if v_link.request_fingerprint <> p_request_fingerprint
      or v_link.service_amount <> p_service_amount or v_link.tip_amount <> p_tip_amount
      or v_link.total_amount <> p_total_amount then
      raise exception 'A different Payment Link is already current for this invoice';
    end if;
    return jsonb_build_object('duplicate', true, 'payment_link', to_jsonb(v_link));
  end if;
  select * into v_link from public.a7_orlando_payment_links
    where invoice_id = p_invoice_id and status = 'failed'
      and request_fingerprint = p_request_fingerprint
    order by created_at desc limit 1 for update;
  if v_link.id is not null then
    update public.a7_orlando_payment_links set status = 'creating', error_code = null,
      updated_at = coalesce(p_occurred_at, now()) where id = v_link.id returning * into v_link;
    return jsonb_build_object('duplicate', true, 'payment_link', to_jsonb(v_link));
  end if;
  insert into public.a7_orlando_payment_links(
    order_id, invoice_id, invoice_version, service_amount, tip_amount, total_amount, status,
    request_fingerprint, idempotency_key, actor_id, actor_role, created_at, updated_at
  ) values (
    p_order_id, p_invoice_id, v_invoice.version, p_service_amount, p_tip_amount, p_total_amount, 'creating',
    p_request_fingerprint, p_idempotency_key, p_actor_id, p_actor_role,
    coalesce(p_occurred_at, now()), coalesce(p_occurred_at, now())
  ) returning * into v_link;
  return jsonb_build_object('duplicate', false, 'payment_link', to_jsonb(v_link));
end;
$$;

create or replace function public.a7_orlando_payment_link_activate(
  p_attempt_id uuid, p_service_price_id text, p_tip_price_id text,
  p_payment_link_id text, p_stripe_url text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_link public.a7_orlando_payment_links;
begin
  if p_service_price_id !~ '^price_[A-Za-z0-9_]+$'
    or (p_tip_price_id is not null and p_tip_price_id !~ '^price_[A-Za-z0-9_]+$')
    or p_payment_link_id !~ '^plink_[A-Za-z0-9_]+$'
    or p_stripe_url !~ '^https://buy[.]stripe[.]com/' then raise exception 'Invalid Stripe link evidence'; end if;
  select * into v_link from public.a7_orlando_payment_links where id = p_attempt_id for update;
  if v_link.id is null or v_link.status <> 'creating' then raise exception 'Payment Link reservation is not current'; end if;
  update public.a7_orlando_payment_links set status = 'active',
    stripe_service_price_id = p_service_price_id, stripe_tip_price_id = p_tip_price_id,
    stripe_payment_link_id = p_payment_link_id, stripe_url = p_stripe_url,
    updated_at = coalesce(p_occurred_at, now()) where id = p_attempt_id returning * into v_link;
  update public.a7_orlando_invoices set payment_link_id = p_payment_link_id, updated_at = now()
    where id = v_link.invoice_id and status = 'issued';
  return jsonb_build_object('payment_link', to_jsonb(v_link));
end;
$$;

create or replace function public.a7_orlando_payment_link_fail(
  p_attempt_id uuid, p_error_code text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  update public.a7_orlando_payment_links set status = 'failed',
    error_code = left(coalesce(nullif(p_error_code, ''), 'stripe_create_failed'), 80),
    updated_at = coalesce(p_occurred_at, now())
    where id = p_attempt_id and status = 'creating';
  get diagnostics v_count = row_count;
  return jsonb_build_object('ignored', v_count = 0);
end;
$$;

create or replace function public.a7_orlando_record_payment_v2(
  p_stripe_event_id text, p_event_type text, p_order_id uuid,
  p_transaction_id text, p_checkout_session_id text, p_payment_link_id text,
  p_service_amount numeric, p_tip_amount numeric, p_total_amount numeric,
  p_currency text, p_paid_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_link public.a7_orlando_payment_links;
  v_payment public.a7_orlando_payments;
  v_existing_event public.a7_orlando_stripe_events;
  v_event_id text := 'purchase:' || p_transaction_id;
  v_inserted boolean := false;
begin
  if p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    or p_stripe_event_id !~ '^evt_[A-Za-z0-9_]+$' or p_transaction_id !~ '^pi_[A-Za-z0-9_]+$'
    or p_checkout_session_id !~ '^cs_[A-Za-z0-9_]+$' or p_payment_link_id !~ '^plink_[A-Za-z0-9_]+$'
    or p_service_amount is null or p_service_amount <= 0 or p_tip_amount is null or p_tip_amount < 0
    or p_total_amount <> p_service_amount + p_tip_amount or upper(p_currency) <> 'USD' then
    raise exception 'Invalid Stripe payment contract';
  end if;
  select * into v_existing_event from public.a7_orlando_stripe_events
    where stripe_event_id = p_stripe_event_id;
  if v_existing_event.stripe_event_id is not null then
    if v_existing_event.event_type <> p_event_type
      or v_existing_event.object_id is distinct from p_checkout_session_id
      or v_existing_event.order_id is distinct from p_order_id
      or v_existing_event.transaction_id is distinct from p_transaction_id
      or (v_existing_event.sanitized_payload->>'service_amount')::numeric <> p_service_amount
      or (v_existing_event.sanitized_payload->>'tip_amount')::numeric <> p_tip_amount
      or (v_existing_event.sanitized_payload->>'total_amount')::numeric <> p_total_amount
      or upper(v_existing_event.sanitized_payload->>'currency') <> 'USD' then
      raise exception 'Stripe event idempotency conflict';
    end if;
    select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id;
    if v_payment.id is null or v_payment.order_id <> p_order_id
      or v_payment.checkout_session_id is distinct from p_checkout_session_id
      or v_payment.payment_link_id is distinct from p_payment_link_id
      or v_payment.service_amount <> p_service_amount or v_payment.tip_amount <> p_tip_amount
      or v_payment.total_amount <> p_total_amount or upper(v_payment.currency) <> 'USD' then
      raise exception 'Stripe event conflicts with reconciled payment';
    end if;
    return jsonb_build_object('duplicate', true, 'payment', to_jsonb(v_payment));
  end if;
  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  select * into v_link from public.a7_orlando_payment_links
    where stripe_payment_link_id = p_payment_link_id for update;
  if v_order.id is null or v_link.id is null or v_link.order_id <> v_order.id
    or v_link.invoice_id <> v_order.current_invoice_id or v_link.status <> 'active'
    or v_link.service_amount <> p_service_amount or v_link.tip_amount <> p_tip_amount
    or v_link.total_amount <> p_total_amount or v_order.service_amount <> p_service_amount then
    raise exception 'Paid checkout does not match its governed Payment Link';
  end if;
  if exists (select 1 from public.a7_orlando_payments where order_id = p_order_id
      and transaction_id <> p_transaction_id) then raise exception 'Order is already bound to another payment'; end if;
  insert into public.a7_orlando_payments(
    order_id, invoice_id, transaction_id, checkout_session_id, payment_link_id,
    amount, service_amount, tip_amount, total_amount, currency, status, paid_at
  ) values (
    p_order_id, v_link.invoice_id, p_transaction_id, p_checkout_session_id, p_payment_link_id,
    p_total_amount, p_service_amount, p_tip_amount, p_total_amount, 'USD', 'paid', coalesce(p_paid_at, now())
  ) on conflict (transaction_id) do nothing returning * into v_payment;
  if v_payment.id is null then
    select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id;
    if v_payment.order_id <> p_order_id or v_payment.total_amount <> p_total_amount then
      raise exception 'Payment intent conflicts with the existing sale'; end if;
  else
    v_inserted := true;
    update public.a7_orlando_orders set payment_status = 'paid', payment_id = p_transaction_id,
      paid_at = v_payment.paid_at, tip_amount = p_tip_amount, updated_at = now(), version = version + 1
      where id = p_order_id returning * into v_order;
    update public.a7_orlando_payment_links set status = 'completed', completed_at = v_payment.paid_at,
      updated_at = now() where id = v_link.id;
    insert into public.a7_orlando_order_events(
      event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
    ) values (v_event_id, v_event_id, 'purchase', 'stripe', v_order.lead_id, v_order.id,
      v_payment.paid_at, jsonb_build_object('transaction_id', p_transaction_id, 'order_id', v_order.id,
        'value', p_service_amount, 'currency', 'USD', 'service_type', v_order.service_type,
        'customer_type', v_order.customer_type, 'is_repeat_customer', v_order.is_repeat_customer,
        'attribution_confidence', v_order.attribution_confidence,
        'items', jsonb_build_array(jsonb_build_object('item_id', v_order.service_type, 'item_name', v_order.service_type))));
    insert into public.a7_orlando_analytics_outbox(event_id, event_name, client_id, session_id, safe_payload, delivery_status)
    select v_event_id, 'purchase', s.ga_client_id, s.ga_session_id, e.payload,
      case when s.ga_client_id is null then 'pending_identity' else 'pending' end
    from public.a7_orlando_order_events e join public.a7_orlando_attribution_snapshots s on s.order_id = e.order_id
    where e.event_id = v_event_id;
  end if;
  insert into public.a7_orlando_stripe_events(
    stripe_event_id, event_type, object_id, order_id, transaction_id, status, sanitized_payload
  ) values (p_stripe_event_id, p_event_type, p_checkout_session_id, p_order_id, p_transaction_id,
    case when v_inserted then 'processed' else 'ignored' end,
    jsonb_build_object('service_amount', p_service_amount, 'tip_amount', p_tip_amount,
      'total_amount', p_total_amount, 'currency', 'USD'));
  return jsonb_build_object('duplicate', not v_inserted, 'payment', to_jsonb(v_payment));
end;
$$;

create or replace function public.a7_orlando_record_refund_v2(
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
declare
  v_payment public.a7_orlando_payments;
  v_order public.a7_orlando_orders;
  v_refund public.a7_orlando_refunds;
  v_total numeric;
  v_event_id text := 'refund:' || p_refund_id;
begin
  if p_event_type not in ('refund.created', 'refund.updated')
    or p_refund_id !~ '^re_[A-Za-z0-9_]+$' or p_transaction_id !~ '^pi_[A-Za-z0-9_]+$'
    or p_amount is null or p_amount <= 0 or upper(p_currency) <> 'USD' then
    raise exception 'Invalid Stripe refund contract';
  end if;
  if exists (select 1 from public.a7_orlando_stripe_events where stripe_event_id = p_stripe_event_id)
    or exists (select 1 from public.a7_orlando_refunds where refund_id = p_refund_id) then
    select * into v_refund from public.a7_orlando_refunds where refund_id = p_refund_id;
    return jsonb_build_object('duplicate', true, 'refund', to_jsonb(v_refund));
  end if;
  select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id for update;
  if v_payment.id is null then raise exception 'Original payment not found'; end if;
  select * into v_order from public.a7_orlando_orders where id = v_payment.order_id for update;

  insert into public.a7_orlando_refunds(
    refund_id, payment_id, order_id, transaction_id, amount, currency, status
  ) values (
    p_refund_id, v_payment.id, v_order.id, p_transaction_id, p_amount, 'USD', p_status
  ) returning * into v_refund;

  select coalesce(sum(amount), 0) into v_total from public.a7_orlando_refunds
    where payment_id = v_payment.id and status in ('created', 'succeeded');
  if v_total > v_payment.amount then raise exception 'Refund total exceeds payment'; end if;

  update public.a7_orlando_payments set refund_total = v_total,
    status = case when v_total = 0 then status when v_total >= amount then 'refunded' else 'partially_refunded' end,
    updated_at = now() where id = v_payment.id returning * into v_payment;
  update public.a7_orlando_orders set
    payment_status = case when v_total = 0 then payment_status
      when v_total >= v_payment.amount then 'refunded' else 'partially_refunded' end,
    updated_at = now(), version = version + 1 where id = v_order.id returning * into v_order;

  insert into public.a7_orlando_order_events(
    event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
  ) values (
    v_event_id, v_event_id, 'refund', 'stripe', v_order.lead_id, v_order.id,
    coalesce(p_occurred_at, now()), jsonb_build_object('transaction_id', p_transaction_id,
      'order_id', v_order.id, 'value', p_amount, 'currency', 'USD')
  );
  insert into public.a7_orlando_analytics_outbox(
    event_id, event_name, client_id, session_id, safe_payload, delivery_status
  )
  select v_event_id, 'refund', s.ga_client_id, s.ga_session_id, e.payload,
    case when s.ga_client_id is null then 'pending_identity' else 'pending' end
  from public.a7_orlando_order_events e
  join public.a7_orlando_attribution_snapshots s on s.order_id = e.order_id
  where e.event_id = v_event_id;
  insert into public.a7_orlando_stripe_events(
    stripe_event_id, event_type, object_id, order_id, transaction_id, status, sanitized_payload
  ) values (
    p_stripe_event_id, p_event_type, p_refund_id, v_order.id, p_transaction_id,
    'processed', jsonb_build_object('amount', p_amount, 'currency', 'USD', 'status', p_status)
  );
  return jsonb_build_object('duplicate', false, 'refund', to_jsonb(v_refund));
end;
$$;

revoke all on function public.a7_orlando_payment_link_current(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_payment_link_order(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_payment_link_by_stripe_id(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_payment_link_reserve(uuid,uuid,uuid,numeric,numeric,numeric,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_payment_link_activate(uuid,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_payment_link_fail(uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_payment_v2(text,text,uuid,text,text,text,numeric,numeric,numeric,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_refund_v2(text,text,text,text,numeric,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.a7_orlando_payment_link_current(uuid) to service_role;
grant execute on function public.a7_orlando_payment_link_order(text) to service_role;
grant execute on function public.a7_orlando_payment_link_by_stripe_id(text) to service_role;
grant execute on function public.a7_orlando_payment_link_reserve(uuid,uuid,uuid,numeric,numeric,numeric,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_payment_link_activate(uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_payment_link_fail(uuid,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_payment_v2(text,text,uuid,text,text,text,numeric,numeric,numeric,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_refund_v2(text,text,text,text,numeric,text,text,timestamptz) to service_role;

comment on table public.a7_orlando_payment_links is
  'Protected canonical ownership ledger for the existing A7 Stripe Payment Link flow; contains no customer PII.';
