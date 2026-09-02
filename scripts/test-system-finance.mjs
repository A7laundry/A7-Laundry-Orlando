import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../lib/system-auth.js');
const { MemoryOperationalStore, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const { systemFinanceService, normalizeFinancePeriod } = require('../lib/system-finance-service.js');
const financeApi = require('../api/system/finance.js');

const OWNER = { actor_id:'actor_finance_owner', display_name:'Finance Owner', role:'owner' };
const MANAGER = { actor_id:'actor_finance_manager', display_name:'Finance Manager', role:'manager' };
const OPERATOR = { actor_id:'actor_finance_operator', display_name:'Finance Operator', role:'operator' };

function response() {
  return { statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; } };
}

function addOrder(store, values = {}) {
  const customerId = values.customer_id || crypto.randomUUID();
  if (!store.customers.has(customerId)) store.customers.set(customerId, {
    id:customerId, wa_id:values.phone || '14075550199', profile_name:values.name || 'Finance Fixture'
  });
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  store.leads.set(leadId, { id:leadId, customer_id:customerId,
    operational_data:{ property:values.property || 'Fixture Hotel', ...(values.historical_tip === undefined
      ? {} : { historical_tip_amount:values.historical_tip }) } });
  const order = { id:orderId, lead_id:leadId, customer_id:customerId,
    order_number:values.order_number || `MCO ${String(store.orders.size + 5000)}`,
    accepted_at:values.accepted_at || '2026-08-15T16:00:00.000Z',
    order_status:values.order_status || 'delivered', payment_status:values.payment_status || 'paid',
    service_tier:values.service_tier || 'normal',
    service_amount:Object.hasOwn(values, 'service_amount') ? values.service_amount : 100,
    tip_amount:values.tip_amount === undefined ? null : values.tip_amount,
    is_repeat_customer:Boolean(values.repeat), is_qa:Boolean(values.is_qa), hotel_id:values.hotel_id || null,
    attribution_snapshot:values.attribution_snapshot || null };
  store.orders.set(orderId, order);
  if (values.with_payment !== false) store.payments.set(values.transaction_id || `pi_finance_${store.payments.size}`, {
    id:crypto.randomUUID(), order_id:orderId, transaction_id:values.transaction_id || `pi_finance_${store.payments.size}`,
    amount:values.payment_amount ?? order.service_amount, refund_total:values.refund_total || 0,
    currency:'USD', status:values.payment_record_status || order.payment_status,
    paid_at:values.paid_at || '2026-08-15T17:00:00.000Z'
  });
  return { order, customerId };
}

test('finance periods are deterministic Orlando calendar ranges and bounded', () => {
  const now = new Date('2026-09-01T16:00:00.000Z');
  assert.deepEqual(normalizeFinancePeriod({ preset:'today' }, now),
    { preset:'today', start_date:'2026-09-01', end_date:'2026-09-01' });
  assert.deepEqual(normalizeFinancePeriod({ preset:'7d' }, now),
    { preset:'7d', start_date:'2026-08-26', end_date:'2026-09-01' });
  assert.deepEqual(normalizeFinancePeriod({ preset:'30d' }, now),
    { preset:'30d', start_date:'2026-08-03', end_date:'2026-09-01' });
  assert.deepEqual(normalizeFinancePeriod({ preset:'month' }, now),
    { preset:'month', start_date:'2026-09-01', end_date:'2026-09-01' });
  assert.throws(() => normalizeFinancePeriod({ preset:'custom', start_date:'2026-09-02', end_date:'2026-09-01' }, now), /must not follow/);
  assert.throws(() => normalizeFinancePeriod({ preset:'custom', start_date:'2025-01-01', end_date:'2026-09-01' }, now), /cannot exceed/);
});

