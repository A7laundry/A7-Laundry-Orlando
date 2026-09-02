import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {
  evaluateOperationalRelease,
  verifyStagingRuntimeBindings
} = require('../lib/operational-release-preflight.js');
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

function stagingEnv(overrides = {}) {
  const ref = 'abcdefghijklmnopqrst';
  return {
    ...baseEnv(),
    WHATSAPP_SUPABASE_URL: undefined,
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: undefined,
    A7_STAGING_SUPABASE_PROJECT_REF:ref,
    A7_OPERATIONS_SUPABASE_URL:`https://${ref}.supabase.co`,
    A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY:'sb_secret_operations',
    A7_ATTRIBUTION_SUPABASE_URL:`https://${ref}.supabase.co`,
    A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY:'sb_secret_attribution',
    STRIPE_SECRET_KEY:'sk_test_staging',
    STRIPE_WEBHOOK_ENDPOINT_ID:'we_staging',
    VERCEL_ENV:'preview',
    VERCEL_URL:'a7-orlando-a7-038-example.vercel.app',
    A7_SYSTEM_ACCESS_MODE:'team',
    A7_SYSTEM_SESSION_SECRET:'staging-session-secret-at-least-32-bytes',
    A7_STAGING_GA4_MODE:'validation_only',
    GA4_MEASUREMENT_PROTOCOL_DEBUG:'true',
    ...overrides
  };
}

test('staging E2E preflight accepts only a runtime-verified test webhook binding', async () => {
  const pending = evaluateOperationalRelease(stagingEnv(), 'staging-e2e');
  assert.equal(pending.ready, false);
  assert.equal(pending.checks.find((item) => item.name === 'stripe_webhook_test_binding').reason,
    'runtime_verification_required');
  const result = await verifyStagingRuntimeBindings(pending, stagingEnv(), async () => ({
    ok:true,
    async json() { return { id:'we_staging', livemode:false, status:'enabled',
      url:'https://a7-orlando-a7-038-example.vercel.app/api/stripe-webhook' }; }
  }));
  assert.equal(result.ready, true);
  assert.ok(result.checks.every((item) => item.status === 'pass'));
  assert.doesNotMatch(JSON.stringify(result), /sb_secret_|sk_test_staging|staging-session-secret/);
});

test('staging E2E preflight rejects a live, disabled or wrong-host webhook endpoint', async () => {
  for (const endpoint of [
    { id:'we_staging', livemode:true, status:'enabled', url:'https://a7-orlando-a7-038-example.vercel.app/api/stripe-webhook' },
    { id:'we_staging', livemode:false, status:'disabled', url:'https://a7-orlando-a7-038-example.vercel.app/api/stripe-webhook' },
    { id:'we_staging', livemode:false, status:'enabled', url:'https://a7laundry.com/api/stripe-webhook' }
  ]) {
    const result = await verifyStagingRuntimeBindings(
      evaluateOperationalRelease(stagingEnv(), 'staging-e2e'), stagingEnv(),
      async () => ({ ok:true, async json() { return endpoint; } })
    );
    assert.equal(result.ready, false);
    assert.equal(result.checks.find((item) => item.name === 'stripe_webhook_test_binding').reason,
      'stripe_test_endpoint_binding_unverified');
  }
});

test('staging E2E ignores a conflicting configured base URL and binds Stripe to the current Vercel deployment', async () => {
  const env = {
    ...stagingEnv(),
    VERCEL_URL:'actual-a7-038-preview.vercel.app',
    A7_STAGING_BASE_URL:'different-vercel-project.vercel.app'
  };
  const result = await verifyStagingRuntimeBindings(
    evaluateOperationalRelease(env, 'staging-e2e'), env,
    async () => ({
      ok:true,
      json:async () => ({
        id:'we_staging',
        livemode:false,
        status:'enabled',
        url:'https://different-vercel-project.vercel.app/api/stripe-webhook'
      })
    })
  );
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((row) => row.name === 'isolated_preview_host')?.status, 'pass');
  assert.equal(result.checks.find((row) => row.name === 'stripe_webhook_test_binding')?.status, 'fail');
});

test('staging E2E preflight blocks Production, the foreign project and mixed namespaces', () => {
  for (const [overrides, expected] of [
    [{ A7_STAGING_SUPABASE_PROJECT_REF:'wiwawtpaxnrueugppasi',
      A7_OPERATIONS_SUPABASE_URL:'https://wiwawtpaxnrueugppasi.supabase.co',
      A7_ATTRIBUTION_SUPABASE_URL:'https://wiwawtpaxnrueugppasi.supabase.co' }, 'dedicated_staging_project_ref'],
    [{ A7_STAGING_SUPABASE_PROJECT_REF:'zquefoznqwkfbnnfalmt',
      A7_OPERATIONS_SUPABASE_URL:'https://zquefoznqwkfbnnfalmt.supabase.co',
      A7_ATTRIBUTION_SUPABASE_URL:'https://zquefoznqwkfbnnfalmt.supabase.co' }, 'dedicated_staging_project_ref'],
    [{ A7_ATTRIBUTION_SUPABASE_URL:'https://uvwxyzabcdefghijklmn.supabase.co' },
      'all_supabase_namespaces_isolated'],
    [{ VERCEL_ENV:'production' }, 'vercel_preview_only'],
    [{ VERCEL_URL:'a7laundry.com' }, 'isolated_preview_host'],
    [{ STRIPE_SECRET_KEY:'sk_live_forbidden' }, 'stripe_secret_key']
  ]) {
    const result = evaluateOperationalRelease(stagingEnv(overrides), 'staging-e2e');
    assert.equal(result.ready, false);
    assert.equal(result.checks.find((item) => item.name === expected)?.status, 'fail');
  }
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

test('A7-038 Preview runtime uses staging-e2e and verifies Stripe test endpoint binding', async () => {
  const previous = process.env;
  const originalFetch = globalThis.fetch;
  try {
    process.env = {
      ...stagingEnv(), VERCEL_GIT_COMMIT_REF:'feat/orlando-operational-cycle-20260901'
    };
    globalThis.fetch = async (url) => {
      if (String(url).startsWith('https://api.stripe.com/')) {
        return { ok:true, async json() { return { id:'we_staging', livemode:false,
          status:'enabled', url:'https://a7-orlando-a7-038-example.vercel.app/api/stripe-webhook' }; } };
      }
      return { ok:true, async json() {
        return String(url).includes('a7_attribution_health') ? {ok:true} : [];
      } };
    };
    const response = mockResponse();
    await preflightHandler({method:'GET'}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.profile, 'staging-e2e');
    assert.equal(response.body.ready, true);
    assert.equal(response.body.checks.find((item) => item.name === 'stripe_webhook_test_binding').status, 'pass');
    assert.doesNotMatch(JSON.stringify(response.body), /sb_secret_|sk_test_staging|staging-session-secret/);
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
