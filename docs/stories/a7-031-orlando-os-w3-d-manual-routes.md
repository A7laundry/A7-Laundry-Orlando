# Story A7-031 — A7 Orlando OS W3-D Manual Routes

**Status:** Completed — W3-D.0–D.6 released through the Owner-approved controlled Production pilot

**Created:** 2026-08-31

**Sources:** Orlando OS blueprint §§14, 17, 18 and 21.2; Full Delivery Goal Prompt §7 Onda 6;
Full Delivery Status findings 7 and 11; Stories A7-019 and A7-027

**Depends on:** A7-019 W1B accepted in Production; canonical W1C-B3 delivery/Bell Desk authority implemented and
proven in A7-038; W3-D release gates in this story

## Story

**As the** A7 Orlando Owner,

**I want** to assign a driver, arrange pickup and delivery stops manually and record the real result of each stop,

**so that** the team can run a simple route from one mobile screen while custody and delivery truth remain governed
by the existing order workflow.

## Business context

The A7 operation needs a practical sequence such as:

```text
Driver 1

1. Nadia — completed
2. Adam — next
3. Jonathan — later
```

W3-D is an operational list, not a dispatch platform. It answers only:

```text
Who is driving?
Which stops are assigned?
What is their manual order?
Has the route departed?
Which pickup, delivery or Bell Desk handoff was actually recorded?
What optional ETA did an authorized human enter?
```

The route never becomes a second source of truth for an order. Pickup actions reuse the accepted W1B transition
authority. Delivery and Bell Desk actions reuse the accepted W1C-B3 authority and its live completion rule.

## Scope lock

Only W3-D is in scope:

- a bounded list of approved active drivers;
- one simple route assigned to one driver;
- pickup and delivery stops linked to eligible existing orders;
- manual stop ordering and explicit reordering;
- explicit route departure and real pickup, delivery or Bell Desk actions;
- optional manually entered ETA;
- atomic coordination with the existing custody and delivery transitions;
- append-only actor/time/before/after/idempotency evidence;
- one concise, Owner-private, mobile-first `Rotas` area inside `/sistema`.

W3-D does not estimate or optimize a route. It does not track a vehicle or driver location, expose a public tracking
page, send a message, change a financial fact or create a parallel lifecycle/delivery implementation.

## Blocking product decisions

The 2026-09-02 W3-D Goal and Packet W3-D.0 discovery resolve these decisions as follows.

### G0 — Initial drivers

The existing canonical active-driver directory is the selectable source. No hard-coded or separately seeded route
driver list is required. A driver phone, home address, license document, payroll record, live location or vehicle
profile is not part of this story.

Owner retains the existing authority to activate/deactivate drivers. Deactivation preserves route history and only
prevents new assignment.

### G1 — Route and reorder authority

The Owner must approve which private role may:

1. create a route and select its driver;
2. add or remove a still-pending stop;
3. reorder pending stops;
4. mark route departure and stop outcomes.

**Approved authority:** Owner and Manager/Gestora have full operational route access. Operator has no W3-D access.
The browser role alone never authorizes a write; every mutation remains server-authorized. Driver self-service is not
in scope.

### G2 — Bell Desk rule live in W1C-B3

The canonical Bell Desk completion rule is implemented and was proven through the A7-038 Production evidence.
W3-D mirrors that rule; it does not define or override it.

Under the current recommended A7-027 rule, leaving an order at the Bell Desk records an intermediate custody
handoff, keeps lifecycle `ready_for_delivery` and does not emit `order_delivered`. A separate explicit final
confirmation completes the order. The physical route stop is considered completed with result `handoff_recorded`
after the canonical Bell Desk handoff succeeds, while the order remains pending its explicit final confirmation.

## Authority and state boundary

| Route action | Route responsibility | Existing order authority |
|---|---|---|
| Assign driver | Records approved driver assignment | No order-state change |
| Add/reorder stop | Records manual operational sequence | No order-state change |
| Mark route departure | Records actor and departure time | No inferred pickup/delivery |
| Confirm pickup at stop | Records stop result after success | W1B validates and applies pickup/custody transition |
| Receive at laundry | Outside route sequencing unless explicitly presented as the next existing order action | W1B remains authoritative |
| Start delivery | Records delivery departure only after success | W1C-B3 validates paid/ready eligibility and custody |
| Leave at Bell Desk | Records the approved handoff result | W1C-B3 applies the live Bell Desk rule |
| Confirm delivery | Records completion only after success | W1C-B3 emits the one canonical `order_delivered` |

