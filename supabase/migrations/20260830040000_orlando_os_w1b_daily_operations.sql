-- A7 Orlando OS W1B — daily operations, custody, production and governed Express SLA.
-- Additive and service-role only. Historical state is deliberately left null.

alter table public.a7_orlando_orders
  add column if not exists custody_state text,
  add column if not exists production_state text,
  add column if not exists promised_by timestamptz,
  add column if not exists promise_version integer not null default 0,
  add column if not exists operational_waiting_since timestamptz;

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_custody_state_valid check (
    custody_state is null or custody_state in (
      'with_customer', 'awaiting_pickup', 'with_driver_pickup', 'at_laundry',
      'with_driver_delivery', 'bell_desk', 'delivered'
    )
  ) not valid,
  add constraint a7_orlando_orders_production_state_valid check (
    production_state is null or production_state in (
      'awaiting_intake', 'awaiting_weight', 'awaiting_processing', 'processing', 'ready'
    )
  ) not valid,
  add constraint a7_orlando_orders_promise_version_valid check (promise_version >= 0) not valid;

alter table public.a7_orlando_orders validate constraint a7_orlando_orders_custody_state_valid;
alter table public.a7_orlando_orders validate constraint a7_orlando_orders_production_state_valid;
alter table public.a7_orlando_orders validate constraint a7_orlando_orders_promise_version_valid;

create table if not exists public.a7_orlando_operation_settings (
  unit_key text primary key check (unit_key = 'orlando'),
  timezone text not null default 'America/New_York' check (timezone = 'America/New_York'),
  express_sla_status text not null default 'pending_approval'
    check (express_sla_status in ('pending_approval', 'approved')),
  express_attention_minutes integer,
  express_risk_minutes integer,
  updated_at timestamptz not null default now(),
  updated_by text,
  check (
    (express_sla_status = 'pending_approval' and express_attention_minutes is null and express_risk_minutes is null)
    or (express_sla_status = 'approved' and express_attention_minutes > express_risk_minutes
      and express_risk_minutes > 0)
  )
);

insert into public.a7_orlando_operation_settings (
  unit_key, timezone, express_sla_status, express_attention_minutes, express_risk_minutes, updated_by
) values ('orlando', 'America/New_York', 'approved', 240, 120, 'owner')
on conflict (unit_key) do nothing;

create table if not exists public.a7_orlando_operational_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete cascade,
  action text not null check (action in (
    'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
    'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by'
  )),
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  previous_state jsonb not null,
  new_state jsonb not null,
  reason text,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists a7_orlando_operational_events_order_idx
  on public.a7_orlando_operational_events (order_id, occurred_at, id);
create index if not exists a7_orlando_orders_daily_operations_idx
  on public.a7_orlando_orders (custody_state, production_state, promised_by, operational_waiting_since)
  where order_status not in ('delivered', 'cancelled');

alter table public.a7_orlando_operation_settings enable row level security;
alter table public.a7_orlando_operational_events enable row level security;
revoke all on public.a7_orlando_operation_settings, public.a7_orlando_operational_events
  from public, anon, authenticated;
grant all on public.a7_orlando_operation_settings, public.a7_orlando_operational_events to service_role;

