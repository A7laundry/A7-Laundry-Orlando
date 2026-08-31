-- A7 Laundry Orlando — structured order-intake customer continuity.
-- Creates or resolves the protected customer key without exposing contact PII to analytics.

create or replace function public.a7_orlando_upsert_customer(
  p_wa_id text,
  p_profile_name text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_customer public.a7_wa_contacts;
begin
  if coalesce(p_wa_id, '') !~ '^[0-9]{10,15}$' then
    raise exception 'Invalid WhatsApp contact';
  end if;
  insert into public.a7_wa_contacts (unit_key, wa_id, profile_name)
  values ('orlando', p_wa_id, nullif(left(coalesce(p_profile_name, ''), 100), ''))
  on conflict (unit_key, wa_id) do update set
    profile_name = coalesce(excluded.profile_name, a7_wa_contacts.profile_name),
    updated_at = now()
  returning * into v_customer;
  return to_jsonb(v_customer);
end;
$$;

revoke all on function public.a7_orlando_upsert_customer(text,text) from public, anon, authenticated;
grant execute on function public.a7_orlando_upsert_customer(text,text) to service_role;
