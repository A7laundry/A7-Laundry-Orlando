import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildHomeProjection, systemHomeService, localDate } = require('../lib/system-home-service.js');
const { isInQueue } = require('../lib/system-operations-service.js');
const { MemoryOperationalStore, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const auth = require('../lib/system-auth.js');
const homeApi = require('../api/system/home.js');

const OWNER = { actor_id:'actor_owner', role:'owner', display_name:'Owner' };
const OPERATOR = { actor_id:'actor_operator', role:'operator', display_name:'Operator' };
const NOW = new Date('2026-09-01T16:00:00.000Z');

function order(values = {}) {
  return {
    order_number:values.order_number || 'MCO 9001', order_status:values.order_status || 'picked_up',
    payment_status:values.payment_status || 'pending', customer_name:values.customer_name || 'Test Customer',
    property:values.property || 'Test Hotel', service_tier:values.service_tier || 'normal',
    custody_state:values.custody_state || 'at_laundry', production_state:values.production_state || 'processing',
    accepted_at:values.accepted_at || '2026-09-01T13:00:00.000Z', pickup_window_start:values.pickup_window_start ?? '2026-09-01T15:00:00.000Z',
    promised_by:values.promised_by ?? null, needed_by:values.needed_by ?? null,
    operational_waiting_since:values.operational_waiting_since || '2026-09-01T13:00:00.000Z',
    items:values.items || [{ actual_lbs:10, weighed_at:'2026-09-01T15:00:00.000Z' }],
    sla:values.sla || { status:'not_applicable', remaining_minutes:null },
    next_action:values.next_action || { code:'mark_ready', label:'MARCAR PRONTO' },
    is_qa:Boolean(values.is_qa)
  };
}

function finance(values = {}, start = '2026-09-01', end = '2026-09-01') {
  return {
    period:{ preset:'custom', start_date:start, end_date:end, timezone:'America/New_York', basis:'authoritative_paid_at' },
    summary:{ confirmed_service_revenue:values.revenue ?? 120, paid_order_count:values.orders ?? 2,
      average_service_ticket:values.average ?? 60, customer_count:values.customers ?? 2,
      repeat_customer_orders:values.repeat ?? 0 },
    availability:{ status:'current', service_revenue:'current', tips:'partial' }
  };
}

function snapshot(orders) {
  return { as_of:NOW.toISOString(), timezone:'America/New_York', waiting_confirmation:1,
    waiting_leads:[{ customer_name:'Waiting Customer', property:'Waiting Hotel', created_at:'2026-09-01T12:00:00.000Z' }], orders };
}

function response() {
  return { statusCode:0, headers:{}, payload:null, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; }, json(value) { this.payload = value; return this; } };
}

test('Home excludes QA, delivered, cancelled and historical records from active work', () => {
  const active = order();
  const delivered = order({ order_number:'MCO 9002', order_status:'delivered', custody_state:'delivered', production_state:'ready' });
  const cancelled = order({ order_number:'MCO 9003', order_status:'cancelled' });
  const qa = order({ order_number:'MCO 9004', is_qa:true });
  const home = buildHomeProjection({ operational:snapshot([active, delivered, cancelled, qa]), actor:OPERATOR, now:NOW });
  assert.equal(home.operation.processing.count, 1);
  assert.deepEqual(home.next_actions.filter((item) => item.kind === 'order').map((item) => item.order_number), ['MCO 9001']);
  assert.equal('business_today' in home, false);
  assert.equal('last_7_days' in home, false);
});

test('Home reconciles operational groups, non-zero exceptions and five deterministic actions', () => {
  const orders = [
    order({ order_number:'MCO 9010', service_tier:'express', promised_by:'2026-09-01T14:00:00.000Z', sla:{ status:'late' }, next_action:{ code:'await_payment', label:'AGUARDAR PAGAMENTO' } }),
    order({ order_number:'MCO 9011', service_tier:'express', promised_by:'2026-09-01T17:00:00.000Z', sla:{ status:'risk' } }),
    order({ order_number:'MCO 9012', custody_state:'awaiting_pickup', production_state:'awaiting_intake', pickup_window_start:null,
      next_action:{ code:'operational_blocker', label:'ESTADO OPERACIONAL INVÁLIDO' }, items:[] }),
    order({ order_number:'MCO 9013', custody_state:'with_driver_pickup', production_state:'awaiting_intake', items:[] }),
    order({ order_number:'MCO 9014', custody_state:'at_laundry', production_state:'ready', payment_status:'paid' }),
    order({ order_number:'MCO 9015', custody_state:'bell_desk', production_state:'ready', payment_status:'paid' })
  ];
  const home = buildHomeProjection({ operational:snapshot(orders), actor:OPERATOR, now:NOW });
  assert.equal(home.operation.pickups.count, 1);
  assert.equal(home.operation.with_driver.count, 1);
  assert.equal(home.operation.processing.count, 2);
  assert.equal(home.operation.ready.count, 2);
  assert.equal(home.next_actions.length, 5);
  assert.deepEqual(home.next_actions.slice(0, 3).map((item) => item.order_number), ['MCO 9010', 'MCO 9011', 'MCO 9012']);
  assert.ok(home.needs_attention.every((item) => item.count > 0));
  assert.equal(home.needs_attention.find((item) => item.key === 'express_late').count, 1);
  assert.equal(home.needs_attention.find((item) => item.key === 'express_risk').count, 1);
  assert.equal(home.needs_attention.some((item) => item.key === 'express_attention'), false);
  assert.equal(home.needs_attention.find((item) => item.key === 'ready_for_dispatch').count, 1);
});

