import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileFunnel, loadFunnelData, OUTPUT_PATH, stableJson, validateFunnelData} from './mos-funnel.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const data = loadFunnelData();
const validation = validateFunnelData(data);
assert.equal(validation.ok, true, validation.errors.join('\n'));

const compiled = compileFunnel(data);
assert.equal(compiled.readOnly, true);
assert.equal(compiled.platformMutation, false);
assert.equal(compiled.catalog.items.length, 3);
assert.equal(compiled.briefs.filter((brief) => brief.itemId === 'guest-wash-fold').length, 8);
assert.equal(compiled.experiments.waves[0].members.length, 3);
assert.equal(compiled.experiments.waves[0].members.filter((member) => member.role === 'control').length, 1);
assert.equal(compiled.experiments.waves[0].members.filter((member) => member.role === 'challenger').length, 2);

const serialized = stableJson(compiled);
for (const prohibited of [
  /paid_challenger[^]*campaign active/i,
  /"platformMutation"\s*:\s*true/i,
  /campaign_create|campaign_update|budget_update|ads_management/i
]) assert.doesNotMatch(serialized, prohibited);
const stageMetrics = new Map(compiled.research.stageMetrics.map((entry) => [entry.stage, entry]));
assert.equal(stageMetrics.get('conversation').saleEquivalent, false, 'conversation cannot be represented as sale');
assert.equal(stageMetrics.get('paid_challenger').saleEquivalent, false, 'paid challenger cannot be represented as sale');
assert.equal(stageMetrics.get('sale').saleEquivalent, true, 'sale requires its own reconciled stage');

assert.ok(fs.existsSync(OUTPUT_PATH), 'compiled artifact is missing; run mos-funnel compile');
assert.equal(fs.readFileSync(OUTPUT_PATH, 'utf8'), serialized, 'compiled artifact is stale; run mos-funnel compile');

const dashboard = fs.readFileSync(path.join(projectRoot, 'a7-command-center.html'), 'utf8');
assert.match(dashboard, /Marketing → Funil Criativo|Funil Criativo/);
assert.match(dashboard, /funnel-intelligence\.json/);
assert.match(dashboard, /funnel-intelligence-contract\.js/);
assert.doesNotMatch(dashboard.match(/<div class="panel" id="funnel-intelligence">[\s\S]*?<\/div>\s*<!-- PANEL:/)?.[0] || '', /publicar|pausar|ativar campanha|alterar orçamento/i);

console.log(`Funnel intelligence gate valid: ${compiled.catalog.items.length} items, ${compiled.briefs.length} pilot briefs.`);
