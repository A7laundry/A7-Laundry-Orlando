# A7 Orlando OS — W0 + W1A Production Gate

**Date:** 2026-08-30
**Scope:** W0 + W1A only
**Production mutation during pre-deploy gate:** none
**Decision:** `GO — CONTROLLED OWNER-ONLY PILOT`
**Execution status:** `DEPLOYED / SMOKE PASS`

## Executive gate

The reviewed slice is ready for the authorized controlled Production mutation. The release must use the
isolated artifact prepared from git baseline `d832c4a`; deploying the full dirty workspace is forbidden.

| Gate | Result | Evidence |
|---|---|---|
| Production baseline | PASS | Vercel deployment `dpl_BFVCQnpjrHMP4SJww7qVd3x55sV4`, Ready |
| Migration dependency ledger | PASS | Local/remote aligned through `20260829100000` |
| Pending migration isolation | PASS | `supabase db push --dry-run` lists only `20260830010000` |
| Additive migration | PASS | one sequence, three tables and one new RPC; no drop/truncate/rename/data rewrite |
| Reversibility | PASS | prior deployment recorded; inert-schema rollback primary; guarded schema rollback prepared |
| Owner-only access | PASS locally | Production defaults/fails closed to `owner_only`; Operator login/session rejection test |
| Existing public flow isolation | PASS | protected endpoint sources unchanged; shared store compatibility suite passed |
| Isolated deployment artifact | PASS | contains current eight baseline functions + seven `/api/system` functions; no `/api/whatsapp` |
| PII/secrets | PASS | browser boundary tests and artifact secret scan returned no credential pattern |
| Local quality gates | PASS | lint, typecheck, full tests, build and diff check all passed |

## Migration review

Production project `A7xbusinessOS` (`wiwawtpaxnrueugppasi`) contains all dependencies through:

`20260829100000_orlando_lead_idempotency_concurrency.sql`

The remote-only migration was fetched into the repository for review. It is an additive concurrency-safe
replacement of the existing `a7_orlando_create_lead` function and is already applied remotely. It does not
need to be replayed.

Only `20260830010000_orlando_os_w1a_manual_orders.sql` is pending. It:

- creates `a7_orlando_order_number_seq`;
- creates `a7_orlando_order_items`, `a7_orlando_manual_order_requests` and
  `a7_orlando_operator_audit`;
- enables RLS and grants server-only access;
- creates the new `a7_orlando_create_manual_order` RPC;
- reuses existing customer, lead, qualification, acceptance, attribution snapshot and outbox contracts;
- writes no existing row unless an authenticated Owner confirms a valid manual sale.

Foreign-key `ON DELETE` clauses define referential behavior only; the migration itself issues no delete.

## Existing-flow isolation

No source change is included for:

- `api/order-intake.js` or public `/order`;
- `api/create-payment-link.js`, `api/stripe-session.js` or `api/stripe-webhook.js`;
- Google Ads configuration, goals, campaigns or tracking;
- WhatsApp APIs, webhooks, bridge or automations.

The only shared runtime file changed is `lib/operational-store.js`, extended with W1A methods and the
backwards-compatible Supabase key-header adapter. Existing lifecycle/payment methods are unchanged.
Operational, Stripe, attribution and `/order` compatibility tests all passed.

Read-only Production baseline probes before release:

- `/`: HTTP 200;
- `/order`: HTTP 200;
- `GET /api/order-intake`: HTTP 405 (expected method guard);
- `GET /api/stripe-webhook`: HTTP 405 (expected method guard);
- `/sistema`: HTTP 404 before release.

## Owner-only and privacy controls

- Production access mode is `owner_only` by default and will also be set explicitly.
- `A7_SYSTEM_USERS_JSON` will contain one Owner record only.
- An Operator credential or an already signed Operator session is rejected in Owner-only mode.
- Session and idempotency tokens use Secure, HttpOnly, SameSite=Strict `__Host-` cookies.
- `/sistema` and `/api/system/*` are noindex, no-store and protected server-side.
- The system shell contains no acquisition tracking, `dataLayer`, GA tag or browser storage.
- Raw passwords, Supabase keys, PII and technical order/lead IDs are not exposed in URLs or browser state.

## Automated evidence

