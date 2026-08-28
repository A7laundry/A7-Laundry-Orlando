import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import {createRequire} from 'node:module';
import {Readable} from 'node:stream';

const require = createRequire(import.meta.url);
const {MemoryOperationalStore, resolveSupabaseConfig} = require('../lib/operational-store.js');
const {service} = require('../lib/operational-lifecycle.js');
const {safeAnalyticsContext} = require('../lib/operational-lifecycle.js');
const {sendGa4Event, retryOutbox, timestampMicros} = require('../lib/ga4-server.js');
const webhook = require('../api/stripe-webhook.js');
const orderIntake = require('../api/order-intake.js');

const ATTRIBUTION_ID = `at_${'a'.repeat(32)}`;
const SHORT_REF = '7KQ9W3M2HX';
const CUSTOMER_ID = '33333333-3333-4333-8333-333333333333';
const ATTRIBUTION = {
  attribution_id: ATTRIBUTION_ID,
  short_ref: SHORT_REF,
  first_touch: {source: 'google-organic', medium: 'organic', landing_page: '/laundry-pickup-delivery-orlando'},
  last_touch: {source: 'google-organic', medium: 'organic', landing_page: '/laundry-pickup-delivery-orlando'}
};

function attributionStore(record = ATTRIBUTION) {
  return {
    async get(id) { return id === ATTRIBUTION_ID ? record : null; },
    async getByShortRef(ref) { return ref === SHORT_REF ? record : null; }
  };
}

test('operational storage selects one complete credential pair and never mixes namespaces', () => {
  assert.deepEqual(resolveSupabaseConfig({
    A7_OPERATIONS_SUPABASE_URL: 'https://partial-operations.example',
    WHATSAPP_SUPABASE_URL: 'https://whatsapp.example',
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'whatsapp-key',
    A7_ATTRIBUTION_SUPABASE_URL: 'https://attribution.example',
    A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY: 'attribution-key'
  }), {
    source: 'whatsapp',
    url: 'https://whatsapp.example',
    serviceRoleKey: 'whatsapp-key'
  });
  assert.equal(resolveSupabaseConfig({
    A7_OPERATIONS_SUPABASE_URL: 'https://operations.example',
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'wrong-namespace-key'
  }), null);
});

async function acceptedOrder(lifecycle, suffix, customerId = CUSTOMER_ID) {
  const leadResult = await lifecycle.createLead({
    idempotency_key: `lead-${suffix}`,
    lead_origin: 'order_form',
    customer_id: customerId,
    attribution_id: ATTRIBUTION_ID,
    lead_reference: SHORT_REF,
    service_type: 'wash_fold_guest',
    customer_type: 'guest',
    language: 'en',
    service_area_bucket: 'tourist-corridor',
    operational_data: {phone: '+1 407 555 0100', address: 'protected test address'}
  });
  const leadId = leadResult.lead.id;
  await lifecycle.qualifyLead({
    idempotency_key: `qualify-${suffix}`,
    lead_id: leadId,
    service_type: 'wash_fold_guest',
    service_area_accepted: true,
    timing_accepted: true,
    minimum_basis_accepted: true
  });
  const accepted = await lifecycle.acceptOrder({
    idempotency_key: `accept-${suffix}`,
    lead_id: leadId,
    service_type: 'wash_fold_guest',
    pricing_model: 'per_lb',
    analytics_context: {client_id: '123456789.987654321', session_id: '987654321'}
  });
  return {leadId, order: accepted.order};
}

