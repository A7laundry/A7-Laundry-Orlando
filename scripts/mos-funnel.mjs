#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_ROOT = path.join(PROJECT_ROOT, 'marketing/funnel-intelligence');
export const OUTPUT_PATH = path.join(PROJECT_ROOT, 'mos-app/generated/funnel-intelligence.json');
const DATA_FILES = ['sources', 'items', 'taxonomy', 'briefs', 'evidence', 'experiments'];
const FORBIDDEN_MUTATION_TOKENS = [
  'ads_management', 'campaign_create', 'campaign_update', 'adset_update',
  'ad_update', 'budget_update', 'status_update', 'graph.facebook.com'
];

function readJson(name, root = DATA_ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, `${name}.json`), 'utf8'));
}

export function loadFunnelData(root = DATA_ROOT) {
  return Object.fromEntries(DATA_FILES.map((name) => [name, readJson(name, root)]));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function assertCondition(condition, message, errors) {
  if (!condition) errors.push(message);
}

export function signatureFor(brief, requiredDimensions) {
  return requiredDimensions.map((key) => `${key}:${brief.taxonomy?.[key] ?? ''}`).join('|');
}

function overlapScore(left, right, keys) {
  return keys.filter((key) => left.taxonomy?.[key] === right.taxonomy?.[key]).length / keys.length;
}

export function semanticReport(data) {
  const { briefs, taxonomy } = data;
  const exact = [];
  const blocked = [];
  const review = [];
  const signatures = new Map();
  for (const brief of briefs.briefs) {
    const signature = signatureFor(brief, taxonomy.requiredDimensions);
    const scopedSignature = `${brief.itemId}|${signature}`;
    if (signatures.has(scopedSignature)) exact.push([signatures.get(scopedSignature), brief.id]);
    signatures.set(scopedSignature, brief.id);
  }
  for (let leftIndex = 0; leftIndex < briefs.briefs.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < briefs.briefs.length; rightIndex += 1) {
      const left = briefs.briefs[leftIndex];
      const right = briefs.briefs[rightIndex];
      if (left.itemId !== right.itemId) continue;
      const score = overlapScore(left, right, taxonomy.semanticOverlap.keyDimensions);
      const item = {left: left.id, right: right.id, score};
      if (score >= taxonomy.semanticOverlap.blockThreshold) blocked.push(item);
      else if (score >= taxonomy.semanticOverlap.reviewThreshold) review.push(item);
    }
  }
  return {exact, blocked, review};
}

