-- Normal rollback is application-first. Remove the operator RPC while preserving operational evidence.
revoke all on function public.a7_orlando_w1b_operator_mark_ready(text,text,text,timestamptz)
  from public, anon, authenticated, service_role;
drop function if exists public.a7_orlando_w1b_operator_mark_ready(text,text,text,timestamptz);

do $$
begin
  if not exists (
    select 1 from public.a7_orlando_operational_events where actor_role = 'operator' limit 1
  ) then
    alter table public.a7_orlando_operational_events
      drop constraint if exists a7_orlando_operational_events_actor_role_check;
    alter table public.a7_orlando_operational_events
      add constraint a7_orlando_operational_events_actor_role_check check (actor_role = 'owner');
  end if;
end $$;
