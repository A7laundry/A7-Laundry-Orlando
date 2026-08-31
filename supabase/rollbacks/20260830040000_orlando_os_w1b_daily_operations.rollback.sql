-- Exceptional W1B schema rollback. Normal rollback is application-only.
do $$
begin
  if exists (select 1 from public.a7_orlando_operational_events limit 1)
    or exists (
      select 1 from public.a7_orlando_orders
      where custody_state is not null or production_state is not null
        or promised_by is not null or promise_version <> 0 or operational_waiting_since is not null
      limit 1
    ) then
    raise exception 'W1B rollback refused: operational state/history exists; use application rollback.';
  end if;
end $$;

drop function if exists public.a7_orlando_w1b_transition(text,text,text,text,text,text,timestamptz,timestamptz);
drop function if exists public.a7_orlando_w1b_order(text);
drop function if exists public.a7_orlando_w1b_snapshot();
drop function if exists public.a7_orlando_w1b_order_payload(uuid);
drop trigger if exists a7_orlando_w1b_initialize_new_order on public.a7_orlando_orders;
drop function if exists public.a7_orlando_w1b_initialize_new_order();
drop table if exists public.a7_orlando_operational_events;
drop table if exists public.a7_orlando_operation_settings;
drop index if exists public.a7_orlando_orders_daily_operations_idx;
alter table public.a7_orlando_orders
  drop constraint if exists a7_orlando_orders_custody_state_valid,
  drop constraint if exists a7_orlando_orders_production_state_valid,
  drop constraint if exists a7_orlando_orders_promise_version_valid,
  drop column if exists custody_state,
  drop column if exists production_state,
  drop column if exists promised_by,
  drop column if exists promise_version,
  drop column if exists operational_waiting_since;
