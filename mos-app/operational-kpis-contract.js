const DAY_MS = 86_400_000;

export function requestedOperationalPeriod(now = new Date()) {
  const end = new Date(now);
  const start = new Date(end.getTime() - (30 * DAY_MS));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    timeZone: 'America/New_York',
    rationale: 'Janela móvel de 30 dias até a coleta; eventos operacionais são server-side.'
  };
}

export function readOperationalKpiConfig(env = process.env) {
  const url = String(env.A7_OPERATIONS_SUPABASE_URL || env.WHATSAPP_SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(env.A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY || env.WHATSAPP_SUPABASE_SERVICE_ROLE_KEY || '');
  const missing = [];
  if (!url) missing.push('A7_OPERATIONS_SUPABASE_URL');
  if (!key) missing.push('A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY');
  return {ok: missing.length === 0, url, key, missing};
}

function unavailable(period, code) {
  return {
    status: 'unavailable', source: 'A7 operational ledger', requestedPeriod: period,
    fetchedAt: new Date().toISOString(), stages: null, rates: null, byLandingPage: [],
    error: {code}, limitation: 'Ausência de fonte não foi convertida em zero.'
  };
}

export function supabaseHeaders(key) {
  const headers = {apikey: key};
  if (!String(key).startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function collectOperationalKpis(fetchImpl, config, options = {}) {
  const period = options.period || requestedOperationalPeriod(options.now);
  if (!config?.ok) return unavailable(period, 'CONFIGURATION_INCOMPLETE');
  try {
    const response = await fetchImpl(`${config.url}/rest/v1/rpc/a7_orlando_operational_funnel`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(config.key),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({p_start: period.start, p_end: period.end})
    });
    if (!response.ok) return unavailable(period, 'UPSTREAM_ERROR');
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || !payload.stages || !Array.isArray(payload.by_landing_page)) {
      return unavailable(period, 'INVALID_RESPONSE');
    }
    return {
      status: 'live', source: 'A7 operational ledger', requestedPeriod: period,
      fetchedAt: new Date().toISOString(), stages: payload.stages,
      rates: payload.rates || {}, byLandingPage: payload.by_landing_page,
      attribution: payload.attribution || {}, limitation: 'Contagens deduplicadas no ledger por IDs duráveis; sessões e cliques permanecem sob autoridade do GA4.'
    };
  } catch {
    return unavailable(period, 'CONNECTION_FAILED');
  }
}

export function attachOperationsToFunnels(funnels, operational) {
  if (!Array.isArray(funnels)) return [];
  const rows = operational?.status === 'live' ? operational.byLandingPage : [];
  const byPath = new Map(rows.map((row) => [row.canonical_path || '/', row]));
  return funnels.map((funnel) => ({
    ...funnel,
    operations: operational?.status === 'live'
      ? {status: 'observed', source: operational.source, requestedPeriod: operational.requestedPeriod, ...(byPath.get(funnel.canonicalPath) || {
        leads_created: 0, qualified_leads: 0, accepted_orders: 0, paid_orders: 0,
        service_revenue: 0, delivered_orders: 0, repeat_accepted_orders: 0
      })}
      : {status: 'unavailable', source: 'A7 operational ledger', requestedPeriod: operational?.requestedPeriod || null}
  }));
}
