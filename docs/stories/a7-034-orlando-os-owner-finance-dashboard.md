# Story A7-034 — A7 Orlando OS Owner Finance Dashboard

**Status:** Ready for review — local implementation complete; Production requires a separate GO

**Created:** 2026-09-01

**Sources:** Owner approval on 2026-09-01; Orlando OS blueprint §5.3; Operational Attribution Contract §§5, 7, 8, 12 and 15; historical A7 + Stripe reconciliation audit

## Story

**As the** A7 Orlando Owner,

**I want** one private financial view with governed period filters,

**so that** I can understand confirmed operating revenue without rebuilding the business truth in a spreadsheet.

## Scope lock

This slice adds a read-only, Owner-only `Faturamento` view to the existing `/sistema`. It implements the same contract first through the service and CLI, then through the private API and UI. It may add one service-role-only SQL read function, but no migration is applied and no artifact is published without a separate Production GO.

No chart, accounting ledger, expense model, payout reconciliation, customer export, campaign action or financial mutation is included.

## Governed metric contract

| Metric | Definition |
|---|---|
| `confirmed_service_revenue` | Sum of authoritative net eligible service revenue for distinct real orders paid inside the selected period. QA, cancelled and unpaid orders and tips are excluded; confirmed refunds reduce service revenue. |
| `gross_received` | Sum of reconciled payment amount less confirmed refund total for the same paid orders. It is displayed separately from service revenue. |
| `confirmed_tips` | Sum only of an explicitly stored order tip or protected historical imported tip. A payment/service difference is never guessed to be a tip. |
| `paid_order_count` | Distinct real orders with an authoritative paid payment timestamp inside the selected period. Webhook retries do not add orders. |
| `average_service_ticket` | `confirmed_service_revenue / paid_order_count`. No paid orders produces `null`, not an invented zero. |
| `customer_count` | Distinct durable `customer_id` values represented by paid orders in the selected period. |
| `new_customer_orders` / `repeat_customer_orders` | Paid-order split using the durable order-time repeat flag. Unknown continuity is not inferred from name, phone, property or Stripe identity. |
| `pending_payment_count` | Real, non-cancelled, unpaid orders accepted inside the selected period. |
| `pending_payment_value` | Sum of known service amounts for pending orders. It is `null` when none of the pending orders has an issued amount and is marked partial when only some do. |
| breakdowns | Confirmed service revenue grouped by governed service tier, canonical hotel relation and deterministic frozen acquisition source. Unmapped or unattributed facts remain explicit buckets. |

All periods are inclusive calendar dates in `America/New_York`. Financial revenue is assigned by authoritative `paid_at`, not by acceptance, pickup, invoice, delivery or Stripe export date. Every response exposes period, timezone, sources, freshness and availability.

## Acceptance criteria

- [x] AC-01 — CLI can read `today`, `7d`, `30d`, current month or a bounded custom period before the UI is used.
- [x] AC-02 — Only an authenticated Owner can call the finance API or see/use the navigation entry; Operator and unauthenticated access fail closed.
- [x] AC-03 — Confirmed service revenue excludes QA, cancelled, unpaid and tip value and nets confirmed refunds exactly once.
- [x] AC-04 — Gross received and explicitly confirmed tips are separate from service revenue; missing tip evidence is reported as partial/unavailable, never inferred.
- [x] AC-05 — Paid orders, unique customers, new/repeat split and service ticket use the governed formulas and durable identifiers.
- [x] AC-06 — Pending payment count/value are separate from revenue and preserve unknown versus confirmed zero.
- [x] AC-07 — Service, hotel and acquisition breakdowns reconcile exactly to confirmed service revenue and use explicit unmapped/unattributed buckets.
- [x] AC-08 — The UI provides Today, 7 days, 30 days, current month and custom date filters, with a compact card/table presentation and no chart.
- [x] AC-09 — Period, timezone, source, freshness and availability are visible; an unavailable data source cannot render a false zero or success.
- [x] AC-10 — Reads are side-effect free and return no customer PII, payment IDs, order UUIDs, click IDs, secrets or raw attribution payloads.
- [x] AC-11 — No existing Stripe, WhatsApp, Google Ads, `/order`, attribution, invoice, document or lifecycle behavior changes.
- [x] AC-12 — Focused tests plus lint, typecheck, full tests and build pass locally; Production remains unchanged.

## Tasks

- [x] Approve formulas and local-only scope.
- [x] Add service-role-only read contract and inert rollback notes.
- [x] Add Memory/remote store adapters, Owner finance service and CLI.
- [x] Add Owner-only API and `Faturamento` view.
- [x] Add focused authorization, formula, null-semantics, reconciliation and no-side-effect tests.
- [x] Run lint, typecheck, full tests and build.
- [x] Update checklist and file list before review.

## Validation evidence

- Focused finance tests: PASS (formula, authorization, null semantics, reconciliation, freshness and no side effects).
- Repository pretest: PASS (101 checks).
- Lint: PASS.
- Typecheck: PASS.
- Full test suite: PASS.
- Production build: PASS; the pre-existing content-registry adjudication warning is unrelated to this story.
- CLI smoke: PASS with a local memory store and correct `no_data`/`null` behavior.
- Browser QA: PASS on desktop and 390px mobile viewport; no page-level horizontal overflow.
- Secret/PII review: PASS for the bounded finance files and API response contract.
- Production mutation: NONE. The migration remains unapplied and no deployment was created or promoted.

## Rollback

- Local application rollback: remove the files and bounded wiring listed below.
- Future application rollback after a separately approved release: restore the prior immutable deployment.
- The additive SQL function may remain inert after application rollback; dropping it requires separate database authorization.
- No rollback or Production action is authorized by this story state.

## File list

- `docs/stories/a7-034-orlando-os-owner-finance-dashboard.md`
- `supabase/migrations/20260901020000_orlando_os_owner_finance_dashboard.sql`
- `supabase/rollbacks/20260901020000_orlando_os_owner_finance_dashboard.rollback.sql`
- `lib/system-finance-service.js`
- `lib/operational-store.js`
- `api/system/finance.js`
- `scripts/a7-system-finance.mjs`
- `scripts/test-system-finance.mjs`
- `sistema.html`
- `sistema.js`
- `sistema-finance.css`
- `scripts/build-site.mjs`
- `package.json`
