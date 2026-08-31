import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { validateCommercialCheckpoint } from './validate-lbv-commercial-checkpoint.mjs';

const template = JSON.parse(readFileSync(new URL('../marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-commercial-checkpoint-template.json', import.meta.url), 'utf8'));

test('commercial checkpoint accepts an explicit unavailable baseline without manufacturing zero', () => {
  assert.equal(validateCommercialCheckpoint(structuredClone(template)).metrics.paidOrders, null);
});

test('commercial checkpoint rejects revenue without reconciled orders', () => {
  const record = structuredClone(template);
  record.metrics.revenueUsd = 200;
  assert.throws(() => validateCommercialCheckpoint(record), /revenueUsd requires reconciled order evidence/);
});

test('commercial checkpoint rejects PII-shaped fields', () => {
  const record = structuredClone(template);
  record.customerName = 'Example Guest';
  assert.throws(() => validateCommercialCheckpoint(record), /missing or unexpected fields/);
});

test('commercial rollback requires reconciled commercial evidence and sufficient sample', () => {
  const record = structuredClone(template);
  record.decision = 'rollback';
  record.decisionBasis = 'commercial_decline';
  assert.throws(() => validateCommercialCheckpoint(record), /commercial rollback requires sufficient sample/);
});
