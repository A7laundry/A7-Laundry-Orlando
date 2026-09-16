import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectGa4PopulationDiagnostics, collectGoogleKpis, ga4PopulationFilter
} from '../google-kpis-contract.js';

const config = { ga4PropertyId: 'fixture-property', gscProperty: 'sc-domain:example.test' };
const options = { now: new Date('2026-09-13T06:25:55Z') };
const populationNames = ['technical_marked', 'commercial_candidate', 'undetermined'];

// Fixture evaluator for documented FilterExpression operators. No live API use.
function matches(expression, value) {
  if (!expression) return true;
  if (expression.andGroup) return expression.andGroup.expressions.every((item) => matches(item, value));
  if (expression.orGroup) return expression.orGroup.expressions.some((item) => matches(item, value));
  if (expression.notExpression) return !matches(expression.notExpression, value);
  assert.equal(expression.filter.fieldName, 'sessionSourceMedium');
  if (expression.filter.emptyFilter) return value == null || value === '' || value === '(not set)';
  const filter = expression.filter.stringFilter;
  assert.equal(filter.matchType, 'FULL_REGEXP');
  return new RegExp(`^(?:${filter.value})$`, filter.caseSensitive ? '' : 'i').test(value ?? '');
}

function requestPopulation(data) {
  if (!data.dimensionFilter) return 'total';
  return populationNames.find((name) => JSON.stringify(ga4PopulationFilter(name)) === JSON.stringify(data.dimensionFilter));
}

function report(data, count = 1) {
  const dimensions = (data.dimensions || []).map(({ name }) => name);
  const metrics = data.metrics.map(({ name }) => name);
  return {
    dimensionHeaders: dimensions.map((name) => ({ name })),
    metricHeaders: metrics.map((name) => ({ name })),
    rowCount: 1,
    metadata: { timeZone: 'America/New_York', currencyCode: 'USD', dataLossFromOtherRow: false, subjectToThresholding: false },
    rows: [{
      dimensionValues: dimensions.map((name) => ({ value: name === 'landingPage' || name === 'pagePath' ? '/plans' : name === 'sessionSourceMedium' ? 'google / organic' : 'fixture' })),
      metricValues: metrics.map(() => ({ value: String(count) }))
    }]
  };
}

test('exact marked pairs are disjoint from candidate and unknown; commercial substrings survive', () => {
  const cases = [
    ['audit / test', 'technical_marked'], [' AUDIT/test ', 'technical_marked'],
    ['qa / synthetic', 'technical_marked'], ['Qa  / SYNTHETIC', 'technical_marked'],
    [null, 'undetermined'], [undefined, 'undetermined'], ['', 'undetermined'], [' ', 'undetermined'],
    ['(not set)', 'undetermined'], ['google / (not set)', 'undetermined'],
    ['(not provided) / cpc', 'undetermined'], ['(other)', 'undetermined'], ['(other) / cpc', 'undetermined'],
    ['google / ', 'undetermined'], ['/cpc', 'undetermined'], ['a / b / c', 'undetermined'], ['google', 'undetermined'],
    ['(direct) / (none)', 'commercial_candidate'], ['direct / (none)', 'commercial_candidate'],
    ['google / organic', 'commercial_candidate'], ['contest / referral', 'commercial_candidate'],
    ['audit firm / referral', 'commercial_candidate'], ['qa-store / email', 'commercial_candidate'],
    ['audit / testing', 'commercial_candidate'], ['test / audit', 'commercial_candidate']
  ];
  for (const [value, expected] of cases) {
    const assigned = populationNames.filter((name) => matches(ga4PopulationFilter(name), value));
    assert.deepEqual(assigned, [expected], String(value));
  }
  assert.equal(ga4PopulationFilter('total'), null);
  assert.throws(() => ga4PopulationFilter('unknown'), /Unsupported/);
});

