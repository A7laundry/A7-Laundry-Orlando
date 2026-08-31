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
| Idempotency | PASS | Same submission returns the original result; different-customer collision fails closed. |
| Authorization | PASS | Unauthenticated, wrong-origin and authenticated non-Owner requests are rejected. |
| PII/secrets boundary | PASS | No PII/customer UUID in URL, analytics, local/session storage, Stripe metadata or logs. |
| External-system isolation | PASS | No Stripe, WhatsApp, Google Ads or public `/order` behavior changed. |
| Migration safety | PASS | Additive service-role RPC; rollback drops only the new function. |
| Production mutation | PASS | None performed for W3-A. |

## Test evidence

- `node --test scripts/test-system-w3-a.mjs`: 5/5 PASS.
- `npm test`: Orlando OS pretest 58/58 PASS; repository suite 80/80 PASS; MOS suite 66/66 PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run validate:structure`: PASS.
- `npm run validate:agents`: PASS, zero errors and 121 pre-existing dependency warnings.
- `git diff --check`: PASS.
- PostgreSQL 15 chain through `20260830070000_orlando_os_w3_a_known_customer_order.sql`: PASS.
- `scripts/test-system-w3-a.sql` in a transaction: PASS, then ROLLBACK.
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
2. SQL rollback drops only `a7_orlando_create_known_customer_order`.
3. Already-created legitimate orders remain governed records and are never silently deleted.

## Release sequencing

W1B remains the next authorized release boundary and still requires its exact cutover GO. W1C-A, W2-A and W3-A are
separate local candidates. None should be bundled into a W1B promotion or published without an independent gate and
explicit Production authorization.
