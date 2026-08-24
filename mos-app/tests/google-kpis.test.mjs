import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FUNNEL_REGISTRY,
  attachGoogleAdsToFunnels,
  buildFunnelCatalog,
  collectGoogleKpis,
  externalAccountOptions,
  readGoogleKpiConfig,
  requestedGa4CurrentDay,
  requestedGooglePeriod
} from '../google-kpis-contract.js';
import { GET as googleKpisGet } from '../api/google-kpis.js';

const config = {
  projectNumber: '936115008663',
  serviceAccountEmail: 'mos-readonly@a7-laundry-mos.iam.gserviceaccount.com',
  poolId: 'vercel-mos-production',
  providerId: 'vercel-a7-laundry-mos',
  ga4PropertyId: '543807649',
  gscProperty: 'sc-domain:a7laundry.com'
};

function gaReport(dimensions, metrics, rows) {
  return {
    dimensionHeaders: dimensions.map((name) => ({ name })),
    metricHeaders: metrics.map((name) => ({ name })),
    rows: rows.map(({ dimensionValues = [], metricValues = [] }) => ({
      dimensionValues: dimensionValues.map((value) => ({ value: String(value) })),
      metricValues: metricValues.map((value) => ({ value: String(value) }))
    }))
  };
}

test('configuration fails closed without naming secret values', () => {
  const result = readGoogleKpiConfig({});
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [
    'GCP_PROJECT_NUMBER',
    'GCP_SERVICE_ACCOUNT_EMAIL',
    'GCP_WORKLOAD_IDENTITY_POOL_ID',
    'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
    'GA4_PROPERTY_ID',
    'GSC_PROPERTY'
  ]);
});

