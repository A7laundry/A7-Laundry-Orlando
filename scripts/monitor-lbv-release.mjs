import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RELEASE = Object.freeze({
  url: 'https://a7laundry.com/blog/laundry-lake-buena-vista',
  canonical: 'https://a7laundry.com/blog/laundry-lake-buena-vista',
  hero: 'https://a7laundry.com/blog/img/lbv-vacation-time-hero-v5.webp',
  tracking: 'https://a7laundry.com/a7-tracking.js',
  robots: 'https://a7laundry.com/robots.txt',
  sitemap: 'https://a7laundry.com/sitemap.xml',
  disneySprings: 'https://a7laundry.com/blog/laundry-disney-springs-area',
  nearDisney: 'https://a7laundry.com/blog/laundry-near-disney-world',
  phone: '14076708839',
  funnel: 'SEO-LBV-V2',
  proofFunnel: 'SEO-LBV-PROOF',
  hotelsFunnel: 'SEO-LBV-HOTELS',
  floatFunnel: 'SEO-LBV-FLOAT',
  smsFunnel: 'SEO-LBV-SMS',
  googleProfile: 'https://share.google/XbKSTKkWOe5CYwPR9',
  hashes: Object.freeze({
    html: 'f7fff1f8bb857f26d37af4f49b5c3558eead510f1431bb38822698709c009a93',
    hero: '7e7450dc80398a693c3ecbfdf7b4217c79fb045f64eb6a819652110ecd8861c6',
    tracking: 'af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf'
  })
});

const CHECKPOINTS = new Set(['immediate', '24h', '72h', '7d', '14d', '28d']);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

export function inspectHtml(html) {
  const whatsappLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/14076708839\?text=[^"]+)"/g)].map((match) => match[1]);
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const jsonLdParsed = jsonLdBlocks.map((block) => JSON.parse(block));
  const decodedWhatsapp = whatsappLinks.map((link) => decodeURIComponent(link));

  return {
    canonicalExact: html.includes(`<link rel="canonical" href="${RELEASE.canonical}"/>`),
    h1Exact: html.includes('<h1 id="hero-title" class="reveal">Hotel laundry pickup. Keep your day.</h1>'),
    whatsappCount: whatsappLinks.length,
    whatsappOfficial: whatsappLinks.every((link) => link.startsWith(`https://wa.me/${RELEASE.phone}?text=`)),
    whatsappPrefillComplete: decodedWhatsapp.every((link) =>
      ['Hotel / address:', 'Checkout / needed by:', 'Approx. bag / load:', 'Service: Standard or Express']
        .every((field) => link.includes(field)) &&
      [RELEASE.funnel, RELEASE.proofFunnel, RELEASE.hotelsFunnel, RELEASE.floatFunnel].some((funnel) => link.includes(`A7 Funnel: ${funnel}`))
    ),
    telephoneCount: occurrences(html, 'href="tel:+14076708839"'),
    smsCount: occurrences(html, 'href="sms:+14076708839'),
    funnelPresent:
      html.includes(RELEASE.funnel) &&
      html.includes(RELEASE.proofFunnel) &&
      html.includes(RELEASE.hotelsFunnel) &&
      html.includes(RELEASE.floatFunnel) &&
      html.includes(RELEASE.smsFunnel),
    heroPresent: html.includes('/blog/img/lbv-vacation-time-hero-v5.webp'),
    socialProfilesSafe:
      html.includes('href="https://instagram.com/a7laundry" target="_blank" rel="noopener noreferrer" aria-label="Visit A7 Laundry on Instagram"') &&
      html.includes('href="https://facebook.com/a7laundry" target="_blank" rel="noopener noreferrer" aria-label="Visit A7 Laundry on Facebook"') &&
      !html.includes('aria-label="Visit A7 Laundry on YouTube"'),
    socialSameAs:
      html.includes('"sameAs":["https://instagram.com/a7laundry","https://facebook.com/a7laundry"]'),
    googleProfileSafe:
      html.includes(`href="${RELEASE.googleProfile}" target="_blank" rel="noopener noreferrer" aria-label="View A7 Laundry on Google"`),
    contactDockSafe:
      html.includes('class="contact-dock" aria-label="Quick contact with A7 Laundry" hidden') &&
      html.includes('class="contact-dock__action contact-dock__action--wa wa-fab"') &&
      html.includes('href="sms:+14076708839?&amp;body=') &&
      html.includes('aria-label="Text A7 Laundry"') &&
      !html.includes('aria-label="Call A7 Laundry"') &&
      !html.includes('href="tel:') &&
      !html.includes('href="facetime:'),
    jsonLdCount: jsonLdParsed.length,
    jsonLdParseable: jsonLdParsed.length === jsonLdBlocks.length,
    offerSafe:
      html.includes('Standard from $3.25/lb · approx. 24h') &&
      html.includes('Express from $3.95/lb · up to 8h when confirmed') &&
      html.includes('$50 minimum')
  };
}

