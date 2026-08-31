import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

await import('../mos-kpis.js');

const data = globalThis.A7_MOS_KPIS;
assert.ok(data, 'A7_MOS_KPIS must be defined');
assert.match(data.updatedAt, /^\d{4}-\d{2}-\d{2}T/, 'updatedAt must be ISO-like');
assert.ok(Array.isArray(data.scorecard) && data.scorecard.length >= 8, 'scorecard must include core KPIs');
assert.ok(Array.isArray(data.funnel) && data.funnel.length >= 5, 'funnel must be present');

const ids = new Set();
const allowedHealth = new Set(['good', 'attention', 'critical', 'unavailable', 'context']);
for (const kpi of data.scorecard) {
  assert.ok(kpi.id && kpi.label && kpi.source && kpi.period && kpi.status, `invalid KPI: ${JSON.stringify(kpi)}`);
  assert.ok(kpi.channel && allowedHealth.has(kpi.health) && kpi.healthReason, `KPI missing decision metadata: ${kpi.id}`);
  assert.ok(!ids.has(kpi.id), `duplicate KPI id: ${kpi.id}`);
  ids.add(kpi.id);
  if (kpi.status === 'not_integrated') assert.equal(kpi.value, null, `${kpi.id} must remain null until integrated`);
  if (kpi.value === null) assert.equal(kpi.status, 'not_integrated', `${kpi.id} null value requires not_integrated status`);
}

assert.ok(data.decision?.health && data.decision?.headline && data.decision?.detail, 'operating decision header must be present');
assert.ok(Array.isArray(data.actions) && data.actions.length >= 4, 'prioritized action plans must be present');
for (const action of data.actions) {
  assert.ok(action.id && action.priority && action.title && action.action && action.owner && action.deadline && action.success, `invalid action plan: ${JSON.stringify(action)}`);
  assert.ok(action.channel && allowedHealth.has(action.health), `action plan missing decision metadata: ${action.id}`);
}
assert.ok(Array.isArray(data.healthRules) && data.healthRules.length >= 4, 'explicit health rules must be present');
assert.ok(Array.isArray(data.healthChecks) && data.healthChecks.length >= 7, 'decision health checks must be present');
for (const check of data.healthChecks) {
  assert.ok(check.id && check.label && check.channel && check.reason, `invalid health check: ${JSON.stringify(check)}`);
  assert.ok(allowedHealth.has(check.health), `invalid health state: ${check.health}`);
}
assert.equal(data.analytics.reliability, 'partial', 'GA4 audit must not be represented as fully reliable');
assert.equal(data.analytics.summary.sessions, 101, 'GA4 session snapshot changed unexpectedly');
assert.equal(data.analytics.summary.purchases, null, 'GA4 purchases must remain unavailable without purchase instrumentation');
assert.equal(data.analytics.summary.revenueUsd, null, 'GA4 revenue must remain unavailable without purchase instrumentation');
assert.equal(data.analytics.channels.reduce((total, channel) => total + channel.sessions, 0), data.analytics.summary.sessions, 'GA4 channel sessions must reconcile');
assert.ok(data.analytics.findings.some((finding) => finding.health === 'critical'), 'GA4 critical instrumentation findings must remain visible');

