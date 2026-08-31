'use strict';

const crypto = require('node:crypto');
const attribution = require('../../a7-attribution.js');
const {
  createAttributionStore,
  ShortRefCollisionError,
  expirationFrom
} = require('../../lib/attribution-store.js');
const { recordMetrics, safeLog } = require('../../lib/attribution-observability.js');

const MAX_BODY_BYTES = 8192;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const MAX_ID_ATTEMPTS = 5;
const rateBuckets = new Map();

function send(res, status, body) {
  res.status(status).json(body);
}

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') {
    try { return Buffer.byteLength(JSON.stringify(req.body)) <= MAX_BODY_BYTES ? req.body : null; } catch (_) { return null; }
  }
  if (typeof req.body === 'string' && Buffer.byteLength(req.body) <= MAX_BODY_BYTES) {
    try { return JSON.parse(req.body); } catch (_) { return null; }
  }
  return null;
}

function requestKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const address = forwarded || req.socket && req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(address).digest('hex').slice(0, 16);
}

function rateLimited(req, now = Date.now()) {
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) if (now - value.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  const key = requestKey(req);
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const allowed = new Set(['https://a7laundry.com', 'https://www.a7laundry.com']);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }
  return allowed.has(origin);
}

function validTimestamp(value) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return new Date().toISOString();
  const now = Date.now();
  if (time > now + 5 * 60_000 || time < now - 365 * 24 * 60 * 60 * 1000) return new Date().toISOString();
  return new Date(time).toISOString();
}

function cleanTouch(input) {
  if (!input || typeof input !== 'object') return null;
  const params = new URLSearchParams();
  for (const key of attribution.UTM_KEYS) {
    const shortKey = key.replace('utm_', '');
    if (typeof input[shortKey] === 'string') params.set(key, input[shortKey]);
  }
  const clickIds = input.click_ids || {};
  for (const key of attribution.CLICK_KEYS) if (typeof clickIds[key] === 'string') params.set(key, clickIds[key]);
  if (typeof input.fbclid === 'string') params.set('fbclid', input.fbclid);
  const landing = typeof input.landing_page === 'string' && input.landing_page.startsWith('/') ? input.landing_page.slice(0, 500) : '/';
  const referrer = typeof input.referrer_host === 'string' && input.referrer_host
    ? `https://${input.referrer_host.slice(0, 120)}/`
    : '';
  return attribution.captureTouch({
    url: `https://a7laundry.com${landing}${params.size ? `?${params}` : ''}`,
    referrer,
    initial: input.entry_type === 'direct',
    timestamp: validTimestamp(input.timestamp)
  });
}

function publicTouch(touch) {
  if (!touch) return null;
  return {
    entry_type: touch.entry_type,
    source: touch.source,
    medium: touch.medium,
    landing_page: touch.landing_page,
    timestamp: touch.timestamp
  };
}

function consentState(payload) {
  const value = payload?.consent?.attribution_storage || payload?.consent?.durable_storage;
  return value === 'granted' || value === 'denied' ? value : 'unknown';
}

function cookieAttributionId(req) {
  const match = String(req.headers.cookie || '').match(/(?:^|;\s*)a7_attribution_id=(at_[a-f0-9]{32})(?:;|$)/);
  return match ? match[1] : '';
}

function touchFingerprint(attributionId, touch, touchKey) {
  const canonical = /^tk_[a-f0-9]{32}$/.test(touchKey || '')
    ? touchKey
    : JSON.stringify([
      touch.entry_type, touch.source, touch.medium, touch.campaign, touch.term, touch.content,
      touch.referrer_host, touch.landing_page, touch.timestamp,
      touch.click_ids?.gclid || '', touch.click_ids?.gbraid || '', touch.click_ids?.wbraid || ''
    ]);
  return crypto.createHash('sha256').update(`${attributionId}|${canonical}`).digest('hex');
}

function newIds() {
  return {
    attribution_id: attribution.generateAttributionId(crypto.webcrypto),
    short_ref: attribution.generateShortRef(crypto.webcrypto)
  };
}

