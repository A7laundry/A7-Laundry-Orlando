import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { observeGrowthTarget, validateGrowthTarget } from '../growth-target-observer.js';

const origin = 'https://a7-laundry-orlando-abc123-dennis-a7s-projects.vercel.app';
const target = { kind: 'preview', origin, deploymentId: 'dpl_ABCDEFGHIJKLMNOPQRST' };
const indexHtml = '<!doctype html><meta name="robots" content="index,follow"><link rel="canonical" href="https://a7laundry.com/example">';
const reviewHtml = '<!doctype html><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://a7laundry.com/review">';
const adjudicationHtml = '<!doctype html><meta name="robots" content="index,follow"><link rel="canonical" href="https://a7laundry.com/adjudication">';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const manifest = {
  schemaVersion: '2.0.0', registrySha256: 'a'.repeat(64), artifactState: 'built', buildRevision: 'build-test',
  sourceUrlCount: 3, publicIndexableCount: 1, managedFunnelCount: 1,
  assets: [
    { id: 'asset_example', canonicalPath: '/example', contentType: 'article', sourceLifecycle: 'published_source', journeyStage: 'mofu', clusterId: 'test', pillarPath: '/example', clusterOwnerPath: '/example', clusterRelation: 'owner', canonicalState: 'self', canonicalOwnerPath: '/example', intendedIndexation: 'index', observedInBuiltSitemap: true, artifactSha256: hash(indexHtml), funnel: { id: 'example', name: 'Example', aliases: ['EXAMPLE'], intent: 'Test', audience: 'Guests', action: 'Read', campaignRole: 'MOFU' } },
    { id: 'asset_review', canonicalPath: '/review', contentType: 'article', sourceLifecycle: 'source_candidate', journeyStage: 'mofu', clusterId: 'test', pillarPath: '/example', clusterOwnerPath: '/example', clusterRelation: 'supporting', canonicalState: 'adjudication_required', canonicalOwnerPath: '/review', intendedIndexation: 'noindex_review', observedInBuiltSitemap: false, artifactSha256: hash(reviewHtml), funnel: null },
    { id: 'asset_adjudication', canonicalPath: '/adjudication', contentType: 'regional_page', sourceLifecycle: 'source_candidate', journeyStage: 'bofu', clusterId: 'test', pillarPath: '/example', clusterOwnerPath: '/example', clusterRelation: 'supporting', canonicalState: 'self', canonicalOwnerPath: '/adjudication', intendedIndexation: 'adjudication_required', observedInBuiltSitemap: false, artifactSha256: hash(adjudicationHtml), funnel: null }
  ]
};

function response(body, type) { return new Response(body, { status: 200, headers: { 'content-type': type } }); }
function fetchFixture(overrides = {}) {
  return async (url) => {
    if (url.endsWith('a7-growth-manifest.json')) return response(JSON.stringify(manifest), 'application/json');
    if (url.endsWith('/sitemap.xml')) return response('<urlset><url><loc>https://a7laundry.com/example</loc></url></urlset>', 'application/xml');
    if (url.endsWith('/example')) return response(overrides.example || indexHtml, 'text/html');
    if (url.endsWith('/review')) return response(reviewHtml, 'text/html');
    if (url.endsWith('/adjudication')) return response(adjudicationHtml, 'text/html');
    return new Response('no', { status: 404 });
  };
}

test('target policy rejects SSRF-style and non-canonical origins', () => {
  assert.throws(() => validateGrowthTarget({ ...target, origin: 'http://127.0.0.1' }), /origin/);
  assert.throws(() => validateGrowthTarget({ ...target, origin: `${origin}/path` }), /origin/);
  assert.throws(() => validateGrowthTarget({ ...target, deploymentId: 'short' }), /identity/);
});

test('full preview observation verifies every asset and sitemap', async () => {
  const result = await observeGrowthTarget(fetchFixture(), target, { protectionBypass: 'secret-value' });
  assert.equal(result.ledgerEligible, true);
  assert.equal(result.state, 'preview_verified');
  assert.equal(result.scope.expectedAssets, 3);
  assert.equal(result.scope.verifiedAssets, 3);
  assert.equal(JSON.stringify(result).includes('secret-value'), false);
});

test('one route mismatch makes the full observation ineligible', async () => {
  const result = await observeGrowthTarget(fetchFixture({ example: `${indexHtml}changed` }), target);
  assert.equal(result.ledgerEligible, false);
  assert.equal(result.routes.find((route) => route.assetId === 'asset_example').routeState, 'drift');
  assert.equal(result.failures.some((failure) => failure.code === 'ROUTE_DRIFT'), true);
});
