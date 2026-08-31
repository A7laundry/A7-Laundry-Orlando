# A7 Orlando — Operational Attribution Completion Audit

**Audit date:** 2026-08-28
**Scope authority:** `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`
**Branch / inspected HEAD:** `feat/meta-ads-ops-structure` / `23c108d13f558083facc5cf8a736f86cccb23ea4`
**Worktree boundary:** reviewed with pre-existing unrelated changes preserved; no Production promotion performed
**Current verdict:** `PRODUCTION PREDEPLOY READY / APPLICATION CUTOVER NOT AUTHORIZED`

This audit is intentionally fail-closed. A requirement is complete only when the current code,
durable schema and relevant runtime evidence prove it. Passing unit tests do not substitute for an
external configuration or observation-window requirement.

## Requirement coverage

| Requirement | Status | Authoritative evidence | Remaining evidence |
|---|---|---|---|
| FR-01 durable lead before price/payment | Proven | `/order/` intake, operational store/RPC and Preview synthetic lead | Production operating adoption |
| FR-02 `order_id` at acceptance before weight | Proven | Lifecycle service, RPC integrity rules and deterministic Preview acceptance | None for implementation |
| FR-03 preserve acquisition through payment | Proven in Preview | Frozen snapshot, payment linkage tests and deterministic Preview report | Production observation window |
| FR-04 separate acceptance/payment | Proven | Separate order/payment states and events | None for implementation |
| FR-05 Stripe reconciles existing order | Proven | Payment-link validation, webhook validation, test-mode lifecycle and signed transport | Production cutover |
| FR-06 pickup/weight/invoice/delivery/repeat | Proven | Node + SQL functional suites and prior cleaned Preview lifecycle | Production operating adoption |
| NFR-01 no PII in analytics/URLs/metadata/logs | Proven for Preview | Allowlist tests, browser diagnostic scan, Stripe metadata scan and collected GA4 DebugView parameters | Production log evidence remains a cutover gate |
| NFR-02 idempotent writes/events | Proven | Semantic idempotency migrations and duplicate webhook tests | Production monitoring |
| NFR-03 null/pending, never inferred zero | Proven | Store/reporting contracts and MOS tests | None for implementation |
| NFR-04 browser/tag failure does not block operations | Proven | Automated fail-open tests and protected-browser WhatsApp activation | None for implementation |
| CON-01 Google Ads goals unchanged | Proven | No Ads mutation in this release; recorded owner governance | None |
| CON-02 `purchase` + stable `transaction_id` | Proven | Server event contract, PaymentIntent-bound tests, strict GA4 validation and collected DebugView proof | None for Preview |

## Contract §16 gate

All 15 checks have code, SQL and/or protected Preview evidence. The authorized browser session used
`a7laundry.usa@gmail.com` with Editor-capable access to property `543807649`, accepted the owner-
confirmed user-data collection attestation and created the API secret without exposing its value.
The Preview secret remains branch-scoped, and a separate Production secret is now stored in the
protected Production environment. Strict `/debug/mp/collect` validation accepted `order_accepted`,
`purchase` and `refund` with zero validation errors. A collected DebugView run then displayed each
event once with only the approved opaque/categorical/financial parameters.

## Definition-of-done gate

| Definition-of-done item | Status | Reason |
|---|---|---|
| `money_page_view` is not a key event | Proven | Removed from GA4 key events on 2026-08-28 and verified absent after a fresh page reload; `purchase` remained enabled |
| Every inquiry has a durable lead or explicit failure | Implemented; observation open | Intake/manual/WhatsApp-origin contracts exist; production operation is not cut over |
| Every accepted pickup has pre-weight `order_id` | Proven | Enforced by service and database transitions |
| ≥95% paid-order snapshot coverage | Open | Requires clean Production observation window |
| Quality mix is reported separately | Proven | Reporting RPC exposes deterministic/partial/unattributed |
| `order_accepted` and `purchase` report independently | Proven in Preview | Ledger/MOS, strict GA4 validation and collected DebugView proof |
| Stripe never becomes acquisition | Proven in contract/Preview | Frozen acquisition snapshot and sanitized confirmation flow |
| Server-side idempotent purchase/refund | Proven | Code, SQL, lifecycle QA and dedicated signed Stripe transport |
| No PII in covered destinations | Proven for Preview | GA4 DebugView parameter inspection and automated allowlist/PII tests; Production logs remain a cutover gate |
| Full §16 scenario | Proven in Preview | All 15 checks now have evidence; Production observation is deliberately separate |
| No campaign/bidding/goal change bundled | Proven | Google Ads unchanged |

## Runtime and security state

- Final clean QA Preview `dpl_9B8qsLHKiE82J25uDSc62CZmFAQf` is READY at
  `https://a7-laundry-orlando-c0sw0u291-dennis-a7s-projects.vercel.app`.
