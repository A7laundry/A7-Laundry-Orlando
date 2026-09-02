import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../lib/system-auth.js');
const { MemoryOperationalStore, SupabaseOperationalStore } = require('../lib/operational-store.js');
const { systemOrderService, normalizeOrderNumber } = require('../lib/system-order-service.js');
const {
  systemCustomerService, normalizeCustomerSearch, customerIdFromReference
} = require('../lib/system-customer-service.js');
const { publicCatalog } = require('../lib/system-catalog.js');
const ordersApi = require('../api/system/orders.js');
const orderDraftApi = require('../api/system/order-draft.js');
const pickupOrderApi = require('../api/system/pickup-order.js');
const customersApi = require('../api/system/customers.js');
const { supabaseHeaders } = require('../lib/supabase-headers.js');
const { allowedOrigin } = require('../lib/system-http.js');
const orderFixture = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/orlando-os-w1a-order.json', import.meta.url), 'utf8'));

function authEnv(password = 'valid-password') {
  const salt = crypto.randomBytes(18).toString('base64url');
  return {
    A7_SYSTEM_SESSION_SECRET: crypto.randomBytes(48).toString('base64url'),
    A7_SYSTEM_USERS_JSON: JSON.stringify([{
      email: 'owner@example.test', display_name: 'Owner QA', role: 'owner',
      password_salt: salt, password_hash: auth.passwordHash(password, salt)
    }])
  };
}

function input(id = crypto.randomUUID()) {
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(start.getTime() + 60 * 60_000);
  const needed = new Date(start.getTime() + 24 * 60 * 60_000);
  return {
    ...structuredClone(orderFixture),
    submission_id: id,
    pickup_window_start: start.toISOString(), pickup_window_end: end.toISOString(),
    needed_by: needed.toISOString()
  };
}