export function validateFunnelData(data, options = {}) {
  const errors = [];
  const warnings = [];
  const {sources, items, taxonomy, briefs, evidence, experiments} = data;
  for (const name of DATA_FILES) assertCondition(data[name]?.schemaVersion, `${name}: schemaVersion is required`, errors);

  const itemIds = new Set();
  assertCondition(items.items.length <= items.capacity, `items: capacity ${items.capacity} exceeded`, errors);
  for (const item of items.items) {
    assertCondition(item.id && !itemIds.has(item.id), `items: duplicate or missing id ${item.id}`, errors);
    itemIds.add(item.id);
    assertCondition(item.origin?.type && item.origin?.source && item.origin?.status, `item ${item.id}: traceable origin is required`, errors);
    if (item.price?.value === null) {
      assertCondition(item.price.status === 'unavailable' && item.price.source === null, `item ${item.id}: unknown price must remain unavailable/null`, errors);
    }
    assertCondition(item.topSeller === null, `item ${item.id}: top-seller rank is not evidenced`, errors);
  }

  const sourceIds = new Set(sources.findings.map((finding) => finding.id));
  for (const finding of sources.findings) {
    for (const key of ['organization', 'title', 'url', 'accessedAt', 'evidenceType', 'claimSummary', 'limitation', 'freshness', 'a7Translation']) {
      assertCondition(finding[key], `source ${finding.id}: ${key} is required`, errors);
    }
    if (finding.publishedAt === null) {
      assertCondition(finding.freshness === 'potentially_outdated', `source ${finding.id}: undated source must be potentially_outdated`, errors);
    }
  }

  const briefIds = new Set();
  const externalMetaIds = new Set();
  for (const brief of briefs.briefs) {
    assertCondition(brief.id && !briefIds.has(brief.id), `briefs: duplicate or missing id ${brief.id}`, errors);
    briefIds.add(brief.id);
    assertCondition(itemIds.has(brief.itemId), `brief ${brief.id}: unknown item ${brief.itemId}`, errors);
    for (const key of taxonomy.requiredDimensions) {
      assertCondition(Boolean(brief.taxonomy?.[key]), `brief ${brief.id}: taxonomy.${key} is required`, errors);
      assertCondition(taxonomy.dimensions[key]?.includes(brief.taxonomy?.[key]), `brief ${brief.id}: invalid taxonomy.${key}`, errors);
    }
    for (const key of ['question', 'reason', 'audience', 'concept', 'learningCriterion', 'advanceEvidence', 'strategicDifference']) {
      assertCondition(Boolean(brief[key]), `brief ${brief.id}: ${key} is required`, errors);
    }
    assertCondition(brief.primaryMetric?.source, `brief ${brief.id}: metric provenance is required`, errors);
    if (brief.primaryMetric?.period === null) {
      assertCondition(['unavailable', 'partial'].includes(brief.primaryMetric.status), `brief ${brief.id}: null metric period must be unavailable or partial`, errors);
    }
    for (const sourceId of brief.sourceIds || []) {
      assertCondition(sourceIds.has(sourceId), `brief ${brief.id}: unknown source ${sourceId}`, errors);
    }
    if (brief.externalMetaAdId !== null) {
      assertCondition(!externalMetaIds.has(brief.externalMetaAdId), `brief ${brief.id}: duplicate externalMetaAdId ${brief.externalMetaAdId}`, errors);
      externalMetaIds.add(brief.externalMetaAdId);
    }
  }

  const pilot = briefs.briefs.filter((brief) => brief.itemId === 'guest-wash-fold');
  if (!options.allowSynthetic) assertCondition(pilot.length === 8, `pilot: expected 8 guest wash-and-fold briefs, got ${pilot.length}`, errors);
  assertCondition(briefs.briefs.length <= items.capacity * briefs.capacity.hypothesesPerItem, 'briefs: 10x8 capacity exceeded', errors);

  for (const wave of experiments.waves) {
    assertCondition(wave.members.length <= 3, `wave ${wave.id}: maximum is control + 2 challengers`, errors);
    assertCondition(wave.members.filter((member) => member.role === 'control').length === 1, `wave ${wave.id}: exactly one control is required`, errors);
    assertCondition(wave.members.filter((member) => member.role === 'challenger').length <= 2, `wave ${wave.id}: at most two challengers`, errors);
    for (const member of wave.members) assertCondition(briefIds.has(member.briefId), `wave ${wave.id}: unknown brief ${member.briefId}`, errors);
  }

  const evidenceById = new Map(evidence.evidence.map((entry) => [entry.id, entry]));
  for (const entry of evidence.evidence) {
    assertCondition(entry.id && entry.briefId && entry.type && entry.source && entry.period && entry.status, `evidence: provenance fields are required for ${entry.id || 'unknown'}`, errors);
    assertCondition(briefIds.has(entry.briefId), `evidence ${entry.id}: unknown brief`, errors);
  }
  for (const decision of experiments.decisions) {
    if (decision.type === 'PROMOTE') {
      const linked = (decision.evidenceIds || []).map((id) => evidenceById.get(id)).filter(Boolean);
      assertCondition(linked.some((entry) => entry.type === 'completed_order' && entry.reconciled === true), `decision ${decision.id}: PROMOTE requires reconciled completed_order`, errors);
      assertCondition(linked.some((entry) => entry.type === 'reconciled_contribution' && entry.reconciled === true), `decision ${decision.id}: PROMOTE requires reconciled contribution`, errors);
    }
  }
  for (const transition of experiments.history) {
    const allowed = experiments.transitionRules[transition.from] || [];
    assertCondition(allowed.includes(transition.to), `transition ${transition.id}: ${transition.from} -> ${transition.to} is invalid`, errors);
    const required = experiments.requiredEvidence[transition.to] || [];
    const linked = (transition.evidenceIds || []).map((id) => evidenceById.get(id)).filter(Boolean);
    for (const requiredType of required) {
      assertCondition(linked.some((entry) => entry.type === requiredType), `transition ${transition.id}: ${transition.to} requires ${requiredType}`, errors);
    }
    for (const key of ['timestamp', 'actor', 'justification']) assertCondition(transition[key], `transition ${transition.id}: ${key} is required`, errors);
  }

  const semantics = semanticReport(data);
  for (const pair of semantics.exact) errors.push(`semantic: exact duplicate ${pair[0]} / ${pair[1]}`);
  for (const pair of semantics.blocked) errors.push(`semantic: blocked overlap ${pair.left} / ${pair.right} (${pair.score.toFixed(2)})`);
  for (const pair of semantics.review) warnings.push(`semantic: review overlap ${pair.left} / ${pair.right} (${pair.score.toFixed(2)})`);

  const serialized = JSON.stringify(data).toLowerCase();
  for (const token of FORBIDDEN_MUTATION_TOKENS) {
    assertCondition(!serialized.includes(token), `boundary: forbidden media mutation token ${token}`, errors);
  }
  return {ok: errors.length === 0, errors, warnings, semantics};
}

