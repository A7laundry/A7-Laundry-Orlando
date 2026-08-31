#!/usr/bin/env node

import fs from 'node:fs';
import process from 'node:process';

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

const action = arg('--action');
const inputPath = arg('--input');
const base = String(process.env.A7_OPERATIONS_API_BASE || '').replace(/\/$/, '');
const token = process.env.OPERATIONS_API_TOKEN || '';

if (!action || !inputPath) {
  fail('Usage: npm run operations:lifecycle -- --action <action> --input <payload.json> (retry_analytics accepts {"limit":25})');
} else if (!base || !token) {
  fail('A7_OPERATIONS_API_BASE and OPERATIONS_API_TOKEN are required.');
} else {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      throw new Error('Payload must be a JSON object.');
    }
  } catch (_) {
    fail('Input must be a readable JSON file.');
  }

  if (payload) {
    const response = await fetch(`${base}/api/operations/lifecycle`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ ...payload, action })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) fail(`Lifecycle request failed with HTTP ${response.status}.`);
    else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
