# International Drive normalization evidence — 2026-08-22

## Release boundary

This record covers the local source candidate for the existing URL:

`https://a7laundry.com/blog/laundry-international-drive-orlando`

It does not authorize a remote preview or production release. Those remain separate independent-QA and DevOps gates.

## Intent boundary

- This URL owns International Drive hotel, resort, vacation-rental and convention-corridor guest pickup intent.
- `/laundry-pickup-delivery-orlando` owns broad Orlando guest pickup intent.
- `/blog/laundry-near-universal-orlando` owns laundry between full resort days and tomorrow's-plan intent.
- `/blog/hotel-laundry-service-orlando` remains the broad hotel-service guide.
- `/blog/laundry-before-checkout-orlando` owns checkout-day and urgent needed-by intent.

## Legacy conditions removed

- universal `free pickup` / `free delivery` framing;
- `Normal` terminology;
- an unqualified eight-hour promise;
- whole-corridor and every-property coverage claims;
- pickup at the exact time selected by the visitor;
- telephone conversion paths;
- fixed WhatsApp and mobile sticky CTA overlays;
- Tailwind CDN, Google Fonts and Material Symbols dependencies;
- weak contact messages without required intake fields or a funnel code;
- HTML-entity-corrupted FAQ copy;
- broad third-party attraction references that were unnecessary to the local intent.

## Candidate contract

- Standard: `$3.25/lb`, approximate 24-hour return.
- Express: `$3.95/lb`, up to eight hours only after availability, capacity, pickup timing and return window are confirmed.
- Minimum: `$50`.
- Pickup and delivery: included only inside the confirmed service area.
- Handoff: property procedure must be confirmed; no hotel partnership or endorsement is implied.
- Contact: WhatsApp and SMS only to `+1 407-670-8839`.
- Intake fields: hotel/resort/address, optional room, needed-by time, approximate bag/load and Standard/Express preference.
- Funnel code: `SEO-IDRIVE-V1`.
- Payment: final USD total after weighing; Stripe-hosted payment path plus operationally confirmed alternatives; card details never through WhatsApp/SMS.
- Proof: current Google business information and A7 public social profiles, without a stale rating or invented volume.

## SEO, GEO and AI Search implementation

- self-canonical and stable historical URL;
- direct answer block immediately after the hero;
- visible local context for International Drive guest and convention schedules;
- LocalBusiness/LaundryService, Service, WebPage, ImageObject, BreadcrumbList and FAQPage structured data;
- `UnitPriceSpecification` for per-pound pricing;
- eight visible FAQ answers exactly matching the FAQPage schema;
- responsive local WebP source with explicit illustrative disclosure;
- hub links from the blog index and service-area page;
- image sitemap entry and `dateModified` set to 2026-08-22;
- no AggregateRating, invented partnership, automatic Express or universal coverage statement.

## Deterministic checks

- JSON-LD blocks parse successfully.
- Visible FAQ/schema parity: `8/8`.
- Contact inventory: `3` WhatsApp links and `2` SMS links; every path carries `SEO-IDRIVE-V1` and the complete intake fields.
- Telephone paths: `0`.
- Remote UI dependencies: `0`.
- Optimized hero assets:
  - desktop: `blog/img/laundry-international-drive-orlando-hero-v2.webp` (`1600×1067`);
  - mobile: `blog/img/laundry-international-drive-orlando-hero-v2-mobile.webp` (`960×641`).

## Candidate hashes

- source HTML: `c6f6c94fcdbe2835c3938457ffc3193933ebde090d51a2d81807de86c7d35471`
- built HTML: `00ef427d1254fb3b8f624ce57dea581120952da078ed4d439ad8e921507e227e`
- desktop hero: `4166fc66ed0a5d92d13a71bfa2eadcf8dd9c350cb4863e21542a26aa00cf5ea2`
- mobile hero: `10ea88973dc6898aab103529c0826b2bfb75b1b77f86d1a086771080b8a2ce5e`
- validator: `975db0d15a64e56a276e3244733c20188dbebfecbcfdb0f7327f148dc024e91a`
- sitemap: `6bcf2d6a70235e3f5260d07eef215369aea16c7f948881f6b3d239133b9136c3`

## Gates at this checkpoint

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- repository static validation: PASS
- `npm test`: PASS (`34` repository tests plus `15` MOS tests and chained validators)
- `npm run build:public`: PASS
- `git diff --check`: PASS
- desktop render (`1440×900`): PASS; hero, local intent, offer, primary CTA and direct-answer strip are visible without overlap
- mobile render (`390×844`): PASS; logo, intent, offer and both contact paths are readable before the illustrative media, with no executable overlay
- CDP geometry (`390×844` CSS viewport): PASS; no document overflow and no visible undersized interactive target found
- independent QA: pending
- protected preview: pending
- production: not changed
