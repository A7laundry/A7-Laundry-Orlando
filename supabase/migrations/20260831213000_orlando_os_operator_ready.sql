-- A7 Orlando OS — bounded operator readiness action.
-- Operators may read daily operations and mark only an at-laundry processing order ready.

alter table public.a7_orlando_operational_events
  drop constraint if exists a7_orlando_operational_events_actor_role_check;
alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_actor_role_check
  check (actor_role in ('owner', 'operator')) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_actor_role_check;

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
        select e.occurred_at, e.action,
          case when e.actor_role = 'operator' then 'Equipe' else 'Owner' end::text, e.id::text
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

create or replace function public.a7_orlando_w1b_operator_mark_ready(
  p_order_number text,
  p_actor_id text,
  p_idempotency_key text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_existing public.a7_orlando_operational_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_previous jsonb;
  v_new jsonb;
  v_lifecycle jsonb;
begin
  if coalesce(btrim(p_actor_id), '') = '' or coalesce(btrim(p_idempotency_key), '') = '' then
    raise exception 'Invalid Operator transition contract';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders are read-only'; end if;

  select * into v_existing from public.a7_orlando_operational_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.action <> 'mark_ready' or v_existing.order_id <> v_order.id
      or v_existing.actor_role <> 'operator' or v_existing.actor_id <> p_actor_id then
      raise exception 'Idempotency key conflicts with another operational transition';
    end if;
    return jsonb_build_object('duplicate', true,
      'order', public.a7_orlando_w1b_order_payload(v_order.id));
  end if;

  if v_order.custody_state <> 'at_laundry' or v_order.production_state <> 'processing' then
    raise exception 'Order cannot be marked ready from the current state';
  end if;

  v_previous := jsonb_build_object(
    'order_status', v_order.order_status, 'custody_state', v_order.custody_state,
    'production_state', v_order.production_state, 'promised_by', v_order.promised_by
  );

  if v_order.payment_status = 'paid' and v_order.order_status = 'invoice_created' then
    v_lifecycle := public.a7_orlando_record_transition(
      v_order.id, 'order_ready_for_delivery', 'order_ready_for_delivery:' || md5(p_idempotency_key),
      p_idempotency_key || ':lifecycle', 'operations', '{}'::jsonb, v_when
    );
  end if;

  update public.a7_orlando_orders set production_state = 'ready', operational_waiting_since = v_when,
    updated_at = now(), version = version + 1 where id = v_order.id;
  select * into v_order from public.a7_orlando_orders where id = v_order.id;

  v_new := jsonb_build_object(
    'order_status', v_order.order_status, 'custody_state', v_order.custody_state,
    'production_state', v_order.production_state, 'promised_by', v_order.promised_by
  );

  insert into public.a7_orlando_operational_events (
    order_id, action, actor_id, actor_role, idempotency_key, previous_state, new_state, occurred_at
  ) values (
    v_order.id, 'mark_ready', p_actor_id, 'operator', p_idempotency_key, v_previous, v_new, v_when
  );
  insert into public.a7_orlando_operator_audit (
    actor_id, actor_role, action, entity_type, entity_id, idempotency_key, safe_change, occurred_at
  ) values (
    p_actor_id, 'operator', 'w1b_mark_ready', 'order', v_order.id, p_idempotency_key,
    jsonb_build_object('order_number', v_order.order_number, 'previous', v_previous, 'new', v_new), v_when
  );
  return jsonb_build_object('duplicate', false,
    'order', public.a7_orlando_w1b_order_payload(v_order.id));
end;
$$;

revoke all on function public.a7_orlando_w1b_operator_mark_ready(text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_w1b_operator_mark_ready(text,text,text,timestamptz)
  to service_role;

comment on function public.a7_orlando_w1b_operator_mark_ready(text,text,text,timestamptz)
  is 'Bounded operator-only transition: processing at laundry to ready; idempotent and audited.';
