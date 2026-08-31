const META_CONFIG_KEYS = [
  'META_GRAPH_API_VERSION',
  'META_AD_ACCOUNT_ID',
  'META_ACCESS_TOKEN'
];
const OFFICIAL_WHATSAPP_E164 = '14076708839';
const BLOCKED_TEST_WHATSAPP_E164 = '15556287241';

function numberOrNull(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalPath(value) {
  if (!value) return null;
  try {
    const url = new URL(value, 'https://a7laundry.com');
    if (!/(^|\.)a7laundry\.com$/i.test(url.hostname)) return null;
    const normalized = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '');
    return normalized || '/';
  } catch {
    return null;
  }
}

function normalizeE164(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || null;
}

function whatsappDestinationGuard(adSets) {
  const activeAdSets = adSets.filter((adSet) => (
    (adSet.effective_status || adSet.status) === 'ACTIVE'
  ));
  if (!activeAdSets.length) {
    return {
      status: 'not_applicable',
      officialNumber: `+${OFFICIAL_WHATSAPP_E164}`,
      activeAdSetsChecked: 0,
      verifiedOfficial: 0,
      unverified: [],
      blocked: []
    };
  }
  const observations = activeAdSets.map((adSet) => {
    const promoted = adSet.promoted_object || {};
    const observed = normalizeE164(
      promoted.whatsapp_phone_number
      || promoted.whatsapp_business_phone_number
      || promoted.phone_number
    );
    return {
      adSetId: adSet.id || null,
      adSetName: adSet.name || null,
      observedNumber: observed ? `+${observed}` : null,
      verified: observed === OFFICIAL_WHATSAPP_E164,
      blocked: observed === BLOCKED_TEST_WHATSAPP_E164 || Boolean(observed && observed !== OFFICIAL_WHATSAPP_E164)
    };
  });
  const blocked = observations.filter((item) => item.blocked);
  const unverified = observations.filter((item) => !item.observedNumber);
  const verifiedOfficial = observations.filter((item) => item.verified).length;
  return {
    status: blocked.length ? 'critical' : unverified.length ? 'unavailable' : 'verified',
    officialNumber: `+${OFFICIAL_WHATSAPP_E164}`,
    activeAdSetsChecked: observations.length,
    verifiedOfficial,
    unverified,
    blocked
  };
}

function actionValue(actions, candidates) {
  const match = (actions || []).find((action) => candidates.includes(action.action_type));
  return numberOrNull(match?.value);
}

function normalizeInsight(row) {
  return {
    accountId: row.account_id || null,
    accountName: row.account_name || null,
    campaignId: row.campaign_id || null,
    campaignName: row.campaign_name || null,
    adSetId: row.adset_id || null,
    adSetName: row.adset_name || null,
    adId: row.ad_id || null,
    adName: row.ad_name || null,
    dateStart: row.date_start || null,
    dateStop: row.date_stop || null,
    spend: numberOrNull(row.spend),
    impressions: numberOrNull(row.impressions),
    reach: numberOrNull(row.reach),
    frequency: numberOrNull(row.frequency),
    clicks: numberOrNull(row.clicks),
    linkClicks: numberOrNull(row.inline_link_clicks),
    ctr: numberOrNull(row.ctr),
    cpc: numberOrNull(row.cpc),
    messagingConversations: actionValue(row.actions, [
      'onsite_conversion.messaging_conversation_started_7d',
      'onsite_conversion.messaging_first_reply',
      'messaging_conversation_started_7d'
    ]),
    leads: actionValue(row.actions, ['lead', 'onsite_conversion.lead_grouped']),
    purchases: actionValue(row.actions, ['purchase', 'omni_purchase']),
    rawActions: (row.actions || []).map((action) => ({
      type: action.action_type || null,
      value: numberOrNull(action.value)
    }))
  };
}

function metaError(error) {
  const status = error?.status || error?.response?.status || null;
  return {
    code: status === 401 || status === 403 ? 'ACCESS_DENIED' : 'UPSTREAM_ERROR',
    message: status === 401 || status === 403
      ? 'A Meta recusou a credencial de leitura do MOS.'
      : 'A Meta não respondeu com dados válidos.'
  };
}

export function readMetaKpiConfig(environment = process.env) {
  const missing = META_CONFIG_KEYS.filter((key) => !String(environment[key] || '').trim());
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    apiVersion: environment.META_GRAPH_API_VERSION.trim(),
    adAccountId: environment.META_AD_ACCOUNT_ID.replace(/\D/g, ''),
    accessToken: environment.META_ACCESS_TOKEN.trim()
  };
}

