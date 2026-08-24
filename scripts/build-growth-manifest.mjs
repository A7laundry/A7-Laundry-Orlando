import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTENT_REGISTRY,
  CONTENT_REGISTRY_SCHEMA_VERSION
} from '../marketing/growth/content-registry.mjs';
import { validateContentRegistry } from './validate-content-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableRegistryView() {
  return CONTENT_REGISTRY
    .map((entry) => ({
      assetId: entry.assetId,
      canonicalPath: entry.canonicalPath,
      contentType: entry.contentType,
      sourceLifecycle: entry.sourceLifecycle,
      indexationPolicy: entry.indexationPolicy,
      funnelStage: entry.funnelStage,
      clusterId: entry.clusterId,
      pillarPath: entry.pillarPath,
      clusterOwnerPath: entry.clusterOwnerPath,
      clusterRelation: entry.clusterRelation,
      canonicalState: entry.canonicalState,
      canonicalOwnerPath: entry.canonicalOwnerPath,
      mosVisibility: entry.mosVisibility,
      funnelId: entry.funnelId || null,
      funnelName: entry.funnelName || null,
      funnelCodes: entry.funnelCodes || [],
      intent: entry.intent || null,
      audience: entry.audience || null,
      action: entry.action || null,
      campaignRole: entry.campaignRole || null
    }))
    .sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));
}

function sitemapRoutes(xml) {
  return new Set(
    [...xml.matchAll(/<loc>https:\/\/a7laundry\.com([^<]*)<\/loc>/g)]
      .map((match) => match[1])
      .filter((route) => !route.endsWith('.xml'))
  );
}

export function assertPublicManifestSafety(manifest) {
  const topKeys = new Set(['schemaVersion', 'registrySha256', 'artifactState', 'buildRevision', 'sourceUrlCount', 'publicIndexableCount', 'managedFunnelCount', 'assets']);
  const assetKeys = new Set(['id', 'canonicalPath', 'contentType', 'sourceLifecycle', 'journeyStage', 'clusterId', 'pillarPath', 'clusterOwnerPath', 'clusterRelation', 'canonicalState', 'canonicalOwnerPath', 'intendedIndexation', 'observedInBuiltSitemap', 'artifactSha256', 'funnel']);
  const funnelKeys = new Set(['id', 'name', 'aliases', 'intent', 'audience', 'action', 'campaignRole']);
  const rejectUnknown = (value, allowed, trail) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${trail} must be an object.`);
    for (const key of Object.keys(value)) {
      if (!allowed.has(key)) throw new Error(`Public growth manifest contains unknown field ${trail}.${key}`);
    }
  };
  rejectUnknown(manifest, topKeys, 'manifest');
  if (!Array.isArray(manifest.assets) || !manifest.assets.length) throw new Error('Public growth manifest requires a non-empty assets array.');
  manifest.assets.forEach((asset, index) => {
    rejectUnknown(asset, assetKeys, `manifest.assets[${index}]`);
    if (asset.funnel !== null) rejectUnknown(asset.funnel, funnelKeys, `manifest.assets[${index}].funnel`);
  });
  const serialized = JSON.stringify(manifest);
  if (/(?:\/Users\/|\\Users\\|\.env|BEGIN (?:RSA |EC )?PRIVATE KEY|(?:api|access|refresh)[_-]?token|client[_-]?secret|password|cookie)/i.test(serialized)) {
    throw new Error('Public growth manifest contains an internal path or credential material.');
  }
  if (manifest.artifactState !== 'built') throw new Error('Public growth manifest may declare only artifactState=built.');
  return true;
}

export function buildGrowthManifest(options = {}) {
  const workspace = options.root || root;
  const output = options.output || path.join(workspace, 'dist');
  const validation = validateContentRegistry({ root: workspace });
  if (!validation.ok) throw new Error(`Content registry is invalid:\n${validation.errors.join('\n')}`);
  const finalSitemapPath = path.join(output, 'sitemap.xml');
  if (!fs.existsSync(finalSitemapPath)) throw new Error('Built sitemap is missing; growth manifest must run after the public build.');
  const publicRoutes = sitemapRoutes(fs.readFileSync(finalSitemapPath, 'utf8'));
  const registryView = stableRegistryView();
  const registrySha = sha256(JSON.stringify(registryView));

  const assets = registryView.map((entry) => {
    const source = CONTENT_REGISTRY.find((candidate) => candidate.canonicalPath === entry.canonicalPath);
    const builtFile = path.join(output, source.sourceFile);
    if (!fs.existsSync(builtFile)) throw new Error(`${entry.canonicalPath}: missing built file ${source.sourceFile}`);
    return {
      id: entry.assetId,
      canonicalPath: entry.canonicalPath,
      contentType: entry.contentType,
      sourceLifecycle: entry.sourceLifecycle,
      journeyStage: entry.funnelStage,
      clusterId: entry.clusterId,
      pillarPath: entry.pillarPath,
      clusterOwnerPath: entry.clusterOwnerPath,
      clusterRelation: entry.clusterRelation,
      canonicalState: entry.canonicalState,
      canonicalOwnerPath: entry.canonicalOwnerPath,
      intendedIndexation: entry.indexationPolicy,
      observedInBuiltSitemap: publicRoutes.has(entry.canonicalPath),
      artifactSha256: sha256(fs.readFileSync(builtFile)),
      funnel: entry.funnelId ? {
        id: entry.funnelId,
        name: entry.funnelName,
        aliases: entry.funnelCodes,
        intent: entry.intent,
        audience: entry.audience,
        action: entry.action,
        campaignRole: entry.campaignRole
      } : null
    };
  });

  for (const asset of assets) {
    const shouldBePublic = asset.intendedIndexation === 'index';
    if (asset.observedInBuiltSitemap !== shouldBePublic) {
      throw new Error(`${asset.canonicalPath}: built sitemap state does not match ${asset.intendedIndexation}`);
    }
  }

  const manifest = {
    schemaVersion: CONTENT_REGISTRY_SCHEMA_VERSION,
    registrySha256: registrySha,
    artifactState: 'built',
    buildRevision: String(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'local-unversioned'),
    sourceUrlCount: assets.length,
    publicIndexableCount: publicRoutes.size,
    managedFunnelCount: assets.filter((asset) => asset.funnel).length,
    assets
  };
  assertPublicManifestSafety(manifest);
  const destination = path.join(output, '.well-known', 'a7-growth-manifest.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  return { destination, manifest };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = buildGrowthManifest();
  console.log(`Growth artifact manifest created: ${result.destination}`);
}
