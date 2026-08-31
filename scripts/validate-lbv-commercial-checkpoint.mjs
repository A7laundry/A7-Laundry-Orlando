import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKPOINTS = new Set(['24h', '72h', '7d', '14d', '28d']);
const SOURCE_STATES = new Set(['live', 'partial', 'no_data', 'unavailable', 'insufficient_lag', 'not_inspected', 'not_reconciled']);
const SAMPLE_STATES = new Set(['sufficient', 'insufficient', 'unavailable']);
const DECISIONS = new Set(['continue', 'investigate', 'rollback']);
const DECISION_BASES = new Set(['continue_monitoring', 'technical_failure', 'operational_failure', 'commercial_decline']);
const ATTRIBUTION_STATES = new Set(['reconciled', 'partial', 'unavailable']);
const HANDOFF_STATES = new Set(['met', 'missed', 'mixed', 'unavailable']);

const ROOT_KEYS = [
  'schemaVersion', 'checkpoint', 'windowStart', 'windowEnd', 'technicalEvidence',
  'sourceStatus', 'metrics', 'deadlineHandoffStatus', 'attributionStatus',
  'sourceBreakdown', 'sampleStatus', 'sampleRationale', 'decision',
  'decisionBasis', 'decisionRationale', 'ownerRole', 'evidenceRefs'
];
const SOURCE_KEYS = ['ga4', 'gsc', 'whatsappOperations', 'orders', 'finance'];
const METRIC_KEYS = ['landingSessions', 'whatsappOpens', 'qualifiedLeads', 'paidOrders', 'revenueUsd', 'contributionMarginUsd'];
const BREAKDOWN_KEYS = ['organicSearch', 'googleAds', 'direct', 'referral', 'unattributed'];

function exactKeys(value, expected, label) {
  assert.equal(value && typeof value, 'object', `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} has missing or unexpected fields`);
}

function optionalNonNegative(value, label) {
  assert.ok(value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0), `${label} must be null or non-negative`);
}

function isoTimestamp(value, label) {
  assert.equal(typeof value, 'string', `${label} must be an ISO timestamp`);
  const parsed = Date.parse(value);
  assert.ok(Number.isFinite(parsed), `${label} must be an ISO timestamp`);
  return parsed;
}

function assertNoPii(value) {
  const serialized = JSON.stringify(value);
  const forbiddenKeys = /"(?:customer|guest|name|email|phone|telephone|room|address|message|gclid|gbraid|wbraid|clickId|orderId)"\s*:/i;
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phone = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
  assert.equal(forbiddenKeys.test(serialized), false, 'checkpoint contains a forbidden PII field');
  assert.equal(email.test(serialized), false, 'checkpoint contains an email-like value');
  assert.equal(phone.test(serialized), false, 'checkpoint contains a phone-like value');
}

