import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {evaluateOperationalRelease} = require('../lib/operational-release-preflight.js');
const preflightHandler = require('../api/operations/preflight.js');

function baseEnv() {
  return {
    WHATSAPP_SUPABASE_URL: 'https://project.supabase.co',
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    OPERATIONS_API_TOKEN: 'operations-token',
    PAYMENT_LINK_TOKEN: 'payment-token',
    NODE_ENV: 'production',
    STRIPE_WEBHOOK_SECRET: 'whsec_x',
    GA4_MEASUREMENT_ID: 'G-JLQNRC7MK4',
    GA4_MEASUREMENT_PROTOCOL_SECRET: 'ga-secret'
  };
}

test('production preflight requires live Stripe and disables every GA4 debug mode', () => {
  const result = evaluateOperationalRelease({...baseEnv(), STRIPE_SECRET_KEY: 'sk_live_x'}, 'production');
  assert.equal(result.ready, true);
  assert.equal(result.storage_source, 'whatsapp');
  assert.ok(result.checks.every((item) => item.status === 'pass'));

  const restricted = evaluateOperationalRelease({...baseEnv(), STRIPE_SECRET_KEY: 'rk_live_x'}, 'production');
  assert.equal(restricted.ready, true);
  assert.ok(restricted.checks.every((item) => item.status === 'pass'));
});

test('production preflight fails closed without secrets and never reports their values', () => {
  const env = {...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_private-value', GA4_DEBUG_MODE: 'true'};
  delete env.OPERATIONS_API_TOKEN;
  const result = evaluateOperationalRelease(env, 'production');
  assert.equal(result.ready, false);
  const failed = result.checks.filter((item) => item.status === 'fail').map((item) => item.name);
  assert.deepEqual(failed, ['operations_api_token', 'stripe_secret_key', 'ga4_debugview_mode']);
  assert.doesNotMatch(JSON.stringify(result), /private-value|ga-secret|payment-token|service-role-key/);
});

test('production preflight rejects every effective in-memory store selection', () => {
  for (const overrides of [
    {NODE_ENV: 'development'},
    {NODE_ENV: undefined},
    {A7_OPERATIONS_STORAGE_MODE: 'memory'},
    {A7_ATTRIBUTION_STORAGE_MODE: 'memory'}
  ]) {
    const env = {...baseEnv(), STRIPE_SECRET_KEY: 'sk_live_x', ...overrides};
    if (overrides.NODE_ENV === undefined) delete env.NODE_ENV;
    const result = evaluateOperationalRelease(env, 'production');
    assert.equal(result.ready, false);
    assert.equal(result.checks.find((item) => item.name === 'memory_storage_forbidden').reason,
      'durable_storage_required_in_production');
  }
});

test('preflight rejects cross-namespace Supabase credentials', () => {
  const env = {...baseEnv(), STRIPE_SECRET_KEY: 'sk_live_x'};
  delete env.WHATSAPP_SUPABASE_URL;
  delete env.WHATSAPP_SUPABASE_SERVICE_ROLE_KEY;
  env.A7_OPERATIONS_SUPABASE_URL = 'https://operations.supabase.co';
  env.A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY = 'different-namespace-key';
  const result = evaluateOperationalRelease(env, 'production');
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((item) => item.name === 'operational_store_pair').status, 'fail');
});

test('Preview validation and DebugView profiles enforce distinct GA4 modes', () => {
  const validation = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_x', GA4_MEASUREMENT_PROTOCOL_DEBUG: 'true'
  }, 'preview-validation');
  assert.equal(validation.ready, true);

  const debugView = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_x', GA4_DEBUG_MODE: 'true'
  }, 'preview-debugview');
  assert.equal(debugView.ready, true);

  const crossed = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_x', GA4_MEASUREMENT_PROTOCOL_DEBUG: 'true', GA4_DEBUG_MODE: 'true'
  }, 'preview-debugview');
  assert.equal(crossed.ready, false);
});

test('steady-state Preview requires test Stripe and disables both GA4 debug modes', () => {
  const steady = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_x'
  }, 'preview-steady');
  assert.equal(steady.ready, true);
  assert.ok(steady.checks.every((item) => item.status === 'pass'));

  const liveStripe = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_live_x'
  }, 'preview-steady');
  assert.equal(liveStripe.ready, false);
  assert.equal(liveStripe.checks.find((item) => item.name === 'stripe_secret_key').reason, 'test_mode_required');

  const lingeringDebug = evaluateOperationalRelease({
    ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_x', GA4_DEBUG_MODE: 'true'
  }, 'preview-steady');
  assert.equal(lingeringDebug.ready, false);
  assert.equal(lingeringDebug.checks.find((item) => item.name === 'ga4_debugview_mode').status, 'fail');
});

function mockResponse() {
  return {
    headers: {}, statusCode: null, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('runtime preflight supports the authorized Preview branch and hides Production from anonymous callers', async () => {
  const previous = process.env;
  const originalFetch = globalThis.fetch;
  try {
    process.env = {
      ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_runtime',
      VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/meta-ads-ops-structure'
    };
    const ready = mockResponse();
    globalThis.fetch = async (url) => ({
      ok: true,
      async json() {
        return String(url).includes('a7_attribution_health') ? {ok: true} : [];
      }
    });
    await preflightHandler({method: 'GET'}, ready);
    assert.equal(ready.statusCode, 200);
    assert.equal(ready.body.ready, true);
    assert.doesNotMatch(JSON.stringify(ready.body), /runtime|ga-secret|payment-token|service-role-key/);

    process.env.VERCEL_ENV = 'production';
    const production = mockResponse();
    await preflightHandler({method: 'GET', headers: {}}, production);
    assert.equal(production.statusCode, 404);

    const wrongToken = mockResponse();
    await preflightHandler({method: 'GET', headers: {authorization: 'Bearer wrong-token'}}, wrongToken);
    assert.equal(wrongToken.statusCode, 404);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});

test('authenticated Production runtime preflight returns sanitized 10/10 readiness', async () => {
  const previous = process.env;
  const originalFetch = globalThis.fetch;
  try {
    process.env = {
      ...baseEnv(), STRIPE_SECRET_KEY: 'sk_live_runtime',
      VERCEL_ENV: 'production'
    };
    globalThis.fetch = async (url) => ({
      ok: true,
      async json() {
        return String(url).includes('a7_attribution_health') ? {ok: true} : [];
      }
    });
    const response = mockResponse();
    await preflightHandler({
      method: 'GET', headers: {authorization: 'Bearer operations-token'}
    }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.profile, 'production');
    assert.equal(response.body.ready, true);
    assert.equal(response.body.checks.length, 10);
    assert.ok(response.body.checks.every((item) => item.status === 'pass'));
    assert.doesNotMatch(JSON.stringify(response.body),
      /operations-token|ga-secret|payment-token|service-role-key|sk_live_runtime/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});

test('runtime preflight fails the existing storage gate when Supabase is unreachable', async () => {
  const previous = process.env;
  const originalFetch = globalThis.fetch;
  try {
    process.env = {
      ...baseEnv(), STRIPE_SECRET_KEY: 'sk_test_runtime',
      VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/meta-ads-ops-structure'
    };
    globalThis.fetch = async () => { throw new Error('synthetic unavailable'); };
    const response = mockResponse();
    await preflightHandler({method: 'GET'}, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.body.ready, false);
    assert.equal(response.body.checks.find((item) => item.name === 'operational_store_pair').reason,
      'runtime_unavailable');
    assert.equal(response.body.checks.length, 10);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});
