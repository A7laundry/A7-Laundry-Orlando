-- A7 Orlando OS W1A.1 — additive MCO numbering and Pickup Order preparation.
-- The W1A RPC remains unchanged so application rollback restores the prior behavior immediately.

create sequence if not exists public.a7_orlando_mco_order_number_seq
  start with 1002 increment by 1 no cycle;

alter table public.a7_orlando_orders
  add column if not exists bags_expected integer,
  add column if not exists payment_total numeric;

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_bags_expected_valid
  check (bags_expected is null or bags_expected between 1 and 100) not valid;

alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_payment_total_separated
  check (
    payment_total is null
    or (
      service_amount is not null
      and tip_amount is not null
      and payment_total = service_amount + tip_amount
    )
  ) not valid;

alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_bags_expected_valid;

alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_payment_total_separated;

grant usage, select on sequence public.a7_orlando_mco_order_number_seq to service_role;

create or replace function public.a7_orlando_create_manual_order_v2(
  p_submission_id uuid,
  p_request_fingerprint text,
  p_actor_id text,
  p_actor_role text,
  p_wa_id text,
  p_profile_name text,
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
  v_result jsonb;
  v_order_id uuid;
  v_order_number text;
  v_duplicate boolean;
begin
  if p_bags_expected is not null and (p_bags_expected < 1 or p_bags_expected > 100) then
    raise exception 'Expected bags must be between 1 and 100';
  end if;

  v_result := public.a7_orlando_create_manual_order(
    p_submission_id, p_request_fingerprint, p_actor_id, p_actor_role,
    p_wa_id, p_profile_name, p_language, p_customer_type, p_accommodation_type,
    p_service_area_bucket, p_operational_data, p_lead_reference, p_service_type,
    p_service_tier, p_pricing_model, p_pickup_window_start, p_pickup_window_end,
    p_estimated_lbs, p_items, p_occurred_at
  );

  v_order_id := (v_result->>'order_id')::uuid;
  v_duplicate := coalesce((v_result->>'duplicate')::boolean, false);

  if v_duplicate then
    select order_number into v_order_number
      from public.a7_orlando_orders where id = v_order_id;
    return v_result || jsonb_build_object('order_number', v_order_number);
  end if;

  v_order_number := 'MCO ' || nextval('public.a7_orlando_mco_order_number_seq')::text;
  update public.a7_orlando_orders
    set order_number = v_order_number,
        bags_expected = p_bags_expected,
        updated_at = now()
    where id = v_order_id
    returning order_number into v_order_number;

  if v_order_number is null then raise exception 'Created order was not found'; end if;

  update public.a7_orlando_operator_audit
    set safe_change = jsonb_set(safe_change, '{order_number}', to_jsonb(v_order_number), true)
    where action = 'manual_order_created'
      and idempotency_key = 'manual:' || p_submission_id::text
      and entity_id = v_order_id;

  return v_result || jsonb_build_object('order_number', v_order_number);
end;
$$;

revoke all on function public.a7_orlando_create_manual_order_v2(
  uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) from public, anon, authenticated;

grant execute on function public.a7_orlando_create_manual_order_v2(
  uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) to service_role;

comment on function public.a7_orlando_create_manual_order_v2(
  uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
) is 'W1A.1 atomic wrapper: preserves idempotency and assigns MCO human numbers to new orders only.';
