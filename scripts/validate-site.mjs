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

function plainText(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const obsoleteExpressDurationPattern = /(?:\bexpress\b[\s\S]{0,100}(?<![_-])(?:\b6h\b|\b6[-\s]?hours?\b|\b6\s+horas?\b|\bsix[-\s]hours?\b)|(?<![_-])(?:\b6h\b|\b6[-\s]?hours?\b|\b6\s+horas?\b|\bsix[-\s]hours?\b)[\s\S]{0,100}\bexpress\b)/i;

// These private audit artifacts quote the obsolete duration as evidence of the
// correction. They are not publishable offer or ad-copy sources.
const expressDurationHistoricalEvidenceFiles = new Set([
  'marketing/google-ads/2026-07-guest-laundry-search/CHANGESET-GADS-2026-08-20-L1.md',
  'marketing/google-ads/2026-07-guest-laundry-search/GOOGLE-ADS-CORRECTION-RUNBOOK-2026-08-20.md',
  'marketing/google-ads/2026-07-guest-laundry-search/LIVE-DRIFT-CHECK-2026-08-20.md'
]);

function isExpressDurationGuardCandidate(relativePath) {
  if (!/\.(?:csv|html|md|txt|ya?ml)$/i.test(relativePath)) return false;
  if (expressDurationHistoricalEvidenceFiles.has(relativePath)) return false;
  return ![
    '.vercel/',
    '_archive/',
    'dist/',
    'docs/audits/',
    'docs/stories/',
    'marketing/audits/',
    'marketing/meta-ads/competitors/',
    'marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/',
    'mos-app/.vercel/',
    'mos-app/dist/'
  ].some((prefix) => relativePath.startsWith(prefix));
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

  for (const file of walk('').filter(isExpressDurationGuardCandidate)) {
    if (obsoleteExpressDurationPattern.test(read(file))) {
      fail(`${file}: obsolete Express 6-hour duration is present`);
    }
  }

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
    'https://a7laundry.com/public/orlando-guest-laundry-handoff-v1.webp',
    '<lastmod>2026-08-22</lastmod>'
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
    'Laundry pickup in Orlando.',
    'Your plans keep moving.',
    'Send the location. Send the deadline.',
    'Standard · $3.25/lb',
    'Express · $3.95/lb',
    '$50 minimum',
    '/public/orlando-guest-laundry-handoff-v1.webp',
    '/public/orlando-laundry-identified-return-v1.webp',
    '/A7%20LAUNDRY-06.png',
    'SEO-ORLANDO-MONEY-V2',
    'Hotel%2Fresort%2Fvacation%20rental%3A',
    'Needed%20by%3A',
    'Approximate%20bag%2Fload%3A',
    'Standard%20or%20Express%3A',
    'How can international guests pay?',
    'Never send card details through WhatsApp or SMS.',
    'primaryImageOfPage',
    '"dateModified":"2026-08-26"',
    'max-image-preview:large',
    'prefers-reduced-motion',
    'id="how"',
    'id="pricing"',
    'id="care"',
    'id="areas"',
    'id="questions"',
    'What we wash:',
    'everyday machine-washable clothing'
  ]) {
    if (!guestLanding.includes(requiredGuestLandingToken)) {
      fail(`Guest Laundry landing: missing ${requiredGuestLandingToken}`);
    }
  }
  if (/images\.unsplash\.com/i.test(guestLanding)) {
    fail('Guest Laundry landing: hero must use a controlled local image asset');
  }
  if (/cdn\.tailwindcss\.com|fonts\.googleapis\.com|material-symbols/i.test(guestLanding)) {
    fail('Guest Laundry landing: production CDN or remote icon-font dependency is present');
  }
  if (/Rated 5\.0|23 Google reviews|aggregateRating/i.test(guestLanding)) {
    fail('Guest Laundry landing: stale or self-serving review claim is present');
  }
  if (/\$60\b/i.test(guestLanding) || obsoleteExpressDurationPattern.test(guestLanding)) {
    fail('Guest Laundry landing: stale minimum or obsolete Express turnaround is present');
  }
  if (/onclick="gtag\('event','(?:whatsapp_click|sms_click|call_click|pickup_cta|special_item_quote)'/i.test(guestLanding)) {
    fail('Guest Laundry landing: inline contact tracking would fragment or duplicate unified events');
  }
  const guestWhatsappLinks = [...guestLanding.matchAll(/href="https:\/\/wa\.me\/14076708839\?text=[^"]+"/g)];
  const guestSmsLinks = [...guestLanding.matchAll(/href="sms:\+14076708839\?&body=[^"]+"/g)];
  if (guestWhatsappLinks.length !== 4) {
    fail(`Guest Laundry landing: expected four WhatsApp paths after mobile recovery, found ${guestWhatsappLinks.length}`);
  }
  if (guestSmsLinks.length !== 2) {
    fail(`Guest Laundry landing: expected two SMS paths, found ${guestSmsLinks.length}`);
  }
  for (const requiredMobileRecoveryToken of [
    'class="wa-fab mobile-intent-cta"',
    'id="hero-whatsapp"',
    "new IntersectionObserver(([entry]) =>",
    'bottom:calc(10px + env(safe-area-inset-bottom))',
    'body{padding-bottom:calc(76px + env(safe-area-inset-bottom))}'
  ]) {
    if (!guestLanding.includes(requiredMobileRecoveryToken)) {
      fail(`Guest Laundry landing: mobile WhatsApp recovery contract missing ${requiredMobileRecoveryToken}`);
    }
  }
  if (!exists('A7 LAUNDRY-06.png')) {
    fail('Guest Laundry landing: official dark-background A7 wordmark is missing');
  }
  for (const image of [
    'public/orlando-guest-laundry-handoff-v1.webp',
    'public/orlando-guest-laundry-handoff-v1-mobile.webp',
    'public/orlando-laundry-identified-return-v1.webp',
    'public/orlando-laundry-identified-return-v1-mobile.webp'
  ]) {
    if (!exists(image)) fail(`Guest Laundry landing: optimized image is missing: ${image}`);
  }

  const guestJsonLd = [...guestLanding.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const parsed = JSON.parse(match[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
  const faqSchema = guestJsonLd.find((entry) => entry['@type'] === 'FAQPage');
  const visibleFaq = [...guestLanding.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi)]
    .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }));
  const schemaFaq = (faqSchema?.mainEntity || []).map((entry) => ({
    question: plainText(entry.name || ''),
    answer: plainText(entry.acceptedAnswer?.text || '')
  }));
  if (visibleFaq.length !== 10 || JSON.stringify(visibleFaq) !== JSON.stringify(schemaFaq)) {
    fail('Guest Laundry landing: visible FAQ and FAQPage schema must match exactly across 10 answers');
  }

  const iDrive = read('blog/laundry-international-drive-orlando.html');
  for (const requiredIDriveToken of [
    '<link rel="canonical" href="https://a7laundry.com/blog/laundry-international-drive-orlando">',
    'International Drive Hotel Laundry Pickup | A7 Laundry',
    'SEO-IDRIVE-V1',
    'Hotel%2Fresort%2Faddress%3A',
    'Needed%20by%3A',
    'Approximate%20bag%2Fload%3A',
    'Standard%20or%20Express%3A',
    'UnitPriceSpecification',
    'Standard · $3.25/lb',
    'Express · $3.95/lb',
    '$50 minimum',
    'No partnership, endorsement or preferred-provider status is implied.',
    '/blog/img/laundry-international-drive-orlando-hero-v2.webp',
    '/blog/img/laundry-international-drive-orlando-hero-v2-mobile.webp',
    'Never send card details through WhatsApp or SMS.',
    'prefers-reduced-motion'
  ]) {
    if (!iDrive.includes(requiredIDriveToken)) fail(`International Drive landing: missing ${requiredIDriveToken}`);
  }
  if (/cdn\.tailwindcss\.com|fonts\.googleapis\.com|material-symbols/i.test(iDrive)) {
    fail('International Drive landing: production CDN or remote icon-font dependency is present');
  }
  if (/href=["']tel:|aggregateRating|\bNormal\b|pickup and delivery are always free|free pickup|free delivery/i.test(iDrive)) {
    fail('International Drive landing: legacy contact, offer, proof or absolute free-delivery claim is present');
  }
  if (!exists('blog/img/laundry-international-drive-orlando-hero-v2.webp') ||
      !exists('blog/img/laundry-international-drive-orlando-hero-v2-mobile.webp')) {
    fail('International Drive landing: optimized responsive hero assets are missing');
  }
  const iDriveJsonLd = [...iDrive.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const iDriveFaqSchema = iDriveJsonLd.find((entry) => entry['@type'] === 'FAQPage');
  const iDriveVisibleFaq = [...iDrive.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi)]
    .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }));
  const iDriveSchemaFaq = (iDriveFaqSchema?.mainEntity || []).map((entry) => ({
    question: plainText(entry.name || ''),
    answer: plainText(entry.acceptedAnswer?.text || '')
  }));
  if (iDriveVisibleFaq.length !== 8 || JSON.stringify(iDriveVisibleFaq) !== JSON.stringify(iDriveSchemaFaq)) {
    fail('International Drive landing: visible FAQ and FAQPage schema must match exactly across 8 answers');
  }

  const hotelGuide = read('blog/hotel-laundry-service-orlando.html');
  for (const requiredHotelGuideToken of [
    '<link rel="canonical" href="https://a7laundry.com/blog/hotel-laundry-service-orlando">',
    'Orlando Hotel Laundry Pickup Guide | A7 Laundry',
    'SEO-HOTEL-GUIDE-V1',
    'Hotel%3A',
    'Needed%20by%3A',
    'Approximate%20bag%2Fload%3A',
    'Standard%20or%20Express%3A',
    'UnitPriceSpecification',
    'Standard · $3.25/lb',
    'Express · $3.95/lb',
    '$50 minimum',
    'This guide explains the choice, handoff and timing',
    '/blog/img/hotel-laundry-service-orlando-hero-v2.webp',
    '/blog/img/hotel-laundry-service-orlando-hero-v2-mobile.webp',
    'Independent laundry service. Hotel procedures vary.'
  ]) {
    if (!hotelGuide.includes(requiredHotelGuideToken)) fail(`Hotel pickup guide: missing ${requiredHotelGuideToken}`);
  }
  if (/cdn\.tailwindcss\.com|fonts\.googleapis\.com|material-symbols|href=["']tel:|aggregateRating|free pickup|free delivery|guaranteed Express/i.test(hotelGuide)) {
    fail('Hotel pickup guide: remote UI, legacy contact, unsupported proof or legacy commercial claim is present');
  }
  if (!exists('blog/img/hotel-laundry-service-orlando-hero-v2.webp') ||
      !exists('blog/img/hotel-laundry-service-orlando-hero-v2-mobile.webp')) {
    fail('Hotel pickup guide: optimized responsive hero assets are missing');
  }
  const hotelGuideJsonLd = [...hotelGuide.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const hotelGuideFaqSchema = hotelGuideJsonLd.find((entry) => entry['@type'] === 'FAQPage');
  const hotelGuideVisibleFaq = [...hotelGuide.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi)]
    .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }));
  const hotelGuideSchemaFaq = (hotelGuideFaqSchema?.mainEntity || []).map((entry) => ({
    question: plainText(entry.name || ''),
    answer: plainText(entry.acceptedAnswer?.text || '')
  }));
  if (hotelGuideVisibleFaq.length !== 8 || JSON.stringify(hotelGuideVisibleFaq) !== JSON.stringify(hotelGuideSchemaFaq)) {
    fail('Hotel pickup guide: visible FAQ and FAQPage schema must match exactly across 8 answers');
  }

  const beforeCheckout = read('blog/laundry-before-checkout-orlando.html');
  for (const requiredBeforeCheckoutToken of [
    '<link rel="canonical" href="https://a7laundry.com/blog/laundry-before-checkout-orlando">',
    'Laundry Before Checkout in Orlando | A7 Laundry',
    'SEO-BEFORE-CHECKOUT-V1',
    'Hotel%2Faddress%3A',
    'Checkout%2C%20flight%20or%20next-hotel%20deadline%3A',
    'Approximate%20bag%2Fload%3A',
    'Standard%20or%20Express%3A',
    'UnitPriceSpecification',
    'Standard · $3.25/lb',
    'Express · $3.95/lb',
    '$50 minimum',
    '“Today” is not a deadline. A time is.',
    '/blog/img/laundry-before-checkout-orlando-hero-v2.webp',
    '/blog/img/laundry-before-checkout-orlando-hero-v2-mobile.webp',
    'Property procedures and return availability vary.'
  ]) {
    if (!beforeCheckout.includes(requiredBeforeCheckoutToken)) fail(`Before-checkout guide: missing ${requiredBeforeCheckoutToken}`);
  }
  if (/cdn\.tailwindcss\.com|fonts\.googleapis\.com|material-symbols|href=["']tel:|aggregateRating|\bNormal\b|free pickup|free delivery|accepted until 6 PM|guaranteed Express/i.test(beforeCheckout)) {
    fail('Before-checkout guide: remote UI, legacy contact, unsupported proof, cutoff or legacy commercial claim is present');
  }
  if (!exists('blog/img/laundry-before-checkout-orlando-hero-v2.webp') ||
      !exists('blog/img/laundry-before-checkout-orlando-hero-v2-mobile.webp')) {
    fail('Before-checkout guide: optimized responsive hero assets are missing');
  }
  const beforeCheckoutJsonLd = [...beforeCheckout.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
  const beforeCheckoutFaqSchema = beforeCheckoutJsonLd.find((entry) => entry['@type'] === 'FAQPage');
  const beforeCheckoutVisibleFaq = [...beforeCheckout.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/gi)]
    .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }));
  const beforeCheckoutSchemaFaq = (beforeCheckoutFaqSchema?.mainEntity || []).map((entry) => ({
    question: plainText(entry.name || ''),
    answer: plainText(entry.acceptedAnswer?.text || '')
  }));
  if (beforeCheckoutVisibleFaq.length !== 8 || JSON.stringify(beforeCheckoutVisibleFaq) !== JSON.stringify(beforeCheckoutSchemaFaq)) {
    fail('Before-checkout guide: visible FAQ and FAQPage schema must match exactly across 8 answers');
  }
  if (validationContext === 'repository') {
    for (const sourceFailure of repositoryPrivateValidationFailures(root)) fail(sourceFailure);
  }

  // Internal commercial sources are intentionally omitted from the public Vercel
  // upload. The explicit repository context keeps these source gates mandatory.
  if (validationContext === 'repository' && findMissingRepositoryPrivateSources(root).length === 0) {
    const manifesto = read('MANIFESTO.md');
    const homepage = read('index.html');
    const plans = read('plans.html');
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
      ['MANIFESTO.md', manifesto, 'Solicitações podem chegar a qualquer hora'],
      ['MANIFESTO.md', manifesto, '40 km de Orlando'],
      ['MANIFESTO.md', manifesto, 'retorno em até **8h somente quando disponibilidade, capacidade e janela forem confirmadas**'],
      ['MANIFESTO.md', manifesto, 'Pickup & delivery included in the confirmed area'],
      ['MANIFESTO.md', manifesto, 'US$ 1,95/lb'],
      ['plans.html', plans, '<link rel="canonical" href="https://a7laundry.com/plans">'],
      ['plans.html', plans, 'SEO-ORLANDO-PLANS-V1'],
      ['plans.html', plans, 'UnitPriceSpecification'],
      ['plans.html', plans, 'A 25-pound Standard order is $81.25'],
      ['plans.html', plans, 'secure USD payment link hosted by Stripe'],
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

    for (const [pattern, message] of [
      [/<link rel="canonical" href="https:\/\/a7laundry\.com\/">/, 'homepage canonical'],
      [/aggregateRating/, 'unverified aggregate rating'],
      [/a7servicepremium/i, 'stale social identity'],
      [/\$72[.,]50/, 'incorrect 25-pound Standard example'],
      [/\bNormal service\b/i, 'legacy Normal terminology'],
      [/pickup and delivery are always free/i, 'absolute free-delivery claim'],
      [/delivered (?:back )?within 8 hours/i, 'absolute Express timing']
    ]) {
      if (pattern.test(plans)) fail(`plans.html: ${message} is still present`);
    }

    const plansJsonLd = [...plans.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .flatMap((match) => {
        const parsed = JSON.parse(match[1]);
        return Array.isArray(parsed) ? parsed : [parsed];
      });
    const plansFaqSchema = plansJsonLd.find((entry) => entry['@type'] === 'FAQPage');
    const plansVisibleFaq = [...plans.matchAll(/<button class="faq-q">[\s\S]*?<span data-lang="en">([\s\S]*?)<\/span>[\s\S]*?<div class="faq-a"><div class="faq-a-inner">[\s\S]*?<span data-lang="en">([\s\S]*?)<\/span>[\s\S]*?<\/div><\/div>/gi)]
      .map((match) => ({ question: plainText(match[1]), answer: plainText(match[2]) }));
    const plansSchemaFaq = (plansFaqSchema?.mainEntity || []).map((entry) => ({
      question: plainText(entry.name || ''),
      answer: plainText(entry.acceptedAnswer?.text || '')
    }));
    if (plansVisibleFaq.length !== 6 || JSON.stringify(plansVisibleFaq) !== JSON.stringify(plansSchemaFaq)) {
      fail('plans.html: visible English FAQ and FAQPage schema must match exactly across 6 answers');
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
