'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METHODS = new Set(['stripe', 'cash', 'zelle', 'other']);
const LEGS = new Set(['pickup', 'delivery']);

function clean(value, max = 200) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function phone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new InvalidTransitionError('Driver phone must use a valid international number.');
  }
  return digits;
}

function timestamp(value, label) {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) throw new InvalidTransitionError(`${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function requestId(value) {
  const id = clean(value, 64).toLowerCase();
  if (!UUID.test(id)) throw new InvalidTransitionError('Submission identity is invalid.');
  return id;
}

function cents(value, label = 'Amount') {
  const raw = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new InvalidTransitionError(`${label} is invalid.`);
  const result = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(result) || result <= 0) throw new InvalidTransitionError(`${label} must be positive.`);
  return result;
}

function driverInput(raw = {}) {
  const driverId = clean(raw.driver_id, 64).toLowerCase() || null;
  if (driverId && !UUID.test(driverId)) throw new InvalidTransitionError('Driver identity is invalid.');
  const name = clean(raw.full_name, 100);
  if (!name) throw new InvalidTransitionError('Driver name is required.');
  return {
    driver_id:driverId,
    full_name:name,
    phone:phone(raw.phone),
    active:raw.active !== false,
    request_id:requestId(raw.request_id)
  };
}

function assignmentInput(raw = {}) {
  const orderNumber = normalizeOrderNumber(raw.order_number);
  const driverId = clean(raw.driver_id, 64).toLowerCase();
  const leg = clean(raw.leg, 16).toLowerCase();
  if (!orderNumber || !UUID.test(driverId) || !LEGS.has(leg)) {
    throw new InvalidTransitionError('Driver assignment fields are invalid.');
  }
  return { order_number:orderNumber, driver_id:driverId, leg, request_id:requestId(raw.request_id) };
}

function paymentInput(raw = {}) {
  const orderNumber = normalizeOrderNumber(raw.order_number);
  const method = clean(raw.method, 16).toLowerCase();
  if (!orderNumber || !METHODS.has(method)) throw new InvalidTransitionError('Manual payment fields are invalid.');
  return {
    order_number:orderNumber,
    method,
    amount_cents:cents(raw.amount),
    paid_at:timestamp(raw.paid_at, 'Payment date and time'),
    note:clean(raw.note, 500) || null,
    request_id:requestId(raw.request_id)
  };
}

function idempotency(scope, input) {
  return `${scope}:${crypto.createHash('sha256').update(`${input.order_number || input.driver_id || 'new'}|${input.request_id}`).digest('hex')}`;
}

function safeDriver(row) {
  return row ? {
    driver_id:row.driver_id || row.id,
    full_name:row.full_name,
    phone:row.phone,
    active:Boolean(row.active),
    created_at:row.created_at || null,
    updated_at:row.updated_at || null
  } : null;
}

function systemOperationalCycleService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());
  return {
    store,
    async listDrivers(raw = {}, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role)) {
        throw new InvalidTransitionError('Driver directory requires management authorization.');
      }
      const rows = await store.listSystemDrivers({ include_inactive:actor.role === 'owner' && Boolean(raw.include_inactive) });
      return (Array.isArray(rows) ? rows : []).map(safeDriver);
    },
    async saveDriver(raw, actor) {
      if (actor?.role !== 'owner') throw new InvalidTransitionError('Only Owner can manage drivers.');
      const input = driverInput(raw);
      const result = await store.upsertSystemDriver({
        ...input,
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:idempotency('driver', input),
        occurred_at:now().toISOString()
      });
      return { ...result, driver:safeDriver(result.driver) };
    },
    async assignDriver(raw, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role)) {
        throw new InvalidTransitionError('Driver assignment requires management authorization.');
      }
      const input = assignmentInput(raw);
      return store.assignSystemDriver({
        ...input,
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:idempotency(`driver-${input.leg}`, input),
        occurred_at:now().toISOString()
      });
    },
    async registerPayment(raw, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role)) {
        throw new InvalidTransitionError('Payment registration requires financial authorization.');
      }
      const input = paymentInput(raw);
      return store.recordSystemManualPayment({
        ...input,
        amount:input.amount_cents / 100,
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:idempotency('manual-payment', input),
        occurred_at:now().toISOString()
      });
    }
  };
}

module.exports = {
  systemOperationalCycleService, driverInput, assignmentInput, paymentInput, idempotency,
  METHODS, LEGS, safeDriver
};
