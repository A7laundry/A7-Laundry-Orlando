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

test('driver writes reject conflicting retries and exact assignment retry survives deactivation', async () => {
  const { service } = fixture();
  const saveRequest = rid();
  const saved = await service.saveDriver({ full_name:'Stable Driver', phone:'+14075550166',
    active:true, request_id:saveRequest }, OWNER);
  assert.equal((await service.saveDriver({ full_name:'Stable Driver', phone:'+14075550166',
    active:true, request_id:saveRequest }, OWNER)).duplicate, true);
  await assert.rejects(() => service.saveDriver({ full_name:'Conflicting Driver', phone:'+14075550166',
    active:true, request_id:saveRequest }, OWNER), /idempotency key conflicts/i);

  const assignmentRequest = rid();
  await service.assignDriver({ order_number:'MCO 1400', driver_id:saved.driver.driver_id,
    leg:'pickup', request_id:assignmentRequest }, MANAGER);
  await service.saveDriver({ driver_id:saved.driver.driver_id, full_name:'Stable Driver',
    phone:'+14075550166', active:false, request_id:rid() }, OWNER);
  assert.equal((await service.assignDriver({ order_number:'MCO 1400', driver_id:saved.driver.driver_id,
    leg:'pickup', request_id:assignmentRequest }, MANAGER)).duplicate, true);
  await assert.rejects(() => service.assignDriver({ order_number:'MCO 1400', driver_id:saved.driver.driver_id,
    leg:'pickup', request_id:assignmentRequest }, OWNER), /idempotency key conflicts/i);
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
  const first = await service.registerPayment({ order_number:'MCO 1400', method:'zelle', amount:'69.00',
    tip_amount:'9.00', reference:'Zelle confirmation 4821',
    paid_at:'2026-09-02T13:55:00.000Z', note:'Confirmed by manager', request_id:request }, MANAGER);
  const retry = await service.registerPayment({ order_number:'MCO 1400', method:'zelle', amount:'69.00',
    tip_amount:'9.00', reference:'Zelle confirmation 4821',
    paid_at:'2026-09-02T13:55:00.000Z', note:'Confirmed by manager', request_id:request }, MANAGER);
  assert.equal(first.duplicate, false); assert.equal(retry.duplicate, true);
  assert.equal(order.payment_status, 'paid'); assert.equal(order.tip_amount, 9);
  assert.equal(first.payment.service_amount, 60); assert.equal(first.payment.total_amount, 69);
  assert.equal(first.payment.reference, 'Zelle confirmation 4821');
  assert.deepEqual({ order_status:order.order_status, custody_state:order.custody_state,
    production_state:order.production_state, invoice_id:order.invoice_id, service_amount:order.service_amount }, before);
});

test('manual payment rejects mismatched value, unauthorized actor and a second payment', async () => {
  const { service } = fixture();
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'59.99',
    tip_amount:'0', paid_at:NOW.toISOString(), request_id:rid() }, MANAGER), /service amount plus tip/);
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'stripe', amount:'60.00',
    tip_amount:'0', paid_at:NOW.toISOString(), request_id:rid() }, MANAGER), /reference is required/);
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00',
    paid_at:NOW.toISOString(), request_id:rid() }, OPERATOR), /financial authorization/);
  await service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00', tip_amount:'0', paid_at:NOW.toISOString(), request_id:rid() }, MANAGER);
  await assert.rejects(() => service.registerPayment({ order_number:'1400', method:'cash', amount:'60.00',
    paid_at:NOW.toISOString(), request_id:rid() }, MANAGER), /already paid/);
});

test('manual payment idempotency includes note and actor evidence', async () => {
  const { service } = fixture();
  const request = rid();
  const payment = { order_number:'MCO 1400', method:'cash', amount:'60.00', tip_amount:'0',
    paid_at:NOW.toISOString(), note:'Counted by manager', request_id:request };
  assert.equal((await service.registerPayment(payment, MANAGER)).duplicate, false);
  assert.equal((await service.registerPayment(payment, MANAGER)).duplicate, true);
  await assert.rejects(() => service.registerPayment({ ...payment, note:'Different evidence' }, MANAGER),
    /idempotency key conflicts/i);
  await assert.rejects(() => service.registerPayment(payment, OWNER), /idempotency key conflicts/i);
});