| Command/gate | Result |
|---|---|
| W0/W1A focused tests | PASS — 9/9 |
| Main Node test group | PASS — 80/80 |
| MOS test group | PASS — 66/66 |
| Attribution/tracking/Stripe/Ads validators | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| isolated `vercel build --prod` | PASS |
| isolated output secret scan | PASS |

## Isolated release artifact

The temporary release worktree is based on `d832c4a` and overlays only W0/W1A runtime files. Its Vercel
output contains:

- the eight functions already present in Production;
- seven new `/api/system/*` functions;
- `/sistema` static assets, rewrite and security headers.

It explicitly contains no `api/whatsapp` output. Unrelated dirty-worktree files, audit drafts, Ads assets and
WhatsApp work are not part of this release.

## Rollback readiness

Primary rollback target: `dpl_BFVCQnpjrHMP4SJww7qVd3x55sV4`.

Primary action is deployment rollback and disabling the three `/sistema` variables. The additive schema
stays inert. Exceptional schema cleanup uses
`supabase/rollbacks/20260830010000_orlando_os_w1a_manual_orders.rollback.sql`, which refuses execution if
W1A records exist.

## Authorized next mutation

After this GO is acknowledged:

1. apply only migration `20260830010000`;
2. create `A7_SYSTEM_ACCESS_MODE=owner_only`, one Owner user and a new session secret;
3. deploy only the isolated prebuilt artifact;
4. run unauthorized, Owner login, headers, health, order creation and idempotency smoke tests;
5. create at most one clearly identified non-financial QA aggregate if needed;
6. report URL, login, order, idempotency, authorization, PII/secrets and rollback state.

No W1B+, Stripe, WhatsApp, Google Ads, `/order`, automation or financial mutation is authorized.

## Post-deploy execution evidence

The Owner acknowledged the GO and the controlled release completed on 2026-08-30.

| Check | Result |
|---|---|
| Applied migration | `20260830010000` only; local/remote ledger aligned |
| Production deployment | `dpl_8qmyK47SY5AX96cyzM4qu5jzYSNa` — Ready |
| Production URL | `https://a7laundry.com/sistema` |
| Access configuration | one Owner; `owner_only`; no Operator user created |
| Unauthenticated private API | PASS — HTTP 401 |
| Owner login | PASS |
| Authenticated health | PASS — auth/storage ready and `owner_only` |
| Security headers | PASS — no-store, noindex, CSP, frame denial |
| QA order | `A7-ORL-1000` — explicitly synthetic/do-not-fulfill |
| Idempotent retry | PASS — same order number, no duplicate aggregate |
| Safe lookup | PASS |
| UUID/secret response scan | PASS |
| Financial behavior | NOT EXECUTED — no invoice, Payment Link, payment or delivery |
| Public home and `/order` | PASS — HTTP 200 after cutover |
| Order-intake/Stripe method guards | PASS — expected HTTP 405 |
| WhatsApp expansion | ABSENT — `/api/whatsapp/health` remains HTTP 404 |

The generated Owner password was never printed or stored in a repository/temp file; it was copied directly
to the Owner's local clipboard after the successful smoke. The prior deployment
`dpl_BFVCQnpjrHMP4SJww7qVd3x55sV4` remains the immediate application rollback target.

The Owner password was rotated on request after the initial release. The same isolated artifact was
redeployed as `dpl_8qmyK47SY5AX96cyzM4qu5jzYSNa`; the new login passed and the replacement password was
copied directly to the local clipboard without being printed or persisted.

## Post-deploy UI state correction

The authenticated `/sistema` view initially remained below the hidden login container because the
author CSS `display: grid` declaration overrode the HTML `hidden` presentation rule. The corrective
release added a narrowly scoped `[hidden] { display: none !important; }` state stylesheet and a focused
regression assertion. No schema, secret, Stripe, WhatsApp, Google Ads or `/order` behavior changed.

| Check | Result |
|---|---|
| Corrective deployment | `dpl_6Vm1noZmLtevwLAHd1Bhf37Axpdw` — Ready |
| Production alias | `https://a7laundry.com` |
| Focused W0/W1A tests | PASS — 10/10 |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Live state stylesheet | PASS — HTTP 200, no-store |
| Authenticated login container | PASS — hidden, `display: none`, height 0 |
| Authenticated system container | PASS — visible at viewport top |
| Browser console | PASS — no errors |