test('P0 lifecycle freezes attribution, separates operations/payment and marks repeat orders', async () => {
  const store = new MemoryOperationalStore();
  const lifecycle = service({operationalStore: store, attributionStore: attributionStore(), env: {}});
  const first = await acceptedOrder(lifecycle, 'one');
  assert.equal(first.order.attribution_confidence, 'deterministic');
  assert.equal(first.order.attribution_snapshot.first_touch.source, 'google-organic');
  assert.equal(first.order.service_amount, null);
  assert.equal(first.order.is_repeat_customer, false);

  await lifecycle.recordTransition({idempotency_key: 'pickup-one', order_id: first.order.id, event_name: 'pickup_completed'});
  await lifecycle.recordTransition({idempotency_key: 'weigh-one', order_id: first.order.id, event_name: 'order_weighed', payload: {actual_lbs: 20}});
  await lifecycle.recordTransition({idempotency_key: 'invoice-one', order_id: first.order.id, event_name: 'invoice_created', payload: {
    invoice_id: 'inv-test-1', service_amount: 65, tip_amount: 0, currency: 'USD'
  }});

  const failed = {id: 'evt_failed_one', type: 'checkout.session.async_payment_failed', created: 1787910000,
    data: {object: {object: 'checkout.session', id: 'cs_test_failed_one', payment_intent: 'pi_stablesaleone',
      metadata: {order_id: first.order.id, lead_id: first.leadId, contract_version: '1'}}}};
  assert.equal((await webhook.processStripeEvent(failed, store)).status, 'failed');
  assert.equal((await store.getOrder(first.order.id)).payment_status, 'failed');
  assert.equal((await webhook.processStripeEvent(failed, store)).duplicate, true);

  const expired = {id: 'evt_expired_one', type: 'checkout.session.expired', created: 1787910600,
    data: {object: {object: 'checkout.session', id: 'cs_test_expired_one', payment_intent: null,
      metadata: {order_id: first.order.id, lead_id: first.leadId, contract_version: '1'}}}};
  assert.equal((await webhook.processStripeEvent(expired, store)).status, 'void');
  assert.equal((await store.getOrder(first.order.id)).payment_status, 'void');

  const paid = {
    id: 'evt_paid_one', type: 'checkout.session.async_payment_succeeded', created: 1787911200,
    data: {object: {object: 'checkout.session', id: 'cs_test_paid_one', payment_status: 'paid',
      payment_intent: 'pi_stablesaleone', payment_link: 'plink_one', amount_total: 6500, currency: 'usd',
      metadata: {order_id: first.order.id, lead_id: first.leadId, contract_version: '1'}}}
  };
  const firstPayment = await webhook.processStripeEvent(paid, store);
  assert.equal(firstPayment.duplicate, false);
  assert.equal(firstPayment.transaction_id, 'pi_stablesaleone');
  const retry = structuredClone(paid);
  retry.id = 'evt_paid_retry';
  retry.data.object.id = 'cs_test_paid_retry';
  assert.equal((await webhook.processStripeEvent(retry, store)).duplicate, true);
  assert.equal(store.payments.size, 1);
  assert.equal(store.events.has('purchase:pi_stablesaleone'), true);
  assert.equal((await store.getOrder(first.order.id)).payment_status, 'paid');
  assert.equal(store.stripeEvents.get('evt_paid_one').event_type, 'checkout.session.async_payment_succeeded');

  const refund = {id: 'evt_refund_one', type: 'refund.created', created: 1787914800,
    data: {object: {object: 'refund', id: 're_test_one', payment_intent: 'pi_stablesaleone',
      amount: 1000, currency: 'usd', status: 'succeeded', created: 1787914800}}};
  await webhook.processStripeEvent(refund, store);
  assert.equal(store.events.has('purchase:pi_stablesaleone'), true);
  assert.equal(store.events.has('refund:re_test_one'), true);
  assert.equal((await store.getOrder(first.order.id)).payment_status, 'partially_refunded');

  const second = await acceptedOrder(lifecycle, 'two');
  assert.equal(second.order.is_repeat_customer, true);
  assert.equal(second.order.customer_order_number, 2);

  const analyticsPayload = JSON.stringify([...store.outbox.values()]);
  for (const forbidden of ['407 555 0100', 'protected test address', 'gclid', 'wbraid']) {
    assert.equal(analyticsPayload.includes(forbidden), false);
  }
});

test('lifecycle rejects idempotency collisions, invalid estimates and repeated or zero-value invoices', async () => {
  const store = new MemoryOperationalStore();
  const lifecycle = service({operationalStore: store, attributionStore: attributionStore(), env: {}});
  const lead = await lifecycle.createLead({idempotency_key: 'lead-hardening', lead_origin: 'manual',
    service_type: 'wash_fold_guest', customer_type: 'guest'});
  await assert.rejects(() => lifecycle.acceptOrder({idempotency_key: 'accept-invalid-estimate',
    lead_id: lead.lead.id, service_type: 'wash_fold_guest', estimated_lbs: -2}), /estimated_lbs/);
  await lifecycle.qualifyLead({idempotency_key: 'shared-transition-key', lead_id: lead.lead.id,
    service_type: 'wash_fold_guest', service_area_accepted: true, timing_accepted: true,
    minimum_basis_accepted: true});
  await assert.rejects(() => lifecycle.acceptOrder({idempotency_key: 'shared-transition-key',
    lead_id: lead.lead.id, service_type: 'wash_fold_guest'}), /Idempotency key conflicts/);

  const accepted = await lifecycle.acceptOrder({idempotency_key: 'accept-hardening',
    lead_id: lead.lead.id, service_type: 'wash_fold_guest', service_tier: 'normal'});
  await lifecycle.recordTransition({idempotency_key: 'pickup-hardening', order_id: accepted.order.id,
    event_name: 'pickup_completed'});
  await lifecycle.recordTransition({idempotency_key: 'weigh-hardening', order_id: accepted.order.id,
    event_name: 'order_weighed', payload: {actual_lbs: 10}});
  await assert.rejects(() => lifecycle.recordTransition({idempotency_key: 'invoice-zero',
    order_id: accepted.order.id, event_name: 'invoice_created',
    payload: {invoice_id: 'inv-zero', service_amount: 0, currency: 'USD'}}), /Invoice amounts are invalid/);
  await assert.rejects(() => lifecycle.recordTransition({idempotency_key: 'invoice-tip',
    order_id: accepted.order.id, event_name: 'invoice_created',
    payload: {invoice_id: 'inv-tip', service_amount: 50, tip_amount: 5, amount_due: 55, currency: 'USD'}}),
  /tips are not enabled/);
  await lifecycle.recordTransition({idempotency_key: 'invoice-hardening', order_id: accepted.order.id,
    event_name: 'invoice_created', payload: {invoice_id: 'inv-hardening', service_amount: 50, currency: 'USD'}});
  assert.equal(store.events.get(store.eventKeys.get('invoice-hardening')).payload.amount_due, 50);
  await assert.rejects(() => lifecycle.recordTransition({idempotency_key: 'invoice-again',
    order_id: accepted.order.id, event_name: 'invoice_created',
    payload: {invoice_id: 'inv-hardening-2', service_amount: 55, currency: 'USD'}}), /Invalid invoice/);
});

