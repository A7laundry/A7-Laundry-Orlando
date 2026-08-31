# Story A7-019 — A7 Orlando OS W1B Daily Operations

**Status:** Production deployed — public and authorization gates passed; authenticated Owner smoke pending

**Created:** 2026-08-30

**Source:** user-supplied W1B goal dated 2026-08-30

**Depends on:** A7-016 W0, A7-017 W1A/W1A.1/W1A.2 and A7-018 Clientes Lite

## Story

**As the** A7 Orlando Owner,

**I want** `/sistema` to open in a concise operational view of today and each order,

**so that** I can see where the laundry is, what stage it is in, whether a commitment is at risk and what to do next.

## Scope lock

Only W1B is in scope: `Hoje`, operational queues, order detail, deterministic next action, custody, production,
operational timeline and governed Express SLA. W1C finance/weight capture, Stripe, Payment Links, WhatsApp, IA,
routes/drivers, `/order`, GA4, Google Ads and advanced Clientes remain unchanged.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | `/sistema` opens in `Hoje` with the eleven required operational blocks and no chart. | Goal §§1, 21 |
| FR-02 | Blocks open deterministic filtered queues; QA never contributes to real totals/SLA/late metrics. | Goal §§1–2, 13 |
| FR-03 | Order detail separates lifecycle, custody, production and finance and shows one server-derived next action. | Goal §§3, 7 |
| FR-04 | Custody uses the seven approved states and appends actor/time/before/after/idempotency/reason evidence. | Goal §4 |
| FR-05 | Production uses the five approved states and never changes finance automatically. | Goal §§5–6 |
| FR-06 | Only approved W1B transitions execute; incompatible actions fail closed and retries do not duplicate. | Goal §§6–7 |
| FR-07 | Express stores operator-approved `promised_by`, correction history and a deterministic governed SLA. | Goal §8 |
| FR-08 | Standard preserves pickup and `needed_by` evidence without inventing a countdown. | Goal §9 |
| FR-09 | Orders can be filtered by the approved queues and searched privately by number/customer/phone/property. | Goal §10 |
| FR-10 | Timeline shows safe time/action/actor evidence without UUID or idempotency key. | Goal §12 |
| NFR-01 | CLI/service contracts precede UI; UI contains no duplicate operational rules. | Constitution I; goal §16 |
| NFR-02 | Owner-only, same-origin POST writes, 401 unauthenticated, no PII/secrets in URL/analytics/logs. | Goal §15 |
| NFR-03 | Migration is additive, concurrency-safe, idempotent and leaves historical unknown states unknown. | Goal §17 |
| CON-01 | Thresholds are not active in Production until separately approved. | Goal §8; blueprint §21.2 |
| CON-02 | Stop at the Production gate; no migration/deploy without a new explicit GO. | Goal §21 |
| NFR-04 | Production write smoke must exercise the real W1B transition and retry atomically without mutating a real order or leaving synthetic operational data. | Second Production attempt finding, 2026-08-30 |

## State contracts

### Custody

`with_customer`, `awaiting_pickup`, `with_driver_pickup`, `at_laundry`, `with_driver_delivery`, `bell_desk`,
`delivered`; historical null is returned as `not_initialized` and is never inferred.

### Production

`awaiting_intake`, `awaiting_weight`, `awaiting_processing`, `processing`, `ready`; historical null is returned as
`not_initialized` and is never inferred.

### Governed Express rule — Owner-approved on 2026-08-30

- operational timezone: `America/New_York`;
- `OK`: more than 4 hours remaining;
- `ATTENTION`: at most 4 hours and more than 2 hours remaining;
- `RISK`: at most 2 hours and more than 0 remaining;
- `LATE`: promised time reached or passed.

The engine accepts one central configuration. The governed configuration and migration record the approved
thresholds as 240 and 120 minutes. The service still fails closed as `not_configured` if a future settings source
is incomplete or not approved.

## Historical and QA rules

- Existing rows receive no synthetic custody, production or `promised_by`.
- New orders created after W1B receive truthful initial states: `with_customer` and `awaiting_intake`.
- Directly searched QA remains visible and labelled; it never contributes to Hoje, operational lateness, Express
  risk or financial metrics.
- QA transitions fail closed in every store, including local fixtures; QA is read-only by contract.

## Transition matrix

| Action | Preconditions | Lifecycle | Custody | Production |
|---|---|---|---|---|
| `schedule_pickup` | accepted + with_customer/awaiting_pickup | pickup_scheduled | awaiting_pickup | unchanged |
| `confirm_pickup` | accepted/pickup_scheduled + awaiting_pickup | picked_up | with_driver_pickup | awaiting_intake |
| `receive_at_laundry` | picked_up + with_driver_pickup | unchanged | at_laundry | awaiting_weight |
| `start_processing` | at_laundry + awaiting_processing | unchanged | at_laundry | processing |
| `mark_ready` | at_laundry + processing | ready_for_delivery only when already paid/invoiced | at_laundry | ready |
| `start_delivery` | paid + ready + ready_for_delivery | unchanged | with_driver_delivery | ready |
| `leave_bell_desk` | with_driver_delivery + ready | unchanged | bell_desk | ready |
| `complete_delivery` | paid + ready + delivery custody | delivered | delivered | ready |
| `set_promised_by` | Express + operator-approved timestamp | unchanged | unchanged | unchanged |

