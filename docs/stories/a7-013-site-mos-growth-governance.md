# Story A7-013 — Site → MOS Growth Governance Without Regression

**Status:** Ready for QA

**Created:** 2026-08-23

**Source:** Requisito autoritativo do proprietário: todo artigo, página regional, landing page e money page deve entrar no MOS como parte de um funil e cluster explícitos, receber dados vivos de busca/conversão e não regredir nem desaparecer quando houver uma nova publicação. O proprietário também autorizou preparar a conexão read-only do Google Ads nativo, preservando credenciais no servidor e sem alterar campanhas.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - "registry/schema and lifecycle architecture review"
  - "CLI discovery, validation and deterministic compiler tests"
  - "public-manifest security and secret-leak tests"
  - "MOS authentication and data-contract regression tests"
  - "GSC/GA4/Google Ads read-only integration tests"
  - "production drift, rollback and monitoring evidence"
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
  - "npm run build"
  - "git diff --check"
```

**Required handoffs:** `@architect` approves the cross-cutting registry/lifecycle/compiler design before implementation; `@qa` owns the independent final quality verdict; `@devops` alone may push, release or deploy.

## Story

**As an** A7 Laundry operator and growth decision-maker,
**I want** one governed registry to connect every deployable marketing URL to its funnel, cluster, release truth and measured outcomes,
**so that** the MOS always shows what exists in source, what is actually live, how TOFU/MOFU/BOFU assets work together and where search demand becomes qualified contact, paid order and revenue without losing prior progress.

## Confirmed Baseline and Regression Evidence

- The source sitemap currently inventories **97 URLs**, while the production build contract quarantines 35 scaled pages and emits a focused **62-URL production sitemap**. These numbers describe different layers and must never be presented as one interchangeable total. [Source: `marketing/seo-consistency/WAVE-0-BASELINE-2026-08-22.md`; `docs/stories/a7-003-conversion-observability.md`; `scripts/build-site.mjs`]
- The MOS funnel registry is a manually maintained array with **seven** entries. It does not represent the complete source or production URL corpus and has no explicit TOFU/MOFU/BOFU or cluster topology. [Source: `mos-app/google-kpis-contract.js`]
- `/plans` is verified in production but remains classified as `source_candidate` in the MOS registry. The Lake Buena Vista URL inventory contains `SEO-LBV-SMS`, but that deployed code is absent from the current registry entry. [Source: `marketing/seo-consistency/PLANS-RELEASE-EVIDENCE-2026-08-22.md`; `marketing/seo-consistency/URL-INVENTORY-2026-08-22.tsv`; `mos-app/google-kpis-contract.js`]
- A candidate MOS funnel catalog exists locally/behind preview, while the last authenticated production evidence states that production did not yet return `funnels`. Candidate and production truth must stay distinct. [Source: `marketing/seo-consistency/MOS-FUNNEL-CATALOG-EVIDENCE-2026-08-22.md`]
- GA4 and Search Console have live read-only collection paths. Google Ads has a native read-only contract and historical setup evidence, but its current MOS state is unavailable because upstream native reports have not completed successfully. It must remain `unavailable` until an authenticated report succeeds. [Source: `docs/stories/a7-003-conversion-observability.md`; `mos-app/google-ads-kpis-contract.js`; `mos-app/google-kpis-contract.js`]

## Business Invariants

- Source intent, build artifact, deployment observation and indexation policy/observation are independent axes. A source file, build output, preview or planned release never makes a funnel `active_production`.
- The public build manifest reports only non-sensitive artifact metadata with `artifactState: built` and intended indexation. It never asserts `active_production`, a verified deployment or an observed indexation result. Tokens, client secrets, refresh tokens, cookies, developer tokens and account credentials never enter source, browser bundles, logs, responses or evidence screenshots.
- The registry is the single governed source for classification; sitemap, MOS payloads, validation reports and build manifests are compiled views, not independent hand-maintained lists.
- Every marketing URL has an explicit owner, lifecycle state, content type, intent, funnel stage and cluster relationship. A non-funnel/system URL requires an explicit exclusion class and reason; it cannot disappear through an implicit default.
- Regional pages are authority-and-capture assets with distinct geographic/intent boundaries, not disposable location substitutions or doorway pages.
- Missing telemetry is `unavailable`, never zero. A click/contact event is not a lead, paid order or revenue without its declared reconciliation evidence.
- GSC/GA4/Google Ads joins must preserve source, period, freshness and match method. They may not manufacture causality or combine incompatible periods.
- Historical registry and audit evidence remain append-only. A new release updates observed state without overwriting the evidence of previous releases.
- CLI validates and compiles the governance model before the MOS observes it. The dashboard cannot become the authoring or control plane.
- This story authorizes read-only measurement connectivity and diagnostics. It does not authorize changing Google Ads campaigns, budgets, bids, keywords, creatives, conversion actions or billing.

## Scope

### Included

- Reconcile source inventory, production sitemap and MOS registry into one versioned URL/funnel governance model.
- Classify marketing assets by TOFU/MOFU/BOFU, content type, cluster, canonical owner, geographic boundary, audience, intent, conversion action and lifecycle/release state.
- Auto-discover every new or changed article, page, regional page, LP and money page during validation/build and block silent omission from the registry/MOS.
- Generate a non-sensitive public build manifest and an authenticated MOS catalog from the same compiled registry.
- Let a server-side observer reconcile the public build manifest, exact hashes and the production alias to derive observed deployment state; never derive it from a manual label or from the manifest alone.
- Join per-URL/per-funnel GSC, GA4 and Google Ads read-only data with explicit null/freshness semantics.
- Preserve release evidence, rollback targets and post-release monitoring checkpoints.
- Migrate the seven existing funnel entries and the current URL inventory without losing funnel codes, intent boundaries or prior audit records.

### Excluded

- Rewriting, merging, redirecting, canonicalizing, indexing or removing a page solely because it has low or unavailable performance.
- Automatic promotion of a source candidate to production without exact artifact verification and the existing QA/devops release authorities.
- Automatic SEO recommendations that mutate pages, sitemap, Google Ads or business data.
- Google Ads write scopes or mutations of campaign delivery.
- Exposure of authenticated MOS data in the public manifest.
- Declaring SEO/GEO/AI Search effectiveness, lead quality, sales or revenue without compatible observed evidence.

## Registry Contract — Required Outcomes

The exact storage technology and module boundaries require `@architect` approval before implementation. The governed model must nevertheless represent, validate and compile at least the following outcomes:

| Dimension | Required truth |
|---|---|
| Identity | Stable asset/funnel ID, canonical path and source file |
| Asset role | `money_page`, `regional_page`, `landing_page`, `guide`, `article`, `pricing`, or explicit non-funnel/system class |
| Journey | Explicit `tofu`, `mofu`, `bofu`, `retention` or `not_applicable`, with rationale |
| Cluster | Cluster ID, topic, parent/hub, supporting relationship and canonical intent owner |
| Audience and intent | Search/customer problem, geography, needed-by context and intended next action |
| Conversion | Funnel codes, contact destinations, event names and reconciliation boundary |
| Search quality | SEO/GEO/AI Search/E-E-A-T evidence status, reviewer/date and unresolved risks; no invented score |
| Source state | Authorial state such as `source_only`, `source_candidate`, `quarantined` or `retired`, independent from build/deployment observation |
| Artifact state | Build state such as `not_built` or `built`; the public manifest may declare only this axis and never `active_production` |
| Deployment observation | Server-derived `unobserved`, `preview_verified`, `active_production`, `production_drift`, `rolled_back` or `unavailable`, recorded through deterministic transitions and append-only evidence |
| Indexation | Intended robots/sitemap policy separated from observed public sitemap/robots and GSC indexation evidence |
| Release truth | Source commit/hash, build hash, deployment ID when server-observed, public hash, first/last observed time and rollback target |
| Performance | GSC, GA4 and Google Ads source/period/freshness/match method plus nullable metrics |
| Governance | Owner, last reviewed time, evidence references and explicit exclusion reason when applicable |

## Acceptance Criteria

### 1. Baseline reconciles all three corpora without hiding drift

- [ ] A CLI audit reports source-deployable URLs, source sitemap URLs, final production-build sitemap URLs, observed public sitemap URLs and registered MOS assets as separate counts.
- [ ] The baseline explains and deterministically reproduces the current `97 source sitemap → 62 production sitemap` relationship, including all quarantined/excluded URLs and reasons.
- [ ] The audit detects the current seven-entry registry gap, `/plans` status drift and missing `SEO-LBV-SMS` mapping before remediation.
- [ ] Every row in the current `URL-INVENTORY-2026-08-22.tsv` resolves to a registry record or an explicit, validated exclusion; no URL is silently dropped.

### 2. One versioned registry becomes the governed source of truth

- [ ] `@architect` records the approved registry schema, storage location, compiler boundaries, independent state axes and transition rules before `@dev` changes production code.
- [ ] The registry validates unique stable IDs, canonical paths, source files, funnel codes, parent/cluster relationships and allowed transitions within each state axis; no transition in one axis implicitly mutates another.
- [ ] Every marketing asset has explicit funnel stage, asset role, cluster, intent owner, audience, geography and next action.
- [ ] Cycles, missing parents, duplicate canonical owners, duplicate active funnel codes, conflicting regional intent and unknown enum values fail validation.
- [ ] Existing release/audit evidence is referenced rather than rewritten or duplicated as mutable truth.

### 3. New content cannot bypass MOS governance

- [ ] A CLI discovery command scans the build/public routing inputs for any new or changed article, page, regional page, LP or money page.
- [ ] During migration, the CLI reports legacy uncovered records explicitly and fails closed immediately for every newly added or changed marketing URL; it cannot silently increase uncovered debt.
- [ ] Global build/CI fail-closed enforcement activates only after a deterministic reconciliation proves 100% coverage of the in-scope baseline and the activation gate is recorded.
- [ ] A deliberately added fixture page proves the gate fails before registration and passes after a valid registry entry is added.
- [ ] Non-marketing/system pages require an allowlisted class and reason; a broad wildcard exclusion is rejected.
- [ ] The compiled MOS catalog is regenerated deterministically during the standard validation/build workflow without a second manual update.

### 4. Release state is observed, not asserted

- [ ] Source state, `artifactState`, deployment `observationState`, indexation intent and indexation observation are stored and displayed as separate axes.
- [ ] A built output produces `artifactState: built`; this value cannot be promoted or interpreted as `active_production` by the compiler, public manifest or MOS UI.
- [ ] `observationState: active_production` is reachable only when the server-side observer verifies the expected canonical, HTTP status and exact public artifact/hash on the production alias and appends the approved deployment evidence.
- [ ] A production page whose bytes/manifest no longer match the approved release becomes `production_drift` or equivalent and raises an alert; it is not silently relabeled.
- [ ] `/plans` becomes active only from its verified production evidence, and LBV includes every deployed funnel code including `SEO-LBV-SMS`.
- [ ] Rollback changes observed release state through a new append-only release observation; it never deletes the reverted release record.

### 5. A public build manifest exposes safe artifact truth

- [ ] The site build emits a stable, versioned public manifest containing only canonical URL, `artifactState: built`, intended indexation policy, asset/build version or hash and non-sensitive cluster/funnel identifiers approved by architecture/security review.
- [ ] The public manifest schema rejects `active_production`, `preview_verified`, `production_drift`, deployment verification timestamps and any other deployment `observationState`; those truths belong only to the authenticated server-side observation ledger.
- [ ] The manifest contains no account IDs that are not already public, personal data, tokens, secrets, internal file paths, raw analytics, customer records or authenticated MOS payloads.
- [ ] The authenticated server-side observer reads the same manifest and verifies its expected hashes against preview or the `a7laundry.com` production alias before appending `observationState` to the immutable ledger.
- [ ] Public manifest, observed sitemap and deployed assets reconcile in automated smoke tests; missing/stale manifest, a hash mismatch or a public URL absent from the expected artifact blocks promotion or yields `production_drift`/`unavailable` after observation.

### 6. MOS shows the complete growth architecture

- [ ] The authenticated MOS exposes portfolio views for TOFU/MOFU/BOFU, cluster/hub relationships, money/regional/supporting assets, source/artifact/deployment-observation axes and indexation intent/observation.
- [ ] Candidate, quarantined, active and drifted assets are visually and semantically distinct; only verified active assets count as active funnels.
- [ ] Every catalog row links canonical URL, funnel codes, cluster owner, intended action, evidence and latest observed release.
- [ ] MOS totals reconcile the compiled registry/build manifest with the authenticated observation ledger; the UI does not maintain its own hand-authored catalog or infer production from `artifactState`.
- [ ] Existing immutable audit timeline and A7-008 null/source/period semantics remain intact.

### 7. Search and conversion data stay live inside each funnel

- [ ] GSC joins by exact normalized canonical URL and reports clicks, impressions, CTR, average position, top queries, period and freshness; partial/anonymized query coverage is labeled.
- [ ] GA4 joins by canonical path and reports sessions, engaged sessions/users/views, contact microconversions and available key events with source, period and freshness.
- [ ] Google Ads joins use a documented deterministic key such as final URL plus campaign/ad identifiers and preserved UTM/click IDs; fuzzy matching cannot silently assign paid performance to a funnel.
- [ ] Each match exposes `exact`, `mapped`, `partial` or `unmatched` (or approved equivalents), and unmatched rows remain visible for remediation.
- [ ] Contact click, qualified lead, paid order, revenue and margin remain separate stages. Revenue/ROAS stay unavailable until reconciled through an approved durable source.
- [ ] No incompatible periods are summed; comparison requires labeled periods and sources.

### 8. Google Ads native read-only connectivity is diagnosable and truthful

- [ ] Preflight verifies manager relationship, customer ID, API version, server-only developer token, OAuth identity/scopes and access permissions without printing secret values.
- [ ] The existing native report contract is exercised read-only with sanitized diagnostics for authentication, authorization, quota, upstream and report-query failures.
- [ ] A successful authenticated response is required before the source can become `live` or `partial_live`; HTTP 500 or any failed report remains `unavailable`/`partial` with the failed reports listed.
- [ ] No Google Ads credential is written to the repository, browser bundle, public manifest, test fixture or log.
- [ ] Automated tests prove all API operations are read-only and that campaign/budget/bid/keyword/ad/conversion mutation methods are absent from the integration path.

### 9. Regression gates cover content, release and telemetry contracts

- [ ] Focused tests cover registry completeness, schema validation, stage/cluster topology, lifecycle transitions, sitemap reconciliation, manifest safety, deterministic compilation and production drift.
- [ ] Contract tests preserve authentication, null-not-zero semantics, metric provenance and append-only audit behavior from A7-008/A7-009.
- [ ] Test fixtures cover a new page, renamed/missing source, quarantined page, canonical collision, funnel-code collision, rollback, stale telemetry, failed Google Ads report and unmatched analytics row.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, MOS tests, focused governance tests, `npm run validate:structure`, `npm run validate:agents` and `git diff --check` pass before review.
- [ ] CI publishes the read-only reconciliation report as evidence and blocks promotion on any critical drift.

### 10. Release, rollback and monitoring are evidence-backed

- [ ] `@qa` independently verifies the source registry, compiled artifact, MOS preview, manifest safety and exact production candidate before a release verdict.
- [ ] `@devops` alone performs push/release/deploy and records commit, deployment ID, hashes, public manifest, sitemap, rollback target and authenticated MOS smoke evidence.
- [ ] Immediate production smoke verifies authentication, registry count, stage/cluster views, `/plans`, `SEO-LBV-SMS`, GA4/GSC freshness, Google Ads truth state and no secret exposure.
- [ ] Monitoring at immediate, 24h, 72h, 7d, 14d and 28d records availability, drift, sitemap/indexation, telemetry freshness, contacts, qualified leads, paid orders and reconciled revenue where available.
- [ ] Rollback is executable for authentication regression, secret exposure, registry loss, false active status, sitemap/manifest mismatch, analytics misattribution or material MOS/API failure.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aios-core/core-config.yaml`. Quality validation uses the manual and automated project gates defined in this story.

