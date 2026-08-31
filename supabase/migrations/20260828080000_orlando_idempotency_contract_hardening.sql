-- A7 Laundry Orlando — make qualification/order idempotency semantic.

create or replace function public.a7_orlando_qualify_lead(
  p_lead_id uuid, p_event_id text, p_idempotency_key text, p_service_type text,
  p_service_area_accepted boolean, p_timing_accepted boolean,
  p_minimum_basis_accepted boolean, p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_existing public.a7_orlando_order_events;
begin
  if not coalesce(p_service_area_accepted, false)
    or not coalesce(p_timing_accepted, false)
    or not coalesce(p_minimum_basis_accepted, false)
    or coalesce(p_service_type, '') = '' then
    raise exception 'Lead does not satisfy qualification contract';
  end if;

  select * into v_existing from public.a7_orlando_order_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.event_name <> 'qualified_guest_lead'
      or v_existing.lead_id <> p_lead_id
      or v_existing.event_id <> p_event_id then
      raise exception 'Idempotency key conflicts with another transition';
    end if;
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
  p_lead_id uuid, p_event_id text, p_idempotency_key text, p_service_type text,
  p_service_tier text, p_pricing_model text, p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz, p_estimated_lbs numeric, p_ga_client_id text,
  p_ga_session_id text, p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_order public.a7_orlando_orders;
  v_existing public.a7_orlando_order_events;
  v_attribution public.a7_attribution_sessions;
  v_confidence text := 'unattributed';
  v_customer_order_number integer := 1;
begin
  select * into v_existing from public.a7_orlando_order_events
    where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.event_name <> 'order_accepted'
      or v_existing.lead_id <> p_lead_id
      or v_existing.event_id <> p_event_id
      or v_existing.order_id is null then
      raise exception 'Idempotency key conflicts with another transition';
    end if;
    select * into v_order from public.a7_orlando_orders where id = v_existing.order_id;
    return jsonb_build_object('duplicate', true, 'order', to_jsonb(v_order));
  end if;

  select * into v_lead from public.a7_orlando_leads where id = p_lead_id for update;
  if v_lead.id is null or v_lead.status <> 'qualified' then raise exception 'Qualified lead required'; end if;
  if coalesce(p_service_type, '') = '' or p_pricing_model not in ('per_lb', 'fixed')
    or (p_service_tier is not null and p_service_tier not in ('normal', 'express'))
    or (p_estimated_lbs is not null and p_estimated_lbs <= 0) then
    raise exception 'Invalid order contract';
  end if;
  if (p_pickup_window_start is null) <> (p_pickup_window_end is null)
    or (p_pickup_window_start is not null and p_pickup_window_end <= p_pickup_window_start) then
    raise exception 'Invalid pickup window';
  end if;

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

revoke all on function public.a7_orlando_qualify_lead(uuid,text,text,text,boolean,boolean,boolean,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_qualify_lead(uuid,text,text,text,boolean,boolean,boolean,timestamptz)
  to service_role;
revoke all on function public.a7_orlando_accept_order(uuid,text,text,text,text,text,timestamptz,timestamptz,numeric,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_accept_order(uuid,text,text,text,text,text,timestamptz,timestamptz,numeric,text,text,timestamptz)
  to service_role;
