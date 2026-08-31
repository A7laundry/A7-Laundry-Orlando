import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import { createSession, hashPassword, verifyPassword, verifySession } from '../auth.js';

globalThis.crypto ||= webcrypto;
globalThis.btoa ||= (value) => Buffer.from(value, 'binary').toString('base64');
globalThis.atob ||= (value) => Buffer.from(value, 'base64').toString('binary');

test('PBKDF2 password verification accepts only the correct password', async () => {
  const salt = randomBytes(24).toString('base64url');
  const hash = await hashPassword('correct-horse-battery-staple', salt);
  assert.equal(await verifyPassword('correct-horse-battery-staple', salt, hash), true);
  assert.equal(await verifyPassword('wrong-password', salt, hash), false);
});

test('signed session validates, rejects tampering and expires', async () => {
  const secret = randomBytes(32).toString('base64url');
  const now = Date.now();
  const token = await createSession('a7laundry.usa@gmail.com', secret, now);
  assert.equal((await verifySession(token, secret, now)).email, 'a7laundry.usa@gmail.com');
  assert.equal(await verifySession(token.slice(0, -1) + 'x', secret, now), null);
  assert.equal(await verifySession(token, secret, now + 8 * 24 * 60 * 60 * 1000), null);
});
