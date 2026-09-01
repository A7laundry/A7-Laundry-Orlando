'use strict';

const { systemOperationsService, snapshotForActor, isInQueue } = require('./system-operations-service.js');
const { systemFinanceService, dateInNewYork, shiftDate } = require('./system-finance-service.js');
const { InvalidTransitionError } = require('./operational-store.js');

const TIMEZONE = 'America/New_York';
const ACTIVE_EXCLUSIONS = new Set(['cancelled', 'delivered']);

function localDate(value, timezone = TIMEZONE) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function activeOrder(order) {
  return order && !order.is_qa && !ACTIVE_EXCLUSIONS.has(order.order_status)
    && order.custody_state !== 'delivered';
}

function realOrder(order) {
  return order && !order.is_qa && order.order_status !== 'cancelled';
}

function sumActualLbs(orders, predicate = () => true) {
  let total = 0;
  let known = false;
  for (const order of orders) {
    for (const item of order.items || []) {
      if (!predicate(item, order) || item.actual_lbs == null || !Number.isFinite(Number(item.actual_lbs))) continue;
      total += Number(item.actual_lbs);
      known = true;
    }
  }
  return known ? Math.round((total + Number.EPSILON) * 100) / 100 : null;
}

function isBlocker(order) {
  return isInQueue(order, 'blockers', {});
}

function priorityTuple(order) {
  const blocker = isBlocker(order);
  const rank = order.sla?.status === 'late' ? 0 : order.sla?.status === 'risk' ? 1 : blocker ? 2 : 3;
  const deadline = Date.parse(order.promised_by || order.needed_by || order.pickup_window_start || '') || Number.MAX_SAFE_INTEGER;
  const waiting = Date.parse(order.operational_waiting_since || order.accepted_at || '') || Number.MAX_SAFE_INTEGER;
  return [rank, deadline, waiting, String(order.order_number || '')];
}

function comparePriority(left, right) {
  const a = priorityTuple(left); const b = priorityTuple(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] < b[index]) return -1;
    if (a[index] > b[index]) return 1;
  }
  return 0;
}

function safeAction(order) {
  return {
    kind:'order', order_number:order.order_number, customer_name:order.customer_name,
    property:order.property || null, service_tier:order.service_tier,
    deadline:order.promised_by || order.needed_by || order.pickup_window_start || null,
    payment_status:order.payment_status, sla_status:order.sla?.status || 'not_applicable',
    next_action:{ code:order.next_action?.code || 'review_state', label:order.next_action?.label || 'REVISAR PEDIDO' }
  };
}

function delta(current, previous) {
  if (current == null || previous == null || Number(previous) === 0) return null;
  return Math.round((((Number(current) - Number(previous)) / Number(previous)) * 100 + Number.EPSILON) * 10) / 10;
}

function periodBlock(report) {
  if (!report) return null;
  const summary = report.summary;
  return {
    period:report.period,
    availability:report.availability,
    revenue:summary.confirmed_service_revenue,
    paid_orders:summary.paid_order_count,
    average_paid_order:summary.average_service_ticket,
    paying_customers:summary.customer_count,
    repeat_orders:summary.repeat_customer_orders
  };
}