Weight remains W1C. `awaiting_weight` therefore exposes a blocked future action rather than inventing weight or
advancing per-pound lifecycle.

## Acceptance criteria

- [x] CLI lists Hoje, filtered queues and one operational order detail before UI controls exist.
- [x] Hoje contains all required blocks, opens the matching queue and distinguishes zero from unavailable.
- [x] `Esperando confirmação` renders the real safe lead queue; it does not route to an unfiltered placeholder.
- [x] Queue priority is deterministic: Express late, Express risk, overdue, promised time, next window, oldest.
- [x] Search preserves `1002 → MCO 1002`, MCO forms and `A7-ORL-1000`, plus private customer/phone/property filters.
- [x] Queue filters expose custody and production as independent axes in addition to the business queues.
- [x] Detail shows approved header/order fields, four separate state axes, Pickup Order, timeline and next action.
- [x] Valid custody/production transitions pass; invalid combinations fail; retry is idempotent and concurrent-safe.
- [x] Production `ready` does not force `paid`; lifecycle readiness still requires the current payment contract.
- [x] Express uses Owner-approved central thresholds. Engine, timezone, promise and correction history pass.
- [x] QA remains visible by direct search but is excluded from Hoje totals, SLA, lateness and revenue.
- [x] Historical missing operational state renders `not_initialized`, never an inferred state or false zero.
- [x] Unauthenticated is 401; non-Owner is 403; PII/secrets stay out of URL, analytics, logs and static assets.
- [x] Existing W1A creation, MCO sequence, Pickup Order, direct lookup, Clientes Lite and public/integration regressions pass.
- [x] Desktop and 390 px visual QA pass for Hoje, queues, detail, Express, Standard, QA, timeline and next action.
- [x] Standard overdue is visibly labelled `ATRASADO`; Express cards expose the governed countdown state and remaining time.
- [x] Lint, typecheck, full tests, build, scans and migration dry-run pass.
- [x] Production gate documents schema, transitions, final SLA rule, history, QA, rollback and GO/NO-GO, then stops.

## Rollback contract

Primary rollback is application-only to the current healthy Clientes Lite deployment. The additive W1B schema
remains inert under that release. Exceptional SQL rollback drops W1B functions/events/settings and only drops new
columns when no W1B state, SLA or history has been written.

## Second Production attempt — 2026-08-30

The exact candidate was promoted after explicit Owner authorization. Authenticated Owner smoke passed Hoje, eleven
counters, Pedidos, direct lookup, detail and QA read-only behavior. No safe mutable fixture existed to prove a
successful idempotent transition retry without touching the only real order or expanding the authorized Production
data scope. The release therefore failed closed and was immediately rolled back to
`dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`. No real order was mutated and no new QA row was created. A future attempt needs
a separately governed mutable smoke fixture that remains excluded from real operations while exercising the real RPC.

## Local remediation after the second attempt

The safer remediation is a service-role-only transactional probe, not a mutable QA order. The probe creates a
synthetic order inside one database transaction, invokes `a7_orlando_w1b_transition` twice with the same
idempotency key, verifies the resulting state and single operational event, and deletes every synthetic row before
the transaction commits. Any failed assertion aborts and rolls back the entire call. The probe is Owner-authenticated
at the application boundary, contains no customer PII, does not consume an MCO sequence number, does not call
Stripe/WhatsApp/analytics and leaves no order, event, lead or contact behind.

The first isolated PostgreSQL run exposed a real SQL-only incompatibility hidden by the memory store: W1B used
`pickup_scheduled` as though it were a canonical lifecycle event, while P0 correctly rejects it. The additive
compatibility migration now advances the order status without inserting a non-canonical analytics event; the W1B
operational ledger remains the audit source for `schedule_pickup`.

- [x] CLI dry-run and explicit execute guard precede the HTTP smoke route.
- [x] SQL probe proves real-RPC transition, duplicate retry and zero residue.
- [x] Owner-only endpoint is same-origin, POST-only and returns safe evidence only.
- [x] Local unit, SQL and regression gates pass before any new Production GO is requested.

### Validation evidence for the post-rollback remediation

