# Story A7-026 — A7 Orlando OS W3-B Customer Value Facts

**Status:** Draft — blocked by W1C-B2 financial truth and Owner approval of metric formulas

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§1–2, 5.3, 13, 17–18 and 21–22; Operational Attribution Contract
§§3, 5, 7 and 15–16; W3 Customer Upgrades Readiness Audit; Full Delivery Status; Stories A7-022 and A7-025

**Depends on:** A7-018 Clientes Lite accepted in Production; A7-022 W3-A accepted in Production; W1C-B1 and
W1C-B2 accepted in Production with payment/refund reconciliation proven end to end

## Story

**As the** A7 Orlando Owner,

**I want** the known-customer detail to show repeat and confirmed financial facts derived from governed
order, payment and refund truth,

**so that** I can recognize customer value without a parallel spreadsheet or a marketing CRM.

## Business context

A7 needs a small operational system centered on the order, not a generic CRM, ERP or analytics platform. Clientes
Lite already provides private lookup, order history and confirmed net service revenue. W3-A adds safe reuse of a known
customer. W3-B completes the next bounded read layer: it explains repeat behavior and confirmed value from durable
commercial history without editing the customer or creating marketing automation.

This slice answers only:

```text
Is this a repeat customer?
How many real and paid orders exist?
What confirmed service value remains after refunds?
What was the first and most recent paid order?
What initial acquisition source is actually available?
```

[Source: `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md` §§1–2, 13]
[Source: `docs/audits/2026-08-30-orlando-os-w3-customer-upgrades-readiness.md` §§Executive verdict, Confirmed gaps 2, Recommended releases]

## Scope lock

Only W3-B is in scope: a read-only, Owner-private block of basic customer value facts inside the existing Clientes
Lite detail. All facts are derived server-side from the durable `customer_id`, real orders, authoritative
payment/refund records and the frozen first-order attribution snapshot.

W3-B does not edit customers, resolve identity conflicts, merge records, persist an LTV score, send WhatsApp messages,
trigger follow-ups or change any order, invoice, payment, refund, lifecycle, attribution, GA4 or Ads state.

The UI remains compact and chart-free. It must not create another main navigation area, dashboard or inbox.

## Metric contract — pending Owner approval

Implementation must not start until Gate G0 approves these exact definitions or replaces them in this story:

| Fact | Proposed governed definition |
|---|---|
| `real_order_count` | Distinct orders for the durable `customer_id` with a human order number, excluding QA and cancelled orders. |
| `paid_order_count` | Distinct real orders with payment confirmed by the authoritative payment/reconciler record. A payment counts once despite webhook retries and remains a paid order after a later partial or full refund. |
| `refunded_order_count` | Distinct paid orders with a confirmed refund amount greater than zero, whether partial or full. |
| `confirmed_refund_amount` | Confirmed refunds allocated to eligible service revenue only; tip is excluded. |
| `confirmed_net_service_revenue` | Sum of confirmed eligible service revenue less confirmed service refunds, never below zero per order. |
| `confirmed_average_ticket` | `confirmed_net_service_revenue / paid_order_count`, labelled **Confirmed average ticket (net)**. |
| `is_repeat_customer` | `true` only when the same durable `customer_id` has at least two real orders. |
| `first_paid_order` | Earliest authoritative `paid_at`, with a deterministic tie-break; expose only human order number, safe date and confirmed net service value. |
| `last_paid_order` | Latest authoritative `paid_at`, with a deterministic tie-break; expose only human order number, safe date and confirmed net service value. |
| `initial_acquisition` | Frozen attribution snapshot from the first real order, with explicit availability/confidence; never inferred from name, phone, property, amount, time or operator recollection. |

Null semantics are mandatory:

- if no paid order exists, monetary facts, average ticket and first/last paid order are `null`/unavailable, not inferred
  as `$0`;
- if a confirmed paid order is fully refunded, net revenue is a known `$0`, not unavailable;
- counts may be known zero;
- unavailable financial or attribution sources remain unavailable and expose source/freshness status.

