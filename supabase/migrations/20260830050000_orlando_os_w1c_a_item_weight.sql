-- A7 Orlando OS W1C-A — actual weight per order item.
-- Additive, service-role only and intentionally excludes invoice/payment behavior.

alter table public.a7_orlando_order_items
  add column if not exists actual_lbs numeric,
  add column if not exists weighed_at timestamptz,
  add column if not exists subtotal numeric,
  add column if not exists weight_version integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'a7_orlando_order_items_actual_weight_valid'
  ) then
    alter table public.a7_orlando_order_items
      add constraint a7_orlando_order_items_actual_weight_valid check (
        (unit = 'lb' and (
          (actual_lbs is null and weighed_at is null)
          or (actual_lbs > 0 and weighed_at is not null)
        ))
        or (unit <> 'lb' and actual_lbs is null and weighed_at is null)
      ) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'a7_orlando_order_items_subtotal_valid'
  ) then
    alter table public.a7_orlando_order_items
      add constraint a7_orlando_order_items_subtotal_valid check (
        subtotal is null or subtotal >= 0
      ) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'a7_orlando_order_items_weight_version_valid'
  ) then
    alter table public.a7_orlando_order_items
      add constraint a7_orlando_order_items_weight_version_valid check (
        weight_version >= 0
      ) not valid;
  end if;
end;
$$;

alter table public.a7_orlando_order_items
  validate constraint a7_orlando_order_items_actual_weight_valid;
alter table public.a7_orlando_order_items
  validate constraint a7_orlando_order_items_subtotal_valid;
alter table public.a7_orlando_order_items
  validate constraint a7_orlando_order_items_weight_version_valid;

create table if not exists public.a7_orlando_item_weight_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete cascade,
  order_item_id uuid not null references public.a7_orlando_order_items(id) on delete cascade,
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  requested_version integer not null check (requested_version >= 0),
  previous_actual_lbs numeric,
  actual_lbs numeric not null check (actual_lbs > 0),
  previous_subtotal numeric,
  subtotal numeric,
  reason text,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists a7_orlando_item_weight_events_order_idx
  on public.a7_orlando_item_weight_events (order_id, occurred_at, id);
create index if not exists a7_orlando_item_weight_events_item_idx
  on public.a7_orlando_item_weight_events (order_item_id, occurred_at, id);

alter table public.a7_orlando_item_weight_events enable row level security;
revoke all on public.a7_orlando_item_weight_events from public, anon, authenticated;
grant all on public.a7_orlando_item_weight_events to service_role;

comment on table public.a7_orlando_item_weight_events is
  'Append-only W1C-A item weight evidence. Contains operational IDs and weight facts only; no customer PII.';
comment on column public.a7_orlando_order_items.actual_lbs is
  'Confirmed actual weight for a per-pound item. Fixed-price items remain null.';
comment on column public.a7_orlando_order_items.subtotal is
  'Server-derived item subtotal snapshot. Invoice authority remains outside W1C-A.';

create or replace function public.a7_orlando_w1c_a_skip_weight_when_not_required()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.unit_key = 'orlando'
    and new.production_state = 'awaiting_weight'
    and old.production_state is distinct from new.production_state
    and not exists (
      select 1 from public.a7_orlando_order_items i
      where i.order_id = new.id and i.unit = 'lb'
    ) then
    new.production_state := 'awaiting_processing';
  end if;
  return new;
end;
$$;

drop trigger if exists a7_orlando_w1c_a_skip_weight_when_not_required on public.a7_orlando_orders;
create trigger a7_orlando_w1c_a_skip_weight_when_not_required
before update of production_state on public.a7_orlando_orders
for each row execute function public.a7_orlando_w1c_a_skip_weight_when_not_required();

