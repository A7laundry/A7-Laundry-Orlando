# Story A7-035 — A7 Orlando OS Home v2 mínima e read-only

**Status:** Done — Production READY

**Created:** 2026-09-01

**Sources:** GO do Owner em 2026-09-01; `docs/audits/2026-09-01-orlando-os-home-v2-diagnostic.md` §§1–18; Story A7-034 concluída e Owner Finance Dashboard em Production

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
quality_gate_tools:
  - focused-tests
  - lint
  - typecheck
  - full-test-suite
  - production-build
  - authenticated-role-smoke
```

## Story

**As the** A7 Orlando Owner or Operator,

**I want** a Home enxuta, hierárquica e baseada somente em fatos operacionais e financeiros governados,

**so that** I can identify the current state of the business and the next required actions without historical records, unavailable data or unauthorized financial information distorting the workday.

## Context and decision

The current Home is useful as a queue index but gives eleven cards the same visual weight and builds its initial priority list from a broader universe than its counters. Delivered, cancelled or historical orders can consequently appear below zeroed active-operation counters.

The approved solution is the minimum read-only Home v2 described in the diagnostic:

1. fix the initial queue so it contains only active, actionable work;
2. derive one governed Home contract through service and CLI before adding the API/UI;
3. reuse the existing operational snapshot and Owner Finance contract;
4. show financial blocks only to Owner and omit them from the Operator server payload;
5. present four operational groups, non-zero exceptions and at most five deterministic next actions;
6. compare the latest seven calendar days with the immediately preceding seven days for Owner.

The Owner GO also approves the diagnostic's bounded terminology: `Ready for dispatch` instead of claiming a driver assignment, and `Average paid order` instead of dividing paid revenue by newly accepted but unpaid orders.

## Scope lock

### In scope

- A single read-only Home service contract derived from current operational and financial read models.
- A CLI command that proves the Home contract before the browser UI uses it.
- A private authenticated Home API with role-aware Owner/Operator payloads.
- Owner blocks: Business Today, Today's Operation, Needs Attention, What Needs to Happen Now and Last 7 Days.
- Operator blocks: Today's Operation, Needs Attention and What Needs to Happen Now; no financial fields are serialized.
- Active queue correction, deterministic ordering and a five-item payload limit.
- Existing-queue drill-downs whose card count and result set use the same service rule.
- Responsive desktop/mobile hierarchy plus loading, empty, unavailable and error states.

### Explicitly out of scope

- Any migration, table, column, view, materialized view, index or database cache.
- Any financial write, invoice/payment mutation or Cash/Zelle ingestion.
- Stripe, WhatsApp, Google Ads, `/order`, attribution, document renderer or lifecycle changes.
- Driver identity, assignment, route or stop tracking.
- An inferred `invoice sent`/`payment link sent` state.
- Overall on-time rate, forecast, CAC, LTV, ROAS, churn, cohorts or accounting ledger.
- Charts, user-customizable cards, scheduled jobs, warehouse or framework replacement.
- W2, W3 or any unrelated feature.

## Existing contracts to reuse

| Need | Existing source | Required use |
|---|---|---|
| Active operation, counters, SLA and next action | `systemOperationsService.today()` / `GET /api/system/today` | Reuse server-side rules; do not recreate business logic in the browser. |
| Finance by governed period | `systemFinanceService.report()` / `a7_orlando_owner_finance(date,date)` | Owner only; use authoritative `paid_at` and current availability/null semantics. |
| Operational data access | `getSystemOperationalSnapshot()` | Aggregate once; do not fetch per order. |
| Finance data access | `getSystemOwnerFinance()` | Reuse Today, current seven days and previous seven days. |
| Existing drill-downs | Pedidos, Atendimento and Faturamento views | Open the corresponding governed filters instead of creating parallel pages. |
| Timezone | `America/New_York` | All day and seven-day boundaries are server-side calendar boundaries. |

## Governed Home contract

### Owner-only business metrics

| Metric | Contract |
|---|---|
| Revenue Today | `confirmed_service_revenue` from the finance read model for today; confirmed service revenue only, excluding tips and unavailable Cash/Zelle facts. |
| Orders Today | Real, non-QA, non-cancelled orders whose `accepted_at` is today in Orlando. |
| Average paid order | `confirmed_service_revenue / paid_order_count` for the same `paid_at` period; no paid orders returns `null`/`—`. |
| Pounds Today | Sum of real `actual_lbs` whose `weighed_at` is today; the secondary average divides by orders weighed today, not Orders Today. |
| Last 7 Days | Today plus the previous six days, compared with the immediately preceding seven days for revenue, paid orders, average paid order and paying customers. A zero previous base yields `null`/`—`, never infinity. |

Revenue labels must state the existing coverage: reconciled confirmed service revenue. The Home must not imply that unavailable manual Cash/Zelle receipts are included.

### Today's Operation

| Group | Rule/subtitle |
|---|---|
| Pickups | Active orders still with the customer/awaiting pickup, plus the next known pickup window. Missing windows become Needs Attention. |
| With driver | Custody `with_driver_pickup` and `with_driver_delivery`, split in the subtitle; no driver name or assignment claim. |
| Processing | Production `processing`, plus known actual pounds only. |
| Ready | Production `ready` and not delivered, split by `at_laundry`, `with_driver_delivery` and `bell_desk`. |

`At Laundry` may appear only as a clearly secondary aggregate of awaiting weight, awaiting processing, processing and ready-at-laundry; it must not look like a fifth independent order universe.

### Needs Attention

Render only non-zero blocks:

1. Customer waiting: actionable leads without an accepted order.
2. Payments pending: real unpaid orders, with amount only when `service_amount` is known; distinguish not invoiced, invoice issued and failed without claiming that an invoice/link was sent.
3. Express risk/late: amber for attention/risk and red for late, using the approved 4h/2h SLA contract.
4. Ready for dispatch: ready, paid and still at the laundry.
5. Operational blockers: review state, missing initialized state, Express without `promised_by`, pickup without a window or an incompatible state combination.

### What Needs to Happen Now

Return at most five active, non-QA items. Exclude delivered, cancelled and historical imports with no current action. Sort deterministically:

1. Express late;
2. Express risk;
3. structural blocker;
4. nearest pickup/delivery window;
5. longest waiting for action.

Each row contains only the safe operational reference, customer display data already authorized inside `/sistema`, canonical hotel when available, service, deadline, payment state and existing `next_action.label`. The Home must not introduce new PII fields.

## Acceptance Criteria

- [x] **AC-01 — CLI first.** `scripts/a7-system-home.mjs` can validate the Owner and Operator Home contracts before the UI is used, including today, current 7 days and previous 7 days.
- [x] **AC-02 — Read-only service.** `lib/system-home-service.js` derives the response exclusively from existing read contracts, performs no write and introduces no database migration or environment secret.
- [x] **AC-03 — Active universe reconciliation.** Home operational cards, Needs Attention blocks, five-item queue and their drill-downs exclude QA, cancelled, delivered and non-actionable historical records and reconcile to the same server-side rule.
- [x] **AC-04 — Deterministic priority.** The next-action list contains at most five records and follows the approved late → risk → blocker → nearest window → longest-wait order with a stable tie-breaker.
- [x] **AC-05 — Owner business truth.** Revenue Today, Orders Today, Average paid order and Pounds Today use the formulas, cohorts, date fields and null semantics defined in this story.
- [x] **AC-06 — Owner seven-day comparison.** Current and previous seven-day periods are adjacent Orlando calendar ranges; deltas reconcile to their source values and a zero comparison base renders unavailable rather than infinity.
- [x] **AC-07 — Operator least privilege.** An authenticated Operator receives operational sections only. Business Today, Last 7 Days and all underlying financial values are absent from the server response, HTML data and browser state—not merely hidden with CSS.
- [x] **AC-08 — Needs Attention truth.** Only non-zero exceptions render; missing amounts remain unknown/partial, no driver is invented and no invoice/link is described as sent without a canonical state.
- [x] **AC-09 — Operational pipeline.** Pickups, With driver, Processing and Ready follow the approved custody/production rules and expose only the specified truthful subtotals.
- [x] **AC-10 — Drill-down integrity.** Every clickable card opens the existing governed view/filter for the same universe, and automated tests prove card count equals the corresponding complete result count before the five-row presentation limit.
- [x] **AC-11 — Time and edge semantics.** Calendar boundaries use `America/New_York`; empty days, DST boundaries, refunds, partial/missing tips, unknown weights, missing pickup windows and missing Express promises never become fabricated zeros or facts.
- [x] **AC-12 — UI hierarchy.** Desktop shows the approved Owner or Operator section order; mobile prioritizes Needs Attention → Today's Operation → What Needs to Happen Now → Owner business sections. Essential information requires no hover and no page-level horizontal overflow occurs at 390px.
- [x] **AC-13 — Resilient presentation.** Loading, empty, partial/unavailable and error states are explicit; an API failure cannot silently display zero revenue or zero work.
- [x] **AC-14 — Bounded impact.** Existing Stripe, WhatsApp, Ads, `/order`, attribution, invoice, PDF/label, payment, delivery and finance-dashboard behavior remains unchanged.
- [x] **AC-15 — Quality gates.** Focused tests, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass; authenticated Owner and Operator read-only smokes demonstrate authorization, reconciliation, responsive behavior and zero operational/financial mutations.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aios-core/core-config.yaml`. Quality validation uses the manual review and repository gates defined in AC-15.

