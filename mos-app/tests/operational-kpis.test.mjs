import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachOperationsToFunnels, collectOperationalKpis, readOperationalKpiConfig,
  requestedOperationalPeriod, supabaseHeaders
} from '../operational-kpis-contract.js';

test('operational configuration fails closed without exposing secrets', () => {
  assert.deepEqual(readOperationalKpiConfig({}).missing, [
    'A7_OPERATIONS_SUPABASE_URL', 'A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY'
  ]);
});

test('Supabase secret keys use apikey only while legacy JWTs retain Bearer compatibility', () => {
  assert.deepEqual(supabaseHeaders('sb_secret_example'), {apikey: 'sb_secret_example'});
  assert.deepEqual(supabaseHeaders('legacy-jwt'), {
    apikey: 'legacy-jwt', Authorization: 'Bearer legacy-jwt'
  });
});

test('operational period is a bounded moving 30-day window', () => {
  const period = requestedOperationalPeriod(new Date('2026-08-28T12:00:00.000Z'));
  assert.equal(period.start, '2026-07-29T12:00:00.000Z');
  assert.equal(period.end, '2026-08-28T12:00:00.000Z');
});

test('collector returns durable aggregate metrics and never sends credentials in body', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = {url, options};
    return {ok: true, async json() { return {
      stages: {leads_created: 3, accepted_orders: 2, paid_orders: 1, service_revenue: 65},
      rates: {accepted_to_paid: 0.5}, attribution: {deterministic: 2, partial: 0, unattributed: 0},
      by_landing_page: [{canonical_path: '/laundry-pickup-delivery-orlando', accepted_orders: 2, paid_orders: 1, service_revenue: 65}]
    }; }};
  };
  const result = await collectOperationalKpis(fetchImpl, {ok: true, url: 'https://db.example', key: 'secret'}, {
    period: {start: '2026-08-01T00:00:00.000Z', end: '2026-09-01T00:00:00.000Z'}
  });
  assert.equal(result.status, 'live');
  assert.equal(result.stages.paid_orders, 1);
  assert.match(request.url, /a7_orlando_operational_funnel$/);
  assert.doesNotMatch(request.options.body, /secret/);
});

test('funnel join uses exact canonical landing and truthful zero only for observed source', () => {
  const funnels = [{canonicalPath: '/laundry-pickup-delivery-orlando'}, {canonicalPath: '/plans'}];
  const joined = attachOperationsToFunnels(funnels, {status: 'live', source: 'ledger', requestedPeriod: {}, byLandingPage: [
    {canonical_path: '/laundry-pickup-delivery-orlando', accepted_orders: 2, paid_orders: 1}
  ]});
  assert.equal(joined[0].operations.accepted_orders, 2);
  assert.equal(joined[1].operations.accepted_orders, 0);
  assert.equal(attachOperationsToFunnels(funnels, {status: 'unavailable'})[0].operations.accepted_orders, undefined);
});
