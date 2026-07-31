import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const host = 'a7laundry.com';
const origin = `https://${host}`;
const key = 'd0f3f6cfc2be4b1f74ba4baba5000145';
const keyLocation = `${origin}/${key}.txt`;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const submitAll = args.includes('--all');
const explicitUrls = args.filter((arg) => !arg.startsWith('--'));

function sitemapUrls() {
  const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>(https:\/\/a7laundry\.com[^<]*)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => !url.endsWith('.webp'));
}

let urlList = explicitUrls.length
  ? explicitUrls
  : submitAll
    ? sitemapUrls()
    : [
        `${origin}/`,
        `${origin}/about`,
        `${origin}/laundry-pickup-delivery-orlando`,
        `${origin}/service-areas`,
        `${origin}/llms.txt`
      ];

urlList = [...new Set(urlList)];
for (const url of urlList) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== host) {
    throw new Error(`Refusing to submit a URL outside ${origin}: ${url}`);
  }
}
if (urlList.length > 10_000) throw new Error('IndexNow batch exceeds 10,000 URLs');

const payload = { host, key, keyLocation, urlList };
if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow returned HTTP ${response.status}: ${body.slice(0, 500)}`);
}

console.log(`IndexNow accepted ${urlList.length} URL(s) with HTTP ${response.status}.`);
