# Google Ads Guest Laundry — live optimization snapshot

**Audited:** 2026-08-16  
**Account:** A7 Laundry - 01 (`290-113-2891`)  
**Campaign:** `A7 | Search | Guest Laundry | Orlando | EN | JUL26`  
**Campaign ID:** `24072699595`  
**Currency / account timezone:** BRL / GMT-03:00 Brasília

## Live state after the authorized change

- Campaign remains enabled; it was not restarted or duplicated.
- Daily budget changed from R$100 to R$150 on 2026-08-16.
- Target CPA remains unchanged at R$49.25.
- Google Ads labels the campaign `Eligible (limited)` and reports that it was budget-limited during the prior seven days.
- Optimization score shown after the budget change: 68.6%.
- Two responsive search ads are enabled. The hotel-focused RSA received the observed delivery; the Airbnb RSA had no delivery in the audited 30-day window.
- Both RSAs still use `https://a7laundry.com/laundry-pickup-delivery-orlando` as the final URL.

## Conversion signal audit — trailing 30 days

The 36 conversions shown to Smart Bidding are not 36 sales:

| Primary action | Conversions | Verified value shown |
| --- | ---: | ---: |
| A7 Guest Laundry - Stripe purchase | 5 | R$2,237.89 |
| A7 - WhatsApp click (site) | 31 | n/a |
| Calls from ads | 0 | n/a |
| A7 - Website call 60s | 0 | n/a |

WhatsApp opens represent 86% of the observed primary conversion count. The WhatsApp action was intentionally left primary during this change window: removing it on the same day as the budget increase would materially recalibrate the bidding signal, while five purchases alone are not yet a stable volume base for target-CPA bidding. Purchases must be reported separately from contact opens in operational reviews.

## Auction position — trailing 30 days

| Advertiser | Impression share | Top of page | Absolute top |
| --- | ---: | ---: | ---: |
| A7 Laundry | 34.26% | 58.41% | 22.95% |
| orlandolaundryroom.com | 18.18% | 86.32% | 58.96% |
| happynest.com | 11.57% | 73.93% | 16.23% |
| poplin.co | 10.22% | 77.39% | 27.00% |

A7 had the largest observed impression share, but Orlando Laundry Room appeared above A7 in 79.43% of auctions where both advertisers participated.

## Search behavior observed

- Tuesday had the largest average search volume in the available day-of-week view.
- Friday had the strongest click volume and CTR.
- Most observed search demand occurred from approximately 8:00 AM to 2:00 PM Orlando time.
- Disney and Universal resort corridors are commercially relevant based on owner-confirmed orders and current search behavior. `Hilton` is not treated as a brand segment because only two Hilton-area guests were confirmed; it remains regional evidence, not a standalone promise or targeting thesis.

## Sitelink cleanup applied

Three campaign-level sitelinks that sent paid traffic to blog articles were edited in place. Editing preserved the campaign and historical asset rows; the revised assets entered Google review.

| Sitelink | Final URL | State immediately after save |
| --- | --- | --- |
| How It Works | `https://a7laundry.com/laundry-pickup-delivery-orlando#how` | Pending review |
| Pricing | `https://a7laundry.com/laundry-pickup-delivery-orlando#pricing` | Pending review |
| What We Wash | `https://a7laundry.com/laundry-pickup-delivery-orlando#care` | Pending review |
| Service Areas | `https://a7laundry.com/service-areas` | Preserved and eligible |

The asset-table interaction metrics are association metrics, not proof that the sitelink itself received every reported click or conversion.

## Billing guardrail

- Available funds observed: R$500.05.
- Google Ads displayed a low-funds warning.
- At the new R$150/day cap, the available balance covers about 3.3 fully spent days.
- A manual payment was not made during this optimization. Funding remains an owner action.
- Operational recommendation: add at least R$550 to cover seven total days from the observed balance; R$600 provides a small buffer.

## Next controlled changes

1. Wait for the three revised sitelinks to clear review; do not pause the campaign while they are reviewed.
2. Monitor spend, impressions, search terms, Stripe purchases and owner-qualified WhatsApp conversations daily for the first three days after the budget change.
3. Build the Disney/Universal regional message as an additional RSA challenger inside the current hotel/guest structure, not as a replacement campaign.
4. Keep resident laundry, comforter cleaning and shoe cleaning outside this guest campaign; each needs its own intent, ads, landing experience and budget decision.
5. Reassess the WhatsApp primary action only after qualified-lead import or enough verified purchase volume exists to avoid starving Smart Bidding.

