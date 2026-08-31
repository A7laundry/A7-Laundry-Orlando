import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const destination = new URL('https://a7laundry.com/laundry-pickup-delivery-orlando');
destination.search = new URLSearchParams({
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'guest_search_orlando',
  utm_content: 'preflight',
  utm_term: 'hotel laundry service orlando',
  gclid: 'test-preflight'
}).toString();

const response = await fetch(destination, { redirect: 'follow' });
assert.equal(response.status, 200, `Landing returned HTTP ${response.status}`);
const finalUrl = new URL(response.url);
for (const [key, value] of destination.searchParams) {
  assert.equal(finalUrl.searchParams.get(key), value, `Landing did not preserve ${key}`);
}

const html = await response.text();
for (const token of [
  '<link rel="canonical" href="https://a7laundry.com/laundry-pickup-delivery-orlando"/>',
  'From $3.25/lb',
  '$3.95',
  '$50 minimum order',
  'Express when available',
  'wa.me/14076708839',
  '<script src="/a7-tracking.js" defer></script>',
  'id="how"',
  'id="pricing"',
  'id="care"'
]) {
  assert.ok(html.includes(token), `Live landing is missing ${token}`);
}
assert.doesNotMatch(html, /\$60\b|(?:express\s*)?6(?:-|\s*)hours?\b|express\s*6h\b/i, 'Live landing contains stale commercial terms');

const trackingResponse = await fetch(new URL('/a7-tracking.js', finalUrl));
assert.equal(trackingResponse.status, 200, `Tracking script returned HTTP ${trackingResponse.status}`);
const liveTracking = await trackingResponse.text();
const localTracking = fs.readFileSync(path.join(root, 'a7-tracking.js'), 'utf8');
assert.equal(liveTracking, localTracking, 'Live tracking script differs from the locally validated source');
for (const token of ['gclid', 'gbraid', 'wbraid', 'A7 Ref:', 'whatsapp_click']) {
  assert.ok(liveTracking.includes(token), `Live tracking is missing ${token}`);
}

console.log('Google Ads live preflight passed: destination, commercial terms, URL attribution and tracking source are valid.');
