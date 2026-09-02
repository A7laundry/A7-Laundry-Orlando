import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MemoryOperationalStore, InvalidTransitionError, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const { systemOperationalCycleService } = require('../lib/system-operational-cycle-service.js');
const { nextActionFor, obligationStatus, slaFor } = require('../lib/system-operations-service.js');
const { signSession, issueSubmission, COOKIE_NAME, SUBMISSION_COOKIE_NAME } = require('../lib/system-auth.js');
const driversApi = require('../api/system/drivers.js');
const paymentApi = require('../api/system/manual-payment.js');

const OWNER = { actor_id:'owner-1', role:'owner' };
const MANAGER = { actor_id:'manager-1', role:'manager' };
const OPERATOR = { actor_id:'operator-1', role:'operator' };
const NOW = new Date('2026-09-02T14:00:00.000Z');

function rid() { return crypto.randomUUID(); }

function response() {
  return { statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; } };
}

function fixture() {
  const store = new MemoryOperationalStore();
  const customerId = crypto.randomUUID(); const leadId = crypto.randomUUID(); const orderId = crypto.randomUUID();
  store.customers.set(customerId, { id:customerId, wa_id:'14075550199', profile_name:'Cycle Customer' });
  store.leads.set(leadId, { id:leadId, customer_id:customerId, accommodation_type:'hotel',
    operational_data:{ property:'Cycle Hotel', room:'410', needed_by:'2026-09-02T22:00:00.000Z' } });
  store.orders.set(orderId, { id:orderId, lead_id:leadId, customer_id:customerId, order_number:'MCO 1400',
    order_status:'pickup_scheduled', payment_status:'invoice_created', custody_state:'awaiting_pickup',
    production_state:'awaiting_intake', service_tier:'express', promised_by:'2026-09-02T22:00:00.000Z',
    pickup_window_start:'2026-09-02T14:00:00.000Z', pickup_window_end:'2026-09-02T15:00:00.000Z',
    invoice_id:'invoice-cycle-1', service_amount:60, tip_amount:0, currency:'USD', version:1 });
  return { store, order:store.orders.get(orderId), service:systemOperationalCycleService({ operationalStore:store, now:() => NOW }) };
}

test('Owner manages drivers while Manager can read and assign but Operator cannot', async () => {
  const { service } = fixture();
  const saved = await service.saveDriver({ full_name:'João Driver', phone:'+1 (407) 555-0188', active:true, request_id:rid() }, OWNER);
  assert.equal(saved.driver.phone, '14075550188');
  assert.equal((await service.listDrivers({}, MANAGER)).length, 1);
  const assignment = await service.assignDriver({ order_number:'1400', driver_id:saved.driver.driver_id,
    leg:'pickup', request_id:rid() }, MANAGER);
  assert.equal(assignment.assignment.leg, 'pickup');
  await assert.rejects(() => service.listDrivers({}, OPERATOR), InvalidTransitionError);
  await assert.rejects(() => service.saveDriver({ full_name:'Blocked', phone:'+14075550111', request_id:rid() }, MANAGER), InvalidTransitionError);
});

test('driver assignment is idempotent, axis-independent and required by guided pickup action', async () => {
  const { service, store, order } = fixture();
  const driver = (await service.saveDriver({ full_name:'Pickup Driver', phone:'+14075550177', request_id:rid() }, OWNER)).driver;
  const request = rid();
  const first = await service.assignDriver({ order_number:'MCO 1400', driver_id:driver.driver_id, leg:'pickup', request_id:request }, MANAGER);
  const retry = await service.assignDriver({ order_number:'MCO 1400', driver_id:driver.driver_id, leg:'pickup', request_id:request }, MANAGER);
  assert.equal(first.duplicate, false); assert.equal(retry.duplicate, true);
  assert.equal(order.order_status, 'pickup_scheduled'); assert.equal(order.payment_status, 'invoice_created');
  const row = store.operationalRow(order);
  assert.equal(nextActionFor({ ...row, pickup_driver:row.pickup_driver }).code, 'confirm_pickup');
});