test('every Home order-card count equals the complete queue selected by its target', () => {
  const orders = [
    order({ order_number:'MCO 9101', custody_state:'awaiting_pickup', production_state:'awaiting_intake', items:[] }),
    order({ order_number:'MCO 9102', custody_state:'with_driver_pickup', production_state:'awaiting_intake', items:[] }),
    order({ order_number:'MCO 9103', custody_state:'at_laundry', production_state:'processing' }),
    order({ order_number:'MCO 9104', custody_state:'at_laundry', production_state:'processing' }),
    order({ order_number:'MCO 9105', custody_state:'at_laundry', production_state:'ready', payment_status:'paid' }),
    order({ order_number:'MCO 9106', custody_state:'bell_desk', production_state:'ready', payment_status:'paid' }),
    order({ order_number:'MCO 9107', service_tier:'express', promised_by:'2026-09-01T17:00:00.000Z',
      sla:{ status:'risk' }, payment_status:'invoice_created' })
  ];
  const home = buildHomeProjection({ operational:snapshot(orders), actor:OPERATOR, now:NOW });
  const active = orders.filter((row) => !row.is_qa && !['cancelled', 'delivered'].includes(row.order_status)
    && row.custody_state !== 'delivered');
  for (const card of Object.values(home.operation)) {
    assert.equal(card.count, active.filter((row) => isInQueue(row, card.target.queue, {
      settings:{ timezone:'America/New_York' }, today:'2026-09-01'
    })).length, card.target.queue);
  }
  for (const card of home.needs_attention.filter((item) => item.target.queue)) {
    assert.equal(card.count, active.filter((row) => isInQueue(row, card.target.queue, {
      settings:{ timezone:'America/New_York' }, today:'2026-09-01'
    })).length, card.target.queue);
  }
});

test('Owner metrics use matching paid cohorts, actual weight dates and null delta semantics', () => {
  const orders = [order(), order({ order_number:'MCO 9020', accepted_at:'2026-08-31T23:00:00.000Z',
    items:[{ actual_lbs:5, weighed_at:'2026-08-31T23:30:00.000Z' }] })];
  const home = buildHomeProjection({ operational:snapshot(orders), financeToday:finance(),
    financeCurrent:finance({ revenue:700, orders:10, average:70, customers:8, repeat:2 }, '2026-08-26', '2026-09-01'),
    financePrevious:finance({ revenue:0, orders:0, average:null, customers:0 }, '2026-08-19', '2026-08-25'), actor:OWNER, now:NOW });
  assert.equal(home.business_today.revenue, 120);
  assert.equal(home.business_today.average_paid_order, 60);
  assert.equal(home.business_today.orders_accepted, 1);
  assert.equal(home.business_today.pounds, 10);
  assert.equal(home.business_today.orders_weighed, 1);
  assert.equal(home.last_7_days.delta_percent.revenue, null);
  assert.equal(home.last_7_days.current.repeat_orders, 2);
});

test('Orlando date boundaries remain calendar-correct across DST', () => {
  assert.equal(localDate('2026-03-08T04:59:59.000Z'), '2026-03-07');
  assert.equal(localDate('2026-03-08T05:00:00.000Z'), '2026-03-08');
  assert.equal(localDate('2026-11-01T03:59:59.000Z'), '2026-10-31');
  assert.equal(localDate('2026-11-01T04:00:00.000Z'), '2026-11-01');
});

test('Operator Home never invokes finance and serializes no financial fields', async () => {
  let financeCalls = 0;
  const service = systemHomeService({ now:() => NOW,
    operationsService:{ today:async () => snapshot([order()]) },
    financeService:{ report:async () => { financeCalls += 1; throw new Error('must not run'); } } });
  const home = await service.report(OPERATOR);
  assert.equal(financeCalls, 0);
  const serialized = JSON.stringify(home);
  assert.doesNotMatch(serialized, /business_today|last_7_days|confirmed_service_revenue|average_paid_order/);
});

test('Home API is authenticated, GET-only, private and Operator-safe', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE, node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'home-local-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team'; process.env.NODE_ENV = 'test';
  globalThis.__A7_OPERATIONAL_STORE__ = new MemoryOperationalStore();
  const cookie = `${auth.COOKIE_NAME}=${encodeURIComponent(auth.signSession(OPERATOR, process.env))}`;
  try {
    const unauthenticated = response(); await homeApi({ method:'GET', headers:{} }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);
    const wrongMethod = response(); await homeApi({ method:'POST', headers:{ cookie } }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);
    const operator = response(); await homeApi({ method:'GET', headers:{ cookie } }, operator);
    assert.equal(operator.statusCode, 200);
    assert.equal(operator.headers['Cache-Control'], 'private, no-store, max-age=0');
    assert.equal('business_today' in operator.payload.home, false);
    assert.equal('last_7_days' in operator.payload.home, false);
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({ A7_SYSTEM_SESSION_SECRET:prior.secret,
      A7_SYSTEM_ACCESS_MODE:prior.mode, NODE_ENV:prior.node })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});
