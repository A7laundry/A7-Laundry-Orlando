import crypto from 'node:crypto';
import embeddedLedgerJson from './generated/release-ledger.json' with { type: 'json' };

const validatedLedgers = new WeakSet();
const SHA256 = /^[a-f0-9]{64}$/;
const RECORD_KEYS = new Set(['schemaVersion', 'observationId', 'observedAt', 'observerVersion', 'eventType', 'target', 'subject', 'scope', 'result', 'routes', 'rollbackOfObservationId', 'authority', 'previousObservationId', 'previousRecordSha256']);
const TARGET_KEYS = new Set(['kind', 'origin', 'deploymentId', 'promotedFromObservationId']);
const SUBJECT_KEYS = new Set(['manifestSchemaVersion', 'manifestSha256', 'registrySha256', 'buildRevision']);
const SCOPE_KEYS = new Set(['mode', 'expectedAssets', 'verifiedAssets', 'expectedSitemapUrls', 'observedSitemapUrls']);
const RESULT_KEYS = new Set(['state', 'manifestState', 'sitemapState', 'routesDigestSha256', 'failures']);
const ROUTE_KEYS = new Set(['assetId', 'canonicalPath', 'expectedCanonicalPath', 'httpStatus', 'contentType', 'expectedSha256', 'observedSha256', 'expectedRobotsState', 'robotsState', 'canonicalObserved', 'routeState']);
const FAILURE_KEYS = new Set(['code', 'assetId']);
const AUTHORITY_KEYS = new Set(['actorRole', 'approvalRef']);
const SECRET_PATTERN = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|password)\s*[:=]|AIza[0-9A-Za-z_-]{20,}|sk_(?:live|test)_[0-9A-Za-z]{12,})/i;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function recordSha256(record) {
  return crypto.createHash('sha256').update(stableJson(record)).digest('hex');
}

function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.size && actual.every((key) => keys.has(key));
}

