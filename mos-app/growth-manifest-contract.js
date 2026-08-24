import crypto from 'node:crypto';
import { latestReleaseObservation } from './release-ledger-contract.js';

export const DEFAULT_GROWTH_MANIFEST_URL = 'https://a7laundry.com/.well-known/a7-growth-manifest.json';
const PRODUCTION_ORIGIN = 'https://a7laundry.com';
const MAX_MANIFEST_BYTES = 1_000_000;
const DEFAULT_RELEASE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SHA256 = /^[a-f0-9]{64}$/;
const ASSET_ID = /^asset_[a-z0-9_]{1,180}$/;
const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/;
const TOP_LEVEL_KEYS = new Set(['schemaVersion', 'registrySha256', 'artifactState', 'buildRevision', 'sourceUrlCount', 'publicIndexableCount', 'managedFunnelCount', 'assets']);
const ASSET_KEYS = new Set(['id', 'canonicalPath', 'contentType', 'sourceLifecycle', 'journeyStage', 'clusterId', 'pillarPath', 'clusterOwnerPath', 'clusterRelation', 'canonicalState', 'canonicalOwnerPath', 'intendedIndexation', 'observedInBuiltSitemap', 'artifactSha256', 'funnel']);
const FUNNEL_KEYS = new Set(['id', 'name', 'aliases', 'intent', 'audience', 'action', 'campaignRole']);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function exactKeys(value, allowed) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).every((key) => allowed.has(key));
}

function safeText(value, max = 500) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f]/.test(value);
}

export function validateGrowthManifest(manifest) {
  if (!exactKeys(manifest, TOP_LEVEL_KEYS)) return false;
  if (manifest.artifactState !== 'built' || !SHA256.test(manifest.registrySha256 || '')) return false;
  if (!safeText(manifest.schemaVersion, 40) || !safeText(manifest.buildRevision, 200)) return false;
  if (!Number.isSafeInteger(manifest.sourceUrlCount) || manifest.sourceUrlCount <= 0) return false;
  if (!Number.isSafeInteger(manifest.publicIndexableCount) || manifest.publicIndexableCount < 0) return false;
  if (!Number.isSafeInteger(manifest.managedFunnelCount) || manifest.managedFunnelCount <= 0) return false;
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== manifest.sourceUrlCount) return false;

  const ids = new Set();
  const canonicals = new Set();
  let publicCount = 0;
  let funnelCount = 0;
  for (const asset of manifest.assets) {
    if (!exactKeys(asset, ASSET_KEYS)) return false;
    if (!ASSET_ID.test(asset.id || '') || ids.has(asset.id)) return false;
    if (!SAFE_PATH.test(asset.canonicalPath || '') || asset.canonicalPath.includes('..') || canonicals.has(asset.canonicalPath)) return false;
    if (!SHA256.test(asset.artifactSha256 || '')) return false;
    if (!safeText(asset.contentType, 80) || !safeText(asset.sourceLifecycle, 80) || !safeText(asset.journeyStage, 40)) return false;
    if (!safeText(asset.clusterId, 160) || !SAFE_PATH.test(asset.pillarPath || '') || !SAFE_PATH.test(asset.clusterOwnerPath || '')) return false;
    if (!['owner', 'supporting'].includes(asset.clusterRelation)) return false;
    if (!['self', 'provisional_owner', 'adjudication_required'].includes(asset.canonicalState) || !SAFE_PATH.test(asset.canonicalOwnerPath || '')) return false;
    if (!['index', 'noindex_review', 'adjudication_required'].includes(asset.intendedIndexation)) return false;
    if (typeof asset.observedInBuiltSitemap !== 'boolean') return false;
    if (asset.observedInBuiltSitemap !== (asset.intendedIndexation === 'index')) return false;
    if (asset.observedInBuiltSitemap) publicCount += 1;
    ids.add(asset.id);
    canonicals.add(asset.canonicalPath);
    if (asset.funnel !== null) {
      if (!exactKeys(asset.funnel, FUNNEL_KEYS)) return false;
      if (!safeText(asset.funnel.id, 120) || !safeText(asset.funnel.name, 200)) return false;
      if (!Array.isArray(asset.funnel.aliases) || !asset.funnel.aliases.every((alias) => safeText(alias, 160))) return false;
      if (![asset.funnel.intent, asset.funnel.audience, asset.funnel.action, asset.funnel.campaignRole].every((value) => safeText(value, 800))) return false;
      funnelCount += 1;
    }
  }
  return publicCount === manifest.publicIndexableCount && funnelCount === manifest.managedFunnelCount;
}

