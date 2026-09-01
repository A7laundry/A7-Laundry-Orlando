# A7 Orlando OS — W1C-A Item Weight Gate

**Date:** 2026-08-31
**Scope:** actual weight per per-pound order item only
**Environment changed:** local workspace only
**Supabase Production changed:** no
**Vercel Production changed:** no
**Gate verdict:** implementation `GO`; Production cutover awaits an exact W1C-A Owner authorization

## Release boundary

W1C-A adds the smallest usable weighing step to the laundry operation:

```text
picked_up + at_laundry + awaiting_weight
→ record actual weight on each lb item
→ derive item subtotal from the governed stored price
→ all lb items complete
→ emit order_weighed once
→ weighed + awaiting_processing
```

It does not create an invoice, calculate the final payable total, enforce the order minimum, create a Payment Link,
contact Stripe, change payment state, deliver an order, send WhatsApp messages, alter `/order`, emit analytics or
change Google Ads.

## Gate evidence

| Gate | Evidence | Result |
|---|---|---|
| Story and traceability | Story A7-020 maps every behavior to the approved operations blueprint and W1B invariants. | PASS |
| CLI-first | `scripts/a7-system-operations.mjs` accepts item ID, actual weight and expected version before UI use. | PASS |
| Additive migration | Four nullable/default-safe item columns, one private append-only evidence table, private service-role RPCs and one fixed-only transition trigger. | PASS |
| Remote migration dry-run | `supabase db push --dry-run --include-all` reports only `20260830050000_orlando_os_w1c_a_item_weight.sql`; nothing was pushed. | PASS |
| SQL behavior | Isolated PostgreSQL smoke passed partial/final weighing, one lifecycle event, retry, correction, fixed-only flow and pricing derivation. | PASS |
| Production-safe release harness | Owner-only service-role RPC calls the real weight function twice, validates state/events and deletes all synthetic rows in one transaction. | PASS |
| Idempotency/concurrency | Stable idempotency key, row locking and monotonic `weight_version`; retry returns prior result and stale/conflicting writes fail closed. | PASS |
| Authorization | Owner-only transition; QA, non-Owner, malformed item ID and wrong origin fail closed. | PASS |
| Price authority | Browser submits no unit price or subtotal; the server derives subtotal from the stored order-item snapshot. | PASS |
| PII/secrets | Weight evidence contains opaque IDs and weight facts only; no customer PII, secret, URL parameter, analytics payload or diagnostic log was added. | PASS |
| Finance isolation | No invoice/payment/refund/Stripe tables, handlers or settings are written by W1C-A. | PASS |
| Regression suite | Current private OS pretests 71/71, repository tests 86/86 and protected MOS tests 67/67 passed. | PASS |
| Repository quality | Lint, typecheck, build, structure and agent validation passed; `git diff --check` passed. | PASS |
| Visual desktop | Synthetic authenticated Owner harness showed the item list, progress, correction reason and pending weight without duplicate action controls. | PASS |
| Visual 390 px | Exact 390 × 844 viewport showed full inputs/buttons and readable item progress without horizontal form overflow. | PASS |

The repository command `npm run sync:ide:check` is not defined in the current package manifest. This is an existing
tooling availability gap, not a W1C-A runtime or quality failure; no substitute mutation was made.

## Tested invariants

1. A partial weight does not advance lifecycle or production.
2. The final required item emits exactly one `order_weighed`.
3. A duplicate identical request does not create another weight or lifecycle event.
4. Reusing an idempotency key with different facts fails closed.
5. A stale `weight_version` fails closed.
6. A correction requires a bounded reason and cannot silently rewrite history.
7. A fixed-price item rejects weight and does not block a fixed-only order in `awaiting_weight`.
8. Injected browser `unit_price` or `subtotal` is ignored.
9. QA orders remain read-only.
10. Historical unknown weights remain null rather than zero.

## Rollback readiness

Primary rollback is application-only:

