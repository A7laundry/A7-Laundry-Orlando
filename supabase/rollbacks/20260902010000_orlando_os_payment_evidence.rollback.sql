-- Prefer application rollback. This guarded SQL rollback is allowed only before V2 evidence exists.
do $$
begin
  if exists (
    select 1 from public.a7_orlando_manual_payments
    where source = 'operator_entry' and invoice_id is not null and created_at >= '2026-09-02'::timestamptz
  ) then
    raise exception 'Rollback blocked: V2 payment evidence exists';
  end if;
end;
$$;

drop function if exists public.a7_orlando_record_manual_payment_v2(
  text,text,numeric,numeric,timestamptz,text,text,text,text,text,text,timestamptz
);

alter table public.a7_orlando_orders
  drop constraint if exists a7_orlando_orders_tip_nonnegative;
alter table public.a7_orlando_orders
  add constraint a7_orlando_orders_tip_disabled_in_mvp
  check (tip_amount is null or tip_amount = 0) not valid;
alter table public.a7_orlando_orders
  validate constraint a7_orlando_orders_tip_disabled_in_mvp;

-- Columns are deliberately retained so an application rollback cannot erase evidence.
