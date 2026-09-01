# A7 Orlando OS — W1C-B1 Reviewed Invoice Gate

**Date:** 2026-08-30
**Scope:** isolated W1C-B1 reviewed/versioned invoice, PDFs and authorized team access
**Verdict:** **PRODUCTION READY**

## Outcome

The local candidate now turns confirmed order-item facts into one explainable invoice version without trusting the
browser for price, amount, minimum, tip or technical identity. The Owner can issue the first invoice, create a new
immutable version after facts change and a reason is supplied, or void the current unpaid/unlinked invoice while
preserving history.

No Stripe call or Payment Link is part of this slice. `purchase`, refunds, webhook handling, delivery, WhatsApp,
Google Ads and public `/order` behavior remain unchanged.

The local candidate also renders the immutable issued invoice as a branded letter-size PDF and renders a separate
4 x 6 thermal bag label from current protected order facts. The thermal mark is vector-only so it remains crisp on
203/300 dpi printers instead of turning the gradient logo into a black raster blot. Document generation is private,
same-origin, no-store and read-only.

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
| Idempotency | PASS | Exact retry returns the immutable prior invoice after later fact/state changes; conflicting version/reason/order fails closed. |
| Browser authority boundary | PASS | Browser sends only action, order number, expected version and bounded reason. |
| PII/secrets | PASS | Safe browser payload omits internal invoice/item IDs and facts hash; invoice lines contain no customer PII. |
| Invoice PDF | PASS | Uses the current issued immutable invoice, official color logo and customer/order presentation only; no financial write. |
| Thermal 4 x 6 label | PASS | Exact 288 x 432 pt media box, vector A7 outline, order/customer/handoff facts and no invoice dependency. |
| Database migration | PASS | Full 202608 chain applied on isolated PostgreSQL 15.16. |
| SQL functional smoke | PASS | Issue, delayed review/void retries, correction, one lifecycle event, void and PII checks; transaction rolled back. |
| Rollback unused schema | PASS | W1C-B1 objects removed and absence verified. |
| Rollback with evidence | PASS | Correctly refused with `invoice evidence exists`; app-first rollback remains required. |
| Focused Node tests | PASS | 6/6. |
| PDF document tests | PASS | 5/5. |
| Private OS pretest | PASS | 76/76. |
| Repository/MOS tests | PASS | 86/86 and 67/67. |
| Lint/typecheck/build | PASS | All required project gates completed. |
| Desktop visual | PASS | 1440 px: document width 1440/1440, invoice width 900, action 46 px. |
| Mobile visual | PASS | 390 px: document width 390/390, invoice width 358, action 46 px. |
| PDF visual | PASS | Letter invoice and 4 x 6 thermal label rendered and inspected without clipping or raster-logo blot. |

## Deliberate policy boundary

A voided invoice cannot be reissued in W1C-B1. A correction must be made by replacing the current invoice before
voiding it. This prevents the local candidate from silently inventing a post-void financial policy; any reissue rule
belongs to an explicitly approved later slice.

## Rollback readiness

Before first invoice evidence exists, the exceptional SQL rollback is reversible and tested. After any invoice or
invoice-event row exists, financial history is deliberately non-destructive: rollback means restoring the previous
application artifact while retaining the additive schema and evidence.

## Production cutover — 2026-08-31

- Exact Owner GO received for migration `20260830080000`, isolated W1C-B1 + PDFs, team access and Andreia Batista
  Batemarque as `operator`.
- Supabase target revalidated as Orlando Production `wiwawtpaxnrueugppasi`; only migration `20260830080000` was
  pushed. W2 `20260830060000` and W3 `20260830070000` were excluded.
- The protected Owner credential was not downloaded, replaced or rotated. The release adds the encrypted
  `A7_SYSTEM_TEAM_USERS_JSON` variable and changes `A7_SYSTEM_ACCESS_MODE` from `owner_only` to `team`.
- Isolated release verifier passed for W1B + W1C-A + W1C-B1 + PDFs, with W2/W3 endpoints, migrations and executable
  symbols absent.
- Quality gates passed: lint, typecheck, 66 private-system tests, 86 repository tests, 67 MOS tests and public build.
- Production deployment `dpl_BcZRqwNyHPRkJWeGC5TrPdqvoC7B` is READY and owns `a7laundry.com` plus
  `www.a7laundry.com`.
- Authenticated operator smoke passed login/session, private boundary, governed catalog, Owner-only denials,
  document-route authorization, system shell, release scope and public-secret scan.
- The smoke created no order, invoice, payment, refund or database residue. No Stripe, WhatsApp, Google Ads or
  `/order` change occurred.
- Rollback target `dpl_CyR1PBmX9E85V39JDG2gRFDjtH63` remains READY and was not required.

## Post-gate delayed-retry correction — 2026-08-31

The final audit found that the application regenerated invoice facts before checking an exact prior request, and the
SQL retry branch compared the event against a newly generated preview. A network retry could therefore fail after
items, cancellation or payment state changed even though the immutable invoice action already existed. W1C-B1 now
resolves the order-bound request identity first, validates action/version/reason, and returns only the original
invoice snapshot. New writes still evaluate every current financial guard. Node and isolated PostgreSQL tests prove
delayed issue and void retries without creating a second invoice or lifecycle event. Production and Stripe were not
changed.