## Tasks / Subtasks

- [x] **Task 1 — Freeze fixtures and contract tests before implementation** (AC: 3–11, 14)
  - [x] Capture active, delivered, cancelled, QA and historical-no-action order fixtures.
  - [x] Cover empty day, Orlando day boundary/DST, refund, partial tip coverage, missing weight/window/promise and prior-period-zero cases.
  - [x] Assert all services remain side-effect free.
- [x] **Task 2 — Implement the Home service contract** (AC: 2–11)
  - [x] Add `lib/system-home-service.js` and compose independent existing reads in parallel where applicable.
  - [x] Derive operational groups, Needs Attention, blockers, Orders/Pounds Today, five deterministic priorities and Owner comparisons.
  - [x] Produce distinct Owner and Operator payload allowlists; do not assemble an Owner payload and strip it in the browser.
  - [x] Avoid N+1 detail reads and limit only the presentation queue, not reconciliation totals.
- [x] **Task 3 — Implement and prove the CLI** (AC: 1, 2, 5–7, 11)
  - [x] Add `scripts/a7-system-home.mjs` with bounded Owner/Operator output and clear source/period/availability reporting.
  - [x] Add the corresponding package script without changing unrelated commands.
  - [x] Run CLI fixture and safe read-only environment smokes before API/UI work.