The route service orchestrates accepted services; it never writes lifecycle, custody, production or financial columns
directly. A failed order transition leaves the route stop unchanged and visibly blocked.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Resolve selectable drivers only from the Owner-approved active-driver list; inactive drivers remain visible in history but cannot receive a new route. | Blueprint §§14 and 21.2 |
| FR-02 | Create one simple route assigned to one approved driver and add pickup/delivery stops only for eligible real non-QA orders. | Blueprint §14; W1B QA boundary |
| FR-03 | Keep one order leg in at most one active route at a time; duplicate or conflicting assignment fails closed without moving the existing stop. | Operational truth and idempotency invariants |
| FR-04 | Store and return a deterministic manual stop sequence. Reorder accepts the complete current pending-stop set against its current version and rejects missing, duplicate, completed, foreign or stale stops. | Blueprint §§14 and 15.3 |
| FR-05 | Every create, assign, add, remove, reorder, depart and stop-result action records opaque actor, UTC time, prior/current value, request identity and safe reason/evidence. | Blueprint §16; W1B audit contract |
| FR-06 | Route departure is an explicit human action and never infers pickup, delivery, ETA, customer receipt or custody change. | Blueprint §14; A7-027 explicit-confirmation boundary |
| FR-07 | Confirming a pickup invokes the existing W1B transition authority exactly once; the route stop advances only after that authoritative transition succeeds. | A7-019 transition contract |
| FR-08 | Starting or completing a delivery and recording Bell Desk invoke the existing W1C-B3 authority and preserve its paid/ready eligibility, `delivery_job_id`, explicit-confirmation and event rules. | A7-027 state contract |
| FR-09 | Bell Desk presentation and route-stop outcome mirror the approved live W1C-B3 rule and never infer `delivered` from placement, elapsed time, route completion or ETA. | Blueprint §21.2; A7-027 G2 |
| FR-10 | ETA is optional, entered or corrected only by an authorized human and audited with timezone. Missing ETA remains unavailable; ETA never changes `promised_by`, SLA, lifecycle, custody or customer commitment. | Blueprint §14; W1B SLA boundary |
| FR-11 | Exact retry returns the prior result; conflicting idempotency reuse, stale version and concurrent assignment/reorder/outcome attempts fail closed without duplicate route, stop, custody or delivery evidence. | Existing system idempotency/concurrency invariants |
| FR-12 | Route detail shows driver, ordered stops, safe order reference, stop kind/state, optional ETA and one valid next action without exposing technical IDs. | Blueprint §§14, 18 and Interface minimum |
| FR-13 | The private `Rotas` area supports route creation, driver selection, pending-stop ordering and real stop results on exact 390 px and desktop without a map. | Blueprint §§14, 17 and 18 |
| NFR-01 | CLI/service contracts and deterministic dry-run precede API/UI; eligibility, sequencing and custody rules exist only server-side. | AIOS Constitution I; Blueprint §15.3 |
| NFR-02 | All reads/writes are private; mutations are same-origin, submission-bound and authorized according to approved G1. Unauthenticated and unauthorized requests fail closed. | Blueprint §16 |
| NFR-03 | Customer phone, exact address/room, driver private data, internal UUIDs, route/stop/delivery identities and secrets do not enter URLs, analytics, public assets or diagnostic logs. | Blueprint §16; A7-027 privacy boundary |
| NFR-04 | Schema changes are additive, service-role controlled, concurrency-safe and inert after application rollback. Historical unknown route/driver facts remain unknown. | Blueprint §§17 and 21.1 |
| NFR-05 | Failure is visible and never produces a false completed stop, false custody transition, false delivery, false ETA or empty-success route. | Blueprint final acceptance criteria 19–20 |
| CON-01 | No GPS, live location, map, distance calculation, route optimization, automatic sequencing, geocoding, dispatch engine or vehicle telemetry. | Blueprint §§14 and 22 |
| CON-02 | No public tracking, customer portal, driver app, driver login or proof-of-delivery photo/signature. | MVP boundary; A7-027 non-goals |
| CON-03 | No WhatsApp draft, send, automated update, WhatsApp Web automation or provider receipt. | W2 boundary; Full Delivery Goal W3-D |
| CON-04 | No invoice, Payment Link, Stripe, payment, refund, revenue, tip or other financial mutation. | A7-027 financial boundary |
| CON-05 | No Production mutation before G0–G2 pass and a separate exact GO names the migration, immutable artifact, smoke and rollback deployment. | Release governance |

