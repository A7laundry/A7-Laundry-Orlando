-- Guarded rollback for A7-038 Packet 4. Never discard real Stripe/payment evidence.
do $$ begin
  if exists (select 1 from public.a7_orlando_payment_links)
    or exists (select 1 from public.a7_orlando_payments
      where invoice_id is not null or service_amount is not null
        or tip_amount <> 0 or total_amount is not null) then
    raise exception 'Rollback blocked: governed Payment Link or payment composition evidence exists';
  end if;
end $$;

drop function if exists public.a7_orlando_record_payment_v2(text,text,uuid,text,text,text,numeric,numeric,numeric,text,timestamptz);
drop function if exists public.a7_orlando_record_refund_v2(text,text,text,text,numeric,text,text,timestamptz);
drop function if exists public.a7_orlando_payment_link_fail(uuid,text,timestamptz);
drop function if exists public.a7_orlando_payment_link_activate(uuid,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_payment_link_reserve(uuid,uuid,uuid,numeric,numeric,numeric,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_payment_link_by_stripe_id(text);
drop function if exists public.a7_orlando_payment_link_current(uuid);
drop function if exists public.a7_orlando_payment_link_order(text);
drop index if exists public.a7_orlando_payment_links_order_idx;
drop index if exists public.a7_orlando_payment_links_one_current_invoice_idx;
drop table if exists public.a7_orlando_payment_links;

alter table public.a7_orlando_payments
  drop constraint if exists a7_orlando_payments_amount_composition,
  drop constraint if exists a7_orlando_payments_tip_nonnegative,
  drop column if exists total_amount,
  drop column if exists tip_amount,
  drop column if exists service_amount,
  drop column if exists invoice_id;