1. restore the last verified W1B application artifact;
2. confirm `/sistema`, Today, Orders and W1B transitions operate normally;
3. leave the additive W1C-A schema inert;
4. do not delete weight evidence.

The exceptional SQL rollback may be used only before any real weight exists. It refuses to remove W1C-A columns or
infrastructure when an actual weight or item-weight event exists. That guard prevents loss of operational evidence.

## Cutover prerequisites

Current remote evidence confirms that W1B is live on `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`. That deployment is the
primary application rollback target for W1C-A. The older Clientes Lite deployment
`dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` remains Ready as a secondary recovery point. The official Orlando Supabase
ledger ends at W1B `20260830041000`; W1C-A `20260830050000` remains local-only.

The Owner chose an Owner-only Production pilot without a separate Staging environment. Therefore no unrelated
Supabase project may be used as Preview. Before a W1C-A Production mutation:

1. build and verify an isolated W1B + W1C-A artifact that excludes W1C-B1, W2 and W3;
2. verify the migration dry-run contains only `20260830050000`;
3. receive a new explicit Owner GO naming W1C-A, Production, migration, deployment, smoke and rollback;
4. apply migration first, then deploy the exact isolated application artifact directly to the controlled pilot;
5. execute the authenticated Owner transactional probe; it uses an internal non-QA synthetic fixture because QA
   orders are contractually read-only, deletes it before commit and returns only safe aggregate evidence;
6. roll back the application immediately if a W1C-A gate fails; keep the additive schema inert;
7. never remove schema after a real item weight or weight event exists.

## Isolated application assembly manifest

The current repository contains later local slices in the same files as W1C-A. Copying the full worktree or copying
these files wholesale would silently publish W1C-B1, W2-A or W3-A. The W1C-A release must therefore be assembled as
a semantic overlay on the exact deployed W1B source.

Verified W1B application base:

| File | SHA-256 |
|---|---|
| `sistema.js` | `6caf39906487a60b970722e53ecc2a75f576fdc70c040c48897df54d948eff1c` |
| `lib/system-operations-service.js` | `06e8729feeb706b9f43006f41bbe8a81f9d1bd4ce8f2a5750192e0f33864d4f6` |
| `lib/operational-store.js` | `97dfec69a4cf02762954a94109aaab8bbc4434d41472775419e2da8bd5475886` |
| `package.json` | `db3bca4e8a39ed8c461a893d588df144e7aad417cfdd7fbd2c51f0a6552d3c2b` |

Safe whole-file additions for this slice:

- `supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql` in the database release workdir only;
- `supabase/rollbacks/20260830050000_orlando_os_w1c_a_item_weight.rollback.sql` as exceptional rollback evidence;
- `scripts/test-system-w1c-a.mjs` for release validation, not runtime authority.
- `api/system/w1c-a-smoke.js`, `lib/system-w1c-a-smoke-service.js` and
  `scripts/a7-system-w1c-a-smoke.mjs` as the Owner-only release harness.

Patch-only application files:

| File | Include only | Explicitly exclude |
|---|---|---|
| `lib/system-order-service.js` | nullable item weight/subtotal/version initialization | known-customer reuse and every W3-A branch |
| `lib/system-operations-service.js` | safe item facts, weight progress/editability, `record_weight` validation/dispatch | invoice/message authority and later actions |
| `lib/operational-store.js` | item-weight memory behavior, W1C-A Supabase adapters and the zero-residue probe adapter | invoice, message-draft and known-customer RPCs/records |
| `scripts/a7-system-operations.mjs` | bounded item/weight/version/reason CLI arguments | invoice/message/customer commands |
| `sistema.js` | item progress, weight form and `record_weight` request fields | invoice UI, message UI and known-customer reuse UI |
| `sistema-w1b.css` | `.weight-*` rules only | `.invoice-*`, `.message-*` and unrelated later-wave selectors |
| `package.json` | W1C-A syntax/test and smoke CLI registration only | W1C-B1, W2-A and W3-A scripts/files |

