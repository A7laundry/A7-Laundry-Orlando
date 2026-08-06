import fs from 'node:fs';
import path from 'node:path';
import { INDEXNOW_KEY, INDEXNOW_KEY_FILE, PUBLIC_TEXT_ARTIFACTS } from './public-artifacts.mjs';

const root = process.cwd();
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = (message) => failures.push(message);

const robots = read('robots.txt');
for (const token of ['User-agent: OAI-SearchBot', 'Allow: /', 'Sitemap: https://a7laundry.com/sitemap.xml']) {
  if (!robots.includes(token)) fail(`robots.txt is missing ${token}`);
}

const llms = read('llms.txt');
for (const token of [
  'Last fact review: 2026-07-25',
  'service-area laundry pickup and delivery business',
  'US$3.25/lb',
  'US$3.95/lb',
  'US$50 per pickup and delivery order',
  'Express service and pickup windows are never guaranteed',
  'https://a7laundry.com/about'
]) {
  if (!llms.includes(token)) fail(`llms.txt is missing ${token}`);
}
for (const [label, pattern] of [
  ['fixed fast response promise', /response time is a few minutes/i],
  ['unsupported re-wash guarantee', /re-washes? it free/i],
  ['fixed Express pickup schedule', /pickup by ~?10 AM/i],
  ['unqualified current review claim', /Rated 5\.0 on Google \(23 reviews\)/i]
]) {
  if (pattern.test(llms)) fail(`llms.txt contains ${label}`);
}

const about = read('about.html');
for (const token of [
  '<link rel="canonical" href="https://a7laundry.com/about"/>',
  'There is no customer-facing walk-in storefront.',
  'From $3.25/lb',
  'From $3.95/lb',
  '$50 per pickup and delivery order',
  '"@id":"https://a7laundry.com/#business"',
  '"dateModified":"2026-07-25"',
  '<script src="/a7-tracking.js" defer></script>'
]) {
  if (!about.includes(token)) fail(`about.html is missing ${token}`);
}
if (/"aggregateRating"/.test(about)) fail('about.html must not publish self-serving aggregateRating markup');

const homepage = read('index.html');
for (const token of [
  '"@id":"https://a7laundry.com/#business"',
  '"@id":"https://a7laundry.com/#website"',
  '"@id":"https://a7laundry.com/#webpage"',
  'href="/about"'
]) {
  if (!homepage.includes(token)) fail(`index.html is missing ${token}`);
}
if (/"aggregateRating"/.test(homepage)) {
  fail('index.html must not publish self-serving aggregateRating markup');
}
if (/Available now · Orlando/i.test(homepage)) {
  fail('index.html contains an unconfirmed real-time availability claim');
}

const quarantine = JSON.parse(read('indexation-quarantine.json'));
if (!Array.isArray(quarantine.routes) || quarantine.routes.length !== 35) {
  fail('indexation quarantine must contain the 35 reviewed scaled-content routes');
} else {
  const uniqueRoutes = new Set(quarantine.routes);
  if (uniqueRoutes.size !== quarantine.routes.length) fail('indexation quarantine contains duplicate routes');
  for (const route of quarantine.routes) {
    if (!/^\/blog\/[a-z0-9-]+$/.test(route)) fail(`invalid quarantine route ${route}`);
    if (!fs.existsSync(path.join(root, `${route.slice(1)}.html`))) fail(`missing quarantine source ${route}.html`);
  }
}

const indexNowKey = read(INDEXNOW_KEY_FILE).trim();
if (indexNowKey !== INDEXNOW_KEY || INDEXNOW_KEY_FILE !== `${INDEXNOW_KEY}.txt`) {
  fail('IndexNow key file content does not match its public filename');
}
if (!PUBLIC_TEXT_ARTIFACTS.includes(INDEXNOW_KEY_FILE)) {
  fail('IndexNow key file is missing from the deterministic public build artifact list');
}

if (failures.length) {
  console.error(`AI search validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AI search, entity facts and indexation quarantine validation passed.');
