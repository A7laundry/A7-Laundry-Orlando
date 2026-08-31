import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const evidenceRoot = path.join(root, 'docs/audits/evidence/2026-07-22');
const metaOrganicRoot = path.join(root, 'docs/audits/evidence/2026-07-24/meta-organic');
const expectedGa4Hashes = {
  'A7_GA4_2026-06-22_2026-07-21_TRAFFIC_ACQUISITION.csv': '3ace4263fd9d64431ca371e40613aa5b3d0895031b564dd9ece17700eac6af26',
  'A7_GA4_2026-06-22_2026-07-21_USER_ACQUISITION.csv': '4667b44e4cb15a8d6edf46664dd800f87c489e378ffe20f74b3677498e920611',
  'A7_GA4_2026-06-22_2026-07-21_SOURCE_MEDIUM.csv': '6b9828780e18165b0ddaa0c9e2117a4209402d2d207a9b1d36c879c6bbe86e54',
  'A7_GA4_2026-06-22_2026-07-21_CAMPAIGNS.csv': '44d512528742af9e4d191468a9be4cee87e20042c40b4330279f3cc05d63fcbe',
  'A7_GA4_2026-06-22_2026-07-21_LANDING_PAGES.csv': '72352825f07fb4bae3ba243cf3b123f17cd5aa1e62df486fb850197695c18458',
  'A7_GA4_2026-06-22_2026-07-21_PAGES_SCREENS.csv': '0cc660d566f045b528e507d9e65d7fdd0b5354df7f2c673d9b1433ab498c626b',
  'A7_GA4_2026-06-22_2026-07-21_EVENTS.csv': '13b2c0cf9a04e38726fc6ef2b10a28139f8b61214576931f3cb0a5037e86f124',
  'A7_GA4_2026-06-22_2026-07-21_KEY_EVENTS_LEADS.csv': '9ca92072c04ee61f3420b30930eda8b7f8d12b64f9f5c3e6bce997fc4f176c56',
  'A7_GA4_2026-06-22_2026-07-21_GEOGRAPHY_COUNTRY.csv': '151ff92fb5ccfd8f2de8c4c7e73a0665d032304c5ac8ab4d1eb1dada113665c7',
  'A7_GA4_2026-06-22_2026-07-21_TECHNOLOGY_BROWSER.csv': '2443c37491bd4c5546e37cde5ff94f74d80748f87ee16699d5f886ee43336dc1',
  'A7_GA4_2026-06-22_2026-07-21_DAILY_DEVICE_USERS.csv': 'ffa8c36e9ba742ea9166cc5db0b0524d1177145dcfecfc26b9791016f71912da',
  'A7_GA4_COMPARISON_2026-07-03_2026-07-10.csv': '6c1837385361549af63c058c7ff376932e7696ee079b9cddb127b3cda3010e54',
  'A7_GA4_COMPARISON_2026-07-11_2026-07-21.csv': '80e9c02b7e9ba9933c1373a34284e44b1de94dee65fae9881ef5184ff811ac01',
  'A7_GA4_2026-06-22_2026-07-21_ECOMMERCE_EMPTY.csv': '2683e7ab11a697bb8909bdbf8437fc8e485adecf0b9f96701d6b2e51f5f47e35'
};

const expectedGscHashes = {
  'A7_GSC_2026-06-30_2026-07-17_PERFORMANCE.xlsx': '252cadfa7137d0ed77b4c5fac725218bd573f229b763f3992186870abb81bfae',
  'A7_GSC_2026-07-09_COVERAGE.xlsx': '25c99ed854f66ff83a02151d3701d593bfa88eb2194e5bf5c76765c28f5a4660',
  'A7_GSC_2026-07-20_BREADCRUMBS.xlsx': 'a85b57f36ab9433e5bade04a9cca7430e76256943ce2fb7d3bbea9a63dbd7f38',
  'A7_GSC_2026-07-20_REVIEW_SNIPPETS.xlsx': 'cc0719a49b2849dbf5da4c4fbb2e35cb800ca2bdb783f64d43ba1cf553004fa0',
  'A7_GSC_2026-07-21_HTTPS.xlsx': '764ab5e1f8b420d7f73f937f2f85758121c881879d9418297ee38e80eb7e35c4'
};

