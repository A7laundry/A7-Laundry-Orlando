-- Exceptional rollback for W2-A. Refuse destructive removal after any draft/audit data exists.
do $$
begin
  if to_regclass('public.a7_orlando_order_message_drafts') is not null
    and exists (select 1 from public.a7_orlando_order_message_drafts limit 1) then
    raise exception 'W2-A rollback refused: message draft evidence exists';
  end if;
  if to_regclass('public.a7_orlando_order_message_events') is not null
    and exists (select 1 from public.a7_orlando_order_message_events limit 1) then
    raise exception 'W2-A rollback refused: message audit evidence exists';
  end if;
end;
$$;

drop function if exists public.a7_orlando_w2_a_act_on_draft(uuid,text,integer,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_w2_a_create_draft(text,text,text,text,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_w2_a_drafts(text);
drop function if exists public.a7_orlando_w2_a_context(text);
drop function if exists public.a7_orlando_w2_a_template_available(text, public.a7_orlando_orders);
drop table if exists public.a7_orlando_order_message_events;
drop table if exists public.a7_orlando_order_message_drafts;
