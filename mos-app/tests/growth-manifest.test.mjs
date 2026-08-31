import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  definitionsFromGrowthManifest,
  observeGrowthManifest
} from '../growth-manifest-contract.js';
import { recordSha256, stableJson, validateReleaseLedger } from '../release-ledger-contract.js';

const html = '<!doctype html><link rel="canonical" href="https://a7laundry.com/plans"><h1>Plans</h1>';
const htmlHash = crypto.createHash('sha256').update(html).digest('hex');
const manifest = {
  schemaVersion: '2.0.0',
  registrySha256: 'a'.repeat(64),
  artifactState: 'built',
  buildRevision: '1'.repeat(40),
  sourceUrlCount: 1,
  publicIndexableCount: 1,
  managedFunnelCount: 1,
  assets: [{
    id: 'asset_plans',
    canonicalPath: '/plans',
    contentType: 'pricing',
    sourceLifecycle: 'published',
    journeyStage: 'bofu',
    clusterId: 'guest-laundry-orlando',
    pillarPath: '/laundry-pickup-delivery-orlando',
    clusterOwnerPath: '/laundry-pickup-delivery-orlando',
    clusterRelation: 'supporting',
    canonicalState: 'self',
    canonicalOwnerPath: '/plans',
    intendedIndexation: 'index',
    observedInBuiltSitemap: true,
    artifactSha256: htmlHash,
    funnel: {
      id: 'plans',
      name: 'Pricing and Service Choice',
      aliases: ['SEO-ORLANDO-PLANS-V1'],
      intent: 'Pricing',
      audience: 'Guests',
      action: 'Estimate',
      campaignRole: 'BOFU pricing'
    }
  }]
};

