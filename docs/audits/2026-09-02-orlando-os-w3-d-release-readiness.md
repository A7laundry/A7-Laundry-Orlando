# A7 Orlando OS — W3-D Rotas Lite Release Readiness

**Date:** 2026-09-02  
**Verdict:** `PRE-GO READY` — controlled Production procedure prepared; no remote mutation authorized
**Candidate commit/tree:** to be frozen after the Production probe hardening commit

## Authoritative state

- Branch `feat/orlando-w3d-routes-lite` is clean at the candidate commit above.
- `a7laundry.com` resolves to ready Production deployment `dpl_142ZWVsbZm9zDvBN2sqDqBQATWGq`.
- The published `/sistema.html` does not contain the W3-D route navigation or stylesheet markers. Rotas is not live.
- Supabase project `wiwawtpaxnrueugppasi` is the linked Orlando Production database.
- Project `zquefoznqwkfbnnfalmt` belongs to another system and remains forbidden.
- The Owner explicitly replaced the dedicated Staging gate with a controlled Production pilot. No cloud test
  database will be created or reused.
- W3-B remains Draft. It is not a W3-D runtime dependency, but the documented release order requires an explicit
  Owner/architecture exception before W3-D can precede it.

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
| Controlled Production plan | PASS (prepared) | Owner-only, same-origin, submission-bound transactional probe covers canonical route actions and deletes all synthetic rows before commit. |
| Production-schema replay | PASS | Exact Production schema was replayed without data locally; both W3-D migrations and the transactional probe passed with `residue_count=0`; the disposable database and dump were removed. |
| W3-B → W3-D order | BLOCKED | W3-B is still Draft and no explicit release-order exception is recorded. |
| Immutable remote artifact / smoke / PR / merge | PENDING | Requires final gates and a separate exact GO; no remote mutation has occurred. |

## Final audit — current evidence

1. Second lifecycle created? **NO, proven locally.**
2. Driver system duplicated? **NO, canonical driver directory/assignment reused.**
3. Pickup confirmation duplicated? **NO, canonical transition reused and concurrency probe passed.**
4. Bell Desk/delivery duplicated? **NO, canonical W1C-B3 transition reused.**
5. Order operable without route? **YES in code/regression tests; remote post-cutover proof pending.**
6. Retry idempotent? **YES, proven locally.**
7. Mobile operable? **YES locally at exact 390 px; controlled Production read smoke pending.**
8. Owner authorized? **YES, server-side.**
9. Manager authorized? **YES, server-side.**
10. Unauthorized user blocked? **YES, 401/403 proven.**
11. History contains actor/timestamp? **YES, database audit rows; UI shows role/time.**
12. Regression in prior flows? **None in the full local suite; remote post-cutover smoke pending.**

## Required decision before any mutation

The environment decision is complete: controlled Production replaces Staging. The remaining sequencing decision is
an explicit Owner exception allowing W3-D before Draft W3-B. After the final repository gates and immutable artifact
are recorded, the exact migration list, probe, deployment and rollback target require a separate GO.
