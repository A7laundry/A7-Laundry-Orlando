import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MemoryOperationalStore } = require('../lib/operational-store.js');
const { systemInvoiceService, invoiceFacts } = require('../lib/system-invoice-service.js');
const { nextActionFor } = require('../lib/system-operations-service.js');
const { signSession, issueSubmission, COOKIE_NAME, SUBMISSION_COOKIE_NAME } = require('../lib/system-auth.js');
const invoiceApi = require('../api/system/order-invoices.js');

const NOW = new Date('2026-08-30T18:00:00.000Z');
const OWNER = { actor_id:'actor_invoice_owner', display_name:'Owner QA', role:'owner' };
const MANAGER = { actor_id:'actor_invoice_manager', display_name:'Manager QA', role:'manager' };

function addReadyOrder(store, values = {}) {
  const customerId = crypto.randomUUID();
  const leadId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  store.customers.set(customerId, { id:customerId, wa_id:'14075551234', profile_name:'Invoice Customer' });
  store.leads.set(leadId, { id:leadId, customer_id:customerId, status:'order_accepted', language:'en',
    accommodation_type:'hotel', operational_data:{ property:'Invoice Hotel', order_notes:values.order_notes || null } });
  const order = { id:orderId, lead_id:leadId, customer_id:customerId, order_number:values.order_number || 'MCO 2201',
    order_status:values.order_status || 'weighed', payment_status:values.payment_status || 'pending',
    service_tier:'normal', pricing_model:'per_lb', custody_state:'at_laundry',
    production_state:values.production_state || 'ready', accepted_at:'2026-08-30T12:00:00.000Z',
    pickup_window_start:'2026-08-30T13:00:00.000Z', pickup_window_end:'2026-08-30T14:00:00.000Z',
    actual_lbs:values.actual_lbs ?? 8, weighed_at:'2026-08-30T15:00:00.000Z', version:1,
    is_qa:Boolean(values.is_qa), payment_link_id:values.payment_link_id || null };
  store.orders.set(order.id, order);
  const items = values.items || [
    { id:crypto.randomUUID(), order_id:order.id, label:'Wash & Fold', unit:'lb', quantity:null,
      unit_price:3.25, minimum_amount:50, actual_lbs:8, subtotal:26, requires_manual_review:false },
    { id:crypto.randomUUID(), order_id:order.id, label:'Comforter', unit:'piece', quantity:1,
      unit_price:20, minimum_amount:null, actual_lbs:null, subtotal:null, requires_manual_review:false }
  ];
  store.orderItems.set(order.id, items);
  return { order, items };
}

function response() {
  return { statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; } };
}

