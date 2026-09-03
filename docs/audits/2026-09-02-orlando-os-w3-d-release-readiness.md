# A7 Orlando OS — W3-D Rotas Lite Release Readiness

**Date:** 2026-09-02  
**Verdict:** `PRODUCTION READY` — controlled Production pilot passed; rollback not required
**Preflight / activation:** `24a8099` / `bbae7c6`

## Authoritative state

- Branch `feat/orlando-w3d-routes-lite` contains the exact released activation commit `bbae7c6`.
- `a7laundry.com` resolves to ready Production deployment `dpl_E6piJ19UEuHd3C2GLfxYQj9R6cY1`.
- The private Owner/Manager `Rotas` area is live; unauthenticated route reads fail with HTTP 401.
- Supabase project `wiwawtpaxnrueugppasi` is the linked Orlando Production database.
- Project `zquefoznqwkfbnnfalmt` belongs to another system and remains forbidden.
- The Owner explicitly replaced the dedicated Staging gate with a controlled Production pilot. No cloud test
  database will be created or reused.
- W3-B remains Draft. The Owner explicitly authorized the W3-D-before-W3-B sequencing exception for this release.

## Gate evidence

| Gate | Result | Evidence |
|---|---|---|
| Architecture reuse | PASS | Route authority calls the existing W1B/W1C-B3 transition function; route schema has no lifecycle, custody, production or finance state. |
| Route core | PASS (local) | Create, active driver, eligible stops, reorder/reload persistence, optional ETA, start, cancel, complete and history are covered by service and SQL probes. |
| Pickup/custody | PASS (local) | Transactional SQL and two-session concurrency probe produced one canonical pickup, one route result and `with_driver_pickup`. |
| Delivery/Bell Desk | PASS (local) | Direct delivery and intermediate Bell Desk handoff reuse the canonical transition and preserve explicit final confirmation. |
| Exception/requeue | PASS (local) | Exception leaves the order unchanged, releases the route leg and the pickup can be assigned to a later route. |
| Idempotency/concurrency | PASS (local) | Exact retry is duplicate-safe; competing Owner/Manager pickup produced one success and one updated-state rejection. |
| RBAC/privacy | PASS (local) | Owner/Manager allowed, unauthenticated 401, Operator 403; no route secret or protected value in public logs/URLs. |
| Desktop/exact 390 px | PASS (local) | No horizontal document overflow; next stop and stop actions are reachable. |
| Repository gates | PASS | Lint, typecheck, all 169 OS tests, full repository suite, MOS 67/67, build and diff check pass. |
| Controlled Production plan | PASS | Owner-only, same-origin, submission-bound transactional probe returned `ok=true`; all required assertions and `residue_count=0` are mandatory before that response. |
| Production-schema replay | PASS | Exact Production schema was replayed without data locally; both W3-D migrations and the transactional probe passed with `residue_count=0`; the disposable database and dump were removed. |
| W3-B → W3-D order | PASS BY EXCEPTION | Owner explicitly authorized W3-D before W3-B without expanding either scope. |
| Immutable remote artifact / smoke | PASS | Preflight `24a8099` → `dpl_5DD7TwBFH6c5jK2fkgdFnNVECZyM`; activation `bbae7c6` → `dpl_E6piJ19UEuHd3C2GLfxYQj9R6cY1`; Owner and public-boundary smokes passed. |

## Final audit — current evidence

1. Second lifecycle created? **NO, proven locally.**
2. Driver system duplicated? **NO, canonical driver directory/assignment reused.**
3. Pickup confirmation duplicated? **NO, canonical transition reused and concurrency probe passed.**
4. Bell Desk/delivery duplicated? **NO, canonical W1C-B3 transition reused.**
5. Order operable without route? **YES; `/order` remained HTTP 200 and no route was required or created.**
6. Retry idempotent? **YES, proven locally.**
7. Mobile operable? **YES; Production returned `innerWidth=390` and `scrollWidth=390` with the route state visible.**
8. Owner authorized? **YES, server-side.**
9. Manager authorized? **YES, server-side.**
10. Unauthorized user blocked? **YES, 401/403 proven.**
11. History contains actor/timestamp? **YES, database audit rows; UI shows role/time.**
12. Regression in prior flows? **None found; `/order` and `/sistema` returned 200 and no external adapter was invoked.**

## Release outcome

The exact Owner GO authorized the Production-only pilot, the W3-D-before-W3-B exception, migrations
`20260902018000` and `20260902018001`, preflight `24a8099`, activation `bbae7c6` and rollback
`dpl_142ZWVsbZm9zDvBN2sqDqBQATWGq`. The remote ledger, authenticated transactional probe, private UI, 390 px layout
and public authorization boundary passed. No real order, charge, refund, message, Stripe or advertising mutation was
performed; rollback was not required.
