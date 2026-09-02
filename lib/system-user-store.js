'use strict';

const crypto = require('node:crypto');
const {
  OperationalStoreError,
  OperationalStorageUnavailableError,
  InvalidTransitionError,
  resolveSupabaseConfig,
  supabaseHeaders
} = require('./operational-store.js');
const { validRole } = require('./system-rbac.js');

function clone(value) { return value == null ? value : structuredClone(value); }
function emailOf(value) { return String(value || '').trim().toLowerCase().slice(0, 160); }

class MemorySystemUserStore {
  constructor() {
    this.mode = 'memory';
    this.users = new Map();
    this.events = [];
  }

  async findByEmail(email) {
    const normalized = emailOf(email);
    return clone([...this.users.values()].find((user) => user.email === normalized) || null);
  }

  async findById(userId) { return clone(this.users.get(userId) || null); }

  async listUsers() {
    return [...this.users.values()].sort((a, b) => a.full_name.localeCompare(b.full_name)).map((user) => {
      const safe = clone(user); delete safe.password_salt; delete safe.password_hash; return safe;
    });
  }

  event(userId, action, actor, changes = {}) {
    const row = { id:crypto.randomUUID(), user_id:userId, action, actor_id:actor.actor_id,
      actor_role:actor.role, changes:clone(changes), occurred_at:new Date().toISOString() };
    this.events.push(row); return clone(row);
  }

  async createUser(input) {
    if (await this.findByEmail(input.email)) throw new InvalidTransitionError('Email already exists.');
    const now = new Date().toISOString();
    const user = {
      id:crypto.randomUUID(), actor_id:input.actor_id, email:emailOf(input.email),
      full_name:input.full_name, phone:input.phone || null, job_title:input.job_title || null,
      role:input.role, status:'active', password_salt:input.password_salt,
      password_hash:input.password_hash, must_change_password:true, auth_version:1,
      last_login_at:null, created_at:now, updated_at:now, created_by:input.actor.actor_id,
      updated_by:input.actor.actor_id
    };
    this.users.set(user.id, user);
    this.event(user.id, 'user_created', input.actor, { role:user.role, status:user.status });
    return clone(user);
  }

  activeOwnerCount(exceptId = null) {
    return [...this.users.values()].filter((user) => user.id !== exceptId
      && user.role === 'owner' && user.status === 'active').length;
  }

  async updateUser(input) {
    const user = this.users.get(input.user_id);
    if (!user) throw new InvalidTransitionError('User not found.');
    const nextRole = input.role || user.role;
    const nextStatus = input.status || user.status;
    if (user.role === 'owner' && (nextRole !== 'owner' || nextStatus !== 'active')
      && this.activeOwnerCount(user.id) === 0) throw new InvalidTransitionError('At least one active Owner is required.');
    if (input.email && emailOf(input.email) !== user.email) {
      const conflict = await this.findByEmail(input.email);
      if (conflict && conflict.id !== user.id) throw new InvalidTransitionError('Email already exists.');
    }
    const before = { email:user.email, full_name:user.full_name, phone:user.phone,
      job_title:user.job_title, role:user.role, status:user.status };
    Object.assign(user, {
      email:input.email ? emailOf(input.email) : user.email,
      full_name:input.full_name ?? user.full_name,
      phone:input.phone === undefined ? user.phone : input.phone || null,
      job_title:input.job_title === undefined ? user.job_title : input.job_title || null,
      role:nextRole, status:nextStatus, updated_at:new Date().toISOString(),
      updated_by:input.actor.actor_id
    });
    if (before.role !== user.role || before.status !== user.status) user.auth_version += 1;
    this.event(user.id, 'user_updated', input.actor, { before, after:{ email:user.email,
      full_name:user.full_name, phone:user.phone, job_title:user.job_title, role:user.role, status:user.status } });
    return clone(user);
  }

  async resetPassword(input) {
    const user = this.users.get(input.user_id);
    if (!user) throw new InvalidTransitionError('User not found.');
    user.password_salt = input.password_salt; user.password_hash = input.password_hash;
    user.must_change_password = true; user.auth_version += 1;
    user.updated_at = new Date().toISOString(); user.updated_by = input.actor.actor_id;
    this.event(user.id, 'password_reset', input.actor, { auth_version:user.auth_version });
    return clone(user);
  }

  async changePassword(input) {
    const user = this.users.get(input.user_id);
    if (!user || user.auth_version !== input.expected_auth_version) throw new InvalidTransitionError('Session is stale.');
    user.password_salt = input.password_salt; user.password_hash = input.password_hash;
    user.must_change_password = false; user.auth_version += 1;
    user.updated_at = new Date().toISOString(); user.updated_by = user.actor_id;
    this.event(user.id, 'password_changed', { actor_id:user.actor_id, role:user.role },
      { auth_version:user.auth_version });
    return clone(user);
  }

