# A7 Orlando OS — W1C-B Financial Readiness Audit

**Date:** 2026-08-30
**Scope:** invoice lines/versioning, review, Payment Link, webhook payment state and delivery enablement
**Assessment only:** no financial code, Stripe setting, database, Vercel or Production mutation was performed

## Executive verdict

The existing payment foundation is real and reusable, but W1C-B is **not ready to implement as one undivided
release**. The current backend can accept one order-header invoice amount, create a one-use Stripe Payment Link and
reconcile signed payment/refund events. It does not yet provide the versioned line-based invoice and safe correction
workflow required by the approved Orlando OS blueprint.

The lean path is three bounded releases, each with its own story, tests, Preview and explicit Production GO:

```text
W1C-B1  reviewed versioned invoice
W1C-B2  current invoice → one current Payment Link → signed payment
W1C-B3  paid + ready → delivery custody → delivered
```

This split does not expand scope. It prevents invoice, Stripe and delivery authority from changing in the same
release and keeps rollback practical.

## Existing verified foundation

| Capability | Current evidence | Readiness |
|---|---|---|
| Stable order/lead IDs | Operational attribution P0 and W1A use opaque durable IDs. | Reuse |
| Item price snapshots | W1A order items store governed unit price/minimum; W1C-A derives actual item subtotal server-side. | Reuse |
| Contractual invoice event | `invoice_created` validates positive service amount, USD and `tip_amount=0`. | Reuse with adapter |
| One-use Payment Link | `api/create-payment-link.js` derives amount from the invoiced order and sets completion limit 1. | Reuse behind Owner service |
| Stripe idempotency | Price/link keys include order, invoice key and order version. | Strengthen with invoice version |
| Opaque metadata | Link carries order/lead/contract IDs only; no phone/name/address/raw acquisition IDs. | Reuse |
| Signed webhook | Timestamp-tolerant signature verification and raw-body validation exist. | Reuse |
| Payment reconciliation | Amount/currency/order linkage and webhook deduplication are implemented. | Reuse |
| Failure/refund states | Failed, void, partial refund and refund states append history and do not overwrite purchase truth. | Reuse |
| GA4 outbox | Confirmed purchase/refund delivery already fails closed when analytical identity is absent. | Reuse unchanged |
| Delivery state machine | W1B already defines ready, driver delivery, Bell Desk and completed delivery invariants. | Enable only after paid |

## Confirmed gaps

### 1. Invoice is still an order-header event

The current invoice authority stores `invoice_id`, `service_amount`, `tip_amount` and currency directly on the order.
There is no immutable invoice header, invoice-line snapshot, invoice version, adjustment ledger or explicit current
invoice pointer. A second `invoice_created` event is rejected rather than versioned.

### 2. Minimum and adjustments are not yet composed from item facts

W1C-A produces trustworthy item subtotals, but no server function currently:

- sums all eligible item snapshots;
- applies the governed order minimum exactly once;
- records an explainable minimum adjustment;
- blocks manual-review items until an Owner resolves their price;
- produces an immutable reviewed total.

### 3. Payment Link lifecycle is not durable in the OS

The existing endpoint returns the Stripe link and ID but does not persist a governed current-link record. The OS
cannot yet prove which link belongs to the current invoice version, whether an older unpaid link was deactivated or
whether a retry returned the existing link instead of creating another active link.

### 4. Browser-to-finance authority must be adapted

`api/create-payment-link.js` is protected by `PAYMENT_LINK_TOKEN`. That token must remain server-only. `/sistema`
needs an Owner-authenticated same-origin endpoint that validates the reviewed invoice and calls the existing
payment-link service internally. The browser must never receive or submit the token, Stripe secret, amount authority
or raw Stripe metadata.

### 5. Invoice correction/void policy needs Owner approval

The blueprint correctly blocks implementation until correction authority is explicit. The recommended lean rule is:

1. only Owner may review, issue, void or replace an invoice;
2. every correction/void requires a bounded reason and append-only event;
3. before a Payment Link exists, replace the reviewed draft with a new immutable version;
4. after an unpaid link exists, deactivate that link first, then create a new invoice version and new link;
5. after payment, never rewrite or void the invoice; use the existing signed refund path under a separate explicit
   financial action;
6. Operator can view status but cannot issue, correct, void or refund;
7. tip remains exactly zero and is absent from the UI.

### 6. Bell Desk completion remains a later product decision

The existing W1B state model can represent `bell_desk` without falsely declaring delivery complete. Until the Owner
approves the final Bell Desk rule, W1C-B3 should require an explicit `complete_delivery` action after the handoff.

## Recommended bounded scope

### W1C-B1 — Reviewed invoice

- immutable invoice header and line snapshots;
- version and current-invoice pointer;
- total from confirmed item subtotals plus governed minimum adjustment;
- manual-review blocker;
- Owner review/issue/correct/void policy;
- no Stripe call;
- CLI before UI.

### W1C-B2 — Payment Link and payment