function response() {
  return {
    headers: {}, statusCode: 0, payload: null,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

test('W0 authenticates known users, signs expiry-bound sessions and rejects tampering', () => {
  const env = authEnv();
  const actor = auth.authenticate('OWNER@example.test', 'valid-password', env);
  assert.deepEqual({ name: actor.display_name, role: actor.role }, { name: 'Owner QA', role: 'owner' });
  assert.equal(auth.authenticate('owner@example.test', 'wrong', env), null);
  const token = auth.signSession(actor, env, 1000);
  assert.equal(auth.verifySession(token, env, 2000).role, 'owner');
  assert.equal(auth.verifySession(`${token}x`, env, 2000), null);
  assert.equal(auth.verifySession(token, env, 1000 + (auth.SESSION_SECONDS + 1) * 1000), null);
  assert.match(auth.sessionCookie(token), /HttpOnly; Secure; SameSite=Strict/);
  const submission = auth.issueSubmission(env, 1000);
  const submissionReq = { headers: { cookie: auth.submissionCookie(submission.token).split(';')[0] } };
  assert.equal(auth.submissionFromRequest(submissionReq, env, 2000), submission.id);
  assert.equal(auth.submissionFromRequest(submissionReq, env, 1000 + (auth.SUBMISSION_SECONDS + 1) * 1000), null);
  assert.match(auth.submissionCookie(submission.token), /HttpOnly; Secure; SameSite=Strict/);
});

test('Production pilot fails closed to Owner-only access', () => {
  const salt = 'operator-salt';
  const env = {
    NODE_ENV: 'production',
    A7_SYSTEM_ACCESS_MODE: 'owner_only',
    A7_SYSTEM_SESSION_SECRET: 'production-owner-only-session-secret-123456789',
    A7_SYSTEM_USERS_JSON: JSON.stringify([
      {
        email: 'owner@example.test', display_name: 'Owner', role: 'owner',
        password_salt: salt, password_hash: auth.passwordHash('owner-password', salt)
      },
      {
        email: 'operator@example.test', display_name: 'Operator', role: 'operator',
        password_salt: salt, password_hash: auth.passwordHash('operator-password', salt)
      }
    ])
  };
  assert.equal(auth.authenticate('owner@example.test', 'owner-password', env)?.role, 'owner');
  assert.equal(auth.authenticate('operator@example.test', 'operator-password', env), null);
  const operatorToken = auth.signSession(
    { actor_id: 'actor_operator', display_name: 'Operator', role: 'operator' }, env
  );
  assert.equal(auth.verifySession(operatorToken, env), null);
  assert.equal(auth.accessMode({ NODE_ENV: 'production' }), 'owner_only');
});

test('Team access adds operators without replacing the protected Owner credential', () => {
  const ownerSalt = 'owner-salt';
  const operatorSalt = 'operator-salt';
  const env = {
    NODE_ENV: 'production',
    A7_SYSTEM_ACCESS_MODE: 'team',
    A7_SYSTEM_SESSION_SECRET: 'production-team-session-secret-123456789012345',
    A7_SYSTEM_USERS_JSON: JSON.stringify([{
      email: 'owner@example.test', display_name: 'Owner', role: 'owner',
      password_salt: ownerSalt, password_hash: auth.passwordHash('owner-password', ownerSalt)
    }]),
    A7_SYSTEM_TEAM_USERS_JSON: JSON.stringify([{
      email: 'operator@example.test', display_name: 'Operator', role: 'operator',
      password_salt: operatorSalt, password_hash: auth.passwordHash('operator-password', operatorSalt)
    }])
  };
  assert.equal(auth.authenticate('owner@example.test', 'owner-password', env)?.role, 'owner');
  assert.equal(auth.authenticate('operator@example.test', 'operator-password', env)?.role, 'operator');
  assert.equal(auth.usersFromEnv(env).length, 2);
});

test('W0 sends new Supabase secret keys only through apikey', () => {
  assert.deepEqual(supabaseHeaders('sb_secret_preview'), { apikey: 'sb_secret_preview' });
  assert.deepEqual(supabaseHeaders('legacy-service-role-jwt'), {
    apikey: 'legacy-service-role-jwt', Authorization: 'Bearer legacy-service-role-jwt'
  });
});

test('W0 permits loopback development ports without widening Production origins', () => {
  assert.equal(allowedOrigin({ headers: { origin: 'http://127.0.0.1:3001' } }, { NODE_ENV: 'development' }), true);
  assert.equal(allowedOrigin({ headers: { origin: 'http://localhost:4173' } }, { NODE_ENV: 'development' }), true);
  assert.equal(allowedOrigin({ headers: { origin: 'http://127.0.0.1:3001' } }, { NODE_ENV: 'production' }), false);
  assert.equal(allowedOrigin({ headers: { origin: 'https://a7laundry.com' } }, { NODE_ENV: 'production' }), true);
});

test('W0 operational storage applies the sb_secret transport contract', async () => {
  const seen = [];
  const store = new SupabaseOperationalStore({
    url: 'https://preview.example.test', serviceRoleKey: 'sb_secret_preview',
    async fetch(_url, options) {
      seen.push(options.headers);
      return { ok: true, async json() { return []; } };
    }
  });
  assert.equal(await store.systemHealth(), true);
  assert.equal(seen.length, 2);
  for (const headers of seen) {
    assert.equal(headers.apikey, 'sb_secret_preview');
    assert.equal('Authorization' in headers, false);
  }
});

test('private orders endpoint rejects a request without a server session', async () => {
  const req = { method: 'GET', headers: {}, query: { order_number: 'A7-ORL-1000' } };
  const res = response();
  await ordersApi(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.code, 'unauthorized');
  assert.match(res.headers['cache-control'], /no-store/);
});

test('W0 keeps the order idempotency identifier in a signed HttpOnly cookie', async () => {
  const env = authEnv();
  const previous = {
    A7_SYSTEM_SESSION_SECRET: process.env.A7_SYSTEM_SESSION_SECRET,
    A7_SYSTEM_USERS_JSON: process.env.A7_SYSTEM_USERS_JSON
  };
  Object.assign(process.env, env);
  try {
    const actor = auth.authenticate('owner@example.test', 'valid-password', env);
    const session = auth.sessionCookie(auth.signSession(actor, env)).split(';')[0];
    const req = { method: 'POST', headers: { cookie: session, origin: 'http://localhost:3000' } };
    const res = response();
    await orderDraftApi(req, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.payload, { ok: true });
    assert.match(String(res.headers['set-cookie']), /__Host-a7_system_submission=.*HttpOnly/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W1A creates exactly one governed aggregate and reopens it safely', async () => {
  const store = new MemoryOperationalStore();
  const service = systemOrderService({ operationalStore: store, attributionStore: { async get() { return null; }, async getByShortRef() { return null; } } });
  const payload = input();
  const actor = { actor_id: 'actor_preview_qa', role: 'operator' };
  const first = await service.createManualOrder(payload, actor);
  const retry = await service.createManualOrder(payload, actor);
  assert.equal(first.order_number, 'MCO 1002');
  assert.equal(retry.order_number, first.order_number);
  assert.equal(retry.duplicate, true);
  assert.equal(store.customers.size, 1);
  assert.equal(store.leads.size, 1);
  assert.equal(store.orders.size, 1);
  assert.equal(store.orderItems.get([...store.orders.keys()][0]).length, 2);
  assert.equal(store.events.size, 3);
  const reopened = await service.getByOrderNumber(first.order_number);
  assert.equal(reopened.customer_name, 'Customer QA');
  assert.equal(reopened.property, 'Preview Test Hotel');
  assert.equal(reopened.items.length, 2);
  assert.equal('order_id' in reopened, false);
  assert.equal('lead_id' in reopened, false);
});

test('W1A.1 lookup accepts the human number directly and preserves canonical identity', async () => {
  assert.equal(normalizeOrderNumber('1002'), 'MCO 1002');
  assert.equal(normalizeOrderNumber('mco1002'), 'MCO 1002');
  assert.equal(normalizeOrderNumber('MCO-1002'), 'MCO 1002');
  assert.equal(normalizeOrderNumber(' MCO 1002 '), 'MCO 1002');
  assert.equal(normalizeOrderNumber('A7-ORL-1000'), 'A7-ORL-1000');
  assert.equal(normalizeOrderNumber('1002 extra'), null);
  assert.equal(normalizeOrderNumber('12'), null);

  const store = new MemoryOperationalStore();
  const service = systemOrderService({
    operationalStore: store,
    attributionStore: { async get() { return null; }, async getByShortRef() { return null; } }
  });
  await service.createManualOrder(input(), { actor_id: 'actor_owner', role: 'owner' });
  for (const value of ['1002', 'mco1002', 'MCO-1002', 'MCO 1002']) {
    const reopened = await service.getByOrderNumber(value);
    assert.equal(reopened.order_number, 'MCO 1002');
  }
});

test('W1A.2 browser lookup keeps a stable form reference across the asynchronous request', () => {
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  assert.match(js, /const form = event\.currentTarget;[\s\S]{0,180}new FormData\(form\)/);
  assert.match(js, /form\.elements\.order_number\.value = result\.order\.order_number/);
  assert.doesNotMatch(js, /event\.currentTarget\.elements\.order_number/);
});

test('W1A.3 normalizes bounded customer search and fails closed for short input', () => {
  assert.deepEqual(normalizeCustomerSearch('Dennis'), { mode: 'name', query: 'Dennis' });
  assert.deepEqual(normalizeCustomerSearch('8839'), { mode: 'phone_last4', query: '8839' });
  assert.deepEqual(normalizeCustomerSearch('(8839)'), { mode: 'phone_last4', query: '8839' });
  assert.deepEqual(normalizeCustomerSearch('+1 407 670 8839'), { mode: 'phone', query: '14076708839' });
  assert.deepEqual(normalizeCustomerSearch('Guest@Example.COM'), { mode: 'email', query: 'guest@example.com' });
  assert.deepEqual(normalizeCustomerSearch('mco-1002'), { mode: 'order_number', query: 'MCO 1002' });
  assert.deepEqual(normalizeCustomerSearch('A7-ORL-1000'), { mode: 'order_number', query: 'A7-ORL-1000' });
  assert.throws(() => normalizeCustomerSearch('De'), /at least 3 name characters/);
  assert.throws(() => normalizeCustomerSearch('123'), /exactly the last 4/);
  assert.throws(() => normalizeCustomerSearch('broken@example'), /valid customer email/);
});

test('W1A.3 searches customers by name, phone, email or related order and returns safe references', async () => {
  const store = new MemoryOperationalStore();
  const env = { A7_SYSTEM_SESSION_SECRET: 'customer-lite-test-session-secret-at-least-32-bytes' };
  const orderService = systemOrderService({ operationalStore: store });
  const first = input();
  first.name = 'Dennis Customer'; first.whatsapp_number = '14076708839';
  await orderService.createManualOrder(first, { actor_id: 'actor_owner', role: 'owner' });
  const dennis = [...store.customers.values()].find((row) => row.wa_id === '14076708839');
  dennis.email = 'dennis@example.com';
  const second = input();
  second.name = 'Maria Guest'; second.whatsapp_number = '14075550123';
  await orderService.createManualOrder(second, { actor_id: 'actor_owner', role: 'owner' });

  const service = systemCustomerService({ operationalStore: store, env });
  const byName = await service.search('Dennis');
  const byPhone = await service.search('8839');
  const byFullPhone = await service.search('+1 407 670 8839');
  const byEmail = await service.search('DENNIS@example.com');
  const byOrder = await service.search('MCO 1002');
  assert.equal(byName.length, 1);
  assert.equal(byPhone.length, 1);
  assert.equal(byFullPhone.length, 1);
  assert.equal(byEmail.length, 1);
  assert.equal(byOrder.length, 1);
  assert.equal(byName[0].name, 'Dennis Customer');
  assert.equal(byName[0].whatsapp_last4, '8839');
  assert.match(byName[0].customer_ref, /^cust_[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(byName[0].customer_ref, /^[0-9a-f-]{36}$/i);
  assert.equal(customerIdFromReference(byName[0].customer_ref, env), [...store.customers.values()][0].id);
});

test('W1A.3 keeps conflicting email records separate instead of auto-merging', async () => {
  const store = new MemoryOperationalStore();
  const env = { A7_SYSTEM_SESSION_SECRET: 'customer-lite-conflict-session-secret-at-least-32-bytes' };
  const orders = systemOrderService({ operationalStore: store });
  const first = input();
  first.name = 'Conflict One'; first.whatsapp_number = '14075550111'; first.order_notes = 'Real order';
  const second = input();
  second.name = 'Conflict Two'; second.whatsapp_number = '14075550222'; second.order_notes = 'Real order';
  await orders.createManualOrder(first, { actor_id: 'actor_owner', role: 'owner' });
  await orders.createManualOrder(second, { actor_id: 'actor_owner', role: 'owner' });
  for (const customer of store.customers.values()) customer.email = 'shared@example.com';
  const matches = await systemCustomerService({ operationalStore: store, env }).search('shared@example.com');
  assert.equal(matches.length, 2);
  assert.equal(store.customers.size, 2);
});

test('W1A.3 customer detail exposes operational context without internal IDs', async () => {
  const store = new MemoryOperationalStore();
  const env = { A7_SYSTEM_SESSION_SECRET: 'customer-lite-detail-session-secret-at-least-32-bytes' };
  const orderService = systemOrderService({ operationalStore: store });
  const payload = input();
  payload.name = 'Returning Guest'; payload.whatsapp_number = '14075559876';
  await orderService.createManualOrder(payload, { actor_id: 'actor_owner', role: 'owner' });
  const service = systemCustomerService({ operationalStore: store, env });
  const [match] = await service.search('Returning');
  const detail = await service.getByReference(match.customer_ref);
  assert.equal(detail.name, 'Returning Guest');
  assert.equal(detail.whatsapp_number, '14075559876');
  assert.equal(detail.latest_property, 'Preview Test Hotel');
  assert.equal(detail.orders[0].order_number, 'MCO 1002');
  assert.equal(detail.orders[0].pickup_order_path, '/sistema/orders/MCO%201002/pickup-order');
  assert.doesNotMatch(JSON.stringify(detail), /customer_id|lead_id|order_id|attribution_id/i);
});

test('W1A.3 derives commercial history and confirmed net service revenue without QA, tip, pending or cancelled values', async () => {
  const store = new MemoryOperationalStore();
  const env = { A7_SYSTEM_SESSION_SECRET: 'customer-lite-revenue-session-secret-at-least-32-bytes' };
  const orderService = systemOrderService({ operationalStore: store });
  const create = async (notes) => {
    const payload = input();
    payload.name = 'Real Returning Guest'; payload.whatsapp_number = '14075551234';
    payload.property = 'Real Hotel'; payload.location_notes = 'Bell desk'; payload.order_notes = notes;
    return orderService.createManualOrder(payload, { actor_id: 'actor_owner', role: 'owner' });
  };
  await create('First real order');
  await create('Second real order');
  await create('DO NOT FULFILL QA');
  await create('Cancelled real order');
  await create('Pending real order');
  const rows = [...store.orders.values()].sort((a, b) => a.order_number.localeCompare(b.order_number));
  rows[0].order_number = 'A7-ORL-1000';
  rows[0].service_amount = 84; rows[0].tip_amount = 20; rows[0].payment_status = 'paid'; rows[0].order_status = 'delivered';
  rows[0].attribution_snapshot = { confidence: 'deterministic', first_touch: { source: 'google', medium: 'cpc' } };
  rows[1].service_amount = 74; rows[1].tip_amount = 12; rows[1].payment_status = 'partially_refunded'; rows[1].order_status = 'delivered';
  rows[2].service_amount = 500; rows[2].payment_status = 'paid'; rows[2].order_status = 'delivered';
  rows[3].service_amount = 300; rows[3].payment_status = 'paid'; rows[3].order_status = 'cancelled';
  rows[4].service_amount = 200; rows[4].payment_status = 'pending'; rows[4].order_status = 'accepted';
  store.payments.set('pi_customer_1', { transaction_id: 'pi_customer_1', order_id: rows[0].id, status: 'paid', refund_total: 0 });
  store.payments.set('pi_customer_2', { transaction_id: 'pi_customer_2', order_id: rows[1].id, status: 'partially_refunded', refund_total: 10 });
  store.payments.set('pi_customer_qa', { transaction_id: 'pi_customer_qa', order_id: rows[2].id, status: 'paid', refund_total: 0 });
  store.payments.set('pi_customer_cancelled', { transaction_id: 'pi_customer_cancelled', order_id: rows[3].id, status: 'paid', refund_total: 0 });
  const service = systemCustomerService({ operationalStore: store, env });
  const [match] = await service.search('Real Returning');
  const detail = await service.getByReference(match.customer_ref);
  assert.equal(detail.summary.order_count, 3);
  assert.equal(detail.summary.confirmed_service_revenue, 148);
  assert.equal(detail.summary.acquisition_source, 'google / cpc');
  assert.equal(detail.orders.length, 5);
  assert.equal(detail.orders.find((row) => row.order_number === 'A7-ORL-1000').confirmed_service_revenue, 84);
  assert.equal(detail.orders.find((row) => row.is_qa).confirmed_service_revenue, null);
  assert.equal(detail.orders.find((row) => row.order_status === 'cancelled').confirmed_service_revenue, null);
  assert.equal(detail.orders.find((row) => row.payment_status === 'pending').confirmed_service_revenue, null);
});

test('W1A.3 customer API is private, POST-only and keeps search data out of URLs', async () => {
  const unauthorized = response();
  await customersApi({ method: 'POST', headers: {}, body: { action: 'search', query: 'Guest' } }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);

  const env = authEnv();
  const previous = {
    A7_SYSTEM_SESSION_SECRET: process.env.A7_SYSTEM_SESSION_SECRET,
    A7_SYSTEM_USERS_JSON: process.env.A7_SYSTEM_USERS_JSON
  };
  Object.assign(process.env, env);
  const store = new MemoryOperationalStore();
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  try {
    await systemOrderService({ operationalStore: store }).createManualOrder(
      input(), { actor_id: 'actor_owner', role: 'owner' }
    );
    const actor = auth.authenticate('owner@example.test', 'valid-password', env);
    const cookie = auth.sessionCookie(auth.signSession(actor, env)).split(';')[0];
    const getResponse = response();
    await customersApi({ method: 'GET', headers: { cookie }, query: { query: 'Customer QA' } }, getResponse);
    assert.equal(getResponse.statusCode, 405);

    const searchResponse = response();
    await customersApi({ method: 'POST', headers: { cookie, origin: 'http://localhost:3000' }, body: {
      action: 'search', query: 'Customer QA'
    } }, searchResponse);
    assert.equal(searchResponse.statusCode, 200);
    assert.equal(searchResponse.payload.customers.length, 1);
    assert.match(searchResponse.headers['cache-control'], /no-store/);
    assert.doesNotMatch(JSON.stringify(searchResponse.payload), /customer_id|whatsapp_number/);

    const operatorCookie = auth.sessionCookie(auth.signSession({
      actor_id: 'actor_operator', display_name: 'Operator', role: 'operator'
    }, env)).split(';')[0];
    const forbidden = response();
    await customersApi({ method: 'POST', headers: {
      cookie: operatorCookie, origin: 'http://localhost:3000'
    }, body: { action: 'search', query: 'Customer QA' } }, forbidden);
    assert.equal(forbidden.statusCode, 403);
  } finally {
    delete globalThis.__A7_OPERATIONAL_STORE__;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W1A.3 Supabase customer reads use RPC POST bodies instead of PII query strings', async () => {
  const seen = [];
  const store = new SupabaseOperationalStore({
    url: 'https://preview.example.test', serviceRoleKey: 'sb_secret_preview',
    async fetch(url, options) {
      seen.push({ url, options });
      return { ok: true, async json() { return []; } };
    }
  });
  await store.searchSystemCustomers({ mode: 'name', query: 'Customer QA', limit: 12 });
  await store.getSystemCustomerById('11111111-1111-4111-8111-111111111111');
  assert.equal(seen.length, 2);
  assert.match(seen[0].url, /\/rpc\/a7_orlando_search_customers_lite$/);
  assert.match(seen[1].url, /\/rpc\/a7_orlando_get_customer_lite$/);
  assert.doesNotMatch(seen[0].url, /Customer(?:%20|\s)QA|[?&]query=/i);
  assert.equal(seen[0].options.method, 'POST');
  assert.equal(JSON.parse(seen[0].options.body).p_query, 'Customer QA');
});

test('W1A.3 UI and migration preserve the private no-analytics boundary', () => {
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const cli = fs.readFileSync(new URL('../scripts/a7-system-customers.mjs', import.meta.url), 'utf8');
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830030000_orlando_os_customers_lite.sql', import.meta.url), 'utf8');
  assert.match(html, /id="customersView"/);
  assert.match(html, /Nome, telefone, email ou MCO 1002/);
  assert.match(js, /method: 'POST', body: JSON\.stringify\(\{ action: 'search', query \}\)/);
  assert.match(js, /value \?\? 'Não informado'/, 'zero-valued customer aggregates must remain visible');
  assert.doesNotMatch(`${html}\n${js}`, /localStorage|sessionStorage|[?&]customer(?:_id|_ref)?=/i);
  assert.doesNotMatch(`${html}\n${js}`, /a7-tracking|googletagmanager/);
  assert.match(cli, /actorRole !== 'owner'/);
  assert.match(migration, /security definer set search_path = public/);
  assert.match(migration, /a7_orlando_order_confirmed_service_revenue/);
  assert.match(migration, /DO NOT FULFILL\|DO NOT DISPATCH/);
  assert.match(migration, /o\.service_amount - coalesce\(p\.refund_total, 0\)/);
  assert.doesNotMatch(migration, /tip_amount/);
  assert.match(migration, /revoke all on function public\.a7_orlando_search_customers_lite/);
  assert.match(migration, /grant execute on function public\.a7_orlando_get_customer_lite\(uuid\) to service_role/);
});

test('W1A.1 assigns consecutive MCO numbers, preserves historical QA and is concurrency-safe', async () => {
  const store = new MemoryOperationalStore();
  store.orderSequence = 1000;
  const historicalId = crypto.randomUUID();
  store.orders.set(historicalId, { id: historicalId, order_number: 'A7-ORL-1000' });
  const service = systemOrderService({
    operationalStore: store,
    attributionStore: { async get() { return null; }, async getByShortRef() { return null; } }
  });
  const [first, second] = await Promise.all([
    service.createManualOrder(input(), { actor_id: 'actor_owner', role: 'owner' }),
    service.createManualOrder(input(), { actor_id: 'actor_owner', role: 'owner' })
  ]);
  assert.deepEqual(new Set([first.order_number, second.order_number]), new Set(['MCO 1002', 'MCO 1003']));
  assert.equal(store.orders.get(historicalId).order_number, 'A7-ORL-1000');
  assert.equal(new Set([...store.orders.values()].map((row) => row.order_number)).size, 3);
});

test('W1A rejects semantic idempotency collisions and operator price injection', async () => {
  const store = new MemoryOperationalStore();
  const service = systemOrderService({ operationalStore: store, attributionStore: { async get() { return null; }, async getByShortRef() { return null; } } });
  const payload = input();
  const actor = { actor_id: 'actor_preview_qa', role: 'operator' };
  await service.createManualOrder(payload, actor);
  await assert.rejects(() => service.createManualOrder({ ...payload, property: 'Different hotel' }, actor), /Idempotency key conflicts/);
  const injected = input();
  injected.items[0].unit_price = 0.01;
  const created = await systemOrderService({ operationalStore: new MemoryOperationalStore(), attributionStore: { async get() { return null; }, async getByShortRef() { return null; } } }).createManualOrder(injected, actor);
  assert.equal(created.items[0].unit_price, 3.95);
  assert.equal(created.items[0].minimum_amount, 50);
});

test('W1A freezes the approved sale-time minimum without accepting arbitrary values', async () => {
  const store = new MemoryOperationalStore();
  const service = systemOrderService({ operationalStore:store,
    attributionStore:{ async get() { return null; }, async getByShortRef() { return null; } } });
  const payload = { ...input(), agreed_minimum_amount:60 };
  const created = await service.createManualOrder(payload, { actor_id:'actor_owner', role:'owner' });
  assert.equal(created.items.find((item) => item.unit === 'lb').minimum_amount, 60);
  await assert.rejects(() => service.createManualOrder({ ...input(), agreed_minimum_amount:55 },
    { actor_id:'actor_owner', role:'owner' }), /approved sale-time value/);
});

test('catalog and operator shell preserve governed pricing and browser boundary', () => {
  const catalog = publicCatalog();
  assert.equal(catalog.services.find((row) => row.code === 'wash_fold_normal').unit_price, 3.25);
  assert.equal(catalog.services.find((row) => row.code === 'wash_fold_express').unit_price, 3.95);
  assert.equal(catalog.services.find((row) => row.code === 'wash_fold_normal').minimum_amount, 50);
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.doesNotMatch(html, /a7-tracking|googletagmanager|localStorage|sessionStorage/);
  assert.doesNotMatch(`${html}\n${js}`, /OPERATIONS_API_TOKEN|SUPABASE_SERVICE_ROLE|STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(html, /name="(?:order_id|lead_id|customer_id|attribution_id|idempotency_key)"/);
  assert.doesNotMatch(js, /submission_id|idempotency_key|analytics_context|crypto\.randomUUID/);
});

test('operator shell uses the governed official A7 logo in login and authenticated header', () => {
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../sistema.css', import.meta.url), 'utf8');
  const build = fs.readFileSync(new URL('../scripts/build-site.mjs', import.meta.url), 'utf8');
  const logoRelativePath = 'assets/system/invoice/A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1.png';
  const logoUrl = `/${logoRelativePath}`;
  assert.equal((html.match(new RegExp(logoUrl, 'g')) || []).length, 2);
  assert.equal((html.match(/alt="A7 Laundry"/g) || []).length, 2);
  assert.match(css, /\.brand-logo-frame/);
  assert.match(css, /@media\(max-width:720px\)[^\n]*\.topbar \.brand>\.brand-logo-frame/);
  assert.match(build, new RegExp(logoRelativePath.replaceAll('.', '\\.')));
  assert.equal(fs.existsSync(new URL(`../${logoRelativePath}`, import.meta.url)), true);
});

test('W1A.1 Pickup Order returns the same governed order without internal IDs', async () => {
  const store = new MemoryOperationalStore();
  const service = systemOrderService({
    operationalStore: store,
    attributionStore: { async get() { return null; }, async getByShortRef() { return null; } }
  });
  const payload = input();
  const created = await service.createManualOrder(payload, { actor_id: 'actor_owner', role: 'owner' });
  const pickup = await service.getPickupOrderByNumber(created.order_number);
  assert.equal(pickup.order_number, created.order_number);
  assert.equal(pickup.customer.name, 'Customer QA');
  assert.equal(pickup.customer.whatsapp_number, '14075550199');
  assert.equal(pickup.customer.room, 'QA-12');
  assert.equal(pickup.property.name, 'Preview Test Hotel');
  assert.equal(pickup.property.address, 'QA-only address');
  assert.equal(pickup.service.tier, 'express');
  assert.equal(pickup.service.code, 'EXPRESS_8H');
  assert.equal(pickup.service.items[0].unit_price, 3.95);
  assert.equal(pickup.service.items[0].minimum_amount, 50);
  assert.equal(pickup.pickup.location, 'bell_services');
  assert.equal(pickup.pickup.bags_expected, 2);
  assert.equal(pickup.delivery.needed_by, payload.needed_by);
  assert.deepEqual(pickup.special_instructions.care_options, ['hypoallergenic', 'no_dryer']);
  assert.equal(pickup.special_instructions.customer_notes, 'Synthetic W1A test');
  const serialized = JSON.stringify(pickup);
  assert.doesNotMatch(serialized, /order_id|lead_id|customer_id|attribution|payment_total|tip_amount/);
});

test('W1A.1 Pickup Order API rejects unauthenticated access', async () => {
  const req = { method: 'GET', headers: {}, query: { order_number: 'MCO 1002' } };
  const res = response();
  await pickupOrderApi(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.code, 'unauthorized');
  assert.match(res.headers['cache-control'], /no-store/);
});

test('W1A.1 Pickup Order API allows an authenticated operator and returns only the requested document', async () => {
  const store = new MemoryOperationalStore();
  const service = systemOrderService({
    operationalStore: store,
    attributionStore: { async get() { return null; }, async getByShortRef() { return null; } }
  });
  const created = await service.createManualOrder(input(), { actor_id: 'actor_owner', role: 'owner' });
  const env = authEnv();
  const previous = {
    A7_SYSTEM_SESSION_SECRET: process.env.A7_SYSTEM_SESSION_SECRET,
    A7_SYSTEM_USERS_JSON: process.env.A7_SYSTEM_USERS_JSON
  };
  Object.assign(process.env, env);
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  try {
    const session = auth.sessionCookie(auth.signSession({
      actor_id: 'actor_operator', display_name: 'Operator QA', role: 'operator'
    }, env)).split(';')[0];
    const req = { method: 'GET', headers: { cookie: session }, query: { order_number: created.order_number } };
    const res = response();
    await pickupOrderApi(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.pickup_order.order_number, created.order_number);
    assert.equal(res.payload.pickup_order.customer.name, 'Customer QA');
    assert.doesNotMatch(JSON.stringify(res.payload), /order_id|lead_id|customer_id|attribution_id|secret|token/i);
  } finally {
    delete globalThis.__A7_OPERATIONAL_STORE__;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W1A.1 route is private, print-friendly, mobile-ready and free of analytics/secrets', () => {
  const html = fs.readFileSync(new URL('../sistema-pickup-order.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../sistema-pickup-order.css', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema-pickup-order.js', import.meta.url), 'utf8');
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830020000_orlando_os_w1a1_pickup_order.sql', import.meta.url), 'utf8');
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(css, /@media print/);
  assert.match(css, /max-width:\s*390px/);
  assert.match(js, /window\.print\(\)/);
  assert.doesNotMatch(`${html}\n${js}`, /a7-tracking|googletagmanager|localStorage|sessionStorage/);
  assert.doesNotMatch(`${html}\n${js}`, /OPERATIONS_API_TOKEN|SUPABASE_SERVICE_ROLE|STRIPE_WEBHOOK_SECRET/);
  assert.doesNotMatch(html, /tip|gratuity/i);
  assert.match(migration, /start with 1002 increment by 1 no cycle/i);
  assert.match(migration, /payment_total = service_amount \+ tip_amount/i);
  assert.match(migration, /a7_orlando_create_manual_order_v2/);
});

test('hidden login and system states are removed from layout', () => {
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../sistema-state.css', import.meta.url), 'utf8');
  assert.match(html, /href="\/sistema-state\.css"/);
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});
