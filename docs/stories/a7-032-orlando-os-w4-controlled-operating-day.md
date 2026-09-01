# Story A7-032 — A7 Orlando OS W4 Controlled Operating Day and Stabilization

**Status:** Draft / Blocked — all required operating slices must be accepted in Production and the controlled-day plan must receive an exact Owner GO

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§1–3, 5, 7–19 and 21–22; Operational Attribution Contract §§2–16;
Full Delivery Goal Prompt §§4, 6–11; Full Delivery Status; Stories A7-019 through A7-031

**Depends on:** accepted Production releases for A7-019 W1B, A7-020 W1C-A, A7-021 W2-A, A7-022 W3-A,
A7-023 W1C-B1, A7-024 W1C-B2, A7-025 W2-B, A7-026 W3-B, A7-027 W1C-B3 and A7-031 W3-D;
A7-028 W2-C when the controlled sale starts from integrated inbound; A7-029 W2-D only when AI is enabled;
A7-030 W3-C only when a real identity conflict must be resolved

## Story

**As the** A7 Orlando Owner,

**I want** to operate one legitimate, controlled laundry order from sale through delivery using the accepted
Production system as the operational source of truth,

**so that** I can prove the lean system works for a real day, identify stability defects safely and decide whether it
is ready for normal operation without a parallel spreadsheet, hidden manual state or invented evidence.

## Business objective

W4 is the final integrated proof and stabilization wave. It is not another product-development wave. The day must
exercise the existing accepted capabilities in their real order:

```text
sale / reviewed WhatsApp contact
→ customer + lead + accepted order
→ pickup + custody
→ actual weight per item
→ production
→ reviewed versioned invoice
→ one current Payment Link
→ customer-initiated payment
→ signed reconciliation
→ ready + route/delivery or approved Bell Desk flow
→ reviewed WhatsApp updates
→ attributed revenue + updated customer facts
→ Hoje reflects the completed truth
```

The test is successful only when every state is produced by its existing authority, every external action is
explicitly approved, the customer receives a truthful experience and the Owner can understand `Hoje` in about twenty
seconds. Passing tests from individual slices are prerequisites, not substitutes for this integrated evidence.

## Scope lock

W4 owns only:

- a dated, controlled operating-day plan for one legitimate non-QA order and one consenting participant;
- preflight of the exact accepted Production application, migrations, integrations, rollback points and staff roles;
- execution and observation of the existing sale-to-delivery flow;
- requirement-by-requirement evidence collection with redacted identifiers;
- stabilization of defects discovered during the pilot through separately reviewed, minimal corrective stories and
  releases;
- a short daily operating runbook, incident/rollback runbook and final `GO / NO-GO` recommendation.

W4 does not add a feature, schema, integration, state, metric, role, automation, template, screen, route optimizer,
customer portal or alternate source of truth. If the day exposes missing behavior rather than a defect in an accepted
contract, the day stops and the gap becomes a separate bounded story. It is never implemented opportunistically under
this story.

## Controlled-day truth contract

### One legitimate order

The pilot uses one genuine A7 service order for a pre-identified consenting participant. The order is not marked QA,
because W4 must prove real customer history, attributed revenue and ordinary `Hoje` behavior. It must represent an
actual service that A7 can fulfill under the current governed catalog, price, minimum, service area and timing rules.

- No fake customer, fake prior history, fake weight, fake price, fake payment, fake delivery or backdated state.
- Prefer a consenting known customer with durable prior real history so W3-A repeat-order continuity can be observed.
  If no such participant is available, do not fabricate history; record W3-A as prerequisite evidence and prove the
  new customer's real before/after facts instead.
- The participant initiates the real payment after seeing the correct link. The system never auto-charges.
- The actual direct-delivery or Bell Desk branch is chosen before the day. Bell Desk may be used only when it is the
  truthful handoff and the A7-027 completion rule has been approved.
- The controlled order cannot be used to experiment with an unapproved service, discount, tip, promise or refund.

### No parallel operational truth

`/sistema` is the source of truth for customer/order identity, next action, lifecycle, custody, production, invoice,
payment and delivery. WhatsApp remains the customer channel; Stripe remains the financial authority. A redacted
evidence checklist may observe the system, but it cannot supply missing business state or become an operating ledger.