## Acceptance criteria

- [x] The approved initial driver list is the only source of selectable drivers; inactive/unknown drivers cannot
      receive a route and past route evidence is preserved.
- [x] The approved role matrix is enforced server-side for route creation, assignment, stop changes, reordering,
      departure and outcomes; unauthenticated returns 401 and unauthorized returns 403.
- [x] One eligible real non-QA pickup or delivery leg can be assigned once; QA, cancelled, already completed,
      incompatible and already-routed legs fail closed without mutation.
- [x] A route shows one approved driver and a deterministic list of pending/completed stops using safe human order
      references rather than UUIDs.
- [x] Manual reorder persists the exact submitted pending-stop order and one append-only before/after record.
- [x] Missing, duplicate, completed, foreign or stale stop references and simultaneous conflicting reorders are
      rejected; exact retry returns the original result without another audit row.
- [x] Marking route departure records the server time and actor but does not change any order state or infer a stop
      outcome.
- [x] A pickup stop advances only after the accepted W1B pickup/custody transition succeeds exactly once.
- [x] A delivery stop cannot start unless W1C-B3 accepts the order as paid, production-ready, lifecycle-ready and in
      the correct custody state.
- [x] Direct delivery and Bell Desk outcomes use the same server-owned W1C-B3 `delivery_job_id`; route retries or
      concurrency produce no second delivery job or `order_delivered` event.
- [x] Bell Desk follows the approved live rule. When it is intermediate, the route does not mark the order delivered
      or emit `order_delivered` before authorized final confirmation.
- [x] A missing ETA is displayed as unavailable, not zero or “on time”; a human ETA and correction are audited and do
      not change W1B `promised_by` or SLA.
- [x] A failed route or order transition leaves both projections mutually truthful: no completed route stop without
      its required authoritative order event and no route-owned direct custody write.
- [x] Route completion cannot infer pickup, delivery, Bell Desk confirmation, customer receipt or financial state.
- [x] Customer/driver PII, exact address/room, technical IDs, idempotency values and secrets remain absent from URL,
      analytics, logs, errors, static bundles and public responses.
- [x] `Rotas` is keyboard-usable and passes desktop and exact 390 px QA for empty, planned, departed, partially
      completed, Bell Desk, completed, blocked and unavailable states without horizontal document overflow.
- [x] Focused service/API/UI tests, isolated PostgreSQL fixtures, delayed retry, concurrency, authorization, privacy
      scan, lint, typecheck, full tests, build and existing Orlando OS regressions pass.
- [x] `/order`, W1B, W1C-A/B1/B2/B3, Stripe/webhook, attribution, GA4, Google Ads, WhatsApp and customer facts remain
      unchanged except for the already-authorized W1B/W1C-B3 operational transitions invoked by a stop action.
- [x] Exact-artifact Owner smoke uses clearly marked synthetic route data, invokes no financial/message action and
      proves zero removable test residue without deleting append-only real operational history.

## Minimum Owner experience

```text
ROUTES

Driver: Driver 1                       Route: Today

1. Nadia        Delivered
2. Adam         Next                  ETA 10:30 AM
3. Jonathan     Later                 ETA unavailable

[Reorder pending stops]
[Mark route departed]
```

The labels are illustrative and must be derived from approved driver/order facts. This example does not authorize
hard-coded people, a map, automatic ETA or customer-facing tracking.

## Tasks / Subtasks

- [x] Pass product gates before development (AC: all)
  - [x] Reuse the canonical active-driver directory and existing Owner activation authority.
  - [x] Record Owner/Manager full route authority and Operator denial.
  - [x] Prove the canonical Bell Desk rule from A7-038 and record route-stop semantics for Bell Desk.
