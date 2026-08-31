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
| OS pretest | 53/53 PASS |
| Root repository tests | 80/80 PASS |
| MOS tests | 66/66 PASS |
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

W2-A depends on the operational order detail delivered by W1B. The current safe order is:

1. approve and complete the already prepared W1B cutover and authenticated smoke;
2. separately review/release W1C-A if still desired;
3. build a new isolated W2-A candidate from the accepted baseline;
4. re-run Preview/migration/auth/privacy gates;
5. obtain a new exact Production GO for that artifact.

Until then, W2-A stays local. No remote state was changed by this gate.
