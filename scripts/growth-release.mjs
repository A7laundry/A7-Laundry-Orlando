import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { appendReleaseRecord, compileReleaseLedger, writeCompiledReleaseLedger } from './lib/release-ledger.mjs';
import { observeGrowthTarget } from '../mos-app/growth-target-observer.js';
import { stableJson } from '../mos-app/release-ledger-contract.js';

const command = process.argv[2] || 'validate';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (command === 'validate') {
  const ledger = compileReleaseLedger(root);
  console.log(`Release ledger valid: ${ledger.records.length} append-only observation(s).`);
} else if (command === 'compile') {
  const result = writeCompiledReleaseLedger(root);
  console.log(`Compiled release ledger: ${result.destination}`);
} else if (command === 'list') {
  console.log(JSON.stringify(compileReleaseLedger(root), null, 2));
} else if (command === 'append') {
  const fileIndex = process.argv.indexOf('--file');
  if (fileIndex < 0 || !process.argv[fileIndex + 1]) throw new Error('append requires --file <observation.json>');
  const parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), process.argv[fileIndex + 1]), 'utf8'));
  const record = parsed.candidateRecord || parsed;
  if (!record?.observationId) throw new Error('append input does not contain a release observation record');
  const appended = appendReleaseRecord(record, root);
  console.log(`Appended immutable release observation: ${appended.observationId}`);
} else if (command === 'observe') {
  const value = (flag) => {
    const index = process.argv.indexOf(flag);
    return index >= 0 ? process.argv[index + 1] : null;
  };
  const kind = value('--kind');
  const origin = value('--origin');
  const deploymentId = value('--deployment-id');
  if (!kind || !origin || !deploymentId) throw new Error('observe requires --kind preview|production --origin <https-origin> --deployment-id <dpl_...>');
  const observed = await observeGrowthTarget(fetch, { kind, origin, deploymentId }, { protectionBypass: process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '' });
  const promotedFromObservationId = value('--promoted-from');
  const rollbackOfObservationId = value('--rollback-of');
  let authorityRole = value('--authority') || 'observer';
  const approvalRef = value('--approval-ref');
  if (rollbackOfObservationId && kind !== 'production') throw new Error('--rollback-of is valid only for production observations');
  const ledger = compileReleaseLedger(root);
  const preview = promotedFromObservationId ? ledger.records.find((record) => record.observationId === promotedFromObservationId) : null;
  const canActivateProduction = kind === 'production' && observed.ledgerEligible && preview?.result?.state === 'preview_verified'
    && preview.subject?.manifestSha256 === observed.subject?.manifestSha256
    && preview.subject?.registrySha256 === observed.subject?.registrySha256
    && preview.subject?.buildRevision === observed.subject?.buildRevision
    && preview.result?.routesDigestSha256 === observed.routesDigestSha256;
  if (kind === 'preview' && observed.ledgerEligible && (authorityRole !== 'qa' || !approvalRef)) throw new Error('verified preview observation requires --authority qa --approval-ref <evidence>');
  if (canActivateProduction && (authorityRole !== 'devops' || !approvalRef)) throw new Error('active production observation requires --authority devops --approval-ref <owner/release evidence>');
  if (!observed.ledgerEligible) authorityRole = 'observer';
  const rollbackTarget = rollbackOfObservationId ? ledger.records.find((record) => record.observationId === rollbackOfObservationId) : null;
  if (rollbackOfObservationId && rollbackTarget?.result?.state !== 'active_production') throw new Error('--rollback-of must reference an active production observation');
  const previousForTarget = ledger.records.slice().reverse().find((record) => record.target.origin === origin) || null;
  const unavailableRoutes = !observed.subject && previousForTarget ? previousForTarget.routes.map((route) => ({
    ...route, httpStatus: null, contentType: null, observedSha256: null, canonicalObserved: null, robotsState: 'unknown', routeState: 'unavailable'
  })) : null;
  const unavailableRoutesDigest = unavailableRoutes ? crypto.createHash('sha256').update(stableJson(unavailableRoutes.slice().sort((a, b) => a.assetId.localeCompare(b.assetId)))).digest('hex') : null;
  const evidenceSubject = observed.subject || previousForTarget?.subject || null;
  const evidenceScope = observed.subject ? observed.scope : previousForTarget ? {
    mode: 'full_registry', expectedAssets: unavailableRoutes.length, verifiedAssets: 0,
    expectedSitemapUrls: previousForTarget.scope.expectedSitemapUrls, observedSitemapUrls: 0
  } : null;
  const candidate = evidenceSubject ? {
    schemaVersion: '1.0',
    observationId: `obs-${new Date().toISOString().replace(/[-:.]/g, '')}-${crypto.randomBytes(6).toString('hex')}`,
    observedAt: new Date().toISOString(), observerVersion: '1.0.0', eventType: rollbackOfObservationId ? 'rollback_observation' : 'target_observation',
    target: { kind, origin, deploymentId, promotedFromObservationId: promotedFromObservationId || null },
    subject: evidenceSubject, scope: evidenceScope,
    result: {
      state: kind === 'preview' && observed.ledgerEligible ? 'preview_verified' : canActivateProduction ? 'active_production' : observed.failures.length ? (kind === 'preview' ? 'preview_drift' : 'production_drift') : 'unavailable',
      manifestState: observed.manifestState, sitemapState: observed.sitemapState,
      routesDigestSha256: observed.routesDigestSha256 || unavailableRoutesDigest, failures: observed.failures
    },
    routes: observed.subject ? observed.routes : unavailableRoutes, rollbackOfObservationId: rollbackOfObservationId || null,
    authority: { actorRole: authorityRole, approvalRef: authorityRole === 'observer' ? null : approvalRef },
    previousObservationId: null, previousRecordSha256: null
  } : null;
  if (rollbackOfObservationId && candidate?.subject?.manifestSha256 === rollbackTarget.subject.manifestSha256) throw new Error('rollback must restore a different previously approved artifact');
  const output = { ...observed, candidateRecord: candidate };
  const outputPath = value('--output');
  if (outputPath) fs.writeFileSync(path.resolve(process.cwd(), outputPath), `${JSON.stringify(candidate, null, 2)}\n`, { flag: 'wx' });
  else console.log(JSON.stringify(output, null, 2));
  if (!observed.ledgerEligible || (kind === 'production' && !canActivateProduction)) process.exitCode = 2;
} else {
  throw new Error(`Unknown release-ledger command: ${command}`);
}
