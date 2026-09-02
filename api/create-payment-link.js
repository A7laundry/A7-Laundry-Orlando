'use strict';

/**
 * Cria um Stripe Payment Link já configurado com o redirect de confirmação.
 *
 * Existe para eliminar o trabalho manual de, a cada cotação, criar o link no
 * Dashboard e colar a URL de confirmação com {CHECKOUT_SESSION_ID}. Esquecer esse
 * parâmetro faz a página de confirmação falhar, e o cliente que acabou de pagar vê
 * uma tela de erro.
 */

const crypto = require('node:crypto');
const {
  createOperationalStore,
  OperationalStoreError,
  InvalidTransitionError
} = require('../lib/operational-store');
const { systemPaymentLinkService, confirmationUrl } = require('../lib/system-payment-link-service.js');

const PRODUCTION_ORIGIN = 'https://a7laundry.com';

// Faixa defensiva: abaixo disso é engano de digitação, acima é pedido que merece
// conferência humana antes de virar cobrança.
const MIN_USD = 5;
const MAX_USD = 2000;
const MAX_BODY_BYTES = 16_384;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

/**
 * Remove caracteres de controle sem usar regex com literais de controle — escrevê-los
 * no source já corrompeu este arquivo uma vez, virando um range de espaço a hífen que
 * apagava "$", "&" e "," das descrições.
 */
function cleanText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0);
    out += code < 32 || code === 127 ? ' ' : char;
  }
  const cleaned = out.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 120) : fallback;
}

/** Comparação de tamanho fixo — evita distinguir tokens pelo tempo de resposta. */
function tokenMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/** O Vercel parseia JSON automaticamente, mas não quando o Content-Type vem ausente. */
function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    try { return Buffer.byteLength(JSON.stringify(req.body)) <= MAX_BODY_BYTES ? req.body : null; } catch (_) { return null; }
  }
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = String(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  return null;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const expectedToken = process.env.PAYMENT_LINK_TOKEN;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!expectedToken || !stripeSecretKey) {
    sendJson(res, 503, { error: 'Link generation is not configured.' });
    return;
  }

  const headerToken = req.headers['x-a7-token'];
  const providedToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  if (!tokenMatches(providedToken, expectedToken)) {
    sendJson(res, 401, { error: 'Unauthorized.' });
    return;
  }

  const body = readBody(req);
  if (!body) {
    sendJson(res, 400, { error: 'Invalid request body.' });
    return;
  }
  // Nome canônico: texto livre de operador não entra em objetos do Stripe.
  const description = 'A7 Laundry — pickup & delivery';
  const orderId = cleanText(body.order_id, '').toLowerCase();
  const leadId = cleanText(body.lead_id, '').toLowerCase();
  if (!UUID_PATTERN.test(orderId) || !UUID_PATTERN.test(leadId)) {
    sendJson(res, 400, { error: 'A valid order_id and lead_id are required.' });
    return;
  }

  try {
    const operations = createOperationalStore();
    const result = await systemPaymentLinkService({ operationalStore:operations, stripeSecretKey }).create({
      order_id:orderId, lead_id:leadId, tip_amount:body.tip_amount ?? '0'
    }, { actor_id:'integration:payment-link', role:'owner' });

    sendJson(res, 200, {
      url:result.url,
      amount_usd:result.total_amount,
      service_amount:result.service_amount,
      tip_amount:result.tip_amount,
      description,
      payment_link_id:result.payment_link_id,
      order_id: orderId
    });
  } catch (error) {
    const status = error instanceof InvalidTransitionError ? 409
      : error instanceof OperationalStoreError ? 503 : 502;
    sendJson(res, status, { error: error.message || 'Could not create the payment link.' });
  }
}

module.exports = handler;
module.exports.MIN_USD = MIN_USD;
module.exports.MAX_USD = MAX_USD;
module.exports.PRODUCTION_ORIGIN = PRODUCTION_ORIGIN;
module.exports.confirmationUrl = confirmationUrl;
module.exports.UUID_PATTERN = UUID_PATTERN;
module.exports.tokenMatches = tokenMatches;
module.exports.cleanText = cleanText;