- CLI dry-run: PASS; execution requires the explicit `--execute` flag and an Owner actor identity.
- Focused W1B suite: 16/16 PASS.
- Full system pretest: 66/66 PASS.
- Full repository test: 80/80 PASS; MOS: 66/66 PASS.
- `npm run lint`, `npm run typecheck` and `npm run build`: PASS.
- PostgreSQL 15 clean-chain smoke through `040000 → 040500 → 041000`: PASS.
- Real SQL transition/retry: first `duplicate=false`, retry `duplicate=true`, exactly one operational event.
- Cleanup: zero synthetic contacts, leads, orders, lifecycle events, operational events and operator-audit rows.
- SQL permissions: `service_role=true`; `anon=false`; `authenticated=false`.
- SQL rollback: PASS; smoke function removed and P0 lifecycle writer restored.
- Production, Stripe, WhatsApp API, Google Ads, GA4 and `/order`: unchanged.

## Isolated Preview runtime evidence — 2026-08-30

> **INVALIDATED:** `zquefoznqwkfbnnfalmt` was later confirmed to be a pre-existing A7X OS project rather
> than an Orlando staging database. None of the evidence in this section may be used as an Orlando release
> gate. Dedicated Preview access and all isolated Orlando-created database objects were removed without
> changing the legacy system's critical row-count baseline. A new Preview proof requires an explicitly
> approved Orlando database target.

- Preview `dpl_6HeSkYBAgjfudNHBs1f2Vhq3MiT2` is `READY` and connected only to `A7x Os Staging`.
- Owner login, session authorization, Hoje and durable storage passed.
- The real server/API smoke returned first transition `duplicate=false`, retry `duplicate=true`, one operational
  event, `pickup_scheduled` / `awaiting_pickup` and zero synthetic residue.
- Lint, typecheck, tests (72 repository / 66 MOS) and build passed on the immutable W1B-only artifact.
- Production remains unchanged on `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`.
- Production cutover remains NO-GO under the expanded Owner gate because invoice versioning/immutability, tip and
  bell-desk final confirmation are later-wave requirements and are not part of this W1B artifact.

## File List

- `docs/stories/a7-019-orlando-os-w1b-daily-operations.md`
- `docs/audits/2026-08-30-orlando-os-w1b-production-gate.md`
- `config/orlando-operations.json`
- `lib/system-operations-service.js`
- `lib/operational-store.js`
- `api/system/today.js`
- `api/system/operation-draft.js`
- `api/system/operational-orders.js`
- `scripts/a7-system-operations.mjs`
- `scripts/test-system-w1b.mjs`
- `sistema.html`
- `sistema.js`
- `sistema-w1b.css`
- `scripts/build-site.mjs`
- `package.json`
- `supabase/migrations/20260830040000_orlando_os_w1b_daily_operations.sql`
- `supabase/rollbacks/20260830040000_orlando_os_w1b_daily_operations.rollback.sql`
- `supabase/migrations/20260830041000_orlando_os_w1b_transactional_smoke.sql`
- `supabase/migrations/20260830040500_orlando_os_w1b_schedule_pickup_fix.sql`
- `supabase/rollbacks/20260830040500_orlando_os_w1b_schedule_pickup_fix.rollback.sql`
- `supabase/rollbacks/20260830041000_orlando_os_w1b_transactional_smoke.rollback.sql`
- `api/system/w1b-smoke.js`
- `lib/system-w1b-smoke-service.js`
- `scripts/a7-system-w1b-smoke.mjs`
- `supabase/rollbacks/incidents/20260830_zquefo_orlando_objects.rollback.sql`
- `docs/audits/2026-08-30-zquefo-orlando-cross-project-cleanup.md`

## Direct Production cutover — 2026-08-30

At the Owner's direction, the project resumed with Production as the controlled pilot environment. The invalid
cross-project Preview was not reused. The official Orlando Supabase project remains `wiwawtpaxnrueugppasi`, whose
migration ledger is aligned through W1B `20260830041000`; W1C-A, W2-A, W3-A and W1C-B1 remain local-only.

The repository checkpoint was integrated without rewriting remote history and pushed at exact SHA
`11ed37a53aaaad90bcf60145d8817728d4ffa096`. The deployment used the isolated post-fix W1B artifact, not the full
later-wave workspace. Production deployment `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP` is `READY` and aliased to
`a7laundry.com`; rollback deployment `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` remains `READY`.

Public smoke passed for `/`, `/order`, `/sistema` and `/sistema.js` (HTTP 200). An unauthenticated request to
`/api/system/today` returned the required HTTP 401. The deployed `sistema.js` SHA-256 exactly matches the isolated
W1B artifact (`6caf39906487a60b970722e53ecc2a75f576fdc70c040c48897df54d948eff1c`) and exposes no W1C invoice/weight or
W2 message endpoints. Full source and isolated-artifact lint, typecheck, tests and builds passed.

The remaining gate is an authenticated Owner smoke of Hoje, Pedidos, direct lookup and the zero-residue W1B
transactional probe. No credential was invented, copied from another environment or bypassed; the controlled
Chrome tab is waiting at the Production login screen.
