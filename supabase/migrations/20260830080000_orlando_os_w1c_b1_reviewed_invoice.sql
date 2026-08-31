-- A7 Orlando OS W1C-B1 — reviewed, versioned invoice snapshots.
-- Additive and service-role only. No Stripe, Payment Link, webhook or delivery behavior.

create table if not exists public.a7_orlando_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  version integer not null check (version > 0),
  status text not null check (status in ('issued', 'superseded', 'void')),
  supersedes_invoice_id uuid references public.a7_orlando_invoices(id) on delete restrict,
  item_subtotal numeric not null check (item_subtotal >= 0),
  minimum_amount numeric not null default 0 check (minimum_amount >= 0),
  minimum_adjustment numeric not null default 0 check (minimum_adjustment >= 0),
  service_amount numeric not null check (service_amount > 0),
  tip_amount numeric not null default 0 check (tip_amount = 0),
  currency text not null default 'USD' check (currency = 'USD'),
  facts_hash text not null check (facts_hash ~ '^[0-9a-f]{32}$'),
  reason text,
  issued_by text not null,
  issued_at timestamptz not null,
  superseded_at timestamptz,
  voided_by text,
  voided_at timestamptz,
  void_reason text,
  payment_link_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, version),
  check (service_amount = item_subtotal + minimum_adjustment),
  check ((status <> 'superseded') or superseded_at is not null),
  check ((status <> 'void') or (voided_at is not null and voided_by is not null and void_reason is not null))
);

create unique index if not exists a7_orlando_invoices_one_issued_idx
  on public.a7_orlando_invoices (order_id) where status = 'issued';
create index if not exists a7_orlando_invoices_order_history_idx
  on public.a7_orlando_invoices (order_id, version desc);

create table if not exists public.a7_orlando_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.a7_orlando_invoices(id) on delete restrict,
  line_number integer not null check (line_number > 0),
  line_type text not null check (line_type in ('item', 'minimum_adjustment')),
  order_item_id uuid references public.a7_orlando_order_items(id) on delete restrict,
  label text not null,
  unit text not null,
  quantity numeric,
  actual_lbs numeric,
  unit_price numeric not null check (unit_price >= 0),
  subtotal numeric not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  unique (invoice_id, line_number),
  check ((line_type = 'item' and order_item_id is not null)
    or (line_type = 'minimum_adjustment' and order_item_id is null)),
  check ((unit = 'lb' and actual_lbs is not null and actual_lbs > 0 and quantity is null)
    or (unit <> 'lb' and quantity is not null and quantity > 0 and actual_lbs is null))
);

create index if not exists a7_orlando_invoice_lines_invoice_idx
  on public.a7_orlando_invoice_lines (invoice_id, line_number);

create table if not exists public.a7_orlando_invoice_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  invoice_id uuid not null references public.a7_orlando_invoices(id) on delete restrict,
  action text not null check (action in ('invoice_issued', 'invoice_voided')),
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  requested_version integer not null check (requested_version >= 0),
  invoice_version integer not null check (invoice_version > 0),
  facts_hash text not null check (facts_hash ~ '^[0-9a-f]{32}$'),
  reason text,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists a7_orlando_invoice_events_order_idx
  on public.a7_orlando_invoice_events (order_id, occurred_at, id);

alter table public.a7_orlando_orders
  add column if not exists current_invoice_id uuid references public.a7_orlando_invoices(id) on delete set null;

alter table public.a7_orlando_invoices enable row level security;
alter table public.a7_orlando_invoice_lines enable row level security;
alter table public.a7_orlando_invoice_events enable row level security;
revoke all on public.a7_orlando_invoices, public.a7_orlando_invoice_lines,
  public.a7_orlando_invoice_events from public, anon, authenticated;
grant all on public.a7_orlando_invoices, public.a7_orlando_invoice_lines,
  public.a7_orlando_invoice_events to service_role;

comment on table public.a7_orlando_invoices is
  'Immutable W1C-B1 reviewed invoice headers. One issued version per Orlando order.';
comment on table public.a7_orlando_invoice_lines is
  'Immutable server-derived item and minimum-adjustment snapshots. Contains no customer PII.';
comment on column public.a7_orlando_invoices.payment_link_id is
  'Reserved for W1C-B2 durable link ownership; W1C-B1 never writes it.';

