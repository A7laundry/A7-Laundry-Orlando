-- Exceptional rollback for A7-038. Application rollback is preferred.
-- Abort rather than delete real operational/financial history.

do $$
begin
  if exists (select 1 from public.a7_orlando_drivers)
    or exists (select 1 from public.a7_orlando_driver_events)
    or exists (select 1 from public.a7_orlando_driver_assignments)
    or exists (select 1 from public.a7_orlando_manual_payments) then
    raise exception 'A7-038 rollback blocked: operational or financial evidence exists';
  end if;
end;
$$;

drop function if exists public.a7_orlando_operational_cycle_snapshot();
drop function if exists public.a7_orlando_operational_cycle_order(text);
drop function if exists public.a7_orlando_operational_cycle_enrich_order(jsonb);
drop function if exists public.a7_orlando_operational_cycle_transition(text,text,text,text,text,text,timestamptz,timestamptz);
drop function if exists public.a7_orlando_create_manual_order_v3(uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz);
drop function if exists public.a7_orlando_create_known_customer_order_v2(uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz);
drop function if exists public.a7_orlando_record_manual_payment(text,text,numeric,timestamptz,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_assign_driver(text,uuid,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_upsert_driver(uuid,text,text,boolean,text,text,text,timestamptz);
drop function if exists public.a7_orlando_list_drivers(boolean);

drop table if exists public.a7_orlando_manual_payments;
drop table if exists public.a7_orlando_driver_assignments;
drop table if exists public.a7_orlando_driver_events;
drop table if exists public.a7_orlando_drivers;

-- The prior W1B operational-action/actor constraints and prior finance/read functions
-- must be restored from the exact pre-cutover schema artifact before this exceptional
-- rollback is used. Do not run this file as an unreviewed production shortcut.
