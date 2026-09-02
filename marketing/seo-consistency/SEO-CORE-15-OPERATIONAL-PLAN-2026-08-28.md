# A7 Laundry Orlando — SEO Core 15 Operational Plan

**Date:** 2026-08-28
**Source audit:** `docs/audits/2026-08-28-forensic-seo-geo-eeat-ai-search-audit.md`
**Control sheet:** `marketing/seo-consistency/SEO-CORE-15-CONTROL-SHEET-2026-08-28.tsv`

## Purpose

Concentrate crawling, internal authority, editorial work and measurement on the 15 URLs most capable of turning non-branded demand into qualified orders. This plan does not authorize a mass URL migration or release of quarantined pages.

## Operating rules

1. P0 measurement work precedes claims about channel revenue.
2. Each search intent has one primary owner.
3. Existing URLs with impressions are preserved unless a redirect case is proven.
4. No new resort/location page is released while the Core 15 is unhealthy.
5. Every Core 15 page must receive at least three relevant contextual inlinks.
6. Every support page must link to a money/next-step owner.
7. Prices, turnaround, minimum order and coverage language must use the canonical business facts.
8. “Express”, “same-day”, pickup windows and property coverage are never guaranteed before confirmation.
9. No page may imply a hotel, airport, Disney or resort affiliation.
10. A page does not graduate on rankings alone. It must produce qualified leads and, after attribution repair, revenue.

## Execution gates

### Gate 0 — measurement truth

Before evaluating SEO revenue:

- remove `money_page_view` from GA4 key events;
- keep `whatsapp_click` as a micro conversion, not a sale;
- use two distinct server-side macro outcomes: `order_accepted` for acquisition and `purchase` for confirmed revenue;
- persist first-touch/last-touch data, `a7_ref`, click IDs, lead ID, order ID and Stripe identifiers;
- link GA4 and GSC;
- exclude test/audit traffic.

Implementation contract: `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`.

### Gate 1 — governance decisions

Resolve before related content edits:

- comforter guide canonical owner;
- same-day query overlap and owner;
- recurring/linen service validity for `/vacation`;
- canonical public service-area/entity/address representation;
- owner approval for named experience on About.

### Gate 2 — Core 15 release quality

Each page must pass:

- self-referencing canonical;
- one clear title and one H1 owner;
- correct index/follow state;
- no unsupported business/statistical claim;
- visible CTA with distinct tracking reference;
- correct entity/service/Article relationship;
- at least three relevant internal inlinks;
- mobile QA;
- sitemap inclusion only if indexable and strategically owned.

---

# Page-by-page plan

## 1. Homepage — `/`

**Role:** entity and acquisition distributor.
**Owner intent:** broad Orlando guest laundry discovery.
**Current evidence:** 46 clicks, 2,019 impressions, 2.3% CTR, position 20.4; 236 GA4 landing sessions over 90 days.

### Keep

- Title: `Guest Laundry Pickup in Orlando | Hotels & Airbnbs | A7 Laundry`
- H1: `Enjoy Orlando. We handle the laundry.`
- transparent starting prices and $50 minimum;
- tourist/guest positioning;
- WhatsApp ease and real review proof.

### Change

- add one concise category statement near the hero: pickup and delivery, no customer-facing walk-in storefront;
- expose a visual choice between “Guest laundry”, “Check pricing” and “Check service area”;
- add contextual links to airport, hotel, I-Drive and same-day owners;
- route the primary CTA into a trackable order/availability step when ready.

### Schema

`WebSite`, `WebPage`, one canonical `LocalBusiness`/`LaundryService` entity reference. Do not repeat self-serving rating markup for rich-result purposes.

### KPI

Qualified leads, accepted orders and attributed revenue from homepage; secondary KPI: distribution of internal clicks into the Core 15.

---

## 2. Primary money page — `/laundry-pickup-delivery-orlando`

