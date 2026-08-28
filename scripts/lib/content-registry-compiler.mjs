import fs from 'node:fs';
import path from 'node:path';
import {
  CLUSTER_REGISTRY,
  CONTENT_REGISTRY,
  CONTENT_REGISTRY_SCHEMA_VERSION,
  SYSTEM_ROUTE_EXCLUSIONS
} from '../../governance/content-registry.mjs';
import { validateContentRegistry } from '../validate-content-registry.mjs';

export const GENERATED_CATALOG_PATH = 'mos-app/generated/content-catalog.json';
export const GENERATED_TRACKING_MAP_PATH = 'mos-app/generated/a7-growth-map.js';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function compileContentCatalog({ root = process.cwd(), registry = CONTENT_REGISTRY } = {}) {
  const validation = validateContentRegistry({ root, registry });
  if (!validation.ok) throw new Error(`Content registry is invalid:\n${validation.errors.join('\n')}`);
  const catalog = {
    schemaVersion: CONTENT_REGISTRY_SCHEMA_VERSION,
    registryVersion: '2026-08-23.1',
    clusters: CLUSTER_REGISTRY.slice().sort((a, b) => a.clusterId.localeCompare(b.clusterId)),
    assets: registry.map((entry) => ({
      assetId: entry.assetId,
      canonicalPath: entry.canonicalPath,
      sourceFile: entry.sourceFile,
      assetRole: entry.assetRole,
      sourceLifecycle: entry.sourceLifecycle,
      journeyStage: entry.journeyStage,
      stageRationale: entry.stageRationale,
      clusterId: entry.clusterId,
      clusterRole: entry.clusterRole,
      parentAssetId: entry.parentAssetId,
      geography: entry.geography,
      intent: entry.intent,
      audience: entry.audience,
      nextAction: entry.nextAction,
      canonicalState: entry.canonicalState,
      canonicalOwnerPath: entry.canonicalOwnerPath,
      indexationPolicy: entry.indexationPolicy,
      mosVisibility: entry.mosVisibility,
      funnel: entry.funnel
    })).sort((a, b) => a.assetId.localeCompare(b.assetId)),
    exclusions: SYSTEM_ROUTE_EXCLUSIONS.slice().sort((a, b) => a.route.localeCompare(b.route))
  };
  return `${JSON.stringify(stable(catalog), null, 2)}\n`;
}

function trackingPersona(entry) {
  const text = `${entry.audience || ''} ${entry.intent || ''}`.toLowerCase();
  if (text.includes('hotel')) return 'hotel';
  if (text.includes('host')) return 'host';
  if (text.includes('vacation rental') || text.includes('airbnb')) return 'vacation-rental';
  if (text.includes('family')) return 'family';
  return 'general';
}

export function compileTrackingMap({ registry = CONTENT_REGISTRY } = {}) {
  const map = Object.fromEntries(registry.slice().sort((a, b) => a.canonicalPath.localeCompare(b.canonicalPath)).map((entry) => [entry.canonicalPath, {
    asset_id: entry.assetId,
    journey_stage_v2: entry.journeyStage,
    funnel_stage_legacy: entry.assetRole === 'regional_page' ? 'geo' : entry.journeyStage,
    cluster_id: entry.clusterId,
    content_role: entry.assetRole,
    persona: trackingPersona(entry),
    geo_key: entry.geography?.area ? entry.geography.area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'orlando'
  }]));
  return `/* Generated from governance/content-registry.mjs. Do not edit. */\nwindow.A7_GROWTH_MAP = Object.freeze(${JSON.stringify(stable(map), null, 2)});\n`;
}

export function writeContentCatalog({ root = process.cwd() } = {}) {
  const bytes = compileContentCatalog({ root });
  const destination = path.join(root, GENERATED_CATALOG_PATH);
  const trackingDestination = path.join(root, GENERATED_TRACKING_MAP_PATH);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  fs.writeFileSync(trackingDestination, compileTrackingMap());
  return { destination, trackingDestination, bytes };
}

export function checkGeneratedContentCatalog({ root = process.cwd() } = {}) {
  const expected = compileContentCatalog({ root });
  const destination = path.join(root, GENERATED_CATALOG_PATH);
  const actual = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : null;
  const trackingDestination = path.join(root, GENERATED_TRACKING_MAP_PATH);
  const trackingExpected = compileTrackingMap();
  const trackingActual = fs.existsSync(trackingDestination) ? fs.readFileSync(trackingDestination, 'utf8') : null;
  return { ok: actual === expected && trackingActual === trackingExpected, destination, trackingDestination, expected, actual };
}