- [x] Define route contracts service-first (AC: 1–15)
  - [x] Define driver, route, stop, ordering, optional ETA and append-only action contracts.
  - [x] Define deterministic eligibility and the single-active-route rule for each order leg.
  - [x] Require W1B/W1C-B3 canonical action names; no route-owned custody/delivery field exists.
- [x] Implement protected application services and API facade (AC: 1–15)
  - [x] Add dry-run/list/create/assign/reorder/depart/outcome services with explicit authorization.
  - [x] Add stale-version, exact-retry, conflicting-reuse and concurrency controls.
  - [x] Keep browser payloads opaque and minimal.
- [x] Add the minimum `Rotas` UI (AC: 4, 12, 16)
  - [x] Show one driver, manual sequence, stop state, optional ETA and one valid next action.
  - [x] Support keyboard, 390 px and desktop without maps, graphs or secondary dashboards.
- [x] Prove release safety (AC: all)
  - [x] Add focused memory/service/API tests and isolated PostgreSQL fixtures for pickup, direct delivery and the
        approved Bell Desk flow.
  - [x] Exercise duplicate assignment, delayed retry, conflicting reorder and stale-version controls locally.
        A two-session PostgreSQL probe proved one Owner/Manager pickup winner, one updated-state rejection and exactly
        one canonical order event plus one route event; retain browser/device outcome proof for staging E2E.
  - [x] Prove no route code writes custody/delivery directly and no financial/WhatsApp adapter is invoked.
  - [x] Run lint, typecheck, focused/full tests, build, privacy/secret scan, migration/rollback rehearsal and local
        desktop/exact-390-px visual QA.
  - [x] Replace the Staging-only rehearsal with the Owner-approved controlled Production plan; prove its
        Owner-only transactional smoke against a no-data replay of the exact Production schema with zero residue.
  - [x] Prepare an isolated immutable artifact, authenticated Owner smoke and separately authorized Production GO.

## Dependencies and release gates

### G0 — Canonical active-driver directory — PASS

- Owner supplies the initial approved drivers and safe display labels;
- Owner identifies who may activate/deactivate drivers;
- no private driver profile, tracking or workforce-management scope is introduced.

### G1 — Role authority — PASS

- Owner approves who may create/assign routes, modify stops, reorder pending stops and record outcomes;
- initial release remains Owner-private unless Operator permission is explicitly approved and tested;
- no driver self-service or browser-only authorization.

### G2 — Bell Desk and delivery authority — PASS

- A7-027 is accepted and proven live on the official Orlando Production system;
- the Owner-approved Bell Desk rule defines both order-finalization and route-stop semantics;
- W3-D can invoke, but cannot duplicate or override, the W1C-B3 delivery authority.

### G3 — Sequencing and runtime boundary

- W1B custody transitions remain accepted and healthy;
- the current full-delivery sequence places W3-B before W3-D. W3-B is not a route-data dependency, but W3-D must not
  be bundled, renumber migrations or jump the authoritative release order without a separate architecture/Owner
  decision;
- official Supabase Orlando project and exact current Production/rollback deployments are reverified read-only before
  any candidate work.

### G4 — Quality and release

- additive migration and exceptional rollback pass in an isolated database;
- focused/full/idempotency/concurrency/privacy/regression gates pass;
- exact artifact contains only the accepted base plus W3-D;
- authenticated Owner smoke covers assignment, reorder, departure, pickup, direct delivery and the approved Bell Desk
  behavior without real payment, message or customer action;
- Production requires a separate exact GO and immediate application rollback on a failed or unproven gate.
- The Owner decision of 2026-09-02 replaces the Staging E2E with the controlled Production pilot in
  `docs/runbooks/A7-ORLANDO-W3D-ROUTES-PRODUCTION-PILOT-2026-09-02.md`; it does not itself authorize mutation.

## CodeRabbit integration and specialist review

Before developer handoff, request targeted review from the available specialists appropriate to the implementation:

- `@architect`: verify that routes orchestrate W1B/W1C-B3 and do not become a second state authority;
- `@data-engineer`: review additive schema, ordering/concurrency constraints, RLS/grants and rollback safety;
- `@qa`: validate state, delayed-retry, concurrency, authorization, zero-residue and regression coverage;
- `@ux-design-expert`: validate the minimum 390 px/desktop route workflow without dashboard expansion;
- `@devops`: own Production release, immutable artifact, smoke and rollback evidence.