create or replace function public.a7_orlando_w1b_initialize_new_order()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.unit_key = 'orlando' then
    new.custody_state := coalesce(new.custody_state, 'with_customer');
    new.production_state := coalesce(new.production_state, 'awaiting_intake');
    new.operational_waiting_since := coalesce(new.operational_waiting_since, new.accepted_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists a7_orlando_w1b_initialize_new_order on public.a7_orlando_orders;
create trigger a7_orlando_w1b_initialize_new_order
before insert on public.a7_orlando_orders
for each row execute function public.a7_orlando_w1b_initialize_new_order();

create or replace function public.a7_orlando_w1b_order_payload(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'order_number', o.order_number,
    'order_status', o.order_status,
    'payment_status', o.payment_status,
    'customer_name', c.profile_name,
    'whatsapp_last4', right(c.wa_id, 4),
    'property', l.operational_data->>'property',
    'room', l.operational_data->>'room',
    'accommodation_type', l.accommodation_type,
    'service_tier', coalesce(o.service_tier, 'normal'),
    'custody_state', o.custody_state,
    'production_state', o.production_state,
    'accepted_at', o.accepted_at,
    'pickup_window_start', o.pickup_window_start,
    'pickup_window_end', o.pickup_window_end,
    'needed_by', l.operational_data->>'needed_by',
    'promised_by', o.promised_by,
    'operational_waiting_since', o.operational_waiting_since,
    'estimated_lbs', o.estimated_lbs,
    'bags_expected', coalesce(o.bags_expected, nullif(l.operational_data->>'bags_expected', '')::integer),
    'special_instructions', l.operational_data->>'order_notes',
    'is_qa', public.a7_orlando_order_is_qa(o.id),
    'version', o.version,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', i.label, 'unit', i.unit, 'quantity', i.quantity,
        'estimated_lbs', i.estimated_lbs, 'requires_manual_review', i.requires_manual_review
      ) order by i.created_at, i.id)
      from public.a7_orlando_order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
        'occurred_at', timeline.occurred_at,
        'action', timeline.action,
        'actor_label', timeline.actor_label
      ) order by timeline.occurred_at, timeline.sort_id)
      from (
        select e.occurred_at, e.event_name as action, null::text as actor_label, e.id::text as sort_id
        from public.a7_orlando_order_events e where e.order_id = o.id
        union all
        select e.occurred_at, e.action, 'Owner'::text, e.id::text
        from public.a7_orlando_operational_events e where e.order_id = o.id
      ) timeline
    ), '[]'::jsonb)
  ) into v_result
  from public.a7_orlando_orders o
  join public.a7_orlando_leads l on l.id = o.lead_id
  left join public.a7_wa_contacts c on c.id = o.customer_id
  where o.id = p_order_id and o.unit_key = 'orlando' and o.order_number is not null;
  return v_result;
end;
$$;

create or replace function public.a7_orlando_w1b_snapshot()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_settings public.a7_orlando_operation_settings;
  v_orders jsonb;
  v_waiting integer;
  v_waiting_leads jsonb;
begin
  select * into v_settings from public.a7_orlando_operation_settings where unit_key = 'orlando';
  select coalesce(jsonb_agg(public.a7_orlando_w1b_order_payload(rows.id)
    order by rows.accepted_at desc, rows.id), '[]'::jsonb) into v_orders
  from (
    select id, accepted_at from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number is not null
    order by accepted_at desc, id
  ) rows;
  select coalesce(jsonb_agg(jsonb_build_object(
    'customer_name', waiting.profile_name,
    'whatsapp_last4', right(waiting.wa_id, 4),
    'property', waiting.property,
    'customer_type', waiting.customer_type,
    'created_at', waiting.created_at,
    'status', waiting.status
  ) order by waiting.created_at), '[]'::jsonb) into v_waiting_leads
  from (
    select c.profile_name, c.wa_id, l.operational_data->>'property' as property,
      l.customer_type, l.created_at, l.status
    from public.a7_orlando_leads l
    left join public.a7_wa_contacts c on c.id = l.customer_id
    where l.status in ('new', 'qualifying', 'qualified')
      and not exists (select 1 from public.a7_orlando_orders o where o.lead_id = l.id)
      and coalesce(concat_ws(' ', c.profile_name, l.operational_data->>'order_notes',
        l.operational_data->>'property'), '') !~* '(^|[^A-Z0-9])(QA|DO NOT FULFILL|DO NOT DISPATCH)([^A-Z0-9]|$)'
  ) waiting;
  v_waiting := jsonb_array_length(v_waiting_leads);
  return jsonb_build_object(
    'settings', jsonb_build_object(
      'timezone', coalesce(v_settings.timezone, 'America/New_York'),
      'status', coalesce(v_settings.express_sla_status, 'pending_approval'),
      'attention_minutes', v_settings.express_attention_minutes,
      'risk_minutes', v_settings.express_risk_minutes
    ),
    'waiting_confirmation', v_waiting,
    'waiting_leads', v_waiting_leads,
    'orders', v_orders
  );
end;
$$;

