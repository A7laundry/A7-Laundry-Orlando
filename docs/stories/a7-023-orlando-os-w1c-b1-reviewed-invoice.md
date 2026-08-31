# Story A7-023 — A7 Orlando OS W1C-B1 Reviewed Versioned Invoice

**Status:** Ready for Review — local implementation complete; Production not authorized

**Created:** 2026-08-30

**Source:** `docs/audits/2026-08-30-orlando-os-w1c-b-financial-readiness.md`

**Depends on:** A7-019 W1B Daily Operations and A7-020 W1C-A Item Weight

## Story

**As the** A7 Orlando Owner,

**I want** the system to derive and review one versioned invoice from confirmed order items,

**so that** the amount is explainable and frozen before any Stripe Payment Link is created.

## Scope lock

Only W1C-B1 is in scope: immutable invoice header/line snapshots, one current invoice version, governed minimum
adjustment, Owner review/correction/void, append-only audit, private API/CLI/UI and compatibility with the existing
order-level invoice fields.

Stripe calls, Payment Links, webhook changes, purchase/refund behavior, delivery, tip, discounts, manual-price
resolution, WhatsApp, Google Ads, `/order`, customer editing and Production deployment remain unchanged.

## Policy lock for this local candidate

1. Owner is the only authority to issue, replace or void an invoice.
2. First issue requires all item prices, quantities and required weights to be resolved.
3. Service amount is the sum of server-derived item snapshots plus one governed minimum adjustment.
4. Tip is exactly `0`; it is not shown as an editable field.
5. Correction creates a new immutable version and requires a bounded reason.
6. A no-change correction is rejected rather than creating version noise.
7. Void requires a bounded reason and preserves every prior version and audit row.
8. Paid, partially refunded or refunded invoices are immutable.
9. Any current or historical Payment Link blocks B1 replacement/void until W1C-B2 implements safe deactivation.
10. Production still requires explicit Owner approval of this policy and an independent release GO.

## Requirements

| ID | Requirement |
|---|---|
| FR-01 | Invoice lines snapshot each eligible order item using server-owned price, quantity, actual weight and subtotal. |
| FR-02 | The order minimum is applied at most once as an explicit adjustment line. |
| FR-03 | Manual-review, unresolved fixed-price or unweighed per-pound items block issuance. |
| FR-04 | First review creates invoice version 1 and updates the existing order invoice header compatibly. |
| FR-05 | Correction creates a new version, supersedes the prior version and requires the expected version plus reason. |
| FR-06 | Void preserves history, requires reason and disables the order-level payable header. |
| FR-07 | Retrying the same request is stable; semantic idempotency conflicts fail closed. |
| NFR-01 | Owner-only, same-origin and signed HttpOnly submission identity. |
| NFR-02 | No browser-supplied amount, price, minimum, invoice ID, PII or secret becomes financial authority. |
| NFR-03 | Additive service-role-only schema; app-first rollback and fail-closed exceptional SQL rollback. |
| CON-01 | No Stripe/Payment Link/webhook/GA4/Ads/WhatsApp change. |
| CON-02 | No Production mutation without a separate exact GO. |

## Acceptance criteria

- [x] Invoice preview is derived entirely from current protected item facts.
- [x] Per-pound and fixed-price lines use correct server-derived subtotals.
- [x] Minimum is represented once and total is exact to USD cents.
- [x] Unresolved/manual-review items block review with a visible error.
- [x] First issue, correction and void are Owner-only and append-only audited.
- [x] Correction requires reason/version and never rewrites an older invoice or line.
- [x] Paid or linked invoices cannot be corrected or voided in W1C-B1.
- [x] Same retry returns the prior result; conflicting idempotency fails closed.
- [x] Browser ignores/rejects injected amount, price, minimum, tip and invoice IDs.
- [x] No PII/secret enters URLs, analytics, logs or invoice lines.
- [x] No Stripe, WhatsApp, Google Ads, `/order`, payment or delivery mutation occurs.
- [x] Desktop and 390 px UI are usable without document overflow.
- [x] Migration/rollback dry-run, lint, typecheck, focused/full tests and build pass.
- [x] Production gate stops before mutation.

## Rollback

Normal rollback is application-only. The exceptional SQL rollback drops W1C-B1 objects only when no invoice or audit
evidence exists. Once evidence exists, schema remains and the previous application artifact ignores the additive tables.

## File List

- `docs/stories/a7-023-orlando-os-w1c-b1-reviewed-invoice.md`
- `docs/audits/2026-08-30-orlando-os-w1c-b1-reviewed-invoice-gate.md`
- `lib/system-invoice-service.js`
- `lib/system-operations-service.js`
- `lib/operational-store.js`
- `api/system/invoice-draft.js`
- `api/system/order-invoices.js`
- `scripts/a7-system-invoices.mjs`
- `scripts/test-system-w1c-b1.mjs`
- `scripts/test-system-w1c-b1.sql`
- `supabase/migrations/20260830080000_orlando_os_w1c_b1_reviewed_invoice.sql`
- `supabase/rollbacks/20260830080000_orlando_os_w1c_b1_reviewed_invoice.rollback.sql`
- `sistema.js`
- `sistema-w1b.css`
- `package.json`

## Validation evidence

- Focused Node contract: 6/6 PASS.
- Complete private OS pretest: 64/64 PASS.
- Repository test suite: 80/80 PASS; MOS suite: 66/66 PASS.
- PostgreSQL 15 migration chain through W1C-B1: PASS.
- SQL functional smoke (issue, retry, replace, immutable prior lines, void, PII): PASS and transaction rollback.
- Exceptional rollback on unused schema: PASS; object removal verified.
- Exceptional rollback with synthetic invoice evidence: correctly refused and preserved evidence.
- `npm run lint`, `npm run typecheck`, `npm run build`, structure/agent validation and `git diff --check`: PASS.
- Visual QA: 1440 px and 390 px, no horizontal overflow; primary action height 46 px.
- Production, Stripe, WhatsApp, Google Ads and `/order`: not mutated.
