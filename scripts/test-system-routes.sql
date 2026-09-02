begin;

do $w3d_route_probe$
declare
  v_driver uuid := '10000000-0000-4000-8000-000000000001';
  v_contact uuid := '10000000-0000-4000-8000-000000000002';
  v_pickup_lead uuid := '10000000-0000-4000-8000-000000000003';
  v_delivery_lead uuid := '10000000-0000-4000-8000-000000000004';
  v_bell_lead uuid := '10000000-0000-4000-8000-000000000007';
  v_exception_lead uuid := '10000000-0000-4000-8000-000000000009';
  v_pickup_order uuid := '10000000-0000-4000-8000-000000000005';
  v_delivery_order uuid := '10000000-0000-4000-8000-000000000006';
  v_bell_order uuid := '10000000-0000-4000-8000-000000000008';
  v_exception_order uuid := '10000000-0000-4000-8000-000000000010';
  v_route jsonb; v_result jsonb; v_route_id uuid; v_route2_id uuid; v_pickup_stop uuid; v_delivery_stop uuid;
  v_bell_stop uuid; v_exception_stop uuid; v_version integer; v_blocked boolean := false;
begin
  insert into public.a7_wa_contacts(id,unit_key,wa_id,profile_name) values(v_contact,'orlando','15550000001','Route Fixture');
  insert into public.a7_orlando_leads(id,idempotency_key,customer_id,status,lead_origin,service_type,customer_type,language,operational_data)
  values(v_pickup_lead,'route-fixture-pickup',v_contact,'order_accepted','manual','guest_laundry','guest','en','{}'),
    (v_delivery_lead,'route-fixture-delivery',v_contact,'order_accepted','manual','guest_laundry','guest','en','{}'),
    (v_bell_lead,'route-fixture-bell',v_contact,'order_accepted','manual','guest_laundry','guest','en','{}'),
    (v_exception_lead,'route-fixture-exception',v_contact,'order_accepted','manual','guest_laundry','guest','en','{}');
  insert into public.a7_orlando_orders(id,lead_id,customer_id,order_number,service_type,customer_type,service_tier,pricing_model,
    order_status,payment_status,accepted_at,pickup_window_start,pickup_window_end,custody_state,production_state,is_qa,
    payment_id,service_amount,currency,paid_at)
  values(v_pickup_order,v_pickup_lead,v_contact,'MCO-99001','guest_laundry','guest','normal','per_lb','pickup_scheduled','pending',now(),now(),now()+interval '1 hour','awaiting_pickup','awaiting_intake',false,null,null,null,null),
    (v_delivery_order,v_delivery_lead,v_contact,'MCO-99002','guest_laundry','guest','normal','per_lb','ready_for_delivery','paid',now(),now(),now()+interval '1 hour','at_laundry','ready',false,'local-fixture',60,'USD',now()),
    (v_bell_order,v_bell_lead,v_contact,'MCO-99003','guest_laundry','guest','normal','per_lb','ready_for_delivery','paid',now(),now(),now()+interval '1 hour','at_laundry','ready',false,'local-fixture-bell',60,'USD',now()),
    (v_exception_order,v_exception_lead,v_contact,'MCO-99004','guest_laundry','guest','normal','per_lb','pickup_scheduled','pending',now(),now(),now()+interval '1 hour','awaiting_pickup','awaiting_intake',false,null,null,null,null);
  insert into public.a7_orlando_drivers(id,full_name,phone,active,created_by,updated_by)
  values(v_driver,'Route Driver','15550000002',true,'owner','owner');

  v_result:=public.a7_orlando_route_command('create',null,jsonb_build_object('route_date',current_date,'driver_id',v_driver),
    'owner','owner','route-fixture:create',now());
  v_route_id:=(v_result->'route'->>'route_id')::uuid;
  if v_route_id is null then raise exception 'route create failed'; end if;
  v_result:=public.a7_orlando_route_command('create',null,jsonb_build_object('route_date',current_date,'driver_id',v_driver),
    'owner','owner','route-fixture:create',now());
  if not (v_result->>'duplicate')::boolean or (v_result->'route'->>'route_id')::uuid <> v_route_id then
    raise exception 'route create retry was not idempotent'; end if;
  v_result:=public.a7_orlando_route_command('add_stop',v_route_id,jsonb_build_object('order_number','MCO-99001','stop_type','pickup'),
    'owner','owner','route-fixture:add-pickup',now());
  v_result:=public.a7_orlando_route_command('add_stop',v_route_id,jsonb_build_object('order_number','MCO-99002','stop_type','delivery'),
    'owner','owner','route-fixture:add-delivery',now());
  v_result:=public.a7_orlando_route_command('add_stop',v_route_id,jsonb_build_object('order_number','MCO-99003','stop_type','delivery'),
    'owner','owner','route-fixture:add-bell',now());
  v_result:=public.a7_orlando_route_command('add_stop',v_route_id,jsonb_build_object('order_number','MCO-99004','stop_type','pickup'),
    'owner','owner','route-fixture:add-exception',now());
  v_result:=public.a7_orlando_route_command('create',null,jsonb_build_object('route_date',current_date,'driver_id',v_driver),
    'owner','owner','route-fixture:create-second',now());
  v_route2_id:=(v_result->'route'->>'route_id')::uuid;
  begin
    perform public.a7_orlando_route_command('add_stop',v_route2_id,jsonb_build_object('order_number','MCO-99001','stop_type','pickup'),
      'owner','owner','route-fixture:duplicate-active-leg',now());
  exception when unique_violation then v_blocked:=true;
  end;
  if not v_blocked then raise exception 'duplicate active route leg was not rejected'; end if;
  v_result:=public.a7_orlando_route_command('cancel',v_route2_id,jsonb_build_object('version',1),
    'owner','owner','route-fixture:cancel-second',now());
  if v_result->'route'->>'status'<>'cancelled' then raise exception 'draft route cancellation failed'; end if;
  v_route:=public.a7_orlando_route_payload(v_route_id);
  select (value->>'stop_id')::uuid into v_pickup_stop from jsonb_array_elements(v_route->'stops') where value->>'stop_type'='pickup';
  select (value->>'stop_id')::uuid into v_delivery_stop from jsonb_array_elements(v_route->'stops') where value->'order'->>'order_number'='MCO-99002';
  select (value->>'stop_id')::uuid into v_bell_stop from jsonb_array_elements(v_route->'stops') where value->'order'->>'order_number'='MCO-99003';
  select (value->>'stop_id')::uuid into v_exception_stop from jsonb_array_elements(v_route->'stops') where value->'order'->>'order_number'='MCO-99004';
  v_version:=(v_route->>'version')::integer;
  v_result:=public.a7_orlando_route_command('reorder',v_route_id,jsonb_build_object('version',v_version,'stop_ids',jsonb_build_array(v_delivery_stop,v_pickup_stop,v_bell_stop,v_exception_stop)),
    'owner','owner','route-fixture:reorder',now());
  v_version:=(v_result->'route'->>'version')::integer;
  v_result:=public.a7_orlando_route_command('set_eta',v_route_id,jsonb_build_object('version',v_version,'stop_id',v_pickup_stop,'eta_at','2026-09-02T14:30:00-04:00'),
    'owner','owner','route-fixture:set-eta',now());
  if v_result->'route'->'stops' is null then raise exception 'ETA response missing route stops'; end if;
  v_version:=(v_result->'route'->>'version')::integer;
  v_blocked:=false;
  begin
    update public.a7_orlando_orders set payment_status='pending' where id=v_delivery_order;
    perform public.a7_orlando_route_command('start',v_route_id,jsonb_build_object('version',v_version),
      'owner','manager','route-fixture:ineligible-start',now());
  exception when others then v_blocked:=true;
  end;
  if not v_blocked then raise exception 'start did not revalidate stop eligibility'; end if;
  v_result:=public.a7_orlando_route_command('start',v_route_id,jsonb_build_object('version',v_version),
    'owner','manager','route-fixture:start',now());
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_pickup_stop,'action','confirm_pickup'),
    'manager','manager','route-fixture:pickup',now());
  if (select custody_state from public.a7_orlando_orders where id=v_pickup_order) <> 'with_driver_pickup' then raise exception 'pickup order truth mismatch'; end if;
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_pickup_stop,'action','confirm_pickup'),
    'manager','manager','route-fixture:pickup',now());
  if not (v_result->>'duplicate')::boolean then raise exception 'pickup retry was not idempotent'; end if;
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_delivery_stop,'action','start_delivery'),
    'manager','manager','route-fixture:delivery-start',now());
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_delivery_stop,'action','complete_delivery','handoff_point','guest'),
    'manager','manager','route-fixture:delivery-complete',now());
  if (select order_status from public.a7_orlando_orders where id=v_delivery_order) <> 'delivered' then raise exception 'delivery order truth mismatch'; end if;
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_bell_stop,'action','start_delivery'),
    'manager','manager','route-fixture:bell-start',now());
  v_result:=public.a7_orlando_route_command('execute_stop',v_route_id,jsonb_build_object('stop_id',v_bell_stop,'action','leave_bell_desk','handoff_point','bell_desk'),
    'manager','manager','route-fixture:bell-handoff',now());
  if (select custody_state from public.a7_orlando_orders where id=v_bell_order) <> 'bell_desk'
    or (select order_status from public.a7_orlando_orders where id=v_bell_order) <> 'ready_for_delivery' then
    raise exception 'Bell Desk intermediate truth mismatch'; end if;
  v_result:=public.a7_orlando_route_command('exception',v_route_id,jsonb_build_object('stop_id',v_exception_stop,'reason','guest_unavailable'),
    'manager','manager','route-fixture:exception',now());
  if (select custody_state from public.a7_orlando_orders where id=v_exception_order) <> 'awaiting_pickup'
    or (select order_status from public.a7_orlando_orders where id=v_exception_order) <> 'pickup_scheduled' then
    raise exception 'route exception mutated order truth'; end if;
  v_route:=public.a7_orlando_route_payload(v_route_id); v_version:=(v_route->>'version')::integer;
  v_result:=public.a7_orlando_route_command('complete',v_route_id,jsonb_build_object('version',v_version),
    'owner','owner','route-fixture:complete',now());
  if v_result->'route'->>'status' <> 'completed' then raise exception 'route completion failed'; end if;
  if (select count(*) from public.a7_orlando_route_events where route_id=v_route_id and action='pickup_completed') <> 1 then raise exception 'pickup event mismatch'; end if;
  if (select count(*) from public.a7_orlando_route_events where route_id=v_route_id and action='delivery_completed') <> 1 then raise exception 'delivery event mismatch'; end if;
  if (select count(*) from public.a7_orlando_route_events where route_id=v_route_id and action='stop_exception') <> 1 then raise exception 'exception event mismatch'; end if;
end;
$w3d_route_probe$;

rollback;
