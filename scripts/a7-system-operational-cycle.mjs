#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { systemOperationalCycleService } = require('../lib/system-operational-cycle-service.js');
const { systemOperationsService } = require('../lib/system-operations-service.js');
const { systemLeadService } = require('../lib/system-lead-service.js');
const { systemOrderService } = require('../lib/system-order-service.js');
const { systemPaymentLinkService } = require('../lib/system-payment-link-service.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function flag(name) { return process.argv.includes(name); }

function usage() {
  process.stderr.write('Usage: A7_SYSTEM_CLI_ACTOR_ID=<opaque-id> A7_SYSTEM_CLI_ACTOR_ROLE=<owner|manager> npm run system:cycle -- <command>\n');
  process.stderr.write('  drivers:list [--include-inactive]\n');
  process.stderr.write('  driver:save --name <name> --phone <international> [--driver <uuid>] [--inactive] --execute\n');
  process.stderr.write('  driver:assign --order <MCO 1003> --driver <uuid> --leg <pickup|delivery> --execute\n');
  process.stderr.write('  payment:record --order <MCO 1003> --method <stripe|cash|zelle|other> --amount <69.00> --tip <9.00> --paid-at <ISO> [--reference <text>] [--note <text>] --execute\n');
  process.stderr.write('  payment-link:context --order <MCO 1003>\n');
  process.stderr.write('  payment-link:create --order <MCO 1003> --tip <9.00> --execute\n');
  process.stderr.write('  leads:list\n');
  process.stderr.write('  lead:detail --lead-ref <opaque-reference>\n');
  process.stderr.write('  lead:accept --lead-ref <opaque-reference> --payload <json> --execute\n');
}

const command = process.argv[2] || '';
const actor = {
  actor_id:String(process.env.A7_SYSTEM_CLI_ACTOR_ID || ''),
  role:String(process.env.A7_SYSTEM_CLI_ACTOR_ROLE || 'owner').toLowerCase()
};
const reads = new Set(['drivers:list', 'leads:list', 'lead:detail', 'payment-link:context']);
const writes = new Set(['driver:save', 'driver:assign', 'payment:record', 'lead:accept', 'payment-link:create']);

if (!actor.actor_id || !['owner', 'manager'].includes(actor.role)
  || (!reads.has(command) && !writes.has(command))) {
  usage(); process.exitCode = 1;
} else if (writes.has(command) && !flag('--execute')) {
  process.stderr.write('Write blocked. Review the command and add --execute.\n');
  process.exitCode = 2;
} else {
  const service = systemOperationalCycleService();
  const request_id = arg('--request-id') || crypto.randomUUID();
  let result;
  if (command === 'drivers:list') {
    result = await service.listDrivers({ include_inactive:flag('--include-inactive') }, actor);
  } else if (command === 'driver:save') {
    result = await service.saveDriver({ driver_id:arg('--driver') || null, full_name:arg('--name'),
      phone:arg('--phone'), active:!flag('--inactive'), request_id }, actor);
  } else if (command === 'driver:assign') {
    result = await service.assignDriver({ order_number:arg('--order'), driver_id:arg('--driver'),
      leg:arg('--leg'), request_id }, actor);
  } else if (command === 'payment:record') {
    result = await service.registerPayment({ order_number:arg('--order'), method:arg('--method'),
      amount:arg('--amount'), tip_amount:arg('--tip') || '0', reference:arg('--reference') || null,
      paid_at:arg('--paid-at'), note:arg('--note') || null, request_id }, actor);
  } else if (command === 'payment-link:context') {
    result = await systemPaymentLinkService().context({ order_number:arg('--order') }, actor);
  } else if (command === 'payment-link:create') {
    result = await systemPaymentLinkService().create({ order_number:arg('--order'), tip_amount:arg('--tip') || '0' }, actor);
  } else if (command === 'leads:list') {
    result = (await systemOperationsService().today()).waiting_leads;
  } else if (command === 'lead:detail') {
    result = await systemLeadService().getByReference(arg('--lead-ref'));
  } else if (command === 'lead:accept') {
    let payload;
    try { payload = JSON.parse(arg('--payload')); }
    catch (_) { throw new Error('lead:accept requires a valid JSON --payload.'); }
    result = await systemOrderService().createExistingLeadOrder({ ...payload,
      lead_ref:arg('--lead-ref'), submission_id:request_id }, actor);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