test('finance report reconciles service revenue, refunds, explicit tips, QA and all breakdowns', async () => {
  const store = new MemoryOperationalStore();
  const hotelId = crypto.randomUUID();
  store.hotels.set(hotelId, { id:hotelId, canonical_name:'Governed Resort', active:true });
  const first = addOrder(store, { order_number:'MCO 5101', service_amount:100, tip_amount:10,
    payment_amount:110, hotel_id:hotelId,
    attribution_snapshot:{ confidence:'deterministic', first_touch:{ source:'google', medium:'cpc' } } });
  addOrder(store, { customer_id:first.customerId, order_number:'MCO 5102', service_tier:'express',
    service_amount:80, historical_tip:16, payment_amount:96, refund_total:20,
    payment_status:'partially_refunded', payment_record_status:'partially_refunded', repeat:true });
  addOrder(store, { order_number:'MCO 5198', service_amount:500, payment_amount:500, is_qa:true });
  addOrder(store, { order_number:'MCO 5199', service_amount:200, payment_amount:200, order_status:'cancelled' });
  addOrder(store, { order_number:'MCO 5103', service_amount:50, payment_status:'invoice_created', with_payment:false });

  const before = { orders:store.orders.size, payments:store.payments.size, events:store.events.size };
  const report = await systemFinanceService({ operationalStore:store,
    now:() => new Date('2026-09-01T16:00:00.000Z') }).report({
    preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
  }, OWNER);
  assert.deepEqual({ orders:store.orders.size, payments:store.payments.size, events:store.events.size }, before);
  assert.equal(report.summary.paid_order_count, 2);
  assert.equal(report.summary.customer_count, 1);
  assert.equal(report.summary.confirmed_service_revenue, 160);
  assert.equal(report.summary.gross_received, 186);
  assert.equal(report.summary.confirmed_tips, 26);
  assert.equal(report.summary.average_service_ticket, 80);
  assert.equal(report.summary.new_customer_orders, 1);
  assert.equal(report.summary.repeat_customer_orders, 1);
  assert.equal(report.summary.pending_payment_count, 1);
  assert.equal(report.summary.pending_payment_value, 50);
  assert.equal(report.availability.tips, 'current');
  for (const rows of Object.values(report.breakdowns)) {
    assert.equal(rows.reduce((sum, row) => sum + row.confirmed_service_revenue, 0), 160);
  }
  assert.deepEqual(report.breakdowns.service.map((row) => row.bucket).sort(), ['express', 'normal']);
  assert.ok(report.breakdowns.hotel.some((row) => row.bucket === 'Governed Resort'));
  assert.ok(report.breakdowns.hotel.some((row) => row.bucket === 'Unmapped / other'));
  assert.ok(report.breakdowns.acquisition.some((row) => row.bucket === 'google / cpc'));
  assert.ok(report.breakdowns.acquisition.some((row) => row.bucket === 'Unattributed'));
});

test('finance report counts one order once when historical payment rows overlap', async () => {
  const store = new MemoryOperationalStore();
  const { order } = addOrder(store, { order_number:'MCO 5110', service_amount:60,
    payment_amount:60, paid_at:'2026-08-15T17:00:00.000Z' });
  store.payments.set('pi_finance_reconciled_latest', {
    id:crypto.randomUUID(), order_id:order.id, transaction_id:'pi_finance_reconciled_latest',
    amount:60, refund_total:0, currency:'USD', status:'paid', paid_at:'2026-08-15T18:00:00.000Z'
  });
  const report = await systemFinanceService({ operationalStore:store }).report({
    preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
  }, OWNER);
  assert.equal(report.summary.paid_order_count, 1);
  assert.equal(report.summary.confirmed_service_revenue, 60);
  assert.equal(report.summary.gross_received, 60);
});

test('finance report preserves no-data, partial and unknown value semantics', async () => {
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 5201', service_amount:null, payment_status:'pending', with_payment:false });
  const report = await systemFinanceService({ operationalStore:store }).report({
    preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
  }, OWNER);
  assert.equal(report.summary.paid_order_count, 0);
  assert.equal(report.summary.confirmed_service_revenue, 0);
  assert.equal(report.summary.average_service_ticket, null);
  assert.equal(report.summary.confirmed_tips, null);
  assert.equal(report.availability.tips, 'no_data');
  assert.equal(report.summary.pending_payment_count, 1);
  assert.equal(report.summary.pending_payment_value, null);
  assert.equal(report.availability.pending_payment_value, 'unavailable');
  await assert.rejects(() => systemFinanceService({ operationalStore:store }).report({ preset:'30d' }, OPERATOR), /Owner/);
});

