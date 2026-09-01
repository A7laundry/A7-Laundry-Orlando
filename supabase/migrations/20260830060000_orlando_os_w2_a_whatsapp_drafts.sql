-- A7 Orlando OS W2-A — deterministic, human-reviewed WhatsApp message drafts.
-- Additive and service-role only. This migration does not call Meta or send a message.

create table if not exists public.a7_orlando_order_message_drafts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  template_key text not null check (template_key in (
    'order_confirmed', 'pickup_confirmed', 'received_at_laundry',
    'ready_for_delivery', 'payment_confirmed', 'delivered'
  )),
  language text not null check (language in ('en', 'pt', 'es')),
  rendered_text text not null check (char_length(rendered_text) between 1 and 2000),
  facts_hash text not null check (facts_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'drafted' check (status in ('drafted', 'approved', 'copied', 'void')),
  created_by text not null,
  approved_by text,
  approved_at timestamptz,
  copied_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.a7_orlando_order_message_events (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.a7_orlando_order_message_drafts(id) on delete restrict,
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  action text not null check (action in ('draft_created', 'draft_approved', 'draft_copied')),
  actor_id text not null,
  actor_role text not null check (actor_role = 'owner'),
  idempotency_key text not null unique,
  draft_version integer not null check (draft_version > 0),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists a7_orlando_order_message_drafts_order_idx
  on public.a7_orlando_order_message_drafts (order_id, created_at desc, id);
create index if not exists a7_orlando_order_message_events_order_idx
  on public.a7_orlando_order_message_events (order_id, occurred_at, id);

alter table public.a7_orlando_order_message_drafts enable row level security;
alter table public.a7_orlando_order_message_events enable row level security;
revoke all on public.a7_orlando_order_message_drafts from public, anon, authenticated;
revoke all on public.a7_orlando_order_message_events from public, anon, authenticated;
grant all on public.a7_orlando_order_message_drafts to service_role;
grant all on public.a7_orlando_order_message_events to service_role;

comment on table public.a7_orlando_order_message_drafts is
  'Protected W2-A exact text snapshots. Drafts are reviewed manually and are not transport/send records.';
comment on table public.a7_orlando_order_message_events is
  'Append-only W2-A draft, approval and clipboard acknowledgement audit.';

create or replace function public.a7_orlando_w2_a_template_available(
  p_template_key text,
  p_order public.a7_orlando_orders
) returns boolean language sql immutable as $$
  select case p_template_key
    when 'order_confirmed' then p_order.order_status not in ('cancelled', 'delivered')
    when 'pickup_confirmed' then p_order.order_status in ('picked_up', 'weighed', 'invoice_created', 'ready_for_delivery', 'delivered')
      or p_order.custody_state in ('with_driver_pickup', 'at_laundry', 'with_driver_delivery', 'bell_desk', 'delivered')
    when 'received_at_laundry' then p_order.custody_state in ('at_laundry', 'with_driver_delivery', 'bell_desk', 'delivered')
    when 'ready_for_delivery' then p_order.production_state = 'ready'
    when 'payment_confirmed' then p_order.payment_status = 'paid'
    when 'delivered' then p_order.order_status = 'delivered' or p_order.custody_state = 'delivered'
    else false
  end;
$$;

create or replace function public.a7_orlando_w2_a_context(p_order_number text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_result jsonb;
begin
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number limit 1;
  if v_order.id is null then return null; end if;

  select jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.order_status,
    'payment_status', v_order.payment_status,
    'custody_state', v_order.custody_state,
    'production_state', v_order.production_state,
    'service_tier', coalesce(v_order.service_tier, 'normal'),
    'pickup_window_start', v_order.pickup_window_start,
    'pickup_window_end', v_order.pickup_window_end,
    'promised_by', v_order.promised_by,
    'customer_name', c.profile_name,
    'whatsapp_last4', right(c.wa_id, 4),
    'language', coalesce(nullif(l.language, 'unknown'), 'en'),
    'is_qa', public.a7_orlando_order_is_qa(v_order.id),
    'available_templates', coalesce((
      select jsonb_agg(keys.key order by keys.position)
      from (values
        (1, 'order_confirmed'), (2, 'pickup_confirmed'), (3, 'received_at_laundry'),
        (4, 'ready_for_delivery'), (5, 'payment_confirmed'), (6, 'delivered')
      ) as keys(position, key)
      where public.a7_orlando_w2_a_template_available(keys.key, v_order)
    ), '[]'::jsonb)
  ) into v_result
  from public.a7_orlando_leads l
  left join public.a7_wa_contacts c on c.id = v_order.customer_id
  where l.id = v_order.lead_id;
  return v_result;
end;
$$;

create or replace function public.a7_orlando_w2_a_drafts(p_order_number text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'draft_id', d.id,
    'template_key', d.template_key,
    'language', d.language,
    'rendered_text', d.rendered_text,
    'facts_hash', d.facts_hash,
    'status', d.status,
    'version', d.version,
    'created_at', d.created_at,
    'approved_at', d.approved_at,
    'copied_at', d.copied_at
  ) order by d.created_at desc, d.id desc), '[]'::jsonb)
  from public.a7_orlando_order_message_drafts d
  join public.a7_orlando_orders o on o.id = d.order_id
  where o.unit_key = 'orlando' and o.order_number = p_order_number;
