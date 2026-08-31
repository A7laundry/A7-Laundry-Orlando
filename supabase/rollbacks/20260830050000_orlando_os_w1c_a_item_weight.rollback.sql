-- Exceptional rollback for W1C-A.
-- Normal rollback is application-only. This script refuses to remove schema after any item weight exists.

do $$
begin
  if exists (select 1 from public.a7_orlando_item_weight_events limit 1)
    or exists (select 1 from public.a7_orlando_order_items where actual_lbs is not null limit 1) then
    raise exception 'W1C-A weight evidence exists; keep additive schema and use application rollback';
  end if;
end;
$$;

drop function if exists public.a7_orlando_w1c_a_record_item_weight(text,uuid,numeric,integer,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_w1c_a_snapshot();
drop function if exists public.a7_orlando_w1c_a_order(text);
drop function if exists public.a7_orlando_w1c_a_order_payload(uuid);
drop trigger if exists a7_orlando_w1c_a_skip_weight_when_not_required on public.a7_orlando_orders;
drop function if exists public.a7_orlando_w1c_a_skip_weight_when_not_required();
drop table if exists public.a7_orlando_item_weight_events;

alter table public.a7_orlando_order_items
  drop constraint if exists a7_orlando_order_items_actual_weight_valid,
  drop constraint if exists a7_orlando_order_items_subtotal_valid,
  drop constraint if exists a7_orlando_order_items_weight_version_valid,
  drop column if exists actual_lbs,
  drop column if exists weighed_at,
  drop column if exists subtotal,
  drop column if exists weight_version;