test('lead idempotency cannot be reused across customers', async () => {
  const store = new MemoryOperationalStore();
  const lifecycle = service({operationalStore: store, attributionStore: attributionStore(null)});
  await lifecycle.createLead({idempotency_key: 'lead-cross-customer', lead_origin: 'order_form', customer_id: 'customer-one'});
  await assert.rejects(() => lifecycle.createLead({
    idempotency_key: 'lead-cross-customer', lead_origin: 'order_form', customer_id: 'customer-two'
  }), /conflicts with another lead/);
});

test('contract lead and order states are operable, terminal and append-only', async () => {
  const store = new MemoryOperationalStore();
  const lifecycle = service({operationalStore: store, attributionStore: attributionStore(), env: {}});

  const disqualified = await lifecycle.createLead({idempotency_key: 'lead-disqualified',
    lead_origin: 'manual', service_type: 'wash_fold_guest', customer_type: 'guest'});
  await lifecycle.updateLeadStatus({idempotency_key: 'lead-disqualified-start',
    lead_id: disqualified.lead.id, event_name: 'lead_qualification_started'});
  await assert.rejects(() => lifecycle.updateLeadStatus({idempotency_key: 'lead-disqualified-empty',
    lead_id: disqualified.lead.id, event_name: 'lead_disqualified'}), /reason is required/);
  const closed = await lifecycle.updateLeadStatus({idempotency_key: 'lead-disqualified-close',
    lead_id: disqualified.lead.id, event_name: 'lead_disqualified', reason: 'outside_service_area'});
  assert.equal(closed.lead.status, 'disqualified');
  assert.equal((await lifecycle.updateLeadStatus({idempotency_key: 'lead-disqualified-close',
    lead_id: disqualified.lead.id, event_name: 'lead_disqualified', reason: 'outside_service_area'})).duplicate, true);
  await assert.rejects(() => lifecycle.qualifyLead({idempotency_key: 'lead-disqualified-qualify',
    lead_id: disqualified.lead.id, service_type: 'wash_fold_guest', service_area_accepted: true,
    timing_accepted: true, minimum_basis_accepted: true}), /cannot be qualified/);

  const accepted = await acceptedOrder(lifecycle, 'complete-states');
  const start = new Date(Date.now() + 3_600_000).toISOString();
  const end = new Date(Date.now() + 7_200_000).toISOString();
  assert.equal((await lifecycle.recordTransition({idempotency_key: 'schedule-complete-states',
    order_id: accepted.order.id, event_name: 'pickup_scheduled',
    payload: {pickup_window_start: start, pickup_window_end: end}})).order.order_status, 'pickup_scheduled');
  await lifecycle.recordTransition({idempotency_key: 'pickup-complete-states', order_id: accepted.order.id,
    event_name: 'pickup_completed'});
  await lifecycle.recordTransition({idempotency_key: 'weigh-complete-states', order_id: accepted.order.id,
    event_name: 'order_weighed', payload: {actual_lbs: 16}});
  await lifecycle.recordTransition({idempotency_key: 'invoice-complete-states', order_id: accepted.order.id,
    event_name: 'invoice_created', payload: {invoice_id: 'inv-complete-states', service_amount: 52, currency: 'USD'}});
  await webhook.processStripeEvent({id: 'evt_complete_states', type: 'checkout.session.completed',
    created: 1787911200, data: {object: {object: 'checkout.session', id: 'cs_test_complete_states',
      payment_status: 'paid', payment_intent: 'pi_complete_states', amount_total: 5200, currency: 'usd',
      metadata: {order_id: accepted.order.id, lead_id: accepted.leadId, contract_version: '1'}}}}, store);
  assert.equal((await lifecycle.recordTransition({idempotency_key: 'ready-complete-states',
    order_id: accepted.order.id, event_name: 'order_ready_for_delivery'})).order.order_status, 'ready_for_delivery');
  assert.equal((await lifecycle.recordTransition({idempotency_key: 'delivered-complete-states',
    order_id: accepted.order.id, event_name: 'order_delivered'})).order.order_status, 'delivered');
  await assert.rejects(() => lifecycle.recordTransition({idempotency_key: 'cancel-after-delivery',
    order_id: accepted.order.id, event_name: 'order_cancelled', payload: {reason: 'invalid'}}),
  /before delivery/);

  const cancellable = await acceptedOrder(lifecycle, 'cancel-state', '55555555-5555-4555-8555-555555555555');
  const cancelled = await lifecycle.recordTransition({idempotency_key: 'cancel-state-event',
    order_id: cancellable.order.id, event_name: 'order_cancelled', payload: {reason: 'customer_request'}});
  assert.equal(cancelled.order.order_status, 'cancelled');
  assert.equal(cancelled.order.cancellation_reason, 'customer_request');
  assert.equal(store.outbox.has(store.eventKeys.get('cancel-state-event')), false);
});

