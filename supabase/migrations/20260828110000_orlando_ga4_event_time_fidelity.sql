begin;

alter table public.a7_orlando_analytics_outbox
  add column if not exists occurred_at timestamptz;

update public.a7_orlando_analytics_outbox o
set occurred_at = e.occurred_at
from public.a7_orlando_order_events e
where e.event_id = o.event_id
  and o.occurred_at is null;

create or replace function public.a7_orlando_sync_outbox_occurred_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select e.occurred_at into new.occurred_at
  from public.a7_orlando_order_events e
  where e.event_id = new.event_id;

  if new.occurred_at is null then
    raise exception 'Outbox event timestamp is unavailable';
  end if;

  return new;
end;
$$;

drop trigger if exists a7_orlando_outbox_event_time on public.a7_orlando_analytics_outbox;
create trigger a7_orlando_outbox_event_time
before insert or update of event_id on public.a7_orlando_analytics_outbox
for each row execute function public.a7_orlando_sync_outbox_occurred_at();

alter table public.a7_orlando_analytics_outbox
  alter column occurred_at set not null;

commit;
