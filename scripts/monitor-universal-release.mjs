import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const RELEASE = Object.freeze({
  url: 'https://a7laundry.com/blog/laundry-near-universal-orlando',
  canonical: 'https://a7laundry.com/blog/laundry-near-universal-orlando',
  hero: 'https://a7laundry.com/blog/img/orlando-resort-area-hero-v1.webp',
  stripeBadge: 'https://a7laundry.com/blog/img/powered-by-stripe.svg',
  tracking: 'https://a7laundry.com/a7-tracking.js',
  growthMap: 'https://a7laundry.com/a7-growth-map.js',
  phone: '14076708839',
  funnel: 'SEO-ORLANDO-RESORT-V1',
  hashes: Object.freeze({ html: 'c64bd5e7c856aae5801f988e95585406a295bc121c60602139724f2aa5499b06', hero: '22c83e8b465f3ddcb9b3728ae91a1b20aaa72e3d57b76039fe8ff9a169ad3b81', stripeBadge: 'f7679ac0b652521fe0a6b7453541a5bb649d63c373a0191975ce339bd9d3376d', tracking: 'af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf' })
});

const CHECKPOINTS = new Set(['immediate', '24h', '72h', '7d', '14d', '28d']);
const FORBIDDEN_VISIBLE = ['universal', 'disney', 'citywalk', 'epic universe', 'seaworld', 'hilton', 'marriott', 'hyatt'];
const REQUIRED_FIELDS = ['Hotel / address:', 'Room (optional):', 'Checkout / needed by:', 'Approx. bag / load:', 'Service: Standard or Express'];

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const occurrences = (value, needle) => value.split(needle).length - 1;

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/\s(?:href|src|content)="[^"]*"/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function inspectHtml(html) {
  const whatsapp = [...html.matchAll(/href="(https:\/\/wa\.me\/14076708839\?text=[^"]+)"/g)].map((match) => decodeURIComponent(match[1]));
  const sms = [...html.matchAll(/href="(sms:\+14076708839\?&amp;body=[^"]+)"/g)].map((match) => decodeURIComponent(match[1]));
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const visibleFaq = [...html.matchAll(/<details><summary>(.*?)<\/summary><div class="answer">(.*?)<\/div><\/details>/g)]
    .map((match) => ({ name: match[1].replaceAll('&amp;', '&'), text: match[2].replaceAll('&amp;', '&') }));
  const schemaFaq = jsonLd.find((block) => block['@type'] === 'FAQPage')?.mainEntity
    ?.map((item) => ({ name: item.name, text: item.acceptedAnswer?.text })) || [];
  const visible = visibleText(html);
  return {
    canonicalExact: html.includes(`<link rel="canonical" href="${RELEASE.canonical}">`),
    h1Exact: html.includes('<h1 id="hero-title">Tomorrow’s plans need clean clothes.</h1>'),
    whatsappCount: whatsapp.length,
    whatsappSafe: whatsapp.length >= 4 && whatsapp.every((value) => REQUIRED_FIELDS.every((field) => value.includes(field)) && value.includes(`A7 Funnel: ${RELEASE.funnel}`)),
    smsCount: sms.length,
    smsSafe: sms.length >= 2 && sms.every((value) => REQUIRED_FIELDS.every((field) => value.includes(field)) && value.includes(`A7 Funnel: ${RELEASE.funnel}`)),
    zeroCallRoutes: !html.includes('href="tel:') && !html.includes('href="facetime:') && !/>\s*Call(?:\s|<)/i.test(html),
    heroPresent: html.includes('/blog/img/orlando-resort-area-hero-v1.webp'),
    responsiveImages: occurrences(html, 'srcset=') >= 3 && occurrences(html, 'sizes=') >= 3,
    noRemoteUiDependencies: !html.includes('cdn.tailwindcss.com') && !html.includes('fonts.googleapis.com') && !html.includes('material-symbols'),
    fourJsonLd: jsonLd.length === 4,
    faqParity: visibleFaq.length === 8 && JSON.stringify(visibleFaq) === JSON.stringify(schemaFaq),
    offerSafe: html.includes('From $3.25/lb · approx. 24h') && html.includes('From $3.95/lb · up to 8h when confirmed') && html.includes('$50 minimum'),
    noForbiddenVisibleBrands: FORBIDDEN_VISIBLE.every((term) => !visible.includes(term)),
    noDoubleEscapes: !html.includes('&amp;amp;') && !html.includes('&amp;mdash;'),
    socialSafe: html.includes('https://share.google/XbKSTKkWOe5CYwPR9') && html.includes('https://instagram.com/a7laundry') && html.includes('https://facebook.com/a7laundry'),
    paymentMethodsSafe: html.includes('secure USD payment link') && html.includes('<li>Major cards</li>') && html.includes('<li>Zelle</li>') && html.includes('<li>Venmo</li>') && html.includes('<li>Cash App</li>') && html.includes('<li>Cash</li>') && html.includes('Never send card details through WhatsApp.'),
    stripeTrustSafe: occurrences(html, '/blog/img/powered-by-stripe.svg') === 1 && html.includes('href="https://stripe.com"') && html.includes('alt="Powered by Stripe"') && html.includes('secure USD payment link hosted by Stripe') && html.includes('Major cards accepted through our secure payment link.') && html.includes('Apple Pay and Google Pay may be available on compatible devices at checkout.') && !/(?:Apple Pay|Google Pay) accepted|100% secure|PCI certified/i.test(html)
  };
}

