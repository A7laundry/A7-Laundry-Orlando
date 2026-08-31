# Story A7-018 — A7 Orlando OS Clientes Lite

**Status:** Done — Production live and Owner smoke approved

**Created:** 2026-08-30

**Blueprint:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`

## Story

**As the** A7 Orlando owner/operator,

**I want** to find an existing customer and their orders without remembering an order number,

**so that** morning service can resume quickly while WhatsApp remains the communication channel.

## Scope

- private `Clientes` screen inside `/sistema`;
- server-side search by normalized name, WhatsApp/phone, email or explicit related order number;
- bounded results, deterministic ordering and no full-table browser download;
- customer detail with the approved contact fields, type, most recent property and reliable initial acquisition source;
- commercial summary derived at read time: non-QA/non-cancelled order count, first/last order and confirmed net service revenue;
- order history with human number, accepted date, status, confirmed service revenue, QA marker and existing Pickup Order link;
- CLI/read service before UI, following the project constitution.

## Privacy and authorization

- Owner-only at both API and current Production access-mode layers;
- no PII in URL, query string, analytics, logs or client-side persistence;
- search request uses protected POST or an equivalent body-based private query;
- responses use pagination/limits and return only the fields needed by the screen;
- no customer UUID is exposed in public navigation;
- invalid, short or ambiguous queries fail closed;
- customer conflicts remain separate; Clientes Lite performs no merge or mutation.

## Explicit non-goals

- editing or deleting customers;
- automatic merge/reconciliation;
- persisted LTV, ticket average, scores, tags, funnels or analytics dashboards;
- marketing, loyalty, campaigns or bulk export;
- WhatsApp inbox, messages or IA;
- custody, production, invoice, Stripe, route or driver changes;
- any change to `/order`, GA4 or Google Ads.

## Acceptance criteria

- [x] Name search returns only matching customers within the approved limit.
- [x] Last-four WhatsApp search returns the correct customer without putting the digits in the URL.
- [x] Full normalized phone, normalized email and explicit related-order search return only the matching customer.
- [x] Customer detail displays the minimum approved identity and operational context.
- [x] Customer summary excludes QA and cancelled orders from the commercial count and first/last dates.
- [x] Confirmed service revenue includes only reconciled service revenue net of successful refunds; tip, pending,
      unpaid, cancelled, QA and un-reconciled Payment Links contribute zero.
- [x] Order history links to the same existing orders and Pickup Orders; it creates no duplicate or parallel order detail.
- [x] MCO and legacy order numbers coexist in search and history.
- [x] Existing customer identity is preserved by `customer_id`/normalized phone; conflicts never auto-merge.
- [x] Unauthorized access returns 401 and exposes no customer data.
- [x] Authenticated non-Owner access returns 403.
- [x] No PII or secret appears in URL, analytics, logs or static assets.
- [x] Desktop and 390 px QA pass; the 390 px document width is exactly 390 px with no overflow.
- [x] Lint, typecheck, focused tests, full tests, build, secret scan and diff checks pass.
- [x] Migration is additive, service-role only, reviewed and applied; guarded rollback remains documented.
- [x] W1A, Pickup Order, `1002 → MCO 1002` and `A7-ORL-1000` regressions pass unchanged.
- [x] Production deployment occurred after a separate GO gate and explicit authorization.

## Definition of done

The owner can answer who the customer is, how many non-QA/non-cancelled orders they have, which orders belong
to them and how much confirmed service revenue they generated, without creating a CRM or parallel financial truth.

## Local Production gate — 2026-08-30

- Remote schema-only audit confirmed the existing contact, order, payment, refund and attribution sources.
- Official `supabase db push --dry-run` identified only `20260830030000_orlando_os_customers_lite.sql` as pending.
- Proposed schema impact: nullable `email`/`email_source` on the existing contact, explicit `is_qa` on the existing
  order, one email lookup index and four service-role-only read functions. No CRM table or persisted aggregate.
- QA rule: explicit `is_qa=true` or the bounded markers `QA`, `DO NOT FULFILL`, `DO NOT DISPATCH` in the approved
  operational fields. QA remains visible in history but contributes zero commercial count/revenue.
- Revenue rule: reconciled `service_amount - refund_total`, only for paid/refund financial states; tip is never read.
- Focused system tests: 26/26. Full repository tests, lint, typecheck and build: PASS.
- Mobile fixture using the actual product CSS at 390 px: app `390/390`, detail `356/356`, zero overflow elements.
- Secret/analytics/PII static scans and whitespace/diff checks: PASS.
- No migration, customer data, Production deployment or external product configuration changed.
- Gate verdict: `GO` for a separately authorized controlled Production migration and deployment.

## Production release — 2026-08-30

- Migration `20260830030000_orlando_os_customers_lite.sql` applied as the only pending migration and confirmed in
  the remote ledger.
- First W1A.3 cutover was rolled back immediately after authenticated QA found that a zero commercial order count
  rendered as “Não informado”. No data was changed by that read-only smoke.
- The UI was corrected from a truthy fallback to a nullish fallback, and a regression assertion now protects the
  zero-valued aggregate.
- Corrected immutable deployment: `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`.
- Application rollback remains ready to `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk`; the additive W1A.3 schema is inert under
  that release.
- Public HTTP smoke: homepage, `/order` and `/sistema` `200`; unauthenticated customer API `401`.
- Authenticated Owner smoke: PASS for name, last-four phone, full phone, MCO and legacy-order lookup; all remained on
  `/sistema` with an empty query string and no internal IDs in the rendered results.
- Customer detail smoke: PASS; QA orders remain visible, contribute zero commercial count/revenue, and retain their
  existing Pickup Order links. No customer/order record was created or mutated.
- Email search remains implemented but has no Production fixture because this release intentionally does not source
  or backfill customer email.

## File List

- `docs/stories/a7-018-orlando-os-customers-lite.md`
- `docs/audits/2026-08-30-orlando-os-customers-lite-production-gate.md`
- `lib/system-customer-service.js`
- `lib/operational-store.js`
- `lib/system-http.js`
- `api/system/customers.js`
- `scripts/a7-system-customers.mjs`
- `scripts/test-system-w0-w1a.mjs`
- `sistema.html`
- `sistema.js`
- `sistema-w1a1.css`
- `supabase/migrations/20260830030000_orlando_os_customers_lite.sql`
- `supabase/rollbacks/20260830030000_orlando_os_customers_lite.rollback.sql`
- `package.json`
