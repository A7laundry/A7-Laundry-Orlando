# Story A7-008 — MOS Data Truth

**Status:** Ready for Review

**Created:** 2026-08-15

**Source:** Requisito autoritativo de Dennis: corrigir o MOS para não misturar dados vivos, históricos e manuais de forma enganosa.

## Story

**As an** A7 Laundry operator or decision-maker,
**I want** every MOS metric to state its source, period and availability truthfully,
**so that** current decisions are never based on stale, fallback or manually reported data presented as live.

## Business Invariants

- The MOS remains protected by its existing authentication boundary.
- Historical evidence remains available only when explicitly identified as historical context.
- Manual data remains usable only when separated from automated sources and visibly labeled as manual.
- Missing or failed upstream data is represented as unavailable, never inferred as zero or replaced by an older number.

## Acceptance Criteria

- [x] A historical snapshot never appears as current data or as an unlabeled fallback for a live source.
- [x] When an API request fails or a live source is unavailable, the affected metric displays an unavailable state and does not display a previous numeric value in its place.
- [x] Every metric card identifies its data source and reporting period in the visible MOS interface.
- [x] Manually entered or owner-reported data is displayed in a separate section or dataset and is visibly labeled as manual.
- [x] Sales and revenue are not labeled or presented as live unless their current values are verified through GA4 and/or Stripe, according to the metric's declared source.
- [x] Historical, live and manual values are not combined into a single total or comparison without explicit separation and labeling of each origin and period.
- [x] Existing MOS authentication is preserved: protected dashboard and data routes remain inaccessible without a valid authenticated session.
- [x] Automated tests cover historical-snapshot exclusion from current fallback, API-failure unavailable behavior, card source/period labels, manual-data separation, sales/revenue live-label restrictions and authentication preservation.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check` pass before review.
- [ ] No deploy, production-data mutation, campaign change or external-system write is performed as part of implementation without separate authorization.

## Tasks

- [x] Inventory MOS metrics and classify each one as live, historical or manual.
- [x] Remove historical numeric fallback behavior from current/live metric states.
- [x] Implement explicit unavailable states for upstream/API failures.
- [x] Add visible source and reporting-period metadata to metric cards.
- [x] Separate and label manual or owner-reported data.
- [x] Prevent sales and revenue from being presented as live without verified GA4/Stripe provenance.
- [x] Preserve and regression-test the existing authentication boundary.
- [x] Add automated regression coverage for all acceptance criteria.
- [x] Run all repository quality gates.
- [x] Update this story's checklist, validation notes and File List.

## Scope Notes

- This story corrects presentation and provenance semantics in the MOS; it does not authorize modifying historical source records.
- A dated snapshot may remain visible as historical context, but it must not populate a current/live value when the current source fails.
- “Unavailable” must remain distinguishable from a valid numeric zero returned by an available source.
- Existing authentication behavior is a protected invariant, not a redesign target.

## Validation Notes

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Root `npm run build`: passed.
- `git diff --check`: passed.
- `cd mos-app && npm test`: passed — 36 tests plus protected MOS build.
- Browser validation of the compiled MOS bundle: passed for unavailable current state, source/period labels, manual separation and historical labeling.
- Root `npm test`: passed after reconciling the in-memory adapter with its approved `shadow_ephemeral` contract and deriving cookie validity from `RETENTION_DAYS`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check`: all passed on 2026-08-15.
- Production release remains an explicit `@devops` action.

## File List

- `docs/stories/a7-008-mos-data-truth.md`
- `a7-command-center.html`
- `mos-app/api/google-kpis.js`
- `mos-app/google-kpis-contract.js`
- `mos-app/tests/dashboard.test.mjs`
- `mos-app/tests/google-kpis.test.mjs`
- `lib/attribution-store.js`
- `scripts/test-attribution-v2.mjs`
