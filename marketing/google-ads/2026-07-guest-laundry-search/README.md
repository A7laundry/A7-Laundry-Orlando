# Google Ads — Guest Laundry Search — Fase 1

> **STATUS: READY FOR BUILD, MUST REMAIN PAUSED.** This package does not authorize adding funds, publishing ads or changing account-level conversion goals.

## Objective

Capture high-intent searches from guests staying at Orlando hotels, resorts and Airbnbs and route them to the English Guest Laundry landing page and WhatsApp. The commercial milestone is **US$250 in verified guest-laundry revenue**, not calls or raw clicks.

## Operating boundary

- Account: `290-113-2891` — BRL — Brasília timezone.
- Public brand: **A7 Laundry Orlando**.
- Destination: `https://a7laundry.com/laundry-pickup-delivery-orlando`.
- Offer: Normal 24h from US$3.25/lb; Express 6h from US$3.95/lb when available; US$50 minimum; pickup and delivery included.
- Initial language: English. Portuguese and Spanish require separate campaigns, ads and landing-page validation.
- Customer contact: WhatsApp/SMS first. Do not use calls as a primary conversion while English call handling is unavailable.
- Campaign type: Search only. No Performance Max, Display, Search Partners, broad match or auto-created assets in the first cycle.

## Test envelope

- Proposed budget: **R$70/day for 7 days**, maximum **R$490**.
- Bidding: Maximize Clicks with an initial **R$18 maximum CPC**.
- Do not switch to Maximize Conversions before at least 15 verified qualified leads or purchases.
- Pause for review at 20 clicks without a qualified lead, R$180 without a qualified lead, or R$350 without a verified order.
- Never combine BRL media cost and USD revenue without recording the exchange rate and date.

## Source files

- `campaign-spec.yaml` — structure, settings and decision gates.
- `keywords.csv` — exact and phrase-match inventory.
- `negative-keywords.txt` — shared negative list.
- `responsive-search-ads.csv` — RSA copy and tracking.
- `measurement-plan.md` — primary/secondary conversion semantics and MOS reconciliation.
- `preflight-checklist.md` — mandatory GO/NO-GO review.
- `activation-runbook.md` — exact paused-build, verification and controlled-launch sequence.
- `lead-ledger-template.csv` — manual operational bridge until a durable CRM/offline-import integration exists.
- `npm run preflight:google-ads:live` — read-only public destination and tracking check.

## Activation gate

Activation is a separate owner-authorized operation. Before it can happen, every required preflight item must pass, the ads must exist as paused drafts, the landing page must be live, Google auto-tagging must be enabled and primary conversion goals must not treat a raw phone call or WhatsApp click as a sale.

The campaign uses a **Final URL suffix**, not a tracking-template replacement. Google keeps the landing URL intact while adding the controlled UTM and ValueTrack parameters used by GA4, the A7 session attribution and the WhatsApp `A7 Ref`.
