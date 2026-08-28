# A7 Orlando — Operational Attribution and Revenue Contract

**Version:** 1.0 — implementation specification
**Date:** 2026-08-28
**Scope:** Orlando guest-laundry acquisition, WhatsApp qualification, physical order lifecycle and Stripe payment reconciliation
**Status:** `P0 PREVIEW READY / PRODUCTION CUTOVER NOT AUTHORIZED`
**Related story:** `docs/stories/a7-003-conversion-observability.md`
**Source findings:** `docs/audits/2026-08-28-forensic-seo-geo-eeat-ai-search-audit.md`

## 1. Decision

Stripe is the financial endpoint of attribution, not its starting point. The durable commercial chain is:

```text
traffic / landing page
→ WhatsApp or order-intake start
→ lead created
→ guest lead qualified
→ order accepted and order_id issued
→ pickup completed
→ order weighed
→ invoice created
→ payment confirmed
→ order delivered
→ later order accepted by the same customer
```

The system has two macro outcomes with different meanings:

| Outcome | Meaning | Authority |
|---|---|---|
| `order_accepted` | A7 and the customer agreed to a real pickup/order. This is the acquisition outcome. | Operational order system, server-side |
| `purchase` | A payment was confirmed for an existing order. This is the financial outcome. | Stripe webhook/reconciler, server-side |

`whatsapp_click` remains a micro event. It is neither a conversation, a qualified lead, an accepted order nor a sale.

This contract refines, but does not replace, the existing Measurement V2 contract. It preserves `attribution_id`, `short_ref`/`A7 Ref`, immutable first touch, external-entry-only last touch and the current PII boundary.

## 2. Evidence and requirement traceability

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Create a durable lead before price or payment is known. | Audit findings 1, 2 and 10; owner workflow supplied on 2026-08-28 |
| FR-02 | Create `order_id` when A7 accepts the pickup/order, before weighing. | Owner workflow; `ATTRIBUTION-CHAIN-AUDIT-2026-08-18.md` |
| FR-03 | Preserve acquisition from landing through order and payment. | Audit finding 2; Measurement V2 |
| FR-04 | Keep operational acceptance separate from financial payment. | Owner workflow; audit measurement model |
| FR-05 | Reconcile Stripe through an existing `order_id`. | Audit finding 2; Gate B specification |
| FR-06 | Record pickup, weighing, invoice, delivery and repeat behavior. | CRM blueprint §6.4; owner workflow |
| NFR-01 | No customer PII in GA4, `dataLayer`, ad-platform payloads, URLs, logs or Stripe metadata. | Measurement V2 privacy boundary |
| NFR-02 | Lifecycle writes and emitted events are idempotent. | Existing Stripe/Gate B deduplication findings |
| NFR-03 | Unknown values remain null/pending, never inferred as zero. | A7-003 and MOS null semantics |
| NFR-04 | Browser/tag failures do not block WhatsApp navigation or operations. | Measurement V2 fail-open behavior |
| CON-01 | Current Google Ads goals are not changed by this specification. | Current WhatsApp-first account governance |
| CON-02 | `purchase` uses the GA4 recommended event name and `transaction_id`. | Google Analytics recommended-events contract |

## 3. Identity contract

### 3.1 Identifiers

| Identifier | Created when | Created by | Purpose | Customer-visible? |
|---|---|---|---|---|
| `attribution_id` | First tracked site entry | Existing attribution API | Joins protected first/last-touch record | No |
| `lead_reference` | Same attribution session | Existing attribution API | Existing ten-character `A7 Ref` used in WhatsApp handoff | Yes, as `A7 Ref` |
| `lead_id` | First durable lead record | Server/CRM | Stable lead key across qualification | No |
| `order_id` | Pickup/order is accepted | Server/order service | Stable order key before weight, invoice or payment | No |
| `order_number` | At or after order creation | Order service | Optional human-facing operational reference | Only if the operation chooses to expose it |
| `customer_id` | First durable customer/contact match | CRM | Joins repeat orders without using phone as an analytics key | No |
| `payment_id` | Payment provider creates/confirms payment | Stripe ingestion | Financial reconciliation | No |
| `event_id` | Every lifecycle transition | Server event writer | Idempotency and audit trail | No |

Rules:

1. `lead_id`, `order_id`, `customer_id` and `event_id` must be opaque server-generated identifiers.
2. Phone, name, email, exact property/address and room number must never be used as join keys outside the protected operational store.
3. One lead can create zero or one accepted order in the MVP. If quote splitting or multi-order leads are introduced later, the relationship may become one-to-many without changing existing IDs.
4. A repeat customer receives a new `lead_id` and a new `order_id`; `customer_id` is the continuity key.
5. `order_id` exists before `actual_lbs`, `invoice_id`, `amount_due` or `payment_id`.
6. Attribution is never a prerequisite for operations. If the attribution store is unavailable or no deterministic link exists, create and advance the lead/order with `attribution_confidence=unattributed`.

### 3.2 Creation boundaries

`lead_id` is created when either of these occurs:

- a structured `/order/` intake is submitted successfully; or
- an inbound WhatsApp conversation is durably registered and recognized as a service inquiry.

`order_id` is created only when all of these are true:

- requested service is operationally supported;
- service area/property handoff is accepted;
- timing or needed-by requirement is accepted;
- the customer accepts the applicable minimum/price basis;
- A7 confirms the pickup/order.

A quote, CTA click, form start, unanswered WhatsApp message or tentative slot does not create `order_accepted`.

## 4. Lifecycle state model

Operational and financial status are deliberately separate.

### 4.1 Lead status

```text
new → qualifying → qualified → order_accepted
                  ├→ disqualified
                  └→ lost
```

Allowed values:

- `new`
- `qualifying`
- `qualified`
- `disqualified`
- `lost`
- `order_accepted`

`disqualification_reason` is required for `disqualified`; `loss_reason` is required for `lost` when known.

### 4.2 Operational order status

```text
accepted
→ pickup_scheduled
→ picked_up
→ weighed
→ invoice_created
→ ready_for_delivery
→ delivered
```

`cancelled` is a terminal operational branch from any state before `delivered`. Corrections do not delete prior transitions; they append a corrective event.

### 4.3 Payment status

```text
pending → invoice_created → paid
                      ├→ failed
                      └→ void
paid → partially_refunded → refunded
```

The order may advance operationally only according to the real A7 policy. This specification sets the normal measured path as payment before delivery, but it preserves separate status fields so an owner-approved exception can be represented truthfully.

## 5. Event taxonomy

### 5.1 Canonical events

| Event | Trigger | Source of truth | GA4 role | Google Ads role at specification date |
|---|---|---|---|---|
| `money_page_view` | Primary money page viewed | Browser | Diagnostic only; remove key-event status | Never a conversion |
| `whatsapp_click` | User activates a valid WhatsApp CTA | Browser | Micro event; not a sale | Current interim primary proxy remains unchanged until a separate approved cutover |
| `generate_lead` | Durable `lead_id` created | Server/CRM | Secondary lead event | Not imported until durability and consent are proven |
| `lead_qualification_started` | An operator starts qualification of a new lead | Server/CRM | Operational diagnostic only | None |
| `qualified_guest_lead` | Lead satisfies service, area, timing and minimum rules | Server/CRM | Secondary commercial event | Candidate offline conversion after reconciliation is proven |
| `lead_disqualified` | An active lead fails the service/area/timing/minimum contract with a reason | Server/CRM | Operational diagnostic only | None |
| `lead_lost` | An active lead is closed without an accepted order | Server/CRM | Operational diagnostic only | None |
| `order_accepted` | Server creates `order_id` after operational acceptance | Server/order service | **Macro operational key event** | Intended replacement for the click proxy after volume, consent and import gates pass |
| `pickup_scheduled` | A valid pickup window is committed to the accepted order | Server/operations | Lifecycle diagnostic | None |
| `pickup_completed` | Pickup job is completed | Server/operations | Lifecycle diagnostic | None |
| `order_weighed` | Actual weight is recorded | Server/operations | Lifecycle diagnostic | None |
| `invoice_created` | Final service amount is issued for the weighed order | Server/billing | Lifecycle diagnostic | None |
| `purchase` | Stripe confirms a successful payment for the order | Stripe webhook/reconciler | **Macro financial key event** | Financial/value event; current account role is not changed here |
| `order_ready_for_delivery` | A paid invoiced order is operationally ready to return | Server/operations | Lifecycle diagnostic | None |
| `order_delivered` | Delivery job is completed | Server/operations | Lifecycle diagnostic | None |
| `order_cancelled` | An undelivered order is cancelled with an operational reason | Server/operations | Lifecycle diagnostic | None |
| `refund` | Stripe confirms full or partial refund | Stripe webhook/reconciler | Financial correction | Financial correction only |

