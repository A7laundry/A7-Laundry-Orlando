'use strict';

const crypto = require('node:crypto');
const { ROLE_SET } = require('./system-rbac.js');

const COOKIE_NAME = '__Host-a7_system_session';
const SUBMISSION_COOKIE_NAME = '__Host-a7_system_submission';
const SESSION_SECONDS = 8 * 60 * 60;
const SUBMISSION_SECONDS = 60 * 60;
const ROLES = ROLE_SET;

function accessMode(env = process.env) {
  const configured = String(env.A7_SYSTEM_ACCESS_MODE || '').trim().toLowerCase();
  if (configured === 'owner_only' || configured === 'team') return configured;
  return env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production' ? 'owner_only' : 'team';
}

function roleAllowed(role, env = process.env) {
  return ROLES.has(role) && (accessMode(env) !== 'owner_only' || role === 'owner');
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function usersFromEnv(env = process.env) {
  const parseRows = (value) => {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  };
  const rows = [
    ...parseRows(env.A7_SYSTEM_USERS_JSON),
    ...parseRows(env.A7_SYSTEM_TEAM_USERS_JSON)
  ];
  const normalized = rows.filter((row) => row && typeof row === 'object' && ROLES.has(row.role)
    && typeof row.email === 'string' && typeof row.password_salt === 'string'
    && typeof row.password_hash === 'string')
    .map((row) => ({
      email: row.email.trim().toLowerCase().slice(0, 160),
      display_name: String(row.display_name || row.email.split('@')[0]).trim().slice(0, 80),
      role: row.role,
      password_salt: row.password_salt,
      password_hash: row.password_hash
    }));
  return [...new Map(normalized.map((row) => [row.email, row])).values()];
}

function passwordHash(password, salt) {
  return crypto.pbkdf2Sync(String(password || ''), String(salt || ''), 310000, 32, 'sha256').toString('base64url');
}

function actorId(email, secret) {
  return `actor_${crypto.createHmac('sha256', secret).update(email).digest('hex').slice(0, 24)}`;
}

function authenticate(email, password, env = process.env) {
  const normalized = String(email || '').trim().toLowerCase();
  const user = usersFromEnv(env).find((row) => row.email === normalized);
  if (!user || !roleAllowed(user.role, env)
    || !safeEqual(passwordHash(password, user.password_salt), user.password_hash)) return null;
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (secret.length < 32) return null;
  return { actor_id: actorId(user.email, secret), display_name: user.display_name, role: user.role };
}

function persistentActor(user) {
  if (!user || user.status !== 'active' || !ROLES.has(user.role)) return null;
  return {
    actor_id:String(user.actor_id || ''), user_id:String(user.id || ''),
    display_name:String(user.full_name || '').slice(0, 120), role:user.role,
    auth_source:'database', auth_version:Number(user.auth_version),
    must_change_password:Boolean(user.must_change_password)
  };
}

async function authenticateHybrid(email, password, options = {}) {
  const env = options.env || process.env;
  const legacy = () => env.A7_SYSTEM_LEGACY_OWNER_FALLBACK === 'disabled'
    ? null : authenticate(email, password, env);
  let stored = null;
  try {
    const store = options.userStore || require('./system-user-store.js').createSystemUserStore({ env });
    stored = await store.findByEmail(email);
    if (stored) {
      const valid = stored.status === 'active'
        && safeEqual(passwordHash(password, stored.password_salt), stored.password_hash);
      await store.recordLogin({ user_id:stored.id, success:valid });
      if (valid) return persistentActor(stored);
      const fallback = legacy();
      return fallback?.role === 'owner'
        ? { ...fallback, auth_source:'legacy' } : null;
    }
  } catch (_) {
    // Cutover is fail-safe for the existing environment users. Database-backed
    // identities still fail closed because they have no environment credential.
  }
  const fallback = legacy();
  return fallback ? { ...fallback, auth_source:'legacy' } : null;
}

function signSession(user, env = process.env, now = Date.now()) {
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (secret.length < 32 || !user || !ROLES.has(user.role)) throw new Error('System auth is not configured.');
  const payload = base64url(JSON.stringify({
    sub: user.actor_id,
    name: user.display_name,
    role: user.role,
    src: user.auth_source || 'legacy',
    uid: user.user_id || null,
    ver: Number.isInteger(user.auth_version) ? user.auth_version : null,
    pwd: Boolean(user.must_change_password),
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + SESSION_SECONDS
  }));
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function cookieValue(req, name) {
  const source = String(req?.headers?.cookie || '');
  const match = source.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

function verifySession(token, env = process.env, now = Date.now()) {
  const [payload, signature, extra] = String(token || '').split('.');
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (!payload || !signature || extra || secret.length < 32) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (_) { return null; }
  if (!data || !roleAllowed(data.role, env) || typeof data.sub !== 'string'
    || data.exp <= Math.floor(now / 1000)) return null;
  return {
    actor_id:data.sub, display_name:String(data.name || '').slice(0, 120), role:data.role,
    auth_source:data.src === 'database' ? 'database' : 'legacy',
    user_id:data.src === 'database' ? String(data.uid || '') : null,
    auth_version:data.src === 'database' ? Number(data.ver) : null,
    must_change_password:Boolean(data.pwd)
  };
}

function sessionFromRequest(req, env = process.env) {
  return verifySession(cookieValue(req, COOKIE_NAME), env);
}

async function sessionFromRequestAsync(req, options = {}) {
  const env = options.env || process.env;
  const actor = sessionFromRequest(req, env);
  if (!actor || actor.auth_source !== 'database') return actor;
  if (!actor.user_id || !Number.isInteger(actor.auth_version)) return null;
  try {
    const store = options.userStore || require('./system-user-store.js').createSystemUserStore({ env });
    const user = await store.findById(actor.user_id);
    if (!user || user.status !== 'active' || user.actor_id !== actor.actor_id
      || user.role !== actor.role || Number(user.auth_version) !== actor.auth_version) return null;
    return persistentActor(user);
  } catch (_) { return null; }
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function issueSubmission(env = process.env, now = Date.now()) {
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (secret.length < 32) throw new Error('System auth is not configured.');
  const id = crypto.randomUUID();
  const expires = Math.floor(now / 1000) + SUBMISSION_SECONDS;
  const value = `${id}.${expires}`;
  const signature = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return { id, token: `${value}.${signature}` };
}

function submissionFromRequest(req, env = process.env, now = Date.now()) {
  const [id, expires, signature, extra] = cookieValue(req, SUBMISSION_COOKIE_NAME).split('.');
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (!id || !UUID_PATTERN.test(id) || !expires || !signature || extra || secret.length < 32) return null;
  if (!/^\d+$/.test(expires) || Number(expires) <= Math.floor(now / 1000)) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${id}.${expires}`).digest('base64url');
  return safeEqual(signature, expected) ? id : null;
}

function submissionCookie(token) {
  return `${SUBMISSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SUBMISSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

function clearSubmissionCookie() {
  return `${SUBMISSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = {
  COOKIE_NAME, SUBMISSION_COOKIE_NAME, SESSION_SECONDS, SUBMISSION_SECONDS, ROLES,
  accessMode, roleAllowed,
  usersFromEnv, passwordHash, safeEqual, authenticate, authenticateHybrid, persistentActor,
  signSession, verifySession, sessionFromRequest, sessionFromRequestAsync,
  sessionCookie, clearSessionCookie, issueSubmission, submissionFromRequest,
  submissionCookie, clearSubmissionCookie
};
