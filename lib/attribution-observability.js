'use strict';

const ALLOWED_METRICS = new Set([
  'attribution_api_requests', 'attribution_api_success', 'attribution_api_failure', 'attribution_api_rate_limited',
  'attribution_created', 'attribution_restored', 'attribution_durable_resolved', 'attribution_unresolved',
  'short_ref_generated', 'short_ref_collision_retry', 'short_ref_resolved', 'short_ref_not_resolved',
  'whatsapp_clicks', 'whatsapp_clicks_with_ref', 'whatsapp_clicks_without_ref'
]);

function safeMetricNames(names) {
  return Array.from(new Set((names || []).filter((name) => ALLOWED_METRICS.has(name))));
}

function safeLog(level, event, detail = {}) {
  const payload = {
    scope: 'a7_attribution',
    level,
    event,
    at: new Date().toISOString()
  };
  for (const key of ['status', 'latency_ms', 'storage_mode', 'reason', 'count']) {
    if (detail[key] !== undefined) payload[key] = detail[key];
  }
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  writer(JSON.stringify(payload));
}

async function recordMetrics(store, names, latencyMs) {
  const clean = safeMetricNames(names);
  if (!clean.length || !store || typeof store.recordMetrics !== 'function') return false;
  try {
    await store.recordMetrics(clean, latencyMs);
    return true;
  } catch (_) {
    safeLog('warn', 'metric_persist_failed', { storage_mode: store.mode || 'unknown' });
    return false;
  }
}

module.exports = { ALLOWED_METRICS, safeMetricNames, safeLog, recordMetrics };
