import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../lib/system-auth.js');
const { CAPABILITIES, can } = require('../lib/system-rbac.js');
const { MemorySystemUserStore } = require('../lib/system-user-store.js');
const { systemUserService } = require('../lib/system-user-service.js');
const usersApi = require('../api/system/users.js');
const passwordApi = require('../api/system/password.js');
const loginApi = require('../api/system/login.js');

function response() {
  return { statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; } };
}
function request(body = {}, cookie = '') {
  return { method:'POST', headers:{ origin:'https://a7laundry.com', cookie }, body,
    socket:{ remoteAddress:'127.0.0.1' } };
}
function cookieFor(actor) {
  return `${auth.COOKIE_NAME}=${encodeURIComponent(auth.signSession(actor))}`;
}
function owner() { return { actor_id:'actor_owner_legacy_123456', display_name:'Owner QA', role:'owner', auth_source:'legacy' }; }

async function fixture() {
  const store = new MemorySystemUserStore(); globalThis.__A7_SYSTEM_USER_STORE__ = store;
  const service = systemUserService({ userStore:store });
  const manager = await service.create({ full_name:'Andreia Batista Batemarque',
    phone:'+14075550123', email:'andreiabatemarque@gmail.com', job_title:'Gestora', role:'manager' }, owner());
  const operator = await service.create({ full_name:'Operator QA', phone:'+14075550124',
    email:'operator.qa@example.com', job_title:'Operadora', role:'operator' }, owner());
  return { store, service, manager, operator };
}

test.beforeEach(() => {
  process.env.A7_SYSTEM_SESSION_SECRET = 'team-access-test-session-secret-1234567890';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team'; process.env.A7_SYSTEM_USER_STORAGE_MODE = 'memory';
  process.env.NODE_ENV = 'test'; delete globalThis.__A7_SYSTEM_USER_STORE__;
});
test.afterEach(() => {
  delete globalThis.__A7_SYSTEM_USER_STORE__;
  delete process.env.A7_SYSTEM_LEGACY_OWNER_FALLBACK;
  delete process.env.A7_SYSTEM_USERS_JSON;
});

test('Owner creates manager/operator with one-time temporary credentials and no stored plaintext', async () => {
  const { store, manager, operator } = await fixture();
  assert.equal(manager.user.role, 'manager'); assert.equal(operator.user.role, 'operator');
  assert.match(manager.temporary_password, /[A-Z]/); assert.match(manager.temporary_password, /\d/);
  assert.equal(manager.user.must_change_password, true);
  const stored = await store.findByEmail('andreiabatemarque@gmail.com');
  assert.notEqual(stored.password_hash, manager.temporary_password);
  assert.equal(JSON.stringify(store.events).includes(manager.temporary_password), false);
  assert.equal(store.events.filter((event) => event.action === 'user_created').length, 2);
});

test('database login is revalidated, forces password change and rotates the session version', async () => {
  const { store, manager } = await fixture();
  const loginRes = response();
  await loginApi(request({ email:manager.user.email, password:manager.temporary_password }), loginRes);
  assert.equal(loginRes.statusCode, 200); assert.equal(loginRes.payload.user.role, 'manager');
  assert.equal(loginRes.payload.user.must_change_password, true);
  const loginCookie = String(loginRes.headers['set-cookie']).split(';')[0];
  const passwordRes = response();
  await passwordApi(request({ current_password:manager.temporary_password,
    new_password:'NewManager!Pass2026' }, loginCookie), passwordRes);
  assert.equal(passwordRes.statusCode, 200); assert.equal(passwordRes.payload.user.must_change_password, false);
  const oldSession = await auth.sessionFromRequestAsync({ headers:{ cookie:loginCookie } }, { userStore:store });
  assert.equal(oldSession, null, 'credential rotation must revoke the temporary-password session');
  const newCookie = String(passwordRes.headers['set-cookie']).split(';')[0];
  const current = await auth.sessionFromRequestAsync({ headers:{ cookie:newCookie } }, { userStore:store });
  assert.equal(current.role, 'manager'); assert.equal(current.must_change_password, false);
  const stored = await store.findByEmail(manager.user.email);
  assert.ok(stored.last_login_at); assert.equal(stored.auth_version, 2);
  assert.deepEqual(store.events.map((event) => event.action).filter((action) => /login|password_changed/.test(action)),
    ['login_succeeded', 'password_changed']);
});