test('Google KPI endpoint rejects an unauthenticated browser request', async () => {
  const response = await googleKpisGet(new Request('https://mos.example/api/google-kpis'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Não autorizado.' });
});

test('requested period uses 30 complete days with Search Console latency', () => {
  assert.deepEqual(requestedGooglePeriod(new Date('2026-07-26T12:00:00.000Z')), {
    startDate: '2026-06-24',
    endDate: '2026-07-23',
    timeZone: 'America/New_York',
    rationale: 'Últimos 30 dias completos, encerrados há 3 dias para respeitar a latência do Search Console.'
  });
});

test('current GA4 day follows the Orlando property timezone and stays intraday', () => {
  assert.deepEqual(requestedGa4CurrentDay(new Date('2026-07-26T02:30:00.000Z')), {
    startDate: '2026-07-25',
    endDate: '2026-07-25',
    timeZone: 'America/New_York',
    state: 'intraday',
    rationale: 'Dia corrente da propriedade; os números podem mudar enquanto o GA4 processa os eventos.'
  });
});

test('external account configuration uses temporary OIDC impersonation and read-only scopes', async () => {
  const options = externalAccountOptions(config, 'temporary-vercel-token');
  assert.match(options.audience, /vercel-mos-production\/providers\/vercel-a7-laundry-mos$/);
  assert.match(options.service_account_impersonation_url, /^https:\/\/iamcredentials\.googleapis\.com\//);
  assert.deepEqual(options.scopes, [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
  ]);
  assert.equal(await options.subject_token_supplier.getSubjectToken(), 'temporary-vercel-token');
  assert.doesNotMatch(JSON.stringify(options), /private_key|client_secret/);
});

test('Google Ads scope is added only when the native server credential is complete', () => {
  const options = externalAccountOptions(config, 'temporary-vercel-token', {
    includeGoogleAds: true
  });
  assert.deepEqual(options.scopes, [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/adwords'
  ]);
});

test('live contract preserves source, period, freshness and numeric zero returned by APIs', async () => {
  const authClient = {
    async request(request) {
      if (request.url.includes('analyticsdata') && !request.data.dimensions) {
        return { data: gaReport([], ['activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'engagementRate', 'averageSessionDuration', 'eventCount', 'keyEvents', 'ecommercePurchases', 'totalRevenue'], [
          { metricValues: [80, 70, 120, 65, 0.5417, 38.2, 640, 21, 10, 491] }
        ]) };
      }
      if (request.url.includes('analyticsdata')) {
        const dimensions = request.data.dimensions.map(({ name }) => name);
        const metrics = request.data.metrics.map(({ name }) => name);
        if (dimensions[0] === 'sessionDefaultChannelGroup') {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['Organic Search'], metricValues: [50, 32, 0.64, 10] }
          ]) };
        }
        if (dimensions[0] === 'sessionSourceMedium' && dimensions.length === 2) {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['google / organic', '(organic)'], metricValues: [50, 32, 0.64, 10] }
          ]) };
        }
        if (dimensions[0] === 'landingPage') {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['/laundry-pickup-delivery-orlando?utm_source=google'], metricValues: [40, 31, 25, 0.625, 8] }
          ]) };
        }
        if (dimensions[0] === 'pagePath' && dimensions[1] === 'pageTitle') {
          const isCurrentDay = request.data.dateRanges[0].startDate === '2026-07-26';
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['/blog/orlando-vacation-rental-laundry-guide.html', 'Laundry guide'], metricValues: isCurrentDay ? [4, 3, 9, 1] : [30, 20, 80, 3] }
          ]) };
        }
        if (dimensions[0] === 'eventName') {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['whatsapp_click'], metricValues: [12, 10, 4] }
          ]) };
        }
        if (dimensions[0] === 'sessionSourceMedium' && dimensions.length === 3) {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['google / cpc', 'A7 Guest Laundry', '/laundry-pickup-delivery-orlando?gclid=hidden'], metricValues: [18, 12, 4] }
          ]) };
        }
        if (dimensions[0] === 'pagePath' && dimensions[1] === 'eventName') {
          return { data: gaReport(dimensions, metrics, [
            { dimensionValues: ['/laundry-pickup-delivery-orlando', 'whatsapp_click'], metricValues: [7, 6, 3] }
          ]) };
        }
        return { data: gaReport(dimensions, metrics, [
          { dimensionValues: ['2901132891', '123', 'A7 Guest Laundry', 'SEARCH'], metricValues: [900, 40, 55.2, 18, 4] },
          { dimensionValues: ['(not set)', '(not set)', '(not set)', '(not set)'], metricValues: [0, 0, 0, 108, 17] }
        ]) };
      }
      if (!request.data.dimensions) {
        return { data: { rows: [{ clicks: 24, impressions: 1800, ctr: 0.013333, position: 14.2 }] } };
      }
      if (request.data.dimensions[0] === 'query') {
        if (request.data.dimensions.length === 2) {
          return { data: { rows: [{ keys: ['guest laundry orlando', 'https://a7laundry.com/laundry-pickup-delivery-orlando?ref=gsc'], clicks: 6, impressions: 250, ctr: 0.024, position: 6.2 }] } };
        }
        return { data: { rows: [{ keys: ['laundry service orlando'], clicks: 8, impressions: 400, ctr: 0.02, position: 7.5 }] } };
      }
      return { data: { rows: [{ keys: ['https://a7laundry.com/laundry-pickup-delivery-orlando'], clicks: 12, impressions: 700, ctr: 0.01714, position: 9.1 }] } };
    }
  };
  const now = new Date('2026-07-26T13:00:00.000Z');
  const result = await collectGoogleKpis(authClient, config, { now });
  assert.equal(result.schemaVersion, '1.4');
  assert.equal(result.status, 'live');
  assert.equal(result.freshness.state, 'current');
  assert.equal(result.sources.ga4.source, 'Google Analytics Data API');
  assert.equal(result.sources.ga4.summary.ecommercePurchases, 10);
  assert.equal(result.sources.ga4.summary.totalRevenue, 491);
  assert.equal(result.sources.searchConsole.summary.impressions, 1800);
  assert.equal(result.sources.searchConsole.queries[0].query, 'laundry service orlando');
  assert.equal(result.sources.ga4.landingPages[0].canonicalPath, '/laundry-pickup-delivery-orlando');
  assert.equal(result.sources.ga4.currentDay.status, 'live');
  assert.equal(result.sources.ga4.currentDay.requestedPeriod.startDate, '2026-07-26');
  assert.equal(result.sources.ga4.currentDay.contentPages[0].screenPageViews, 4);
  assert.equal(result.sources.googleAds.status, 'partial_live');
  assert.equal(result.sources.googleAds.rows.length, 1);
  assert.equal(result.sources.googleAds.rows[0].advertiserAdCost, 55.2);
  assert.equal(result.sources.metaAds.status, 'unavailable');
  assert.equal(result.marketingGraph.status, 'partial_live');
  assert.ok(result.marketingGraph.edges.some((edge) => edge.type === 'campaign_to_page'));
  assert.ok(result.marketingGraph.edges.some((edge) => edge.type === 'page_to_event'));
  assert.ok(result.marketingGraph.edges.some((edge) => edge.type === 'query_to_page'));
  assert.ok(result.marketingGraph.nodes.some((node) => node.type === 'organic_query'));
  assert.equal(result.funnels.length, 0, 'core collector must not infer a manual release catalog');
  const explicitCatalog = buildFunnelCatalog(result.sources.ga4, result.sources.searchConsole, result.requestedPeriod, result.fetchedAt, FUNNEL_REGISTRY);
  const moneyFunnel = explicitCatalog.find((funnel) => funnel.id === 'orlando-money');
  assert.equal(moneyFunnel.releaseStatus, 'unobserved');
  assert.equal(moneyFunnel.performance.ga4.sessions, 40);
  assert.equal(moneyFunnel.performance.ga4.contactEvents, 7);
  assert.equal(moneyFunnel.performance.searchConsole.impressions, 700);
  assert.equal(moneyFunnel.performance.searchConsole.clicks, 12);
  assert.equal(moneyFunnel.campaigns[0].campaign, 'A7 Guest Laundry');
  assert.equal(moneyFunnel.topQueries[0].query, 'guest laundry orlando');
  const iDriveFunnel = explicitCatalog.find((funnel) => funnel.id === 'international-drive');
  assert.equal(iDriveFunnel.releaseStatus, 'unobserved');
  assert.equal(iDriveFunnel.performance.ga4.sessions, null);
  assert.equal(iDriveFunnel.sources.searchConsole.status, 'not_returned');
  const beforeCheckoutFunnel = explicitCatalog.find((funnel) => funnel.id === 'before-checkout');
  assert.equal(beforeCheckoutFunnel.releaseStatus, 'unobserved');
  assert.deepEqual(beforeCheckoutFunnel.funnelCodes, ['SEO-BEFORE-CHECKOUT-V1']);
  assert.equal(beforeCheckoutFunnel.performance.ga4.sessions, null);
  assert.deepEqual(result.sources.ga4.requestedPeriod, result.requestedPeriod);
});

