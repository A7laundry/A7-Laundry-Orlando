#!/usr/bin/env node

import process from 'node:process';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {evaluateOperationalRelease} = require('../lib/operational-release-preflight.js');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const profile = arg('--profile');
const result = evaluateOperationalRelease(process.env, profile);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.ready) process.exitCode = 1;