- Owner-authenticated server adapter;
- exactly one active link for the current invoice version;
- durable link ID/status without storing a browser secret;
- old unpaid link deactivation before replacement;
- signed webhook reconciliation remains the only payment authority;
- no browser-generated `purchase`;
- no Google Ads change.

### W1C-B3 — Delivery

- only `paid + production ready` can advance;
- driver, Bell Desk and final delivery states reuse W1B invariants;
- explicit completion required;
- no routing optimizer, GPS, customer portal or automated WhatsApp yet.

## Required gates per slice

- story with requirement traceability and explicit non-goals;
- additive/reversible migration and app-first rollback;
- CLI contract before UI;
- Owner-only authorization, wrong-origin and QA read-only tests;
- concurrency and retry tests;
- synthetic Stripe tests before any live payment;
- PII/secret scan;
- desktop and 390 px visual review;
- lint, typecheck, focused/full tests and build;
- exact Preview artifact and authenticated Owner smoke;
- separate explicit Production GO.

## Decisions requested from the Owner

1. Approve the recommended invoice correction/void policy in §5.
2. Confirm that tip remains unavailable and zero for W1C-B.
3. Confirm that Bell Desk handoff does not complete delivery automatically; an explicit final action remains required.

No W1C-B implementation should start until a bounded implementation story exists and these three decisions are
recorded. W1B Production cutover and W1C-A release remain earlier dependencies.

## W1C-B2 story reconciliation

**Governance status:** `STORY CREATED / POLICY APPROVAL PENDING / NO CODE AUTHORIZED`

The bounded implementation story now exists at
`docs/stories/a7-024-orlando-os-w1c-b2-current-payment-link.md`. It incorporates the handoff below and remains
`Draft`: W1C-A and W1C-B1 must first be accepted in Production and the Owner must approve the four financial-policy
gates. This section is retained as traceability, not as a claim that story creation or implementation is authorized.

### Traceable objective

Connect the current reviewed W1C-B1 invoice to exactly one current Stripe Payment Link and preserve the existing
signed webhook as the sole payment authority. This derives from the approved blueprint, the operational attribution
contract and the full-delivery goal prompt; it does not add a new financial path.

### Required acceptance criteria

- only an authenticated Owner session may request link generation or deactivation through a same-origin OS API;
- the browser never receives or submits `PAYMENT_LINK_TOKEN`, `STRIPE_SECRET_KEY`, amount authority, raw Stripe
  metadata, invoice UUID, order UUID or lead UUID;
- the server loads the order and its current `issued` invoice and derives amount, currency, invoice version,
  `order_id` and `lead_id` from protected storage;
- the link is created only for the current invoice version, in USD, with `tip_amount=0` and the reviewed
  `service_amount` unchanged;
- the durable record binds the exact invoice version to the Stripe Price and Payment Link identifiers and records
  current status and timestamps without customer PII;
- at most one link is active for one current invoice version;
- an exact retry returns the already-recorded current link and does not create another Stripe Price or Payment Link;
- concurrent requests converge to one governed result or fail closed without leaving two active links;
- replacing an unpaid invoice requires the old link to be deactivated and durably recorded as inactive before a new
  invoice version/link may become current;
- a paid, partially refunded or refunded invoice is immutable; correction follows the existing signed refund path
  and is not implemented as invoice replacement;
- Payment Link creation does not mark an order paid and does not emit `purchase`;
- only the existing signed, idempotent Stripe webhook may reconcile payment and release the existing GA4 outbox
  event when analytical identity is valid;
- Google Ads, WhatsApp, `/order`, attribution snapshots and identity rules remain unchanged;
- no live link is presented and no charge is made before synthetic Stripe tests, Preview, authenticated Owner smoke
  and a separate explicit Production/payment GO.

### Required implementation order

```text
CLI/service contract
→ durable link ownership and idempotency
→ Owner-only same-origin API
→ minimal invoice action/status in /sistema
→ synthetic Stripe QA
→ Preview gate
→ explicit Production GO
```

### Explicit non-goals

- sending the Payment Link automatically by WhatsApp;
- charging automatically;
- accepting tips;
- allowing Operator financial authority;
- creating a parallel payment or webhook path;
- editing frozen attribution or inventing analytical identity;
- delivery completion, route automation, customer portal or Google Ads changes.

### Additional evidence from the current endpoint

`api/create-payment-link.js` is reusable only behind a new governed service boundary. Today it:

- authenticates with the standalone `PAYMENT_LINK_TOKEN`, not an Owner OS session;
- reads the legacy order header rather than proving the current W1C-B1 invoice row/version;
- creates a Stripe Price and Payment Link with Stripe idempotency keys;
- returns the Payment Link URL and Stripe ID but does not persist durable current-link ownership;
- cannot prove that an older unpaid link was deactivated;
- has no concurrency guard that independently proves one active link per invoice version.

These gaps are why adapting the old endpoint directly from the UI is `NO-GO` until the bounded story exists.
