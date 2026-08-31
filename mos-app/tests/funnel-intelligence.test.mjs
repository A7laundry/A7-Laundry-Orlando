import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyTransition,
  compileFunnel,
  loadFunnelData,
  semanticReport,
  signatureFor,
  validateFunnelData
} from '../../scripts/mos-funnel.mjs';
import {filterFunnelBriefs, funnelViewModel, normalizeFunnelArtifact} from '../funnel-intelligence-contract.js';

const fresh = () => structuredClone(loadFunnelData());

test('real seed is a traceable partial catalog with one 1x8 pilot and control plus two challengers', () => {
  const data = fresh();
  const result = validateFunnelData(data);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(data.items.items.length, 3);
  assert.equal(data.items.items.filter((item) => item.validationStatus === 'pilot_eligible').length, 1);
  assert.equal(data.briefs.briefs.filter((brief) => brief.itemId === 'guest-wash-fold').length, 8);
  assert.equal(data.experiments.waves[0].members.length, 3);
  assert.equal(data.experiments.waves[0].members.filter((member) => member.role === 'control').length, 1);
  assert.equal(data.experiments.waves[0].members.filter((member) => member.role === 'challenger').length, 2);
  assert.equal(data.items.items.every((item) => item.topSeller === null), true);
});

test('contract supports synthetic 10x8 capacity without requiring it in the real seed', () => {
  const data = fresh();
  const pilotItems = data.items.items.slice(0, 1);
  for (let index = 2; index <= 10; index += 1) {
    pilotItems.push({
      ...structuredClone(data.items.items[0]),
      id: `synthetic-item-${index}`,
      name: `Synthetic item ${index}`,
      validationStatus: 'candidate'
    });
  }
  data.items.items = pilotItems;
  const pilot = structuredClone(data.briefs.briefs);
  data.briefs.briefs = pilotItems.flatMap((item, itemIndex) => pilot.map((brief, briefIndex) => ({
    ...structuredClone(brief),
    id: itemIndex === 0 ? brief.id : `synthetic-${itemIndex + 1}-${briefIndex + 1}`,
    itemId: item.id
  })));
  const result = validateFunnelData(data);
  assert.equal(data.briefs.briefs.length, 80);
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('IDs, taxonomy, exact/semantic duplicates and external Meta IDs fail closed', () => {
  const cases = [];
  const duplicateId = fresh();
  duplicateId.briefs.briefs[1].id = duplicateId.briefs.briefs[0].id;
  cases.push(duplicateId);

  const missingTaxonomy = fresh();
  delete missingTaxonomy.briefs.briefs[0].taxonomy.hook;
  cases.push(missingTaxonomy);

  const exact = fresh();
  exact.briefs.briefs[1].taxonomy = structuredClone(exact.briefs.briefs[0].taxonomy);
  cases.push(exact);

  const semantic = fresh();
  const first = semantic.briefs.briefs[0];
  semantic.briefs.briefs[1].taxonomy = {...structuredClone(first.taxonomy), format: 'pov_story'};
  cases.push(semantic);

  const external = fresh();
  external.briefs.briefs[0].externalMetaAdId = 'meta-1';
  external.briefs.briefs[1].externalMetaAdId = 'meta-1';
  cases.push(external);

  for (const fixture of cases) assert.equal(validateFunnelData(fixture).ok, false);
  assert.equal(semanticReport(exact).exact.length, 1);
  assert.ok(signatureFor(first, fresh().taxonomy.requiredDimensions).includes('persona:'));
});

test('wave overflow, unknown provenance and inferred financial availability fail closed', () => {
  const wave = fresh();
  wave.experiments.waves[0].members.push({briefId: 'gwf-pack-less', role: 'challenger'});
  assert.match(validateFunnelData(wave).errors.join('\n'), /maximum is control \+ 2 challengers/);

  const source = fresh();
  source.briefs.briefs[0].sourceIds.push('missing-source');
  assert.match(validateFunnelData(source).errors.join('\n'), /unknown source/);

  const unknownPrice = fresh();
  unknownPrice.items.items[1].price.status = 'documented';
  assert.match(validateFunnelData(unknownPrice).errors.join('\n'), /unknown price must remain unavailable\/null/);
});

test('state transitions require valid sequence, history metadata and stage evidence', () => {
  const base = fresh();
  const valid = applyTransition(base, {
    id: 'transition-1',
    briefId: 'gwf-time-back',
    from: 'idea',
    to: 'production',
    timestamp: '2026-07-30T20:00:00Z',
    actor: '@dev',
    justification: 'Production brief accepted.',
    evidenceIds: []
  });
  assert.equal(valid.experiments.history.length, 1);

  assert.throws(() => applyTransition(base, {
    id: 'transition-invalid',
    briefId: 'gwf-time-back',
    from: 'idea',
    to: 'sale',
    timestamp: '2026-07-30T20:00:00Z',
    actor: '@dev',
    justification: 'Invalid leap.',
    evidenceIds: []
  }), /idea -> sale is invalid|sale requires completed_order/);

  const conversation = fresh();
  conversation.experiments.history.push({
    id: 'transition-conversation',
    briefId: 'gwf-time-back',
    from: 'paid_challenger',
    to: 'conversation',
    timestamp: '2026-07-30T20:00:00Z',
    actor: '@dev',
    justification: 'Conversation claimed without source.',
    evidenceIds: []
  });
  assert.match(validateFunnelData(conversation).errors.join('\n'), /conversation requires conversation/);
});

test('PROMOTE requires reconciled sale and contribution from explicit evidence', () => {
  const missing = fresh();
  missing.experiments.decisions.push({id: 'decision-1', briefId: 'gwf-doorstep', type: 'PROMOTE', evidenceIds: []});
  const missingResult = validateFunnelData(missing);
  assert.match(missingResult.errors.join('\n'), /PROMOTE requires reconciled completed_order/);
  assert.match(missingResult.errors.join('\n'), /PROMOTE requires reconciled contribution/);

  const valid = fresh();
  valid.evidence.evidence.push(
    {id:'sale-1', briefId:'gwf-doorstep', type:'completed_order', source:'owner order ledger', period:{start:'2026-07-30',end:'2026-07-30'}, status:'owner_reported', reconciled:true},
    {id:'contribution-1', briefId:'gwf-doorstep', type:'reconciled_contribution', source:'owner order ledger', period:{start:'2026-07-30',end:'2026-07-30'}, status:'owner_reported', reconciled:true}
  );
  valid.experiments.decisions.push({id:'decision-2', briefId:'gwf-doorstep', type:'PROMOTE', evidenceIds:['sale-1','contribution-1']});
  assert.equal(validateFunnelData(valid).ok, true);
});

test('compiled contract filters every required dimension and preserves empty/partial states', () => {
  const compiled = normalizeFunnelArtifact(compileFunnel(fresh()));
  assert.equal(compiled.readOnly, true);
  assert.equal(compiled.platformMutation, false);
  assert.equal(filterFunnelBriefs(compiled, {persona:'family_traveler'}).length, 1);
  assert.equal(filterFunnelBriefs(compiled, {pain:'price_uncertainty'}).length, 1);
  assert.equal(filterFunnelBriefs(compiled, {awareness:'unaware'}).length, 0);
  for (const key of ['angle','hook','format','promise','cta','stage','itemId']) {
    const brief = compiled.briefs[0];
    const value = key === 'stage' || key === 'itemId' ? brief[key] : brief.taxonomy[key];
    assert.ok(filterFunnelBriefs(compiled, {[key]:value}).length > 0);
  }
  const view = funnelViewModel(compiled, {awareness:'unaware'});
  assert.equal(view.briefs.length, 0);
  assert.equal(view.availability.status, 'partial');
  assert.equal(view.evidence.length, 0);
});

test('MOS menu and build remain read-only and expose sources, freshness and unavailable states', () => {
  const html = fs.readFileSync(path.resolve(import.meta.dirname, '../../a7-command-center.html'), 'utf8');
  const build = fs.readFileSync(path.resolve(import.meta.dirname, '../scripts/build.mjs'), 'utf8');
  const panel = html.match(/<div class="panel" id="funnel-intelligence">[\s\S]*?<!-- PANEL: COPY/)[0];
  assert.match(html, /Marketing → <span>Funil Criativo/);
  for (const filter of ['itemId','persona','pain','awareness','angle','hook','format','promise','cta','stage']) {
    assert.match(panel, new RegExp(`data-funnel-filter="${filter}"`));
  }
  assert.match(panel, /Cobertura taxonômica/);
  assert.match(panel, /Evidências, histórico e gargalos/);
  assert.match(html, /freshness/);
  assert.match(html, /Fonte indisponível/);
  assert.doesNotMatch(panel, /<button|publicar|pausar|ativar campanha|alterar orçamento/i);
  assert.match(build, /generated\/funnel-intelligence\.json/);
  assert.doesNotMatch(build, /Meta Marketing API|Google Ads API|campaign_create|campaign_update|budget_update/);
});
