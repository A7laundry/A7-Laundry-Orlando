#!/usr/bin/env node

import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const { systemHotelService } = require('../lib/system-hotel-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const action = String(arg('--action') || 'list');
const actor = { actor_id:String(process.env.A7_SYSTEM_CLI_ACTOR_ID || ''), role:String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner') };
const hotels = systemHotelService();

if (!actor.actor_id) {
  process.stderr.write('Set A7_SYSTEM_CLI_ACTOR_ID to an opaque operator identifier.\n');
  process.exitCode = 1;
} else if (action === 'list') {
  const result = await hotels.list({ query:arg('--search'), include_inactive:process.argv.includes('--include-inactive') });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (action === 'save') {
  if (actor.role !== 'owner') throw new Error('Owner role is required to save hotels.');
  const result = await hotels.save({ hotel_id:arg('--hotel-id') || null, canonical_name:arg('--name'),
    address_line:arg('--address'), region:arg('--region'), aliases:arg('--aliases'),
    handoff_notes:arg('--handoff-notes'), active:!process.argv.includes('--inactive'),
    idempotency_key:`hotel-cli:${crypto.randomUUID()}` }, actor);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  process.stderr.write('Use --action list or --action save.\n');
  process.exitCode = 1;
}
