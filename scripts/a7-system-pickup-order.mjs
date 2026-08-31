#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemOrderService } = require('../lib/system-order-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const orderNumber = String(arg('--order-number') || '').trim();
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'operator');

if (!orderNumber || !actorId || !['owner', 'operator'].includes(actorRole)) {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:pickup-order -- --order-number "MCO 1002"\n');
  process.exitCode = 1;
} else {
  const result = await systemOrderService().getPickupOrderByNumber(orderNumber);
  if (!result) {
    process.stderr.write('Pickup Order not found.\n');
    process.exitCode = 2;
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
