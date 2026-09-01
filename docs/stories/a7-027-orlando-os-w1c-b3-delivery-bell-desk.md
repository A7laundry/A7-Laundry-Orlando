# Story A7-027 — A7 Orlando OS W1C-B3 Delivery and Bell Desk

**Status:** Draft / Blocked — W1C-B2 must be accepted live and the Bell Desk completion rule is not approved

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§9.2, 9.5, 17, 18 and 21.2; Operational Attribution Contract
`order_delivered`; Full Delivery Status finding 7

**Depends on:** A7-019 W1B accepted in Production; A7-020 W1C-A accepted; A7-023 W1C-B1 accepted;
A7-024 W1C-B2 accepted and proven live

## Story

**As the** A7 Orlando Owner,

**I want** to complete a paid and ready order through a controlled direct-delivery or Bell Desk flow,

**so that** custody, lifecycle and delivery evidence remain truthful until a human explicitly confirms the final handoff.

## Scope lock

W1C-B3 owns only the final operational delivery slice for an existing paid, invoiced and production-ready order:
creation of one opaque `delivery_job_id`, start of delivery, optional Bell Desk handoff, explicit final confirmation,
coordinated lifecycle/custody transitions, append-only evidence and a concise Owner-only action in the existing order
detail.

This story does not create routes, assign drivers, optimize stops, calculate ETA, send WhatsApp messages, call or
configure Stripe, alter invoice/payment truth, change attribution/GA4/Ads, create a customer portal or introduce a
second delivery authority.

## Blocking decision gate

Implementation and release remain blocked until the Owner explicitly approves the Bell Desk completion rule.

**Recommended rule:** Bell Desk is an intermediate custody state, not proof of delivery.

```text
paid + ready_for_delivery + production ready
→ start_delivery
→ custody with_driver_delivery
→ optional leave_bell_desk
→ custody bell_desk; lifecycle remains ready_for_delivery
→ explicit final confirmation
→ lifecycle delivered + custody delivered + order_delivered
```

For a direct handoff, the explicit final confirmation may advance `with_driver_delivery → delivered`. Leaving an
order at the Bell Desk must never emit `order_delivered`, mark the lifecycle delivered or infer receipt. If the
Owner chooses a different rule, this story must be revised and revalidated before implementation.

The decision record must also name who may perform final confirmation. The initial safe release remains Owner-only;
Operator permission requires a separate authorization gate.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Delivery may start only for the current real non-QA order whose signed financial truth is `paid`, lifecycle is `ready_for_delivery`, production is `ready` and custody is `at_laundry`. | Blueprint §9.5 |
| FR-02 | Starting delivery creates or resolves exactly one opaque `delivery_job_id` owned by the order; the browser cannot supply or replace it. | Attribution Contract `order_delivered` |
| FR-03 | Every delivery transition uses the same `delivery_job_id` and appends actor, UTC time, before/after state, idempotency identity and safe reason/evidence. | Blueprint §§9, 16 |
| FR-04 | `start_delivery` changes custody to `with_driver_delivery` without changing production, payment, invoice or attribution. | Blueprint §9.5 |
| FR-05 | Under the recommended rule, `leave_bell_desk` changes custody to `bell_desk` only and does not emit `order_delivered`. | Blueprint §21.2 decision gate |
| FR-06 | Direct or post-Bell-Desk completion requires an explicit authorized final-confirmation action and emits `order_delivered` exactly once with `order_id`, `delivery_job_id` and server-owned `delivered_at`. | Attribution Contract `order_delivered` |
| FR-07 | Exact retries return the prior result; conflicting idempotency reuse, stale version and concurrent duplicate completion fail closed without a second event. | System idempotency invariant |
| FR-08 | Cancelled, unpaid, refunded, not-ready, wrong-custody, QA, unknown or already delivered orders cannot start or advance delivery. | Existing OS invariants |
| FR-09 | The order detail shows current delivery state, safe next action and final-confirmation evidence without exposing technical IDs or inferring customer receipt. | Blueprint §§8.3, 11 |
| NFR-01 | CLI/service contracts precede API/UI; UI contains no duplicate eligibility or transition authority. | Constitution I |
| NFR-02 | Initial release is Owner-only, same-origin POST, submission-bound, server-authorized and fail-closed. | Blueprint §16 |
| NFR-03 | No customer PII, exact address/room, secret, `delivery_job_id`, UUID or idempotency key enters URLs, analytics, diagnostic logs or public artifacts. | Privacy boundary |
| NFR-04 | Schema changes are additive, service-role-only, concurrency-safe and inert under the accepted W1C-B2 application rollback. | Release governance |
| CON-01 | W1C-B3 reads signed payment truth but never calls Stripe or mutates invoice, link, payment, purchase, refund or revenue. | Scope lock |
| CON-02 | W1C-B3 does not create driver, route, stop, ETA, GPS, optimization or dispatch behavior. | Blueprint §14; W3 boundary |
| CON-03 | W1C-B3 does not draft, copy or send WhatsApp messages. | W2 boundary |
| CON-04 | No implementation, migration or Production release before both dependencies and the Bell Desk decision gate are evidenced. | Owner release governance |

## State contract

The approved implementation must preserve the existing independent axes:

