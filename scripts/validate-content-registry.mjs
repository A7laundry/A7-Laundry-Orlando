import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONTENT_REGISTRY,
  CONTENT_REGISTRY_SCHEMA_VERSION,
  CONTENT_CLUSTERS,
  SYSTEM_ROUTE_EXCLUSIONS,
  MANAGED_FUNNEL_PATHS
} from '../marketing/growth/content-registry.mjs';
import { buildContentCorpora, canonicalFromHtml, sitemapRoutes } from './lib/content-corpora.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowedStages = new Set(['tofu', 'mofu', 'bofu', 'non_funnel']);
const allowedIndexation = new Set(['index', 'noindex_review', 'adjudication_required']);
const allowedSourceLifecycle = new Set(['source_only', 'source_candidate', 'published_source', 'quarantined', 'retired']);
const allowedContentTypes = new Set(['foundation', 'hub', 'service-page', 'geo-page', 'article', 'legal']);
const allowedAssetRoles = new Set(['money_page', 'regional_page', 'landing_page', 'guide', 'article', 'pricing', 'foundation', 'hub', 'legal']);
const requiredFields = [
  'assetId',
  'canonicalPath',
  'sourceFile',
  'contentType',
  'sourceLifecycle',
  'indexationPolicy',
  'funnelStage',
  'clusterId',
  'pillarPath',
  'mosVisibility',
  'assetRole',
  'stageRationale',
  'geoScope',
  'nextAction',
  'journeyStage',
  'geography',
  'clusterOwnerPath',
  'clusterRelation',
  'intentOwnerPath',
  'canonicalState',
  'canonicalOwnerPath'
];

function clusterCycleIds(clusters) {
  const byId = new Map(clusters.map((cluster) => [cluster.id, cluster]));
  const cycles = new Set();
  for (const cluster of clusters) {
    const visited = new Set();
    let current = cluster;
    while (current?.parentClusterId) {
      if (visited.has(current.id)) { cycles.add(cluster.id); break; }
      visited.add(current.id);
      current = byId.get(current.parentClusterId);
    }
  }
  return [...cycles];
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  values.forEach((value) => seen.has(value) ? repeated.add(value) : seen.add(value));
  return [...repeated];
}

