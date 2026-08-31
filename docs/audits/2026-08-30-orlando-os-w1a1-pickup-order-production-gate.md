# A7 Orlando OS W1A.1 — Pickup Order Production Gate

**Date:** 2026-08-30
**Scope:** MCO human numbering, optional initial bag count and private Pickup Order
**Decision:** **GO — PRODUCTION DEPLOYED / VERIFIED**
**Current Production:** `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa`
**Rollback deployment:** `dpl_6Vm1noZmLtevwLAHd1Bhf37Axpdw`

Production execution was explicitly authorized on 2026-08-30. Only migration `20260830020000`
and the isolated W1A.1 application artifact were applied. No secret, Stripe, WhatsApp, Google Ads,
GA4, `/order`, attribution snapshot or financial-flow mutation was executed.

## Production execution evidence

| Gate | Result |
|---|---|
| Alias before cutover | PASS — `a7laundry.com` on `dpl_6Vm1noZmLtevwLAHd1Bhf37Axpdw` |
| Remote migration ledger before cutover | PASS — only `20260830020000` pending |
| Supabase dry-run | PASS — only `20260830020000_orlando_os_w1a1_pickup_order.sql` |
| Remote migration application | PASS — ledger local/remote synchronized through `20260830020000` |
| Isolated Production deploy | PASS — `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa` Ready |
| Production alias after cutover | PASS — `https://a7laundry.com` points to the new deployment |
| Owner session | PASS — `Dennis Arruda · owner` |
| Controlled non-financial smoke order | PASS — `MCO 1002` |
| Synthetic QA marking | PASS — explicitly marked do-not-fulfill / do-not-dispatch |
| New-number uniqueness after smoke | PASS — `MCO 1003` not found |
| Historical order | PASS — `A7-ORL-1000` remains retrievable |
| Pickup Order lookup | PASS — same `MCO 1002`; no second order |
| Pickup Order content | PASS — customer, property, room, governed service price/minimum, pickup window/location, bags, needed-by and special instructions |
| Private route guards | PASS — unauthenticated order and Pickup APIs return HTTP 401 |
| Public routes | PASS — `/` and `/order` return HTTP 200 |
| Financial method guards | PASS — Stripe webhook and Payment Link GET requests return HTTP 405; no financial request sent |
| Production 5xx during smoke | PASS — none |
| Private security headers | PASS — no-store, noindex, CSP and frame denial |
| Browser document security | PASS — no UUID, secret marker, tip or payment data |
| Published private assets | PASS — all eight assets are byte-for-byte identical to the approved isolated artifact |

The Production smoke intentionally created only one order. Live lookup proved that no `MCO 1003`
exists. Retry and concurrent-allocation behavior were proven against the exact applied PostgreSQL
function in isolated database QA and by the focused automated suite; the smoke did not manufacture a
second live order merely to restate that evidence.

## Scope delivered

The existing W1A order remains the sole commercial and operational aggregate. W1A.1 adds:

- server-generated `MCO 1002+` human numbering for new manual orders;
- optional `bags_expected` on that order;
- governed pickup location and optional property/care information in the existing lead operational data;
- a private Pickup Order representation of the same order;
- native-browser print support;
- an additive, inactive `payment_total` field constrained to equal
  `service_amount + tip_amount` when populated.

Tip selection remains disabled. The existing database constraint requiring `tip_amount = 0` remains
unchanged. Pickup Order exposes price basis and minimum only.

## Migration review

Migration: `supabase/migrations/20260830020000_orlando_os_w1a1_pickup_order.sql`

| Change | Classification | Evidence |
|---|---|---|
| `a7_orlando_mco_order_number_seq` | Additive | Starts at 1002; PostgreSQL `nextval`; unique order constraint remains authoritative |
| `bags_expected` | Additive nullable column | Integer 1–100 when supplied |
| `payment_total` | Additive nullable preparation | Must equal service amount plus tip when populated |
| `a7_orlando_create_manual_order_v2` | Additive RPC | Wraps the existing W1A RPC atomically; the old RPC is not replaced |
| Existing rows | Unchanged | No backfill and no renumbering |

The first isolated migration attempt caught an incorrect function signature in the V2 grant. PostgreSQL
aborted that migration. The signature was corrected, and the complete operational migration chain then
applied cleanly from an empty PostgreSQL 17 database.

### Numbering rule

The old RPC first creates the same atomic customer/lead/order/items aggregate. Within that same database
transaction, V2 assigns:

```text
MCO ${nextval('a7_orlando_mco_order_number_seq')}
```

Sequence allocation is server-side, atomic and concurrency-safe. Sequence values are never rolled back or
reused; a failed transaction may create a harmless gap. The unique `order_number` constraint remains in
force.

An idempotent retry is resolved by the unchanged W1A submission record before V2 allocates another MCO
number. Existing submissions return their existing number, including an historical `A7-ORL-*` number.

## PostgreSQL QA

All rows below existed only in the isolated local QA database.

