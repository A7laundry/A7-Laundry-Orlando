import crypto from 'node:crypto';
import { canonicalFromHtml, validateGrowthManifest } from './growth-manifest-contract.js';
import { stableJson } from './release-ledger-contract.js';

const PRODUCTION_ORIGIN = 'https://a7laundry.com';
const PREVIEW_HOST = /^a7-laundry-orlando-[a-z0-9]+-dennis-a7s-projects\.vercel\.app$/;
const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]{20,}$/;
const MAX_MANIFEST_BYTES = 1_000_000;
const MAX_HTML_BYTES = 3_000_000;
const MAX_SITEMAP_BYTES = 2_000_000;

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

export function validateGrowthTarget(target) {
  if (!target || !['preview', 'production'].includes(target.kind) || !DEPLOYMENT_ID.test(target.deploymentId || '')) throw new Error('growth target identity invalid');
  const url = new URL(target.origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') throw new Error('growth target origin invalid');
  if (target.kind === 'production' && url.origin !== PRODUCTION_ORIGIN) throw new Error('production target origin rejected');
  if (target.kind === 'preview' && !PREVIEW_HOST.test(url.hostname)) throw new Error('preview target origin rejected');
  return Object.freeze({ kind: target.kind, origin: url.origin, deploymentId: target.deploymentId });
}

async function strictFetch(fetchImpl, url, { accept, maxBytes, timeoutMs, headers = {} }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { cache: 'no-store', redirect: 'error', signal: controller.signal, headers: { Accept: accept, ...headers } });
    if (response.url && response.url !== url) throw new Error('redirect rejected');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) throw new Error('response too large');
    return { response, contentType, bytes };
  } finally { clearTimeout(timer); }
}

function sitemapPaths(xml) {
  return [...xml.matchAll(/<loc>https:\/\/a7laundry\.com([^<]*)<\/loc>/g)].map((match) => match[1] || '/').sort();
}

function robotsState(html) {
  const robots = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["']/i)?.[1] || '';
  return /noindex/i.test(robots) ? (/follow/i.test(robots) && !/nofollow/i.test(robots) ? 'noindex_follow' : 'unknown') : 'indexable';
}

async function inBatches(items, limit, worker) {
  const result = [];
  for (let index = 0; index < items.length; index += limit) {
    result.push(...await Promise.all(items.slice(index, index + limit).map(worker)));
  }
  return result;
}

export async function observeGrowthTarget(fetchImpl, targetInput, options = {}) {
  const target = validateGrowthTarget(targetInput);
  const timeoutMs = options.timeoutMs || 6_000;
  const bypass = options.protectionBypass || '';
  const protectedHeaders = bypass ? { 'x-vercel-protection-bypass': bypass } : {};
  const failures = [];
  let manifest;
  let manifestBytes;
  try {
    const fetched = await strictFetch(fetchImpl, `${target.origin}/.well-known/a7-growth-manifest.json`, { accept: 'application/json', maxBytes: MAX_MANIFEST_BYTES, timeoutMs, headers: protectedHeaders });
    if (!/json/i.test(fetched.contentType)) throw new Error('manifest content type invalid');
    manifestBytes = fetched.bytes;
    manifest = JSON.parse(fetched.bytes.toString('utf8'));
    if (!validateGrowthManifest(manifest) || manifest.schemaVersion !== '2.0.0') throw new Error('manifest contract invalid');
  } catch {
    return { target, ledgerEligible: false, state: 'unavailable', manifestState: 'unavailable', sitemapState: 'unavailable', failures: [{ code: 'MANIFEST_UNAVAILABLE', assetId: null }], routes: [] };
  }

  let observedSitemap = [];
  try {
    const fetched = await strictFetch(fetchImpl, `${target.origin}/sitemap.xml`, { accept: 'application/xml,text/xml', maxBytes: MAX_SITEMAP_BYTES, timeoutMs, headers: protectedHeaders });
    observedSitemap = sitemapPaths(fetched.bytes.toString('utf8'));
  } catch { failures.push({ code: 'SITEMAP_UNAVAILABLE', assetId: null }); }
  const expectedSitemap = manifest.assets.filter((asset) => asset.intendedIndexation === 'index').map((asset) => asset.canonicalPath).sort();
  if (JSON.stringify(observedSitemap) !== JSON.stringify(expectedSitemap)) failures.push({ code: 'SITEMAP_DRIFT', assetId: null });

  const routes = await inBatches(manifest.assets, options.concurrency || 8, async (asset) => {
    // `adjudication_required` preserves the currently observed page state while
    // keeping the URL out of the sitemap. It is debt made explicit, not an
    // implicit noindex decision. Only governed review quarantine expects
    // noindex,follow.
    const expectedRobots = asset.intendedIndexation === 'noindex_review' ? 'noindex_follow' : 'indexable';
    try {
      const fetched = await strictFetch(fetchImpl, `${target.origin}${asset.canonicalPath}`, { accept: 'text/html', maxBytes: MAX_HTML_BYTES, timeoutMs, headers: protectedHeaders });
      if (!/html/i.test(fetched.contentType)) throw new Error('route content type invalid');
      const html = fetched.bytes.toString('utf8');
      const observedHash = sha256(fetched.bytes);
      const canonicalObserved = canonicalFromHtml(html);
      const observedRobots = robotsState(html);
      const verified = observedHash === asset.artifactSha256 && canonicalObserved === asset.canonicalOwnerPath && observedRobots === expectedRobots;
      if (!verified) failures.push({ code: 'ROUTE_DRIFT', assetId: asset.id });
      return { assetId: asset.id, canonicalPath: asset.canonicalPath, expectedCanonicalPath: asset.canonicalOwnerPath, httpStatus: fetched.response.status, contentType: fetched.contentType, expectedSha256: asset.artifactSha256, observedSha256: observedHash, expectedRobotsState: expectedRobots, robotsState: observedRobots, canonicalObserved, routeState: verified ? 'route_verified' : 'drift' };
    } catch {
      failures.push({ code: 'ROUTE_UNAVAILABLE', assetId: asset.id });
      return { assetId: asset.id, canonicalPath: asset.canonicalPath, expectedCanonicalPath: asset.canonicalOwnerPath, httpStatus: null, contentType: null, expectedSha256: asset.artifactSha256, observedSha256: null, expectedRobotsState: expectedRobots, robotsState: 'unknown', canonicalObserved: null, routeState: 'unavailable' };
    }
  });
  const routesDigestSha256 = sha256(stableJson(routes.slice().sort((a, b) => a.assetId.localeCompare(b.assetId))));
  const verifiedAssets = routes.filter((route) => route.routeState === 'route_verified').length;
  const ledgerEligible = failures.length === 0 && verifiedAssets === manifest.sourceUrlCount;
  return {
    target, ledgerEligible, state: ledgerEligible ? (target.kind === 'preview' ? 'preview_verified' : 'verified_unledgered') : (target.kind === 'preview' ? 'preview_drift' : 'production_drift'),
    manifestState: 'verified', sitemapState: failures.some((failure) => failure.code.startsWith('SITEMAP_')) ? 'drift' : 'verified',
    subject: { manifestSchemaVersion: manifest.schemaVersion, manifestSha256: sha256(manifestBytes), registrySha256: manifest.registrySha256, buildRevision: manifest.buildRevision },
    scope: { mode: 'full_registry', expectedAssets: manifest.sourceUrlCount, verifiedAssets, expectedSitemapUrls: expectedSitemap.length, observedSitemapUrls: observedSitemap.length },
    routesDigestSha256, routes, failures
  };
}