create or replace function public.a7_orlando_w1c_b1_preview(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_unresolved integer;
  v_item_subtotal numeric;
  v_minimum numeric;
  v_adjustment numeric;
  v_total numeric;
  v_lines jsonb;
  v_preview jsonb;
begin
  select count(*) into v_unresolved
  from public.a7_orlando_order_items i
  where i.order_id = p_order_id and (
    i.requires_manual_review
    or i.unit_price is null or i.unit_price < 0
    or (i.unit = 'lb' and (i.actual_lbs is null or i.actual_lbs <= 0))
    or (i.unit <> 'lb' and (i.quantity is null or i.quantity <= 0))
  );
  if v_unresolved > 0 then raise exception 'Invoice contains unresolved items'; end if;
  if not exists (select 1 from public.a7_orlando_order_items where order_id = p_order_id) then
    raise exception 'Order items are required before invoice review';
  end if;

  with calculated as (
    select i.*,
      row_number() over (order by i.created_at, i.id)::integer as line_number,
      round(case when i.unit = 'lb' then i.actual_lbs * i.unit_price
        else i.quantity * i.unit_price end, 2) as line_subtotal
    from public.a7_orlando_order_items i where i.order_id = p_order_id
  )
  select coalesce(sum(line_subtotal), 0), coalesce(max(minimum_amount), 0),
    jsonb_agg(jsonb_build_object(
      'line_number', line_number,
      'line_type', 'item',
      'order_item_id', id,
      'label', label,
      'unit', unit,
      'quantity', case when unit = 'lb' then null else quantity end,
      'actual_lbs', case when unit = 'lb' then actual_lbs else null end,
      'unit_price', unit_price,
      'subtotal', line_subtotal
    ) order by line_number)
  into v_item_subtotal, v_minimum, v_lines from calculated;

  v_adjustment := greatest(v_minimum - v_item_subtotal, 0);
  v_total := v_item_subtotal + v_adjustment;
  if v_total <= 0 then raise exception 'Invoice total must be positive'; end if;
  if v_adjustment > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'line_number', jsonb_array_length(v_lines) + 1,
      'line_type', 'minimum_adjustment',
      'order_item_id', null,
      'label', 'Order minimum adjustment',
      'unit', 'adjustment',
      'quantity', 1,
      'actual_lbs', null,
      'unit_price', v_adjustment,
      'subtotal', v_adjustment
    ));
  end if;
  v_preview := jsonb_build_object(
    'currency', 'USD', 'tip_amount', 0,
    'item_subtotal', v_item_subtotal,
    'minimum_amount', v_minimum,
    'minimum_adjustment', v_adjustment,
    'service_amount', v_total,
    'lines', v_lines
  );
  return v_preview || jsonb_build_object('facts_hash', md5(v_preview::text));
end;
$$;

create or replace function public.a7_orlando_w1c_b1_invoice_payload(p_invoice_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'invoice_id', i.id,
    'order_id', i.order_id,
    'version', i.version,
    'status', i.status,
    'supersedes_invoice_id', i.supersedes_invoice_id,
    'item_subtotal', i.item_subtotal,
    'minimum_amount', i.minimum_amount,
    'minimum_adjustment', i.minimum_adjustment,
    'service_amount', i.service_amount,
    'tip_amount', i.tip_amount,
    'currency', i.currency,
    'facts_hash', i.facts_hash,
    'reason', i.reason,
    'issued_at', i.issued_at,
    'voided_at', i.voided_at,
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'line_number', l.line_number,
        'line_type', l.line_type,
        'order_item_id', l.order_item_id,
        'label', l.label,
        'unit', l.unit,
        'quantity', l.quantity,
        'actual_lbs', l.actual_lbs,
        'unit_price', l.unit_price,
        'subtotal', l.subtotal
      ) order by l.line_number)
      from public.a7_orlando_invoice_lines l where l.invoice_id = i.id
    ), '[]'::jsonb)
  ) from public.a7_orlando_invoices i where i.id = p_invoice_id;
$$;

create or replace function public.a7_orlando_w1c_b1_invoices(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(public.a7_orlando_w1c_b1_invoice_payload(i.id)
    order by i.version desc), '[]'::jsonb)
  from public.a7_orlando_invoices i
  join public.a7_orlando_orders o on o.id = i.order_id
  where o.unit_key = 'orlando' and o.order_number = p_order_number;
$$;

