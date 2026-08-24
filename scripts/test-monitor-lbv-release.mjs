import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { inspectDelivery, inspectHtml, inspectSeoGraph } from './monitor-lbv-release.mjs';

const html = readFileSync(new URL('../blog/laundry-lake-buena-vista.html', import.meta.url), 'utf8');
const disneySpringsHtml = readFileSync(new URL('../blog/laundry-disney-springs-area.html', import.meta.url), 'utf8');
const nearDisneyHtml = readFileSync(new URL('../blog/laundry-near-disney-world.html', import.meta.url), 'utf8');
const sitemapXml = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const robotsTxt = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');

test('LBV release monitor recognizes the current conversion and claims contract', () => {
  const result = inspectHtml(html);
  assert.equal(result.canonicalExact, true);
  assert.equal(result.h1Exact, true);
  assert.equal(result.whatsappCount, 7);
  assert.equal(result.whatsappOfficial, true);
  assert.equal(result.whatsappPrefillComplete, true);
  assert.equal(result.telephoneCount, 0);
  assert.equal(result.smsCount, 3);
  assert.equal(result.funnelPresent, true);
  assert.equal(result.heroPresent, true);
  assert.equal(result.socialProfilesSafe, true);
  assert.equal(result.socialSameAs, true);
  assert.equal(result.googleProfileSafe, true);
  assert.equal(result.contactDockSafe, true);
  assert.equal(result.jsonLdCount, 4);
  assert.equal(result.jsonLdParseable, true);
  assert.equal(result.offerSafe, true);
});

test('LBV release monitor recognizes the current indexation and adjacent-page contract', () => {
  const result = inspectSeoGraph({ targetHtml: html, disneySpringsHtml, nearDisneyHtml, sitemapXml, robotsTxt });
  assert.equal(Object.values(result).every(Boolean), true, JSON.stringify(result, null, 2));
});

test('LBV release monitor recognizes the production delivery contract', () => {
  const result = inspectDelivery({
    expectedUrl: 'https://a7laundry.com/blog/laundry-lake-buena-vista',
    html: {
      url: 'https://a7laundry.com/blog/laundry-lake-buena-vista',
      contentType: 'text/html; charset=utf-8',
      headers: {
        'cache-control': 'public, max-age=0, must-revalidate',
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    },
    hero: { contentType: 'image/webp' },
    tracking: { contentType: 'application/javascript; charset=utf-8' }
  });
  assert.equal(Object.values(result).every(Boolean), true, JSON.stringify(result, null, 2));
});
