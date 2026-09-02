#!/usr/bin/env node

import process from 'node:process';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {
  evaluateOperationalRelease,
  verifyStagingRuntimeBindings
} = require('../lib/operational-release-preflight.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const profile = arg('--profile');
const result = await verifyStagingRuntimeBindings(
  evaluateOperationalRelease(process.env, profile), process.env
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ready) process.exitCode = 1;