function validId(value) { return typeof value === 'string' && /^obs-[0-9TZ-]+-[a-f0-9]{12}$/.test(value); }
function validPath(value) { return typeof value === 'string' && /^\/(?!\/)[A-Za-z0-9._~!$&'()*+,;=:@%/-]*$/.test(value) && !value.includes('..'); }
function validDeployment(value) { return typeof value === 'string' && /^dpl_[A-Za-z0-9]{20,}$/.test(value); }
function validBuildRevision(value) { return typeof value === 'string' && /^(?:[a-f0-9]{7,64}|rev_[A-Za-z0-9._-]{8,120})$/.test(value); }

function rejectSecrets(value, location = 'ledger') {
  if (typeof value === 'string' && SECRET_PATTERN.test(value)) throw new Error(`${location} contains secret-shaped material`);
  if (Array.isArray(value)) value.forEach((item, index) => rejectSecrets(item, `${location}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => rejectSecrets(item, `${location}.${key}`));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function isVerifiedRecord(record) {
  return record.result.manifestState === 'verified'
    && record.result.sitemapState === 'verified'
    && record.result.failures.length === 0
    && record.scope.expectedAssets > 0
    && record.scope.expectedAssets === record.scope.verifiedAssets
    && record.scope.expectedSitemapUrls === record.scope.observedSitemapUrls
    && record.routes.length === record.scope.expectedAssets
    && record.routes.every((route) => route.routeState === 'route_verified'
      && route.httpStatus === 200
      && route.observedSha256 === route.expectedSha256
      && route.canonicalObserved === route.expectedCanonicalPath
      && route.robotsState === route.expectedRobotsState);
}

function validateRecord(record, previous, index) {
  if (!exactKeys(record, RECORD_KEYS)) throw new Error(`ledger record ${index} has unknown or missing shape`);
  if (record.schemaVersion !== '1.0' || !validId(record.observationId)) throw new Error(`ledger record ${index} identity invalid`);
  if (!Number.isFinite(Date.parse(record.observedAt)) || typeof record.observerVersion !== 'string') throw new Error(`ledger record ${index} timestamp/version invalid`);
  if (!['target_observation', 'rollback_observation'].includes(record.eventType)) throw new Error(`ledger record ${index} eventType invalid`);
  if (!exactKeys(record.target, TARGET_KEYS) || !['preview', 'production'].includes(record.target.kind) || !validDeployment(record.target.deploymentId)) throw new Error(`ledger record ${index} target invalid`);
  if (record.target.promotedFromObservationId !== null && !validId(record.target.promotedFromObservationId)) throw new Error(`ledger record ${index} promotion reference invalid`);
  if (record.target.kind === 'production' && record.target.origin !== 'https://a7laundry.com') throw new Error(`ledger record ${index} production origin invalid`);
  if (record.target.kind === 'preview' && !/^https:\/\/a7-laundry-orlando-[a-z0-9]+-dennis-a7s-projects\.vercel\.app$/.test(record.target.origin)) throw new Error(`ledger record ${index} preview origin invalid`);
  if (!exactKeys(record.subject, SUBJECT_KEYS) || record.subject.manifestSchemaVersion !== '2.0.0' || !SHA256.test(record.subject.manifestSha256) || !SHA256.test(record.subject.registrySha256) || !validBuildRevision(record.subject.buildRevision)) throw new Error(`ledger record ${index} subject invalid`);
  if (!exactKeys(record.scope, SCOPE_KEYS) || record.scope.mode !== 'full_registry') throw new Error(`ledger record ${index} scope invalid`);
  for (const field of ['expectedAssets', 'verifiedAssets', 'expectedSitemapUrls', 'observedSitemapUrls']) if (!Number.isSafeInteger(record.scope[field]) || record.scope[field] < 0) throw new Error(`ledger record ${index} scope count invalid`);
  if (!exactKeys(record.result, RESULT_KEYS) || !['preview_verified', 'active_production', 'preview_drift', 'production_drift', 'unavailable'].includes(record.result.state)) throw new Error(`ledger record ${index} result invalid`);
  if (!['verified', 'drift', 'unavailable'].includes(record.result.manifestState) || !['verified', 'drift', 'unavailable'].includes(record.result.sitemapState) || !SHA256.test(record.result.routesDigestSha256)) throw new Error(`ledger record ${index} result evidence invalid`);
  if (!Array.isArray(record.result.failures) || !record.result.failures.every((failure) => exactKeys(failure, FAILURE_KEYS) && typeof failure.code === 'string' && (failure.assetId === null || typeof failure.assetId === 'string'))) throw new Error(`ledger record ${index} failures invalid`);
  if (!Array.isArray(record.routes) || !record.routes.every((route) => exactKeys(route, ROUTE_KEYS)
    && /^asset_[a-z0-9_]+$/.test(route.assetId)
    && validPath(route.canonicalPath)
    && validPath(route.expectedCanonicalPath)
    && (route.httpStatus === null || Number.isSafeInteger(route.httpStatus))
    && (route.contentType === null || typeof route.contentType === 'string')
    && SHA256.test(route.expectedSha256)
    && (route.observedSha256 === null || SHA256.test(route.observedSha256))
    && (route.canonicalObserved === null || validPath(route.canonicalObserved))
    && ['indexable', 'noindex_follow'].includes(route.expectedRobotsState)
    && ['indexable', 'noindex_follow', 'unknown'].includes(route.robotsState)
    && ['route_verified', 'drift', 'unavailable'].includes(route.routeState))) throw new Error(`ledger record ${index} routes invalid`);
  const routeIds = new Set(record.routes.map((route) => route.assetId));
  const routePaths = new Set(record.routes.map((route) => route.canonicalPath));
  if (routeIds.size !== record.routes.length || routePaths.size !== record.routes.length) throw new Error(`ledger record ${index} routes are not unique`);
  const routesDigest = crypto.createHash('sha256').update(stableJson(record.routes.slice().sort((a, b) => a.assetId.localeCompare(b.assetId)))).digest('hex');
  if (routesDigest !== record.result.routesDigestSha256) throw new Error(`ledger record ${index} routes digest mismatch`);
  if (record.scope.expectedAssets !== record.routes.length || record.scope.verifiedAssets !== record.routes.filter((route) => route.routeState === 'route_verified').length) throw new Error(`ledger record ${index} route counts mismatch`);
  if (!exactKeys(record.authority, AUTHORITY_KEYS) || !['observer', 'qa', 'devops'].includes(record.authority.actorRole) || (record.authority.approvalRef !== null && typeof record.authority.approvalRef !== 'string')) throw new Error(`ledger record ${index} authority invalid`);
  if (record.rollbackOfObservationId !== null && !validId(record.rollbackOfObservationId)) throw new Error(`ledger record ${index} rollback reference invalid`);
  if (previous) {
    if (record.previousObservationId !== previous.observationId || record.previousRecordSha256 !== recordSha256(previous)) throw new Error(`ledger record ${index} chain mismatch`);
    if (Date.parse(record.observedAt) < Date.parse(previous.observedAt)) throw new Error(`ledger record ${index} timestamp is not monotonic`);
  } else if (record.previousObservationId !== null || record.previousRecordSha256 !== null) throw new Error('ledger genesis must not reference a previous record');
}

export function validateReleaseLedger(input) {
  if (!exactKeys(input, new Set(['schemaVersion', 'records', 'ledgerTipObservationId', 'ledgerTipSha256']))) throw new Error('release ledger shape invalid');
  if (input.schemaVersion !== '1.0' || !Array.isArray(input.records)) throw new Error('release ledger schema invalid');
  rejectSecrets(input);
  const ids = new Set();
  input.records.forEach((record, index) => {
    validateRecord(record, input.records[index - 1] || null, index);
    if (ids.has(record.observationId)) throw new Error(`duplicate observationId ${record.observationId}`);
    ids.add(record.observationId);
  });
  const byId = new Map(input.records.map((record) => [record.observationId, record]));
  for (const [recordIndex, record] of input.records.entries()) {
    if (record.result.state === 'preview_verified') {
      if (record.target.kind !== 'preview' || !isVerifiedRecord(record)) throw new Error('preview_verified requires exact verified preview evidence');
      if (record.authority.actorRole !== 'qa' || !record.authority.approvalRef) throw new Error('preview_verified requires QA approval evidence');
    }
    if (record.result.state === 'active_production') {
      if (record.target.kind !== 'production' || !record.target.promotedFromObservationId || !isVerifiedRecord(record)) throw new Error('active_production requires exact promoted production evidence');
      if (record.authority.actorRole !== 'devops' || !record.authority.approvalRef) throw new Error('active_production requires DevOps release approval evidence');
      const preview = byId.get(record.target.promotedFromObservationId);
      if (!preview || preview.result.state !== 'preview_verified' || preview.target.kind !== 'preview') throw new Error('active_production requires a validated preview observation');
      for (const field of ['manifestSha256', 'registrySha256', 'buildRevision']) {
        if (record.subject[field] !== preview.subject[field]) throw new Error(`active_production ${field} differs from preview`);
      }
      if (record.result.routesDigestSha256 !== preview.result.routesDigestSha256) throw new Error('active_production routes differ from preview');
    }
    if (record.eventType === 'rollback_observation') {
      if (!record.rollbackOfObservationId || record.result.state !== 'active_production' || record.target.kind !== 'production') throw new Error('rollback observation requires an exact active production restoration');
      const replaced = byId.get(record.rollbackOfObservationId);
      const restoredPreview = byId.get(record.target.promotedFromObservationId);
      if (!replaced || replaced.result.state !== 'active_production') throw new Error('rollback target must be an active production observation');
      if (!restoredPreview || restoredPreview.result.state !== 'preview_verified') throw new Error('rollback requires an approved preview of the restored artifact');
      if (record.target.deploymentId === replaced.target.deploymentId || record.subject.manifestSha256 === replaced.subject.manifestSha256) throw new Error('rollback must restore a different approved artifact');
      const previouslyActive = input.records.slice(0, recordIndex).some((candidate) => candidate.result.state === 'active_production'
        && candidate.subject.manifestSha256 === record.subject.manifestSha256
        && candidate.subject.registrySha256 === record.subject.registrySha256
        && candidate.subject.buildRevision === record.subject.buildRevision);
      if (!previouslyActive) throw new Error('rollback must restore an artifact that was previously active in production');
    } else if (record.rollbackOfObservationId !== null) throw new Error('target observation cannot declare rollbackOfObservationId');
    if (record.rollbackOfObservationId && !byId.has(record.rollbackOfObservationId)) throw new Error('rollback target does not exist');
    if (['preview_drift', 'production_drift', 'unavailable'].includes(record.result.state) && isVerifiedRecord(record)) throw new Error(`${record.result.state} cannot contain exact verified evidence`);
  }
  const tip = input.records.at(-1) || null;
  if ((tip?.observationId || null) !== input.ledgerTipObservationId || (tip ? recordSha256(tip) : null) !== input.ledgerTipSha256) throw new Error('release ledger tip mismatch');
  const frozen = deepFreeze(structuredClone(input));
  validatedLedgers.add(frozen);
  return frozen;
}

export function isValidatedReleaseLedger(value) { return validatedLedgers.has(value); }

export function latestReleaseObservation(ledger, { registrySha256, targetOrigin }) {
  if (!isValidatedReleaseLedger(ledger)) return null;
  const tip = ledger.records.at(-1) || null;
  if ((tip?.observationId || null) !== ledger.ledgerTipObservationId || (tip ? recordSha256(tip) : null) !== ledger.ledgerTipSha256) return null;
  return ledger.records.slice().reverse().find((record) => record.subject.registrySha256 === registrySha256 && record.target.origin === targetOrigin) || null;
}

export function deriveReleaseHistory(ledger) {
  if (!isValidatedReleaseLedger(ledger)) return [];
  const rolledBack = new Set(ledger.records.map((record) => record.rollbackOfObservationId).filter(Boolean));
  return ledger.records.map((record) => Object.freeze({
    ...record,
    derivedState: rolledBack.has(record.observationId) ? 'rolled_back' : record.result.state
  }));
}

export function loadEmbeddedReleaseLedger() {
  return validateReleaseLedger(structuredClone(embeddedLedgerJson));
}
