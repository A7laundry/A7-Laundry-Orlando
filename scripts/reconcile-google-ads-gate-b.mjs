#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_COLUMNS = [
  'source', 'source_event_id', 'event_datetime_utc', 'status', 'order_id',
  'payment_id', 'amount', 'currency', 'refund_amount', 'service', 'hotel_region',
  'gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_campaign', 'utm_term',
  'google_conversion_action', 'is_duplicate',
];
const ALLOWED_STATUSES = new Set([
  'contact_open', 'conversation', 'qualified', 'quoted', 'confirmed', 'paid',
  'refunded', 'cancelled',
]);
const ALLOWED_SERVICES = new Set(['standard', 'express', 'unknown']);
const FORBIDDEN_HEADER = /(customer_?name|guest_?name|full_?name|phone|mobile|email|address|message|conversation_?text|chat_?text)/i;
const LINK_FIELDS = ['order_id', 'payment_id', 'gclid', 'gbraid', 'wbraid'];

function usage() {
  return [
    'Usage:',
    '  node scripts/reconcile-google-ads-gate-b.mjs --input <ledger.csv> [--out <report.json>] [--expected-ads-purchases <n>]',
    '',
    'The input must use the canonical, redacted Gate B schema.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    args[key.slice(2)] = value;
    index += 1;
  }
  if (!args.input) throw new Error('Missing required --input');
  if (args['expected-ads-purchases'] !== undefined) {
    const expected = Number(args['expected-ads-purchases']);
    if (!Number.isInteger(expected) || expected < 0) {
      throw new Error('--expected-ads-purchases must be a non-negative integer');
    }
    args.expectedAdsPurchases = expected;
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }
  if (quoted) throw new Error('Malformed CSV: unclosed quote');
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ''));
}

function normalizeBoolean(value, line) {
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw new Error(`Line ${line}: is_duplicate must be true or false`);
}

