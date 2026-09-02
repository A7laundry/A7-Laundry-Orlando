'use strict';

const crypto = require('node:crypto');
const {
  evaluateOperationalRelease,
  verifyStagingRuntimeBindings
} = require('../../lib/operational-release-preflight.js');
const {
  SupabaseOperationalStore,
  resolveSupabaseConfig
} = require('../../lib/operational-store.js');
const {
  SupabaseAttributionStore,
  resolveAttributionSupabaseConfig
} = require('../../lib/attribution-store.js');

const AUTHORIZED_PREVIEW_BRANCH = 'feat/meta-ads-ops-structure';
const AUTHORIZED_STAGING_BRANCH = 'feat/orlando-operational-cycle-20260901';

function respond(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function safeEqual(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !provided || !expected) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearer(req) {
  const authorization = Array.isArray(req.headers?.authorization)
    ? req.headers.authorization[0] : req.headers?.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  const header = req.headers?.['x-a7-token'];
  return Array.isArray(header) ? header[0] : header;
}

async function storageIsReachable(env, fetchImpl = globalThis.fetch) {
  const operational = resolveSupabaseConfig(env);
  const attribution = resolveAttributionSupabaseConfig(env);
  if (!operational || !attribution || typeof fetchImpl !== 'function') return false;
  try {
    const operationalStore = new SupabaseOperationalStore({...operational, fetch: fetchImpl});
    const attributionStore = new SupabaseAttributionStore({...attribution, fetch: fetchImpl});
    const [rows, health] = await Promise.all([
      operationalStore.request('a7_orlando_leads?select=id&limit=0'),
      attributionStore.health()
    ]);
    return Array.isArray(rows) && health?.ok === true;
  } catch (_) {
    return false;
  }
}

async function handler(req, res) {
  const previewBranch = process.env.VERCEL_GIT_COMMIT_REF;
  const preview = process.env.VERCEL_ENV === 'preview'
    && [AUTHORIZED_PREVIEW_BRANCH, AUTHORIZED_STAGING_BRANCH].includes(previewBranch);
  const production = process.env.VERCEL_ENV === 'production';
  if (!preview && !production) {
    return respond(res, 404, { error: 'not_found' });
  }
  if (production && !safeEqual(bearer(req), process.env.OPERATIONS_API_TOKEN)) {
    return respond(res, 404, { error: 'not_found' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respond(res, 405, { error: 'method_not_allowed' });
  }

  const profile = production ? 'production'
    : previewBranch === AUTHORIZED_STAGING_BRANCH ? 'staging-e2e' : 'preview-steady';
  const result = await verifyStagingRuntimeBindings(
    evaluateOperationalRelease(process.env, profile), process.env
  );
  const storageCheck = result.checks.find((item) => item.name === 'operational_store_pair');
  if (storageCheck?.status === 'pass' && !await storageIsReachable(process.env)) {
    storageCheck.status = 'fail';
    storageCheck.reason = 'runtime_unavailable';
    result.ready = false;
  }
  return respond(res, result.ready ? 200 : 503, result);
}

module.exports = handler;
module.exports.AUTHORIZED_PREVIEW_BRANCH = AUTHORIZED_PREVIEW_BRANCH;
module.exports.AUTHORIZED_STAGING_BRANCH = AUTHORIZED_STAGING_BRANCH;
module.exports.safeEqual = safeEqual;
module.exports.storageIsReachable = storageIsReachable;
