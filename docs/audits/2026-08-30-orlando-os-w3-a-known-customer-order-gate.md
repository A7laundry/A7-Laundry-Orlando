# A7 Orlando OS — W3-A Known Customer Order Gate

**Date:** 2026-08-30
**Scope:** local-only W3-A known-customer reuse
**Decision:** `GO LOCAL / NO-GO PRODUCTION`

## Outcome

W3-A is ready for code review. From Clientes Lite, the Owner can start a new attendance for a customer with prior real
commercial history. The server resolves the opaque customer reference, preserves the stored identity, and creates a new
lead/order pair tied to the same customer. The flow does not edit the contact, merge records, reuse historical order IDs,
or mutate a frozen attribution snapshot.

Production remains unchanged. This gate is not authorization to migrate or deploy W3-A.

## Contract verification

| Gate | Result | Evidence |
|---|---|---|
| Prior real customer required | PASS | QA-only/cancelled-only history is rejected in service, RPC and focused tests. |
| Protected identity | PASS | Browser carries only opaque `customer_ref`; stored name and WhatsApp are resolved server-side and rendered readonly. |
| New commercial identities | PASS | New `lead_id` and `order_id`; stable `customer_id`; `is_repeat_customer=true`. |
| No customer mutation | PASS | RPC locks and reads the contact but contains no contact update or merge. |
| Idempotency | PASS | Same submission returns the original result after later commercial-state changes; different-customer collision fails closed. |
| Authorization | PASS | Unauthenticated, wrong-origin and authenticated non-Owner requests are rejected. |
| PII/secrets boundary | PASS | No PII/customer UUID in URL, analytics, local/session storage, Stripe metadata or logs. |
| External-system isolation | PASS | No Stripe, WhatsApp, Google Ads or public `/order` behavior changed. |
| Migration safety | PASS | Additive service-role RPC; rollback drops only the new function. |
| Production mutation | PASS | None performed for W3-A. |

## Test evidence

- `node --test scripts/test-system-w3-a.mjs`: 5/5 PASS.
- `npm test`: Orlando OS pretest 67/67 PASS; repository suite 86/86 PASS; MOS suite 67/67 PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run validate:structure`: PASS.
- `npm run validate:agents`: PASS, zero errors and 121 pre-existing dependency warnings.
- `git diff --check`: PASS.
- PostgreSQL 15 chain through `20260830070000_orlando_os_w3_a_known_customer_order.sql`: PASS.
- `scripts/test-system-w3-a.sql` in a transaction: PASS after cancelling both existing orders, then ROLLBACK.
- `20260830070000_orlando_os_w3_a_known_customer_order.rollback.sql`: PASS.

## Visual evidence

The actual private-shell CSS and W3-A form were rendered in Chrome.

| Viewport | Result |
|---|---|
| Desktop 1440 × 1000 | `clientWidth=1440`, `scrollWidth=1440`, no horizontal overflow. |
| Mobile 390 × 844 | `clientWidth=390`, `scrollWidth=390`, no horizontal overflow. |

Both layouts show the known-customer context, a clear remove-link action, editable new-order facts, and readonly stored
name/WhatsApp. Browser console warnings/errors: none.

## Rollback readiness

1. Application rollback removes the W3-A entry action and known-customer create path.
2. SQL rollback drops only the W3-A retry resolver and `a7_orlando_create_known_customer_order`.
3. Already-created legitimate orders remain governed records and are never silently deleted.

## Release sequencing

W1B is the current accepted Production baseline. The next eligible boundary is W1C-A migration `20260830050000`,
but it remains local until its exact GO. W2-A `060000`, W3-A `070000` and W1C-B1 `080000` are separate later
candidates in that existing migration order. None may be skipped, renumbered or bundled without its independent gate
and explicit Production authorization.

## Post-gate delayed-retry correction — 2026-08-31

The final audit found that the service and SQL RPC checked current commercial-history eligibility before resolving
an exact prior submission. If the original and newly created orders were later cancelled, a legitimate retry could
be rejected even though the immutable request already existed. W3-A now resolves the protected submission identity
before current-history eligibility, validates the same opaque customer and request fingerprint, returns only the
original order for an exact retry and rejects conflicting reuse. Both memory and PostgreSQL tests reproduce the
later cancellation and prove one new order only. Production was not changed.
