import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { authoredAssetId, CONTENT_REGISTRY } from '../governance/content-registry.mjs';
import { assertPublicManifestSafety } from './build-growth-manifest.mjs';
import { buildContentCorpora } from './lib/content-corpora.mjs';
import { validateContentRegistry } from './validate-content-registry.mjs';

test('registry covers the full source sitemap and separates source from public indexation', () => {
  const result = validateContentRegistry();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.summary.sourceUrls, 97);
  assert.equal(result.summary.registryEntries, 98);
  assert.equal(result.summary.managedFunnels, 7);
  assert.equal(result.summary.quarantined, 35);
  assert.equal(
    result.summary.tofu + result.summary.mofu + result.summary.bofu + result.summary.nonFunnel,
    98
  );
});

test('asset identities are explicit locks and unknown routes have no derived fallback', () => {
  assert.equal(authoredAssetId('/plans'), 'asset_plans');
  assert.throws(() => authoredAssetId('/renamed-without-an-identity-lock'), /missing authored asset identity lock/);
});

test('a new sitemap URL without a registry entry fails closed', () => {
  const result = validateContentRegistry({ registry: CONTENT_REGISTRY.slice(1) });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('sitemap route missing from registry: /')));
});

test('duplicate canonical paths fail closed', () => {
  const result = validateContentRegistry({ registry: [...CONTENT_REGISTRY, CONTENT_REGISTRY[0]] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('duplicate registry canonicalPath: /')));
});

test('quarantine drift fails closed', () => {
  const result = validateContentRegistry({ quarantine: { routes: [] } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('registry noindex_review route missing from quarantine')));
});

test('missing cluster pillar fails closed', () => {
  const mutated = CONTENT_REGISTRY.map((entry, index) => index === 0 ? { ...entry, pillarPath: '/missing-pillar' } : entry);
  const result = validateContentRegistry({ registry: mutated });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('missing pillar /missing-pillar')));
});

test('public artifact manifest rejects deployment observations and secrets', () => {
  assert.throws(
    () => assertPublicManifestSafety({ artifactState: 'built', observationState: 'active_production' }),
    /unknown field/
  );
  assert.throws(
    () => assertPublicManifestSafety({ artifactState: 'built', developerToken: 'do-not-publish' }),
    /unknown field/
  );
  assert.throws(
    () => assertPublicManifestSafety({ artifactState: 'active_production' }),
    /unknown field|assets array|artifactState=built/
  );
  assert.throws(
    () => assertPublicManifestSafety({ artifactState: 'built', assets: [] }),
    /unknown field|assets array/
  );
});

test('deployable discovery finds marketing HTML even when sitemap and registry omit it', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-content-discovery-'));
  fs.mkdirSync(path.join(temporary, 'blog'));
  fs.writeFileSync(path.join(temporary, 'blog', 'orphan.html'), '<link rel="canonical" href="https://a7laundry.com/blog/orphan">');
  fs.writeFileSync(path.join(temporary, 'sitemap.xml'), '<urlset></urlset>');
  fs.writeFileSync(path.join(temporary, 'vercel.json'), JSON.stringify({ rewrites: [] }));
  const result = buildContentCorpora({ root: temporary, registry: [], exclusions: [] });
  assert.equal(result.counts.deployableHtml, 1);
  assert.equal(result.rows[0].canonicalPath, '/blog/orphan');
  assert.equal(result.rows[0].status, 'new_unregistered');
});

test('stable asset identity and cluster ownership are explicit across the registry', () => {
  assert.equal(new Set(CONTENT_REGISTRY.map((entry) => entry.assetId)).size, CONTENT_REGISTRY.length);
  assert.ok(CONTENT_REGISTRY.every((entry) => /^asset_[a-z0-9_]+$/.test(entry.assetId)));
  assert.ok(CONTENT_REGISTRY.every((entry) => ['intent_owner', 'supporting'].includes(entry.clusterRole)));
  assert.equal(CONTENT_REGISTRY.find((entry) => entry.canonicalPath === '/blog/laundry-davenport').indexationPolicy, 'adjudication_required');
});
