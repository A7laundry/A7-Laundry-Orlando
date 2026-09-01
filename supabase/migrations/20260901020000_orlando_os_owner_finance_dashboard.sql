-- A7 Orlando OS A7-034 — Owner finance read model.
-- Additive, read-only, service-role only. No business row is mutated.

create or replace function public.a7_orlando_owner_finance(
  p_start_date date,
  p_end_date date
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_timezone constant text := 'America/New_York';
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := now();
  v_result jsonb;
begin
  if p_start_date is null or p_end_date is null
    or p_start_date > p_end_date
    or p_end_date - p_start_date > 365 then
    raise exception 'Invalid finance period';
  end if;

  v_start := p_start_date::timestamp at time zone v_timezone;
  v_end := (p_end_date + 1)::timestamp at time zone v_timezone;

  with real_orders as (
    select o.*, l.operational_data, h.canonical_name as hotel_name,
      public.a7_orlando_order_confirmed_service_revenue(o.id) as confirmed_service_revenue
    from public.a7_orlando_orders o
    join public.a7_orlando_leads l on l.id = o.lead_id
    left join public.a7_orlando_hotels h on h.id = o.hotel_id
    where o.unit_key = 'orlando'
      and o.order_number is not null
      and o.order_status <> 'cancelled'
      and not public.a7_orlando_order_is_qa(o.id)
  ), paid as (
    select r.*, p.amount as payment_amount, p.refund_total, p.paid_at as authoritative_paid_at,
      case
        when r.operational_data ? 'historical_tip_amount'
          and (r.operational_data->>'historical_tip_amount') ~ '^[0-9]+([.][0-9]{1,2})?$'
          then (r.operational_data->>'historical_tip_amount')::numeric
        when r.tip_amount is not null then r.tip_amount
        else null
      end as confirmed_tip,
      case
        when s.confidence = 'deterministic' and coalesce(s.first_touch->>'source', '') <> '' then
          case when coalesce(s.first_touch->>'medium', '') in ('', s.first_touch->>'source')
            then s.first_touch->>'source'
            else (s.first_touch->>'source') || ' / ' || (s.first_touch->>'medium') end
        else 'Unattributed'
      end as acquisition_source
    from real_orders r
    join lateral (
      select candidate.*
      from public.a7_orlando_payments candidate
      where candidate.order_id = r.id
        and candidate.status in ('paid', 'partially_refunded', 'refunded')
        and candidate.paid_at >= v_start and candidate.paid_at < v_end
      order by candidate.paid_at desc, candidate.id desc
      limit 1
    ) p on true
    left join public.a7_orlando_attribution_snapshots s on s.order_id = r.id
    where r.confirmed_service_revenue is not null
  ), pending as (
    select r.* from real_orders r
    where r.accepted_at >= v_start and r.accepted_at < v_end
      and r.payment_status not in ('paid', 'partially_refunded', 'refunded', 'void')
  ), summary as (
    select
      count(*)::integer as paid_order_count,
      count(distinct customer_id)::integer as customer_count,
      coalesce(sum(confirmed_service_revenue), 0) as confirmed_service_revenue,
      coalesce(sum(greatest(payment_amount - coalesce(refund_total, 0), 0)), 0) as gross_received,
      sum(confirmed_tip) as confirmed_tips,
      count(*) filter (where confirmed_tip is not null)::integer as tip_known_order_count,
      count(*) filter (where not coalesce(is_repeat_customer, false))::integer as new_customer_orders,
      count(*) filter (where coalesce(is_repeat_customer, false))::integer as repeat_customer_orders,
      count(*) filter (where service_tier = 'express')::integer as express_paid_orders,
      count(*) filter (where service_tier = 'normal')::integer as normal_paid_orders
    from paid
  ), pending_summary as (
    select count(*)::integer as pending_payment_count,
      count(service_amount)::integer as pending_value_known_count,
      sum(service_amount) as pending_payment_value
    from pending
  ), service_breakdown as (
    select coalesce(service_tier, 'unknown') as bucket,
      count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue
    from paid group by coalesce(service_tier, 'unknown')
  ), hotel_breakdown as (
    select coalesce(hotel_name, 'Unmapped / other') as bucket,
      count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue
    from paid group by coalesce(hotel_name, 'Unmapped / other')
  ), source_breakdown as (
    select acquisition_source as bucket,
      count(*)::integer as paid_order_count,
      sum(confirmed_service_revenue) as confirmed_service_revenue
    from paid group by acquisition_source
  )
  select jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', p_start_date, 'end_date', p_end_date,
      'timezone', v_timezone, 'basis', 'authoritative_paid_at'
    ),
    'summary', jsonb_build_object(
      'currency', 'USD',
      'paid_order_count', s.paid_order_count,
      'customer_count', s.customer_count,
      'confirmed_service_revenue', s.confirmed_service_revenue,
      'gross_received', s.gross_received,
      'confirmed_tips', s.confirmed_tips,
      'average_service_ticket', case when s.paid_order_count > 0
        then s.confirmed_service_revenue / s.paid_order_count else null end,
      'new_customer_orders', s.new_customer_orders,
      'repeat_customer_orders', s.repeat_customer_orders,
      'normal_paid_orders', s.normal_paid_orders,
      'express_paid_orders', s.express_paid_orders,
      'pending_payment_count', ps.pending_payment_count,
      'pending_payment_value', ps.pending_payment_value
    ),
    'availability', jsonb_build_object(
      'status', 'current',
      'service_revenue', 'current',
      'gross_received', 'current',
      'tips', case
        when s.paid_order_count = 0 then 'no_data'
        when s.tip_known_order_count = s.paid_order_count then 'current'
        when s.tip_known_order_count = 0 then 'unavailable'
        else 'partial' end,
      'pending_payment_value', case
        when ps.pending_payment_count = 0 then 'no_data'
        when ps.pending_value_known_count = ps.pending_payment_count then 'current'
        when ps.pending_value_known_count = 0 then 'unavailable'
        else 'partial' end,
      'processing_fees', 'unavailable',
      'net_payout', 'unavailable'
    ),
    'breakdowns', jsonb_build_object(
      'service', coalesce((select jsonb_agg(jsonb_build_object(
        'bucket', bucket, 'paid_order_count', paid_order_count,
        'confirmed_service_revenue', confirmed_service_revenue
      ) order by confirmed_service_revenue desc, bucket) from service_breakdown), '[]'::jsonb),
      'hotel', coalesce((select jsonb_agg(jsonb_build_object(
        'bucket', bucket, 'paid_order_count', paid_order_count,
        'confirmed_service_revenue', confirmed_service_revenue
      ) order by confirmed_service_revenue desc, bucket) from hotel_breakdown), '[]'::jsonb),
      'acquisition', coalesce((select jsonb_agg(jsonb_build_object(
        'bucket', bucket, 'paid_order_count', paid_order_count,
        'confirmed_service_revenue', confirmed_service_revenue
      ) order by confirmed_service_revenue desc, bucket) from source_breakdown), '[]'::jsonb)
    ),
    'sources', jsonb_build_array(
      'A7 Orlando orders', 'reconciled payments/refunds',
      'protected explicit tip facts', 'frozen attribution snapshots'
    ),
    'freshness', jsonb_build_object('generated_at', v_now)
  ) into v_result
  from summary s cross join pending_summary ps;

  return v_result;
end;
$$;

revoke all on function public.a7_orlando_owner_finance(date,date) from public, anon, authenticated;
grant execute on function public.a7_orlando_owner_finance(date,date) to service_role;

comment on function public.a7_orlando_owner_finance(date,date)
  is 'A7-034 private read-only Owner finance contract; no PII and no mutation.';
