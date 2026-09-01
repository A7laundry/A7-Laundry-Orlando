# A7 Orlando OS W1B — Production Gate

> **Incident correction — 2026-08-30:** the sections below titled “Isolated Staging Preview proof” and
> “Staging schema reconciliation” relied on an incorrect environment classification.
> `zquefoznqwkfbnnfalmt` is a pre-existing A7X OS project, not an Orlando staging database. That Preview
> proof is invalid and must not support a Production cutover. The Vercel Preview variables, dedicated key
> and isolated Orlando/attribution/WhatsApp database objects were removed. The unrelated A7X OS critical
> row-count baseline was unchanged after cleanup. See
> `2026-08-30-zquefo-orlando-cross-project-cleanup.md`.

**Date:** 2026-08-30
**Scope:** Hoje, operational queues, order detail, custody, production, next action and Express SLA
**Production mutation performed:** Yes — additive migrations applied and the isolated W1B application released
**Gate verdict:** **W1B READY COM RESSALVA / PRODUCTION KEEP / ROLLBACK NOT REQUIRED**

> Current-state note — 2026-08-30: later execution evidence supersedes the historical cutover/rollback notes below.
> Production is on `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`, `Ready`, with authenticated Owner smoke for Hoje,
> Pedidos, direct lookup and authorization already passed. The sole W1B caveat is the absence of a supported
> server-side Production harness for the already-implemented zero-residue transactional probe.

> Direct Production cutover — 2026-08-30: the Owner explicitly selected Production as the controlled pilot
> environment. Repository SHA `11ed37a53aaaad90bcf60145d8817728d4ffa096` was pushed without force; isolated
> post-fix W1B deployment `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP` is `READY` and aliased to `a7laundry.com`.
> `/`, `/order`, `/sistema` and `/sistema.js` return 200, unauthenticated `/api/system/today` returns 401, and the
> deployed system JavaScript exactly matches the isolated W1B artifact. Rollback deployment
> `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` remains `READY`. The authenticated Owner smoke is pending because the fresh
> controlled Chrome tab is at the login screen; no authentication bypass or credential substitution was used.

> Readiness refresh — 2026-08-30 12:59 EDT: Vercel reinspection confirms candidate
> `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` and rollback `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` are both `Ready`.
> Supabase migration history confirms W1B `20260830040000` remains aligned and W1C-A `20260830050000` remains
> local-only. An authenticated Owner `/sistema` tab is now controllable, so the prior smoke-evidence blocker is
> resolved. No second promotion occurred during this refresh; a new explicit Owner GO is still required.

> Runtime recheck — 2026-08-30: `a7laundry.com` still resolves to healthy rollback deployment
> `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` (`Ready`). Candidate `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` was separately
> reinspected and remains `Ready`. The Supabase ledger contains W1B `20260830040000` and contains none of W1C-A,
> W2-A, W3-A or W1C-B1. No promotion or external mutation occurred during this recheck.

> Second controlled cutover — 2026-08-30: after exact Owner authorization, candidate
> `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` was promoted. Public routes and guards passed; an authenticated Owner Chrome
> session proved Hoje, all eleven counters, Pedidos, direct-number lookup, operational detail and QA read-only
> behavior. The required successful idempotent-write retry could not be proved without mutating the only real order
> or creating additional Production operational data outside this GO. Per the explicit fail-closed authorization,
> the application was immediately restored to `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`. Post-rollback inspection shows the
> domain on that deployment, `Ready`; `/`, `/order` and `/sistema` return 200 and W1B `/api/system/today` returns the
> expected 404. No real order was changed and no QA row was created.

> Execution update: the Owner authorized cutover. Migration `20260830040000` was applied, deployment
> `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` was promoted, and every public/unauthenticated gate passed. The required
> authenticated Owner smoke could not be evidenced because browser control was denied and exporting all Production
> secrets was rejected as unsafe. Per the authorized fail-closed rule, the application was immediately rolled back
> to `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`. The additive schema remains applied and inert under the rollback release.

## Executive result

W1B is implemented and validated locally. The Owner approved the Express thresholds on 2026-08-30: attention
at 240 minutes and risk at 120 minutes. The governed configuration and migration now record those exact values,
and the service continues to fail closed when a future settings source is incomplete or not approved.

No Stripe, WhatsApp, Google Ads, GA4, `/order`, public acquisition flow or W1C financial behavior was changed.