$$;

create or replace function public.a7_orlando_w2_a_resolve_create_retry(
  p_order_number text,
  p_template_key text,
  p_idempotency_key text
) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_draft public.a7_orlando_order_message_drafts;
  v_event public.a7_orlando_order_message_events;
begin
  if coalesce(p_idempotency_key, '') = '' then raise exception 'Message retry identity is invalid'; end if;
  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number;
  if v_order.id is null then raise exception 'Order not found'; end if;
  select * into v_event from public.a7_orlando_order_message_events where idempotency_key = p_idempotency_key;
  if v_event.id is null then return null; end if;
  select * into v_draft from public.a7_orlando_order_message_drafts where id = v_event.draft_id;
  if v_event.action <> 'draft_created' or v_event.order_id <> v_order.id
    or v_draft.template_key <> p_template_key then
    raise exception 'Idempotency key conflicts with another message draft';
  end if;
  return jsonb_build_object('duplicate', true, 'draft', to_jsonb(v_draft));
end;
$$;

create or replace function public.a7_orlando_w2_a_create_draft(
  p_order_number text,
  p_template_key text,
  p_language text,
  p_rendered_text text,
  p_facts_hash text,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.a7_orlando_orders;
  v_draft public.a7_orlando_order_message_drafts;
  v_event public.a7_orlando_order_message_events;
  v_when timestamptz := coalesce(p_occurred_at, now());
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner' or coalesce(p_idempotency_key, '') = '' then
    raise exception 'Invalid Owner message draft contract';
  end if;
  if p_language not in ('en', 'pt', 'es') or p_template_key not in (
    'order_confirmed', 'pickup_confirmed', 'received_at_laundry',
    'ready_for_delivery', 'payment_confirmed', 'delivered'
  ) or char_length(coalesce(p_rendered_text, '')) not between 1 and 2000
    or coalesce(p_facts_hash, '') !~ '^[0-9a-f]{64}$' then
    raise exception 'Message draft fields are invalid';
  end if;

  select * into v_order from public.a7_orlando_orders
    where unit_key = 'orlando' and order_number = p_order_number for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders cannot create customer messages'; end if;

  select * into v_event from public.a7_orlando_order_message_events where idempotency_key = p_idempotency_key;
  if v_event.id is not null then
    select * into v_draft from public.a7_orlando_order_message_drafts where id = v_event.draft_id;
    if v_event.action <> 'draft_created' or v_event.order_id <> v_order.id
      or v_draft.template_key <> p_template_key or v_draft.language <> p_language
      or v_draft.rendered_text <> p_rendered_text or v_draft.facts_hash <> p_facts_hash then
      raise exception 'Idempotency key conflicts with another message draft';
    end if;
    return jsonb_build_object('duplicate', true, 'draft', to_jsonb(v_draft));
  end if;

  if v_order.order_status = 'cancelled' or not public.a7_orlando_w2_a_template_available(p_template_key, v_order) then
    raise exception 'Message template is not available for the current order state';
  end if;

  insert into public.a7_orlando_order_message_drafts(
    order_id, template_key, language, rendered_text, facts_hash, created_by, created_at, updated_at
  ) values (
    v_order.id, p_template_key, p_language, p_rendered_text, p_facts_hash, p_actor_id, v_when, v_when
  ) returning * into v_draft;
  insert into public.a7_orlando_order_message_events(
    draft_id, order_id, action, actor_id, actor_role, idempotency_key, draft_version, occurred_at
  ) values (
    v_draft.id, v_order.id, 'draft_created', p_actor_id, p_actor_role, p_idempotency_key, v_draft.version, v_when
  );
  return jsonb_build_object('duplicate', false, 'draft', to_jsonb(v_draft));
end;
$$;

create or replace function public.a7_orlando_w2_a_act_on_draft(
  p_draft_id uuid,
  p_action text,
  p_expected_version integer,
  p_current_facts_hash text,
  p_actor_id text,
  p_actor_role text,
  p_idempotency_key text,
  p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_draft public.a7_orlando_order_message_drafts;
  v_order public.a7_orlando_orders;
  v_event public.a7_orlando_order_message_events;
  v_expected_action text;
  v_when timestamptz := coalesce(p_occurred_at, now());
begin
  if coalesce(p_actor_id, '') = '' or p_actor_role <> 'owner' or coalesce(p_idempotency_key, '') = ''
    or p_action not in ('approve', 'copy') then raise exception 'Invalid Owner message action contract'; end if;
  v_expected_action := case p_action when 'approve' then 'draft_approved' else 'draft_copied' end;

  select * into v_draft from public.a7_orlando_order_message_drafts where id = p_draft_id for update;
  if v_draft.id is null then raise exception 'Message draft not found'; end if;
  select * into v_order from public.a7_orlando_orders where id = v_draft.order_id for update;
  if public.a7_orlando_order_is_qa(v_order.id) then raise exception 'QA orders cannot create customer messages'; end if;

  select * into v_event from public.a7_orlando_order_message_events where idempotency_key = p_idempotency_key;
  if v_event.id is not null then
    if v_event.action <> v_expected_action or v_event.draft_id <> v_draft.id then
      raise exception 'Idempotency key conflicts with another message action';
    end if;
    return jsonb_build_object('duplicate', true, 'draft', to_jsonb(v_draft));
  end if;

  if p_expected_version <> v_draft.version then raise exception 'Message draft version is stale'; end if;
  if p_action = 'approve' then
    if v_draft.status <> 'drafted' or p_current_facts_hash <> v_draft.facts_hash
      or v_order.order_status = 'cancelled'
      or not public.a7_orlando_w2_a_template_available(v_draft.template_key, v_order) then
      raise exception 'Message draft is stale or cannot be approved';
    end if;
    update public.a7_orlando_order_message_drafts set
      status = 'approved', approved_by = p_actor_id, approved_at = v_when,
      version = version + 1, updated_at = v_when
    where id = v_draft.id returning * into v_draft;
  else
    if v_draft.status not in ('approved', 'copied') then raise exception 'Approve the message before copying'; end if;
    update public.a7_orlando_order_message_drafts set
      status = 'copied', copied_at = v_when, version = version + 1, updated_at = v_when
    where id = v_draft.id returning * into v_draft;
  end if;

  insert into public.a7_orlando_order_message_events(
    draft_id, order_id, action, actor_id, actor_role, idempotency_key, draft_version, occurred_at
  ) values (
    v_draft.id, v_order.id, v_expected_action, p_actor_id, p_actor_role,
    p_idempotency_key, v_draft.version, v_when
  );
  return jsonb_build_object('duplicate', false, 'draft', to_jsonb(v_draft));
end;
$$;

revoke all on function public.a7_orlando_w2_a_template_available(text, public.a7_orlando_orders) from public, anon, authenticated;
revoke all on function public.a7_orlando_w2_a_context(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w2_a_drafts(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w2_a_resolve_create_retry(text,text,text) from public, anon, authenticated;
revoke all on function public.a7_orlando_w2_a_create_draft(text,text,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.a7_orlando_w2_a_act_on_draft(uuid,text,integer,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.a7_orlando_w2_a_template_available(text, public.a7_orlando_orders) to service_role;
grant execute on function public.a7_orlando_w2_a_context(text) to service_role;
grant execute on function public.a7_orlando_w2_a_drafts(text) to service_role;
grant execute on function public.a7_orlando_w2_a_resolve_create_retry(text,text,text) to service_role;
grant execute on function public.a7_orlando_w2_a_create_draft(text,text,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.a7_orlando_w2_a_act_on_draft(uuid,text,integer,text,text,text,text,timestamptz) to service_role;
