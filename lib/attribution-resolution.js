'use strict';

const attribution = require('../a7-attribution.js');
const { createAttributionStore } = require('./attribution-store.js');
const { recordMetrics, safeLog } = require('./attribution-observability.js');

async function resolveAttributionByShortRef(shortRef, options = {}) {
  const normalized = String(shortRef || '').toUpperCase();
  if (!attribution.validShortRef(normalized)) return null;
  const store = options.store || createAttributionStore(options);
  try {
    const record = await store.getByShortRef(normalized);
    await recordMetrics(store, [record ? 'short_ref_resolved' : 'short_ref_not_resolved']);
    if (!record) return null;
    return {
      attribution_id: record.attribution_id,
      short_ref: record.short_ref,
      created_at: record.created_at,
      expires_at: record.expires_at,
      schema_version: record.schema_version
    };
  } catch (_) {
    safeLog('error', 'short_ref_resolution_failed', { storage_mode: store.mode || 'unknown' });
    throw new Error('Attribution reference resolution unavailable.');
  }
}

module.exports = { resolveAttributionByShortRef };
