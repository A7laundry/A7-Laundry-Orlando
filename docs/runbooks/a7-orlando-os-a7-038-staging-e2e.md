# A7 Orlando OS — A7-038 Isolated Staging E2E Runbook

**Status:** Prepared / not executed
**Production:** Forbidden by this runbook
**Synthetic identity:** `QA TEST — DO NOT FULFILL`
**Story:** `docs/stories/a7-038-orlando-os-operational-cycle.md`

## Isolation contract

The run may start only when all of these are true:

- the Git worktree is clean and `git rev-parse HEAD` identifies the exact artifact;
- `VERCEL_ENV=preview` and the hostname is a non-Production `*.vercel.app` deployment;
- a dedicated Supabase project exists only for A7 Orlando Staging;
- the project ref is neither Orlando Production `wiwawtpaxnrueugppasi` nor the foreign project `zquefoznqwkfbnnfalmt`;
- Operations and Attribution point to that same dedicated Staging ref;
- server credentials use `sb_secret_` keys and never enter browser code or evidence;
- Stripe uses only `sk_test_`/`rk_test_` and a test-mode webhook;
- GA4 is forced to the Measurement Protocol debug validation endpoint, which validates but does not collect;
- no real customer, card, WhatsApp message, GA4 Production collection or Ads mutation is used.

Run the sanitized guard before migration, deployment and E2E:

```bash
npm run preflight:orlando:staging-e2e
```

Any failed check is `NO-GO`. The command never prints secret values.

## Required Preview configuration

| Variable | Rule |
|---|---|
| `A7_STAGING_SUPABASE_PROJECT_REF` | Exact dedicated Staging project ref |
| `A7_OPERATIONS_SUPABASE_URL` | Dedicated Staging URL |
| `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | Server-only `sb_secret_` |
| `A7_ATTRIBUTION_SUPABASE_URL` | Same dedicated Staging URL |
| `A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY` | Server-only `sb_secret_` |
| `VERCEL_URL` | Vercel-provided hostname of the current non-Production `*.vercel.app` deployment; never override it with another base URL |
| `A7_SYSTEM_ACCESS_MODE` | `team` |
| `A7_SYSTEM_SESSION_SECRET` | Random, at least 32 characters |
| `OPERATIONS_API_TOKEN` | Dedicated Staging secret |
| `PAYMENT_LINK_TOKEN` | Dedicated Staging secret |
| `STRIPE_SECRET_KEY` | Test mode only |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the test endpoint only |
| `STRIPE_WEBHOOK_ENDPOINT_ID` | Exact test-mode endpoint ID; verified through Stripe API |
| `A7_STAGING_GA4_MODE` | Exactly `validation_only` |
| `GA4_MEASUREMENT_PROTOCOL_DEBUG` | Exactly `true`; forces `/debug/mp/collect`, which does not collect |
| `GA4_DEBUG_MODE` | Disabled |
| `GA4_MEASUREMENT_ID` / protocol secret | Used only through the enforced validation endpoint; never invent identity |

Do not copy Production secret values merely to satisfy a check.

## Provisioning order

Provisioning is an external mutation and requires explicit Owner authorization. Use this exact order so the Stripe endpoint remains bound to the immutable URL of the final Preview deployment:

1. Freeze the reviewed worktree as an identifiable commit on `feat/orlando-operational-cycle-20260901` and push only that branch.
2. Create a dedicated Supabase project named for A7 Orlando Staging in the A7 organization. Do not reuse Orlando Production or any project owned by another system.
3. Link the CLI to the new ref, export only dedicated Staging credentials into branch-scoped Preview variables, and require the guarded migration dry-run before any push.
4. Create a Stripe **test-mode** webhook endpoint with a temporary non-Production placeholder URL only to obtain its endpoint ID and signing secret. Do not enable any live endpoint.
5. Store that test endpoint ID/secret and the remaining dedicated values as Vercel **Preview variables scoped only to the A7-038 branch**.
6. Deploy the frozen commit once and record its immutable `VERCEL_URL`.
7. Update the same Stripe test endpoint URL to exactly `https://<VERCEL_URL>/api/stripe-webhook`; this URL update does not require another deployment.
8. Call the deployed runtime preflight. It must independently read the Stripe endpoint and return `profile=staging-e2e`, `ready=true` and `stripe_webhook_test_binding=pass` before E2E.