## Tasks / Subtasks

- [x] **Task 1 — Freeze and reconcile baseline** (AC: 1)
  - [x] Capture dirty-worktree boundary, source commit, current deployments and rollback targets without modifying unrelated owner changes.
  - [x] Produce the five-corpus URL reconciliation and current drift report.
  - [x] Preserve evidence for the seven-entry registry, `/plans`, LBV funnel codes and current Google Ads status.

- [x] **Task 2 — Approve the governance architecture** (AC: 2, 4, 5)
  - [x] `@architect` records the registry schema, independent state machines, compiler, safe public build manifest, server-side observer and evidence boundaries.
  - [x] `@po` validates that classifications and lifecycle rules trace to this story and existing requirements.
  - [x] Record migration and compatibility plan for current MOS/audit contracts.

- [x] **Task 3 — Implement CLI discovery, validation and compilation** (AC: 2, 3, 9)
  - [x] Create the governed registry and migrate existing funnel/URL metadata.
  - [x] Add deterministic discovery, lint, compile and reconciliation commands.
  - [x] Enforce fail-closed immediately for newly added/changed marketing URLs while reporting legacy coverage debt explicitly.
  - [x] Activate global fail-closed enforcement only after the 100%-coverage gate passes, keeping CLI as the control plane.

- [x] **Task 4 — Implement build artifact truth and observed deployment truth** (AC: 4, 5, 10)
  - [x] Generate the safe public manifest with `artifactState: built` and no deployment observation fields.
  - [x] Implement the authenticated server-side observer against preview/production aliases and exact expected hashes.
  - [x] Add drift detection, append-only observations and rollback semantics.
  - [x] Add exact public smoke and secret-leak tests.

