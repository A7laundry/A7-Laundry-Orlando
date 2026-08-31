-- A7 Laundry Orlando — WhatsApp Cloud API bridge
-- Service-role only. The browser/system consumes the authenticated bridge API,
-- never these tables or the Meta token directly.

create extension if not exists pgcrypto;
create table if not exists public.a7_wa_contacts (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null,
  wa_id text not null,
  profile_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_key, wa_id)
);
create table if not exists public.a7_wa_conversations (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null,
  phone_number_id text not null,
  contact_id uuid not null references public.a7_wa_contacts(id) on delete cascade,
  wa_id text not null,
  profile_name text,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_key, phone_number_id, contact_id)
);
create table if not exists public.a7_wa_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.a7_wa_conversations(id) on delete cascade,
  unit_key text not null,
  wa_message_id text not null unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  source text not null check (source in ('cloud_api', 'business_app', 'history_sync')),
  message_type text not null,
  text_body text,
  caption text,
  media_id text,
  media_mime_type text,
  media_sha256 text,
  media_filename text,
  reply_to_wa_message_id text,
  referral jsonb,
  status text not null,
  occurred_at timestamptz not null,
  is_historical boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists a7_wa_conversations_unread_idx
  on public.a7_wa_conversations (unit_key, unread_count, last_message_at desc);
create index if not exists a7_wa_messages_history_idx
  on public.a7_wa_messages (conversation_id, occurred_at);
create index if not exists a7_wa_messages_media_idx
  on public.a7_wa_messages (media_id) where media_id is not null;
alter table public.a7_wa_contacts enable row level security;
alter table public.a7_wa_conversations enable row level security;
alter table public.a7_wa_messages enable row level security;
revoke all on public.a7_wa_contacts from anon, authenticated;
revoke all on public.a7_wa_conversations from anon, authenticated;
revoke all on public.a7_wa_messages from anon, authenticated;
grant all on public.a7_wa_contacts to service_role;
grant all on public.a7_wa_conversations to service_role;
grant all on public.a7_wa_messages to service_role;
create or replace function public.a7_wa_ingest_message(
  p_unit_key text,
  p_phone_number_id text,
  p_wa_id text,
  p_profile_name text,
  p_wa_message_id text,
  p_direction text,
  p_source text,
  p_message_type text,
  p_text_body text,
  p_caption text,
  p_media_id text,
  p_media_mime_type text,
  p_media_sha256 text,
  p_media_filename text,
  p_reply_to_wa_message_id text,
  p_referral jsonb,
  p_occurred_at timestamptz,
  p_is_historical boolean,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_preview text;
begin
  if p_unit_key is null or p_wa_id is null or p_wa_message_id is null then
    raise exception 'Required WhatsApp identifiers are missing';
  end if;

  insert into public.a7_wa_contacts (unit_key, wa_id, profile_name)
  values (p_unit_key, p_wa_id, nullif(p_profile_name, ''))
  on conflict (unit_key, wa_id) do update
    set profile_name = coalesce(nullif(excluded.profile_name, ''), a7_wa_contacts.profile_name),
        updated_at = now()
  returning id into v_contact_id;

  insert into public.a7_wa_conversations (
    unit_key, phone_number_id, contact_id, wa_id, profile_name
  ) values (
    p_unit_key, coalesce(p_phone_number_id, ''), v_contact_id, p_wa_id, nullif(p_profile_name, '')
  )
  on conflict (unit_key, phone_number_id, contact_id) do update
    set profile_name = coalesce(nullif(excluded.profile_name, ''), a7_wa_conversations.profile_name),
        updated_at = now()
  returning id into v_conversation_id;

  insert into public.a7_wa_messages (
    conversation_id, unit_key, wa_message_id, direction, source, message_type,
    text_body, caption, media_id, media_mime_type, media_sha256, media_filename,
    reply_to_wa_message_id, referral, status, occurred_at, is_historical
  ) values (
    v_conversation_id, p_unit_key, p_wa_message_id, p_direction, p_source, p_message_type,
    p_text_body, p_caption, p_media_id, p_media_mime_type, p_media_sha256, p_media_filename,
    p_reply_to_wa_message_id, p_referral, coalesce(p_status, 'received'),
    coalesce(p_occurred_at, now()), coalesce(p_is_historical, false)
  )
  on conflict (wa_message_id) do nothing
  returning id into v_message_id;

  if v_message_id is null then
    return jsonb_build_object('duplicate', true, 'conversation_id', v_conversation_id);
  end if;

  v_preview := left(coalesce(nullif(p_text_body, ''), nullif(p_caption, ''), '[' || p_message_type || ']'), 180);
  update public.a7_wa_conversations
  set unread_count = unread_count + case
        when p_direction = 'inbound' and not coalesce(p_is_historical, false) then 1 else 0 end,
      last_message_at = case
        when last_message_at is null or p_occurred_at >= last_message_at then p_occurred_at else last_message_at end,
      last_message_preview = case
        when last_message_at is null or p_occurred_at >= last_message_at then v_preview else last_message_preview end,
      updated_at = now()
  where id = v_conversation_id;

  return jsonb_build_object(
    'duplicate', false,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id
  );
end;
$$;
create or replace function public.a7_wa_record_outbound(
  p_unit_key text,
  p_phone_number_id text,
  p_wa_id text,
  p_wa_message_id text,
  p_text_body text,
  p_occurred_at timestamptz
) returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.a7_wa_ingest_message(
    p_unit_key, p_phone_number_id, p_wa_id, null, p_wa_message_id,
    'outbound', 'cloud_api', 'text', p_text_body, null, null, null, null, null,
    null, null, p_occurred_at, false, 'sent'
  );
$$;
create or replace function public.a7_wa_update_message_status(
  p_unit_key text,
  p_wa_message_id text,
  p_status text,
  p_occurred_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.a7_wa_messages
  set status = p_status,
      read_at = case when p_status = 'read' then coalesce(p_occurred_at, now()) else read_at end
  where unit_key = p_unit_key and wa_message_id = p_wa_message_id;
  return found;
end;
$$;
create or replace function public.a7_wa_mark_read(
  p_unit_key text,
  p_conversation_id uuid,
  p_read_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.a7_wa_conversations
  set unread_count = 0, updated_at = now()
  where id = p_conversation_id and unit_key = p_unit_key;
  if not found then raise exception 'Conversation not found'; end if;

  update public.a7_wa_messages
  set read_at = coalesce(p_read_at, now())
  where conversation_id = p_conversation_id
    and unit_key = p_unit_key
    and direction = 'inbound'
    and read_at is null;
  get diagnostics v_updated = row_count;
  return jsonb_build_object('conversation_id', p_conversation_id, 'messages_marked', v_updated);
end;
$$;
revoke all on function public.a7_wa_ingest_message(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,timestamptz,boolean,text) from public, anon, authenticated;
revoke all on function public.a7_wa_record_outbound(text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_wa_update_message_status(text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_wa_mark_read(text,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.a7_wa_ingest_message(text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,jsonb,timestamptz,boolean,text) to service_role;
grant execute on function public.a7_wa_record_outbound(text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_wa_update_message_status(text,text,text,timestamptz) to service_role;
grant execute on function public.a7_wa_mark_read(text,uuid,timestamptz) to service_role;