If the team must switch to an emergency manual process to protect the customer, W4 is immediately `FAIL / NO-GO`.
The customer service may continue under the incident runbook, but that continuation cannot be presented as proof that
the integrated system passed.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Preflight identifies the exact Production deployment, Git SHA, official Orlando Supabase project, migration ledger, accepted slice versions, rollback deployment and integration health before the day begins. | Full Delivery Prompt §§3–4, 9 |
| FR-02 | A reviewed sale creates or reuses the correct customer, creates one new lead and one new accepted order, freezes the available attribution snapshot and never duplicates on retry. | Blueprint §§3, 7; A7-022 |
| FR-03 | Pickup, custody and receipt at the laundry advance through authorized, append-only transitions and expose one truthful next action in `Hoje` and order detail. | Blueprint §§5, 8–11; A7-019 |
| FR-04 | Every per-pound item receives its actual weight, fixed-price items remain governed correctly, and `order_weighed` occurs once only when the order is complete. | Blueprint §8.2; A7-020 |
| FR-05 | Production advances through the accepted states without mixing custody, lifecycle or financial authority. | Blueprint §9; A7-019/A7-020 |
| FR-06 | The Owner reviews one server-derived, versioned invoice whose lines, minimum, adjustments and `tip_amount=0` match the actual governed order facts. | Blueprint §12; A7-023 |
| FR-07 | Exactly one current Payment Link belongs to the current payable invoice; obsolete links cannot remain active unnoticed and no browser-supplied amount becomes authority. | Blueprint §12.3; A7-024 |
| FR-08 | The participant initiates payment only after the pre-payment gate passes; the signed webhook/reconciler records it once, preserves order/invoice linkage and frozen acquisition, and emits/delivers purchase under the identity contract. | Attribution Contract §§5, 7–8, 12, 14; A7-024 |
| FR-09 | Ready, route and delivery use the accepted driver/stop sequence and delivery job; route actions invoke, but never duplicate or override, W1B pickup and W1C-B3 delivery authorities; direct delivery or Bell Desk finalization follows the approved rule and emits `order_delivered` once. | Blueprint §§9, 14; A7-027/A7-031 |
| FR-10 | A lean minimum set of customer-facing updates—order/pickup confirmation, one paid/ready update and final delivered confirmation—is reviewed by a human, sent once through the accepted official WhatsApp channel and reconciled to truthful provider status without changing order state. | Blueprint §§6.7, 18; A7-021/A7-025 |
| FR-11 | After payment and delivery, Clientes shows the correct order history, confirmed net service revenue, repeat status, first/last facts and initial source using the accepted formulas and null semantics. | Blueprint §§5.3, 13; A7-026 |
| FR-12 | The frozen attribution snapshot remains unchanged from order acceptance through payment/delivery, and confirmed eligible service revenue is reportable against the correct landing/source without Stripe becoming acquisition. | Attribution Contract §§8, 15 |
| FR-13 | `Hoje`, queues, counts, SLA, next action and completed-order visibility remain correct at each checkpoint and at close of day; QA/history/unavailable values do not become real counts or false zero. | Blueprint §§5, 10, 18; A7-019/A7-026 |
| FR-14 | If integrated inbound W2-C is enabled, the sale begins from one signed, deterministically linked inquiry without duplicate lead/order or inferred identity; otherwise the approved manual W1A intake remains the declared path. | A7-028; Blueprint §§3.2, 6.2–6.4 |
| FR-15 | If W2-D is enabled, AI assists only with the approved minimized context and remains visibly unconfirmed, fail-open and unable to send or mutate state; if disabled, the same day completes manually. | Blueprint §§6.4–6.6; A7-029 |
| FR-16 | If the selected participant exposes a genuine identity conflict, only accepted A7-030 reconciliation may resolve it; otherwise no reconciliation or merge is performed merely to exercise a feature. | Blueprint §13; A7-030 |
| FR-17 | The Owner completes the normal operating flow without a parallel spreadsheet/ledger and identifies the current workload/risks from `Hoje` in approximately twenty seconds. | Blueprint §§1, 5, 18–19 |
| FR-18 | The completed evidence supports an explicit recommendation for normal operation and a concise daily operating plus incident/rollback runbook. | Full Delivery Prompt §§7 W4, 10–11 |
| NFR-01 | Every write remains server-authorized, actor-bound, UTC-timestamped, idempotent and append-only; concurrency cannot duplicate business or external effects. | Blueprint NFR-02; Attribution Contract §§6–8 |
| NFR-02 | Initial W4 execution is Owner-controlled; unauthenticated/non-authorized/wrong-origin requests fail closed and no temporary access expansion is introduced. | Blueprint §16; accepted slice contracts |
| NFR-03 | The pilot uses the minimum real data necessary; evidence contains safe order references and masked provider identifiers, never customer PII, message content, room/address, secrets, raw click IDs or live Payment Link URLs. | Attribution Contract §9; Full Delivery Prompt §9 |
| NFR-04 | Failures are visible, never converted to success/zero, and stop the relevant external or operational step before a second message, link, charge, delivery event or state transition occurs. | Blueprint NFR-04 |
| NFR-05 | The exact integrated UI passes desktop and 390 px, keyboard/focus basics, loading/empty/error/success states and no content behind login or document overflow. | Blueprint NFR-01, §18.21 |
| NFR-06 | Homepage, `/order`, frozen attribution, GA4 server-side, Stripe/webhook, WhatsApp Business continuity, Google Ads and Meta configuration remain intact except for the explicitly authorized real business events. | Full Delivery Prompt §9 Compatibility |
| NFR-07 | Evidence records period, timezone `America/New_York`, source, freshness and availability and can be independently traced without exposing protected identifiers. | Blueprint §5.3; Attribution Contract §15 |
| CON-01 | No W4 code, feature, migration or Product behavior is bundled into the controlled day. Defects require separate minimal stories/releases and a fresh preflight. | Blueprint §17 W4 |
| CON-02 | Every real WhatsApp send, live Payment Link presentation/payment, Production mutation, secret/config change, refund or destructive action requires its own exact Owner authorization at the applicable gate. | Full Delivery Prompt §6 |
| CON-03 | No autonomous message, charge, refund, invoice correction, delivery completion, customer merge or AI commitment is permitted. | Blueprint §§6, 12–13, 22 |
| CON-04 | No GPS, route optimization, marketing CRM, campaign, loyalty, analytics dashboard, customer portal, ERP or other scope expansion is introduced. | Blueprint §§1, 14, 22 |
| CON-05 | Production history, invoices, payment evidence, attribution snapshots and customer relationships are never deleted or rewritten to make W4 pass. | Attribution Contract; Full Delivery Prompt §6 Never do |

