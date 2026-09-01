-- Exceptional rollback for unused W1C-B1 schema.
-- Normal rollback is application-only; financial evidence is never deleted.

do $$
begin
  if exists (select 1 from public.a7_orlando_invoices limit 1)
    or exists (select 1 from public.a7_orlando_invoice_events limit 1) then
    raise exception 'W1C-B1 invoice evidence exists; keep additive schema and use application rollback';
  end if;
end;
$$;

drop function if exists public.a7_orlando_w1c_b1_void_invoice(text,integer,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_w1c_b1_review_invoice(text,integer,integer,text,text,text,text,timestamptz);
drop function if exists public.a7_orlando_w1c_b1_resolve_action_retry(text,text,integer,text,text);
drop function if exists public.a7_orlando_w1c_b1_invoices(text);
drop function if exists public.a7_orlando_w1c_b1_invoice_payload(uuid);
drop function if exists public.a7_orlando_w1c_b1_preview(uuid);

alter table public.a7_orlando_orders drop column if exists current_invoice_id;
drop table if exists public.a7_orlando_invoice_events;
drop table if exists public.a7_orlando_invoice_lines;
drop table if exists public.a7_orlando_invoices;