[Source: `docs/audits/2026-08-30-orlando-os-w3-customer-upgrades-readiness.md` §§Confirmed gaps 2, W3-B, Security and privacy invariants]
[Source: `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md` §§3.1, 5.1–5.2, 7, 15]

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Resolve the customer only from the existing opaque `customer_ref`; derive all value facts server-side by durable `customer_id`. | A7-022 identity boundary; Clientes Lite contract |
| FR-02 | Report real, paid and refunded order counts using the approved metric contract. | W3 readiness audit §W3-B |
| FR-03 | Derive confirmed net service revenue, confirmed refund amount and confirmed average ticket only from authoritative, deduplicated payment/refund truth. | Attribution Contract §§5.2, 7 and 15 |
| FR-04 | Exclude QA, cancelled and unpaid orders from financial value; exclude tip; represent partial and full refunds correctly. | W3 readiness audit §Security and privacy invariants; Attribution Contract §7 |
| FR-05 | Derive repeat status from durable real-order history; no operator field, tag or stored score may declare a customer repeat. | Attribution Contract §§3.1 and 5.1 |
| FR-06 | Expose safe first/last paid-order facts and the initial acquisition source without returning internal identifiers. | Blueprint §13; W3 readiness audit §W3-B |
| FR-07 | Preserve `null`/unavailable versus confirmed zero and expose source, freshness, period/timezone where applicable. | Blueprint §5.3; Attribution Contract §15 |
| FR-08 | Add one compact block to the existing customer detail; do not create charts or a separate value dashboard. | Blueprint §§1, 5.1 and 13 |
| NFR-01 | Initial release is Owner-only, private, same-origin and POST-based, following the existing Clientes Lite access boundary. | Blueprint §16; A7-022 NFR-01 |
| NFR-02 | Phone, email, property/address/room, customer UUID, payment IDs and secrets must not enter URLs, analytics, logs or browser storage. | Blueprint §16; W3 readiness audit §Security and privacy invariants |
| NFR-03 | Reads have no operational side effects and cannot modify customer, lead, order, invoice, payment, refund or attribution data. | Blueprint NFR-02–04; W3 scope lock |
| NFR-04 | Service/CLI and observability precede UI; unavailable dependencies fail visibly and never produce false zero/success. | AIOS Constitution I; Blueprint NFR-04 and CON-02 |
| CON-01 | No customer editing, field resolution, conflict inbox, automatic merge or fuzzy identity matching; those remain W3-C. | W3 readiness audit §§Confirmed gaps 3–5, W3-C |
| CON-02 | No WhatsApp send, IA, campaign, upsell, loyalty, export or automatic follow-up. | Blueprint §22; A7-025 Scope lock and non-goals |
| CON-03 | No Stripe call, webhook change, refund action, invoice mutation, GA4/Ads change, `/order` change or lifecycle transition. | A7-025 CON-02; release isolation |
| CON-04 | No Production mutation without a separate exact GO, isolated artifact, rollback and authenticated smoke. | Blueprint CON-01 and §17 |

## Acceptance criteria

- [ ] A customer with no paid order reports `paid_order_count=0`; financial values, ticket and first/last paid facts are
  unavailable/null rather than invented `$0`.
- [ ] One real paid order for `$84` reports one paid order, `$84` confirmed net revenue and `$84` confirmed net average
  ticket.
- [ ] A `$74` paid order with a confirmed `$10` refund reports `$64` net, `$10` refunded and one refunded order.
- [ ] A fully refunded paid order reports a known `$0` net value while remaining one paid and one refunded order.
- [ ] Duplicate payment/refund webhook or reconciler deliveries do not double-count an order, payment or refund.
- [ ] QA, cancelled and unpaid orders and tip amounts do not influence customer value facts.
- [ ] Two real orders for the same durable `customer_id` produce `is_repeat_customer=true`; QA/cancelled-only history
  cannot create repeat status.
- [ ] First and last paid orders use authoritative `paid_at`, deterministic ordering and human order numbers only.
- [ ] Deterministic, partial, unattributed and missing initial attribution are represented truthfully without inference,
  and the frozen snapshot remains unchanged.
- [ ] The existing opaque `customer_ref` remains the browser identity; no customer/order/payment/refund UUID is returned.
- [ ] Owner access succeeds; unauthenticated, non-Owner and wrong-origin requests fail closed.
- [ ] Repeated reads create no audit, event or business-record mutation and return the same facts for the same underlying
  truth.
- [ ] Financial-source failure or unavailability is visible and does not become zero, empty success or stale certainty.
- [ ] Customer detail shows one concise chart-free value block on desktop and 390 px without document overflow.
- [ ] No customer, order, invoice, payment, refund, Stripe, WhatsApp, GA4, Google Ads, `/order` or attribution mutation
  occurs during focused or release tests.