export function validateCommercialCheckpoint(record) {
  exactKeys(record, ROOT_KEYS, 'checkpoint');
  assertNoPii(record);
  assert.equal(record.schemaVersion, 1, 'unsupported schemaVersion');
  assert.ok(CHECKPOINTS.has(record.checkpoint), 'invalid checkpoint');
  const start = isoTimestamp(record.windowStart, 'windowStart');
  const end = isoTimestamp(record.windowEnd, 'windowEnd');
  assert.ok(end > start, 'windowEnd must be after windowStart');
  assert.match(record.technicalEvidence, /^marketing\/google-ads\/2026-07-guest-laundry-search\/monitoring\/lbv-[a-z0-9-]+\.json$/, 'technicalEvidence must reference an LBV monitoring JSON');

  exactKeys(record.sourceStatus, SOURCE_KEYS, 'sourceStatus');
  Object.entries(record.sourceStatus).forEach(([key, value]) => assert.ok(SOURCE_STATES.has(value), `invalid sourceStatus.${key}`));
  exactKeys(record.metrics, METRIC_KEYS, 'metrics');
  Object.entries(record.metrics).forEach(([key, value]) => optionalNonNegative(value, `metrics.${key}`));
  exactKeys(record.sourceBreakdown, BREAKDOWN_KEYS, 'sourceBreakdown');
  Object.entries(record.sourceBreakdown).forEach(([key, value]) => optionalNonNegative(value, `sourceBreakdown.${key}`));

  assert.ok(HANDOFF_STATES.has(record.deadlineHandoffStatus), 'invalid deadlineHandoffStatus');
  assert.ok(ATTRIBUTION_STATES.has(record.attributionStatus), 'invalid attributionStatus');
  assert.ok(SAMPLE_STATES.has(record.sampleStatus), 'invalid sampleStatus');
  assert.ok(DECISIONS.has(record.decision), 'invalid decision');
  assert.ok(DECISION_BASES.has(record.decisionBasis), 'invalid decisionBasis');
  assert.match(record.ownerRole, /^(owner|operations|finance|marketing|joint review)$/i, 'ownerRole must be a role, not a person');
  assert.ok(typeof record.sampleRationale === 'string' && record.sampleRationale.length >= 10, 'sampleRationale is required');
  assert.ok(typeof record.decisionRationale === 'string' && record.decisionRationale.length >= 10, 'decisionRationale is required');
  assert.ok(Array.isArray(record.evidenceRefs), 'evidenceRefs must be an array');
  record.evidenceRefs.forEach((reference) => assert.match(reference, /^(marketing|docs)\/[A-Za-z0-9_./-]+$/, 'evidenceRefs must be repository-relative paths'));

  const { metrics, sourceStatus, sourceBreakdown } = record;
  if (!['live', 'partial', 'no_data'].includes(sourceStatus.ga4)) {
    assert.equal(metrics.landingSessions, null, 'landingSessions requires GA4 live/partial/no_data evidence');
    assert.equal(metrics.whatsappOpens, null, 'whatsappOpens requires GA4 live/partial/no_data evidence');
  }
  if (!['live', 'partial', 'no_data'].includes(sourceStatus.whatsappOperations)) {
    assert.equal(metrics.qualifiedLeads, null, 'qualifiedLeads requires an inspected operational source');
    assert.equal(record.deadlineHandoffStatus, 'unavailable', 'handoff status requires an inspected operational source');
  }
  if (!['live', 'partial', 'no_data'].includes(sourceStatus.orders)) {
    assert.equal(metrics.paidOrders, null, 'paidOrders requires reconciled order evidence');
    assert.equal(metrics.revenueUsd, null, 'revenueUsd requires reconciled order evidence');
  }
  if (!['live', 'partial', 'no_data'].includes(sourceStatus.finance)) {
    assert.equal(metrics.contributionMarginUsd, null, 'contributionMarginUsd requires finance evidence');
  }
  if (metrics.revenueUsd !== null) {
    assert.notEqual(metrics.paidOrders, null, 'revenueUsd requires paidOrders');
    if (metrics.revenueUsd > 0) assert.ok(metrics.paidOrders >= 1, 'positive revenue requires at least one paid order');
  }
  if (metrics.contributionMarginUsd !== null) assert.notEqual(metrics.revenueUsd, null, 'margin requires reconciled revenue');
  if (record.attributionStatus === 'unavailable') {
    Object.values(sourceBreakdown).forEach((value) => assert.equal(value, null, 'sourceBreakdown requires attribution evidence'));
  }
  if (record.decision === 'rollback' && record.decisionBasis === 'commercial_decline') {
    assert.equal(record.sampleStatus, 'sufficient', 'commercial rollback requires sufficient sample');
    assert.notEqual(metrics.qualifiedLeads, null, 'commercial rollback requires qualified leads');
    assert.notEqual(metrics.paidOrders, null, 'commercial rollback requires paid orders');
  }
  if (record.decision === 'rollback') assert.notEqual(record.decisionBasis, 'continue_monitoring', 'rollback requires a failure basis');

  return record;
}

export function runCli(argv = process.argv.slice(2)) {
  assert.equal(argv.length, 1, 'Usage: node scripts/validate-lbv-commercial-checkpoint.mjs <checkpoint.json>');
  const input = path.resolve(argv[0]);
  const record = JSON.parse(readFileSync(input, 'utf8'));
  validateCommercialCheckpoint(record);
  console.log(`LBV commercial checkpoint valid: ${record.checkpoint} · ${record.sampleStatus} · ${record.decision}`);
  return record;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
