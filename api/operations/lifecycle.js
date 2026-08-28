'use strict';

const crypto = require('node:crypto');
const { service } = require('../../lib/operational-lifecycle.js');
const { createOperationalStore } = require('../../lib/operational-store.js');
const { retryOutbox } = require('../../lib/ga4-server.js');
const {
  OperationalStoreError,
  InvalidTransitionError
} = require('../../lib/operational-store.js');

const MAX_BODY_BYTES = 32_768;
const ACTIONS = new Set([
  'create_lead', 'update_lead_status', 'qualify_lead', 'accept_order',
  'record_transition', 'retry_analytics'
]);

function json(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}

function safeEqual(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !provided || !expected) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearer(req) {
  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0] : req.headers.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  const header = req.headers['x-a7-token'];
  return Array.isArray(header) ? header[0] : header;
}

function bodyOf(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    try { return Buffer.byteLength(JSON.stringify(req.body)) <= MAX_BODY_BYTES ? req.body : null; } catch (_) { return null; }
  }
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    const raw = String(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }
  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.', code: 'method_not_allowed' });
  }
  const expectedToken = process.env.OPERATIONS_API_TOKEN;
  if (!expectedToken) return json(res, 503, { error: 'Operations API is not configured.', code: 'not_configured' });
  if (!safeEqual(bearer(req), expectedToken)) return json(res, 401, { error: 'Unauthorized.', code: 'unauthorized' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { error: 'Invalid request body.', code: 'invalid_body' });
  const action = String(body.action || '');
  if (!ACTIONS.has(action)) return json(res, 400, { error: 'Unsupported action.', code: 'unsupported_action' });

  try {
    if (action === 'retry_analytics') {
      const limit = Math.max(1, Math.min(Number(body.limit) || 25, 100));
      const result = await retryOutbox(createOperationalStore(), { limit });
      return json(res, 200, { ok: true, action, result });
    }
    const lifecycle = service();
    const result = action === 'create_lead' ? await lifecycle.createLead(body)
      : action === 'update_lead_status' ? await lifecycle.updateLeadStatus(body)
        : action === 'qualify_lead' ? await lifecycle.qualifyLead(body)
          : action === 'accept_order' ? await lifecycle.acceptOrder(body)
            : await lifecycle.recordTransition(body);
    return json(res, 200, { ok: true, action, result });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { error: error.message, code: error.code });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { error: 'Operational storage failed.', code: error.code });
    }
    console.error('operations_lifecycle_failed', { name: error?.name || 'Error' });
    return json(res, 500, { error: 'Unexpected operations failure.', code: 'unexpected_error' });
  }
}

module.exports = handler;
module.exports.safeEqual = safeEqual;
module.exports.bodyOf = bodyOf;
module.exports.ACTIONS = ACTIONS;
