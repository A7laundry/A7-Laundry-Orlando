-- Guarded W1A.3 rollback. Application rollback is primary and leaves the additive read model inert.
-- Added columns are removed only when no W1A.3 customer/QA value was stored after migration.

do $$
declare
  v_email_rows bigint := 0;
  v_explicit_qa_rows bigint := 0;
begin
  if to_regclass('public.a7_wa_contacts') is not null then
    select count(*) into v_email_rows
    from public.a7_wa_contacts
    where email is not null or email_source is not null;
  end if;
  if to_regclass('public.a7_orlando_orders') is not null then
    select count(*) into v_explicit_qa_rows
    from public.a7_orlando_orders where is_qa;
  end if;
  if v_email_rows > 0 or v_explicit_qa_rows > 0 then
    raise exception 'W1A.3 column rollback refused: email_rows=%, explicit_qa_rows=%',
      v_email_rows, v_explicit_qa_rows;
  end if;
end;
$$;

drop function if exists public.a7_orlando_get_customer_lite(uuid);
drop function if exists public.a7_orlando_search_customers_lite(text,text,integer);
drop function if exists public.a7_orlando_order_confirmed_service_revenue(uuid);
drop function if exists public.a7_orlando_order_is_qa(uuid);
drop index if exists public.a7_wa_contacts_orlando_email_idx;
alter table public.a7_wa_contacts drop constraint if exists a7_wa_contacts_email_source_valid;
alter table public.a7_wa_contacts drop constraint if exists a7_wa_contacts_email_valid;
alter table public.a7_wa_contacts drop column if exists email_source;
alter table public.a7_wa_contacts drop column if exists email;
alter table public.a7_orlando_orders drop column if exists is_qa;
