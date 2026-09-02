import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createRouteInput, addStopInput, reorderInput, etaInput, stopActionInput, exceptionInput,
  pickupEligible, deliveryEligible, routeIdempotency, requireRouteActor, systemRouteService } = require('../lib/system-route-service.js');
const owner = { actor_id:'owner-1', role:'owner' };
const manager = { actor_id:'manager-1', role:'manager' };
const uuidA = '11111111-1111-4111-8111-111111111111';
const uuidB = '22222222-2222-4222-8222-222222222222';
const request = '33333333-3333-4333-8333-333333333333';

test('W3-D permits Owner and Manager but denies Operator', () => {
  assert.equal(requireRouteActor(owner), owner); assert.equal(requireRouteActor(manager), manager);
  assert.throws(() => requireRouteActor({ actor_id:'operator-1', role:'operator' }), /Owner or Manager/);
});
test('W3-D validates minimal route and stop identities', () => {
  assert.deepEqual(createRouteInput({ route_date:'2026-09-02', driver_id:uuidA, request_id:request }),
    { route_date:'2026-09-02', driver_id:uuidA, request_id:request });
  assert.deepEqual(addStopInput({ route_id:uuidA, order_number:'MCO 1003', stop_type:'PICKUP', request_id:request }),
    { route_id:uuidA, order_number:'MCO 1003', stop_type:'pickup', eta_at:null, request_id:request });
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

test('W3-D API and UI remain private and menu-gated during development', async () => {
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
  assert.match(html, /id="routesNav"[^>]+disabled[^>]+data-permanent-disabled/);
  assert.match(js, /operation-draft/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(sql, /a7_orlando_operational_cycle_transition_v2/);
  assert.match(sql, /p_command = 'set_eta'/);
  assert.match(sql, /p_command = 'cancel'/);
  assert.match(js, /ETA indisponível/);
  assert.match(js, /Histórico da rota/);
  assert.doesNotMatch(api, /\b(?:custody_state|production_state|payment_status)\s*=(?!=)/);
});
