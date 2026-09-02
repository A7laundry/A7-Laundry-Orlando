'use strict';

const crypto = require('node:crypto');
const { createSystemUserStore, emailOf } = require('./system-user-store.js');
const { InvalidTransitionError } = require('./operational-store.js');
const { passwordHash, safeEqual } = require('./system-auth.js');
const { validRole } = require('./system-rbac.js');

function clean(value, max) { return String(value || '').trim().slice(0, max); }
function ownerRequired(actor) {
  if (!actor || actor.role !== 'owner' || !clean(actor.actor_id, 120)) {
    throw new InvalidTransitionError('Owner authorization is required.');
  }
}
function uuid(value) {
  const result = clean(value, 40);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) {
    throw new InvalidTransitionError('User reference is invalid.');
  }
  return result;
}
function validatePassword(password, email = '') {
  const value = String(password || '');
  if (value.length < 14 || value.length > 128 || !/[a-z]/.test(value) || !/[A-Z]/.test(value)
    || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    throw new InvalidTransitionError('Password must contain at least 14 characters, upper/lower case, number and symbol.');
  }
  const local = emailOf(email).split('@')[0];
  if (local.length >= 4 && value.toLowerCase().includes(local)) throw new InvalidTransitionError('Password must not contain the email name.');
  return value;
}
function credentials(password) {
  const salt = crypto.randomBytes(24).toString('base64url');
  return { password_salt:salt, password_hash:passwordHash(password, salt) };
}
function temporaryPassword() {
  return `A7!${crypto.randomBytes(18).toString('base64url')}z9`;
}
function safeUser(user) {
  if (!user) return null;
  const { password_hash:ignoredHash, password_salt:ignoredSalt, created_by:ignoredCreated,
    updated_by:ignoredUpdated, ...safe } = user;
  return safe;
}

function systemUserService(options = {}) {
  const store = options.userStore || createSystemUserStore(options);
  return {
    async list(actor) { ownerRequired(actor); return (await store.listUsers()).map(safeUser); },
    async history(rawUserId, actor) { ownerRequired(actor); return store.listEvents(uuid(rawUserId)); },
    async create(raw, actor) {
      ownerRequired(actor);
      const email = emailOf(raw.email); const fullName = clean(raw.full_name, 120);
      const role = clean(raw.role, 20).toLowerCase();
      if (!email.includes('@') || fullName.length < 2 || !validRole(role)) throw new InvalidTransitionError('User profile is invalid.');
      const password = temporaryPassword();
      const created = await store.createUser({ actor_id:`actor_${crypto.randomBytes(18).toString('base64url')}`,
        email, full_name:fullName, phone:clean(raw.phone, 32) || null,
        job_title:clean(raw.job_title, 80) || null, role, ...credentials(password), actor });
      return { user:safeUser(created), temporary_password:password };
    },
    async update(raw, actor) {
      ownerRequired(actor);
      const role = raw.role == null ? null : clean(raw.role, 20).toLowerCase();
      const status = raw.status == null ? null : clean(raw.status, 20).toLowerCase();
      const email = raw.email == null ? null : emailOf(raw.email);
      const fullName = raw.full_name == null ? null : clean(raw.full_name, 120);
      if (role && !validRole(role)) throw new InvalidTransitionError('Role is invalid.');
      if (status && !['active', 'inactive'].includes(status)) throw new InvalidTransitionError('Status is invalid.');
      if (email != null && !email.includes('@')) throw new InvalidTransitionError('Email is invalid.');
      if (fullName != null && fullName.length < 2) throw new InvalidTransitionError('Full name is invalid.');
      const updated = await store.updateUser({ user_id:uuid(raw.user_id),
        email, full_name:fullName,
        phone:raw.phone == null ? null : clean(raw.phone, 32),
        job_title:raw.job_title == null ? null : clean(raw.job_title, 80), role, status, actor });
      return safeUser(updated);
    },
    async resetPassword(rawUserId, actor) {
      ownerRequired(actor); const password = temporaryPassword();
      const updated = await store.resetPassword({ user_id:uuid(rawUserId), ...credentials(password), actor });
      return { user:safeUser(updated), temporary_password:password };
    },
    async changeOwnPassword(raw, actor) {
      if (!actor || actor.auth_source !== 'database' || !actor.user_id) throw new InvalidTransitionError('Database user session is required.');
      const user = await store.findById(actor.user_id);
      if (!user || user.status !== 'active' || user.actor_id !== actor.actor_id
        || Number(user.auth_version) !== actor.auth_version) throw new InvalidTransitionError('Session is stale.');
      if (!safeEqual(passwordHash(raw.current_password, user.password_salt), user.password_hash)) {
        throw new InvalidTransitionError('Current password is invalid.');
      }
      const next = validatePassword(raw.new_password, user.email);
      if (safeEqual(passwordHash(next, user.password_salt), user.password_hash)) throw new InvalidTransitionError('Choose a different password.');
      return safeUser(await store.changePassword({ user_id:user.id, expected_auth_version:user.auth_version,
        actor_id:user.actor_id, ...credentials(next) }));
    }
  };
}

module.exports = { systemUserService, validatePassword, temporaryPassword, safeUser, credentials };
