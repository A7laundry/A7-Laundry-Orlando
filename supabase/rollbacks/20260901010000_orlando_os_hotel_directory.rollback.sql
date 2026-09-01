-- Guarded hotel-directory rollback. Application rollback is primary and leaves additive schema inert.
-- Structural removal is allowed only before any hotel, audit event or order/lead link exists.

do $$
declare
  v_hotels bigint := 0;
  v_events bigint := 0;
  v_lead_links bigint := 0;
  v_order_links bigint := 0;
begin
  if to_regclass('public.a7_orlando_hotels') is not null then
    select count(*) into v_hotels from public.a7_orlando_hotels;
  end if;
  if to_regclass('public.a7_orlando_hotel_events') is not null then
    select count(*) into v_events from public.a7_orlando_hotel_events;
  end if;
  if to_regclass('public.a7_orlando_leads') is not null then
    select count(*) into v_lead_links from public.a7_orlando_leads where hotel_id is not null;
  end if;
  if to_regclass('public.a7_orlando_orders') is not null then
    select count(*) into v_order_links from public.a7_orlando_orders where hotel_id is not null;
  end if;
  if v_hotels > 0 or v_events > 0 or v_lead_links > 0 or v_order_links > 0 then
    raise exception 'Hotel directory rollback refused: hotels=%, events=%, lead_links=%, order_links=%',
      v_hotels, v_events, v_lead_links, v_order_links;
  end if;
end;
$$;

drop trigger if exists a7_orlando_orders_capture_hotel on public.a7_orlando_orders;
drop trigger if exists a7_orlando_leads_capture_hotel on public.a7_orlando_leads;
drop function if exists public.a7_orlando_capture_hotel_link();
drop function if exists public.a7_orlando_upsert_hotel(uuid,text,text,text,text[],text,boolean,text,text,text,timestamptz);
drop function if exists public.a7_orlando_list_hotels(text,boolean,integer);
alter table public.a7_orlando_orders drop column if exists hotel_id;
alter table public.a7_orlando_leads drop column if exists hotel_id;
drop table if exists public.a7_orlando_hotel_events;
drop table if exists public.a7_orlando_hotels;