create or replace function public.a7_orlando_w1b_order(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.a7_orlando_w1b_order_payload(o.id)
  from public.a7_orlando_orders o
  where o.unit_key = 'orlando' and o.order_number = p_order_number
  limit 1;
$$;

create or replace function public.a7_orlando_w1b_transition(
  p_order_number text,
  p_action text,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_promised_by timestamptz,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_order_id uuid;
  v_existing public.a7_orlando_operational_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_previous jsonb;
  v_new jsonb;
  v_lifecycle jsonb;
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner'
    or coalesce(p_idempotency_key, '') = '' then raise exception 'Invalid Owner transition contract'; end if;
  if p_action not in (
    'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
    'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by'
  ) then raise exception 'Operational action is invalid'; end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  v_order_id := v_order.id;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;

  -- Serialize per order before resolving idempotency so a concurrent retry observes
  -- the committed event from the first writer rather than validating stale state.
  select * into v_existing from public.a7_orlando_operational_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.action <> p_action or v_existing.order_id <> v_order.id then
      raise exception 'Idempotency key conflicts with another operational transition';
    end if;
    return jsonb_build_object('duplicate', true, 'order', public.a7_orlando_w1b_order_payload(v_order.id));
  end if;

  v_previous := jsonb_build_object(
    'order_status', v_order.order_status, 'custody_state', v_order.custody_state,
    'production_state', v_order.production_state, 'promised_by', v_order.promised_by
  );

  case p_action
    when 'schedule_pickup' then
      if v_order.order_status <> 'accepted'
        or v_order.custody_state not in ('with_customer', 'awaiting_pickup') then
        raise exception 'Pickup cannot be scheduled from the current state';
      end if;
      v_lifecycle := public.a7_orlando_record_transition(
        v_order.id, 'pickup_scheduled', 'pickup_scheduled:' || md5(p_idempotency_key),
        p_idempotency_key || ':lifecycle', 'operations',
        jsonb_build_object('pickup_window_start', v_order.pickup_window_start,
          'pickup_window_end', v_order.pickup_window_end), v_when
      );
      update public.a7_orlando_orders set custody_state = 'awaiting_pickup',
        operational_waiting_since = v_when, updated_at = now(), version = version + 1
        where id = v_order.id;
    when 'confirm_pickup' then
      if v_order.order_status <> 'pickup_scheduled' or v_order.custody_state <> 'awaiting_pickup' then
        raise exception 'Pickup cannot be confirmed from the current state';
      end if;
      v_lifecycle := public.a7_orlando_record_transition(
        v_order.id, 'pickup_completed', 'pickup_completed:' || md5(p_idempotency_key),
        p_idempotency_key || ':lifecycle', 'operations', '{}'::jsonb, v_when
      );
      update public.a7_orlando_orders set custody_state = 'with_driver_pickup',
        production_state = 'awaiting_intake', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'receive_at_laundry' then
      if v_order.order_status <> 'picked_up' or v_order.custody_state <> 'with_driver_pickup' then
        raise exception 'Order cannot be received from the current state';
      end if;
      update public.a7_orlando_orders set custody_state = 'at_laundry',
        production_state = 'awaiting_weight', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'start_processing' then
      if v_order.custody_state <> 'at_laundry' or v_order.production_state <> 'awaiting_processing' then
        raise exception 'Processing cannot start from the current state';
      end if;
      update public.a7_orlando_orders set production_state = 'processing', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'mark_ready' then
      if v_order.custody_state <> 'at_laundry' or v_order.production_state <> 'processing' then
        raise exception 'Order cannot be marked ready from the current state';
      end if;
      if v_order.payment_status = 'paid' and v_order.order_status = 'invoice_created' then
        v_lifecycle := public.a7_orlando_record_transition(
          v_order.id, 'order_ready_for_delivery', 'order_ready_for_delivery:' || md5(p_idempotency_key),
          p_idempotency_key || ':lifecycle', 'operations', '{}'::jsonb, v_when
        );
      end if;
      update public.a7_orlando_orders set production_state = 'ready', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'start_delivery' then
      if v_order.production_state <> 'ready' or v_order.payment_status <> 'paid'
        or v_order.custody_state <> 'at_laundry'
        or v_order.order_status not in ('invoice_created', 'ready_for_delivery') then
        raise exception 'Delivery cannot start from the current state';
      end if;
      if v_order.order_status = 'invoice_created' then
        v_lifecycle := public.a7_orlando_record_transition(
          v_order.id, 'order_ready_for_delivery', 'order_ready_for_delivery:' || md5(p_idempotency_key),
          p_idempotency_key || ':lifecycle', 'operations', '{}'::jsonb, v_when
        );
      end if;
      update public.a7_orlando_orders set custody_state = 'with_driver_delivery',
        operational_waiting_since = v_when, updated_at = now(), version = version + 1 where id = v_order.id;
    when 'leave_bell_desk' then
      if v_order.production_state <> 'ready' or v_order.custody_state <> 'with_driver_delivery' then
        raise exception 'Bell Desk handoff is unavailable from the current state';
      end if;
      update public.a7_orlando_orders set custody_state = 'bell_desk', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'complete_delivery' then
      if v_order.production_state <> 'ready' or v_order.payment_status <> 'paid'
        or v_order.custody_state not in ('with_driver_delivery', 'bell_desk') then
        raise exception 'Delivery cannot be completed from the current state';
      end if;
      v_lifecycle := public.a7_orlando_record_transition(
        v_order.id, 'order_delivered', 'order_delivered:' || md5(p_idempotency_key),
        p_idempotency_key || ':lifecycle', 'operations', '{}'::jsonb, v_when
      );
      update public.a7_orlando_orders set custody_state = 'delivered', operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    when 'set_promised_by' then
      if v_order.service_tier <> 'express' or p_promised_by is null then
        raise exception 'Express promise is invalid';
      end if;
      if v_order.promised_by is not null and nullif(btrim(coalesce(p_reason, '')), '') is null then
        raise exception 'A reason is required to correct promised-by';
      end if;
      update public.a7_orlando_orders set promised_by = p_promised_by,
        promise_version = promise_version + 1, operational_waiting_since = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
  end case;

  select * into v_order from public.a7_orlando_orders current_order where current_order.id = v_order_id;
  v_new := jsonb_build_object(
    'order_status', v_order.order_status, 'custody_state', v_order.custody_state,
    'production_state', v_order.production_state, 'promised_by', v_order.promised_by
  );
  insert into public.a7_orlando_operational_events (
    order_id, action, actor_id, actor_role, idempotency_key, previous_state, new_state, reason, occurred_at
  ) values (
    v_order.id, p_action, p_actor_id, p_actor_role, p_idempotency_key,
    v_previous, v_new, nullif(btrim(coalesce(p_reason, '')), ''), v_when
  );
  insert into public.a7_orlando_operator_audit (
    actor_id, actor_role, action, entity_type, entity_id, idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, p_actor_role, 'w1b_' || p_action, 'order', v_order.id, p_idempotency_key,
    jsonb_build_object('order_number', v_order.order_number, 'previous', v_previous, 'new', v_new), v_when
  );
  return jsonb_build_object('duplicate', false, 'order', public.a7_orlando_w1b_order_payload(v_order.id));
end;
$$;

revoke all on function public.a7_orlando_w1b_order_payload(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1b_snapshot() from public, anon, authenticated;
revoke all on function public.a7_orlando_w1b_order(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1b_transition(text,text,text,text,text,text,timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1b_order_payload(uuid) to service_role;
grant execute on function public.a7_orlando_w1b_snapshot() to service_role;
grant execute on function public.a7_orlando_w1b_order(text) to service_role;
grant execute on function public.a7_orlando_w1b_transition(text,text,text,text,text,text,timestamptz,timestamptz)
  to service_role;

comment on table public.a7_orlando_operational_events
  is 'W1B append-only custody/production/SLA timeline; service-role only.';
comment on table public.a7_orlando_operation_settings
  is 'Governed W1B settings. Express thresholds remain null until explicit Owner approval.';
comment on function public.a7_orlando_w1b_transition(text,text,text,text,text,text,timestamptz,timestamptz)
  is 'Owner-only W1B atomic/idempotent transition; reuses the existing lifecycle contract.';
