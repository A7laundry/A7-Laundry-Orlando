# A7 Orlando OS — W1C-A Controlled Production Cutover

**Date:** 2026-08-31
**Scope:** item-level actual weight only
**Official Supabase project:** `wiwawtpaxnrueugppasi`
**Application rollback:** `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`
**Status:** `READY / AWAITING EXACT OWNER GO`

## Immutable boundary

The release may contain W1B plus W1C-A only:

```text
record actual weight per lb item
→ derive item subtotal from stored price
→ emit order_weighed once after all lb items
→ advance to awaiting_processing
```

It must not publish W1C-B1, W2, W3, invoices, Payment Links, Stripe changes, WhatsApp sends, analytics changes,
Google Ads changes, `/order` changes or any unrelated feature.

Never connect this runbook to Supabase project `zquefoznqwkfbnnfalmt`; that project belongs to another system.

## Stop-before-mutation gate

Before any Production write:

1. authenticate the Supabase CLI and read the ledger from `wiwawtpaxnrueugppasi`;
2. require the ledger to end at `20260830041000` with no unexpected migration;
3. assemble an isolated W1B + W1C-A workdir from the verified W1B source and semantic W1C-A overlay;
4. run `npm run system:release:scope -- --slice w1c-a --root <candidate> --baseline-root <w1b-base>` and reject
   the artifact if W1C-B1, W2 or W3 runtime symbols/files or Vercel routing drift are present;
5. run lint, typecheck, private tests, repository tests, build, structure, agents and `git diff --check`;
6. run a migration dry-run and require exactly `20260830050000_orlando_os_w1c_a_item_weight.sql`;
7. verify `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP` is still Ready and available for rollback;
8. receive the exact Owner authorization recorded in the gate audit.

Any mismatch is `NO-GO`. Do not use `--include-all`, skip a migration, renumber a migration or repair the remote
ledger from inference.

## Authorized mutation sequence

Only after every preflight gate passes:

1. apply migration `20260830050000` to project `wiwawtpaxnrueugppasi`;
2. verify the remote ledger now ends at exactly `20260830050000`;
3. deploy the exact isolated artifact without changing Stripe, WhatsApp, GA4 or Ads environment/configuration;
4. promote that exact artifact to `a7laundry.com`;
5. verify `/`, `/order` and `/sistema` return 200 and unauthenticated system APIs return 401;
6. authenticate as Owner;
7. obtain a signed submission cookie through the existing protected draft flow;
8. POST same-origin to `/api/system/w1c-a-smoke` with confirmation `W1C_A_TRANSACTIONAL_SMOKE`;
9. require every smoke assertion below to pass;
10. perform a read-only Owner check of Today, Orders and one existing order detail.

No real customer order is modified and no financial flow is executed.

## Transactional smoke contract

The probe is service-role only and protected by Owner session, same-origin POST, signed HttpOnly submission identity
and explicit confirmation. Inside one database transaction it:

1. takes a dedicated advisory transaction lock;
2. creates opaque synthetic contact, lead, order and one per-pound item without consuming the commercial order
   number sequence;
3. calls the real `a7_orlando_w1c_a_record_item_weight` twice with the same identity;
4. verifies the first call is new and the second is duplicate;
5. verifies exactly one item-weight event and one `order_weighed` event;
6. verifies `weighed`, `awaiting_processing` and `actual_lbs=5`;
7. deletes every synthetic row before commit;
8. returns only safe aggregate evidence and requires `residue_count=0`.

The fixture is deliberately not marked QA because the production contract correctly makes QA orders read-only.
It is never visible after the transaction completes and contains no customer PII.

## Required PASS response

```text
passed=true
first_duplicate=false
retry_duplicate=true
weight_event_count=1
lifecycle_event_count=1
final_order_status=weighed
final_production_state=awaiting_processing
actual_lbs=5
residue_count=0
```

Any other result is a release failure.

## Rollback

If the application, auth, smoke or regression gate fails:

1. stop further testing;
2. promote `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP` back to Production;
3. verify W1B Today, Orders, lookup and authorization;
4. leave migration `20260830050000` installed and inert;
5. do not run the SQL rollback after any real weight/event exists;
6. record the failure with deployment ID, HTTP/status evidence and safe smoke result.

The exceptional SQL rollback is allowed only when the evidence-loss guard confirms that no real W1C-A weight or
event exists. Application rollback is the normal recovery path.

## Final report template

```text
W1C-A CUTOVER: PASS / FAIL
REMOTE LEDGER: PASS / FAIL
ARTIFACT ISOLATION: PASS / FAIL
OWNER AUTH: PASS / FAIL
WEIGHT WRITE: PASS / FAIL
IDEMPOTENCY: PASS / FAIL
ORDER_WEIGHED ONCE: PASS / FAIL
PII/SECRETS: PASS / FAIL
FINANCE/WHATSAPP/ADS UNCHANGED: PASS / FAIL
RESIDUE: NONE / FOUND
ROLLBACK: NOT REQUIRED / EXECUTED
PRODUCTION: READY / NOT READY
```

Objective evidence is required for every failure. No later wave may be started as part of this cutover.
