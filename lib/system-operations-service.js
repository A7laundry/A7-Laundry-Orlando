'use strict';

const crypto = require('node:crypto');
const governedConfig = require('../config/orlando-operations.json');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');
const { leadReference } = require('./system-lead-reference.js');

const CUSTODY_STATES = new Set([
  'with_customer', 'awaiting_pickup', 'with_driver_pickup', 'at_laundry',
  'with_driver_delivery', 'bell_desk', 'delivered'
]);
const PRODUCTION_STATES = new Set([
  'awaiting_intake', 'awaiting_weight', 'awaiting_processing', 'processing', 'ready'
]);
const TRANSITION_ACTIONS = new Set([
  'schedule_pickup', 'confirm_pickup', 'receive_at_laundry', 'start_processing',
  'mark_ready', 'start_delivery', 'leave_bell_desk', 'complete_delivery', 'set_promised_by',
  'record_weight', 'initialize_legacy_order'
]);
const HOTEL_HANDOFF_POINTS = new Set(['bell_desk', 'front_desk', 'concierge']);
const DIRECT_HANDOFF_POINTS = new Set(['guest', 'other']);
const QUEUES = new Set([
  'all', 'new', 'pickups_today', 'with_driver', 'at_laundry', 'awaiting_weight',
  'processing', 'ready', 'charge', 'awaiting_payment', 'deliveries', 'express', 'express_attention',
  'express_risk', 'express_late', 'late',
  'home_pickups', 'payment_attention', 'ready_dispatch', 'blockers'
]);
const ORDER_NUMBER = /^(?:A7-ORL-\d{4,}|MCO \d{4,12})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function legacyOperationalNumber(orderNumber) {
  const match = /^MCO (\d{4,12})$/.exec(orderNumber || '');
  return match ? 'A7-ORL-' + match[1] : null;
}

function matchesOperationalNumber(storedNumber, requestedNumber) {
  return storedNumber === requestedNumber || storedNumber === legacyOperationalNumber(requestedNumber);
}

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function timestamp(value, label) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) throw new InvalidTransitionError(`${label} is invalid.`);
  return new Date(time).toISOString();
}

function localParts(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new InvalidTransitionError('Promised-by must be an Orlando local date and time.');
  return { year:+match[1], month:+match[2], day:+match[3], hour:+match[4], minute:+match[5] };
}

