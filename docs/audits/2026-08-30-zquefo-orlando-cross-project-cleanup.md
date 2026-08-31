# Cross-project cleanup — `zquefoznqwkfbnnfalmt`

**Date:** 2026-08-30
**Incident:** Orlando Preview objects were installed in a pre-existing A7X OS Supabase project
**Outcome:** **CLEANUP PASS / LEGACY CRITICAL BASELINE UNCHANGED / ORLANDO PREVIEW INVALIDATED**

## Incident statement

The Supabase project `zquefoznqwkfbnnfalmt`, previously treated as an isolated Orlando staging
database, was confirmed to contain a mature A7X OS installation. This classification was incorrect.
The Orlando Preview proof produced against that project is invalid.

Cleanup was intentionally limited to artifacts introduced for the Orlando work. No migration was
applied to the official Orlando Production database during this response.

## Pre-cleanup safety evidence

- All target business tables contained zero rows.
- `a7_orlando_operation_settings` contained only the single governed Orlando settings row.
- No non-target foreign key, view or function depended on a target object.
- No Orlando migration version had been written to `supabase_migrations.schema_migrations`.
- A baseline of critical legacy tables was recorded before removal.
- The rollback used a transaction, short lock/statement timeouts, an advisory lock, explicit object
  names, no `CASCADE`, dependency guards and post-removal assertions.

## Removed artifacts

- Vercel Preview variables `A7_OPERATIONS_SUPABASE_URL` and
  `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY`.
- Dedicated Supabase secret key `a7_orlando_w1b_preview_v2`.
- Nineteen isolated target tables and two target sequences under the prefixes
  `a7_orlando_*`, `a7_attribution_*` and `a7_wa_*`.
- Target-only routines and triggers, including the four A7 attribution helper routines.

The Supabase default publishable/secret keys and all non-target database objects were left untouched.

## Post-cleanup verification

| Gate | Result |
|---|---|
| Target relations remaining | `0` |
| Target routines remaining | `0` |
| Target triggers remaining | `0` |
| Target migration-ledger rows | `0` |
| Legacy `orders` | `201` before / `201` after |
| Legacy `order_events` | `657` before / `657` after |
| Legacy `units` | `10` before / `10` after |
| Legacy `linen_movements` | `0` before / `0` after |
| Legacy `dispatch_romaneio_stops` | `4` before / `4` after |
| Legacy `discount_approvals` | `0` before / `0` after |
| Legacy `ana_workflow_feedback` | `1` before / `1` after |
| Non-target public tables after cleanup | `270` |
| Non-target public columns after cleanup | `3553` |
| Dedicated Orlando key | absent |
| Default Supabase keys | preserved |
| Vercel Preview Orlando variables | absent |

## Release consequence

- The former W0/W1A/W1B Preview runtime proof is retired and cannot authorize a Production cutover.
- `zquefoznqwkfbnnfalmt` must not be used by Orlando again.
- A future Preview requires an explicitly identified and owner-approved Orlando database target.
- The guarded rollback is retained at
  `supabase/rollbacks/incidents/20260830_zquefo_orlando_objects.rollback.sql` as incident evidence; it
  must not enter the normal migration pipeline.
