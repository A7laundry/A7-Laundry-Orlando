# A7 Orlando OS — W3 Customer Upgrades Readiness Audit

**Date:** 2026-08-30
**Scope:** practical customer reuse, repeat history, basic LTV and conflict-safe reconciliation
**Assessment only:** no customer record, database, Vercel or Production mutation was performed

## Executive verdict

Clientes Lite is already a trustworthy private read model. It finds customers by name, protected phone lookup,
email or order number and reports existing orders plus confirmed net service revenue. The next useful upgrade is not a
CRM. It is a small operational layer that lets the team reuse a known customer, understand repeat value and resolve
identity conflicts without destructive automatic merges.

Recommended bounded releases:

```text
W3-A  existing customer → prefilled new attendance/order
W3-B  repeat/ticket/LTV facts derived from confirmed orders
W3-C  conflict inbox + Owner-reviewed field update/merge
```

Marketing campaigns, tags, loyalty, scoring, bulk export and a customer portal remain outside the MVP.

## Current foundation

| Capability | Current behavior | Verdict |
|---|---|---|
| Private customer search | Bounded server-side POST search; no PII in URL. | Keep |
| Opaque browser identity | Encrypted authenticated `customer_ref`, not raw customer UUID. | Keep |
| Customer detail | Phone, email when available, language, type and latest property. | Keep |
| Order history | Human order number, operational/financial status and Pickup Order link. | Keep |
| Confirmed revenue | Paid/refunded states only, net of successful refunds; excludes tip, QA and cancelled orders. | Keep |
| First acquisition source | Deterministic first-order attribution only; unknown remains unavailable. | Keep |
| QA isolation | QA visible but excluded from commercial aggregates. | Keep |
| Automatic merge | None. Conflicts remain separate. | Correct safety baseline |

## Confirmed gaps

### 1. No “new order for this customer” workflow

The approved release map mentions customer prefill, but the current detail screen only displays data and links to
past Pickup Orders. The team must retype the same name, WhatsApp, language, type and property into Atendimento.

W3-A should add one clear action:

```text
Cliente conhecido
→ Novo atendimento para este cliente
→ protected customer_ref resolved server-side
→ prefill current confirmed facts
→ operator reviews/changes operational facts
→ existing W1A order service creates a new lead and new order
```

The new order must preserve the same `customer_id`, create a new `lead_id`/`order_id` and calculate
`is_repeat_customer=true` from durable history. Prefill never confirms a sale automatically.

### 2. Repeat and ticket facts are missing

The current screen has order count and confirmed revenue but not:

- real paid-order count;
- repeat customer indicator;
- confirmed average ticket;
- refunded amount separated from net revenue;
- most recent completed order;
- first-order acquisition source alongside later-order sources.

These values should be derived at read time from joined order/payment/refund truth. Unknown and zero remain distinct.
No persisted “LTV score” is needed.

### 3. Field provenance is incomplete

Email has an `email_source`, but customer name, WhatsApp, language, type and property lack a consistent visible
source/time contract. Stripe may complement data but must never silently overwrite WhatsApp or operator-confirmed
facts.

### 4. No reconciliation inbox

There is no safe place to present likely conflicts such as:

- same normalized WhatsApp with a different display name;
- same normalized email on separate contacts;
- Stripe-provided email/name differing from an operator-confirmed customer;
- duplicate contacts created before normalization;
- one customer contacting A7 from a new phone.

Similarity by name, hotel, amount or timestamp must never auto-merge customers.

### 5. Merge/audit mechanism is absent

A future confirmed merge needs alias/tombstone history, affected-record preview and deterministic reassignment. Deleting
the losing customer row or rewriting orders silently would destroy auditability and attribution continuity.

## Recommended reconciliation rule for Owner approval

1. Exact normalized WhatsApp on the same Orlando unit identifies the existing customer during new order creation.
2. Name, property, room, amount, timing and fuzzy similarity never authorize a merge.
3. Exact normalized email may create a conflict candidate but does not merge automatically.
4. Stripe may propose a field value with source/timestamp; it cannot overwrite a WhatsApp or Owner-confirmed value.
5. Only Owner may approve a field update or merge, after seeing both records and all affected orders/leads/messages.
6. Merge reassigns relationships transactionally, records before/after IDs and reason, and creates an alias from the
   losing ID to the surviving ID; it never deletes operational/payment history.
7. A merge involving paid orders requires a second confirmation and cannot alter frozen attribution snapshots.
8. Unmerge is not simulated by deleting history; a corrective append-only action is required.

## Recommended releases

### W3-A — Reuse known customer

- Owner selects a customer from Clientes;
- server resolves opaque reference and returns approved prefill fields;
- Atendimento clearly labels reused versus editable facts;
- order service reuses `customer_id` and creates new lead/order IDs;
- retry remains idempotent;
- no customer mutation outside the reviewed order submission;
- CLI/service before UI.

### W3-B — Basic repeat value

- real/paid/refunded order counts;
- confirmed net service revenue;
- confirmed average ticket or null when unavailable;
- first/last paid order;
- repeat status from durable customer history;
- first acquisition source and attribution availability;
- no charts required inside customer detail.

### W3-C — Reconciliation inbox

- explicit conflict records with type, sources and timestamps;
- Owner-only field resolution/merge;
- preview of affected contacts, leads, orders and messages;
- transactional reassignment plus append-only merge/alias ledger;
- frozen attribution/payment records preserved;
- no fuzzy auto-merge.

## Security and privacy invariants

1. Customer search and conflict review remain private POST/server flows.
2. No phone, email, hotel/address/room or customer UUID in URLs, analytics or logs.
3. Browser receives only the minimum fields needed for the current Owner task.
4. Export, bulk marketing and mass messaging remain absent.
5. QA contacts/orders never influence repeat or revenue calculations.
6. Confirmed revenue remains derived from payment/refund truth, never Stripe customer profile estimates.
7. Frozen attribution snapshots remain immutable through customer updates or merge.
8. Every write is Owner-authorized, idempotent and append-only audited.

## Required proof before declaring customer upgrades complete

- a known customer starts a new attendance without retyping identity;
- the accepted order reuses `customer_id` and creates new lead/order IDs;
- `is_repeat_customer` changes truthfully only after a prior real order exists;
- ticket and revenue reconcile to paid/refund records and distinguish null from zero;
- QA/cancelled/unpaid/tip remain excluded;
- exact-phone resolution is deterministic under concurrency;
- conflict candidates do not auto-merge;
- an Owner-approved synthetic merge preserves every order, message, payment and frozen attribution snapshot;
- unauthorized, non-Owner, wrong-origin and stale-version writes fail closed;
- desktop/390 px, lint, typecheck, focused/full tests and build pass;
- Preview, Production GO and rollback evidence exist per bounded release.

## Current decision

W3-A is the highest-value customer upgrade because it removes morning retyping without creating CRM complexity.
W3-B follows after W1C-B payment truth is available. W3-C remains blocked until the Owner approves the reconciliation
rule above. Routes/motorists are a separate W3 story and must not be bundled with customer identity writes.
