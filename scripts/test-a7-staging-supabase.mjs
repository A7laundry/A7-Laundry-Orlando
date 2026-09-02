import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateLinkedTarget } from './a7-staging-supabase.mjs';

const STAGING = 'abcdefghijklmnopqrst';

test('Supabase Staging guard accepts only an exact dedicated linked ref', () => {
  const result = evaluateLinkedTarget(STAGING, STAGING);
  assert.equal(result.ready, true);
  assert.ok(result.checks.every((row) => row.status === 'pass'));
});

test('Supabase Staging guard blocks missing, mismatched, Production and foreign links', () => {
  for (const linked of ['', 'uvwxyzabcdefghijklmn', 'wiwawtpaxnrueugppasi', 'zquefoznqwkfbnnfalmt']) {
    assert.equal(evaluateLinkedTarget(STAGING, linked).ready, false);
  }
  assert.equal(evaluateLinkedTarget('wiwawtpaxnrueugppasi', 'wiwawtpaxnrueugppasi').ready, false);
  assert.equal(evaluateLinkedTarget('zquefoznqwkfbnnfalmt', 'zquefoznqwkfbnnfalmt').ready, false);
});

test('Supabase Staging guard output contains no credential or database URL field', () => {
  const output = JSON.stringify(evaluateLinkedTarget(STAGING, STAGING));
  assert.doesNotMatch(output, /secret|password|supabase\.co|postgres/i);
});
