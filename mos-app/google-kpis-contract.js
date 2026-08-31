import contentCatalog from './generated/content-catalog.json' with { type: 'json' };

const GA4_METRICS = [
  'activeUsers',
  'newUsers',
  'sessions',
  'engagedSessions',
  'engagementRate',
  'averageSessionDuration',
  'eventCount',
  'keyEvents',
  'ecommercePurchases',
  'totalRevenue'
];

const CONFIG_KEYS = [
  'GCP_PROJECT_NUMBER',
  'GCP_SERVICE_ACCOUNT_EMAIL',
  'GCP_WORKLOAD_IDENTITY_POOL_ID',
  'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
  'GA4_PROPERTY_ID',
  'GSC_PROPERTY'
];

export const FUNNEL_REGISTRY = Object.freeze(contentCatalog.assets.filter((asset) => asset.funnel).map((asset) => Object.freeze({
  assetId: asset.assetId,
  id: asset.funnel.id,
  name: asset.funnel.name,
  canonicalPath: asset.canonicalPath,
  funnelCodes: asset.funnel.codes,
  releaseStatus: 'unobserved',
  intent: asset.intent,
  audience: asset.audience,
  action: asset.nextAction,
  campaignRole: asset.funnel.campaignRole,
  journeyStage: asset.journeyStage,
  clusterId: asset.clusterId
})));

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function numberOrNull(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function reportRows(report) {
  const dimensionNames = (report.dimensionHeaders || []).map((header) => header.name);
  const metricNames = (report.metricHeaders || []).map((header) => header.name);
  return (report.rows || []).map((row) => {
    const normalized = {};
    dimensionNames.forEach((name, index) => {
      normalized[name] = row.dimensionValues?.[index]?.value ?? null;
    });
    metricNames.forEach((name, index) => {
      normalized[name] = numberOrNull(row.metricValues?.[index]?.value);
    });
    return normalized;
  });
}

function canonicalPath(value) {
  if (!value) return '/';
  try {
    const url = new URL(value, 'https://a7laundry.com');
    const normalized = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '');
    return normalized || '/';
  } catch {
    const normalized = String(value).split(/[?#]/)[0].replace(/\/{2,}/g, '/').replace(/\/$/, '');
    return normalized.startsWith('/') ? normalized || '/' : `/${normalized}`;
  }
}

function paidDestination(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['a7laundry.com', 'www.a7laundry.com'].includes(url.hostname.toLowerCase())) return null;
    return canonicalPath(url.href);
  } catch {
    return null;
  }
}

function reportState(result) {
  if (result.status === 'rejected') {
    return {
      status: 'unavailable',
      rows: [],
      error: sourceError('ga4_report', result.reason)
    };
  }
  const rows = reportRows(result.value.data);
  return { status: rows.length ? 'live' : 'no_data', rows };
}

function sourceError(source, error) {
  const status = error?.response?.status || error?.status || null;
  return {
    source,
    code: status === 401 || status === 403 ? 'ACCESS_DENIED' : 'UPSTREAM_ERROR',
    message: status === 401 || status === 403
      ? 'A fonte recusou o acesso da identidade somente leitura.'
      : 'A fonte não respondeu com dados válidos.'
  };
}

export function readGoogleKpiConfig(environment = process.env) {
  const missing = CONFIG_KEYS.filter((key) => !String(environment[key] || '').trim());
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    projectNumber: environment.GCP_PROJECT_NUMBER.trim(),
    serviceAccountEmail: environment.GCP_SERVICE_ACCOUNT_EMAIL.trim(),
    poolId: environment.GCP_WORKLOAD_IDENTITY_POOL_ID.trim(),
    providerId: environment.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID.trim(),
    ga4PropertyId: environment.GA4_PROPERTY_ID.trim(),
    gscProperty: environment.GSC_PROPERTY.trim()
  };
}

export function requestedGooglePeriod(now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    timeZone: 'America/New_York',
    rationale: 'Últimos 30 dias completos, encerrados há 3 dias para respeitar a latência do Search Console.'
  };
}

export function requestedGa4CurrentDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return {
    startDate: date,
    endDate: date,
    timeZone: 'America/New_York',
    state: 'intraday',
    rationale: 'Dia corrente da propriedade; os números podem mudar enquanto o GA4 processa os eventos.'
  };
}