- [x] **Task 5 — Replace the MOS hand-maintained catalog** (AC: 6)
  - [x] Make the authenticated API/UI consume the deterministic compiled registry.
  - [x] Add journey, cluster, source/artifact/observation, indexation, release and evidence views.
  - [x] Preserve authentication and immutable audit history.

- [ ] **Task 6 — Join GSC, GA4 and native Google Ads** (AC: 7, 8)
  - [x] Normalize exact keys, match status, periods, freshness and null semantics.
  - [ ] Diagnose/complete the read-only Google Ads path using server-only credentials and sanitized errors.
  - [x] Keep contact, lead, order, revenue and margin stages separate.

- [ ] **Task 7 — Execute independent QA and release** (AC: 9, 10)
  - [x] Run unit, contract, fixture, build, MOS, auth, public-manifest and drift suites.
  - [ ] Obtain independent `@qa` verdict; remediate every critical/high finding.
  - [ ] Hand the exact approved artifact to `@devops`, verify production and record rollback.

- [ ] **Task 8 — Operate the living growth loop** (AC: 7, 10)
  - [ ] Run scheduled collection/reconciliation without page or campaign mutations.
  - [ ] Record monitoring checkpoints and surface stale/unmatched sources in MOS.
  - [ ] Convert findings into separately authorized stories; do not silently change SEO or Ads.