test('native Google Ads final URLs join exactly once and ambiguous ads do not duplicate cost', () => {
  const funnels = [
    { id: 'money', canonicalPath: '/laundry-pickup-delivery-orlando', sources: {} },
    { id: 'plans', canonicalPath: '/plans', sources: {} }
  ];
  const report = {
    status: 'live',
    ads: [
      { id: '1', finalUrls: ['https://a7laundry.com/plans?utm_source=google'], performance: { last30: { cost: 10, clicks: 2, impressions: 20, conversions: 1, conversionValue: 30 } } },
      { id: '2', finalUrls: ['https://a7laundry.com/plans', 'https://a7laundry.com/laundry-pickup-delivery-orlando'], performance: { last30: { cost: 99, clicks: 9, impressions: 90, conversions: 9, conversionValue: 900 } } },
      { id: '3', finalUrls: ['https://example.com/elsewhere'], performance: { last30: { cost: 50 } } },
      { id: '4', finalUrls: ['https://example.com/plans'], performance: { last30: { cost: 70 } } },
      { id: '5', finalUrls: ['https://a7laundry.com/plans', 'https://example.com/elsewhere'], performance: { last30: { cost: 80 } } }
    ]
  };
  const joined = attachGoogleAdsToFunnels(funnels, report);
  const plans = joined.find((funnel) => funnel.id === 'plans');
  const money = joined.find((funnel) => funnel.id === 'money');
  assert.equal(plans.paidMedia.metrics.cost, 10);
  assert.equal(plans.paidMedia.ads.length, 1);
  assert.equal(plans.paidMedia.ambiguous.length, 2);
  assert.equal(money.paidMedia.metrics, null);
  assert.equal(money.paidMedia.ambiguous.length, 1);
  assert.equal(plans.paidMedia.unmatchedCount, 2);
});

