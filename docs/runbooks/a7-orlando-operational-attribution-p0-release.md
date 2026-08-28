# A7 Orlando — Operational Attribution P0 Release Runbook

**Date:** 2026-08-28
**Status:** `GA4 + STRIPE TEST-MODE PREVIEW VALIDATED / PRODUCTION CUTOVER NOT AUTHORIZED`
**Contract:** `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`

## Current state

- Additive Supabase migrations `20260828020000` through `20260828120000` are applied remotely.
- The application/server candidate is deployed only to the protected branch Preview identified below.
- Production continues to run the previous payment flow.
- The public aliases `a7laundry.com` and `www.a7laundry.com` currently resolve to rollback baseline
  `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` (created 2026-08-24). Newer Production-target deployments do
  not currently own the public aliases and must not be mistaken for the live rollback point.
- Google Ads goals, bids, budgets and campaigns are unchanged.
- GA4 property `543807649` no longer treats `money_page_view` as a key event; `purchase` remains a
  key event. The Measurement Protocol secret is stored only in the branch-isolated Preview runtime.
- Strict GA4 validation, collected DebugView and outbox deduplication passed. Both Preview debug
  flags are now `false`, and the staging-only QA endpoint was removed before the final clean Preview.

Do not deploy the candidate to Production until the Production webhook, operational environment and GA4 server-delivery gate are configured and separately authorized. The candidate deliberately removes browser-authoritative purchase emission; deploying it without a working webhook would create a financial measurement gap.

## Required protected configuration

Configure these in Preview and Production as appropriate. Never print their values in logs or evidence.

| Variable | Preview requirement | Production requirement |
|---|---|---|
| `A7_OPERATIONS_SUPABASE_URL` | Durable test/staging store preferred | Required, or verified fallback to `WHATSAPP_SUPABASE_URL` |
| `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY` | Server-only | Required, or verified fallback to `WHATSAPP_SUPABASE_SERVICE_ROLE_KEY` |
| `A7_ATTRIBUTION_SUPABASE_URL` | Same approved store | Same approved store |
| `A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY` | Server-only | Server-only |
| `OPERATIONS_API_TOKEN` | Required | Required |
| `STRIPE_SECRET_KEY` | A verified Stripe test-mode key | Existing live key only at production cutover |
| `STRIPE_WEBHOOK_SECRET` | Secret for the Preview test endpoint | Secret for the Production live endpoint |
| `GA4_MEASUREMENT_ID` | `G-JLQNRC7MK4`, Preview branch only | `G-JLQNRC7MK4` after separate cutover approval |
| `GA4_MEASUREMENT_PROTOCOL_SECRET` | Configured as a protected Preview branch secret | Required for server delivery after separate cutover approval |
| `GA4_MEASUREMENT_PROTOCOL_DEBUG` | `true` only for strict, non-reporting payload validation | `false` for collected delivery |
| `GA4_DEBUG_MODE` | `true` only for the collected DebugView proof | `false` after DebugView proof |
| `PAYMENT_LINK_TOKEN` | Required | Already present; retain server-side |

`A7_OPERATIONS_STORAGE_MODE=memory` is test-only and forbidden in Production.

## Stripe endpoint contract

Register the deployed `/api/stripe-webhook` endpoint for:

- `checkout.session.completed`;
- `checkout.session.async_payment_succeeded`;
- `checkout.session.async_payment_failed`;
- `checkout.session.expired`;
- `refund.created`;
- `refund.updated`.

Only a successful refund is emitted to GA4 as `refund`. Payment identity is the stable Stripe PaymentIntent ID. The endpoint must receive the exact raw request bytes and validate `Stripe-Signature` before any write.

## Release sequence

1. Configure a durable Preview operations store and test-mode Stripe key.
2. Deploy a Preview from the exact reviewed commit/candidate.
3. Register the Preview webhook and store its signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Create one test lead, qualify it, accept the order, record pickup/weight and issue an invoice.
5. Generate the Payment Link using the exact `order_id`, `lead_id` and invoiced service amount.
6. Complete the Stripe test payment and repeat the same webhook delivery.
7. Issue a full or partial test refund and verify append-only correction.
8. Execute all 15 checks in contract §16 and retain redacted evidence.
9. In GA4 property `543807649`, unmark `money_page_view` as a key event. Keep it as a normal diagnostic event.
10. Create/verify the GA4 Measurement Protocol secret. First use `GA4_MEASUREMENT_PROTOCOL_DEBUG=true` to validate payloads strictly; this endpoint does not collect events. Then set it to `false`, use `GA4_DEBUG_MODE=true`, and validate collected `order_accepted`, `purchase` and `refund` in DebugView with no PII. Return `GA4_DEBUG_MODE` to `false` after proof.
11. Configure the Production webhook and protected secrets.
12. Run `npm run preflight:orlando:production` inside the protected Production environment. It must
    report `ready=true`; the output contains check names/status only and never secret values.
