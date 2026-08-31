# Story A7-017 — A7 Orlando OS W1A Manual Order

**Status:** Ready for Review — direct-number lookup live after corrected cutover

**Created:** 2026-08-30

**Source:** approved goal `88684f8c-fe3e-40e7-8c2e-587aacdfa6f5`

**W1A.1 source:** `goal-objective.md` supplied on 2026-08-30 — Pickup Order + MCO numbering

**Depends on:** `docs/stories/a7-016-orlando-os-w0-foundation.md`

## Story

**As an** A7 Orlando operator,

**I want** to register a sale already agreed in WhatsApp and create one governed order,

**so that** `/sistema` becomes the operational truth without replicating WhatsApp.

## Authorization boundary

Only W1A is authorized: Atendimento, Novo atendimento, governed catalog, atomic customer/lead/order/items,
human order number and next action. A controlled Owner-only Production pilot was authorized on 2026-08-30,
but no mutation may occur before the final GO gate. W1B Hoje/custody, W1C finance, WhatsApp integration, IA,
Stripe, Google Ads and `/order` changes remain outside this story.

## Acceptance criteria

- [x] Atendimento explains that it records a sale received outside the system.
- [x] The short form captures only the approved customer, location, service, timing, item and notes fields.
- [x] Price, unit, minimum and service rules come from one server-governed catalog.
- [x] Operators cannot enter price, minimum, UUIDs, attribution IDs or idempotency keys.
- [x] One server operation normalizes input, finds/creates the customer, creates and qualifies the lead,
      accepts the order, freezes available attribution, creates items, writes audit evidence and returns
      the next action. Historical W1A orders retain `A7-ORL-XXXX`; W1A.1 orders receive `MCO 1002+`.
- [x] Repeating the same submission returns the same order and creates no duplicate customer, lead, order or
      item.
- [x] Wash & Fold Normal/Express use current governed pricing; special items require manual review and do not
      invent a price.
- [x] The success state shows only a safe human order number and operational summary.
- [x] The order can be reopened through a safe authenticated lookup.
- [x] Controlled Owner-only Production smoke passes after GO.

## W1A.1 acceptance criteria

- [x] New orders use an atomic, server-only, concurrency-safe sequence beginning at `MCO 1002`.
- [x] Existing `A7-ORL-*` orders remain unchanged and retrievable; an idempotent retry keeps its number.
- [x] The manual-order CLI and authenticated UI return the same safe Pickup Order path for the same order.
- [x] Pickup Order represents the existing `order_id`; it creates no second order or financial entity.
- [x] Pickup Order shows the governed customer, property, service, pickup, delivery and optional instruction data.
- [x] `bags_expected` is optional, validated and persisted for later custody work without starting W1B.
- [x] Service price, unit and minimum come from the frozen governed order items and cannot be edited in the view.
- [x] The private route works at 390px and through native print CSS, normally within one printed page.
- [x] Unauthenticated access reveals no order data; the URL contains only the human order number, never UUID or PII.
- [x] Tip selection remains disabled; Pickup Order shows no tip; financial separation remains additive and inert.
- [x] Migration, rollback, local gates, print/mobile evidence and final GO/NO-GO are documented before Production.
- [x] Production ledger contains only the authorized W1A.1 addition; the isolated deployment is live.
- [x] Owner smoke created the single synthetic non-financial order `MCO 1002`; `MCO 1003` is absent.
- [x] `MCO 1002` and historical `A7-ORL-1000` are both retrievable in Production.
- [x] Production Pickup Order, private guards, public regressions and rollback readiness are verified.

## Direct-number lookup refinement

- [x] Search accepts `1002`, `MCO 1002`, `MCO1002` and `MCO-1002` as the same canonical order.
- [x] Historical `A7-ORL-1000` lookup remains supported.
- [x] Invalid or ambiguous input fails closed and does not broaden database access.
- [x] After a successful lookup, the input displays the canonical human number.
- [x] The search field explains the shortest supported format without changing stored numbers.
- [x] Production deployment and Owner smoke are completed after an explicit deployment gate.

### Production smoke and rollback — 2026-08-30

- Deployment `dpl_DUNKsqDLKKL8YRrxtSgMyPnbX6su` was published after explicit authorization.
- Public/private HTTP smoke passed, but the authenticated `1002` lookup exposed a browser-only failure:
  `event.currentTarget` became null after the asynchronous request.
- The release was immediately rolled back to healthy deployment `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa`.
- The local correction captures the form before `await`; a focused regression test and local browser smoke now pass.
- A second explicit GO authorized only the corrected direct-number lookup, with authenticated smoke and immediate
  rollback on any failed gate.
- Corrected deployment `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk` was built and published from the isolated W1A.2
  artifact. Clientes Lite was confirmed absent before and after publication.
- Public smoke passed: `/sistema` and the homepage returned `200`; unauthenticated session and order APIs
  remained `401`; `www.a7laundry.com/sistema` resolved to the same corrected page through the existing redirect.
- Authenticated Owner smoke passed: `1002` normalized to `MCO 1002`, returned the single existing QA order and
  exposed its Pickup Order action. Historical `A7-ORL-1000` remained retrievable.
- No migration ran and no customer, order, payment, Stripe, WhatsApp, Google Ads or `/order` state changed.
- Deployment `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa` remains the documented immediate rollback target.

## Quality gates

- [x] Authenticated and unauthorized API tests.
- [x] Atomic/idempotency and catalog-governance tests.
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
- [x] Direct-number lookup focused tests: 16/16.
- [x] Isolated Production artifact differs from the active W1A.1 artifact in exactly four approved files.
- [x] Isolated `vercel build --prod` passes without deployment.
- [x] Failed authenticated smoke was rolled back without migration or data mutation.
- [x] Browser regression is reproduced, corrected and covered locally.
- [x] Corrected isolated Production build and HTTP smoke pass.
- [x] Authenticated Owner smoke passes for numeric and historical order lookup.
- [x] Clientes Lite remains excluded from the Production artifact.

## File List

- `config/orlando-service-catalog.json`
- `lib/system-catalog.js`
- `lib/system-order-service.js`
- `lib/operational-store.js`
- `api/system/order-draft.js`
- `api/system/orders.js`
- `sistema.html`
- `sistema.css`
- `sistema.js`
- `supabase/migrations/20260830010000_orlando_os_w1a_manual_orders.sql`
- `supabase/rollbacks/20260830010000_orlando_os_w1a_manual_orders.rollback.sql`
- `supabase/migrations/20260829100000_orlando_lead_idempotency_concurrency.sql`
- `docs/audits/2026-08-30-orlando-os-w0-w1a-production-gate.md`
- `scripts/a7-system-manual-order.mjs`
- `scripts/test-system-w0-w1a.mjs`
- `tests/fixtures/orlando-os-w1a-order.json`
- `api/system/pickup-order.js`
- `sistema-w1a1.css`
- `sistema-pickup-order.html`
- `sistema-pickup-order.css`
- `sistema-pickup-order.js`
- `supabase/migrations/20260830020000_orlando_os_w1a1_pickup_order.sql`
- `supabase/rollbacks/20260830020000_orlando_os_w1a1_pickup_order.rollback.sql`
- `scripts/a7-system-pickup-order.mjs`
- `docs/audits/2026-08-30-orlando-os-w1a1-pickup-order-production-gate.md`
- `package.json`
- `governance/content-registry.mjs`
- `mos-app/generated/content-catalog.json`
- `scripts/build-site.mjs`
- `vercel.json`
- `docs/audits/2026-08-30-orlando-os-w1a2-direct-lookup-production-smoke.md`
