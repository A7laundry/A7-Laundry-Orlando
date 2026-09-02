'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, OperationalStoreError } = require('../lib/operational-store');
const { deliverOutbox } = require('../lib/ga4-server');

const SIGNATURE_TOLERANCE_SECONDS = 300;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYMENT_INTENT_PATTERN = /^pi_[A-Za-z0-9_]+$/;
const REFUND_PATTERN = /^re_[A-Za-z0-9_]+$/;
const STRIPE_EVENT_PATTERN = /^evt_[A-Za-z0-9_]+$/;
const CHECKOUT_SESSION_PATTERN = /^cs_[A-Za-z0-9_]+$/;
const PAYMENT_LINK_PATTERN = /^plink_[A-Za-z0-9_]+$/;
const MAX_BODY_BYTES = 1_048_576;

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_BODY_BYTES) throw new Error('Webhook body exceeds the allowed size.');
    return req.body;
  }
  if (typeof req.body === 'string') {
    const body = Buffer.from(req.body, 'utf8');
    if (body.length > MAX_BODY_BYTES) throw new Error('Webhook body exceeds the allowed size.');
    return body;
  }
  if (req && typeof req[Symbol.asyncIterator] === 'function') {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_BODY_BYTES) throw new Error('Webhook body exceeds the allowed size.');
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Raw webhook body is required.');
}