The following W1B endpoints are byte-identical between the deployed base and the current worktree and must not be
rewritten for W1C-A: `api/system/operational-orders.js`, `api/system/operation-draft.js` and
`api/system/today.js`.

Mandatory negative artifact checks before deploy:

- no `api/system/order-invoices.js`, `api/system/invoice-draft.js`, `api/system/order-messages.js` or
  `api/system/message-draft.js` beyond what is already absent from the W1B artifact;
- no `lib/system-invoice-service.js` or `lib/system-message-service.js`;
- no W2/W3 migrations and no `20260830080000` invoice migration;
- no `review_invoice`, `void_invoice`, `message_draft`, `customer_ref` reuse or Cloud API send behavior in the
  deployed bundle;
- `vercel.json` remains unchanged; Vercel discovers the new `/api/system/w1c-a-smoke` function under the existing
  private `/api/system/(.*)` headers rule.

At this checkpoint the temporary application candidate remains byte-identical to the W1B base. No W1C-A overlay was
applied because candidate construction itself awaits the exact W1C-A authorization. The isolated database workdir
continues to dry-run exactly migration `20260830050000` and nothing else.

The cutover procedure and stop/rollback gates are fixed in
`docs/runbooks/A7-ORLANDO-OS-W1C-A-CUTOVER-RUNBOOK-2026-08-31.md`.

## Final verdict

**W1C-A local evidence passed, but the 2026-08-31 Production smoke failed with PostgREST `PGRST202`.** The
application was rolled back to W1B; migration `20260830050000` remains additive and inert. W1C-A is blocked pending
root-cause diagnosis and a new explicit Production GO.

### Root-cause update — 2026-08-31

Read-only inspection of the official Orlando database `wiwawtpaxnrueugppasi` proved that the migration ledger
contains `20260830050000` and the operational W1C-A schema exists, but
`public.a7_orlando_w1c_a_transactional_smoke(text,text,uuid)` does not. The missing database function—not a stale
PostgREST cache—is the direct cause of `PGRST202`.

The source file for the already-recorded migration contains later uncommitted additions: the release probe and a
retry-first idempotency correction. Production therefore received an earlier version of that timestamp. The
applied migration will remain immutable. Local additive repair
`20260830050001_orlando_os_w1c_a_release_probe_repair.sql` installs only the missing/final W1C-A database contract,
restores service-role-only grants and requests a PostgREST schema reload. It is **not applied** pending validation
and a new explicit Production GO.

Local repair validation used an isolated Supabase instance on dedicated ports and a read-only dump of the current
Production `public` schema. Applying `20260830050001` succeeded; the same RPC through PostgREST returned HTTP 200
with `passed=true`, `retry_duplicate=true`, `residue_count=0`, `final_order_status=weighed` and
`final_production_state=awaiting_processing`. Focused tests, release-scope tests, lint, typecheck, full tests, build
and repository validations passed. Production remains unchanged and W1C-A remains blocked until a new explicit GO.
An isolated `supabase db push --dry-run --include-all` against the linked Orlando project reports only
`20260830050001_orlando_os_w1c_a_release_probe_repair.sql` would be pushed.

### Production repair attempt and second rollback — 2026-08-31

- `20260830050001` was the only migration in the final dry-run, was applied successfully to
  `wiwawtpaxnrueugppasi`, and is recorded in the remote ledger.
- The authorized W1C-A artifact was redeployed and reached Ready, but the Owner smoke failed closed at login with
  HTTP 401 because the clipboard no longer held the active password.
- The transactional smoke endpoint and database RPC were not reached; no synthetic, operational or financial row
  was created.
- Application rollback executed immediately. Final W1B deployment
  `dpl_7ugBe2i12dSC2fM8Nx8VAfSf2FtS` is Ready on `a7laundry.com`; public `/`, `/order` and `/sistema` are HTTP 200.
- W1C-A remains blocked on credential revalidation, while its additive database contract remains inert under W1B.