assert.equal(data.googleAds.account.id, '290-113-2891', 'Google Ads snapshot must use the audited A7 account');
assert.equal(data.googleAds.account.currency, 'BRL', 'Google Ads currency must remain separate from Meta USD reporting');
assert.equal(data.googleAds.delivery.availableFundsBrl, 0.10, 'Google Ads exhausted-funds snapshot changed unexpectedly');
assert.equal(data.googleAds.delivery.fundsExhausted, true, 'Google Ads must remain blocked while the audited balance is exhausted');
assert.equal(data.googleAds.performance.spendBrl, 4714.27, 'Google Ads historical spend changed unexpectedly');
assert.equal(data.googleAds.performance.callConversions, 18, 'Google Ads call-conversion snapshot changed unexpectedly');
assert.equal(data.googleAds.performance.sales, null, 'Google Ads sales must remain unavailable');
assert.equal(data.googleAds.performance.revenueBrl, null, 'Google Ads revenue must remain unavailable');
assert.equal(data.googleAds.performance.roas, null, 'Google Ads ROAS must remain unavailable');
assert.equal(data.googleAds.campaigns.length, 5, 'Google Ads campaign inventory must contain five audited campaigns');
assert.equal(data.googleAds.campaigns.filter((campaign) => campaign.status === 'Ativada').length, 3, 'Google Ads enabled campaign count must reconcile');
assert.equal(data.googleAds.campaigns.filter((campaign) => campaign.status === 'Pausada').length, 2, 'Google Ads paused campaign count must reconcile');
assert.equal(data.googleAds.campaigns.reduce((total, campaign) => total + campaign.callConversions, 0), data.googleAds.performance.callConversions, 'Google Ads campaign calls must reconcile');
assert.ok(Math.abs(data.googleAds.campaigns.reduce((total, campaign) => total + campaign.spendBrl, 0) - data.googleAds.performance.spendBrl) <= 0.011, 'Google Ads campaign spend must reconcile within the one-cent UI rounding difference');
assert.equal(data.googleAds.searchTerms.accountNegativeLists, 0, 'Google Ads account-level negative list count changed unexpectedly');
assert.equal(data.googleAds.identity.phoneValidated, false, 'Google Ads phone identity must not be presented as validated');
assert.equal(data.googleAds.measurement.salesGoalsConfigured, false, 'Google Ads sales goals must remain explicitly absent');
assert.ok(data.actions.some((action) => action.id === 'google_ads_measure_sales' && action.health === 'critical'), 'Google Ads measurement P0 must be exposed');
assert.ok(data.scorecard.some((kpi) => kpi.id === 'google_ads_revenue' && kpi.value === null && kpi.status === 'not_integrated'), 'Google Ads unavailable revenue KPI must be exposed');
assert.ok(data.integrations.some((integration) => integration.name === 'Google Ads' && integration.health === 'critical'), 'Google Ads blocked integration status must be visible');

