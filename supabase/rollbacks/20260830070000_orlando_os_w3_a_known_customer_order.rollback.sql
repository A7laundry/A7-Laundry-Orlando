-- W3-A rollback is non-destructive: existing known-customer orders remain standard governed orders.
drop function if exists public.a7_orlando_resolve_known_customer_order_retry(uuid,text,uuid);
drop function if exists public.a7_orlando_create_known_customer_order(
  uuid,text,text,text,uuid,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
);