## Incremental Delivery and Activation Gates

Each milestone must remain independently testable and reversible. A later milestone cannot be activated merely because its code exists; its entry gate and rollback evidence must be recorded first.

| Milestone | Deliverable | Activation gate | Reversal / safe fallback |
|---|---|---|---|
| M0 — Freeze | Five-corpus baseline and dirty-worktree boundary | Counts, exclusions and known drift reproduced deterministically | Read-only evidence only; no runtime change |
| M1 — Contract | Versioned registry schema and four independent truth axes | `@architect` records schema, compiler and transition decision | Registry not consumed by build or MOS |
| M2 — Shadow registry | Existing seven funnels and URL inventory imported in report-only mode | Deterministic compile; no duplicate IDs/canonicals/codes; legacy gaps visible | Keep current MOS registry authoritative while shadow output is compared |
| M3 — Build manifest | Public manifest with `artifactState: built` and indexation intent only | Schema/secret-leak tests reject all observation fields | Stop emitting manifest; current site output remains unchanged |
| M4 — Observer shadow | Server-side preview/production observation and append-only ledger | Exact alias/hash/status tests pass without changing displayed MOS state | Disable observer schedule and retain ledger/evidence |
| M5 — MOS dual-read | MOS compares current catalog with compiled registry + observation ledger | Authenticated API/UI parity and null/provenance regression tests pass | Revert MOS read path to current catalog without deleting new evidence |
| M6 — Coverage | 100% of in-scope baseline governed or explicitly excluded | Reconciliation report has zero silent omissions and zero unresolved critical collisions | Continue report-only legacy mode; do not enable global gate |
| M7 — Enforcement | Global build/CI fail-closed governance | M6 remains green and new/changed-page fixture tests pass | Disable global gate while preserving immediate gate for new/changed URLs |
| M8 — Live measurement | GSC/GA4 joins and diagnosable Google Ads read-only source | Exact/mapped/partial/unmatched and freshness contracts pass; secrets remain server-only | Mark failed source `unavailable`; preserve other sources and MOS catalog |
| M9 — Release/operate | QA-approved production read path and monitoring loop | `@qa` verdict, `@devops` exact release, authenticated smoke and rollback target | `@devops` restores approved artifact/read path; observer records `rolled_back` |

