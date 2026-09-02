-- A7 Orlando OS — persistent team access and append-only authentication audit.
-- Additive, service-role only. Existing Vercel Owner authentication remains available during cutover.

create table if not exists public.a7_orlando_system_users (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null unique check (actor_id ~ '^actor_[a-zA-Z0-9_-]{12,80}$'),
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 160),
  full_name text not null check (length(btrim(full_name)) between 2 and 120),
  phone text check (phone is null or length(phone) between 7 and 32),
  job_title text check (job_title is null or length(job_title) between 2 and 80),
  role text not null check (role in ('owner', 'manager', 'operator')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  password_salt text not null check (length(password_salt) between 16 and 180),
  password_hash text not null check (length(password_hash) between 32 and 180),
  must_change_password boolean not null default true,
  auth_version integer not null default 1 check (auth_version > 0),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null,
  updated_by text not null
);

create unique index if not exists a7_orlando_system_users_email_lower_uidx
  on public.a7_orlando_system_users (lower(email));
create index if not exists a7_orlando_system_users_status_role_idx
  on public.a7_orlando_system_users (status, role);

create table if not exists public.a7_orlando_system_user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.a7_orlando_system_users(id) on delete restrict,
  action text not null check (action in (
    'user_created', 'user_updated', 'password_reset', 'password_changed',
    'login_succeeded', 'login_failed'
  )),
  actor_id text not null,
  actor_role text not null check (actor_role in ('owner', 'manager', 'operator', 'anonymous')),
  changes jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  check (not (changes ?| array['password', 'password_hash', 'password_salt', 'temporary_password']))
);

create index if not exists a7_orlando_system_user_events_user_time_idx
  on public.a7_orlando_system_user_events (user_id, occurred_at desc);

alter table public.a7_orlando_system_users enable row level security;
alter table public.a7_orlando_system_user_events enable row level security;
revoke all on public.a7_orlando_system_users, public.a7_orlando_system_user_events from anon, authenticated, public;
grant all on public.a7_orlando_system_users, public.a7_orlando_system_user_events to service_role;

create or replace function public.a7_orlando_system_user_by_email(p_email text)
returns setof public.a7_orlando_system_users
language sql security definer set search_path = public
as $$
  select * from public.a7_orlando_system_users where email = lower(btrim(p_email)) limit 1
$$;

create or replace function public.a7_orlando_system_user_by_id(p_user_id uuid)
returns setof public.a7_orlando_system_users
language sql security definer set search_path = public
as $$
  select * from public.a7_orlando_system_users where id = p_user_id limit 1
$$;