## Entry gates — all blocking

### G0 — Accepted integrated Production baseline

Before scheduling the day, prove with current authoritative evidence:

1. every mandatory dependency named in this story is accepted in Production, not merely local, Draft or migration-only;
2. the exact domain deployment, repository SHA and official Orlando migration ledger are aligned;
3. no migration, candidate or credential from another project/environment is present;
4. all slice regressions, repository lint/typecheck/tests/build, privacy/secret scan and desktop/390 px QA pass on the
   exact integrated artifact;
5. baseline public/private health, W1B transactional probe and each later-slice synthetic/zero-residue release probe
   pass;
6. A7-031 Gates G0–G2 are approved: active driver list, role/reorder authority and live Bell Desk/route-stop semantics;
7. rollback application ID, kill switches and non-destructive schema behavior are documented and immediately usable.

### G1 — Dated operating plan and human responsibility

The Owner approves a single plan naming:

- operating date/window and timezone;
- consenting participant and safe evidence alias;
- Owner/operator responsible for each human confirmation;
- actual service, tier, catalog/minimum basis and truthful pickup/needed-by commitment;
- known-customer versus new-customer path;
- inbound/manual intake choice and AI enabled/disabled state;
- direct-delivery versus approved Bell Desk path;
- approved active driver, route/stop sequence and route-action authority;
- the exact lean WhatsApp plan, containing order/pickup confirmation, one paid/ready update and final delivered
  confirmation without redundant messages;
- incident lead, customer-contact fallback and explicit abort authority;
- exact deployment rollback and integration kill switches.

No PII, credentials or live link is copied into the plan/evidence artifact.

### G2 — Data minimization and consent

- participant consents to the controlled operational communication and legitimate service/payment flow;
- only operationally necessary PII enters protected stores;
- evidence uses a safe order number/alias and masked technical references;
- screenshots are cropped/redacted before retention;
- logs, URLs, analytics, `dataLayer`, Stripe metadata and evidence are scanned for forbidden fields;
- the order is excluded from automated testing and never reused as a synthetic fixture.