function fakeFetch(pageBody = html) {
  return async (url) => {
    if (String(url).includes('a7-growth-manifest.json')) {
      return new Response(JSON.stringify(manifest), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (String(url) === 'https://a7laundry.com/plans') return new Response(pageBody, { status: 200 });
    return new Response('not found', { status: 404 });
  };
}

function approvedLedger() {
  const rawManifest = JSON.stringify(manifest);
  const route = {
    assetId: 'asset_plans', canonicalPath: '/plans', expectedCanonicalPath: '/plans', httpStatus: 200, contentType: 'text/html',
    expectedSha256: htmlHash, observedSha256: htmlHash, canonicalObserved: '/plans',
    expectedRobotsState: 'indexable', robotsState: 'indexable', routeState: 'route_verified'
  };
  const routesDigestSha256 = crypto.createHash('sha256').update(stableJson([route])).digest('hex');
  const subject = {
    manifestSchemaVersion: manifest.schemaVersion,
    manifestSha256: crypto.createHash('sha256').update(rawManifest).digest('hex'),
    registrySha256: manifest.registrySha256,
    buildRevision: manifest.buildRevision
  };
  const base = {
    schemaVersion: '1.0', observerVersion: '1.0.0', eventType: 'target_observation', subject,
    scope: { mode: 'full_registry', expectedAssets: 1, verifiedAssets: 1, expectedSitemapUrls: 1, observedSitemapUrls: 1 },
    result: { manifestState: 'verified', sitemapState: 'verified', routesDigestSha256, failures: [] },
    routes: [route], rollbackOfObservationId: null,
    authority: { actorRole: 'devops', approvalRef: 'owner-release-pass-test' }
  };
  const preview = {
    ...base, observationId: 'obs-20260823T120000000Z-aaaaaaaaaaaa', observedAt: '2026-08-23T12:00:00.000Z',
    target: { kind: 'preview', origin: 'https://a7-laundry-orlando-abc123-dennis-a7s-projects.vercel.app', deploymentId: 'dpl_ABCDEFGHIJKLMNOPQRST', promotedFromObservationId: null },
    result: { ...base.result, state: 'preview_verified' }, authority: { actorRole: 'qa', approvalRef: 'qa-pass-test' }, previousObservationId: null, previousRecordSha256: null
  };
  const production = {
    ...base, observationId: 'obs-20260823T121000000Z-bbbbbbbbbbbb', observedAt: '2026-08-23T12:10:00.000Z',
    target: { kind: 'production', origin: 'https://a7laundry.com', deploymentId: 'dpl_ZYXWVUTSRQPONMLKJIHG', promotedFromObservationId: preview.observationId },
    result: { ...base.result, state: 'active_production' }, previousObservationId: preview.observationId, previousRecordSha256: recordSha256(preview)
  };
  return validateReleaseLedger({
    schemaVersion: '1.0', records: [preview, production],
    ledgerTipObservationId: production.observationId, ledgerTipSha256: recordSha256(production)
  });
}

function ledgerWithProductionOutcome(state) {
  const approved = approvedLedger();
  const records = structuredClone(approved.records);
  const previous = records.at(-1);
  const unavailable = state === 'unavailable';
  const outcomeRoute = {
    ...previous.routes[0],
    httpStatus: unavailable ? null : 200,
    contentType: unavailable ? null : 'text/html',
    observedSha256: unavailable ? null : 'd'.repeat(64),
    canonicalObserved: unavailable ? null : '/plans',
    robotsState: unavailable ? 'unknown' : 'indexable',
    routeState: unavailable ? 'unavailable' : 'drift'
  };
  const outcome = {
    ...previous,
    observationId: state === 'unavailable' ? 'obs-20260823T124000000Z-dddddddddddd' : 'obs-20260823T124000000Z-cccccccccccc',
    observedAt: '2026-08-23T12:40:00.000Z',
    target: { ...previous.target, deploymentId: state === 'unavailable' ? 'dpl_UNAVAILABLEOUTCOME1234' : 'dpl_DRIFTOUTCOME12345678', promotedFromObservationId: null },
    scope: { ...previous.scope, verifiedAssets: 0, observedSitemapUrls: unavailable ? 0 : 1 },
    result: {
      state,
      manifestState: unavailable ? 'unavailable' : 'verified',
      sitemapState: unavailable ? 'unavailable' : 'verified',
      routesDigestSha256: crypto.createHash('sha256').update(stableJson([outcomeRoute])).digest('hex'),
      failures: [{ code: unavailable ? 'MANIFEST_UNAVAILABLE' : 'ROUTE_DRIFT', assetId: unavailable ? null : 'asset_plans' }]
    },
    routes: [outcomeRoute],
    authority: { actorRole: 'observer', approvalRef: null },
    previousObservationId: previous.observationId,
    previousRecordSha256: recordSha256(previous)
  };
  records.push(outcome);
  return validateReleaseLedger({
    schemaVersion: '1.0', records,
    ledgerTipObservationId: outcome.observationId,
    ledgerTipSha256: recordSha256(outcome)
  });
}

test('route verification never becomes active without an approved release ledger', async () => {
  const result = await observeGrowthManifest(fakeFetch(), { now: new Date('2026-08-23T12:00:00Z') });
  assert.equal(result.status, 'verified_unledgered');
  assert.equal(result.artifactState, 'built');
  assert.equal(result.assets[0].observationState, 'verified_unledgered');
  assert.equal(result.routeChecks[0].hashMatches, true);
  assert.equal(result.routeChecks[0].canonicalMatches, true);
});

test('approved append-only release observation can activate an exact artifact', async () => {
  const result = await observeGrowthManifest(fakeFetch(), {
    releaseLedger: approvedLedger(),
    now: new Date('2026-08-23T12:30:00.000Z')
  });
  assert.equal(result.status, 'live');
  assert.equal(result.assets[0].observationState, 'active_production');
});

test('an old full-registry ledger cannot keep unprobed assets active indefinitely', async () => {
  const result = await observeGrowthManifest(fakeFetch(), {
    releaseLedger: approvedLedger(),
    now: new Date('2026-08-25T12:30:00.000Z')
  });
  assert.equal(result.status, 'stale_observation');
  assert.equal(result.releaseFreshness.state, 'stale');
  assert.notEqual(result.assets[0].observationState, 'active_production');
});

test('a fresh full-registry drift observation is visible even outside the managed HTTP probe', async () => {
  const result = await observeGrowthManifest(fakeFetch(), {
    releaseLedger: ledgerWithProductionOutcome('production_drift'),
    now: new Date('2026-08-23T12:45:00.000Z')
  });
  assert.equal(result.status, 'production_drift');
  assert.equal(result.observedScope, 'full_registry_ledger');
  assert.equal(result.assets[0].observationState, 'production_drift');
});

test('a fresh unavailable full-registry observation cannot be hidden by a healthy managed probe', async () => {
  const result = await observeGrowthManifest(fakeFetch(), {
    releaseLedger: ledgerWithProductionOutcome('unavailable'),
    now: new Date('2026-08-23T12:45:00.000Z')
  });
  assert.equal(result.status, 'unavailable');
  assert.equal(result.observedScope, 'full_registry_ledger');
  assert.equal(result.assets[0].observationState, 'unavailable');
});

test('raw release objects cannot activate an artifact', async () => {
  const result = await observeGrowthManifest(fakeFetch(), {
    releaseLedger: { records: [], observationState: 'active_production' }
  });
  assert.equal(result.status, 'verified_unledgered');
});

test('hash mismatch becomes production_drift instead of active', async () => {
  const result = await observeGrowthManifest(fakeFetch(`${html}\nchanged`));
  assert.equal(result.status, 'production_drift');
  assert.equal(result.assets[0].observationState, 'production_drift');
  assert.equal(result.routeChecks[0].hashMatches, false);
});

test('manifest definitions keep source, artifact and observation axes separate', () => {
  const definitions = definitionsFromGrowthManifest({
    ...manifest,
    contractValidated: true,
    assets: manifest.assets.map((asset) => ({ ...asset, observationState: 'active_production' }))
  });
  assert.equal(definitions.length, 1);
  assert.equal(definitions[0].releaseStatus, 'active_production');
  assert.equal(definitions[0].journeyStage, 'bofu');
  assert.deepEqual(definitions[0].funnelCodes, ['SEO-ORLANDO-PLANS-V1']);
});

test('unavailable manifest remains nullable and sanitized', async () => {
  const result = await observeGrowthManifest(async () => new Response('no', { status: 503 }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.error.code, 'MANIFEST_HTTP_ERROR');
  assert.equal(JSON.stringify(result).includes('developer'), false);
});

test('empty or count-forged manifest fails closed', async () => {
  const forged = { ...manifest, assets: [], sourceUrlCount: 0, publicIndexableCount: '<img src=x onerror=alert(1)>' };
  const result = await observeGrowthManifest(async () => new Response(JSON.stringify(forged), {
    status: 200, headers: { 'content-type': 'application/json' }
  }));
  assert.equal(result.status, 'unavailable');
  assert.equal(result.contractValidated, false);
  assert.equal(result.error.code, 'MANIFEST_INVALID');
});

test('absolute canonical path cannot trigger an SSRF fetch', async () => {
  const forged = { ...manifest, assets: [{ ...manifest.assets[0], canonicalPath: 'http://127.0.0.1:9999/internal' }] };
  const calls = [];
  const result = await observeGrowthManifest(async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(forged), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  assert.equal(result.status, 'unavailable');
  assert.equal(calls.length, 1);
  assert.equal(calls[0], 'https://a7laundry.com/.well-known/a7-growth-manifest.json');
});

test('definitions reject a raw manifest that did not pass the observer contract', () => {
  assert.deepEqual(definitionsFromGrowthManifest(manifest), []);
});