**Role:** sole owner of generic transactional pickup/delivery intent.
**Current evidence:** 234 GA4 landing sessions over 90 days, dominated by paid traffic. Current reported conversion rate is invalid.

### Keep

- Current title and H1;
- validated offer, prices, estimator and response qualifiers;
- primary CTA prominence.

### Change

- add a structured “start order/check availability” path;
- state hotel/Airbnb handoff requirements and no-walk-in model plainly;
- add only FAQs supported by real lead objections;
- link to pricing, coverage, process, policies and top local owners;
- receive contextual links from every relevant support page.

### Schema

`Service`, `Offer`, visible `FAQPage`, `BreadcrumbList`, provider pointing to `https://a7laundry.com/#business`.

### KPI

Qualified-lead rate, accepted-order rate, revenue per landing session and response time.

---

## 3. Pricing — `/plans`

**Role:** pricing and estimator owner.
**Governance:** preserve `/plans`; evaluate `/pricing` only with a measured migration plan. The current source canonical is correctly self-referencing.

### Recommended title and H1

- Keep title: `Orlando Laundry Service Prices & Weight Estimator | A7`
- Replace the multilingual compound H1 with: `Orlando Laundry Prices & Load Estimator`

### Content changes

- show standard, Express and $50 minimum before the estimator;
- explain what is and is not included by weight;
- show two or three real anonymized order examples;
- make estimator output transferable into order/WhatsApp tracking;
- move PT/ES support into clearly separated language sections rather than one H1.

### Schema

`WebPage`, `Service`, `Offer`, visible `FAQPage`. Keep prices machine-readable and synchronized with the business config.

### KPI

Estimator starts, estimator completions, estimator-to-qualified-lead rate and revenue per estimator user.

---

## 4. Service-area hub — `/service-areas`

**Role:** local qualification hub.
**Current evidence:** indexed; 71 repository inlinks; 9 GA4 landing sessions over 90 days.

### Keep

- Current title and H1;
- service-area-business language;
- links to proven geographic owners.

### Change

- add a structured location/property check;
- separate confirmed core corridor, conditional areas and unsupported areas;
- explain property handoff rather than only listing place names;
- link only to local pages with unique proof and indexation intent;
- avoid publishing a customer-facing street address unless GBP policy and owner intent support it.

### Schema

`CollectionPage`, `BreadcrumbList`, and `areaServed` references on the canonical business entity. Do not create multiple fake LocalBusiness locations.

### KPI

Location-check completions, qualified-location rate and order rate by verified corridor.

---

## 5. About — `/about`

**Role:** entity, experience and trust owner.
**Current evidence:** discovered-not-indexed; only two repository inlinks.

### Keep

- Current title and H1;
- explicit no-storefront statement;
- clear process and current business-fact review date.

### Change

- add named owner/operator only after explicit approval;
- add real work/process imagery with factual captions;
- describe handling and quality-control standards;
- link to current Google profile, policies, prices and service areas;
- remove any historical street-address inconsistency.

### Schema

`AboutPage`, canonical business entity reference and `BreadcrumbList`. A named `Person` should be introduced only if publicly approved and factually complete.

### KPI

Indexation, assisted qualified leads and engagement from visitors who view About before conversion.

---

## 6. Orlando Airport — `/blog/laundry-orlando-airport`

**Role:** highest-priority unindexed local acquisition page.
**Current evidence:** query cluster has 73 impressions at position 15.1; page is discovered-not-indexed and has one repository inlink.

### Recommended title and H1

- Keep title: `Laundry Pickup & Delivery Near Orlando Airport (MCO) — Wash & Fold | A7 Laundry`
- H1: `Laundry Pickup Near Orlando Airport (MCO) for Travelers`

### Content changes

- lead with the traveler problem: flight, hotel, checkout and needed-by time;
- document hotel/rental handoff options without claiming airport affiliation;
- add one real anonymized airport-area scenario;
- remove absolute “free across the airport area” language when coverage is conditional;
- link from home, money page, service areas, hotel and same-day.