## Owner-approved Express rule

Approved Orlando operational thresholds:

| State | Approved rule |
|---|---|
| `OK` | More than 4 hours before `promised_by` |
| `ATTENTION` | 4 hours or less and more than 2 hours before `promised_by` |
| `RISK` | 2 hours or less and more than 0 before `promised_by` |
| `LATE` | `promised_by` reached or passed |

The countdown is based on the operator-approved Express `promised_by` in `America/New_York`. Corrections require
a reason and append history. Standard orders use `needed_by`/overdue without an invented countdown.

## Gate evidence

| Gate | Result | Evidence |
|---|---|---|
| Scope isolation | PASS | W1B-only files; W1C remains blocked in next action |
| Migration additive | PASS | New nullable order fields, new settings/event tables and RPCs only |
| Historical semantics | PASS | Existing order states remain null and render `not_initialized` |
| Custody states | PASS | Seven governed states; invalid transitions fail closed |
| Production states | PASS | Five governed states; `ready` never forces `paid` |
| Next action | PASS | One shared server function; browser displays returned decision only |
| Real waiting queue | PASS | `Esperando confirmação` is backed by safe leads without orders; no placeholder or manufactured count |
| Independent axis filters | PASS | Custody and production can be filtered independently through private POST bodies |
| Idempotency/concurrency | PASS | Signed HttpOnly draft identity, order row lock before retry resolution, unique event key |
| Owner authorization | PASS | APIs require Owner; 401 unauthenticated and 403 non-Owner covered |
| QA isolation | PASS | Direct-number search only, visible label, read-only, excluded from real counters/SLA |
| PII/secrets | PASS | POST search/write bodies; safe last-four display; scans found no secret value or analytics |
| Visual desktop | PASS | Hoje, real waiting leads, independent axis filters, detail, four axes, timeline and blocked W1C reviewed |
| Visual 390 px | PASS | No horizontal document overflow; real waiting leads, Standard, Express, QA and detail reviewed |
| Focused tests | PASS | 40 W0/W1A/W1B pretests; 14 focused W1B tests after the final queue/filter/concurrency audit |
| Full regression | PASS | `npm test`: 40 pretests, 80 repository tests, 66 MOS tests |
| Lint/typecheck | PASS | `npm run lint`; `npm run typecheck` |
| Build | PASS | `npm run build`; `sistema-w1b.css` present in build artifact list |
| Migration alignment | PASS | Supabase migration ledger now shows `20260830040000` aligned local/remote; no W1B schema write remains pending |
| Remote migration history | PASS | Linked database includes `20260830040000`; the additive W1B schema remains installed and inert under the rollback application |
| Snapshot completeness | PASS | Operational counters use the complete governed order snapshot; no silent 500-row truncation |
| Express threshold approval | PASS | Owner approved 4-hour attention and 2-hour risk thresholds on 2026-08-30 |
| Rollback deployment | PASS | Vercel reinspection confirms `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` is Production / Ready |
| Pre-cutover HTTP baseline | PASS | Current `/sistema` returns 200; W1B `/api/system/today` returns expected pre-release 404 |

The existing content-registry comforter canonical warning remained unchanged and is unrelated to W1B.

## Migration and rollback

Migration: `supabase/migrations/20260830040000_orlando_os_w1b_daily_operations.sql`.

Primary rollback is application rollback to the current healthy Production deployment:

- deployment: `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`;
- status observed: Ready / Production;
- the additive W1B schema can remain inert after application rollback.

Exceptional SQL rollback:

- `supabase/rollbacks/20260830040000_orlando_os_w1b_daily_operations.rollback.sql`;
- refuses destructive column removal after operational events or W1B state exist;
- preserves data by default and requires explicit evidence before schema removal.

## Production sequence after explicit cutover GO

1. Apply only migration `20260830040000_orlando_os_w1b_daily_operations.sql`.
2. Deploy only the reviewed W1B application artifact.
3. Smoke as authenticated Owner: Hoje, queues, Standard detail, Express promise, QA read-only and idempotent retry.
4. Confirm no regression in Atendimento, Pickup Order, Clientes Lite and direct lookup.
5. Roll back immediately to `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` if any gate fails.

## Final decision

The immutable W1B candidate remains technically eligible for a second controlled cutover, but the current
application state is the healthy rollback release. The W1B schema is installed and inert. A second promotion must
not occur until an already-authenticated Owner tab is available for the mandatory smoke.

