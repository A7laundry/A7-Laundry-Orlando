# Lake Buena Vista funnel — commercial reconciliation

**Release:** 2026-08-21 00:23 EDT  
**Landing:** `https://a7laundry.com/blog/laundry-lake-buena-vista`  
**Funnel marker:** `SEO-LBV-V2`  
**Story:** A7-011

This ledger prevents traffic and WhatsApp microconversions from being reported as sales. It contains no customer name, room number, telephone, address, message body, click ID or other PII.

## Measurement hierarchy

1. **Paid order:** payment/receipt confirmed and reconciled to an operational order.
2. **Qualified lead:** hotel/vacation-rental guest inside the confirmed area, with a real laundry need and a usable service window, adjudicated by the operator.
3. **Contact:** a conversation exists, but qualification or source is not yet proven.
4. **WhatsApp open/click:** technical microconversion only; never a lead, order or revenue by itself.
5. **Page session/view:** exposure only.

The strongest available deterministic source identifier wins. `SEO-LBV-V2` and A7 Ref can support funnel identification, but they do not replace a click ID or prove that a payment came from Google Ads. A source remains `unattributed` when deterministic evidence is absent.

## Source availability at release

| Source | Immediate state | Boundary |
|---|---|---|
| Public technical monitor | Live | Availability, hashes, offer, destinations, tracking contract, robots, sitemap and adjacent-page intent only. |
| GA4 via protected MOS | Unavailable in this monitoring session | MOS requires an authenticated owner session. No credentials were inspected or requested; unavailable is not zero. |
| Search Console via protected MOS | Unavailable in this monitoring session | Same authentication boundary; GSC also has reporting latency. |
| WhatsApp operations | Not inspected | Private conversations and PII are outside the technical smoke. Only owner-supplied aggregate adjudication may enter this ledger. |
| Paid orders / Stripe / receipts | Not reconciled | A payment count or value must be matched to an operational order and source evidence before inclusion. |
| Margin | Not reconciled | Revenue is not margin. Use the finance-approved contribution definition and record its source. |

## Checkpoint record

Create one new append-only record per checkpoint. Never overwrite an earlier record.

| Field | Allowed value / rule |
|---|---|
| `checkpoint` | `24h`, `72h`, `7d`, `14d`, or `28d` |
| `window_start`, `window_end` | Orlando local timestamps; preserve attribution/reporting lag notes |
| `technical_evidence` | Path to the immutable JSON produced by `npm run monitor:lbv` |
| `ga4_status`, `gsc_status` | `live`, `partial`, `no_data`, `unavailable`, or `insufficient_lag` |
| `landing_sessions` | Integer only when GA4 source is live/partial; blank otherwise |
| `whatsapp_opens` | Integer microconversion; never copied into qualified leads or orders |
| `qualified_leads` | Operator-adjudicated aggregate; blank if not reconciled |
| `paid_orders` | Confirmed aggregate matched to orders/receipts; blank if not reconciled |
| `revenue_usd` | Paid/confirmed revenue only; blank if currency/source is uncertain |
| `contribution_margin_usd` | Finance-approved contribution, never inferred from revenue |
| `deadline_handoff_status` | Aggregate `met`, `missed`, `mixed`, `unavailable`; no customer details |
| `source_breakdown` | Aggregate counts by deterministic source; keep unmatched as `unattributed` |
| `sample_status` | `sufficient`, `insufficient`, or `unavailable`, with rationale |
| `decision` | `continue`, `investigate`, or `rollback`; include evidence and owner |

## Decision rules

- Do not calculate a conversion rate when either numerator or denominator is unavailable, partial without a valid boundary, or drawn from different populations.
- Do not label a before/after difference as uplift or causality. Seasonality, campaign mix, attribution lag, demand and operational capacity remain confounders.
- Do not use raw WhatsApp opens, pageviews, CTR or Google Ads aggregated conversions as the success metric.
- Do not include a purchase without a verified payment/order record. Do not include revenue without explicit currency.
- Keep GSC observations separate from GA4 users/sessions; the platforms do not represent deduplicated people.
- A7 Ref/funnel marker supports funnel classification; Google Ads attribution requires its own deterministic evidence.

## Rollback boundary

Immediate rollback is justified by a verified technical or operational failure: public/asset outage, broken official destination, lost prefill/funnel/tracking contract, unsupported claim, canonical/indexation regression or message incompatible with actual capacity.

A commercial rollback requires a sustained decline in qualified leads or paid orders with adequate sample, reconciled sources and no reasonable explanation from attribution lag, mix, demand or operational capacity. One quiet day, raw click movement or insufficient data is not a rollback signal.