create or replace function public.a7_orlando_w1c_b1_review_invoice(
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
  v_existing public.a7_orlando_invoice_events;
  v_preview jsonb;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_line jsonb;
begin
  if p_actor_role <> 'owner' or nullif(btrim(coalesce(p_actor_id, '')), '') is null then
    raise exception 'Owner authorization is required';
  end if;
  if coalesce(length(v_reason), 0) > 240 then raise exception 'Invoice reason is too long'; end if;
  select * into v_existing from public.a7_orlando_invoice_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    select * into v_order from public.a7_orlando_orders where id = v_existing.order_id;
    v_preview := public.a7_orlando_w1c_b1_preview(v_order.id);
    if v_existing.action <> 'invoice_issued' or v_order.order_number <> p_order_number
      or v_existing.requested_version <> p_expected_invoice_version
      or v_existing.facts_hash <> v_preview->>'facts_hash'
      or v_existing.reason is distinct from v_reason then
      raise exception 'Idempotency key conflicts with another invoice action';
    end if;
    return jsonb_build_object('duplicate', true,
      'invoice', public.a7_orlando_w1c_b1_invoice_payload(v_existing.invoice_id));
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;
  if v_order.version <> p_expected_order_version then raise exception 'Order changed before invoice review'; end if;
  if v_order.order_status = 'cancelled' or v_order.production_state <> 'ready' then
    raise exception 'Order must be ready before invoice review';
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
    or exists (select 1 from public.a7_orlando_payments p where p.order_id = v_order.id and p.payment_link_id is not null) then
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

create or replace function public.a7_orlando_w1c_b1_void_invoice(
  p_order_number text,
  p_expected_invoice_version integer,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_current public.a7_orlando_invoices;
  v_existing public.a7_orlando_invoice_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if p_actor_role <> 'owner' or nullif(btrim(coalesce(p_actor_id, '')), '') is null then
    raise exception 'Owner authorization is required';
  end if;
  if v_reason is null or length(v_reason) > 240 then raise exception 'A valid void reason is required'; end if;
  select * into v_existing from public.a7_orlando_invoice_events where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    select * into v_order from public.a7_orlando_orders where id = v_existing.order_id;
    if v_existing.action <> 'invoice_voided' or v_order.order_number <> p_order_number
      or v_existing.requested_version <> p_expected_invoice_version or v_existing.reason <> v_reason then
      raise exception 'Idempotency key conflicts with another invoice action';
    end if;
    return jsonb_build_object('duplicate', true,
      'invoice', public.a7_orlando_w1c_b1_invoice_payload(v_existing.invoice_id));
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;
  if v_order.payment_status in ('paid', 'partially_refunded', 'refunded') then
    raise exception 'Paid invoice is immutable';
  end if;
  select * into v_current from public.a7_orlando_invoices
    where order_id = v_order.id and status = 'issued' for update;
  if v_current.id is null or v_current.version <> p_expected_invoice_version then
    raise exception 'Invoice version is stale';
  end if;
  if v_current.payment_link_id is not null
    or exists (select 1 from public.a7_orlando_payments p where p.order_id = v_order.id and p.payment_link_id is not null) then
    raise exception 'Linked invoice cannot be voided in W1C-B1';
  end if;

  update public.a7_orlando_invoices set status = 'void', voided_by = p_actor_id,
    voided_at = v_when, void_reason = v_reason, updated_at = now() where id = v_current.id;
  update public.a7_orlando_orders set current_invoice_id = null, invoice_id = null,
    service_amount = null, tip_amount = null, payment_status = 'void',
    updated_at = now(), version = version + 1 where id = v_order.id;
  insert into public.a7_orlando_invoice_events (
    order_id, invoice_id, action, actor_id, actor_role, idempotency_key,
    requested_version, invoice_version, facts_hash, reason, occurred_at
  ) values (
    v_order.id, v_current.id, 'invoice_voided', p_actor_id, p_actor_role, p_idempotency_key,
    p_expected_invoice_version, v_current.version, v_current.facts_hash, v_reason, v_when
  );
  return jsonb_build_object('duplicate', false,
    'invoice', public.a7_orlando_w1c_b1_invoice_payload(v_current.id));
end;
$$;

revoke all on function public.a7_orlando_w1c_b1_preview(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_b1_invoice_payload(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_b1_invoices(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_b1_review_invoice(text,integer,integer,text,text,text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_b1_void_invoice(text,integer,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1c_b1_preview(uuid) to service_role;
grant execute on function public.a7_orlando_w1c_b1_invoice_payload(uuid) to service_role;
grant execute on function public.a7_orlando_w1c_b1_invoices(text) to service_role;
grant execute on function public.a7_orlando_w1c_b1_review_invoice(text,integer,integer,text,text,text,text,timestamptz)
  to service_role;
grant execute on function public.a7_orlando_w1c_b1_void_invoice(text,integer,text,text,text,text,timestamptz)
  to service_role;