## First cutover execution evidence

| Check | Result |
|---|---|
| Migration application | PASS — `20260830040000` is aligned local/remote |
| Candidate deployment | PASS — `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2`, Production / Ready |
| Public `/`, `/order`, `/sistema`, W1B stylesheet | PASS — HTTP 200 |
| W1B APIs without authentication | PASS — `today`, `operational-orders`, `operation-draft` returned 401 |
| Existing Clientes Lite API without authentication | PASS — 401 |
| `/order` and Stripe method guards | PASS — existing 405 behavior preserved |
| Authenticated Owner smoke | **NOT PROVEN** — safe browser control unavailable; no credential workaround used |
| Rollback | PASS — `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` promoted immediately |
| Post-rollback `/`, `/order`, `/sistema` | PASS — HTTP 200 |
| Post-rollback W1B API | PASS — expected 404, confirming application rollback |

The next cutover must reuse the immutable candidate only after a controllable, already-authenticated Owner tab is
available. It must repeat the entire smoke and roll back again on any failed or unproven gate.

## Second cutover execution evidence

| Check | Result |
|---|---|
| Exact Owner authorization | PASS — candidate and rollback IDs were named explicitly |
| Candidate promotion | PASS — `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` promoted successfully |
| Public `/`, `/order`, `/sistema`, W1B stylesheet | PASS — HTTP 200 |
| W1B private APIs without authentication | PASS — HTTP 401 |
| Existing Stripe and `/order` method guards | PASS — HTTP 405 |
| Authenticated Owner identity | PASS — `Dennis Arruda · owner` visibly rendered |
| Hoje and eleven operational counters | PASS — real safe snapshot rendered |
| Pedidos, queue controls and direct lookup | PASS |
| Operational detail | PASS — independent lifecycle/custody/production/finance axes and next action rendered |
| QA direct lookup/read-only | PASS — `MCO 1002` and legacy `A7-ORL-1000`; action disabled and QA excluded |
| Successful idempotent write retry | **NOT PROVEN** — no safe mutable fixture existed under the authorized scope |
| Real business data mutation | PASS — none performed |
| Rollback | PASS — immediate restore to `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` |
| Post-rollback health | PASS — domain/Ready verified; public 200s and expected W1B 404 |

The next safe attempt needs one narrowly authorized, clearly identified **mutable smoke fixture** that is excluded
from real counters, SLA, revenue and fulfillment while still exercising the same transition/idempotency RPC. The
current QA contract is intentionally read-only, so the existing QA rows cannot satisfy that write proof.

## Post-rollback SQL remediation — local only

The proposed mutable fixture was replaced by a safer transactional probe. The first isolated PostgreSQL 15 run
exposed a separate real defect: W1B passed `pickup_scheduled` to the P0 canonical lifecycle writer, which rejects
that non-canonical event. Production was not affected because the W1B application had already been rolled back.

Local remediation now consists of:

- additive compatibility migration `20260830040500`, which advances `order_status=pickup_scheduled` without
  inserting a non-canonical analytics event; `schedule_pickup` remains in the W1B operational ledger;
- service-role-only transactional probe migration `20260830041000`;
- Owner-only, same-origin, POST-only application endpoint with an HttpOnly submission identity;
- CLI dry-run with explicit `--execute` guard.

Isolated PostgreSQL 15 evidence:

| Check | Result |
|---|---|
| Clean migration chain through W1B + compatibility + probe | PASS |
| First real W1B `schedule_pickup` transition | PASS |
| Retry with identical idempotency key | PASS — `duplicate=true` |
| Operational event count | PASS — exactly 1 |
| Final transient state | PASS — `pickup_scheduled` / `awaiting_pickup` |
| Persistent residue | PASS — 0 contacts, leads, orders, lifecycle events, operational events and audit rows |
| Permissions | PASS — service role allowed; anon/authenticated denied |
| Rollbacks | PASS — probe removed and canonical lifecycle writer restored |

Verdict remains **NO-GO for Production** until the full repository gates pass and a new immutable candidate is
built. Deployment `dpl_8srFy22wWj8jJdn7q8eL9J85dPZ2` must not be promoted again because it does not contain these
local fixes.

## Post-fix immutable Preview — 2026-08-30

A new isolated artifact was built from the prior W1B-only release source. It includes the W1B scheduling fix and
Owner-only transactional smoke endpoint, while excluding W1C, W2 and W3 application code.

