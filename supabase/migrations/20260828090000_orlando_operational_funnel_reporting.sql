-- A7 Laundry Orlando — privacy-safe aggregate reporting for the protected MOS.

create or replace function public.a7_orlando_operational_funnel(
  p_start timestamptz,
  p_end timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_start timestamptz := p_start;
  v_end timestamptz := p_end;
  v_result jsonb;
begin
  if v_start is null or v_end is null or v_end <= v_start or v_end - v_start > interval '366 days' then
    raise exception 'Invalid reporting period';
  end if;

  with
  stage_counts as (
    select
      (select count(*) from public.a7_orlando_leads where created_at >= v_start and created_at < v_end) as leads_created,
      (select count(*) from public.a7_orlando_order_events where event_name = 'qualified_guest_lead' and occurred_at >= v_start and occurred_at < v_end) as qualified_leads,
      (select count(*) from public.a7_orlando_orders where accepted_at >= v_start and accepted_at < v_end) as accepted_orders,
      (select count(*) from public.a7_orlando_order_events where event_name = 'pickup_completed' and occurred_at >= v_start and occurred_at < v_end) as pickups_completed,
      (select count(*) from public.a7_orlando_order_events where event_name = 'order_weighed' and occurred_at >= v_start and occurred_at < v_end) as orders_weighed,
      (select count(*) from public.a7_orlando_order_events where event_name = 'invoice_created' and occurred_at >= v_start and occurred_at < v_end) as invoices_created,
      (select count(*) from public.a7_orlando_payments where paid_at >= v_start and paid_at < v_end) as paid_orders,
      (select coalesce(sum(amount - refund_total), 0) from public.a7_orlando_payments where paid_at >= v_start and paid_at < v_end) as service_revenue,
      (select count(*) from public.a7_orlando_order_events where event_name = 'order_delivered' and occurred_at >= v_start and occurred_at < v_end) as delivered_orders,
      (select count(*) from public.a7_orlando_orders where is_repeat_customer and accepted_at >= v_start and accepted_at < v_end) as repeat_accepted_orders
  ),
  lead_landing as (
    select
      coalesce(nullif(split_part(a.first_touch->>'landing_page', '?', 1), ''), '(unattributed)') as canonical_path,
      count(*) filter (where l.created_at >= v_start and l.created_at < v_end) as leads_created,
      count(*) filter (where l.qualified_at >= v_start and l.qualified_at < v_end) as qualified_leads
    from public.a7_orlando_leads l
    left join public.a7_attribution_sessions a
      on a.attribution_id = l.attribution_id or (l.attribution_id is null and a.short_ref = l.lead_reference)
    where (l.created_at >= v_start and l.created_at < v_end)
       or (l.qualified_at >= v_start and l.qualified_at < v_end)
    group by 1
  ),
  order_landing as (
    select
      coalesce(nullif(split_part(s.first_touch->>'landing_page', '?', 1), ''), '(unattributed)') as canonical_path,
      count(distinct o.id) as accepted_orders,
      count(distinct p.id) filter (where p.paid_at >= v_start and p.paid_at < v_end) as paid_orders,
      coalesce(sum(p.amount - p.refund_total) filter (where p.paid_at >= v_start and p.paid_at < v_end), 0) as service_revenue,
      count(distinct e.id) filter (where e.event_name = 'order_delivered' and e.occurred_at >= v_start and e.occurred_at < v_end) as delivered_orders,
      count(distinct o.id) filter (where o.is_repeat_customer) as repeat_accepted_orders
    from public.a7_orlando_orders o
    left join public.a7_orlando_attribution_snapshots s on s.order_id = o.id
    left join public.a7_orlando_payments p on p.order_id = o.id and p.paid_at is not null
    left join public.a7_orlando_order_events e on e.order_id = o.id and e.event_name = 'order_delivered'
    where o.accepted_at >= v_start and o.accepted_at < v_end
    group by 1
  ),
  landing as (
    select
      coalesce(ll.canonical_path, ol.canonical_path) as canonical_path,
      coalesce(ll.leads_created, 0) as leads_created,
      coalesce(ll.qualified_leads, 0) as qualified_leads,
      coalesce(ol.accepted_orders, 0) as accepted_orders,
      coalesce(ol.paid_orders, 0) as paid_orders,
      coalesce(ol.service_revenue, 0) as service_revenue,
      coalesce(ol.delivered_orders, 0) as delivered_orders,
      coalesce(ol.repeat_accepted_orders, 0) as repeat_accepted_orders
    from lead_landing ll full outer join order_landing ol using (canonical_path)
  ),
  attribution_counts as (
    select
      count(*) filter (where attribution_confidence = 'deterministic') as deterministic,
      count(*) filter (where attribution_confidence = 'partial') as partial,
      count(*) filter (where attribution_confidence = 'unattributed') as unattributed
    from public.a7_orlando_orders where accepted_at >= v_start and accepted_at < v_end
  )
  select jsonb_build_object(
    'stages', to_jsonb(sc),
    'rates', jsonb_build_object(
      'lead_to_qualified', case when sc.leads_created > 0 then sc.qualified_leads::numeric / sc.leads_created else null end,
      'qualified_to_accepted', case when sc.qualified_leads > 0 then sc.accepted_orders::numeric / sc.qualified_leads else null end,
      'accepted_to_paid', case when sc.accepted_orders > 0 then sc.paid_orders::numeric / sc.accepted_orders else null end,
      'accepted_to_delivered', case when sc.accepted_orders > 0 then sc.delivered_orders::numeric / sc.accepted_orders else null end
    ),
    'attribution', to_jsonb(ac),
    'by_landing_page', coalesce((select jsonb_agg(to_jsonb(landing) order by accepted_orders desc, canonical_path) from landing), '[]'::jsonb)
  ) into v_result
  from stage_counts sc cross join attribution_counts ac;
  return v_result;
end;
$$;

revoke all on function public.a7_orlando_operational_funnel(timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_operational_funnel(timestamptz,timestamptz)
  to service_role;