export function applyTransition(data, transition) {
  const clone = structuredClone(data);
  clone.experiments.history.push(transition);
  const result = validateFunnelData(clone, {allowSynthetic: true});
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return clone;
}

function coverage(data) {
  const dimensions = ['persona', 'pain', 'awareness', 'angle'];
  return Object.fromEntries(dimensions.map((dimension) => {
    const counts = Object.fromEntries(data.taxonomy.dimensions[dimension].map((value) => [value, 0]));
    for (const brief of data.briefs.briefs) counts[brief.taxonomy[dimension]] += 1;
    return [dimension, counts];
  }));
}

export function inventory(data) {
  const selected = new Set(data.experiments.waves.flatMap((wave) => wave.members.map((member) => member.briefId)));
  const stages = Object.fromEntries(data.experiments.allowedStages.map((stage) => [stage, data.briefs.briefs.filter((brief) => brief.stage === stage).length]));
  return {
    capacity: data.items.capacity * data.briefs.capacity.hypothesesPerItem,
    itemCount: data.items.items.length,
    briefCount: data.briefs.briefs.length,
    selectedWaveCount: selected.size,
    backlogCount: data.briefs.briefs.length - selected.size,
    incompleteItemSlots: data.items.capacity - data.items.items.length,
    stages,
    coverage: coverage(data)
  };
}

export function compileFunnel(data) {
  const validation = validateFunnelData(data);
  if (!validation.ok) throw new Error(validation.errors.join('\n'));
  return {
    schemaVersion: '1.0',
    generatedFrom: DATA_FILES.map((name) => `marketing/funnel-intelligence/${name}.json`),
    readOnly: true,
    platformMutation: false,
    availability: {status: 'partial', reason: 'Sales, contribution and retention are unavailable until explicitly reconciled.'},
    research: data.sources,
    catalog: data.items,
    taxonomy: data.taxonomy,
    briefs: data.briefs.briefs.map((brief) => ({...brief, signature: signatureFor(brief, data.taxonomy.requiredDimensions)})),
    experiments: data.experiments,
    evidence: data.evidence,
    inventory: inventory(data),
    semanticWarnings: validation.warnings
  };
}

export function writeCompiled(data, outputPath = OUTPUT_PATH) {
  const compiled = compileFunnel(data);
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, stableJson(compiled));
  return compiled;
}

function printValidation(result) {
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  if (!result.ok) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
  } else console.log('Funnel intelligence valid.');
}

export async function runCli(argv = process.argv.slice(2)) {
  const command = argv[0];
  const data = loadFunnelData();
  if (command === 'validate') return printValidation(validateFunnelData(data));
  if (command === 'lint-semantic') {
    const result = validateFunnelData(data);
    printValidation(result);
    if (result.ok) console.log(stableJson(result.semantics).trim());
    return;
  }
  if (command === 'inventory') {
    const result = validateFunnelData(data);
    if (!result.ok) return printValidation(result);
    console.log(stableJson(inventory(data)).trim());
    return;
  }
  if (command === 'compile') {
    const compiled = writeCompiled(data);
    console.log(`Compiled ${compiled.briefs.length} briefs to ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}.`);
    return;
  }
  console.error('Usage: node scripts/mos-funnel.mjs <validate|inventory|lint-semantic|compile>');
  process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli();
