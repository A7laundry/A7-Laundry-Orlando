#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {appendAudit, compareAudits, compileRegistry, loadAndValidateRegistry, sha256File} from './lib/mos-audit-registry.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const generatedRegistry = path.join(projectRoot, 'mos-app', 'generated', 'audit-registry.js');
const [command = 'help', ...args] = process.argv.slice(2);

function immutableCopy(sourceRelative, targetRelative) {
  const source = path.join(projectRoot, sourceRelative);
  const target = path.join(projectRoot, targetRelative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  if (fs.existsSync(target)) {
    if (sha256File(source) !== sha256File(target)) throw new Error(`${targetRelative}: immutable snapshot differs from source`);
    return;
  }
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
}

async function migrate() {
  const catalog = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mos-data', 'migration-catalog.json'), 'utf8'));
  immutableCopy('mos-kpis.js', 'mos-data/snapshots/2026-07-27-mos-kpis.js');
  await import(path.join(projectRoot, 'mos-kpis.js'));
  const existing = fs.existsSync(path.join(projectRoot, 'mos-data', 'audits')) ? loadAndValidateRegistry(projectRoot) : [];
  const expectedPrefix = catalog.audits.slice(0, existing.length).map((audit) => audit.auditId);
  const actualPrefix = existing.map(({record}) => record.auditId);
  if (JSON.stringify(expectedPrefix) !== JSON.stringify(actualPrefix)) throw new Error('Migration refused: existing registry is not a prefix of the approved migration catalog');
  const existingIds = new Set(actualPrefix);
  for (const draft of catalog.audits) {
    if (existingIds.has(draft.auditId)) continue;
    const prepared = {...draft};
    if (prepared.metricsFromSnapshotScorecard) {
      prepared.metrics = globalThis.A7_MOS_KPIS.scorecard.map(({id, label, value, format, source, period, status}) => ({id, label, value, format, source, period, status}));
    }
    if (prepared.snapshotFrom) {
      prepared.snapshot = {path: prepared.snapshotPath, sha256: sha256File(path.join(projectRoot, prepared.snapshotPath))};
    }
    delete prepared.metricsFromSnapshotScorecard;
    delete prepared.snapshotFrom;
    delete prepared.snapshotPath;
    appendAudit(projectRoot, prepared);
  }
  const registry = compileRegistry(projectRoot, generatedRegistry);
  console.log(`Migrated ${registry.auditCount} immutable MOS audits; latest is ${registry.latestAuditId}.`);
}

function findAudit(id) {
  const entry = loadAndValidateRegistry(projectRoot).find(({record}) => record.auditId === id);
  if (!entry) throw new Error(`Unknown audit: ${id}`);
  return entry.record;
}

if (command === 'migrate') {
  await migrate();
} else if (command === 'validate') {
  const audits = loadAndValidateRegistry(projectRoot);
  console.log(`MOS audit registry valid: ${audits.length} immutable audits; hash chain ends at ${audits.at(-1).record.auditId}.`);
} else if (command === 'compile') {
  const registry = compileRegistry(projectRoot, generatedRegistry);
  console.log(`Compiled ${registry.auditCount} MOS audits for the protected dashboard.`);
} else if (command === 'list') {
  const audits = loadAndValidateRegistry(projectRoot).slice().sort((first, second) => first.record.auditDate.localeCompare(second.record.auditDate) || first.record.auditId.localeCompare(second.record.auditId));
  for (const {record, recordSha256} of audits) console.log(`${record.auditDate}\t${record.auditId}\t${record.status}\t${recordSha256}`);
} else if (command === 'show') {
  console.log(JSON.stringify(findAudit(args[0]), null, 2));
} else if (command === 'compare') {
  console.log(JSON.stringify(compareAudits(findAudit(args[0]), findAudit(args[1])), null, 2));
} else if (command === 'create') {
  const draftPath = args[0];
  if (!draftPath) throw new Error('Usage: mos-audits create <draft.json>');
  const draft = JSON.parse(fs.readFileSync(path.resolve(draftPath), 'utf8'));
  const created = appendAudit(projectRoot, draft);
  compileRegistry(projectRoot, generatedRegistry);
  console.log(`Appended immutable MOS audit ${created.record.auditId}.`);
} else {
  console.log('Usage: mos-audits <migrate|validate|compile|list|show AUDIT_ID|compare FROM_ID TO_ID|create DRAFT_JSON>');
}
