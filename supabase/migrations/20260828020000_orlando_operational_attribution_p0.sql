-- A7 Laundry Orlando — Operational attribution P0
-- Durable attribution, lead/order lifecycle, immutable snapshots and financial idempotency.
-- Service-role only. Marketing attribution must never block order operations.

create extension if not exists pgcrypto;

create table if not exists public.a7_attribution_sessions (
  attribution_id text primary key check (attribution_id ~ '^at_[a-f0-9]{32}$'),
  short_ref text not null unique check (short_ref ~ '^[23456789A-HJ-NP-Z]{10}$'),
  first_touch jsonb not null,
  last_touch jsonb not null,
  consent_state text not null default 'unknown' check (consent_state in ('unknown', 'granted', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.a7_attribution_touch_keys (
  attribution_id text not null references public.a7_attribution_sessions(attribution_id) on delete cascade,
  touch_fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key (attribution_id, touch_fingerprint)
);

create table if not exists public.a7_attribution_metrics (
  metric_name text primary key,
  event_count bigint not null default 0 check (event_count >= 0),
  latency_total_ms bigint not null default 0 check (latency_total_ms >= 0),
  latency_samples bigint not null default 0 check (latency_samples >= 0),
  latency_max_ms integer not null default 0 check (latency_max_ms >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_leads (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null default 'orlando',
  idempotency_key text not null unique,
  conversation_id uuid references public.a7_wa_conversations(id) on delete set null,
  customer_id uuid references public.a7_wa_contacts(id) on delete set null,
  attribution_id text references public.a7_attribution_sessions(attribution_id) on delete set null,
  lead_reference text check (lead_reference is null or lead_reference ~ '^[23456789A-HJ-NP-Z]{10}$'),
  attribution_resolution text not null default 'unknown'
    check (attribution_resolution in ('attribution_id', 'short_ref', 'ctwa', 'prior_customer', 'unknown')),
  status text not null default 'new'
    check (status in ('new', 'qualifying', 'qualified', 'disqualified', 'lost', 'order_accepted')),
  lead_origin text not null check (lead_origin in ('order_form', 'whatsapp_inbound', 'manual')),
  service_type text,
  customer_type text not null default 'unknown'
    check (customer_type in ('guest', 'host', 'commercial', 'resident', 'unknown')),
  language text not null default 'unknown'
    check (language in ('en', 'pt', 'es', 'other', 'unknown')),
  accommodation_type text,
  service_area_bucket text,
  service_area_accepted boolean,
  timing_accepted boolean,
  minimum_basis_accepted boolean,
  disqualification_reason text,
  loss_reason text,
  operational_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  qualified_at timestamptz
);

create table if not exists public.a7_orlando_orders (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null default 'orlando',
  lead_id uuid not null unique references public.a7_orlando_leads(id) on delete restrict,
  customer_id uuid references public.a7_wa_contacts(id) on delete set null,
  order_number text unique,
  service_type text not null,
  customer_type text not null default 'unknown'
    check (customer_type in ('guest', 'host', 'commercial', 'resident', 'unknown')),
  service_tier text,
  pricing_model text not null default 'per_lb' check (pricing_model in ('per_lb', 'fixed')),
  order_status text not null default 'accepted'
    check (order_status in ('accepted', 'pickup_scheduled', 'picked_up', 'weighed', 'invoice_created', 'ready_for_delivery', 'delivered', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'invoice_created', 'paid', 'failed', 'void', 'partially_refunded', 'refunded')),
  accepted_at timestamptz not null,
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  picked_up_at timestamptz,
  estimated_lbs numeric check (estimated_lbs is null or estimated_lbs > 0),
  actual_lbs numeric check (actual_lbs is null or actual_lbs > 0),
  weighed_at timestamptz,
  delivered_at timestamptz,
  service_amount numeric check (service_amount is null or service_amount >= 0),
  tip_amount numeric check (tip_amount is null or tip_amount >= 0),
  currency text check (currency is null or currency = 'USD'),
  invoice_id text unique,
  payment_id text unique,
  paid_at timestamptz,
  attribution_confidence text not null default 'unattributed'
    check (attribution_confidence in ('deterministic', 'partial', 'unattributed')),
  is_repeat_customer boolean not null default false,
  customer_order_number integer check (customer_order_number is null or customer_order_number > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  check ((actual_lbs is null and weighed_at is null) or (actual_lbs is not null and weighed_at is not null)),
  check ((payment_status <> 'paid') or (payment_id is not null and service_amount is not null and currency is not null and paid_at is not null))
);

create table if not exists public.a7_orlando_attribution_snapshots (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.a7_orlando_orders(id) on delete cascade,
  attribution_id text references public.a7_attribution_sessions(attribution_id) on delete set null,
  lead_reference text,
  confidence text not null check (confidence in ('deterministic', 'partial', 'unattributed')),
  first_touch jsonb,
  last_touch jsonb,
  ga_client_id text,
  ga_session_id text,
  contract_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_order_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  idempotency_key text not null unique,
  event_name text not null
    check (event_name in ('generate_lead', 'qualified_guest_lead', 'order_accepted', 'pickup_completed', 'order_weighed', 'invoice_created', 'purchase', 'order_delivered', 'refund')),
  event_version integer not null default 1,
  source_system text not null
    check (source_system in ('website', 'whatsapp', 'crm', 'operations', 'stripe', 'reconciler')),
  lead_id uuid references public.a7_orlando_leads(id) on delete set null,
  order_id uuid references public.a7_orlando_orders(id) on delete cascade,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  schema_valid boolean not null default true
);

create table if not exists public.a7_orlando_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  provider text not null default 'stripe' check (provider = 'stripe'),
  transaction_id text not null unique check (transaction_id ~ '^pi_[A-Za-z0-9_]+$'),
  checkout_session_id text unique,
  payment_link_id text,
  amount numeric not null check (amount >= 0),
  currency text not null check (currency = 'USD'),
  status text not null check (status in ('paid', 'partially_refunded', 'refunded', 'failed')),
  paid_at timestamptz,
  refund_total numeric not null default 0 check (refund_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_stripe_events (
  stripe_event_id text primary key check (stripe_event_id ~ '^evt_[A-Za-z0-9_]+$'),
  event_type text not null,
  object_id text,
  order_id uuid references public.a7_orlando_orders(id) on delete set null,
  transaction_id text,
  status text not null check (status in ('processed', 'ignored', 'failed')),
  sanitized_payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_refunds (
  refund_id text primary key check (refund_id ~ '^re_[A-Za-z0-9_]+$'),
  payment_id uuid not null references public.a7_orlando_payments(id) on delete restrict,
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  transaction_id text not null,
  amount numeric not null check (amount > 0),
  currency text not null check (currency = 'USD'),
  status text not null check (status in ('created', 'succeeded', 'failed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_analytics_outbox (
  event_id text primary key references public.a7_orlando_order_events(event_id) on delete cascade,
  event_name text not null,
  client_id text,
  session_id text,
  safe_payload jsonb not null,
  delivery_status text not null
    check (delivery_status in ('pending_identity', 'pending', 'sent', 'failed', 'disabled')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists a7_orlando_leads_status_idx on public.a7_orlando_leads (status, created_at desc);
create index if not exists a7_orlando_orders_status_idx on public.a7_orlando_orders (order_status, payment_status, accepted_at desc);
create index if not exists a7_orlando_events_order_idx on public.a7_orlando_order_events (order_id, occurred_at);
create index if not exists a7_orlando_snapshots_confidence_idx on public.a7_orlando_attribution_snapshots (confidence, created_at desc);

alter table public.a7_attribution_sessions enable row level security;
alter table public.a7_attribution_touch_keys enable row level security;
alter table public.a7_attribution_metrics enable row level security;
alter table public.a7_orlando_leads enable row level security;
alter table public.a7_orlando_orders enable row level security;
alter table public.a7_orlando_attribution_snapshots enable row level security;
alter table public.a7_orlando_order_events enable row level security;
alter table public.a7_orlando_payments enable row level security;
alter table public.a7_orlando_stripe_events enable row level security;
alter table public.a7_orlando_refunds enable row level security;
alter table public.a7_orlando_analytics_outbox enable row level security;

revoke all on public.a7_attribution_sessions, public.a7_attribution_touch_keys, public.a7_attribution_metrics,
  public.a7_orlando_leads, public.a7_orlando_orders, public.a7_orlando_attribution_snapshots,
  public.a7_orlando_order_events, public.a7_orlando_payments, public.a7_orlando_stripe_events,
  public.a7_orlando_refunds, public.a7_orlando_analytics_outbox from anon, authenticated;
grant all on public.a7_attribution_sessions, public.a7_attribution_touch_keys, public.a7_attribution_metrics,
  public.a7_orlando_leads, public.a7_orlando_orders, public.a7_orlando_attribution_snapshots,
  public.a7_orlando_order_events, public.a7_orlando_payments, public.a7_orlando_stripe_events,
  public.a7_orlando_refunds, public.a7_orlando_analytics_outbox to service_role;

create or replace function public.a7_attribution_json(p_row public.a7_attribution_sessions)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'schema_version', 2,
    'version', 2,
    'attribution_id', p_row.attribution_id,
    'short_ref', p_row.short_ref,
    'first_touch', p_row.first_touch,
    'last_touch', p_row.last_touch,
    'consent_state', p_row.consent_state,
    'created_at', p_row.created_at,
    'updated_at', p_row.updated_at,
    'expires_at', p_row.expires_at
  );
$$;

create or replace function public.a7_get_attribution(p_attribution_id text)
returns jsonb language sql security definer set search_path = public as $$
  select public.a7_attribution_json(s) from public.a7_attribution_sessions s
  where s.attribution_id = p_attribution_id and s.expires_at > now();
$$;

create or replace function public.a7_get_attribution_by_short_ref(p_short_ref text)
returns jsonb language sql security definer set search_path = public as $$
  select public.a7_attribution_json(s) from public.a7_attribution_sessions s
  where s.short_ref = upper(p_short_ref) and s.expires_at > now();
$$;

create or replace function public.a7_upsert_attribution(
  p_attribution_id text,
  p_short_ref text,
  p_touch jsonb,
  p_touch_fingerprint text,
  p_consent_state text,
  p_expires_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row public.a7_attribution_sessions;
  v_new_touch boolean := false;
  v_touch_count integer := 0;
begin
  if p_attribution_id !~ '^at_[a-f0-9]{32}$'
    or upper(p_short_ref) !~ '^[23456789A-HJ-NP-Z]{10}$'
    or p_touch is null
    or coalesce(p_touch_fingerprint, '') = '' then
    raise exception 'Invalid attribution contract';
  end if;

  insert into public.a7_attribution_sessions (
    attribution_id, short_ref, first_touch, last_touch, consent_state, expires_at
  ) values (
    p_attribution_id, upper(p_short_ref), p_touch, p_touch,
    case when p_consent_state in ('granted', 'denied') then p_consent_state else 'unknown' end,
    p_expires_at
  ) on conflict (attribution_id) do nothing;

  insert into public.a7_attribution_touch_keys (attribution_id, touch_fingerprint)
  values (p_attribution_id, p_touch_fingerprint)
  on conflict do nothing;
  get diagnostics v_touch_count = row_count;
  v_new_touch := v_touch_count > 0;

  update public.a7_attribution_sessions
  set last_touch = case
        when v_new_touch and p_touch->>'entry_type' in ('campaign', 'referral') then p_touch
        else last_touch end,
      consent_state = case
        when p_consent_state in ('granted', 'denied') then p_consent_state
        else consent_state end,
      expires_at = case
        when v_new_touch and p_touch->>'entry_type' in ('campaign', 'referral') then p_expires_at
        else expires_at end,
      updated_at = now()
  where attribution_id = p_attribution_id
  returning * into v_row;

  return public.a7_attribution_json(v_row);
end;
$$;

create or replace function public.a7_record_attribution_metrics(p_metric_names text[], p_latency_ms integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  foreach v_name in array coalesce(p_metric_names, array[]::text[]) loop
    insert into public.a7_attribution_metrics (
      metric_name, event_count, latency_total_ms, latency_samples, latency_max_ms
    ) values (
      v_name, 1, coalesce(greatest(p_latency_ms, 0), 0),
      case when p_latency_ms is null then 0 else 1 end,
      coalesce(greatest(p_latency_ms, 0), 0)
    ) on conflict (metric_name) do update set
      event_count = a7_attribution_metrics.event_count + 1,
      latency_total_ms = a7_attribution_metrics.latency_total_ms + excluded.latency_total_ms,
      latency_samples = a7_attribution_metrics.latency_samples + excluded.latency_samples,
      latency_max_ms = greatest(a7_attribution_metrics.latency_max_ms, excluded.latency_max_ms),
      updated_at = now();
  end loop;
  return true;
end;
$$;

create or replace function public.a7_attribution_health()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true,
    'sessions', (select count(*) from public.a7_attribution_sessions where expires_at > now()),
    'checked_at', now()
  );
$$;

revoke all on function public.a7_get_attribution(text) from public, anon, authenticated;
revoke all on function public.a7_get_attribution_by_short_ref(text) from public, anon, authenticated;
revoke all on function public.a7_upsert_attribution(text,text,jsonb,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_record_attribution_metrics(text[],integer) from public, anon, authenticated;
revoke all on function public.a7_attribution_health() from public, anon, authenticated;
grant execute on function public.a7_get_attribution(text) to service_role;
grant execute on function public.a7_get_attribution_by_short_ref(text) to service_role;
grant execute on function public.a7_upsert_attribution(text,text,jsonb,text,text,timestamptz) to service_role;
grant execute on function public.a7_record_attribution_metrics(text[],integer) to service_role;
grant execute on function public.a7_attribution_health() to service_role;

create or replace function public.a7_orlando_create_lead(
  p_idempotency_key text,
  p_event_id text,
  p_lead_origin text,
  p_conversation_id uuid,
  p_customer_id uuid,
  p_attribution_id text,
  p_lead_reference text,
  p_attribution_resolution text,
  p_service_type text,
  p_customer_type text,
  p_language text,
  p_accommodation_type text,
  p_service_area_bucket text,
  p_operational_data jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_created boolean := false;
  v_ref text := nullif(upper(coalesce(p_lead_reference, '')), '');
begin
  if coalesce(p_idempotency_key, '') = '' or coalesce(p_event_id, '') = '' then
    raise exception 'Lead idempotency and event IDs are required';
  end if;
  if v_ref is not null and v_ref !~ '^[23456789A-HJ-NP-Z]{10}$' then
    raise exception 'Invalid lead reference';
  end if;

  insert into public.a7_orlando_leads (
    idempotency_key, conversation_id, customer_id, attribution_id, lead_reference,
    attribution_resolution, lead_origin, service_type, customer_type, language,
    accommodation_type, service_area_bucket, operational_data
  ) values (
    p_idempotency_key, p_conversation_id, p_customer_id, p_attribution_id, v_ref,
    coalesce(p_attribution_resolution, 'unknown'), p_lead_origin, p_service_type,
    coalesce(p_customer_type, 'unknown'), coalesce(p_language, 'unknown'),
    p_accommodation_type, p_service_area_bucket, coalesce(p_operational_data, '{}'::jsonb)
  ) on conflict (idempotency_key) do nothing
  returning * into v_lead;

  if v_lead.id is null then
    select * into v_lead from public.a7_orlando_leads where idempotency_key = p_idempotency_key;
  else
    v_created := true;
    insert into public.a7_orlando_order_events (
      event_id, idempotency_key, event_name, source_system, lead_id, occurred_at, payload
    ) values (
      p_event_id, 'event:' || p_idempotency_key, 'generate_lead',
      case when p_lead_origin = 'whatsapp_inbound' then 'whatsapp' else 'crm' end,
      v_lead.id, coalesce(p_occurred_at, now()),
      jsonb_build_object(
        'lead_id', v_lead.id,
        'lead_origin', v_lead.lead_origin,
        'lead_reference', v_lead.lead_reference,
        'service_type', v_lead.service_type,
        'customer_type', v_lead.customer_type,
        'attribution_resolution', v_lead.attribution_resolution
      )
    );
  end if;

  return jsonb_build_object('created', v_created, 'lead', to_jsonb(v_lead));
end;
$$;

create or replace function public.a7_orlando_qualify_lead(
  p_lead_id uuid,
  p_event_id text,
  p_idempotency_key text,
  p_service_type text,
  p_service_area_accepted boolean,
  p_timing_accepted boolean,
  p_minimum_basis_accepted boolean,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_lead public.a7_orlando_leads;
begin
  if not coalesce(p_service_area_accepted, false)
    or not coalesce(p_timing_accepted, false)
    or not coalesce(p_minimum_basis_accepted, false)
    or coalesce(p_service_type, '') = '' then
    raise exception 'Lead does not satisfy qualification contract';
  end if;
  if exists (select 1 from public.a7_orlando_order_events where idempotency_key = p_idempotency_key) then
    select * into v_lead from public.a7_orlando_leads where id = p_lead_id;
    return jsonb_build_object('duplicate', true, 'lead', to_jsonb(v_lead));
  end if;

  update public.a7_orlando_leads set
    status = 'qualified', service_type = p_service_type,
    service_area_accepted = true, timing_accepted = true, minimum_basis_accepted = true,
    qualified_at = coalesce(p_occurred_at, now()), updated_at = now()
  where id = p_lead_id and status in ('new', 'qualifying', 'qualified')
  returning * into v_lead;
  if v_lead.id is null then raise exception 'Lead cannot be qualified'; end if;

  insert into public.a7_orlando_order_events (
    event_id, idempotency_key, event_name, source_system, lead_id, occurred_at, payload
  ) values (
    p_event_id, p_idempotency_key, 'qualified_guest_lead', 'operations', v_lead.id,
    coalesce(p_occurred_at, now()),
    jsonb_build_object(
      'lead_id', v_lead.id, 'service_type', v_lead.service_type,
      'customer_type', v_lead.customer_type, 'service_area_accepted', true,
      'timing_accepted', true, 'minimum_basis_accepted', true
    )
  );
  return jsonb_build_object('duplicate', false, 'lead', to_jsonb(v_lead));
end;
$$;

create or replace function public.a7_orlando_accept_order(
  p_lead_id uuid,
  p_event_id text,
  p_idempotency_key text,
  p_service_type text,
  p_service_tier text,
  p_pricing_model text,
  p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz,
  p_estimated_lbs numeric,
  p_ga_client_id text,
  p_ga_session_id text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_order public.a7_orlando_orders;
  v_attribution public.a7_attribution_sessions;
  v_confidence text := 'unattributed';
  v_customer_order_number integer := 1;
begin
  if exists (select 1 from public.a7_orlando_order_events where idempotency_key = p_idempotency_key) then
    select o.* into v_order from public.a7_orlando_orders o where o.lead_id = p_lead_id;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(v_order));
  end if;

  select * into v_lead from public.a7_orlando_leads where id = p_lead_id for update;
  if v_lead.id is null or v_lead.status <> 'qualified' then raise exception 'Qualified lead required'; end if;
  if coalesce(p_service_type, '') = '' or p_pricing_model not in ('per_lb', 'fixed') then
    raise exception 'Invalid order contract';
  end if;
  if p_pickup_window_start is not null and p_pickup_window_end is not null
    and p_pickup_window_end <= p_pickup_window_start then raise exception 'Invalid pickup window'; end if;

  if v_lead.attribution_id is not null then
    select * into v_attribution from public.a7_attribution_sessions
    where attribution_id = v_lead.attribution_id and expires_at > now();
  elsif v_lead.lead_reference is not null then
    select * into v_attribution from public.a7_attribution_sessions
    where short_ref = v_lead.lead_reference and expires_at > now();
  end if;

  if v_attribution.attribution_id is not null then
    v_confidence := 'deterministic';
  elsif v_lead.attribution_resolution in ('ctwa', 'prior_customer') then
    v_confidence := 'partial';
  end if;

  if v_lead.customer_id is not null then
    select count(*)::integer + 1 into v_customer_order_number
    from public.a7_orlando_orders where customer_id = v_lead.customer_id;
  end if;

  insert into public.a7_orlando_orders (
    lead_id, customer_id, service_type, customer_type, service_tier, pricing_model,
    accepted_at, pickup_window_start, pickup_window_end, estimated_lbs,
    attribution_confidence, is_repeat_customer, customer_order_number
  ) values (
    v_lead.id, v_lead.customer_id, p_service_type, v_lead.customer_type,
    p_service_tier, p_pricing_model, coalesce(p_occurred_at, now()),
    p_pickup_window_start, p_pickup_window_end, p_estimated_lbs,
    v_confidence, v_customer_order_number > 1, v_customer_order_number
  ) returning * into v_order;

  insert into public.a7_orlando_attribution_snapshots (
    order_id, attribution_id, lead_reference, confidence, first_touch, last_touch,
    ga_client_id, ga_session_id
  ) values (
    v_order.id, v_attribution.attribution_id, v_lead.lead_reference, v_confidence,
    v_attribution.first_touch, v_attribution.last_touch,
    nullif(p_ga_client_id, ''), nullif(p_ga_session_id, '')
  );

  update public.a7_orlando_leads set status = 'order_accepted', updated_at = now()
  where id = v_lead.id;

  insert into public.a7_orlando_order_events (
    event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
  ) values (
    p_event_id, p_idempotency_key, 'order_accepted', 'operations', v_lead.id, v_order.id,
    v_order.accepted_at,
    jsonb_build_object(
      'lead_id', v_lead.id, 'order_id', v_order.id,
      'service_type', v_order.service_type, 'customer_type', v_order.customer_type,
      'is_repeat_customer', v_order.is_repeat_customer,
      'attribution_confidence', v_order.attribution_confidence
    )
  );

  insert into public.a7_orlando_analytics_outbox (
    event_id, event_name, client_id, session_id, safe_payload, delivery_status
  ) values (
    p_event_id, 'order_accepted', nullif(p_ga_client_id, ''), nullif(p_ga_session_id, ''),
    jsonb_build_object(
      'lead_id', v_lead.id, 'order_id', v_order.id,
      'service_type', v_order.service_type, 'customer_type', v_order.customer_type,
      'service_area_bucket', v_lead.service_area_bucket,
      'is_repeat_customer', v_order.is_repeat_customer,
      'attribution_confidence', v_order.attribution_confidence
    ), case when nullif(p_ga_client_id, '') is null then 'pending_identity' else 'pending' end
  );
  return jsonb_build_object('duplicate', false, 'order', to_jsonb(v_order));
end;
$$;

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

create or replace function public.a7_orlando_record_payment(
  p_stripe_event_id text,
  p_order_id uuid,
  p_transaction_id text,
  p_checkout_session_id text,
  p_payment_link_id text,
  p_amount numeric,
  p_currency text,
  p_paid_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_payment public.a7_orlando_payments;
  v_event_id text := 'purchase:' || p_transaction_id;
  v_inserted boolean := false;
begin
  if p_stripe_event_id !~ '^evt_[A-Za-z0-9_]+$' or p_transaction_id !~ '^pi_[A-Za-z0-9_]+$'
    or p_amount is null or p_amount < 0 or upper(p_currency) <> 'USD' then
    raise exception 'Invalid Stripe payment contract';
  end if;
  if exists (select 1 from public.a7_orlando_stripe_events where stripe_event_id = p_stripe_event_id) then
    select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id;
    return jsonb_build_object('duplicate', true, 'payment', to_jsonb(v_payment));
  end if;

  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null or v_order.invoice_id is null then raise exception 'Invoiced order required'; end if;
  if v_order.service_amount <> p_amount then raise exception 'Payment amount does not match invoiced service amount'; end if;

  insert into public.a7_orlando_payments (
    order_id, transaction_id, checkout_session_id, payment_link_id, amount, currency, status, paid_at
  ) values (
    p_order_id, p_transaction_id, p_checkout_session_id, p_payment_link_id,
    p_amount, 'USD', 'paid', coalesce(p_paid_at, now())
  ) on conflict (transaction_id) do nothing returning * into v_payment;

  if v_payment.id is null then
    select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id;
    if v_payment.order_id <> p_order_id or v_payment.amount <> p_amount or v_payment.currency <> 'USD' then
      raise exception 'Payment intent conflicts with the existing sale';
    end if;
  else
    v_inserted := true;
    update public.a7_orlando_orders set payment_status = 'paid', payment_id = p_transaction_id,
      paid_at = v_payment.paid_at, updated_at = now(), version = version + 1
    where id = p_order_id returning * into v_order;

    insert into public.a7_orlando_order_events (
      event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
    ) values (
      v_event_id, v_event_id, 'purchase', 'stripe', v_order.lead_id, v_order.id,
      v_payment.paid_at,
      jsonb_build_object(
        'transaction_id', p_transaction_id, 'order_id', v_order.id,
        'value', p_amount, 'currency', 'USD', 'service_type', v_order.service_type,
        'customer_type', v_order.customer_type, 'is_repeat_customer', v_order.is_repeat_customer,
        'attribution_confidence', v_order.attribution_confidence,
        'items', jsonb_build_array(jsonb_build_object('item_id', v_order.service_type, 'item_name', v_order.service_type))
      )
    );

    insert into public.a7_orlando_analytics_outbox (
      event_id, event_name, client_id, session_id, safe_payload, delivery_status
    )
    select v_event_id, 'purchase', s.ga_client_id, s.ga_session_id, e.payload,
      case when s.ga_client_id is null then 'pending_identity' else 'pending' end
    from public.a7_orlando_order_events e
    join public.a7_orlando_attribution_snapshots s on s.order_id = e.order_id
    where e.event_id = v_event_id;
  end if;

  insert into public.a7_orlando_stripe_events (
    stripe_event_id, event_type, object_id, order_id, transaction_id, status, sanitized_payload
  ) values (
    p_stripe_event_id, 'checkout.session.completed', p_checkout_session_id,
    p_order_id, p_transaction_id, case when v_inserted then 'processed' else 'ignored' end,
    jsonb_build_object('amount', p_amount, 'currency', 'USD')
  );
  return jsonb_build_object('duplicate', not v_inserted, 'payment', to_jsonb(v_payment));
end;
$$;

create or replace function public.a7_orlando_record_refund(
  p_stripe_event_id text,
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
  if exists (select 1 from public.a7_orlando_stripe_events where stripe_event_id = p_stripe_event_id)
    or exists (select 1 from public.a7_orlando_refunds where refund_id = p_refund_id) then
    select * into v_refund from public.a7_orlando_refunds where refund_id = p_refund_id;
    return jsonb_build_object('duplicate', true, 'refund', to_jsonb(v_refund));
  end if;
  if p_refund_id !~ '^re_[A-Za-z0-9_]+$' or p_transaction_id !~ '^pi_[A-Za-z0-9_]+$'
    or p_amount is null or p_amount <= 0 or upper(p_currency) <> 'USD' then
    raise exception 'Invalid Stripe refund contract';
  end if;
  select * into v_payment from public.a7_orlando_payments where transaction_id = p_transaction_id for update;
  if v_payment.id is null then raise exception 'Original payment not found'; end if;
  select * into v_order from public.a7_orlando_orders where id = v_payment.order_id for update;

  insert into public.a7_orlando_refunds (
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
    payment_status = case when v_total = 0 then payment_status when v_total >= service_amount then 'refunded' else 'partially_refunded' end,
    updated_at = now(), version = version + 1 where id = v_order.id returning * into v_order;

  insert into public.a7_orlando_order_events (
    event_id, idempotency_key, event_name, source_system, lead_id, order_id, occurred_at, payload
  ) values (
    v_event_id, v_event_id, 'refund', 'stripe', v_order.lead_id, v_order.id,
    coalesce(p_occurred_at, now()),
    jsonb_build_object('transaction_id', p_transaction_id, 'order_id', v_order.id,
      'value', p_amount, 'currency', 'USD')
  );
  insert into public.a7_orlando_analytics_outbox (
    event_id, event_name, client_id, session_id, safe_payload, delivery_status
  )
  select v_event_id, 'refund', s.ga_client_id, s.ga_session_id, e.payload,
    case when s.ga_client_id is null then 'pending_identity' else 'pending' end
  from public.a7_orlando_order_events e
  join public.a7_orlando_attribution_snapshots s on s.order_id = e.order_id
  where e.event_id = v_event_id;
  insert into public.a7_orlando_stripe_events (
    stripe_event_id, event_type, object_id, order_id, transaction_id, status, sanitized_payload
  ) values (
    p_stripe_event_id, 'refund.created', p_refund_id, v_order.id, p_transaction_id,
    'processed', jsonb_build_object('amount', p_amount, 'currency', 'USD', 'status', p_status)
  );
  return jsonb_build_object('duplicate', false, 'refund', to_jsonb(v_refund));
end;
$$;

create or replace function public.a7_orlando_mark_outbox(
  p_event_id text,
  p_delivery_status text,
  p_last_error_code text,
  p_sent_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.a7_orlando_analytics_outbox;
begin
  if p_delivery_status not in ('pending_identity', 'pending', 'sent', 'failed', 'disabled') then
    raise exception 'Invalid outbox delivery status';
  end if;
  update public.a7_orlando_analytics_outbox set
    delivery_status = p_delivery_status,
    attempts = attempts + 1,
    last_attempt_at = now(),
    last_error_code = nullif(p_last_error_code, ''),
    sent_at = case when p_delivery_status = 'sent' then coalesce(p_sent_at, now()) else sent_at end
  where event_id = p_event_id
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.a7_orlando_create_lead(text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_qualify_lead(uuid,text,text,text,boolean,boolean,boolean,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_accept_order(uuid,text,text,text,text,text,timestamptz,timestamptz,numeric,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_payment(text,uuid,text,text,text,numeric,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_refund(text,text,text,numeric,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_mark_outbox(text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.a7_orlando_create_lead(text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,jsonb,timestamptz) to service_role;
grant execute on function public.a7_orlando_qualify_lead(uuid,text,text,text,boolean,boolean,boolean,timestamptz) to service_role;
grant execute on function public.a7_orlando_accept_order(uuid,text,text,text,text,text,timestamptz,timestamptz,numeric,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_payment(text,uuid,text,text,text,numeric,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_record_refund(text,text,text,numeric,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_mark_outbox(text,text,text,timestamptz) to service_role;
