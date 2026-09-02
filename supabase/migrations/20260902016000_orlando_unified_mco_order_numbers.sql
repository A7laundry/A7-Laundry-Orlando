-- A7 Orlando OS hotfix — every newly accepted public lead receives the same
-- human MCO sequence used by manual and known-customer orders. Existing
-- historical reconciliation keys remain untouched.

select setval(
  'public.a7_orlando_mco_order_number_seq',
  greatest(
    (select last_value from public.a7_orlando_mco_order_number_seq),
    coalesce((
      select max((substring(order_number from '^MCO ([0-9]+)$'))::bigint)
      from public.a7_orlando_orders
      where order_number ~ '^MCO [0-9]+$'
    ), 1001)
  ),
  true
);

create or replace function public.a7_orlando_accept_existing_lead_order_v2(
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
  v_result jsonb;
  v_order_id uuid;
  v_previous_number text;
  v_order_number text;
begin
  v_result := public.a7_orlando_accept_existing_lead_order(
    p_submission_id, p_request_fingerprint, p_actor_id, p_actor_role, p_lead_id,
    p_operational_data, p_service_type, p_service_tier, p_pricing_model,
    p_pickup_window_start, p_pickup_window_end, p_estimated_lbs, p_bags_expected,
    p_promised_by, p_items, p_occurred_at
  );

  if coalesce((v_result->>'duplicate')::boolean, false) then return v_result; end if;
  v_order_id := (v_result->>'order_id')::uuid;
  select order_number into v_previous_number
  from public.a7_orlando_orders where id = v_order_id for update;
  if v_previous_number !~ '^A7-ORL-[0-9]+$' then return v_result; end if;

  v_order_number := 'MCO ' || nextval('public.a7_orlando_mco_order_number_seq')::text;
  update public.a7_orlando_orders
  set order_number = v_order_number, updated_at = now()
  where id = v_order_id;

  update public.a7_orlando_operator_audit
  set safe_change = jsonb_set(safe_change, '{order_number}', to_jsonb(v_order_number), true)
  where entity_id = v_order_id
    and idempotency_key = 'existing-lead:' || p_submission_id::text;

  return jsonb_set(v_result, '{order_number}', to_jsonb(v_order_number), true);
end;
$$;

revoke all on function public.a7_orlando_accept_existing_lead_order_v2(
  uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz
) from public, anon, authenticated;
grant execute on function public.a7_orlando_accept_existing_lead_order_v2(
  uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz
) to service_role;

comment on function public.a7_orlando_accept_existing_lead_order_v2(
  uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz
) is 'Accepts an actionable public lead and replaces the temporary legacy number with the canonical MCO human sequence atomically.';
