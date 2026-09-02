'use strict';

const crypto = require('node:crypto');
const { InvalidTransitionError } = require('./operational-store.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PREFIX = 'lead_';

function referenceKey(env = process.env) {
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (secret.length < 32) throw new InvalidTransitionError('Lead references are unavailable.');
  return crypto.createHash('sha256').update(`a7-system-lead-ref-v1:${secret}`).digest();
}

function leadReference(leadId, env = process.env) {
  if (!UUID.test(String(leadId || ''))) throw new InvalidTransitionError('Lead identity is invalid.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', referenceKey(env), iv);
  const encrypted = Buffer.concat([cipher.update(leadId, 'utf8'), cipher.final()]);
  return `${PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')}`;
}

function leadIdFromReference(reference, env = process.env) {
  const token = String(reference || '');
  if (!token.startsWith(PREFIX) || token.length > 180) throw new InvalidTransitionError('Lead reference is invalid.');
  try {
    const raw = Buffer.from(token.slice(PREFIX.length), 'base64url');
    if (raw.length < 29) throw new Error('short');
    const decipher = crypto.createDecipheriv('aes-256-gcm', referenceKey(env), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const leadId = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    if (!UUID.test(leadId)) throw new Error('uuid');
    return leadId;
  } catch (_) {
    throw new InvalidTransitionError('Lead reference is invalid.');
  }
}

module.exports = { leadReference, leadIdFromReference };
