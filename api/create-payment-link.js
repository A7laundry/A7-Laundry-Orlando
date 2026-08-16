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

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const CONFIRMATION_URL =
  'https://a7laundry.com/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}';

// Faixa defensiva: abaixo disso é engano de digitação, acima é pedido que merece
// conferência humana antes de virar cobrança.
const MIN_USD = 5;
const MAX_USD = 2000;

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
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return {};
}

async function stripePost(path, params, secretKey) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: new URLSearchParams(params).toString()
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !payload.id) {
    const reason = payload && payload.error && payload.error.message;
    throw new Error(reason || 'Stripe rejected the request.');
  }
  return payload;
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

  const amountUsd = Number(body.amount_usd);
  if (!Number.isFinite(amountUsd) || amountUsd < MIN_USD || amountUsd > MAX_USD) {
    sendJson(res, 400, { error: `Amount must be between $${MIN_USD} and $${MAX_USD}.` });
    return;
  }

  // Centavos inteiros: evita que 82.999 vire cobrança com fração perdida.
  const unitAmount = Math.round(amountUsd * 100);
  const description = cleanText(body.description, 'A7 Laundry — pickup & delivery');
  const reference = cleanText(body.reference, '');

  try {
    const price = await stripePost(
      '/prices',
      {
        unit_amount: String(unitAmount),
        currency: 'usd',
        'product_data[name]': description
      },
      stripeSecretKey
    );

    const linkParams = {
      'line_items[0][price]': price.id,
      'line_items[0][quantity]': '1',
      'after_completion[type]': 'redirect',
      'after_completion[redirect][url]': CONFIRMATION_URL,
      // Um link por cotação: impede que a mesma URL seja paga repetidamente.
      'restrictions[completed_sessions][limit]': '1'
    };
    if (reference) linkParams['metadata[a7_reference]'] = reference;

    const link = await stripePost('/payment_links', linkParams, stripeSecretKey);

    sendJson(res, 200, {
      url: link.url,
      amount_usd: unitAmount / 100,
      description,
      payment_link_id: link.id
    });
  } catch (error) {
    sendJson(res, 502, { error: error.message || 'Could not create the payment link.' });
  }
}

module.exports = handler;
module.exports.MIN_USD = MIN_USD;
module.exports.MAX_USD = MAX_USD;
module.exports.CONFIRMATION_URL = CONFIRMATION_URL;
module.exports.tokenMatches = tokenMatches;
module.exports.cleanText = cleanText;
