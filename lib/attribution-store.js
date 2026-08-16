'use strict';

const attribution = require('../a7-attribution.js');

const RETENTION_DAYS = 180;

class AttributionStoreError extends Error {
  constructor(message, code = 'attribution_store_error') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class StorageUnavailableError extends AttributionStoreError {
  constructor(message = 'Durable attribution storage is unavailable.') {
    super(message, 'storage_unavailable');
  }
}

class ShortRefCollisionError extends AttributionStoreError {
  constructor() {
    super('Attribution reference collision.', 'short_ref_collision');
  }
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function expirationFrom(now = new Date()) {
  return new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// Explicit development/test adapter. It is never selected in production unless
// A7_ATTRIBUTION_STORAGE_MODE=memory is deliberately set.
class MemoryAttributionStore {
  constructor(options = {}) {
    this.mode = 'shadow_ephemeral';
    this.maxRecords = options.maxRecords || 5000;
    this.records = new Map();
    this.metrics = new Map();
    this.pending = Promise.resolve();
  }

  async exclusive(operation) {
    const next = this.pending.then(operation, operation);
    this.pending = next.catch(() => {});
    return next;
  }

  prune(now = Date.now()) {
    for (const [id, entry] of this.records) {
      if (Date.parse(entry.record.expires_at || 0) <= now) this.records.delete(id);
    }
    while (this.records.size >= this.maxRecords) this.records.delete(this.records.keys().next().value);
  }

  async get(id) {
    this.prune();
    return clone(this.records.get(id)?.record || null);
  }

  async getByShortRef(shortRef) {
    this.prune();
    for (const entry of this.records.values()) {
      if (entry.record.short_ref === String(shortRef || '').toUpperCase()) return clone(entry.record);
    }
    return null;
  }

  async save(record) {
    return this.exclusive(async () => {
      this.prune();
      for (const entry of this.records.values()) {
        if (entry.record.short_ref === record.short_ref && entry.record.attribution_id !== record.attribution_id) {
          throw new ShortRefCollisionError();
        }
      }
      const normalized = Object.assign({
        schema_version: attribution.VERSION,
        consent_state: 'unknown',
        expires_at: expirationFrom()
      }, clone(record));
      this.records.set(normalized.attribution_id, { record: normalized, touchKeys: new Set() });
      return clone(normalized);
    });
  }

  async upsertSession(input) {
    return this.exclusive(async () => {
      this.prune();
      const collision = await this.getByShortRef(input.short_ref);
      if (collision && collision.attribution_id !== input.attribution_id) throw new ShortRefCollisionError();

      const entry = this.records.get(input.attribution_id);
      const existing = entry && entry.record;
      const touchKeys = entry ? entry.touchKeys : new Set();
      const duplicate = touchKeys.has(input.touch_fingerprint);
      let record = existing ? clone(existing) : null;

      if (!record) {
        record = attribution.mergeRecord(null, input.touch, {
          attribution_id: input.attribution_id,
          short_ref: input.short_ref
        });
        record.expires_at = input.expires_at || expirationFrom();
      } else if (!duplicate) {
        record = attribution.mergeRecord(record, input.touch);
        if (attribution.isExternalTouch(input.touch)) record.expires_at = input.expires_at || expirationFrom();
      }

      if (!duplicate && input.touch && input.touch.entry_type !== 'internal') touchKeys.add(input.touch_fingerprint);
      if (input.consent_state !== 'unknown') record.consent_state = input.consent_state;
      else record.consent_state ||= 'unknown';
      record.schema_version = attribution.VERSION;
      this.records.set(record.attribution_id, { record: clone(record), touchKeys });
      return clone(record);
    });
  }

  async recordMetrics(names, latencyMs) {
    for (const name of names || []) {
      const current = this.metrics.get(name) || { count: 0, latency_total_ms: 0, latency_samples: 0, latency_max_ms: 0 };
      current.count += 1;
      if (Number.isFinite(latencyMs) && latencyMs >= 0) {
        current.latency_total_ms += Math.round(latencyMs);
        current.latency_samples += 1;
        current.latency_max_ms = Math.max(current.latency_max_ms, Math.round(latencyMs));
      }
      this.metrics.set(name, current);
    }
  }

  async health() {
    return { ok: true, mode: this.mode };
  }
}

class SupabaseAttributionStore {
  constructor(options = {}) {
    this.mode = 'durable_supabase';
    this.url = String(options.url || '').replace(/\/$/, '');
    this.serviceRoleKey = String(options.serviceRoleKey || '');
    this.fetch = options.fetch || globalThis.fetch;
    if (!this.url || !this.serviceRoleKey || typeof this.fetch !== 'function') throw new StorageUnavailableError();
  }

  async rpc(name, body) {
    let response;
    try {
      response = await this.fetch(`${this.url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
          apikey: this.serviceRoleKey,
          Authorization: `Bearer ${this.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(body || {})
      });
    } catch (_) {
      throw new StorageUnavailableError();
    }
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) {
      if (response.status === 409 || payload?.code === '23505') throw new ShortRefCollisionError();
      throw new AttributionStoreError('Durable attribution operation failed.', `storage_http_${response.status}`);
    }
    return Array.isArray(payload) && payload.length === 1 ? payload[0] : payload;
  }

  async get(id) {
    return this.rpc('a7_get_attribution', { p_attribution_id: id });
  }

  async getByShortRef(shortRef) {
    return this.rpc('a7_get_attribution_by_short_ref', { p_short_ref: String(shortRef || '').toUpperCase() });
  }

  async save(record) {
    return this.upsertSession({
      attribution_id: record.attribution_id,
      short_ref: record.short_ref,
      touch: record.last_touch || record.first_touch,
      touch_fingerprint: attribution.touchFingerprint(record.last_touch || record.first_touch),
      consent_state: record.consent_state || 'unknown',
      expires_at: record.expires_at || expirationFrom()
    });
  }

  async upsertSession(input) {
    return this.rpc('a7_upsert_attribution', {
      p_attribution_id: input.attribution_id,
      p_short_ref: String(input.short_ref || '').toUpperCase(),
      p_touch: input.touch,
      p_touch_fingerprint: input.touch_fingerprint,
      p_consent_state: input.consent_state,
      p_expires_at: input.expires_at || expirationFrom()
    });
  }

  async recordMetrics(names, latencyMs) {
    if (!names || !names.length) return null;
    return this.rpc('a7_record_attribution_metrics', {
      p_metric_names: names,
      p_latency_ms: Number.isFinite(latencyMs) ? Math.max(0, Math.round(latencyMs)) : null
    });
  }

  async health() {
    const result = await this.rpc('a7_attribution_health', {});
    return Object.assign({ mode: this.mode }, result || {});
  }
}

class UnavailableAttributionStore {
  constructor() { this.mode = 'unavailable'; }
  async get() { throw new StorageUnavailableError(); }
  async getByShortRef() { throw new StorageUnavailableError(); }
  async save() { throw new StorageUnavailableError(); }
  async upsertSession() { throw new StorageUnavailableError(); }
  async recordMetrics() { throw new StorageUnavailableError(); }
  async health() { return { ok: false, mode: this.mode, reason: 'not_configured' }; }
}

function createAttributionStore(options = {}) {
  if (options.store) return options.store;
  if (globalThis.__A7_ATTRIBUTION_STORE__) return globalThis.__A7_ATTRIBUTION_STORE__;

  const env = options.env || process.env;
  const explicitMemory = env.A7_ATTRIBUTION_STORAGE_MODE === 'memory';
  const localMemory = env.NODE_ENV !== 'production' && env.A7_ATTRIBUTION_STORAGE_MODE !== 'unavailable';
  if (explicitMemory || localMemory) {
    globalThis.__A7_ATTRIBUTION_STORE__ = new MemoryAttributionStore();
  } else if (env.A7_ATTRIBUTION_SUPABASE_URL && env.A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY) {
    globalThis.__A7_ATTRIBUTION_STORE__ = new SupabaseAttributionStore({
      url: env.A7_ATTRIBUTION_SUPABASE_URL,
      serviceRoleKey: env.A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY
    });
  } else {
    globalThis.__A7_ATTRIBUTION_STORE__ = new UnavailableAttributionStore();
  }
  return globalThis.__A7_ATTRIBUTION_STORE__;
}

function resetAttributionStoreForTests() {
  delete globalThis.__A7_ATTRIBUTION_STORE__;
}

module.exports = {
  RETENTION_DAYS,
  AttributionStoreError,
  StorageUnavailableError,
  ShortRefCollisionError,
  MemoryAttributionStore,
  SupabaseAttributionStore,
  UnavailableAttributionStore,
  createAttributionStore,
  resetAttributionStoreForTests,
  expirationFrom
};
