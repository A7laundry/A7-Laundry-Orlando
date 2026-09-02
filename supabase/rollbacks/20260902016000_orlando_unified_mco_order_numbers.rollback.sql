-- Application rollback only. Orders already issued with MCO numbers are
-- durable operational references and must never be renumbered.
drop function if exists public.a7_orlando_accept_existing_lead_order_v2(
  uuid,text,text,text,uuid,jsonb,text,text,text,timestamptz,timestamptz,numeric,integer,timestamptz,jsonb,timestamptz
);
