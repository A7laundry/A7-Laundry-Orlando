#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W1C_A_REQUIRED = [
  'api/system/w1c-a-smoke.js',
  'lib/system-w1c-a-smoke-service.js',
  'scripts/a7-system-w1c-a-smoke.mjs',
  'supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql',
  'supabase/migrations/20260830050001_orlando_os_w1c_a_release_probe_repair.sql'
];

const W1C_A_FORBIDDEN_FILES = [
  'api/system/invoice-draft.js',
  'api/system/order-invoices.js',
  'api/system/message-draft.js',
  'api/system/order-messages.js',
  'lib/system-invoice-service.js',
  'lib/system-message-service.js',
  'supabase/migrations/20260830060000_orlando_os_w2_a_whatsapp_drafts.sql',
  'supabase/migrations/20260830070000_orlando_os_w3_a_known_customer_order.sql',
  'supabase/migrations/20260830080000_orlando_os_w1c_b1_reviewed_invoice.sql'
];

const W1C_A_FORBIDDEN_PATTERNS = new Map([
  ['lib/operational-store.js', /resolveSystemInvoiceActionRetry|reviewSystemInvoice|voidSystemInvoice|createSystemMessageDraft|actOnSystemMessageDraft|createKnownCustomerOrder|resolveKnownCustomerOrderRetry/],
  ['lib/system-order-service.js', /known[_ -]?customer|customer_ref/i],
  ['lib/system-operations-service.js', /review_invoice|void_invoice|message_draft/i],
  ['sistema.js', /review_invoice|void_invoice|message_draft|customer_ref/i],
  ['sistema-w1b.css', /\.invoice-|\.message-/],
  ['package.json', /system:invoices|system:messages|test-system-w1c-b1|test-system-w2-a|test-system-w3-a/]
]);

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function relativeExists(root, relative) {
  return fs.existsSync(path.join(root, relative));
}

function patternCount(value, pattern) {
  return [...String(value).matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`))].length;
}

export function verifyW1cAReleaseScope({ root, baselineRoot }) {
  const candidate = path.resolve(root);
  const baseline = path.resolve(baselineRoot);
  const failures = [];

  if (!fs.statSync(candidate, { throwIfNoEntry:false })?.isDirectory()) failures.push('candidate_root_missing');
  if (!fs.statSync(baseline, { throwIfNoEntry:false })?.isDirectory()) failures.push('baseline_root_missing');
  if (failures.length) return { passed:false, slice:'w1c-a', failures };

  for (const relative of W1C_A_REQUIRED) {
    if (!relativeExists(candidate, relative)) failures.push(`required_file_missing:${relative}`);
  }
  for (const relative of W1C_A_FORBIDDEN_FILES) {
    if (relativeExists(candidate, relative)) failures.push(`future_file_present:${relative}`);
  }
  for (const [relative, pattern] of W1C_A_FORBIDDEN_PATTERNS) {
    const target = path.join(candidate, relative);
    const baselineTarget = path.join(baseline, relative);
    const candidateCount = fs.existsSync(target) ? patternCount(fs.readFileSync(target, 'utf8'), pattern) : 0;
    const baselineCount = fs.existsSync(baselineTarget) ? patternCount(fs.readFileSync(baselineTarget, 'utf8'), pattern) : 0;
    if (candidateCount > baselineCount) {
      failures.push(`future_symbol_present:${relative}`);
    }
  }

  const candidateVercel = path.join(candidate, 'vercel.json');
  const baselineVercel = path.join(baseline, 'vercel.json');
  if (!fs.existsSync(candidateVercel) || !fs.existsSync(baselineVercel)) {
    failures.push('vercel_contract_missing');
  } else if (digest(candidateVercel) !== digest(baselineVercel)) {
    failures.push('vercel_contract_changed');
  }

  return {
    passed:failures.length === 0,
    slice:'w1c-a',
    checks:{
      required_files:W1C_A_REQUIRED.length,
      forbidden_files:W1C_A_FORBIDDEN_FILES.length,
      forbidden_shared_contracts:W1C_A_FORBIDDEN_PATTERNS.size,
      vercel_matches_baseline:!failures.includes('vercel_contract_changed')
        && !failures.includes('vercel_contract_missing')
    },
    failures
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slice = argument('--slice');
  const root = argument('--root');
  const baselineRoot = argument('--baseline-root');
  if (slice !== 'w1c-a' || !root || !baselineRoot) {
    process.stderr.write('Usage: verify-orlando-os-release-scope --slice w1c-a --root <candidate> --baseline-root <w1b-base>\n');
    process.exit(2);
  }
  const result = verifyW1cAReleaseScope({ root, baselineRoot });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.passed ? 0 : 1);
}
