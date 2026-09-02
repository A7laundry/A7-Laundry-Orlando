'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const PRODUCTION_ORIGIN = 'https://a7laundry.com';
const MIN_USD_CENTS = 500;
const MAX_USD_CENTS = 200000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cents(value, label = 'Tip') {
  const raw = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new InvalidTransitionError(`${label} is invalid.`);
  const result = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(result) || result < 0) throw new InvalidTransitionError(`${label} is invalid.`);
  return result;
}

function confirmationUrl(env = process.env) {
  const configured = clean(env.A7_PUBLIC_BASE_URL);
  const previewHost = clean(env.VERCEL_URL).replace(/^https?:\/\//, '').split('/')[0].split(':')[0].toLowerCase();
  const preview = env.VERCEL_ENV === 'preview';
  const production = env.VERCEL_ENV === 'production' || (!env.VERCEL_ENV && env.NODE_ENV === 'production');
  const candidate = configured || (preview && previewHost ? `https://${previewHost}` : PRODUCTION_ORIGIN);
  let parsed;
  try { parsed = new URL(candidate); } catch (_) { throw new InvalidTransitionError('The public confirmation origin is invalid.'); }
  const productionHosts = new Set(['a7laundry.com', 'www.a7laundry.com']);
  const allowed = preview
    ? parsed.protocol === 'https:' && Boolean(previewHost) && parsed.hostname === previewHost
    : production
      ? parsed.protocol === 'https:' && productionHosts.has(parsed.hostname)
      : (parsed.protocol === 'https:' && productionHosts.has(parsed.hostname))
        || (parsed.hostname === 'localhost' && ['http:', 'https:'].includes(parsed.protocol));
  if (!allowed || parsed.username || parsed.password) throw new InvalidTransitionError('The public confirmation origin is invalid.');
  return `${parsed.origin}/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}`;
}

async function stripePost(path, params, secretKey, idempotencyKey, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(`${STRIPE_API_BASE}${path}`, {
    method:'POST',
    headers:{ Authorization:`Bearer ${secretKey}`, 'Content-Type':'application/x-www-form-urlencoded',
      Accept:'application/json', 'Idempotency-Key':idempotencyKey },
    body:new URLSearchParams(params).toString()
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.id) throw new Error(payload?.error?.message || 'Stripe rejected the request.');
  return payload;
}

function safeResult(row, duplicate = false) {
  return {
    duplicate:Boolean(duplicate), status:row.status,
    order_number:row.order_number || null,
    invoice_version:Number(row.invoice_version) || 1,
    service_amount:Number(row.service_amount), tip_amount:Number(row.tip_amount),
    total_amount:Number(row.total_amount), currency:'USD',
    url:row.stripe_url || null, payment_link_id:row.stripe_payment_link_id || null
  };
}

function systemPaymentLinkService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const stripeSecretKey = options.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  const fetchImpl = options.fetch || globalThis.fetch;
  const env = options.env || process.env;
  const now = options.now || (() => new Date());

  async function loadByOrder(raw) {
    if (raw.order_id) {
      const id = clean(raw.order_id, 64).toLowerCase();
      if (!UUID.test(id)) throw new InvalidTransitionError('A valid order is required.');
      return store.getOrder(id);
    }
    const orderNumber = normalizeOrderNumber(raw.order_number);
    if (!orderNumber) throw new InvalidTransitionError('Order number is invalid.');
    return store.getSystemPaymentLinkOrder(orderNumber);
  }

  return {
    store,
    async context(raw, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role)) throw new InvalidTransitionError('Payment Link requires financial authorization.');
      const order = await loadByOrder(raw);
      if (!order) return null;
      const current = await store.getSystemPaymentLink(order.id);
      return {
        order_number:order.order_number || null,
        payment_status:order.payment_status,
        service_amount:order.service_amount == null ? null : Number(order.service_amount),
        currency:order.currency || null,
        can_create:Boolean(order.current_invoice_id || order.invoice_id)
          && ['invoice_created', 'failed', 'void'].includes(order.payment_status)
          && (!current || current.status === 'creating'),
        current:current ? safeResult(current, true) : null
      };
    },
    async create(raw, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role) || !clean(actor.actor_id, 160)) {
        throw new InvalidTransitionError('Payment Link requires financial authorization.');
      }
      if (!stripeSecretKey) throw new InvalidTransitionError('Stripe link generation is not configured.');
      const order = await loadByOrder(raw);
      if (!order || (raw.lead_id && order.lead_id !== clean(raw.lead_id, 64).toLowerCase())) {
        throw new InvalidTransitionError('The payable order was not found.');
      }
      if (order.order_status !== 'invoice_created' || !order.invoice_id
        || !['invoice_created', 'failed', 'void'].includes(order.payment_status)
        || String(order.currency || '').toUpperCase() !== 'USD') {
        throw new InvalidTransitionError('The order is not ready for payment.');
      }
      const serviceCents = Math.round(Number(order.service_amount) * 100);
      const tipCents = cents(raw.tip_amount ?? '0');
      const totalCents = serviceCents + tipCents;
      if (!Number.isSafeInteger(serviceCents) || serviceCents <= 0
        || totalCents < MIN_USD_CENTS || totalCents > MAX_USD_CENTS) {
        throw new InvalidTransitionError('The approved payment total is outside the payable range.');
      }
      const fingerprint = crypto.createHash('sha256')
        .update(`${order.id}|${order.invoice_id}|${serviceCents}|${tipCents}|USD`).digest('hex');
      const reservation = await store.reserveSystemPaymentLink({
        order_id:order.id, lead_id:order.lead_id, invoice_id:order.current_invoice_id || order.invoice_id,
        service_amount:serviceCents / 100, tip_amount:tipCents / 100, total_amount:totalCents / 100,
        request_fingerprint:fingerprint, actor_id:actor.actor_id, actor_role:actor.role,
        idempotency_key:`payment-link:${fingerprint}`, occurred_at:now().toISOString()
      });
      const attempt = reservation.payment_link || reservation;
      if (attempt.status === 'active' && attempt.stripe_url) return safeResult(attempt, true);
      const attemptId = attempt.payment_link_attempt_id || attempt.id;
      const stripeKey = `a7-${fingerprint}`;
      try {
        const servicePrice = await stripePost('/prices', {
          unit_amount:String(serviceCents), currency:'usd', 'product_data[name]':'A7 Laundry — service'
        }, stripeSecretKey, `${stripeKey}-service`, fetchImpl);
        let tipPrice = null;
        if (tipCents > 0) {
          tipPrice = await stripePost('/prices', {
            unit_amount:String(tipCents), currency:'usd', 'product_data[name]':'A7 Laundry — tip'
          }, stripeSecretKey, `${stripeKey}-tip`, fetchImpl);
        }
        const params = {
          'line_items[0][price]':servicePrice.id, 'line_items[0][quantity]':'1',
          'after_completion[type]':'redirect', 'after_completion[redirect][url]':confirmationUrl(env),
          'restrictions[completed_sessions][limit]':'1',
          'metadata[order_id]':order.id, 'metadata[lead_id]':order.lead_id,
          'metadata[contract_version]':'1',
          'payment_intent_data[metadata][order_id]':order.id,
          'payment_intent_data[metadata][lead_id]':order.lead_id,
          'payment_intent_data[metadata][contract_version]':'1'
        };
        if (tipPrice) {
          params['line_items[1][price]'] = tipPrice.id;
          params['line_items[1][quantity]'] = '1';
        }
        const link = await stripePost('/payment_links', params, stripeSecretKey, `${stripeKey}-link`, fetchImpl);
        const finalized = await store.activateSystemPaymentLink({
          payment_link_attempt_id:attemptId, stripe_service_price_id:servicePrice.id,
          stripe_tip_price_id:tipPrice?.id || null, stripe_payment_link_id:link.id,
          stripe_url:link.url, occurred_at:now().toISOString()
        });
        return safeResult(finalized.payment_link || finalized, Boolean(reservation.duplicate));
      } catch (error) {
        await store.failSystemPaymentLink({ payment_link_attempt_id:attemptId,
          error_code:'stripe_create_failed', occurred_at:now().toISOString() }).catch(() => null);
        throw error;
      }
    }
  };
}

module.exports = { systemPaymentLinkService, confirmationUrl, stripePost, clean, cents,
  MIN_USD_CENTS, MAX_USD_CENTS, UUID };