function partsAt(instant, timeZone) {
  const rows = new Intl.DateTimeFormat('en-CA', {
    timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(instant);
  return Object.fromEntries(rows.filter((row) => row.type !== 'literal').map((row) => [row.type, Number(row.value)]));
}

function zonedLocalToUtc(value, timeZone = 'America/New_York') {
  const desired = localParts(value);
  const desiredUtc = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute);
  let guess = desiredUtc;
  for (let index = 0; index < 3; index += 1) {
    const shown = partsAt(new Date(guess), timeZone);
    const shownUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
    guess += desiredUtc - shownUtc;
  }
  const roundTrip = partsAt(new Date(guess), timeZone);
  if (Object.keys(desired).some((key) => desired[key] !== roundTrip[key])) {
    throw new InvalidTransitionError('Promised-by is not a valid Orlando local time.');
  }
  return new Date(guess).toISOString();
}

function normalizeSettings(value = governedConfig) {
  const source = value?.express_sla || value || {};
  const attention = source.attention_minutes == null ? null : Number(source.attention_minutes);
  const risk = source.risk_minutes == null ? null : Number(source.risk_minutes);
  const active = source.status === 'approved' && Number.isInteger(attention) && Number.isInteger(risk)
    && attention > risk && risk > 0;
  return {
    timezone: clean(value?.timezone || 'America/New_York', 80),
    status: active ? 'approved' : 'pending_approval',
    attention_minutes: active ? attention : null,
    risk_minutes: active ? risk : null
  };
}

function slaFor(order, settings, now = new Date()) {
  if (order.service_tier !== 'express') return { status: 'not_applicable', remaining_minutes: null };
  if (!order.promised_by) return { status: 'not_set', remaining_minutes: null };
  const due = Date.parse(order.promised_by);
  if (!Number.isFinite(due)) return { status: 'not_set', remaining_minutes: null };
  const remaining = Math.ceil((due - new Date(now).getTime()) / 60000);
  if (settings.status !== 'approved') return { status: 'not_configured', remaining_minutes: remaining };
  const status = remaining <= 0 ? 'late'
    : remaining <= settings.risk_minutes ? 'risk'
      : remaining <= settings.attention_minutes ? 'attention' : 'ok';
  return { status, remaining_minutes: remaining };
}

function standardOverdue(order, now = new Date()) {
  if (order.service_tier === 'express' || !order.needed_by) return false;
  const due = Date.parse(order.needed_by);
  return Number.isFinite(due) && due <= new Date(now).getTime()
    && !['delivered', 'cancelled'].includes(order.order_status);
}

function obligationStatus(order, now = new Date()) {
  const current = new Date(now).getTime();
  const pickupDue = Date.parse(order.pickup_window_end || '');
  const pickupOverdue = Number.isFinite(pickupDue) && pickupDue <= current
    && ['with_customer', 'awaiting_pickup'].includes(order.custody_state);
  const deliveryDue = Date.parse(order.promised_by || order.needed_by || '');
  const deliveryOverdue = Number.isFinite(deliveryDue) && deliveryDue <= current
    && order.custody_state !== 'delivered' && order.order_status !== 'cancelled';
  return {
    pickup_overdue:pickupOverdue,
    delivery_overdue:deliveryOverdue,
    overdue:pickupOverdue || deliveryOverdue,
    obligation:pickupOverdue ? 'pickup' : deliveryOverdue ? 'delivery' : null
  };
}

function nextActionFor(order) {
  if (order.is_qa) return { code: 'qa_read_only', label: 'PEDIDO QA — SOMENTE LEITURA', enabled: false };
  if (order.order_status === 'cancelled') return { code: 'cancelled', label: 'PEDIDO CANCELADO', enabled: false };
  if (order.order_status === 'delivered' || order.custody_state === 'delivered') {
    return { code: 'complete', label: 'PEDIDO CONCLUÍDO', enabled: false };
  }
  if (order.order_status === 'accepted'
    && order.custody_state === 'not_initialized' && order.production_state === 'not_initialized') {
    return { code:'initialize_legacy_order', label:'INICIAR CONTROLE OPERACIONAL', enabled:true,
      reason:'Pedido anterior ao controle operacional. Confirme o início sem presumir etapas passadas.' };
  }
  if (!CUSTODY_STATES.has(order.custody_state) || !PRODUCTION_STATES.has(order.production_state)) {
    return { code:'operational_blocker', label:'ESTADO OPERACIONAL INVÁLIDO', enabled:false,
      reason:'Custódia ou produção não possui um estado governado.' };
  }
  if (order.service_tier === 'express' && !order.promised_by) {
    return { code: 'set_promised_by', label: 'DEFINIR PRAZO EXPRESS', enabled: true };
  }
  if (order.order_status === 'accepted' && ['with_customer', 'awaiting_pickup'].includes(order.custody_state)) {
    return { code: 'schedule_pickup', label: 'AGENDAR COLETA', enabled: true };
  }
  if (order.order_status === 'pickup_scheduled' && order.custody_state === 'awaiting_pickup') {
    if (!order.pickup_driver) return { code:'assign_pickup_driver', label:'DESIGNAR MOTORISTA · COLETA', enabled:true };
    return { code: 'confirm_pickup', label: 'CONFIRMAR COLETA', enabled: true };
  }
  if (order.order_status === 'picked_up' && order.custody_state === 'with_driver_pickup') {
    return { code: 'receive_at_laundry', label: 'RECEBER NA LAVANDERIA', enabled: true };
  }
  if (order.custody_state === 'at_laundry' && order.production_state === 'awaiting_weight') {
    const weighable = order.items?.filter((item) => item.unit === 'lb') || [];
    const contractReady = weighable.length > 0
      && weighable.every((item) => UUID.test(String(item.item_id || ''))
        && Number.isInteger(item.weight_version) && item.weight_version >= 0);
    return contractReady
      ? { code:'record_weight', label:'REGISTRAR PESO', enabled:true }
      : { code:'record_weight', label:'REGISTRAR PESO', enabled:false, blocked_by:'W1C' };
  }
  if (order.custody_state === 'at_laundry' && order.production_state === 'awaiting_processing') {
    return { code: 'start_processing', label: 'INICIAR PROCESSAMENTO', enabled: true };
  }
  if (order.custody_state === 'at_laundry' && order.production_state === 'processing') {
    return { code: 'mark_ready', label: 'MARCAR PRONTO', enabled: true };
  }
  if (order.production_state === 'ready' && ['pending', 'void'].includes(order.payment_status)) {
    return { code: 'review_invoice', label: 'REVISAR INVOICE', enabled: true };
  }
  if (order.production_state === 'ready' && ['invoice_created', 'failed'].includes(order.payment_status)) {
    return { code: 'register_payment', label: 'REGISTRAR PAGAMENTO', enabled: true };
  }
  if (order.production_state === 'ready' && order.payment_status === 'paid'
    && order.custody_state === 'at_laundry') {
    if (!order.delivery_driver) return { code:'assign_delivery_driver', label:'DESIGNAR MOTORISTA · ENTREGA', enabled:true };
    return { code: 'start_delivery', label: 'SAIR PARA ENTREGA', enabled: true };
  }
  if (order.production_state === 'ready' && order.custody_state === 'with_driver_delivery') {
    return order.accommodation_type === 'hotel'
      ? { code: 'leave_bell_desk', label: 'REGISTRAR ENTREGA NO HOTEL', enabled: true }
      : { code: 'complete_delivery', label: 'CONFIRMAR ENTREGA AO CLIENTE', enabled: true };
  }
  if (order.production_state === 'ready' && order.custody_state === 'bell_desk') {
    return { code: 'complete_delivery', label: 'CONFIRMAR ENTREGA', enabled: true };
  }
  return { code: 'operational_blocker', label: 'DADOS OPERACIONAIS INCOMPATÍVEIS', enabled: false };
}

function dateKey(value, timeZone) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const p = partsAt(new Date(value), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function isInQueue(order, queue, context) {
  if (queue === 'all') return true;
  if (queue === 'new') return order.order_status === 'accepted';
  if (queue === 'pickups_today') return order.custody_state === 'awaiting_pickup'
    && dateKey(order.pickup_window_start, context.settings.timezone) === context.today;
  if (queue === 'with_driver') return ['with_driver_pickup', 'with_driver_delivery'].includes(order.custody_state);
  if (queue === 'at_laundry') return order.custody_state === 'at_laundry';
  if (queue === 'awaiting_weight') return order.production_state === 'awaiting_weight';
  if (queue === 'processing') return order.production_state === 'processing';
  if (queue === 'ready') return order.production_state === 'ready'
    && order.order_status !== 'delivered' && order.custody_state !== 'delivered';
  if (queue === 'charge') return order.production_state === 'ready' && ['pending', 'void'].includes(order.payment_status);
  if (queue === 'awaiting_payment') return ['invoice_created', 'failed'].includes(order.payment_status);
  if (queue === 'deliveries') return order.production_state === 'ready' && order.payment_status === 'paid'
    && !['delivered'].includes(order.custody_state);
  if (queue === 'express') return order.service_tier === 'express';
  if (queue === 'express_attention') return order.service_tier === 'express'
    && order.sla.status === 'attention';
  if (queue === 'express_risk') return order.service_tier === 'express' && order.sla.status === 'risk';
  if (queue === 'express_late') return order.service_tier === 'express' && order.sla.status === 'late';
  if (queue === 'late') return order.sla.status === 'late' || order.obligation.overdue;
  if (queue === 'home_pickups') return !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status)
    && ['with_customer', 'awaiting_pickup'].includes(order.custody_state);
  if (queue === 'payment_attention') return !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status)
    && ['pending', 'invoice_created', 'failed', 'void'].includes(order.payment_status);
  if (queue === 'ready_dispatch') return !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status)
    && order.production_state === 'ready' && order.payment_status === 'paid' && order.custody_state === 'at_laundry';
  if (queue === 'blockers') return !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status)
    && (order.next_action?.code === 'operational_blocker'
      || order.custody_state === 'not_initialized' || order.production_state === 'not_initialized'
      || (order.service_tier === 'express' && !order.promised_by)
      || (['with_customer', 'awaiting_pickup'].includes(order.custody_state) && !order.pickup_window_start)
      || (order.production_state === 'ready' && ['with_customer', 'awaiting_pickup', 'with_driver_pickup'].includes(order.custody_state)));
  return false;
}

