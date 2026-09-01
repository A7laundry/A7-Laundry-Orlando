'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');

const REQUEST_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMMUTABLE_PAYMENT_STATES = new Set(['paid', 'partially_refunded', 'refunded']);

function clean(value, max = 240) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new InvalidTransitionError('Invoice amount is unresolved.');
  return Math.round(amount * 100);
}

function dollars(value) { return Math.round(Number(value)) / 100; }

function invoiceFacts(order) {
  if (!order || !Array.isArray(order.items) || !order.items.length) {
    throw new InvalidTransitionError('Order items are required before invoice review.');
  }
  if (order.is_qa) throw new InvalidTransitionError('QA orders are read-only.');
  if (order.order_status === 'cancelled') throw new InvalidTransitionError('Cancelled orders cannot be invoiced.');
  if (order.production_state !== 'ready') {
    throw new InvalidTransitionError('Order must be ready before invoice review.');
  }
  if (IMMUTABLE_PAYMENT_STATES.has(order.payment_status)) {
    throw new InvalidTransitionError('Paid invoice is immutable.');
  }

  const lines = [];
  let itemSubtotalCents = 0;
  let minimumCents = 0;
  for (const item of order.items) {
    if (item.requires_manual_review) throw new InvalidTransitionError('Resolve manual-review items before invoice review.');
    if (!UUID.test(String(item.item_id || ''))) throw new InvalidTransitionError('Invoice item identity is unresolved.');
    const priceCents = cents(item.unit_price);
    if (priceCents < 0) throw new InvalidTransitionError('Invoice item price is invalid.');
    let lineSubtotalCents;
    let quantity = null;
    let actualLbs = null;
    if (item.unit === 'lb') {
      actualLbs = Number(item.actual_lbs);
      if (!Number.isFinite(actualLbs) || actualLbs <= 0) {
        throw new InvalidTransitionError('All per-pound items must be weighed before invoice review.');
      }
      lineSubtotalCents = Math.round(actualLbs * priceCents);
    } else {
      quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new InvalidTransitionError('All fixed-price items need a valid quantity before invoice review.');
      }
      lineSubtotalCents = Math.round(quantity * priceCents);
    }
    itemSubtotalCents += lineSubtotalCents;
    minimumCents = Math.max(minimumCents, item.minimum_amount == null ? 0 : cents(item.minimum_amount));
    lines.push({
      line_type:'item', order_item_id:String(item.item_id), label:clean(item.label, 160) || 'Service',
      unit:clean(item.unit, 30), quantity, actual_lbs:actualLbs,
      unit_price:dollars(priceCents), subtotal:dollars(lineSubtotalCents)
    });
  }
  const minimumAdjustmentCents = Math.max(minimumCents - itemSubtotalCents, 0);
  if (minimumAdjustmentCents) lines.push({
    line_type:'minimum_adjustment', order_item_id:null, label:'Order minimum adjustment',
    unit:'adjustment', quantity:1, actual_lbs:null, unit_price:dollars(minimumAdjustmentCents),
    subtotal:dollars(minimumAdjustmentCents)
  });
  const serviceAmountCents = itemSubtotalCents + minimumAdjustmentCents;
  if (serviceAmountCents <= 0) throw new InvalidTransitionError('Invoice total must be positive.');
  const facts = {
    currency:'USD', tip_amount:0, item_subtotal:dollars(itemSubtotalCents),
    minimum_amount:dollars(minimumCents), minimum_adjustment:dollars(minimumAdjustmentCents),
    service_amount:dollars(serviceAmountCents), lines
  };
  facts.facts_hash = crypto.createHash('sha256').update(JSON.stringify(facts)).digest('hex');
  return facts;
}

function safeInvoice(row) {
  if (!row) return null;
  return {
    version:Number(row.version) || 1,
    status:['issued', 'superseded', 'void'].includes(row.status) ? row.status : 'unknown',
    currency:'USD', item_subtotal:Number(row.item_subtotal), minimum_amount:Number(row.minimum_amount || 0),
    minimum_adjustment:Number(row.minimum_adjustment || 0), service_amount:Number(row.service_amount), tip_amount:0,
    reason:row.reason ? clean(row.reason, 240) : null, issued_at:row.issued_at || null,
    voided_at:row.voided_at || null,
    lines:Array.isArray(row.lines) ? row.lines.map((line) => ({
      line_type:line.line_type, label:clean(line.label, 160), unit:clean(line.unit, 30),
      quantity:line.quantity == null ? null : Number(line.quantity),
      actual_lbs:line.actual_lbs == null ? null : Number(line.actual_lbs),
      unit_price:Number(line.unit_price), subtotal:Number(line.subtotal)
    })) : []
  };
}

function safeFacts(facts) {
  if (!facts) return null;
  return {
    currency:'USD', tip_amount:0,
    item_subtotal:Number(facts.item_subtotal),
    minimum_amount:Number(facts.minimum_amount || 0),
    minimum_adjustment:Number(facts.minimum_adjustment || 0),
    service_amount:Number(facts.service_amount),
    lines:Array.isArray(facts.lines) ? facts.lines.map((line) => ({
      line_type:line.line_type, label:clean(line.label, 160), unit:clean(line.unit, 30),
      quantity:line.quantity == null ? null : Number(line.quantity),
      actual_lbs:line.actual_lbs == null ? null : Number(line.actual_lbs),
      unit_price:Number(line.unit_price), subtotal:Number(line.subtotal)
    })) : []
  };
}

