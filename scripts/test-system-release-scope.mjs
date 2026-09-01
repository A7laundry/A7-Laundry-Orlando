import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyW1cAReleaseScope } from './verify-orlando-os-release-scope.mjs';

function write(root, relative, value = '') {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive:true });
  fs.writeFileSync(target, value);
}

function fixture() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-release-scope-'));
  const baseline = path.join(parent, 'baseline');
  const candidate = path.join(parent, 'candidate');
  fs.mkdirSync(baseline);
  fs.mkdirSync(candidate);
  const vercel = '{"framework":null,"headers":[]}\n';
  write(baseline, 'vercel.json', vercel);
  write(candidate, 'vercel.json', vercel);
  for (const relative of [
    'api/system/w1c-a-smoke.js',
    'lib/system-w1c-a-smoke-service.js',
    'scripts/a7-system-w1c-a-smoke.mjs',
    'supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql',
    'supabase/migrations/20260830050001_orlando_os_w1c_a_release_probe_repair.sql'
  ]) write(candidate, relative, '// W1C-A only\n');
  write(candidate, 'lib/operational-store.js', 'runW1cASmokeProbe recordSystemItemWeight\n');
  write(candidate, 'lib/system-order-service.js', 'item weight_version\n');
  write(candidate, 'lib/system-operations-service.js', 'record_weight\n');
  write(candidate, 'sistema.js', 'record_weight\n');
  write(candidate, 'sistema-w1b.css', '.weight-form {}\n');
  write(candidate, 'package.json', '{"scripts":{"system:w1c-a:smoke":"node smoke"}}\n');
  return { parent, baseline, candidate };
}

test('W1C-A release verifier accepts only the bounded overlay on unchanged W1B routing', () => {
  const item = fixture();
  try {
    const result = verifyW1cAReleaseScope({ root:item.candidate, baselineRoot:item.baseline });
    assert.equal(result.passed, true);
    assert.deepEqual(result.failures, []);
  } finally {
    fs.rmSync(item.parent, { recursive:true, force:true });
  }
});

test('W1C-A release verifier rejects future-wave files, symbols and routing drift', () => {
  const item = fixture();
  try {
    write(item.candidate, 'api/system/order-invoices.js', '// forbidden future endpoint\n');
    write(item.candidate, 'sistema.js', 'record_weight review_invoice\n');
    write(item.candidate, 'vercel.json', '{"framework":"future"}\n');
    const result = verifyW1cAReleaseScope({ root:item.candidate, baselineRoot:item.baseline });
    assert.equal(result.passed, false);
    assert.ok(result.failures.includes('future_file_present:api/system/order-invoices.js'));
    assert.ok(result.failures.includes('future_symbol_present:sistema.js'));
    assert.ok(result.failures.includes('vercel_contract_changed'));
  } finally {
    fs.rmSync(item.parent, { recursive:true, force:true });
  }
});
