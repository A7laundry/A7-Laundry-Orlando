# Google Ads read-only audit — 2026-07-24

## Evidence boundary

- Source: authenticated Google Ads interface, read only.
- Account: `A7 Laundry - 01` (`290-113-2891`).
- Audit date: 2026-07-24.
- Currency: BRL.
- Account timezone: GMT-03:00, Brasília Standard Time.
- Available reporting range: 2025-06-02 through 2026-07-24.
- No export was downloaded and no campaign, budget, conversion, billing or account setting was changed.
- This evidence is a browser-read snapshot. It is not a live API connection.

## Account and delivery

- Account status: active.
- Campaigns: 5 total; 3 enabled and 2 paused.
- Enabled daily budget: R$ 348.18/day.
- Available funds: R$ 0.10.
- Delivery state: effectively stopped because funds are exhausted.

## All-time performance shown by Google Ads

| Metric | Value |
|---|---:|
| Impressions | 8,080 |
| Clicks | 167 |
| CTR | 2.07% |
| Average CPC | R$ 28.23 |
| Spend | R$ 4,714.27 |
| Interactions | 199 |
| Campaign conversions | 18 |
| Conversion rate | 9.05% |
| Average CPA | R$ 261.90 |
| Sales | Not measured |
| Revenue | Not measured |
| ROAS | Not calculable |

The 18 campaign conversions are calls from ads. They are not verified qualified leads, customers or sales.

## Campaign snapshot

| Campaign | Status | Daily budget | Spend | Impressions | Clicks/interactions | Conversions | CPA |
|---|---|---:|---:|---:|---:|---:|---:|
| Housekeeping (Vacation Homes) | Enabled | R$ 116.00 | R$ 865.87 | 2,021 | 28 | 9 | R$ 96.21 |
| Lavanderia Pickup & Delivery | Enabled | R$ 116.18 | R$ 881.42 | 1,319 | 19 | 5 | R$ 176.28 |
| Carpet & Upholstery Cleaning Orlando | Enabled | R$ 116.00 | R$ 663.03 | 301 | 10 | 2 | R$ 331.51 |
| Leads-Search-Orlando | Paused | R$ 100.00 | R$ 1,182.81 | 1,792 | 34 | 2 | R$ 591.40 |
| A7 Max Orlando | Paused | R$ 80.00 | R$ 1,121.15 | 2,647 | 108 | 0 | Unavailable |

## Decision-grade findings

- Housekeeping has the best recorded call CPA. Kissimmee recorded 4 conversions at R$ 54.78 CPA; Davenport recorded 1 at R$ 116.83.
- Performance Max spent R$ 1,121.15 with zero recorded conversions.
- All eight visible Search ads use the legacy call-only format and must be migrated to responsive search ads with call assets.
- Some ads are disapproved, including all ads in the “Lava Edredons” group.
- Ads show the temporary `my-laundry-app-flax.vercel.app` domain instead of the primary `a7laundry.com` domain.
- Phone numbers conflict: call ads show `(689) 407-2015`, while an eligible call asset shows `(407) 718-8393`.
- The account has no account-level negative keyword list and relies heavily on broad match.
- Smartphones represent approximately 97.3% of cost.
- No sales goal, revenue value, offline conversion import or operational site measurement was identified.

## MOS interpretation

- Spend, calls and CPA are verified historical Google Ads metrics in BRL.
- The campaign “conversions” must be labelled as calls, not leads or sales.
- Sales, revenue and ROAS remain `null` / unavailable.
- Meta Ads USD results and owner-reported USD revenue must not be combined with this Google Ads BRL snapshot.
- Do not add funds or reactivate delivery until measurement, identity, domain, phone and disapproval issues are resolved.