export function inspectSeoGraph({ targetHtml, disneySpringsHtml, nearDisneyHtml, sitemapXml, robotsTxt }) {
  return {
    targetIndexable: !/<meta[^>]+(?:name="robots"[^>]+content="[^"]*noindex|content="[^"]*noindex[^>]+name="robots")/i.test(targetHtml),
    targetContextualLinks:
      targetHtml.includes('href="/blog/hotel-laundry-service-orlando"') &&
      targetHtml.includes('href="/blog/laundry-near-disney-world"') &&
      targetHtml.includes('href="/blog/orlando-vacation-rental-laundry-guide"'),
    robotsAllowsPublic:
      robotsTxt.includes('User-agent: *') &&
      robotsTxt.includes('Allow: /') &&
      robotsTxt.includes(`Sitemap: ${RELEASE.sitemap}`),
    sitemapTarget: sitemapXml.includes(`<loc>${RELEASE.canonical}</loc>`),
    sitemapHero: sitemapXml.includes(`<image:loc>${RELEASE.hero}</image:loc>`),
    disneySpringsCanonical: disneySpringsHtml.includes(`<link rel="canonical" href="${RELEASE.disneySprings}"/>`),
    disneySpringsInformational:
      disneySpringsHtml.includes('<title>Laundry Options Near Disney Springs | Orlando Guest Guide</title>') &&
      disneySpringsHtml.includes('Laundry Options Near Disney Springs: A Guest Guide'),
    disneySpringsLinksTarget: disneySpringsHtml.includes('href="/blog/laundry-lake-buena-vista"'),
    nearDisneyCanonical: nearDisneyHtml.includes(`<link rel="canonical" href="${RELEASE.nearDisney}"/>`),
    nearDisneyLinksTarget: nearDisneyHtml.includes('href="/blog/laundry-lake-buena-vista"')
  };
}

function parseArgs(argv) {
  const options = { checkpoint: null, out: null, url: RELEASE.url };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--checkpoint') options.checkpoint = argv[++index];
    else if (token === '--out') options.out = argv[++index];
    else if (token === '--url') options.url = argv[++index];
    else throw new Error(`Unknown argument: ${token}`);
  }
  if (!CHECKPOINTS.has(options.checkpoint)) throw new Error('Use --checkpoint immediate|24h|72h|7d|14d|28d');
  return options;
}

async function fetchArtifact(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'A7-LBV-Release-Monitor/1.0' } });
  const bytes = Buffer.from(await response.arrayBuffer());
  const headers = Object.fromEntries([
    'cache-control',
    'content-type',
    'referrer-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options'
  ].map((name) => [name, response.headers.get(name)]));
  return {
    url: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    headers,
    bytes: bytes.length,
    sha256: sha256(bytes),
    body: bytes
  };
}

export function inspectDelivery({ html, hero, tracking, expectedUrl = RELEASE.url }) {
  return {
    finalUrlExact: html.url === expectedUrl,
    htmlContentType: html.contentType?.startsWith('text/html') === true,
    heroContentType: hero.contentType === 'image/webp',
    trackingContentType: /^(?:application|text)\/javascript/.test(tracking.contentType || ''),
    hsts: /max-age=\d+/.test(html.headers['strict-transport-security'] || ''),
    noSniff: html.headers['x-content-type-options'] === 'nosniff',
    frameDenied: html.headers['x-frame-options'] === 'DENY',
    strictReferrer: html.headers['referrer-policy'] === 'strict-origin-when-cross-origin',
    explicitCachePolicy: typeof html.headers['cache-control'] === 'string' && html.headers['cache-control'].length > 0
  };
}

