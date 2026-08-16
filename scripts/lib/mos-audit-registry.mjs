import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const AUDIT_ID_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;
const AUDIT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUS = new Set(['complete', 'partial']);
const ALLOWED_SOURCE_STATUS = new Set(['verified', 'partial', 'unavailable', 'owner_reported']);

export function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safeRepositoryPath(projectRoot, relativePath) {
  assert(typeof relativePath === 'string' && relativePath.length > 0, 'Evidence path is required');
  assert(!path.isAbsolute(relativePath), `Absolute path is forbidden: ${relativePath}`);
  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Path escapes repository: ${relativePath}`);
  return resolved;
}

function auditDirectory(projectRoot) {
  return path.join(projectRoot, 'mos-data', 'audits');
}

function auditFiles(projectRoot) {
  const directory = auditDirectory(projectRoot);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => path.join(directory, file));
}

function validateMetric(metric, auditId) {
  assert(metric && typeof metric === 'object', `${auditId}: invalid metric`);
  for (const key of ['id', 'label', 'format', 'source', 'period', 'status']) {
    assert(typeof metric[key] === 'string' && metric[key].length > 0, `${auditId}: metric ${metric.id || 'unknown'} missing ${key}`);
  }
  assert(metric.value === null || typeof metric.value === 'number', `${auditId}: metric ${metric.id} value must be number or null`);
}

function validateRecordShape(record) {
  assert(record && typeof record === 'object', 'Audit record must be an object');
  assert(record.schemaVersion === '1.0', `${record.auditId || 'unknown'}: unsupported schemaVersion`);
  assert(AUDIT_ID_PATTERN.test(record.auditId || ''), `${record.auditId || 'unknown'}: invalid auditId`);
  assert(AUDIT_DATE_PATTERN.test(record.auditDate || ''), `${record.auditId}: invalid auditDate`);
  assert(record.auditId.startsWith(record.auditDate), `${record.auditId}: auditId must start with auditDate`);
  assert(typeof record.title === 'string' && record.title.length > 0, `${record.auditId}: title is required`);
  assert(typeof record.type === 'string' && record.type.length > 0, `${record.auditId}: type is required`);
  assert(ALLOWED_STATUS.has(record.status), `${record.auditId}: invalid status`);
  assert(Array.isArray(record.scope) && record.scope.length > 0, `${record.auditId}: scope is required`);
  assert(typeof record.summary === 'string' && record.summary.length > 0, `${record.auditId}: summary is required`);
  assert(Array.isArray(record.sources) && record.sources.length > 0, `${record.auditId}: sources are required`);
  for (const source of record.sources) {
    assert(typeof source.name === 'string' && source.name.length > 0, `${record.auditId}: source name is required`);
    assert(ALLOWED_SOURCE_STATUS.has(source.status), `${record.auditId}: invalid source status`);
    assert(typeof source.period === 'string' && source.period.length > 0, `${record.auditId}: source period is required`);
  }
  assert(Array.isArray(record.evidence), `${record.auditId}: evidence array is required`);
  assert(record.evidence.length > 0 || record.snapshot, `${record.auditId}: evidence or an immutable snapshot is required`);
  assert(Array.isArray(record.metrics), `${record.auditId}: metrics array is required`);
  record.metrics.forEach((metric) => validateMetric(metric, record.auditId));
  assert(record.status !== 'partial' || record.metrics.length === 0 || record.metrics.every((metric) => metric.status !== 'live'), `${record.auditId}: partial historical audit cannot contain live metrics`);
}

function verifyArtifact(projectRoot, artifact, auditId, label) {
  assert(artifact && typeof artifact.path === 'string', `${auditId}: ${label} path is required`);
  assert(/^[a-f0-9]{64}$/.test(artifact.sha256 || ''), `${auditId}: ${label} checksum is invalid`);
  const absolute = safeRepositoryPath(projectRoot, artifact.path);
  assert(fs.existsSync(absolute) && fs.statSync(absolute).isFile(), `${auditId}: missing ${label} ${artifact.path}`);
  assert(sha256File(absolute) === artifact.sha256, `${auditId}: changed ${label} ${artifact.path}`);
}

export function loadAndValidateRegistry(projectRoot) {
  const files = auditFiles(projectRoot);
  assert(files.length > 0, 'MOS audit registry is empty');
  const entries = files.map((file) => {
    const bytes = fs.readFileSync(file);
    const record = JSON.parse(bytes.toString('utf8'));
    validateRecordShape(record);
    assert(path.basename(file) === `${record.auditId}.json`, `${record.auditId}: filename mismatch`);
    record.evidence.forEach((item) => verifyArtifact(projectRoot, item, record.auditId, 'evidence'));
    if (record.snapshot) verifyArtifact(projectRoot, record.snapshot, record.auditId, 'snapshot');
    return {record, recordSha256: sha256Bytes(bytes), file};
  });
  const byId = new Map();
  for (const entry of entries) {
    assert(!byId.has(entry.record.auditId), `${entry.record.auditId}: duplicate auditId`);
    byId.set(entry.record.auditId, entry);
  }
  const genesis = entries.filter(({record}) => record.previousAuditId === null);
  assert(genesis.length === 1, `Registry must contain exactly one genesis audit; found ${genesis.length}`);
  assert(genesis[0].record.previousRecordSha256 === null, `${genesis[0].record.auditId}: genesis checksum pointer must be null`);
  const children = new Map();
  for (const entry of entries) {
    if (entry.record.previousAuditId === null) continue;
    const previous = byId.get(entry.record.previousAuditId);
    assert(previous, `${entry.record.auditId}: previous audit is missing`);
    assert(entry.record.previousRecordSha256 === previous.recordSha256, `${entry.record.auditId}: broken hash chain`);
    const linked = children.get(entry.record.previousAuditId) || [];
    linked.push(entry);
    children.set(entry.record.previousAuditId, linked);
  }
  const audits = [];
  let current = genesis[0];
  while (current) {
    assert(!audits.some((entry) => entry.record.auditId === current.record.auditId), `${current.record.auditId}: cycle in hash chain`);
    audits.push(current);
    const linked = children.get(current.record.auditId) || [];
    assert(linked.length <= 1, `${current.record.auditId}: hash chain forks into ${linked.length} records`);
    current = linked[0] || null;
  }
  assert(audits.length === entries.length, `Hash chain covers ${audits.length} of ${entries.length} audits`);
  return audits;
}

function normalizedEvidence(projectRoot, draft) {
  const direct = Array.isArray(draft.evidence) ? draft.evidence : [];
  const directoryItems = (draft.evidenceDirectories || []).flatMap((directory) => {
    const absolute = safeRepositoryPath(projectRoot, directory);
    assert(fs.existsSync(absolute) && fs.statSync(absolute).isDirectory(), `${draft.auditId}: missing evidence directory ${directory}`);
    return fs.readdirSync(absolute)
      .filter((file) => fs.statSync(path.join(absolute, file)).isFile())
      .sort()
      .map((file) => ({path: path.posix.join(directory.replaceAll(path.sep, '/'), file)}));
  });
  const items = [...direct, ...directoryItems];
  const unique = new Map(items.map((item) => [item.path, item]));
  assert(unique.size === items.length, `${draft.auditId}: duplicate evidence path`);
  return [...unique.values()].sort((a, b) => a.path.localeCompare(b.path)).map((item) => {
    const absolute = safeRepositoryPath(projectRoot, item.path);
    assert(fs.existsSync(absolute) && fs.statSync(absolute).isFile(), `${draft.auditId}: missing evidence ${item.path}`);
    return {path: item.path, sha256: sha256File(absolute)};
  });
}

export function appendAudit(projectRoot, draft) {
  const existingFiles = auditFiles(projectRoot);
  const existing = existingFiles.length ? loadAndValidateRegistry(projectRoot) : [];
  assert(!existing.some((entry) => entry.record.auditId === draft.auditId), `${draft.auditId}: audit already exists; overwrite refused`);
  const previous = existing.at(-1) || null;

  const record = {
    schemaVersion: '1.0',
    auditId: draft.auditId,
    auditDate: draft.auditDate,
    title: draft.title,
    type: draft.type,
    status: draft.status,
    scope: draft.scope,
    summary: draft.summary,
    sources: draft.sources,
    metrics: Array.isArray(draft.metrics) ? draft.metrics : [],
    evidence: normalizedEvidence(projectRoot, draft),
    snapshot: draft.snapshot || null,
    previousAuditId: previous ? previous.record.auditId : null,
    previousRecordSha256: previous ? previous.recordSha256 : null
  };
  validateRecordShape(record);
  if (record.snapshot) verifyArtifact(projectRoot, record.snapshot, record.auditId, 'snapshot');
  const directory = auditDirectory(projectRoot);
  fs.mkdirSync(directory, {recursive: true});
  const target = path.join(directory, `${record.auditId}.json`);
  fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
  return {record, recordSha256: sha256File(target), file: target};
}

export function compileRegistry(projectRoot, outputFile) {
  const ledger = loadAndValidateRegistry(projectRoot);
  const audits = ledger.slice().sort((first, second) => first.record.auditDate.localeCompare(second.record.auditDate) || first.record.auditId.localeCompare(second.record.auditId));
  const registry = {
    schemaVersion: '1.0',
    storageMode: 'append_only_repository',
    latestAuditId: audits.at(-1).record.auditId,
    ledgerTipAuditId: ledger.at(-1).record.auditId,
    auditCount: audits.length,
    audits: audits.map(({record, recordSha256}) => ({...record, recordSha256}))
  };
  const source = `globalThis.A7_MOS_AUDIT_REGISTRY = Object.freeze(${JSON.stringify(registry, null, 2)});\n`;
  fs.mkdirSync(path.dirname(outputFile), {recursive: true});
  fs.writeFileSync(outputFile, source);
  return registry;
}

export function compareAudits(first, second) {
  const firstMetrics = new Map(first.metrics.map((metric) => [metric.id, metric]));
  const secondMetrics = new Map(second.metrics.map((metric) => [metric.id, metric]));
  const metricIds = [...new Set([...firstMetrics.keys(), ...secondMetrics.keys()])].sort();
  return {
    from: first.auditId,
    to: second.auditId,
    evidenceDelta: second.evidence.length - first.evidence.length,
    metrics: metricIds.map((id) => {
      const before = firstMetrics.get(id) || null;
      const after = secondMetrics.get(id) || null;
      const comparable = Boolean(before && after && before.source === after.source && before.period === after.period && typeof before.value === 'number' && typeof after.value === 'number');
      return {id, before, after, comparable, delta: comparable ? after.value - before.value : null};
    })
  };
}
