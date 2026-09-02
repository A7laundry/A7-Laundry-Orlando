#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ORLANDO_PRODUCTION_PROJECT_REF = 'wiwawtpaxnrueugppasi';
export const FORBIDDEN_FOREIGN_PROJECT_REF = 'zquefoznqwkfbnnfalmt';

export function evaluateLinkedTarget(expectedValue, linkedValue) {
  const expected = String(expectedValue || '').trim().toLowerCase();
  const linked = String(linkedValue || '').trim().toLowerCase();
  const expectedSafe = /^[a-z0-9]{20}$/.test(expected)
    && ![ORLANDO_PRODUCTION_PROJECT_REF, FORBIDDEN_FOREIGN_PROJECT_REF].includes(expected);
  const linkedSafe = /^[a-z0-9]{20}$/.test(linked)
    && ![ORLANDO_PRODUCTION_PROJECT_REF, FORBIDDEN_FOREIGN_PROJECT_REF].includes(linked);
  const checks = [
    { name:'expected_staging_ref', status:expectedSafe ? 'pass' : 'fail' },
    { name:'linked_ref_is_not_production_or_foreign', status:linkedSafe ? 'pass' : 'fail' },
    { name:'linked_ref_matches_expected', status:expectedSafe && linkedSafe && linked === expected ? 'pass' : 'fail' }
  ];
  return { ready:checks.every((row) => row.status === 'pass'), checks };
}

function linkedRef(cwd = process.cwd()) {
  try {
    return fs.readFileSync(path.join(cwd, 'supabase/.temp/project-ref'), 'utf8');
  } catch (_) { return ''; }
}

function commandFor(action) {
  if (action === 'migration:list') return ['migration', 'list', '--linked'];
  if (action === 'db:lint') return ['db', 'lint', '--linked', '--level', 'warning'];
  if (action === 'db:push:dry-run') return ['db', 'push', '--linked', '--dry-run', '--include-all'];
  if (action === 'db:push') return ['db', 'push', '--linked', '--include-all'];
  return null;
}

function main() {
  const action = process.argv[2] || 'guard';
  const initial = evaluateLinkedTarget(
    process.env.A7_STAGING_SUPABASE_PROJECT_REF, linkedRef()
  );
  process.stdout.write(`${JSON.stringify({ action, ...initial }, null, 2)}\n`);
  if (!initial.ready) return 2;
  if (action === 'guard') return 0;
  const args = commandFor(action);
  if (!args) return 2;
  if (action === 'db:push' && process.argv[3] !== '--execute') {
    process.stderr.write('Mutation blocked: append --execute after an approved dry-run.\n');
    return 2;
  }
  const beforeSpawn = evaluateLinkedTarget(
    process.env.A7_STAGING_SUPABASE_PROJECT_REF, linkedRef()
  );
  if (!beforeSpawn.ready) return 2;
  const child = spawnSync('supabase', args, { cwd:process.cwd(), env:process.env, stdio:'inherit' });
  const afterSpawn = evaluateLinkedTarget(
    process.env.A7_STAGING_SUPABASE_PROJECT_REF, linkedRef()
  );
  if (!afterSpawn.ready) {
    process.stderr.write('Linked target changed during the guarded command.\n');
    return 2;
  }
  return Number.isInteger(child.status) ? child.status : 2;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) process.exitCode = main();