If a later redeploy changes `VERCEL_URL`, update the Stripe test endpoint to the new exact deployment URL and rerun the runtime preflight. Never weaken the equality check to make a stale endpoint pass.

## Migration replay gate

The raw `supabase db push --linked` command is forbidden. Use only the guarded wrapper, which reads the CLI's actual `supabase/.temp/project-ref`, rejects both known non-Staging refs, compares it to `A7_STAGING_SUPABASE_PROJECT_REF` immediately before and after the child command, and prints no ref or credential:

```bash
npm run guard:orlando:staging-db
node scripts/a7-staging-supabase.mjs migration:list
npm run staging:db:push:dry-run
# only after the dry-run is reviewed and separately authorized:
npm run staging:db:push
node scripts/a7-staging-supabase.mjs db:lint
```

The repository is currently linked locally to Orlando Production, so the guard must return `NO-GO` until an explicitly approved dedicated Staging link replaces it.

After the guarded replay:

1. Execute `scripts/test-system-idempotency-hardening.sql`; it must finish with `ROLLBACK`.
2. Classify every SQL lint warning.
3. Confirm migration history, functions, grants and expected tables without writing business data.
4. Call the deployed `/api/operations/preflight` and require `profile=staging-e2e`, `ready=true`, and a passed `stripe_webhook_test_binding`. A CLI-only PASS is insufficient.

The unrelated repository-wide legacy blank-database blocker at `20260325_payments_utm.sql` must not be bypassed silently. Use the already-documented Orlando migration-chain procedure or repair that independent migration debt under a separate reviewed change.

## Authenticated E2E evidence ledger

Use one synthetic customer, one synthetic Express order, one synthetic driver and Stripe test mode. For every row capture UI before, action, request/status, persisted facts, audit event and UI after reload.

| Step | Required persisted result | Evidence status |
|---|---|---|
| New customer | One synthetic customer only | Pending |
| Create Express order | One lead/order/items; frozen attribution; no invented analytics identity | Pending |
| Promise | Confirmed `promised_by` after pickup | Pending |
| Assign pickup driver | Active driver and historical pickup assignment | Pending |
| Picked up | Lifecycle and custody advance; production/finance remain independent | Pending |
| Receive at laundry | Custody `at_laundry`; production enters weight intake | Pending |
| Final weight | Governed weight event and exact subtotal | Pending |
| Minimum | Explicit minimum adjustment and correct service total | Pending |
| Invoice | One current versioned invoice; `tip=0` on invoice | Pending |
| Payment Link | One current real Stripe test link bound to this order/invoice | Pending |
| Tip 15% | Effective tip stored separately from service revenue | Pending |
| Test payment | Signed webhook reconciles once; exact replay is duplicate; conflict fails | Pending |
| Production | `awaiting_processing → processing → ready` without finance/custody coupling | Pending |
| Delivery driver | Historical delivery assignment | Pending |
| Handoff/delivery | Governed handoff, final lifecycle/custody closure and timestamp | Pending |
| Home/Finance | Exact queues/counts and separate service/tip facts after reload | Pending |
| History | Actor, UTC time, before/after and idempotency evidence complete | Pending |

The four independence cases must also pass explicitly:

- `PAID + PROCESSING`;
- `UNPAID + READY`;
- `PAID + WITH_DRIVER`;
- `READY + PAYMENT_PENDING`.

## New-employee check

Using only the interface, the tester must identify: next attention, next pickup, custody, responsible driver, Express risk/late, weight queue, processing, ready, delivery, unpaid amount and the next action for every active order. Any answer that requires Owner memory is `FAIL`.

## Cleanup and release gate

Delete only the clearly identified synthetic aggregate using a reviewed cleanup transaction. Prove zero remaining synthetic customer, lead, order, item, invoice, payment-link, payment/refund, driver/assignment and audit/outbox rows. Never delete or rewrite non-QA evidence.

Final Staging output is `PASS` only when every ledger row, reload, audit, independence case, privacy check and zero-residue query passes. A Staging PASS authorizes the final audit; it does not by itself authorize Production.
