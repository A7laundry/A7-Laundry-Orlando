import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MemoryOperationalStore, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const { systemMessageService, renderMessage, factsHash } = require('../lib/system-message-service.js');
const { signSession, COOKIE_NAME } = require('../lib/system-auth.js');
const messageDraftApi = require('../api/system/message-draft.js');
const orderMessagesApi = require('../api/system/order-messages.js');

const OWNER = { actor_id:'actor_test_owner', display_name:'Owner QA', role:'owner' };
const NOW = new Date('2026-08-30T14:00:00.000Z');

function addOrder(store, values = {}) {
  const customerId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  store.customers.set(customerId, {
    id:customerId, wa_id:values.phone || '14075550199', profile_name:values.customer_name || 'Test Guest'
  });
  store.leads.set(leadId, {
    id:leadId, customer_id:customerId, status:'order_accepted', language:values.language || 'en',
    accommodation_type:'hotel', operational_data:{ property:values.property || 'Private Hotel', room:'812' }
  });
  const order = {
    id:orderId, lead_id:leadId, customer_id:customerId, order_number:values.order_number || 'MCO 2101',
    order_status:values.order_status || 'accepted', payment_status:values.payment_status || 'pending',
    service_tier:values.service_tier || 'normal', custody_state:values.custody_state || 'with_customer',
    production_state:values.production_state || 'awaiting_intake', promised_by:values.promised_by || null,
    pickup_window_start:values.pickup_window_start || '2026-08-30T15:00:00.000Z',
    pickup_window_end:values.pickup_window_end || '2026-08-30T16:00:00.000Z',
    accepted_at:'2026-08-30T13:00:00.000Z', version:1, is_qa:Boolean(values.is_qa)
  };
  store.orders.set(orderId, order);
  return order;
}