13. Deploy once the webhook is reachable and immediately run a signed non-financial/ignored-event probe plus health checks.
14. Execute one owner-approved live low-value operational order only if the financial QA plan explicitly authorizes it.
15. Observe outbox failures, Stripe retries and attribution coverage before declaring release complete.

For the two GA4 Preview stages, run the matching protected preflight:

- `npm run preflight:orlando:preview-validation` before strict non-reporting payload validation;
- `npm run preflight:orlando:preview-debugview` before collected DebugView proof.

The gate verifies one complete Supabase credential pair, required server tokens, Stripe test/live
mode, webhook secret shape, the exact Orlando GA4 stream and mutually exclusive GA4 debug modes.
It fails closed and does not print configured values.

## Fail-closed / fail-open rules

- Attribution lookup failure is fail-open: create the lead/order with an `unattributed` snapshot.
- Operational storage failure is fail-closed for order/payment writes and Payment Link creation.
- GA4 delivery failure never blocks operations or Stripe acknowledgement after the durable ledger write; the outbox retains retry state.
- Invalid/missing `order_id`, lead mismatch, non-invoiced order, amount mismatch or PaymentIntent conflict blocks payment ingestion.
- No confirmation page, browser reload or Checkout Session ID may create `purchase`.

## Rollback

- Do not roll back the additive database migration during an application rollback.
- Roll back the application to the previous deployment if order creation, payment-link generation or webhook ingestion fails.
- Keep the webhook endpoint configured during a short application rollback so Stripe retries remain available; do not discard pending signed events.
- Do not restore browser-authoritative purchase emission as a shortcut. Reconcile from the Stripe event ledger after recovery.

## Preview evidence — 2026-08-28

- Protected Preview: `dpl_EDvRQCc1tfVLNUJMuKpaiPjk8jF3`, READY at `https://a7-laundry-orlando-n0nqul2j8-dennis-a7s-projects.vercel.app`.
- Runtime variable names verified on the deployment: `A7_PREVIEW_BYPASS_SECRET`, `OPERATIONS_API_TOKEN`, `PAYMENT_LINK_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WHATSAPP_SUPABASE_SERVICE_ROLE_KEY` and `WHATSAPP_SUPABASE_URL`; values are excluded from evidence.
- Stripe webhook `we_1U9VJ8DcFmXJh57PFy7UUfT3` is test-mode only and subscribes to the six lifecycle events listed above.
- Route probes: protected `/order` redirects without authorization, authorized `/order` returns 200 and an invalid webhook signature returns 400.
- Synthetic run `QA-A7-1787945074393` passed durable lead, qualification, acceptance, pickup, weighing, invoice, test payment-link, failed/void/paid reconciliation, repeated-webhook idempotency, delivery, full refund and repeat-order continuity.
- Safe event/outbox payloads passed the PII scan. The run used an explicit `unattributed` snapshot; it did not prove a deterministic tagged landing journey or GA4 DebugView delivery.
- Cleanup left zero matching Supabase leads, orders and contacts. The test Payment Link is inactive, its products are archived and all 16 related test prices are inactive.
- Quality gates pass: lint, typecheck, focused operational tests 11/11, attribution V2, root tests 63/63, MOS tests 62/62 and the production build.

The GA4 branch-level Vercel variables are persistent Preview-only entries for
`feat/meta-ads-ops-structure`. They are not Production configuration. The secret value is excluded
from repository files, logs and evidence.

### Deterministic browser/reporting validation