test('W1C-B1 derives immutable lines and applies the governed minimum exactly once', async () => {
  const store = new MemoryOperationalStore();
  const { order } = addReadyOrder(store);
  const service = systemInvoiceService({ operationalStore:store, now:() => NOW });
  const context = await service.context(order.order_number);
  assert.equal(context.preview.item_subtotal, 46);
  assert.equal(context.preview.minimum_amount, 50);
  assert.equal(context.preview.minimum_adjustment, 4);
  assert.equal(context.preview.service_amount, 50);
  assert.equal(context.preview.tip_amount, 0);
  assert.equal('facts_hash' in context.preview, false);
  assert.equal('order_item_id' in context.preview.lines[0], false);
  assert.equal(context.preview.lines.filter((line) => line.line_type === 'minimum_adjustment').length, 1);
  const requestId = crypto.randomUUID();
  const issued = await service.review({ order_number:order.order_number, expected_invoice_version:0,
    request_id:requestId, service_amount:999, tip_amount:99, invoice_id:'browser-id' }, OWNER);
  assert.equal(issued.invoice.version, 1);
  assert.equal(issued.invoice.service_amount, 50);
  const firstInvoiceId = store.orders.get(order.id).invoice_id;
  assert.match(firstInvoiceId, /^[0-9a-f-]{36}$/i);
  assert.equal(store.orders.get(order.id).payment_status, 'invoice_created');
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'invoice_created').length, 1);
  store.orderItems.get(order.id)[1].quantity = 9;
  store.orders.get(order.id).order_status = 'cancelled';
  const retry = await service.review({ order_number:order.order_number, expected_invoice_version:0,
    request_id:requestId }, OWNER);
  assert.equal(retry.duplicate, true);
  assert.equal(store.systemInvoices.size, 1);
  await assert.rejects(() => service.review({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Conflicting retry', request_id:requestId }, OWNER), /Idempotency key conflicts/);
});

test('W1C-B1 replacement requires changed facts, expected version and reason', async () => {
  const store = new MemoryOperationalStore();
  const { order, items } = addReadyOrder(store, { order_number:'MCO 2202' });
  const service = systemInvoiceService({ operationalStore:store, now:() => NOW });
  const first = await service.review({ order_number:order.order_number, expected_invoice_version:0,
    request_id:crypto.randomUUID() }, OWNER);
  await assert.rejects(() => service.review({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Checked again', request_id:crypto.randomUUID() }, OWNER), /facts have not changed/);
  items[1].quantity = 2;
  await assert.rejects(() => service.review({ order_number:order.order_number, expected_invoice_version:1,
    request_id:crypto.randomUUID() }, OWNER), /reason is required/);
  await assert.rejects(() => service.review({ order_number:order.order_number, expected_invoice_version:0,
    reason:'Added second comforter', request_id:crypto.randomUUID() }, OWNER), /version is stale/);
  const replaced = await service.review({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Added second comforter', request_id:crypto.randomUUID() }, OWNER);
  assert.equal(replaced.invoice.version, 2);
  assert.equal(replaced.invoice.service_amount, 66);
  assert.equal((await service.context(order.order_number)).invoices.find((row) => row.version === 1).status, 'superseded');
  const firstInternal = [...store.systemInvoices.values()].find((row) => row.version === first.invoice.version);
  assert.equal(store.systemInvoiceLines.get(firstInternal.id)[1].quantity, 1);
  assert.equal([...store.events.values()].filter((event) => event.event_name === 'invoice_created').length, 1);
});

test('W1C-B1 void preserves history and paid or linked invoices remain immutable', async () => {
  const store = new MemoryOperationalStore();
  const { order } = addReadyOrder(store, { order_number:'MCO 2203' });
  const service = systemInvoiceService({ operationalStore:store, now:() => NOW });
  const issued = await service.review({ order_number:order.order_number, expected_invoice_version:0,
    request_id:crypto.randomUUID() }, OWNER);
  await assert.rejects(() => service.void({ order_number:order.order_number, expected_invoice_version:1,
    reason:'', request_id:crypto.randomUUID() }, OWNER), /reason is required/);
  order.payment_link_id = 'plink_known';
  await assert.rejects(() => service.void({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Customer cancelled before payment', request_id:crypto.randomUUID() }, OWNER), /Linked invoice/);
  order.payment_link_id = null;
  const requestId = crypto.randomUUID();
  const voided = await service.void({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Customer cancelled before payment', request_id:requestId }, OWNER);
  assert.equal(voided.invoice.status, 'void');
  assert.equal(store.orders.get(order.id).invoice_id, null);
  assert.equal(store.orders.get(order.id).payment_status, 'void');
  store.orders.get(order.id).order_status = 'cancelled';
  assert.equal((await service.void({ order_number:order.order_number, expected_invoice_version:1,
    reason:'Customer cancelled before payment', request_id:requestId }, OWNER)).duplicate, true);
  store.orders.get(order.id).order_status = 'invoice_created';
  await assert.rejects(() => service.review({ order_number:order.order_number, expected_invoice_version:0,
    request_id:crypto.randomUUID() }, OWNER), /Voided invoice cannot be reissued/);
  const paidStore = new MemoryOperationalStore();
  const paid = addReadyOrder(paidStore, { order_number:'MCO 2204', payment_status:'paid' });
  assert.throws(() => invoiceFacts(paidStore.operationalRow(paid.order)), /Paid invoice is immutable/);
});

test('W1C-B1 blocks unresolved facts, QA and non-Owner access', async () => {
  const store = new MemoryOperationalStore();
  const unresolved = addReadyOrder(store, { order_number:'MCO 2205', items:[
    { id:crypto.randomUUID(), label:'Special item', unit:'piece', quantity:1, unit_price:null,
      minimum_amount:null, requires_manual_review:true }
  ] });
  const service = systemInvoiceService({ operationalStore:store, now:() => NOW });
  const context = await service.context(unresolved.order.order_number);
  assert.equal(context.can_review, false);
  assert.match(context.blocker, /manual-review/);
  await assert.rejects(() => service.review({ order_number:unresolved.order.order_number,
    expected_invoice_version:0, request_id:crypto.randomUUID() }, OWNER), /manual-review/);
  const qa = addReadyOrder(store, { order_number:'MCO 2206', is_qa:true, order_notes:'QA DO NOT FULFILL' });
  await assert.rejects(() => service.review({ order_number:qa.order.order_number,
    expected_invoice_version:0, request_id:crypto.randomUUID() }, OWNER), /QA orders/);
  await assert.rejects(() => service.review({ order_number:'MCO 2205', expected_invoice_version:0,
    request_id:crypto.randomUUID() }, { actor_id:'operator', role:'operator' }), /Owner authorization/);
});

test('W1C-B1 permits Manager invoice authority without granting team administration', async () => {
  const store = new MemoryOperationalStore();
  const ready = addReadyOrder(store, { order_number:'MCO 2298' });
  const invoice = await systemInvoiceService({ operationalStore:store, now:() => NOW }).review({
    order_number:ready.order.order_number, expected_invoice_version:0, request_id:crypto.randomUUID()
  }, MANAGER);
  assert.equal(invoice.invoice.status, 'issued');
});

test('W1C-B1 API is private, same-origin and does not accept browser financial authority', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE, node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w1c-b1-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team'; process.env.NODE_ENV = 'production';
  try {
    let res = response();
    await invoiceApi({ method:'POST', headers:{ origin:'https://a7laundry.com' }, body:{ action:'context' } }, res);
    assert.equal(res.statusCode, 401);
    const session = signSession(OWNER); const submission = issueSubmission();
    res = response();
    await invoiceApi({ method:'POST', headers:{ origin:'https://example.test',
      cookie:`${COOKIE_NAME}=${encodeURIComponent(session)}; ${SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}` },
    body:{ action:'review', order_number:'MCO 2201', service_amount:1, tip_amount:1 } }, res);
    assert.equal(res.statusCode, 403);
  } finally {
    if (prior.secret == null) delete process.env.A7_SYSTEM_SESSION_SECRET; else process.env.A7_SYSTEM_SESSION_SECRET = prior.secret;
    if (prior.mode == null) delete process.env.A7_SYSTEM_ACCESS_MODE; else process.env.A7_SYSTEM_ACCESS_MODE = prior.mode;
    if (prior.node == null) delete process.env.NODE_ENV; else process.env.NODE_ENV = prior.node;
  }
});

test('W1C-B1 static contract is additive and isolated from Stripe, WhatsApp and analytics', () => {
  const migration = fs.readFileSync(new URL('../supabase/migrations/20260830080000_orlando_os_w1c_b1_reviewed_invoice.sql', import.meta.url), 'utf8');
  const rollback = fs.readFileSync(new URL('../supabase/rollbacks/20260830080000_orlando_os_w1c_b1_reviewed_invoice.rollback.sql', import.meta.url), 'utf8');
  const api = fs.readFileSync(new URL('../api/system/order-invoices.js', import.meta.url), 'utf8');
  const service = fs.readFileSync(new URL('../lib/system-invoice-service.js', import.meta.url), 'utf8');
  const ui = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  assert.match(migration, /a7_orlando_invoices/);
  assert.match(migration, /a7_orlando_invoice_lines/);
  assert.match(migration, /tip_amount numeric not null default 0 check \(tip_amount = 0\)/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /a7_orlando_w1c_b1_resolve_action_retry/);
  assert.match(rollback, /invoice evidence exists; keep additive schema/);
  assert.doesNotMatch(`${migration}\n${api}\n${service}`, /graph\.facebook|WHATSAPP_BRIDGE_TOKEN|STRIPE_SECRET|googletagmanager|dataLayer/);
  assert.doesNotMatch(service, /raw\.service_amount|raw\.tip_amount|raw\.invoice_id|raw\.unit_price|raw\.minimum_amount/);
  assert.match(ui, /\/api\/system\/invoice-draft/);
  assert.match(ui, /\/api\/system\/order-invoices/);
  assert.match(ui, /document_type:'invoice_preview'/);
  assert.match(ui, /Prévia gerada com o template oficial A7_ORLANDO_INVOICE_V4/);
  assert.doesNotMatch(ui, /invoiceFactsCard\(context\.preview, context\.current_invoice/);
  assert.doesNotMatch(ui, /service_amount\s*:\s*.*invoice|tip_amount\s*:\s*.*invoice|invoice_id\s*:\s*.*invoice/);
  assert.deepEqual(nextActionFor({ order_status:'weighed', payment_status:'pending', service_tier:'normal',
    custody_state:'at_laundry', production_state:'ready', items:[] }),
  { code:'review_invoice', label:'REVISAR INVOICE', enabled:true });
});
