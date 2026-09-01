# Story A7-020 — A7 Orlando OS W1C-A Item Weight

**Status:** Blocked — Production smoke returned `PGRST202`; application rolled back to W1B

**Created:** 2026-08-30

**Source:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md` §§8.2, 9.5, 17.1, 18 and 21

**Depends on:** A7-019 W1B Daily Operations

## Story

**As the** A7 Orlando Owner,

**I want** to record the actual weight on each per-pound order item,

**so that** the order advances to processing only when every required item has a real, auditable weight.

## Scope lock

Only W1C-A is in scope: actual weight per `lb` item, server-derived item subtotal, completion of the contractual
`order_weighed` event, transition to `awaiting_processing`, private Owner UI, CLI and audit evidence.

W1C-B invoice/versioning, minimum/adjustments, Payment Link, Stripe, payment, delivery, tip, WhatsApp, IA, routes,
customer reconciliation and Production deployment remain unchanged.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Actual weight belongs to the stable order item, not only to the order header. | Blueprint §8.2 |
| FR-02 | Only `lb` items accept actual weight; fixed `unit`/`piece` items never require weighing. | Blueprint §8.2 |
| FR-03 | Item subtotal is derived server-side from the governed price snapshot and confirmed quantity/weight. | Blueprint §§8.2, 12.1 |
| FR-04 | `order_weighed` is emitted once only after every `lb` item has a confirmed actual weight. | Blueprint §8.2 |
| FR-05 | Completed weighing advances lifecycle to `weighed` and production to `awaiting_processing` atomically. | Blueprint §9.5 |
| FR-06 | Partial weighing preserves `awaiting_weight` and visibly lists remaining items. | Blueprint §§8.2, 18 |
| FR-07 | Retry with the same identity returns the prior result; conflicting reuse fails closed. | Blueprint §18.7 |
| FR-08 | QA orders are read-only and historical nulls stay unknown. | A7-019 invariants |
| NFR-01 | CLI/service contract works before UI and UI contains no pricing or state-transition authority. | Constitution I |
| NFR-02 | Owner-only, same-origin POST, signed HttpOnly submission identity and no PII/secrets in URL/analytics/logs. | Blueprint §§6, 16 |
| NFR-03 | Migration is additive, RLS/service-role only, concurrency-safe and reversible without deleting real weight. | Blueprint §21.1 |
| CON-01 | W1C-A never creates or changes invoice, Payment Link, Stripe, payment status, tip or delivery. | Blueprint §17.1 |
| CON-02 | No Production mutation or deploy without a separate explicit GO after gates. | Owner release governance |

## Data contract

Each `a7_orlando_order_items` row gains:

- `actual_lbs` — positive actual weight for `lb` items only;
- `weighed_at` — required together with `actual_lbs`;
- `subtotal` — server-derived item snapshot, never browser supplied;
- `weight_version` — monotonic concurrency/audit version.

Weight history is append-only in `a7_orlando_item_weight_events`, keyed by a unique idempotency identity. The event
stores safe before/after weight facts, actor, reason for corrections and timestamps. It does not store customer PII.

## Transition contract

```text
at_laundry + awaiting_weight
→ record one lb item weight
→ more lb items pending: remain awaiting_weight
→ all lb items weighed: emit order_weighed once + awaiting_processing
```

- Initial weight needs no correction reason.
- Changing an already confirmed weight requires a bounded reason and increments `weight_version`.
- A correction after lifecycle has advanced beyond `weighed` is outside W1C-A and fails closed.
- Fixed-price item subtotal may be displayed as server-derived, but no invoice is created.

## Acceptance criteria

- [x] CLI records one item weight and returns safe completion/progress evidence.
- [x] Detail exposes stable opaque item identity, unit, governed unit price, actual weight, subtotal and timestamp.
- [x] Partial multi-item weighing does not emit `order_weighed` or advance production.
- [x] Final required item emits exactly one `order_weighed` and advances to `awaiting_processing`.
- [x] Fixed-price items reject weight and do not block weighing completion.
- [x] Same retry is idempotent; conflicting reuse and stale version fail closed.
- [x] Weight correction requires reason and remains unavailable after later lifecycle advancement.
- [x] Browser cannot inject price, subtotal, lifecycle, actor or arbitrary item identity.
- [x] QA, unauthorized, wrong-origin and malformed requests fail closed.
- [x] No invoice, payment, Stripe, tip, delivery, WhatsApp, `/order`, GA4 or Ads behavior changes.
- [x] Desktop and 390 px show a concise weight form only when `record_weight` is the next action.
- [x] Migration/rollback dry-run, lint, typecheck, focused tests, full tests and build pass.
- [x] Owner-only transactional release probe exercises the real SQL write twice and proves zero committed residue.
- [x] Production gate is documented and stops before mutation.

## Rollback contract

Primary rollback is application-only. The additive schema remains inert under W1B. Exceptional SQL rollback may
drop W1C-A functions and empty event infrastructure, but must refuse removal of item weight columns after any real
weight or weight event exists.

## File List

- `docs/stories/a7-020-orlando-os-w1c-a-item-weight.md`
- `docs/audits/2026-08-30-orlando-os-w1c-a-item-weight-gate.md`
- `docs/runbooks/A7-ORLANDO-OS-W1C-A-CUTOVER-RUNBOOK-2026-08-31.md`
- `supabase/migrations/20260830050000_orlando_os_w1c_a_item_weight.sql`
- `supabase/migrations/20260830050001_orlando_os_w1c_a_release_probe_repair.sql`
- `supabase/rollbacks/20260830050000_orlando_os_w1c_a_item_weight.rollback.sql`
- `supabase/rollbacks/20260830050001_orlando_os_w1c_a_release_probe_repair.rollback.sql`
- `lib/operational-store.js`
- `lib/system-w1c-a-smoke-service.js`
- `lib/system-order-service.js`
- `lib/system-operations-service.js`
- `scripts/a7-system-operations.mjs`
- `scripts/a7-system-w1c-a-smoke.mjs`
- `scripts/test-system-w1c-a.mjs`
- `scripts/test-system-w1c-a.sql`
- `scripts/verify-orlando-os-release-scope.mjs`
- `scripts/test-system-release-scope.mjs`
- `sistema.js`
- `sistema-w1b.css`
- `api/system/w1c-a-smoke.js`
- `package.json`

## Validation evidence

- `supabase db push --dry-run --include-all`: only migration `20260830050000` would be applied; no remote mutation.
- Isolated PostgreSQL migration smoke: partial/final weight, idempotent retry, correction, fixed-only transition and single `order_weighed` passed.
- Focused W1C-A tests: 10/10 passed, including the Owner-only API and transactional release probe.
- Post-review regression: an exact retry remains idempotent after the order advances beyond the writable weight
  state; SQL now resolves the immutable event before evaluating mutable workflow state.
- PostgreSQL 15 regression: delayed exact retry after `production_state=processing` returns `duplicate=true`, while
  one weight event and one `order_weighed` lifecycle event remain; conflicting key reuse fails closed.
- PostgreSQL 15 release probe: first write `duplicate=false`, exact retry `duplicate=true`, one item-weight event,
  one `order_weighed`, final `weighed + awaiting_processing`, `actual_lbs=5` and `residue_count=0`.
- Exceptional rollback test removed the probe/function/schema on an empty isolated database and preserved the
  evidence-loss guard.
- Current private OS pretests: 71/71 passed, including release-scope isolation.
- Current repository tests: 86/86 passed; protected MOS tests: 67/67 passed.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run validate:structure` and `npm run validate:agents`: passed.
- Authenticated-state UI harness with synthetic QA data: desktop and exact 390 px visual checks passed; temporary harness removed.
- `git diff --check`: passed.