create or replace function public.a7_orlando_w1c_a_order_payload(p_order_id uuid)
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
    'actual_lbs', o.actual_lbs,
    'weighed_at', o.weighed_at,
    'bags_expected', coalesce(o.bags_expected, nullif(l.operational_data->>'bags_expected', '')::integer),
    'special_instructions', l.operational_data->>'order_notes',
    'is_qa', public.a7_orlando_order_is_qa(o.id),
    'version', o.version,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', i.id,
        'catalog_code', i.catalog_code,
        'service_type', i.service_type,
        'label', i.label,
        'unit', i.unit,
        'quantity', i.quantity,
        'estimated_lbs', i.estimated_lbs,
        'unit_price', i.unit_price,
        'minimum_amount', i.minimum_amount,
        'actual_lbs', i.actual_lbs,
        'weighed_at', i.weighed_at,
        'subtotal', case
          when i.unit = 'lb' then i.subtotal
          when i.quantity is not null and i.unit_price is not null and not i.requires_manual_review
            then round(i.quantity * i.unit_price, 2)
          else null
        end,
        'requires_manual_review', i.requires_manual_review,
        'weight_version', i.weight_version
      ) order by i.created_at, i.id)
      from public.a7_orlando_order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'weight_progress', (
      select jsonb_build_object(
        'required', count(*) filter (where i.unit = 'lb'),
        'completed', count(*) filter (where i.unit = 'lb' and i.actual_lbs is not null),
        'pending', count(*) filter (where i.unit = 'lb' and i.actual_lbs is null),
        'complete', count(*) filter (where i.unit = 'lb') > 0
          and count(*) filter (where i.unit = 'lb' and i.actual_lbs is null) = 0
      ) from public.a7_orlando_order_items i where i.order_id = o.id
    ),
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
        union all
        select e.occurred_at,
          case when e.previous_actual_lbs is null then 'item_weight_recorded' else 'item_weight_corrected' end,
          'Owner'::text, e.id::text
        from public.a7_orlando_item_weight_events e where e.order_id = o.id
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

