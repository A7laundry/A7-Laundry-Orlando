-- A7 Orlando OS — truthful Manager authorization across existing business RPCs.
-- Backward-compatible: widens role checks without changing order, invoice,
-- payment, attribution or analytics semantics.

alter table public.a7_orlando_operator_audit drop constraint if exists a7_orlando_operator_audit_actor_role_check;
alter table public.a7_orlando_operator_audit add constraint a7_orlando_operator_audit_actor_role_check check (actor_role in ('owner', 'manager', 'operator')) not valid;
alter table public.a7_orlando_operator_audit validate constraint a7_orlando_operator_audit_actor_role_check;

alter table public.a7_orlando_operational_events drop constraint if exists a7_orlando_operational_events_actor_role_check;
alter table public.a7_orlando_operational_events add constraint a7_orlando_operational_events_actor_role_check check (actor_role in ('owner', 'manager', 'operator')) not valid;
alter table public.a7_orlando_operational_events validate constraint a7_orlando_operational_events_actor_role_check;

alter table public.a7_orlando_item_weight_events drop constraint if exists a7_orlando_item_weight_events_actor_role_check;
alter table public.a7_orlando_item_weight_events add constraint a7_orlando_item_weight_events_actor_role_check check (actor_role in ('owner', 'manager')) not valid;
alter table public.a7_orlando_item_weight_events validate constraint a7_orlando_item_weight_events_actor_role_check;

alter table public.a7_orlando_invoice_events drop constraint if exists a7_orlando_invoice_events_actor_role_check;
alter table public.a7_orlando_invoice_events add constraint a7_orlando_invoice_events_actor_role_check check (actor_role in ('owner', 'manager')) not valid;
alter table public.a7_orlando_invoice_events validate constraint a7_orlando_invoice_events_actor_role_check;

alter table public.a7_orlando_hotel_events drop constraint if exists a7_orlando_hotel_events_actor_role_check;
alter table public.a7_orlando_hotel_events add constraint a7_orlando_hotel_events_actor_role_check check (actor_role in ('owner', 'manager')) not valid;
alter table public.a7_orlando_hotel_events validate constraint a7_orlando_hotel_events_actor_role_check;

-- Rebuild only business functions proven present in Orlando Production at this
-- cutover. W2/W3 migrations 20260830060000 and 20260830070000 are intentionally
-- absent there and remain outside this release. The implementation remains
-- unchanged; only the role clause is widened, retaining the real actor in audit.
do $manager_permissions$
declare
  v_name text;
  v_definition text;
  v_changed text;
begin
  foreach v_name in array array[
    'a7_orlando_create_manual_order',
    'a7_orlando_w1b_transition',
    'a7_orlando_w1c_a_record_item_weight',
    'a7_orlando_w1c_b1_review_invoice',
    'a7_orlando_w1c_b1_void_invoice',
    'a7_orlando_upsert_hotel'
  ] loop
    select pg_get_functiondef(p.oid) into v_definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = v_name;
    if v_definition is null then
      raise exception 'Required Orlando business function is missing: %', v_name;
    end if;
    v_changed := replace(v_definition,
      'p_actor_role not in (''owner'', ''operator'')',
      'p_actor_role not in (''owner'', ''manager'', ''operator'')');
    v_changed := replace(v_changed,
      'p_actor_role <> ''owner''',
      'p_actor_role not in (''owner'', ''manager'')');
    if v_changed = v_definition then
      raise exception 'Manager authorization clause was not found in: %', v_name;
    end if;
    execute v_changed;
  end loop;
end;
$manager_permissions$;

comment on table public.a7_orlando_system_users is
  'Persistent Orlando OS identities. Owner administers access; Manager has business access but no team/security authority.';