No migration milestone may rewrite or delete prior audit/release evidence. M7 is expressly blocked until M6 proves 100% coverage.

## Dev Notes

### Required implementation sequence

`discover → validate → compile → build manifest (artifactState=built) → preview → QA → server-side observe → observation ledger → MOS ingest → monitor`

The compiler must be deterministic: identical governed inputs produce byte-identical compiled registry/manifest outputs. The public manifest is evidence of a built artifact only. Server-side observation may append a new release-evidence record but may not rewrite source intent or historic records.

### Required truth layers

```text
Source inventory (97 today)
  → governed classification
  → production build/indexation policy (62 today)
  → preview artifact
  → public build manifest (`artifactState: built`) + observed sitemap/assets
  → authenticated server-side deployment observation ledger
  → authenticated MOS catalog
  → GSC / GA4 / Google Ads measurement joins
  → contact / qualified lead / paid order / revenue reconciliation
```

The two current sitemap totals are both valid only with their layer attached. Tests and MOS labels must prevent “97” from being interpreted as publicly promoted URLs and “62” from being interpreted as the complete source corpus.

### Existing contracts to preserve

- A7-008: live/historical/manual separation, source/period labels and null-not-zero behavior.
- A7-009: append-only audit registry, checksums and immutable history.
- A7-003: conversion attribution contracts, production indexation quarantine and native Google Ads read-only boundary.
- A7-011/A7-012: geo-page intent boundaries, funnel codes, public release monitoring and no false conversion/revenue claims.

