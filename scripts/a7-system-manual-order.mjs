#!/usr/bin/env node

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemOrderService } = require('../lib/system-order-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const inputPath = arg('--input');
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'operator');

if (!inputPath || !actorId || !['owner', 'operator'].includes(actorRole)) {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:manual-order -- --input <payload.json>\n');
  process.exitCode = 1;
} else {
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const orders = systemOrderService();
  const create = payload.customer_ref ? orders.createKnownCustomerOrder.bind(orders) : orders.createManualOrder.bind(orders);
  const result = await create(payload, { actor_id: actorId, role: actorRole });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