test('finance report fails closed when freshness evidence is missing', async () => {
  const store = new MemoryOperationalStore();
  store.getSystemOwnerFinance = async () => ({
    period:{ start_date:'2026-08-01', end_date:'2026-08-31' },
    summary:{ paid_order_count:0, customer_count:0, confirmed_service_revenue:0,
      gross_received:0, confirmed_tips:null, average_service_ticket:null,
      new_customer_orders:0, repeat_customer_orders:0, normal_paid_orders:0,
      express_paid_orders:0, pending_payment_count:0, pending_payment_value:null },
    availability:{ status:'no_data', service_revenue:'no_data', gross_received:'no_data',
      tips:'no_data', pending_payment_value:'no_data', processing_fees:'unavailable', net_payout:'unavailable' },
    breakdowns:{ service:[], hotel:[], acquisition:[] }, sources:[], freshness:{}
  });
  await assert.rejects(() => systemFinanceService({ operationalStore:store }).report({
    preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
  }, OWNER), /freshness timestamp/);
});

test('finance API is Owner/Manager-only, same-origin, POST-only and returns no PII', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE, node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'finance-local-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team'; process.env.NODE_ENV = 'test';
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 5301', name:'Private Customer', phone:'14075559999', service_amount:60, payment_amount:60, tip_amount:0 });
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  const cookie = (actor) => `${auth.COOKIE_NAME}=${encodeURIComponent(auth.signSession(actor, process.env))}`;
  try {
    const unauthenticated = response();
    await financeApi({ method:'POST', headers:{ origin:'http://localhost:3000' }, body:{ preset:'30d' } }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);
    const operator = response();
    await financeApi({ method:'POST', headers:{ cookie:cookie(OPERATOR), origin:'http://localhost:3000' }, body:{ preset:'30d' } }, operator);
    assert.equal(operator.statusCode, 403);
    const wrongOrigin = response();
    await financeApi({ method:'POST', headers:{ cookie:cookie(OWNER), origin:'https://evil.example' }, body:{ preset:'30d' } }, wrongOrigin);
    assert.equal(wrongOrigin.statusCode, 403);
    const wrongMethod = response();
    await financeApi({ method:'GET', headers:{ cookie:cookie(OWNER), origin:'http://localhost:3000' } }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);
    const owner = response();
    await financeApi({ method:'POST', headers:{ cookie:cookie(OWNER), origin:'http://localhost:3000' }, body:{
      preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
    } }, owner);
    assert.equal(owner.statusCode, 200);
    const manager = response();
    await financeApi({ method:'POST', headers:{ cookie:cookie(MANAGER), origin:'http://localhost:3000' }, body:{
      preset:'custom', start_date:'2026-08-01', end_date:'2026-08-31'
    } }, manager);
    assert.equal(manager.statusCode, 200);
    const serialized = JSON.stringify(owner.payload);
    assert.doesNotMatch(serialized, /Private Customer|14075559999|pi_finance|customer_id|order_id/i);
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({ A7_SYSTEM_SESSION_SECRET:prior.secret,
      A7_SYSTEM_ACCESS_MODE:prior.mode, NODE_ENV:prior.node })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('finance release is additive, private, read-only and wired after CLI', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20260901020000_orlando_os_owner_finance_dashboard.sql', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const cli = fs.readFileSync(new URL('./a7-system-finance.mjs', import.meta.url), 'utf8');
  assert.match(sql, /stable security definer/);
  assert.match(sql, /revoke all .* anon, authenticated/s);
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|truncate)\b\s+(?:into\s+|from\s+)?public\./i);
  assert.match(html, /id="financeNav" class="manager-access"/);
  assert.match(html, /id="financeView"/);
  assert.match(js, /\/api\/system\/finance/);
  assert.match(cli, /systemFinanceService/);
});