test('Stripe event idempotency accepts only the exact original payment facts', async () => {
  const { store, order } = fixture();
  const linkId = crypto.randomUUID();
  store.systemPaymentLinks.set(linkId, {
    id:linkId, order_id:order.id, invoice_id:order.invoice_id, status:'active',
    stripe_payment_link_id:'plink_cycle', service_amount:60, tip_amount:9,
    total_amount:69, currency:'USD'
  });
  const payment = {
    stripe_event_id:'evt_cycle_exact', event_type:'checkout.session.completed',
    checkout_session_id:'cs_cycle_exact', payment_link_id:'plink_cycle',
    order_id:order.id, transaction_id:'pi_cycle_exact', amount:69,
    service_amount:60, tip_amount:9, total_amount:69, currency:'USD',
    paid_at:NOW.toISOString()
  };
  assert.equal((await store.recordPayment(payment)).duplicate, false);
  assert.equal((await store.recordPayment(payment)).duplicate, true);
  await assert.rejects(() => store.recordPayment({ ...payment, total_amount:70, amount:70 }),
    /Stripe event idempotency conflict/i);
  await assert.rejects(() => store.recordPayment({ ...payment, checkout_session_id:'cs_changed' }),
    /Stripe event idempotency conflict/i);
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

test('delivery handoff records the governed point and keeps final confirmation separate', async () => {
  const { service, store, order } = fixture();
  order.order_status = 'ready_for_delivery'; order.payment_status = 'paid';
  order.production_state = 'ready'; order.custody_state = 'at_laundry';
  const driver = (await service.saveDriver({ full_name:'Delivery Driver', phone:'+14075550179', request_id:rid() }, OWNER)).driver;
  await service.assignDriver({ order_number:'MCO 1400', driver_id:driver.driver_id, leg:'delivery', request_id:rid() }, MANAGER);
  await store.transitionSystemOperationalOrder({ order_number:'MCO 1400', action:'start_delivery',
    actor_id:MANAGER.actor_id, actor_role:MANAGER.role, idempotency_key:'delivery-start', occurred_at:NOW.toISOString() });
  await store.transitionSystemOperationalOrder({ order_number:'MCO 1400', action:'leave_bell_desk',
    handoff_point:'front_desk', handoff_note:'Received by hotel team', actor_id:MANAGER.actor_id,
    actor_role:MANAGER.role, idempotency_key:'delivery-handoff', occurred_at:NOW.toISOString() });
  assert.equal(order.custody_state, 'bell_desk');
  assert.equal(store.operationalRow(order).delivery_handoff.handoff_point, 'front_desk');
  await store.transitionSystemOperationalOrder({ order_number:'MCO 1400', action:'complete_delivery',
    actor_id:MANAGER.actor_id, actor_role:MANAGER.role, idempotency_key:'delivery-complete', occurred_at:NOW.toISOString() });
  assert.equal(order.custody_state, 'delivered'); assert.equal(order.order_status, 'delivered');
});

test('direct delivery requires a valid handoff and Other requires a note', async () => {
  const { store, order } = fixture();
  order.order_status = 'ready_for_delivery'; order.payment_status = 'paid';
  order.production_state = 'ready'; order.custody_state = 'with_driver_delivery';
  await assert.rejects(() => store.transitionSystemOperationalOrder({ order_number:'MCO 1400', action:'complete_delivery',
    actor_id:MANAGER.actor_id, actor_role:MANAGER.role, idempotency_key:'missing-handoff', occurred_at:NOW.toISOString() }), /handoff point/i);
  await assert.rejects(() => store.transitionSystemOperationalOrder({ order_number:'MCO 1400', action:'complete_delivery',
    handoff_point:'other', actor_id:MANAGER.actor_id, actor_role:MANAGER.role,
    idempotency_key:'other-no-note', occurred_at:NOW.toISOString() }), /handoff note/i);
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
  const paymentLink = spawnSync(process.execPath, ['scripts/a7-system-operational-cycle.mjs',
    'payment-link:create', '--order', 'MCO 1400', '--tip', '9.00'], {
    cwd:new URL('..', import.meta.url), encoding:'utf8',
    env:{ ...process.env, A7_SYSTEM_CLI_ACTOR_ID:'actor_cli', A7_SYSTEM_CLI_ACTOR_ROLE:'owner' }
  });
  assert.equal(paymentLink.status, 2);
  assert.match(paymentLink.stderr, /Write blocked/);
  assert.equal(paymentLink.stdout, '');
});

test('independent-review SQL repairs are fail-closed and rollbacks preserve evidence', () => {
  const lifecycle = fs.readFileSync(new URL('../supabase/migrations/20260902009000_orlando_lifecycle_authority_repair.sql', import.meta.url), 'utf8');
  const payment = fs.readFileSync(new URL('../supabase/migrations/20260902010000_orlando_os_payment_evidence.sql', import.meta.url), 'utf8');
  const stripe = fs.readFileSync(new URL('../supabase/migrations/20260902013000_orlando_canonical_payment_link.sql', import.meta.url), 'utf8');
  const driver = fs.readFileSync(new URL('../supabase/migrations/20260902015000_orlando_idempotency_hardening.sql', import.meta.url), 'utf8');
  const operationalRollback = fs.readFileSync(new URL('../supabase/rollbacks/20260901040000_orlando_os_operational_cycle.rollback.sql', import.meta.url), 'utf8');
  const stripeRollback = fs.readFileSync(new URL('../supabase/rollbacks/20260902013000_orlando_canonical_payment_link.rollback.sql', import.meta.url), 'utf8');
  assert.match(lifecycle, /select \* into v_existing[\s\S]*when 'pickup_scheduled'[\s\S]*version = version \+ 1/);
  assert.match(lifecycle, /insert into public\.a7_orlando_order_events/);
  assert.match(driver, /request_fingerprint[\s\S]*Driver idempotency conflict/);
  assert.match(driver, /result_snapshot[\s\S]*Legacy driver retry cannot be verified/);
  assert.match(driver, /Resolve an exact retry before inspecting mutable driver activity/);
  assert.match(payment, /v_existing\.note is distinct from v_note/);
  assert.match(payment, /v_existing\.recorded_by <> p_actor_id/);
  assert.match(stripe, /Stripe event idempotency conflict/);
  assert.match(stripe, /v_existing_event\.sanitized_payload->>'total_amount'/);
  assert.match(operationalRollback, /exists \(select 1 from public\.a7_orlando_driver_events\)/);
  assert.match(stripeRollback, /exists \(select 1 from public\.a7_orlando_payment_links\)/);
  assert.match(stripeRollback, /payment composition evidence exists/);
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
  assert.match(source, /axis === 'Produção' && order\.order_status === 'delivered'\) return 'Concluída'/);
});
