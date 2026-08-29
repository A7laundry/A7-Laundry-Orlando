'use strict';

const { evaluateOperationalRelease } = require('../../lib/operational-release-preflight.js');
const {
  SupabaseOperationalStore,
  resolveSupabaseConfig
} = require('../../lib/operational-store.js');
const {
  SupabaseAttributionStore,
  resolveAttributionSupabaseConfig
} = require('../../lib/attribution-store.js');

const AUTHORIZED_PREVIEW_BRANCH = 'feat/meta-ads-ops-structure';

function respond(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
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
  if (process.env.VERCEL_ENV !== 'preview'
    || process.env.VERCEL_GIT_COMMIT_REF !== AUTHORIZED_PREVIEW_BRANCH) {
    return respond(res, 404, { error: 'not_found' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respond(res, 405, { error: 'method_not_allowed' });
  }

  const result = evaluateOperationalRelease(process.env, 'preview-steady');
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
module.exports.storageIsReachable = storageIsReachable;