create or replace function public.a7_orlando_list_system_users()
returns table (
  id uuid, actor_id text, email text, full_name text, phone text, job_title text,
  role text, status text, must_change_password boolean, auth_version integer,
  last_login_at timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql security definer set search_path = public
as $$
  select u.id, u.actor_id, u.email, u.full_name, u.phone, u.job_title, u.role, u.status,
    u.must_change_password, u.auth_version, u.last_login_at, u.created_at, u.updated_at
  from public.a7_orlando_system_users u
  order by (u.status = 'active') desc, u.full_name, u.email
$$;

create or replace function public.a7_orlando_list_system_user_events(p_user_id uuid)
returns table (
  id uuid, user_id uuid, action text, actor_id text, actor_role text, changes jsonb, occurred_at timestamptz
)
language sql security definer set search_path = public
as $$
  select e.id, e.user_id, e.action, e.actor_id, e.actor_role, e.changes, e.occurred_at
  from public.a7_orlando_system_user_events e where e.user_id = p_user_id
  order by e.occurred_at desc, e.id desc limit 200
$$;

create or replace function public.a7_orlando_create_system_user(
  p_actor_id text, p_email text, p_full_name text, p_phone text, p_job_title text, p_role text,
  p_password_salt text, p_password_hash text, p_admin_actor_id text, p_admin_actor_role text
)
returns setof public.a7_orlando_system_users
language plpgsql security definer set search_path = public
as $$
declare v_user public.a7_orlando_system_users;
begin
  if p_admin_actor_role <> 'owner' or nullif(btrim(p_admin_actor_id), '') is null then
    raise exception 'Owner authorization is required';
  end if;
  if p_role not in ('owner', 'manager', 'operator') then raise exception 'Invalid role'; end if;
  insert into public.a7_orlando_system_users (
    actor_id, email, full_name, phone, job_title, role, status,
    password_salt, password_hash, must_change_password, created_by, updated_by
  ) values (
    btrim(p_actor_id), lower(btrim(p_email)), btrim(p_full_name), nullif(btrim(p_phone), ''),
    nullif(btrim(p_job_title), ''), p_role, 'active', p_password_salt, p_password_hash, true,
    p_admin_actor_id, p_admin_actor_id
  ) returning * into v_user;
  insert into public.a7_orlando_system_user_events (user_id, action, actor_id, actor_role, changes)
  values (v_user.id, 'user_created', p_admin_actor_id, p_admin_actor_role,
    jsonb_build_object('role', v_user.role, 'status', v_user.status));
  return next v_user;
end $$;

create or replace function public.a7_orlando_update_system_user(
  p_user_id uuid, p_email text, p_full_name text, p_phone text, p_job_title text,
  p_role text, p_status text, p_admin_actor_id text, p_admin_actor_role text
)
returns setof public.a7_orlando_system_users
language plpgsql security definer set search_path = public
as $$
declare v_before public.a7_orlando_system_users; v_after public.a7_orlando_system_users;
declare v_role text; v_status text;
begin
  if p_admin_actor_role <> 'owner' or nullif(btrim(p_admin_actor_id), '') is null then
    raise exception 'Owner authorization is required';
  end if;
  select * into v_before from public.a7_orlando_system_users where id = p_user_id for update;
  if not found then raise exception 'User not found'; end if;
  v_role := coalesce(nullif(btrim(p_role), ''), v_before.role);
  v_status := coalesce(nullif(btrim(p_status), ''), v_before.status);
  if v_role not in ('owner', 'manager', 'operator') or v_status not in ('active', 'inactive') then
    raise exception 'Invalid role or status';
  end if;
  if v_before.actor_id = p_admin_actor_id and (v_role <> 'owner' or v_status <> 'active') then
    raise exception 'Owner cannot demote or deactivate the current account';
  end if;
  if v_before.role = 'owner' and (v_role <> 'owner' or v_status <> 'active')
    and not exists (select 1 from public.a7_orlando_system_users
      where id <> v_before.id and role = 'owner' and status = 'active') then
    raise exception 'At least one active Owner is required';
  end if;
  update public.a7_orlando_system_users set
    email = coalesce(nullif(lower(btrim(p_email)), ''), email),
    full_name = coalesce(nullif(btrim(p_full_name), ''), full_name),
    phone = case when p_phone is null then phone else nullif(btrim(p_phone), '') end,
    job_title = case when p_job_title is null then job_title else nullif(btrim(p_job_title), '') end,
    role = v_role, status = v_status,
    auth_version = auth_version + case when role <> v_role or status <> v_status then 1 else 0 end,
    updated_at = now(), updated_by = p_admin_actor_id
  where id = p_user_id returning * into v_after;
  insert into public.a7_orlando_system_user_events (user_id, action, actor_id, actor_role, changes)
  values (v_after.id, 'user_updated', p_admin_actor_id, p_admin_actor_role,
    jsonb_build_object(
      'before', jsonb_build_object('email',v_before.email,'full_name',v_before.full_name,'phone',v_before.phone,'job_title',v_before.job_title,'role',v_before.role,'status',v_before.status),
      'after', jsonb_build_object('email',v_after.email,'full_name',v_after.full_name,'phone',v_after.phone,'job_title',v_after.job_title,'role',v_after.role,'status',v_after.status)
    ));
  return next v_after;
end $$;

create or replace function public.a7_orlando_reset_system_user_password(
  p_user_id uuid, p_password_salt text, p_password_hash text,
  p_admin_actor_id text, p_admin_actor_role text
)
returns setof public.a7_orlando_system_users
language plpgsql security definer set search_path = public
as $$
declare v_user public.a7_orlando_system_users;
begin
  if p_admin_actor_role <> 'owner' or nullif(btrim(p_admin_actor_id), '') is null then
    raise exception 'Owner authorization is required';
  end if;
  update public.a7_orlando_system_users set password_salt=p_password_salt, password_hash=p_password_hash,
    must_change_password=true, auth_version=auth_version+1, updated_at=now(), updated_by=p_admin_actor_id
  where id=p_user_id returning * into v_user;
  if not found then raise exception 'User not found'; end if;
  insert into public.a7_orlando_system_user_events (user_id, action, actor_id, actor_role, changes)
  values (v_user.id, 'password_reset', p_admin_actor_id, p_admin_actor_role,
    jsonb_build_object('auth_version', v_user.auth_version));
  return next v_user;
end $$;

create or replace function public.a7_orlando_change_system_user_password(
  p_user_id uuid, p_expected_auth_version integer, p_password_salt text, p_password_hash text, p_actor_id text
)
returns setof public.a7_orlando_system_users
language plpgsql security definer set search_path = public
as $$
declare v_user public.a7_orlando_system_users;
begin
  update public.a7_orlando_system_users set password_salt=p_password_salt, password_hash=p_password_hash,
    must_change_password=false, auth_version=auth_version+1, updated_at=now(), updated_by=p_actor_id
  where id=p_user_id and actor_id=p_actor_id and status='active' and auth_version=p_expected_auth_version
  returning * into v_user;
  if not found then raise exception 'Session is stale or user is inactive'; end if;
  insert into public.a7_orlando_system_user_events (user_id, action, actor_id, actor_role, changes)
  values (v_user.id, 'password_changed', v_user.actor_id, v_user.role,
    jsonb_build_object('auth_version', v_user.auth_version));
  return next v_user;
end $$;

create or replace function public.a7_orlando_record_system_login(p_user_id uuid, p_success boolean)
returns setof public.a7_orlando_system_users
language plpgsql security definer set search_path = public
as $$
declare v_user public.a7_orlando_system_users;
begin
  if p_success then
    update public.a7_orlando_system_users set last_login_at=now(), updated_at=now()
      where id=p_user_id returning * into v_user;
  else
    select * into v_user from public.a7_orlando_system_users where id=p_user_id;
  end if;
  if not found then return; end if;
  insert into public.a7_orlando_system_user_events (user_id, action, actor_id, actor_role, changes)
  values (v_user.id, case when p_success then 'login_succeeded' else 'login_failed' end,
    case when p_success then v_user.actor_id else 'anonymous' end,
    case when p_success then v_user.role else 'anonymous' end, '{}'::jsonb);
  return next v_user;
end $$;

revoke all on function public.a7_orlando_system_user_by_email(text) from public, anon, authenticated;
revoke all on function public.a7_orlando_system_user_by_id(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_list_system_users() from public, anon, authenticated;
revoke all on function public.a7_orlando_list_system_user_events(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_create_system_user(text,text,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.a7_orlando_update_system_user(uuid,text,text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.a7_orlando_reset_system_user_password(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.a7_orlando_change_system_user_password(uuid,integer,text,text,text) from public, anon, authenticated;
revoke all on function public.a7_orlando_record_system_login(uuid,boolean) from public, anon, authenticated;

grant execute on function public.a7_orlando_system_user_by_email(text) to service_role;
grant execute on function public.a7_orlando_system_user_by_id(uuid) to service_role;
grant execute on function public.a7_orlando_list_system_users() to service_role;
grant execute on function public.a7_orlando_list_system_user_events(uuid) to service_role;
grant execute on function public.a7_orlando_create_system_user(text,text,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.a7_orlando_update_system_user(uuid,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.a7_orlando_reset_system_user_password(uuid,text,text,text,text) to service_role;
grant execute on function public.a7_orlando_change_system_user_password(uuid,integer,text,text,text) to service_role;
grant execute on function public.a7_orlando_record_system_login(uuid,boolean) to service_role;
