#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemW1bSmokeService } = require('../lib/system-w1b-smoke-service.js');

const execute = process.argv.includes('--execute');
if (!execute) {
  process.stdout.write(JSON.stringify({
    ok:true,
    mode:'dry_run',
    mutation:'transactional synthetic rows only; zero committed residue',
    required_flag:'--execute'
  }, null, 2) + '\n');
  process.exit(0);
}

const actorId = String(process.env.A7_W1B_SMOKE_ACTOR_ID || '').trim();
if (!actorId) throw new Error('A7_W1B_SMOKE_ACTOR_ID is required.');
const result = await systemW1bSmokeService().run(
  { actor_id:actorId, role:'owner' },
  crypto.randomUUID()
);
process.stdout.write(JSON.stringify({ ok:true, result }, null, 2) + '\n');
