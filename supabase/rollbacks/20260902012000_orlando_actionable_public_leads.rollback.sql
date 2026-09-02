-- Guarded rollback for actionable public leads.
-- Application rollback is preferred. The acceptance RPC cannot be removed
-- after it has produced durable operational evidence.

do $$
begin
  if exists (
    select 1 from public.a7_orlando_operator_audit
    where action = 'existing_lead_order_created'
  ) then raise exception 'Rollback blocked: existing-lead orders already use this contract'; end if;
end;
$$;

drop function if exists public.a7_orlando_accept_existing_lead_order(uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz);
drop function if exists public.a7_orlando_resolve_existing_lead_order_retry(uuid,text,uuid);
drop function if exists public.a7_orlando_actionable_lead(uuid);
drop function if exists public.a7_orlando_actionable_leads();