## Production cutover attempt — 2026-08-31

- The authenticated Supabase ledger for Orlando Production `wiwawtpaxnrueugppasi` ended at
  `20260830041000`; the isolated dry-run contained only `20260830050000_orlando_os_w1c_a_item_weight.sql`.
- Migration `20260830050000` was applied successfully and remains as an additive, inert schema extension.
- The isolated W1B + W1C-A artifact was published as `dpl_Fu8fp328bEEiaX5Pmgqqm8pbDj4F` and redeployed
  after the authorized Owner-password rotation as `dpl_JvPy5uYosXyGLZST2LXen28AF2kK`.
- Owner authentication passed, but the transactional smoke stopped at the storage boundary with HTTP 503 and
  PostgREST code `PGRST202`; no financial flow ran and the smoke RPC did not return a committed result.
- Per the pre-authorized stop rule, the application was rolled back to W1B. The final W1B redeploy with the
  rotated Owner credential is `dpl_9SnpipfkSBkKbqBCyTAStgLaVDLM`, Ready and aliased to `a7laundry.com`.
- Public probes after rollback: `/`, `/order` and `/sistema` HTTP 200; unauthenticated `/api/system/today` HTTP 401.
- The rotated Owner login passed on W1B. The new password was copied to the Owner clipboard and all temporary
  runner files and in-memory credential bindings were removed.
