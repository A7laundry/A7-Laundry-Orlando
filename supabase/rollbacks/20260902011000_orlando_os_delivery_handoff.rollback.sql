-- Prefer application rollback. Preserve columns/evidence; remove only the unused V2 RPC.
do $$
begin
  if exists (select 1 from public.a7_orlando_operational_events where handoff_point is not null) then
    raise exception 'Rollback blocked: delivery handoff evidence exists';
  end if;
end;
$$;

drop function if exists public.a7_orlando_operational_cycle_transition_v2(
  text,text,text,text,text,text,timestamptz,text,text,timestamptz
);
