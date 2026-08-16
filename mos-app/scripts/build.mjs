import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const appRoot = path.resolve(import.meta.dirname, '..');
const projectRoot = path.resolve(appRoot, '..');
const output = path.join(appRoot, 'dist');

execFileSync(process.execPath, [path.join(projectRoot, 'scripts/mos-funnel.mjs'), 'compile'], {stdio: 'inherit'});
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/validate-funnel-intelligence.mjs')], {stdio: 'inherit'});
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/mos-audits.mjs'), 'compile'], {stdio: 'inherit'});
execFileSync(process.execPath, [path.join(projectRoot, 'scripts/mos-audits.mjs'), 'validate'], {stdio: 'inherit'});

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

let dashboard = fs.readFileSync(path.join(projectRoot, 'a7-command-center.html'), 'utf8');
dashboard = dashboard.replace(
  '<a href="https://a7laundry.com" target="_blank">[ext] a7laundry.com</a>',
  '<a href="/api/logout">[x] Sair</a><a href="https://a7laundry.com" target="_blank" style="margin-top:10px">[ext] a7laundry.com</a>'
);
if (!dashboard.includes('href="/api/logout"')) throw new Error('MOS logout injection failed');

fs.writeFileSync(path.join(output, 'index.html'), dashboard);
fs.copyFileSync(path.join(projectRoot, 'mos-kpis.js'), path.join(output, 'mos-kpis.js'));
fs.copyFileSync(path.join(appRoot, 'generated/audit-registry.js'), path.join(output, 'audit-registry.js'));
fs.cpSync(path.join(projectRoot, 'mos-data'), path.join(output, 'mos-data'), {recursive: true});
fs.copyFileSync(path.join(appRoot, 'funnel-intelligence-contract.js'), path.join(output, 'funnel-intelligence-contract.js'));
fs.mkdirSync(path.join(output, 'generated'), {recursive: true});
fs.copyFileSync(path.join(appRoot, 'generated/funnel-intelligence.json'), path.join(output, 'generated/funnel-intelligence.json'));
fs.copyFileSync(path.join(projectRoot, 'logo-a7-laundry-usa.png'), path.join(output, 'logo-a7-laundry-usa.png'));
fs.copyFileSync(path.join(appRoot, 'login.html'), path.join(output, 'login.html'));

const activeCreativeOutput = path.join(output, 'active-creatives');
fs.mkdirSync(activeCreativeOutput, { recursive: true });
const activeCreatives = [
  ['marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/assets/approved/tourist_pt_9x16.png', 'tourist_pt_9x16.png'],
  ['marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/assets/approved/tourist_en_9x16.png', 'tourist_en_9x16.png'],
  ['marketing/meta-ads/campaigns/2026-07-comforter-dedicated/assets/approved/comforter_en_9x16.png', 'comforter_en_9x16.png']
];
for (const [source, destination] of activeCreatives) {
  fs.copyFileSync(path.join(projectRoot, source), path.join(activeCreativeOutput, destination));
}

const testCreativeOutput = path.join(output, 'test-creatives');
fs.mkdirSync(testCreativeOutput, { recursive: true });
const testCreatives = [
  'opt-c3-nao-so-a-capa_pt_9x16.png',
  'opt-c4-cama-renovada_pt_9x16.png',
  'opt-t5-hotel-pickup_pt_9x16.png',
  'opt-t6-pack-less_en_9x16.png'
];
for (const file of testCreatives) {
  fs.copyFileSync(path.join(projectRoot, 'marketing/meta-ads/campaigns/2026-07-optimization-sprint/assets/approved', file), path.join(testCreativeOutput, file));
}
fs.copyFileSync(
  path.join(projectRoot, 'marketing/meta-ads/campaigns/2026-07-optimization-sprint/assets/operational-proof/approved/opt-op1-discricao-operacao-real_pt_9x16.png'),
  path.join(testCreativeOutput, 'opt-op1-discricao-operacao-real_pt_9x16.png')
);

for (const file of ['index.html', 'mos-kpis.js', 'audit-registry.js', 'funnel-intelligence-contract.js', 'generated/funnel-intelligence.json', 'login.html', 'logo-a7-laundry-usa.png']) {
  if (!fs.existsSync(path.join(output, file))) throw new Error(`MOS build missing ${file}`);
}
if (!fs.existsSync(path.join(output, 'mos-data/audits/2026-07-10-meta-comforter-pre-pause.json'))) throw new Error('MOS build missing oldest immutable audit');
if (!fs.existsSync(path.join(output, 'mos-data/audits/2026-08-06-seo-tracking-cleanup.json'))) throw new Error('MOS build missing latest immutable audit');
if (!fs.existsSync(path.join(output, 'mos-data/snapshots/2026-07-27-mos-kpis.js'))) throw new Error('MOS build missing immutable KPI snapshot');
for (const [, file] of activeCreatives) {
  if (!fs.existsSync(path.join(activeCreativeOutput, file))) throw new Error(`MOS build missing active creative ${file}`);
}
for (const file of testCreatives) {
  if (!fs.existsSync(path.join(testCreativeOutput, file))) throw new Error(`MOS build missing test creative ${file}`);
}
if (!fs.existsSync(path.join(testCreativeOutput, 'opt-op1-discricao-operacao-real_pt_9x16.png'))) throw new Error('MOS build missing OP1 operational-proof creative');

console.log('Protected MOS bundle created.');