- [x] **Task 4 — Add the private role-aware Home API** (AC: 2, 7, 13–14)
  - [x] Add `api/system/home.js` using the established session/role checks.
  - [x] Accept read requests only, validate role server-side and fail closed when identity or sources are unavailable.
  - [x] Verify responses contain no secrets, raw attribution payloads, payment identifiers or additional customer PII.
- [x] **Task 5 — Redesign the Home UI without browser business logic** (AC: 3, 5–10, 12–14)
  - [x] Replace the eleven equal-weight cards with the approved role-specific hierarchy.
  - [x] Keep the existing shell/palette, widen the desktop working area only as needed and use semantic color solely for meaningful status.
  - [x] Wire existing drill-downs using identifiers/filters returned by the service.
  - [x] Implement loading, empty, partial/unavailable and error states plus mobile order and accessibility behavior.
- [x] **Task 6 — Focused verification and regression** (AC: 3–15)
  - [x] Prove card/list reconciliation and deterministic priority with automated tests.
  - [x] Prove Operator responses and browser state contain no finance keys/values.
  - [x] Prove finance Today/7d figures match the existing Owner Finance report for identical periods.
  - [x] Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.
  - [x] Perform authenticated read-only Owner and Operator desktop/mobile smokes with no created or modified business records.
- [x] **Task 7 — Release and rollback readiness** (AC: 14–15)
  - [x] Build an isolated application artifact whose diff contains only this story's bounded files.
  - [x] Record the immutable pre-cutover deployment ID before any Production promotion.
  - [x] Confirm no migration is pending or required and document zero-mutation smoke evidence.
  - [x] Update this story's checklist, validation evidence and final file list before review.

## Dev Notes

### Architecture and implementation guardrails

- CLI → service/observability → API/UI is mandatory. The UI renders the Home contract and must not calculate financial, SLA, priority or reconciliation rules.
- The story is an application projection over existing facts. A database change is a scope violation and requires a separate story/approval.
- Owner finance reads may run in parallel for today, current seven days and previous seven days. Operator must not invoke finance reads at all.
- Reuse the current vanilla JS/CSS shell and established session helpers. Do not add a framework or chart dependency.
- Use one operational snapshot per Home request and aggregate in memory; do not fetch order details in a loop.
- Preserve `null`, `partial` and `unavailable`. Unknown is never rendered as zero.
- The source diagnostic is authoritative for KPI definitions, layout hierarchy, drill-downs, performance constraints and exclusions: `docs/audits/2026-09-01-orlando-os-home-v2-diagnostic.md` §§7–17.
- A7-034 is the authoritative completed dependency for financial formulas and Owner-only access: `docs/stories/a7-034-orlando-os-owner-finance-dashboard.md`.

### Expected contract shape

The exact field naming may follow repository conventions, but the server response must preserve these semantic groups:

```text
meta: period/timezone/sources/freshness/availability/role
operation: pickups/with_driver/processing/ready/at_laundry_secondary
needs_attention: customer_waiting/payments_pending/express/blockers/ready_for_dispatch
next_actions: maximum five safe active rows
business_today: Owner only
last_7_days: Owner only, current/previous/delta
```

### Testing standards

- Place focused tests with the existing system script tests and make them deterministic through an injected clock and memory/fake stores.
- Unit test period calculation, prioritization, aggregation and role serialization separately from DOM rendering.
- Integration test authentication, Owner/Operator authorization and API no-side-effect behavior.
- DOM/browser tests must cover Owner and Operator desktop plus 390px mobile, keyboard-accessible drill-downs and loading/empty/error states.
- Reconciliation tests compare complete card totals with the untruncated source lists; the five-item limit applies only to `next_actions`.
- Required regression gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Rollback

- Application rollback consists of restoring the immutable deployment recorded immediately before cutover.
- No database rollback exists or is needed because this story authorizes no migration or database object.
- If the Home API/UI fails a gate, restore the previous application deployment; existing Today, Orders and Finance contracts remain authoritative and unchanged.
- Any production smoke is read-only. Test-created customers, orders, invoices, payments or other business facts are forbidden for this story.

## Initial File List

Expected files only; the Dev Agent must replace this with the exact final list before review.

- `docs/stories/a7-035-orlando-os-home-v2.md` (new)
- `lib/system-home-service.js` (new)
- `api/system/home.js` (new)
- `scripts/a7-system-home.mjs` (new)
- `scripts/test-system-home.mjs` (new)
- `sistema.html` (modified)
- `sistema.js` (modified)
- `sistema.css` and/or the existing bounded system stylesheet used by Home (modified only if required)
- `package.json` (modified for CLI/test wiring only)

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-09-01 | 1.0 | Approved implementation story derived from the audited minimum read-only Home v2 contract. | River (@sm) |
| 2026-09-01 | 1.1 | Isolated Production cutover and authenticated read-only smoke completed. | GPT-5 Codex |

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `node --test scripts/test-system-home.mjs` — 6/6 PASS.
- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm test` — PASS.
- `npm run build` — PASS.
- Local authenticated Owner desktop/mobile visual smoke — PASS; 390px without horizontal overflow.
- Operator API/serialization smoke — PASS; financial keys absent and finance service not invoked.
- Isolated release base matched the pre-cutover Production `sistema.html` and `sistema.js` by SHA-256 before the Home-only overlay.
- Pre-cutover rollback deployment — `dpl_DDNGxh8ETp5peds1we5XJE4mHKJ4`.
- Production deployment — `dpl_4YAyCFCfyGi5sPPpvLXfoeN6FUzQ` (`https://a7laundry.com`).
- Authenticated Owner Production smoke — PASS: Home rendered current operation, attention, next actions, Business Today and Last 7 Days; queue drill-down and return worked; no horizontal overflow or UI error.
- Unauthenticated Production API smoke — PASS: `/api/system/home` returned `401`, `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow, noarchive`.

### Completion Notes List

- Added one read-only Home projection over the existing operational and Owner Finance contracts.
- Corrected the initial priority universe: QA, cancelled, delivered and historical non-actionable records are excluded.
- Added governed drill-down queues for Home pickup, payment attention, ready for dispatch and blockers.
- Implemented distinct server payloads for Owner and Operator; Operator finance is omitted rather than browser-hidden.
- Added Business Today, four operational groups, non-zero attention cards, five deterministic actions and adjacent seven-day comparison.
- Added explicit loading, unavailable and error states plus mobile-first hierarchy.
- No migration, secret, write path, Stripe, WhatsApp, Ads, `/order` or financial mutation was introduced.
- Production was promoted from the exact prior Production artifact plus the bounded Home v2 overlay. No database migration or business-data mutation was executed.
- Rollback remains immediately available through `dpl_DDNGxh8ETp5peds1we5XJE4mHKJ4`.

### Final File List

- `docs/audits/2026-09-01-orlando-os-home-v2-diagnostic.md` (new)
- `docs/stories/a7-035-orlando-os-home-v2.md` (new)
- `lib/system-home-service.js` (new)
- `api/system/home.js` (new)
- `scripts/a7-system-home.mjs` (new)
- `scripts/test-system-home.mjs` (new)
- `lib/system-operations-service.js` (modified)
- `sistema.html` (modified)
- `sistema.js` (modified)
- `sistema-home.css` (new)
- `scripts/build-site.mjs` (modified)
- `package.json` (modified)