async function handler(req, res) {
  const startedAt = Date.now();
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed.' });
  }
  if (!allowedOrigin(req)) return send(res, 403, { error: 'Origin not allowed.' });

  const store = createAttributionStore();
  if (rateLimited(req)) {
    await recordMetrics(store, ['attribution_api_requests', 'attribution_api_rate_limited']);
    safeLog('warn', 'api_rate_limited', { status: 429, storage_mode: store.mode });
    return send(res, 429, { error: 'Too many requests.' });
  }

  const rawLength = Number(req.headers['content-length'] || 0);
  if (rawLength > MAX_BODY_BYTES) return send(res, 413, { error: 'Payload too large.' });
  const payload = bodyOf(req);
  if (!payload || payload.version !== attribution.VERSION) return send(res, 400, { error: 'Invalid attribution payload.' });
  const touch = cleanTouch(payload.touch);
  if (!touch) return send(res, 400, { error: 'Invalid touch.' });

  const requestedFromCookie = cookieAttributionId(req);
  const requestedFromBody = attribution.validAttributionId(payload.attribution_id) ? payload.attribution_id : '';
  const requestedId = requestedFromCookie || requestedFromBody;
  const requestedRef = attribution.validShortRef(payload.short_ref) ? payload.short_ref.toUpperCase() : '';
  const consent = consentState(payload);

  try {
    const existing = requestedId ? await store.get(requestedId) : null;
    const migrationCandidate = !existing && requestedId && requestedRef && payload.cached_first_touch;
    let ids = existing
      ? { attribution_id: existing.attribution_id, short_ref: existing.short_ref }
      : migrationCandidate
        ? { attribution_id: requestedId, short_ref: requestedRef }
        : newIds();
    let record = null;
    let collisionRetries = 0;

    for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
      const selectedTouch = migrationCandidate && !attribution.isExternalTouch(touch)
        ? cleanTouch(payload.cached_first_touch) || touch
        : touch;
      try {
        record = await store.upsertSession({
          attribution_id: ids.attribution_id,
          short_ref: ids.short_ref,
          touch: selectedTouch,
          touch_fingerprint: touchFingerprint(ids.attribution_id, selectedTouch, payload.touch_key),
          consent_state: consent,
          expires_at: expirationFrom()
        });
        if (migrationCandidate && selectedTouch !== touch) {
          record = await store.upsertSession({
            attribution_id: ids.attribution_id,
            short_ref: ids.short_ref,
            touch,
            touch_fingerprint: touchFingerprint(ids.attribution_id, touch, payload.touch_key),
            consent_state: consent,
            expires_at: expirationFrom()
          });
        }
        break;
      } catch (error) {
        if (!(error instanceof ShortRefCollisionError) || existing) throw error;
        collisionRetries += 1;
        ids = newIds();
      }
    }
    if (!record) throw new Error('Attribution reference allocation exhausted.');

    const restored = Boolean(existing || migrationCandidate);
    const metrics = [
      'attribution_api_requests', 'attribution_api_success',
      restored ? 'attribution_restored' : 'attribution_created',
      restored ? 'attribution_durable_resolved' : 'short_ref_generated'
    ];
    if (collisionRetries) metrics.push('short_ref_collision_retry');
    const latency = Date.now() - startedAt;
    await recordMetrics(store, metrics, latency);

    if (consent === 'granted') {
      res.setHeader('Set-Cookie', `a7_attribution_id=${record.attribution_id}; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax`);
    } else if (consent === 'denied' && requestedFromCookie) {
      res.setHeader('Set-Cookie', 'a7_attribution_id=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
    }

    safeLog('info', 'api_success', { status: 200, latency_ms: latency, storage_mode: store.mode });
    return send(res, 200, {
      version: attribution.VERSION,
      attribution_id: record.attribution_id,
      short_ref: record.short_ref,
      first_touch: publicTouch(record.first_touch),
      last_touch: publicTouch(record.last_touch),
      click_id_present: attribution.clickIdPresence(record.last_touch),
      restored,
      storage_mode: store.mode
    });
  } catch (error) {
    const latency = Date.now() - startedAt;
    await recordMetrics(store, ['attribution_api_requests', 'attribution_api_failure'], latency);
    safeLog('error', 'api_failure', {
      status: 503,
      latency_ms: latency,
      storage_mode: store.mode,
      reason: error?.code || 'operation_failed'
    });
    return send(res, 503, { error: 'Attribution temporarily unavailable.' });
  }
}

module.exports = handler;
module.exports.cleanTouch = cleanTouch;
module.exports.allowedOrigin = allowedOrigin;
module.exports.rateLimited = rateLimited;
module.exports.consentState = consentState;
module.exports.cookieAttributionId = cookieAttributionId;
module.exports.touchFingerprint = touchFingerprint;