### Security and authority handoffs

- `@sm/@po`: story and acceptance scope.
- `@architect`: schema, lifecycle, compiler and public-manifest architecture.
- `@dev`: implementation within this story.
- `@qa`: independent quality verdict.
- `@devops`: push, release, production configuration and deploy.
- Any new OAuth consent, manager-account permission or durable secret provisioning that cannot be completed with already authorized server configuration is an explicit owner handoff. Secret values are never requested in chat or committed.

## Testing

- Registry/schema/topology and four-axis separation unit tests.
- URL discovery and source/final/public sitemap reconciliation tests.
- Deterministic compiler and safe public-manifest snapshot tests, including rejection of every deployment `observationState` field.
- Lifecycle transition, exact promotion, drift and rollback tests.
- MOS API/UI contract and authentication regression tests.
- GSC/GA4/Google Ads exact/mapped/partial/unmatched and freshness tests.
- Google Ads read-only/no-mutation/security tests.
- Existing A7-008/A7-009/audit/tracking/build suites.
- Full project quality gates required by Constitution.

## Definition of Done

- [ ] All Acceptance Criteria are checked with evidence.
- [ ] Registry and architecture decisions are reviewed by the authorized agents.
- [ ] Every current marketing URL is governed or explicitly excluded.
- [ ] New/changed-page omission fails closed immediately; global baseline enforcement is enabled only after 100% coverage.
- [ ] MOS production reconciles the compiled registry/build manifest with the authenticated observation ledger and observed sitemap.
- [ ] `/plans` and LBV funnel-code drift are corrected from evidence.
- [ ] GA4/GSC are fresh and Google Ads is either verified read-only live or truthfully unavailable with actionable sanitized diagnostics.
- [ ] All quality gates pass and `@qa` records the verdict.
- [ ] `@devops` records release, production smoke and rollback evidence.
- [ ] Story checklist, Validation Notes and File List are current.

