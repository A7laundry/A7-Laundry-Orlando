import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createRouteInput, addStopInput, reorderInput, etaInput, stopActionInput, exceptionInput,
  pickupEligible, deliveryEligible, routeIdempotency, requireRouteActor, systemRouteService } = require('../lib/system-route-service.js');
const auth = require('../lib/system-auth.js');
const routesApi = require('../api/system/routes.js');
const w3dSmokeApi = require('../api/system/w3d-smoke.js');
const { systemW3dSmokeService } = require('../lib/system-w3d-smoke-service.js');
const owner = { actor_id:'owner-1', role:'owner' };
const manager = { actor_id:'manager-1', role:'manager' };
const uuidA = '11111111-1111-4111-8111-111111111111';
const uuidB = '22222222-2222-4222-8222-222222222222';
const request = '33333333-3333-4333-8333-333333333333';

function response() {
  return { statusCode:200, headers:{}, payload:null,
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; } };
}

test('W3-D permits Owner and Manager but denies Operator', () => {
  assert.equal(requireRouteActor(owner), owner); assert.equal(requireRouteActor(manager), manager);
  assert.throws(() => requireRouteActor({ actor_id:'operator-1', role:'operator' }), /Owner or Manager/);
});
test('W3-D validates minimal route and stop identities', () => {
  assert.deepEqual(createRouteInput({ route_date:'2026-09-02', driver_id:uuidA, request_id:request }),
    { route_date:'2026-09-02', driver_id:uuidA, request_id:request });
  assert.deepEqual(addStopInput({ route_id:uuidA, order_number:'MCO 1003', stop_type:'PICKUP', request_id:request }),
    { route_id:uuidA, order_number:'MCO 1003', stop_type:'pickup', eta_at:null, request_id:request });
  assert.throws(() => createRouteInput({ route_date:'2026-02-31', driver_id:uuidA, request_id:request }), /date/);
});
test('W3-D reorder requires a complete unique versioned sequence', () => {
  assert.deepEqual(reorderInput({ route_id:uuidA, stop_ids:[uuidA, uuidB], version:2, request_id:request }).stop_ids, [uuidA, uuidB]);
  assert.throws(() => reorderInput({ route_id:uuidA, stop_ids:[uuidA, uuidA], version:2, request_id:request }), /unique/);
});
test('W3-D manual ETA is optional, versioned and normalized', () => {
  assert.equal(etaInput({ route_id:uuidA, stop_id:uuidB, eta_at:'2026-09-02T14:30:00-04:00', version:3, request_id:request }).eta_at,
    '2026-09-02T18:30:00.000Z');
  assert.equal(etaInput({ route_id:uuidA, stop_id:uuidB, eta_at:null, version:3, request_id:request }).eta_at, null);
  assert.throws(() => etaInput({ route_id:uuidA, stop_id:uuidB, eta_at:'soon', version:3, request_id:request }), /ETA/);
});
test('W3-D accepts only canonical order transition names at stops', () => {
  assert.equal(stopActionInput({ route_id:uuidA, stop_id:uuidB, action:'confirm_pickup', request_id:request }).action, 'confirm_pickup');
  assert.throws(() => stopActionInput({ route_id:uuidA, stop_id:uuidB, action:'collected', request_id:request }), /invalid/);
});
test('W3-D exception requires governed reason and note for other', () => {
  assert.equal(exceptionInput({ route_id:uuidA, stop_id:uuidB, reason:'wrong_location', request_id:request }).reason, 'wrong_location');
  assert.throws(() => exceptionInput({ route_id:uuidA, stop_id:uuidB, reason:'other', request_id:request }), /reason/);
});
test('W3-D derives pickup and delivery eligibility only from order truth', () => {
  assert.equal(pickupEligible({ order_status:'pickup_scheduled', custody_state:'awaiting_pickup', is_qa:false }), true);
  assert.equal(pickupEligible({ order_status:'picked_up', custody_state:'with_driver_pickup', is_qa:false }), false);
  assert.equal(deliveryEligible({ order_status:'ready_for_delivery', custody_state:'at_laundry', production_state:'ready', payment_status:'paid', is_qa:false }), true);
  assert.equal(deliveryEligible({ order_status:'ready_for_delivery', custody_state:'at_laundry', production_state:'ready', payment_status:'invoice_created', is_qa:false }), false);
});
test('W3-D idempotency is stable and scope-bound', () => {
  const input = { route_id:uuidA, request_id:request };
  assert.equal(routeIdempotency('start', input), routeIdempotency('start', input));
  assert.notEqual(routeIdempotency('start', input), routeIdempotency('complete', input));
});
test('W3-D migration is additive, protected and contains no duplicate order facts', async () => {
  const fs = await import('node:fs/promises');
  const sql = await fs.readFile(new URL('../supabase/migrations/20260902018000_orlando_os_w3d_routes_lite.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.a7_orlando_routes/);
  assert.match(sql, /a7_orlando_route_stops_active_leg_idx/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all .* from public, anon, authenticated/s);
  assert.doesNotMatch(sql, /customer_name|phone|address|room|payment_status|production_state|custody_state/);
});

test('W3-D exceptional rollback is evidence-guarded and ordered behind application rollback', async () => {
  const fs = await import('node:fs/promises');
  const [authority, schema] = await Promise.all([
    fs.readFile(new URL('../supabase/rollbacks/20260902018001_orlando_os_w3d_route_authority.rollback.sql', import.meta.url), 'utf8'),
    fs.readFile(new URL('../supabase/rollbacks/20260902018000_orlando_os_w3d_routes_lite.rollback.sql', import.meta.url), 'utf8')
  ]);
  assert.match(authority, /Rollback blocked: W3-D route evidence exists/);
  assert.match(authority, /drop function if exists public\.a7_orlando_w3d_transactional_smoke/);
  assert.match(authority, /drop function if exists public\.a7_orlando_route_command/);
  assert.match(schema, /preserve append-only operational history/);
  assert.match(schema, /drop table if exists public\.a7_orlando_route_events[\s\S]*route_stops[\s\S]*routes/);
  assert.doesNotMatch(`${authority}\n${schema}`, /delete from|truncate/i);
});

test('W3-D concurrency probe is disposable-only and verifies one canonical result', async () => {
  const fs = await import('node:fs/promises');
  const [setup, verify, runner] = await Promise.all([
    fs.readFile(new URL('./test-system-routes-concurrency.sql', import.meta.url), 'utf8'),
    fs.readFile(new URL('./test-system-routes-concurrency-verify.sql', import.meta.url), 'utf8'),
    fs.readFile(new URL('./test-system-routes-concurrency.sh', import.meta.url), 'utf8')
  ]);
  assert.match(setup, /current_database\(\) !~ '\^a7_w3d_'/);
  assert.match(runner, /owner-concurrency[\s\S]*&[\s\S]*manager-concurrency[\s\S]*&/);
  assert.match(runner, /wait "\$owner_pid"[\s\S]*wait "\$manager_pid"/);
  assert.match(verify, /a7_orlando_operational_events[\s\S]*action='confirm_pickup'/);
  assert.match(verify, /custody_state[\s\S]*with_driver_pickup/);
});

test('W3-D service sends validated commands and actor evidence to the store', async () => {
  const seen = [];
  const routeStore = {
    createRoute:async (input) => { seen.push(['create', input]); return { duplicate:false }; },
    startRoute:async (input) => { seen.push(['start', input]); return { duplicate:false }; }
  };
  const service = systemRouteService({ routeStore, now:() => new Date('2026-09-02T12:00:00Z') });
  await service.create({ route_date:'2026-09-02', driver_id:uuidA, request_id:request }, manager);
  await service.start({ route_id:uuidA, version:1, request_id:request }, manager);
  assert.equal(seen[0][1].actor_role, 'manager');
  assert.equal(seen[0][1].occurred_at, '2026-09-02T12:00:00.000Z');
  assert.match(seen[1][1].idempotency_key, /^route-start:/);
});

test('W3-D validates route filters before storage reads', async () => {
  const seen = [];
  const routeStore = {
    listRoutes:async (input) => { seen.push(['list', input]); return []; },
    listEligibleStops:async (input) => { seen.push(['eligible', input]); return { pickup:[], delivery:[] }; }
  };
  const service = systemRouteService({ routeStore });
  await service.list({ route_date:'2026-09-02' }, owner);
  await service.eligible({ route_id:uuidA }, manager);
  assert.deepEqual(seen, [['list', { route_date:'2026-09-02' }], ['eligible', { route_id:uuidA }]]);
  await assert.rejects(() => service.list({ route_date:'2026-02-31' }, owner), /date/);
  await assert.rejects(() => service.eligible({ route_id:'not-a-route' }, manager), /identity/);
});

test('W3-D API and UI remain private and expose the approved Owner/Manager menu', async () => {
  const fs = await import('node:fs/promises');
  const [api, html, js, css, sql] = await Promise.all([
    fs.readFile(new URL('../api/system/routes.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../sistema.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../sistema.js', import.meta.url), 'utf8'),
    fs.readFile(new URL('../sistema-routes.css', import.meta.url), 'utf8'),
    fs.readFile(new URL('../supabase/migrations/20260902018001_orlando_os_w3d_route_authority.sql', import.meta.url), 'utf8')
  ]);
  assert.match(api, /requireSession\(req, res, \['owner', 'manager'\]\)/);
  assert.match(api, /allowedOrigin\(req\)/);
  assert.match(api, /submissionFromRequest\(req\)/);
  assert.match(html, /id="routesNav" class="manager-access" type="button">Rotas/);
  assert.doesNotMatch(html, /id="routesNav"[^>]+(?:disabled|data-permanent-disabled)/);
  assert.match(js, /operation-draft/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(sql, /a7_orlando_operational_cycle_transition_v2/);
  assert.match(sql, /public\.a7_orlando_order_is_qa\(o\.id\)/);
  assert.match(sql, /p_command = 'set_eta'/);
  assert.match(sql, /p_command = 'cancel'/);
  assert.match(sql, /a7_orlando_w3d_transactional_smoke/);
  assert.match(sql, /pg_advisory_xact_lock\(hashtext\('a7-orlando-w3d-transactional-smoke'\)\)/);
  assert.match(sql, /delete from public\.a7_orlando_route_events[\s\S]+residue_count/s);
  assert.match(sql, /grant execute on function public\.a7_orlando_w3d_transactional_smoke[^;]+service_role/s);
  assert.doesNotMatch(sql, /insert into public\.a7_orlando_(payments|refunds|stripe_events)/);
  assert.match(js, /ETA indisponível/);
  assert.match(js, /Histórico da rota/);
  assert.doesNotMatch(api, /\b(?:custody_state|production_state|payment_status)\s*=(?!=)/);
});

test('W3-D Production probe validates every safe result and remains Owner-only', async () => {
  const good = {
    passed:true, create_retry_duplicate:true, pickup_retry_duplicate:true,
    route_completed:true, pickup_event_count:1, delivery_completed:true,
    bell_desk_intermediate:true, exception_preserved_order:true,
    exception_requeued:true, residue_count:0
  };
  const service = systemW3dSmokeService({ operationalStore:{ runW3dSmokeProbe:async () => good } });
  assert.deepEqual(await service.run(owner, request), good);
  await assert.rejects(() => service.run({ actor_id:'manager-1', role:'manager' }, request), /Owner authorization/);
  await assert.rejects(() => systemW3dSmokeService({ operationalStore:{
    runW3dSmokeProbe:async () => ({ ...good, residue_count:1 })
  } }).run(owner, request), /every gate/);
});

test('W3-D Production probe endpoint is Owner-only, same-origin and submission-bound', async () => {
  const previous = {
    secret:process.env.A7_SYSTEM_SESSION_SECRET,
    mode:process.env.A7_SYSTEM_ACCESS_MODE,
    node:process.env.NODE_ENV,
    store:globalThis.__A7_OPERATIONAL_STORE__
  };
  process.env.A7_SYSTEM_SESSION_SECRET = 'w3d-smoke-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  process.env.NODE_ENV = 'test';
  const safeResult = {
    passed:true, create_retry_duplicate:true, pickup_retry_duplicate:true,
    route_completed:true, pickup_event_count:1, delivery_completed:true,
    bell_desk_intermediate:true, exception_preserved_order:true,
    exception_requeued:true, residue_count:0
  };
  globalThis.__A7_OPERATIONAL_STORE__ = { runW3dSmokeProbe:async () => safeResult };
  try {
    const unauthenticated = response();
    await w3dSmokeApi({ method:'POST', headers:{}, body:{ confirm:'W3D_TRANSACTIONAL_SMOKE' } }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);

    const managerToken = auth.signSession({ actor_id:'manager-routes', display_name:'Manager', role:'manager' });
    const managerResponse = response();
    await w3dSmokeApi({ method:'POST', headers:{
      origin:'https://a7laundry.com', cookie:`${auth.COOKIE_NAME}=${encodeURIComponent(managerToken)}`
    }, body:{ confirm:'W3D_TRANSACTIONAL_SMOKE' } }, managerResponse);
    assert.equal(managerResponse.statusCode, 403);

    const ownerToken = auth.signSession({ actor_id:'owner-routes', display_name:'Owner', role:'owner' });
    const missingSubmission = response();
    await w3dSmokeApi({ method:'POST', headers:{
      origin:'https://a7laundry.com', cookie:`${auth.COOKIE_NAME}=${encodeURIComponent(ownerToken)}`
    }, body:{ confirm:'W3D_TRANSACTIONAL_SMOKE' } }, missingSubmission);
    assert.equal(missingSubmission.statusCode, 409);

    const submission = auth.issueSubmission();
    const success = response();
    await w3dSmokeApi({ method:'POST', headers:{
      origin:'https://a7laundry.com',
      cookie:`${auth.COOKIE_NAME}=${encodeURIComponent(ownerToken)}; ${auth.SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}`
    }, body:{ confirm:'W3D_TRANSACTIONAL_SMOKE' } }, success);
    assert.equal(success.statusCode, 200);
    assert.equal(success.payload.result.passed, true);
    assert.equal(success.payload.result.residue_count, 0);
    assert.match(String(success.headers['set-cookie']), /Max-Age=0/);
  } finally {
    for (const [key, value] of Object.entries({
      A7_SYSTEM_SESSION_SECRET:previous.secret,
      A7_SYSTEM_ACCESS_MODE:previous.mode,
      NODE_ENV:previous.node
    })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
    if (previous.store == null) delete globalThis.__A7_OPERATIONAL_STORE__;
    else globalThis.__A7_OPERATIONAL_STORE__ = previous.store;
  }
});

test('W3-D route API denies unauthenticated and Operator requests server-side', async () => {
  const previous = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE,
    node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'routes-api-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team';
  process.env.NODE_ENV = 'test';
  try {
    const unauthenticated = response();
    await routesApi({ method:'POST', headers:{ origin:'http://localhost:3000' }, body:{ action:'list' } }, unauthenticated);
    assert.equal(unauthenticated.statusCode, 401);
    assert.equal(unauthenticated.payload.code, 'unauthorized');

    const operatorToken = auth.signSession({ actor_id:'operator-routes', display_name:'Operator', role:'operator' }, process.env);
    const operator = response();
    await routesApi({ method:'POST', headers:{
      cookie:`${auth.COOKIE_NAME}=${encodeURIComponent(operatorToken)}`, origin:'http://localhost:3000'
    }, body:{ action:'list' } }, operator);
    assert.equal(operator.statusCode, 403);
    assert.equal(operator.payload.code, 'forbidden');
  } finally {
    for (const [key, value] of Object.entries({ A7_SYSTEM_SESSION_SECRET:previous.secret,
      A7_SYSTEM_ACCESS_MODE:previous.mode, NODE_ENV:previous.node })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('W3-D CLI exposes route reads and keeps every route mutation behind --execute', async () => {
  const fs = await import('node:fs/promises');
  const cli = await fs.readFile(new URL('./a7-system-operational-cycle.mjs', import.meta.url), 'utf8');
  assert.match(cli, /systemRouteService/);
  for (const command of ['routes:list', 'route:detail', 'route:eligible', 'route:create', 'route:add-stop',
    'route:remove-stop', 'route:reorder', 'route:set-eta', 'route:start', 'route:stop', 'route:exception',
    'route:complete', 'route:cancel']) assert.match(cli, new RegExp(command.replace(':', '\\:')));
  assert.match(cli, /writes\.has\(command\) && !flag\('--execute'\)/);
});
