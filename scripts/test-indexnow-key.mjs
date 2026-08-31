import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  INDEXNOW_KEY,
  INDEXNOW_KEY_FILE,
  PUBLIC_TEXT_ARTIFACTS
} from './public-artifacts.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('tracked public IndexNow artifact matches build and submission configuration', () => {
  assert.equal(INDEXNOW_KEY_FILE, `${INDEXNOW_KEY}.txt`);
  assert.equal(fs.readFileSync(path.join(root, INDEXNOW_KEY_FILE), 'utf8').trim(), INDEXNOW_KEY);
  assert.ok(PUBLIC_TEXT_ARTIFACTS.includes(INDEXNOW_KEY_FILE));

  const dryRun = spawnSync(
    process.execPath,
    [path.join(root, 'scripts/submit-indexnow.mjs'), '--dry-run'],
    { cwd: root, encoding: 'utf8' }
  );
  assert.equal(dryRun.status, 0, dryRun.stderr);

  const payload = JSON.parse(dryRun.stdout);
  assert.equal(payload.key, INDEXNOW_KEY);
  assert.equal(payload.keyLocation, `https://a7laundry.com/${INDEXNOW_KEY_FILE}`);
});
