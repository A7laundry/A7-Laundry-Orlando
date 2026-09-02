-- Exceptional W3-D schema rollback. Valid only before any route evidence exists.
do $$
declare
  v_has_evidence boolean := false;
begin
  if to_regclass('public.a7_orlando_route_events') is not null then
    execute 'select exists (select 1 from public.a7_orlando_route_events limit 1)' into v_has_evidence;
  end if;
  if not v_has_evidence and to_regclass('public.a7_orlando_route_stops') is not null then
    execute 'select exists (select 1 from public.a7_orlando_route_stops limit 1)' into v_has_evidence;
  end if;
  if not v_has_evidence and to_regclass('public.a7_orlando_routes') is not null then
    execute 'select exists (select 1 from public.a7_orlando_routes limit 1)' into v_has_evidence;
  end if;
  if v_has_evidence then
    raise exception 'Rollback blocked: W3-D route evidence exists; preserve append-only operational history';
  end if;
end;
$$;

drop table if exists public.a7_orlando_route_events;
drop table if exists public.a7_orlando_route_stops;
drop table if exists public.a7_orlando_routes;
