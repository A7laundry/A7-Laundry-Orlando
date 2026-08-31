# Story A7-022 — A7 Orlando OS W3-A Known Customer Order

**Status:** Ready for Review — local gates passed; Production not authorized

**Created:** 2026-08-30

**Source:** `docs/audits/2026-08-30-orlando-os-w3-customer-upgrades-readiness.md`

**Depends on:** A7-018 Clientes Lite and A7-017 W1A Manual Order

## Story

**As the** A7 Orlando Owner,

**I want** to start a new attendance from an existing customer,

**so that** I do not retype identity while every new sale still receives a new lead, order and reviewed operational facts.

## Scope lock

Only W3-A is in scope: select a real known customer in Clientes Lite, resolve its opaque reference server-side, prefill
identity and latest operational context, review the new service facts, and create a new repeat order through the existing
W1A lifecycle.

Customer editing, automatic merge, conflict reconciliation, LTV, ticket metrics, marketing, bulk export, WhatsApp
automation, Stripe, routes, W3-B and W3-C remain unchanged.

## Requirements

| ID | Requirement |
|---|---|
| FR-01 | Only a Clientes Lite customer with at least one prior real order can start reuse. |
| FR-02 | The browser sends only an opaque `customer_ref` in a private POST; the server resolves `customer_id`. |
| FR-03 | Stored name and WhatsApp are authoritative and cannot be replaced by browser fields. |
| FR-04 | Language, customer type, local, handoff, timing, tier and items remain reviewable new-order facts. |
| FR-05 | Reuse creates new `lead_id` and `order_id`, preserves `customer_id` and reports `is_repeat_customer=true`. |
| FR-06 | Retry is idempotent; reuse of the same submission for another customer fails closed. |
| NFR-01 | Owner-only, same-origin and protected submission identity. |
| NFR-02 | No PII/customer UUID in URL, analytics, storage or logs. |
| NFR-03 | Migration is an additive service-role-only RPC and existing W1A functions remain unchanged. |
| CON-01 | No customer record mutation or auto-merge. |
| CON-02 | No Production mutation without a separate exact GO. |

## Acceptance criteria

- [x] Clientes Lite shows one clear “Novo pedido para este cliente” action for a prior real customer.
- [x] The form opens prefilled without requiring name or WhatsApp retyping.
- [x] Server ignores browser attempts to replace stored name/WhatsApp.
- [x] A new accepted order preserves customer identity and creates new lead/order identities.
- [x] Repeat truth is derived from prior real history; QA-only/cancelled-only history cannot use W3-A.
- [x] Same retry returns the original order and conflicting reuse fails closed.
- [x] Operator/unauthenticated/wrong-origin requests fail closed.
- [x] No contact row, attribution snapshot or historical order is changed.
- [x] No Stripe, WhatsApp, Google Ads, `/order` or lifecycle contract changes.
- [x] Desktop and 390 px UI are usable without document overflow.
- [x] Migration/rollback dry-run, lint, typecheck, focused/full tests and build pass.
- [x] Production gate stops before mutation.

## Rollback

Application rollback removes the W3-A UI/service call. SQL rollback drops only the additive RPC. Orders already created
through it remain ordinary governed orders with their complete lead, audit, attribution and lifecycle history.

## Validation evidence

- Focused W3-A tests: 5/5 PASS.
- Orlando OS pretest: 58/58 PASS.
- Repository suite: 80/80 PASS; protected MOS suite: 66/66 PASS.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run validate:structure` and `git diff --check`: PASS.
- Agent validation: PASS with 121 pre-existing dependency warnings and zero errors.
- PostgreSQL 15 additive migration chain, transactional SQL smoke and rollback: PASS.
- Desktop 1440 px and mobile 390 px visual QA: no horizontal overflow; stored name/WhatsApp remain readonly; no console warnings/errors.
- Production/Supabase/Vercel mutation for W3-A: not performed.

See `docs/audits/2026-08-30-orlando-os-w3-a-known-customer-order-gate.md`.

## File List

- `docs/stories/a7-022-orlando-os-w3-a-known-customer-order.md`
- `supabase/migrations/20260830070000_orlando_os_w3_a_known_customer_order.sql`
- `supabase/rollbacks/20260830070000_orlando_os_w3_a_known_customer_order.rollback.sql`
- `lib/system-order-service.js`
- `lib/operational-store.js`
- `lib/operational-lifecycle.js`
- `api/system/orders.js`
- `scripts/a7-system-manual-order.mjs`
- `scripts/test-system-w3-a.mjs`
- `scripts/test-system-w3-a.sql`
- `sistema.html`
- `sistema.js`
- `sistema-w1a1.css`
- `package.json`
- `docs/audits/2026-08-30-orlando-os-w3-a-known-customer-order-gate.md`
