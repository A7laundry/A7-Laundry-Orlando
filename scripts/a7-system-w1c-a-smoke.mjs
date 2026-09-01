#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemW1cASmokeService } = require('../lib/system-w1c-a-smoke-service.js');

if (!process.argv.includes('--execute')) {
  process.stdout.write(JSON.stringify({
    ok:true,
    mode:'dry_run',
    mutation:'transactional synthetic W1C-A rows only; zero committed residue',
    required_flag:'--execute'
  }, null, 2) + '\n');
  process.exit(0);
}

const actorId = String(process.env.A7_W1C_A_SMOKE_ACTOR_ID || '').trim();
if (!actorId) throw new Error('A7_W1C_A_SMOKE_ACTOR_ID is required.');
const result = await systemW1cASmokeService().run(
  { actor_id:actorId, role:'owner' },
  crypto.randomUUID()
);
process.stdout.write(JSON.stringify({ ok:true, result }, null, 2) + '\n');