test('pickup transition fails closed without responsibility and succeeds once after assignment', async () => {
  const { service, store } = fixture();
  await assert.rejects(() => store.transitionSystemOperationalOrder({
    order_number:'MCO 1400', action:'confirm_pickup', actor_id:MANAGER.actor_id,
    actor_role:MANAGER.role, idempotency_key:'pickup-without-driver', occurred_at:NOW.toISOString()
  }), /driver assignment required/i);
  const driver = (await service.saveDriver({ full_name:'Responsible Driver', phone:'+14075550176',
    request_id:rid() }, OWNER)).driver;
  await service.assignDriver({ order_number:'MCO 1400', driver_id:driver.driver_id, leg:'pickup', request_id:rid() }, MANAGER);
  const transitioned = await store.transitionSystemOperationalOrder({
    order_number:'MCO 1400', action:'confirm_pickup', actor_id:MANAGER.actor_id,
    actor_role:MANAGER.role, idempotency_key:'pickup-with-driver', occurred_at:NOW.toISOString()
  });
  assert.equal(transitioned.duplicate, false);
  assert.equal(store.orders.values().next().value.custody_state, 'with_driver_pickup');
});

test('manual payment changes only finance and preserves immutable invoice facts', async () => {
  const { service, order } = fixture();
  const before = { order_status:order.order_status, custody_state:order.custody_state,
    production_state:order.production_state, invoice_id:order.invoice_id, service_amount:order.service_amount };
  const request = rid();
  const first = await service.registerPayment({ order_number:'MCO 1400', method:'zelle', amount:'60.00',
    paid_at:'2026-09-02T13:55:00.000Z', note:'Confirmed by manager', request_id:request }, MANAGER);
  const retry = await service.registerPayment({ order_number:'MCO 1400', method:'zelle', amount:'60.00',
    paid_at:'2026-09-02T13:55:00.000Z', note:'Confirmed by manager', request_id:request }, MANAGER);
  assert.equal(first.duplicate, false); assert.equal(retry.duplicate, true);
  assert.equal(order.payment_status, 'paid'); assert.equal(order.tip_amount, 0);
  assert.deepEqual({ order_status:order.order_status, custody_state:order.custody_state,
    production_state:order.production_state, invoice_id:order.invoice_id, service_amount:order.service_amount }, before);
});

test('manual payment rejects mismatched value, unauthorized actor and a second payment', async () => {
  const { service } = fixture();
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'59.99',
    paid_at:NOW.toISOString(), request_id:rid() }, MANAGER), /match the current invoice/);
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00',
    paid_at:NOW.toISOString(), request_id:rid() }, OPERATOR), /financial authorization/);
  await service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00', paid_at:NOW.toISOString(), request_id:rid() }, MANAGER);
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00',
    paid_at:NOW.toISOString(), request_id:rid() }, MANAGER), /already paid/);
});

test('pickup and delivery obligations become overdue only while unmet', () => {
  const base = { order_status:'pickup_scheduled', custody_state:'awaiting_pickup',
    pickup_window_end:'2026-09-02T13:59:00.000Z', promised_by:'2026-09-02T22:00:00.000Z' };
  assert.deepEqual(obligationStatus(base, NOW), { pickup_overdue:true, delivery_overdue:false, overdue:true, obligation:'pickup' });
  const delivered = { ...base, order_status:'delivered', custody_state:'delivered', promised_by:'2026-09-02T13:00:00.000Z' };
  assert.equal(obligationStatus(delivered, NOW).overdue, false);
});

test('Express SLA preserves approved OK, attention, risk and late boundaries', () => {
  const settings = { status:'approved', attention_minutes:240, risk_minutes:120 };
  const status = (minutes) => slaFor({ service_tier:'express', promised_by:new Date(NOW.getTime() + minutes * 60000).toISOString() }, settings, NOW).status;
  assert.equal(status(241), 'ok'); assert.equal(status(240), 'attention');
  assert.equal(status(120), 'risk'); assert.equal(status(0), 'late');
});

test('ready states remain independent from payment and driver responsibility', () => {
  const base = { order_status:'invoice_created', production_state:'ready', custody_state:'at_laundry',
    service_tier:'normal', is_qa:false, payment_status:'invoice_created' };
  assert.equal(nextActionFor(base).code, 'register_payment');
  assert.equal(nextActionFor({ ...base, payment_status:'paid' }).code, 'assign_delivery_driver');
  assert.equal(nextActionFor({ ...base, payment_status:'paid', delivery_driver:{ name:'Carlos' } }).code, 'start_delivery');
});

