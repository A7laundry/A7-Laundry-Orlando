import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inspectHtml, inspectRepository } from './monitor-universal-release.mjs';

const html = readFileSync(new URL('../blog/laundry-near-universal-orlando.html', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const vercel = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
const blogIndex = readFileSync(new URL('../blog/index.html', import.meta.url), 'utf8');
const tracking = readFileSync(new URL('../a7-tracking.js', import.meta.url), 'utf8');
const growthMap = readFileSync(new URL('../mos-app/generated/a7-growth-map.js', import.meta.url), 'utf8');

test('Orlando resort page preserves its page, contact, offer and brand contracts', () => {
  const result = inspectHtml(html);
  assert.deepEqual(Object.entries(result).filter(([, value]) => !value), []);
});

test('Orlando resort page remains connected to sitemap, rewrite, blog and attribution', () => {
  const result = inspectRepository({ html, sitemap, vercel, blogIndex, tracking, growthMap });
  assert.deepEqual(Object.entries(result).filter(([, value]) => !value), []);
});

test('visible third-party brand names are rejected while the legacy URL remains valid', () => {
  const unsafe = html.replace('Tomorrow’s plans need clean clothes.', 'Universal guests need clean clothes.');
  assert.equal(inspectHtml(unsafe).noForbiddenVisibleBrands, false);
  assert.equal(inspectHtml(html).canonicalExact, true);
});

test('an incomplete message prefill is rejected', () => {
  const unsafe = html.replaceAll('%0AApprox.%20bag%20%2F%20load%3A', '');
  assert.equal(inspectHtml(unsafe).whatsappSafe, false);
  assert.equal(inspectHtml(unsafe).smsSafe, false);
});

test('FAQ copy must match FAQPage exactly', () => {
  const unsafe = html.replace("Send the resort or address and tomorrow's exact needed-by time.", 'Send a different address.');
  assert.equal(inspectHtml(unsafe).faqParity, false);
});

test('payment reassurance must preserve every confirmed option and card-safety note', () => {
  const unsafe = html.replace('<li>Zelle</li>', '<li>Wire transfer</li>');
  assert.equal(inspectHtml(unsafe).paymentMethodsSafe, false);
  assert.equal(inspectHtml(html).paymentMethodsSafe, true);
});

test('Stripe trust copy must use the official badge and keep wallet availability conditional', () => {
  const missingBadge = html.replace('/blog/img/powered-by-stripe.svg', '/blog/img/generic-security-seal.svg');
  const absoluteWalletClaim = html.replace('Apple Pay and Google Pay may be available on compatible devices at checkout.', 'Apple Pay and Google Pay accepted.');
  assert.equal(inspectHtml(missingBadge).stripeTrustSafe, false);
  assert.equal(inspectHtml(absoluteWalletClaim).stripeTrustSafe, false);
  assert.equal(inspectHtml(html).stripeTrustSafe, true);
});
