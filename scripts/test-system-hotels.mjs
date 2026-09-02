import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../lib/system-auth.js');
const { MemoryOperationalStore, resetOperationalStoreForTests } = require('../lib/operational-store.js');
const { systemHotelService } = require('../lib/system-hotel-service.js');
const { systemOrderService } = require('../lib/system-order-service.js');
const hotelsApi = require('../api/system/hotels.js');

const OWNER = { actor_id:'actor_hotel_owner', display_name:'Hotel Owner', role:'owner' };
const OPERATOR = { actor_id:'actor_hotel_operator', display_name:'Hotel Operator', role:'operator' };

function orderPayload(hotelId) {
  return { submission_id:crypto.randomUUID(), name:'Hotel Guest', whatsapp_number:'14075550991', language:'en',
    customer_type:'guest', accommodation_type:'hotel', hotel_id:hotelId, property:'Forged Hotel', property_address:'Wrong address',
    room:'1201', location_notes:'Bell Services', pickup_location:'bell_services', bags_expected:1, care_options:[],
    service_tier:'normal', agreed_minimum_amount:50, pickup_window_start:'2026-09-01T15:00:00.000Z',
    pickup_window_end:'2026-09-01T16:00:00.000Z', needed_by:'2026-09-02T15:00:00.000Z', order_notes:'',
    lead_reference:'', items:[{ code:'wash_fold', estimated_lbs:12 }] };
}

function response() {
  return { statusCode:200, headers:{}, payload:null, setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(value) { this.statusCode = value; return this; }, json(value) { this.payload = value; return this; } };
}

test('hotel directory is Owner-managed, idempotent and duplicate-safe', async () => {
  const store = new MemoryOperationalStore();
  const hotels = systemHotelService({ operationalStore:store });
  await assert.rejects(() => hotels.save({ canonical_name:'Signia', address_line:'14100 Bonnet Creek Resort Lane' }, OPERATOR), /Owner/);
  const request = { canonical_name:'Signia by Hilton Orlando Bonnet Creek', address_line:'14100 Bonnet Creek Resort Lane, Orlando, FL 32821',
    region:'Bonnet Creek', aliases:'Signia Bonnet Creek, Hilton Bonnet Creek', idempotency_key:'hotel:test:1' };
  const created = await hotels.save(request, OWNER);
  const retry = await hotels.save(request, OWNER);
  assert.equal(retry.hotel_id, created.hotel_id);
  assert.equal(store.hotels.size, 1);
  await assert.rejects(() => hotels.save({ ...request, canonical_name:'Other', idempotency_key:'hotel:test:2' }, OWNER), /already exists/);
  const rows = await hotels.list({ query:'hilton' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].canonical_name, request.canonical_name);
});

test('new hotel order freezes governed hotel identity and canonical snapshot', async () => {
  const store = new MemoryOperationalStore();
  const hotels = systemHotelService({ operationalStore:store });
  const hotel = await hotels.save({ canonical_name:'Signia by Hilton Orlando Bonnet Creek',
    address_line:'14100 Bonnet Creek Resort Lane, Orlando, FL 32821', idempotency_key:'hotel:test:order' }, OWNER);
  const orders = systemOrderService({ operationalStore:store });
  const created = await orders.createManualOrder(orderPayload(hotel.hotel_id), OPERATOR);
  const order = [...store.orders.values()].find((row) => row.order_number === created.order_number);
  const lead = store.leads.get(order.lead_id);
  assert.equal(order.hotel_id, hotel.hotel_id);
  assert.equal(lead.hotel_id, hotel.hotel_id);
  assert.equal(lead.operational_data.hotel_id, hotel.hotel_id);
  assert.equal(lead.operational_data.property, hotel.canonical_name);
  assert.equal(lead.operational_data.property_address, hotel.address_line);
  await assert.rejects(() => orders.createManualOrder(orderPayload(crypto.randomUUID()), OPERATOR), /Active hotel not found/);
});

test('hotel API allows team reads and fails closed for Operator writes', async () => {
  const prior = { secret:process.env.A7_SYSTEM_SESSION_SECRET, mode:process.env.A7_SYSTEM_ACCESS_MODE, node:process.env.NODE_ENV };
  process.env.A7_SYSTEM_SESSION_SECRET = 'hotel-local-session-secret-at-least-32-bytes';
  process.env.A7_SYSTEM_ACCESS_MODE = 'team'; process.env.NODE_ENV = 'test';
  const store = new MemoryOperationalStore(); globalThis.__A7_OPERATIONAL_STORE__ = store;
  try {
    const cookie = (actor, submission) => [`${auth.COOKIE_NAME}=${encodeURIComponent(auth.signSession(actor, process.env))}`,
      submission ? `${auth.SUBMISSION_COOKIE_NAME}=${encodeURIComponent(submission.token)}` : null].filter(Boolean).join('; ');
    const listRes = response();
    await hotelsApi({ method:'POST', headers:{ cookie:cookie(OPERATOR), origin:'http://localhost:3000' }, body:{ action:'list' } }, listRes);
    assert.equal(listRes.statusCode, 200);
    const operatorSave = response();
    await hotelsApi({ method:'POST', headers:{ cookie:cookie(OPERATOR), origin:'http://localhost:3000' },
      body:{ action:'save', canonical_name:'Blocked Hotel', address_line:'12345 Test Road' } }, operatorSave);
    assert.equal(operatorSave.statusCode, 403);
    const submission = auth.issueSubmission(process.env);
    const ownerSave = response();
    await hotelsApi({ method:'POST', headers:{ cookie:cookie(OWNER, submission), origin:'http://localhost:3000' },
      body:{ action:'save', canonical_name:'Owner Hotel', address_line:'12345 Owner Road' } }, ownerSave);
    assert.equal(ownerSave.statusCode, 201);
    assert.equal(store.hotels.size, 1);
  } finally {
    resetOperationalStoreForTests();
    for (const [key, value] of Object.entries({ A7_SYSTEM_SESSION_SECRET:prior.secret, A7_SYSTEM_ACCESS_MODE:prior.mode, NODE_ENV:prior.node })) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('hotel release remains additive, private and wired into the private UI', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20260901010000_orlando_os_hotel_directory.sql', import.meta.url), 'utf8');
  const html = fs.readFileSync(new URL('../sistema.html', import.meta.url), 'utf8');
  const js = fs.readFileSync(new URL('../sistema.js', import.meta.url), 'utf8');
  assert.match(sql, /add column if not exists hotel_id/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all .* anon, authenticated/s);
  assert.doesNotMatch(sql, /update public\.a7_orlando_(?:leads|orders)/i);
  assert.match(html, /id="hotelSelect"/);
  assert.match(html, /Hotel não cadastrado/);
  assert.match(js, /property_address\.value = hotel\.address_line/);
});
