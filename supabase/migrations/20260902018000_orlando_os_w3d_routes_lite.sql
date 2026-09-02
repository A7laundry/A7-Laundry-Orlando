-- A7 Orlando OS W3-D.1 — additive route organization domain.
-- Orders remain the source of lifecycle/custody/production/finance truth.

create table if not exists public.a7_orlando_routes (
  id uuid primary key default gen_random_uuid(),
  unit_key text not null default 'orlando' check (unit_key = 'orlando'),
  route_date date not null,
  driver_id uuid not null references public.a7_orlando_drivers(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  version integer not null default 1 check (version > 0),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft' and started_at is null and completed_at is null and cancelled_at is null)
    or (status = 'active' and started_at is not null and completed_at is null and cancelled_at is null)
    or (status = 'completed' and started_at is not null and completed_at is not null and cancelled_at is null)
    or (status = 'cancelled' and completed_at is null and cancelled_at is not null))
);

create index if not exists a7_orlando_routes_date_idx
  on public.a7_orlando_routes(route_date desc, created_at desc);
create index if not exists a7_orlando_routes_driver_idx
  on public.a7_orlando_routes(driver_id, route_date desc);

create table if not exists public.a7_orlando_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.a7_orlando_routes(id) on delete restrict,
  order_id uuid not null references public.a7_orlando_orders(id) on delete restrict,
  stop_type text not null check (stop_type in ('pickup', 'delivery')),
  stop_sequence integer not null check (stop_sequence > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'exception', 'cancelled')),
  result text check (result is null or result in (
    'pickup_completed', 'delivery_completed', 'handoff_recorded', 'could_not_complete', 'cancelled'
  )),
  -- True only while this order leg is reserved by a draft/active route.
  assignment_active boolean not null default true,
  eta_at timestamptz,
  note text check (note is null or length(note) <= 500),
  completed_at timestamptz,
  completed_by text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_id, order_id, stop_type),
  unique (route_id, stop_sequence),
  check ((status = 'pending' and result is null and completed_at is null and completed_by is null and assignment_active)
    or (status = 'completed' and result in ('pickup_completed', 'delivery_completed', 'handoff_recorded')
      and completed_at is not null and completed_by is not null and not assignment_active)
    or (status = 'exception' and result = 'could_not_complete'
      and completed_at is not null and completed_by is not null and not assignment_active)
    or (status = 'cancelled' and result = 'cancelled'
      and completed_at is not null and completed_by is not null and not assignment_active))
);

create unique index if not exists a7_orlando_route_stops_active_leg_idx
  on public.a7_orlando_route_stops(order_id, stop_type) where assignment_active;
create index if not exists a7_orlando_route_stops_route_idx
  on public.a7_orlando_route_stops(route_id, stop_sequence);

create table if not exists public.a7_orlando_route_events (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.a7_orlando_routes(id) on delete restrict,
  stop_id uuid references public.a7_orlando_route_stops(id) on delete restrict,
  order_id uuid references public.a7_orlando_orders(id) on delete restrict,
  action text not null check (action in (
    'route_created', 'stop_added', 'stop_removed', 'stops_reordered', 'route_started',
    'pickup_completed', 'delivery_completed', 'handoff_recorded', 'stop_exception',
    'route_completed', 'route_cancelled'
  )),
  actor_id text not null,
  actor_role text not null check (actor_role in ('owner', 'manager')),
  idempotency_key text not null unique,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  previous_state jsonb not null default '{}'::jsonb check (jsonb_typeof(previous_state) = 'object'),
  next_state jsonb not null default '{}'::jsonb check (jsonb_typeof(next_state) = 'object'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index if not exists a7_orlando_route_events_route_idx
  on public.a7_orlando_route_events(route_id, occurred_at, id);

alter table public.a7_orlando_routes enable row level security;
alter table public.a7_orlando_route_stops enable row level security;
alter table public.a7_orlando_route_events enable row level security;

revoke all on public.a7_orlando_routes, public.a7_orlando_route_stops,
  public.a7_orlando_route_events from public, anon, authenticated;
grant all on public.a7_orlando_routes, public.a7_orlando_route_stops,
  public.a7_orlando_route_events to service_role;

comment on table public.a7_orlando_routes is
  'W3-D route organization only; never an order lifecycle or custody authority.';
comment on table public.a7_orlando_route_stops is
  'W3-D order-leg sequence; customer/location/payment facts remain on the canonical order.';
comment on column public.a7_orlando_route_stops.assignment_active is
  'Reservation guard for one active route per order leg; cleared only by governed terminal actions.';
