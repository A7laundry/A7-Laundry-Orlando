'use strict';

const crypto = require('node:crypto');
const { InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');
const { can, CAPABILITIES } = require('./system-rbac.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROUTE_STATUSES = new Set(['draft', 'active', 'completed', 'cancelled']);
const STOP_TYPES = new Set(['pickup', 'delivery']);
const STOP_STATUSES = new Set(['pending', 'completed', 'exception', 'cancelled']);
const EXCEPTION_REASONS = new Set(['guest_unavailable', 'laundry_unavailable', 'hotel_refused_handoff', 'wrong_location', 'other']);

function clean(value, max = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function uuid(value, label) {
  const result = clean(value, 64).toLowerCase();
  if (!UUID.test(result)) throw new InvalidTransitionError(`${label} is invalid.`);
  return result;
}
function dateOnly(value) {
  const result = clean(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T12:00:00Z`))) {
    throw new InvalidTransitionError('Route date is invalid.');
  }
  return result;
}
function optionalTimestamp(value, label = 'ETA') {
  if (value == null || value === '') return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new InvalidTransitionError(`${label} is invalid.`);
  return new Date(time).toISOString();
}
function requestId(value) { return uuid(value, 'Submission identity'); }
function requireRouteActor(actor) {
  if (!actor || !can(actor, CAPABILITIES.ROUTE_MANAGE)) {
    const error = new InvalidTransitionError('Route access requires Owner or Manager authorization.');
    error.code = 'route_forbidden';
    throw error;
  }
  return actor;
}
function createRouteInput(raw = {}) {
  return { route_date:dateOnly(raw.route_date), driver_id:uuid(raw.driver_id, 'Driver identity'), request_id:requestId(raw.request_id) };
}
function addStopInput(raw = {}) {
  const stopType = clean(raw.stop_type, 16).toLowerCase();
  const orderNumber = normalizeOrderNumber(raw.order_number);
  if (!STOP_TYPES.has(stopType) || !orderNumber) throw new InvalidTransitionError('Route stop fields are invalid.');
  return { route_id:uuid(raw.route_id, 'Route identity'), order_number:orderNumber, stop_type:stopType,
    eta_at:optionalTimestamp(raw.eta_at), request_id:requestId(raw.request_id) };
}
function reorderInput(raw = {}) {
  const stopIds = Array.isArray(raw.stop_ids) ? raw.stop_ids.map((value) => uuid(value, 'Stop identity')) : [];
  if (!stopIds.length || new Set(stopIds).size !== stopIds.length) {
    throw new InvalidTransitionError('The complete unique pending-stop order is required.');
  }
  const version = Number(raw.version);
  if (!Number.isSafeInteger(version) || version < 1) throw new InvalidTransitionError('Route version is invalid.');
  return { route_id:uuid(raw.route_id, 'Route identity'), stop_ids:stopIds, version, request_id:requestId(raw.request_id) };
}
function routeActionInput(raw = {}) {
  const version = Number(raw.version);
  if (!Number.isSafeInteger(version) || version < 1) throw new InvalidTransitionError('Route version is invalid.');
  return { route_id:uuid(raw.route_id, 'Route identity'), version, request_id:requestId(raw.request_id) };
}
function stopActionInput(raw = {}) {
  const action = clean(raw.action, 32).toLowerCase();
  if (!['confirm_pickup', 'start_delivery', 'leave_bell_desk', 'complete_delivery'].includes(action)) {
    throw new InvalidTransitionError('Route stop action is invalid.');
  }
  return { route_id:uuid(raw.route_id, 'Route identity'), stop_id:uuid(raw.stop_id, 'Stop identity'), action,
    handoff_point:clean(raw.handoff_point, 32).toLowerCase() || null,
    handoff_note:clean(raw.handoff_note, 500) || null, request_id:requestId(raw.request_id) };
}
function exceptionInput(raw = {}) {
  const reason = clean(raw.reason, 40).toLowerCase();
  const note = clean(raw.note, 500) || null;
  if (!EXCEPTION_REASONS.has(reason) || (reason === 'other' && !note)) {
    throw new InvalidTransitionError('A governed stop exception reason is required.');
  }
  return { route_id:uuid(raw.route_id, 'Route identity'), stop_id:uuid(raw.stop_id, 'Stop identity'),
    reason, note, request_id:requestId(raw.request_id) };
}
function routeIdempotency(scope, input) {
  const target = input.stop_id || input.route_id || input.driver_id;
  return `route-${scope}:${crypto.createHash('sha256').update(`${target}|${input.request_id}`).digest('hex')}`;
}
function pickupEligible(order) {
  return Boolean(order && !order.is_qa && !['cancelled', 'delivered'].includes(order.order_status)
    && ['accepted', 'pickup_scheduled'].includes(order.order_status)
    && ['with_customer', 'awaiting_pickup'].includes(order.custody_state));
}
function deliveryEligible(order) {
  return Boolean(order && !order.is_qa && order.order_status !== 'cancelled'
    && order.payment_status === 'paid' && order.production_state === 'ready'
    && ['invoice_created', 'ready_for_delivery'].includes(order.order_status)
    && ['at_laundry', 'with_driver_delivery'].includes(order.custody_state));
}
function stopEligible(order, stopType) {
  return stopType === 'pickup' ? pickupEligible(order) : stopType === 'delivery' ? deliveryEligible(order) : false;
}
function systemRouteService(options = {}) {
  const store = options.routeStore;
  const now = options.now || (() => new Date());
  if (!store) throw new Error('Route store is required.');
  const actorFields = (actor) => ({ actor_id:actor.actor_id, actor_role:actor.role, occurred_at:now().toISOString() });
  return {
    async list(raw, actor) { requireRouteActor(actor); return store.listRoutes(raw || {}); },
    async detail(routeId, actor) { requireRouteActor(actor); return store.getRoute(uuid(routeId, 'Route identity')); },
    async eligible(raw, actor) { requireRouteActor(actor); return store.listEligibleStops(raw || {}); },
    async create(raw, actor) { requireRouteActor(actor); const input = createRouteInput(raw); return store.createRoute({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('create', input) }); },
    async addStop(raw, actor) { requireRouteActor(actor); const input = addStopInput(raw); return store.addRouteStop({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('add-stop', input) }); },
    async reorder(raw, actor) { requireRouteActor(actor); const input = reorderInput(raw); return store.reorderRouteStops({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('reorder', input) }); },
    async start(raw, actor) { requireRouteActor(actor); const input = routeActionInput(raw); return store.startRoute({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('start', input) }); },
    async executeStop(raw, actor) { requireRouteActor(actor); const input = stopActionInput(raw); return store.executeRouteStop({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency(input.action, input) }); },
    async recordException(raw, actor) { requireRouteActor(actor); const input = exceptionInput(raw); return store.recordRouteStopException({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('exception', input) }); },
    async complete(raw, actor) { requireRouteActor(actor); const input = routeActionInput(raw); return store.completeRoute({ ...input, ...actorFields(actor), idempotency_key:routeIdempotency('complete', input) }); }
  };
}

module.exports = { ROUTE_STATUSES, STOP_TYPES, STOP_STATUSES, EXCEPTION_REASONS, createRouteInput, addStopInput,
  reorderInput, routeActionInput, stopActionInput, exceptionInput, pickupEligible, deliveryEligible, stopEligible,
  routeIdempotency, requireRouteActor, systemRouteService };