test('one incompatible GA4 subreport stays partial without hiding the other live reports', async () => {
  const authClient = {
    async request(request) {
      if (request.url.includes('analyticsdata')) {
        const dimensions = (request.data.dimensions || []).map(({ name }) => name);
        if (dimensions[0] === 'sessionGoogleAdsCustomerId') {
          throw Object.assign(new Error('incompatible fields'), { response: { status: 400 } });
        }
        const metrics = request.data.metrics.map(({ name }) => name);
        const values = dimensions.map((name) => name === 'landingPage' || name === 'pagePath' ? '/' : name === 'eventName' ? 'page_view' : '(not set)');
        return { data: gaReport(dimensions, metrics, [{ dimensionValues: values, metricValues: metrics.map(() => 1) }]) };
      }
      if (!request.data.dimensions) {
        return { data: { rows: [{ clicks: 1, impressions: 10, ctr: 0.1, position: 1 }] } };
      }
      return { data: { rows: [] } };
    }
  };
  const result = await collectGoogleKpis(authClient, config, {
    now: new Date('2026-07-26T13:00:00.000Z')
  });
  assert.equal(result.sources.ga4.status, 'partial');
  assert.equal(result.sources.ga4.reportStatus.linkedGoogleAds.status, 'unavailable');
  assert.equal(result.sources.googleAds.status, 'unavailable');
  assert.equal(result.sources.ga4.summary.activeUsers, 1);
  assert.equal(result.status, 'live');
});

test('intraday article failure stays isolated from the finalized GA4 reports', async () => {
  const authClient = {
    async request(request) {
      if (request.url.includes('analyticsdata')) {
        const dimensions = (request.data.dimensions || []).map(({ name }) => name);
        const metrics = request.data.metrics.map(({ name }) => name);
        const isIntradayContent = dimensions[0] === 'pagePath'
          && dimensions[1] === 'pageTitle'
          && request.data.dateRanges[0].startDate === '2026-07-26';
        if (isIntradayContent) throw Object.assign(new Error('intraday delayed'), { response: { status: 503 } });
        const values = dimensions.map((name) => name === 'landingPage' || name === 'pagePath' ? '/blog/guide.html' : name === 'eventName' ? 'page_view' : '(not set)');
        return { data: gaReport(dimensions, metrics, [{ dimensionValues: values, metricValues: metrics.map(() => 1) }]) };
      }
      if (!request.data.dimensions) {
        return { data: { rows: [{ clicks: 1, impressions: 10, ctr: 0.1, position: 1 }] } };
      }
      return { data: { rows: [] } };
    }
  };
  const result = await collectGoogleKpis(authClient, config, {
    now: new Date('2026-07-26T13:00:00.000Z')
  });
  assert.equal(result.sources.ga4.status, 'live');
  assert.equal(result.sources.ga4.currentDay.status, 'unavailable');
  assert.equal(result.sources.ga4.contentPages[0].canonicalPath, '/blog/guide.html');
  assert.equal(result.status, 'live');
});

test('upstream failure becomes unavailable and never becomes numeric zero', async () => {
  const authClient = {
    async request() {
      throw Object.assign(new Error('upstream failed'), { response: { status: 503 } });
    }
  };
  const result = await collectGoogleKpis(authClient, config, {
    now: new Date('2026-07-26T13:00:00.000Z')
  });
  assert.equal(result.status, 'unavailable');
  assert.equal(result.sources.ga4.status, 'unavailable');
  assert.equal(result.sources.searchConsole.status, 'unavailable');
  assert.equal(result.funnels.length, 0);
  assert.equal('summary' in result.sources.ga4, false);
  assert.equal(JSON.stringify(result).includes('upstream failed'), false);
  assert.deepEqual(result.errors.map((error) => error.code), ['UPSTREAM_ERROR', 'UPSTREAM_ERROR']);
});
