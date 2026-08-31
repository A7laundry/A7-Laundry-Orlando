# Forensic audit — Orlando money page

Date: 2026-08-22  
Target: `https://a7laundry.com/laundry-pickup-delivery-orlando`  
Scope: live/local page, offer truth, SEO intent, AI-search extraction, CRO, mobile, tracking, GA4/GSC evidence boundary and release readiness.  
External mutation: the approved Vercel artifact was published to `a7laundry.com`. Google Ads, GA4 and Search Console were not changed.

## VERDICT

**PASS in production.**

The existing URL should remain the owner of broad commercial Orlando guest-laundry pickup and delivery intent. The useful project-level conclusion is not to create another broad Orlando page: regional pages should answer narrower local or deadline intents and link back to this money page.

The previous public presentation was technically functional but diluted trust with a generic template structure, repeated card patterns, remote Tailwind/Material dependencies and a stale numeric review claim. The candidate replaces that treatment with a direct traveler journey, transparent commercial conditions, original illustrative hospitality imagery and visible answers that search engines and AI systems can extract without executing JavaScript.

## CRITICAL BLOCKERS

None in the tested local candidate.

No organic or revenue uplift is claimed at release time. Those outcomes require delayed GSC, GA4 and reconciled paid-order evidence after the production change.

## IMPORTANT IMPROVEMENTS

1. Keep `/laundry-pickup-delivery-orlando` as the broad Orlando commercial destination used by Google Ads and internal service links.
2. Keep regional intent boundaries: Lake Buena Vista for its hotel corridor, International Drive for that corridor, the resort-area page for next-full-day resort intent, before-checkout for checkout urgency, and the hotel guide for broader informational research.
3. Optimize for the guest's actual decision: location, needed-by time, handoff, service pace, price basis and minimum before collection.
4. Use paid orders and qualified guest leads as commercial outcomes. A WhatsApp click remains an opening/contact action, not a sale.
5. Reconcile GA4/GSC by canonical landing URL after release; do not compare their counts as deduplicated people and do not call an unavailable report zero.

## VERIFIED FACTS

- Canonical URL remains `https://a7laundry.com/laundry-pickup-delivery-orlando`.
- Google Ads artifacts in the repository use this URL and the `#how`, `#pricing` and `#care` sitelink anchors; those anchors are preserved, alongside `#areas` and `#questions`.
- Audience is explicitly limited to travelers staying at hotels, resorts and vacation rentals in the confirmed Orlando area.
- Standard is `$3.25/lb` with an approximate 24-hour return.
- Express is `$3.95/lb`, targets up to 8 hours and is offered only when availability, capacity, pickup and return timing are confirmed.
- Minimum order is `$50`; pickup and delivery are included in the confirmed area.
- Everyday machine-washable clothing is the base scope. Delicate, no-dryer and special-care items require separate confirmation.
- Hotel front desk or Bell Services handoff is conditional on property permission; no hotel partnership is claimed.
- The final total is confirmed after weighing. The page describes a secure USD Stripe-hosted payment-link option and current alternative methods without asking for card details through WhatsApp or SMS.
- All three WhatsApp and both SMS conversion links use the official `+1 407-670-8839`, collect location, needed-by time, approximate load and service preference, and carry `A7 Ref: SEO-ORLANDO-MONEY-V2`.
- Unified local tracking scripts are present exactly once in the built page: business config, attribution, events and tracking.
- The visible FAQ contains 10 entries with exact FAQPage JSON-LD parity. The JSON-LD array also contains the stable business entity, Service, WebPage and BreadcrumbList.
- The public sitemap contains the canonical URL, a 2026-08-22 last-modified date and the new illustrative hero image.
- Preview `dpl_ENBRJg6vKAtNEndtofH9sMpaqoQj` was reviewed and promoted to production deployment `dpl_8mzMMHy2q6ZFPJV4HKgPMLwtgV6J`, which is `READY` behind `a7laundry.com` and `www`.
- Production is byte-identical to the approved preview for HTML `d247fd4a…`, hero `03bb22c1…`, tracking `af0bb70c…` and sitemap `f497e059…`.
- Exact CDP mobile test at 390×844 measured `scrollWidth = innerWidth = 390`; the WhatsApp CTA is fully inside the first viewport at y=684–736, the mobile nav CTA is hidden, and all visible interactive targets meet the 44px gate.
- Exact tablet test at 768×1024 measured no horizontal overflow and showed the primary CTA before the hero image. Desktop visual inspection also showed the offer and primary CTA in the first viewport.
- Both lazy responsive service images and the local official Stripe badge decode successfully when scrolled into view.
- Key contrast pairs pass WCAG AA: aqua-dark/paper `4.80:1`, muted/paper `5.18:1`, navy text/green CTA `8.06:1`, white/navy `17.96:1` and microcopy/navy `9.31:1`.
- The built HTML is 36,722 bytes; the four first-party tracking modules total 29,843 bytes; the mobile hero is 58,418 bytes. Tailwind CDN, remote fonts and Material Symbols are absent.