Repeat orders do not create a separate event name. Emit the same `order_accepted` with `is_repeat_customer=true` and an incremented internal customer order count.

### 5.2 Event authority

- Browser events may prove page/CTA interaction only.
- WhatsApp webhook/CRM events may prove inbound conversation and qualification only after durable ingestion.
- The order service is the only authority for `order_accepted` and operational state changes.
- A thank-you page is not the authority for payment.
- Stripe webhook ingestion or an idempotent server reconciler is the only authority for `purchase` and `refund`.
- GA4, Google Ads and MOS consume events; they do not create business truth.

## 6. Common event envelope

Every durable lifecycle event is written to the protected audit ledger before delivery to analytics.

| Field | Type | Required | Rule |
|---|---|---:|---|
| `event_id` | string | Yes | Unique and stable for this transition |
| `event_name` | enum | Yes | One canonical name from §5 |
| `event_version` | integer | Yes | Starts at `1` |
| `occurred_at` | ISO-8601 timestamp | Yes | Actual business event time in UTC |
| `recorded_at` | ISO-8601 timestamp | Yes | Server write time in UTC |
| `source_system` | enum | Yes | `website`, `whatsapp`, `crm`, `operations`, `stripe`, `reconciler` |
| `lead_id` | opaque string | From `generate_lead` onward | Never phone/name |
| `order_id` | opaque string | From `order_accepted` onward | Created before weight and revenue |
| `customer_id` | opaque string | When resolved | Protected continuity key |
| `attribution_id` | string/null | When captured | Existing `at_…` identifier |
| `lead_reference` | string/null | When captured | Existing validated `A7 Ref` |
| `service_type` | enum | From qualification onward | Canonical verified service |
| `customer_type` | enum | When known | `guest`, `host`, `commercial`, `resident`, `unknown` |
| `language` | enum | When known | `en`, `pt`, `es`, `other`, `unknown` |
| `accommodation_type` | enum | When known | Aggregated type, never room number |
| `service_area_bucket` | string/null | When known | Approved aggregate corridor/area, never exact address |
| `is_repeat_customer` | boolean | From `order_accepted` onward | Calculated from durable `customer_id` history |
| `idempotency_key` | string | Yes | Unique per source transition |
| `schema_valid` | boolean | Yes | Must be true before analytics delivery |

Fields that exist internally but must not be copied to GA4/dataLayer are listed in §9.

## 7. Event-specific payloads

### `generate_lead`

Required in addition to the common envelope:

- `lead_id`
- `lead_origin`: `order_form`, `whatsapp_inbound`, `manual`
- `conversation_id` when WhatsApp-created
- `attribution_resolution`: `attribution_id`, `short_ref`, `ctwa`, `prior_customer`, `unknown`

### `qualified_guest_lead`

Required:

- `lead_id`
- `qualification_status=qualified`
- `service_area_accepted=true`
- `timing_accepted=true`
- `minimum_basis_accepted=true`
- `service_type`

The detailed answers remain internal. GA4 receives only the result and safe categorical dimensions.

### `order_accepted`

Required:

- `lead_id`
- `order_id`
- `accepted_at`
- `service_type`
- `pickup_window_start` and `pickup_window_end` internally
- `estimated_lbs` internally when supplied; null is valid
- frozen attribution snapshot ID/version

`value` must not be sent when the amount is still unknown. Do not send estimated revenue as actual conversion value.

### `pickup_completed`

Required:

- `order_id`
- `pickup_job_id`
- `completed_at`

Proof media, address and driver/operator identity remain protected.

### `order_weighed`

Required:

- `order_id`
- `actual_lbs`
- `weighed_at`
- `weight_unit=lb`

`actual_lbs` is an operational field. It need not be registered as a GA4 custom dimension.

### `invoice_created`

Required:

- `order_id`
- `invoice_id`
- `invoice_created_at`
- `amount_due`
- `currency=USD`
- `service_amount`
- `tip_amount` separately when applicable

MVP financial boundary: tips are not enabled. `tip_amount` must be `0`, and `amount_due` must equal
eligible `service_amount`. A future tip feature requires a separate refund-allocation contract before
it may change the charged amount or analytics value.

