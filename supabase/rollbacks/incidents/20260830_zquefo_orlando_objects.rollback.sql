-- INCIDENT ROLLBACK ONLY — never run through the normal migration pipeline.
-- Target authorized by Owner: Supabase project zquefoznqwkfbnnfalmt only.
-- Purpose: remove the isolated A7 Orlando/WhatsApp/attribution objects that were
-- mistakenly installed in the pre-existing A7X OS project.
--
-- Safety model:
--   * no CASCADE;
--   * short locks/timeouts;
--   * refuse if any Orlando/WhatsApp/attribution business row exists;
--   * allow only the single governed W1B settings row created by migration 040000;
--   * refuse if a non-target table/view/function depends on a target object;
--   * leave pgcrypto and every pre-existing A7X OS object untouched.

begin;

set local lock_timeout = '3s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(hashtextextended('incident:zquefoznqwkfbnnfalmt:a7-orlando-cleanup', 0));

do $$
declare
  v_relation record;
  v_count bigint;
begin
  for v_relation in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and (
        c.relname like 'a7_orlando_%'
        or c.relname like 'a7_attribution_%'
        or c.relname like 'a7_wa_%'
      )
  loop
    execute format('select count(*) from public.%I', v_relation.relname) into v_count;

    if v_relation.relname = 'a7_orlando_operation_settings' then
      if v_count <> 1 or not exists (
        select 1
        from public.a7_orlando_operation_settings
        where unit_key = 'orlando'
          and timezone = 'America/New_York'
          and express_sla_status = 'approved'
          and express_attention_minutes = 240
          and express_risk_minutes = 120
          and updated_by = 'owner'
      ) then
        raise exception 'Incident rollback refused: unexpected operation-settings state';
      end if;
    elsif v_count <> 0 then
      raise exception 'Incident rollback refused: %.% contains % row(s)', 'public', v_relation.relname, v_count;
    end if;
  end loop;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid
    join pg_class dst on dst.oid = con.confrelid
    join pg_namespace ns on ns.oid = src.relnamespace
    join pg_namespace nd on nd.oid = dst.relnamespace
    where con.contype = 'f'
      and ns.nspname = 'public'
      and nd.nspname = 'public'
      and (
        (
          (src.relname like 'a7_orlando_%' or src.relname like 'a7_attribution_%' or src.relname like 'a7_wa_%')
          and not (dst.relname like 'a7_orlando_%' or dst.relname like 'a7_attribution_%' or dst.relname like 'a7_wa_%')
        )
        or
        (
          (dst.relname like 'a7_orlando_%' or dst.relname like 'a7_attribution_%' or dst.relname like 'a7_wa_%')
          and not (src.relname like 'a7_orlando_%' or src.relname like 'a7_attribution_%' or src.relname like 'a7_wa_%')
        )
      )
  ) then
    raise exception 'Incident rollback refused: cross-boundary foreign key found';
  end if;

  if exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and not (viewname like 'a7_orlando_%' or viewname like 'a7_attribution_%' or viewname like 'a7_wa_%')
      and (
        definition ilike '%a7_orlando_%'
        or definition ilike '%a7_attribution_%'
        or definition ilike '%a7_wa_%'
      )
  ) then
    raise exception 'Incident rollback refused: external view dependency found';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not (
        p.proname like 'a7_orlando_%'
        or p.proname like 'a7_attribution_%'
        or p.proname like 'a7_wa_%'
        or p.proname in (
          'a7_get_attribution',
          'a7_get_attribution_by_short_ref',
          'a7_upsert_attribution',
          'a7_record_attribution_metrics'
        )
      )
      and (
        pg_get_functiondef(p.oid) ilike '%a7_orlando_%'
        or pg_get_functiondef(p.oid) ilike '%a7_attribution_%'
        or pg_get_functiondef(p.oid) ilike '%a7_wa_%'
      )
  ) then
    raise exception 'Incident rollback refused: external function dependency found';
  end if;
end;
$$;

drop trigger if exists a7_orlando_w1b_initialize_new_order on public.a7_orlando_orders;
drop trigger if exists a7_orlando_outbox_event_time on public.a7_orlando_analytics_outbox;

-- Drop target routines without CASCADE. Dependencies between target routines are
-- resolved over repeated passes; any external dependency makes the transaction fail.
do $$
declare
  v_function record;
  v_dropped integer;
  v_remaining integer;
begin
  loop
    v_dropped := 0;

    for v_function in
      select p.proname, pg_get_function_identity_arguments(p.oid) as identity_args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and (
          p.proname like 'a7_orlando_%'
          or p.proname like 'a7_attribution_%'
          or p.proname like 'a7_wa_%'
          or p.proname in (
            'a7_get_attribution',
            'a7_get_attribution_by_short_ref',
            'a7_upsert_attribution',
            'a7_record_attribution_metrics'
          )
        )
      order by p.proname desc, pg_get_function_identity_arguments(p.oid) desc
    loop
      begin
        execute format('drop function public.%I(%s)', v_function.proname, v_function.identity_args);
        v_dropped := v_dropped + 1;
      exception
        when dependent_objects_still_exist then
          null;
      end;
    end loop;

    select count(*) into v_remaining
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname like 'a7_orlando_%'
        or p.proname like 'a7_attribution_%'
        or p.proname like 'a7_wa_%'
        or p.proname in (
          'a7_get_attribution',
          'a7_get_attribution_by_short_ref',
          'a7_upsert_attribution',
          'a7_record_attribution_metrics'
        )
      );

    exit when v_remaining = 0;
    if v_dropped = 0 then
      raise exception 'Incident rollback refused: % target function(s) still have dependencies', v_remaining;
    end if;
  end loop;
end;
$$;

-- Child tables first. No CASCADE is intentional.
drop table public.a7_orlando_analytics_outbox;
drop table public.a7_orlando_operational_events;
drop table public.a7_orlando_operator_audit;
drop table public.a7_orlando_order_items;
drop table public.a7_orlando_manual_order_requests;
drop table public.a7_orlando_refunds;
drop table public.a7_orlando_stripe_events;
drop table public.a7_orlando_payments;
drop table public.a7_orlando_attribution_snapshots;
drop table public.a7_orlando_order_events;
drop table public.a7_orlando_orders;
drop table public.a7_orlando_leads;
drop table public.a7_attribution_touch_keys;
drop table public.a7_attribution_metrics;
drop table public.a7_attribution_sessions;
drop table public.a7_wa_messages;
drop table public.a7_wa_conversations;
drop table public.a7_wa_contacts;
drop table public.a7_orlando_operation_settings;

drop sequence public.a7_orlando_mco_order_number_seq;
drop sequence public.a7_orlando_order_number_seq;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (
        c.relname like 'a7_orlando_%'
        or c.relname like 'a7_attribution_%'
        or c.relname like 'a7_wa_%'
      )
  ) then
    raise exception 'Incident rollback verification failed: target relation remains';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname like 'a7_orlando_%'
        or p.proname like 'a7_attribution_%'
        or p.proname like 'a7_wa_%'
        or p.proname in (
          'a7_get_attribution',
          'a7_get_attribution_by_short_ref',
          'a7_upsert_attribution',
          'a7_record_attribution_metrics'
        )
      )
  ) then
    raise exception 'Incident rollback verification failed: target function remains';
  end if;
end;
$$;

commit;
