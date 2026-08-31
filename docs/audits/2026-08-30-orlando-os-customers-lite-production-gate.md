# A7 Orlando OS — Clientes Lite Production Gate

**Date:** 2026-08-30
**Scope:** W1A.3 Clientes Lite only
**Outcome:** `LIVE / PASS AFTER EXERCISED ROLLBACK`

## Scope lock

Clientes Lite adds private customer search and a read-only customer summary. It does not add CRM, campaigns,
editing, merge automation, Stripe behavior, WhatsApp integration, analytics, `/order` changes or later OS waves.

## Remote schema audit

The linked Production schema was exported schema-only. Existing sources are sufficient:

- `a7_wa_contacts`: stable customer ID, normalized WhatsApp ID and name;
- `a7_orlando_orders`: customer/order relationship, status, service amount and human number;
- `a7_orlando_leads`: language, accommodation and latest property context;
- `a7_orlando_payments`: reconciled payment status and refund total;
- `a7_orlando_attribution_snapshots`: immutable initial acquisition evidence.

Before release, the remote migration ledger ended at W1A.1. `supabase db push --dry-run` reported only
`20260830030000_orlando_os_customers_lite.sql` as pending. The authorized Production release applied that migration
and a follow-up remote ledger check confirmed it as the only new migration.

## Proposed additive migration

- Add nullable `email` and `email_source` to `a7_wa_contacts`.
- Add `is_qa boolean not null default false` to `a7_orlando_orders`.
- Add one partial email lookup index.
- Add four `security definer` read functions restricted to `service_role`:
  QA classification, confirmed service revenue, bounded customer search and customer detail.
- Create no customer/CRM table and persist no revenue/LTV aggregate.

Email remains empty until a separately approved operational source supplies it. This release does not read from or
change Stripe and does not silently copy email from another system.

## Matching and conflicts

Existing order creation remains authoritative: `customer_id` is preserved and normalized WhatsApp is unique per
Orlando unit. Clientes Lite adds read-only resolution by full/last-four phone, exact normalized email, name or an
explicit related order number. Duplicate emails can return multiple customer cards; no record is merged or changed.

## Commercial aggregate rules

Commercial order count and first/last dates exclude cancelled and QA orders. Order history itself remains complete.

`confirmed_service_revenue` is calculated at read time as:

```text
service_amount - successful refund_total
```

It requires matching confirmed financial states in both order and reconciled payment records. Pending, invoice-only,
failed, void, cancelled, QA and unreconciled Payment Links contribute zero. Fully refunded orders contribute zero.
Tip is never read into the calculation.

QA is true when the explicit flag is true or an approved operational field contains a bounded marker: `QA`,
`DO NOT FULFILL` or `DO NOT DISPATCH`. QA orders are retained and visibly labelled.

## Authorization and privacy

- Customer API explicitly requires Owner; unauthenticated requests return `401` and Operator requests return `403`.
- Search and detail use POST bodies. PII does not enter a URL, analytics, static storage or diagnostic logs.
- Browser-visible customer references are authenticated opaque tokens; internal UUIDs remain server-side.
- Responses are bounded to 20 records and contain only screen-required fields.

## Verification

| Gate | Result |
|---|---|
| Focused W0/W1A/W1A.1/W1A.2/W1A.3 tests | PASS — 26/26 |
| Name, phone, email and related-order search | PASS |
| Same phone/customer history | PASS |
| Conflicting email without merge | PASS |
| Confirmed revenue, refund and tip separation | PASS |
| QA, cancelled and pending exclusions | PASS |
| Unauthenticated / non-Owner authorization | PASS — 401 / 403 |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS |
| Secret/analytics/PII static scan | PASS |
| 390 px QA | PASS — app 390/390, detail 356/356, zero overflow |
| Migration ledger and official dry-run | PASS — only W1A.3 pending |

The existing content-registry warning for comforter canonical adjudication remains unrelated and unchanged.

## Rollback

Primary rollback is application-only to Production deployment `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk`. W1A.3 schema
is additive and inert under that release, so W0/W1A/W1A.1/W1A.2 continue unchanged.

The exceptional SQL rollback drops read functions and the email index. It drops added columns only when no email or
explicit QA value was stored; otherwise it refuses destructive cleanup and preserves data.

## Final gate

The authorized release is live at `https://a7laundry.com/sistema` on deployment
`dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`.

The first application cutover was rolled back to `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk` when authenticated smoke found
that the numeric value zero rendered as “Não informado”. The correction uses a nullish fallback, is protected by a
regression assertion, and passed the full local gate again before a new immutable deployment and cutover.

Final Production evidence:

| Gate | Result |
|---|---|
| Migration ledger | PASS — W1A.3 local/remote match |
| `/`, `/order`, `/sistema` | PASS — HTTP 200 |
| Unauthenticated customer API | PASS — 401, no customer data |
| Authenticated Owner session | PASS |
| Name / last four / full phone / MCO / legacy lookup | PASS — one expected result each |
| PII in URL/query string | PASS — none; browser remained on `/sistema` |
| Internal IDs in rendered search/detail | PASS — none |
| QA count and confirmed service revenue | PASS — zero displayed truthfully; QA retained and excluded |
| Existing Pickup Order linkage | PASS |
| Customer/order mutation or duplication | PASS — none; release is read-only |
| `/order`, Stripe, WhatsApp, GA4 and Google Ads | PASS — untouched by the release artifact |

Email lookup is implemented and covered by local tests, but no Production email fixture was invented or backfilled.
The primary application rollback remains ready at `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk`; W1A.3 database additions are
safe and inert under that rollback release.
