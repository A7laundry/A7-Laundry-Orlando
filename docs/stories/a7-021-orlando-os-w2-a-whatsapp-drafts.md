# Story A7-021 — A7 Orlando OS W2-A WhatsApp Order Drafts

**Status:** Ready for Review — local gates passed; Production not authorized

**Created:** 2026-08-30

**Source:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md` and
`docs/audits/2026-08-30-orlando-os-w2-whatsapp-order-updates-readiness.md`

**Depends on:** A7-019 W1B Daily Operations

## Story

**As the** A7 Orlando Owner,

**I want** a governed WhatsApp message draft generated from the real order state,

**so that** I can review and copy the exact approved update into the existing customer conversation without inventing
facts or waiting for Cloud API Coexistence.

## Scope lock

Only W2-A is in scope: deterministic EN/PT/ES operational drafts, state eligibility, preview, explicit Owner approval,
copy acknowledgement, append-only audit and private `/sistema` UI/CLI/API.

Cloud API sending, WhatsApp Web automation, Meta onboarding, delivery/read receipts, inbound conversation ingestion,
AI-generated text, marketing/broadcast messages, autonomous sales, Stripe, invoice creation and Production deployment
remain unchanged.

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | A draft is tied to one existing non-QA Orlando order and one governed template key. | W2 readiness audit |
| FR-02 | The server selects EN/PT/ES from the durable lead language; unknown falls back visibly to EN. | Blueprint language rule |
| FR-03 | The rendered text snapshot contains only facts already true for the selected order state. | Blueprint trust rule |
| FR-04 | Draft, approval and copy acknowledgement are distinct, append-only audited actions. | W2 readiness audit |
| FR-05 | Approval freezes the exact text; copy returns only the approved snapshot and never regenerates it. | W2 readiness audit |
| FR-06 | Retry is idempotent and conflicting reuse of an idempotency identity fails closed. | Blueprint §18.7 |
| FR-07 | QA, cancelled, wrong-state and unknown orders cannot create customer-facing drafts. | Existing OS invariants |
| NFR-01 | CLI/service contract works before UI; browser contains no template or eligibility authority. | Constitution I |
| NFR-02 | Owner-only, same-origin POST, signed HttpOnly submission identity and no PII/secrets in URLs/logs/analytics. | Blueprint security |
| NFR-03 | Migration is additive, service-role only, reversible while unused and inert under earlier app artifacts. | Release governance |
| CON-01 | W2-A never calls Meta/Graph API and never opens or automates WhatsApp Web. | Coexistence gate |
| CON-02 | No Production mutation or deploy without a separate explicit GO after all gates. | Owner release governance |

## Governed templates

| Key | Minimum verified state |
|---|---|
| `order_confirmed` | Accepted real order |
| `pickup_confirmed` | Pickup completed / custody left the customer |
| `received_at_laundry` | Custody reached the laundry |
| `ready_for_delivery` | Production is ready |
| `payment_confirmed` | Signed financial state is paid |
| `delivered` | Explicit delivery completion |

Unknown time, ETA, address, room, invoice, amount or payment link is omitted. The message never promotes a customer
request (`needed_by`) into an A7 promise.

## Acceptance criteria

- [x] CLI/API returns the eligible templates for a real order without exposing the full phone in the browser response.
- [x] EN/PT/ES rendering uses only the protected order context and preserves the exact approved text.
- [x] Wrong-state, cancelled and QA orders fail closed.
- [x] Draft creation, approval and copied acknowledgement are independently auditable.
- [x] Same retry returns the prior result; conflicting idempotency reuse fails closed.
- [x] Only Owner may create, approve or acknowledge copy.
- [x] Browser must approve before the Copy action becomes available.
- [x] Clipboard failure does not record a successful copy acknowledgement.
- [x] No Meta token, bridge token, full phone, hotel/room, message body or customer UUID appears in URL, analytics or logs.
- [x] No Stripe, WhatsApp, Google Ads, `/order`, attribution snapshot or lifecycle behavior changes.
- [x] Desktop and 390 px UI remain concise and usable.
- [x] Migration/rollback dry-run, lint, typecheck, focused/full tests and build pass.
- [x] Production gate stops before mutation.

## Rollback contract

Application rollback removes the W2-A UI/API and leaves its additive tables inert. Exceptional SQL rollback must refuse
to drop message data after any non-QA draft or audit event exists. Earlier W1B/W1C-A artifacts do not reference W2-A.

## Validation evidence

- Focused W2-A tests: `6/6` passed, including explicit same-request/different-template idempotency conflict.
- OS pretest: `53/53` passed across W0, W1A, W1B, W1C-A and W2-A.
- Repository suite: `80/80` root tests and `66/66` MOS tests passed.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate:structure` and
  `npm run validate:agents` passed. Agent validation retained 121 pre-existing dependency warnings and zero errors.
- Isolated PostgreSQL 15 chain from the Orlando bridge/P0 baseline through W2-A applied successfully.
- Transactional SQL smoke returned `BEGIN / DO / ROLLBACK`; unused-schema rollback completed successfully.
- Browser QA passed at 1440 px and 390 px: no document-level horizontal overflow, all message controls visible,
  no console errors/warnings, and the temporary visual harness was removed after inspection.
- No Supabase remote migration, Vercel deployment, Meta send, WhatsApp automation or Production mutation occurred.

Detailed gate: `docs/audits/2026-08-30-orlando-os-w2-a-whatsapp-drafts-gate.md`.

## File List

- `docs/stories/a7-021-orlando-os-w2-a-whatsapp-drafts.md`
- `docs/audits/2026-08-30-orlando-os-w2-a-whatsapp-drafts-gate.md`
- `supabase/migrations/20260830060000_orlando_os_w2_a_whatsapp_drafts.sql`
- `supabase/rollbacks/20260830060000_orlando_os_w2_a_whatsapp_drafts.rollback.sql`
- `lib/system-message-service.js`
- `lib/operational-store.js`
- `api/system/message-draft.js`
- `api/system/order-messages.js`
- `scripts/a7-system-messages.mjs`
- `scripts/test-system-w2-a.mjs`
- `scripts/test-system-w2-a.sql`
- `sistema.js`
- `sistema-w1b.css`
- `package.json`
