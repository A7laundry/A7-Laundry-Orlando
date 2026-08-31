import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { deriveReleaseHistory, isValidatedReleaseLedger, recordSha256, stableJson, validateReleaseLedger } from '../release-ledger-contract.js';

function route() {
  return {
    assetId: 'asset_example', canonicalPath: '/example', expectedCanonicalPath: '/example', httpStatus: 200, contentType: 'text/html',
    expectedSha256: 'a'.repeat(64), observedSha256: 'a'.repeat(64), canonicalObserved: '/example',
    expectedRobotsState: 'indexable', robotsState: 'indexable', routeState: 'route_verified'
  };
}

function baseRecord() {
  const routes = [route()];
  return {
    schemaVersion: '1.0', observerVersion: '1.0.0', eventType: 'target_observation',
    subject: { manifestSchemaVersion: '2.0.0', manifestSha256: 'b'.repeat(64), registrySha256: 'c'.repeat(64), buildRevision: '1'.repeat(40) },
    scope: { mode: 'full_registry', expectedAssets: 1, verifiedAssets: 1, expectedSitemapUrls: 1, observedSitemapUrls: 1 },
    result: { manifestState: 'verified', sitemapState: 'verified', routesDigestSha256: crypto.createHash('sha256').update(stableJson(routes)).digest('hex'), failures: [] },
    routes, rollbackOfObservationId: null, authority: { actorRole: 'devops', approvalRef: 'release-owner-approved' }
  };
}

function validChain() {
  const base = baseRecord();
  const preview = {
    ...base, observationId: 'obs-20260823T120000000Z-aaaaaaaaaaaa', observedAt: '2026-08-23T12:00:00.000Z',
    target: { kind: 'preview', origin: 'https://a7-laundry-orlando-abc123-dennis-a7s-projects.vercel.app', deploymentId: 'dpl_ABCDEFGHIJKLMNOPQRST', promotedFromObservationId: null },
    result: { ...base.result, state: 'preview_verified' }, authority: { actorRole: 'qa', approvalRef: 'qa-preview-pass' }, previousObservationId: null, previousRecordSha256: null
  };
  const production = {
    ...base, observationId: 'obs-20260823T121000000Z-bbbbbbbbbbbb', observedAt: '2026-08-23T12:10:00.000Z',
    target: { kind: 'production', origin: 'https://a7laundry.com', deploymentId: 'dpl_ZYXWVUTSRQPONMLKJIHG', promotedFromObservationId: preview.observationId },
    result: { ...base.result, state: 'active_production' }, previousObservationId: preview.observationId, previousRecordSha256: recordSha256(preview)
  };
  return { preview, production };
}

test('empty ledger is valid and branded', () => {
  const ledger = validateReleaseLedger({ schemaVersion: '1.0', records: [], ledgerTipObservationId: null, ledgerTipSha256: null });
  assert.equal(isValidatedReleaseLedger(ledger), true);
  assert.equal(isValidatedReleaseLedger({ ...ledger }), false);
});

test('exact preview to production chain validates', () => {
  const { preview, production } = validChain();
  const ledger = validateReleaseLedger({ schemaVersion: '1.0', records: [preview, production], ledgerTipObservationId: production.observationId, ledgerTipSha256: recordSha256(production) });
  assert.equal(ledger.records.at(-1).result.state, 'active_production');
});

test('production without matching preview is rejected', () => {
  const { production } = validChain();
  const genesis = { ...production, previousObservationId: null, previousRecordSha256: null };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [genesis], ledgerTipObservationId: genesis.observationId, ledgerTipSha256: recordSha256(genesis) }), /validated preview/);
});

test('tamper and unknown fields are rejected', () => {
  const { preview, production } = validChain();
  const tampered = { ...production, subject: { ...production.subject, buildRevision: 'tampered' } };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [preview, tampered], ledgerTipObservationId: tampered.observationId, ledgerTipSha256: recordSha256(tampered) }), /subject invalid|chain mismatch|differs from preview/);
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [{ ...preview, secret: 'nope' }], ledgerTipObservationId: preview.observationId, ledgerTipSha256: recordSha256(preview) }), /shape/);
});

test('verified states cannot contradict their own route evidence', () => {
  const { preview } = validChain();
  const contradictory = {
    ...preview,
    scope: { ...preview.scope, verifiedAssets: 0 },
    result: { ...preview.result, manifestState: 'drift', sitemapState: 'drift', failures: [{ code: 'ROUTE_DRIFT', assetId: 'asset_example' }] },
    routes: [{ ...preview.routes[0], routeState: 'drift' }]
  };
  contradictory.result.routesDigestSha256 = crypto.createHash('sha256').update(stableJson(contradictory.routes)).digest('hex');
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [contradictory], ledgerTipObservationId: contradictory.observationId, ledgerTipSha256: recordSha256(contradictory) }), /exact verified preview evidence/);
});

