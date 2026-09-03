-- Exceptional W3-D rollback. Application rollback is preferred because route evidence is append-only.
do $$
declare
  v_has_evidence boolean := false;
begin
  if to_regclass('public.a7_orlando_routes') is not null then
    execute 'select exists (select 1 from public.a7_orlando_routes limit 1)' into v_has_evidence;
  end if;
  if v_has_evidence then
    raise exception 'Rollback blocked: W3-D route evidence exists; disable application writes and preserve history';
  end if;
end;
$$;

drop function if exists public.a7_orlando_w3d_transactional_smoke(text,text,uuid);
drop function if exists public.a7_orlando_route_command(text,uuid,jsonb,text,text,text,timestamptz);
drop function if exists public.a7_orlando_route_eligible_stops(uuid);
drop function if exists public.a7_orlando_list_routes(date);
drop function if exists public.a7_orlando_route_payload(uuid);
drop function if exists public.a7_orlando_route_order_payload(uuid);
