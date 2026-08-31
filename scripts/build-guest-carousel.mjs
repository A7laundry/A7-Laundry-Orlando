#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAMPAIGN = join(ROOT, 'marketing/meta-ads/campaigns/2026-08-guest-how-it-works-carousel');
const SOURCE = join(CAMPAIGN, 'assets/source');
const OUTPUT = join(CAMPAIGN, 'assets/final');
const TMP = join(CAMPAIGN, '.build');
const LOGO = join(ROOT, 'marketing/meta-ads/brand/a7-logo-06.png');
const FONT_REGULAR = '/System/Library/Fonts/Supplemental/Arial.ttf';
const FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

const slides = [
  {
    kicker: 'HOTEL & AIRBNB PICKUP',
    title: ['Enjoy Orlando.', 'We handle the laundry.'],
    body: ['Wash & fold with pickup and delivery', 'across our Orlando service area.'],
  },
  {
    kicker: 'STEP 1',
    title: ['Message us'],
    body: ['Send your hotel or Airbnb location', 'and tell us about your laundry bag.'],
  },
  {
    kicker: 'STEP 2',
    title: ['We pick up'],
    body: ['Coordinate a secure handoff.', 'Pickup & delivery are included.'],
  },
  {
    kicker: 'STEP 3',
    title: ['We wash & fold'],
    body: ['Normal 24h · From $3.25/lb', 'Express 8h · From $3.95/lb', 'Express is subject to availability.'],
  },
  {
    kicker: 'READY FOR MORE VACATION?',
    title: ['Fresh laundry.', 'More Orlando.'],
    body: ['$50 minimum · Pickup & delivery included', 'Message us on WhatsApp', '+1 407-670-8839'],
  },
];

function annotate(image, text, x, y, size, color, bold = false) {
  const nextImage = `${image}.next.png`;
  execFileSync('magick', [
    image,
    '-font', bold ? FONT_BOLD : FONT_REGULAR,
    '-fill', color,
    '-pointsize', String(size),
    '-gravity', 'northwest',
    '-annotate', `+${x}+${y}`,
    text,
    nextImage,
  ]);
  renameSync(nextImage, image);
}

mkdirSync(OUTPUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

try {
  slides.forEach((slide, index) => {
    const number = String(index + 1).padStart(2, '0');
    const background = join(TMP, `slide-${number}-background.png`);
    const overlay = join(TMP, `slide-${number}-overlay.png`);
    const logo = join(TMP, `slide-${number}-logo.png`);
    const output = join(OUTPUT, `slide-${number}.png`);

    execFileSync('magick', [join(SOURCE, `slide-${number}-source.png`), '-resize', '1080x1350^', '-gravity', 'center', '-extent', '1080x1350', background]);
    execFileSync('magick', ['-size', '1080x1350', 'gradient:rgba(7,26,51,0)-rgba(7,26,51,0.98)', overlay]);
    execFileSync('magick', [LOGO, '-resize', '350x', logo]);
    const shapeDraw = index > 0 && index < 4
      ? 'fill rgba(7,26,51,0.91) rectangle 0,0 1080,164 fill #E6A82F rectangle 0,0 12,1350 roundrectangle 76,778 256,832 27,27'
      : 'fill rgba(7,26,51,0.91) rectangle 0,0 1080,164 fill #E6A82F rectangle 0,0 12,1350';
    execFileSync('magick', [background, overlay, '-composite', '-draw', shapeDraw, logo, '-gravity', 'northwest', '-geometry', '+74+38', '-composite', output]);

    if (index > 0 && index < 4) {
      annotate(output, slide.kicker, 118, 790, 26, '#071A33', true);
    } else {
      annotate(output, slide.kicker, 76, 790, 27, '#F4C15D', true);
    }

    const titleStart = slide.title.length === 1 ? 902 : 850;
    slide.title.forEach((line, lineIndex) => annotate(output, line, 76, titleStart + lineIndex * 72, 62, '#FFFFFF', true));
    const bodyStart = titleStart + slide.title.length * 76 + 28;
    slide.body.forEach((line, lineIndex) => annotate(
      output,
      line,
      76,
      bodyStart + lineIndex * 43,
      index === 4 ? 29 : 31,
      index === 4 ? '#F7F9FC' : '#E9EEF5',
      index === 4,
    ));
    annotate(output, `${index + 1}/5`, 948, 1252, 22, '#FFFFFF');
    const optimized = join(TMP, `slide-${number}-optimized.png`);
    execFileSync('magick', [output, '-strip', '-quality', '94', optimized]);
    renameSync(optimized, output);
  });
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log(`Built ${slides.length} carousel slides in ${OUTPUT}`);
