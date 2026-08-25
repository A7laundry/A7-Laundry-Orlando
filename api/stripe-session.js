'use strict';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const CHECKOUT_SESSION_PATTERN = /^cs_(?:live|test)_[A-Za-z0-9]+$/;
const A7_REFERENCE_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/i;

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

function cleanText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 120) : fallback;
}

function sanitizeSession(session) {
  const amountInCents = Number(session.amount_total);
  const amountTotal = Number.isFinite(amountInCents) && amountInCents >= 0
    ? amountInCents / 100
    : 0;
  const firstLineItem = session.line_items
    && Array.isArray(session.line_items.data)
    && session.line_items.data[0];
  const paymentLink = typeof session.payment_link === 'string'
    ? session.payment_link
    : session.payment_link && typeof session.payment_link.id === 'string'
      ? session.payment_link.id
      : null;
  const metadataReference = cleanText(session.metadata && session.metadata.a7_reference, '').toUpperCase();

  return {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    currency: cleanText(session.currency, 'usd').toUpperCase(),
    amount_total: amountTotal,
    service: cleanText(firstLineItem && firstLineItem.description, 'A7 Guest Laundry'),
    payment_link_id: paymentLink,
    a7_reference: A7_REFERENCE_PATTERN.test(metadataReference) ? metadataReference : null
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

  sendJson(res, 200, sanitizeSession(session));
}

module.exports = handler;
module.exports.sanitizeSession = sanitizeSession;
module.exports.CHECKOUT_SESSION_PATTERN = CHECKOUT_SESSION_PATTERN;
module.exports.A7_REFERENCE_PATTERN = A7_REFERENCE_PATTERN;
