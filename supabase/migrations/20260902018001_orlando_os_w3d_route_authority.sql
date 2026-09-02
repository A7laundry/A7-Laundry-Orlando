-- A7 Orlando OS W3-D.2–D.6 — route-only authority orchestrating canonical order transitions.

create or replace function public.a7_orlando_route_order_payload(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.a7_orlando_w1b_order_payload(o.id) || jsonb_build_object(
    'whatsapp_number', c.wa_id,
    'property_address', l.operational_data->>'property_address',
    'delivery_handoff', coalesce((
      select jsonb_build_object('handoff_point', e.handoff_point, 'handoff_note', e.handoff_note,
        'occurred_at', e.occurred_at)
      from public.a7_orlando_operational_events e
      where e.order_id=o.id and e.handoff_point is not null
      order by e.occurred_at desc, e.id desc limit 1
    ), 'null'::jsonb)
  )
  from public.a7_orlando_orders o
  join public.a7_orlando_leads l on l.id=o.lead_id
  left join public.a7_wa_contacts c on c.id=o.customer_id
  where o.id=p_order_id and o.unit_key='orlando';
$$;

create or replace function public.a7_orlando_route_payload(p_route_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'route_id', r.id, 'route_date', r.route_date, 'status', r.status, 'version', r.version,
    'started_at', r.started_at, 'completed_at', r.completed_at, 'cancelled_at', r.cancelled_at,
    'driver', jsonb_build_object('driver_id', d.id, 'full_name', d.full_name, 'active', d.active),
    'stops', coalesce((select jsonb_agg(jsonb_build_object(
      'stop_id', s.id, 'stop_type', s.stop_type, 'sequence', s.stop_sequence,
      'status', s.status, 'result', s.result, 'eta_at', s.eta_at, 'note', s.note,
      'completed_at', s.completed_at, 'order', public.a7_orlando_route_order_payload(s.order_id)
    ) order by s.stop_sequence) from public.a7_orlando_route_stops s where s.route_id = r.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'action', e.action, 'actor_role', e.actor_role, 'occurred_at', e.occurred_at,
      'stop_id', e.stop_id, 'order_id', e.order_id, 'previous_state', e.previous_state,
      'next_state', e.next_state
    ) order by e.occurred_at, e.id) from public.a7_orlando_route_events e where e.route_id = r.id), '[]'::jsonb)
  )
  from public.a7_orlando_routes r join public.a7_orlando_drivers d on d.id = r.driver_id
  where r.id = p_route_id and r.unit_key = 'orlando';
$$;

create or replace function public.a7_orlando_list_routes(p_route_date date default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'route_id', r.id, 'route_date', r.route_date, 'status', r.status, 'version', r.version,
    'started_at', r.started_at, 'completed_at', r.completed_at,
    'driver', jsonb_build_object('driver_id', d.id, 'full_name', d.full_name, 'active', d.active),
    'stop_count', (select count(*) from public.a7_orlando_route_stops s where s.route_id = r.id),
    'completed_count', (select count(*) from public.a7_orlando_route_stops s where s.route_id = r.id and s.status = 'completed'),
    'exception_count', (select count(*) from public.a7_orlando_route_stops s where s.route_id = r.id and s.status = 'exception')
  ) order by r.route_date desc, r.created_at desc), '[]'::jsonb)
  from public.a7_orlando_routes r join public.a7_orlando_drivers d on d.id = r.driver_id
  where r.unit_key = 'orlando' and (p_route_date is null or r.route_date = p_route_date);
$$;