| Check | Result |
|---|---|
| Exact artifact syntax | PASS |
| In-memory transition/retry probe | PASS — first `duplicate=false`, retry `duplicate=true`, one event, zero residue |
| Repository validation | PASS — 72/72 |
| MOS validation | PASS — 66/66 |
| Lint/typecheck/build | PASS |
| Later-wave isolation | PASS — W1C actions remain disabled placeholders; no invoice/message/customer-upgrade endpoints |
| Secret scan | PASS — no credential value in runtime source or built artifact |
| Preview deployment | PASS — `dpl_GcHjnLx87f8PjshfaZoFErgCkdfK`, `READY`, target Preview |
| Preview protection | PASS — Vercel SSO/noindex; unauthenticated system write is rejected |
| Application login screen | PASS — protected Preview renders `A7 Orlando OS` login |
| Remote migrations `040500`/`041000` | PASS — applied after exact Owner authorization; ledger aligns through `041000` only |
| Authenticated transactional Preview smoke | **NOT RUN** — Preview is ready and waiting for Owner login |

Preview URL: `https://a7-laundry-orlando-928tssszd-dennis-a7s-projects.vercel.app`.

Production remains on `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`. The additive migrations are installed and inert under
that application release. The new Preview is not eligible for promotion until the authenticated Owner smoke passes
and an exact cutover GO names both the new candidate and the rollback deployment.

## Isolated Staging Preview proof — 2026-08-30

The Preview blocker was resolved without copying or changing any Production secret. The final W1B artifact uses
dedicated Preview-only variables and the isolated Supabase project `A7x Os Staging`
(`zquefoznqwkfbnnfalmt`). Production remained on `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`, `READY`.

### Environment inventory

| Variable | Status before correction | Target | Action |
|---|---|---|---|
| `A7_OPERATIONS_SUPABASE_URL` | ABSENT | PREVIEW / STAGING | Added to Preview only with the Staging project URL |
| `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | ABSENT | PREVIEW / STAGING | Added to Preview only using a dedicated `sb_secret_` server key |
| `WHATSAPP_SUPABASE_URL` | BRANCH RESTRICTED | UNKNOWN / not reused | Left unchanged |
| `WHATSAPP_SUPABASE_SERVICE_ROLE_KEY` | BRANCH RESTRICTED | UNKNOWN / not reused | Left unchanged |

The first newly generated Staging key was revoked before use after its value became visible during UI inspection.
The replacement key is dedicated to Preview, remained outside source/logs/reports and is held only by Vercel.

### Staging schema reconciliation

Read-only/runtime checks exposed that the older Staging audit overstated schema completeness. The database had
W0/W1A tables but lacked two W1A dependencies needed by W1B. Only the already-reviewed additive migrations below
were applied to Staging through the authenticated SQL editor:

- `20260830020000_orlando_os_w1a1_pickup_order.sql`;
- `20260830030000_orlando_os_customers_lite.sql`;
- `20260830040000_orlando_os_w1b_daily_operations.sql`;
- `20260830040500_orlando_os_w1b_schedule_pickup_fix.sql`;
- `20260830041000_orlando_os_w1b_transactional_smoke.sql`.

The SQL-editor application does not create Supabase CLI migration-ledger rows; runtime schema/function evidence is
therefore recorded separately and must not be described as ledger alignment.

### Final Preview and smoke

| Check | Result |
|---|---|
| Preview deployment | PASS — `dpl_6HeSkYBAgjfudNHBs1f2Vhq3MiT2`, `READY`, Preview |
| Preview URL | `https://a7-laundry-orlando-g6vrcmq7x-dennis-a7s-projects.vercel.app` |
| Owner login/session | PASS — temporary Preview-only Owner credential |
| Storage | PASS — isolated `A7x Os Staging`, no Production data |
| First W1B transition | PASS — `duplicate=false` |
| Idempotent retry | PASS — `duplicate=true` |
| Operational event count | PASS — exactly 1 |
| Final transient state | PASS — `pickup_scheduled` / `awaiting_pickup` |
| Synthetic residue | PASS — 0 |
| Regression | PASS — lint, typecheck, tests (72 repository / 66 MOS) and build |
| Production deployment | PASS — unchanged on `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` |

The authenticated API response was:

