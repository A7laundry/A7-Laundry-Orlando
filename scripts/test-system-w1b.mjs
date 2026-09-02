import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MemoryOperationalStore, InvalidTransitionError } = require('../lib/operational-store.js');
const {
  systemOperationsService, normalizeSettings, slaFor, nextActionFor, comparePriority,
  zonedLocalToUtc, validateTransition, decorateSnapshot
} = require('../lib/system-operations-service.js');
const { systemW1bSmokeService } = require('../lib/system-w1b-smoke-service.js');
const { signSession, issueSubmission, COOKIE_NAME, SUBMISSION_COOKIE_NAME } = require('../lib/system-auth.js');
const todayApi = require('../api/system/today.js');
const operationalApi = require('../api/system/operational-orders.js');
const operationDraftApi = require('../api/system/operation-draft.js');
const w1bSmokeApi = require('../api/system/w1b-smoke.js');

const NOW = new Date('2026-08-30T14:00:00.000Z');
const OWNER = { actor_id:'actor_test_owner', display_name:'Owner QA', role:'owner' };
const OPERATOR = { actor_id:'actor_test_operator', display_name:'Operator QA', role:'operator' };

function addOrder(store, values = {}) {
  const customerId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  store.customers.set(customerId, {
    id:customerId, wa_id:values.phone || `1407555${String(store.orders.size + 1000).slice(-4)}`,
    profile_name:values.customer_name || `Customer ${store.orders.size + 1}`
  });
  store.leads.set(leadId, {
    id:leadId, customer_id:customerId, status:'order_accepted', language:'en',
    accommodation_type:values.accommodation_type || 'hotel',
    operational_data:{ property:values.property || 'Orlando Hotel', room:'QA-1',
      needed_by:values.needed_by || null, order_notes:values.order_notes || null }
  });
  const order = {
    id:orderId, lead_id:leadId, customer_id:customerId, order_number:values.order_number || `MCO ${1100 + store.orders.size}`,
    order_status:values.order_status || 'accepted', payment_status:values.payment_status || 'pending',
    service_tier:values.service_tier || 'normal', custody_state:values.custody_state ?? 'with_customer',
    production_state:values.production_state ?? 'awaiting_intake', promised_by:values.promised_by || null,
    operational_waiting_since:values.operational_waiting_since || '2026-08-30T10:00:00.000Z',
    pickup_window_start:values.pickup_window_start || '2026-08-30T15:00:00.000Z',
    pickup_window_end:values.pickup_window_end || '2026-08-30T16:00:00.000Z',
    accepted_at:values.accepted_at || '2026-08-30T10:00:00.000Z', estimated_lbs:12,
    bags_expected:2, is_qa:Boolean(values.is_qa), service_amount:values.service_amount ?? null,
    version:1, promise_version:0
  };
  store.orders.set(orderId, order);
  store.orderItems ||= new Map();
  store.orderItems.set(orderId, [{ label:'Wash & Fold', unit:'lb', estimated_lbs:12, quantity:null, requires_manual_review:false }]);
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

test('W1B SLA fails closed without approval and uses the Owner-approved governed thresholds', () => {
  const order = { service_tier:'express', promised_by:'2026-08-30T16:00:00.000Z' };
  assert.equal(slaFor(order, normalizeSettings({ express_sla:{ status:'pending_approval' } }), NOW).status,
    'not_configured');
  const settings = normalizeSettings();
  assert.deepEqual(settings, {
    timezone:'America/New_York', status:'approved', attention_minutes:240, risk_minutes:120
  });
  assert.equal(slaFor({ ...order, promised_by:'2026-08-30T19:00:00.000Z' }, settings, NOW).status, 'ok');
  assert.equal(slaFor({ ...order, promised_by:'2026-08-30T18:00:00.000Z' }, settings, NOW).status, 'attention');
  assert.equal(slaFor(order, settings, NOW).status, 'risk');
  assert.equal(slaFor({ ...order, promised_by:'2026-08-30T13:59:00.000Z' }, settings, NOW).status, 'late');
});

test('W1B converts an approved Orlando local promise and rejects a nonexistent DST time', () => {
  assert.equal(zonedLocalToUtc('2026-08-30T10:00'), '2026-08-30T14:00:00.000Z');
  assert.throws(() => zonedLocalToUtc('2026-03-08T02:30'), /not a valid Orlando local time/);
});

test('W1B next action is a single deterministic server rule and blocks W1C weight', () => {
  const base = { is_qa:false, order_status:'accepted', payment_status:'pending', service_tier:'normal',
    custody_state:'with_customer', production_state:'awaiting_intake' };
  assert.equal(nextActionFor(base).code, 'schedule_pickup');
  assert.equal(nextActionFor({ ...base, order_status:'pickup_scheduled', custody_state:'awaiting_pickup' }).code, 'assign_pickup_driver');
  assert.equal(nextActionFor({ ...base, order_status:'pickup_scheduled', custody_state:'awaiting_pickup',
    pickup_driver:{ driver_id:crypto.randomUUID(), name:'Driver QA' } }).code, 'confirm_pickup');
  assert.equal(nextActionFor({ ...base, order_status:'picked_up', custody_state:'with_driver_pickup' }).code, 'receive_at_laundry');
  assert.deepEqual(nextActionFor({ ...base, order_status:'picked_up', custody_state:'at_laundry', production_state:'awaiting_weight' }),
    { code:'record_weight', label:'REGISTRAR PESO', enabled:false, blocked_by:'W1C' });
  assert.equal(nextActionFor({ ...base, custody_state:'at_laundry', production_state:'processing' }).code, 'mark_ready');
  assert.equal(nextActionFor({ ...base, is_qa:true }).code, 'qa_read_only');
  assert.equal(nextActionFor({ ...base, custody_state:'not_initialized' }).code, 'operational_blocker');
});

test('W1B Today counters exclude QA and priority is late, risk, overdue, promise, window, oldest', async () => {
  const store = new MemoryOperationalStore();
  store.operationalSettings = { timezone:'America/New_York', status:'approved', attention_minutes:240, risk_minutes:120 };
  addOrder(store, { order_number:'MCO 1201', service_tier:'express', promised_by:'2026-08-30T13:00:00.000Z',
    order_status:'picked_up', custody_state:'at_laundry', production_state:'awaiting_weight' });
  addOrder(store, { order_number:'MCO 1202', service_tier:'express', promised_by:'2026-08-30T15:00:00.000Z',
    order_status:'pickup_scheduled', custody_state:'awaiting_pickup' });
  addOrder(store, { order_number:'MCO 1203', needed_by:'2026-08-30T13:30:00.000Z',
    order_status:'picked_up', custody_state:'at_laundry', production_state:'processing' });
  addOrder(store, { order_number:'MCO 1204', is_qa:true, order_notes:'QA DO NOT FULFILL',
    service_tier:'express', promised_by:'2026-08-30T12:00:00.000Z', custody_state:'at_laundry', production_state:'ready' });
  const waitingCustomer = crypto.randomUUID(); const waitingLead = crypto.randomUUID();
  store.customers.set(waitingCustomer, { id:waitingCustomer, wa_id:'14075551234', profile_name:'Waiting Guest' });
  store.leads.set(waitingLead, { id:waitingLead, customer_id:waitingCustomer, status:'qualified', customer_type:'guest',
    created_at:'2026-08-30T12:00:00.000Z', operational_data:{ property:'Waiting Hotel' } });
  const today = await systemOperationsService({ operationalStore:store, now:() => NOW, env:{} }).today();
  assert.equal(today.counters.waiting_confirmation, 1);
  assert.deepEqual(today.waiting_leads[0], { lead_ref:null, customer_name:'Waiting Guest', whatsapp_last4:'1234', property:'Waiting Hotel',
    customer_type:'guest', created_at:'2026-08-30T12:00:00.000Z', status:'qualified' });
  assert.equal(today.counters.express_attention, 0);
  assert.equal(today.counters.express_risk, 1);
  assert.equal(today.counters.express_late, 1);
  assert.equal(today.counters.at_laundry, 2);
  assert.equal(today.counters.awaiting_weight, 1);
  assert.equal(today.counters.processing, 1);
  assert.deepEqual(today.orders.map((order) => order.order_number), ['MCO 1204', 'MCO 1201', 'MCO 1202', 'MCO 1203']);
  const real = today.orders.filter((order) => !order.is_qa).sort(comparePriority);
  assert.deepEqual(real.map((order) => order.order_number), ['MCO 1201', 'MCO 1202', 'MCO 1203']);
});

test('W1B queues search privately and preserve numeric and legacy lookup', async () => {
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 1002', customer_name:'Taylor Schultz', property:'Omni Orlando Resort' });
  addOrder(store, { order_number:'A7-ORL-1000', customer_name:'Legacy Guest', property:'Legacy Hotel' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  assert.equal((await operations.list({ query:'1002' })).orders[0].order_number, 'MCO 1002');
  assert.equal((await operations.list({ query:'A7-ORL-1000' })).orders[0].order_number, 'A7-ORL-1000');
  assert.equal((await operations.list({ query:'Taylor' })).orders.length, 1);
  assert.equal((await operations.list({ query:'Omni' })).orders.length, 1);
  assert.equal((await operations.list({ custody_state:'with_customer', production_state:'awaiting_intake' })).orders.length, 2);
  assert.equal((await operations.list({ custody_state:'at_laundry' })).orders.length, 0);
  await assert.rejects(() => operations.list({ custody_state:'invented' }), /Custody filter is invalid/);
});

test('W1B preserves unavailable Today evidence instead of manufacturing a zero', () => {
  const result = decorateSnapshot({ settings:{ timezone:'America/New_York', status:'pending_approval' },
    waiting_confirmation:null, orders:[] }, NOW);
  assert.equal(result.counters.waiting_confirmation, null);
  assert.deepEqual(result.waiting_leads, []);
});

test('W1B valid custody transitions append timeline once; invalid and conflicting retries fail', async () => {
  const store = new MemoryOperationalStore();
  const order = addOrder(store, { order_number:'MCO 1301' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  const requestId = crypto.randomUUID();
  const scheduled = await operations.transition({ order_number:'MCO 1301', action:'schedule_pickup', request_id:requestId }, OWNER);
  assert.equal(scheduled.order.custody_state, 'awaiting_pickup');
  const retry = await operations.transition({ order_number:'MCO 1301', action:'schedule_pickup', request_id:requestId }, OWNER);
  assert.equal(retry.duplicate, true);
  assert.equal(store.operationalEvents.size, 1);
  await assert.rejects(() => operations.transition({ order_number:'MCO 1301', action:'receive_at_laundry', request_id:crypto.randomUUID() }, OWNER),
    /cannot be received/);
  await assert.rejects(() => operations.transition({ order_number:'MCO 1301', action:'confirm_pickup', request_id:requestId }, OWNER),
    /conflicts/);
  assert.equal(store.orders.get(order.id).order_status, 'pickup_scheduled');
});

test('W1B production ready never forces payment and delivery still requires paid lifecycle', async () => {
  const store = new MemoryOperationalStore();
  const order = addOrder(store, { order_number:'MCO 1302', order_status:'picked_up', custody_state:'at_laundry', production_state:'processing' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  const result = await operations.transition({ order_number:'MCO 1302', action:'mark_ready', request_id:crypto.randomUUID() }, OWNER);
  assert.equal(result.order.production_state, 'ready');
  assert.equal(result.order.payment_status, 'pending');
  assert.equal(store.orders.get(order.id).order_status, 'picked_up');
  await assert.rejects(() => operations.transition({ order_number:'MCO 1302', action:'start_delivery', request_id:crypto.randomUUID() }, OWNER),
    /cannot start/);
});

test('W1B operator can mark a processing order ready and no other transition', async () => {
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 1305', order_status:'invoice_created', payment_status:'paid',
    custody_state:'at_laundry', production_state:'processing' });
  addOrder(store, { order_number:'MCO 1306', order_status:'accepted', custody_state:'with_customer',
    production_state:'awaiting_intake' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  const ready = await operations.transition({ order_number:'MCO 1305', action:'mark_ready',
    request_id:crypto.randomUUID() }, OPERATOR);
  assert.equal(ready.order.production_state, 'ready');
  await assert.rejects(() => operations.transition({ order_number:'MCO 1306', action:'schedule_pickup',
    request_id:crypto.randomUUID() }, OPERATOR), /Owner authorization/);
});

test('W1B Express promise requires an Express order and correction reason', async () => {
  const store = new MemoryOperationalStore();
  addOrder(store, { order_number:'MCO 1303', service_tier:'express' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  await operations.transition({ order_number:'MCO 1303', action:'set_promised_by',
    promised_by_local:'2026-08-30T16:00', request_id:crypto.randomUUID() }, OWNER);
  await assert.rejects(() => operations.transition({ order_number:'MCO 1303', action:'set_promised_by',
    promised_by_local:'2026-08-30T17:00', request_id:crypto.randomUUID() }, OWNER), /reason is required/);
});

test('W1B historical null stays uninitialized and QA is read-only in every store', async () => {
  const store = new MemoryOperationalStore();
  const historicalRecord = addOrder(store, { order_number:'MCO 1310' });
  historicalRecord.custody_state = null; historicalRecord.production_state = null;
  addOrder(store, { order_number:'MCO 1311', is_qa:true, order_notes:'QA DO NOT FULFILL' });
  const operations = systemOperationsService({ operationalStore:store, now:() => NOW });
  const historical = await operations.detail('MCO 1310');
  assert.equal(historical.custody_state, 'not_initialized');
  assert.equal(historical.production_state, 'not_initialized');
  assert.equal(historical.next_action.code, 'operational_blocker');
  await assert.rejects(() => operations.transition({ order_number:'MCO 1311', action:'schedule_pickup',
    request_id:crypto.randomUUID() }, OWNER), /QA orders are read-only/);
});

test('W1B transition validation accepts only bounded actions, human numbers and UUID request identity', () => {
  const settings = normalizeSettings();
  assert.throws(() => validateTransition({ order_number:'MCO 1002', action:'fly', request_id:crypto.randomUUID() }, settings), /action/);
  assert.throws(() => validateTransition({ order_number:'unknown', action:'schedule_pickup', request_id:crypto.randomUUID() }, settings), /number/);
  assert.throws(() => validateTransition({ order_number:'MCO 1002', action:'schedule_pickup', request_id:'retry' }, settings), /identity/);
});

test('W1B private APIs return 401 without auth and allow authenticated operator read access', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w1b-test-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  try {
    const unauth = response();
    await todayApi({ method:'GET', headers:{} }, unauth);
    assert.equal(unauth.statusCode, 401);
    const token = signSession({ actor_id:'actor_operator', display_name:'Operator', role:'operator' });
    const allowed = response();
    await operationalApi({ method:'POST', headers:{ cookie:`${COOKIE_NAME}=${encodeURIComponent(token)}` },
      body:{ action:'list', queue:'all' } }, allowed);
    assert.equal(allowed.statusCode, 200);
    const today = response();
    await todayApi({ method:'GET', headers:{ cookie:`${COOKIE_NAME}=${encodeURIComponent(token)}` } }, today);
    assert.equal(today.statusCode, 200);
    const draft = response();
    await operationDraftApi({ method:'POST', headers:{ cookie:`${COOKIE_NAME}=${encodeURIComponent(token)}`,
      origin:'http://localhost:3000' } }, draft);
    assert.equal(draft.statusCode, 201);
  } finally {
    if (prior.secret == null) delete process.env.A7_SYSTEM_SESSION_SECRET; else process.env.A7_SYSTEM_SESSION_SECRET = prior.secret;
    if (prior.mode == null) delete process.env.A7_SYSTEM_ACCESS_MODE; else process.env.A7_SYSTEM_ACCESS_MODE = prior.mode;
  }
});

test('W1B operational writes require an Owner-bound HttpOnly draft identity', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w1b-test-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  try {
    const token = signSession(OWNER);
    const headers = { cookie:`${COOKIE_NAME}=${encodeURIComponent(token)}` };
    const draft = response();
    await operationDraftApi({ method:'POST', headers }, draft);
    assert.equal(draft.statusCode, 201);
    assert.match(String(draft.headers['set-cookie']), /HttpOnly; Secure; SameSite=Strict/);
    const missing = response();
    await operationalApi({ method:'POST', headers, body:{ action:'transition', transition_action:'schedule_pickup', order_number:'MCO 1002' } }, missing);
    assert.equal(missing.statusCode, 409);
    assert.equal(missing.payload.code, 'submission_required');
  } finally {
    if (prior.secret == null) delete process.env.A7_SYSTEM_SESSION_SECRET; else process.env.A7_SYSTEM_SESSION_SECRET = prior.secret;
    if (prior.mode == null) delete process.env.A7_SYSTEM_ACCESS_MODE; else process.env.A7_SYSTEM_ACCESS_MODE = prior.mode;
  }
});

test('W1B transactional smoke exercises the real transition contract twice with zero residue', async () => {
  const store = new MemoryOperationalStore();
  const result = await systemW1bSmokeService({ operationalStore:store, now:() => NOW })
    .run(OWNER, crypto.randomUUID());
  assert.deepEqual(result, {
    passed:true, first_duplicate:false, retry_duplicate:true, event_count:1,
    final_order_status:'pickup_scheduled', final_custody_state:'awaiting_pickup', residue_count:0
  });
  assert.equal(store.orders.size, 0);
  await assert.rejects(
    () => systemW1bSmokeService({ operationalStore:store }).run({ ...OWNER, role:'operator' }, crypto.randomUUID()),
    /Owner authorization/
  );
});

test('W1B transactional smoke endpoint is Owner-only, same-origin and submission-bound', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE,
    store:globalThis.__A7_OPERATIONAL_STORE__ };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w1b-smoke-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  globalThis.__A7_OPERATIONAL_STORE__ = new MemoryOperationalStore();
  try {
    const unauth = response();
    await w1bSmokeApi({ method:'POST', headers:{}, body:{ confirm:'W1B_TRANSACTIONAL_SMOKE' } }, unauth);
    assert.equal(unauth.statusCode, 401);

    const session = signSession(OWNER);
    const missing = response();
    await w1bSmokeApi({ method:'POST', headers:{ cookie:`${COOKIE_NAME}=${encodeURIComponent(session)}` },
      body:{ confirm:'W1B_TRANSACTIONAL_SMOKE' } }, missing);
    assert.equal(missing.statusCode, 409);

    const submission = issueSubmission();
    const success = response();
    await w1bSmokeApi({ method:'POST', headers:{ origin:'https://a7laundry.com',
      cookie:`${COOKIE_NAME}=${encodeURIComponent(session)}; ${SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}` },
      body:{ confirm:'W1B_TRANSACTIONAL_SMOKE' } }, success);
    assert.equal(success.statusCode, 200);
    assert.equal(success.payload.result.passed, true);
    assert.equal(success.payload.result.residue_count, 0);
    assert.match(String(success.headers['set-cookie']), /Max-Age=0/);
  } finally {
    if (prior.secret == null) delete process.env.A7_SYSTEM_SESSION_SECRET; else process.env.A7_SYSTEM_SESSION_SECRET = prior.secret;
    if (prior.mode == null) delete process.env.A7_SYSTEM_ACCESS_MODE; else process.env.A7_SYSTEM_ACCESS_MODE = prior.mode;
    if (prior.store == null) delete globalThis.__A7_OPERATIONAL_STORE__; else globalThis.__A7_OPERATIONAL_STORE__ = prior.store;
  }
});

test('W1B static contracts keep rules server-side and PII/secrets out of URLs and analytics', () => {
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  const service = fs.readFileSync(new URL('../lib/system-operations-service.js', import.meta.url), 'utf8');
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830040000_orlando_os_w1b_daily_operations.sql', import.meta.url), 'utf8');
  const scheduleFix = fs.readFileSync(new URL('../supabase/migrations/20260830040500_orlando_os_w1b_schedule_pickup_fix.sql', import.meta.url), 'utf8');
  const smokeMigration = fs.readFileSync(new URL('../supabase/migrations/20260830041000_orlando_os_w1b_transactional_smoke.sql', import.meta.url), 'utf8');
  assert.match(service, /function nextActionFor/);
  assert.doesNotMatch(js, /function nextActionFor|attention_minutes\s*=|risk_minutes\s*=/);
  assert.doesNotMatch(`${html}\n${js}`, /googletagmanager|dataLayer|localStorage|sessionStorage/);
  assert.match(html, /id="custodyFilter"/);
  assert.match(html, /id="productionFilter"/);
  assert.match(migration, /pending_approval/);
  assert.match(migration, /values \('orlando', 'America\/New_York', 'approved', 240, 120, 'owner'\)/);
  assert.match(migration, /QA orders are read-only/);
  assert.match(migration, /for update/);
  assert.match(migration, /idempotency_key text not null unique/);
  assert.ok(migration.indexOf('order_number = p_order_number for update')
    < migration.indexOf('where idempotency_key = p_idempotency_key'), 'order lock must precede retry resolution');
  assert.doesNotMatch(migration, /express_attention_minutes[^\n]*default\s+[0-9]/i);
  assert.match(scheduleFix, /when 'pickup_scheduled'/);
  assert.match(scheduleFix, /order_status = 'pickup_scheduled'/);
  assert.match(scheduleFix, /scheduling is recorded only in the W1B operational ledger/);
  assert.doesNotMatch(scheduleFix, /insert into public\.a7_orlando_order_events[\s\S]+pickup_scheduled/);
  assert.match(smokeMigration, /a7_orlando_w1b_transition/);
  assert.match(smokeMigration, /pg_advisory_xact_lock/);
  assert.match(smokeMigration, /residue_count/);
  assert.match(smokeMigration, /grant execute[^;]+service_role/s);
  assert.doesNotMatch(smokeMigration, /stripe|whatsapp|analytics_outbox/i);
});