create or replace function public.a7_orlando_route_eligible_stops(p_route_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_route public.a7_orlando_routes;
begin
  select * into v_route from public.a7_orlando_routes where id = p_route_id and unit_key = 'orlando';
  if v_route.id is null then raise exception 'Route not found'; end if;
  return jsonb_build_object(
    'pickup', coalesce((select jsonb_agg(public.a7_orlando_route_order_payload(o.id) order by o.pickup_window_start, o.accepted_at)
      from public.a7_orlando_orders o where o.unit_key = 'orlando' and not public.a7_orlando_order_is_qa(o.id)
        and o.order_status = 'pickup_scheduled' and o.custody_state = 'awaiting_pickup'
        and not exists (select 1 from public.a7_orlando_route_stops s where s.order_id = o.id and s.stop_type = 'pickup' and s.assignment_active)), '[]'::jsonb),
    'delivery', coalesce((select jsonb_agg(public.a7_orlando_route_order_payload(o.id) order by o.promised_by, o.accepted_at)
      from public.a7_orlando_orders o where o.unit_key = 'orlando' and not public.a7_orlando_order_is_qa(o.id)
        and o.order_status in ('invoice_created', 'ready_for_delivery') and o.payment_status = 'paid'
        and o.production_state = 'ready' and o.custody_state = 'at_laundry'
        and not exists (select 1 from public.a7_orlando_route_stops s where s.order_id = o.id and s.stop_type = 'delivery' and s.assignment_active)), '[]'::jsonb));
end;
$$;

create or replace function public.a7_orlando_route_command(
  p_command text, p_route_id uuid, p_payload jsonb, p_actor_id text, p_actor_role text,
  p_idempotency_key text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_route public.a7_orlando_routes; v_stop public.a7_orlando_route_stops;
  v_order public.a7_orlando_orders; v_driver public.a7_orlando_drivers;
  v_existing public.a7_orlando_route_events; v_when timestamptz := coalesce(p_occurred_at, now());
  v_fingerprint text; v_event_action text; v_previous jsonb := '{}'::jsonb; v_next jsonb := '{}'::jsonb;
  v_stop_id uuid; v_order_id uuid; v_order_number text; v_stop_type text; v_action text;
  v_handoff text; v_note text; v_reason text; v_sequence integer; v_version integer;
  v_ids uuid[]; v_current uuid[]; v_id uuid; v_index integer := 0; v_order_result jsonb;
begin
  if p_actor_role not in ('owner', 'manager') or nullif(btrim(coalesce(p_actor_id, '')), '') is null
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null or jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'Route authorization or request is invalid';
  end if;
  v_fingerprint := encode(sha256(convert_to(coalesce(p_command, '') || '|' || coalesce(p_route_id::text, '') || '|'
    || coalesce(p_payload, '{}'::jsonb)::text || '|' || p_actor_id || '|' || p_actor_role, 'UTF8')), 'hex');
  select * into v_existing from public.a7_orlando_route_events where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.request_fingerprint <> v_fingerprint then raise exception 'Route idempotency conflict'; end if;
    return jsonb_build_object('duplicate', true, 'route', public.a7_orlando_route_payload(v_existing.route_id));
  end if;

  if p_command = 'create' then
    select * into v_driver from public.a7_orlando_drivers where id = nullif(p_payload->>'driver_id', '')::uuid and active for share;
    if v_driver.id is null then raise exception 'Active driver required'; end if;
    insert into public.a7_orlando_routes(route_date, driver_id, created_by, updated_by, created_at, updated_at)
    values ((p_payload->>'route_date')::date, v_driver.id, p_actor_id, p_actor_id, v_when, v_when) returning * into v_route;
    v_event_action := 'route_created'; v_next := jsonb_build_object('status', v_route.status, 'driver_id', v_driver.id, 'route_date', v_route.route_date);
  else
    select * into v_route from public.a7_orlando_routes where id = p_route_id and unit_key = 'orlando' for update;
    if v_route.id is null then raise exception 'Route not found'; end if;
  end if;

  if p_command = 'add_stop' then
    if v_route.status <> 'draft' then raise exception 'Stops can be added only to a draft route'; end if;
    v_order_number := nullif(btrim(p_payload->>'order_number'), ''); v_stop_type := p_payload->>'stop_type';
    select * into v_order from public.a7_orlando_orders where unit_key = 'orlando' and order_number = v_order_number for update;
    if v_order.id is null or public.a7_orlando_order_is_qa(v_order.id) then raise exception 'Eligible order required'; end if;
    if v_stop_type = 'pickup' then
      if v_order.order_status <> 'pickup_scheduled' or v_order.custody_state <> 'awaiting_pickup' then raise exception 'Pickup order is not eligible'; end if;
    elsif v_stop_type = 'delivery' then
      if v_order.order_status not in ('invoice_created', 'ready_for_delivery') or v_order.payment_status <> 'paid'
        or v_order.production_state <> 'ready' or v_order.custody_state <> 'at_laundry' then raise exception 'Delivery order is not eligible'; end if;
    else raise exception 'Stop type is invalid'; end if;
    if not exists (select 1 from public.a7_orlando_driver_assignments a where a.order_id = v_order.id and a.leg = v_stop_type
      and a.superseded_at is null and a.driver_id = v_route.driver_id) then
      perform public.a7_orlando_assign_driver(v_order.order_number, v_route.driver_id, v_stop_type, p_actor_id, p_actor_role,
        p_idempotency_key || ':driver', v_when);
    end if;
    select coalesce(max(stop_sequence), 0) + 1 into v_sequence from public.a7_orlando_route_stops where route_id = v_route.id;
    insert into public.a7_orlando_route_stops(route_id, order_id, stop_type, stop_sequence, eta_at, created_at, updated_at)
    values (v_route.id, v_order.id, v_stop_type, v_sequence, nullif(p_payload->>'eta_at','')::timestamptz, v_when, v_when)
    returning * into v_stop;
    update public.a7_orlando_routes set version = version + 1, updated_by = p_actor_id, updated_at = v_when where id = v_route.id returning * into v_route;
    v_stop_id := v_stop.id; v_order_id := v_order.id; v_event_action := 'stop_added';
    v_next := jsonb_build_object('stop_id', v_stop.id, 'order_number', v_order.order_number, 'stop_type', v_stop.stop_type, 'sequence', v_stop.stop_sequence);
  elsif p_command = 'remove_stop' then
    if v_route.status <> 'draft' then raise exception 'Stops can be removed only from a draft route'; end if;
    select * into v_stop from public.a7_orlando_route_stops where id = (p_payload->>'stop_id')::uuid and route_id = v_route.id for update;
    if v_stop.id is null or v_stop.status <> 'pending' then raise exception 'Pending route stop required'; end if;
    v_previous := jsonb_build_object('status', v_stop.status, 'sequence', v_stop.stop_sequence);
    update public.a7_orlando_route_stops set status='cancelled', result='cancelled', assignment_active=false,
      completed_at=v_when, completed_by=p_actor_id, version=version+1, updated_at=v_when where id=v_stop.id;
    update public.a7_orlando_routes set version=version+1, updated_by=p_actor_id, updated_at=v_when where id=v_route.id returning * into v_route;
    v_stop_id:=v_stop.id; v_order_id:=v_stop.order_id; v_event_action:='stop_removed'; v_next:=jsonb_build_object('status','cancelled');
  elsif p_command = 'reorder' then
    if v_route.status <> 'draft' or v_route.version <> (p_payload->>'version')::integer then raise exception 'Stale or non-draft route'; end if;
    select array_agg(value::uuid order by ordinality) into v_ids from jsonb_array_elements_text(p_payload->'stop_ids') with ordinality;
    select array_agg(id order by stop_sequence) into v_current from public.a7_orlando_route_stops where route_id=v_route.id and status='pending';
    if v_ids is null or cardinality(v_ids) <> cardinality(v_current)
      or exists (select 1 from unnest(v_ids) x group by x having count(*) > 1)
      or exists (select 1 from unnest(v_ids) x where not (x = any(v_current))) then raise exception 'Complete current pending-stop set required'; end if;
    v_previous:=jsonb_build_object('stop_ids', to_jsonb(v_current));
    update public.a7_orlando_route_stops set stop_sequence=stop_sequence+1000000 where route_id=v_route.id and status='pending';
    foreach v_id in array v_ids loop v_index:=v_index+1; update public.a7_orlando_route_stops set stop_sequence=v_index, version=version+1, updated_at=v_when where id=v_id; end loop;
    update public.a7_orlando_routes set version=version+1, updated_by=p_actor_id, updated_at=v_when where id=v_route.id returning * into v_route;
    v_event_action:='stops_reordered'; v_next:=jsonb_build_object('stop_ids', to_jsonb(v_ids));
  elsif p_command = 'set_eta' then
    if v_route.status not in ('draft','active') or v_route.version <> (p_payload->>'version')::integer then
      raise exception 'Stale or closed route'; end if;
    select * into v_stop from public.a7_orlando_route_stops
      where id=(p_payload->>'stop_id')::uuid and route_id=v_route.id for update;
    if v_stop.id is null or v_stop.status<>'pending' then raise exception 'Pending route stop required'; end if;
    v_previous:=jsonb_build_object('eta_at',v_stop.eta_at);
    update public.a7_orlando_route_stops set eta_at=nullif(p_payload->>'eta_at','')::timestamptz,
      version=version+1,updated_at=v_when where id=v_stop.id returning * into v_stop;
    update public.a7_orlando_routes set version=version+1,updated_by=p_actor_id,updated_at=v_when
      where id=v_route.id returning * into v_route;
    v_stop_id:=v_stop.id; v_order_id:=v_stop.order_id; v_event_action:='stop_eta_set';
    v_next:=jsonb_build_object('eta_at',v_stop.eta_at);
  elsif p_command = 'start' then
    if v_route.status <> 'draft' or v_route.version <> (p_payload->>'version')::integer then raise exception 'Stale or non-draft route'; end if;
    if not exists (select 1 from public.a7_orlando_drivers where id=v_route.driver_id and active) then raise exception 'Active driver required'; end if;
    if not exists (select 1 from public.a7_orlando_route_stops where route_id=v_route.id and status='pending') then raise exception 'Route requires at least one stop'; end if;
    if exists (
      select 1
      from public.a7_orlando_route_stops s
      join public.a7_orlando_orders o on o.id=s.order_id
      left join public.a7_orlando_driver_assignments a on a.order_id=o.id and a.leg=s.stop_type
        and a.superseded_at is null
      where s.route_id=v_route.id and s.status='pending'
        and (
          public.a7_orlando_order_is_qa(o.id)
          or
          a.driver_id is distinct from v_route.driver_id
          or (s.stop_type='pickup' and (o.order_status<>'pickup_scheduled' or o.custody_state<>'awaiting_pickup'))
          or (s.stop_type='delivery' and (o.order_status not in ('invoice_created','ready_for_delivery')
            or o.payment_status<>'paid' or o.production_state<>'ready' or o.custody_state<>'at_laundry'))
        )
    ) then raise exception 'Route contains an ineligible or reassigned stop'; end if;
    update public.a7_orlando_routes set status='active', started_at=v_when, version=version+1, updated_by=p_actor_id, updated_at=v_when where id=v_route.id returning * into v_route;
    v_event_action:='route_started'; v_previous:=jsonb_build_object('status','draft'); v_next:=jsonb_build_object('status','active');
  elsif p_command = 'execute_stop' then
    if v_route.status <> 'active' then raise exception 'Active route required'; end if;
    select * into v_stop from public.a7_orlando_route_stops where id=(p_payload->>'stop_id')::uuid and route_id=v_route.id for update;
    if v_stop.id is null or v_stop.status <> 'pending' then raise exception 'Pending route stop required'; end if;
    select * into v_order from public.a7_orlando_orders where id=v_stop.order_id for update;
    v_action:=p_payload->>'action'; v_handoff:=nullif(p_payload->>'handoff_point',''); v_note:=nullif(btrim(p_payload->>'handoff_note'),'');
    if (v_stop.stop_type='pickup' and v_action<>'confirm_pickup')
      or (v_stop.stop_type='delivery' and v_action not in ('start_delivery','leave_bell_desk','complete_delivery')) then raise exception 'Action does not match stop type'; end if;
    v_order_result:=public.a7_orlando_operational_cycle_transition_v2(v_order.order_number, v_action, p_actor_id, p_actor_role,
      p_idempotency_key || ':order', null, null, v_handoff, v_note, v_when);
    if v_action='start_delivery' then v_event_action:='delivery_started'; v_next:=jsonb_build_object('status','pending','order_action',v_action);
    else
      update public.a7_orlando_route_stops set status='completed', result=case when v_action='confirm_pickup' then 'pickup_completed'
        when v_action='leave_bell_desk' then 'handoff_recorded' else 'delivery_completed' end, assignment_active=false,
        note=v_note, completed_at=v_when, completed_by=p_actor_id, version=version+1, updated_at=v_when where id=v_stop.id returning * into v_stop;
      v_event_action:=case when v_action='confirm_pickup' then 'pickup_completed' when v_action='leave_bell_desk' then 'handoff_recorded' else 'delivery_completed' end;
      v_next:=jsonb_build_object('status','completed','result',v_stop.result,'order_action',v_action);
    end if;
    v_stop_id:=v_stop.id; v_order_id:=v_stop.order_id;
    update public.a7_orlando_routes set version=version+1, updated_by=p_actor_id, updated_at=v_when
      where id=v_route.id returning * into v_route;
  elsif p_command = 'exception' then
    if v_route.status <> 'active' then raise exception 'Active route required'; end if;
    select * into v_stop from public.a7_orlando_route_stops where id=(p_payload->>'stop_id')::uuid and route_id=v_route.id for update;
    if v_stop.id is null or v_stop.status <> 'pending' then raise exception 'Pending route stop required'; end if;
    v_reason:=p_payload->>'reason'; v_note:=nullif(btrim(p_payload->>'note'),'');
    if v_reason not in ('guest_unavailable','laundry_unavailable','hotel_refused_handoff','wrong_location','other')
      or (v_reason='other' and v_note is null) then raise exception 'Governed exception reason required'; end if;
    update public.a7_orlando_route_stops set status='exception', result='could_not_complete', assignment_active=false,
      note=case when v_note is null then v_reason else v_reason || ': ' || v_note end, completed_at=v_when,
      completed_by=p_actor_id, version=version+1, updated_at=v_when where id=v_stop.id;
    v_stop_id:=v_stop.id; v_order_id:=v_stop.order_id; v_event_action:='stop_exception';
    v_next:=jsonb_build_object('status','exception','reason',v_reason);
    update public.a7_orlando_routes set version=version+1, updated_by=p_actor_id, updated_at=v_when
      where id=v_route.id returning * into v_route;
  elsif p_command = 'complete' then
    if v_route.status <> 'active' or v_route.version <> (p_payload->>'version')::integer then raise exception 'Stale or non-active route'; end if;
    if exists (select 1 from public.a7_orlando_route_stops where route_id=v_route.id and status='pending') then raise exception 'All route stops must be terminal'; end if;
    update public.a7_orlando_routes set status='completed', completed_at=v_when, version=version+1,
      updated_by=p_actor_id, updated_at=v_when where id=v_route.id returning * into v_route;
    v_event_action:='route_completed'; v_previous:=jsonb_build_object('status','active');
    v_next:=jsonb_build_object('status','completed','completed',(select count(*) from public.a7_orlando_route_stops where route_id=v_route.id and status='completed'),
      'exceptions',(select count(*) from public.a7_orlando_route_stops where route_id=v_route.id and status='exception'));
  elsif p_command = 'cancel' then
    if v_route.status<>'draft' or v_route.version<>(p_payload->>'version')::integer then raise exception 'Stale or non-draft route'; end if;
    update public.a7_orlando_route_stops set status='cancelled',result='cancelled',assignment_active=false,
      completed_at=v_when,completed_by=p_actor_id,version=version+1,updated_at=v_when
      where route_id=v_route.id and status='pending';
    update public.a7_orlando_routes set status='cancelled',cancelled_at=v_when,version=version+1,
      updated_by=p_actor_id,updated_at=v_when where id=v_route.id returning * into v_route;
    v_event_action:='route_cancelled'; v_previous:=jsonb_build_object('status','draft');
    v_next:=jsonb_build_object('status','cancelled');
  elsif p_command <> 'create' then raise exception 'Unknown route command'; end if;

  insert into public.a7_orlando_route_events(route_id,stop_id,order_id,action,actor_id,actor_role,idempotency_key,
    request_fingerprint,previous_state,next_state,occurred_at)
  values(v_route.id,v_stop_id,v_order_id,v_event_action,p_actor_id,p_actor_role,p_idempotency_key,v_fingerprint,v_previous,v_next,v_when);
  return jsonb_build_object('duplicate',false,'route',public.a7_orlando_route_payload(v_route.id),'order_result',v_order_result);
end;
$$;

revoke all on function public.a7_orlando_route_order_payload(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_route_payload(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_list_routes(date) from public, anon, authenticated;
revoke all on function public.a7_orlando_route_eligible_stops(uuid) from public, anon, authenticated;
revoke all on function public.a7_orlando_route_command(text,uuid,jsonb,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.a7_orlando_route_order_payload(uuid) to service_role;
grant execute on function public.a7_orlando_route_payload(uuid) to service_role;
grant execute on function public.a7_orlando_list_routes(date) to service_role;
grant execute on function public.a7_orlando_route_eligible_stops(uuid) to service_role;
grant execute on function public.a7_orlando_route_command(text,uuid,jsonb,text,text,text,timestamptz) to service_role;