async function requestMeta(fetchImpl, config, path, parameters) {
  const url = new URL(`https://graph.facebook.com/${config.apiVersion}/${path}`);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.accessToken}`
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    const error = new Error('Meta request failed');
    error.status = response.status;
    throw error;
  }
  return {
    rows: Array.isArray(body.data) ? body.data : [],
    truncated: Boolean(body.paging?.next)
  };
}

function metaGraph(campaigns, adSets, ads, period, fetchedAt) {
  const nodes = new Map();
  const edges = [];
  const addNode = (node) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };
  campaigns.forEach((campaign) => addNode({
    id: `meta:campaign:${campaign.id}`,
    type: 'campaign',
    platform: 'meta_ads',
    label: campaign.name,
    entityId: campaign.id,
    status: campaign.effective_status || campaign.status,
    source: 'Meta Marketing API',
    requestedPeriod: period,
    fetchedAt
  }));
  adSets.forEach((adSet, index) => {
    const id = `meta:adset:${adSet.id}`;
    addNode({
      id,
      type: 'ad_set',
      platform: 'meta_ads',
      label: adSet.name,
      entityId: adSet.id,
      status: adSet.effective_status || adSet.status,
      source: 'Meta Marketing API',
      requestedPeriod: period,
      fetchedAt
    });
    if (adSet.campaign_id) {
      edges.push({
        id: `meta:campaign-adset:${index}`,
        type: 'campaign_to_ad_set',
        from: `meta:campaign:${adSet.campaign_id}`,
        to: id,
        source: 'Meta Marketing API',
        requestedPeriod: period,
        fetchedAt
      });
    }
  });
  ads.forEach((ad, index) => {
    const id = `meta:ad:${ad.id}`;
    const creative = ad.creative || {};
    addNode({
      id,
      type: 'ad',
      platform: 'meta_ads',
      label: ad.name,
      entityId: ad.id,
      status: ad.effective_status || ad.status,
      creativeId: creative.id || null,
      thumbnailUrl: creative.thumbnail_url || null,
      source: 'Meta Marketing API',
      requestedPeriod: period,
      fetchedAt
    });
    if (ad.adset_id) {
      edges.push({
        id: `meta:adset-ad:${index}`,
        type: 'ad_set_to_ad',
        from: `meta:adset:${ad.adset_id}`,
        to: id,
        source: 'Meta Marketing API',
        requestedPeriod: period,
        fetchedAt
      });
    }
    const linkData = creative.object_story_spec?.link_data;
    const destination = linkData?.link || linkData?.call_to_action?.value?.link || null;
    const path = canonicalPath(destination);
    if (path) {
      const pageId = `page:${path}`;
      addNode({
        id: pageId,
        type: path.startsWith('/blog/') ? 'article' : 'landing_page',
        label: path,
        canonicalPath: path,
        source: 'A7 site + Meta Marketing API',
        requestedPeriod: period,
        fetchedAt
      });
      edges.push({
        id: `meta:ad-page:${index}`,
        type: 'ad_to_page',
        from: id,
        to: pageId,
        source: 'Meta Marketing API',
        requestedPeriod: period,
        fetchedAt
      });
    }
  });
  return { nodes: [...nodes.values()], edges };
}

export async function collectMetaKpis(fetchImpl, config, period, now = new Date()) {
  const fetchedAt = now.toISOString();
  const account = `act_${config.adAccountId}`;
  const common = { limit: 500 };
  const requests = [
    requestMeta(fetchImpl, config, `${account}/campaigns`, {
      ...common,
      fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,updated_time'
    }),
    requestMeta(fetchImpl, config, `${account}/adsets`, {
      ...common,
      fields: 'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,promoted_object,start_time,end_time,updated_time'
    }),
    requestMeta(fetchImpl, config, `${account}/ads`, {
      ...common,
      fields: 'id,name,campaign_id,adset_id,status,effective_status,updated_time,creative{id,name,thumbnail_url,object_story_spec}'
    }),
    requestMeta(fetchImpl, config, `${account}/insights`, {
      ...common,
      level: 'ad',
      time_range: JSON.stringify({ since: period.startDate, until: period.endDate }),
      time_increment: 1,
      fields: 'account_id,account_name,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,date_stop,spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,actions'
    })
  ];
  const settled = await Promise.allSettled(requests);
  const names = ['campaigns', 'adSets', 'ads', 'insights'];
  const values = {};
  const errors = [];
  settled.forEach((result, index) => {
    const name = names[index];
    if (result.status === 'fulfilled') values[name] = result.value;
    else {
      values[name] = { rows: [], truncated: false };
      errors.push({ report: name, ...metaError(result.reason) });
    }
  });
  const successful = settled.filter((result) => result.status === 'fulfilled').length;
  if (successful === 0) {
    return {
      status: 'unavailable',
      source: 'Meta Marketing API',
      adAccountId: config.adAccountId,
      requestedPeriod: period,
      fetchedAt,
      errors
    };
  }
  const campaigns = values.campaigns.rows;
  const adSets = values.adSets.rows;
  const ads = values.ads.rows;
  const insights = values.insights.rows.map(normalizeInsight);
  const graph = metaGraph(campaigns, adSets, ads, period, fetchedAt);
  const guardrails = {
    whatsappDestination: whatsappDestinationGuard(adSets)
  };
  return {
    status: successful === settled.length ? 'live' : 'partial',
    source: 'Meta Marketing API',
    adAccountId: config.adAccountId,
    requestedPeriod: period,
    fetchedAt,
    campaigns,
    adSets,
    ads,
    insights,
    guardrails,
    graph,
    pagination: Object.fromEntries(names.map((name) => [name, { truncated: values[name].truncated }])),
    errors
  };
}