- [ ] Focused service/API/UI tests, isolated SQL fixtures, lint, typecheck, full tests, build, privacy/secret scan and
  existing Orlando OS regressions pass.
- [ ] An authenticated Owner smoke on the exact release artifact reconciles an identified synthetic fixture and leaves
  zero test residue.

## Minimal Owner presentation

```text
HISTORY AND CONFIRMED VALUE

Real orders                    3
Paid orders                    2
Orders with refund             1
Confirmed net revenue       $148
Confirmed refunds            $10
Confirmed average ticket     $74
Repeat customer               Yes
First paid order        A7-ORL-1000
Last paid order         A7-ORL-1042
Initial source       Google / CPC

Source: Orders + reconciled payments/refunds
Updated: <safe timestamp> · Availability: current
```

Labels and values must reflect the approved metric contract. This example is illustrative and does not authorize
hard-coded values, a new dashboard or a visual redesign.

## Tasks / Subtasks

- [ ] Gate the story before development (AC: all)
  - [ ] Obtain Owner approval for average-ticket formula, refund-count definition and null-versus-zero behavior.
  - [ ] Prove W3-A and W1C-B2 are accepted in Production and payment/refund truth is reconciled end to end.
  - [ ] Confirm release sequencing and official Orlando Supabase project before any candidate or migration work.
- [ ] Define the read contract service-first (AC: 1–13)
  - [ ] Extend the private customer-value read model without introducing a persisted score or write path.
  - [ ] Return safe counts, money values, first/last paid facts, initial attribution availability and freshness metadata.
  - [ ] Keep browser authority limited to the opaque customer reference.
- [ ] Implement deterministic derivation and privacy boundaries (AC: 1–13, 15)
  - [ ] Reconcile distinct orders with authoritative payment/refund records and stable technical IDs server-side.
  - [ ] Apply QA, cancelled, unpaid, tip, partial-refund and full-refund rules exactly once.
  - [ ] Fail closed for authorization/origin errors and visibly unavailable for missing financial truth.
- [ ] Add the minimal customer-detail UI (AC: 14)
  - [ ] Render one compact chart-free block using the existing Clientes Lite detail.
  - [ ] Preserve mobile-first behavior, keyboard access and no technical identifiers.
- [ ] Prove the contract (AC: 1–17)
  - [ ] Add memory/service tests and isolated PostgreSQL fixtures covering no payment, paid, partial/full refund, duplicate
    delivery, QA, cancelled, unpaid, tip and missing attribution.
  - [ ] Prove read-only behavior and zero committed synthetic residue.
  - [ ] Run lint, typecheck, focused/full tests, build, privacy/secret scan and exact-artifact desktop/390 px QA.
  - [ ] Execute only the separately authorized authenticated Owner Production smoke.

## Dependencies and gates

### G0 — Product formula approval — BLOCKING

The Owner must approve or revise the proposed metric contract before implementation. In particular:

1. average ticket is confirmed **net** service revenue divided by paid-order count;
2. a paid order remains in paid count after refund;
3. any positive confirmed refund makes the order part of refunded count;
4. no paid history yields null/unavailable money, while a fully refunded paid order yields known zero.

### G1 — Financial truth — BLOCKING

- W1C-B1 and W1C-B2 are accepted in Production;
- one current invoice owns its Payment Link;
- signed payment/refund reconciliation is idempotent and bound to the correct order/invoice;
- duplicate delivery and partial/full refund fixtures reconcile exactly once.

W1C-B1 alone does not satisfy this dependency because it intentionally excludes Payment Link, purchase and refund
behavior.

### G2 — Customer continuity — BLOCKING

- A7-018 Clientes Lite remains the private read boundary;
- A7-022 W3-A is accepted in Production;
- repeat continuity uses durable `customer_id`, while every new sale retains new lead/order IDs.

### G3 — Release sequencing

The current full-delivery sequence places W2-B before W3-B. W2-B is not a data or runtime dependency and must not be
coupled into this story, but the published order remains authoritative until the Owner/architecture explicitly reorders
it. Do not skip or bundle unapplied migrations.

### G4 — Security and quality

- Owner-only, same-origin private read;
- opaque reference and minimum browser payload;
- no PII/secret leakage or side effects;
- CLI/service first;
- focused/full/SQL/privacy/visual gates pass;
- exact immutable artifact and rollback are documented before Production GO.