### G3 — Pre-payment and external-action gates

Before presenting the live Payment Link, prove:

- correct customer/lead/order and immutable attribution snapshot;
- actual items/weights and production readiness for invoicing;
- current reviewed invoice version, exact eligible service amount/currency, minimum/adjustment and `tip=0`;
- one current active link and all obsolete unpaid links inactive;
- no duplicate order, invoice, link, outbound message or payment intent;
- PII/secrets scan `PASS`;
- rollback/incident response `READY`;
- explicit Owner GO to present this exact link to this participant.

The participant, not the system or executor, completes payment. The payment itself is never automated.

Before each real WhatsApp message, prove the selected approved snapshot, recipient/order relation, current eligible
state, channel health, deduplication status and human preview; then record a separate exact send confirmation.

## Controlled execution sequence and acceptance criteria

Every acceptance criterion is requirement-bound. `PASS` requires authoritative evidence; “not observed,” memory,
operator recollection or absence of an obvious error is not evidence.

| AC | Requirement(s) | Required proof |
|---|---|---|
| AC-01 | FR-01, NFR-06 | Signed preflight identifies exact Production deployment/SHA, official Orlando ledger, accepted dependencies, healthy public/private surfaces and rollback target. |
| AC-02 | FR-02, FR-14, NFR-01 | One reviewed sale resolves the correct participant and creates/reuses one customer, one new lead and one accepted order; exact retry returns the same result and creates no duplicate. |
| AC-03 | FR-02, FR-12 | The acceptance-time attribution snapshot is present with truthful confidence/availability, remains immutable through the day and never changes to Stripe/direct by later navigation. |
| AC-04 | FR-03, FR-13 | Schedule/pickup/receipt transitions update lifecycle/custody/production atomically, append one event per effect and produce the correct `Hoje` queue/next action. |
| AC-05 | FR-04, NFR-01 | Actual per-item weight and fixed-price behavior are correct; partial/final states and delayed retry produce one `order_weighed` only. |
| AC-06 | FR-05, FR-13 | Processing starts and reaches `ready` only through accepted production transitions; independent state axes and `Hoje` remain coherent. |
| AC-07 | FR-06, CON-03 | Owner reviews one server-derived invoice; line snapshots, minimum/adjustment, cents, version and `tip=0` match actual governed facts; unresolved/manual-review facts block issue. |
| AC-08 | FR-07, NFR-04 | One current Payment Link belongs to that invoice; retry is stable, no obsolete link remains active, and link failure cannot create a second current link or false success. |
| AC-09 | FR-08, FR-12 | After explicit GO and participant payment, one signed reconciliation binds the correct order/invoice/payment, preserves attribution, updates paid state once and sends purchase through the approved identity/outbox path once. |
| AC-10 | FR-09, NFR-01 | Approved driver and manual stop sequence are used; route departure infers no order effect; pickup/delivery stop advances only after W1B/W1C-B3 succeeds; the chosen direct/Bell Desk path keeps custody/lifecycle truthful and one explicit final confirmation emits one `order_delivered`. |
| AC-11 | FR-10, CON-02 | The three planned milestone classes are each human-reviewed, sent once through the accepted official channel, correlated to the order and reconciled to truthful status; retry/concurrency cannot duplicate a message and failure changes no order state. |
| AC-12 | FR-11, FR-16 | Clientes shows the correct before/after real/paid/refunded counts, confirmed net revenue, ticket/null semantics, repeat truth and first/last/source facts; no merge/edit occurs unless an actual conflict and accepted A7-030 flow require it. |
| AC-13 | FR-12, NFR-07 | Revenue and acquisition report reconcile the same eligible service amount/order/customer with source/confidence/freshness; Stripe does not become acquisition and tip/refund rules remain correct. |
| AC-14 | FR-13, FR-17 | At each checkpoint and close, `Hoje`/queues/next action/counts/SLA agree with durable truth; Owner locates the required action/risk in about twenty seconds without a parallel operational ledger. |
| AC-15 | FR-15, CON-03 | If AI is enabled, its proposal is minimized, sourced, visibly unconfirmed and side-effect-free; provider failure preserves the same manual path. If disabled, no provider call occurs and the day still completes. |
| AC-16 | NFR-02, NFR-03 | Owner authorization passes; 401/403/origin/method/submission gates fail closed; PII/secrets/raw links and protected IDs are absent from prohibited placements and evidence. |
| AC-17 | NFR-04, NFR-06 | Injected/safely simulated retry and one non-customer-impacting dependency failure show truthful failure, no duplicate external/business effect and working manual/kill-switch fallback without altering live customer truth. |
| AC-18 | NFR-05 | Exact integrated `/sistema` flow passes desktop and 390 px for active, loading, empty, blocked, error and completed states, with keyboard basics and no overflow/content behind login. |
| AC-19 | CON-01, CON-04, CON-05 | Release-scope and mutation audit proves no new feature/schema/scope, destructive history rewrite, Ads/config drift or parallel authority was introduced during W4. |
| AC-20 | FR-18 | Evidence pack, daily runbook, incident/rollback runbook, defect disposition and final `GO / NO-GO` are complete, redacted and independently reviewable. |

