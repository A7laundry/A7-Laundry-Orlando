do $guard$
declare
  v_state public.a7_w3d_concurrency_probe_state;
begin
  if current_database() !~ '^a7_w3d_' then
    raise exception 'W3-D concurrency verification requires a disposable a7_w3d_* database';
  end if;
  select * into strict v_state from public.a7_w3d_concurrency_probe_state;
  if (select count(*) from public.a7_orlando_route_events
      where route_id=v_state.route_id and stop_id=v_state.stop_id and action='pickup_completed') <> 1 then
    raise exception 'Concurrent pickup produced duplicate or missing route evidence';
  end if;
  if (select count(*) from public.a7_orlando_operational_events
      where order_id=v_state.order_id and action='confirm_pickup') <> 1 then
    raise exception 'Concurrent pickup produced duplicate or missing canonical order evidence';
  end if;
  if (select custody_state from public.a7_orlando_orders where id=v_state.order_id) <> 'with_driver_pickup' then
    raise exception 'Concurrent pickup left canonical custody inconsistent';
  end if;
  if (select status from public.a7_orlando_route_stops where id=v_state.stop_id) <> 'completed' then
    raise exception 'Concurrent pickup left route stop inconsistent';
  end if;
end;
$guard$;

drop function public.a7_w3d_concurrency_attempt(text, text, text);
drop table public.a7_w3d_concurrency_probe_state;

select 'W3-D concurrent Owner/Manager pickup: PASS' as result;
