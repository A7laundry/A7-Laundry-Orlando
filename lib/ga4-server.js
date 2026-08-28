'use strict';

const ALLOWED_EVENTS = new Set(['order_accepted', 'purchase', 'refund']);
const MAX_BACKDATE_MS = 72 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const COMMON_KEYS = new Set([
  'event_id', 'lead_id', 'order_id', 'service_type', 'customer_type',
  'service_area_bucket', 'is_repeat_customer', 'attribution_confidence'
]);
const FINANCIAL_KEYS = new Set(['transaction_id', 'value', 'currency', 'items']);

function scalar(value, max = 100) {
  if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (typeof value !== 'string') return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return clean || undefined;
}

function safeParams(eventName, payload, eventId, sessionId) {
  if (!ALLOWED_EVENTS.has(eventName)) throw new Error('Unsupported GA4 server event.');
  const allowed = new Set(COMMON_KEYS);
  if (eventName === 'purchase' || eventName === 'refund') {
    for (const key of FINANCIAL_KEYS) allowed.add(key);
  }
  const params = { event_id: scalar(eventId, 100) };
  for (const [key, value] of Object.entries(payload || {})) {
    if (!allowed.has(key) || key === 'items') continue;
    const clean = scalar(value, 100);
    if (clean !== undefined) params[key] = clean;
  }
  if (Array.isArray(payload?.items) && eventName === 'purchase') {
    params.items = payload.items.slice(0, 10).map((item) => ({
      item_id: scalar(item?.item_id, 100) || 'a7-service',
      item_name: scalar(item?.item_name, 100) || 'A7 Laundry Service'
    }));
  }
  if (sessionId) params.session_id = scalar(sessionId, 40);
  params.engagement_time_msec = 1;
  return params;
}

function timestampMicros(value) {
  const milliseconds = Date.parse(value || '');
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  return Math.trunc(milliseconds * 1000);
}

async function sendGa4Event(input, options = {}) {
  const env = options.env || process.env;
  const fetchFn = options.fetch || globalThis.fetch;
  const measurementId = String(env.GA4_MEASUREMENT_ID || 'G-JLQNRC7MK4').trim();
  const apiSecret = String(env.GA4_MEASUREMENT_PROTOCOL_SECRET || '').trim();
  const clientId = String(input.client_id || '').trim();
  if (!apiSecret) return { sent: false, status: 'disabled', reason: 'missing_api_secret' };
  if (!clientId) return { sent: false, status: 'pending_identity', reason: 'missing_client_id' };
  if (typeof fetchFn !== 'function') return { sent: false, status: 'failed', reason: 'fetch_unavailable' };
  const occurredAtMicros = timestampMicros(input.occurred_at);
  if (!occurredAtMicros) return { sent: false, status: 'failed', reason: 'invalid_event_timestamp' };
  const occurredAtMillis = occurredAtMicros / 1000;
  const nowMillis = Number.isFinite(options.nowMillis) ? options.nowMillis : Date.now();
  if (occurredAtMillis < nowMillis - MAX_BACKDATE_MS) {
    return { sent: false, status: 'failed', reason: 'event_timestamp_too_old' };
  }
  if (occurredAtMillis > nowMillis + MAX_FUTURE_SKEW_MS) {
    return { sent: false, status: 'failed', reason: 'event_timestamp_in_future' };
  }

  const endpoint = env.GA4_MEASUREMENT_PROTOCOL_DEBUG === 'true'
    ? 'https://www.google-analytics.com/debug/mp/collect'
    : 'https://www.google-analytics.com/mp/collect';
  const url = `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const eventParams = safeParams(input.event_name, input.safe_payload, input.event_id, input.session_id);
  if (env.GA4_DEBUG_MODE === 'true') eventParams.debug_mode = true;
  let response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        ...(occurredAtMicros ? { timestamp_micros: occurredAtMicros } : {}),
        ...(env.GA4_MEASUREMENT_PROTOCOL_DEBUG === 'true'
          ? { validation_behavior: 'ENFORCE_RECOMMENDATIONS' } : {}),
        events: [{
          name: input.event_name,
          params: eventParams
        }]
      })
    });
  } catch (_) {
    return { sent: false, status: 'failed', reason: 'network_failure' };
  }
  if (!response.ok) return { sent: false, status: 'failed', reason: `http_${response.status}` };
  if (env.GA4_MEASUREMENT_PROTOCOL_DEBUG === 'true') {
    const validation = await response.json().catch(() => null);
    if (validation?.validationMessages?.length) {
      return { sent: false, status: 'failed', reason: 'validation_failed', validation };
    }
  }
  return { sent: true, status: 'sent' };
}

async function deliverOutbox(store, eventId, options = {}) {
  const row = await store.getOutbox(eventId);
  if (!row) return { sent: false, status: 'not_queued', reason: 'outbox_missing' };
  if (row.delivery_status === 'sent') return { sent: false, status: 'sent', reason: 'already_sent' };
  const result = await sendGa4Event({
    event_id: row.event_id,
    event_name: row.event_name,
    client_id: row.client_id,
    session_id: row.session_id,
    occurred_at: row.occurred_at,
    safe_payload: row.safe_payload
  }, options);
  const update = result.sent
    ? { delivery_status: 'sent', sent_at: new Date().toISOString(), last_error_code: null }
    : {
        delivery_status: result.reason === 'event_timestamp_too_old' ? 'expired' : result.status,
        last_error_code: result.reason || null
      };
  try { await store.markOutbox(eventId, update); } catch (_) {}
  return { ...result, delivery_status: update.delivery_status };
}

async function retryOutbox(store, options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 25, 100));
  const rows = await store.getRetryableOutbox(limit);
  const summary = { selected: rows.length, sent: 0, failed: 0, expired: 0, skipped: 0 };
  for (const row of rows) {
    const result = await deliverOutbox(store, row.event_id, options);
    if (result.sent) summary.sent += 1;
    else if (result.delivery_status === 'expired') summary.expired += 1;
    else if (result.status === 'sent' || result.status === 'pending_identity') summary.skipped += 1;
    else summary.failed += 1;
  }
  return summary;
}

module.exports = {
  ALLOWED_EVENTS, MAX_BACKDATE_MS, MAX_FUTURE_SKEW_MS,
  safeParams, timestampMicros, sendGa4Event, deliverOutbox, retryOutbox
};
