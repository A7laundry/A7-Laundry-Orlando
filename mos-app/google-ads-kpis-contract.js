const GOOGLE_ADS_CONFIG_KEYS = [
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  'GOOGLE_ADS_DEVELOPER_TOKEN'
];

const DEFAULT_API_VERSION = 'v25';
const DEFAULT_ACCOUNT_TIME_ZONE = 'America/Sao_Paulo';
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const RETRYABLE_HTTP_STATUS = new Set([429, 500, 502, 503, 504]);

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function numberOrNull(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function microsToUnit(value) {
  const parsed = numberOrNull(value);
  return parsed === null ? null : parsed / 1_000_000;
}

function dateInTimeZone(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function shiftDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyMetrics() {
  return {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    allConversions: 0,
    conversionValue: 0,
    ctr: null,
    averageCpc: null,
    costPerConversion: null
  };
}

function normalizedMetrics(metrics = {}) {
  return {
    impressions: numberOrNull(metrics.impressions) || 0,
    clicks: numberOrNull(metrics.clicks) || 0,
    cost: microsToUnit(metrics.costMicros) || 0,
    conversions: numberOrNull(metrics.conversions) || 0,
    allConversions: numberOrNull(metrics.allConversions) || 0,
    conversionValue: numberOrNull(metrics.conversionsValue) || 0
  };
}

function finalizeMetrics(metrics) {
  return {
    ...metrics,
    ctr: metrics.impressions > 0 ? metrics.clicks / metrics.impressions : null,
    averageCpc: metrics.clicks > 0 ? metrics.cost / metrics.clicks : null,
    costPerConversion: metrics.conversions > 0 ? metrics.cost / metrics.conversions : null
  };
}

function addMetrics(target, value) {
  target.impressions += value.impressions;
  target.clicks += value.clicks;
  target.cost += value.cost;
  target.conversions += value.conversions;
  target.allConversions += value.allConversions;
  target.conversionValue += value.conversionValue;
}

function performanceWindows(rows, idSelector, period) {
  const windows = new Map();
  rows.forEach((row) => {
    const id = String(idSelector(row) || '');
    if (!id) return;
    if (!windows.has(id)) {
      windows.set(id, {
        today: emptyMetrics(),
        yesterday: emptyMetrics(),
        last7: emptyMetrics(),
        last30: emptyMetrics()
      });
    }
    const item = windows.get(id);
    const metrics = normalizedMetrics(row.metrics);
    const date = row.segments?.date || null;
    addMetrics(item.last30, metrics);
    if (date && date >= period.last7StartDate) addMetrics(item.last7, metrics);
    if (date === period.yesterdayDate) addMetrics(item.yesterday, metrics);
    if (date === period.todayDate) addMetrics(item.today, metrics);
  });
  windows.forEach((item) => {
    Object.keys(item).forEach((key) => {
      item[key] = finalizeMetrics(item[key]);
    });
  });
  return windows;
}

function configuredAndDeliveryStatus(configuredStatus, primaryStatus, today) {
  if (configuredStatus === 'PAUSED') return 'paused';
  if (configuredStatus === 'REMOVED') return 'removed';
  if (configuredStatus !== 'ENABLED') return 'unknown';
  if (today.impressions > 0 || today.cost > 0) return 'delivering_today';
  if (primaryStatus === 'NOT_ELIGIBLE') return 'not_eligible';
  if (primaryStatus === 'LIMITED') return 'limited_no_delivery_today';
  return 'enabled_no_delivery_today';
}

function googleAdsError(report, error) {
  const status = error?.response?.status || error?.status || null;
  const apiError = error?.response?.data?.error || null;
  const googleAdsFailure = Array.isArray(apiError?.details)
    ? apiError.details.find((detail) => Array.isArray(detail?.errors))
    : null;
  const errorCode = googleAdsFailure?.errors?.[0]?.errorCode || {};
  const enumEntry = Object.entries(errorCode).find(([, value]) => typeof value === 'string');
  const diagnostic = {
    httpStatus: status,
    apiStatus: typeof apiError?.status === 'string' ? apiError.status : null,
    googleAdsCode: enumEntry ? `${enumEntry[0]}:${enumEntry[1]}` : null
  };
  const diagnosticText = [
    diagnostic.httpStatus ? `HTTP ${diagnostic.httpStatus}` : null,
    diagnostic.apiStatus,
    diagnostic.googleAdsCode
  ].filter(Boolean).join(' · ');
  return {
    report,
    code: status === 401 || status === 403 ? 'ACCESS_DENIED' : 'UPSTREAM_ERROR',
    message: status === 401 || status === 403
      ? `A Google Ads API recusou a credencial somente leitura${diagnosticText ? ` (${diagnosticText})` : ''}.`
      : `A Google Ads API não respondeu com dados válidos${diagnosticText ? ` (${diagnosticText})` : ''}.`,
    diagnostic
  };
}

export function readGoogleAdsKpiConfig(environment = process.env) {
  const missing = GOOGLE_ADS_CONFIG_KEYS.filter((key) => !String(environment[key] || '').trim());
  if (missing.length) return { ok: false, missing };
  const customerId = digits(environment.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = digits(environment.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  if (!customerId) return { ok: false, missing: ['GOOGLE_ADS_CUSTOMER_ID'] };
  return {
    ok: true,
    apiVersion: String(environment.GOOGLE_ADS_API_VERSION || DEFAULT_API_VERSION).trim(),
    customerId,
    loginCustomerId: loginCustomerId || null,
    developerToken: String(environment.GOOGLE_ADS_DEVELOPER_TOKEN).trim(),
    accountTimeZone: String(environment.GOOGLE_ADS_ACCOUNT_TIME_ZONE || DEFAULT_ACCOUNT_TIME_ZONE).trim()
  };
}

export function requestedPaidMediaPeriod(now = new Date(), timeZone = DEFAULT_ACCOUNT_TIME_ZONE) {
  const todayDate = dateInTimeZone(now, timeZone);
  return {
    startDate: shiftDate(todayDate, -29),
    endDate: todayDate,
    todayDate,
    yesterdayDate: shiftDate(todayDate, -1),
    last7StartDate: shiftDate(todayDate, -6),
    timeZone,
    state: 'intraday',
    rationale: 'Últimos 30 dias incluindo o dia corrente da conta de anúncios; valores intradiários podem mudar.'
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestRows(authClient, config, query, retryOptions = {}) {
  if (!/^\s*SELECT\b/i.test(query) || /\bMUTATE\b|:\s*mutate\b/i.test(query)) {
    throw new Error('Google Ads integration accepts read-only GAQL SELECT queries only.');
  }
  const url = `https://googleads.googleapis.com/${encodeURIComponent(config.apiVersion)}/customers/${encodeURIComponent(config.customerId)}/googleAds:searchStream`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'developer-token': config.developerToken
  };
  if (config.loginCustomerId) headers['login-customer-id'] = config.loginCustomerId;
  const attempts = Math.max(1, Number(retryOptions.attempts) || DEFAULT_RETRY_ATTEMPTS);
  const requestedDelay = Number(retryOptions.delayMs);
  const delayMs = Math.max(0, Number.isFinite(requestedDelay) ? requestedDelay : DEFAULT_RETRY_DELAY_MS);
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await authClient.request({
        url,
        method: 'POST',
        headers,
        data: { query }
      });
      const chunks = Array.isArray(response.data) ? response.data : [response.data || {}];
      return {
        rows: chunks.flatMap((chunk) => chunk?.results || []),
        truncated: false
      };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status || error?.status || null;
      if (!RETRYABLE_HTTP_STATUS.has(status) || attempt === attempts - 1) throw error;
      await wait(delayMs * (3 ** attempt));
    }
  }
  throw lastError;
}

function campaignQuery(period) {
  return {
    account: `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.status,
        customer.manager,
        customer.test_account
      FROM customer
      LIMIT 1
    `,
    campaigns: `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.primary_status,
        campaign.primary_status_reasons,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.start_date_time,
        campaign.end_date_time,
        campaign_budget.id,
        campaign_budget.name,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.id
    `,
    campaignDaily: `
      SELECT
        segments.date,
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.all_conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'
        AND campaign.status != 'REMOVED'
    `,
    ads: `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.status,
        ad_group_ad.primary_status,
        ad_group_ad.primary_status_reasons
      FROM ad_group_ad
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY ad_group_ad.ad.id
    `,
    adDaily: `
      SELECT
        segments.date,
        ad_group_ad.ad.id,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.all_conversions,
        metrics.conversions_value
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_ad.status != 'REMOVED'
    `,
    searchTerms: `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.all_conversions,
        metrics.conversions_value
      FROM search_term_view
      WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 500
    `,
    conversions: `
      SELECT
        campaign.id,
        campaign.name,
        segments.conversion_action,
        segments.conversion_action_name,
        segments.conversion_action_category,
        metrics.conversions,
        metrics.all_conversions,
        metrics.conversions_value,
        metrics.all_conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${period.startDate}' AND '${period.endDate}'
        AND metrics.all_conversions > 0
      ORDER BY metrics.all_conversions DESC
      LIMIT 500
    `
  };
}

function responsiveText(assets) {
  return (assets || []).map((asset) => asset.text).filter(Boolean);
}

function normalizeCampaigns(inventory, dailyRows, period) {
  const windows = performanceWindows(dailyRows, (row) => row.campaign?.id, period);
  return inventory.map((row) => {
    const campaign = row.campaign || {};
    const performance = windows.get(String(campaign.id)) || {
      today: finalizeMetrics(emptyMetrics()),
      yesterday: finalizeMetrics(emptyMetrics()),
      last7: finalizeMetrics(emptyMetrics()),
      last30: finalizeMetrics(emptyMetrics())
    };
    return {
      id: String(campaign.id || ''),
      name: campaign.name || null,
      configuredStatus: campaign.status || null,
      primaryStatus: campaign.primaryStatus || null,
      primaryStatusReasons: campaign.primaryStatusReasons || [],
      channelType: campaign.advertisingChannelType || null,
      biddingStrategyType: campaign.biddingStrategyType || null,
      startDateTime: campaign.startDateTime || null,
      endDateTime: campaign.endDateTime || null,
      budget: {
        id: row.campaignBudget?.id ? String(row.campaignBudget.id) : null,
        name: row.campaignBudget?.name || null,
        dailyAmount: microsToUnit(row.campaignBudget?.amountMicros)
      },
      deliveryStatus: configuredAndDeliveryStatus(campaign.status, campaign.primaryStatus, performance.today),
      performance
    };
  });
}

function normalizeAds(inventory, dailyRows, period) {
  const windows = performanceWindows(dailyRows, (row) => row.adGroupAd?.ad?.id, period);
  return inventory.map((row) => {
    const adGroupAd = row.adGroupAd || {};
    const ad = adGroupAd.ad || {};
    const performance = windows.get(String(ad.id)) || {
      today: finalizeMetrics(emptyMetrics()),
      yesterday: finalizeMetrics(emptyMetrics()),
      last7: finalizeMetrics(emptyMetrics()),
      last30: finalizeMetrics(emptyMetrics())
    };
    const headlines = responsiveText(ad.responsiveSearchAd?.headlines);
    const descriptions = responsiveText(ad.responsiveSearchAd?.descriptions);
    return {
      id: String(ad.id || ''),
      name: headlines[0] || `Anúncio ${ad.id || 'sem ID'}`,
      type: ad.type || null,
      configuredStatus: adGroupAd.status || null,
      primaryStatus: adGroupAd.primaryStatus || null,
      primaryStatusReasons: adGroupAd.primaryStatusReasons || [],
      deliveryStatus: configuredAndDeliveryStatus(adGroupAd.status, adGroupAd.primaryStatus, performance.today),
      campaignId: row.campaign?.id ? String(row.campaign.id) : null,
      campaignName: row.campaign?.name || null,
      adGroupId: row.adGroup?.id ? String(row.adGroup.id) : null,
      adGroupName: row.adGroup?.name || null,
      finalUrls: ad.finalUrls || [],
      creative: {
        format: ad.type || null,
        headlines,
        descriptions,
        thumbnailUrl: null
      },
      performance
    };
  });
}

function normalizeSearchTerms(rows) {
  return rows.map((row) => ({
    campaignId: row.campaign?.id ? String(row.campaign.id) : null,
    campaignName: row.campaign?.name || null,
    adGroupId: row.adGroup?.id ? String(row.adGroup.id) : null,
    adGroupName: row.adGroup?.name || null,
    term: row.searchTermView?.searchTerm || null,
    status: row.searchTermView?.status || null,
    metrics: finalizeMetrics(normalizedMetrics(row.metrics))
  }));
}

function normalizeConversions(rows) {
  return rows.map((row) => ({
    campaignId: row.campaign?.id ? String(row.campaign.id) : null,
    campaignName: row.campaign?.name || null,
    actionResource: row.segments?.conversionAction || null,
    actionName: row.segments?.conversionActionName || null,
    category: row.segments?.conversionActionCategory || null,
    conversions: numberOrNull(row.metrics?.conversions) || 0,
    allConversions: numberOrNull(row.metrics?.allConversions) || 0,
    conversionValue: numberOrNull(row.metrics?.conversionsValue) || 0,
    allConversionValue: numberOrNull(row.metrics?.allConversionsValue) || 0
  }));
}

export async function collectGoogleAdsKpis(authClient, config, options = {}) {
  const now = options.now || new Date();
  const period = options.period || requestedPaidMediaPeriod(now, config.accountTimeZone);
  const fetchedAt = now.toISOString();
  const queries = campaignQuery(period);
  const names = Object.keys(queries);
  const settled = [];
  for (const name of names) {
    try {
      const value = await requestRows(authClient, config, queries[name], {
        attempts: options.retryAttempts,
        delayMs: options.retryDelayMs
      });
      settled.push({ status: 'fulfilled', value });
    } catch (reason) {
      settled.push({ status: 'rejected', reason });
    }
  }
  const reports = {};
  const errors = [];
  settled.forEach((result, index) => {
    const name = names[index];
    if (result.status === 'fulfilled') reports[name] = result.value;
    else {
      reports[name] = { rows: [], truncated: false };
      errors.push(googleAdsError(name, result.reason));
    }
  });
  const successful = settled.filter((result) => result.status === 'fulfilled').length;
  if (successful === 0) {
    return {
      status: 'unavailable',
      source: 'Google Ads API',
      customerId: config.customerId,
      requestedPeriod: period,
      fetchedAt,
      errors
    };
  }
  const campaigns = normalizeCampaigns(reports.campaigns.rows, reports.campaignDaily.rows, period);
  const ads = normalizeAds(reports.ads.rows, reports.adDaily.rows, period);
  const accountRow = reports.account.rows[0]?.customer || {};
  const total = campaigns.reduce((metrics, campaign) => {
    addMetrics(metrics, campaign.performance.last30);
    return metrics;
  }, emptyMetrics());
  const activeCampaigns = campaigns.filter((campaign) => campaign.configuredStatus === 'ENABLED');
  const activeAds = ads.filter((ad) => ad.configuredStatus === 'ENABLED');
  return {
    status: successful === settled.length ? 'live' : 'partial',
    source: 'Google Ads API',
    customerId: config.customerId,
    requestedPeriod: period,
    fetchedAt,
    account: {
      id: accountRow.id ? String(accountRow.id) : config.customerId,
      name: accountRow.descriptiveName || null,
      currency: accountRow.currencyCode || null,
      timeZone: accountRow.timeZone || config.accountTimeZone,
      status: accountRow.status || null,
      manager: Boolean(accountRow.manager),
      testAccount: Boolean(accountRow.testAccount)
    },
    summary: {
      campaignCount: campaigns.length,
      activeCampaignCount: activeCampaigns.length,
      deliveringCampaignCount: activeCampaigns.filter((campaign) => campaign.deliveryStatus === 'delivering_today').length,
      adCount: ads.length,
      activeAdCount: activeAds.length,
      deliveringAdCount: activeAds.filter((ad) => ad.deliveryStatus === 'delivering_today').length,
      last30: finalizeMetrics(total)
    },
    campaigns,
    ads,
    searchTerms: normalizeSearchTerms(reports.searchTerms.rows),
    conversions: normalizeConversions(reports.conversions.rows),
    pagination: Object.fromEntries(names.map((name) => [name, { truncated: reports[name].truncated }])),
    errors
  };
}