CodeRabbit must receive the story scope lock and flag as blocking any direct custody/delivery write, financial or
WhatsApp adapter call, future-wave feature, exposed protected identifier, missing idempotency/concurrency test or
destructive rollback. No CRITICAL finding may remain open before release.

## Rollback

1. Primary rollback restores the exact last accepted pre-W3-D application deployment. Additive driver/route/stop
   schema remains inert and inaccessible from that application.
2. Application rollback does not reverse a real W1B pickup or W1C-B3 delivery event already accepted. Those events
   remain append-only operational truth; any route projection discrepancy is corrected by a new governed action.
3. Exceptional SQL rollback may remove W3-D functions, policies and empty route infrastructure only after proving
   that no real driver assignment, route, stop, ETA or route-audit evidence exists.
4. Once real route evidence exists, schema/data deletion is forbidden. Disable new route writes, preserve history and
   correct forward through append-only evidence.
5. Rollback never changes customer, invoice, Payment Link, payment/refund, Stripe, attribution, GA4, Google Ads,
   WhatsApp or an already completed custody/delivery event.
6. The exact rollback deployment, health checks and post-rollback read consistency must be recorded at the W3-D
   release gate.

## Explicit non-goals

- map, geocoding, GPS, live driver location or geofence;
- route optimization, automatic ordering, distance/time engine or dispatch engine;
- vehicle/fleet management, driver shifts, payroll, license or performance scoring;
- driver application, driver login, public tracking link or customer portal;
- proof-of-delivery photo, signature or document upload;
- automated ETA, traffic prediction or customer promise;
- WhatsApp draft/send, automatic customer update, campaign, marketing or WhatsApp Web automation;
- invoice, Payment Link, Stripe, payment, refund, revenue, tip or financial reporting;
- changing lifecycle/custody directly instead of calling the existing W1B/W1C-B3 authority;
- automatic delivery from route departure, stop arrival, Bell Desk placement, ETA or elapsed time;
- multi-depot, multi-company, inventory, generic logistics or courier integration;
- changing `/order`, attribution snapshot, GA4, Google Ads, Meta or customer reconciliation/value contracts.

## File List

- `docs/stories/a7-031-orlando-os-w3-d-manual-routes.md`
- `docs/audits/2026-09-02-orlando-os-w3-d-routes-lite-forensic.md`
- `docs/audits/2026-09-02-orlando-os-w3-d-release-readiness.md`
- `docs/runbooks/A7-ORLANDO-W3D-ROUTES-STAGING-E2E-2026-09-02.md`
- `docs/runbooks/A7-ORLANDO-W3D-ROUTES-PRODUCTION-PILOT-2026-09-02.md`
- `lib/system-rbac.js`
- `lib/system-route-service.js`
- `lib/system-w3d-smoke-service.js`
- `lib/operational-store.js`
- `api/system/routes.js`
- `api/system/w3d-smoke.js`
- `sistema.html`
- `sistema.js`
- `sistema-routes.css`
- `scripts/build-site.mjs`
- `scripts/test-system-routes.mjs`
- `scripts/test-system-routes.sql`
- `scripts/test-system-routes-concurrency.sql`
- `scripts/test-system-routes-concurrency-verify.sql`
- `scripts/test-system-routes-concurrency.sh`
- `scripts/a7-system-operational-cycle.mjs`
- `scripts/test-system-operational-cycle.mjs`
- `supabase/migrations/20260902018000_orlando_os_w3d_routes_lite.sql`
- `supabase/migrations/20260902018001_orlando_os_w3d_route_authority.sql`
- `supabase/rollbacks/20260902018000_orlando_os_w3d_routes_lite.rollback.sql`
- `supabase/rollbacks/20260902018001_orlando_os_w3d_route_authority.rollback.sql`
- `package.json`

## Validation evidence

- Packet W3-D.0 inspected the linked Orlando Production migration ledger and a read-only schema dump. No route table,
  RPC, API or hidden UI implementation exists; the canonical driver/order/Bell Desk base is present.