## Validation Notes

- Story creation only; no application code, sitemap, MOS registry, credentials, deployment or external account was modified.
- Baseline claims were traced to existing repository evidence on 2026-08-23.
- The dirty worktree was preserved. This story does not claim that its implementation has begun or that the MOS candidate is live.
- Story-template validation passed for all required sections, executor/quality-gate separation, zero unresolved template placeholders and existence of eight directly referenced evidence/code paths.
- `@po` reconciled the story with the approved `@architect` direction: the public manifest is build-only (`artifactState: built`), while `active_production` is a server-observed `observationState` stored append-only.
- The story is approved for incremental development. M1 must record the architecture decision before production-code changes, and M7 global fail-closed enforcement remains blocked until M6 proves 100% in-scope coverage.
- `git diff --check -- docs/stories/a7-013-site-mos-growth-governance.md` passed.
- The AGENTS.md commands `npm run validate:structure` and `npm run validate:agents` could not run because those scripts are absent from the current root `package.json`; this repository drift is recorded rather than misreported as a passing gate.
- M0/M1 candidate implementation began after PO approval. The governed registry reconciles 97 source URLs, 35 quarantined routes and 62 final-build sitemap URLs; seven managed funnels retain their aliases and LBV now includes `SEO-LBV-SMS`.
- The public candidate manifest declares only `artifactState: built`; secret/deployment-observation mutation tests reject unsafe fields. Production still returns HTTP 404 for this path, so no active state is claimed from the candidate.
- The MOS observer now validates a closed manifest schema, authorized origin, relative canonical paths, counts and hashes before checking routes. Exact HTTP/canonical/hash without an approved append-only observation remains `verified_unledgered`; it cannot become `active_production` from the manifest alone.
- Google Ads remains read-only and unavailable in production. Candidate defaults to API v25, requires the manager login customer ID and rejects any non-SELECT/mutate-shaped query before transport.
- Initial independent architecture and QA gates failed the owner-facing preview because the first observer could fall back to stale manual release labels, accepted malformed manifests, exposed SSRF/XSS paths, observed only seven routes without labeling scope and lacked an append-only ledger. No preview or production release was attempted.
- The P0 remediation removed the runtime manual fallback, added strict manifest/origin/path/redirect/content-type/size validation, blocked raw observation injection, labeled the seven-route hash scope, separated source/artifact/indexation/build-sitemap/route states in the UI and made root `npm test` execute the complete MOS suite. Focused tests now include forged counts, empty corpus and absolute-path SSRF mutations.
- The revised candidate governs 98 marketing assets and three exact system exclusions, discovers 101 deployable HTML files, preserves the 97-source/62-built/62-public-sitemap distinction and compiles authored identity locks, cluster topology and tracking v2 from one registry.
- Append-only release evidence now uses a closed-schema, deeply immutable hash chain. Verified states are derived from route/sitemap evidence; QA and DevOps/owner authority are mandatory; rollback must restore a different artifact that was previously active.
- Ledger validation now binds schema v2, unique route identities, expected canonical/robots state and exact route evidence. A stale production observation expires after 24 hours instead of keeping unprobed assets active indefinitely; drift/unavailable observations can be emitted without release authority while verified preview/production remains approval-gated.
- A deterministic exact-artifact observation passed 98/98 routes and 62/62 sitemap URLs. This does not substitute for the protected preview ledger gate.
- GSC/GA4 joins cover all 98 governed assets, remain exact-canonical and nullable, and avoid summing duplicate GA4 report grains. Native Ads rejects foreign/mixed final URLs and never duplicates ambiguous cost. Native Google Ads remains unavailable pending successful server-only preflight.
- Live read-only evidence preserved the Comforter v1 signal (59 impressions, one click, position 8.1; two organic sessions) and kept v1/v2 under adjudication rather than applying a destructive canonical/indexation change without URL Inspection.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-23 | 0.2.0 | PO validation: separated artifact/deployment truth, constrained public manifest and added reversible M0–M9 activation gates. | @po |
| 2026-08-23 | 0.1.0 | Initial story derived from owner requirement and repository forensic evidence. | @sm |

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `node scripts/validate-content-registry.mjs`
- `node --test scripts/test-content-registry.mjs`
- `npm --prefix mos-app test`
- `npm run lint && npm run typecheck && npm test && npm run build:public && git diff --check`
- Public baseline probe: sitemap 62 URLs / 47 blog URLs; growth manifest HTTP 404 before release.

