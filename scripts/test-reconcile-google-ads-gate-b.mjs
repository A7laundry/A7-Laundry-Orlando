import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadLedger, reconcile } from './reconcile-google-ads-gate-b.mjs';

const HEADERS = 'source,source_event_id,event_datetime_utc,status,order_id,payment_id,amount,currency,refund_amount,service,hotel_region,gclid,gbraid,wbraid,utm_source,utm_campaign,utm_term,google_conversion_action,is_duplicate';

function withCsv(body, callback, extraHeader = '') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-gate-b-'));
  const file = path.join(directory, 'ledger.csv');
  fs.writeFileSync(file, `${HEADERS}${extraHeader}\n${body}\n`);
  try {
    return callback(file);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('reconciles a paid Google Ads case only through deterministic IDs', () => {
  const rows = [
    'google_ads,gads-1,2026-08-01T14:00:00Z,paid,ord-1,pay-1,50,USD,,standard,Orlando,gclid-1,,,google,campaign,hotel laundry,Stripe purchase,false',
    'mos,mos-1,2026-08-01T13:50:00Z,confirmed,ord-1,,,,,standard,Orlando,gclid-1,,,google,campaign,hotel laundry,,false',
    'stripe,stripe-1,2026-08-01T14:00:00Z,paid,ord-1,pay-1,50,USD,,standard,Orlando,,,,,,,,false',
  ];
  const report = withCsv(rows.join('\n'), (file) => reconcile(loadLedger(file), 1));
  assert.equal(report.reconciliation.cases, 1);
  assert.equal(report.reconciliation.paid_cases, 1);
  assert.equal(report.reconciliation.paid_attributed_cases, 1);
  assert.equal(report.gate_b.ready, true);
});

test('keeps payments without a click ID unattributed', () => {
  const row = 'stripe,stripe-2,2026-08-02T14:00:00-04:00,paid,ord-2,pay-2,75,USD,,express,Orlando,,,,,,,,false';
  const report = withCsv(row, (file) => reconcile(loadLedger(file)));
  assert.equal(report.reconciliation.paid_unattributed_cases, 1);
  assert.equal(report.gate_b.ready, false);
});

test('rejects forbidden PII columns', () => {
  const row = 'stripe,stripe-3,2026-08-02T14:00:00Z,paid,ord-3,pay-3,75,USD,,express,Orlando,gclid-3,,,,,,,false,+14070000000';
  assert.throws(
    () => withCsv(row, (file) => loadLedger(file), ',phone'),
    /Forbidden PII columns: phone/
  );
});

test('requires explicit duplicate marking for repeated source events', () => {
  const row = 'stripe,stripe-4,2026-08-02T14:00:00Z,paid,ord-4,pay-4,75,USD,,express,Orlando,gclid-4,,,,,,,false';
  assert.throws(
    () => withCsv(`${row}\n${row}`, (file) => reconcile(loadLedger(file))),
    /Duplicate source event/
  );
});
