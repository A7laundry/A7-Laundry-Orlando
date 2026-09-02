# Story A7-024 — A7 Orlando OS W1C-B2 Current Payment Link

**Status:** Draft — policy approval and W1B/W1C-B1 release dependencies pending

**Created:** 2026-08-30

**Sources:** Orlando OS blueprint §12.3; W1C-B financial-readiness audit; Operational Attribution Contract

**Depends on:** A7-019 W1B accepted in Production, A7-020 W1C-A accepted, A7-023 W1C-B1 accepted

## Story

**As the** A7 Orlando Owner,

**I want** the system to create and govern one current Stripe Payment Link for the current reviewed invoice,

**so that** the customer receives the correct amount and an obsolete unpaid link cannot remain valid unnoticed.

## Scope lock

This slice owns only reviewed invoice → current Payment Link → signed payment reconciliation. It reuses the existing
Stripe webhook and attribution contract. It does not send WhatsApp messages, complete delivery, accept tips, change
Google Ads, alter `/order`, create a customer portal or introduce another payment authority.

## Pending Owner policy gates

Implementation remains blocked until the Owner confirms:

1. Owner or Manager may issue, deactivate or replace a Payment Link; Operator remains forbidden;
2. tip remains unavailable and exactly zero;
3. replacing an unpaid invoice requires deactivating its old link before a new invoice/link becomes current;
4. paid, partially refunded or refunded invoices are immutable and corrections use the existing refund path.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Load the order and current `issued` invoice server-side; the browser supplies no amount or protected IDs. | Financial readiness §4 |
| FR-02 | Create a USD link for the exact reviewed `service_amount`, with `tip_amount=0`. | Blueprint §12; contract |
| FR-03 | Persist invoice version, Stripe Price ID, Payment Link ID, status and timestamps without PII. | Financial readiness W1C-B2 |
| FR-04 | At most one link may be active for the current invoice version. | Financial readiness W1C-B2 |
| FR-05 | An exact retry returns the current link and creates no new Stripe objects. | Financial readiness W1C-B2 |
| FR-06 | Concurrent requests converge to one governed result or fail closed without two active links. | Financial readiness W1C-B2 |
| FR-07 | Replacement deactivates and records the prior unpaid link before a new invoice/link becomes current. | Recommended policy §5 |
| FR-08 | Payment Link creation never marks an order paid or emits `purchase`. | Attribution contract |
| FR-09 | Only the signed, idempotent Stripe webhook reconciles payment and analytics outbox delivery. | Attribution contract |
| NFR-01 | Owner/Manager-only, same-origin POST API; Operator is read-only. | A7-037 RBAC boundary |
| NFR-02 | No `PAYMENT_LINK_TOKEN`, Stripe secret, raw metadata, PII or protected UUID is exposed to the browser. | Privacy boundary |
| NFR-03 | Migration is additive; app rollback leaves the new ledger inert. | Release governance |
| CON-01 | No live Stripe object or charge before synthetic tests, Preview, Owner smoke and explicit financial GO. | Financial readiness |

## State contract

```text
none
→ creating
→ active
→ completed

active → deactivating → inactive
creating/deactivating → failed (retriable only through the same governed operation)
```

Rules:

- `active` is unique per current invoice;
- `completed` is derived from the signed payment reconciliation, never from the browser;
- failure after a Stripe object is created must be reconciled before another create attempt;
- inactive/failed records remain append-only evidence;
- the browser receives only the order number, invoice version, safe status, amount/currency and current URL needed
  for the Owner to copy; it does not receive protected database identifiers.

## Acceptance criteria

- [ ] CLI/service dry-run loads the current reviewed invoice and explains the intended action without calling Stripe.
- [ ] Owner/Manager API returns 401 unauthenticated, 403 Operator and rejects wrong-origin requests.
- [ ] QA orders, non-current invoices, manual-review invoices and paid/refunded orders fail closed.
- [ ] First synthetic creation records one active link for the exact invoice version and amount.
- [ ] Exact retry returns the same governed link with `duplicate=true` and no extra Stripe Price/Payment Link.
- [ ] Concurrency test proves no state can expose two active links.
- [ ] Replacement test proves the old unpaid Stripe link becomes inactive before the new one becomes current.
- [ ] A Stripe deactivation failure leaves no new current link and exposes a recoverable, audited state.
- [ ] Signed webhook remains the sole transition to paid and preserves existing attribution/idempotency behavior.
- [ ] No browser payload, URL, log, analytics event or Stripe metadata contains customer PII or secrets.
- [ ] Minimal `/sistema` invoice action shows current status and copies the current link only after authorized human confirmation.
- [ ] Desktop and 390 px visual checks pass without adding a parallel finance dashboard.
- [ ] Focused tests, Stripe regression, lint, typecheck, full tests, build and secret scan pass.
- [ ] Exact Preview artifact and authenticated Owner synthetic smoke pass before any Production or live financial GO.

## Implementation order

```text
Owner policy approval for the Owner/Manager boundary
→ additive link-ownership ledger and RPCs
→ service/CLI dry-run
→ synthetic Stripe adapter tests
→ Owner-only API
→ minimal invoice action in /sistema
→ exact Preview gate
→ separate Production migration/deploy GO
→ separate live financial proof GO
```

## Rollback

Primary rollback is application-only to the last accepted W1C-B1 deployment. New link rows remain inert and
auditable. SQL rollback may remove functions/policies but must not drop link evidence after any Stripe object exists.

## Explicit non-goals

- automatic charging or automatic WhatsApp sending;
- tip, discount editor or manual browser amount;
- Operator financial writes;
- a new webhook or payment processor;
- invoice correction after payment;
- delivery, routes, customer portal, Google Ads or attribution changes.

## File List

- `docs/stories/a7-024-orlando-os-w1c-b2-current-payment-link.md`
