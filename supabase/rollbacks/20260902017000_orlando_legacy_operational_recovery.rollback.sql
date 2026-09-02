-- Fail closed when recovery evidence exists; historical facts are never deleted.
do $$
begin
  if exists (
    select 1 from public.a7_orlando_operational_events
    where action = 'initialize_legacy_order'
  ) then
    raise exception 'Rollback blocked: legacy initialization evidence exists';
  end if;
end;
$$;

drop function if exists public.a7_orlando_initialize_legacy_order(text,text,text,text,text,timestamptz);

alter table public.a7_orlando_operational_events
  drop constraint if exists a7_orlando_operational_events_action_check;
alter table public.a7_orlando_operational_events
  add constraint a7_orlando_operational_events_action_check check (action in (
    'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
    'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by',
    'assign_pickup_driver', 'assign_delivery_driver', 'manual_payment_recorded'
  )) not valid;
alter table public.a7_orlando_operational_events
  validate constraint a7_orlando_operational_events_action_check;
