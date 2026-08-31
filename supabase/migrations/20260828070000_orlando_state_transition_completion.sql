-- A7 Laundry Orlando — complete the contract's lead and order state transitions.
-- Every transition is append-only and idempotent; none of these additional
-- diagnostic lifecycle events are queued for GA4.

alter table public.a7_orlando_orders
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

alter table public.a7_orlando_leads
  add constraint a7_orlando_leads_disqualification_reason_required
  check (status <> 'disqualified' or nullif(btrim(disqualification_reason), '') is not null) not valid;

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_cancellation_reason_required
  check (
    (order_status <> 'cancelled' and cancellation_reason is null and cancelled_at is null)
    or (order_status = 'cancelled' and nullif(btrim(cancellation_reason), '') is not null and cancelled_at is not null)
  ) not valid;

alter table public.a7_orlando_leads
  validate constraint a7_orlando_leads_disqualification_reason_required;

alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_cancellation_reason_required;

alter table public.a7_orlando_order_events
  drop constraint if exists a7_orlando_order_events_event_name_check;

alter table public.a7_orlando_order_events
  add constraint a7_orlando_order_events_event_name_check
  check (event_name in (
    'generate_lead', 'lead_qualification_started', 'qualified_guest_lead',
    'lead_disqualified', 'lead_lost', 'order_accepted', 'pickup_scheduled',
    'pickup_completed', 'order_weighed', 'invoice_created',
    'order_ready_for_delivery', 'purchase', 'order_delivered',
    'order_cancelled', 'refund'
  ));

