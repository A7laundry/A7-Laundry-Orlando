#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemOperationsService } = require('../lib/system-operations-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const command = process.argv[2] || '';
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner');
const operations = systemOperationsService();

if (!actorId || actorRole !== 'owner' || !['today', 'list', 'detail', 'transition'].includes(command)) {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:operations -- today\n');
  process.stderr.write('  list --queue <queue> [--search <private search>] [--custody <state>] [--production <state>]\n');
  process.stderr.write('  detail --order <MCO 1002>\n');
  process.stderr.write('  transition --order <MCO 1002> --action <action> [--promised-local YYYY-MM-DDTHH:mm] [--item uuid --weight lb --expected-version n] [--reason text] [--request-id uuid]\n');
  process.exitCode = 1;
} else {
  let result;
  if (command === 'today') result = await operations.today();
  if (command === 'list') result = await operations.list({ queue:arg('--queue') || 'all', query:arg('--search'),
    custody_state:arg('--custody'), production_state:arg('--production') });
  if (command === 'detail') result = await operations.detail(arg('--order'));
  if (command === 'transition') result = await operations.transition({
    order_number:arg('--order'), action:arg('--action'), promised_by_local:arg('--promised-local'),
    order_item_id:arg('--item'), actual_lbs:arg('--weight'), expected_weight_version:arg('--expected-version'),
    reason:arg('--reason'), request_id:arg('--request-id') || crypto.randomUUID()
  }, { actor_id:actorId, role:actorRole });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
