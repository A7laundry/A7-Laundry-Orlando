import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(import.meta.url);
const stripeSessionHandler = require(path.join(root, 'api/stripe-session.js'));
const { MemoryOperationalStore } = require(path.join(root, 'lib/operational-store.js'));
const originalFetch = globalThis.fetch;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalOperationalStore = globalThis.__A7_OPERATIONAL_STORE__;
const ORDER_ID = '22222222-2222-4222-8222-222222222222';
const LEAD_ID = '11111111-1111-4111-8111-111111111111';

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

async function callHandler({ method = 'GET', sessionId = 'cs_test_A7Guest123' } = {}) {
  const req = { method, query: { session_id: sessionId } };
  const res = responseRecorder();
  await stripeSessionHandler(req, res);
  return res;
}

try {
  process.env.STRIPE_SECRET_KEY = 'sk_test_server_only';
  const operationalStore = new MemoryOperationalStore();
  operationalStore.orders.set(ORDER_ID, {
    id: ORDER_ID, lead_id: LEAD_ID, invoice_id: 'inv-confirmation', service_amount: 50,
    currency: 'USD', payment_status: 'paid', payment_id: 'pi_a7guest', order_status: 'invoice_created'
  });
  globalThis.__A7_OPERATIONAL_STORE__ = operationalStore;

  const methodResponse = await callHandler({ method: 'POST' });
  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.headers.allow, 'GET');

  const invalidResponse = await callHandler({ sessionId: 'not-a-checkout-session' });
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(globalThis.fetch, originalFetch);

  delete process.env.STRIPE_SECRET_KEY;
  const unavailableResponse = await callHandler();
  assert.equal(unavailableResponse.statusCode, 503);

  process.env.STRIPE_SECRET_KEY = 'sk_test_server_only';
  let requestedUrl = '';
  let requestedAuthorization = '';
  globalThis.fetch = async (url, options) => {
    requestedUrl = url;
    requestedAuthorization = options.headers.Authorization;
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          id: 'cs_test_A7Guest123',
          payment_status: 'paid',
          status: 'complete',
          currency: 'usd',
          amount_total: 5000,
          payment_link: 'plink_a7guest',
          payment_intent: 'pi_a7guest',
          metadata: { order_id: ORDER_ID, lead_id: LEAD_ID, contract_version: '1',
            a7_reference: '7kq9w3m2hx', operator_reference: 'must-not-leak' },
          customer_details: { email: 'must-not-leak@example.com' },
          line_items: {
            data: [{ description: 'Guest Laundry — Wash, Dry & Fold' }]
          }
        };
      }
    };
  };

  const paidResponse = await callHandler();
  assert.equal(paidResponse.statusCode, 200);
  assert.equal(paidResponse.body.amount_total, 50);
  assert.equal(paidResponse.body.currency, 'USD');
  assert.equal(paidResponse.body.service, 'Guest Laundry — Wash, Dry & Fold');
  assert.equal(paidResponse.body.payment_link_id, 'plink_a7guest');
  assert.equal(paidResponse.body.reconciliation_status, 'reconciled');
  assert.equal('a7_reference' in paidResponse.body, false);
  assert.equal('operator_reference' in paidResponse.body, false);
  assert.equal('customer_details' in paidResponse.body, false);
  assert.match(requestedUrl, /checkout\/sessions\/cs_test_A7Guest123/);
  assert.equal(requestedAuthorization, 'Bearer sk_test_server_only');
  assert.equal(paidResponse.headers['cache-control'], 'private, no-store, max-age=0');

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        id: 'cs_test_A7Guest123',
        payment_status: 'unpaid',
        status: 'open',
        currency: 'usd',
        amount_total: 5000
      };
    }
  });
  const unpaidResponse = await callHandler();
  assert.equal(unpaidResponse.statusCode, 409);
  assert.deepEqual(unpaidResponse.body, { error: 'Payment is not confirmed yet.' });

  operationalStore.orders.get(ORDER_ID).payment_status = 'invoice_created';
  operationalStore.orders.get(ORDER_ID).payment_id = null;
  globalThis.fetch = async () => ({ok: true, status: 200, async json() { return {
    id: 'cs_test_A7Guest123', payment_status: 'paid', status: 'complete', currency: 'usd',
    amount_total: 5000, payment_intent: 'pi_a7guest', payment_link: 'plink_a7guest',
    metadata: {order_id: ORDER_ID, lead_id: LEAD_ID, contract_version: '1'},
    line_items: {data: [{description: 'Guest Laundry'}]}
  }; }});
  const pendingResponse = await callHandler();
  assert.equal(pendingResponse.statusCode, 202);
  assert.equal(pendingResponse.body.reconciliation_status, 'pending');
  operationalStore.orders.get(ORDER_ID).payment_status = 'paid';
  operationalStore.orders.get(ORDER_ID).payment_id = 'pi_a7guest';

  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    async json() {
      return { error: { message: 'Sensitive upstream detail' } };
    }
  });
  const upstreamResponse = await callHandler();
  assert.equal(upstreamResponse.statusCode, 502);
  assert.equal(JSON.stringify(upstreamResponse.body).includes('Sensitive upstream detail'), false);

  const page = fs.readFileSync(path.join(root, 'guest-payment-confirmation.html'), 'utf8');
  for (const requiredToken of [
    '/api/stripe-session?session_id=',
    "payload.payment_status !== 'paid'",
    "payload.reconciliation_status !== 'reconciled'",
    "window.history.replaceState(null, '', window.location.pathname)",
    '<link rel="canonical" href="https://a7laundry.com/guest-payment-confirmation">',
    'https://wa.me/14076708839'
  ]) {
    assert.ok(page.includes(requiredToken), `confirmation page is missing ${requiredToken}`);
  }
  for (const forbiddenToken of ['a7_verified_purchase_', "gtag('event', 'purchase'", "fbq('track', 'Purchase'", 'transaction_id: session.id']) {
    assert.equal(page.includes(forbiddenToken), false, `confirmation page must not contain ${forbiddenToken}`);
  }
  assert.equal(/fbq\(['"]init['"]/.test(page), false);

  const tracking = fs.readFileSync(path.join(root, 'a7-tracking.js'), 'utf8');
  assert.match(tracking, /guest-payment-confirmation[\s\S]+ignore_referrer: true/);

  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.deepEqual(vercel.redirects.find((route) => route.source === '/blog/laundry-lake-buena-vista.html'), {
    source: '/blog/laundry-lake-buena-vista.html',
    destination: '/blog/laundry-lake-buena-vista',
    permanent: true
  });

  console.log('Stripe guest payment confirmation security tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  if (typeof originalStripeSecretKey === 'undefined') delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
  originalOperationalStore
    ? globalThis.__A7_OPERATIONAL_STORE__ = originalOperationalStore
    : delete globalThis.__A7_OPERATIONAL_STORE__;
}
