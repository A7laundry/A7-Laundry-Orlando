import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const business = require('../a7-business-config.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORBIDDEN_DIGITS = new Set(['16894072015', '6894072015', '4077188393', '4072508904']);
const PUBLIC_ROOT_FILES = new Set(['a7-business-config.js', 'a7-attribution.js', 'a7-events.js', 'a7-tracking.js']);

function walk(directory, accept) {
  const output = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute, accept));
    else if (accept(absolute)) output.push(absolute);
  }
  return output;
}

export function publicExecutableFiles(root = ROOT) {
  const files = fs.readdirSync(root, {withFileTypes: true})
    .filter((entry) => entry.isFile()
      && !['a7-command-center.html'].includes(entry.name)
      && !/^_preview-.*\.html$/.test(entry.name)
      && !/^comforter-cleaning-v[2-6]\.html$/.test(entry.name)
      && (entry.name.endsWith('.html') || PUBLIC_ROOT_FILES.has(entry.name)))
    .map((entry) => path.join(root, entry.name));
  for (const directory of ['blog', 'public']) {
    const absolute = path.join(root, directory);
    if (fs.existsSync(absolute)) files.push(...walk(absolute, (file) => {
      if (path.relative(root, file) === 'blog/_TEMPLATE.html') return false;
      return /\.(?:html|js|json|txt|xml)$/i.test(file);
    }));
  }
  return files.sort();
}

export function scanBusinessDestinations(root = ROOT) {
  const failures = [];
  const official = business.whatsappNumber;
  if (business.phoneE164 !== '+14076708839') failures.push('a7-business-config.js: phoneE164 must remain +14076708839');
  if (business.whatsappNumber !== '14076708839') failures.push('a7-business-config.js: WhatsApp must remain 14076708839');
  if (business.displayPhone !== '(407) 670-8839') failures.push('a7-business-config.js: display phone must remain (407) 670-8839');
  for (const file of publicExecutableFiles(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const relative = path.relative(root, file);
    for (const match of content.matchAll(/(?:\+?1[\s().-]*)?(?:\d[\s().-]*){10}/g)) {
      const digits = match[0].replace(/\D/g, '');
      if (FORBIDDEN_DIGITS.has(digits)) failures.push(`${relative}: forbidden legacy phone ${digits}`);
    }
    for (const match of content.matchAll(/https?:\/\/wa\.me\/([0-9]+)/gi)) {
      if (match[1] !== official) failures.push(`${relative}: WhatsApp destination ${match[1]} is not ${official}`);
    }
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = scanBusinessDestinations();
  if (failures.length) {
    console.error(`Business destination guard failed with ${failures.length} issue(s):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log(`Business destination guard passed: ${publicExecutableFiles().length} public executable file(s), WhatsApp ${business.whatsappNumber}.`);
}