test('all nine reports use the same population; summary is direct, intraday separate and Ads omitted', async () => {
  const requests = [];
  const values = { total: 90, technical_marked: 8, commercial_candidate: 40, undetermined: 2 };
  const client = { async request(request) {
    requests.push(structuredClone(request));
    assert.ok(request.url.includes('analyticsdata'));
    return { data: report(request.data, values[requestPopulation(request.data)]) };
  } };
  const result = await collectGa4PopulationDiagnostics(client, config, options);
  assert.equal(requests.length, 36);
  for (const [name, population] of Object.entries(result.populations)) {
    const selected = requests.filter(({ data }) => requestPopulation(data) === name);
    assert.equal(selected.length, 9);
    assert.equal(selected.filter(({ data }) => !data.dimensions).length, 1);
    assert.equal(selected.filter(({ data }) => data.dateRanges[0].startDate === '2026-09-13').length, 1);
    assert.equal(population.summary.sessions, values[name]);
    assert.equal(population.summary.activeUsers, values[name]); // Not total minus other groups.
    assert.equal(population.summary.engagementRate, values[name]); // Fixture does not normalize/subtract rates.
    assert.equal(population.population, name);
    assert.equal(population.status, 'live');
    assert.equal(population.reportStatus.summary.completeness.timeZone, 'America/New_York');
    assert.equal(population.reportStatus.summary.completeness.currencyCode, 'USD');
    assert.equal(population.reportStatus.summary.completeness.state, 'complete');
    assert.equal(population.linkedGoogleAds.status, 'not_requested');
    assert.match(population.linkedGoogleAds.limitation, /nenhuma consulta/);
  }
  assert.match(result.limitation, /sem conciliação financeira/);
});

test('failed population and incompatible summary never borrow total or numeric zero', async () => {
  const client = { async request({ data }) {
    const population = requestPopulation(data);
    if (population === 'technical_marked' || (population === 'commercial_candidate' && !data.dimensions)) {
      throw Object.assign(new Error('private upstream detail'), { status: 400 });
    }
    return { data: report(data, 91) };
  } };
  const { populations } = await collectGa4PopulationDiagnostics(client, config, options);
  assert.equal(populations.total.summary.sessions, 91);
  assert.equal(populations.technical_marked.status, 'unavailable');
  assert.equal(populations.technical_marked.summary.sessions, null);
  assert.equal(populations.technical_marked.landingPages.length, 0);
  assert.equal(populations.commercial_candidate.status, 'partial');
  assert.equal(populations.commercial_candidate.summary.sessions, null);
  assert.equal(populations.commercial_candidate.reportStatus.summary.completeness, null);
  assert.equal(populations.undetermined.summary.sessions, 91);
  assert.equal(JSON.stringify(populations).includes('private upstream detail'), false);
});

test('row limit, missing metadata and source restrictions remain explicit and never become complete', async () => {
  const client = { async request({ data }) {
    const response = report(data, 12);
    const population = requestPopulation(data);
    if (population === 'total') {
      delete response.rowCount;
      delete response.metadata;
    } else if (population === 'technical_marked') {
      response.rowCount = 2001;
    } else if (population === 'commercial_candidate') {
      response.metadata.dataLossFromOtherRow = true;
      response.metadata.subjectToThresholding = true;
      response.metadata.samplingMetadatas = [{ samplesReadCount: '50', samplingSpaceSize: '100' }];
      response.metadata.schemaRestrictionResponse = { activeMetricRestrictions: [{ metricName: 'totalRevenue', restrictedMetricTypes: ['REVENUE_DATA'] }] };
    } else {
      response.metadata = { timeZone: 'America/New_York' };
    }
    return { data: response };
  } };
  const { populations } = await collectGa4PopulationDiagnostics(client, config, options);
  for (const population of Object.values(populations)) {
    assert.equal(population.status, 'partial');
    assert.equal(population.reportStatus.summary.completeness.state, 'partial_or_unknown');
  }
  assert.equal(populations.total.reportStatus.summary.completeness.rowCount, null);
  assert.equal(populations.total.reportStatus.summary.completeness.timeZone, null);
  assert.ok(populations.technical_marked.reportStatus.summary.completeness.limitations.includes('truncated'));
  assert.equal(populations.technical_marked.summary.sessions, 12, 'direct report value is preserved with its limitation');
  const restricted = populations.commercial_candidate;
  assert.equal(restricted.summary.totalRevenue, null);
  assert.deepEqual(restricted.reportStatus.summary.completeness.limitations, ['other_row_data_loss', 'subject_to_thresholding', 'sampled', 'restricted_metrics']);
  assert.ok(populations.undetermined.reportStatus.summary.completeness.limitations.includes('quality_flags_unknown'));
});

