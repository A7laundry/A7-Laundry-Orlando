-- A7 Orlando OS W3-A — reuse one known customer without mutating customer identity.
-- Additive RPC only. Existing W1A/W1A.1 creation functions remain unchanged.

create or replace function public.a7_orlando_create_known_customer_order(
  p_submission_id uuid,
  p_request_fingerprint text,
  p_actor_id text,
  p_actor_role text,
  p_customer_id uuid,
  p_language text,
  p_customer_type text,
  p_accommodation_type text,
  p_service_area_bucket text,
  p_operational_data jsonb,
  p_lead_reference text,
  p_service_type text,
  p_service_tier text,
  p_pricing_model text,
  p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz,
  p_estimated_lbs numeric,
  p_bags_expected integer,
  p_items jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing public.a7_orlando_manual_order_requests;
  v_customer public.a7_wa_contacts;
  v_lead_result jsonb;
  v_order_result jsonb;
  v_lead_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_attribution_id text;
  v_resolution text := 'prior_customer';
  v_ref text := nullif(upper(coalesce(p_lead_reference, '')), '');
  v_prefix text := p_submission_id::text;
  v_when timestamptz := coalesce(p_occurred_at, now());
  v_duplicate boolean;
  v_repeat boolean;
begin
  if coalesce(p_request_fingerprint, '') = '' or coalesce(p_actor_id, '') = ''
    or p_actor_role <> 'owner' or p_customer_id is null then
    raise exception 'Invalid Owner known-customer contract';
  end if;
  if p_bags_expected is not null and (p_bags_expected < 1 or p_bags_expected > 100) then
    raise exception 'Expected bags must be between 1 and 100';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'At least one order item is required';
  end if;

  -- Serialize reuse for one customer and reject opaque references that do not
  -- resolve to an existing Orlando customer with prior real order history.
  select * into v_customer from public.a7_wa_contacts
    where id = p_customer_id and unit_key = 'orlando' for update;
  if v_customer.id is null then raise exception 'Known customer was not found'; end if;
  if not exists (
    select 1 from public.a7_orlando_orders o
    where o.customer_id = v_customer.id and o.order_number is not null
      and o.order_status <> 'cancelled' and not public.a7_orlando_order_is_qa(o.id)
  ) then raise exception 'Known customer requires prior real order history'; end if;

  select * into v_existing from public.a7_orlando_manual_order_requests
    where submission_id = p_submission_id for update;
  if v_existing.submission_id is not null then
    if v_existing.request_fingerprint <> p_request_fingerprint
      or v_existing.customer_id <> v_customer.id then
      raise exception 'Idempotency key conflicts with another known-customer order';
    end if;
    select order_number, is_repeat_customer into v_order_number, v_repeat
      from public.a7_orlando_orders where id = v_existing.order_id;
    return jsonb_build_object(
      'duplicate', true, 'customer_id', v_existing.customer_id,
      'lead_id', v_existing.lead_id, 'order_id', v_existing.order_id,
      'order_number', v_order_number, 'customer_reused', true,
      'is_repeat_customer', v_repeat
    );
  end if;

  if v_ref is not null then
    select attribution_id into v_attribution_id from public.a7_attribution_sessions
      where short_ref = v_ref and expires_at > now();
    if v_attribution_id is not null then v_resolution := 'short_ref'; end if;
  end if;

  v_lead_result := public.a7_orlando_create_lead(
    'known-customer:' || v_prefix, 'generate_lead:' || v_prefix, 'manual', null, v_customer.id,
    v_attribution_id, v_ref, v_resolution, p_service_type, p_customer_type, p_language,
    p_accommodation_type, p_service_area_bucket, coalesce(p_operational_data, '{}'::jsonb), v_when
  );
  v_lead_id := (v_lead_result->'lead'->>'id')::uuid;

  perform public.a7_orlando_qualify_lead(
    v_lead_id, 'qualified_guest_lead:' || v_prefix, 'known-customer:qualify:' || v_prefix,
    p_service_type, true, true, true, v_when
  );
  v_order_result := public.a7_orlando_accept_order(
    v_lead_id, 'order_accepted:' || v_prefix, 'known-customer:accept:' || v_prefix,
    p_service_type, p_service_tier, p_pricing_model, p_pickup_window_start,
    p_pickup_window_end, p_estimated_lbs, null, null, v_when
  );
  v_order_id := (v_order_result->'order'->>'id')::uuid;
  v_duplicate := coalesce((v_order_result->>'duplicate')::boolean, false);
  if v_duplicate then raise exception 'Known-customer order creation collided unexpectedly'; end if;

  v_order_number := 'MCO ' || nextval('public.a7_orlando_mco_order_number_seq')::text;
  update public.a7_orlando_orders
    set order_number = v_order_number, bags_expected = p_bags_expected, updated_at = now()
    where id = v_order_id
    returning is_repeat_customer into v_repeat;
  if v_repeat is not true then raise exception 'Known-customer order must be a truthful repeat order'; end if;

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
  ) values (p_submission_id, p_request_fingerprint, v_customer.id, v_lead_id, v_order_id);

  insert into public.a7_orlando_operator_audit (
    actor_id, actor_role, action, entity_type, entity_id, idempotency_key, safe_change
  ) values (
    p_actor_id, p_actor_role, 'known_customer_order_created', 'order', v_order_id,
    'known-customer:' || v_prefix,
    jsonb_build_object(
      'order_number', v_order_number, 'item_count', jsonb_array_length(p_items),
      'order_status', 'accepted', 'customer_reused', true, 'is_repeat_customer', true
    )
  );

  return jsonb_build_object(
    'duplicate', false, 'customer_id', v_customer.id, 'lead_id', v_lead_id,
    'order_id', v_order_id, 'order_number', v_order_number,
    'customer_reused', true, 'is_repeat_customer', true
  );
end;
$$;

revoke all on function public.a7_orlando_create_known_customer_order(
  uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) from public, anon, authenticated;

grant execute on function public.a7_orlando_create_known_customer_order(
  uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) to service_role;

comment on function public.a7_orlando_create_known_customer_order(
  uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) is 'W3-A Owner-only reuse: preserves customer identity, creates new lead/order, serializes repeat truth and never mutates contact fields.';