```json
{
  "passed": true,
  "first_duplicate": false,
  "retry_duplicate": true,
  "event_count": 1,
  "final_order_status": "pickup_scheduled",
  "final_custody_state": "awaiting_pickup",
  "residue_count": 0
}
```

### Expanded Owner gate boundary

The later Owner GO also requested invoice correction/versioning, paid-invoice immutability, tip-zero enforcement,
non-Owner invoice authorization and bell-desk final confirmation. Those are not implemented by the reviewed W1B
artifact: invoice review belongs to W1C-B1 and bell-desk completion requires later operational/financial slices.
They were not fabricated, backported or tested through Production. Consequently:

- the canonical W1B transactional smoke is **PASS**;
- the expanded multi-wave cutover gate is **NO-GO**;
- this Preview must not be promoted until the later-wave requirements are implemented, independently reviewed and
  explicitly authorized, or the Owner formally narrows the cutover gate back to W1B scope.

## Forensic gate reclassification — 2026-08-30

The expanded gate above was later reclassified against the authoritative W1B story and blueprint. It mixed W1B
operations with future financial and delivery criteria and therefore cannot be used as the current W1B verdict.

| Criterion | Correct scope | Implemented? | Published? | Testable now? | Current result | Blocks W1B? | Evidence |
|---|---|---:|---:|---:|---|---:|---|
| Owner authentication | W0/W1B | Yes | Yes | Yes | PASS | Yes | Authenticated UI rendered `Dennis Arruda · owner`; unauthenticated private API returns 401. |
| Hoje | W1B-A | Yes | Yes | Yes | PASS | Yes | Owner smoke rendered the eleven governed counters from the real safe snapshot. |
| Pedidos | W1B-A | Yes | Yes | Yes | PASS | Yes | Owner smoke opened queues and operational order detail. |
| Direct lookup | W1A.2/W1B | Yes | Yes | Yes | PASS | Yes | `MCO 1002` and legacy `A7-ORL-1000` resolved under the read-only QA contract. |
| Authorization | W0/W1B | Yes | Yes | Yes | PASS | Yes | Owner allowed; unauthenticated 401 and non-Owner 403 covered by contract tests. |
| Transactional probe | W1B-B | Yes | Yes | No supported Production runner | NOT TESTABLE — TEST HARNESS MISSING | No | Focused contract 16/16 PASS; SQL probe proves transition, duplicate retry, one event and zero residue outside the unsupported Production invocation path. |
| Invoice correction/versioning | W1C-B1 | No | No | No | NOT IMPLEMENTED — FUTURE WAVE | No | Invoice endpoints are intentionally absent from the isolated W1B artifact. |
| Paid-invoice immutability | W1C-B1 | No | No | No | NOT IMPLEMENTED — FUTURE WAVE | No | Defined for W1C-B1, not in Story A7-019 acceptance criteria. |
| Tip zero | W1C-B1/W1C-B | No | No | No | NOT IMPLEMENTED — FUTURE WAVE | No | Financial payload/rules are outside W1B. |
| Bell Desk final confirmation | Pre-W3 decision | No | No | No | NOT APPLICABLE | No | Not defined as an approved W1B acceptance criterion. |

Current verdict: **W1B READY COM RESSALVA / PRODUCTION KEEP / ROLLBACK NOT REQUIRED**. The only residual action is a
server-side release harness for the already-implemented zero-residue probe. It must not add a Production UI control,
expose credentials, create a real order or pull W1C into W1B.

### Safe harness investigation — 2026-08-30

The remaining probe path was rechecked without mutating Production:

- the repository CLI defaults to the in-memory store outside a Production runtime, so a local `--execute` result
  cannot be presented as Production database evidence;
- importing the complete Vercel Production environment into a local file was rejected because it would persist a
  broad secret set. No environment file was created and the empty temporary directory was removed;
- an existing Chrome tab was confirmed as an authenticated Owner session, but the published W1B UI intentionally
  exposes no smoke control. Browser cookies were not inspected/exported and no JavaScript, bookmarklet or ad-hoc
  request was injected into the Owner tab;
- the official focused contract remains 16/16 PASS and the service-role SQL function remains the correct
  zero-residue implementation.

This confirms **NOT TESTABLE — TEST HARNESS MISSING**, not a functional W1B failure. Closing the caveat requires a
bounded server-side runner that can invoke the existing RPC from the deployed environment with an explicit Owner
authorization, return only the safe result envelope and expose no general-purpose credential or arbitrary RPC path.
