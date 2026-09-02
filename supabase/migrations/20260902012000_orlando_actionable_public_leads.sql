-- A7 Orlando OS recovery — make public /order leads actionable without
-- exposing durable UUIDs or replacing the canonical lead/order authorities.

create or replace function public.a7_orlando_actionable_leads()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'lead_id', l.id,
    'customer_name', coalesce(c.profile_name, 'Customer'),
    'whatsapp_last4', right(c.wa_id, 4),
    'property', l.operational_data->>'property',
    'customer_type', l.customer_type,
    'created_at', l.created_at,
    'status', l.status
  ) order by l.created_at, l.id), '[]'::jsonb)
  from public.a7_orlando_leads l
  left join public.a7_wa_contacts c on c.id = l.customer_id
  where l.status in ('new', 'qualifying', 'qualified')
    and not exists (select 1 from public.a7_orlando_orders o where o.lead_id = l.id)
    and coalesce(concat_ws(' ', c.profile_name, l.operational_data->>'order_notes',
      l.operational_data->>'property'), '') !~* '(^|[^A-Z0-9])(QA|DO NOT FULFILL|DO NOT DISPATCH)([^A-Z0-9]|$)';
$$;

create or replace function public.a7_orlando_actionable_lead(p_lead_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'lead_id', l.id,
    'status', l.status,
    'lead_origin', l.lead_origin,
    'service_type', l.service_type,
    'customer_type', l.customer_type,
    'language', l.language,
    'accommodation_type', l.accommodation_type,
    'lead_reference', l.lead_reference,
    'customer_id', l.customer_id,
    'customer_name', coalesce(c.profile_name, l.operational_data->>'name'),
    'whatsapp_number', c.wa_id,
    'operational_data', l.operational_data,
    'created_at', l.created_at
  )
  from public.a7_orlando_leads l
  left join public.a7_wa_contacts c on c.id = l.customer_id
  where l.id = p_lead_id
    and l.status in ('new', 'qualifying', 'qualified')
    and not exists (select 1 from public.a7_orlando_orders o where o.lead_id = l.id)
  limit 1;
$$;