## UNVERIFIED FACTS

- The active browser session did not expose the contracted A7 GA4 property `543807649` or authorized Search Console property data during this audit. Current landing-page sessions, organic queries, indexation and CTA counts are therefore **unavailable, not zero**.
- Historical protected-MOS evidence confirms the APIs were previously connected, but its Jul 2026 account totals are not a current page baseline and cannot prove this URL's current performance.
- Search Console query-level data is partial by design and delayed. Absence of a query cannot prove absence of demand.
- No current order ledger was joined to GA4/GSC in this run. The candidate must not be credited with revenue or conversion uplift before post-release reconciliation.
- Generated imagery is illustrative, not documentary proof of a specific employee, guest, property or handoff.

## SEO INTENT

Primary intent: **Orlando laundry pickup and delivery for travelers staying at hotels, resorts and vacation rentals.**

The candidate aligns title, meta description, H1, lead, Service schema, direct-answer strip, internal anchors and FAQ with that intent. It avoids attempting to own every local modifier. Regional pages remain distinct and are linked with descriptive anchors. The page does not add a new slug or canonical consolidation without GSC evidence.

## AI SEARCH READINESS

- Core identity, audience, price, minimum, timing, coverage, handoff, eligible clothing, payment and contact answers exist in visible HTML.
- Claims are conditional where the operation requires confirmation.
- Unit pricing uses `UnitPriceSpecification` with a one-pound reference rather than presenting `$3.25` or `$3.95` as the total service price.
- FAQ visible text and schema are exact matches.
- Stable entity IDs connect LocalBusiness/LaundryService, Service and WebPage.
- No AggregateRating, unsupported ranking, fake hotel relationship or automatic Express promise is emitted.
- Original image files include descriptive alt text, dimensions, responsive sources and illustrative disclosure.

## MOBILE RESULT

**PASS at 390×844 and 768×1024.**

The 390px hero preserves one clear order of attention: Orlando service → traveler benefit → audience/plan → price/minimum → WhatsApp → SMS. There is no fixed dock, content obstruction or horizontal overflow. The header conversion control is intentionally removed below 620px because the hero CTA is already visible and larger.

## TRACKING RESULT

**PASS for the existing unified contact contract; commercial attribution remains a downstream reconciliation problem.**

The page contains no inline duplicate contact tracking. WhatsApp/SMS links retain the static page-funnel reference and the project tracking stack can append its opaque session reference. One footer telephone link remains only as a secondary business contact; the primary page paths are WhatsApp and SMS. No Stripe purchase logic, Google Ads bidding, conversion goals or external account settings were changed.

## VISUAL ASSETS

- `public/orlando-guest-laundry-handoff-v1.webp` — 1600×1067, 116,378 bytes.
- `public/orlando-guest-laundry-handoff-v1-mobile.webp` — 960×640, 58,418 bytes.
- `public/orlando-laundry-identified-return-v1.webp` — 1400×933, 70,512 bytes.
- `public/orlando-laundry-identified-return-v1-mobile.webp` — 840×560, 31,364 bytes.
- Source masters and generation/inspection provenance are archived under `assets/main-money-page/` and `CREATIVE-LEDGER-ORLANDO-MONEY-PAGE-2026-08-21.md`.
- Inspected scenes contain no visible third-party logo, park identity, hotel brand, PII or factual property claim.

## FILES CHANGED

- `laundry-pickup-delivery-orlando.html`
- `sitemap.xml`
- `scripts/validate-site.mjs`
- `scripts/test-validation-context.mjs`
- `docs/stories/a7-003-conversion-observability.md`
- `marketing/google-ads/2026-07-guest-laundry-search/CREATIVE-LEDGER-ORLANDO-MONEY-PAGE-2026-08-21.md`
- `marketing/google-ads/2026-07-guest-laundry-search/FORENSIC-AUDIT-ORLANDO-MONEY-PAGE-2026-08-22.md`
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ORLANDO-MONEY-PAGE-2026-08-22.md`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-guest-laundry-handoff-source-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-laundry-identified-return-source-v1.png`
- four optimized public WebP assets listed above.

## FINAL RECOMMENDATION

**ADVANCE TO NEXT PAGE.**

The exact tested artifact is live. Monitor at 24h, 72h, 7d, 14d and 28d. Judge the page on qualified guest contacts, verified paid orders, revenue/margin and query-to-landing fit; use WhatsApp clicks only as diagnostic intent. Roll back if canonical/indexability, contact destinations, tracking, offer truth, page availability or mobile rendering regresses.
