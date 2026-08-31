-- A7 Orlando OS W1A — reviewed schema rollback.
-- This file is intentionally outside supabase/migrations and must never run automatically.
-- Application rollback (previous Vercel deployment + stopped writes) is the primary response.
-- Schema removal is allowed only after this guard confirms there are no W1A records.

do $$
declare
  v_items bigint := 0;
  v_requests bigint := 0;
  v_audit bigint := 0;
begin
  if to_regclass('public.a7_orlando_order_items') is not null then
    execute 'select count(*) from public.a7_orlando_order_items' into v_items;
  end if;
  if to_regclass('public.a7_orlando_manual_order_requests') is not null then
    execute 'select count(*) from public.a7_orlando_manual_order_requests' into v_requests;
  end if;
  if to_regclass('public.a7_orlando_operator_audit') is not null then
    execute 'select count(*) from public.a7_orlando_operator_audit' into v_audit;
  end if;
  if v_items > 0 or v_requests > 0 or v_audit > 0 then
    raise exception 'W1A rollback refused: items=%, requests=%, audit=%; archive and remove only explicitly approved QA aggregates first',
      v_items, v_requests, v_audit;
  end if;
end;
$$;

drop function if exists public.a7_orlando_create_manual_order(
  uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,jsonb,timestamptz
);
drop table if exists public.a7_orlando_operator_audit;
drop table if exists public.a7_orlando_manual_order_requests;
drop table if exists public.a7_orlando_order_items;
drop sequence if exists public.a7_orlando_order_number_seq;