test('empty response preserves unavailable numbers; malformed response is isolated; intraday failure stays separate', async () => {
  const client = { async request({ data }) {
    const population = requestPopulation(data);
    if (population === 'commercial_candidate') return { data: null };
    if (population === 'undetermined' && data.dateRanges[0].startDate === '2026-09-13') throw new Error('delay');
    const response = report(data, 0);
    if (population === 'technical_marked') { response.rows = []; response.rowCount = 0; }
    return { data: response };
  } };
  const { populations } = await collectGa4PopulationDiagnostics(client, config, options);
  assert.equal(populations.total.summary.sessions, 0, 'observed zero stays zero');
  assert.equal(populations.technical_marked.status, 'no_data');
  assert.equal(populations.technical_marked.summary.sessions, null, 'missing row is not invented zero');
  assert.equal(populations.commercial_candidate.status, 'unavailable');
  assert.equal(populations.undetermined.status, 'live');
  assert.equal(populations.undetermined.currentDay.status, 'unavailable');
});

test('normal collector remains unfiltered with ten GA4 requests, four GSC requests and no diagnostics', async () => {
  const requests = [];
  const client = { async request(request) {
    requests.push(request);
    if (request.url.includes('analyticsdata')) return { data: report(request.data, 5) };
    return { data: { rows: [] } };
  } };
  const result = await collectGoogleKpis(client, config, options);
  assert.equal(requests.filter((r) => r.url.includes('analyticsdata')).length, 10);
  assert.equal(requests.filter((r) => r.url.includes('webmasters')).length, 4);
  assert.ok(requests.every((r) => !r.data.dimensionFilter));
  assert.equal(result.sources.ga4.summary.sessions, 5);
  assert.equal(result.sources.ga4.population, undefined);
  assert.equal(result.populations, undefined);
});

test('malformed rows, headers and value arrays become unavailable without aborting independent populations', async () => {
  const corruptions = [
    (data) => { data.rows = [null]; },
    (data) => { data.metricHeaders = [null]; },
    (data) => { data.dimensionHeaders = 'invalid'; },
    (data) => { data.rows[0].metricValues = {}; },
    (data) => { data.rows[0].metricValues = [null]; },
    (data) => { data.rows[0].dimensionValues = {}; },
    (data) => { data.rows[0].metricValues = []; }
  ];
  for (const corrupt of corruptions) {
    let requestCount = 0;
    const client = { async request({ data }) {
      requestCount += 1;
      const response = report(data, 17);
      if (requestPopulation(data) === 'total') corrupt(response);
      return { data: response };
    } };
    const { populations } = await collectGa4PopulationDiagnostics(client, config, options);
    assert.equal(requestCount, 36);
    assert.equal(populations.total.status, 'unavailable');
    assert.equal(populations.total.summary.sessions, null);
    assert.equal(populations.technical_marked.status, 'live');
    assert.equal(populations.commercial_candidate.summary.sessions, 17);
    assert.equal(populations.undetermined.summary.sessions, 17);
  }
});

test('invalid sampling metadata cannot prove report completeness', async () => {
  for (const sampling of [{}, null, 'invalid', [null], [{ samplesReadCount: 'oops', samplingSpaceSize: '100' }]]) {
    const client = { async request({ data }) {
      const response = report(data);
      response.metadata.samplingMetadatas = sampling;
      return { data: response };
    } };
    const { populations } = await collectGa4PopulationDiagnostics(client, config, options);
    for (const population of Object.values(populations)) {
      assert.equal(population.status, 'partial');
      assert.equal(population.reportStatus.summary.completeness.state, 'partial_or_unknown');
      assert.ok(population.reportStatus.summary.completeness.limitations.includes('sampling_metadata_invalid'));
    }
  }
});