### Completion Notes List

- Added a governed 97-entry content registry with explicit journey stages, clusters, source lifecycle, indexation policy and seven managed funnel definitions.
- Expanded governed discovery to 98 marketing assets plus three explicit system exclusions after finding the sitemap-omitted Davenport page.
- Added fail-closed coverage, collision, pillar and quarantine checks plus a deterministic public artifact manifest.
- Added full-corpus release-ledger reconciliation and a dual-read portfolio UI; no MOS or site deployment was performed.
- Hardened the observer to fail closed on unavailable or malformed input; a verified route is not an active release without external ledger evidence.
- Native Google Ads remains blocked on server configuration/permission proof and is truthfully unavailable.
- Added deterministic content CLI/compiler, full-target observer, append-only release ledger, compiled browser tracking map and exact final-URL Google Ads funnel joins.

## File List

- `docs/stories/a7-013-site-mos-growth-governance.md`
- `docs/architecture/site-mos-growth-governance.md`
- `marketing/growth/content-registry.mjs`
- `marketing/seo-consistency/PROMPT-MESTRE-MOS-GROWTH-NO-REGRESSION-2026-08-23.md`
- `scripts/validate-content-registry.mjs`
- `scripts/build-growth-manifest.mjs`
- `scripts/test-content-registry.mjs`
- `scripts/growth-content.mjs`
- `scripts/growth-release.mjs`
- `scripts/lib/content-corpora.mjs`
- `scripts/lib/content-registry-compiler.mjs`
- `scripts/lib/release-ledger.mjs`
- `scripts/build-site.mjs`
- `package.json`
- `mos-app/growth-manifest-contract.js`
- `mos-app/growth-target-observer.js`
- `mos-app/release-ledger-contract.js`
- `mos-app/generated/content-catalog.json`
- `mos-app/generated/a7-growth-map.js`
- `mos-app/generated/release-ledger.json`
- `mos-app/api/google-kpis.js`
- `mos-app/google-kpis-contract.js`
- `mos-app/google-ads-kpis-contract.js`
- `mos-app/tests/growth-manifest.test.mjs`
- `mos-app/tests/growth-target-observer.test.mjs`
- `mos-app/tests/release-ledger.test.mjs`
- `mos-app/tests/google-ads-kpis.test.mjs`
- `mos-app/tests/dashboard.test.mjs`
- `a7-command-center.html`
- `a7-tracking.js`
- `vercel.json`
- `marketing/seo-consistency/MOS-GROWTH-IMPLEMENTATION-EVIDENCE-2026-08-23.md`

## QA Results

- Initial `@architect` and `@qa` verdicts: **FAIL for owner-facing preview**. The candidate remains shadow-only and was not deployed.
- Security/truth fixes were applied and the complete MOS suite passes 62/62. Independent QA and architecture authorize creation of a protected preview candidate; production remains gated by its immutable remote observation chain.
- Current candidate gates: lint, typecheck, root test (43 TAP plus validators and full MOS), public build, observed public sitemap 62/62, full local and protected-Preview route observation 98/98, structure validation, agent validation (zero errors; 121 pre-existing dependency warnings) and diff check all pass. Fresh full-registry drift/unavailable evidence now overrides the seven-funnel spot check, so a broken non-managed route cannot remain hidden. Protected Preview observation `obs-20260823T210210701Z-5fafa7505eaa` is appended as `preview_verified`; authenticated MOS Preview `dpl_8hcoiAwCYyMmpdKexG8CczkCd2BQ` returns the 98-asset catalog and one-record ledger. GA4/GSC remain fail-closed in Preview because A7-003 intentionally binds Google federation to the Vercel Production subject. Exact no-rebuild Production promotion, authenticated production smoke, chained `active_production` observation and temporary Preview credential cleanup remain pending.
