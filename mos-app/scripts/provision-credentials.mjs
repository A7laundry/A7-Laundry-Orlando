import { randomBytes, webcrypto } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { hashPassword } from '../auth.js';

globalThis.crypto ||= webcrypto;
globalThis.btoa ||= (value) => Buffer.from(value, 'binary').toString('base64');
globalThis.atob ||= (value) => Buffer.from(value, 'base64').toString('binary');

const appRoot = path.resolve(import.meta.dirname, '..');
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const passwordBytes = randomBytes(22);
const password = Array.from(passwordBytes, (byte) => alphabet[byte % alphabet.length]).join('');
const salt = randomBytes(24).toString('base64url');
const hash = await hashPassword(password, salt);
const sessionSecret = randomBytes(48).toString('base64url');

const values = {
  MOS_ADMIN_EMAIL: 'a7laundry.usa@gmail.com',
  MOS_PASSWORD_SALT: salt,
  MOS_PASSWORD_HASH: hash,
  MOS_SESSION_SECRET: sessionSecret
};

for (const [name, value] of Object.entries(values)) {
  const result = spawnSync('vercel', ['env', 'add', name, 'production', '--force', '--yes', '--sensitive'], {
    cwd: appRoot,
    input: value,
    encoding: 'utf8'
  });
  if (result.status !== 0) throw new Error(`Could not provision ${name}: ${result.stderr || result.stdout}`);
}

process.stdout.write(`MOS credentials provisioned.\nTEMPORARY_PASSWORD=${password}\n`);