export function externalAccountOptions(config, subjectToken, options = {}) {
  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
  ];
  if (options.includeGoogleAds) scopes.push('https://www.googleapis.com/auth/adwords');
  return {
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`,
    scopes,
    subject_token_supplier: {
      async getSubjectToken() {
        return subjectToken;
      }
    }
  };
}

async function requestGa4(authClient, config, period, currentDay) {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.ga4PropertyId)}:runReport`;
  const query = (dimensions, metrics, limit = 50, reportPeriod = period) => authClient.request({
    url: endpoint,
    method: 'POST',
    data: {
      dateRanges: [{ startDate: reportPeriod.startDate, endDate: reportPeriod.endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      orderBys: [{ metric: { metricName: metrics[0] }, desc: true }],
      limit: String(limit),
      keepEmptyRows: false
    }
  });
  const requests = {
    summary: authClient.request({
      url: endpoint,
      method: 'POST',
      data: {
        dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
        metrics: GA4_METRICS.map((name) => ({ name })),
        keepEmptyRows: false
      }
    }),
    channels: query(
      ['sessionDefaultChannelGroup'],
      ['sessions', 'engagedSessions', 'engagementRate', 'keyEvents'],
      25
    ),
    acquisition: query(
      ['sessionSourceMedium', 'sessionCampaignName'],
      ['sessions', 'engagedSessions', 'engagementRate', 'keyEvents'],
      1000
    ),
    landingPages: query(
      ['landingPage'],
      ['sessions', 'activeUsers', 'engagedSessions', 'engagementRate', 'keyEvents'],
      1000
    ),
    contentPages: query(
      ['pagePath', 'pageTitle'],
      ['screenPageViews', 'activeUsers', 'eventCount', 'keyEvents'],
      100
    ),
    contentToday: query(
      ['pagePath', 'pageTitle'],
      ['screenPageViews', 'activeUsers', 'eventCount', 'keyEvents'],
      100,
      currentDay
    ),
    events: query(
      ['eventName'],
      ['eventCount', 'totalUsers', 'keyEvents'],
      100
    ),
    journeys: query(
      ['sessionSourceMedium', 'sessionCampaignName', 'landingPage'],
      ['sessions', 'engagedSessions', 'keyEvents'],
      1000
    ),
    interactions: query(
      ['pagePath', 'eventName'],
      ['eventCount', 'totalUsers', 'keyEvents'],
      2000
    ),
    linkedGoogleAds: query(
      ['sessionGoogleAdsCustomerId', 'sessionGoogleAdsCampaignId', 'sessionGoogleAdsCampaignName', 'sessionGoogleAdsCampaignType'],
      ['advertiserAdImpressions', 'advertiserAdClicks', 'advertiserAdCost', 'sessions', 'keyEvents'],
      100
    )
  };
  const names = Object.keys(requests);
  const settled = await Promise.allSettled(Object.values(requests));
  const reports = Object.fromEntries(names.map((name, index) => [name, reportState(settled[index])]));
  const summary = reports.summary.rows[0] || Object.fromEntries(GA4_METRICS.map((name) => [name, null]));
  const primaryReportNames = names.filter((name) => name !== 'contentToday');
  const successfulReports = primaryReportNames.filter((name) => reports[name].status !== 'unavailable').length;
  const failedReports = primaryReportNames.filter((name) => reports[name].status === 'unavailable').length;
  const linkedGoogleAdsRows = reports.linkedGoogleAds.rows.filter((row) => {
    const customerId = String(row.sessionGoogleAdsCustomerId || '');
    const campaignId = String(row.sessionGoogleAdsCampaignId || '');
    return /^\d+$/.test(customerId) && customerId !== '0' && /^\d+$/.test(campaignId) && campaignId !== '0';
  });
  if (successfulReports === 0) throw settled[0].reason || new Error('GA4 reports unavailable');
  return {
    status: successfulReports === 0
      ? 'unavailable'
      : failedReports > 0
        ? 'partial'
        : Object.values(summary).some((value) => value !== null) ? 'live' : 'no_data',
    source: 'Google Analytics Data API',
    propertyId: config.ga4PropertyId,
    requestedPeriod: period,
    summary,
    channels: reports.channels.rows,
    acquisition: reports.acquisition.rows,
    landingPages: reports.landingPages.rows.map((row) => ({ ...row, canonicalPath: canonicalPath(row.landingPage) })),
    contentPages: reports.contentPages.rows.map((row) => ({ ...row, canonicalPath: canonicalPath(row.pagePath) })),
    currentDay: {
      status: reports.contentToday.status,
      source: 'Google Analytics Data API',
      requestedPeriod: currentDay,
      contentPages: reports.contentToday.rows.map((row) => ({ ...row, canonicalPath: canonicalPath(row.pagePath) })),
      limitation: currentDay.rationale
    },
    events: reports.events.rows,
    journeys: reports.journeys.rows.map((row) => ({ ...row, canonicalPath: canonicalPath(row.landingPage) })),
    interactions: reports.interactions.rows.map((row) => ({ ...row, canonicalPath: canonicalPath(row.pagePath) })),
    linkedGoogleAds: {
      status: reports.linkedGoogleAds.status === 'unavailable'
        ? 'unavailable'
        : linkedGoogleAdsRows.length ? 'partial_live' : 'no_data',
      source: 'Google Analytics Data API — vínculo Google Ads',
      limitation: linkedGoogleAdsRows.length
        ? 'Métricas recebidas pelo vínculo do GA4; não substituem a leitura nativa de campanhas, anúncios, orçamento e status na Google Ads API.'
        : 'O vínculo respondeu, mas nenhuma campanha Google Ads identificável recebeu atribuição no período. Linhas “(not set)” não são tratadas como campanhas.',
      rows: linkedGoogleAdsRows
    },
    reportStatus: Object.fromEntries(Object.entries(reports).map(([name, report]) => [
      name,
      { status: report.status, error: report.error }
    ]))
  };
}

async function requestSearchConsole(authClient, config, period) {
  const site = encodeURIComponent(config.gscProperty);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`;
  const base = { startDate: period.startDate, endDate: period.endDate, type: 'web', dataState: 'final' };
  const [summaryResponse, queryResponse, pageResponse, queryPageResponse] = await Promise.all([
    authClient.request({ url: endpoint, method: 'POST', data: base }),
    authClient.request({
      url: endpoint,
      method: 'POST',
      data: { ...base, dimensions: ['query'], rowLimit: 1000, aggregationType: 'auto' }
    }),
    authClient.request({
      url: endpoint,
      method: 'POST',
      data: { ...base, dimensions: ['page'], rowLimit: 1000, aggregationType: 'auto' }
    }),
    authClient.request({
      url: endpoint,
      method: 'POST',
      data: { ...base, dimensions: ['query', 'page'], rowLimit: 5000, aggregationType: 'auto' }
    })
  ]);
  const summaryRow = summaryResponse.data?.rows?.[0];
  const summary = summaryRow ? {
    clicks: numberOrNull(summaryRow.clicks),
    impressions: numberOrNull(summaryRow.impressions),
    ctr: numberOrNull(summaryRow.ctr),
    position: numberOrNull(summaryRow.position)
  } : { clicks: null, impressions: null, ctr: null, position: null };
  const normalizeRows = (rows, keyName) => (rows || []).map((row) => ({
    [keyName]: row.keys?.[0] ?? null,
    clicks: numberOrNull(row.clicks),
    impressions: numberOrNull(row.impressions),
    ctr: numberOrNull(row.ctr),
    position: numberOrNull(row.position)
  }));
  return {
    status: Object.values(summary).some((value) => value !== null) ? 'live' : 'no_data',
    source: 'Google Search Console API',
    property: config.gscProperty,
    requestedPeriod: period,
    summary,
    queries: normalizeRows(queryResponse.data?.rows, 'query'),
    pages: normalizeRows(pageResponse.data?.rows, 'page').map((row) => ({
      ...row,
      canonicalPath: canonicalPath(row.page)
    })),
    queryPages: (queryPageResponse.data?.rows || []).map((row) => ({
      query: row.keys?.[0] ?? null,
      page: row.keys?.[1] ?? null,
      canonicalPath: canonicalPath(row.keys?.[1]),
      clicks: numberOrNull(row.clicks),
      impressions: numberOrNull(row.impressions),
      ctr: numberOrNull(row.ctr),
      position: numberOrNull(row.position)
    }))
  };
}

function marketingGraph(ga4, searchConsole, period, fetchedAt) {
  const nodes = new Map();
  const edges = [];
  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };
  const pageNode = (path) => {
    const canonical = canonicalPath(path);
    const id = `page:${canonical}`;
    addNode({
      id,
      type: canonical.startsWith('/blog/') ? 'article' : 'landing_page',
      label: canonical,
      canonicalPath: canonical,
      source: 'A7 site + APIs Google',
      requestedPeriod: period,
      fetchedAt
    });
    return id;
  };
  (ga4.journeys || []).forEach((row, index) => {
    const campaignLabel = row.sessionCampaignName || '(não definida)';
    const sourceMedium = row.sessionSourceMedium || '(não definido)';
    const campaignId = `campaign:ga4:${encodeURIComponent(`${sourceMedium}|${campaignLabel}`)}`;
    addNode({
      id: campaignId,
      type: 'campaign',
      label: campaignLabel,
      sourceMedium,
      source: 'Google Analytics Data API',
      requestedPeriod: period,
      fetchedAt
    });
    const destinationId = pageNode(row.canonicalPath);
    edges.push({
      id: `edge:journey:${index}`,
      type: 'campaign_to_page',
      from: campaignId,
      to: destinationId,
      source: 'Google Analytics Data API',
      requestedPeriod: period,
      fetchedAt,
      metrics: {
        sessions: row.sessions,
        engagedSessions: row.engagedSessions,
        keyEvents: row.keyEvents
      }
    });
  });
  (ga4.interactions || []).forEach((row, index) => {
    const originId = pageNode(row.canonicalPath);
    const eventLabel = row.eventName || '(evento não definido)';
    const eventId = `event:ga4:${encodeURIComponent(eventLabel)}`;
    addNode({
      id: eventId,
      type: 'event',
      label: eventLabel,
      source: 'Google Analytics Data API',
      requestedPeriod: period,
      fetchedAt
    });
    edges.push({
      id: `edge:interaction:${index}`,
      type: 'page_to_event',
      from: originId,
      to: eventId,
      source: 'Google Analytics Data API',
      requestedPeriod: period,
      fetchedAt,
      metrics: {
        eventCount: row.eventCount,
        totalUsers: row.totalUsers,
        keyEvents: row.keyEvents
      }
    });
  });
  (searchConsole.queryPages || []).forEach((row, index) => {
    const queryLabel = row.query || '(consulta anonimizada)';
    const queryId = `query:gsc:${encodeURIComponent(queryLabel)}`;
    addNode({
      id: queryId,
      type: 'organic_query',
      label: queryLabel,
      source: 'Google Search Console API',
      requestedPeriod: period,
      fetchedAt
    });
    const destinationId = pageNode(row.canonicalPath);
    edges.push({
      id: `edge:organic:${index}`,
      type: 'query_to_page',
      from: queryId,
      to: destinationId,
      source: 'Google Search Console API',
      requestedPeriod: period,
      fetchedAt,
      metrics: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      }
    });
  });
  return {
    status: nodes.size ? 'partial_live' : 'no_data',
    limitation: 'As arestas representam relações observadas por fonte. Não são usuários deduplicados entre plataformas.',
    requestedPeriod: period,
    fetchedAt,
    nodes: [...nodes.values()],
    edges
  };
}

function sumObserved(rows, key) {
  if (!rows.length) return null;
  const values = rows.map((row) => numberOrNull(row[key])).filter((value) => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

// Definitions must be supplied by the validated growth artifact. The legacy
// registry remains exported temporarily for migration comparisons only; it is
// never a runtime fallback because its release state can be stale.
export function buildFunnelCatalog(ga4, searchConsole, period, fetchedAt, definitions = []) {
  const ga4Available = ['live', 'partial', 'no_data'].includes(ga4?.status);
  const gscAvailable = ['live', 'no_data'].includes(searchConsole?.status);
  return definitions.map((definition) => {
    const path = definition.canonicalPath;
    const landingRows = (ga4?.landingPages || []).filter((row) => row.canonicalPath === path);
    const contentRows = (ga4?.contentPages || []).filter((row) => row.canonicalPath === path);
    const interactionRows = (ga4?.interactions || []).filter((row) => row.canonicalPath === path);
    const contactRows = interactionRows.filter((row) => /whatsapp|sms|contact|pickup|call/i.test(row.eventName || ''));
    const journeyRows = (ga4?.journeys || []).filter((row) => row.canonicalPath === path);
    const gscPageRows = (searchConsole?.pages || []).filter((row) => row.canonicalPath === path);
    const gscQueryRows = (searchConsole?.queryPages || []).filter((row) => row.canonicalPath === path);
    const gscImpressions = sumObserved(gscPageRows, 'impressions');
    const gscClicks = sumObserved(gscPageRows, 'clicks');
    const weightedPosition = gscPageRows.reduce((total, row) => total + (numberOrNull(row.position) || 0) * (numberOrNull(row.impressions) || 0), 0);
    const campaigns = journeyRows.map((row) => ({
      sourceMedium: row.sessionSourceMedium || '(não definido)',
      campaign: row.sessionCampaignName || '(não definida)',
      sessions: row.sessions,
      engagedSessions: row.engagedSessions,
      keyEvents: row.keyEvents
    })).sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
    const topQueries = gscQueryRows.slice().sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).slice(0, 8).map((row) => ({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
    return {
      ...definition,
      requestedPeriod: period,
      fetchedAt,
      sources: {
        ga4: { status: !ga4Available ? 'unavailable' : landingRows.length || contentRows.length || interactionRows.length ? 'observed' : 'not_returned', source: 'Google Analytics Data API', matchMethod: 'exact_canonical' },
        searchConsole: { status: !gscAvailable ? 'unavailable' : gscPageRows.length || gscQueryRows.length ? 'observed' : 'not_returned', source: 'Google Search Console API', matchMethod: 'exact_canonical' },
        googleAds: { status: 'unavailable', source: 'Google Ads API', matchMethod: 'unmatched' }
      },
      performance: {
        ga4: {
          sessions: ga4Available ? sumObserved(landingRows, 'sessions') : null,
          engagedSessions: ga4Available ? sumObserved(landingRows, 'engagedSessions') : null,
          activeUsers: ga4Available ? sumObserved(contentRows, 'activeUsers') : null,
          views: ga4Available ? sumObserved(contentRows, 'screenPageViews') : null,
          // Landing and content reports are different GA4 grains and may contain
          // the same key event. Prefer landing attribution and only fall back to
          // the content report when the landing path was not returned.
          keyEvents: ga4Available ? sumObserved(landingRows.length ? landingRows : contentRows, 'keyEvents') : null,
          contactEvents: ga4Available ? sumObserved(contactRows, 'eventCount') : null
        },
        searchConsole: {
          clicks: gscAvailable ? gscClicks : null,
          impressions: gscAvailable ? gscImpressions : null,
          ctr: gscAvailable && gscImpressions ? gscClicks / gscImpressions : null,
          position: gscAvailable && gscImpressions ? weightedPosition / gscImpressions : null
        }
      },
      campaigns,
      topQueries,
      limitation: 'Métricas permanecem nulas quando a API está indisponível ou a URL não foi devolvida. Ausência de linha não é convertida em zero; campanhas e consultas não representam usuários deduplicados.'
    };
  });
}

function addNullable(total, value) {
  const number = numberOrNull(value);
  return number === null ? total : (total ?? 0) + number;
}

export function attachGoogleAdsToFunnels(funnels, googleAds) {
  if (!Array.isArray(funnels)) return [];
  if (!googleAds || !['live', 'partial_live', 'partial'].includes(googleAds.status)) {
    return funnels.map((funnel) => ({ ...funnel, sources: { ...funnel.sources, googleAds: { status: 'unavailable', source: 'Google Ads API', matchMethod: 'unmatched' } }, paidMedia: { status: 'unavailable', ads: [], metrics: null } }));
  }
  const byPath = new Map(funnels.map((funnel) => [canonicalPath(funnel.canonicalPath), funnel.id]));
  const assignments = new Map(funnels.map((funnel) => [funnel.id, []]));
  const ambiguous = [];
  const unmatched = [];
  for (const ad of googleAds.ads || []) {
    const destinations = [...new Set((ad.finalUrls || []).map(paidDestination))];
    const resolved = destinations.map((path) => path ? byPath.get(path) || null : null);
    const matched = [...new Set(resolved.filter(Boolean))];
    const exact = destinations.length > 0 && resolved.every(Boolean) && matched.length === 1;
    if (exact) assignments.get(matched[0]).push({ ...ad, matchMethod: 'exact_canonical' });
    else if (matched.length) ambiguous.push({ adId: ad.id, funnelIds: matched, finalUrls: ad.finalUrls || [], matchMethod: 'ambiguous' });
    else unmatched.push({ adId: ad.id, finalUrls: ad.finalUrls || [], matchMethod: 'unmatched' });
  }
  return funnels.map((funnel) => {
    const ads = assignments.get(funnel.id) || [];
    const metrics = ads.reduce((totals, ad) => {
      const row = ad.performance?.last30 || {};
      for (const key of ['cost', 'clicks', 'impressions', 'conversions', 'conversionValue']) totals[key] = addNullable(totals[key], row[key]);
      return totals;
    }, { cost: null, clicks: null, impressions: null, conversions: null, conversionValue: null });
    return {
      ...funnel,
      sources: { ...funnel.sources, googleAds: { status: ads.length ? 'observed' : 'not_returned', source: 'Google Ads API', matchMethod: ads.length ? 'exact_canonical' : 'unmatched' } },
      paidMedia: { status: ads.length ? 'observed' : 'not_returned', ads, metrics: ads.length ? metrics : null, ambiguous: ambiguous.filter((item) => item.funnelIds.includes(funnel.id)), unmatchedCount: unmatched.length, limitation: 'Cada anúncio é atribuído no máximo uma vez. Destinos múltiplos ou desconhecidos não distribuem custo por inferência.' }
    };
  });
}

export async function collectGoogleKpis(authClient, config, options = {}) {
  const now = options.now || new Date();
  const period = options.period || requestedGooglePeriod(now);
  const currentDay = options.currentDay || requestedGa4CurrentDay(now);
  const fetchedAt = now.toISOString();
  const errors = [];
  const [ga4Result, searchConsoleResult] = await Promise.allSettled([
    requestGa4(authClient, config, period, currentDay),
    requestSearchConsole(authClient, config, period)
  ]);
  const ga4 = ga4Result.status === 'fulfilled'
    ? { ...ga4Result.value, fetchedAt }
    : { status: 'unavailable', source: 'Google Analytics Data API', propertyId: config.ga4PropertyId, requestedPeriod: period, fetchedAt };
  const searchConsole = searchConsoleResult.status === 'fulfilled'
    ? { ...searchConsoleResult.value, fetchedAt }
    : { status: 'unavailable', source: 'Google Search Console API', property: config.gscProperty, requestedPeriod: period, fetchedAt };
  if (ga4Result.status === 'rejected') errors.push(sourceError('ga4', ga4Result.reason));
  if (searchConsoleResult.status === 'rejected') errors.push(sourceError('search_console', searchConsoleResult.reason));
  const graph = marketingGraph(ga4, searchConsole, period, fetchedAt);
  const funnels = buildFunnelCatalog(ga4, searchConsole, period, fetchedAt);
  const googleAds = ga4.linkedGoogleAds
    ? { ...ga4.linkedGoogleAds, requestedPeriod: period, fetchedAt }
    : {
        status: 'unavailable',
        source: 'Google Ads API',
        requestedPeriod: period,
        fetchedAt,
        limitation: 'A conta anunciante ainda não possui um caminho nativo aprovado via conta de administrador e developer token.'
      };
  const metaAds = {
    status: 'unavailable',
    source: 'Meta Marketing API',
    requestedPeriod: period,
    fetchedAt,
    limitation: 'A credencial de sistema somente leitura ainda não possui ativo e token utilizável pelo MOS.'
  };
  const liveSources = [ga4, searchConsole].filter((source) => ['live', 'partial', 'no_data'].includes(source.status)).length;
  return {
    schemaVersion: '1.4',
    status: liveSources === 2 ? 'live' : liveSources === 1 ? 'partial' : 'unavailable',
    requestedPeriod: period,
    fetchedAt,
    freshness: {
      state: 'current',
      fetchedAt,
      maximumAgeMinutes: 15
    },
    sources: { ga4, searchConsole, googleAds, metaAds },
    marketingGraph: graph,
    funnels,
    errors
  };
}
