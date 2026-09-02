-- A7-038 Packet 5 — delivery handoff evidence on the existing W1B transition authority.

alter table public.a7_orlando_operational_events
  add column if not exists handoff_point text,
  add column if not exists handoff_note text;

alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_handoff_point_valid
  check (handoff_point is null or handoff_point in (
    'bell_desk', 'front_desk', 'concierge', 'guest', 'other'
  )) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_handoff_point_valid;

create or replace function public.a7_orlando_operational_cycle_transition_v2(
  p_order_number text, p_action text, p_actor_id text, p_actor_role text,
  p_idempotency_key text, p_reason text, p_promised_by timestamptz,
  p_handoff_point text, p_handoff_note text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_existing public.a7_orlando_operational_events;
  v_result jsonb;
  v_note text := nullif(btrim(coalesce(p_handoff_note, '')), '');
begin
  if p_actor_role not in ('owner', 'manager') then raise exception 'Management authorization required'; end if;
  if coalesce(length(v_note), 0) > 500 then raise exception 'Handoff note is too long'; end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  select * into v_existing from public.a7_orlando_operational_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.order_id <> v_order.id or v_existing.action <> p_action
      or v_existing.handoff_point is distinct from p_handoff_point
      or v_existing.handoff_note is distinct from v_note then
      raise exception 'Idempotency key conflicts with another operational transition';
    end if;
    return jsonb_build_object('duplicate', true, 'order', public.a7_orlando_operational_cycle_order(p_order_number));
  end if;

  if p_action = 'leave_bell_desk' then
    if p_handoff_point not in ('bell_desk', 'front_desk', 'concierge') then
      raise exception 'A hotel handoff point is required';
    end if;
  elsif p_action = 'complete_delivery' and v_order.custody_state = 'with_driver_delivery' then
    if p_handoff_point not in ('guest', 'other') then raise exception 'A direct handoff point is required'; end if;
    if p_handoff_point = 'other' and v_note is null then raise exception 'Other requires a handoff note'; end if;
  elsif p_handoff_point is not null or v_note is not null then
    raise exception 'Handoff evidence is not valid for this transition';
  end if;

  v_result := public.a7_orlando_operational_cycle_transition(
    p_order_number, p_action, p_actor_id, p_actor_role, p_idempotency_key,
    p_reason, p_promised_by, p_occurred_at
  );
  if p_handoff_point is not null then
    update public.a7_orlando_operational_events
      set handoff_point = p_handoff_point, handoff_note = v_note
      where idempotency_key = p_idempotency_key;
  end if;
  return jsonb_set(v_result, '{order}', public.a7_orlando_operational_cycle_order(p_order_number), true);
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
      from public.a7_orlando_manual_payments m where m.order_id = v_order_id limit 1),
    'delivery_handoff', (select jsonb_build_object(
      'handoff_point', e.handoff_point, 'handoff_note', e.handoff_note,
      'actor_role', e.actor_role, 'occurred_at', e.occurred_at)
      from public.a7_orlando_operational_events e
      where e.order_id = v_order_id and e.handoff_point is not null
      order by e.occurred_at desc, e.id desc limit 1)
  );
end;
$$;

revoke all on function public.a7_orlando_operational_cycle_transition_v2(
  text,text,text,text,text,text,timestamptz,text,text,timestamptz
) from public, anon, authenticated;
grant execute on function public.a7_orlando_operational_cycle_transition_v2(
  text,text,text,text,text,text,timestamptz,text,text,timestamptz
) to service_role;

comment on column public.a7_orlando_operational_events.handoff_point is
  'Governed delivery handoff point; extends evidence without introducing a second custody lifecycle.';