- W1C-A is not complete and must not be promoted again until `PGRST202` is diagnosed and a new gate/GO is issued.

## `PGRST202` diagnosis and local repair — 2026-08-31

- The authenticated CLI remained linked to the official Orlando project `wiwawtpaxnrueugppasi`; no other
  Supabase project was queried or changed.
- The remote ledger confirms `20260830050000` is applied.
- A read-only `pg_dump` of the remote `public` schema confirms the W1C-A columns, event table, order/snapshot RPCs
  and `a7_orlando_w1c_a_record_item_weight(...)` exist with `service_role` grants.
- The same authoritative schema export confirms
  `a7_orlando_w1c_a_transactional_smoke(text,text,uuid)` is absent. This directly explains PostgREST `PGRST202`;
  a schema-cache reload alone cannot expose a function that does not exist.
- Repository diff proves the release probe and the final retry-first ordering were added locally after the version
  of `20260830050000` recorded by Production. The applied migration is not rewritten or replayed.
- Additive repair `20260830050001` now creates the missing service-role-only probe, installs the final retry-first
  weight function, and requests a PostgREST schema reload. Its rollback drops only the probe and leaves the safer
  retry behavior in place.
- The repair is local-only. No database mutation, W1C-A deployment or smoke was executed during diagnosis.
- Isolated validation restored the read-only Production schema dump, applied `20260830050001`, and executed the
  probe through PostgREST: HTTP 200, first write non-duplicate, retry duplicate, one weight event, one lifecycle
  event, final `weighed + awaiting_processing`, and `residue_count=0`.
- Post-repair gates passed: focused W1C-A 10/10, release-scope 2/2, lint, typecheck, full `npm test`, build,
  structure validation and agent validation (warnings only, zero errors).
- An isolated authenticated remote dry-run reports exactly one pending migration:
  `20260830050001_orlando_os_w1c_a_release_probe_repair.sql`; W2, W3 and W1C-B1 are absent.

## Production repair attempt — 2026-08-31

- Owner authorized only `20260830050001`, W1C-A redeploy, Owner smoke without charging, and rollback to the exact
  W1B deployment if any gate failed.
- Final remote dry-run reported only `20260830050001`; the migration was applied successfully to
  `wiwawtpaxnrueugppasi` and is present in the remote ledger. W2, W3 and W1C-B1 remain unapplied.
- W1C-A source deployment `dpl_JvPy5uYosXyGLZST2LXen28AF2kK` was redeployed with current Production secrets and
  reached Ready.
- The smoke stopped at its first gate: Owner login returned HTTP 401 because the clipboard no longer contained the
  active Owner password. No submission identity was created, the W1C-A RPC was not called and no synthetic or
  financial row was written.
- Per the explicit stop rule, the application was immediately rolled back by redeploying W1B
  `dpl_9dh6YN8infLK6FP3E3AcyYCaVLXu`. Final deployment `dpl_7ugBe2i12dSC2fM8Nx8VAfSf2FtS` is Ready and owns
  `a7laundry.com`; `/`, `/order` and `/sistema` return HTTP 200.
- The additive W1C-A schema and repair remain inert under W1B. A new credential-validation gate is required before
  any further W1C-A cutover attempt.
