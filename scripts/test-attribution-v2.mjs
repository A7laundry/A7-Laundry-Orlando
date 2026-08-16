import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {inventoryCtas} from './inventory-ctas.mjs';
import {scanBusinessDestinations} from './guard-business-destinations.mjs';

const require = createRequire(import.meta.url);
const attribution = require('../a7-attribution.js');
const business = require('../a7-business-config.js');
const events = require('../a7-events.js');
const handler = require('../api/attribution/session.js');
const {RETENTION_DAYS} = require('../lib/attribution-store.js');

function deterministicCrypto(seed = 0) {
  return {getRandomValues(bytes) { for (let index = 0; index < bytes.length; index += 1) bytes[index] = (seed + index * 37) & 255; return bytes; }};
}

const organic = attribution.captureTouch({url: 'https://a7laundry.com/plans', referrer: 'https://www.google.com/search?q=laundry', initial: true, timestamp: '2026-08-07T12:00:00.000Z'});
assert.equal(organic.entry_type, 'referral');
assert.equal(organic.referrer_host, 'google.com');
assert.equal(organic.source, 'google-organic');

const paid = attribution.captureTouch({url: 'https://a7laundry.com/laundry-pickup-delivery-orlando?gclid=SYNTHETIC-CLICK&utm_source=google&utm_medium=cpc&utm_campaign=guest', initial: true});
assert.equal(paid.click_ids.gclid, 'SYNTHETIC-CLICK');
assert.equal(paid.source, 'google');

const ids = {
  attribution_id: attribution.generateAttributionId(deterministicCrypto(7)),
  short_ref: attribution.generateShortRef(deterministicCrypto(9))
};
assert.match(ids.attribution_id, /^at_[a-f0-9]{32}$/);
assert.match(ids.short_ref, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
assert.ok(!ids.short_ref.includes('SYNTHETIC'));

const firstRecord = attribution.mergeRecord(null, paid, ids);
const internal = attribution.captureTouch({url: 'https://a7laundry.com/plans', referrer: 'https://a7laundry.com/', initial: false});
const afterInternal = attribution.mergeRecord(firstRecord, internal);
assert.deepEqual(afterInternal.first_touch, firstRecord.first_touch, 'Internal navigation must preserve first touch.');
assert.deepEqual(afterInternal.last_touch, firstRecord.last_touch, 'Internal navigation must not become last touch.');

const newCampaign = attribution.captureTouch({url: 'https://a7laundry.com/plans?utm_source=meta&utm_medium=paid-social&utm_campaign=returning', initial: false});
const afterCampaign = attribution.mergeRecord(afterInternal, newCampaign);
assert.deepEqual(afterCampaign.first_touch, firstRecord.first_touch, 'A new campaign must not overwrite first touch.');
assert.equal(afterCampaign.last_touch.source, 'meta');
assert.equal(afterCampaign.last_touch.campaign, 'returning');

const wa = business.buildWhatsAppUrl('Hello', ids.short_ref);
assert.equal(new URL(wa).pathname, `/${business.whatsappNumber}`);
assert.match(new URL(wa).searchParams.get('text'), new RegExp(`A7 Ref: ${ids.short_ref}$`));
assert.ok(!wa.includes('SYNTHETIC-CLICK'));
assert.equal(new URL(business.buildWhatsAppUrl('Hello')).pathname, `/${business.whatsappNumber}`);

const cleanEvent = events.safePayload({gclid: 'must-not-leak', utm_campaign: 'must-not-leak', lead_reference: ids.short_ref});
assert.equal(cleanEvent.gclid, undefined);
assert.equal(cleanEvent.utm_campaign, undefined);
assert.equal(cleanEvent.lead_reference, ids.short_ref);

function mockResponse() {
  return {
    headers: {}, statusCode: 0, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

const req = {
  method: 'POST',
  headers: {'content-type': 'application/json', origin: 'https://a7laundry.com', 'x-forwarded-for': '203.0.113.7'},
  body: {version: 2, touch: paid, consent: {durable_storage: 'unknown'}},
  socket: {}
};
const res = mockResponse();
await handler(req, res);
assert.equal(res.statusCode, 200);
assert.match(res.body.attribution_id, /^at_[a-f0-9]{32}$/);
assert.match(res.body.short_ref, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/);
assert.deepEqual(res.body.click_id_present, {gclid: true, gbraid: false, wbraid: false});
assert.equal(res.body.storage_mode, 'shadow_ephemeral');
assert.equal(res.headers['set-cookie'], undefined, 'Unknown consent must not create a persistent attribution cookie.');
assert.ok(!JSON.stringify(res.body).includes('SYNTHETIC-CLICK'), 'API response must expose only click-ID presence.');

const restoreReq = {...req, body: {...req.body, attribution_id: res.body.attribution_id, short_ref: res.body.short_ref, cached_first_touch: res.body.first_touch, touch: newCampaign}, headers: {...req.headers, 'x-forwarded-for': '203.0.113.8'}};
const restoreRes = mockResponse();
await handler(restoreReq, restoreRes);
assert.equal(restoreRes.body.attribution_id, res.body.attribution_id);
assert.deepEqual(restoreRes.body.first_touch, res.body.first_touch);
assert.equal(restoreRes.body.last_touch.source, 'meta');

const consentReq = {...req, body: {...req.body, consent: {durable_storage: 'granted'}}, headers: {...req.headers, 'x-forwarded-for': '203.0.113.9'}};
const consentRes = mockResponse();
await handler(consentReq, consentRes);
const retentionSeconds = RETENTION_DAYS * 24 * 60 * 60;
assert.match(consentRes.headers['set-cookie'], new RegExp(`^a7_attribution_id=at_[a-f0-9]{32}; Path=/; Max-Age=${retentionSeconds}; HttpOnly; Secure; SameSite=Lax$`));

const foreignReq = {...req, headers: {...req.headers, origin: 'https://attacker.example', 'x-forwarded-for': '203.0.113.10'}};
const foreignRes = mockResponse();
await handler(foreignReq, foreignRes);
assert.equal(foreignRes.statusCode, 403);

assert.deepEqual(scanBusinessDestinations(), []);
const scanFixture = fs.mkdtempSync(path.join(os.tmpdir(), 'a7-business-guard-'));
fs.mkdirSync(path.join(scanFixture, 'docs'));
fs.writeFileSync(path.join(scanFixture, 'index.html'), '<a href="https://wa.me/14076708839">WhatsApp</a>');
fs.writeFileSync(path.join(scanFixture, 'docs', 'historical-audit.md'), 'Legacy: 689-407-2015');
assert.deepEqual(scanBusinessDestinations(scanFixture), [], 'Historical documentation must not create a public-code false positive.');
fs.writeFileSync(path.join(scanFixture, 'legacy.html'), '<a href="https://wa.me/16894072015">Legacy</a>');
assert.ok(scanBusinessDestinations(scanFixture).some((failure) => failure.includes('forbidden legacy phone')));
fs.rmSync(scanFixture, {recursive: true, force: true});
const ctas = inventoryCtas();
assert.ok(ctas.some((cta) => cta.channel === 'whatsapp'));
assert.ok(ctas.some((cta) => cta.channel === 'phone'));
assert.ok(ctas.some((cta) => cta.channel === 'sms'));
assert.ok(ctas.some((cta) => cta.channel === 'booking'));

console.log(`Attribution V2 tests passed; CTA inventory contains ${ctas.length} contact/booking link(s).`);