function normalizeMoney(value, field, line) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Line ${line}: ${field} must be a non-negative number`);
  }
  return parsed;
}

function loadLedger(inputPath) {
  const parsed = parseCsv(fs.readFileSync(inputPath, 'utf8'));
  if (parsed.length < 2) throw new Error('Input must contain a header and at least one data row');
  const headers = parsed[0].map((header) => header.trim());
  const forbidden = headers.filter((header) => FORBIDDEN_HEADER.test(header));
  if (forbidden.length) throw new Error(`Forbidden PII columns: ${forbidden.join(', ')}`);
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV headers are not allowed');

  return parsed.slice(1).map((values, rowIndex) => {
    const line = rowIndex + 2;
    if (values.length !== headers.length) {
      throw new Error(`Line ${line}: expected ${headers.length} columns, received ${values.length}`);
    }
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index].trim()]));
    if (!row.source || !row.source_event_id) throw new Error(`Line ${line}: source and source_event_id are required`);
    if (!Number.isFinite(Date.parse(row.event_datetime_utc)) || !/(Z|[+-]\d\d:\d\d)$/.test(row.event_datetime_utc)) {
      throw new Error(`Line ${line}: event_datetime_utc must include an explicit timezone`);
    }
    if (!ALLOWED_STATUSES.has(row.status)) throw new Error(`Line ${line}: invalid status ${row.status}`);
    if (!ALLOWED_SERVICES.has(row.service)) throw new Error(`Line ${line}: invalid service ${row.service}`);
    row.is_duplicate = normalizeBoolean(row.is_duplicate, line);
    row.amount = normalizeMoney(row.amount, 'amount', line);
    row.refund_amount = normalizeMoney(row.refund_amount, 'refund_amount', line);
    if ((row.amount !== null || row.refund_amount !== null) && !/^[A-Z]{3}$/.test(row.currency)) {
      throw new Error(`Line ${line}: financial rows require a three-letter currency`);
    }
    if (row.status === 'paid' && (!row.order_id || !row.payment_id || row.amount === null || !row.currency)) {
      throw new Error(`Line ${line}: paid rows require order_id, payment_id, amount and currency`);
    }
    if (!LINK_FIELDS.some((fieldName) => row[fieldName])) {
      throw new Error(`Line ${line}: at least one deterministic identifier is required`);
    }
    return row;
  });
}

function makeUnionFind(size) {
  const parent = Array.from({ length: size }, (_, index) => index);
  const find = (value) => {
    while (parent[value] !== value) {
      parent[value] = parent[parent[value]];
      value = parent[value];
    }
    return value;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  return { find, union };
}

function sumByCurrency(rows, amountField) {
  return rows.reduce((totals, row) => {
    if (row[amountField] === null || !row.currency) return totals;
    totals[row.currency] = Number(((totals[row.currency] || 0) + row[amountField]).toFixed(2));
    return totals;
  }, {});
}

function reconcile(rows, expectedAdsPurchases) {
  const activeRows = rows.filter((row) => !row.is_duplicate);
  const sourceEventKeys = new Set();
  for (const row of activeRows) {
    const key = `${row.source}:${row.source_event_id}`;
    if (sourceEventKeys.has(key)) throw new Error(`Duplicate source event without is_duplicate=true: ${key}`);
    sourceEventKeys.add(key);
  }

  const unionFind = makeUnionFind(activeRows.length);
  const identifierOwner = new Map();
  activeRows.forEach((row, index) => {
    LINK_FIELDS.forEach((fieldName) => {
      if (!row[fieldName]) return;
      const key = `${fieldName}:${row[fieldName]}`;
      if (identifierOwner.has(key)) unionFind.union(index, identifierOwner.get(key));
      else identifierOwner.set(key, index);
    });
  });

  const groups = new Map();
  activeRows.forEach((row, index) => {
    const root = unionFind.find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push({ row, index });
  });

  const cases = [...groups.values()].map((entries) => {
    const groupRows = entries.map(({ row }) => row);
    const paidRows = groupRows.filter((row) => row.status === 'paid');
    const refundRows = groupRows.filter((row) => row.status === 'refunded');
    const clickIds = LINK_FIELDS.slice(2).flatMap((fieldName) => groupRows.map((row) => row[fieldName]).filter(Boolean));
    return {
      case_id: `case_${String(Math.min(...entries.map(({ index }) => index)) + 1).padStart(4, '0')}`,
      sources: [...new Set(groupRows.map((row) => row.source))].sort(),
      statuses: [...new Set(groupRows.map((row) => row.status))].sort(),
      event_count: groupRows.length,
      has_click_id: clickIds.length > 0,
      has_google_ads_event: groupRows.some((row) => row.source.toLowerCase() === 'google_ads'),
      paid: paidRows.length > 0,
      refunded: refundRows.length > 0,
      paid_attributed: paidRows.length > 0 && clickIds.length > 0,
      currencies: [...new Set(groupRows.map((row) => row.currency).filter(Boolean))],
      gross_amount_by_currency: sumByCurrency(paidRows, 'amount'),
      refund_amount_by_currency: sumByCurrency(refundRows, 'refund_amount'),
    };
  });

  const adsPurchaseRows = activeRows.filter((row) => row.source.toLowerCase() === 'google_ads' && row.status === 'paid');
  const paidCases = cases.filter((item) => item.paid);
  return {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    input: {
      rows: rows.length,
      active_rows: activeRows.length,
      explicitly_duplicate_rows: rows.length - activeRows.length,
    },
    reconciliation: {
      cases: cases.length,
      paid_cases: paidCases.length,
      paid_attributed_cases: paidCases.filter((item) => item.paid_attributed).length,
      paid_unattributed_cases: paidCases.filter((item) => !item.paid_attributed).length,
      refunded_cases: cases.filter((item) => item.refunded).length,
      google_ads_purchase_rows: adsPurchaseRows.length,
      expected_google_ads_purchases: expectedAdsPurchases ?? null,
      google_ads_purchase_count_matches_expectation:
        expectedAdsPurchases === undefined ? null : adsPurchaseRows.length === expectedAdsPurchases,
    },
    gate_b: {
      ready: expectedAdsPurchases !== undefined &&
        adsPurchaseRows.length === expectedAdsPurchases &&
        paidCases.length > 0 &&
        paidCases.every((item) => item.has_click_id),
      note: 'Ready only verifies deterministic linkage in this ledger; business approval is still required.',
    },
    cases,
  };
}

export { loadLedger, parseCsv, reconcile };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = reconcile(loadLedger(path.resolve(args.input)), args.expectedAdsPurchases);
    const output = `${JSON.stringify(report, null, 2)}\n`;
    if (args.out) {
      fs.writeFileSync(path.resolve(args.out), output, { flag: 'wx' });
      process.stdout.write(`Gate B report written to ${path.resolve(args.out)}\n`);
    } else process.stdout.write(output);
    if (!report.gate_b.ready) process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${usage()}\n`);
    process.exitCode = 1;
  }
}