## Abort criteria

Any item below stops the controlled day at the safest pre-effect boundary and sets the W4 verdict to `FAIL / NO-GO`
until a separate corrective slice is accepted and the full preflight is repeated:

1. wrong, ambiguous or duplicate customer/lead/order relation;
2. missing/altered attribution snapshot where deterministic capture was expected, or Stripe/direct replacing acquisition;
3. unauthorized access, wrong project/environment, unknown deployment bytes or migration-ledger drift;
4. PII, secret, raw click identifier, full message content, room/address or live Payment Link leaked to a prohibited
   surface or evidence artifact;
5. invalid state combination, missing next action, incorrect `Hoje` count/SLA or use of a parallel ledger to proceed;
6. incorrect/missing/duplicate weight, invoice, minimum, adjustment, tip, link, payment, revenue or delivery event;
7. invoice amount/version or current-link ownership cannot be proven before presentation;
8. any automatic charge, message, refund, delivery completion, customer merge or AI commitment;
9. duplicate WhatsApp send, lost Business-app continuity, wrong recipient/order, unapproved message text or false
   sent/delivered/read state;
10. payment webhook/reconciler lacks signature/idempotency/order-invoice binding or produces duplicate purchase;
11. delivery/Bell Desk state advances without the approved human confirmation or route/delivery identity;
12. customer history/value or attributed revenue differs from authoritative order/payment/refund truth;
13. an external dependency is unavailable and the UI reports empty/success/zero instead of unavailable/failure;
14. rollback target, kill switch, evidence preservation or customer-safe fallback is unavailable;
15. any need to invent or hot-build a missing feature inside W4;
16. any real external action lacks its exact contemporaneous Owner authorization.

After an abort, do not retry a message, create another link, ask the participant to pay again, refund, merge data or
rewrite state merely to continue the checklist. First reconcile the durable and provider evidence.

## Incident and rollback runbook contract

The final runbook must define this minimum response, using exact accepted deployment/config references at execution
time:

1. **Stop:** disable the affected action and prevent new sends/links/transitions while preserving customer service.
2. **Identify:** record safe order number, UTC time, affected step, actor and masked provider/event identities; no PII
   or secret in incident evidence.
3. **Preserve:** retain append-only operational, financial, message and attribution evidence; never delete or rewrite it.
4. **Contain:** use the accepted channel/AI kill switch or application rollback only where it cannot repeat or erase a
   real external/business effect.
5. **Reconcile before retry:** query authoritative system/provider state for the same idempotency/payment/message/
   delivery identity. Never infer failure from a timeout alone.
6. **Restore application:** when an application regression is confirmed, restore the exact last accepted deployment
   and run public, auth, order, `/order`, Stripe/webhook, WhatsApp and attribution smokes.
7. **Continue customer care safely:** use the documented manual Business-app/operational fallback when needed, tell the
   customer only verified facts and classify W4 as failed; the manual path does not become passing evidence.
8. **Correct through authority:** financial correction uses the governed refund path and separate GO; customer
   correction uses accepted append-only reconciliation; delivery correction appends evidence. Deployment rollback is
   never data rollback.
9. **Disposition:** create a bounded defect/incident story, identify root cause and affected records, pass its own
   gates/release, then schedule a new W4 day from the beginning.

The runbook must distinguish:

- application rollback;
- channel/AI kill switch;
- database schema left inert;
- external-effect reconciliation;
- customer-facing operational fallback;
- separately authorized financial or identity correction.

## Evidence pack

The final W4 audit must include, without forbidden data:

### Baseline

- operating date/window/timezone and approved plan version;
- Production domain, deployment ID, Git SHA, official Supabase project reference and migration ledger;
- accepted story/release matrix A7-019 through A7-031, including conditional paths;
- exact application rollback, channel/AI kill-switch state and integration health;
- lint, typecheck, focused/full tests, build, secret/privacy scan and exact-artifact scope verification;
- 390 px and desktop baseline.

### Order journey

- safe human order number/evidence alias and new/known-customer path;
- one customer, one lead, one order and idempotency/duplicate proof;
- attribution confidence/availability plus an integrity digest or field-by-field invariant proof, not raw click IDs;
- timestamped lifecycle/custody/production/financial/delivery checkpoint matrix;
- item units, safe quantities/actual weights and server-derived subtotals necessary to audit the invoice;
- invoice version, eligible service amount/currency, minimum/adjustment and `tip=0`;
- masked Payment Link/provider identities, active/inactive/completed status and retry/concurrency proof; never the live URL;
- signed payment/reconciliation/purchase outcome, duplicate-count proof and safe revenue tie-out;
- approved driver/authority, manual route/stop order, departure, authoritative W1B/W1C-B3 result and final
  confirmation evidence; route/stop/delivery identities remain masked;
- reviewed WhatsApp template keys/languages, approval/send/status outcome and masked provider identity; message body only
  if already approved for the private redacted audit, otherwise use a content digest;
- customer facts before/after and initial-source availability;
- `Hoje` snapshots/counts/next-action/SLA before, during and after the order.

### Safety and closeout

- authorization 401/403/origin/submission evidence;
- prohibited-placement scan for PII/secrets/raw links/click IDs;
- idempotency/concurrency and one safe failure-path result;
- public `/`, `/order`, private OS, Stripe/webhook, WhatsApp Business, GA4/Ads and frozen-attribution regressions;
- Owner twenty-second usability observation and confirmation that no parallel operational truth was used;
- test/temporary data inventory with `NONE` or explicit governed retained real evidence — never delete the real order;
- incidents/aborts, rollback actions and unresolved defects;
- final requirement matrix and `GO / NO-GO` for normal operation.

## Final report format

```text
W4 CONTROLLED DAY: PASS / FAIL
PRODUCTION BASELINE: PASS / FAIL
SALE → CUSTOMER/LEAD/ORDER: PASS / FAIL
ATTRIBUTION SNAPSHOT: PASS / FAIL
PICKUP/CUSTODY: PASS / FAIL
ITEM WEIGHT: PASS / FAIL
PRODUCTION: PASS / FAIL
REVIEWED INVOICE: PASS / FAIL
CURRENT PAYMENT LINK: PASS / FAIL
SIGNED PAYMENT RECONCILIATION: PASS / FAIL
DELIVERY/BELL DESK: PASS / FAIL
REVIEWED WHATSAPP UPDATES: PASS / FAIL
CUSTOMER FACTS: PASS / FAIL
ATTRIBUTED REVENUE: PASS / FAIL
HOJE/20-SECOND OPERATION: PASS / FAIL
AUTHORIZATION: PASS / FAIL
PII/SECRETS: PASS / FAIL
IDEMPOTENCY/CONCURRENCY: PASS / FAIL
390 PX/DESKTOP: PASS / FAIL
PUBLIC/INTEGRATION REGRESSIONS: PASS / FAIL
PARALLEL OPERATIONAL TRUTH: NONE / FOUND
TEST RESIDUE: NONE / FOUND / NOT APPLICABLE—LEGITIMATE ORDER RETAINED
INCIDENTS: NONE / <safe references>
ROLLBACK: NOT REQUIRED / EXECUTED / READY
NORMAL OPERATION: GO / NO-GO
```

Any non-PASS item must include objective redacted evidence and disposition. A legitimate order and its append-only
history are not “test residue” and must remain retained under normal policy.

## No-go rules and explicit non-goals

W4 is `NO-GO` before execution while any mandatory slice, decision, exact artifact, rollback or consent is missing.
It remains `NO-GO` after execution if any requirement lacks authoritative proof.

Explicitly out of scope:

- coding or deploying a new product feature under W4;
- applying a new migration merely to support the pilot;
- two or more simultaneous customer orders as the first controlled proof;
- synthetic revenue, backfill or manual alteration of attribution/customer/payment facts;
- automated payment, refund, WhatsApp send, follow-up, upsell, merge or delivery;
- marketing campaign, CRM automation, loyalty, coupon, customer scoring or bulk export;
- GPS, route optimization, maps, dispatch engine or advanced analytics;
- customer portal, app, tracking account or public operational data;
- model/provider experiment, media AI, autonomous agent or new integration;
- changing Stripe, Meta, GA4, Ads, `/order`, catalog, prices, minimum or business policy during the day;
- treating manual fallback, a spreadsheet, memory or WhatsApp chat as replacement operational evidence;
- deleting real order/history or external evidence after the pilot;
- declaring normal-operation readiness from local tests, individual slice smokes or one successful payment alone.

## Stabilization and rollback

1. W4 itself has no schema rollback because it must introduce no schema.
2. Primary rollback is the exact last accepted integrated application deployment recorded at G0; accepted additive
   schemas remain inert and append-only evidence remains intact.
3. A slice-specific kill switch may disable WhatsApp send or AI without disabling manual operation.
4. A rollback must not reverse a real payment, message, delivery or customer relationship. External effects are
   reconciled through their own authorities and correction policies.
5. Cosmetic defects that do not threaten truth, privacy, authorization or customer completion are recorded and
   triaged; they do not justify a risky mid-day deployment.
6. Any corrective release requires a separate defect story, focused regression, exact artifact, rollback and Owner
   GO. After correction, W4 restarts from the full preflight; partial prior evidence cannot be combined into a pass.
7. Normal-operation `GO` requires all ACs, the evidence pack and the runbooks to pass after the final accepted
   integrated artifact.

## Definition of Done

- [ ] G0–G3 and every dependency are objectively satisfied.
- [ ] One legitimate controlled order completes AC-01 through AC-20 without abort.
- [ ] No unapproved feature, external action, parallel truth, privacy leak, duplicate effect or history rewrite occurs.
- [ ] Every explicit requirement has authoritative, redacted evidence in the final matrix.
- [ ] Daily-operation and incident/rollback runbooks are usable by the Owner/Operator.
- [ ] All defects are resolved through separate accepted slices or explicitly block readiness.
- [ ] The final report recommends `NORMAL OPERATION: GO` only if no required evidence remains partial, missing or weak.

## Tasks / subtasks

- [ ] Validate and freeze the W4 plan (AC-01, AC-16, AC-19)
  - [ ] Reconcile A7-019 through A7-031 and their accepted Production evidence.
  - [ ] Record exact runtime, ledger, rollback, kill switches and no-concurrent-release window.
  - [ ] Obtain the participant/data-minimization and Owner action authorizations.
- [ ] Rehearse without real external effects (AC-01, AC-16–19)
  - [ ] Run all slice probes, regression gates, privacy scans and UI QA on the exact integrated artifact.
  - [ ] Walk the daily and incident runbooks with no message, link presentation, payment or real mutation.
  - [ ] Stop if any precondition lacks authoritative evidence.
- [ ] Execute the approved controlled day (AC-02–15)
  - [ ] Follow the sequence exactly and record each pre-effect gate.
  - [ ] Obtain contemporaneous confirmation for every real message and live financial step.
  - [ ] Abort at the first failed or uncertain gate.
- [ ] Close and stabilize (AC-16–20)
  - [ ] Reconcile order, customer, payment, attribution, WhatsApp, delivery and `Hoje` truth.
  - [ ] Inventory protected evidence and confirm no prohibited/test residue.
  - [ ] Route every defect to a separate bounded story; rerun full W4 after any corrective release.
  - [ ] Produce the final report and normal-operation recommendation.

## File List

- `docs/stories/a7-032-orlando-os-w4-controlled-operating-day.md`

No code, migration, test fixture, deployment or Production mutation is authorized by this Draft.

## QA results

Not started. The Draft is reconciled with A7-031's route-orchestration boundary. Formal PO validation, all dependency
gates and an exact Owner-controlled-day GO are required before execution.

## Change log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-31 | 0.1 | Initial Draft/Blocked W4 controlled-day and stabilization contract. | Pax (PO/QA) |