function secureEqualHex(left, right) {
  if (!/^[0-9a-f]+$/i.test(left || '') || !/^[0-9a-f]+$/i.test(right || '')) return false;
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyStripeSignature(payload, signatureHeader, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret || typeof signatureHeader !== 'string') throw new Error('Webhook signature is not configured.');
  const values = signatureHeader.split(',').map((part) => part.trim());
  const timestampPart = values.find((part) => part.startsWith('t='));
  const signatures = values.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const timestamp = Number(timestampPart && timestampPart.slice(2));
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error('Webhook signature timestamp is invalid.');
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload.toString('utf8')}`)
    .digest('hex');
  if (!signatures.some((signature) => secureEqualHex(signature, expected))) {
    throw new Error('Webhook signature is invalid.');
  }
  return true;
}

function unixIso(seconds) {
  const number = Number(seconds);
  if (!Number.isInteger(number) || number <= 0) throw new Error('Stripe event timestamp is invalid.');
  return new Date(number * 1000).toISOString();
}

function metadataFrom(object) {
  return object && object.metadata && typeof object.metadata === 'object' ? object.metadata : {};
}

async function processCheckoutPaid(event, store, deliveryOptions) {
  const session = event.data && event.data.object;
  if (!session || session.object !== 'checkout.session' || session.payment_status !== 'paid') {
    return { ignored: true, reason: 'checkout_not_paid' };
  }
  const metadata = metadataFrom(session);
  const orderId = String(metadata.order_id || '').toLowerCase();
  const leadId = String(metadata.lead_id || '').toLowerCase();
  const contractVersion = String(metadata.contract_version || '');
  const transactionId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent && session.payment_intent.id;
  const paymentLinkId = typeof session.payment_link === 'string'
    ? session.payment_link : session.payment_link?.id || null;
  if (contractVersion !== '1' || !UUID_PATTERN.test(orderId) || !UUID_PATTERN.test(leadId)
    || !PAYMENT_INTENT_PATTERN.test(transactionId || '') || !CHECKOUT_SESSION_PATTERN.test(session.id || '')
    || (paymentLinkId && !PAYMENT_LINK_PATTERN.test(paymentLinkId))) {
    throw new Error('Paid checkout is missing its stable operational linkage.');
  }
  const order = await store.getOrder(orderId);
  if (!order || order.lead_id !== leadId) throw new Error('Paid checkout references an unknown order.');
  const currency = String(session.currency || '').toUpperCase();
  const amount = Number(session.amount_total) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || currency !== 'USD') throw new Error('Paid checkout amount is invalid.');

  // New governed links persist service/tip composition before Stripe is called.
  // Legacy zero-tip links remain supported, but may never infer a tip from a total.
  const governedLink = paymentLinkId
    ? await store.getSystemPaymentLinkByStripeId(paymentLinkId) : null;
  let composition = {};
  if (governedLink) {
    if (governedLink.order_id !== orderId || governedLink.invoice_id !== (order.current_invoice_id || order.invoice_id)
      || governedLink.status !== 'active' || Number(governedLink.total_amount) !== amount
      || Number(governedLink.service_amount) !== Number(order.service_amount)) {
      throw new Error('Paid checkout does not match its governed Payment Link.');
    }
    composition = {
      service_amount:Number(governedLink.service_amount),
      tip_amount:Number(governedLink.tip_amount),
      total_amount:Number(governedLink.total_amount)
    };
  } else if (amount !== Number(order.service_amount)) {
    throw new Error('Legacy checkout cannot carry an inferred tip.');
  }

  const result = await store.recordPayment({
    stripe_event_id: event.id,
    event_type: event.type,
    order_id: orderId,
    transaction_id: transactionId,
    checkout_session_id: session.id,
    payment_link_id: paymentLinkId,
    amount,
    ...composition,
    currency,
    paid_at: unixIso(event.created)
  });
  await deliverOutbox(store, `purchase:${transactionId}`, deliveryOptions).catch(() => null);
  return { ignored: false, duplicate: Boolean(result && result.duplicate), transaction_id: transactionId };
}

async function processCheckoutPaymentState(event, store) {
  const session = event.data && event.data.object;
  if (!session || session.object !== 'checkout.session') {
    return { ignored: true, reason: 'invalid_checkout_state' };
  }
  const metadata = metadataFrom(session);
  const orderId = String(metadata.order_id || '').toLowerCase();
  const leadId = String(metadata.lead_id || '').toLowerCase();
  const contractVersion = String(metadata.contract_version || '');
  if (contractVersion !== '1' || !UUID_PATTERN.test(orderId) || !UUID_PATTERN.test(leadId)
    || !CHECKOUT_SESSION_PATTERN.test(session.id || '')) {
    throw new Error('Checkout state is missing its stable operational linkage.');
  }
  const transactionId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent && session.payment_intent.id;
  if (transactionId && !PAYMENT_INTENT_PATTERN.test(transactionId)) {
    throw new Error('Checkout state contains an invalid payment linkage.');
  }
  const status = event.type === 'checkout.session.expired' ? 'void' : 'failed';
  const result = await store.recordPaymentState({
    stripe_event_id: event.id,
    event_type: event.type,
    order_id: orderId,
    lead_id: leadId,
    checkout_session_id: session.id,
    transaction_id: transactionId || null,
    status,
    occurred_at: unixIso(event.created)
  });
  return { ignored: Boolean(result && result.ignored), duplicate: Boolean(result && result.duplicate), status };
}

async function processRefund(event, store, deliveryOptions) {
  const refund = event.data && event.data.object;
  if (!refund || refund.object !== 'refund') return { ignored: true, reason: 'invalid_refund' };
  const transactionId = typeof refund.payment_intent === 'string'
    ? refund.payment_intent
    : refund.payment_intent && refund.payment_intent.id;
  if (!REFUND_PATTERN.test(refund.id || '') || !PAYMENT_INTENT_PATTERN.test(transactionId || '')) {
    throw new Error('Refund is missing its stable payment linkage.');
  }
  const currency = String(refund.currency || '').toUpperCase();
  const amount = Number(refund.amount) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || currency !== 'USD') throw new Error('Refund amount is invalid.');
  if (refund.status !== 'succeeded') return { ignored: true, reason: 'refund_not_confirmed' };
  const result = await store.recordRefund({
    stripe_event_id: event.id,
    event_type: event.type,
    refund_id: refund.id,
    transaction_id: transactionId,
    amount,
    currency,
    status: 'succeeded',
    occurred_at: unixIso(refund.created || event.created)
  });
  await deliverOutbox(store, `refund:${refund.id}`, deliveryOptions).catch(() => null);
  return { ignored: false, duplicate: Boolean(result && result.duplicate), refund_id: refund.id };
}

async function processStripeEvent(event, store, deliveryOptions = {}) {
  if (!event || !STRIPE_EVENT_PATTERN.test(event.id || '') || typeof event.type !== 'string') {
    throw new Error('Invalid Stripe event.');
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    return processCheckoutPaid(event, store, deliveryOptions);
  }
  if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
    return processCheckoutPaymentState(event, store);
  }
  if (event.type === 'refund.created' || event.type === 'refund.updated') {
    return processRefund(event, store, deliveryOptions);
  }
  return { ignored: true, reason: 'unsupported_event' };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    sendJson(res, 503, { error: 'Webhook is not configured.' });
    return;
  }
  let payload;
  let event;
  try {
    payload = await rawBody(req);
    const signature = Array.isArray(req.headers['stripe-signature'])
      ? req.headers['stripe-signature'][0]
      : req.headers['stripe-signature'];
    verifyStripeSignature(payload, signature, secret);
    event = JSON.parse(payload.toString('utf8'));
  } catch (_) {
    sendJson(res, 400, { error: 'Invalid webhook.' });
    return;
  }
  try {
    const result = await processStripeEvent(event, createOperationalStore());
    sendJson(res, 200, { received: true, ignored: Boolean(result.ignored), duplicate: Boolean(result.duplicate) });
  } catch (error) {
    const unavailable = error instanceof OperationalStoreError;
    sendJson(res, unavailable ? 503 : 500, { error: 'Webhook processing failed.' });
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
module.exports.verifyStripeSignature = verifyStripeSignature;
module.exports.processStripeEvent = processStripeEvent;
module.exports.SIGNATURE_TOLERANCE_SECONDS = SIGNATURE_TOLERANCE_SECONDS;
