#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAMPAIGN = join(ROOT, 'marketing/meta-ads/campaigns/2026-08-guest-how-it-works-carousel');
const WHATSAPP_ASSETS = join(ROOT, 'marketing/whatsapp/assets/2026-07-guest-onboarding');
const errors = [];

for (let index = 1; index <= 5; index += 1) {
  const number = String(index).padStart(2, '0');
  const asset = join(CAMPAIGN, 'assets/final', `slide-${number}.png`);
  if (!existsSync(asset)) {
    errors.push(`Missing ${asset}`);
    continue;
  }
  const dimensions = execFileSync('magick', ['identify', '-format', '%wx%h', asset], { encoding: 'utf8' });
  if (dimensions !== '1080x1350') errors.push(`Invalid dimensions for slide-${number}: ${dimensions}`);
}

const copy = readFileSync(join(CAMPAIGN, 'caption-en.md'), 'utf8');
for (const required of ['$3.25/lb', '$3.95/lb', '$50 minimum', 'Express 8h', '+1 407-670-8839']) {
  if (!copy.includes(required)) errors.push(`Caption is missing: ${required}`);
}
if (/express\s*6h/i.test(copy)) errors.push('Caption contains an obsolete pre-8h Express claim');

const staleEverydayFiles = [
  'A7_WHATSAPP_GUEST_EVERYDAY_EN_4x5_SEND.jpg',
  'A7_WHATSAPP_GUEST_EVERYDAY_EN_4x5_v1.png',
  'A7_WHATSAPP_GUEST_EVERYDAY_EN_4x5_MASTER.png',
];
for (const file of staleEverydayFiles) {
  if (existsSync(join(WHATSAPP_ASSETS, 'approved', file))) {
    errors.push(`Obsolete pre-8h Express asset returned to approved: ${file}`);
  }
  if (!existsSync(join(WHATSAPP_ASSETS, 'quarantined/obsolete-pre-8h-duration', file))) {
    errors.push(`Historical pre-8h Express evidence is missing from quarantine: ${file}`);
  }
}

const templates = readFileSync(join(ROOT, 'marketing/whatsapp/message-templates.md'), 'utf8');
if (templates.includes('| `A7_WHATSAPP_GUEST_EVERYDAY_EN_4x5_SEND.jpg` |')) {
  errors.push('WhatsApp template registry still presents the obsolete pre-8h Everyday card as approved');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Guest carousel validated: 5 assets, 1080x1350, official commercial claims present.');
