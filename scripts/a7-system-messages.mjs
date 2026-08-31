#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemMessageService } = require('../lib/system-message-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const command = process.argv[2] || '';
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner');
const messages = systemMessageService();

if (!actorId || actorRole !== 'owner' || !['context', 'create', 'approve', 'copied'].includes(command)) {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:messages -- context --order "MCO 1002"\n');
  process.stderr.write('  create --order "MCO 1002" --template order_confirmed [--request-id uuid]\n');
  process.stderr.write('  approve --order "MCO 1002" --draft uuid --version n [--request-id uuid]\n');
  process.stderr.write('  copied --order "MCO 1002" --draft uuid --version n [--request-id uuid]\n');
  process.exitCode = 1;
} else {
  const actor = { actor_id:actorId, role:actorRole };
  let result;
  if (command === 'context') result = await messages.context(arg('--order'));
  if (command === 'create') result = await messages.create({
    order_number:arg('--order'), template_key:arg('--template'), request_id:arg('--request-id') || crypto.randomUUID()
  }, actor);
  if (command === 'approve') result = await messages.approve({
    order_number:arg('--order'), draft_id:arg('--draft'), expected_version:arg('--version'),
    request_id:arg('--request-id') || crypto.randomUUID()
  }, actor);
  if (command === 'copied') result = await messages.copied({
    order_number:arg('--order'), draft_id:arg('--draft'), expected_version:arg('--version'),
    request_id:arg('--request-id') || crypto.randomUUID()
  }, actor);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