create or replace function public.a7_orlando_update_lead_status(
  p_lead_id uuid,
  p_event_name text,
  p_event_id text,
  p_idempotency_key text,
  p_reason text,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_existing public.a7_orlando_order_events;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_status text;
begin
  select * into v_existing from public.a7_orlando_order_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.event_name <> p_event_name or v_existing.lead_id <> p_lead_id then
      raise exception 'Idempotency key conflicts with another transition';
    end if;
    select * into v_lead from public.a7_orlando_leads where id = p_lead_id;
    return jsonb_build_object('duplicate', true, 'lead', to_jsonb(v_lead));
  end if;

  select * into v_lead from public.a7_orlando_leads where id = p_lead_id for update;
  if v_lead.id is null then raise exception 'Lead not found'; end if;

  case p_event_name
    when 'lead_qualification_started' then
      if v_lead.status <> 'new' then raise exception 'Only a new lead can start qualification'; end if;
      v_status := 'qualifying';
      update public.a7_orlando_leads set status = v_status, updated_at = now()
        where id = p_lead_id returning * into v_lead;
    when 'lead_disqualified' then
      if v_lead.status not in ('new', 'qualifying', 'qualified') or v_reason is null then
        raise exception 'A disqualification reason is required for an active lead';
      end if;
      v_status := 'disqualified';
      update public.a7_orlando_leads set status = v_status,
        disqualification_reason = v_reason, updated_at = now()
        where id = p_lead_id returning * into v_lead;
    when 'lead_lost' then
      if v_lead.status not in ('new', 'qualifying', 'qualified') then
        raise exception 'Only an active lead can be marked lost';
      end if;
      v_status := 'lost';
      update public.a7_orlando_leads set status = v_status,
        loss_reason = v_reason, updated_at = now()
        where id = p_lead_id returning * into v_lead;
    else
      raise exception 'Unsupported lead transition';
  end case;

  insert into public.a7_orlando_order_events (
    event_id, idempotency_key, event_name, source_system, lead_id, occurred_at, payload
  ) values (
    p_event_id, p_idempotency_key, p_event_name, 'operations', p_lead_id,
    coalesce(p_occurred_at, now()),
    jsonb_build_object('lead_id', p_lead_id, 'status', v_status, 'reason', v_reason)
  );

  return jsonb_build_object('duplicate', false, 'lead', to_jsonb(v_lead));
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
  v_existing public.a7_orlando_order_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_amount numeric;
  v_tip numeric;
  v_amount_due numeric;
  v_weight numeric;
  v_pickup_start timestamptz;
  v_pickup_end timestamptz;
  v_reason text;
begin
  select * into v_existing from public.a7_orlando_order_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.event_name <> p_event_name or v_existing.order_id <> p_order_id then
      raise exception 'Idempotency key conflicts with another transition';
    end if;
    select * into v_order from public.a7_orlando_orders where id = p_order_id;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(v_order));
  end if;

  select * into v_order from public.a7_orlando_orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  case p_event_name
    when 'pickup_scheduled' then
      v_pickup_start := nullif(p_payload->>'pickup_window_start', '')::timestamptz;
      v_pickup_end := nullif(p_payload->>'pickup_window_end', '')::timestamptz;
      if v_order.order_status <> 'accepted' or v_pickup_start is null
        or v_pickup_end is null or v_pickup_end <= v_pickup_start then
        raise exception 'Invalid pickup schedule transition';
      end if;
      update public.a7_orlando_orders set order_status = 'pickup_scheduled',
        pickup_window_start = v_pickup_start, pickup_window_end = v_pickup_end,
        updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'pickup_completed' then
      if v_order.order_status not in ('accepted', 'pickup_scheduled') then
        raise exception 'Invalid pickup transition';
      end if;
      update public.a7_orlando_orders set order_status = 'picked_up', picked_up_at = v_when,
        updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'order_weighed' then
      v_weight := nullif(p_payload->>'actual_lbs', '')::numeric;
      if v_order.order_status <> 'picked_up' or v_weight is null or v_weight <= 0 then
        raise exception 'Invalid weighing transition';
      end if;
      update public.a7_orlando_orders set order_status = 'weighed', actual_lbs = v_weight,
        weighed_at = v_when, updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'invoice_created' then
      v_amount := nullif(p_payload->>'service_amount', '')::numeric;
      v_tip := coalesce(nullif(p_payload->>'tip_amount', '')::numeric, 0);
      v_amount_due := coalesce(nullif(p_payload->>'amount_due', '')::numeric, v_amount);
      if v_order.order_status = 'invoice_created' or coalesce(p_payload->>'invoice_id', '') = ''
        or v_amount is null or v_amount <= 0 or v_tip <> 0 or v_amount_due <> v_amount
        or p_payload->>'currency' <> 'USD' then raise exception 'Invalid invoice transition'; end if;
      if v_order.pricing_model = 'per_lb' and v_order.order_status <> 'weighed' then
        raise exception 'Per-pound order must be weighed';
      end if;
      update public.a7_orlando_orders set order_status = 'invoice_created', payment_status = 'invoice_created',
        invoice_id = p_payload->>'invoice_id', service_amount = v_amount, tip_amount = 0,
        currency = 'USD', updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'order_ready_for_delivery' then
      if v_order.payment_status <> 'paid' or v_order.order_status <> 'invoice_created' then
        raise exception 'Paid invoiced order required before delivery readiness';
      end if;
      update public.a7_orlando_orders set order_status = 'ready_for_delivery',
        updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'order_delivered' then
      if v_order.payment_status <> 'paid' or v_order.order_status not in ('invoice_created', 'ready_for_delivery') then
        raise exception 'Paid order required for delivery';
      end if;
      update public.a7_orlando_orders set order_status = 'delivered', delivered_at = v_when,
        updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    when 'order_cancelled' then
      v_reason := nullif(btrim(coalesce(p_payload->>'reason', '')), '');
      if v_order.order_status in ('delivered', 'cancelled') or v_reason is null then
        raise exception 'A cancellation reason is required before delivery';
      end if;
      update public.a7_orlando_orders set order_status = 'cancelled',
        cancellation_reason = v_reason, cancelled_at = v_when,
        updated_at = now(), version = version + 1
        where id = p_order_id returning * into v_order;
    else
      raise exception 'Unsupported lifecycle event';
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

revoke all on function public.a7_orlando_update_lead_status(uuid,text,text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_update_lead_status(uuid,text,text,text,text,timestamptz)
  to service_role;

revoke all on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_record_transition(uuid,text,text,text,text,jsonb,timestamptz)
  to service_role;
