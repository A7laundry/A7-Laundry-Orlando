import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { PUBLIC_TEXT_ARTIFACTS } from './public-artifacts.mjs';
import { resolveValidationContext } from './validation-context.mjs';

const root = process.cwd();
const output = path.join(root, 'dist');
let validationContext;

try {
  validationContext = resolveValidationContext(process.argv.slice(2));
} catch (error) {
  console.error(`Build validation context error: ${error.message}`);
  process.exit(1);
}

execFileSync(
  process.execPath,
  [path.join(root, 'scripts/validate-site.mjs'), `--validation-context=${validationContext}`],
  { stdio: 'inherit' }
);
execFileSync(process.execPath, [path.join(root, 'scripts/validate-ai-search.mjs')], { stdio: 'inherit' });

// dist is generated output owned by this script.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

function copy(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyTree(relativeDirectory, include) {
  const sourceDirectory = path.join(root, relativeDirectory);
  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) copyTree(relativePath, include);
    else if (include(relativePath)) copy(relativePath);
  }
}

function listFiles(relativeDirectory, include) {
  const directory = path.join(output, relativeDirectory);
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(relativePath, include));
    else if (include(relativePath)) files.push(relativePath);
  }
  return files;
}

const rootFiles = fs.readdirSync(root, { withFileTypes: true });
for (const entry of rootFiles) {
  if (!entry.isFile() || entry.name === 'a7-command-center.html' || entry.name === 'mos-kpis.js' || /^_preview-.*\.html$/.test(entry.name) || /^comforter-cleaning-v[2-6]\.html$/.test(entry.name)) continue;
  if (/\.html$/i.test(entry.name) || /\.(?:js|png|jpg|jpeg|webp|ico)$/i.test(entry.name)) copy(entry.name);
}

for (const file of PUBLIC_TEXT_ARTIFACTS) copy(file);

const supersededPublicAssets = new Set([
  'public/1775625968812.png',
  'public/Hero - Familia em Alegria.png',
  'public/Família em Orlando - Sem Preocupações.png',
  'public/Como Funciona - Entrega Profissional.jpg',
  'public/hero-resort-pool.jpg'
]);

copyTree('public', (relativePath) => !supersededPublicAssets.has(relativePath));
copyTree('blog', (relativePath) => {
  if (relativePath === 'blog/_TEMPLATE.html' || relativePath === 'blog/TEMPLATE-GUIDE.md') return false;
  return /\.(?:html|png|jpg|jpeg|webp|svg|ico)$/i.test(relativePath);
});