export function validateContentRegistry(options = {}) {
  const workspace = options.root || root;
  const registry = options.registry || CONTENT_REGISTRY;
  const errors = [];
  const warnings = [];
  const sourceSitemap = options.sourceSitemap || fs.readFileSync(path.join(workspace, 'sitemap.xml'), 'utf8');
  const sourceRoutes = sitemapRoutes(sourceSitemap);
  const quarantine = options.quarantine || JSON.parse(fs.readFileSync(path.join(workspace, 'indexation-quarantine.json'), 'utf8'));
  const registeredRoutes = registry.map((entry) => entry.canonicalPath);
  const registryByPath = new Map(registry.map((entry) => [entry.canonicalPath, entry]));
  const registryBySource = new Map(registry.map((entry) => [entry.sourceFile, entry]));
  const systemByFile = new Map(SYSTEM_ROUTE_EXCLUSIONS.map((entry) => [entry.sourceFile, entry]));
  const corpora = buildContentCorpora({ root: workspace, registry, exclusions: SYSTEM_ROUTE_EXCLUSIONS });
  const rewriteBySource = new Map(corpora.rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));
  const deployableHtml = corpora.html.map((item) => item.sourceFile);

  for (const route of duplicates(registeredRoutes)) errors.push(`duplicate registry canonicalPath: ${route}`);
  for (const route of duplicates(sourceRoutes)) errors.push(`duplicate source sitemap route: ${route}`);
  for (const route of sourceRoutes.filter((route) => !registryByPath.has(route))) errors.push(`sitemap route missing from registry: ${route}`);
  for (const route of registeredRoutes.filter((route) => !sourceRoutes.includes(route))) {
    if (registryByPath.get(route)?.indexationPolicy !== 'adjudication_required') errors.push(`registry route missing from source sitemap: ${route}`);
  }

  for (const sourceFile of deployableHtml) {
    const html = fs.readFileSync(path.join(workspace, sourceFile), 'utf8');
    const canonical = canonicalFromHtml(html);
    const registeredSource = registryBySource.get(sourceFile);
    const system = systemByFile.get(sourceFile);
    if (canonical && registryByPath.get(canonical)?.sourceFile === sourceFile) continue;
    if (registeredSource?.canonicalState === 'adjudication_required' && registeredSource.canonicalOwnerPath === canonical) continue;
    if (system && (!canonical || canonical === system.route)) continue;
    if (canonical && !registryByPath.has(canonical)) errors.push(`deployable HTML missing from registry: ${sourceFile} -> ${canonical}`);
    else if (canonical) errors.push(`deployable HTML source mismatch: ${sourceFile} -> ${canonical}`);
    else errors.push(`deployable HTML lacks registry or system exclusion: ${sourceFile}`);
  }

  for (const [route, destination] of rewriteBySource) {
    const registered = registryByPath.get(route);
    const system = SYSTEM_ROUTE_EXCLUSIONS.find((entry) => entry.route === route);
    if (!registered && !system) errors.push(`rewrite route missing from registry or system exclusions: ${route}`);
    if (registered && registered.sourceFile !== destination) errors.push(`rewrite destination mismatch for ${route}: ${destination} != ${registered.sourceFile}`);
    if (system && system.sourceFile !== destination) errors.push(`system rewrite destination mismatch for ${route}: ${destination} != ${system.sourceFile}`);
  }

  const knownPaths = new Set(registeredRoutes);
  const allCodes = [];
  const clusterById = new Map(CONTENT_CLUSTERS.map((cluster) => [cluster.id, cluster]));
  const assetIds = registry.map((entry) => entry.assetId);
  const funnelIds = registry.filter((entry) => entry.funnelId).map((entry) => entry.funnelId);
  for (const id of duplicates(assetIds)) errors.push(`duplicate stable assetId: ${id}`);
  for (const id of duplicates(funnelIds)) errors.push(`duplicate funnelId: ${id}`);
  for (const id of duplicates(CONTENT_CLUSTERS.map((cluster) => cluster.id))) errors.push(`duplicate cluster id: ${id}`);
  for (const id of clusterCycleIds(CONTENT_CLUSTERS)) errors.push(`cluster cycle detected: ${id}`);
  for (const cluster of CONTENT_CLUSTERS) {
    if (!knownPaths.has(cluster.ownerPath)) errors.push(`cluster ${cluster.id} owner missing: ${cluster.ownerPath}`);
    if (cluster.parentClusterId && !clusterById.has(cluster.parentClusterId)) errors.push(`cluster ${cluster.id} parent missing: ${cluster.parentClusterId}`);
  }
  for (const entry of registry) {
    for (const field of requiredFields) {
      if (!String(entry[field] || '').trim()) errors.push(`${entry.canonicalPath}: missing ${field}`);
    }
    if (!allowedStages.has(entry.funnelStage)) errors.push(`${entry.canonicalPath}: unsupported funnelStage ${entry.funnelStage}`);
    if (!allowedIndexation.has(entry.indexationPolicy)) errors.push(`${entry.canonicalPath}: unsupported indexationPolicy ${entry.indexationPolicy}`);
    if (!allowedSourceLifecycle.has(entry.sourceLifecycle)) errors.push(`${entry.canonicalPath}: unsupported sourceLifecycle ${entry.sourceLifecycle}`);
    if (!allowedContentTypes.has(entry.contentType)) errors.push(`${entry.canonicalPath}: unsupported contentType ${entry.contentType}`);
    if (!allowedAssetRoles.has(entry.assetRole)) errors.push(`${entry.canonicalPath}: unsupported assetRole ${entry.assetRole}`);
    if (!['tofu', 'mofu', 'bofu', 'retention', 'not_applicable'].includes(entry.journeyStage)) errors.push(`${entry.canonicalPath}: unsupported journeyStage ${entry.journeyStage}`);
    if (!clusterById.has(entry.clusterId)) errors.push(`${entry.canonicalPath}: unknown cluster ${entry.clusterId}`);
    if (entry.clusterOwnerPath !== clusterById.get(entry.clusterId)?.ownerPath) errors.push(`${entry.canonicalPath}: cluster owner mismatch`);
    if (!['owner', 'supporting'].includes(entry.clusterRelation)) errors.push(`${entry.canonicalPath}: unsupported clusterRelation ${entry.clusterRelation}`);
    if (!entry.geography || !['none', 'city', 'corridor', 'region', 'property'].includes(entry.geography.kind)) errors.push(`${entry.canonicalPath}: invalid geography`);
    if (!['self', 'provisional_owner', 'adjudication_required'].includes(entry.canonicalState)) errors.push(`${entry.canonicalPath}: unsupported canonicalState ${entry.canonicalState}`);
    if (!knownPaths.has(entry.canonicalOwnerPath)) errors.push(`${entry.canonicalPath}: canonical owner missing ${entry.canonicalOwnerPath}`);
    if (entry.canonicalState === 'self' && entry.canonicalOwnerPath !== entry.canonicalPath) errors.push(`${entry.canonicalPath}: self canonical state must own itself`);
    if (!knownPaths.has(entry.pillarPath)) errors.push(`${entry.canonicalPath}: missing pillar ${entry.pillarPath}`);
    const absoluteSource = path.join(workspace, entry.sourceFile);
    if (!fs.existsSync(absoluteSource)) {
      errors.push(`${entry.canonicalPath}: source file missing ${entry.sourceFile}`);
      continue;
    }
    const html = fs.readFileSync(absoluteSource, 'utf8');
    const canonical = canonicalFromHtml(html);
    if (!canonical) errors.push(`${entry.canonicalPath}: canonical link missing in ${entry.sourceFile}`);
    else if (canonical !== entry.canonicalPath) {
      if (entry.canonicalState === 'adjudication_required' && entry.canonicalOwnerPath === canonical) warnings.push(`${entry.canonicalPath}: governed canonical adjudication remains open against ${canonical}`);
      else errors.push(`${entry.canonicalPath}: canonical collision points to ${canonical}; explicit indexation adjudication is required`);
    }
    for (const code of entry.funnelCodes || []) allCodes.push({ code, route: entry.canonicalPath });
    if (entry.funnelId) {
      for (const field of ['funnelName', 'intent', 'audience', 'action', 'campaignRole']) {
        if (!String(entry[field] || '').trim()) errors.push(`${entry.canonicalPath}: managed funnel missing ${field}`);
      }
      if (!(entry.funnelCodes || []).length) errors.push(`${entry.canonicalPath}: managed funnel has no funnelCodes`);
    }
  }

  for (const cluster of CONTENT_CLUSTERS) {
    const owners = registry.filter((entry) => entry.clusterId === cluster.id && entry.clusterRole === 'intent_owner');
    if (owners.length !== 1) errors.push(`cluster ${cluster.id} requires exactly one intent owner; found ${owners.length}`);
    else if (owners[0].canonicalPath !== cluster.ownerPath) errors.push(`cluster ${cluster.id} owner path mismatch: ${owners[0].canonicalPath}`);
  }

  for (const code of duplicates(allCodes.map((item) => item.code))) {
    const routes = allCodes.filter((item) => item.code === code).map((item) => item.route);
    errors.push(`duplicate funnel code ${code}: ${routes.join(', ')}`);
  }

  const registryQuarantine = registry
    .filter((entry) => entry.indexationPolicy === 'noindex_review')
    .map((entry) => entry.canonicalPath)
    .sort();
  const configuredQuarantine = [...quarantine.routes].sort();
  for (const route of configuredQuarantine.filter((route) => !registryQuarantine.includes(route))) {
    errors.push(`quarantine route is not noindex_review in registry: ${route}`);
  }
  for (const route of registryQuarantine.filter((route) => !configuredQuarantine.includes(route))) {
    errors.push(`registry noindex_review route missing from quarantine: ${route}`);
  }

  for (const route of MANAGED_FUNNEL_PATHS) {
    if (!registryByPath.get(route)?.funnelId) errors.push(`managed funnel definition was not expanded: ${route}`);
  }

  for (const system of SYSTEM_ROUTE_EXCLUSIONS) {
    const absoluteSource = path.join(workspace, system.sourceFile);
    if (!fs.existsSync(absoluteSource)) { errors.push(`system exclusion source missing: ${system.sourceFile}`); continue; }
    const html = fs.readFileSync(absoluteSource, 'utf8');
    if (!/<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(`system exclusion must remain noindex: ${system.route}`);
    if (registryByPath.has(system.route)) errors.push(`system exclusion cannot also be a marketing asset: ${system.route}`);
  }

  const summary = {
    schemaVersion: CONTENT_REGISTRY_SCHEMA_VERSION,
    sourceUrls: sourceRoutes.length,
    deployableMarketingAssets: registry.length,
    deployableSystemExclusions: SYSTEM_ROUTE_EXCLUSIONS.length,
    registryEntries: registry.length,
    managedFunnels: registry.filter((entry) => entry.funnelId).length,
    tofu: registry.filter((entry) => entry.funnelStage === 'tofu').length,
    mofu: registry.filter((entry) => entry.funnelStage === 'mofu').length,
    bofu: registry.filter((entry) => entry.funnelStage === 'bofu').length,
    nonFunnel: registry.filter((entry) => entry.funnelStage === 'non_funnel').length,
    quarantined: registryQuarantine.length,
    adjudicationRequired: registry.filter((entry) => entry.indexationPolicy === 'adjudication_required' || entry.canonicalState === 'adjudication_required').length
  };
  return { ok: errors.length === 0, errors, warnings, summary };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateContentRegistry();
  result.warnings.forEach((warning) => console.warn(`CONTENT REGISTRY WARNING: ${warning}`));
  if (!result.ok) {
    result.errors.forEach((error) => console.error(`CONTENT REGISTRY ERROR: ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Content registry valid: ${JSON.stringify(result.summary)}`);
  }
}