- Final protected candidate: `dpl_GvKKuXdVHKrvucSDn4b2hjrNzjdq`, READY at `https://a7-laundry-orlando-p193prhv8-dennis-a7s-projects.vercel.app`; the stable test-only webhook alias is `https://a7-attribution-qa-dennis-a7s-projects.vercel.app`.
- Final route probes returned 200 for `/order`, rejected an unauthenticated operational write as `unauthorized`, and rejected an unsigned Stripe body as `Invalid webhook`.
- Stripe endpoint `we_1U9WaIDcFmXJh57PGw4oFeVX` is enabled in test mode for the exact six supported checkout/refund events. Its URL uses the dedicated, masked Vercel automation bypass labeled `Stripe-QA`; it does not use or replace the project-wide system bypass. A signed non-financial ignored-event probe returned HTTP 200 on both the unique deployment and the stable alias before the prior endpoint was deleted. No live-mode object was created.
- A real protected-browser landing with `utm_source=qa`, `utm_medium=synthetic` and a synthetic `gclid` created a durable A7 reference. The opt-in Preview diagnostic exposed only masked identity, source/medium, click-ID presence and event names; it did not expose the raw click ID.
- One real WhatsApp CTA activation emitted exactly one `whatsapp_click`, retained the A7 reference in the prefill and did not send a message or expose the synthetic click ID.
- Synthetic run `QA-A7-1787949500000` used that browser-created A7 reference. It created one lead, one qualified lead and one accepted order, froze a `deterministic` attribution snapshot, preserved `qa / synthetic / /laundry-pickup-delivery-orlando`, created the order before weight or revenue, and returned the same order on the idempotent acceptance retry.
- The protected reporting RPC exposed the same landing row as 1 lead → 1 qualified lead → 1 accepted order → 0 paid orders / $0 revenue, preserving truthful pre-payment semantics.
- Post-run cleanup was verified independently: 0 matching leads, 0 orders, 0 events and 0 attribution sessions remained.
- Final gates pass: lint, typecheck, focused operational tests 20/20, release-preflight tests 4/4, root tests 77/77, MOS tests 66/66 and repository build. The only full-worktree `git diff --check` findings are pre-existing whitespace in five unrelated Aug 24 Ads evidence files; the attribution change scope is clean.
- Completion auditing found and corrected analytics event-time drift: remote additive migration `20260828110000` makes outbox `occurred_at` mandatory and ledger-synchronized, while the server sender emits the same instant as numeric GA4 `timestamp_micros`. Migration `20260828120000` makes events older than GA4's 72-hour window terminally `expired`, preventing silent timestamp shifts and infinite retries. PostgreSQL 15 full-chain migration, functional SQL smoke and retry regression tests passed; isolated event/outbox mismatch count was zero.
- The `dpl_GvKKuXdVHKrvucSDn4b2hjrNzjdq` Preview proves the Stripe transport and pre-correction
  lifecycle candidate. The event-time/expiry corrections were made afterward in the reviewed
  worktree and database migrations, so a fresh protected Preview of the exact final worktree is
  required before Production promotion. Do not promote `dpl_GvKKuXdVHKrvucSDn4b2hjrNzjdq` as the
  final application artifact.

## Contract §16 coverage

| Check | Preview status | Evidence / remaining gate |
|---:|---|---|
| 1 | Passed | The protected browser created a valid attribution record/A7 Ref from the tagged landing, and acceptance froze it deterministically. |
| 2 | Passed | One live Preview CTA activation produced exactly one `whatsapp_click`. |
| 3 | Passed | Intake created one durable lead and one `generate_lead`. |
| 4 | Passed | Qualification created one `qualified_guest_lead`. |
| 5 | Passed | Acceptance created one order before weight or revenue existed. |
| 6 | Passed | Pickup and weighing used the same order ID. |
| 7 | Passed | Invoice used actual weight, eligible service amount and USD. |
| 8 | Passed | Stripe test metadata used the same opaque order linkage and passed the PII scan. |
| 9 | Passed | Repeated webhook delivery retained one payment and one purchase ledger event. |
| 10 | Passed | The deterministic order snapshot preserved `qa / synthetic`; the payment contract cannot overwrite the frozen snapshot and prior financial QA did not assign Stripe as acquisition. |
| 11 | Passed | Delivery used the same order ID. |
| 12 | Passed | A second accepted order used new lead/order IDs and the same customer continuity with repeat status. |
| 13 | Passed | Collected DebugView showed only the approved opaque, categorical and financial parameters for `order_accepted`, `purchase` and `refund`; automated allowlist/PII tests cover all three payloads. |
| 14 | Passed | Full refund appended the correction and preserved the purchase. |
| 15 | Passed | Automated API/gtag failure cases preserve CTA navigation, and the live protected-browser CTA remained operational. |

The Preview evidence validates all 15 checks. This is a Preview validation result, not a Production
cutover or an observation-window result.

## Definition-of-done coverage

- Implemented and Preview-proven: durable lead/order identity, deterministic frozen acquisition snapshot, order before weighing/invoice, server-authoritative idempotent payment/refund, separate operational and financial outcomes, repeat-customer continuity, landing-page funnel reporting and no campaign mutation.
- Complete: `money_page_view` was removed from GA4 key events on 2026-08-28 and verified absent after reload; `purchase` remained enabled.
- Not complete: ≥95% attribution coverage observation window and the separately authorized Production cutover.

