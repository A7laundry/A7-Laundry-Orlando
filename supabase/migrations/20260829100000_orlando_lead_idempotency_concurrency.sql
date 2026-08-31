-- A7 Laundry Orlando — make lead idempotency safe under concurrent duplicate submissions.
-- This additive replacement is required because migration 20260828100000 is already applied remotely.

create or replace function public.a7_orlando_create_lead(
  p_idempotency_key text,
  p_event_id text,
  p_lead_origin text,
  p_conversation_id uuid,
  p_customer_id uuid,
  p_attribution_id text,
  p_lead_reference text,
  p_attribution_resolution text,
  p_service_type text,
  p_customer_type text,
  p_language text,
  p_accommodation_type text,
  p_service_area_bucket text,
  p_operational_data jsonb,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead public.a7_orlando_leads;
  v_lead_json jsonb;
  v_event public.a7_orlando_order_events;
  v_created boolean;
  v_ref text := nullif(upper(coalesce(p_lead_reference, '')), '');
begin
  if coalesce(p_idempotency_key, '') = '' or coalesce(p_event_id, '') = '' then
    raise exception 'Lead idempotency and event IDs are required';
  end if;
  if v_ref is not null and v_ref !~ '^[23456789A-HJ-NP-Z]{10}$' then
    raise exception 'Invalid lead reference';
  end if;

  insert into public.a7_orlando_leads (
    idempotency_key, conversation_id, customer_id, attribution_id, lead_reference,
    attribution_resolution, lead_origin, service_type, customer_type, language,
    accommodation_type, service_area_bucket, operational_data
  ) values (
    p_idempotency_key, p_conversation_id, p_customer_id, p_attribution_id, v_ref,
    coalesce(p_attribution_resolution, 'unknown'), p_lead_origin, p_service_type,
    coalesce(p_customer_type, 'unknown'), coalesce(p_language, 'unknown'),
    p_accommodation_type, p_service_area_bucket, coalesce(p_operational_data, '{}'::jsonb)
  ) on conflict (idempotency_key) do update set
    idempotency_key = excluded.idempotency_key
  returning to_jsonb(a7_orlando_leads), (xmax = 0) into v_lead_json, v_created;

  v_lead := jsonb_populate_record(null::public.a7_orlando_leads, v_lead_json);

  if not v_created then
    select * into v_event from public.a7_orlando_order_events
      where idempotency_key = 'event:' || p_idempotency_key;
    if v_lead.id is null
      or v_event.id is null
      or v_event.event_name is distinct from 'generate_lead'
      or v_event.event_id is distinct from p_event_id
      or v_event.lead_id is distinct from v_lead.id
      or v_lead.lead_origin is distinct from p_lead_origin
      or v_lead.customer_id is distinct from p_customer_id
      or v_lead.conversation_id is distinct from p_conversation_id then
      raise exception 'Idempotency key conflicts with another lead';
    end if;
  else
    insert into public.a7_orlando_order_events (
      event_id, idempotency_key, event_name, source_system, lead_id, occurred_at, payload
    ) values (
      p_event_id, 'event:' || p_idempotency_key, 'generate_lead',
      case when p_lead_origin = 'whatsapp_inbound' then 'whatsapp' else 'crm' end,
      v_lead.id, coalesce(p_occurred_at, now()),
      jsonb_build_object(
        'lead_id', v_lead.id,
        'lead_origin', v_lead.lead_origin,
        'lead_reference', v_lead.lead_reference,
        'service_type', v_lead.service_type,
        'customer_type', v_lead.customer_type,
        'attribution_resolution', v_lead.attribution_resolution
      )
    );
  end if;

  return jsonb_build_object('created', v_created, 'lead', to_jsonb(v_lead));
end;
$$;

revoke all on function public.a7_orlando_create_lead(text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_create_lead(text,text,text,uuid,uuid,text,text,text,text,text,text,text,text,jsonb,timestamptz)
  to service_role;