test('approved independent-state combinations keep their truthful next action', () => {
  const base = { order_status:'weighed', service_tier:'normal', is_qa:false, accommodation_type:'hotel' };
  assert.equal(nextActionFor({ ...base, production_state:'processing', custody_state:'at_laundry',
    payment_status:'paid' }).code, 'mark_ready', 'PAID + PROCESSING');
  assert.equal(nextActionFor({ ...base, production_state:'ready', custody_state:'at_laundry',
    payment_status:'invoice_created' }).code, 'register_payment', 'UNPAID + READY');
  assert.equal(nextActionFor({ ...base, production_state:'ready', custody_state:'with_driver_delivery',
    payment_status:'paid' }).code, 'leave_bell_desk', 'PAID + WITH DRIVER');
  assert.equal(nextActionFor({ ...base, production_state:'ready', custody_state:'at_laundry',
    payment_status:'pending' }).code, 'review_invoice', 'READY + PAYMENT PENDING');
});

test('operational-cycle CLI blocks every write until --execute is explicit', () => {
  const result = spawnSync(process.execPath, ['scripts/a7-system-operational-cycle.mjs', 'driver:save',
    '--name', 'CLI Driver', '--phone', '+14075550123'], {
    cwd:new URL('..', import.meta.url), encoding:'utf8',
    env:{ ...process.env, A7_SYSTEM_CLI_ACTOR_ID:'actor_cli', A7_SYSTEM_CLI_ACTOR_ROLE:'owner' }
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Write blocked/);
  assert.equal(result.stdout, '');
});

test('driver and payment APIs enforce session, role, origin and signed submission boundaries', async () => {
  const previous = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE };
  process.env.A7_SYSTEM_SESSION_SECRET = 'cycle-api-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  const { store } = fixture();
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  const submission = issueSubmission(process.env);
  const cookie = (actor) => [
    `${COOKIE_NAME}=${encodeURIComponent(signSession(actor, process.env))}`,
    `${SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}`
  ].join('; ');
  try {
    const unauthenticated = response();
    await driversApi({ method:'POST', headers:{ origin:'http://localhost:3000' }, body:{ action:'list' } }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);

    const managerSave = response();
    await driversApi({ method:'POST', headers:{ cookie:cookie(MANAGER), origin:'http://localhost:3000' },
      body:{ action:'save', full_name:'Blocked Driver', phone:'+14075550100' } }, managerSave);
    assert.equal(managerSave.statusCode, 409);

    const ownerSave = response();
    await driversApi({ method:'POST', headers:{ cookie:cookie(OWNER), origin:'http://localhost:3000' },
      body:{ action:'save', full_name:'API Driver', phone:'+14075550101' } }, ownerSave);
    assert.equal(ownerSave.statusCode, 200);
    const driverId = ownerSave.payload.result.driver.driver_id;

    const assignment = response();
    await driversApi({ method:'POST', headers:{ cookie:cookie(MANAGER), origin:'http://localhost:3000' },
      body:{ action:'assign', order_number:'MCO 1400', driver_id:driverId, leg:'pickup' } }, assignment);
    assert.equal(assignment.statusCode, 200);

    const payment = response();
    await paymentApi({ method:'POST', headers:{ cookie:cookie(MANAGER), origin:'http://localhost:3000' },
      body:{ order_number:'MCO 1400', method:'cash', amount:'60.00', paid_at:NOW.toISOString() } }, payment);
    assert.equal(payment.statusCode, 200);
    assert.equal(store.orders.values().next().value.payment_status, 'paid');
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({ A7_SYSTEM_SESSION_SECRET:previous.secret,
      A7_SYSTEM_ACCESS_MODE:previous.mode })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('new browser contracts keep PII out of URLs, storage and analytics', () => {
  const source = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const api = `${fs.readFileSync(new URL('../api/system/drivers.js', import.meta.url), 'utf8')}\n${fs.readFileSync(new URL('../api/system/manual-payment.js', import.meta.url), 'utf8')}`;
  assert.doesNotMatch(`${source}\n${api}`, /localStorage|sessionStorage|dataLayer\.push|googletagmanager/i);
  assert.doesNotMatch(source, /\/api\/system\/(?:drivers|manual-payment)\?/);
});
