# Story A7-033 — A7 Orlando OS Hotel Directory and KPIs

**Status:** Ready for Owner Review — local implementation complete; no Production migration or deployment performed

**Created:** 2026-09-01

**Sources:** Owner approval on 2026-09-01; Orlando OS blueprint; Stories A7-017, A7-018 and A7-019

## Story

**As the** A7 Orlando operations team,

**I want** to select a governed hotel when registering a hotel order,

**so that** names and addresses remain consistent and the Owner can understand volume and confirmed service revenue by hotel.

## Scope

- private Orlando hotel directory with canonical name, address, region, aliases, handoff notes and active status;
- Owner-only hotel creation/update; Owner and Operator may list/select active hotels;
- hotel selector in `Novo atendimento`, with canonical name/address autofill;
- explicit `Hotel não cadastrado` fallback, preserving free text without silently creating a directory record;
- stable `hotel_id` plus name/address snapshot on new hotel leads/orders;
- Owner hotel view with order count, confirmed service revenue, average confirmed ticket, Normal/Express split, new/repeat split and last service;
- CLI for list/search/create/update before the UI;
- Airbnb and Residence remain free text;
- existing orders remain unchanged and appear only as unmapped history until separately reconciled.

## Out of scope

- Production mutation or deployment;
- automatic matching/backfill of historical hotel names;
- public hotel pages, booking, maps, route optimization or third-party hotel data;
- changes to Stripe, WhatsApp, Google Ads, `/order`, attribution snapshots, invoice rules or document templates.

## Acceptance criteria

- [x] AC-01 — Additive migration creates a service-role-only hotel directory, bounded RPCs and nullable hotel linkage without destructive rewrites.
- [x] AC-02 — CLI lists/searches hotels and allows Owner-only create/update with server validation.
- [x] AC-03 — Owner and Operator can load active hotels; only Owner can manage them.
- [x] AC-04 — Hotel selection autofills canonical name/address and persists `hotel_id` plus immutable name/address snapshot on the new lead/order path.
- [x] AC-05 — Hotel orders without a catalog match use an explicit unmapped fallback; Airbnb/Residence remain free text.
- [x] AC-06 — Hotel KPIs exclude QA/cancelled orders and use confirmed net service revenue only; unavailable revenue is never inferred.
- [x] AC-07 — Duplicate canonical names/aliases and invalid/inactive hotel references fail closed.
- [x] AC-08 — Unauthorized, wrong-origin and invalid-method requests fail closed; no PII or secrets are added to hotel records, URLs or logs.
- [x] AC-09 — Existing order, customer, Stripe, WhatsApp, Ads, `/order`, invoice and PDF tests remain green.

## Tasks

- [x] Reconstruct current free-text property/order flow.
- [x] Add migration and rollback notes.
- [x] Add hotel service, store adapters, API and CLI.
- [x] Add selector, Owner management and KPI UI.
- [x] Add focused automated tests.
- [x] Run lint, typecheck, test and build.
- [x] Update checklist and file list.

## Rollback

Before Production approval, rollback is file-only. After a future approved deploy, application rollback hides the feature while the additive table/nullable columns remain inert. Dropping hotel data or columns is not part of application rollback.

## Validation

- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS
- `npm run build` — PASS
- `node --test scripts/test-system-hotels.mjs` — PASS (4/4)
- Automated visual browser capture — unavailable because the installed browser controller references a removed plugin version; no Production/browser session was used as a workaround.

## File list

- `docs/stories/a7-033-orlando-os-hotel-directory.md`
- `supabase/migrations/20260901010000_orlando_os_hotel_directory.sql`
- `supabase/rollbacks/20260901010000_orlando_os_hotel_directory.rollback.sql`
- `lib/system-hotel-service.js`
- `lib/system-order-service.js`
- `lib/operational-store.js`
- `api/system/hotels.js`
- `scripts/a7-system-hotels.mjs`
- `scripts/test-system-hotels.mjs`
- `sistema.html`
- `sistema.js`
- `sistema-hotels.css`
- `package.json`
