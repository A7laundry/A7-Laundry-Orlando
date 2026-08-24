# `/plans` Normalization Evidence — 2026-08-22

## Release state

Local candidate only. No preview or production deployment has been performed for this increment.
Remote release remains gated by independent QA and the protected-preview workflow in A7-003.

## What changed

- corrected the self-canonical from the homepage to `https://a7laundry.com/plans`;
- changed public guest-laundry terminology from legacy `Normal` to `Standard`;
- changed Standard to an approximate 24-hour return and Express to up to 8 hours only when confirmed;
- changed universal `free` framing to pickup/delivery included inside the confirmed area;
- corrected the 25-pound Standard example from US$72.50 to US$81.25;
- documented the exact Standard minimum threshold as about 15.4 pounds while keeping US$50 as the
  actual value minimum;
- removed the stale `5.0/23` aggregate rating and unsourced review wall;
- replaced stale social identities with `@a7laundry` Instagram/Facebook and a Google business link;
- added the verified Stripe-hosted USD payment path and card-detail safety copy;
- normalized all static conversion paths to `SEO-ORLANDO-PLANS-V1` with stay, needed-by, load and
  Standard/Express fields;
- added SMS and removed telephone conversion links;
- preserved the estimator and changed its output messages to carry the weighed estimate and funnel
  reference without claiming a final quote;
- removed the fixed WhatsApp/sticky overlays from the document to prevent content coverage;
- updated `MANIFESTO.md`, `sitemap.xml` and the deterministic validator.

## Automated evidence

| Gate | Result |
|---|---|
| JSON-LD parse | PASS — LocalBusiness/LaundryService, Service, WebPage, FAQPage, BreadcrumbList |
| visible English FAQ vs FAQPage | PASS — exact 6/6 parity in repository validator |
| contact inventory | PASS — 11 WhatsApp, 2 SMS, 0 telephone; dynamic estimator adds no new destination |
| funnel reference | PASS — `SEO-ORLANDO-PLANS-V1` in static and estimator paths |
| stale-price/claim scan | PASS — no US$72.50, aggregateRating, stale social identity, absolute Express or homepage canonical |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 34 repository tests plus 15 MOS tests and all chained validators |
| `npm run build:public` | PASS — zero legacy creative assets |
| `git diff --check` scoped to increment | PASS |

## Visual evidence

- Chrome 1440×900: header/urgency layers separated, offer and primary CTA visible in the first
  viewport, no visible clipping in the inspected fold.
- Chrome 390×844: urgency and duplicate language controls hidden, compact A7 header, H1/offer/CTA
  legible, primary CTA visible in the first viewport and no fixed CTA overlay.
- The first mobile render exposed a real header collision; the CSS was corrected and a second render
  passed visual inspection. The failed render is not treated as evidence of completion.

## Candidate hashes

| Artifact | SHA-256 |
|---|---|
| source `plans.html` | `ace73ee0cf47ec3661cac0a7e026959d9e837c73f3f6b87f39140f1ece114425` |
| built `dist/plans.html` | `a6accbb46c3e84a9a6493c31cdd303945e7bb941c3e01ae21bbfccf602df2e67` |
| `MANIFESTO.md` | `6761d0c0e49b16c8b6c5f12f8ad2e9b6b222198265d03a2b96523fffe893243d` |
| `scripts/validate-site.mjs` | `59795b9717a8a3ac86f1b57883165458f3c7c5ce5a8fccbcd7d0e4e66594b3ed` |
| `sitemap.xml` | `6752fd1e4f3208764e598d30800285fcbf469d707dad052031584e49f5082493` |

Hashes are local-candidate evidence only. They must be recomputed after independent QA corrections
and then matched byte-for-byte across protected preview and production.

## Remaining release gates

1. independent QA review of claims, accessibility, estimator behavior and responsive layout;
2. protected preview built from the final approved tree;
3. preview byte check, Lighthouse/WebKit and public-contract smoke;
4. exact no-rebuild promotion by the authorized release role;
5. public canonical/contact/schema/estimator smoke and rollback record;
6. post-release monitoring at 24h, 72h, 7d, 14d and 28d using qualified contacts and reconciled
   orders rather than raw WhatsApp clicks.
