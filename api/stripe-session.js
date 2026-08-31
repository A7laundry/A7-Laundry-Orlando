'use strict';

const {
  createOperationalStore,
  OperationalStoreError
} = require('../lib/operational-store');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const CHECKOUT_SESSION_PATTERN = /^cs_(?:live|test)_[A-Za-z0-9]+$/;
const PAYMENT_INTENT_PATTERN = /^pi_[A-Za-z0-9_]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

function cleanText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 120) : fallback;
}

function sanitizeSession(session, reconciliationStatus) {
  const amountInCents = Number(session.amount_total);
  const amountTotal = Number.isFinite(amountInCents) && amountInCents > 0
    ? amountInCents / 100
    : null;
  const firstLineItem = session.line_items
    && Array.isArray(session.line_items.data)
    && session.line_items.data[0];
  const paymentLink = typeof session.payment_link === 'string'
    ? session.payment_link
    : session.payment_link && typeof session.payment_link.id === 'string'
      ? session.payment_link.id
      : null;

  return {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    currency: cleanText(session.currency, 'usd').toUpperCase(),
    amount_total: amountTotal,
    service: cleanText(firstLineItem && firstLineItem.description, 'A7 Guest Laundry'),
    payment_link_id: paymentLink,
    reconciliation_status: reconciliationStatus
  };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id.trim() : '';
  if (!CHECKOUT_SESSION_PATTERN.test(sessionId) || sessionId.length > 255) {
    sendJson(res, 400, { error: 'Invalid checkout confirmation.' });
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    sendJson(res, 503, { error: 'Payment verification is temporarily unavailable.' });
    return;
  }

  let stripeResponse;
  try {
    const endpoint = `${STRIPE_API_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}?expand%5B%5D=line_items`;
    stripeResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        Accept: 'application/json'
      }
    });
  } catch (_) {
    sendJson(res, 502, { error: 'Stripe could not be reached. Please try again.' });
    return;
  }

  if (!stripeResponse.ok) {
    const statusCode = stripeResponse.status === 404 ? 404 : 502;
    sendJson(res, statusCode, { error: 'Checkout confirmation was not found.' });
    return;
  }

  let session;
  try {
    session = await stripeResponse.json();
  } catch (_) {
    sendJson(res, 502, { error: 'Stripe returned an invalid confirmation.' });
    return;
  }

  if (
    !session
    || session.id !== sessionId
    || session.payment_status !== 'paid'
    || session.status !== 'complete'
  ) {
    sendJson(res, 409, { error: 'Payment is not confirmed yet.' });
    return;
  }

  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};
  const orderId = String(metadata.order_id || '').toLowerCase();
  const leadId = String(metadata.lead_id || '').toLowerCase();
  const transactionId = typeof session.payment_intent === 'string'
    ? session.payment_intent : session.payment_intent?.id;
  const amount = Number(session.amount_total) / 100;
  const currency = String(session.currency || '').toUpperCase();
  if (String(metadata.contract_version || '') !== '1' || !UUID_PATTERN.test(orderId)
    || !UUID_PATTERN.test(leadId) || !PAYMENT_INTENT_PATTERN.test(transactionId || '')
    || !Number.isFinite(amount) || amount <= 0 || currency !== 'USD') {
    sendJson(res, 409, { error: 'Checkout is not linked to a valid A7 order.' });
    return;
  }

  try {
    const order = await createOperationalStore().getOrder(orderId);
    if (!order || order.lead_id !== leadId || !order.invoice_id
      || Number(order.service_amount) !== amount || String(order.currency || '').toUpperCase() !== 'USD') {
      sendJson(res, 409, { error: 'Checkout does not match the accepted A7 order.' });
      return;
    }
    const reconciled = order.payment_id === transactionId
      && ['paid', 'partially_refunded', 'refunded'].includes(order.payment_status);
    sendJson(res, reconciled ? 200 : 202, sanitizeSession(session, reconciled ? 'reconciled' : 'pending'));
  } catch (error) {
    const status = error instanceof OperationalStoreError ? 503 : 500;
    sendJson(res, status, { error: status === 503
      ? 'Order reconciliation is temporarily unavailable.'
      : 'Order reconciliation failed.' });
  }
}

module.exports = handler;
module.exports.sanitizeSession = sanitizeSession;
module.exports.CHECKOUT_SESSION_PATTERN = CHECKOUT_SESSION_PATTERN;
module.exports.PAYMENT_INTENT_PATTERN = PAYMENT_INTENT_PATTERN;
module.exports.UUID_PATTERN = UUID_PATTERN;