| Gate | Result |
|---|---|
| Historical order created through unchanged W1A RPC | PASS — `A7-ORL-1000` |
| Two distinct V2 calls executed concurrently | PASS — `MCO 1002`, `MCO 1003` |
| Duplicate-number check | PASS — 3 orders / 3 distinct human numbers |
| Retry of the same V2 submission | PASS — duplicate true; same `order_id`; same `MCO 1003` |
| Historical row after V2 calls | PASS — still `A7-ORL-1000` |
| Bags | PASS — 2 persisted on each MCO QA order |
| Tip/payment preparation | PASS — `tip_amount` and `payment_total` remain null; no financial event |
| Old and V2 RPC coexistence | PASS |
| Destructive rollback guard with MCO rows | PASS — refused with explicit counts |

## Pickup Order

### Route

```text
/sistema/orders/:orderNumber/pickup-order
```

Example safe route:

```text
/sistema/orders/MCO%201002/pickup-order
```

The public address contains only the non-PII human number. The underlying `order_id` remains opaque and
never enters the URL, DOM or response.

### Document content

The authenticated endpoint joins the existing order with its existing customer, lead and frozen governed
order items. It returns only the document contract:

- current human number and status;
- customer name, WhatsApp, language and optional room;
- property type/name and optional address;
- service tier, items, unit price, unit and minimum;
- pickup window/location/instructions and optional expected bags;
- needed-by time;
- optional governed care flags and customer instructions.

No edit operation exists on this view. Opening or printing the document creates no order, lead, invoice,
payment, tip or lifecycle transition.

## Visual QA

| Gate | Result |
|---|---|
| Mobile viewport | PASS — 390 × 844 |
| Mobile horizontal overflow | PASS — document scroll width 375 within 390 viewport |
| Mobile responsive structure | PASS — two-column sections collapse to one 347 px column |
| Mobile primary identity | PASS — `MCO 1002` and status visible without horizontal scrolling |
| Native Chrome print-to-PDF | PASS |
| Printed pages | PASS — 1 page |
| Paper | PASS — US Letter portrait |
| Print defects | PASS — no clipping, overlap, broken table or missing section |
| Print controls | PASS — toolbar excluded by print CSS |

## Security and privacy

| Gate | Result |
|---|---|
| Unauthenticated API | PASS — HTTP 401 |
| Authenticated Owner/Operator contract | PASS |
| Production owner-only fail-closed mode | Preserved |
| Static route without a session | Contains no order data |
| PII in public URL/query | PASS — none; only human order number and optional `print=1` |
| Internal UUIDs in Pickup Order response/DOM | PASS — absent |
| Secrets in browser assets or isolated Vercel output | PASS — absent |
| Analytics/tracking on private document | PASS — absent |
| Cache/indexation | PASS — no-store, noindex, CSP and frame denial |
| Stripe/WhatsApp/Ads/GA4/`/order` changes | PASS — none |

## Automated gates

| Gate | Result |
|---|---|
| Focused W0/W1A/W1A.1 tests | PASS — 15/15 |
| Full repository Node test group | PASS — 80/80 |
| MOS test group | PASS — 66/66 |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| Isolated `vercel build --prod` | PASS |
| Isolated runtime inventory | PASS — 8 baseline + 8 `/api/system`; no `/api/whatsapp` |
| Isolated static assets | PASS — system and Pickup Order assets present |

## Isolated release artifact

Prepared at:

```text
/private/tmp/a7-w1a1-production-release-0830
```

It is based on `d832c4a`, overlays the exact currently deployed W0/W1A runtime, then adds only W1A.1.
It contains no WhatsApp expansion or unrelated dirty-worktree assets. It has been built but not deployed.

## Rollback

### Primary application rollback

If a W1A.1 deployment fails, restore the current Production deployment:

```text
dpl_6Vm1noZmLtevwLAHd1Bhf37Axpdw
```

Because the old W1A RPC remains present and unchanged, the prior application resumes immediately. The
new function, sequence and nullable columns remain inert.

### Exceptional schema rollback

`supabase/rollbacks/20260830020000_orlando_os_w1a1_pickup_order.rollback.sql` may remove the V2 function,
sequence, constraints and nullable columns only when there are zero MCO orders, zero bag values and zero
payment totals. It refuses destructive cleanup after W1A.1 data exists.

## Production decision

**GO**, conditional on a separate explicit Owner instruction to execute Production.

Authorized next sequence after that instruction:

1. recheck remote migration ledger and current deployment alias;
2. apply only migration `20260830020000`;
3. deploy the already-built isolated artifact;
4. authenticate as Owner;
5. create at most one clearly marked non-financial QA order;
6. prove `MCO 1002`, lookup, Pickup Order, one-page print, idempotency and PII/secrets;
7. verify public home, `/order`, Stripe method guards and unchanged integration endpoints;
8. rollback immediately on any failed gate.

No W1B, invoice, payment, tip, Stripe, WhatsApp, Google Ads, GA4 or automation work is authorized.