Only eligible service revenue may be used for advertising value optimization. Tips never silently inflate service revenue.

### `purchase`

Required GA4-compatible fields:

- `transaction_id`: stable payment/order transaction key
- `order_id`
- `value`: confirmed eligible service revenue
- `currency=USD`
- `items`: at least one service item with stable `item_id` and `item_name`
- `payment_id` internally
- `stripe_invoice_id`, `stripe_payment_intent_id` and/or `stripe_checkout_session_id` internally as available

One successful financial transaction produces one `purchase`. Browser reloads, repeated webhooks and reconciler retries must not create additional purchases.

### `order_delivered`

Required:

- `order_id`
- `delivery_job_id`
- `delivered_at`

### `refund`

Required:

- original `transaction_id`
- `order_id`
- `refund_id` internally
- `value` for partial refund or full eligible service value
- `currency=USD`
- refund reason internally when available

Refunds append financial history; they do not delete or rewrite the original purchase.

## 8. Attribution snapshot

### 8.1 Capture and freeze rules

1. First touch is immutable, using the existing Measurement V2 definition.
2. Last touch updates only for a later external/campaign entry, never for internal navigation or direct return.
3. At `order_accepted`, copy the resolved attribution into an immutable order snapshot.
4. Stripe can enrich payment identifiers but cannot overwrite the frozen acquisition snapshot.
5. A Stripe referral or confirmation-page session must never become the order's acquisition source.
6. Orders without a deterministic attribution link are `unattributed`, not assigned by customer recollection, amount similarity or timestamp proximity.

### 8.2 Protected attribution fields

The order snapshot stores, when available:

- `attribution_id`
- `lead_reference`
- first-touch source, medium, campaign, term, content, landing page, referrer and timestamp
- last-touch source, medium, campaign, term, content, landing page, referrer and timestamp
- full `gclid`, `gbraid`, `wbraid` and CTWA identifiers in protected storage only
- GA client/session identifiers needed for server-side GA4 continuity, subject to consent and retention policy
- snapshot creation time and contract version
- `attribution_confidence`: `deterministic`, `partial`, `unattributed`

Raw UTMs and click IDs remain excluded from the browser GA4 event payload, consistent with `a7-events.js`.

## 9. Privacy and data-placement matrix

| Data | Protected CRM/order DB | GA4 / dataLayer | Stripe metadata | Logs |
|---|---:|---:|---:|---:|
| `lead_id`, `order_id`, `attribution_id` | Yes | Opaque IDs allowed under the approved analytics contract | Yes | Masked only |
| `lead_reference` | Yes | Allowed as existing opaque reference | Yes | Masked/validated |
| Raw phone / WhatsApp ID | Yes, restricted | **No** | **No** | **No** |
| Customer name/email | Yes, if operationally required | **No** | **No** | **No** |
| Exact hotel/property/address/room | Yes, restricted | **No** | **No** | **No** |
| Accommodation type / area bucket | Yes | Yes | Not needed | Aggregate only |
| Full click IDs / raw CTWA IDs | Yes, protected | **No** | Not needed | **No** |
| Amount/currency | Yes | Yes after confirmed event | Native financial data | Aggregate/masked |
| Message body/media/transcript | Yes, restricted if retained | **No** | **No** | **No** |

The public `/order/` form may collect operational data, but submission must use a protected POST. PII must not be placed in query strings, the WhatsApp attribution suffix, page URLs, analytics parameters or diagnostic logs.

## 10. `/order/` intake contract

The page is an availability/pickup request, not a checkout.

### 10.1 Customer-visible inputs

- service type;
- accommodation type;
- pickup address/property and handoff notes;
- preferred pickup window;
- needed-by date/time;
- estimated load or bag count, optional;
- name and WhatsApp/contact details;
- language;
- acknowledgement of price basis, minimum and confirmation requirement;
- required privacy/communications consent.

### 10.2 Submission behavior

1. Server validates the request and creates `lead_id`.
2. Server attaches the active `attribution_id`/`lead_reference` when available.
3. Server returns only safe customer-facing confirmation data.
4. The page may open WhatsApp with a concise prefill containing `A7 Ref` and, if approved, a non-sensitive order-request reference.
5. A7 qualifies and confirms availability.
6. `order_id` and `order_accepted` are created only after acceptance.

