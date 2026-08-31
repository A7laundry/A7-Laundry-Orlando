import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../lib/system-auth.js');
const { MemoryOperationalStore, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const { systemOrderService } = require('../lib/system-order-service.js');
const { customerReference } = require('../lib/system-customer-service.js');
const ordersApi = require('../api/system/orders.js');

const OWNER = { actor_id:'actor_w3_owner', display_name:'Owner W3', role:'owner' };
const OPERATOR = { actor_id:'actor_w3_operator', display_name:'Operator W3', role:'operator' };
const ENV = { A7_SYSTEM_SESSION_SECRET:'w3-a-local-session-secret-at-least-32-bytes' };

function seedCustomer(store, values = {}) {
  const customerId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  const now = '2026-08-30T12:00:00.000Z';
  store.customers.set(customerId, {
    id:customerId, unit_key:'orlando', wa_id:values.phone || '14075550199',
    profile_name:values.name || 'Known Guest', email:null, created_at:now, updated_at:now
  });
  store.leads.set(leadId, {
    id:leadId, customer_id:customerId, status:'order_accepted', language:values.language || 'pt',
    customer_type:'guest', accommodation_type:'hotel',
    operational_data:{ property:values.property || 'Prior Hotel' }, created_at:now, updated_at:now
  });
  store.orders.set(orderId, {
    id:orderId, lead_id:leadId, customer_id:customerId, order_number:values.order_number || 'MCO 2001',
    order_status:values.cancelled ? 'cancelled' : 'delivered', payment_status:'paid', service_tier:'normal',
    customer_type:'guest', service_type:'wash_fold_guest', accepted_at:now,
    attribution_snapshot:null, is_qa:Boolean(values.is_qa), version:1
  });
  return { customerId, leadId, orderId, customer:store.customers.get(customerId) };
}

function payload(customerRef, submissionId = crypto.randomUUID()) {
  return {
    submission_id:submissionId,
    customer_ref:customerRef,
    name:'Browser-supplied name must be ignored',
    whatsapp_number:'19999999999',
    language:'pt', customer_type:'guest', accommodation_type:'hotel',
    property:'Current Hotel', property_address:'', room:'1204',
    location_notes:'Bell Services', pickup_location:'bell_services', bags_expected:2,
    care_options:[], service_tier:'normal',
    pickup_window_start:'2026-08-30T15:00:00.000Z',
    pickup_window_end:'2026-08-30T16:00:00.000Z',
    needed_by:'2026-08-31T15:00:00.000Z', order_notes:'Return customer', lead_reference:'',
    items:[{ code:'wash_fold', estimated_lbs:14 }]
  };
}

function response() {
  return {
    statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test('W3-A reuses protected customer identity and creates new repeat lead/order without contact mutation', async () => {
  const store = new MemoryOperationalStore();
  const seeded = seedCustomer(store);
  const before = structuredClone(seeded.customer);
  const reference = customerReference(seeded.customerId, ENV);
  const orders = systemOrderService({ operationalStore:store, env:ENV });
  const request = payload(reference);
  const result = await orders.createKnownCustomerOrder(request, OWNER);
  assert.equal(result.duplicate, false);
  assert.equal(result.customer_reused, true);
  assert.equal(result.is_repeat_customer, true);
  assert.equal(result.customer_name, 'Known Guest');
  assert.match(result.order_number, /^MCO \d+$/);
  assert.deepEqual(store.customers.get(seeded.customerId), before);
  assert.equal(store.customers.size, 1);
  assert.equal(store.orders.size, 2);
  const created = [...store.orders.values()].find((row) => row.order_number === result.order_number);
  assert.equal(created.customer_id, seeded.customerId);
  assert.notEqual(created.lead_id, seeded.leadId);
  assert.notEqual(created.id, seeded.orderId);
  assert.equal(created.is_repeat_customer, true);
  assert.equal(created.attribution_confidence, 'partial');
  const lead = store.leads.get(created.lead_id);
  assert.equal(lead.operational_data.property, 'Current Hotel');
  assert.equal(lead.attribution_resolution, 'prior_customer');
  assert.equal(store.operatorAudit.get(request.submission_id).action, 'known_customer_order_created');
  assert.equal(store.customers.get(seeded.customerId).profile_name, 'Known Guest');
  assert.equal(store.customers.get(seeded.customerId).wa_id, '14075550199');
});

test('W3-A retry is stable and conflicting customer reuse fails closed', async () => {
  const store = new MemoryOperationalStore();
  const first = seedCustomer(store, { order_number:'MCO 2002' });
  const second = seedCustomer(store, { order_number:'MCO 2003', phone:'14075550200', name:'Other Guest' });
  const orders = systemOrderService({ operationalStore:store, env:ENV });
  const submissionId = crypto.randomUUID();
  const firstPayload = payload(customerReference(first.customerId, ENV), submissionId);
  const created = await orders.createKnownCustomerOrder(firstPayload, OWNER);
  const retry = await orders.createKnownCustomerOrder(firstPayload, OWNER);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.order_number, created.order_number);
  assert.equal(store.orders.size, 3);
  await assert.rejects(() => orders.createKnownCustomerOrder(
    payload(customerReference(second.customerId, ENV), submissionId), OWNER
  ), /Idempotency key conflicts/);
  assert.equal(store.orders.size, 3);
});

test('W3-A is Owner-only and rejects a customer without prior real history', async () => {
  const store = new MemoryOperationalStore();
  const real = seedCustomer(store, { order_number:'MCO 2004' });
  const qa = seedCustomer(store, { order_number:'MCO 2005', phone:'14075550201', is_qa:true });
  const orders = systemOrderService({ operationalStore:store, env:ENV });
  await assert.rejects(() => orders.createKnownCustomerOrder(
    payload(customerReference(real.customerId, ENV)), OPERATOR
  ), /Owner authorization/);
  await assert.rejects(() => orders.createKnownCustomerOrder(
    payload(customerReference(qa.customerId, ENV)), OWNER
  ), /prior real order history/);
});

test('W3-A API returns 403 to Operator and accepts Owner reuse only through private POST', async () => {
  const prior = {
    secret:process.env.A7_SYSTEM_SESSION_SECRET,
    mode:process.env.A7_SYSTEM_ACCESS_MODE,
    node:process.env.NODE_ENV
  };
  process.env.A7_SYSTEM_SESSION_SECRET = ENV.A7_SYSTEM_SESSION_SECRET;
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  process.env.NODE_ENV = 'test';
  const store = new MemoryOperationalStore();
  const seeded = seedCustomer(store, { order_number:'MCO 2006' });
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  const ref = customerReference(seeded.customerId, ENV);
  try {
    const submission = auth.issueSubmission(process.env);
    const cookie = (actor) => [
      `${auth.COOKIE_NAME}=${encodeURIComponent(auth.signSession(actor, process.env))}`,
      `${auth.SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}`
    ].join('; ');
    const unauthenticated = response();
    await ordersApi({ method:'POST', headers:{ origin:'http://localhost:3000' }, body:payload(ref) }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);
    const wrongOrigin = response();
    await ordersApi({ method:'POST', headers:{ cookie:cookie(OWNER), origin:'https://evil.example' },
      body:payload(ref) }, wrongOrigin);
    assert.equal(wrongOrigin.statusCode, 403);
    assert.equal(store.orders.size, 1);
    const operatorRes = response();
    await ordersApi({ method:'POST', headers:{ cookie:cookie(OPERATOR), origin:'http://localhost:3000' },
      body:payload(ref, submission.id) }, operatorRes);
    assert.equal(operatorRes.statusCode, 403);
    assert.equal(store.orders.size, 1);

    const ownerRes = response();
    await ordersApi({ method:'POST', headers:{ cookie:cookie(OWNER), origin:'http://localhost:3000' },
      body:payload(ref, submission.id) }, ownerRes);
    assert.equal(ownerRes.statusCode, 201);
    assert.equal(ownerRes.payload.order.customer_reused, true);
    assert.equal(ownerRes.payload.order.is_repeat_customer, true);
    assert.equal(store.orders.size, 2);
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({
      A7_SYSTEM_SESSION_SECRET:prior.secret, A7_SYSTEM_ACCESS_MODE:prior.mode, NODE_ENV:prior.node
    })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W3-A static contract keeps the opaque reference in POST memory and preserves external systems', () => {
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830070000_orlando_os_w3_a_known_customer_order.sql', import.meta.url), 'utf8');
  assert.match(js, /Novo pedido para este cliente/);
  assert.match(js, /payload\.customer_ref = activeCustomerRef/);
  assert.doesNotMatch(`${js}\n${html}`, /localStorage|sessionStorage|dataLayer|googletagmanager/i);
  assert.doesNotMatch(js, /customer_ref.*(?:location|URLSearchParams)|(?:location|URLSearchParams).*customer_ref/i);
  assert.doesNotMatch(migration, /update\s+public\.a7_wa_contacts|delete\s+from\s+public\.a7_wa_contacts/i);
  assert.doesNotMatch(`${js}\n${migration}`, /graph\.facebook|stripe|google ads|whatsapp_bridge_token/i);
});