function priority(order) {
  const rank = order.sla.status === 'late' ? 0 : order.sla.status === 'risk' ? 1
    : order.obligation?.overdue ? 2 : 3;
  const promised = Date.parse(order.promised_by || order.needed_by || '') || Number.MAX_SAFE_INTEGER;
  const window = Date.parse(order.pickup_window_start || '') || Number.MAX_SAFE_INTEGER;
  const oldest = Date.parse(order.operational_waiting_since || order.accepted_at || '') || Number.MAX_SAFE_INTEGER;
  return [rank, promised, window, oldest, order.order_number];
}

function comparePriority(left, right) {
  const a = priority(left); const b = priority(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] < b[index]) return -1;
    if (a[index] > b[index]) return 1;
  }
  return 0;
}

function safeOrder(row, settings, now) {
  const order = {
    order_number: row.order_number,
    order_status: row.order_status,
    payment_status: row.payment_status,
    invoice_id:row.invoice_id || null,
    service_amount:row.service_amount == null ? null : Number(row.service_amount),
    tip_amount:row.tip_amount == null ? null : Number(row.tip_amount),
    paid_at:row.paid_at || null,
    customer_name: row.customer_name || 'Customer',
    whatsapp_last4: String(row.whatsapp_last4 || '').slice(-4) || null,
    property: row.property || null,
    room: row.room || null,
    accommodation_type: row.accommodation_type || null,
    service_tier: row.service_tier || 'normal',
    custody_state: CUSTODY_STATES.has(row.custody_state) ? row.custody_state : 'not_initialized',
    production_state: PRODUCTION_STATES.has(row.production_state) ? row.production_state : 'not_initialized',
    accepted_at: row.accepted_at || null,
    pickup_window_start: row.pickup_window_start || null,
    pickup_window_end: row.pickup_window_end || null,
    needed_by: row.needed_by || null,
    promised_by: row.promised_by || null,
    pickup_driver:row.pickup_driver || null,
    delivery_driver:row.delivery_driver || null,
    manual_payment:row.manual_payment || null,
    delivery_handoff:row.delivery_handoff || null,
    operational_waiting_since: row.operational_waiting_since || row.accepted_at || null,
    estimated_lbs: row.estimated_lbs == null ? null : Number(row.estimated_lbs),
    bags_expected: row.bags_expected == null ? null : Number(row.bags_expected),
    special_instructions: row.special_instructions || null,
    items: Array.isArray(row.items) ? row.items.map((item) => ({
      item_id:UUID.test(String(item.item_id || '')) ? String(item.item_id) : null,
      catalog_code:item.catalog_code || null, service_type:item.service_type || null,
      label:item.label, unit:item.unit, quantity:item.quantity == null ? null : Number(item.quantity),
      estimated_lbs:item.estimated_lbs == null ? null : Number(item.estimated_lbs),
      unit_price:item.unit_price == null ? null : Number(item.unit_price),
      minimum_amount:item.minimum_amount == null ? null : Number(item.minimum_amount),
      actual_lbs:item.actual_lbs == null ? null : Number(item.actual_lbs),
      weighed_at:item.weighed_at || null,
      subtotal:item.subtotal == null ? null : Number(item.subtotal),
      weight_version:Number.isInteger(Number(item.weight_version)) ? Number(item.weight_version) : null,
      requires_manual_review:Boolean(item.requires_manual_review)
    })) : [],
    timeline: Array.isArray(row.timeline) ? row.timeline.map((event) => ({
      occurred_at:event.occurred_at, action:event.action, actor_label:event.actor_label || null
    })) : [],
    is_qa: Boolean(row.is_qa),
    version: Number(row.version) || 1
  };
  order.sla = slaFor(order, settings, now);
  order.standard_overdue = standardOverdue(order, now);
  order.obligation = obligationStatus(order, now);
  const weighable = order.items.filter((item) => item.unit === 'lb');
  const completed = weighable.filter((item) => item.actual_lbs != null).length;
  order.weight_progress = {
    required:weighable.length,
    completed,
    pending:weighable.length - completed,
    complete:weighable.length > 0 && completed === weighable.length
  };
  order.weight_editable = !order.is_qa && order.custody_state === 'at_laundry'
    && ((order.order_status === 'picked_up' && order.production_state === 'awaiting_weight')
      || (order.order_status === 'weighed' && order.production_state === 'awaiting_processing'));
  order.next_action = nextActionFor(order);
  order.pickup_order_path = `/sistema/orders/${encodeURIComponent(order.order_number)}/pickup-order`;
  return order;
}