assert.equal(data.media.account.id, '650201661142284', 'Meta snapshot must use the A7 Laundry USA account');
assert.equal(data.media.account.currency, 'USD', 'Meta snapshot currency must match the official account');
assert.equal(data.media.salesValidation.status, 'owner_reported', 'sales mix must remain explicitly owner-reported until reconciled');
assert.equal(data.media.salesValidation.soldService, 'Roupa por libra para hóspedes', 'confirmed sold-service focus changed unexpectedly');
assert.equal(data.media.salesValidation.comforterSales, 0, 'comforter must remain zero owner-confirmed sales until new evidence arrives');
assert.equal(data.media.salesValidation.minimumOrderUsd, 50, 'tourist minimum order must match MANIFESTO.md');
assert.equal(data.media.salesValidation.saleCount, 6, 'owner-reconciled sale count changed unexpectedly');
assert.equal(data.media.salesValidation.revenueUsd, 491, 'owner-reconciled revenue changed unexpectedly');
assert.deepEqual(data.media.salesValidation.orderValuesUsd, [48, 48, 155, 140, 50, 50], 'owner-reconciled order values changed unexpectedly');
assert.equal(data.media.salesValidation.grossBlendedRoas, 0.9, 'gross blended ROAS must remain explicitly tied to the period total');
assert.equal(data.media.current.spendUsd, 543.17, 'current Meta spend snapshot changed unexpectedly');
assert.equal(data.media.current.deliveringCampaigns, 1, 'current delivering campaigns snapshot changed unexpectedly');
assert.equal(data.media.current.activeAds, 3, 'active ad count changed unexpectedly');
assert.equal(data.media.verification.differenceCount, 0, 'Meta reconciliation must preserve its verified difference count');
assert.equal(data.media.verification.timezone, 'Horário do Pacífico', 'Meta reporting timezone must remain explicit');
assert.equal(data.media.periods.full.spendUsd, data.media.current.spendUsd, 'full verified period must match current campaign snapshot');
assert.equal(Math.round((data.media.periods.early.spendUsd + data.media.periods.recent.spendUsd) * 100), Math.round(data.media.periods.full.spendUsd * 100), 'comparison periods must reconcile spend');
assert.equal(data.media.periods.early.messagingConversations + data.media.periods.recent.messagingConversations, data.media.periods.full.messagingConversations, 'comparison periods must reconcile conversations');
assert.equal(Math.round((data.media.deliverySplit.active.spendUsd + data.media.deliverySplit.paused.spendUsd) * 100), Math.round(data.media.current.spendUsd * 100), 'active and paused spend must reconcile');
assert.equal(data.media.activeAds.length, data.media.current.activeAds, 'active ad inventory must match the KPI count');
assert.equal(data.media.activeAds.reduce((total, ad) => total + ad.conversations, 0), 23, 'active ad conversation subtotal changed unexpectedly');
for (const ad of data.media.activeAds) {
  assert.ok(ad.adId && ad.creativeId && ad.image && ad.focus && ad.healthReason, `invalid active ad: ${JSON.stringify(ad)}`);
  assert.ok(allowedHealth.has(ad.health), `invalid active ad health: ${ad.health}`);
  assert.ok(ad.spendUsd > 0, `${ad.name} must include verified spend`);
}
assert.equal(data.media.creativeTests.length, 5, 'optimization sprint must expose five creative challengers');
for (const creative of data.media.creativeTests) {
  assert.ok(creative.testId && creative.name && creative.image && creative.control && creative.hypothesis && creative.target, `invalid creative test: ${JSON.stringify(creative)}`);
  const assetDirectory = creative.testId === 'OPT-OP1'
    ? 'marketing/meta-ads/campaigns/2026-07-optimization-sprint/assets/operational-proof/approved'
    : 'marketing/meta-ads/campaigns/2026-07-optimization-sprint/assets/approved';
  const file = path.resolve(import.meta.dirname, '..', assetDirectory, path.basename(creative.image));
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${creative.testId} must be a PNG`);
  assert.equal(bytes.readUInt32BE(16), 1080, `${creative.testId} width must be 1080`);
  assert.equal(bytes.readUInt32BE(20), 1920, `${creative.testId} height must be 1920`);
  assert.ok(bytes.length < 4 * 1024 * 1024, `${creative.testId} must remain under 4 MB`);
}
const op1 = data.media.creativeTests.find((creative) => creative.testId === 'OPT-OP1');
assert.ok(op1, 'OP1 operational-proof creative must be exposed');
assert.match(op1.status, /APROVADO/, 'OP1 must remain approved but unpublished');
assert.equal(data.media.liveCampaign.id, '120249142919120261', 'live Meta campaign ID must match the activated manual guest campaign');
assert.equal(data.media.liveCampaign.status, 'PAUSED', 'manual guest campaign must remain paused after the destination regression');
assert.equal(data.media.liveCampaign.dailyBudgetUsd, 30, 'live guest campaign must remain capped at USD 30/day');
assert.equal(data.media.liveCampaign.officialWhatsapp, '+1 407-670-8839', 'live campaign must pin the official WhatsApp destination');
assert.equal(data.media.liveCampaign.destinationGuard, 'BLOCKED_TEST_DESTINATION', 'live campaign must expose the blocked test-destination guard');
assert.equal(data.media.liveCampaign.advantageCampaignBudget, false, 'live campaign must use ad-set budget, not Advantage+ campaign budget');
assert.equal(data.media.liveCampaign.advantageAudience, false, 'live guest ad set must keep Advantage+ audience disabled');
assert.equal(data.media.liveCampaign.activeAds.length, 0, 'no ad may remain active while the destination guard is blocked');
assert.equal(data.media.liveCampaign.pausedAds.length, 6, 'all six guest ads must remain paused until destination and placement preflight pass');
assert.equal(new Set(data.media.liveCampaign.pausedAds.map((ad) => ad.adId)).size, 6, 'paused live-campaign ad IDs must be unique');
assert.equal(data.seo.manualActions, 0, 'manual action status must be explicit');
assert.equal(data.seo.securityIssues, 0, 'security issue status must be explicit');
assert.equal(data.scorecard.find((kpi) => kpi.id === 'search_impressions').value, 1145, 'exact GSC impression snapshot changed unexpectedly');
assert.equal(data.seo.queries, 181, 'visible GSC query-row snapshot changed unexpectedly');
assert.equal(data.seo.queryCountStatus, 'partial_due_to_anonymization', 'GSC query count limitation must remain explicit');
assert.equal(data.seo.articleSignal.impressionGrowthPercent, 82, 'verified tourist article growth changed unexpectedly');
assert.notEqual(data.seo.articleSignal.impressionGrowthPercent, 700, 'unsupported +700% content claim must not return');
assert.equal(data.seo.indexationReasons.reduce((total, reason) => total + reason.pages, 0), data.seo.nonIndexedPages, 'GSC non-indexation reasons must reconcile');
assert.equal(data.seo.devices.reduce((total, device) => total + device.impressions, 0), 1145, 'GSC device impressions must reconcile');
assert.equal(data.seo.quality.coreWebVitals, null, 'field CWV must remain unavailable without sufficient CrUX data');

assert.equal(data.organicSocial.period, '24 jun–24 jul de 2026', 'Meta organic period changed unexpectedly');
assert.equal(data.organicSocial.timezone, 'Horário do Pacífico', 'Meta organic reporting timezone must remain explicit');
assert.equal(data.organicSocial.exportEvidence.canonicalFiles, 3, 'Meta organic evidence must contain three unique exports');
assert.equal(data.organicSocial.exportEvidence.downloadedFiles, 4, 'Meta organic downloaded file count changed unexpectedly');
assert.equal(data.organicSocial.exportEvidence.duplicateFiles, 1, 'Meta organic duplicate count changed unexpectedly');
assert.equal(data.organicSocial.exportEvidence.reportedDownloads, 5, 'browser-reported download count must remain separately recorded');
assert.equal(data.organicSocial.exportEvidence.plannerExportAvailable, false, 'Planner must not be represented as exportable');
assert.equal(data.organicSocial.summary.uniqueFeedPieces, 12, 'Meta organic unique feed inventory changed unexpectedly');
assert.equal(data.organicSocial.summary.facebook.views, 206, 'Facebook organic views changed unexpectedly');
assert.equal(data.organicSocial.summary.instagram.views, 562, 'Instagram organic views changed unexpectedly');
assert.equal(data.organicSocial.summary.instagram.likes, 35, 'Instagram organic likes changed unexpectedly');
assert.equal(data.organicSocial.summary.instagram.saves, 0, 'Instagram organic saves changed unexpectedly');
assert.equal(data.organicSocial.summary.instagram.follows, 0, 'Instagram organic follows changed unexpectedly');
assert.equal(data.organicSocial.calendar.recommendationStatus, 'not_scheduled', 'calendar recommendation must not imply a completed schedule');
assert.match(data.organicSocial.calendar.recommendation, /30 jul de 2026/, 'recommended organic slot changed unexpectedly');
assert.ok(data.scorecard.some((kpi) => kpi.id === 'meta_organic_ig_views' && kpi.status === 'verified'), 'verified Instagram organic KPI must be exposed');
assert.ok(data.scorecard.some((kpi) => kpi.id === 'meta_organic_fb_views' && kpi.status === 'verified'), 'verified Facebook organic KPI must be exposed');
assert.ok(data.actions.some((action) => action.id === 'balance_organic_calendar'), 'organic calendar action must be exposed');
assert.ok(data.integrations.some((integration) => integration.name === 'Meta orgânico' && integration.health === 'attention'), 'Meta organic evidence status must be visible');

console.log(`MOS KPI snapshot valid: ${data.scorecard.length} KPIs, updated ${data.updatedAt}`);