function response() {
  return {
    statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test('W2-A renders governed EN/PT/ES snapshots without property, room, phone or invented amount', () => {
  const base = {
    order_number:'MCO 2101', language:'en', service_tier:'express',
    pickup_window_start:'2026-08-30T15:00:00.000Z', pickup_window_end:'2026-08-30T16:00:00.000Z',
    promised_by:'2026-08-30T19:00:00.000Z', property:'Secret Resort', room:'812', whatsapp_number:'14075550199'
  };
  const english = renderMessage(base, 'order_confirmed');
  const portuguese = renderMessage({ ...base, language:'pt' }, 'order_confirmed');
  const spanish = renderMessage({ ...base, language:'es' }, 'order_confirmed');
  assert.match(english, /order MCO 2101 is confirmed/);
  assert.match(portuguese, /pedido MCO 2101.*confirmado/);
  assert.match(spanish, /pedido MCO 2101.*confirmado/);
  for (const text of [english, portuguese, spanish]) {
    assert.doesNotMatch(text, /Secret Resort|812|14075550199|\$|invoice|payment link/i);
  }
  assert.equal(factsHash(base, 'order_confirmed').length, 64);
});

test('W2-A exposes only state-eligible templates and never the full phone', async () => {
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 2102', language:'pt' });
  const service = systemMessageService({ operationalStore:store, now:() => NOW });
  const context = await service.context('MCO 2102');
  assert.deepEqual(context.available_templates, [{ key:'order_confirmed', label:'Pedido confirmado' }]);
  assert.equal(context.whatsapp_last4, '0199');
  assert.doesNotMatch(JSON.stringify(context), /14075550199|customer_id|order_id/);
});

test('W2-A draft, approval and copy are separate, idempotent and append-only audited', async () => {
  const store = new MemoryOperationalStore();
  const order = addOrder(store, { order_number:'MCO 2103', order_status:'picked_up', custody_state:'at_laundry', production_state:'processing' });
  const service = systemMessageService({ operationalStore:store, now:() => NOW });
  const createId = crypto.randomUUID();
  const created = await service.create({ order_number:'MCO 2103', template_key:'received_at_laundry', request_id:createId }, OWNER);
  assert.equal(created.draft.status, 'drafted');
  assert.equal(store.messageDraftEvents.size, 1);
  order.order_status = 'cancelled';
  const retry = await service.create({ order_number:'MCO 2103', template_key:'received_at_laundry', request_id:createId }, OWNER);
  assert.equal(retry.duplicate, true);
  assert.equal(store.messageDraftEvents.size, 1);
  order.order_status = 'picked_up';
  await assert.rejects(() => service.create({
    order_number:'MCO 2103', template_key:'pickup_confirmed', request_id:createId
  }, OWNER), /Idempotency key conflicts/);
  assert.equal(store.messageDraftEvents.size, 1);
  await assert.rejects(() => service.copied({ order_number:'MCO 2103', draft_id:created.draft.draft_id,
    expected_version:1, request_id:crypto.randomUUID() }, OWNER), /Approve/);
  const approved = await service.approve({ order_number:'MCO 2103', draft_id:created.draft.draft_id,
    expected_version:1, request_id:crypto.randomUUID() }, OWNER);
  assert.equal(approved.draft.status, 'approved');
  const copied = await service.copied({ order_number:'MCO 2103', draft_id:created.draft.draft_id,
    expected_version:2, request_id:crypto.randomUUID() }, OWNER);
  assert.equal(copied.draft.status, 'copied');
  assert.equal(store.messageDraftEvents.size, 3);
  assert.deepEqual([...store.messageDraftEvents.values()].map((row) => row.action),
    ['draft_created', 'draft_approved', 'draft_copied']);
});

test('W2-A rejects QA, cancelled, wrong-state, stale facts and conflicting idempotency', async () => {
  const qaStore = new MemoryOperationalStore();
  addOrder(qaStore, { order_number:'MCO 2110', is_qa:true });
  const qa = systemMessageService({ operationalStore:qaStore, now:() => NOW });
  await assert.rejects(() => qa.create({ order_number:'MCO 2110', template_key:'order_confirmed', request_id:crypto.randomUUID() }, OWNER), /QA/);

  const store = new MemoryOperationalStore();
  const order = addOrder(store, { order_number:'MCO 2111' });
  const service = systemMessageService({ operationalStore:store, now:() => NOW });
  await assert.rejects(() => service.create({ order_number:'MCO 2111', template_key:'payment_confirmed', request_id:crypto.randomUUID() }, OWNER), /not available/);
  const request = crypto.randomUUID();
  const draft = await service.create({ order_number:'MCO 2111', template_key:'order_confirmed', request_id:request }, OWNER);
  order.pickup_window_end = '2026-08-30T17:00:00.000Z';
  await assert.rejects(() => service.approve({ order_number:'MCO 2111', draft_id:draft.draft.draft_id,
    expected_version:1, request_id:crypto.randomUUID() }, OWNER), /stale/);
  order.order_status = 'cancelled';
  await assert.rejects(() => service.create({ order_number:'MCO 2111', template_key:'order_confirmed', request_id:crypto.randomUUID() }, OWNER), /not available/);
});

test('W2-A APIs are Owner-only, same-origin and require signed submission identity for writes', async () => {
  const prior = {
    secret:process.env.A7_SYSTEM_SESSION_SECRET,
    mode:process.env.A7_SYSTEM_ACCESS_MODE,
    node:process.env.NODE_ENV
  };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w2-a-test-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  process.env.NODE_ENV = 'test';
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 2112' });
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  try {
    const unauth = response();
    await orderMessagesApi({ method:'POST', headers:{}, body:{ action:'context', order_number:'MCO 2112' } }, unauth);
    assert.equal(unauth.statusCode, 401);
    const operatorToken = signSession({ actor_id:'actor_operator', display_name:'Operator', role:'operator' });
    const forbidden = response();
    await orderMessagesApi({ method:'POST', headers:{ cookie:`${COOKIE_NAME}=${encodeURIComponent(operatorToken)}` },
      body:{ action:'context', order_number:'MCO 2112' } }, forbidden);
    assert.equal(forbidden.statusCode, 403);

    const ownerToken = signSession(OWNER);
    const headers = { cookie:`${COOKIE_NAME}=${encodeURIComponent(ownerToken)}`, origin:'http://localhost:3000' };
    const missing = response();
    await orderMessagesApi({ method:'POST', headers, body:{ action:'create', order_number:'MCO 2112', template_key:'order_confirmed' } }, missing);
    assert.equal(missing.statusCode, 409);
    const draftToken = response();
    await messageDraftApi({ method:'POST', headers }, draftToken);
    assert.equal(draftToken.statusCode, 201);
    assert.match(String(draftToken.headers['set-cookie']), /HttpOnly; Secure; SameSite=Strict/);
    const badOrigin = response();
    await messageDraftApi({ method:'POST', headers:{ ...headers, origin:'https://evil.example' } }, badOrigin);
    assert.equal(badOrigin.statusCode, 403);
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({
      A7_SYSTEM_SESSION_SECRET:prior.secret, A7_SYSTEM_ACCESS_MODE:prior.mode, NODE_ENV:prior.node
    })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W2-A static contract keeps manual copy private and contains no automatic WhatsApp transport', () => {
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const service = fs.readFileSync(new URL('../lib/system-message-service.js', import.meta.url), 'utf8');
  const api = fs.readFileSync(new URL('../api/system/order-messages.js', import.meta.url), 'utf8');
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830060000_orlando_os_w2_a_whatsapp_drafts.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(`${html}\n${js}\n${service}\n${api}`, /graph\.facebook|WHATSAPP_BRIDGE_TOKEN|wa\.me\/|window\.open\(/i);
  assert.doesNotMatch(`${html}\n${js}`, /dataLayer|googletagmanager|localStorage|sessionStorage/);
  assert.doesNotMatch(js, /customer_id|whatsapp_number.*(?:location|URLSearchParams)/i);
  assert.match(service, /resolveSystemMessageCreateRetry/);
  assert.match(migration, /a7_orlando_w2_a_resolve_create_retry/);
  assert.ok(migration.indexOf('where idempotency_key = p_idempotency_key')
    < migration.indexOf("v_order.order_status = 'cancelled'"));
});