function decorateSnapshot(raw, now, env = process.env) {
  const settings = normalizeSettings(raw?.settings || governedConfig);
  const orders = (Array.isArray(raw?.orders) ? raw.orders : []).map((row) => safeOrder(row, settings, now));
  const real = orders.filter((order) => !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status));
  const context = { settings, today: dateKey(now || new Date(), settings.timezone) };
  const count = (queue) => real.filter((order) => isInQueue(order, queue, context)).length;
  const waitingLeads = Array.isArray(raw?.waiting_leads) ? raw.waiting_leads.map((lead) => ({
    lead_ref:lead.lead_id && String(env.A7_SYSTEM_SESSION_SECRET || '').length >= 32
      ? leadReference(lead.lead_id, env) : null,
    customer_name:clean(lead.customer_name, 100) || 'Customer',
    whatsapp_last4:String(lead.whatsapp_last4 || '').replace(/\D/g, '').slice(-4) || null,
    property:clean(lead.property, 180) || null,
    customer_type:clean(lead.customer_type, 40) || 'unknown',
    created_at:Number.isFinite(Date.parse(lead.created_at || '')) ? new Date(lead.created_at).toISOString() : null,
    status:['new', 'qualifying', 'qualified'].includes(lead.status) ? lead.status : 'unknown'
  })) : [];
  return {
    as_of: new Date(now || Date.now()).toISOString(),
    timezone: settings.timezone,
    settings,
    waiting_confirmation: raw?.waiting_confirmation == null ? null : Number(raw.waiting_confirmation),
    waiting_leads:waitingLeads,
    counters: {
      waiting_confirmation: raw?.waiting_confirmation == null ? null : Number(raw.waiting_confirmation),
      pickups: count('pickups_today'), with_driver: count('with_driver'), at_laundry: count('at_laundry'),
      awaiting_weight: count('awaiting_weight'), processing: count('processing'), ready: count('ready'),
      charge: count('charge'), awaiting_payment: count('awaiting_payment'), deliveries: count('deliveries'),
      express_attention: real.filter((order) => order.sla.status === 'attention').length,
      express_risk: real.filter((order) => order.sla.status === 'risk').length,
      express_late: real.filter((order) => order.sla.status === 'late').length
    },
    orders: orders.sort(comparePriority)
  };
}

