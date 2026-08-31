#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemCustomerService } = require('../lib/system-customer-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const search = String(arg('--search') || '').trim();
const customerRef = String(arg('--customer-ref') || '').trim();
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner');

if ((!search && !customerRef) || (search && customerRef) || !actorId || actorRole !== 'owner') {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:customers -- --search "Dennis"\n');
  process.stderr.write('   or: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:customers -- --customer-ref "cust_..."\n');
  process.exitCode = 1;
} else {
  const service = systemCustomerService();
  const result = search ? await service.search(search) : await service.getByReference(customerRef);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