create or replace function public.a7_orlando_resolve_existing_lead_order_retry(
  p_submission_id uuid,
  p_request_fingerprint text,
  p_lead_id uuid
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_existing public.a7_orlando_manual_order_requests; v_order_number text;
begin
  select * into v_existing from public.a7_orlando_manual_order_requests
    where submission_id = p_submission_id;
  if v_existing.submission_id is null then return null; end if;
  if v_existing.request_fingerprint <> p_request_fingerprint or v_existing.lead_id <> p_lead_id then
    raise exception 'Idempotency key conflicts with another order';
  end if;
  select order_number into v_order_number from public.a7_orlando_orders where id = v_existing.order_id;
  return jsonb_build_object('duplicate', true, 'customer_reused', true,
    'customer_id', v_existing.customer_id, 'lead_id', v_existing.lead_id,
    'order_id', v_existing.order_id, 'order_number', v_order_number);
end;
$$;

create or replace function public.a7_orlando_accept_existing_lead_order(
  p_submission_id uuid,
  p_request_fingerprint text,
  p_actor_id text,
  p_actor_role text,
  p_lead_id uuid,
  p_operational_data jsonb,
  p_service_type text,
  p_service_tier text,
  p_pricing_model text,
  p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz,
  p_estimated_lbs numeric,
  p_bags_expected integer,
  p_promised_by timestamptz,
  p_items jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing public.a7_orlando_manual_order_requests;
  v_lead public.a7_orlando_leads;
  v_order_result jsonb;
  v_order_id uuid;
  v_order_number text;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_analytics jsonb;
begin
  if coalesce(p_request_fingerprint, '') = '' or coalesce(p_actor_id, '') = ''
    or p_actor_role not in ('owner', 'manager', 'operator') then
    raise exception 'Invalid operator contract';
  end if;
  if jsonb_typeof(coalesce(p_operational_data, '{}'::jsonb)) <> 'object'
    or coalesce(p_operational_data, '{}'::jsonb) ?| array[
      'analytics_context', 'attribution_id', 'lead_reference', 'customer_id', 'whatsapp_number'
    ] then raise exception 'Protected lead fields cannot be supplied'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'At least one order item is required';
  end if;
  if p_service_tier = 'express' and (p_promised_by is null or p_promised_by <= p_pickup_window_start) then
    raise exception 'Express promised delivery is required after pickup';
  end if;
  if p_service_tier <> 'express' and p_promised_by is not null then
    raise exception 'Promised delivery is reserved for Express';
  end if;

  select * into v_existing from public.a7_orlando_manual_order_requests
    where submission_id = p_submission_id;
  if v_existing.submission_id is not null then
    if v_existing.request_fingerprint <> p_request_fingerprint or v_existing.lead_id <> p_lead_id then
      raise exception 'Idempotency key conflicts with another order';
    end if;
    select order_number into v_order_number from public.a7_orlando_orders where id = v_existing.order_id;
    return jsonb_build_object('duplicate', true, 'customer_reused', true,
      'customer_id', v_existing.customer_id, 'lead_id', v_existing.lead_id,
      'order_id', v_existing.order_id, 'order_number', v_order_number);
  end if;

  select * into v_lead from public.a7_orlando_leads
    where id = p_lead_id and unit_key = 'orlando' for update;
  if v_lead.id is null or v_lead.status not in ('new', 'qualifying', 'qualified')
    or v_lead.customer_id is null then raise exception 'Actionable lead not found'; end if;
  if exists (select 1 from public.a7_orlando_orders where lead_id = p_lead_id) then
    raise exception 'Lead already has an accepted order';
  end if;
  if v_lead.service_type is not null and v_lead.service_type <> p_service_type then
    raise exception 'Service type conflicts with the original lead';
  end if;

  update public.a7_orlando_leads
  set operational_data = coalesce(operational_data, '{}'::jsonb) || coalesce(p_operational_data, '{}'::jsonb),
      service_area_bucket = 'orlando_pending_route',
      updated_at = now()
  where id = p_lead_id
  returning * into v_lead;
  v_analytics := coalesce(v_lead.operational_data->'analytics_context', '{}'::jsonb);

  perform public.a7_orlando_qualify_lead(
    p_lead_id, 'qualified_guest_lead:existing:' || p_submission_id::text,
    'existing-lead:qualify:' || p_submission_id::text, p_service_type,
    true, true, true, v_when
  );
  v_order_result := public.a7_orlando_accept_order(
    p_lead_id, 'order_accepted:existing:' || p_submission_id::text,
    'existing-lead:accept:' || p_submission_id::text, p_service_type,
    p_service_tier, p_pricing_model, p_pickup_window_start, p_pickup_window_end,
    p_estimated_lbs, nullif(v_analytics->>'client_id', ''),
    nullif(v_analytics->>'session_id', ''), v_when
  );
  v_order_id := (v_order_result->'order'->>'id')::uuid;
  v_order_number := 'A7-ORL-' || lpad(nextval('public.a7_orlando_order_number_seq')::text, 4, '0');
  update public.a7_orlando_orders
  set order_number = v_order_number,
      bags_expected = p_bags_expected,
      promised_by = p_promised_by,
      promise_version = case when p_promised_by is null then 0 else 1 end,
      updated_at = now()
  where id = v_order_id and order_number is null;
  select order_number into v_order_number from public.a7_orlando_orders where id = v_order_id;

  insert into public.a7_orlando_order_items (
    order_id, catalog_code, catalog_version, service_type, label, quantity, unit,
    estimated_lbs, unit_price, minimum_amount, currency, requires_manual_review, notes
  ) select v_order_id, item->>'catalog_code', (item->>'catalog_version')::integer,
    item->>'service_type', item->>'label', nullif(item->>'quantity', '')::numeric,
    item->>'unit', nullif(item->>'estimated_lbs', '')::numeric,
    nullif(item->>'unit_price', '')::numeric, coalesce((item->>'minimum_amount')::numeric, 0),
    'USD', coalesce((item->>'requires_manual_review')::boolean, false), item->>'notes'
  from jsonb_array_elements(p_items) item;

  insert into public.a7_orlando_manual_order_requests (
    submission_id, request_fingerprint, customer_id, lead_id, order_id
  ) values (p_submission_id, p_request_fingerprint, v_lead.customer_id, p_lead_id, v_order_id);
  insert into public.a7_orlando_operator_audit (
    actor_id, actor_role, action, entity_type, entity_id, idempotency_key, safe_change, occurred_at
  ) values (p_actor_id, p_actor_role, 'existing_lead_order_created', 'order', v_order_id,
    'existing-lead:' || p_submission_id::text,
    jsonb_build_object('order_number', v_order_number, 'lead_origin', v_lead.lead_origin,
      'item_count', jsonb_array_length(p_items), 'analytics_identity_present',
      nullif(v_analytics->>'client_id', '') is not null), v_when);

  if p_promised_by is not null then
    insert into public.a7_orlando_operational_events(
      order_id, action, actor_id, actor_role, idempotency_key,
      previous_state, new_state, occurred_at
    ) values (v_order_id, 'set_promised_by', p_actor_id, p_actor_role,
      'existing-lead:promise:' || p_submission_id::text,
      jsonb_build_object('promised_by', null), jsonb_build_object('promised_by', p_promised_by), v_when);
  end if;

  return jsonb_build_object('duplicate', false, 'customer_reused', true,
    'customer_id', v_lead.customer_id, 'lead_id', p_lead_id,
    'order_id', v_order_id, 'order_number', v_order_number,
    'analytics_identity_present', nullif(v_analytics->>'client_id', '') is not null);
end;
$$;

revoke all on function public.a7_orlando_actionable_leads() from public, anon, authenticated;
grant execute on function public.a7_orlando_actionable_leads() to service_role;
revoke all on function public.a7_orlando_actionable_lead(uuid) from public, anon, authenticated;
grant execute on function public.a7_orlando_actionable_lead(uuid) to service_role;
revoke all on function public.a7_orlando_resolve_existing_lead_order_retry(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.a7_orlando_resolve_existing_lead_order_retry(uuid,text,uuid) to service_role;
revoke all on function public.a7_orlando_accept_existing_lead_order(uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_accept_existing_lead_order(uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz)
  to service_role;