## Current blockers

- No Production configuration, webhook or application deployment is authorized by the five Preview actions.
- Vercel now has two masked bypasses: the pre-existing project-wide system bypass added 2026-07-24 and the dedicated non-system `Stripe-QA` bypass. The dedicated bypass is attached only to the test-mode webhook URL and its value is excluded from evidence. The project-wide bypass remains in place because repository consumers still reference `VERCEL_AUTOMATION_BYPASS_SECRET`; revoke or rotate it only after those consumers are migrated and explicit authorization is received.
- GA4 property `543807649` is accessible through the authorized `a7laundry.usa@gmail.com` account.
  The owner confirmed Google's user-data collection attestation. The API secret was created and
  stored in the exact Preview branch scope without exposing its value. `money_page_view` remains a
  normal event and is no longer a key event; `purchase` remains enabled.
- Read-only Vercel inventory confirms that Production has the durable Supabase fallback variables, `PAYMENT_LINK_TOKEN` and `STRIPE_SECRET_KEY`, but it does not yet have `OPERATIONS_API_TOKEN`, `STRIPE_WEBHOOK_SECRET` or `GA4_MEASUREMENT_PROTOCOL_SECRET`. These are hard cutover blockers, not values to infer or copy from Preview. `GA4_MEASUREMENT_PROTOCOL_DEBUG` and `GA4_DEBUG_MODE` must be explicitly false or absent in steady-state Production.
- Public route probes confirm the old live baseline: `/` returns 200 while `/order`,
  `/api/stripe-webhook` and `/api/operations/lifecycle` return 404. This is expected before cutover
  and proves that the new operational surface is not partially active in Production.
- The executable release preflight is implemented and covered by six focused tests. A clean-shell
  Production invocation exits nonzero and reports only missing check names, proving fail-closed
  behavior without secret disclosure.
- Preview `STRIPE_SECRET_KEY` now uses the Stripe CLI's verified test-mode server credential and is
  stored as one `sensitive`, Preview-only variable scoped to `feat/meta-ads-ops-structure`.
- The remote pipeline now keeps `marketing/` fully ignored and reads the authorial registry from
  `governance/content-registry.mjs`. Standard Preview `dpl_4rvoSZHwTywrZPmVGbesJTjzV3mA` passed the
  normal Vercel `npm run build:public` path. Its branch-only `/api/operations/preflight` returned
  HTTP 200 with `ready=true` and all 10 sanitized checks passing.
- Exact operational commit `9a7bb0512f8d21f7c7996785407ef437a36c7401` passed the normal pipeline
  again in Preview `dpl_4ckN44QVvdaB8MTvjVA661ZyJvRp`: deployment READY, runtime preflight 10/10,
  `/order` HTTP 200 and the removed GA4 QA probe HTTP 404. The read-only Production inventory still
  lacks `OPERATIONS_API_TOKEN`, `STRIPE_WEBHOOK_SECRET` and `GA4_MEASUREMENT_PROTOCOL_SECRET`, so
  Production preflight remains NO-GO and no cutover was performed.
- The ≥95% attributed/partial order threshold requires a clean observation window after GA4 and Production authorization.
- Google Ads conversion goals, bidding and campaign settings remain outside this release and unchanged.

### GA4 Measurement Protocol evidence

- Strict validation Preview `dpl_6QHzZHLB6Tcwfy1Toz1TUbykDeHJ`: probe
  `f7992e3ad03541968b89` sent the exact `order_accepted`, `purchase` and `refund` set to
  `/debug/mp/collect` with `ENFORCE_RECOMMENDATIONS`; all three returned zero validation errors.
- Collected DebugView Preview `dpl_3Ucdu5tEm38YpQuH7M9r5pNDn6P6`: probe
  `84efedd55e1b4806aaee` displayed one event of each type. Purchase used stable transaction
  `qa_pi_84efedd55e1b4806aaee`, value 65 USD; refund reused that transaction with value 15 USD.
- PII inspection found no name, email, phone, WhatsApp ID, exact address/property/room, message,
  notes, card data or raw click ID in DebugView parameters.
- Deduplication Preview `dpl_2ZyqCUncgRu35nvcGKY4KucDQyAF`: probe
  `9a23fbaf717a4515a6cb` delivered one purchase once; the second delivery returned `already_sent`
  and the final outbox state remained `sent`.
- Final clean Preview `dpl_9B8qsLHKiE82J25uDSc62CZmFAQf` is READY. Both GA4 debug flags are
  `false`, and `/api/qa/ga4-probe` returns 404.