create or replace function public.a7_orlando_w1c_a_order(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.a7_orlando_w1c_a_order_payload(o.id)
  from public.a7_orlando_orders o
  where o.unit_key = 'orlando' and o.order_number = p_order_number
  limit 1;
$$;

create or replace function public.a7_orlando_w1c_a_snapshot()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_settings public.a7_orlando_operation_settings;
  v_orders jsonb;
  v_waiting_leads jsonb;
begin
  select * into v_settings from public.a7_orlando_operation_settings where unit_key = 'orlando';
  select coalesce(jsonb_agg(public.a7_orlando_w1c_a_order_payload(rows.id)
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
  return jsonb_build_object(
    'settings', jsonb_build_object(
      'timezone', coalesce(v_settings.timezone, 'America/New_York'),
      'status', coalesce(v_settings.express_sla_status, 'pending_approval'),
      'attention_minutes', v_settings.express_attention_minutes,
      'risk_minutes', v_settings.express_risk_minutes
    ),
    'waiting_confirmation', jsonb_array_length(v_waiting_leads),
    'waiting_leads', v_waiting_leads,
    'orders', v_orders
  );
end;
$$;

create or replace function public.a7_orlando_w1c_a_record_item_weight(
  p_order_number text,
  p_order_item_id uuid,
  p_actual_lbs numeric,
  p_expected_weight_version integer,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_item public.a7_orlando_order_items;
  v_existing public.a7_orlando_item_weight_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_subtotal numeric;
  v_total_lbs numeric;
  v_pending integer;
  v_lifecycle jsonb;
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner'
    or coalesce(p_idempotency_key, '') = '' or p_expected_weight_version is null
    or p_expected_weight_version < 0 or p_actual_lbs is null or p_actual_lbs <= 0 then
    raise exception 'Invalid item weight contract';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;
  if v_order.custody_state <> 'at_laundry' or v_order.production_state not in ('awaiting_weight', 'awaiting_processing')
    or v_order.order_status not in ('picked_up', 'weighed') then
    raise exception 'Weight is unavailable from the current state';
  end if;

  select * into v_item from public.a7_orlando_order_items
    where id = p_order_item_id and order_id = v_order.id for update;
  if v_item.id is null then raise exception 'Order item not found'; end if;
  if v_item.unit <> 'lb' then raise exception 'Only per-pound items can be weighed'; end if;

  select * into v_existing from public.a7_orlando_item_weight_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.order_item_id <> v_item.id
      or v_existing.actual_lbs <> p_actual_lbs
      or v_existing.requested_version <> p_expected_weight_version
      or coalesce(v_existing.reason, '') <> coalesce(nullif(btrim(p_reason), ''), '') then
      raise exception 'Idempotency key conflicts with another item weight';
    end if;
    return jsonb_build_object('duplicate', true,
      'complete', v_order.order_status = 'weighed',
      'order', public.a7_orlando_w1c_a_order_payload(v_order.id));
  end if;

  if v_item.weight_version <> p_expected_weight_version then
    raise exception 'Item weight version conflict';
  end if;
  if v_item.actual_lbs is not null and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'A reason is required to correct item weight';
  end if;
  if v_order.order_status = 'weighed' and v_order.production_state <> 'awaiting_processing' then
    raise exception 'Weight correction is unavailable after processing starts';
  end if;

  v_subtotal := case
    when v_item.unit_price is not null and not v_item.requires_manual_review
      then round(p_actual_lbs * v_item.unit_price, 2)
    else null
  end;

  update public.a7_orlando_order_items set
    actual_lbs = p_actual_lbs,
    weighed_at = v_when,
    subtotal = v_subtotal,
    weight_version = weight_version + 1
  where id = v_item.id;

  insert into public.a7_orlando_item_weight_events (
    order_id, order_item_id, actor_id, actor_role, idempotency_key, requested_version,
    previous_actual_lbs, actual_lbs, previous_subtotal, subtotal, reason, occurred_at
  ) values (
    v_order.id, v_item.id, p_actor_id, p_actor_role, p_idempotency_key, p_expected_weight_version,
    v_item.actual_lbs, p_actual_lbs, v_item.subtotal, v_subtotal,
    nullif(btrim(coalesce(p_reason, '')), ''), v_when
  );

  select count(*) filter (where unit = 'lb' and actual_lbs is null),
    coalesce(sum(actual_lbs) filter (where unit = 'lb'), 0)
  into v_pending, v_total_lbs
  from public.a7_orlando_order_items where order_id = v_order.id;

  if v_pending = 0 then
    if v_order.order_status = 'picked_up' then
      v_lifecycle := public.a7_orlando_record_transition(
        v_order.id,
        'order_weighed',
        'order_weighed:' || md5(p_idempotency_key),
        p_idempotency_key || ':lifecycle',
        'operations',
        jsonb_build_object('actual_lbs', v_total_lbs),
        v_when
      );
    else
      update public.a7_orlando_orders set actual_lbs = v_total_lbs, weighed_at = v_when,
        updated_at = now(), version = version + 1 where id = v_order.id;
    end if;
    update public.a7_orlando_orders set production_state = 'awaiting_processing',
      operational_waiting_since = v_when, updated_at = now(), version = version + 1
      where id = v_order.id;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'complete', v_pending = 0,
    'pending_items', v_pending,
    'order', public.a7_orlando_w1c_a_order_payload(v_order.id)
  );
end;
$$;

revoke all on function public.a7_orlando_w1c_a_order_payload(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_a_order(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_a_snapshot() from public, anon, authenticated;
revoke all on function public.a7_orlando_w1c_a_record_item_weight(text,uuid,numeric,integer,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1c_a_order_payload(uuid) to service_role;
grant execute on function public.a7_orlando_w1c_a_order(text) to service_role;
grant execute on function public.a7_orlando_w1c_a_snapshot() to service_role;
grant execute on function public.a7_orlando_w1c_a_record_item_weight(text,uuid,numeric,integer,text,text,text,text,timestamptz)
  to service_role;
