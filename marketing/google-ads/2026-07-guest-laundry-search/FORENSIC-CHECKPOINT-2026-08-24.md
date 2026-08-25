# A7 Laundry Orlando — forensic growth checkpoint

**Observed on:** 2026-08-24 (America/New_York)
**Primary comparison:** 2026-08-01–2026-08-24 versus 2026-07-08–2026-07-31
**Mode:** read-only observation; no campaign, budget, bid or delivery setting changed

## Source boundary

- GA4 property `543807649`: owner-authenticated live report.
- Search Console property `sc-domain:a7laundry.com`: owner-authenticated live report.
- Google Ads advertiser `290-113-2891`: Claude Code artifact supplied by the owner, covering 2026-07-25–2026-08-23. It is a different period and is not arithmetically joined to GA4/GSC.
- Meta Ads USA account `1381850125693848`: owner-authenticated Ads Manager account-state observation on 2026-08-24. All 55 campaigns were off and current spend was R$0.
- Meta organic Orlando: unavailable. The Business Suite asset visible in the session belonged to the Brazil operation and was excluded.

## GA4 — current versus previous 24-day window

| Metric | Aug 1–24 | Jul 8–31 | Interpretation |
|---|---:|---:|---|
| Active users | 334 | 127 | +163%; real audience growth |
| Sessions | 444 | 167 | +166% |
| Engaged sessions | 306 | 93 | +229% |
| Engagement rate | 68.92% | 55.69% | Quality improved with volume |
| Average engagement time | 82 s | 16 s | Strong improvement |
| Key events | 350 | 79 | Mixed taxonomy; not equivalent to sales |
| `whatsapp_click` | 110 | 27 | Contact intent, not a confirmed order |
| Purchase events | 30 | 2 | 28 current users; Stripe confirmation is server-verified before emission |
| Reported revenue | US$3,445.80 | US$161.63 | Financial total is real in GA4, but channel assignment is not yet decision-grade |

Acquisition observations:

- Paid Search: 171 current sessions versus 40 previous.
- Organic Search: 54 versus 50 sessions; engaged sessions 38 versus 24; engagement rate 70.37% versus 48%; 38 versus 10 key events.
- AI Assistant: 19 versus 8 sessions and 18 versus 7 key events. This is referral evidence, not proof of AI-generated revenue.
- Organic Social: 4 versus 9 sessions; one engaged session and zero key events in the current window.
- Organic Shopping: 46 versus 2 sessions and all reported GA4 revenue. This conflicts with the operational journey and is treated as an attribution defect, not a growth conclusion.

Landing-page observations:

- `/laundry-pickup-delivery-orlando`: 165 sessions versus 43; 253 versus 62 key events.
- `/guest-payment-confirmation`: 45 sessions, 31 users, 18 new users and all US$3,445.80 reported revenue. A transactional confirmation route should not be a new-user acquisition landing page at this scale.
- Lake Buena Vista was split across `/blog/laundry-lake-buena-vista` and `/blog/laundry-lake-buena-vista.html`, each with 12 sessions. The clean route had three key events; the `.html` route had zero.

## Search Console — current versus previous 24-day window

| Metric | Aug 1–24 | Jul 8–31 |
|---|---:|---:|
| Clicks | 28 | 23 |
| Impressions | 1,661 | 1,521 |
| CTR | 1.7% | 1.5% |
| Average position | 11.7 | 14.1 |

The United States contributed 26 of 28 clicks and 1,495 of 1,661 impressions. The homepage remained the main organic entry with 20 clicks and 766 impressions. High-impression queries with zero clicks included same-day drop-off, Orlando laundry, airport pickup, Airbnb linen, laundry service Orlando and guest laundry. These are CTR/content opportunities, not proof of commercial demand by themselves.

Search Console exposed 38 indexed and 35 non-indexed URLs in the overview. The difference from repository and sitemap counts must remain explicit; these numbers are not interchangeable.

## Google Ads artifact — Jul 25–Aug 23

- Spend: R$3,055.46.
- Clicks: 203.
- Reported conversions: 58, consisting of 11 Stripe purchases and 47 WhatsApp clicks.
- Reported conversion value: R$5,750.46; reported gross ROAS 1.88.

The conversion total mixes confirmed purchases with contact clicks and must not be used as a sales count or purchase-led bidding truth. Lake Buena Vista/hotel intent was the strongest commercial signal in the supplied analysis; broad `laundry service orlando` was weak. Campaign changes require native current-state verification and a rollback record.

## Remediation contract

1. The Stripe confirmation route must ignore the payment processor as a new GA4 acquisition referrer.
2. The one-use payment-link flow must accept a structurally valid opaque `A7 Ref`, store it separately from operator notes and return it only after a paid Stripe session is verified.
3. Verified purchase events may carry the opaque `lead_reference`; raw click IDs, UTMs and PII remain server-side or excluded.
4. `/blog/laundry-lake-buena-vista.html` must permanently redirect to `/blog/laundry-lake-buena-vista`.
5. WhatsApp clicks remain contact-intent evidence and must not be presented as purchases.
6. The next checkpoint must verify whether confirmation-page new users, Organic Shopping revenue and Lake Buena Vista URL splitting decline after release.

## Decision

Traffic, engagement, organic quality and verified purchase volume all improved. Revenue attribution by acquisition channel is not yet trustworthy enough to scale bidding from GA4 channel labels. The correct next action is measurement repair and canonical consolidation, followed by a fresh comparison window; not a conclusion that Organic Shopping generated the revenue.