const expectedMetaOrganicHashes = {
  'A7_META_FB_PUBLISHED_2026-06-24_2026-07-24.csv': 'd627c3f9f8dcb01b29ba21ecc529d86c8f194ae6190430fd7882d8dc0111ac50',
  'A7_META_FB_PERFORMANCE_2026-06-24_2026-07-24.csv': 'ddd5873a2a6977f44f1af0dd7df416170438c6eedc897fdb82261ff104c2de16',
  'A7_META_IG_PUBLISHED_PERFORMANCE_2026-06-24_2026-07-24.csv': 'a9aa73b9011beeea099d6aa4080ff767599a7a8f94ea0255efbf9f532668ed7f'
};

const verifyHashes = (source, expectedHashes) => {
  for (const [file, expected] of Object.entries(expectedHashes)) {
    const bytes = fs.readFileSync(path.join(evidenceRoot, source, file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, `${file} hash mismatch`);
  }
};

verifyHashes('ga4', expectedGa4Hashes);
verifyHashes('gsc', expectedGscHashes);

for (const [file, expected] of Object.entries(expectedMetaOrganicHashes)) {
  const bytes = fs.readFileSync(path.join(metaOrganicRoot, file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, `${file} hash mismatch`);
}

for (const file of Object.keys(expectedGscHashes)) {
  const bytes = fs.readFileSync(path.join(evidenceRoot, 'gsc', file));
  assert.equal(bytes.subarray(0, 2).toString(), 'PK', `${file} must remain an XLSX ZIP container`);
}

const read = (file) => fs.readFileSync(path.join(evidenceRoot, 'ga4', file), 'utf8').replaceAll('\r', '');
const traffic = read('A7_GA4_2026-06-22_2026-07-21_TRAFFIC_ACQUISITION.csv');
const trafficRows = traffic.split('\n').filter((line) => line && !line.startsWith('#')).slice(1);
assert.equal(trafficRows.reduce((total, row) => total + Number(row.split(',')[1]), 0), 101, 'GA4 channel sessions must total 101');

const events = read('A7_GA4_2026-06-22_2026-07-21_EVENTS.csv');
assert.match(events, /^whatsapp_click,19,/m, 'WhatsApp event evidence changed');
assert.doesNotMatch(events, /^(purchase|begin_checkout|generate_lead),/m, 'commercial event unexpectedly appeared in archived snapshot');

const ecommerce = read('A7_GA4_2026-06-22_2026-07-21_ECOMMERCE_EMPTY.csv');
assert.equal(ecommerce.split('\n').filter((line) => line && !line.startsWith('#')).length, 1, 'ecommerce evidence must contain only its header');

const leads = read('A7_GA4_2026-06-22_2026-07-21_KEY_EVENTS_LEADS.csv');
assert.ok(leads.split('\n').filter((line) => line && !line.startsWith('#')).slice(1).every((row) => row.split(',').slice(1, 4).every((value) => value === '0')), 'lead evidence must remain zero');

const readMeta = (file) => fs.readFileSync(path.join(metaOrganicRoot, file), 'utf8').replace(/^\uFEFF/, '');
const facebookPublished = readMeta('A7_META_FB_PUBLISHED_2026-06-24_2026-07-24.csv');
assert.match(facebookPublished, /"Total de cliques"/, 'Facebook published export must retain click data');
assert.match(facebookPublished, /A7 Laundry & Carpet Cleaning/, 'Facebook account identity changed');

const facebookPerformance = readMeta('A7_META_FB_PERFORMANCE_2026-06-24_2026-07-24.csv');
assert.match(facebookPerformance, /Visualizações/, 'Facebook performance export must retain view data');
assert.match(facebookPerformance, /Compartilhamentos/, 'Facebook performance export must retain share data');

const instagram = readMeta('A7_META_IG_PUBLISHED_PERFORMANCE_2026-06-24_2026-07-24.csv');
assert.match(instagram, /Carrossel do Instagram/, 'Instagram carousel evidence changed');
assert.match(instagram, /Imagem do Instagram/, 'Instagram image evidence changed');
assert.match(instagram, /Salvamentos/, 'Instagram save data must remain present');

console.log(`Audit evidence valid: ${Object.keys(expectedGa4Hashes).length} GA4 CSVs, ${Object.keys(expectedGscHashes).length} GSC XLSX files and ${Object.keys(expectedMetaOrganicHashes).length} Meta organic CSVs with verified hashes.`);
