#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemHomeService } = require('../lib/system-home-service.js');

const actor = {
  actor_id:String(process.env.A7_SYSTEM_CLI_ACTOR_ID || ''),
  role:String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner').toLowerCase()
};

if (!actor.actor_id || !['owner', 'operator'].includes(actor.role)) {
  process.stderr.write('Set A7_SYSTEM_CLI_ACTOR_ID and A7_SYSTEM_CLI_ACTOR_ROLE=owner|operator.\n');
  process.exitCode = 1;
} else {
  const report = await systemHomeService().report(actor);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
