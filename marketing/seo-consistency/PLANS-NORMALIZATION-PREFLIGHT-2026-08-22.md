# `/plans` normalization preflight

**Date:** 2026-08-22  
**Status:** ready for authorized story creation after canonical truth lock.  
**Mode:** source audit only; production unchanged.

## Why `/plans` is P0

- It receives 68 internal links from sitemap URLs.
- It is the pricing destination used across the corpus.
- Its `lastmod` is 2026-04-10 while the approved money/geo funnels changed in August.
- It is the only sitemap URL flagged for both absolute Standard and absolute Express turnaround.
- It has ten WhatsApp links but no static SEO funnel identifier.
- Its canonical points to the homepage, not `/plans`.

## Critical findings

### P0 — canonical suppresses the pricing URL

`/plans` emits `<link rel="canonical" href="https://a7laundry.com/">`. This tells crawlers that the
homepage is the preferred version of a materially different pricing experience. The target state is a
self-canonical `/plans`, subject to GSC review and preview validation.

### P0 — wrong public price example in three languages

The visible FAQ says a 25 lb Standard/Normal order costs US$72.50 in English, Portuguese and Spanish.
At US$3.25/lb, the correct multiplication is US$81.25. The estimator JavaScript correctly computes
`weight × 3.25` with a US$50 floor, so the static FAQ contradicts the calculator.

### P0 — timing is presented as guaranteed

Schema and visible copy state that Express is delivered within 8 hours and Normal within 24 hours.
Buttons say `Book Express — 8h`; the intake does not ask for needed-by time or confirmation. Current
live contract requires approximate Standard and conditional Express.

### P0 — entity graph is stale

- `sameAs` points to `a7servicepremium` instead of the current `a7laundry` profiles.
- `AggregateRating` publishes 5.0/23 without a current verification date.
- OpeningHoursSpecification emits 00:00–23:59 for all days, which can be read as service availability
  rather than request intake.
- LocalBusiness description uses legacy `Normal`, absolute timing and free-delivery framing.

### P0 — FAQ/schema parity is not a reliable contract

The page contains FAQPage schema plus a custom multilingual accordion. Questions/answers and language
variants are not enforced by an exact parity test. Search/AI systems can extract stale English schema
while the user sees a different language variant.

## High findings

1. The document is `lang="en"` but includes English, Portuguese and Spanish H1/body variants in the
   same HTML. Hidden language text remains extractable and creates a mixed-language AI/search surface.
2. `Normal` and `Standard` are both used for the same plan.
3. Pickup/delivery is called “always free” while approved funnels use “included in the confirmed
   area.”
4. Coverage copy says the whole vacation belt is covered, then lists locations categorically; current
   contract requires address confirmation.
5. The payment schema omits the current secure Stripe-hosted USD payment-link path.
6. Visible payment/pickup text varies on whether weighing occurs on the spot and whether the total is
   confirmed before pickup, before departure or before processing.
7. Ten WhatsApp links use weak “book 8h/24h” messages, omit hotel/address, needed-by and approximate
   load, and have no page funnel code.
8. There is no SMS route despite SMS being supported by the current premium funnel contract.
9. Inline `estimator_book` events coexist with the unified tracking stack and need a duplicate-event
   audit before preservation.
10. The 5.0 display and three quoted Google reviews need current source verification and a dated
    evidence ledger; otherwise remove or replace them with profile verification links.

## Medium findings

- Remote Google Fonts add a third-party dependency; no framework is required to preserve the page.
- The page visually mixes pricing, calculator, coverage, reviews and secondary services without a
  single intent hierarchy.
- H1/title focus on vacation rentals while `/plans` receives broad sitewide links and should answer the
  cross-audience pricing decision consistently.
- The calculator's garment weights are estimates and need an explicit non-binding disclaimer.
- The minimum illustration `about 15 lbs` can be misunderstood as an included allowance.
- Current JSON-LD models the business and FAQ but not the two per-pound offers through
  UnitPriceSpecification.

## Contracts to preserve

- URL and rewrite `/plans` → `/plans.html`.
- US$3.25/lb and US$3.95/lb estimator arithmetic with a US$50 minimum value floor.
- Official WhatsApp destination `+1 407-670-8839`.
- Current unified tracking stack and fail-open navigation.
- English as the public default.
- Separation of guest wash & fold from item-priced/custom/B2B services.

## Target page job

Answer one decision: **what does guest laundry cost, which pace may fit, what is included and how does
the guest confirm the order?**

Recommended sequence:

1. direct pricing answer and US$50 minimum;
2. Standard versus conditional Express;
3. what is included / what requires separate confirmation;
4. estimator with correct math and non-binding language;
5. coverage/handoff confirmation;
6. payment after weighing, with secure hosted link;
7. sourced trust;
8. exact FAQ/schema;
9. WhatsApp/SMS intake.

## Required tests

1. self-canonical, robots, title/H1 and sitemap contract;
2. `25 × 3.25 = 81.25`, `25 × 3.95 = 98.75`, minimum floor at US$50;
3. Standard approximate and Express conditional in meta, HTML, CTA, estimator, FAQ and schema;
4. visible FAQ equals FAQPage exactly for the indexed language;
5. UnitPriceSpecification references 1 lb and never represents US$3.25 as total service price;
6. no stale `Normal`, `a7servicepremium`, absolute timing, blanket coverage or unverified AggregateRating;
7. official destinations and complete intake fields, with mapped funnel identifier;
8. no duplicate contact/conversion event;
9. 320/390/768/1024/1440, keyboard, zoom, contrast and reduced motion;
10. lint, typecheck, full tests, build, preview identity, independent QA, public smoke and rollback.

## Release boundary

No implementation begins until:

- the canonical truth delta is approved/formally incorporated;
- an authorized story exists with ACs and File List;
- current GSC is available or self-canonical risk is explicitly accepted with the evidence boundary;
- the new funnel code is mapped and approved rather than invented in page copy.
