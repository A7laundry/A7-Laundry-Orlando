'use strict';

const { waitUntil } = require('@vercel/functions');
const {
  env,
  unitKey,
  verifyWebhookSignature,
  readRawBody,
  normalizeWebhook,
  ingestNormalized
} = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST'])) return;

  if (req.method === 'GET') {
    const valid = req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === env('WHATSAPP_VERIFY_TOKEN');
    if (!valid) return json(res, 403, { error: 'Webhook verification failed.', code: 'verification_failed' });
    res.status(200).send(req.query['hub.challenge']);
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = Array.isArray(req.headers['x-hub-signature-256'])
      ? req.headers['x-hub-signature-256'][0]
      : req.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(rawBody, signature, env('WHATSAPP_APP_SECRET'))) {
      return json(res, 403, { error: 'Invalid webhook signature.', code: 'invalid_signature' });
    }
    const body = JSON.parse(rawBody.toString('utf8'));
    const normalized = normalizeWebhook(body, { unitKey: unitKey() });
    waitUntil(ingestNormalized(normalized).catch((error) => {
      console.error('whatsapp_webhook_processing_failed', { code: error?.code || 'unknown' });
    }));
    json(res, 200, { received: true });
  } catch (error) {
    fail(res, error);
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