export function canonicalFromHtml(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/a7laundry\.com([^"']*)["'][^>]*>/i)?.[1]
    || html.match(/<link\s+[^>]*href=["']https:\/\/a7laundry\.com([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1]
    || null;
}

export function definitionsFromGrowthManifest(observation) {
  if (!observation?.contractValidated || !Array.isArray(observation.assets)) return [];
  return observation.assets.map((asset) => ({
    assetId: asset.id,
    id: asset.funnel?.id || asset.id,
    name: asset.funnel?.name || asset.canonicalPath,
    canonicalPath: asset.canonicalPath,
    funnelCodes: asset.funnel?.aliases || [],
    managedFunnel: Boolean(asset.funnel),
    releaseStatus: asset.observationState || 'unobserved',
    intent: asset.funnel?.intent || `Ativo governado do cluster ${asset.clusterId}`,
    audience: asset.funnel?.audience || 'Audiência definida pelo ativo e pelo cluster editorial.',
    action: asset.funnel?.action || 'Continuar pela próxima ação governada do ativo.',
    campaignRole: asset.funnel?.campaignRole || 'Ativo orgânico/editorial; sem campanha paga inferida.',
    journeyStage: asset.journeyStage,
    clusterId: asset.clusterId,
    sourceLifecycle: asset.sourceLifecycle,
    artifactState: observation.artifactState,
    intendedIndexation: asset.intendedIndexation,
    observedInBuiltSitemap: asset.observedInBuiltSitemap,
    artifactSha256: asset.artifactSha256
  }));
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs, accept) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      cache: 'no-store', redirect: 'error', headers: { Accept: accept }, signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function unavailable(fetchedAt, code, message) {
  return { status: 'unavailable', catalogSource: 'unavailable', source: 'A7 public growth artifact manifest', fetchedAt, contractValidated: false, error: { code, message } };
}

export async function observeGrowthManifest(fetchImpl = fetch, options = {}) {
  const manifestUrl = options.manifestUrl || DEFAULT_GROWTH_MANIFEST_URL;
  const timeoutMs = options.timeoutMs || 4_000;
  const fetchedAt = (options.now || new Date()).toISOString();
  let parsedManifestUrl;
  try { parsedManifestUrl = new URL(manifestUrl); } catch { return unavailable(fetchedAt, 'MANIFEST_URL_INVALID', 'A origem do manifesto público é inválida.'); }
  if (parsedManifestUrl.origin !== PRODUCTION_ORIGIN || parsedManifestUrl.pathname !== '/.well-known/a7-growth-manifest.json') {
    return unavailable(fetchedAt, 'MANIFEST_ORIGIN_REJECTED', 'O manifesto público não pertence à origem autorizada.');
  }

  try {
    const response = await fetchWithTimeout(fetchImpl, parsedManifestUrl.href, timeoutMs, 'application/json');
    if (!response.ok) return unavailable(fetchedAt, 'MANIFEST_HTTP_ERROR', `O manifesto público respondeu HTTP ${response.status}.`);
    if (response.url && response.url !== parsedManifestUrl.href) return unavailable(fetchedAt, 'MANIFEST_REDIRECT_REJECTED', 'Redirecionamento do manifesto não é permitido.');
    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/application\/(?:[a-z0-9.+-]*\+)?json/i.test(contentType)) return unavailable(fetchedAt, 'MANIFEST_CONTENT_TYPE_INVALID', 'O manifesto público não retornou JSON.');
    const raw = await response.text();
    if (Buffer.byteLength(raw) > MAX_MANIFEST_BYTES) return unavailable(fetchedAt, 'MANIFEST_TOO_LARGE', 'O manifesto público excedeu o limite de segurança.');
    let manifest;
    try { manifest = JSON.parse(raw); } catch { return unavailable(fetchedAt, 'MANIFEST_JSON_INVALID', 'O manifesto público contém JSON inválido.'); }
    if (!validateGrowthManifest(manifest)) return unavailable(fetchedAt, 'MANIFEST_INVALID', 'O manifesto público não corresponde ao contrato fechado de artefato.');

    const managed = manifest.assets.filter((asset) => asset.funnel);
    const routeChecks = await Promise.all(managed.map(async (asset) => {
      try {
        const pageUrl = `${PRODUCTION_ORIGIN}${asset.canonicalPath}`;
        const pageResponse = await fetchWithTimeout(fetchImpl, pageUrl, timeoutMs, 'text/html');
        if (pageResponse.url && pageResponse.url !== pageUrl) return { canonicalPath: asset.canonicalPath, routeState: 'unavailable', httpStatus: null };
        if (!pageResponse.ok) return { canonicalPath: asset.canonicalPath, routeState: 'unavailable', httpStatus: pageResponse.status };
        const bytes = Buffer.from(await pageResponse.arrayBuffer());
        const html = bytes.toString('utf8');
        const hashMatches = sha256(bytes) === asset.artifactSha256;
        const canonicalMatches = canonicalFromHtml(html) === asset.canonicalPath;
        return { canonicalPath: asset.canonicalPath, routeState: hashMatches && canonicalMatches ? 'route_verified' : 'production_drift', httpStatus: pageResponse.status, hashMatches, canonicalMatches };
      } catch {
        return { canonicalPath: asset.canonicalPath, routeState: 'unavailable', httpStatus: null };
      }
    }));

    const releaseObservation = latestReleaseObservation(options.releaseLedger, {
      registrySha256: manifest.registrySha256,
      targetOrigin: PRODUCTION_ORIGIN
    });
    const releaseAgeMs = releaseObservation ? Math.max(0, Date.parse(fetchedAt) - Date.parse(releaseObservation.observedAt)) : null;
    const releaseFresh = releaseObservation ? releaseAgeMs <= (options.maxReleaseAgeMs || DEFAULT_RELEASE_MAX_AGE_MS) : false;
    const manifestSha256 = sha256(Buffer.from(raw));
    const ledgerSubjectMatches = releaseFresh
      && releaseObservation?.subject?.manifestSha256 === manifestSha256
      && releaseObservation.subject.buildRevision === manifest.buildRevision
      && releaseObservation.scope.mode === 'full_registry'
      && releaseObservation.scope.expectedAssets === manifest.sourceUrlCount
      && releaseObservation.scope.expectedSitemapUrls === manifest.publicIndexableCount
    const ledgerActiveMatches = ledgerSubjectMatches
      && releaseObservation.result.state === 'active_production'
      && releaseObservation.scope.verifiedAssets === manifest.sourceUrlCount
      && releaseObservation.scope.observedSitemapUrls === manifest.publicIndexableCount;
    const checkByPath = new Map(routeChecks.map((item) => [item.canonicalPath, item]));
    const ledgerRouteByPath = new Map((ledgerSubjectMatches ? releaseObservation.routes : []).map((item) => [item.canonicalPath, item]));
    const assets = manifest.assets.map((asset) => {
      const route = checkByPath.get(asset.canonicalPath);
      const ledgerRoute = ledgerRouteByPath.get(asset.canonicalPath);
      let observationState = 'outside_observed_scope';
      if (route && route.routeState !== 'route_verified') observationState = route.routeState;
      else if (ledgerActiveMatches && ledgerRoute?.routeState === 'route_verified') observationState = 'active_production';
      else if (ledgerSubjectMatches && releaseObservation.result.state === 'production_drift' && ledgerRoute) {
        observationState = ledgerRoute.routeState === 'drift' ? 'production_drift' : ledgerRoute.routeState === 'unavailable' ? 'unavailable' : 'verified_unledgered';
      } else if (ledgerSubjectMatches && releaseObservation.result.state === 'unavailable') observationState = 'unavailable';
      else if (route) observationState = 'verified_unledgered';
      else if (releaseObservation && !releaseFresh) observationState = 'stale_observation';
      return { ...asset, observationState };
    });
    const drifted = routeChecks.filter((item) => item.routeState === 'production_drift').length;
    const routeUnavailable = routeChecks.filter((item) => item.routeState === 'unavailable').length;
    const ledgerState = ledgerSubjectMatches ? releaseObservation.result.state : null;
    return {
      status: drifted || ledgerState === 'production_drift' ? 'production_drift' : routeUnavailable ? 'partial' : ledgerState === 'unavailable' ? 'unavailable' : ledgerActiveMatches ? 'live' : releaseObservation && !releaseFresh ? 'stale_observation' : 'verified_unledgered',
      catalogSource: 'observed_public_manifest', observedScope: ledgerSubjectMatches ? 'full_registry_ledger' : 'managed_funnels_only', observedAssetCount: ledgerSubjectMatches ? manifest.assets.length : managed.length,
      source: 'A7 public growth artifact manifest + scoped route verification', fetchedAt, contractValidated: true,
      registrySha256: manifest.registrySha256, artifactState: manifest.artifactState,
      releaseFreshness: releaseObservation ? { observedAt: releaseObservation.observedAt, ageMs: releaseAgeMs, maxAgeMs: options.maxReleaseAgeMs || DEFAULT_RELEASE_MAX_AGE_MS, state: releaseFresh ? 'fresh' : 'stale' } : { observedAt: null, ageMs: null, maxAgeMs: options.maxReleaseAgeMs || DEFAULT_RELEASE_MAX_AGE_MS, state: 'unavailable' },
      sourceUrlCount: manifest.sourceUrlCount, publicIndexableCount: manifest.publicIndexableCount, managedFunnelCount: manifest.managedFunnelCount,
      assets, routeChecks,
      limitation: ledgerSubjectMatches
        ? 'O ledger append-only aprovado reconcilia o corpus completo; a consulta também revalida os funis gerenciados no HTTP atual.'
        : 'O corpus possui classificação completa, mas hashes HTTP atuais são verificados somente nos funis gerenciados. Sem ledger append-only aprovado, rota verificada permanece verified_unledgered e nunca active_production.'
    };
  } catch {
    return unavailable(fetchedAt, 'MANIFEST_UNAVAILABLE', 'O manifesto público não pôde ser observado nesta consulta.');
  }
}
