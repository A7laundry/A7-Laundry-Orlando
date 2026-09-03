# A7 Orlando OS — W3-D Rotas Lite Controlled Production Pilot

**Status:** PREPARED / NOT AUTHORIZED FOR MUTATION  
**Owner decision:** dedicated Staging is not required; validation will be controlled in Orlando Production  
**Database:** `wiwawtpaxnrueugppasi` only  
**Application rollback baseline:** `dpl_142ZWVsbZm9zDvBN2sqDqBQATWGq`

## Scope and boundaries

This procedure replaces only the W3-D Staging E2E gate. It does not authorize a migration or deploy. It never uses
`zquefoznqwkfbnnfalmt`, creates no cloud test database and does not touch a real customer order, Stripe, payment,
refund, WhatsApp, GA4 or Google Ads.

Only these additive migrations may be applied:

1. `20260902018000_orlando_os_w3d_routes_lite.sql`
2. `20260902018001_orlando_os_w3d_route_authority.sql`

Migration `20260830060000_orlando_os_w2_a_whatsapp_drafts.sql` is intentionally absent from Production and forbidden
in this cutover. Never use `supabase db push --include-all`. Build an isolated migration directory from the verified
Production ledger and require `--dry-run` to report exactly the two W3-D migrations above.

## Pre-mutation gate

- linked ref equals `wiwawtpaxnrueugppasi`;
- remote migration ledger is captured read-only;
- isolated dry-run lists exactly `18000` and `18001`;
- current Production deployment and rollback target are recorded;
- candidate commit/tree and clean worktree are recorded;
- lint, typecheck, full tests and build pass on that exact commit;
- the `Rotas` menu remains disabled in the preflight artifact;
- a separate exact Owner GO names database, migrations, artifact, probe and rollback.

Any mismatch is `NO-GO`.

## Controlled Production proof

After the exact GO, DevOps applies only the two migrations and deploys the preflight artifact with normal `Rotas`
navigation still disabled. An authenticated Owner request then calls `/api/system/w3d-smoke` with:

```json
{ "confirm": "W3D_TRANSACTIONAL_SMOKE" }
```

The endpoint is Owner-only, same-origin and submission-bound. Its database authority:

- serializes the probe with an advisory transaction lock;
- creates opaque synthetic driver, contact, lead, order, route and stop fixtures;
- exercises create/retry, add, reorder, ETA, depart, pickup/retry, direct delivery, Bell Desk intermediate handoff,
  governed exception, requeue and route completion;
- invokes the canonical order transition authority rather than writing custody/lifecycle state from the route;
- performs no external or financial adapter call;
- deletes every synthetic route, stop, event, assignment, order, lead, contact and driver before commit;
- fails and rolls the complete request back automatically if an assertion or cleanup check fails.

Required safe response:

```text
passed=true
create_retry_duplicate=true
pickup_retry_duplicate=true
route_completed=true
pickup_event_count=1
delivery_completed=true
bell_desk_intermediate=true
exception_preserved_order=true
exception_requeued=true
residue_count=0
```

## Activation and remote smoke

Only after the transactional proof passes may the exact menu-enabled commit be deployed. The authenticated Owner
smoke verifies `/sistema/routes`, route list/empty state, approved driver list, eligible-order projection, desktop and
exact 390 px behavior, reload, 401 without session and 403 for Operator. It uses no real write because the canonical
write path was already proven transactionally against Production and self-cleaned.

Direct order operation remains available without a route. Existing `/order`, W1B, W1C-A/B, Stripe, webhook,
attribution, WhatsApp and Ads regressions are checked read-only.

## Failure and rollback

On any failed or unproven gate:

1. stop the pilot;
2. roll the application back immediately to `dpl_142ZWVsbZm9zDvBN2sqDqBQATWGq`;
3. leave the additive W3-D schema inert;
4. do not delete append-only evidence or real Production rows;
5. record the failed gate and residue count.

The schema rollback scripts are exceptional only and must not run after any real route evidence exists.
