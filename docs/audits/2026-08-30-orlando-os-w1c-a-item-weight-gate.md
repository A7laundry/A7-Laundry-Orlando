# A7 Orlando OS — W1C-A Item Weight Gate

**Date:** 2026-08-30
**Scope:** actual weight per per-pound order item only
**Environment changed:** local workspace only
**Supabase Production changed:** no
**Vercel Production changed:** no
**Gate verdict:** implementation `GO`; Production cutover `NO-GO` until W1B is live, its smoke passes and the Owner gives a new explicit authorization

## Release boundary

W1C-A adds the smallest usable weighing step to the laundry operation:

```text
picked_up + at_laundry + awaiting_weight
→ record actual weight on each lb item
→ derive item subtotal from the governed stored price
→ all lb items complete
→ emit order_weighed once
→ weighed + awaiting_processing
```

It does not create an invoice, calculate the final payable total, enforce the order minimum, create a Payment Link,
contact Stripe, change payment state, deliver an order, send WhatsApp messages, alter `/order`, emit analytics or
change Google Ads.

## Gate evidence

| Gate | Evidence | Result |
|---|---|---|
| Story and traceability | Story A7-020 maps every behavior to the approved operations blueprint and W1B invariants. | PASS |
| CLI-first | `scripts/a7-system-operations.mjs` accepts item ID, actual weight and expected version before UI use. | PASS |
| Additive migration | Four nullable/default-safe item columns, one private append-only evidence table, private service-role RPCs and one fixed-only transition trigger. | PASS |
| Remote migration dry-run | `supabase db push --dry-run --include-all` reports only `20260830050000_orlando_os_w1c_a_item_weight.sql`; nothing was pushed. | PASS |
| SQL behavior | Isolated PostgreSQL smoke passed partial/final weighing, one lifecycle event, retry, correction, fixed-only flow and pricing derivation. | PASS |
| Idempotency/concurrency | Stable idempotency key, row locking and monotonic `weight_version`; retry returns prior result and stale/conflicting writes fail closed. | PASS |
| Authorization | Owner-only transition; QA, non-Owner, malformed item ID and wrong origin fail closed. | PASS |
| Price authority | Browser submits no unit price or subtotal; the server derives subtotal from the stored order-item snapshot. | PASS |
| PII/secrets | Weight evidence contains opaque IDs and weight facts only; no customer PII, secret, URL parameter, analytics payload or diagnostic log was added. | PASS |
| Finance isolation | No invoice/payment/refund/Stripe tables, handlers or settings are written by W1C-A. | PASS |
| Regression suite | System pretests 47/47 and full repository tests 66/66 passed. | PASS |
| Repository quality | Lint, typecheck, build, structure and agent validation passed; `git diff --check` passed. | PASS |
| Visual desktop | Synthetic authenticated Owner harness showed the item list, progress, correction reason and pending weight without duplicate action controls. | PASS |
| Visual 390 px | Exact 390 × 844 viewport showed full inputs/buttons and readable item progress without horizontal form overflow. | PASS |

The repository command `npm run sync:ide:check` is not defined in the current package manifest. This is an existing
tooling availability gap, not a W1C-A runtime or quality failure; no substitute mutation was made.

## Tested invariants

1. A partial weight does not advance lifecycle or production.
2. The final required item emits exactly one `order_weighed`.
3. A duplicate identical request does not create another weight or lifecycle event.
4. Reusing an idempotency key with different facts fails closed.
5. A stale `weight_version` fails closed.
6. A correction requires a bounded reason and cannot silently rewrite history.
7. A fixed-price item rejects weight and does not block a fixed-only order in `awaiting_weight`.
8. Injected browser `unit_price` or `subtotal` is ignored.
9. QA orders remain read-only.
10. Historical unknown weights remain null rather than zero.

## Rollback readiness

Primary rollback is application-only:

1. restore the last verified W1B application artifact;
2. confirm `/sistema`, Today, Orders and W1B transitions operate normally;
3. leave the additive W1C-A schema inert;
4. do not delete weight evidence.

The exceptional SQL rollback may be used only before any real weight exists. It refuses to remove W1C-A columns or
infrastructure when an actual weight or item-weight event exists. That guard prevents loss of operational evidence.

## Cutover prerequisites

W1C-A must not be released directly over the current Production baseline. Before a W1C-A Production mutation:

1. promote the already-approved W1B candidate under its own explicit GO;
2. pass the authenticated Owner W1B Production smoke or roll back immediately;
3. build a W1C-A candidate from the exact reviewed workspace;
4. verify the candidate and migration order;
5. receive a new explicit Owner GO naming W1C-A;
6. apply migration first, then promote the exact application artifact;
7. execute an authenticated synthetic QA smoke without touching financial flows;
8. roll back the app immediately if any gate fails.

## Final verdict

**W1C-A is ready for review and a later controlled release. It is intentionally not authorized for Production in
this gate.** The next executable release remains W1B, using its existing candidate and rollback contract.
