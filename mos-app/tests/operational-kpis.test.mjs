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

test('complete operations pair wins over fallback after whitespace normalization', () => {
  const config = readOperationalKpiConfig({
    A7_OPERATIONS_SUPABASE_URL: '  https://operations.example/  ',
    A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: '  sb_secret_operations_test  ',
    WHATSAPP_SUPABASE_URL: 'https://whatsapp.example',
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_whatsapp_test'
  });
  assert.deepEqual(config, {
    ok: true, url: 'https://operations.example', key: 'sb_secret_operations_test', missing: []
  });
});

test('trimming preserves internal key characters and removes only one URL trailing slash', () => {
  for (const [input, expected] of [
    [' \thttps://operations.example/\n ', 'https://operations.example'],
    [' https://operations.example// ', 'https://operations.example/']
  ]) {
    const config = readOperationalKpiConfig({
      A7_OPERATIONS_SUPABASE_URL: input,
      A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: '\t sb_secret_test/inner/ \n'
    });
    assert.equal(config.ok, true);
    assert.equal(config.url, expected);
    assert.equal(config.key, 'sb_secret_test/inner/');
  }
});

test('complete WhatsApp fallback never borrows a partial operations value', () => {
  for (const partial of [
    {},
    {A7_OPERATIONS_SUPABASE_URL: 'https://operations.example'},
    {A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_operations_test'},
    {A7_OPERATIONS_SUPABASE_URL: '   ', A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_operations_test'},
    {A7_OPERATIONS_SUPABASE_URL: 'https://operations.example', A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: '   '}
  ]) {
    const config = readOperationalKpiConfig({
      ...partial,
      WHATSAPP_SUPABASE_URL: '  https://whatsapp.example/  ',
      WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: '  sb_secret_whatsapp_test  '
    });
    assert.deepEqual(config, {
      ok: true, url: 'https://whatsapp.example', key: 'sb_secret_whatsapp_test', missing: []
    });
  }
});

test('partial, crossed and unsupported pairs fail closed before any request', async () => {
  const cases = [
    {},
    {A7_OPERATIONS_SUPABASE_URL: 'https://operations.example'},
    {A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_operations_test'},
    {WHATSAPP_SUPABASE_URL: 'https://whatsapp.example'},
    {WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_whatsapp_test'},
    {A7_OPERATIONS_SUPABASE_URL: 'https://operations.example', WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_whatsapp_test'},
    {WHATSAPP_SUPABASE_URL: 'https://whatsapp.example', A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_operations_test'},
    {A7_OPERATIONS_SUPABASE_URL: '   ', A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_operations_test'},
    {WHATSAPP_SUPABASE_URL: 'https://whatsapp.example', WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: '   '},
    {A7_ATTRIBUTION_SUPABASE_URL: 'https://attribution.example', A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_unsupported_test'},
    {A7_OPERATIONS_SUPABASE_URL: 'https://operations.example', A7_ATTRIBUTION_SUPABASE_URL: 'https://attribution.example', A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_unsupported_test'},
    {WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_partial_whatsapp_test', A7_ATTRIBUTION_SUPABASE_URL: 'https://attribution.example', A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_unsupported_test'}
  ];
  const period = {start: '2026-09-01T00:00:00.000Z', end: '2026-09-12T23:00:00.000Z'};
  let requests = 0;
  for (const env of cases) {
    const config = readOperationalKpiConfig(env);
    assert.deepEqual(config, {
      ok: false, url: '', key: '',
      missing: ['A7_OPERATIONS_SUPABASE_URL', 'A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY']
    });
    const result = await collectOperationalKpis(async () => {
      requests += 1;
      throw new Error('No request is allowed for an incomplete configuration');
    }, config, {period});
    assert.equal(result.status, 'unavailable');
    assert.equal(result.error.code, 'CONFIGURATION_INCOMPLETE');
    assert.equal(result.stages, null);
    assert.equal(result.rates, null);
    assert.deepEqual(result.byLandingPage, []);
    assert.deepEqual(result.requestedPeriod, period);
    assert.doesNotMatch(JSON.stringify(result), /sb_secret_/);
  }
  assert.equal(requests, 0);
});

test('collector uses the trimmed complete fallback endpoint and its matching key', async () => {
  const config = readOperationalKpiConfig({
    A7_OPERATIONS_SUPABASE_URL: 'https://unused-operations.example',
    WHATSAPP_SUPABASE_URL: '  https://whatsapp.example/  ',
    WHATSAPP_SUPABASE_SERVICE_ROLE_KEY: '  sb_secret_whatsapp_test  '
  });
  let requests = 0;
  const result = await collectOperationalKpis(async (url, options) => {
    requests += 1;
    assert.equal(url, 'https://whatsapp.example/rest/v1/rpc/a7_orlando_operational_funnel');
    assert.equal(options.headers.apikey, 'sb_secret_whatsapp_test');
    assert.equal('Authorization' in options.headers, false);
    return {ok: true, async json() { return {stages: {paid_orders: 1}, by_landing_page: []}; }};
  }, config, {now: new Date('2026-09-12T23:00:00.000Z')});
  assert.equal(requests, 1);
  assert.equal(result.status, 'live');
  assert.equal(result.stages.paid_orders, 1);
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
