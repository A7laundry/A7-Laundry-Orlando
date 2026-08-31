import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MemoryOperationalStore } = require('../lib/operational-store.js');
const { systemOperationsService, normalizeSettings, validateTransition } = require('../lib/system-operations-service.js');
const { signSession, issueSubmission, COOKIE_NAME, SUBMISSION_COOKIE_NAME } = require('../lib/system-auth.js');
const operationalApi = require('../api/system/operational-orders.js');

const NOW = new Date('2026-08-30T15:00:00.000Z');
const OWNER = { actor_id:'actor_w1c_owner', display_name:'Owner QA', role:'owner' };

function addOrder(store, values = {}) {
  const customerId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  store.customers.set(customerId, { id:customerId, wa_id:'14075551234',
    profile_name:values.customer_name || 'W1C Customer' });
  store.leads.set(leadId, {
    id:leadId, customer_id:customerId, status:'order_accepted', language:'en', accommodation_type:'hotel',
    operational_data:{ property:'W1C Hotel', room:'QA-ROOM', order_notes:values.order_notes || null }
  });
  const order = {
    id:orderId, lead_id:leadId, customer_id:customerId,
    order_number:values.order_number || 'MCO 2101', order_status:values.order_status || 'picked_up',
    payment_status:'pending', service_tier:'normal', pricing_model:'per_lb',
    custody_state:values.custody_state || 'at_laundry',
    production_state:values.production_state || 'awaiting_weight',
    accepted_at:'2026-08-30T12:00:00.000Z', operational_waiting_since:'2026-08-30T14:00:00.000Z',
    pickup_window_start:'2026-08-30T13:00:00.000Z', pickup_window_end:'2026-08-30T14:00:00.000Z',
    actual_lbs:null, weighed_at:null, version:1, promise_version:0, is_qa:Boolean(values.is_qa)
  };
  store.orders.set(order.id, order);
  const items = values.items || [
    { id:crypto.randomUUID(), order_id:order.id, catalog_code:'wash_fold_guest', service_type:'wash_fold_guest',
      label:'Wash & Fold — Bag 1', unit:'lb', quantity:null, estimated_lbs:8, unit_price:3.25,
      minimum_amount:50, requires_manual_review:false, actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0 },
    { id:crypto.randomUUID(), order_id:order.id, catalog_code:'wash_fold_guest', service_type:'wash_fold_guest',
      label:'Wash & Fold — Bag 2', unit:'lb', quantity:null, estimated_lbs:4, unit_price:3.25,
      minimum_amount:50, requires_manual_review:false, actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0 },
    { id:crypto.randomUUID(), order_id:order.id, catalog_code:'comforter', service_type:'comforter',
      label:'Comforter', unit:'piece', quantity:1, estimated_lbs:null, unit_price:35,
      minimum_amount:null, requires_manual_review:false, actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0 }
  ];
  store.orderItems.set(order.id, items);
  return { order, items };
}

function response() {
  return {
    statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test('W1C-A records partial item weight without advancing lifecycle, then completes once', async () => {
  const store = new MemoryOperationalStore();
  const { order, items } = addOrder(store);
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  const detail = await operations.detail(order.order_number);
  assert.deepEqual(detail.weight_progress, { required:2, completed:0, pending:2, complete:false });
  assert.deepEqual(detail.next_action, { code:'record_weight', label:'REGISTRAR PESO', enabled:true });
  const firstId = crypto.randomUUID();
  const first = await operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:8, expected_weight_version:0, request_id:firstId }, OWNER);
  assert.equal(first.duplicate, false);
  assert.equal(first.order.order_status, 'picked_up');
  assert.equal(first.order.production_state, 'awaiting_weight');
  assert.deepEqual(first.order.weight_progress, { required:2, completed:1, pending:1, complete:false });
  assert.equal(first.order.items[0].subtotal, 26);
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'order_weighed').length, 0);
  const secondId = crypto.randomUUID();
  const completed = await operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[1].id, actual_lbs:4, expected_weight_version:0, request_id:secondId }, OWNER);
  assert.equal(completed.order.order_status, 'weighed');
  assert.equal(completed.order.production_state, 'awaiting_processing');
  assert.deepEqual(completed.order.weight_progress, { required:2, completed:2, pending:0, complete:true });
  assert.equal(store.orders.get(order.id).actual_lbs, 12);
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'order_weighed').length, 1);
  const retry = await operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[1].id, actual_lbs:4, expected_weight_version:0, request_id:secondId }, OWNER);
  assert.equal(retry.duplicate, true);
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'order_weighed').length, 1);
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[1].id, actual_lbs:5, expected_weight_version:0, request_id:secondId }, OWNER), /conflicts/);
});

