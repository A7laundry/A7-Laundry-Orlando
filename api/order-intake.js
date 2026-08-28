'use strict';

const crypto = require('node:crypto');
const { service, safeAnalyticsContext } = require('../lib/operational-lifecycle.js');
const {
  createOperationalStore,
  OperationalStoreError,
  InvalidTransitionError
} = require('../lib/operational-store.js');

const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SERVICE_TYPES = new Set(['wash_fold_guest']);
const ACCOMMODATION_TYPES = new Set(['hotel', 'resort', 'vacation_rental', 'residence', 'other']);
const LANGUAGES = new Set(['en', 'pt', 'es', 'other']);
const buckets = new Map();

function send(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
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

function allowedOrigin(req) {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (!origin) return true;
  const allowed = new Set(['https://a7laundry.com', 'https://www.a7laundry.com']);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }
  return allowed.has(origin);
}

function requestKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const address = forwarded || req.socket?.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(address).digest('hex').slice(0, 20);
}

function rateLimited(req, now = Date.now()) {
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) if (now - bucket.started_at >= RATE_WINDOW_MS) buckets.delete(key);
  }
  const key = requestKey(req);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.started_at >= RATE_WINDOW_MS) {
    buckets.set(key, { started_at: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function isoFuture(value, label, options = {}) {
  const time = Date.parse(value || '');
  const now = Date.now();
  const max = now + (options.maxDays || 60) * 86_400_000;
  if (!Number.isFinite(time) || time < now - 15 * 60_000 || time > max) {
    throw new InvalidTransitionError(`${label} is invalid.`);
  }
  return new Date(time).toISOString();
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) throw new InvalidTransitionError('A valid WhatsApp number is required.');
  return digits;
}

function validated(payload) {
  if (!UUID_PATTERN.test(payload.submission_id || '')) throw new InvalidTransitionError('submission_id is invalid.');
  if (clean(payload.website, 200)) return { trapped: true };
  const serviceType = clean(payload.service_type, 80);
  const accommodationType = clean(payload.accommodation_type, 40);
  const language = clean(payload.language, 12) || 'en';
  if (!SERVICE_TYPES.has(serviceType)) throw new InvalidTransitionError('Unsupported service type.');
  if (!ACCOMMODATION_TYPES.has(accommodationType)) throw new InvalidTransitionError('Accommodation type is required.');
  if (!LANGUAGES.has(language)) throw new InvalidTransitionError('Unsupported language.');
  if (payload.minimum_acknowledged !== true || payload.privacy_consent !== true) {
    throw new InvalidTransitionError('Required acknowledgements are missing.');
  }
  const pickupStart = isoFuture(payload.pickup_window_start, 'Pickup window');
  const pickupEnd = isoFuture(payload.pickup_window_end, 'Pickup window');
  const neededBy = isoFuture(payload.needed_by, 'Needed-by time');
  if (Date.parse(pickupEnd) <= Date.parse(pickupStart) || Date.parse(neededBy) <= Date.parse(pickupStart)) {
    throw new InvalidTransitionError('Pickup and needed-by timing are inconsistent.');
  }
  const estimated = payload.estimated_lbs === '' || payload.estimated_lbs == null ? null : Number(payload.estimated_lbs);
  if (estimated !== null && (!Number.isFinite(estimated) || estimated <= 0 || estimated > 500)) {
    throw new InvalidTransitionError('Estimated load is invalid.');
  }
  const name = clean(payload.name, 100);
  const property = clean(payload.property, 180);
  const address = clean(payload.pickup_address, 300);
  if (!name || !property || !address) throw new InvalidTransitionError('Name, property and pickup address are required.');
  return {
    trapped: false,
    submission_id: payload.submission_id.toLowerCase(),
    service_type: serviceType,
    accommodation_type: accommodationType,
    language,
    name,
    phone: normalizePhone(payload.whatsapp_number),
    property,
    pickup_address: address,
    handoff_notes: clean(payload.handoff_notes, 500) || null,
    pickup_window_start: pickupStart,
    pickup_window_end: pickupEnd,
    needed_by: neededBy,
    estimated_lbs: estimated,
    service_tier_preference: clean(payload.service_tier_preference, 20) || 'standard',
    attribution_id: clean(payload.attribution_id, 64) || null,
    lead_reference: clean(payload.lead_reference, 10).toUpperCase() || null,
    analytics_context: safeAnalyticsContext(payload.analytics_context)
  };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed.', code: 'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return send(res, 403, { error: 'Origin not allowed.', code: 'origin_not_allowed' });
  if (rateLimited(req)) return send(res, 429, { error: 'Too many requests. Please try again shortly.', code: 'rate_limited' });
  const rawLength = Number(req.headers['content-length'] || 0);
  if (rawLength > MAX_BODY_BYTES) return send(res, 413, { error: 'Request is too large.', code: 'payload_too_large' });
  const body = bodyOf(req);
  if (!body) return send(res, 400, { error: 'Invalid request.', code: 'invalid_body' });

  try {
    const input = validated(body);
    if (input.trapped) return send(res, 202, { ok: true, received: true });
    const operationalStore = createOperationalStore();
    const customer = await operationalStore.upsertCustomer({ wa_id: input.phone, profile_name: input.name });
    const lifecycle = service({ operationalStore });
    const result = await lifecycle.createLead({
      idempotency_key: `order-form:${input.submission_id}`,
      lead_origin: 'order_form',
      customer_id: customer.id,
      attribution_id: input.attribution_id,
      lead_reference: input.lead_reference,
      service_type: input.service_type,
      customer_type: 'guest',
      language: input.language,
      accommodation_type: input.accommodation_type,
      service_area_bucket: 'pending_qualification',
      operational_data: {
        name: input.name,
        whatsapp_number: input.phone,
        property: input.property,
        pickup_address: input.pickup_address,
        handoff_notes: input.handoff_notes,
        pickup_window_start: input.pickup_window_start,
        pickup_window_end: input.pickup_window_end,
        needed_by: input.needed_by,
        estimated_lbs: input.estimated_lbs,
        service_tier_preference: input.service_tier_preference,
        privacy_consent: true,
        minimum_acknowledged: true,
        analytics_context: input.analytics_context
      }
    });
    return send(res, result.created ? 201 : 200, {
      ok: true,
      created: Boolean(result.created),
      lead_id: result.lead.id,
      lead_reference: result.lead.lead_reference || null,
      status: result.lead.status
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return send(res, 400, { error: error.message, code: error.code });
    }
    if (error instanceof OperationalStoreError) {
      return send(res, 503, { error: 'Request intake is temporarily unavailable.', code: 'storage_unavailable' });
    }
    console.error('order_intake_failed', { name: error?.name || 'Error' });
    return send(res, 500, { error: 'Request intake failed.', code: 'unexpected_error' });
  }
}

module.exports = handler;
module.exports.validated = validated;
module.exports.allowedOrigin = allowedOrigin;
module.exports.rateLimited = rateLimited;
module.exports.normalizePhone = normalizePhone;
