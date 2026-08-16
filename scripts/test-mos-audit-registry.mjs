import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {appendAudit, compileRegistry, loadAndValidateRegistry} from './lib/mos-audit-registry.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-mos-audits-'));
  fs.mkdirSync(path.join(root, 'evidence'), {recursive: true});
  fs.writeFileSync(path.join(root, 'evidence', 'first.txt'), 'first immutable evidence\n');
  fs.writeFileSync(path.join(root, 'evidence', 'second.txt'), 'second immutable evidence\n');
  return root;
}

function draft(auditDate, suffix, evidence) {
  return {
    auditId: `${auditDate}-${suffix}`,
    auditDate,
    title: `Audit ${suffix}`,
    type: 'test_audit',
    status: 'partial',
    scope: ['test'],
    summary: 'Test-only immutable record.',
    sources: [{name: 'Test evidence', status: 'partial', period: auditDate}],
    evidence: [{path: evidence}],
    metrics: []
  };
}

test('append-only registry refuses overwrite and preserves older bytes after a new audit', () => {
  const root = fixture();
  try {
    const first = appendAudit(root, draft('2026-01-01', 'first', 'evidence/first.txt'));
    const originalBytes = fs.readFileSync(first.file);
    assert.throws(() => appendAudit(root, draft('2026-01-01', 'first', 'evidence/first.txt')), /overwrite refused/);
    appendAudit(root, draft('2026-01-02', 'second', 'evidence/second.txt'));
    assert.deepEqual(fs.readFileSync(first.file), originalBytes);
    const backfill = appendAudit(root, draft('2025-12-31', 'late-backfill', 'evidence/first.txt'));
    assert.deepEqual(fs.readFileSync(first.file), originalBytes);
    const audits = loadAndValidateRegistry(root);
    assert.equal(audits.length, 3);
    assert.equal(audits[1].record.previousRecordSha256, audits[0].recordSha256);
    assert.equal(audits[2].record.previousRecordSha256, audits[1].recordSha256);
    assert.equal(audits[2].record.auditId, backfill.record.auditId);
    const compiled = compileRegistry(root, path.join(root, 'generated', 'audit-registry.js'));
    assert.equal(compiled.latestAuditId, '2026-01-02-second');
    assert.equal(compiled.ledgerTipAuditId, '2025-12-31-late-backfill');
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('validation detects changed evidence and compilation keeps every audit', () => {
  const root = fixture();
  try {
    appendAudit(root, draft('2026-01-01', 'first', 'evidence/first.txt'));
    appendAudit(root, draft('2026-01-02', 'second', 'evidence/second.txt'));
    const output = path.join(root, 'generated', 'audit-registry.js');
    const registry = compileRegistry(root, output);
    assert.equal(registry.auditCount, 2);
    assert.match(fs.readFileSync(output, 'utf8'), /2026-01-01-first/);
    assert.match(fs.readFileSync(output, 'utf8'), /2026-01-02-second/);
    fs.writeFileSync(path.join(root, 'evidence', 'first.txt'), 'tampered\n');
    assert.throws(() => loadAndValidateRegistry(root), /changed evidence/);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
