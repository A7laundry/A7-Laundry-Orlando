'use strict';

const crypto = require('node:crypto');
const { sessionFromRequestAsync } = require('./system-auth.js');
const { ACTIVE_ROLES, can } = require('./system-rbac.js');

const MAX_BODY_BYTES = 32_768;

function json(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.status(status).json(body);
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

function allowedOrigin(req, env = process.env) {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (!origin) return true;
  const allowed = new Set(['https://a7laundry.com', 'https://www.a7laundry.com']);
  if (env.VERCEL_URL) allowed.add(`https://${env.VERCEL_URL}`);
  if (env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
    if (/^http:\/\/(?:localhost|127\.0\.0\.1):\d{2,5}$/.test(String(origin))) return true;
  }
  return allowed.has(origin);
}

async function requireSession(req, res, roles = ACTIVE_ROLES, options = {}) {
  const actor = await sessionFromRequestAsync(req, options);
  if (!actor) {
    json(res, 401, { ok: false, code: 'unauthorized', error: 'Sign in required.' });
    return null;
  }
  if (!roles.includes(actor.role)) {
    json(res, 403, { ok: false, code: 'forbidden', error: 'Insufficient role.' });
    return null;
  }
  if (actor.must_change_password && !options.allowPasswordChange) {
    json(res, 403, { ok:false, code:'password_change_required', error:'Change the temporary password first.' });
    return null;
  }
  return actor;
}

async function requireCapability(req, res, capability, options = {}) {
  const actor = await requireSession(req, res, ACTIVE_ROLES, options);
  if (!actor) return null;
  if (!can(actor, capability)) {
    json(res, 403, { ok:false, code:'forbidden', error:'Insufficient role.' });
    return null;
  }
  return actor;
}

function requestKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return crypto.createHash('sha256').update(forwarded || req.socket?.remoteAddress || 'unknown').digest('hex').slice(0, 24);
}

module.exports = { MAX_BODY_BYTES, json, bodyOf, allowedOrigin, requireSession, requireCapability, requestKey };