## Explicit non-goals

- customer edit, field provenance editor or profile overwrite;
- reconciliation inbox, conflict resolution, merge, unmerge or fuzzy matching;
- persistent LTV, churn, propensity, loyalty or customer score;
- tags, segments, cohorts, rankings or “best customer” lists;
- charts, BI, retention dashboard or data warehouse;
- campaigns, bulk export, coupons, discounts or rewards;
- WhatsApp message sending, automatic follow-up, marketing or upsell;
- customer portal, login or account;
- route/driver work;
- invoice, Payment Link, payment or refund mutation;
- Stripe customer profile as financial or identity authority;
- GA4, Google Ads, `/order`, attribution or lifecycle changes.

## Rollback

1. Application rollback restores the last accepted customer-detail artifact and removes only the W3-B presentation and
   service call.
2. Any additive read-only database function may remain inert under application rollback. Its exceptional SQL rollback
   may drop only W3-B read objects after dependency verification; it must never delete or rewrite customer, order,
   invoice, payment, refund or attribution history.
3. Because W3-B has no business write path, rollback never attempts to reverse customer-value facts or alter evidence.
4. If Production smoke reveals wrong financial truth, privacy leakage or side effects, stop immediately, restore the
   previous application artifact and report `NOT READY`; do not patch data to make the smoke pass.

## Testing guidance

- Treat payment and refund records, not browser/order labels alone, as the financial authority.
- Include fixtures with one real paid order, multiple orders, partial refund, full refund, duplicate payment/refund
  delivery, pending/unpaid, cancelled, QA and non-zero tip input that must be excluded.
- Include missing/unavailable financial truth and deterministic/partial/unattributed/missing attribution cases.
- Assert exact decimal/cents behavior and no negative net value per order.
- Assert no mutations before and after every read-path test.
- Verify the response and rendered HTML contain no internal IDs, secrets or unapproved PII placement.
- Render the actual private customer detail at 390 px and desktop; verify no horizontal overflow and no charts.
- Run repository-required `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`, plus structure/agent
  validation and `git diff --check` when preparing the implementation gate.

## Dev notes

### Existing foundation to preserve

- Clientes Lite already performs bounded private search and returns an opaque encrypted `customer_ref` rather than a
  raw UUID. Its current read model reports order history and confirmed net service revenue. Do not create a parallel
  customer identity path. [Source: W3 Customer Upgrades Readiness Audit §Current foundation]
- The existing customer revenue helper excludes QA, cancelled, unpaid and tip and nets successful refunds. W3-B must
  extend the explanation of that truth without weakening its filters. [Source:
  `supabase/migrations/20260830030000_orlando_os_customers_lite.sql`]
- W3-A preserves stored customer identity, creates new lead/order IDs and rejects QA-only/cancelled-only reuse. W3-B
  does not change that write contract. [Source: Story A7-022 §§Scope lock, Requirements]
- The Operational Attribution Contract makes Stripe webhook/reconciler the authority for purchase/refund and makes
  `customer_id` the continuity key. Unknown values remain null rather than inferred zero. [Source: Operational
  Attribution Contract §§2, 3.1, 5.2, 7]
- W2-B owns reviewed order-bound WhatsApp sending and explicitly excludes campaigns, bulk messaging and upsells.
  Customer value facts must not become a transport trigger. [Source: Story A7-025 §§Scope lock, Explicit non-goals]

### Project-structure guidance

Implementation should extend the existing customer service/store/API/UI/test surfaces rather than introduce a new app,
navigation root or external platform. Exact implementation files must be confirmed by the developer against the current
tree after all blocking gates pass; this Draft does not authorize code or a migration.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aios-core/core-config.yaml`.
> Quality validation will use the manual review process and the repository quality gates.
> If enabled later, classify this as a Database/API/Frontend read-only story with security and financial-truth focus.

## Change log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-31 | 0.1 | Initial bounded W3-B Draft from the customer-upgrades readiness audit. | River (SM) |

## Dev Agent Record

### Agent Model Used

Not started.

### Debug Log References

None.

### Completion Notes List

Not started. Story remains blocked by G0–G2.

### File List

- `docs/stories/a7-026-orlando-os-w3-b-customer-value-facts.md`

## QA Results

Not started. PO validation is required before development, followed by QA verification after implementation.