The form must not claim a confirmed pickup immediately after submission.

## 11. Browser dataLayer contract

Browser pushes are restricted to interactions the browser can actually observe. Example:

```js
window.dataLayer.push({
  event: 'whatsapp_click',
  event_version: 1,
  event_id: 'opaque-interaction-id',
  lead_reference: '7KQ9W3M2HX',
  page_path: '/laundry-pickup-delivery-orlando',
  cta_location: 'hero',
  service_type: 'wash_fold_guest',
  customer_type: 'guest'
});
```

When `/order/` creates a durable lead successfully, the browser may receive and push the safe acknowledgement:

```js
window.dataLayer.push({
  event: 'generate_lead',
  event_version: 1,
  event_id: 'opaque-event-id',
  lead_id: 'opaque-lead-id',
  lead_reference: '7KQ9W3M2HX',
  lead_origin: 'order_form',
  service_type: 'wash_fold_guest'
});
```

Do not push `order_accepted`, `purchase`, pickup, weight, invoice or delivery from the browser. Those are server lifecycle events.

## 12. GA4 delivery contract

### 12.1 Key-event configuration

After implementation and QA:

- `money_page_view`: normal event, not a key event;
- `whatsapp_click`: micro/diagnostic event, not reported as a sale;
- `generate_lead`: secondary funnel event;
- `qualified_guest_lead`: secondary commercial event;
- `order_accepted`: operational macro key event;
- `purchase`: financial macro key event;
- pickup, weighing, invoice, delivery and refund: lifecycle/financial diagnostic events, with `refund` correcting revenue.

GA4 key-event classification and Google Ads bidding roles are separate controls. This document does not authorize an Ads goal change. `order_accepted` can replace the current WhatsApp-click proxy in Ads only after deterministic imports, consent, sufficient volume and owner-approved rollback criteria are proven.

### 12.2 Server delivery

Operational lifecycle events must be sent server-side using the approved GA4 server collection path and tied to the original browser identity/session when consent and identifiers are available. The protected store may retain GA client/session identifiers for this purpose. If continuity identifiers are missing, send the event only under the explicitly approved unattributed policy or keep it in the operational ledger; never fabricate a session.

For `purchase`, use `transaction_id` for financial deduplication and retain server-side idempotency as the primary control. Do not depend on GA4 to deduplicate non-purchase lifecycle events.

Official implementation references:

- GA4 recommended events: `https://developers.google.com/analytics/devguides/collection/ga4/reference/events`
- GA4 Measurement Protocol: `https://developers.google.com/analytics/devguides/collection/protocol/ga4`
- Google Analytics prohibited PII guidance: `https://support.google.com/analytics/answer/6366371`
- Google Ads primary/secondary conversion actions: `https://support.google.com/google-ads/answer/11461796`

## 13. Logical order record

This is a logical contract to be mapped onto the approved CRM/order schema. It is not authorization for an unreviewed migration.

| Group | Field | Required at creation | Notes |
|---|---|---:|---|
| Identity | `order_id` | Yes | Opaque stable key |
| Identity | `order_number` | No | Human-readable reference if adopted |
| Identity | `lead_id` | Yes | Originating lead |
| Identity | `conversation_id` | When WhatsApp-originated | Existing WhatsApp/CRM relationship |
| Identity | `customer_id` | Yes when resolved | Repeat-order continuity |
| Service | `service_type` | Yes | Verified canonical service |
| Service | `customer_type` | Yes | Guest/host/commercial/resident/unknown |
| Service | `service_tier` | When applicable | Normal/Express with availability qualifier |
| Operation | `order_status` | Yes | Starts `accepted` |
| Operation | `accepted_at` | Yes | Defines `order_accepted` |
| Operation | `pickup_window_start/end` | Yes | Protected operational fields |
| Operation | `picked_up_at` | No | Null until completed |
| Operation | `estimated_lbs` | No | Customer estimate |
| Operation | `actual_lbs` | No | Null until weighing |
| Operation | `weighed_at` | No | Required with actual weight |
| Operation | `delivered_at` | No | Null until delivery |
| Financial | `payment_status` | Yes | Starts `pending` |
| Financial | `service_amount` | No | Null until invoiced |
| Financial | `tip_amount` | No | Separate from service revenue |
| Financial | `currency` | When amount exists | `USD` for Orlando |
| Financial | `invoice_id` | No | Required when invoiced |
| Financial | `payment_id` | No | Required when paid |
| Financial | `paid_at` | No | Required when paid |
| Attribution | `attribution_snapshot_id` | No | Required when attribution resolves |
| Attribution | `attribution_confidence` | Yes | Deterministic/partial/unattributed |
| Governance | `created_at`, `updated_at` | Yes | Server timestamps |
| Governance | `version` | Yes | Optimistic concurrency/audit support |

