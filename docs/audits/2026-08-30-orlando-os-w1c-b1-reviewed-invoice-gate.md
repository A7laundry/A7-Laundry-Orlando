# A7 Orlando OS — W1C-B1 Reviewed Invoice Gate

**Date:** 2026-08-30
**Scope:** local W1C-B1 reviewed/versioned invoice only
**Verdict:** **GO LOCAL / NO-GO PRODUCTION**

## Outcome

The local candidate now turns confirmed order-item facts into one explainable invoice version without trusting the
browser for price, amount, minimum, tip or technical identity. The Owner can issue the first invoice, create a new
immutable version after facts change and a reason is supplied, or void the current unpaid/unlinked invoice while
preserving history.

No Stripe call or Payment Link is part of this slice. `purchase`, refunds, webhook handling, delivery, WhatsApp,
Google Ads and public `/order` behavior remain unchanged.

## Gate matrix

| Gate | Result | Evidence |
|---|---|---|
| Server-derived item lines | PASS | Per-pound and fixed-price paths exercised in Node and PostgreSQL. |
| Governed minimum once | PASS | US$46 item subtotal + US$4 explicit adjustment = US$50. |
| Tip | PASS | Schema, service and UI fix tip at US$0. |
| Unresolved/manual price | PASS | Review fails closed before invoice creation. |
| Owner authorization | PASS | Service and APIs reject non-Owner/unauthenticated access. |
| Same-origin/signed submission | PASS | Context is private; issue/replace/void require signed HttpOnly action identity. |
| Version/history integrity | PASS | Version 2 supersedes version 1; prior header and lines remain unchanged. |
| Void/history integrity | PASS | Current payable header clears; invoice/event evidence remains. |
| Paid/linked immutability | PASS | Paid states and any known historical/current Payment Link block writes. |
| Idempotency | PASS | Exact retry is stable; changed facts/reason with the same key fails closed. |
| Browser authority boundary | PASS | Browser sends only action, order number, expected version and bounded reason. |
| PII/secrets | PASS | Safe browser payload omits internal invoice/item IDs and facts hash; invoice lines contain no customer PII. |
| Database migration | PASS | Full 202608 chain applied on isolated PostgreSQL 15.16. |
| SQL functional smoke | PASS | Issue, retry, correction, one lifecycle event, void and PII checks; transaction rolled back. |
| Rollback unused schema | PASS | W1C-B1 objects removed and absence verified. |
| Rollback with evidence | PASS | Correctly refused with `invoice evidence exists`; app-first rollback remains required. |
| Focused Node tests | PASS | 6/6. |
| Private OS pretest | PASS | 64/64. |
| Repository/MOS tests | PASS | 80/80 and 66/66. |
| Lint/typecheck/build | PASS | All required project gates completed. |
| Desktop visual | PASS | 1440 px: document width 1440/1440, invoice width 900, action 46 px. |
| Mobile visual | PASS | 390 px: document width 390/390, invoice width 358, action 46 px. |

## Deliberate policy boundary

A voided invoice cannot be reissued in W1C-B1. A correction must be made by replacing the current invoice before
voiding it. This prevents the local candidate from silently inventing a post-void financial policy; any reissue rule
belongs to an explicitly approved later slice.

## Rollback readiness

Before first invoice evidence exists, the exceptional SQL rollback is reversible and tested. After any invoice or
invoice-event row exists, financial history is deliberately non-destructive: rollback means restoring the previous
application artifact while retaining the additive schema and evidence.

## Production gate

Production remains **NO-GO**. No migration, Vercel deployment, Supabase write, Stripe action, WhatsApp action or
campaign change was made. Production requires a separately identified artifact, authenticated Owner smoke plan,
rollback target and exact Owner GO.
