import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/create-payment-link.js');
const {MemoryOperationalStore} = require('../lib/operational-store.js');
const LEAD_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

function responseRecorder() {
  return {headers: {}, statusCode: null, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }};
}

async function invoke({method = 'POST', token, body = {amount_usd: 50, order_id: ORDER_ID, lead_id: LEAD_ID}} = {}) {
  const req = {method, headers: token ? {'x-a7-token': token} : {}, body};
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

function payableStore(overrides = {}) {
  const store = new MemoryOperationalStore();
  store.orders.set(ORDER_ID, {id: ORDER_ID, lead_id: LEAD_ID,
    order_status: 'invoice_created', payment_status: 'invoice_created',
    invoice_id: 'inv-a7-1001', service_amount: 50, currency: 'USD', version: 3, ...overrides});
  return store;
}

function withEnvironment(values, operation) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  const priorStore = globalThis.__A7_OPERATIONAL_STORE__;
  for (const [key, value] of Object.entries(values)) value === undefined ? delete process.env[key] : process.env[key] = value;
  globalThis.__A7_OPERATIONAL_STORE__ = payableStore();
  return Promise.resolve(operation()).finally(() => {
    priorStore ? globalThis.__A7_OPERATIONAL_STORE__ = priorStore : delete globalThis.__A7_OPERATIONAL_STORE__;
    for (const [key, value] of previous) value === undefined ? delete process.env[key] : process.env[key] = value;
  });
}

test('payment-link endpoint allows POST only and fails closed without server configuration', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: undefined, STRIPE_SECRET_KEY: undefined}, async () => {
    const method = await invoke({method: 'GET'});
    assert.equal(method.statusCode, 405);
    assert.equal(method.headers.allow, 'POST');
    assert.equal((await invoke()).statusCode, 503);
  });
});