export async function monitorRelease({ checkpoint, url = RELEASE.url, checkedAt = new Date().toISOString() }) {
  const pageUrl = new URL(url);
  const heroUrl = new URL('/blog/img/lbv-vacation-time-hero-v5.webp', pageUrl);
  const trackingUrl = new URL('/a7-tracking.js', pageUrl);
  const robotsUrl = new URL('/robots.txt', pageUrl);
  const sitemapUrl = new URL('/sitemap.xml', pageUrl);
  const disneySpringsUrl = new URL('/blog/laundry-disney-springs-area', pageUrl);
  const nearDisneyUrl = new URL('/blog/laundry-near-disney-world', pageUrl);
  const [html, hero, tracking, robots, sitemap, disneySprings, nearDisney] = await Promise.all([
    fetchArtifact(pageUrl),
    fetchArtifact(heroUrl),
    fetchArtifact(trackingUrl),
    fetchArtifact(robotsUrl),
    fetchArtifact(sitemapUrl),
    fetchArtifact(disneySpringsUrl),
    fetchArtifact(nearDisneyUrl)
  ]);
  const targetHtml = html.body.toString('utf8');
  const semantics = inspectHtml(targetHtml);
  const seoGraph = inspectSeoGraph({
    targetHtml,
    disneySpringsHtml: disneySprings.body.toString('utf8'),
    nearDisneyHtml: nearDisney.body.toString('utf8'),
    sitemapXml: sitemap.body.toString('utf8'),
    robotsTxt: robots.body.toString('utf8')
  });
  const delivery = inspectDelivery({ html, hero, tracking, expectedUrl: pageUrl.toString() });
  const expectedProduction = pageUrl.origin === new URL(RELEASE.url).origin;
  const checks = {
    html200: html.status === 200,
    hero200: hero.status === 200,
    tracking200: tracking.status === 200,
    robots200: robots.status === 200,
    sitemap200: sitemap.status === 200,
    disneySprings200: disneySprings.status === 200,
    nearDisney200: nearDisney.status === 200,
    canonicalExact: semantics.canonicalExact,
    h1Exact: semantics.h1Exact,
    sevenWhatsappCtas: semantics.whatsappCount === 7,
    whatsappOfficial: semantics.whatsappOfficial,
    whatsappPrefillComplete: semantics.whatsappPrefillComplete,
    zeroTelephoneLinks: semantics.telephoneCount === 0,
    threeSmsLinks: semantics.smsCount === 3,
    funnelPresent: semantics.funnelPresent,
    heroPresent: semantics.heroPresent,
    socialProfilesSafe: semantics.socialProfilesSafe,
    socialSameAs: semantics.socialSameAs,
    googleProfileSafe: semantics.googleProfileSafe,
    contactDockSafe: semantics.contactDockSafe,
    fourJsonLdBlocks: semantics.jsonLdCount === 4 && semantics.jsonLdParseable,
    offerSafe: semantics.offerSafe,
    htmlMatchesReleasedArtifact: !expectedProduction || html.sha256 === RELEASE.hashes.html,
    heroMatchesReleasedArtifact: !expectedProduction || hero.sha256 === RELEASE.hashes.hero,
    trackingMatchesReleasedArtifact: !expectedProduction || tracking.sha256 === RELEASE.hashes.tracking
  };
  for (const [name, value] of Object.entries(seoGraph)) checks[name] = value;
  for (const [name, value] of Object.entries(delivery)) checks[name] = value;

  return {
    schemaVersion: 1,
    checkpoint,
    checkedAt,
    target: pageUrl.toString(),
    pass: Object.values(checks).every(Boolean),
    checks,
    artifacts: {
      html: { status: html.status, contentType: html.contentType, bytes: html.bytes, sha256: html.sha256, headers: html.headers },
      hero: { status: hero.status, contentType: hero.contentType, bytes: hero.bytes, sha256: hero.sha256 },
      tracking: { status: tracking.status, contentType: tracking.contentType, bytes: tracking.bytes, sha256: tracking.sha256 }
    },
    semantics,
    seoGraph,
    delivery,
    commercialEvidence: {
      status: 'not-collected-by-technical-smoke',
      required: ['qualified leads', 'paid orders', 'revenue', 'margin', 'deadline/handoff quality', 'source reconciliation'],
      warning: 'Raw pageviews, CTA clicks and WhatsApp opens are not sales.'
    }
  };
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const result = await monitorRelease(options);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (options.out) {
    const outputPath = path.resolve(options.out);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output, { flag: 'wx' });
  } else {
    process.stdout.write(output);
  }
  if (!result.pass) process.exitCode = 1;
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