function requestId(value) {
  const id = clean(value, 64).toLowerCase();
  if (!REQUEST_UUID.test(id)) throw new InvalidTransitionError('Invoice request identity is invalid.');
  return id;
}

function expectedVersion(value) {
  const version = Number(value);
  if (!Number.isInteger(version) || version < 0) throw new InvalidTransitionError('Invoice version is invalid.');
  return version;
}

function assertOwner(actor) {
  if (!actor || actor.role !== 'owner' || !clean(actor.actor_id, 120)) {
    throw new InvalidTransitionError('Owner authorization is required.');
  }
}

function actionKey(scope, orderNumber, request) {
  return `w1c-b1:${scope}:${crypto.createHash('sha256').update(`${orderNumber}|${request}`).digest('hex')}`;
}

function systemInvoiceService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());

  async function load(orderNumber) {
    const normalized = normalizeOrderNumber(orderNumber);
    if (!normalized) throw new InvalidTransitionError('Order number is invalid.');
    const order = await store.getSystemW1cOrderByNumber(normalized);
    if (!order) return null;
    const invoices = (await store.listSystemInvoices(normalized) || []).map(safeInvoice);
    const current = invoices.find((invoice) => invoice.status === 'issued') || null;
    let preview = null;
    let blocker = null;
    try { preview = invoiceFacts(order); }
    catch (error) {
      if (!(error instanceof InvalidTransitionError)) throw error;
      blocker = error.message;
    }
    return { order, invoices, current, preview, blocker };
  }

  return {
    store,
    async context(orderNumber) {
      const loaded = await load(orderNumber);
      if (!loaded) return null;
      const voidedOnly = !loaded.current && loaded.invoices.length > 0;
      return {
        order_number:normalizeOrderNumber(orderNumber), payment_status:loaded.order.payment_status,
        can_review:Boolean(loaded.preview) && !loaded.current && !voidedOnly,
        can_replace:Boolean(loaded.preview) && Boolean(loaded.current),
        can_void:Boolean(loaded.current) && !IMMUTABLE_PAYMENT_STATES.has(loaded.order.payment_status),
        blocker:loaded.blocker || (voidedOnly ? 'Voided invoice cannot be reissued in W1C-B1.' : null),
        preview:safeFacts(loaded.preview), current_invoice:loaded.current,
        invoices:loaded.invoices
      };
    },
    async review(raw, actor) {
      assertOwner(actor);
      const orderNumber = normalizeOrderNumber(raw.order_number);
      if (!orderNumber) throw new InvalidTransitionError('Order number is invalid.');
      const version = expectedVersion(raw.expected_invoice_version);
      const reason = clean(raw.reason, 240) || null;
      if (version > 0 && !reason) throw new InvalidTransitionError('A reason is required to replace an invoice.');
      const request = requestId(raw.request_id);
      const idempotencyKey = actionKey('review', orderNumber, request);
      const retry = await store.resolveSystemInvoiceActionRetry({
        order_number:orderNumber,
        action:'invoice_issued',
        expected_invoice_version:version,
        reason,
        idempotency_key:idempotencyKey
      });
      if (retry) return { duplicate:true, invoice:safeInvoice(retry.invoice) };
      const loaded = await load(orderNumber);
      if (!loaded) throw new InvalidTransitionError('Order not found.');
      if (!loaded.preview) throw new InvalidTransitionError(loaded.blocker || 'Invoice cannot be reviewed.');
      if (!loaded.current && loaded.invoices.length) {
        throw new InvalidTransitionError('Voided invoice cannot be reissued in W1C-B1.');
      }
      const result = await store.reviewSystemInvoice({
        order_number:orderNumber, expected_invoice_version:version,
        expected_order_version:Number(loaded.order.version), reason, facts:loaded.preview,
        actor_id:actor.actor_id, actor_role:actor.role,
        idempotency_key:idempotencyKey,
        occurred_at:now().toISOString()
      });
      return { duplicate:Boolean(result.duplicate), invoice:safeInvoice(result.invoice) };
    },
    async void(raw, actor) {
      assertOwner(actor);
      const orderNumber = normalizeOrderNumber(raw.order_number);
      if (!orderNumber) throw new InvalidTransitionError('Order number is invalid.');
      const version = expectedVersion(raw.expected_invoice_version);
      const reason = clean(raw.reason, 240);
      if (!reason) throw new InvalidTransitionError('A reason is required to void an invoice.');
      const request = requestId(raw.request_id);
      const idempotencyKey = actionKey('void', orderNumber, request);
      const retry = await store.resolveSystemInvoiceActionRetry({
        order_number:orderNumber,
        action:'invoice_voided',
        expected_invoice_version:version,
        reason,
        idempotency_key:idempotencyKey
      });
      if (retry) return { duplicate:true, invoice:safeInvoice(retry.invoice) };
      const loaded = await load(orderNumber);
      if (!loaded) throw new InvalidTransitionError('Order not found.');
      const result = await store.voidSystemInvoice({
        order_number:orderNumber, expected_invoice_version:version,
        reason, actor_id:actor.actor_id, actor_role:actor.role,
        idempotency_key:idempotencyKey,
        occurred_at:now().toISOString()
      });
      return { duplicate:Boolean(result.duplicate), invoice:safeInvoice(result.invoice) };
    }
  };
}

module.exports = { systemInvoiceService, invoiceFacts, safeInvoice, safeFacts, expectedVersion, IMMUTABLE_PAYMENT_STATES };
