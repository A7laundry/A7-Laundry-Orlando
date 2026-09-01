# A7 Orlando OS — W2-A WhatsApp Drafts Gate

**Date:** 2026-08-30
**Scope:** local W2-A only
**Decision:** **GO LOCAL / NO-GO PRODUCTION**

## Outcome

W2-A is ready for review as a private, Owner-only manual assistance layer. It generates a deterministic customer
update from durable order state, requires explicit review and approval, copies only the approved text, and appends an
audit acknowledgement after clipboard success. It does **not** send through Meta, automate WhatsApp Web, open a
customer conversation, or change any external platform.

Production remains blocked by release sequencing and a separate exact Owner authorization. This gate does not approve
a migration push, deployment or cutover.

## Requirement evidence

| Gate | Evidence | Result |
|---|---|---|
| Governed order/state templates | `lib/system-message-service.js`; focused tests | PASS |
| EN/PT/ES exact snapshots | render test; no property, room, phone, amount or link in text | PASS |
| Human review boundary | UI exposes preview, then approve, then copy | PASS |
| Clipboard failure boundary | audit request occurs only after `navigator.clipboard.writeText` resolves | PASS |
| Append-only audit | draft/create, approve and copied events; SQL smoke count = 3 | PASS |
| Retry semantics | duplicate retry returns prior draft; conflicting request reuse fails closed | PASS |
| Authorization | Owner session required by both APIs and service | PASS |
| Browser privacy | last four phone digits only; POST body; no analytics/storage/URL propagation | PASS |
| Transport isolation | no Graph API, bridge token, `wa.me`, `window.open` or Web automation | PASS |
| External isolation | no Stripe, Google Ads, `/order`, attribution or lifecycle edits | PASS |
| Migration safety | additive, RLS-enabled, service-role-only, inert to earlier artifacts | PASS |
| Rollback | application rollback leaves tables inert; unused-schema SQL rollback passed; fail-closed evidence guard reviewed | PASS |

## Validation run

| Check | Result |
|---|---|
| `node --test scripts/test-system-w2-a.mjs` | 6/6 PASS |
| OS pretest | 67/67 PASS |
| Root repository tests | 86/86 PASS |
| MOS tests | 67/67 PASS |
| Lint | PASS |
| Typecheck | PASS |
| Build | PASS |
| Structure validation | PASS |
| Agent validation | PASS — 0 errors; 121 pre-existing warnings |
| `git diff --check` | PASS |
| PostgreSQL 15 migration chain | PASS |
| Transactional SQL functional smoke | `BEGIN / DO / ROLLBACK` PASS |
| Unused-schema SQL rollback | PASS |

## Visual QA

The real system styles were exercised through a temporary local harness and the harness was removed afterward.

| Viewport | Evidence | Result |
|---|---|---|
| Desktop 1440 × 1000 | width 1440; scroll width 1440; all controls visible | PASS |
| Mobile 390 × 844 | width 390; scroll width 390; all controls visible | PASS |
| Console | no errors or warnings | PASS |

The sequence is legible in both viewports:

```text
Generate preview → review exact text → approve → copy approved text
```

## Privacy and operational boundary

- Full WhatsApp number, customer UUID, hotel, room and internal order UUID do not leave the protected server context.
- The browser receives the order number, final four digits, language, eligible template labels and exact message snapshot.
- Message text is not placed in URLs, analytics, browser storage or diagnostic logs.
- A successful clipboard write followed by an audit failure is disclosed truthfully; it is not reported as an audited copy.
- QA, cancelled, unknown, stale and wrong-state orders fail closed.

## Release sequencing

W2-A depends on the operational order detail delivered by W1B. The current migration/release order is:

1. preserve the current W1B Production baseline;
2. separately release W1C-A migration `20260830050000` only after its exact GO;
3. build W2-A from that accepted baseline and apply only `20260830060000` after an independent gate;
4. release W3-A `20260830070000` and W1C-B1 `20260830080000` only in their own later gates;
5. never use `--include-all`, renumber migrations or bundle future slices into W2-A.

Until then, W2-A stays local. No remote state was changed by this gate.

## Post-gate delayed-retry correction — 2026-08-30

A final source review found that draft creation evaluated current template eligibility before resolving an exact
prior request. A delayed retry could therefore fail after the order advanced or was cancelled, even though the
immutable draft already existed. W2-A now resolves the server-derived idempotency identity through a narrow
service-role RPC before regenerating facts or evaluating new-write eligibility. It validates the same order and
template, returns only the prior draft for an exact retry, and rejects conflicting reuse. The lower SQL and memory
stores also resolve the prior event before mutable state. No message was sent and Production was not changed.

The corrected contract passed 6/6 focused tests and the full `67/67 → 86/86 → 67/67` validation chain. An isolated
PostgreSQL 15 transaction created the draft, cancelled the order with valid cancellation evidence, returned the
original draft with `duplicate=true`, retained exactly three governed draft/action events through approval and copy,
and rolled every synthetic row back. This closes the delayed-retry defect locally; it does not authorize W2-A release.
