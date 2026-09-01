#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemFinanceService } = require('../lib/system-finance-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const actor = {
  actor_id:String(process.env.A7_SYSTEM_CLI_ACTOR_ID || ''),
  role:String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner')
};

if (!actor.actor_id) {
  process.stderr.write('Set A7_SYSTEM_CLI_ACTOR_ID to an opaque Owner identifier.\n');
  process.exitCode = 1;
} else if (actor.role !== 'owner') {
  process.stderr.write('Owner role is required for the financial report.\n');
  process.exitCode = 1;
} else {
  const preset = String(arg('--period') || '30d');
  const report = await systemFinanceService().report({
    preset, start_date:arg('--from'), end_date:arg('--to')
  }, actor);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
