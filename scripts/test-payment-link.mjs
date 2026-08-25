import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/create-payment-link.js');

function responseRecorder() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

async function invoke({method = 'POST', token, body = {amount_usd: 50}} = {}) {
  const req = {method, headers: token ? {'x-a7-token': token} : {}, body};
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

function withEnvironment(values, operation) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve(operation()).finally(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('payment-link endpoint allows POST only and fails closed without server configuration', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: undefined, STRIPE_SECRET_KEY: undefined}, async () => {
    const method = await invoke({method: 'GET'});
    assert.equal(method.statusCode, 405);
    assert.equal(method.headers.allow, 'POST');
    const missing = await invoke();
    assert.equal(missing.statusCode, 503);
    assert.deepEqual(missing.body, {error: 'Link generation is not configured.'});
  });
});

test('payment-link endpoint rejects bad authorization and amount before Stripe', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Stripe must not be called'); };
    try {
      assert.equal((await invoke({token: 'wrong'})).statusCode, 401);
      assert.equal((await invoke({token: 'operator-secret', body: {amount_usd: 4.99}})).statusCode, 400);
      assert.equal((await invoke({token: 'operator-secret', body: {amount_usd: 2000.01}})).statusCode, 400);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('payment-link endpoint creates a bounded one-use Stripe link with verified redirect', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      calls.push({url, options, params: new URLSearchParams(options.body)});
      const payload = calls.length === 1 ? {id: 'price_test'} : {id: 'plink_test', url: 'https://buy.stripe.com/test'};
      return {ok: true, async json() { return payload; }};
    };
    try {
      const res = await invoke({
        token: 'operator-secret',
        body: {
          amount_usd: 81.255,
          description: 'A7\u0000 Laundry   order',
          a7_reference: '7kq9w3m2hx',
          reference: 'guest\n123'
        }
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.amount_usd, 81.26);
      assert.equal(res.body.description, 'A7 Laundry order');
      assert.equal(calls.length, 2);
      assert.equal(calls[0].url, 'https://api.stripe.com/v1/prices');
      assert.equal(calls[0].params.get('unit_amount'), '8126');
      assert.equal(calls[0].params.get('currency'), 'usd');
      assert.equal(calls[1].url, 'https://api.stripe.com/v1/payment_links');
      assert.equal(calls[1].params.get('line_items[0][price]'), 'price_test');
      assert.equal(calls[1].params.get('restrictions[completed_sessions][limit]'), '1');
      assert.equal(calls[1].params.get('after_completion[redirect][url]'), handler.CONFIRMATION_URL);
      assert.equal(calls[1].params.get('metadata[a7_reference]'), '7KQ9W3M2HX');
      assert.equal(calls[1].params.get('metadata[operator_reference]'), 'guest 123');
      assert.match(calls[0].options.headers.Authorization, /^Bearer sk_test_only$/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('payment-link endpoint rejects a malformed A7 Ref before calling Stripe', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Stripe must not be called'); };
    try {
      const res = await invoke({token: 'operator-secret', body: {amount_usd: 50, a7_reference: 'SEO-LBV'}});
      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /10-character code/);
    } finally {
      globalThis.fetch = originalFetch;
    }
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
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('payment-link helpers use fixed-length token comparison and bounded cleaned text', () => {
  assert.equal(handler.tokenMatches('same', 'same'), true);
  assert.equal(handler.tokenMatches('same', 'other'), false);
  assert.equal(handler.cleanText(`  ${'x'.repeat(140)}  `, 'fallback').length, 120);
  assert.equal(handler.cleanText('\u0000\n', 'fallback'), 'fallback');
  assert.equal(handler.A7_REFERENCE_PATTERN.test('7KQ9W3M2HX'), true);
});
