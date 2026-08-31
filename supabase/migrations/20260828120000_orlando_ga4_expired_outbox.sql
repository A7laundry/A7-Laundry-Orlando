begin;

alter table public.a7_orlando_analytics_outbox
  drop constraint if exists a7_orlando_analytics_outbox_delivery_status_check;

alter table public.a7_orlando_analytics_outbox
  add constraint a7_orlando_analytics_outbox_delivery_status_check
  check (delivery_status in ('pending_identity', 'pending', 'sent', 'failed', 'disabled', 'expired'));

create or replace function public.a7_orlando_mark_outbox(
  p_event_id text,
  p_delivery_status text,
  p_last_error_code text,
  p_sent_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.a7_orlando_analytics_outbox;
begin
  if p_delivery_status not in ('pending_identity', 'pending', 'sent', 'failed', 'disabled', 'expired') then
    raise exception 'Invalid outbox delivery status';
  end if;
  update public.a7_orlando_analytics_outbox set
    delivery_status = p_delivery_status,
    attempts = attempts + 1,
    last_attempt_at = now(),
    last_error_code = nullif(p_last_error_code, ''),
    sent_at = case when p_delivery_status = 'sent' then coalesce(p_sent_at, now()) else sent_at end
  where event_id = p_event_id
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.a7_orlando_mark_outbox(text,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.a7_orlando_mark_outbox(text,text,text,timestamptz)
  to service_role;

commit;