test('manifest version, expected canonical and route uniqueness are fail-closed', () => {
  const { preview } = validChain();
  const badVersion = { ...preview, subject: { ...preview.subject, manifestSchemaVersion: { forged: true } } };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [badVersion], ledgerTipObservationId: badVersion.observationId, ledgerTipSha256: recordSha256(badVersion) }), /subject invalid/);

  const wrongCanonicalRoutes = [{ ...preview.routes[0], canonicalObserved: '/wrong-owner' }];
  const wrongCanonical = {
    ...preview,
    routes: wrongCanonicalRoutes,
    result: { ...preview.result, routesDigestSha256: crypto.createHash('sha256').update(stableJson(wrongCanonicalRoutes)).digest('hex') }
  };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [wrongCanonical], ledgerTipObservationId: wrongCanonical.observationId, ledgerTipSha256: recordSha256(wrongCanonical) }), /exact verified preview evidence/);

  const duplicatedRoutes = [preview.routes[0], { ...preview.routes[0] }];
  const duplicate = {
    ...preview,
    routes: duplicatedRoutes,
    scope: { ...preview.scope, expectedAssets: 2, verifiedAssets: 2 },
    result: { ...preview.result, routesDigestSha256: crypto.createHash('sha256').update(stableJson(duplicatedRoutes)).digest('hex') }
  };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [duplicate], ledgerTipObservationId: duplicate.observationId, ledgerTipSha256: recordSha256(duplicate) }), /routes are not unique/);
});

test('validated ledger is deeply immutable and remains hash-consistent', () => {
  const { preview, production } = validChain();
  const ledger = validateReleaseLedger({ schemaVersion: '1.0', records: [preview, production], ledgerTipObservationId: production.observationId, ledgerTipSha256: recordSha256(production) });
  assert.throws(() => { ledger.records[1].subject.manifestSha256 = 'd'.repeat(64); }, TypeError);
  assert.throws(() => { ledger.records[1].routes[0].observedSha256 = 'd'.repeat(64); }, TypeError);
  assert.equal(recordSha256(ledger.records.at(-1)), ledger.ledgerTipSha256);
});

test('release records reject secret-shaped values and local revisions', () => {
  const { preview } = validChain();
  const secret = { ...preview, authority: { actorRole: 'qa', approvalRef: 'api_key=secret-material' } };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [secret], ledgerTipObservationId: secret.observationId, ledgerTipSha256: recordSha256(secret) }), /secret-shaped/);
  const local = { ...preview, subject: { ...preview.subject, buildRevision: 'local-unversioned' } };
  assert.throws(() => validateReleaseLedger({ schemaVersion: '1.0', records: [local], ledgerTipObservationId: local.observationId, ledgerTipSha256: recordSha256(local) }), /subject invalid/);
});

test('rollback appends evidence and derives the replaced production as rolled back', () => {
  const { preview, production } = validChain();
  const replacementRoutes = [{ ...route(), expectedSha256: 'd'.repeat(64), observedSha256: 'd'.repeat(64) }];
  const replacementBase = {
    ...baseRecord(),
    subject: { ...baseRecord().subject, manifestSha256: 'e'.repeat(64), buildRevision: '2'.repeat(40) },
    routes: replacementRoutes,
    result: { ...baseRecord().result, routesDigestSha256: crypto.createHash('sha256').update(stableJson(replacementRoutes)).digest('hex') }
  };
  const replacementPreview = {
    ...replacementBase,
    observationId: 'obs-20260823T121500000Z-dddddddddddd', observedAt: '2026-08-23T12:15:00.000Z',
    target: { kind: 'preview', origin: 'https://a7-laundry-orlando-def456-dennis-a7s-projects.vercel.app', deploymentId: 'dpl_RESTOREPREVIEWABCDEX', promotedFromObservationId: null },
    result: { ...replacementBase.result, state: 'preview_verified' }, authority: { actorRole: 'qa', approvalRef: 'qa-replacement-preview-pass' },
    rollbackOfObservationId: null, previousObservationId: production.observationId, previousRecordSha256: recordSha256(production)
  };
  const replacementProduction = {
    ...replacementBase,
    observationId: 'obs-20260823T121800000Z-eeeeeeeeeeee', observedAt: '2026-08-23T12:18:00.000Z',
    target: { kind: 'production', origin: 'https://a7laundry.com', deploymentId: 'dpl_REPLACEMENTPRODUCTION', promotedFromObservationId: replacementPreview.observationId },
    result: { ...replacementBase.result, state: 'active_production' }, authority: { actorRole: 'devops', approvalRef: 'owner-approved-replacement' },
    rollbackOfObservationId: null, previousObservationId: replacementPreview.observationId, previousRecordSha256: recordSha256(replacementPreview)
  };
  const rollback = {
    ...baseRecord(),
    observationId: 'obs-20260823T122000000Z-cccccccccccc', observedAt: '2026-08-23T12:20:00.000Z',
    eventType: 'rollback_observation', rollbackOfObservationId: replacementProduction.observationId,
    target: { kind: 'production', origin: 'https://a7laundry.com', deploymentId: 'dpl_RESTOREPRODUCTIONABCD', promotedFromObservationId: preview.observationId },
    result: { ...baseRecord().result, state: 'active_production' }, authority: { actorRole: 'devops', approvalRef: 'owner-approved-rollback' },
    previousObservationId: replacementProduction.observationId, previousRecordSha256: recordSha256(replacementProduction)
  };
  const ledger = validateReleaseLedger({ schemaVersion: '1.0', records: [preview, production, replacementPreview, replacementProduction, rollback], ledgerTipObservationId: rollback.observationId, ledgerTipSha256: recordSha256(rollback) });
  const history = deriveReleaseHistory(ledger);
  assert.equal(history[3].derivedState, 'rolled_back');
  assert.equal(history[4].derivedState, 'active_production');
  assert.equal(history.length, 5);
});