export function inspectRepository({ html, sitemap, vercel, blogIndex, tracking, growthMap = '' }) {
  return {
    sitemapUrl: sitemap.includes(`<loc>${RELEASE.canonical}</loc>`),
    sitemapHero: sitemap.includes(`<image:loc>${RELEASE.hero}</image:loc>`),
    rewritePresent: vercel.includes('"source": "/blog/laundry-near-universal-orlando"'),
    blogCardPresent: blogIndex.includes('href="/blog/laundry-near-universal-orlando"') && blogIndex.includes('/blog/img/orlando-resort-area-hero-v1-mobile.webp'),
    trackingPageType: growthMap.includes('"/blog/laundry-near-universal-orlando"') && growthMap.includes('"journey_stage_v2": "bofu"'),
    trackingGeo: growthMap.includes('"asset_id": "asset_blog_laundry_near_universal_orlando"') && growthMap.includes('"content_role": "regional_page"'),
    pagePasses: Object.values(inspectHtml(html)).every(Boolean)
  };
}

async function fetchArtifact(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'A7-Orlando-Resort-Release-Monitor/1.0' } });
  const body = Buffer.from(await response.arrayBuffer());
  return { url: response.url, status: response.status, contentType: response.headers.get('content-type'), bytes: body.length, sha256: sha256(body), body };
}

export async function monitorRelease({ checkpoint, url = RELEASE.url, checkedAt = new Date().toISOString() }) {
  if (!CHECKPOINTS.has(checkpoint)) throw new Error('Use checkpoint immediate|24h|72h|7d|14d|28d');
  const base = new URL(url);
  const [html, hero, stripeBadge, tracking, sitemap] = await Promise.all([
    fetchArtifact(base), fetchArtifact(new URL('/blog/img/orlando-resort-area-hero-v1.webp', base)), fetchArtifact(new URL('/blog/img/powered-by-stripe.svg', base)), fetchArtifact(new URL('/a7-tracking.js', base)), fetchArtifact(new URL('/sitemap.xml', base))
  ]);
  const semantics = inspectHtml(html.body.toString('utf8'));
  const checks = {
    html200: html.status === 200, hero200: hero.status === 200, stripeBadge200: stripeBadge.status === 200, tracking200: tracking.status === 200, sitemap200: sitemap.status === 200,
    finalUrlExact: html.url === base.toString(), contentTypes: html.contentType?.startsWith('text/html') && hero.contentType === 'image/webp' && stripeBadge.contentType?.includes('svg'),
    ...semantics,
    sitemapUrl: sitemap.body.toString('utf8').includes(`<loc>${RELEASE.canonical}</loc>`),
    sitemapHero: sitemap.body.toString('utf8').includes(`<image:loc>${RELEASE.hero}</image:loc>`)
  };
  const expectedProduction = base.origin === new URL(RELEASE.url).origin && RELEASE.hashes.html;
  if (expectedProduction) checks.htmlHash = html.sha256 === RELEASE.hashes.html;
  if (base.origin === new URL(RELEASE.url).origin) {
    checks.heroHash = hero.sha256 === RELEASE.hashes.hero;
    checks.stripeBadgeHash = stripeBadge.sha256 === RELEASE.hashes.stripeBadge;
    checks.trackingHash = tracking.sha256 === RELEASE.hashes.tracking;
  }
  return { schemaVersion: 1, checkpoint, checkedAt, url: base.toString(), pass: Object.values(checks).every(Boolean), checks, artifacts: { html: { bytes: html.bytes, sha256: html.sha256 }, hero: { bytes: hero.bytes, sha256: hero.sha256 }, stripeBadge: { bytes: stripeBadge.bytes, sha256: stripeBadge.sha256 }, tracking: { bytes: tracking.bytes, sha256: tracking.sha256 } } };
}

function parseArgs(argv) {
  const options = { checkpoint: null, out: null, url: RELEASE.url };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--checkpoint') options.checkpoint = argv[++i];
    else if (argv[i] === '--out') options.out = argv[++i];
    else if (argv[i] === '--url') options.url = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!CHECKPOINTS.has(options.checkpoint)) throw new Error('Use --checkpoint immediate|24h|72h|7d|14d|28d');
  return options;
}

if (process.argv[1]?.endsWith('/scripts/monitor-universal-release.mjs')) {
  const options = parseArgs(process.argv.slice(2));
  const result = await monitorRelease(options);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (options.out) { mkdirSync(path.dirname(options.out), { recursive: true }); writeFileSync(options.out, output); }
  process.stdout.write(output);
  if (!result.pass) process.exitCode = 1;
}
