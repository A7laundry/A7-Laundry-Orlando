import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const pages = [
  ['blog/laundry-service-orlando.html', '/blog/laundry-service-orlando', ['Prices', 'Pickup Options']],
  ['blog/orlando-laundromat-vs-delivery.html', '/blog/orlando-laundromat-vs-delivery', ['Laundromat', 'Cost & Time']],
  ['blog/same-day-laundry-orlando.html', '/blog/same-day-laundry-orlando', ['Same-Day', 'Express 8h']],
  ['blog/same-day-laundry-tourists-orlando.html', '/blog/same-day-laundry-tourists-orlando', ['Hotel', 'Tourist Guide']],
  ['blog/express-laundry-orlando.html', '/blog/express-laundry-orlando', ['Express', '8-Hour']],
  ['blog/hotel-laundry-service-orlando.html', '/blog/hotel-laundry-service-orlando', ['Hotel', 'Pickup & Delivery']],
  ['blog/orlando-vacation-rental-laundry-guide.html', '/blog/orlando-vacation-rental-laundry-guide', ['Rental Laundry Guide', 'Hosts']],
  ['blog/vacation-rental-laundry-orlando.html', '/blog/vacation-rental-laundry-orlando', ['Rental Laundry Pickup', 'Hosts & Guests']],
  ['blog/laundry-international-drive-orlando.html', '/blog/laundry-international-drive-orlando', ['International Drive', 'Hotel Laundry Pickup']]
];

const titles = new Map();
const descriptions = new Map();
const decode = (value) => value.replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
const capture = (html, pattern, label, file) => {
  const match = html.match(pattern);
  if (!match) {
    failures.push(`${file} is missing ${label}`);
    return '';
  }
  return decode(match[1]);
};

for (const [file, route, intentTokens] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const title = capture(html, /<title>([^<]+)<\/title>/i, 'title', file);
  const description = capture(html, /<meta name="description" content="([^"]+)"\/>/i, 'meta description', file);
  const canonical = `https://a7laundry.com${route}`;

  if (title.length < 45 || title.length > 70) failures.push(`${file} title length is ${title.length}; expected 45-70`);
  if (description.length < 120 || description.length > 165) failures.push(`${file} description length is ${description.length}; expected 120-165`);
  if (!html.includes(`<link rel="canonical" href="${canonical}"/>`)) failures.push(`${file} must remain self-canonical`);
  if (!html.includes('<meta name="robots" content="index, follow"/>')) failures.push(`${file} must remain indexable`);
  if (!html.includes('<meta property="article:modified_time" content="2026-08-11"/>')) failures.push(`${file} is missing the current article modification date`);
  if (!html.includes('"dateModified": "2026-08-11"')) failures.push(`${file} structured data is missing the current modification date`);
  if (/&amp;(?:amp|mdash);/.test(html)) failures.push(`${file} contains double-encoded visible copy`);

  for (const token of intentTokens) {
    if (!title.includes(token)) failures.push(`${file} title must include its intent token: ${token}`);
  }

  if (titles.has(title)) failures.push(`${file} duplicates the title from ${titles.get(title)}`);
  if (descriptions.has(description)) failures.push(`${file} duplicates the description from ${descriptions.get(description)}`);
  titles.set(title, file);
  descriptions.set(description, file);
}

if (failures.length) {
  console.error(`SEO intent validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO intent validation passed for ${pages.length} priority pages.`);