| Action | Lifecycle | Custody | Production | Financial |
|---|---|---|---|---|
| Start delivery | `ready_for_delivery` | `with_driver_delivery` | `ready` | `paid` |
| Leave at Bell Desk | `ready_for_delivery` | `bell_desk` | `ready` | `paid` |
| Confirm direct delivery | `delivered` | `delivered` | `ready` | `paid` |
| Confirm after Bell Desk | `delivered` | `delivered` | `ready` | `paid` |

`delivery_job_id` is mandatory for every row in this flow and for the final `order_delivered` event. It is an
operational correlation identity only; it does not imply a driver, route or external courier integration.

## Acceptance criteria

- [ ] The Owner Bell Desk rule and final-confirmation authority are recorded explicitly in this story before implementation begins.
- [ ] CLI/service dry-run explains eligibility and next transition without writing or exposing protected identifiers.
- [ ] Starting delivery on one eligible paid+ready order creates one opaque delivery job and advances custody only.
- [ ] A missing, mismatched or browser-supplied `delivery_job_id` cannot authorize any transition.
- [ ] Leaving at Bell Desk preserves lifecycle `ready_for_delivery` and does not emit `order_delivered` under the recommended rule.
- [ ] Direct and post-Bell-Desk final confirmation each require an explicit Owner action and emit one canonical `order_delivered` with server time.
- [ ] Same-request retry remains stable after the order is delivered; conflicting reuse and concurrent duplicate completion fail closed.
- [ ] Unpaid, failed, void, partially refunded, refunded, not-ready, cancelled, QA and incompatible-state orders are rejected without mutation.
- [ ] Delivery transitions never change production `ready`, invoice version, Payment Link, payment status, attribution snapshot or revenue.
- [ ] Unauthenticated requests return 401; non-Owner requests return 403; wrong-origin/method/submission identity fail closed.
- [ ] No PII, secret, technical delivery identity or external financial payload appears in URL, analytics, logs, errors or static assets.
- [ ] The order detail presents one concise next action and distinguishes `Em entrega`, `No Bell Desk` and `Entregue` without a route dashboard.
- [ ] Desktop and exact 390 px visual QA pass for eligible, Bell Desk, direct-delivered, blocked and error states.
- [ ] Focused state/idempotency/concurrency tests, SQL tests, lint, typecheck, full tests, build, privacy scan and regressions pass.
- [ ] `/order`, W1B, W1C-A/B1/B2, Stripe webhook, attribution, GA4, WhatsApp and Google Ads remain unchanged.
- [ ] Migration dry-run, rollback test, isolated release artifact, authenticated Owner smoke and zero-residue QA probe are evidenced before Production.
- [ ] Production mutation requires a separate exact GO naming migration, artifact, smoke, rollback deployment and the approved Bell Desk rule.

## Test plan

### Contract and state

- eligible paid+ready direct delivery;
- eligible paid+ready Bell Desk intermediate flow;
- no final event at Bell Desk before confirmation;
- one canonical final event after direct and Bell Desk confirmation;
- every mutation tied to the same server-owned `delivery_job_id`;
- invalid lifecycle/custody/production/financial combinations fail closed.

### Idempotency and concurrency

- exact delayed retry after final delivery returns the immutable prior result;
- conflicting semantic reuse of an idempotency identity fails;
- two simultaneous starts converge to one delivery job;
- two simultaneous confirmations produce one `order_delivered` only;
- stale expected version cannot overwrite newer custody evidence.

### Authorization and privacy

- Owner allowed; unauthenticated 401; non-Owner 403;
- wrong origin, method, CSRF/submission identity and malformed body rejected;
- QA and real-data boundaries preserved;
- URL, browser, analytics, logs, audit response and static bundle contain no PII/secrets/protected IDs.

### Regression and UI

- no Stripe adapter, webhook, Payment Link, WhatsApp, route or driver call occurs;
- payment/invoice/attribution snapshots remain byte-for-byte semantically unchanged;
- W1B queues/next action and prior W1C slices remain correct;
- 390 px and desktop show a single operational action without overflow or parallel dashboard.

## Rollback

Primary rollback is application-only to the last accepted W1C-B2 deployment. The additive delivery-job/event schema
remains inert and preserves any append-only evidence already created.

Exceptional SQL rollback may remove functions, policies and empty delivery infrastructure only when no real
`delivery_job_id`, transition or `order_delivered` evidence exists. Once any real delivery evidence exists, schema
removal must fail closed; correction uses append-only operational evidence rather than deletion or history rewrite.

Rollback never changes Stripe, payment status, invoice history, attribution, WhatsApp or an already delivered real
order. The exact rollback deployment and smoke checklist must be recorded at the release gate.

## Explicit non-goals

- drivers, driver assignment, route creation, stops or manual reordering;
- ETA, map, GPS, optimization, dispatch engine or courier integration;
- WhatsApp draft, copy, send, delivery receipt or automatic customer notification;
- Stripe call/configuration, Payment Link creation/deactivation, payment/refund or invoice mutation;
- automatic completion from payment, geolocation, provider callback, Bell Desk placement or elapsed time;
- proof-of-delivery photos, signatures, customer portal or public tracking page;
- Operator write permission before a separate role gate;
- changing `/order`, GA4, Google Ads, Meta, frozen attribution or customer reconciliation.

## File List

- `docs/stories/a7-027-orlando-os-w1c-b3-delivery-bell-desk.md`
