import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicExecutableFiles} from './guard-business-destinations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

function visibleText(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#x?[0-9a-f]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function classify(href, label) {
  if (/https?:\/\/wa\.me\//i.test(href)) return 'whatsapp';
  if (/^tel:/i.test(href)) return 'phone';
  if (/^sms:/i.test(href)) return 'sms';
  if (/book|booking|schedule|request pickup|pickup-delivery/i.test(`${href} ${label}`)) return 'booking';
  return '';
}

export function inventoryCtas(root = ROOT) {
  const rows = [];
  for (const file of publicExecutableFiles(root).filter((name) => name.endsWith('.html'))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
      const opening = match[0].match(/^<a\b[^>]*>/i)?.[0] || '';
      const href = attr(opening, 'href');
      const label = attr(opening, 'aria-label') || visibleText(match[0]);
      const channel = classify(href, label);
      if (!channel) continue;
      rows.push({page: path.relative(root, file), cta: label || '(unlabeled)', channel, destination: href});
    }
  }
  return rows;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = inventoryCtas();
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
  else {
    console.log('page\tcta\tchannel\tdestination');
    rows.forEach((row) => console.log([row.page, row.cta, row.channel, row.destination].join('\t')));
  }
}
