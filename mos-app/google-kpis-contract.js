const GA4_METRICS = [
  'activeUsers',
  'newUsers',
  'sessions',
  'engagedSessions',
  'engagementRate',
  'averageSessionDuration',
  'eventCount',
  'keyEvents',
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
      100
    ),
    landingPages: query(
      ['landingPage'],
      ['sessions', 'activeUsers', 'engagedSessions', 'engagementRate', 'keyEvents'],
      100
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
      250
    ),
    interactions: query(
      ['pagePath', 'eventName'],
      ['eventCount', 'totalUsers', 'keyEvents'],
      250
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
      data: { ...base, dimensions: ['query'], rowLimit: 50, aggregationType: 'auto' }
    }),
    authClient.request({
      url: endpoint,
      method: 'POST',
      data: { ...base, dimensions: ['page'], rowLimit: 50, aggregationType: 'auto' }
    }),
    authClient.request({
      url: endpoint,
      method: 'POST',
      data: { ...base, dimensions: ['query', 'page'], rowLimit: 250, aggregationType: 'auto' }
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
    schemaVersion: '1.3',
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
    errors
  };
}
