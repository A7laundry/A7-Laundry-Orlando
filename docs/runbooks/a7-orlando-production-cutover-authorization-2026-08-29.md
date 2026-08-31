# A7 Orlando — Production Cutover Authorization Package

**Prepared:** 2026-08-29
**Branch:** `feat/meta-ads-ops-structure`
**Runtime candidate commit:** `d832c4ae93dac86c2d605784faa9742a25fb8873`
**Status:** `PENDING GIT PREVIEW / CUTOVER NOT AUTHORIZED`

This package is fail-closed. It becomes a `CUTOVER CANDIDATE` only when a Vercel Git Preview built
from the exact runtime candidate passes the complete runtime gate at 10/10. Preparation, credentials
and a green local build are not authorization to change Production.

## Executive verdict

| Control | Current state |
|---|---|
| Artifact | `PARTIAL` — exact commit is reproducible; Git Preview is pending |
| Preview | `FAIL` — no exact Git Preview with Sensitive runtime variables yet |
| Production | `UNCHANGED` |
| Live Stripe webhook | `DISABLED` |
| Production cutover | `NOT AUTHORIZED` |
| Controlled live order | `NOT AUTHORIZED` |
| Google Ads change | `NOT AUTHORIZED` |

## Artifact identity

| Field | Evidence |
|---|---|
| Branch | `feat/meta-ads-ops-structure` |
| Full SHA | `d832c4ae93dac86c2d605784faa9742a25fb8873` |
| Short SHA | `d832c4a` |
| Commit message | `fix(attribution): accept restricted Stripe release keys` |
| Preview URL | `PENDING` |
| Deployment ID | `PENDING` |
| Build | `PASS` in a clean checkout |
| Runtime preflight | `PENDING`; must be exactly 10/10 |

The runtime candidate is the executable artifact. This evidence document may be committed separately
after the Preview identity exists; a documentation-only evidence commit does not replace or mutate
the runtime candidate.

## Worktree isolation

| Classification | Files / scope | Action |
|---|---|---|
| Attribution delivery | `lib/operational-release-preflight.js`, `scripts/test-operational-release-preflight.mjs` | Explicitly staged and committed as `d832c4a` |
| Related documentation | This package, attribution audit, release runbook and story A7-003 | Preserve separately from executable commit |
| Unrelated work | WhatsApp bridge, SEO Core 15, Ads evidence/assets, root package changes and legacy/untracked Supabase files | Preserved and excluded from the executable commit |
| Unknown | None after inspection | No action |

No broad staging, destructive reset, clean or indiscriminate restore was used. The executable commit
contains no secret, `.env`, PII, log, dump or temporary artifact.

## Reproducibility evidence

The exact SHA was checked out independently at
`/private/tmp/a7-attribution-cutover-d832c4a`. Dependencies were installed only from the committed
root and `mos-app` lockfiles before the gates ran.

| Check | Result |
|---|---|
| `npm run lint` | `PASS` |
| `npm run typecheck` | `PASS` |
| `npm test` | `PASS` — root 72/72 and MOS 66/66, plus scripted validators |
| `npm run build` | `PASS` |
| Focused release-preflight tests | `PASS` — 6/6 |
| Dependency on uncommitted work | `NO` |
| Secret scan of committed diff | `PASS` |

The comforter canonical warning is an existing governed SEO adjudication and is outside this
attribution release. It is not a build or test failure.

## Preview gate

Four local-CLI Preview attempts were intentionally rejected as candidates. Their Vercel builds were
READY, but Vercel did not attach branch-scoped variables marked Sensitive to local deployments.
The sanitized preflight therefore remained below 10/10. None was promoted, aliased to Production or
accepted as release evidence.

The required next artifact is a Git-integration Preview created after an authorized `@devops` push
of this branch. It must prove all of the following:

| Check | Required result |
|---|---|
| Deployment metadata SHA | Exact full runtime candidate SHA |
| Deployment target | `preview` |
| Status | `READY` |
| `/` | HTTP 200 |
| `/order` | HTTP 200 |
| `/api/operations/preflight` | HTTP 200, `ready=true`, 10/10 |
| Stripe webhook path | Present and signature-protected |
| Lifecycle endpoint | Present and authorization-protected |
| Supabase | Complete credential pair and read-only connectivity pass |
| Outbox | Durable schema/contract and idempotency checks pass |
| GA4 | Orlando Measurement ID, secret present, both debug modes false |
| Browser exposure | No secret or PII in HTML, JavaScript, URLs or response bodies |

If any item fails, the status remains `BLOCKED`; a new commit requires a new Preview and full
revalidation.

## Current Production state

| Control | Confirmed state |
|---|---|
| Public deployment | `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` |
| Homepage | HTTP 200 |
| `/order` | HTTP 404 |
| `/api/stripe-webhook` | HTTP 404 |
| `/api/operations/lifecycle` | HTTP 404 |
| `/api/operations/preflight` | HTTP 404 |
| Production credential/dependency preflight | 10/10, no deploy |
| Application changed during preparation | `NO` |

Production contains the approved protected runtime configuration. The predeploy gate used a
read-only Supabase probe and strict GA4 `/debug/mp/collect` validation; it did not report an event,
create revenue or activate any endpoint.

## Live Stripe webhook state

