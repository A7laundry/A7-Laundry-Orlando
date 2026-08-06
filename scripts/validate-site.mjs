import fs from 'node:fs';
import path from 'node:path';
import {
  findMissingRepositoryPrivateSources,
  repositoryPrivateValidationFailures,
  resolveValidationContext
} from './validation-context.mjs';

const root = process.cwd();
const syntaxOnly = process.argv.includes('--syntax-only');
const failures = [];
let validationContext;

try {
  validationContext = resolveValidationContext(process.argv.slice(2));
} catch (error) {
  console.error(`Validation context error: ${error.message}`);
  process.exit(1);
}

console.log(`Validation context: ${validationContext}`);
if (validationContext === 'public') {
  console.log('Repository-private validation: not applicable to the publishable Vercel source set.');
}

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(relativePath));
    else result.push(relativePath);
  }
  return result;
}

for (const jsonFile of ['package.json', 'vercel.json']) {
  try {
    JSON.parse(read(jsonFile));
  } catch (error) {
    fail(`${jsonFile}: invalid JSON (${error.message})`);
  }
}

if (!syntaxOnly) {
  const config = JSON.parse(read('vercel.json'));
  const rewrites = new Map(config.rewrites.map(({ source, destination }) => [source, destination.slice(1)]));
  const htmlFiles = [
    ...fs.readdirSync(root).filter((file) => file.endsWith('.html')),
    ...fs.readdirSync(path.join(root, 'blog')).filter((file) => file.endsWith('.html')).map((file) => `blog/${file}`),
    ...fs.readdirSync(path.join(root, 'a7-carpet-campaign')).filter((file) => file.endsWith('.html')).map((file) => `a7-carpet-campaign/${file}`)
  ];

  for (const [source, target] of rewrites) {
    if (!exists(target)) fail(`vercel rewrite ${source}: missing target ${target}`);
  }

  for (const file of htmlFiles) {
    const html = read(file);

    if (file !== 'blog/_TEMPLATE.html') {
      for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          JSON.parse(match[1]);
        } catch (error) {
          fail(`${file}: invalid JSON-LD (${error.message})`);
        }
      }
    }

    for (const match of html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/gi)) {
      const url = match[1];
      if (!url.startsWith('/') || url.startsWith('//')) continue;
      if (/^\/(?:https?:|tel:|sms:)/.test(url)) continue;

      let target = rewrites.get(url);
      if (!target) {
        target = url === '/' ? 'index.html' : decodeURIComponent(url.slice(1));
        if (!path.extname(target)) target += '.html';
        if (target === 'blog.html') target = 'blog/index.html';
      }
      if (!exists(target)) fail(`${file}: ${url} resolves to missing ${target}`);
    }
  }

  const sitemap = read('sitemap.xml');
  for (const requiredSitemapToken of [
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    'https://a7laundry.com/public/guest-laundry-hero.webp',
    '<lastmod>2026-07-25</lastmod>'
  ]) {
    if (!sitemap.includes(requiredSitemapToken)) fail(`sitemap: missing ${requiredSitemapToken}`);
  }
  for (const match of sitemap.matchAll(/<loc>https:\/\/a7laundry\.com([^<]*)<\/loc>/g)) {
    const url = match[1];
    if (url.endsWith('.xml')) continue;
    let target = rewrites.get(url) || (url === '/' ? 'index.html' : `${url.slice(1)}.html`);
    if (url === '/blog') target = 'blog/index.html';
    if (!exists(target)) fail(`sitemap: ${url} resolves to missing ${target}`);
  }

  const publicFiles = walk('public');
  if (!publicFiles.some((file) => file.endsWith('.webp'))) fail('public: no optimized WebP assets found');

  const guestLanding = read('laundry-pickup-delivery-orlando.html');
  for (const requiredGuestLandingToken of [
    'Enjoy Orlando.',
    'We handle the laundry.',
    'You came for Orlando.',
    'Pickup &amp; delivery included',
    'From $3.25/lb',
    '$50 minimum order',
    '/public/guest-laundry-hero.webp',
    '/A7%20LAUNDRY-05.png',
    '/A7%20LAUNDRY-06.png',
    'Everyday laundry or a special item?',
    'Special items are quoted separately.',
    'primaryImageOfPage',
    '"dateModified":"2026-07-25"',
    'max-image-preview:large',
    'prefers-reduced-motion',
    'id="pricing"'
  ]) {
    if (!guestLanding.includes(requiredGuestLandingToken)) {
      fail(`Guest Laundry landing: missing ${requiredGuestLandingToken}`);
    }
  }
  if (/images\.unsplash\.com/i.test(guestLanding)) {
    fail('Guest Laundry landing: hero must use a controlled local image asset');
  }
  if (/\$60\b|8-hour|8 hours/i.test(guestLanding)) {
    fail('Guest Laundry landing: stale minimum or Express turnaround is present');
  }
  if (/onclick="gtag\('event','(?:whatsapp_click|sms_click|call_click|pickup_cta|special_item_quote)'/i.test(guestLanding)) {
    fail('Guest Laundry landing: inline contact tracking would fragment or duplicate unified events');
  }
  if (!exists('A7 LAUNDRY-05.png')) {
    fail('Guest Laundry landing: official A7 wordmark is missing');
  }
  if (!exists('A7 LAUNDRY-06.png')) {
    fail('Guest Laundry landing: official dark-background A7 wordmark is missing');
  }
  if (!exists('public/guest-laundry-hero.webp')) {
    fail('Guest Laundry landing: optimized Lovart hero is missing');
  }
  if (validationContext === 'repository') {
    for (const sourceFailure of repositoryPrivateValidationFailures(root)) fail(sourceFailure);
  }

  // Internal commercial sources are intentionally omitted from the public Vercel
  // upload. The explicit repository context keeps these source gates mandatory.
  if (validationContext === 'repository' && findMissingRepositoryPrivateSources(root).length === 0) {
    const manifesto = read('MANIFESTO.md');
    const homepage = read('index.html');
    const pricingRules = read('marketing/meta-ads/pricing-rules.md');
    const touristManifest = read('marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/MANIFEST.md');
    const touristSpec = read('marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/campaign-spec.yaml');
    const comforterManifest = read('marketing/meta-ads/campaigns/2026-07-comforter-dedicated/MANIFEST.md');
    const whatsappTemplates = read('marketing/whatsapp/message-templates.md');

    const requiredCommercialTokens = [
      ['MANIFESTO.md', manifesto, 'Enjoy Orlando. We handle your laundry.'],
      ['MANIFESTO.md', manifesto, '$3.25/lb'],
      ['MANIFESTO.md', manifesto, '$3.95/lb'],
      ['MANIFESTO.md', manifesto, '$50'],
      ['MANIFESTO.md', manifesto, 'Atendimento declarado 24/7'],
      ['MANIFESTO.md', manifesto, '40 km de Orlando'],
      ['MANIFESTO.md', manifesto, 'pedidos até **6 PM**'],
      ['MANIFESTO.md', manifesto, 'US$ 1,95/lb'],
      ['index.html', homepage, 'Guest Laundry Pickup in Orlando'],
      ['index.html', homepage, 'Subject to Availability'],
      ['pricing-rules.md', pricingRules, 'From $3.95/lb · minimum $50'],
      ['tourist manifest', touristManifest, 'BIBLIOTECA DE ORIGEM — NÃO PUBLICAR DIRETAMENTE'],
      ['tourist spec', touristSpec, 'ARCHIVED — substituído pela campanha manual Guest Laundry; não implantar'],
      ['comforter manifest', comforterManifest, 'NÃO PUBLICAR'],
      ['comforter manifest', comforterManifest, 'Twin $33 / Full-Queen $37 / King $40 / Down $45'],
      ['WhatsApp templates', whatsappTemplates, 'Comforter por tamanho (Twin $33 / Full-Queen $37 / King $40 / Down $45)'],
      ['WhatsApp templates', whatsappTemplates, 'A7 Laundry — Backup 1 após 5 minutos'],
      ['WhatsApp templates', whatsappTemplates, 'requests until 6 PM'],
      ['WhatsApp templates', whatsappTemplates, 'usual turnaround reference is'],
      ['WhatsApp templates', whatsappTemplates, '$1.95/lb depending on volume']
    ];
    for (const [label, content, token] of requiredCommercialTokens) {
      if (!content.includes(token)) fail(`${label}: missing commercial source token ${token}`);
    }

    for (const [label, content] of [
      ['tourist manifest', touristManifest],
      ['tourist spec', touristSpec],
      ['WhatsApp templates', whatsappTemplates]
    ]) {
      if (/\$75\b/.test(content)) fail(`${label}: stale $75 minimum is still present`);
    }

    for (const forbiddenTemplateClaim of [
      /~\$6\/lead/i,
      /garanto seu hor[aá]rio/i,
      /lock in your slot/i,
      /I can fit you in today/i
    ]) {
      if (forbiddenTemplateClaim.test(whatsappTemplates)) {
        fail(`WhatsApp templates: unsupported or stale closing claim ${forbiddenTemplateClaim}`);
      }
    }

    for (const file of htmlFiles) {
      const html = read(file);
      if (/before\s+(?:noon|12(?::00)?\s*(?:p\.?m\.?)?)/i.test(html)) {
        fail(`${file}: stale pre-6-PM Express cutoff is still present`);
      }
      if (/6\s*PM:00\s*PM/i.test(html)) {
        fail(`${file}: malformed Express cutoff is present`);
      }
      if (/"opens"\s*:\s*"(?:07:00|08:00)"/i.test(html)) {
        fail(`${file}: stale non-24/7 opening hours are still present`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(syntaxOnly ? 'Syntax and JSON configuration checks passed.' : 'Static site validation passed.');
