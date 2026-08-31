-- W1A.1 exceptional schema rollback. Application rollback is primary and leaves this schema inert.
-- Refuse destructive cleanup after any W1A.1 order or financial-preparation value exists.

do $$
declare
  v_mco_orders bigint;
  v_bags bigint;
  v_payment_totals bigint;
begin
  select count(*) into v_mco_orders from public.a7_orlando_orders where order_number like 'MCO %';
  select count(*) into v_bags from public.a7_orlando_orders where bags_expected is not null;
  select count(*) into v_payment_totals from public.a7_orlando_orders where payment_total is not null;
  if v_mco_orders > 0 or v_bags > 0 or v_payment_totals > 0 then
    raise exception 'W1A.1 schema rollback refused: mco_orders=%, bags=%, payment_totals=%',
      v_mco_orders, v_bags, v_payment_totals;
  end if;
end;
$$;

drop function if exists public.a7_orlando_create_manual_order_v2(
  uuid,text,text,text,text,text,text,text,text,text,jsonb,text,text,text,text,
  timestamptz,timestamptz,numeric,integer,jsonb,timestamptz
);
revoke all on sequence public.a7_orlando_mco_order_number_seq from service_role;
drop sequence if exists public.a7_orlando_mco_order_number_seq;
alter table public.a7_orlando_orders drop constraint if exists a7_orlando_orders_payment_total_separated;
alter table public.a7_orlando_orders drop constraint if exists a7_orlando_orders_bags_expected_valid;
alter table public.a7_orlando_orders drop column if exists payment_total;
alter table public.a7_orlando_orders drop column if exists bags_expected;