- Endpoint ID: `we_1U9af6DcFmXJh57POBb10Nz9`.
- Target: `https://a7laundry.com/api/stripe-webhook`.
- Subscriptions: exactly the six checkout/payment/refund events defined by the attribution contract.
- Current state: `DISABLED`.
- Signature secret: configured in protected Production scope; value is not recorded here.
- Activation, financial delivery and payment testing are not authorized by this package.

## Proposed Production cutover sequence

Authorization A permits only steps 1–11. It does not implicitly permit step 12 or any later financial
test.

1. Promote the exact validated Preview deployment without rebuilding it.
2. Confirm the resulting Production deployment ID and candidate SHA.
3. Confirm public alias ownership and retain `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` as rollback.
4. Run the sanitized Production runtime preflight; require 10/10.
5. Validate `/order` and its truthful request/confirmation language.
6. Validate that the webhook route exists and rejects missing/invalid signatures.
7. Validate lifecycle authentication and state-machine availability without creating a live order.
8. Run read-only Supabase connectivity and schema checks.
9. Confirm outbox availability, retry controls and zero unintended pending QA events.
10. Validate GA4 steady-state configuration with both debug flags false.
11. Send the separately approved signed, non-financial Stripe probe and inspect logs/outbox effects.
12. Only under Authorization B, enable the live Stripe webhook.
13. Monitor webhook delivery, retries, duplicates and application errors.
14. Only under Authorization C, execute a controlled live financial order.
15. Keep Google Ads unchanged unless Authorization D is separately granted after adequate evidence.

### Stop conditions

Stop and roll back before webhook activation if build/runtime identity drifts, preflight is below
10/10, `/order` or protected endpoints fail, Supabase/outbox is unhealthy, GA4 is in a debug mode,
signature validation is inconsistent, duplicate `purchase` risk exists, a secret/PII leak is found,
or Production/Google Ads changes unexpectedly.

## Non-financial Stripe probe design

**Status:** `DESIGNED / NOT AUTHORIZED / NOT EXECUTED IN PRODUCTION`.

- Event: a signed, syntactically valid Stripe event type outside the six financial handlers.
- Purpose: exercise raw-body parsing, timestamp-bounded signature verification, routing and sanitized
  observability without representing payment truth.
- Expected HTTP result: controlled 200 acknowledgement with an ignored/unsupported outcome.
- Expected side effects: no lead/order/payment mutation; no `purchase` or `refund`; no revenue; no
  real customer record; no GA4 financial event.
- Evidence: request correlation ID, sanitized runtime log, unchanged payment/order counts and no new
  financial outbox row.
- Cleanup: none when the ignored-event contract holds; any unexpected row is quarantined and triggers
  rollback before webhook activation.

The probe requires an explicit post-deploy authorization even though it is non-financial.

## Controlled live order protocol

**Status:** `NOT AUTHORIZED`.

If later authorized, use one clearly labeled test-controlled order with an operationally valid
minimum, unique `transaction_id`, deterministic attribution IDs and one real payment. Trace the same
opaque order through Stripe, application, Supabase, outbox and GA4; verify one `purchase`, zero
duplicates and correct value/currency. A controlled refund, if desired, requires inclusion in that
separate authorization and must append one `refund` without rewriting the original purchase.

## Post-cutover monitoring

Monitor Stripe, GA4, Supabase, outbox, runtime logs and application lifecycle for:

- orders accepted, picked up, paid and delivered;
- `order_accepted`, `purchase` and `refund` events;
- webhook failures, retries and duplicate source events;
- outbox pending, retryable, terminal and sent states;
- deterministic, partial and unattributed order shares;
- latency from lead to acceptance, acceptance to pickup and pickup to delivery.

The future operating target is at least 95% of paid orders with deterministic or explicitly partial
attribution after a sufficient real observation window. This package does not claim that target is
already achieved.

## Rollback

Before any cutover, retain `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` as the known public rollback.
If a stop condition occurs after promotion, reassign the Production aliases to that deployment,
confirm the candidate-only routes return 404 again, keep the live webhook disabled (or disable it
immediately if Authorization B had already been used), stop operational event delivery and preserve
all durable records/outbox history for reconciliation. Do not delete or rewrite payments, lifecycle
events or audit evidence.

## Independent authorizations

1. Authorization A — `DEPLOY TO PRODUCTION`: `REQUIRED`.
2. Authorization B — `ENABLE LIVE STRIPE WEBHOOK`: `REQUIRED`.
3. Authorization C — `EXECUTE CONTROLLED LIVE ORDER`: `REQUIRED`.
4. Authorization D — `CHANGE GOOGLE ADS PRIMARY CONVERSION`: `REQUIRED`.

No authorization is inferred from another.

## SEO program boundary

Core 15 page implementation, comforter canonical/redirect adjudication, internal linking,
indexation, NAP/GBP, policies, operational proof, GSC-to-GA4 linking, backlinks, partnerships and a
corrected measurement window remain separate SEO work. They are not bundled into this attribution
artifact or cutover.

## Blocker to freeze

The exact commit is not yet present on `origin/feat/meta-ads-ops-structure`. Project governance
reserves `git push` for `@devops`. Until that authority publishes the three already-versioned local
commits and Vercel produces a matching Git Preview at 10/10, this package must not request or imply
Production authorization.