test('W1C-A correction requires reason, respects version and never emits a second lifecycle event', async () => {
  const store = new MemoryOperationalStore();
  const { order, items } = addOrder(store, { order_number:'MCO 2102' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  for (const [index, weight] of [8, 4].entries()) {
    await operations.transition({ order_number:order.order_number, action:'record_weight', order_item_id:items[index].id,
      actual_lbs:weight, expected_weight_version:0, request_id:crypto.randomUUID() }, OWNER);
  }
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:9, expected_weight_version:1, request_id:crypto.randomUUID() }, OWNER), /reason is required/);
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:9, expected_weight_version:0, reason:'Scale correction',
    request_id:crypto.randomUUID() }, OWNER), /version conflict/);
  const corrected = await operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:9, expected_weight_version:1, reason:'Scale correction',
    subtotal:9999, unit_price:9999, request_id:crypto.randomUUID() }, OWNER);
  assert.equal(corrected.order.items[0].subtotal, 29.25);
  assert.equal(store.orders.get(order.id).actual_lbs, 13);
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'order_weighed').length, 1);
  assert.equal([...store.itemWeightEvents.values()].filter((event) => event.previous_actual_lbs != null).length, 1);
});

test('W1C-A fixed items reject weight and fixed-only orders skip the weight queue', async () => {
  const store = new MemoryOperationalStore();
  const { order, items } = addOrder(store, { order_number:'MCO 2103' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[2].id, actual_lbs:1, expected_weight_version:0, request_id:crypto.randomUUID() }, OWNER), /per-pound/);
  const fixed = addOrder(store, { order_number:'MCO 2104', custody_state:'with_driver_pickup',
    items:[{ id:crypto.randomUUID(), catalog_code:'comforter', label:'Comforter', unit:'piece', quantity:1,
      unit_price:35, requires_manual_review:false, actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0 }] });
  await operations.transition({ order_number:fixed.order.order_number, action:'receive_at_laundry', request_id:crypto.randomUUID() }, OWNER);
  assert.equal(fixed.order.production_state, 'awaiting_processing');
});

test('W1C-A fails closed for QA, malformed item identity and non-Owner', async () => {
  const store = new MemoryOperationalStore();
  const { order, items } = addOrder(store, { order_number:'MCO 2105', is_qa:true, order_notes:'QA DO NOT FULFILL' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:8, expected_weight_version:0, request_id:crypto.randomUUID() }, OWNER), /QA orders/);
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:'not-an-item', actual_lbs:8, expected_weight_version:0, request_id:crypto.randomUUID() }, OWNER), /fields are invalid/);
  await assert.rejects(() => operations.transition({ order_number:order.order_number, action:'record_weight',
    order_item_id:items[0].id, actual_lbs:8, expected_weight_version:0, request_id:crypto.randomUUID() },
  { actor_id:'operator', role:'operator' }), /Owner authorization/);
});

test('W1C-A validation accepts only weight facts and never trusts browser price or subtotal', () => {
  const result = validateTransition({ order_number:'MCO 2106', action:'record_weight', request_id:crypto.randomUUID(),
    order_item_id:crypto.randomUUID(), actual_lbs:'7.25', expected_weight_version:'0', unit_price:999, subtotal:999 }, normalizeSettings());
  assert.equal(result.actual_lbs, 7.25);
  assert.equal('unit_price' in result, false);
  assert.equal('subtotal' in result, false);
  assert.throws(() => validateTransition({ order_number:'MCO 2106', action:'record_weight', request_id:crypto.randomUUID(),
    order_item_id:crypto.randomUUID(), actual_lbs:'0', expected_weight_version:'0' }, normalizeSettings()), /fields are invalid/);
});

test('W1C-A API rejects a wrong origin before any operational mutation', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE, node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w1c-test-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  process.env.NODE_ENV = 'production';
  try {
    const session = signSession(OWNER);
    const submission = issueSubmission();
    const res = response();
    await operationalApi({ method:'POST', headers:{ origin:'https://example.test',
      cookie:`${COOKIE_NAME}=${encodeURIComponent(session)}; ${SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}` },
    body:{ action:'transition', transition_action:'record_weight', order_number:'MCO 2101',
      order_item_id:crypto.randomUUID(), actual_lbs:8, expected_weight_version:0 } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.payload.code, 'origin_not_allowed');
  } finally {
    if (prior.secret == null) delete process.env.A7_SYSTEM_SESSION_SECRET; else process.env.A7_SYSTEM_SESSION_SECRET = prior.secret;
    if (prior.mode == null) delete process.env.A7_SYSTEM_ACCESS_MODE; else process.env.A7_SYSTEM_ACCESS_MODE = prior.mode;
    if (prior.node == null) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior.node;
  }
});

test('W1C-A static contract is additive, private and isolated from finance and analytics', () => {
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql', import.meta.url), 'utf8');
  const rollback = fs.readFileSync(new URL('../supabase/rollbacks/20260830050000_orlando_os_w1c_a_item_weight.rollback.sql', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  assert.match(migration, /add column if not exists actual_lbs/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /for update/);
  assert.match(migration, /QA orders are read-only/);
  assert.match(migration, /Only per-pound items can be weighed/);
  assert.match(migration, /a7_orlando_record_transition[\s\S]*'order_weighed'/);
  assert.doesNotMatch(migration, /insert into public\.a7_orlando_(payments|refunds|stripe_events)/);
  assert.match(rollback, /weight evidence exists; keep additive schema/);
  assert.match(js, /Registre o peso real em cada item acima/);
  assert.match(js, /order\.next_action\?\.code === 'record_weight'/);
  assert.doesNotMatch(js, /dataLayer|googletagmanager|localStorage|sessionStorage/);
});