- Test endpoint `we_1U9WaIDcFmXJh57PGw4oFeVX` is enabled for exactly six supported events.
- Dedicated non-system Vercel bypass `Stripe-QA` is present; signed ignored-event delivery returned
  HTTP 200 on the unique Preview URL and stable alias.
- The project-wide Vercel bypass remains active because repository automation still consumes
  `VERCEL_AUTOMATION_BYPASS_SECRET`. It must not be revoked until consumers are migrated.
- Preview has exactly one branch-scoped `GA4_MEASUREMENT_ID`,
  `GA4_MEASUREMENT_PROTOCOL_SECRET`, `GA4_MEASUREMENT_PROTOCOL_DEBUG` and `GA4_DEBUG_MODE` entry.
  Each targets Preview only and branch `feat/meta-ads-ops-structure`; no value is recorded here.
  Both debug flags were returned to `false` before the final clean Preview deployment.
- Production environment inventory now has the approved Supabase fallback variables,
  `PAYMENT_LINK_TOKEN`, the preserved `STRIPE_SECRET_KEY`, and dedicated
  `OPERATIONS_API_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `GA4_MEASUREMENT_ID`,
  `GA4_MEASUREMENT_PROTOCOL_SECRET` plus both GA4 debug flags set to `false`.
- Live Stripe endpoint `we_1U9af6DcFmXJh57POBb10Nz9` targets the future Production webhook route,
  listens to exactly the six contract events and is disabled. It cannot deliver events before the
  separately authorized cutover.
- The public aliases resolve to rollback baseline `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`, not to a
  newer unaliased Production-target deployment. Read-only probes return 200 for `/` and 404 for
  `/order`, `/api/stripe-webhook` and `/api/operations/lifecycle`, confirming that the candidate is
  not partially live.
- Strict validation Preview `dpl_6QHzZHLB6Tcwfy1Toz1TUbykDeHJ` accepted the three payloads through
  `/debug/mp/collect`; collected DebugView Preview `dpl_3Ucdu5tEm38YpQuH7M9r5pNDn6P6`
  emitted the three debug events; deduplication Preview `dpl_2ZyqCUncgRu35nvcGKY4KucDQyAF`
  proved a second delivery is rejected as `already_sent`. The QA endpoint was staging-only and
  returns 404 on the final clean Preview.
- The remote-build mismatch was corrected by moving the authorial registry to
  `governance/content-registry.mjs`, outside the fully ignored internal `marketing/` tree. Standard
  Preview `dpl_4rvoSZHwTywrZPmVGbesJTjzV3mA` passed `npm run build:public` through the normal Vercel
  pipeline. Its runtime `preview-steady` preflight returned HTTP 200 and 10/10 sanitized checks,
  including Stripe test mode and both GA4 debug flags disabled.
- Production application and Google Ads are unchanged. The live webhook configuration now exists
  but is disabled. The authorized GA4 change removed `money_page_view` from key events; no Ads
  conversion goal or bidding setting was changed.

## Audit correction: event-time fidelity

The audit found that the durable event ledger stored `occurred_at`, but the analytics outbox and
Measurement Protocol payload did not propagate it. A delayed retry could therefore be timestamped
at delivery time instead of business-event time.

Correction:

- migration `20260828110000_orlando_ga4_event_time_fidelity.sql` adds a mandatory outbox
  `occurred_at` synchronized from the immutable event ledger;
- `lib/ga4-server.js` now sends GA4 `timestamp_micros` from that value;
- `timestamp_micros` is emitted as the documented numeric type; events older than 72 hours,
  materially future-dated or missing a valid timestamp fail closed instead of being silently
  shifted by relaxed GA4 validation;
- payload validation uses `/debug/mp/collect` with `ENFORCE_RECOMMENDATIONS`, while actual
  DebugView evidence uses the normal collection endpoint with explicit `debug_mode`; validation
  responses are never mistaken for collected events;
- retries preserve the same timestamp;
- migration `20260828120000_orlando_ga4_expired_outbox.sql` adds terminal `expired` delivery state
  so an event beyond GA4's 72-hour backdating window is retained with an explicit reason and is
  not retried forever; the CLI retry summary reports `expired` separately from recoverable
  `failed` delivery;
- PostgreSQL 15 full-chain migration and functional SQL tests passed fail-fast;
- isolated verification returned zero event/outbox timestamp mismatches and `is_nullable=NO`;
- local and remote migration histories align through `20260828120000`.

Final post-correction gates pass: lint, typecheck, 20 focused operational tests, four focused
release-preflight tests, 77 root tests,
66 MOS tests and the repository
production build. The attribution scope passes `git diff --check`, and a secret-value scan found no
Stripe signing secret, Stripe API key or Vercel bypass value in the reviewed implementation and
evidence paths. The existing comforter canonical adjudication remains a governed content warning,
not a failure introduced by this implementation.

The environment-parity audit also found and corrected a credential-pairing edge case in both the
operational and attribution stores: Supabase URL and service-role key are now selected atomically
from one complete namespace (`operations`, `whatsapp` or `attribution`) in the appropriate priority
order. A partial higher-priority namespace can no longer be combined with a key from another
namespace; regression coverage proves fallback to the next complete pair and fail-closed behavior
when no complete pair exists.

An executable three-profile release gate now enforces this configuration before external QA or
cutover: `preview-validation`, `preview-debugview` and `production`. It verifies the exact Orlando
measurement ID, mutually exclusive GA4 modes, Stripe test/live mode, webhook configuration,
server tokens and a complete Supabase credential pair. Four focused tests pass, and an empty-shell
Production run exits nonzero while emitting names/status only, with no secret values.

## GA4 Preview evidence

| Event | Probe | Collected evidence | PII result |
|---|---|---|---|
| `order_accepted` | `84efedd55e1b4806aaee` | One DebugView event with `order_id`, `service_type`, `customer_type`, `attribution_confidence`, `event_id` and session ID | Pass |
| `purchase` | `84efedd55e1b4806aaee` | One DebugView event with stable `transaction_id`, same opaque `order_id`, `value=65`, `currency=USD`; strict validation also accepted the service item | Pass |
| `refund` | `84efedd55e1b4806aaee` | One DebugView event with the original `transaction_id`, same `order_id`, `value=15`, `currency=USD` | Pass |
| Deduplication | `9a23fbaf717a4515a6cb` | First outbox delivery `sent`; second delivery `already_sent`; final status remained `sent` | Pass |

No name, email, phone, WhatsApp ID, exact property/address/room, message body, notes, card data or
raw click ID appeared in the inspected parameters. The secret value was never printed, committed,
placed in a browser URL or retained in evidence.

### PII forensic matrix

| Campo | Evento | Origem | PII? | Enviado ao GA4? | Decisão |
|---|---|---|---:|---:|---|
| `order_id` | All three | Order service | No; opaque internal ID | Yes | Allowlisted join key |
| `transaction_id` | `purchase`, `refund` | Payment reconciliation | No; opaque payment transaction key | Yes | Required for financial identity/deduplication |
| `service_type`, `customer_type`, `attribution_confidence` | `order_accepted` | Order snapshot | No; controlled enums | Yes | Allowlisted categorical context |
| `value`, `currency`, service `items` | `purchase`; value/currency on `refund` | Confirmed financial record | No | Yes | Send only confirmed eligible service amounts |
| GA `client_id`, `session_id` | All three transport envelopes | Consented analytics continuity | Technical pseudonymous identifiers | Yes, when available | Never derived from customer PII |
| Name, email, phone, WhatsApp ID | None | Protected lead/CRM | Yes | No | Blocked by payload allowlist |
| Exact hotel/property/address/room | None | Protected operations store | Yes/high re-identification risk | No | Aggregate area/accommodation only when approved |
| Message body, handoff notes, internal notes | None | WhatsApp/operations | Yes/free text risk | No | Never accepted by GA4 serializer |
| Card/payment details beyond opaque transaction and confirmed amount | None | Stripe | Yes/sensitive | No | Remain native to payment provider/protected store |
| Raw `gclid`/`gbraid`/`wbraid`/CTWA identifiers | None | Protected attribution snapshot | Sensitive acquisition identifiers | No | Stored only in protected systems; absent from GA4 event parameters |

Google Ads was not opened for mutation and no Ads API write path was invoked. No campaign, bidding
strategy, goal, conversion action, import, billing setting or optimization target changed as part
of this GA4 Preview validation.

## Remaining authorized work boundary

GA4 Preview validation and the normal committed-SHA Preview are complete. Commit
`9a7bb0512f8d21f7c7996785407ef437a36c7401` deployed as Preview
`dpl_4ckN44QVvdaB8MTvjVA661ZyJvRp`; the normal `build:public` pipeline passed, the deployment was
READY, `/order` returned 200, `/api/qa/ga4-probe` returned 404 and the sanitized steady-state
runtime preflight returned `ready=true` with 10/10 checks passing. Production remained on
`dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`; public probes returned 200 for `/` and 404 for `/order`,
`/api/stripe-webhook`, `/api/operations/lifecycle` and `/api/operations/preflight`.

The credential/dependency `production-predeploy` gate passed 10/10 with a read-only Supabase probe,
strict non-reporting GA4 validation and protected Vercel metadata. Production remains a separate
NO-GO until all of the following occur:

1. obtain separate authorization for a Production application cutover, run its runtime preflight,
   activate the already configured webhook and retain rollback evidence;
2. run the Production runtime preflight and one explicitly approved financial smoke only under its own
   authorization;
3. observe a clean window proving ≥95% snapshot-record coverage and truthful quality mix;
4. migrate project-wide bypass consumers before revoking the legacy bypass.