test('Manager and Operator receive 403 from Owner-only team administration', async () => {
  const { store, manager, operator } = await fixture();
  for (const created of [manager, operator]) {
    const user = await store.findByEmail(created.user.email);
    user.must_change_password = false; store.users.set(user.id, user);
    const actor = auth.persistentActor(user); const res = response();
    await usersApi(request({ action:'list' }, cookieFor(actor)), res);
    assert.equal(res.statusCode, 403); assert.equal(res.payload.code, 'forbidden');
  }
});

test('Manager contract includes governed payment authority but excludes team, security and unapplied W2 messaging', () => {
  assert.equal(can('manager', CAPABILITIES.PAYMENT_MANAGE), true);
  assert.equal(can('manager', CAPABILITIES.TEAM_MANAGE), false);
  assert.equal(can('manager', CAPABILITIES.SECURITY_MANAGE), false);
  assert.equal(can('manager', CAPABILITIES.MESSAGE_MANAGE), false);
});

test('inactive user cannot log in and an existing database session is revoked', async () => {
  const { store, service, operator } = await fixture();
  let user = await store.findByEmail(operator.user.email); user.must_change_password = false; store.users.set(user.id, user);
  const cookie = cookieFor(auth.persistentActor(user));
  await service.update({ user_id:user.id, status:'inactive' }, owner());
  assert.equal(await auth.sessionFromRequestAsync({ headers:{ cookie } }, { userStore:store }), null);
  const loginRes = response();
  await loginApi(request({ email:operator.user.email, password:operator.temporary_password }), loginRes);
  assert.equal(loginRes.statusCode, 401);
  assert.equal((await store.findByEmail(operator.user.email)).status, 'inactive');
  assert.ok(store.events.some((event) => event.action === 'login_failed'));
});

test('role/status changes and resets are audited while the persistent actor remains stable', async () => {
  const { store, service, operator } = await fixture();
  const before = await store.findByEmail(operator.user.email);
  const promoted = await service.update({ user_id:before.id, role:'manager', job_title:'Shift Manager' }, owner());
  const reset = await service.resetPassword(before.id, owner());
  assert.equal(promoted.actor_id, before.actor_id); assert.equal(reset.user.actor_id, before.actor_id);
  assert.equal(reset.user.must_change_password, true); assert.ok(reset.temporary_password);
  const history = await service.history(before.id, owner());
  assert.deepEqual(history.map((event) => event.action), ['user_created', 'user_updated', 'password_reset']);
  assert.equal(JSON.stringify(history).includes(reset.temporary_password), false);
});

test('legacy Owner remains valid during database cutover', async () => {
  const salt = 'legacy-owner-salt'; const password = 'LegacyOwner!2026';
  process.env.A7_SYSTEM_USERS_JSON = JSON.stringify([{ email:'owner@example.com', display_name:'Owner', role:'owner',
    password_salt:salt, password_hash:auth.passwordHash(password, salt) }]);
  const actor = await auth.authenticateHybrid('owner@example.com', password, { userStore:new MemorySystemUserStore() });
  assert.equal(actor.role, 'owner'); assert.equal(actor.auth_source, 'legacy');
  delete process.env.A7_SYSTEM_USERS_JSON;
});

test('legacy Owner fallback can be retired only through the explicit cutover switch', async () => {
  const salt = 'legacy-owner-salt'; const password = 'LegacyOwner!2026';
  process.env.A7_SYSTEM_USERS_JSON = JSON.stringify([{ email:'owner@example.com', display_name:'Owner', role:'owner',
    password_salt:salt, password_hash:auth.passwordHash(password, salt) }]);
  process.env.A7_SYSTEM_LEGACY_OWNER_FALLBACK = 'disabled';
  const unavailableStore = { async findByEmail() { throw new Error('storage unavailable'); } };
  const actor = await auth.authenticateHybrid('owner@example.com', password, { userStore:unavailableStore });
  assert.equal(actor, null);
  delete process.env.A7_SYSTEM_LEGACY_OWNER_FALLBACK;
  delete process.env.A7_SYSTEM_USERS_JSON;
});