Integrity rules:

- `actual_lbs` and `weighed_at` must appear together.
- `invoice_created` requires a weighed order for per-pound laundry, unless the verified service has fixed pricing.
- `paid` requires a unique `payment_id`, amount and currency.
- `delivered` requires a completed delivery job.
- status corrections append events; records are not silently rewritten.

## 14. Stripe contract

The payment-link/session metadata must contain only opaque technical linkage:

- `order_id` — required;
- `lead_id` — required;
- `contract_version=1`.

`a7_reference` may be added only if a documented reconciliation case cannot be served by `order_id` and `lead_id`. `attribution_id` remains in the A7 database and is not copied to Stripe.

Operator text, phone, name, address, room number, raw click IDs and raw UTMs are forbidden in metadata.

The integration must:

1. refuse attributed order payment-link creation without a valid `order_id`;
2. validate that the referenced order exists and is payable;
3. ingest payment success and refund server-side;
4. deduplicate webhook delivery by Stripe event/payment ID;
5. bind the payment to the existing order;
6. emit `purchase` once with confirmed value/currency;
7. preserve unpaid, failed, void and refunded states;
8. keep the confirmation page informational and non-authoritative.

The canonical `transaction_id` is the stable Stripe PaymentIntent ID for the financial transaction. A webhook event ID, Checkout Session ID, page view, timestamp or retry identifier must never become the transaction ID. Webhook and reconciler retries for the same PaymentIntent reuse the same `transaction_id`.

## 15. Reporting contract

The Core 15 and MOS should report these stages separately:

```text
landing sessions
→ WhatsApp clicks
→ leads created
→ qualified guest leads
→ accepted orders
→ pickups completed
→ orders weighed
→ invoices created
→ paid orders / service revenue
→ delivered orders
→ repeat accepted orders
```

Minimum decision metrics:

- landing-to-lead rate;
- lead-to-qualified rate;
- qualified-to-accepted-order rate;
- accepted-to-paid rate;
- accepted-to-delivered rate;
- median lead-to-acceptance time;
- median acceptance-to-pickup time;
- median pickup-to-delivery time;
- confirmed service revenue per landing session;
- confirmed service revenue per accepted order;
- repeat-order rate by first-order acquisition source;
- attributed, partially attributed and unattributed order share.

Attribution health must be reported as two separate measures:

- **Coverage:** percentage of paid orders with an attribution snapshot record, including an explicit `unattributed` snapshot;
- **Quality mix:** percentages of `deterministic`, `partial` and `unattributed`, which must sum to 100% for the covered population.

A coverage target must never hide poor attribution quality. The dashboard shows the quality mix alongside coverage.

Every report must expose period, timezone, source, freshness and availability. Counts from GA4, Ads, WhatsApp, CRM and Stripe are not deduplicated unless joined through the technical IDs in this contract.

## 16. End-to-end QA scenario

Use a test-mode order and a tagged landing URL. The test passes only when:

1. first and last touch are captured with a valid `attribution_id` and `A7 Ref`;
2. one CTA interaction produces one `whatsapp_click`;
3. intake creates one durable `lead_id` and one `generate_lead`;
4. qualification produces one `qualified_guest_lead`;
5. acceptance creates one `order_id` and one `order_accepted` before weight/revenue exist;
6. pickup and weight transitions use the same `order_id`;
7. invoice creation records actual weight, eligible service amount and currency;
8. Stripe metadata contains the same opaque `order_id` and no PII;
9. repeated Stripe webhook/reconciler delivery for the same PaymentIntent reuses one stable `transaction_id` and creates one payment record and one GA4 `purchase`;
10. the original acquisition snapshot remains unchanged and Stripe is not the acquisition source;
11. delivery uses the same `order_id`;
12. a second accepted order for the same `customer_id` has new lead/order IDs and `is_repeat_customer=true`;
13. no raw phone, email, address, room, message body or click ID appears in GA4 DebugView, `dataLayer`, browser URL or application logs;
14. refund testing appends one `refund` and preserves the original purchase;
15. API/tag failure does not prevent the customer from opening WhatsApp or operations from recording the order.