function orderForActor(order, actor) {
  if (!order || actor?.role === 'owner') return order;
  if (actor?.role === 'manager') {
    return order.next_action?.code === 'initialize_legacy_order'
      ? { ...order, next_action:{ ...order.next_action, enabled:false, blocked_by:'Owner' } }
      : order;
  }
  if (actor?.role !== 'operator') return order;
  const canMarkReady = order.next_action?.code === 'mark_ready' && order.next_action.enabled;
  return {
    ...order,
    weight_editable:false,
    next_action:canMarkReady ? order.next_action : {
      ...order.next_action,
      enabled:false,
      blocked_by:order.next_action?.blocked_by || 'Owner'
    }
  };
}

function snapshotForActor(snapshot, actor) {
  if (actor?.role !== 'operator') return snapshot;
  return { ...snapshot, orders:(snapshot.orders || []).map((order) => orderForActor(order, actor)) };
}

function validateTransition(raw, settings) {
  const action = clean(raw.action, 40);
  if (!TRANSITION_ACTIONS.has(action)) throw new InvalidTransitionError('Operational action is invalid.');
  const orderNumber = normalizeOrderNumber(raw.order_number);
  if (!orderNumber || !ORDER_NUMBER.test(orderNumber)) throw new InvalidTransitionError('Order number is invalid.');
  const requestId = clean(raw.request_id, 64).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
    throw new InvalidTransitionError('Operational request identity is invalid.');
  }
  const reason = clean(raw.reason, 240) || null;
  if (action === 'initialize_legacy_order' && !reason) {
    throw new InvalidTransitionError('A reason is required to initialize a legacy order.');
  }
  const promisedBy = action === 'set_promised_by'
    ? zonedLocalToUtc(raw.promised_by_local, settings.timezone) : null;
  let orderItemId = null;
  let actualLbs = null;
  let expectedWeightVersion = null;
  if (action === 'record_weight') {
    orderItemId = clean(raw.order_item_id, 64).toLowerCase();
    actualLbs = Number(raw.actual_lbs);
    expectedWeightVersion = Number(raw.expected_weight_version);
    if (!UUID.test(orderItemId) || !Number.isFinite(actualLbs) || actualLbs <= 0
      || !Number.isInteger(expectedWeightVersion) || expectedWeightVersion < 0) {
      throw new InvalidTransitionError('Item weight fields are invalid.');
    }
  }
  const handoffPoint = clean(raw.handoff_point, 32).toLowerCase() || null;
  const handoffNote = clean(raw.handoff_note, 500) || null;
  if (action === 'leave_bell_desk' && !HOTEL_HANDOFF_POINTS.has(handoffPoint)) {
    throw new InvalidTransitionError('Select Bell Desk, Front Desk or Concierge.');
  }
  if (action === 'complete_delivery' && handoffPoint && !DIRECT_HANDOFF_POINTS.has(handoffPoint)) {
    throw new InvalidTransitionError('Direct delivery handoff is invalid.');
  }
  if (handoffPoint === 'other' && !handoffNote) {
    throw new InvalidTransitionError('A handoff note is required for Other.');
  }
  return { action, order_number:orderNumber, request_id:requestId, reason, promised_by:promisedBy,
    order_item_id:orderItemId, actual_lbs:actualLbs, expected_weight_version:expectedWeightVersion,
    handoff_point:handoffPoint, handoff_note:handoffNote };
}