## Production attempt and rollback — 2026-08-31

- Official database: `wiwawtpaxnrueugppasi`.
- Applied migration: only `20260830050000_orlando_os_w1c_a_item_weight.sql`.
- W1C-A deployment: `dpl_Fu8fp328bEEiaX5Pmgqqm8pbDj4F`; credential-refresh redeploy:
  `dpl_JvPy5uYosXyGLZST2LXen28AF2kK`.
- Authenticated Owner smoke: **FAIL**, HTTP 503, PostgREST `PGRST202` at the storage/RPC boundary.
- Financial/Stripe flow: not executed.
- Application rollback: executed. Final W1B deployment with rotated Owner credential:
  `dpl_9SnpipfkSBkKbqBCyTAStgLaVDLM` (`Ready`, `a7laundry.com`).
- Post-rollback health: `/`, `/order`, `/sistema` HTTP 200; unauthenticated `/api/system/today` HTTP 401;
  rotated Owner login PASS.
- Temporary runner and credential material: removed; password retained only in the Owner clipboard.

## Read-only runtime refresh — 2026-08-31

- `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP` remains `Production / Ready` and owns `a7laundry.com`.
- rollback `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B` remains `Production / Ready`.
- `/`, `/order` and `/sistema` return HTTP 200; unauthenticated `/api/system/today` returns the required HTTP 401.
- the current runtime did not provide an authenticated Supabase CLI session, so the official migration ledger was
  not reasserted from a weaker source. The last authenticated evidence ends at `20260830041000`; a new ledger read
  is mandatory immediately before any authorized migration.
- no Vercel alias, Supabase row/schema, Stripe, WhatsApp, GA4 or Google Ads state changed during this refresh.

## Exact authorization required for the next mutation

```text
Autorizo preparar o artefato isolado W1B + W1C-A, aplicar exclusivamente a migration
`20260830050000` no Supabase Orlando Production `wiwawtpaxnrueugppasi`, publicar somente W1C-A em
`a7laundry.com` e executar smoke Owner sem cobrança ou fluxo financeiro. Se qualquer gate W1C-A falhar,
autorizo rollback imediato da aplicação para `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`, mantendo a migration
aditiva inerte. Não autorizo W1C-B1, W2 ou W3 neste cutover.
```

This wording names the exact migration, official database, application scope, smoke, rollback and excluded waves.
No candidate build, migration, deployment or alias change begins before this authorization appears in the active
conversation.

### Post-gate idempotency correction — 2026-08-30

A final source review found that the SQL RPC evaluated the current workflow state before resolving an exact prior
idempotency event. A legitimate network retry could therefore be rejected after processing advanced, despite the
original weight already being committed. The local migration now verifies the locked order/item and resolves an
exact prior event before checking whether a new write is currently allowed. Conflicting key reuse still fails
closed. A focused regression covers the same retry after advancement and proves one weight event and one
`order_weighed` event only. `scripts/test-system-w1c-a.sql` repeats the contract against isolated PostgreSQL 15 and
rolls back its complete synthetic fixture. Production was not changed.

## Current validation refresh — 2026-08-30

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- private OS pretest: 67/67 PASS.
- repository suite: 86/86 PASS; protected MOS suite: 67/67 PASS.
- focused W1C-A suite: 10/10 PASS.
- isolated release-scope verifier: 2/2 PASS; it rejects future-wave files/symbols and Vercel routing drift.
- isolated PostgreSQL 15 delayed-retry and release-probe regressions: PASS; the probe returned one weight event,
  one lifecycle event and zero residue; exceptional rollback removed the probe; temporary server stopped.
- `npm run build`: PASS.
- `git diff --check`: PASS.
- current Supabase ledger: aligned through `20260830041000`; W1C-A remains pending and no remote mutation occurred.
- isolated release workdir dry-run: PASS; exactly `20260830050000_orlando_os_w1c_a_item_weight.sql` would be pushed.
