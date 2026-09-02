import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../api/create-payment-link.js');
const webhook = require('../api/stripe-webhook.js');
const systemHandler = require('../api/system/payment-link.js');
const {signSession, issueSubmission, submissionCookie, COOKIE_NAME} = require('../lib/system-auth.js');
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
    order_number:'MCO 1001', current_invoice_id:'inv-a7-1001',
    order_status: 'invoice_created', payment_status: 'invoice_created',
    invoice_id: 'inv-a7-1001', service_amount: 50, currency: 'USD', version: 3, ...overrides});
  return store;
}

async function invokeSystem({role, origin = 'https://a7laundry.com', body, submission = false} = {}) {
  const env = {A7_SYSTEM_SESSION_SECRET:'s'.repeat(48), A7_SYSTEM_ACCESS_MODE:'team',
    A7_PUBLIC_BASE_URL:'https://a7laundry.com'};
  const token = role ? signSession({actor_id:`actor-${role}`, display_name:role, role}, env) : null;
  const cookies = [];
  if (token) cookies.push(`${COOKIE_NAME}=${encodeURIComponent(token)}`);
  if (submission) cookies.push(submissionCookie(issueSubmission(env).token).split(';')[0]);
  const req = {method:'POST', headers:{origin, cookie:cookies.join('; ')}, body:body || {
    action:'context', order_number:'MCO 1001'
  }};
  const previous = {secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE,
    base:process.env.A7_PUBLIC_BASE_URL};
  process.env.A7_SYSTEM_SESSION_SECRET = env.A7_SYSTEM_SESSION_SECRET;
  process.env.A7_SYSTEM_ACCESS_MODE = env.A7_SYSTEM_ACCESS_MODE;
  process.env.A7_PUBLIC_BASE_URL = env.A7_PUBLIC_BASE_URL;
  const res = responseRecorder();
  try { await systemHandler(req, res); return res; }
  finally {
    for (const [key, value] of [['A7_SYSTEM_SESSION_SECRET', previous.secret],
      ['A7_SYSTEM_ACCESS_MODE', previous.mode], ['A7_PUBLIC_BASE_URL', previous.base]]) {
      value === undefined ? delete process.env[key] : process.env[key] = value;
    }
  }
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

test('payment-link endpoint requires an invoiced order and ignores browser-supplied amount', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN: 'operator-secret', STRIPE_SECRET_KEY: 'sk_test_only'}, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Stripe must not be called'); };
    try {
      globalThis.__A7_OPERATIONAL_STORE__ = payableStore({order_status: 'weighed', payment_status: 'pending'});
      assert.equal((await invoke({token: 'operator-secret'})).statusCode, 409);
      globalThis.__A7_OPERATIONAL_STORE__ = payableStore();
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return {ok:true, async json() { return calls === 1 ? {id:'price_exact'}
          : {id:'plink_exact', url:'https://buy.stripe.com/exact'}; }};
      };
      const derived = await invoke({token:'operator-secret', body:{amount_usd:51, order_id:ORDER_ID, lead_id:LEAD_ID}});
      assert.equal(derived.statusCode, 200);
      assert.equal(derived.body.amount_usd, 50);
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
      assert.match(calls[0].options.headers['Idempotency-Key'], /^a7-[0-9a-f]{64}-service$/);
      assert.match(calls[1].options.headers['Idempotency-Key'], /^a7-[0-9a-f]{64}-link$/);
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

test('payment-link endpoint returns the exact active governed link on retry without new Stripe objects', async () => {
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
      const retry = await invoke({token: 'operator-secret', body: {order_id: ORDER_ID, lead_id: LEAD_ID}});
      assert.equal(retry.statusCode, 200);
      assert.equal(retry.body.payment_link_id, 'plink_retry');
      assert.equal(calls.length, 2);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('payment-link endpoint creates separate service and effective-tip lines', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN:'operator-secret', STRIPE_SECRET_KEY:'sk_test_only'}, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      calls.push({url, params:new URLSearchParams(options.body)});
      const payload = calls.length === 1 ? {id:'price_service'} : calls.length === 2
        ? {id:'price_tip'} : {id:'plink_tip', url:'https://buy.stripe.com/tip'};
      return {ok:true, async json() { return payload; }};
    };
    try {
      const res = await invoke({token:'operator-secret', body:{order_id:ORDER_ID, lead_id:LEAD_ID, tip_amount:'7.50'}});
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.service_amount, 50);
      assert.equal(res.body.tip_amount, 7.5);
      assert.equal(res.body.amount_usd, 57.5);
      assert.equal(calls.length, 3);
      assert.equal(calls[0].params.get('unit_amount'), '5000');
      assert.equal(calls[1].params.get('unit_amount'), '750');
      assert.equal(calls[2].params.get('line_items[0][price]'), 'price_service');
      assert.equal(calls[2].params.get('line_items[1][price]'), 'price_tip');
      assert.equal(calls[2].params.has('metadata[tip_amount]'), false);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('signed webhook reconciles governed service and tip separately without changing invoice value', async () => {
  await withEnvironment({PAYMENT_LINK_TOKEN:'operator-secret', STRIPE_SECRET_KEY:'sk_test_only'}, async () => {
    const store = payableStore({current_invoice_id:'inv-a7-1001'});
    globalThis.__A7_OPERATIONAL_STORE__ = store;
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      calls += 1;
      const payload = calls === 1 ? {id:'price_service'} : calls === 2 ? {id:'price_tip'}
        : {id:'plink_governed', url:'https://buy.stripe.com/governed'};
      return {ok:true, async json() { return payload; }};
    };
    try {
      assert.equal((await invoke({token:'operator-secret', body:{
        order_id:ORDER_ID, lead_id:LEAD_ID, tip_amount:'7.50'
      }})).statusCode, 200);
      const event = {id:'evt_governed_tip', type:'checkout.session.completed', created:1787911200,
        data:{object:{object:'checkout.session', id:'cs_test_governed_tip', payment_status:'paid',
          payment_intent:'pi_governedtip', payment_link:'plink_governed', amount_total:5750, currency:'usd',
          metadata:{order_id:ORDER_ID, lead_id:LEAD_ID, contract_version:'1'}}}};
      const result = await webhook.processStripeEvent(event, store);
      assert.equal(result.duplicate, false);
      const order = await store.getOrder(ORDER_ID);
      const payment = store.payments.get('pi_governedtip');
      assert.equal(order.service_amount, 50);
      assert.equal(order.tip_amount, 7.5);
      assert.equal(payment.service_amount, 50);
      assert.equal(payment.tip_amount, 7.5);
      assert.equal(payment.total_amount, 57.5);
      assert.equal(store.events.get('purchase:pi_governedtip').payload.value, 50);
      assert.equal((await store.getSystemPaymentLinkByStripeId('plink_governed')).status, 'completed');
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('governed payment remains partially refunded until service and tip are both refunded', async () => {
  const store = payableStore({current_invoice_id:'inv-a7-1001'});
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const payload = calls === 1 ? {id:'price_service_refund'} : calls === 2
      ? {id:'price_tip_refund'} : {id:'plink_refund', url:'https://buy.stripe.com/refund'};
    return {ok:true, async json() { return payload; }};
  };
  try {
    await withEnvironment({PAYMENT_LINK_TOKEN:'operator-secret', STRIPE_SECRET_KEY:'sk_test_only'}, async () => {
      globalThis.__A7_OPERATIONAL_STORE__ = store;
      assert.equal((await invoke({token:'operator-secret', body:{
        order_id:ORDER_ID, lead_id:LEAD_ID, tip_amount:'7.50'
      }})).statusCode, 200);
      await webhook.processStripeEvent({id:'evt_refund_sale', type:'checkout.session.completed', created:1787911200,
        data:{object:{object:'checkout.session', id:'cs_test_refund_sale', payment_status:'paid',
          payment_intent:'pi_refundsale', payment_link:'plink_refund', amount_total:5750, currency:'usd',
          metadata:{order_id:ORDER_ID, lead_id:LEAD_ID, contract_version:'1'}}}}, store);

      await webhook.processStripeEvent({id:'evt_refund_service', type:'refund.created', created:1787911300,
        data:{object:{object:'refund', id:'re_refund_service', payment_intent:'pi_refundsale',
          amount:5000, currency:'usd', status:'succeeded', created:1787911300}}}, store);
      assert.equal((await store.getOrder(ORDER_ID)).payment_status, 'partially_refunded');
      assert.equal(store.payments.get('pi_refundsale').status, 'partially_refunded');

      await webhook.processStripeEvent({id:'evt_refund_tip', type:'refund.created', created:1787911400,
        data:{object:{object:'refund', id:'re_refund_tip', payment_intent:'pi_refundsale',
          amount:750, currency:'usd', status:'succeeded', created:1787911400}}}, store);
      assert.equal((await store.getOrder(ORDER_ID)).payment_status, 'refunded');
      assert.equal(store.payments.get('pi_refundsale').status, 'refunded');
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.__A7_OPERATIONAL_STORE__;
  }
});

test('system Payment Link API is Owner/Manager-only, same-origin and submission-bound', async () => {
  await withEnvironment({STRIPE_SECRET_KEY:'sk_test_only'}, async () => {
    assert.equal((await invokeSystem()).statusCode, 401);
    assert.equal((await invokeSystem({role:'operator'})).statusCode, 403);
    assert.equal((await invokeSystem({role:'owner', origin:'https://evil.example'})).statusCode, 403);
    assert.equal((await invokeSystem({role:'manager'})).statusCode, 200);
    assert.equal((await invokeSystem({role:'owner', body:{action:'create', order_number:'MCO 1001', tip_amount:'0'}})).statusCode, 409);
    let calls = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      calls += 1;
      return {ok:true, async json() { return calls === 1 ? {id:'price_system'}
        : {id:'plink_system', url:'https://buy.stripe.com/system'}; }};
    };
    try {
      const created = await invokeSystem({role:'manager', submission:true,
        body:{action:'create', order_number:'MCO 1001', tip_amount:'0'}});
      assert.equal(created.statusCode, 201, JSON.stringify(created.body));
      assert.equal(created.body.result.total_amount, 50);
      assert.equal(Object.hasOwn(created.body.result, 'order_id'), false);
      assert.equal(Object.hasOwn(created.body.result, 'invoice_id'), false);
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
      let calls = 0;
      globalThis.fetch = async () => {
        calls += 1;
        return {ok:true, async json() { return calls === 1 ? {id:'price_recovered'}
          : {id:'plink_recovered', url:'https://buy.stripe.com/recovered'}; }};
      };
      const recovered = await invoke({token:'operator-secret'});
      assert.equal(recovered.statusCode, 200);
      assert.equal(recovered.body.payment_link_id, 'plink_recovered');
      assert.equal(globalThis.__A7_OPERATIONAL_STORE__.systemPaymentLinks.size, 1);
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
