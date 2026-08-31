# Before-checkout funnel normalization evidence — 2026-08-22

## Release truth

Source candidate only. The canonical URL remains public in its previous production version until an exact reviewed preview is promoted. The MOS must display this revision as `source_candidate`, never active production.

## Intent boundary

- **This URL owns:** an Orlando guest whose clothes must return before a fixed checkout, flight, drive or next-hotel deadline.
- **It does not own:** broad Orlando pickup, generic hotel pickup guidance, resort plans for tomorrow, a geo corridor or pricing comparison.
- **Primary decision:** whether the exact needed-by window is realistic before the bag is collected.

## Commercial and contact contract

- Standard: `$3.25/lb`, approximate 24-hour return.
- Express: `$3.95/lb`, up to 8 hours only when availability, capacity, pickup timing and return window are confirmed.
- Minimum: `$50`.
- Pickup and delivery: included only within the confirmed service area.
- Contact: WhatsApp and SMS only to `+1 407-670-8839`; zero telephone CTA.
- Intake fields: hotel/address, checkout/flight/next-hotel deadline, approximate bag/load, Standard or Express.
- Static funnel reference: `SEO-BEFORE-CHECKOUT-V1`.

Removed legacy claims include a fixed `6 PM` cutoff, absolute free pickup/delivery, `Normal` terminology, automatic same-day framing and unsupported property coverage.

## SEO, GEO and AI-search structure

- Existing URL and self-canonical preserved.
- Title, description, Article/Service graph, answer block, visible sections and FAQ all reinforce deadline-first urgency.
- Eight visible FAQ answers match FAQPage JSON-LD exactly.
- Unit pricing uses `UnitPriceSpecification` with a one-pound reference quantity.
- Internal links point to the broad Orlando money page, pricing, service-area hub and the separate hotel decision guide.
- Blog card and sitemap image metadata use the responsive project asset and current intent.
- The illustrative-image disclosure is visible and does not imply a hotel, park or operating partnership.

## Visual and technical evidence

- Responsive assets: 1600×1067 WebP (`227,550` bytes) and 960×641 WebP (`91,160` bytes).
- Exact Chrome renders: 390×844 and 1440×900.
- Horizontal overflow: none (`scrollWidth === innerWidth` at both viewports).
- Mobile hero WhatsApp CTA ends at approximately 741px, inside the first 844px viewport.
- Contact inventory: 3 WhatsApp, 2 SMS, 0 telephone.
- FAQ: 8 visible / 8 schema; JSON-LD scripts parse.
- Broken images and first-party page errors: none.
- Repository validation, public build, focused MOS tests and diff check: PASS.

## Required release gates

1. Independent SEO/brand/QA review.
2. Public-site preview built from the exact candidate.
3. Owner approval of that preview.
4. Promotion without rebuild.
5. Public canonical, asset, CTA, schema, FAQ and hash smoke.
6. MOS registry update from `source_candidate` to `active_production` only after the public release is verified.
