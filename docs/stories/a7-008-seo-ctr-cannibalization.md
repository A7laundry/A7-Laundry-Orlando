# Story A7-008 — Improve Organic CTR and Separate Search Intent

**Status:** Ready for Review  
**Date:** 2026-08-11  
**Source:** Live Google Search Console review for `sc-domain:a7laundry.com` covering 2026-06-30 through 2026-08-09.

## User Story

**As** A7 Laundry Orlando,  
**I want** high-impression organic pages to communicate a distinct search intent and a stronger reason to click,  
**so that** existing Google visibility generates more qualified visits without creating additional overlapping pages.

## Evidence Baseline

- Property total: 45 clicks, 2,572 impressions, 1.7% CTR, average position 16.
- Mobile generated 38 of 45 clicks; desktop generated 1,448 impressions but only 7 clicks.
- Several blog URLs rank around positions 5–10 while producing 0–1% CTR.
- Urgent-service, guest/hospitality and generic-laundry pages have overlapping language.
- The International Drive page receives some irrelevant machine/components intent.
- The available history is only 41 days; redirects or deindexing are not justified by the current sample.

## Search Intent Map

| URL | Primary intent | Audience | Must not compete for |
|---|---|---|---|
| `/blog/laundry-service-orlando` | Informational comparison of Orlando laundry options and prices | Visitors comparing service models | Direct booking landing-page intent |
| `/blog/orlando-laundromat-vs-delivery` | Cost/time comparison | Visitors choosing laundromat or delivery | Generic laundry guide intent |
| `/blog/same-day-laundry-orlando` | Transactional same-day pickup request | Anyone needing laundry today | General Express education |
| `/blog/same-day-laundry-tourists-orlando` | Tourist/hotel urgent-use guide | Orlando tourists and hotel guests | Broad same-day transactional intent |
| `/blog/express-laundry-orlando` | Express 8-hour service explanation | Customers evaluating the premium service | Tourist-only same-day intent |
| `/blog/hotel-laundry-service-orlando` | Hotel pickup and delivery | Orlando hotel and resort guests | Vacation-rental host turnovers |
| `/blog/orlando-vacation-rental-laundry-guide` | Operational guide for hosts | Airbnb and vacation-rental hosts | Guest wash-and-fold booking intent |
| `/blog/vacation-rental-laundry-orlando` | Recurring turnover service | Hosts/property managers | Broad informational guide intent |
| `/blog/laundry-international-drive-orlando` | Hotel laundry pickup along I-Drive | Tourists staying on International Drive | Machines, components or equipment intent |

## Acceptance Criteria

- [x] Priority URLs have differentiated titles and descriptions aligned with the intent map.
- [x] Open Graph and Article structured-data headlines/descriptions remain consistent with visible search messaging.
- [x] Updated articles identify 2026-08-11 as their modification date where structured metadata is present.
- [x] The three urgent-service pages remain self-canonical and indexable; no redirect or deindexing is introduced without a longer query/page cohort.
- [x] International Drive copy consistently emphasizes hotel/resort pickup and does not target laundry equipment.
- [x] Official pricing remains Normal $3.25/lb (24h), Express $3.95/lb (8h), $50 minimum, free pickup and delivery, subject to availability.
- [x] Existing repository validation, test and production build commands pass.

## Tasks

- [x] Record the Search Console baseline and intent map.
- [x] Update metadata for generic and comparison pages.
- [x] Separate transactional, tourist and explanatory urgent-service metadata.
- [x] Separate hotel guest, vacation-rental guide and host-turnover metadata.
- [x] Strengthen International Drive hotel intent and repair encoded FAQ copy.
- [x] Validate title/description uniqueness, canonical integrity and official pricing.
- [x] Run lint, test and build.

## Validation Results

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, including the new nine-page SEO intent gate.
- `npm run build` — passed; production bundle created in `dist/`.
- Redirects and `noindex` were intentionally deferred until a longer query/page cohort exists.

## File List

- `docs/stories/a7-008-seo-ctr-cannibalization.md`
- `blog/express-laundry-orlando.html`
- `blog/hotel-laundry-service-orlando.html`
- `blog/laundry-international-drive-orlando.html`
- `blog/laundry-service-orlando.html`
- `blog/orlando-laundromat-vs-delivery.html`
- `blog/orlando-vacation-rental-laundry-guide.html`
- `blog/same-day-laundry-orlando.html`
- `blog/same-day-laundry-tourists-orlando.html`
- `blog/vacation-rental-laundry-orlando.html`
- `package.json`
- `scripts/validate-seo-intent.mjs`
