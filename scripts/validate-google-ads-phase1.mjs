import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const campaignDirectory = path.join(root, 'marketing/google-ads/2026-07-guest-laundry-search');

function read(file) {
  return fs.readFileSync(path.join(campaignDirectory, file), 'utf8');
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

const spec = read('campaign-spec.yaml');
for (const required of [
  'status: "READY_FOR_BUILD_PAUSED"',
  'daily_budget_brl: 70',
  'maximum_test_spend_brl: 490',
  'search_partners: false',
  'display_expansion: false',
  'setting: "PRESENCE_ONLY"',
  'enabled: false',
  'final_url_suffix: "utm_source=google&utm_medium=cpc&utm_campaign=guest_search_orlando&utm_content={adgroupid}_{creative}&utm_term={keyword}&device={device}&matchtype={matchtype}&network={network}"',
  '"whatsapp_click — current mandatory funnel-entry proxy; never label as a sale"',
  '"purchase — verified Stripe payment with value, retained for financial reconciliation"',
  '"Stripe purchase as the sole acquisition goal before session-continuity coverage is proven"'
]) {
  assert.ok(spec.includes(required), `Campaign spec is missing ${required}`);
}
assert.doesNotMatch(spec, /^\s+- "unqualified WhatsApp click"$/m, 'The current mandatory WhatsApp-entry proxy cannot remain forbidden as primary');
assert.doesNotMatch(spec, /^\s*tracking_template:/m, 'Use a Final URL suffix; do not replace the landing URL with a tracking template');
for (const requiredSitelink of ['#how', '#pricing', '#care', '/service-areas']) {
  assert.ok(spec.includes(requiredSitelink), `Campaign spec is missing sitelink ${requiredSitelink}`);
}

const keywords = parseCsv(read('keywords.csv'));
assert.equal(keywords.length, 16, 'Phase 1 must keep the controlled 16-keyword inventory');
assert.ok(keywords.every(({ match_type: matchType }) => ['EXACT', 'PHRASE'].includes(matchType)), 'Broad match is forbidden');

const ads = parseCsv(read('responsive-search-ads.csv'));
assert.equal(ads.length, 4, 'Each Phase 1 ad group must have one paused RSA');
for (const ad of ads) {
  assert.equal(ad.status, 'READY_PAUSED', `${ad.ad_name} must remain paused`);
  assert.equal(ad.final_url, 'https://a7laundry.com/laundry-pickup-delivery-orlando');
  const headlines = ad.headlines.split('|');
  const descriptions = ad.descriptions.split('|');
  assert.ok(ad.path_1.length <= 15, `Path 1 exceeds 15 characters: ${ad.path_1}`);
  assert.ok(ad.path_2.length <= 15, `Path 2 exceeds 15 characters: ${ad.path_2}`);
  assert.ok(headlines.length >= 8, `${ad.ad_name} needs at least eight headlines`);
  assert.ok(descriptions.length >= 4, `${ad.ad_name} needs at least four descriptions`);
  for (const headline of headlines) assert.ok(headline.length <= 30, `Headline exceeds 30 characters: ${headline}`);
  for (const description of descriptions) assert.ok(description.length <= 90, `Description exceeds 90 characters: ${description}`);
  assert.doesNotMatch(`${ad.headlines} ${ad.descriptions}`, /top-rated|guaranteed|free first|#1/i);
  if (ad.ad_group === 'Express Guest Laundry') {
    assert.match(ad.descriptions, /subject to availability/i, 'Express RSA must disclose availability');
  }
}

const negatives = read('negative-keywords.txt');
for (const requiredNegative of ['jobs', 'dating', 'laundromat', 'comforter cleaning', 'carpet cleaning']) {
  assert.match(negatives, new RegExp(`^${requiredNegative}$`, 'm'), `Negative list is missing ${requiredNegative}`);
}

const preflight = read('preflight-checklist.md');
assert.match(preflight, /NO-GO for activation/);
assert.match(preflight, /Owner explicitly approves R\$70\/day/);
assert.match(preflight, /Website WhatsApp is the primary mandatory-entry proxy/);
assert.match(preflight, /Stripe `purchase` remains secondary financial evidence/);

console.log('Google Ads Phase 1 package valid: 16 controlled keywords, 4 paused RSAs and activation gates present.');
