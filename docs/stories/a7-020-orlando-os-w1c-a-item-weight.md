# Story A7-020 — A7 Orlando OS W1C-A Item Weight

**Status:** Ready for Review — local gates passed; Production not authorized

**Created:** 2026-08-30

**Source:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md` §§8.2, 9.5, 17.1, 18 and 21

**Depends on:** A7-019 W1B Daily Operations

## Story

**As the** A7 Orlando Owner,

**I want** to record the actual weight on each per-pound order item,

**so that** the order advances to processing only when every required item has a real, auditable weight.

## Scope lock

Only W1C-A is in scope: actual weight per `lb` item, server-derived item subtotal, completion of the contractual
`order_weighed` event, transition to `awaiting_processing`, private Owner UI, CLI and audit evidence.

W1C-B invoice/versioning, minimum/adjustments, Payment Link, Stripe, payment, delivery, tip, WhatsApp, IA, routes,
customer reconciliation and Production deployment remain unchanged.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Actual weight belongs to the stable order item, not only to the order header. | Blueprint §8.2 |
| FR-02 | Only `lb` items accept actual weight; fixed `unit`/`piece` items never require weighing. | Blueprint §8.2 |
| FR-03 | Item subtotal is derived server-side from the governed price snapshot and confirmed quantity/weight. | Blueprint §§8.2, 12.1 |
| FR-04 | `order_weighed` is emitted once only after every `lb` item has a confirmed actual weight. | Blueprint §8.2 |
| FR-05 | Completed weighing advances lifecycle to `weighed` and production to `awaiting_processing` atomically. | Blueprint §9.5 |
| FR-06 | Partial weighing preserves `awaiting_weight` and visibly lists remaining items. | Blueprint §§8.2, 18 |
| FR-07 | Retry with the same identity returns the prior result; conflicting reuse fails closed. | Blueprint §18.7 |
| FR-08 | QA orders are read-only and historical nulls stay unknown. | A7-019 invariants |
| NFR-01 | CLI/service contract works before UI and UI contains no pricing or state-transition authority. | Constitution I |
| NFR-02 | Owner-only, same-origin POST, signed HttpOnly submission identity and no PII/secrets in URL/analytics/logs. | Blueprint §§6, 16 |
| NFR-03 | Migration is additive, RLS/service-role only, concurrency-safe and reversible without deleting real weight. | Blueprint §21.1 |
| CON-01 | W1C-A never creates or changes invoice, Payment Link, Stripe, payment status, tip or delivery. | Blueprint §17.1 |
| CON-02 | No Production mutation or deploy without a separate explicit GO after gates. | Owner release governance |

## Data contract

Each `a7_orlando_order_items` row gains:

- `actual_lbs` — positive actual weight for `lb` items only;
- `weighed_at` — required together with `actual_lbs`;
- `subtotal` — server-derived item snapshot, never browser supplied;
- `weight_version` — monotonic concurrency/audit version.

Weight history is append-only in `a7_orlando_item_weight_events`, keyed by a unique idempotency identity. The event
stores safe before/after weight facts, actor, reason for corrections and timestamps. It does not store customer PII.

## Transition contract

```text
at_laundry + awaiting_weight
→ record one lb item weight
→ more lb items pending: remain awaiting_weight
→ all lb items weighed: emit order_weighed once + awaiting_processing
```

- Initial weight needs no correction reason.
- Changing an already confirmed weight requires a bounded reason and increments `weight_version`.
- A correction after lifecycle has advanced beyond `weighed` is outside W1C-A and fails closed.
- Fixed-price item subtotal may be displayed as server-derived, but no invoice is created.

## Acceptance criteria

- [x] CLI records one item weight and returns safe completion/progress evidence.
- [x] Detail exposes stable opaque item identity, unit, governed unit price, actual weight, subtotal and timestamp.
- [x] Partial multi-item weighing does not emit `order_weighed` or advance production.
- [x] Final required item emits exactly one `order_weighed` and advances to `awaiting_processing`.
- [x] Fixed-price items reject weight and do not block weighing completion.
- [x] Same retry is idempotent; conflicting reuse and stale version fail closed.
- [x] Weight correction requires reason and remains unavailable after later lifecycle advancement.
- [x] Browser cannot inject price, subtotal, lifecycle, actor or arbitrary item identity.
- [x] QA, unauthorized, wrong-origin and malformed requests fail closed.
- [x] No invoice, payment, Stripe, tip, delivery, WhatsApp, `/order`, GA4 or Ads behavior changes.
- [x] Desktop and 390 px show a concise weight form only when `record_weight` is the next action.
- [x] Migration/rollback dry-run, lint, typecheck, focused tests, full tests and build pass.
- [x] Production gate is documented and stops before mutation.

## Rollback contract

Primary rollback is application-only. The additive schema remains inert under W1B. Exceptional SQL rollback may
drop W1C-A functions and empty event infrastructure, but must refuse removal of item weight columns after any real
weight or weight event exists.

## File List

- `docs/stories/a7-020-orlando-os-w1c-a-item-weight.md`
- `docs/audits/2026-08-30-orlando-os-w1c-a-item-weight-gate.md`
- `supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql`
- `supabase/rollbacks/20260830050000_orlando_os_w1c_a_item_weight.rollback.sql`
- `lib/operational-store.js`
- `lib/system-order-service.js`
- `lib/system-operations-service.js`
- `scripts/a7-system-operations.mjs`
- `scripts/test-system-w1c-a.mjs`
- `sistema.js`
- `sistema-w1b.css`
- `package.json`

## Validation evidence

- `supabase db push --dry-run --include-all`: only migration `20260830050000` would be applied; no remote mutation.
- Isolated PostgreSQL migration smoke: partial/final weight, idempotent retry, correction, fixed-only transition and single `order_weighed` passed.
- Focused W1B + W1C-A tests: 21/21 passed.
- System pretests: 47/47 passed.
- Full repository tests: 66/66 passed.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run validate:structure` and `npm run validate:agents`: passed.
- Authenticated-state UI harness with synthetic QA data: desktop and exact 390 px visual checks passed; temporary harness removed.
- `git diff --check`: passed.
