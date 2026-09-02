#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationFiles = [
  'supabase/migrations/20260901030000_orlando_os_team_access.sql',
  'supabase/migrations/20260901030001_orlando_os_manager_business_permissions.sql'
];
const requiredEnvironment = ['A7_SYSTEM_SESSION_SECRET', 'A7_SYSTEM_USERS_JSON'];
const storageCandidates = [
  ['operations', 'A7_OPERATIONS_SUPABASE_URL', 'A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY'],
  ['whatsapp', 'WHATSAPP_SUPABASE_URL', 'WHATSAPP_SUPABASE_SERVICE_ROLE_KEY'],
  ['attribution', 'A7_ATTRIBUTION_SUPABASE_URL', 'A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY']
];

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass:Boolean(pass), detail });
}

for (const relative of migrationFiles) {
  const absolute = path.join(root, relative);
  const sql = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  check(`migration:${path.basename(relative)}`, Boolean(sql), sql ? 'present' : 'missing');
  if (relative.includes('team_access')) {
    check('passwords:hash-only', sql.includes('password_salt text not null') && sql.includes('password_hash text not null'), 'salt and hash columns required');
    check('audit:append-only', sql.includes('a7_orlando_system_user_events') && sql.includes('on delete restrict'), 'user events retained');
    check('storage:service-role-only', sql.includes('revoke all on public.a7_orlando_system_users') && sql.includes('to service_role'), 'public roles revoked');
  }
}

for (const name of requiredEnvironment) check(`env:${name}`, Boolean(process.env[name]), process.env[name] ? 'configured' : 'missing');
const storage = storageCandidates.find(([, urlName, keyName]) => process.env[urlName] && process.env[keyName]);
check('storage:resolved-pair', Boolean(storage), storage ? `${storage[0]} pair configured` : 'no complete Supabase pair');
const storageUrl = storage ? String(process.env[storage[1]] || '') : '';
check('supabase:orlando-production', storageUrl.includes('wiwawtpaxnrueugppasi'),
  storageUrl.includes('wiwawtpaxnrueugppasi') ? 'expected project reference' : 'wrong or missing project reference');
check('access-mode:cutover', process.env.A7_SYSTEM_ACCESS_MODE === 'team',
  process.env.A7_SYSTEM_ACCESS_MODE === 'team' ? 'team' : 'must be team for Manager/Operator login');
check('legacy-owner:fallback', process.env.A7_SYSTEM_LEGACY_OWNER_FALLBACK !== 'disabled',
  process.env.A7_SYSTEM_LEGACY_OWNER_FALLBACK === 'disabled' ? 'disabled too early' : 'retained');

for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name} — ${item.detail}`);
const failed = checks.filter((item) => !item.pass);
console.log(`SYSTEM USERS PREFLIGHT: ${failed.length ? 'NO-GO' : 'GO'} (${checks.length - failed.length}/${checks.length})`);
if (failed.length) process.exitCode = 1;