- Packet W3-D.1 focused contract suite: `8/8 PASS`; `node --check lib/system-route-service.js` and
  `git diff --check`: PASS.
- Packets W3-D.2–D.6 focused route suite: `18/18 PASS`; protected API, explicit unauthenticated `401`, Operator
  `403`, Owner/Manager RBAC, canonical transition delegation, optional versioned ETA, cancellation, history, CLI
  read/write coverage with `--execute` guarding and menu gating verified. Read filters now reject malformed route IDs
  and impossible calendar dates before storage access.
- Disposable PostgreSQL replay used the 2026-09-02 read-only Orlando Production schema dump, then applied only
  `20260902018000` and `20260902018001`. Transactional fixtures proved create/retry, duplicate-leg rejection,
  reorder, start-time state/assignment/QA revalidation, pickup, direct delivery, Bell Desk intermediate custody,
  exception without order mutation, future-route re-eligibility after exception, completion and draft cancellation;
  fixture transaction ended in `ROLLBACK`.
- A second disposable PostgreSQL replay ran simultaneous Owner and Manager sessions against the same pending pickup.
  One session succeeded, the other failed closed with `Pending route stop required`; verification found exactly one
  `pickup_completed` route event, one canonical `confirm_pickup` order event, stop `completed` and custody
  `with_driver_pickup`. The disposable `a7_w3d_concurrency_20260902` database was removed immediately afterward.
- Exceptional migration rollback was replayed in the empty disposable `a7_w3d_rollback_20260902` database. The five
  W3-D authority functions and three route tables were removed, both absence checks returned true, and the canonical
  `a7_orlando_orders` base remained present. The disposable rollback database was removed immediately afterward.
- Exact 390 px browser QA: `innerWidth=390`, document `scrollWidth=375`, no horizontal document overflow; next-stop,
  pickup, delivery, Bell Desk, exception and optional ETA controls remain legible and reachable.
- Full repository gates after final W3-D hardening: lint PASS; typecheck PASS; `npm test` PASS; MOS `67/67 PASS`;
  build PASS; `git diff --check` PASS.
- The Owner decision of 2026-09-02 superseded the dedicated Staging rehearsal with a controlled Production pilot.
  A new Owner-only, same-origin and submission-bound transactional probe passed against a no-data replay of the exact
  Production schema: route create/retry, pickup/retry, direct delivery, Bell Desk, exception/requeue and completion
  all passed with `residue_count=0`. The disposable local database and temporary dump were removed immediately.
- Read-only account inventory reconfirmed that `wiwawtpaxnrueugppasi` is the linked A7 Orlando Production project
  and `zquefoznqwkfbnnfalmt` is the pre-existing Staging project for another system. It was not relinked or mutated.
- The Owner explicitly authorized W3-D before W3-B, the exact Production project, migrations, preflight/activation
  commits and rollback deployment. Only `20260902018000` and `20260902018001` were applied to
  `wiwawtpaxnrueugppasi`; both versions, the route table and the protected smoke function were verified remotely.
- Preflight commit `24a8099` was published as `dpl_5DD7TwBFH6c5jK2fkgdFnNVECZyM`; `Rotas` remained disabled. The
  authenticated Owner probe returned `ok=true`. The service can emit that response only when create/pickup retry,
  route completion, one pickup event, direct delivery, Bell Desk intermediate handoff, exception preservation,
  requeue and `residue_count=0` all pass.
- Activation commit `bbae7c6` was published as ready Production deployment
  `dpl_E6piJ19UEuHd3C2GLfxYQj9R6cY1` and owns `a7laundry.com`. Authenticated Owner smoke opened
  `/sistema/routes`, loaded the truthful empty state and new-route form without client errors, survived reload and
  passed exact 390 px with `innerWidth=390` and `scrollWidth=390`.
- Post-cutover checks: `/order` and `/sistema` returned HTTP 200; `/api/system/routes` and `/api/system/w3d-smoke`
  returned HTTP 401 without a session; focused W3-D service/API/UI tests passed 18/18 including Operator 403.
  No route, payment, message or real-order mutation was executed. Rollback deployment
  `dpl_142ZWVsbZm9zDvBN2sqDqBQATWGq` remains recorded and was not required.