function buildHomeProjection({ operational, financeToday = null, financeCurrent = null, financePrevious = null, actor, now = new Date() }) {
  if (!operational || !actor || !['owner', 'operator'].includes(actor.role)) {
    throw new InvalidTransitionError('Home identity or operational source is unavailable.');
  }
  const timezone = operational.timezone || TIMEZONE;
  const today = localDate(now, timezone);
  const all = Array.isArray(operational.orders) ? operational.orders : [];
  const active = all.filter(activeOrder);
  const real = all.filter(realOrder);
  const waitingLeads = Array.isArray(operational.waiting_leads) ? operational.waiting_leads : [];
  const pickupOrders = active.filter((order) => isInQueue(order, 'home_pickups', {}));
  const driverPickup = active.filter((order) => order.custody_state === 'with_driver_pickup');
  const driverDelivery = active.filter((order) => order.custody_state === 'with_driver_delivery');
  const processing = active.filter((order) => order.production_state === 'processing');
  const ready = active.filter((order) => order.production_state === 'ready');
  const atLaundry = active.filter((order) => order.custody_state === 'at_laundry');
  const readyLaundry = ready.filter((order) => order.custody_state === 'at_laundry');
  const readyBellDesk = ready.filter((order) => order.custody_state === 'bell_desk');
  const paymentAttention = active.filter((order) => isInQueue(order, 'payment_attention', {}));
  const expressAttention = active.filter((order) => isInQueue(order, 'express_attention', {}));
  const blockers = active.filter(isBlocker);
  const readyForDispatch = ready.filter((order) => isInQueue(order, 'ready_dispatch', {}));

  const nextActions = active.slice().sort(comparePriority).slice(0, 5).map(safeAction);
  for (const lead of waitingLeads.slice(0, Math.max(0, 5 - nextActions.length))) {
    nextActions.push({ kind:'lead', customer_name:lead.customer_name, property:lead.property || null,
      created_at:lead.created_at || null, next_action:{ code:'confirm_customer', label:'CONFIRMAR VENDA' } });
  }

  const needsAttention = [
    { key:'customer_waiting', label:'Cliente aguardando', count:operational.waiting_confirmation,
      tone:'amber', target:{ view:'attendance' } },
    { key:'payments_pending', label:'Pagamento requer atenção', count:paymentAttention.length,
      amount:null, amount_availability:'unavailable', tone:'amber', target:{ view:'orders', queue:'payment_attention' } },
    { key:'express_attention', label:'Express em atenção', count:expressAttention.length,
      late:expressAttention.filter((order) => order.sla?.status === 'late').length,
      risk:expressAttention.filter((order) => order.sla?.status === 'risk').length,
      tone:expressAttention.some((order) => order.sla?.status === 'late') ? 'red' : 'amber',
      target:{ view:'orders', queue:'express_attention' } },
    { key:'ready_for_dispatch', label:'Pronto para sair', count:readyForDispatch.length,
      tone:'green', target:{ view:'orders', queue:'ready_dispatch' } },
    { key:'blockers', label:'Bloqueios operacionais', count:blockers.length,
      tone:'red', target:{ view:'orders', queue:'blockers' } }
  ].filter((item) => item.count != null && item.count > 0);

  const home = {
    meta:{ as_of:operational.as_of, timezone, date:today, role:actor.role,
      sources:['operational_snapshot'], availability:actor.role === 'owner' && !financeToday ? 'partial' : 'current' },
    operation:{
      pickups:{ count:pickupOrders.length, next_window:pickupOrders.map((order) => order.pickup_window_start).filter(Boolean).sort()[0] || null,
        target:{ view:'orders', queue:'home_pickups' } },
      with_driver:{ count:driverPickup.length + driverDelivery.length, pickup:driverPickup.length, delivery:driverDelivery.length,
        target:{ view:'orders', queue:'with_driver' } },
      processing:{ count:processing.length, actual_lbs:sumActualLbs(processing), target:{ view:'orders', queue:'processing' } },
      ready:{ count:ready.length, at_laundry:readyLaundry.length, with_driver_delivery:driverDelivery.filter((order) => order.production_state === 'ready').length,
        bell_desk:readyBellDesk.length, target:{ view:'orders', queue:'ready' } },
      at_laundry_secondary:{ count:atLaundry.length, awaiting_weight:atLaundry.filter((order) => order.production_state === 'awaiting_weight').length,
        awaiting_processing:atLaundry.filter((order) => order.production_state === 'awaiting_processing').length,
        processing:atLaundry.filter((order) => order.production_state === 'processing').length, ready:readyLaundry.length,
        target:{ view:'orders', queue:'at_laundry' } }
    },
    needs_attention:needsAttention,
    next_actions:nextActions
  };

  if (actor.role === 'owner') {
    const finance = periodBlock(financeToday);
    const weighedOrders = new Set();
    const poundsToday = sumActualLbs(real, (item, order) => {
      const matches = localDate(item.weighed_at, timezone) === today;
      if (matches) weighedOrders.add(order.order_number);
      return matches;
    });
    home.meta.sources.push('owner_finance');
    home.business_today = {
      availability:finance ? 'current' : 'unavailable',
      revenue:finance?.revenue ?? null,
      revenue_coverage:'reconciled_confirmed_service_revenue',
      orders_accepted:real.filter((order) => localDate(order.accepted_at, timezone) === today).length,
      average_paid_order:finance?.average_paid_order ?? null,
      pounds:poundsToday,
      orders_weighed:poundsToday == null ? 0 : weighedOrders.size,
      average_lbs_per_weighed_order:poundsToday == null || weighedOrders.size === 0 ? null
        : Math.round(((poundsToday / weighedOrders.size) + Number.EPSILON) * 100) / 100
    };
    const current = periodBlock(financeCurrent); const previous = periodBlock(financePrevious);
    home.last_7_days = current ? {
      availability:'current', current, previous,
      delta_percent:{ revenue:delta(current.revenue, previous?.revenue), paid_orders:delta(current.paid_orders, previous?.paid_orders),
        average_paid_order:delta(current.average_paid_order, previous?.average_paid_order),
        paying_customers:delta(current.paying_customers, previous?.paying_customers) }
    } : { availability:'unavailable', current:null, previous:null,
      delta_percent:{ revenue:null, paid_orders:null, average_paid_order:null, paying_customers:null } };
  }
  return home;
}

function systemHomeService(options = {}) {
  const now = options.now || (() => new Date());
  const operations = options.operationsService || systemOperationsService(options);
  const finance = options.financeService || systemFinanceService(options);
  return {
    async report(actor) {
      if (!actor || !['owner', 'operator'].includes(actor.role)) throw new InvalidTransitionError('Home authorization is required.');
      const operationalPromise = operations.today();
      if (actor.role === 'operator') {
        const operational = snapshotForActor(await operationalPromise, actor);
        return buildHomeProjection({ operational, actor, now:now() });
      }
      const currentNow = now();
      const today = dateInNewYork(currentNow);
      const financeInputs = [
        { preset:'today' },
        { preset:'7d' },
        { preset:'custom', start_date:shiftDate(today, -13), end_date:shiftDate(today, -7) }
      ];
      const [operationalResult, ...financeResults] = await Promise.allSettled([
        operationalPromise, ...financeInputs.map((input) => finance.report(input, actor))
      ]);
      if (operationalResult.status !== 'fulfilled') throw operationalResult.reason;
      const value = (result) => result.status === 'fulfilled' ? result.value : null;
      return buildHomeProjection({ operational:operationalResult.value, financeToday:value(financeResults[0]),
        financeCurrent:value(financeResults[1]), financePrevious:value(financeResults[2]), actor, now:currentNow });
    }
  };
}

module.exports = { systemHomeService, buildHomeProjection, activeOrder, isBlocker, comparePriority, localDate };
