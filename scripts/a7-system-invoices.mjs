#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemInvoiceService } = require('../lib/system-invoice-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const command = process.argv[2] || '';
const actorId = String(process.env.A7_SYSTEM_CLI_ACTOR_ID || '');
const actorRole = String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner');
const invoices = systemInvoiceService();

if (!actorId || actorRole !== 'owner' || !['context', 'review', 'void'].includes(command)) {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> npm run system:invoices -- context --order "MCO 1002"\n');
  process.stderr.write('  review --order "MCO 1002" --version n [--reason text] [--request-id uuid]\n');
  process.stderr.write('  void --order "MCO 1002" --version n --reason text [--request-id uuid]\n');
  process.exitCode = 1;
} else {
  const actor = { actor_id:actorId, role:actorRole };
  let result;
  if (command === 'context') result = await invoices.context(arg('--order'));
  if (command === 'review') result = await invoices.review({
    order_number:arg('--order'), expected_invoice_version:arg('--version'), reason:arg('--reason') || null,
    request_id:arg('--request-id') || crypto.randomUUID()
  }, actor);
  if (command === 'void') result = await invoices.void({
    order_number:arg('--order'), expected_invoice_version:arg('--version'), reason:arg('--reason'),
    request_id:arg('--request-id') || crypto.randomUUID()
  }, actor);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