test('structured /order/ page preserves its privacy and analytics boundary', () => {
  const html = fs.readFileSync(new URL('../order.html', import.meta.url), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex,\s*follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/a7laundry\.com\/order">/);
  assert.match(html, /fetch\('\/api\/order-intake'/);
  assert.match(html, /window\.dataLayer\.push\(\{event:'generate_lead'/);
  assert.match(html, /attributionReady\(\)/);
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js/,
    'The order source must rely on the unified tracking foundation instead of initializing gtag twice.');
  assert.match(html, /<h2 tabindex="-1">Request received\.<\/h2>/);
  const push = html.match(/window\.dataLayer\.push\(\{event:'generate_lead'[\s\S]*?\}\);/);
  assert.ok(push, 'A safe generate_lead acknowledgement must be emitted.');
  for (const forbidden of ['name:', 'whatsapp_number:', 'pickup_address:', 'property:', 'handoff_notes:', 'needed_by:']) {
    assert.equal(push[0].includes(forbidden), false, `${forbidden} must not enter dataLayer.`);
  }
  assert.equal(/location\.(?:href|search).*?(?:name|whatsapp|address|property)/i.test(html), false,
    'Operational PII must not be written into the page URL.');
});

test('attribution storage failure is fail-open and produces an explicit unattributed snapshot', async () => {
  const store = new MemoryOperationalStore();
  const brokenAttribution = {async get() { throw new Error('offline'); }, async getByShortRef() { throw new Error('offline'); }};
  const lifecycle = service({operationalStore: store, attributionStore: brokenAttribution, env: {}});
  const created = await lifecycle.createLead({idempotency_key: 'lead-fail-open', lead_origin: 'manual',
    service_type: 'wash_fold_guest', customer_type: 'guest'});
  await lifecycle.qualifyLead({idempotency_key: 'qualify-fail-open', lead_id: created.lead.id,
    service_type: 'wash_fold_guest', service_area_accepted: true, timing_accepted: true, minimum_basis_accepted: true});
  const accepted = await lifecycle.acceptOrder({idempotency_key: 'accept-fail-open', lead_id: created.lead.id,
    service_type: 'wash_fold_guest'});
  assert.equal(accepted.order.attribution_confidence, 'unattributed');
  assert.ok(accepted.order.attribution_snapshot);
});

test('GA4 server delivery exposes only approved acquisition and financial fields', async () => {
  let posted;
  const occurredAt = '2026-08-28T15:45:12.345Z';
  const result = await sendGa4Event({
    event_id: 'purchase:pi_test_safe', event_name: 'purchase', client_id: '123.456', session_id: '987',
    occurred_at: occurredAt,
    safe_payload: {transaction_id: 'pi_test_safe', order_id: 'opaque-order', value: 50, currency: 'USD',
      service_type: 'wash_fold_guest', actual_lbs: 20, pickup_window_start: 'secret', phone: '+14075550100',
      items: [{item_id: 'wash_fold_guest', item_name: 'Wash and fold'}]}
  }, {env: {GA4_MEASUREMENT_ID: 'G-TEST', GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret', GA4_DEBUG_MODE: 'true'},
    nowMillis: Date.parse('2026-08-28T16:00:00.000Z'),
    fetch: async (url, options) => { posted = {url, body: JSON.parse(options.body)}; return {ok: true, status: 204}; }});
  assert.equal(result.sent, true);
  const serialized = JSON.stringify(posted);
  assert.equal(serialized.includes('actual_lbs'), false);
  assert.equal(serialized.includes('pickup_window_start'), false);
  assert.equal(serialized.includes('+14075550100'), false);
  assert.match(posted.url, /measurement_id=G-TEST/);
  assert.equal(posted.body.timestamp_micros, timestampMicros(occurredAt));
  assert.equal(posted.body.timestamp_micros, 1787931912345000);
  assert.equal(posted.body.events[0].params.debug_mode, true);
  assert.equal(Object.hasOwn(posted.body, 'validation_behavior'), false);
});

test('GA4 payload allowlist preserves required semantics and removes PII from all operational events', async () => {
  const posted = [];
  const sharedPii = {
    name: 'Synthetic Guest',
    email: 'synthetic.guest@example.test',
    phone: '+14075550100',
    whatsapp_number: '+14075550100',
    pickup_address: '123 Synthetic Street',
    room_number: 'Room 999',
    message_body: 'Synthetic free-text message',
    internal_notes: 'Synthetic operator note'
  };
  const cases = [
    {
      event_name: 'order_accepted',
      event_id: 'order_accepted:opaque-order',
      safe_payload: {
        order_id: 'opaque-order', service_type: 'wash_fold_guest',
        customer_type: 'guest', attribution_confidence: 'deterministic', ...sharedPii
      }
    },
    {
      event_name: 'purchase',
      event_id: 'purchase:pi_opaque',
      safe_payload: {
        transaction_id: 'pi_opaque', order_id: 'opaque-order', value: 65, currency: 'USD',
        items: [{item_id: 'wash_fold_guest', item_name: 'Wash and fold', customer_name: 'Synthetic Guest'}],
        ...sharedPii
      }
    },
    {
      event_name: 'refund',
      event_id: 'refund:re_opaque',
      safe_payload: {
        transaction_id: 'pi_opaque', order_id: 'opaque-order', value: 15, currency: 'USD',
        refund_reason: 'Synthetic free-text reason', ...sharedPii
      }
    }
  ];
  for (const input of cases) {
    const result = await sendGa4Event({
      ...input, client_id: '123.456', session_id: '987', occurred_at: '2026-08-28T15:45:12.345Z'
    }, {
      env: {
        GA4_MEASUREMENT_ID: 'G-TEST',
        GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret',
        GA4_MEASUREMENT_PROTOCOL_DEBUG: 'true'
      },
      nowMillis: Date.parse('2026-08-28T16:00:00.000Z'),
      fetch: async (url, options) => {
        posted.push({url, body: JSON.parse(options.body)});
        return {ok: true, status: 200, json: async () => ({validationMessages: []})};
      }
    });
    assert.equal(result.sent, true);
  }

  assert.equal(posted.length, 3);
  const [accepted, purchase, refund] = posted.map((entry) => entry.body.events[0]);
  assert.deepEqual(
    {name: accepted.name, order_id: accepted.params.order_id, value: accepted.params.value},
    {name: 'order_accepted', order_id: 'opaque-order', value: undefined}
  );
  assert.deepEqual(
    {name: purchase.name, transaction_id: purchase.params.transaction_id,
      value: purchase.params.value, currency: purchase.params.currency, items: purchase.params.items},
    {name: 'purchase', transaction_id: 'pi_opaque', value: 65, currency: 'USD',
      items: [{item_id: 'wash_fold_guest', item_name: 'Wash and fold'}]}
  );
  assert.deepEqual(
    {name: refund.name, transaction_id: refund.params.transaction_id,
      value: refund.params.value, currency: refund.params.currency},
    {name: 'refund', transaction_id: 'pi_opaque', value: 15, currency: 'USD'}
  );
  for (const entry of posted) {
    const serialized = JSON.stringify(entry.body);
    for (const forbidden of Object.values(sharedPii)) assert.equal(serialized.includes(forbidden), false);
    assert.equal(serialized.includes('customer_name'), false);
    assert.equal(serialized.includes('refund_reason'), false);
    assert.match(entry.url, /\/debug\/mp\/collect/);
  }
});

test('GA4 validation mode uses the non-reporting debug endpoint with strict recommendations', async () => {
  let posted;
  const result = await sendGa4Event({event_id: 'order_accepted:validation', event_name: 'order_accepted',
    client_id: '123.456', session_id: '987', occurred_at: '2026-08-28T15:45:12.345Z',
    safe_payload: {order_id: 'opaque-order'}}, {env: {GA4_MEASUREMENT_ID: 'G-TEST',
      GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret', GA4_MEASUREMENT_PROTOCOL_DEBUG: 'true'},
    nowMillis: Date.parse('2026-08-28T16:00:00.000Z'),
    fetch: async (url, options) => { posted = {url, body: JSON.parse(options.body)};
      return {ok: true, status: 200, json: async () => ({validationMessages: []})}; }});
  assert.equal(result.sent, true);
  assert.match(posted.url, /\/debug\/mp\/collect/);
  assert.equal(posted.body.validation_behavior, 'ENFORCE_RECOMMENDATIONS');
  assert.equal(Object.hasOwn(posted.body.events[0].params, 'debug_mode'), false);
});

test('GA4 server delivery fails closed instead of silently shifting stale or future business events', async () => {
  let fetches = 0;
  const base = {event_id: 'order_accepted:test', event_name: 'order_accepted', client_id: '123.456',
    session_id: '987', safe_payload: {order_id: 'opaque-order'}};
  const options = {env: {GA4_MEASUREMENT_ID: 'G-TEST', GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret'},
    nowMillis: Date.parse('2026-08-28T16:00:00.000Z'), fetch: async () => { fetches += 1; return {ok: true}; }};
  assert.deepEqual(await sendGa4Event({...base, occurred_at: '2026-08-25T15:59:59.999Z'}, options),
    {sent: false, status: 'failed', reason: 'event_timestamp_too_old'});
  assert.deepEqual(await sendGa4Event({...base, occurred_at: '2026-08-28T16:05:00.001Z'}, options),
    {sent: false, status: 'failed', reason: 'event_timestamp_in_future'});
  assert.deepEqual(await sendGa4Event({...base, occurred_at: 'invalid'}, options),
    {sent: false, status: 'failed', reason: 'invalid_event_timestamp'});
  assert.equal(fetches, 0);
});

test('GA4 outbox makes stale events terminal instead of retrying them forever', async () => {
  const store = new MemoryOperationalStore();
  store.outbox.set('evt-stale', {event_id: 'evt-stale', event_name: 'order_accepted',
    client_id: '123.456', session_id: '987', safe_payload: {order_id: 'opaque-order'},
    occurred_at: '2026-08-25T15:59:59.999Z', delivery_status: 'pending', attempts: 0,
    created_at: '2026-08-25T15:59:59.999Z'});
  const options = {env: {GA4_MEASUREMENT_ID: 'G-TEST', GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret'},
    nowMillis: Date.parse('2026-08-28T16:00:00.000Z'), fetch: async () => { throw new Error('must not fetch'); }};
  const first = await retryOutbox(store, options);
  assert.deepEqual(first, {selected: 1, sent: 0, failed: 0, expired: 1, skipped: 0});
  assert.equal(store.outbox.get('evt-stale').delivery_status, 'expired');
  assert.equal(store.outbox.get('evt-stale').last_error_code, 'event_timestamp_too_old');
  assert.deepEqual(await retryOutbox(store, options),
    {selected: 0, sent: 0, failed: 0, expired: 0, skipped: 0});
});

test('analytics continuity accepts GA identifiers and drops PII-shaped values', () => {
  assert.deepEqual(safeAnalyticsContext({client_id: '123456789.987654321', session_id: '987654321'}),
    {client_id: '123456789.987654321', session_id: '987654321'});
  assert.deepEqual(safeAnalyticsContext({client_id: 'guest@example.com', session_id: '+14075550100'}),
    {client_id: null, session_id: null});
});

test('analytics outbox retries only eligible durable events and never resends sent rows', async () => {
  const store = new MemoryOperationalStore();
  store.outbox.set('evt-pending', {event_id: 'evt-pending', event_name: 'order_accepted',
    client_id: '123.456', session_id: '987', safe_payload: {order_id: 'opaque-order'},
    occurred_at: '2026-08-28T11:59:00.000Z', delivery_status: 'pending', attempts: 0,
    created_at: '2026-08-28T12:00:00.000Z'});
  store.outbox.set('evt-sent', {event_id: 'evt-sent', event_name: 'order_accepted',
    client_id: '123.456', session_id: '987', safe_payload: {order_id: 'sent-order'},
    delivery_status: 'sent', attempts: 1, created_at: '2026-08-28T12:01:00.000Z'});
  store.outbox.set('evt-no-identity', {event_id: 'evt-no-identity', event_name: 'order_accepted',
    client_id: null, session_id: null, safe_payload: {order_id: 'unknown-order'},
    delivery_status: 'pending_identity', attempts: 0, created_at: '2026-08-28T12:02:00.000Z'});
  const delivered = [];
  const summary = await retryOutbox(store, {env: {
    GA4_MEASUREMENT_ID: 'G-TEST', GA4_MEASUREMENT_PROTOCOL_SECRET: 'test-secret'
  }, nowMillis: Date.parse('2026-08-28T12:10:00.000Z'), fetch: async (_url, options) => {
    const body = JSON.parse(options.body);
    delivered.push({orderId: body.events[0].params.order_id, timestampMicros: body.timestamp_micros});
    return {ok: true, status: 204};
  }});
  assert.deepEqual(summary, {selected: 1, sent: 1, failed: 0, expired: 0, skipped: 0});
  assert.deepEqual(delivered, [{orderId: 'opaque-order', timestampMicros: 1787918340000000}]);
  assert.equal(store.outbox.get('evt-pending').delivery_status, 'sent');
  assert.equal(store.outbox.get('evt-sent').attempts, 1);
  assert.equal(store.outbox.get('evt-no-identity').attempts, 0);
});

test('structured order intake stores PII only in the protected lead and returns safe identifiers', async () => {
  const store = new MemoryOperationalStore();
  const now = Date.now();
  const body = {
    submission_id: '44444444-4444-4444-8444-444444444444',
    service_type: 'wash_fold_guest', accommodation_type: 'hotel', language: 'en',
    name: 'Test Guest', whatsapp_number: '+1 (407) 555-0199', property: 'Test Hotel',
    pickup_address: 'Protected test pickup address', handoff_notes: 'Meet at lobby desk',
    pickup_window_start: new Date(now + 3_600_000).toISOString(),
    pickup_window_end: new Date(now + 7_200_000).toISOString(),
    needed_by: new Date(now + 86_400_000).toISOString(), estimated_lbs: 18,
    service_tier_preference: 'standard', minimum_acknowledged: true, privacy_consent: true,
    attribution_id: ATTRIBUTION_ID, lead_reference: SHORT_REF,
    analytics_context: {client_id: '123456789.987654321', session_id: '987654321'}, website: ''
  };
  const req = {method: 'POST', headers: {origin: 'http://localhost:3000'}, body, socket: {remoteAddress: '127.0.0.8'}};
  const res = {headers: {}, statusCode: 0, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }};
  const previousStore = globalThis.__A7_OPERATIONAL_STORE__;
  const previousAttribution = globalThis.__A7_ATTRIBUTION_STORE__;
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  globalThis.__A7_ATTRIBUTION_STORE__ = attributionStore();
  try {
    await orderIntake(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.lead_reference, SHORT_REF);
    const serializedResponse = JSON.stringify(res.body);
    for (const forbidden of ['Test Guest', '407', 'Protected test pickup address', 'lobby desk']) {
      assert.equal(serializedResponse.includes(forbidden), false);
    }
    const lead = store.leads.get(res.body.lead_id);
    assert.equal(lead.operational_data.whatsapp_number, '14075550199');
    assert.equal(lead.operational_data.analytics_context.client_id, '123456789.987654321');
    assert.ok(lead.customer_id);
  } finally {
    previousStore ? globalThis.__A7_OPERATIONAL_STORE__ = previousStore : delete globalThis.__A7_OPERATIONAL_STORE__;
    previousAttribution ? globalThis.__A7_ATTRIBUTION_STORE__ = previousAttribution : delete globalThis.__A7_ATTRIBUTION_STORE__;
  }
});

test('one order cannot be bound to two different Stripe PaymentIntents', async () => {
  const store = new MemoryOperationalStore();
  const lifecycle = service({operationalStore: store, attributionStore: attributionStore(), env: {}});
  const accepted = await acceptedOrder(lifecycle, 'single-payment');
  await lifecycle.recordTransition({idempotency_key: 'pickup-single-payment', order_id: accepted.order.id, event_name: 'pickup_completed'});
  await lifecycle.recordTransition({idempotency_key: 'weigh-single-payment', order_id: accepted.order.id,
    event_name: 'order_weighed', payload: {actual_lbs: 20}});
  await lifecycle.recordTransition({idempotency_key: 'invoice-single-payment', order_id: accepted.order.id,
    event_name: 'invoice_created', payload: {invoice_id: 'inv-single-payment', service_amount: 65, currency: 'USD'}});
  const base = {type: 'checkout.session.completed', created: 1787911200,
    data: {object: {object: 'checkout.session', payment_status: 'paid', amount_total: 6500, currency: 'usd',
      metadata: {order_id: accepted.order.id, lead_id: accepted.leadId, contract_version: '1'}}}};
  await webhook.processStripeEvent({...structuredClone(base), id: 'evt_single_payment_one',
    data: {object: {...structuredClone(base.data.object), id: 'cs_test_single_one', payment_intent: 'pi_singleone'}}}, store);
  await assert.rejects(() => webhook.processStripeEvent({...structuredClone(base), id: 'evt_single_payment_two',
    data: {object: {...structuredClone(base.data.object), id: 'cs_test_single_two', payment_intent: 'pi_singletwo'}}}, store),
  /different payment intent/);
});

test('paid checkout rejects missing attribution contract version', async () => {
  const store = new MemoryOperationalStore();
  const leadId = '11111111-1111-4111-8111-111111111111';
  const orderId = '22222222-2222-4222-8222-222222222222';
  store.orders.set(orderId, {id: orderId, lead_id: leadId, invoice_id: 'inv-contract', service_amount: 50,
    currency: 'USD', order_status: 'invoice_created', payment_status: 'invoice_created'});
  const event = {id: 'evt_contract_missing', type: 'checkout.session.completed', created: 1787911200,
    data: {object: {object: 'checkout.session', id: 'cs_test_contract_missing', payment_status: 'paid',
      payment_intent: 'pi_contractmissing', amount_total: 5000, currency: 'usd',
      metadata: {order_id: orderId, lead_id: leadId}}}};
  await assert.rejects(() => webhook.processStripeEvent(event, store), /stable operational linkage/);
});

test('Stripe webhook signature is time-bounded and tamper-resistant', () => {
  const body = Buffer.from('{"id":"evt_test"}');
  const secret = 'whsec_test';
  const timestamp = 1787911200;
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  assert.equal(webhook.verifyStripeSignature(body, `t=${timestamp},v1=${signature}`, secret, timestamp), true);
  assert.throws(() => webhook.verifyStripeSignature(Buffer.from('{"id":"tampered"}'), `t=${timestamp},v1=${signature}`, secret, timestamp));
  assert.throws(() => webhook.verifyStripeSignature(body, `t=${timestamp - 301},v1=${signature}`, secret, timestamp));
});

test('Stripe events reject missing timestamps and oversized preloaded bodies', async () => {
  const store = new MemoryOperationalStore();
  await assert.rejects(() => webhook.processStripeEvent({id: 'evt_missing_time',
    type: 'checkout.session.expired', data: {object: {object: 'checkout.session',
      id: 'cs_test_missing_time', metadata: {order_id: '22222222-2222-4222-8222-222222222222',
        lead_id: '11111111-1111-4111-8111-111111111111', contract_version: '1'}}}}, store),
  /timestamp is invalid/);

  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_size_test';
  const req = {method: 'POST', headers: {}, body: Buffer.alloc(1_048_577)};
  const res = {statusCode: 0, body: null, setHeader() {}, status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }};
  try {
    await webhook(req, res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {error: 'Invalid webhook.'});
  } finally {
    previousSecret === undefined ? delete process.env.STRIPE_WEBHOOK_SECRET
      : process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
  }
});

test('Stripe webhook handler verifies the exact raw stream before writing payment truth', async () => {
  const store = new MemoryOperationalStore();
  const leadId = '11111111-1111-4111-8111-111111111111';
  const orderId = '22222222-2222-4222-8222-222222222222';
  store.orders.set(orderId, {id: orderId, lead_id: leadId, invoice_id: 'inv-stream-1',
    service_amount: 50, currency: 'USD', service_type: 'wash_fold_guest', customer_type: 'guest',
    attribution_confidence: 'unattributed', attribution_snapshot: {}, is_repeat_customer: false,
    order_status: 'invoice_created', payment_status: 'invoice_created', version: 1});
  const timestamp = Math.floor(Date.now() / 1000);
  const event = {id: 'evt_stream_payment', type: 'checkout.session.completed', created: timestamp,
    data: {object: {object: 'checkout.session', id: 'cs_test_stream', payment_status: 'paid',
      payment_intent: 'pi_streamstable', amount_total: 5000, currency: 'usd',
      metadata: {order_id: orderId, lead_id: leadId, contract_version: '1'}}}};
  const body = Buffer.from(JSON.stringify(event));
  const secret = 'whsec_stream_test';
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const req = Readable.from([body]);
  req.method = 'POST';
  req.headers = {'stripe-signature': `t=${timestamp},v1=${signature}`};
  const res = {headers: {}, statusCode: 0, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }};
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousStore = globalThis.__A7_OPERATIONAL_STORE__;
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  globalThis.__A7_OPERATIONAL_STORE__ = store;
  try {
    await webhook(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {received: true, ignored: false, duplicate: false});
    assert.equal(store.payments.has('pi_streamstable'), true);
  } finally {
    previousSecret === undefined ? delete process.env.STRIPE_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    previousStore ? globalThis.__A7_OPERATIONAL_STORE__ = previousStore : delete globalThis.__A7_OPERATIONAL_STORE__;
  }
});