function transitionKey(input) {
  const scope = input.action === 'record_weight' ? 'w1c-a' : 'w1b';
  return `${scope}:${crypto.createHash('sha256').update(`${input.order_number}|${input.request_id}`).digest('hex')}`;
}

function systemOperationsService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());
  const env = options.env || process.env;
  return {
    store,
    async today() {
      return decorateSnapshot(await store.getSystemOperationalSnapshot(), now(), env);
    },
    async list(raw = {}) {
      const queue = clean(raw.queue, 40) || 'all';
      if (!QUEUES.has(queue)) throw new InvalidTransitionError('Operational queue is invalid.');
      const custodyState = clean(raw.custody_state, 40);
      const productionState = clean(raw.production_state, 40);
      if (custodyState && !CUSTODY_STATES.has(custodyState)) throw new InvalidTransitionError('Custody filter is invalid.');
      if (productionState && !PRODUCTION_STATES.has(productionState)) throw new InvalidTransitionError('Production filter is invalid.');
      const query = clean(raw.query, 160).toLocaleLowerCase('en-US');
      const snapshot = decorateSnapshot(await store.getSystemOperationalSnapshot(), now(), env);
      const context = { settings:snapshot.settings, today:dateKey(now(), snapshot.settings.timezone) };
      const orders = snapshot.orders.filter((order) => {
        if (order.is_qa && !normalizeOrderNumber(raw.query)) return false;
        if (!isInQueue(order, queue, context)) return false;
        if (custodyState && order.custody_state !== custodyState) return false;
        if (productionState && order.production_state !== productionState) return false;
        if (!query) return true;
        const normalized = normalizeOrderNumber(query);
        if (normalized) return matchesOperationalNumber(order.order_number, normalized);
        const digits = query.replace(/\D/g, '');
        if (digits.length >= 4 && order.whatsapp_last4 === digits.slice(-4)) return true;
        return [order.customer_name, order.property].some((value) => String(value || '').toLocaleLowerCase('en-US').includes(query));
      });
      return { queue, custody_state:custodyState || null, production_state:productionState || null,
        as_of:snapshot.as_of, timezone:snapshot.timezone, orders };
    },
    async detail(rawNumber) {
      const orderNumber = normalizeOrderNumber(rawNumber);
      if (!orderNumber) throw new InvalidTransitionError('Order number is invalid.');
      let raw = await store.getSystemW1cOrderByNumber(orderNumber);
      const legacyNumber = legacyOperationalNumber(orderNumber);
      if (!raw && legacyNumber) raw = await store.getSystemW1cOrderByNumber(legacyNumber);
      if (!raw) return null;
      const settings = normalizeSettings((await store.getSystemOperationalSnapshot()).settings || governedConfig);
      return safeOrder(raw, settings, now());
    },
    async transition(raw, actor) {
      const snapshot = await store.getSystemOperationalSnapshot();
      const settings = normalizeSettings(snapshot.settings || governedConfig);
      const input = validateTransition(raw, settings);
      const isOwner = ['owner', 'manager'].includes(actor?.role);
      const isOperatorReady = actor?.role === 'operator' && input.action === 'mark_ready';
      if (!actor || (!isOwner && !isOperatorReady)) {
        throw new InvalidTransitionError('This operational action requires Owner authorization.');
      }
      if (input.action === 'initialize_legacy_order' && actor.role !== 'owner') {
        throw new InvalidTransitionError('Legacy order initialization requires Owner authorization.');
      }
      const operation = {
        ...input, actor_id:actor.actor_id, actor_role:actor.role,
        idempotency_key:transitionKey(input), occurred_at:now().toISOString()
      };
      const result = input.action === 'record_weight'
        ? await store.recordSystemItemWeight(operation)
        : input.action === 'initialize_legacy_order'
          ? await store.initializeSystemLegacyOrder(operation)
          : await store.transitionSystemOperationalOrder(operation);
      const row = await store.getSystemW1cOrderByNumber(input.order_number) || result.order;
      return { duplicate:Boolean(result.duplicate), order:safeOrder(row, settings, now()) };
    }
  };
}

module.exports = {
  systemOperationsService, normalizeSettings, slaFor, standardOverdue, obligationStatus, nextActionFor,
  comparePriority, isInQueue, decorateSnapshot, validateTransition, transitionKey,
  orderForActor, snapshotForActor,
  zonedLocalToUtc, CUSTODY_STATES, PRODUCTION_STATES, TRANSITION_ACTIONS, QUEUES,
  HOTEL_HANDOFF_POINTS, DIRECT_HANDOFF_POINTS, legacyOperationalNumber, matchesOperationalNumber
};