### Schema

`Article`, `Service`, visible `FAQPage`, `BreadcrumbList` and the canonical business provider.

### KPI

Indexation first; then qualified CTR, airport-area leads and accepted orders.

---

## 7. Hotel guide — `/blog/hotel-laundry-service-orlando`

**Role:** hotel decision and handoff owner.
**Current evidence:** query cluster `hotel laundry orlando` has 21 impressions at position 10.6. The page already received a strong factual rewrite on 2026-08-22.

### Keep

- Title: `Orlando Hotel Laundry Pickup Guide | A7 Laundry`
- H1: `Hotel laundry pickup: what to confirm before the bag leaves.`
- hotel-procedure qualifiers, prices and no-affiliation language;
- current Article/Service/FAQ structure.

### Change

- add one anonymized real handoff case;
- link into structured order when available;
- receive links from home, airport, I-Drive, service areas and before-checkout content.

### KPI

Qualified hotel leads, assisted order rate and hotel-guide-to-order progression.

---

## 8. International Drive — `/blog/laundry-international-drive-orlando`

**Role:** I-Drive hotel/corridor owner.
**Current evidence:** 2 clicks, 183 impressions, 1.1% CTR, position 7.2; only three repository inlinks.

### Keep

- Title: `International Drive Hotel Laundry Pickup | A7 Laundry`
- H1: `Hotel laundry pickup, built around the I-Drive day.`
- current confirmation, independence and pricing language.

### Change

- explicitly distinguish guest pickup from laundry equipment, components, leasing and self-service machines in one natural explanatory block;
- add one real corridor itinerary/handoff scenario;
- link from home, service areas, hotel and convention content;
- test the snippet only after intent mismatch is corrected.

### KPI

Qualified CTR, reduction in equipment/leasing query share and qualified I-Drive leads.

---

## 9. Cost guide — `/blog/laundry-cost-orlando`

**Role:** pricing/commercial-investigation owner.
**Current evidence:** discovered-not-indexed; one repository inlink.

### Recommended title and H1

- Keep title: `How Much Does Laundry Cost in Orlando? 2026 Price Guide | A7 Laundry`
- H1: `What Laundry Pickup Really Costs in Orlando`

### Content changes

- add dated methodology and calculation assumptions;
- use anonymized A7 order examples rather than generic price claims;
- source external comparisons or remove them;
- show minimum-order break-even examples;
- connect directly to `/plans`, estimator and order.

### Schema

`Article`, visible `FAQPage`, `BreadcrumbList`; reference canonical Service/Offer rather than creating a conflicting offer owner.

### KPI

Indexation, estimator starts, commercial CTR and qualified leads assisted by the guide.

---

## 10. Laundromat vs delivery — `/blog/orlando-laundromat-vs-delivery`

**Role:** comparison and AEO owner.
**Current evidence:** 1 click, 239 impressions, 0.4% CTR, position 8.1.

### Keep

- Current title;
- comparison intent and honest framing.

### Change

- H1: `Laundromat vs Laundry Delivery in Orlando: An Honest Comparison`;
- place the answer/comparison table above the fold;
- state that A7 is pickup/delivery and has no public walk-in laundromat;
- cite or label assumptions for time, transport and cost;
- add a decision CTA: “Compare my options / check pickup”.

### Schema

`Article`, visible `FAQPage`, `BreadcrumbList`. Do not present A7 as a laundromat entity.

### KPI

Qualified CTR, scroll-to-comparison rate and comparison-to-qualified-lead rate.

---

## 11. Same-day — `/blog/same-day-laundry-tourists-orlando`

**Role:** provisional same-day/needed-by owner.
**Current evidence:** 2 clicks, 235 impressions, 0.9% CTR, position 8.8. Competing `/blog/same-day-laundry-orlando` has 179 impressions at position 9.0.

### Governance hold

Do not materially rewrite or redirect either page until a query-by-page overlap export establishes:

- shared queries;
- which URL owns qualified same-day intent;
- unique intents worth preserving;
- clicks/impressions lost or consolidated by URL.

### If selected as owner

- title may remain until a CTR test is defined;
- recommended H1: `Need Laundry Back Today in Orlando? What Travelers Should Confirm`;
- absorb only unique useful content from the competing page;
- maintain “when confirmed” qualifiers;
- link to airport, hotel, before-checkout, pricing and order.

### KPI

One ranking owner per same-day query cluster, qualified CTR and confirmed Express leads.

---

## 12. Disney-area guide — `/blog/laundry-near-disney-world`

**Role:** Disney-area guest decision guide.
**Current evidence:** 1 click, 65 impressions, 1.5% CTR, position 9.2; 10 GA4 landing sessions.

### Recommended title and H1

- Title: `Laundry Pickup Near Disney World for Hotel & Resort Guests | A7 Laundry`
- H1: `Laundry Pickup Near Disney World for Hotel & Resort Guests`

### Content changes

- replace generic “best options” language with A7-specific logistics;
- document hotel/resort/rental handoff and needed-by scenarios;
- add a clear independent-service disclaimer;
- link to money page, hotel guide, service areas, pricing and order;
- add one real anonymized Disney-area guest case when available.

### Schema

`Article`, `Service`, visible `FAQPage`, `BreadcrumbList`.

### KPI

Qualified CTR, Disney-area qualified leads and accepted orders.

---

## 13. Comforter service — `/comforter`

**Role:** sole transactional comforter owner.
**Current evidence:** relevant query cluster has 41 impressions at position 12.9; internal authority is already heavily concentrated here.

### Recommended title and H1

- Title: `Comforter Cleaning Pickup & Delivery in Orlando | A7 Laundry`
- H1: `Comforter Cleaning Pickup & Delivery in Orlando`

### Content changes

- replace the aggressive multilingual compound H1;
- move PT/ES into separate controlled sections;
- clarify item pricing, materials accepted, risks, turnaround and photo-quote process;
- add service terms for damage/special-care handling;
- link to the informational comforter guide without competing for informational intent.

### Schema

`Service`, factual `Offer`, visible `FAQPage`, `BreadcrumbList`. Keep visible real reviews, but do not expect self-serving LocalBusiness star eligibility.

### KPI

Qualified comforter leads, quote-to-order rate and revenue per comforter lead.

---

## 14. Comforter care guide — `/blog/how-to-clean-comforter`

**Role:** informational authority and service-assist owner.
**Current evidence:** 3 clicks, 182 impressions, 1.6% CTR, position 9.5.

### Keep

- Current title and H1;
- distinct informational intent.

### Change

- add named human/operational review after approval;
- cite care-label and fabric-safety guidance;
- define when home washing is unsafe or impractical;
- link prominently to `/comforter` for professional handling;
- use `HowTo` only if all visible steps and required fields are truly present.

### KPI

Clicks to `/comforter`, assisted qualified leads and stable informational rankings.

---

## 15. Vacation-rental service — `/vacation`

**Role:** conditional B2B recurring/linen owner.
**Current evidence:** discovered-not-indexed; 13 repository inlinks; recurring/linen capacity is not verified in the audit.

### Operational validation required

Before acquisition work, document:

- exact linen/turnover services;
- recurring capacity and service radius;
- minimum, pricing model and payment terms;
- SLA and cutoff times;
- inventory/loss/damage handling;
- whether A7 supplies linen or only launders customer-owned items;
- customer support and escalation.

### If validated

- Title: `Vacation Rental Linen & Turnover Laundry in Orlando | A7`
- H1: `Laundry Support for Orlando Vacation Rentals`
- replace fear-based/multilingual compound H1 with an operational value proposition;
- add a structured host-quote intake and real case studies;
- use `Service`/`Offer` schema only for verified terms.

### If not validated