const indexationQuarantine = JSON.parse(
  fs.readFileSync(path.join(root, 'indexation-quarantine.json'), 'utf8')
);
let productionSitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
for (const route of indexationQuarantine.routes) {
  const relativeHtml = `${route.slice(1)}.html`;
  const outputHtmlPath = path.join(output, relativeHtml);
  if (!fs.existsSync(outputHtmlPath)) {
    throw new Error(`Indexation quarantine target is missing from build output: ${relativeHtml}`);
  }

  let html = fs.readFileSync(outputHtmlPath, 'utf8');
  const noindexTag = '<meta name="robots" content="noindex, follow"/>';
  if (/<meta\s+[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+[^>]*name=["']robots["'][^>]*>/i, noindexTag);
  } else {
    html = html.replace(/<\/head>/i, `  ${noindexTag}\n</head>`);
  }
  fs.writeFileSync(outputHtmlPath, html);

  const canonicalUrl = `https://a7laundry.com${route}`;
  productionSitemap = productionSitemap.replace(
    /[ \t]*<url>[\s\S]*?<\/url>\s*/g,
    (block) => block.includes(`<loc>${canonicalUrl}</loc>`) ? '' : block
  );
}
fs.writeFileSync(path.join(output, 'sitemap.xml'), productionSitemap);

for (const route of indexationQuarantine.routes) {
  const relativeHtml = `${route.slice(1)}.html`;
  const html = fs.readFileSync(path.join(output, relativeHtml), 'utf8');
  if (!/<meta\s+name=["']robots["']\s+content=["']noindex,\s*follow["']\s*\/?>/i.test(html)) {
    throw new Error(`Indexation quarantine failed to apply noindex: ${relativeHtml}`);
  }
  if (productionSitemap.includes(`<loc>https://a7laundry.com${route}</loc>`)) {
    throw new Error(`Indexation quarantine failed to remove sitemap URL: ${route}`);
  }
}
// Legacy comforter experiments still reference selected assets in criativos/.
const publicHtml = rootFiles
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'a7-command-center.html' && !/^_preview-/.test(entry.name) && !/^comforter-cleaning-v[2-6]\.html$/.test(entry.name))
  .map((entry) => fs.readFileSync(path.join(root, entry.name), 'utf8'))
  .join('\n');
const creativeAssets = new Set();
for (const match of publicHtml.matchAll(/criativos\/[^"')]+/g)) {
  const relativePath = decodeURIComponent(match[0]);
  if (/\.(?:png|jpg|jpeg|webp|svg)$/i.test(relativePath) && fs.existsSync(path.join(root, relativePath))) {
    creativeAssets.add(relativePath);
  }
}
for (const relativePath of creativeAssets) copy(relativePath);

const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
for (const { source, destination } of config.rewrites) {
  const target = destination.slice(1);
  if (!fs.existsSync(path.join(output, target))) {
    throw new Error(`Build output is missing rewrite target ${source} -> ${target}`);
  }
}

for (const privatePath of [
  'a7-command-center.html',
  'mos-kpis.js',
  '_preview-edu.html',
  'a7-carpet-campaign',
  'marketing',
  'docs',
  'MANIFESTO.md',
  'AGENTS.md',
  '.aios-core',
  '.codex',
  '.github'
]) {
  if (fs.existsSync(path.join(output, privatePath))) throw new Error(`Private path leaked into dist: ${privatePath}`);
}

const forbiddenPublicClaims = [
  ['unsupported IICRC certification', /\bIICRC\b/i],
  ['unsupported licensing or insurance claim', /licensed(?:, bonded)?\s*(?:&|and)\s*(?:fully\s*)?insured/i],
  ['unsupported platform endorsement', /Airbnb Approved|VRBO Trusted/i],
  ['unsupported Orlando #1 ranking', /Orlando(?:'s)?\s*#1/i],
  ['unsupported 99.9% efficacy claim', /99[.,]9%/i],
  ['unsupported 12x germ comparison', /12x\s+more\s+(?:germs|bacteria)/i],
  ['unsupported 200,000 bacteria claim', /200[,.]000\+?\s+bact/i],
  ['unsupported 527-review claim', /527\+?\s+(?:Google\s+)?reviews|"reviewCount"\s*:\s*"?527/i],
  ['unsupported 4,200-home claim', /4[,.]200\+?\s+(?:Orlando\s+)?homes/i],
  ['obsolete Normal price', /\$2[,.]90\s*(?:\/\s*lb|per\s+(?:lb|pound))/i],
  ['obsolete Express price', /\$3[,.]20\s*(?:\/\s*lb|per\s+(?:lb|pound))/i],
  ['unsupported eight-hour guarantee', /guaranteed\s+8-hour/i],
  ['obsolete Express six-hour duration', /(?:\bexpress\b[\s\S]{0,100}(?<![_-])(?:\b6h\b|\b6[-\s]?hours?\b|\b6\s+horas?\b|\bsix[-\s]hours?\b)|(?<![_-])(?:\b6h\b|\b6[-\s]?hours?\b|\b6\s+horas?\b|\bsix[-\s]hours?\b)[\s\S]{0,100}\bexpress\b)/i],
  ['unsupported three-minute response promise', /average response time:\s*3 minutes/i],
  ['unsupported top-rated claim', /Orlando(?:'s)?\s+Top-Rated/i],
  ['invented hosting testimonial headline', /A7 Changed My Hosting Business Forever/i],
  ['unsupported quantified rebooking claim', /\b99%\s+Rebooking\b/i],
  ['retired shoe bundle offer', /Buy\s*2\s*Get\s*1\s*FREE/i],
  ['retired free fabric-protection offer', /FREE\s+Scotchgard/i],
  ['retired free first-cleaning offer', /1st\s+cleaning\s+FREE/i],
  ['unsupported satisfaction percentage', /\b100%\s+(?:satisfaction|satisfied)\b/i],
  ['unsupported review guarantee', /5-star reviews guaranteed/i],
  ['unsupported dermatologist claim', /dermatologist-tested|tested by dermatologists/i],
  ['stale Express cutoff', /before\s+(?:noon|12(?::00)?\s*(?:p\.?m\.?)?)/i],
  ['malformed Express cutoff', /6\s*PM:00\s*PM/i],
  ['stale non-24/7 opening hours', /"opens"\s*:\s*"(?:07:00|08:00)"/i],
  ['incorrect 15 lb price example', /\$43\.50\b/i],
  ['incorrect 15–20 lb price range', /\$(?:44\s*[–-]\s*58|50\s*[–-]\s*58)(?![\d.])/i],
  ['known invented testimonial name', /\b(?:Sarah M|James R|Maria L|David K|Jennifer W|Michael T|Amanda R|Robert S|Fernanda S|Lisa M|Tom J|Sandra C|Nicole K|Marcus R|Ashley T|Justin L|Kayla P|Jennifer M|Rafael P|Ana C)\./i]
];

const productionHtmlFiles = listFiles('', (file) => file.endsWith('.html'));
for (const relativePath of productionHtmlFiles) {
  const html = fs.readFileSync(path.join(output, relativePath), 'utf8');
  if (!/<script\s+src=["']\/a7-tracking\.js["']\s+defer><\/script>/i.test(html)) {
    throw new Error(`Tracking gate failed in ${relativePath}: unified tracking script is missing`);
  }
  if (/wa-tracking\.js/i.test(html)) {
    throw new Error(`Tracking gate failed in ${relativePath}: legacy tracking script is still included`);
  }
  if (/GTM-KV9LGVRN/i.test(html)) {
    throw new Error(`Tracking gate failed in ${relativePath}: empty GTM container must not compete with unified tracking`);
  }
  if (/<a\b(?=[^>]*href=["'](?:https:\/\/wa\.me\/|sms:|tel:))[^>]*\bonclick=/i.test(html)) {
    throw new Error(`Tracking gate failed in ${relativePath}: contact link contains duplicate inline tracking`);
  }
  for (const [label, pattern] of forbiddenPublicClaims) {
    if (pattern.test(html)) throw new Error(`Trust gate failed in ${relativePath}: ${label}`);
  }
  if (relativePath !== 'privacy-policy.html' && /A7 Cleaning Services/i.test(html)) {
    throw new Error(`Brand gate failed in ${relativePath}: customer-facing brand must be A7 Laundry Orlando`);
  }
}

const trackingSource = fs.readFileSync(path.join(output, 'a7-tracking.js'), 'utf8');
for (const requiredTrackingToken of [
  'G-JLQNRC7MK4',
  'AW-17146169189',
  'AW-17146169189/dhI0CO_7xNgcEOWO9-8_',
  'AW-17146169189/83lbCLK53NgcEOWO9-8_',
  "phone_conversion_number: OFFICIAL_PHONE",
  "OFFICIAL_PHONE = '+1 407-670-8839'",
  '1452877649635363',
  "'begin_checkout'",
  "'InitiateCheckout'",
  'a7_campaign_attribution',
  'lead_reference',
  'origin_class',
  'origin_source',
  'ai-chatgpt',
  'google-organic'
]) {
  if (!trackingSource.includes(requiredTrackingToken)) {
    throw new Error(`Tracking gate failed: a7-tracking.js is missing ${requiredTrackingToken}`);
  }
}

for (const comforterPath of ['comforter-cleaning.html', 'comforter-thanks.html']) {
  const comforterHtml = fs.readFileSync(path.join(output, comforterPath), 'utf8');
  if (/fbq\(['"]init['"]/.test(comforterHtml)) {
    throw new Error(`Tracking gate failed in ${comforterPath}: duplicate inline Meta Pixel initialization`);
  }
}

const thanksHtml = fs.readFileSync(path.join(output, 'comforter-thanks.html'), 'utf8');
for (const requiredPurchaseToken of ["gtag('event', 'purchase'", "fbq('track', 'Purchase'", 'sessionStorage.setItem']) {
  if (!thanksHtml.includes(requiredPurchaseToken)) {
    throw new Error(`Tracking gate failed in comforter-thanks.html: missing ${requiredPurchaseToken}`);
  }
}

const guestConfirmationHtml = fs.readFileSync(path.join(output, 'guest-payment-confirmation.html'), 'utf8');
for (const requiredSecurityToken of [
  '/api/stripe-session?session_id=',
  "session.payment_status !== 'paid'",
  'a7_verified_purchase_',
  "send_to: 'AW-17146169189/dkpRCJyC19YcEOWO9-8_'",
  'transaction_id: session.id',
  "window.history.replaceState(null, '', window.location.pathname)"
]) {
  if (!guestConfirmationHtml.includes(requiredSecurityToken)) {
    throw new Error(`Payment confirmation gate failed: guest-payment-confirmation.html is missing ${requiredSecurityToken}`);
  }
}
if (/fbq\(['"]init['"]/.test(guestConfirmationHtml)) {
  throw new Error('Tracking gate failed in guest-payment-confirmation.html: duplicate inline Meta Pixel initialization');
}

console.log(`Production bundle created at dist/ with ${creativeAssets.size} legacy creative asset(s).`);