  async recordLogin(input) {
    const user = this.users.get(input.user_id); if (!user) return null;
    if (input.success) { user.last_login_at = new Date().toISOString(); user.updated_at = user.last_login_at; }
    this.event(user.id, input.success ? 'login_succeeded' : 'login_failed',
      { actor_id:input.success ? user.actor_id : 'anonymous', role:input.success ? user.role : 'anonymous' }, {});
    return clone(user);
  }

  async listEvents(userId) { return this.events.filter((event) => event.user_id === userId).map(clone); }
}

class SupabaseSystemUserStore {
  constructor(options = {}) {
    this.mode = 'durable_supabase'; this.url = String(options.url || '').replace(/\/$/, '');
    this.serviceRoleKey = String(options.serviceRoleKey || ''); this.fetch = options.fetch || globalThis.fetch;
    if (!this.url || !this.serviceRoleKey || typeof this.fetch !== 'function') throw new OperationalStorageUnavailableError();
  }

  async rpc(name, body = {}) {
    let response;
    try {
      response = await this.fetch(`${this.url}/rest/v1/rpc/${name}`, { method:'POST', headers:{
        ...supabaseHeaders(this.serviceRoleKey), Accept:'application/json', 'Content-Type':'application/json'
      }, body:JSON.stringify(body) });
    } catch (_) { throw new OperationalStorageUnavailableError(); }
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new OperationalStoreError('System user storage operation failed.', payload?.code || `storage_http_${response.status}`);
    return payload;
  }

  async findByEmail(email) { const rows = await this.rpc('a7_orlando_system_user_by_email', { p_email:emailOf(email) }); return rows?.[0] || null; }
  async findById(userId) { const rows = await this.rpc('a7_orlando_system_user_by_id', { p_user_id:userId }); return rows?.[0] || null; }
  async listUsers() { return this.rpc('a7_orlando_list_system_users'); }
  async listEvents(userId) { return this.rpc('a7_orlando_list_system_user_events', { p_user_id:userId }); }
  async createUser(input) { const rows = await this.rpc('a7_orlando_create_system_user', {
    p_actor_id:input.actor_id, p_email:input.email, p_full_name:input.full_name, p_phone:input.phone || null,
    p_job_title:input.job_title || null, p_role:input.role, p_password_salt:input.password_salt,
    p_password_hash:input.password_hash, p_admin_actor_id:input.actor.actor_id, p_admin_actor_role:input.actor.role
  }); return rows?.[0] || null; }
  async updateUser(input) { const rows = await this.rpc('a7_orlando_update_system_user', {
    p_user_id:input.user_id, p_email:input.email || null, p_full_name:input.full_name ?? null,
    p_phone:input.phone ?? null, p_job_title:input.job_title ?? null, p_role:input.role || null,
    p_status:input.status || null, p_admin_actor_id:input.actor.actor_id, p_admin_actor_role:input.actor.role
  }); return rows?.[0] || null; }
  async resetPassword(input) { const rows = await this.rpc('a7_orlando_reset_system_user_password', {
    p_user_id:input.user_id, p_password_salt:input.password_salt, p_password_hash:input.password_hash,
    p_admin_actor_id:input.actor.actor_id, p_admin_actor_role:input.actor.role
  }); return rows?.[0] || null; }
  async changePassword(input) { const rows = await this.rpc('a7_orlando_change_system_user_password', {
    p_user_id:input.user_id, p_expected_auth_version:input.expected_auth_version,
    p_password_salt:input.password_salt, p_password_hash:input.password_hash,
    p_actor_id:input.actor_id
  }); return rows?.[0] || null; }
  async recordLogin(input) { const rows = await this.rpc('a7_orlando_record_system_login', {
    p_user_id:input.user_id, p_success:Boolean(input.success)
  }); return rows?.[0] || null; }
}

function createSystemUserStore(options = {}) {
  if (options.store) return options.store;
  if (globalThis.__A7_SYSTEM_USER_STORE__) return globalThis.__A7_SYSTEM_USER_STORE__;
  const env = options.env || process.env;
  const supabase = resolveSupabaseConfig(env);
  if (env.A7_SYSTEM_USER_STORAGE_MODE === 'memory' || (env.NODE_ENV !== 'production' && !supabase)) {
    globalThis.__A7_SYSTEM_USER_STORE__ = new MemorySystemUserStore();
  } else if (supabase) {
    globalThis.__A7_SYSTEM_USER_STORE__ = new SupabaseSystemUserStore({ ...supabase, fetch:options.fetch });
  } else throw new OperationalStorageUnavailableError();
  return globalThis.__A7_SYSTEM_USER_STORE__;
}

function resetSystemUserStoreForTests() { delete globalThis.__A7_SYSTEM_USER_STORE__; }

module.exports = { MemorySystemUserStore, SupabaseSystemUserStore, createSystemUserStore,
  resetSystemUserStoreForTests, emailOf, validRole };
