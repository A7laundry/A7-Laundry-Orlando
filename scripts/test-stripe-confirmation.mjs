import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(import.meta.url);
const stripeSessionHandler = require(path.join(root, 'api/stripe-session.js'));
const originalFetch = globalThis.fetch;
const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

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
    "session.payment_status !== 'paid'",
    'a7_verified_purchase_',
    "send_to: 'AW-17146169189/dkpRCJyC19YcEOWO9-8_'",
    'transaction_id: session.id',
    "window.history.replaceState(null, '', window.location.pathname)",
    'https://wa.me/14076708839'
  ]) {
    assert.ok(page.includes(requiredToken), `confirmation page is missing ${requiredToken}`);
  }
  assert.equal(/fbq\(['"]init['"]/.test(page), false);

  console.log('Stripe guest payment confirmation security tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  if (typeof originalStripeSecretKey === 'undefined') delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
}