test('payment-link endpoint rejects authorization, amount and opaque ID errors before Stripe', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Stripe must not be called'); };
    try {
      assert.equal((await invoke({token: 'wrong'})).statusCode, 401);
      assert.equal((await invoke({token: 'operator-secret', body: 'x'.repeat(16_385)})).statusCode, 400);
      assert.equal((await invoke({token: 'operator-secret', body: {amount_usd: 4.99}})).statusCode, 400);
      assert.equal((await invoke({token: 'operator-secret', body: {amount_usd: 50, order_id: 'bad', lead_id: LEAD_ID}})).statusCode, 400);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link endpoint requires an invoiced order and the exact approved amount', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Stripe must not be called'); };
    try {
      globalThis.__A7_OPERATIONAL_STORE__ = payableStore({order_status: 'weighed', payment_status: 'pending'});
      assert.equal((await invoke({token: 'operator-secret'})).statusCode, 409);
      globalThis.__A7_OPERATIONAL_STORE__ = payableStore();
      assert.equal((await invoke({token: 'operator-secret', body: {amount_usd: 51, order_id: ORDER_ID, lead_id: LEAD_ID}})).statusCode, 409);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link endpoint creates an idempotent one-use link with minimal opaque metadata', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      calls.push({url, options, params: new URLSearchParams(options.body)});
      const payload = calls.length === 1 ? {id: 'price_test'} : {id: 'plink_test', url: 'https://buy.stripe.com/test'};
      return {ok: true, async json() { return payload; }};
    };
    try {
      const res = await invoke({token: 'operator-secret', body: {amount_usd: 50,
        description: 'A7\u0000 Laundry   order', order_id: ORDER_ID, lead_id: LEAD_ID,
        reference: 'phone 407-555-1234', a7_reference: '7KQ9W3M2HX'}});
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.order_id, ORDER_ID);
      assert.equal(res.body.description, 'A7 Laundry — pickup & delivery');
      assert.equal(calls.length, 2);
      assert.equal(calls[0].params.get('unit_amount'), '5000');
      assert.match(calls[0].options.headers['Idempotency-Key'], /^a7-price-/);
      assert.match(calls[1].options.headers['Idempotency-Key'], /^a7-payment-link-/);
      assert.match(calls[0].options.headers['Idempotency-Key'], /-v3$/);
      assert.match(calls[1].options.headers['Idempotency-Key'], /-v3$/);
      assert.equal(calls[1].params.get('restrictions[completed_sessions][limit]'), '1');
      assert.equal(calls[1].params.get('after_completion[redirect][url]'), handler.confirmationUrl({}));
      for (const prefix of ['metadata', 'payment_intent_data[metadata]']) {
        assert.equal(calls[1].params.get(`${prefix}[order_id]`), ORDER_ID);
        assert.equal(calls[1].params.get(`${prefix}[lead_id]`), LEAD_ID);
        assert.equal(calls[1].params.get(`${prefix}[contract_version]`), '1');
      }
      assert.equal(calls[1].params.has('metadata[a7_reference]'), false);
      assert.equal(calls[1].params.has('metadata[operator_reference]'), false);
      assert.equal(calls[1].options.body.includes('407-555-1234'), false);
      assert.equal(calls[0].options.body.includes('407-555-1234'), false);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link endpoint derives value from the invoice and rotates idempotency after a failed attempt', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    globalThis.__A7_OPERATIONAL_STORE__ = payableStore({payment_status: 'failed', version: 4});
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      calls.push({url, options, params: new URLSearchParams(options.body)});
      const payload = calls.length === 1 ? {id: 'price_retry'} : {id: 'plink_retry', url: 'https://buy.stripe.com/retry'};
      return {ok: true, async json() { return payload; }};
    };
    try {
      const res = await invoke({token: 'operator-secret', body: {order_id: ORDER_ID, lead_id: LEAD_ID}});
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.amount_usd, 50);
      assert.equal(calls[0].params.get('unit_amount'), '5000');
      assert.match(calls[0].options.headers['Idempotency-Key'], /-v4$/);
      assert.match(calls[1].options.headers['Idempotency-Key'], /-v4$/);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link endpoint returns a controlled failure when Stripe rejects the request', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ok: false, async json() { return {error: {message: 'Rejected test request'}}; }});
    try {
      const res = await invoke({token: 'operator-secret'});
      assert.equal(res.statusCode, 502);
      assert.deepEqual(res.body, {error: 'Rejected test request'});
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link helpers use fixed-length token comparison and strict UUIDs', () => {
  assert.equal(handler.tokenMatches('same', 'same'), true);
  assert.equal(handler.tokenMatches('same', 'other'), false);
  assert.equal(handler.cleanText(`  ${'x'.repeat(140)}  `, 'fallback').length, 120);
  assert.equal(handler.UUID_PATTERN.test(ORDER_ID), true);
  assert.equal(handler.UUID_PATTERN.test('7KQ9W3M2HX'), false);
});

test('payment-link confirmation origin follows Preview without trusting arbitrary hosts', () => {
  assert.equal(handler.confirmationUrl({VERCEL_ENV: 'preview', VERCEL_URL: 'a7-preview-123.vercel.app'}),
    'https://a7-preview-123.vercel.app/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}');
  assert.throws(() => handler.confirmationUrl({VERCEL_ENV: 'preview', VERCEL_URL: 'a7-preview-123.vercel.app',
    A7_PUBLIC_BASE_URL: 'https://unrelated-tenant.vercel.app'}));
  assert.equal(handler.confirmationUrl({VERCEL_ENV: 'production'}),
    'https://a7laundry.com/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(handler.confirmationUrl({VERCEL_ENV: 'production', A7_PUBLIC_BASE_URL: 'https://www.a7laundry.com'}),
    'https://www.a7laundry.com/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}');
  assert.throws(() => handler.confirmationUrl({VERCEL_ENV: 'production',
    A7_PUBLIC_BASE_URL: 'https://a7-preview-123.vercel.app'}));
  assert.throws(() => handler.confirmationUrl({A7_PUBLIC_BASE_URL: 'https://evil.example'}));
});