## 17. Implementation sequence

### P0 — measurement truth

1. Unmark `money_page_view` as a GA4 key event.
2. Implement and prove the durable attribution record and `A7 Ref` resolution.
3. Implement durable `lead_id`, without blocking unattributed leads.
4. Implement durable `order_id` and immutable attribution snapshot at acceptance.
5. Implement the lifecycle ledger and idempotency boundary before accepting Stripe webhooks.
6. Require `order_id` in invoice/payment-link creation.
7. Add idempotent Stripe payment/refund ingestion with stable PaymentIntent `transaction_id`.
8. Emit server-side `purchase`, `refund` and `order_accepted` with the minimum acquisition payload.
9. Execute §16 and retain redacted evidence.

### P1 — structured acquisition

1. Add `/order/` as a request/availability intake, not checkout.
2. Connect it to the same lead/order identity contract.
3. Add MOS/Core 15 funnel reporting.
4. After a clean observation window, assess an owner-approved Google Ads cutover from click proxy to accepted order.

## 18. Definition of done

- `money_page_view` is no longer a GA4 key event.
- Every new operational inquiry has a durable `lead_id` or an explicit ingestion failure.
- Every accepted pickup has an `order_id` before weighing/invoicing.
- At least 95% of new paid orders have an attribution snapshot record, including an explicit unattributed record when no link exists.
- The dashboard separately reports the deterministic, partial and unattributed quality mix; no quality tier is hidden inside the coverage KPI.
- `order_accepted` and `purchase` are independently reportable by landing page and acquisition source.
- Stripe never becomes the order's acquisition source.
- Purchase/refund delivery is server-side and idempotent.
- No PII is present in analytics, URLs, metadata or logs covered by this contract.
- The end-to-end QA scenario passes with redacted evidence.
- No campaign, bidding or conversion-goal change is bundled into the implementation release.

## 19. Explicit non-goals

- Charging the customer at form submission.
- Estimating real revenue before weighing/invoice.
- Treating WhatsApp click as a qualified lead.
- Rewriting historical GA4 attribution.
- Inferring an order's channel from amount, customer statement or timestamp proximity.
- Publishing new SEO location pages.
- Changing Google Ads bidding/goals without a separate owner-approved runbook and rollback.

## 20. Implementation checkpoint — 2026-08-28

- Remote additive Supabase migrations `20260828020000` through `20260828120000` are applied; the WhatsApp dependency was already present. Migration `20260828110000` preserves the immutable business event time through the analytics outbox and GA4 `timestamp_micros` on delayed delivery; `20260828120000` makes out-of-window analytics delivery terminally `expired` rather than infinitely retryable.
- The local server candidate implements durable lead/order lifecycle, immutable attribution snapshots, operational outbox, minimal GA4 delivery, invoiced-order-bound Payment Links and signed/idempotent Stripe payment/refund ingestion.
- The guest confirmation page is informational and no longer emits browser-authoritative purchase or Ads conversion events.
- The migration passed syntax and functional smoke testing twice in isolated PostgreSQL 15; focused Node tests, lint, typecheck and production build pass.
- Protected Preview `dpl_GvKKuXdVHKrvucSDn4b2hjrNzjdq` is READY with durable Supabase storage. A tagged browser journey, one WhatsApp click, deterministic lead/order acceptance, idempotent retry, landing-page funnel reporting and zero-residue cleanup passed. Test-mode Stripe endpoint `we_1U9WaIDcFmXJh57PGw4oFeVX` has the exact event scope and uses the dedicated non-system Vercel bypass labeled `Stripe-QA`; signed delivery returned HTTP 200 on the unique deployment and stable alias before the superseded endpoint was deleted.
- Production remains blocked because its operational/webhook configuration and cutover have not been separately authorized, and `GA4_MEASUREMENT_PROTOCOL_SECRET` is unavailable.
- `money_page_view` remains pending as an external GA4 configuration change because the active Chrome account lacks property permission. No access request or configuration change was made.
- No Google Ads goal, bid, budget, campaign or conversion role was changed.