Keep out of the acquisition core, remove unsupported recurring claims and consider noindex/repositioning until the offer is real.

### KPI

Qualified host leads, recurring customers, revenue per host and retention.

---

# Internal-link deployment map

## Tier A — must receive sitewide or hub-level prominence

- `/`
- `/laundry-pickup-delivery-orlando`
- `/plans`
- `/service-areas`
- `/about`

## Tier B — must receive contextual links from relevant owners

- airport from home, money page, service areas, hotel and same-day;
- hotel from home, money page, service areas, airport and I-Drive;
- I-Drive from home, service areas, hotel and convention;
- cost from home/pricing, money page and comparison guides;
- laundromat-vs-delivery from home, money page, pricing and no-car;
- same-day from home, money page, airport, hotel and before-checkout;
- Disney from home, money page, service areas, hotel and same-day;
- comforter service from home, pricing and care guides;
- comforter guide from comforter, blog hub and related care guides;
- vacation from home/service areas only after operational validation.

## Anchor rules

- use descriptive natural anchors such as “laundry pickup near Orlando Airport” or “see Orlando laundry prices”;
- avoid repeated exact-match anchors sitewide;
- never use a local anchor that implies guaranteed coverage;
- support pages should not link laterally without also linking to their conversion owner.

---

# Measurement columns and definitions

The TSV is the operating source of truth. Update it weekly using these definitions:

| Column | Definition |
|---|---|
| Indexed? | Current URL Inspection/sitemap status, not a `site:` search estimate. |
| GSC position | Page-level average for the reporting window; query-cluster values must be labeled in Notes. |
| Internal links | Repository crawl count, supplemented by GSC recognition. |
| GA4 sessions | Landing sessions, with channel filter stated in Notes. |
| Qualified leads | Durable leads meeting real service area, timing, minimum and service requirements; never inferred from CTA clicks. |
| Revenue | Server-confirmed `purchase` revenue joined to an existing `order_id` and its frozen acquisition snapshot. |
| Primary KPI | One commercial or indexation outcome appropriate to the page role. |
| Status | Planned, In progress, QA, Live, Monitoring, Blocked by evidence, Blocked by operations. |

Do not populate qualified leads or revenue retroactively from current GA4 key events. They remain `DATA REQUIRED`/`NOT RELIABLE` until Gate 0 is complete.

---

# First 14-day execution sequence

## Days 1–3

1. Correct GA4 key-event configuration.
2. Finalize attribution contract and end-to-end test plan.
3. Export query-by-page overlap for same-day and generic service clusters.
4. Approve the public entity/SAB fact policy.

## Days 4–7

1. Resolve comforter guide canonical owner and redirects.
2. Normalize remaining public `.html` variants.
3. Add missing Core 15 contextual links, starting with airport, cost, About and I-Drive.
4. Link GSC and GA4; establish internal-traffic filtering.

## Days 8–10

1. Improve airport and cost owners for indexation.
2. Adjust I-Drive mismatch language.
3. Improve Disney positioning and local proof.
4. Prepare About proof additions and policy page briefs.

## Days 11–14

1. Deploy and validate structured lead/order intake specification.
2. Request recrawl only for materially improved priority URLs.
3. Record the new baseline in the control sheet.
4. Start a weekly review of indexation, qualified leads and attribution integrity.

---

# Definition of Core 15 health

The Core 15 becomes healthy when:

- all unconditional Core pages are indexed;
- no canonical/intent conflict remains;
- each indexable page has at least three relevant inlinks;
- qualified lead and revenue definitions are trustworthy;
- each page has a unique owner role and conversion path;
- local/entity facts are consistent;
- the highest-intent position-7–20 pages show improving qualified CTR or leads over a 28-day comparison;
- new content is approved only to fill a proven operational or search-intent gap.

**Current phase:** concentration.
**Next proof:** revenue by landing page.
**Then:** local authority and AI citation strength.
**Only after that:** controlled content expansion.
