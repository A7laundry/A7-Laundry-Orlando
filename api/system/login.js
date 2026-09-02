'use strict';

const { authenticateHybrid, signSession, sessionCookie } = require('../../lib/system-auth.js');
const { json, bodyOf, allowedOrigin, requestKey } = require('../../lib/system-http.js');

const attempts = new Map();
const WINDOW_MS = 15 * 60_000;
const LIMIT = 8;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok: false, code: 'origin_not_allowed' });
  const key = requestKey(req);
  const now = Date.now();
  const bucket = attempts.get(key);
  if (bucket && now - bucket.started_at < WINDOW_MS && bucket.count >= LIMIT) {
    return json(res, 429, { ok: false, code: 'rate_limited', error: 'Try again later.' });
  }
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok: false, code: 'invalid_body' });
  const actor = await authenticateHybrid(body.email, body.password);
  if (!actor) {
    const current = bucket && now - bucket.started_at < WINDOW_MS ? bucket : { started_at: now, count: 0 };
    current.count += 1;
    attempts.set(key, current);
    return json(res, 401, { ok: false, code: 'invalid_credentials', error: 'Invalid email or password.' });
  }
  attempts.delete(key);
  res.setHeader('Set-Cookie', sessionCookie(signSession(actor)));
  return json(res, 200, { ok:true, user:{ display_name:actor.display_name, role:actor.role,
    must_change_password:Boolean(actor.must_change_password) } });
};

module.exports.attempts = attempts;
