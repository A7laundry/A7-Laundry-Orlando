import { randomBytes, webcrypto } from 'node:crypto';
import { hashPassword } from '../auth.js';

globalThis.crypto ||= webcrypto;
globalThis.btoa ||= (value) => Buffer.from(value, 'binary').toString('base64');
globalThis.atob ||= (value) => Buffer.from(value, 'base64').toString('binary');

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/[\r\n]+$/, '');
if (password.length < 12) throw new Error('Password must contain at least 12 characters');

const salt = randomBytes(24).toString('base64url');
const hash = await hashPassword(password, salt);
process.stdout.write(`MOS_PASSWORD_SALT=${salt}\nMOS_PASSWORD_HASH=${hash}\n`);
