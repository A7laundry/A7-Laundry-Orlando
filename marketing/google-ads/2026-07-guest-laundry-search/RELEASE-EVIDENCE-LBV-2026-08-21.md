# Lake Buena Vista redesign — release evidence

**Story:** A7-011  
**Date:** 2026-08-21  
**Target:** `https://a7laundry.com/blog/laundry-lake-buena-vista`

## Release decision

The implementation passed the Vercel preview gate and the exact validated deployment was promoted to production. The owner authorized implementation, validation and publication in the A7-011 story. No Google Ads setting was in scope or changed by this release.

## Final preview deployment

- Deployment ID: `dpl_8MM6wLTLKeQtYUms3xNQHSH39ztA`
- Preview URL: `https://a7-laundry-orlando-4u14tqwj7-dennis-a7s-projects.vercel.app`
- Inspector: `https://vercel.com/dennis-a7s-projects/a7-laundry-orlando/8MM6wLTLKeQtYUms3xNQHSH39ztA`
- Vercel state: `READY`; target: `preview`; created 2026-08-21 00:22 EDT.
- Deployment protection remains enabled. Authenticated `vercel curl` verification confirmed that the deployed LBV HTML, final desktop hero and `a7-tracking.js` are byte-for-byte identical to the approved prebuilt artifact.
- The final preview was rebuilt after the performance/tracking regressions passed and deployed with `vercel build --yes` followed by `vercel deploy --prebuilt --yes --force`; no production promotion, Git push, commit or Google Ads change occurred.
- Earlier preview `dpl_8AFSgyTq6QqeJVQqCxRt5ToHz6um` is superseded and is not a release candidate.

## Production promotion and immediate smoke

- Validated source deployment: `dpl_8MM6wLTLKeQtYUms3xNQHSH39ztA`.
- Production deployment created by exact Vercel promotion, without rebuild: `dpl_Rbqr8cDEUwidfkhwXAXYntKknKSh`.
- Production deployment URL: `https://a7-laundry-orlando-9tifa8b4s-dennis-a7s-projects.vercel.app`.
- Public aliases: `https://a7laundry.com` and `https://www.a7laundry.com`.
- Vercel state: `READY`; target: `production`; created 2026-08-21 00:23 EDT.
- Immediate public HTTP: LBV HTML `200`, final desktop hero `200`, `a7-tracking.js` `200`.
- Production-versus-preview SHA-256 matches: HTML `9641d43c6c7e27688cf80e086051f1a3917543eba6f0582fa9b2ecb87af2474e`; hero `32065c4545a112b30301d021cd0d2d4b300ae12d63b65d45fa1ccf7c92779a56`; tracking `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Public semantic smoke passed: exact canonical, four official WhatsApp CTAs, hotel/address, checkout/needed-by, approximate bag/load, Standard/Express choice, `SEO-LBV-V2`, two official telephone links, visible phone and four parseable JSON-LD blocks.
- Public visual smoke passed at 390×844 and 1440×900: correct title/H1/hero, CTA in the first fold, all images complete and zero horizontal overflow. No first-party console error was observed; logged errors belonged to unrelated local Chrome extensions.
- No Google Ads browser, API or CLI action occurred during preview, promotion or production verification.

## Visual package

- Direction selected: **The Day Is Still Yours**, documented with the two rejected alternatives in `CREATIVE-DIRECTIONS-LBV-2026-08-20.md`.
- Final browser captures were inspected at 390×844 and 1440×900 after the accessibility corrections. Additional responsive checks covered 320, 375, 430, 768 and 1024 widths.
- The 390px hero uses three H1 lines, contains the complete conditional offer and exposes the WhatsApp CTA inside the first fold without overlap.
- The 1440px hero keeps the navigation, offer, CTA and local hospitality image within the first viewport.
- Generated hero source, rejected glyph variant, exact prompts, rights basis, inspection and WebP transformations are recorded in the creative ledger.

## Claims and conversion contract

- Standard: from US$3.25/lb, approximate 24-hour return.
- Express: from US$3.95/lb, up to 8 hours only when availability, capacity and the return window are confirmed.
- Minimum: US$50.
- Pickup/delivery: included only in the confirmed service area.
- Hotel/Bell Services handoff is conditional on hotel policy.
- All four WhatsApp CTAs use `+1 407-670-8839`, request hotel/address, needed-by time, approximate load and service, and retain `SEO-LBV-V2`.
- WhatsApp remains a microconversion. The redesign does not represent a click as a paid order or revenue.

## SEO and technical package

- Existing URL, canonical, robots, rewrite and sitemap entry are preserved.
- Title/H1 explicitly target hotel laundry pickup in Lake Buena Vista.
- `WebPage`, `ImageObject`, `LocalBusiness/LaundryService`, `Service`, `FAQPage` and `BreadcrumbList` JSON-LD parse locally.
- Unit pricing uses `UnitPriceSpecification` with a one-pound reference quantity.
- The Disney Springs article was retargeted to informational intent and links to this transactional page; no canonical consolidation was inferred without GSC evidence.
- Blog card, image sitemap and page metadata use the owner-requested branded v5 hero.

## Performance and accessibility evidence

- Branded hero desktop: 203,058 bytes; branded hero mobile: 99,242 bytes; both 16:9 WebP with dimensions, `srcset` and `sizes`.
- The v5 image preserves the vacation-time story, integrates the A7 mark into the hamper and removes explicit theme-park trademark cues. A restrained 14-second breathing scale is disabled by `prefers-reduced-motion`.
- Zero horizontal overflow verified at 320/375/390/430/768/1024/1440.
- Focus: 3px visible outline with 4px offset; keyboard order verified through navigation, CTAs, contextual links and native FAQ summaries.
- CTA contrast: 8.06:1; CTA hover: 10.11:1; muted text on paper: 5.18:1; coral on paper: 5.34:1.
- Local editorial links have a 44px minimum target; reduced-motion disables smooth scrolling and collapses transitions.
- Content is static HTML and `.reveal` remains visible without scripting; JavaScript is limited to the existing deferred tracking contract.
- Final Lighthouse mobile on the byte-identical local artifact: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; FCP 0.8s, LCP 1.8s, CLS 0, TBT 0ms and Speed Index 1.2s. The machine-calibration warning is retained; production PageSpeed/CrUX remains a post-release check rather than being inferred from this lab run.
- An immediate production PageSpeed API request was attempted after promotion, but Google returned HTTP 429 because the API project's daily query quota was exhausted. No production score was inferred; the check remains open for the monitored release window.
- The page uses a native editorial font stack, eliminating render-blocking font vendors. GA/Ads/Meta queues and click handlers initialize immediately, while vendor libraries load on the first pointer/keyboard intent or eight seconds after `load`, only when the LBV page flag is present. Focused regression proves each vendor loads once and WhatsApp/Ads events remain single and queued.
- Safari automation was attempted through the official driver, but the local Safari has **Allow remote automation** disabled; no Safari security preference was changed. The same 390×844 page was then rendered and visually inspected in Playwright WebKit 26.0 from a temporary test-only download outside the repository. WebKit passed without clipping, overlap or layout break; a real Safari session remains explicitly unavailable.

## Automated gates

Passed after the final contrast and responsive-image corrections:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 42 TAP tests plus site, AI-search, tracking, attribution, destination, Ads, Meta, MOS and evidence validators
- `npm run build:public`
- `git diff --check`

## Independent reviews

- Design/hospitality/CRO: critical CTA-placement and navigation findings corrected.
- SEO/local/canibalization: all five medium findings corrected.
- Brand/claims/privacy red-team: schema, asset-rights, generated glyph, no-app wording and caption findings corrected.
- Performance/accessibility: final gate **PASS** after contrast, target-size, reduced-motion and responsive-image corrections.
- QA: no critical/high technical finding; original governance concerns are addressed by this evidence and the updated A7-011 record. Deployment verification is complete; field performance evidence remains part of the monitored release window when available.

## Rollback and monitoring

### Owner-requested branded hero revision — 2026-08-21 14:56 EDT

- Built-in OpenAI ImageGen precise edit produced the branded source master; the exact prompt and rights boundary are recorded in `CREATIVE-DIRECTIONS-LBV-2026-08-20.md`.
- Preview `dpl_3yz4vJKoYyq9qJoVNKupfRtpm9LW` was `READY` and byte-identical to the local public build.
- The exact preview was promoted without rebuild to production `dpl_8tvwZ4S8dCNA2WKBYB73NLGRhaFn`, `READY` behind `a7laundry.com` and `www`.
- Public hashes: HTML `dc78d6b724bcf590af78f6d21781641eba27147fed3a7c7b3566571a894eb50a`; hero v5 `7e7450dc80398a693c3ecbfdf7b4217c79fb045f64eb6a819652110ecd8861c6`; tracking unchanged `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Public Chrome smoke at 390×844: responsive mobile hero loaded, primary CTA remained in the first fold, no broken images or horizontal overflow, four WhatsApp CTAs remained present and `SEO-LBV-V2` remained in the prefill contract.
- The visual revision did not alter Google Ads, price, minimum, SLA, phone, CTA destination, attribution semantics or paid-conversion configuration.

### Owner-requested post-hero relief revision — 2026-08-21 16:13 EDT

- Replaced the compact certainty strip with a two-column editorial relief block using the owner-supplied image and guest-facing copy.
- Preview `dpl_CzecyLQqdXwHa1qx7qCpeh8A8hFF` was `READY` and byte-identical to the local public build; it was promoted without rebuild to production `dpl_EepBdyTEETBJERkU9qkjE23Uy2hd`.
- Public hashes: HTML `20cb10936497ab68178ad8116cfb858c416bff53a652680b25649c75f127fe98`; post-hero desktop image `1f70b5d007de67a1a18a65aa36c61fc5937cbc1fa4b7bbb52040ddce6a239efd`; hero and tracking remained unchanged.
- Public Chrome at 390×844 confirmed text-before-image order, responsive mobile asset, lazy-loaded image, zero horizontal overflow, no CTA inside the block and no internal “Lead with…” copy.
- The 39-check public monitor passed after promotion. Price, SLA, conversion destinations, funnel code, structured data, indexability and adjacent-page SEO contracts remained intact.

### Owner-requested How It Works storyboard revision — 2026-08-21 16:35 EDT

- Rebuilt only the How It Works block as a four-scene editorial storyboard using the owner-supplied generic-resort source; the source master is retained outside the public bundle and four optimized WebP crops are public.
- Embedded artwork copy was intentionally excluded from the crops so operational truth remains in accessible HTML. Express is described as returning in as little as 8 hours only when availability, capacity and the return window are confirmed; Standard remains approximately 24 hours.
- Preview `dpl_F8T9DTnXq3tDY6YKVeKwMMN9oMHe` was `READY` and byte-identical to the approved local build. It was promoted without rebuild to production `dpl_2MySxYQX8mRK9YdoVLmBdxqCjpwy`, also `READY` behind `a7laundry.com` and `www`.
- Production HTML hash is `9efd1fc4e25f0f4212d5029bc3956408fe9dce3a401f4f77e57f6dc62fb7c7f6`; hero and tracking hashes remained unchanged (`7e7450dc80398a693c3ecbfdf7b4217c79fb045f64eb6a819652110ecd8861c6`, `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`).
- Desktop 1440×900 and mobile 390×844 local renders passed with the required 2×2/vertical sequence, no overflow, no broken media and no CTA inside the block. The immediate public monitor passed every technical, SEO, delivery, offer, destination and attribution-contract check after promotion.
- Hero, post-hero block, pricing, FAQ, final URL, WhatsApp prefill, `SEO-LBV-V2`, Google Ads and paid-conversion settings were not changed by this revision.

### Owner-requested Time and Choice revision — 2026-08-21 16:57 EDT

- Rebuilt only the existing Service Pace block as a premium time-and-choice decision section with a cleaned day/night image, two HTML service options, a visible canonical minimum and the existing WhatsApp funnel destination.
- The owner-supplied brief contained a stale US$60 minimum and unqualified “Within 24 hours” wording. The release deliberately preserves the project’s canonical US$50 minimum, approximately 24-hour Standard language and conditional Express availability.
- Built-in OpenAI ImageGen removed all embedded service, turnaround, price and brand copy from the source image. The approved non-public master and exact edit prompt are recorded in `CREATIVE-DIRECTIONS-LBV-2026-08-20.md`; public derivatives contain no readable claim, logo or watermark.
- Preview `dpl_9EsksfLwH8ymv5jDVBcvY5cRsTmQ` was `READY` and byte-identical to the approved Vercel build. It was promoted without rebuild to production `dpl_3aXXFmuqw5KwDDRroDPhGBC1BXc7`, also `READY` behind `a7laundry.com` and `www`.
- Public hashes: HTML `c974c04ba08cd5f0bff5bef2d43130474b891ba21f61ae2396211d46eb06c8a4`; desktop artwork `e83dc9f4e8b6504d4a7846f37fcc6a6db7364577f8cef682bc4ebceb8b5f808d`; mobile artwork `f7a0ae9907d0dbed658949de3dc8a6265a9bbf224e3d7ea9c6cf11bd657c8ebd`; hero and tracking remained unchanged.
- Visual QA passed at 1440×900 and 390×844: two-column/stacked service choices, responsive artwork, one CTA, no horizontal overflow and no broken image. The immediate public monitor passed every technical, SEO, offer, destination, attribution and delivery check.
- Hero, Blocks 2–3, local coverage, FAQ, final CTA, schema pricing, phone, WhatsApp prefill, `SEO-LBV-V2`, Google Ads and paid-conversion configuration were not changed by this revision.

### Owner-requested Operational Proof revision — 2026-08-21 17:14 EDT

- Added a dedicated trust block between Service Pace and local coverage using the owner-supplied three-scene hotel-workflow image, three HTML process pillars and a dedicated WhatsApp source code.
- The visual is explicitly captioned as an illustrative workflow, not documentary evidence. Bell Services/front-desk handoff remains conditional on hotel policy and is confirmed before collection; no hotel partnership is implied.
- The existing project pages repeat a 5.0/23 Google rating, but no independent current profile source was established for this release. The block therefore publishes no rating, review count, star badge, customer name or testimonial.
- Preview `dpl_GD6uLWKBqrbD1CsMH8zYZRxjanE3` was `READY` and byte-identical to the approved Vercel build. It was promoted without rebuild to production `dpl_FvYktgiZH57oP69TFeNyCig26qBR`, also `READY` behind `a7laundry.com` and `www`.
- Public hashes: HTML `d406ae3e56b0cd8153df998c2566198725b6157b6db7fcbacf58b3b85f919592`; desktop artwork `4086f32fd00cae3d78a12dae5e0ebc49f4e2ad94601e50395b8f5a2bedfda509`; mobile artwork `08acd2c332644ad0f2b3b458432d3897d7b4bb4e3d8f5421159505888f239e36`; hero and tracking remained unchanged.
- Desktop 1440×900 and mobile 390×844 passed with three pillars, one block CTA, all images loaded, no horizontal overflow and the intended responsive sequence. The fifth official WhatsApp CTA preserves hotel/address, needed-by, approximate load and service fields and uses `SEO-LBV-PROOF` exactly once.
- The immediate public monitor passed every technical, SEO, offer, destination, attribution and delivery check. Google Ads and paid-conversion settings were not changed.

### Owner-requested Local Coverage and Hotels revision — 2026-08-21

- Rebuilt only Block 6 as a Lake Buena Vista hotel-coverage confirmation section. Hero, Blocks 2–5, FAQ, closing CTA, footer and every other page remained unchanged by this revision.
- The six property names were verified against current official Hilton, IHG, Wyndham, Drury and Marriott pages. Their presence is explicitly geographic: it does not claim partnership, endorsement, confirmed hotel permission or guaranteed pickup.
- The owner-supplied image is published as an illustrative service-area concept. The 3.6MB source remains outside the public bundle; responsive derivatives are 244,938 bytes at 1600×900 and 111,918 bytes at 1000×563.
- The sixth official WhatsApp CTA keeps hotel/address, checkout/needed-by, approximate load and Standard/Express fields, adds optional room context and uses the owner-authorized `SEO-LBV-HOTELS` funnel code.
- Local QA passed at 1440×900, 390×844 and 320×568: exact mobile order, six accessible list items, CTA height 56px on mobile, loaded responsive artwork, no first-party console errors and no horizontal overflow.
- Green gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, targeted release-monitor tests and `git diff --check`.
- Approved pre-deployment hashes: source HTML `f85910861345365ffe2b94a5ba1217c12d937bb378ba5a81293760ad35b6bb24`; transformed public HTML `d365256b97659a308b6b03ff1a608e0caccf9901089e836974b3fcc4c881489b`; desktop artwork `d1138f08b038e29aaf41ecadd0a896dcd4c75a0f60c2204ff9203ad22e868ba7`; mobile artwork `424a906056449eb658c143387f544b1f1985dd5c62993129ebe5615854ecfb3c`; tracking remained `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Preview `dpl_E9RR8Rzq5E2gC9xtYCoV8WaJyqhH` was `READY` and matched the approved prebuilt byte for byte. It was promoted exactly, without rebuild, to production `dpl_33wSp24rNv6Zw3LLRArNtwf6E4vz`, also `READY` behind `a7laundry.com` and `www`.
- Immediate public HTTP returned `200` for the transformed HTML, desktop artwork, mobile artwork and tracking. Production matched preview at SHA-256 `d365256b97659a308b6b03ff1a608e0caccf9901089e836974b3fcc4c881489b`, `d1138f08b038e29aaf41ecadd0a896dcd4c75a0f60c2204ff9203ad22e868ba7`, `424a906056449eb658c143387f544b1f1985dd5c62993129ebe5615854ecfb3c` and `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` respectively.
- Public semantic smoke passed with six official WhatsApp CTAs, exactly one `SEO-LBV-HOTELS` CTA with the complete hotel/needed-by/load/service prefill, six hotel list items, the exact canonical and four parseable JSON-LD blocks. Google Ads and paid-conversion settings remained unchanged.

### Owner-requested Operational Social Proof revision — 2026-08-21

- Added a compact social-proof area inside the existing closing, after the primary WhatsApp route and service microcopy and before the independent-service footer disclaimer. No feed, iframe, external widget, autoplay, carousel or social-platform script was added.
- Published only the owner-authorized Instagram `https://instagram.com/a7laundry` and Facebook `https://facebook.com/a7laundry` destinations. Both open in a new tab with `noopener noreferrer`, explicit accessible labels and 48px interaction height.
- YouTube is intentionally absent from links and schema because no official A7 Laundry channel URL was verifiable in the repository. This absence is enforced by the release monitor instead of filling the gap with an inferred handle.
- The page-level LocalBusiness/LaundryService entity now has a deduplicated `sameAs` array containing only the two published social profiles; no other entity or page schema was changed.
- Local QA passed at 1440×900 and 390×844 with no horizontal overflow or first-party console error. Green gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, targeted monitor tests and `git diff --check`.
- Approved pre-deployment hashes: source HTML `d966f27e5fea54917dc98f2488518ffa65123ce535babfe9407868d9fbe98827`; transformed public HTML `1ad833c08cf8bd0facc7181b3c354c7c32207bcb4b0c32f26717840f3fd5e4c5`; tracking remained `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Preview `dpl_5ojm5UdiHHytEmhLqUrafkp8fDSb` was `READY` and matched the approved prebuilt HTML and tracking byte for byte. It was promoted exactly, without rebuild, to production `dpl_GyjuuV6NH6SygxK7frNPgR3QcC9F`, also `READY` behind `a7laundry.com` and `www`.
- Immediate public HTTP returned `200` for the transformed HTML and tracking. Production matched preview at SHA-256 `1ad833c08cf8bd0facc7181b3c354c7c32207bcb4b0c32f26717840f3fd5e4c5` and `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` respectively.
- Public semantic smoke passed with six official WhatsApp CTAs; the exact Instagram and Facebook destinations with `_blank`, `noopener noreferrer` and explicit accessible labels; zero YouTube links; exact two-value `sameAs`; the canonical URL; and four parseable JSON-LD blocks. Google Ads and paid-conversion settings remained unchanged.

### Owner-requested trust and direct-contact revision — 2026-08-21

- A visual review of the full public funnel identified that the closing provided conversion buttons but not a persistent, human support cue. The revision adds a compact A7 guest-support dock instead of a generic circular chat widget.
- The dock remains hidden in the hero, appears after the visitor advances into the page and hides before the closing enters the viewport. It provides WhatsApp, SMS and telephone choices with accessible labels and minimum 44px targets; it does not cover the FAQ, closing CTA, social proof or safe area.
- WhatsApp uses the complete hotel/address, checkout/needed-by, approximate load and service prefill with the dedicated `SEO-LBV-FLOAT` source. SMS uses the official `+1 407-670-8839` destination and `SEO-LBV-SMS`; the existing tracking foundation already classifies `sms:` as `sms_click`. FaceTime was not published because no repository evidence proves that the official number is registered and monitored for that channel.
- The owner-provided `https://share.google/XbKSTKkWOe5CYwPR9` Google Business Profile share link is now a visible verification route beside Instagram and Facebook, with `_blank`, `noopener noreferrer` and an explicit accessible label. It is not inserted into LocalBusiness `sameAs`, which remains limited to the two canonical social URLs.
- Local QA passed at 320×568 and 390×844: dock left/right bounds remained inside the viewport, no horizontal overflow was present and the dock was hidden at the closing. Seven official WhatsApp links, one SMS route, three telephone links, the Google profile route and zero `facetime:` links were confirmed in the public build.
- Green pre-deployment gates: `npm run lint`, `npm run typecheck`, `npm test` (27 contract TAP tests plus 15 MOS tests and validators), `npm run build:public`, the focused LBV monitor tests and `git diff --check`.
- Approved pre-deployment hashes: source HTML `823bb7a3a18bb5d553aae13ca013cee60977c400f6367063fa8cfda891e88957`; transformed public HTML `5c5522c306d81364db7b475b8583e686a0098cee52f60c3fc77510744b23fd92`; tracking remains `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Preview `dpl_HUbcUKhpbDzWCM4jpkJMxAcc7edQ` was `READY` and matched the approved prebuilt HTML and tracking byte for byte. It was promoted exactly, without rebuild, to production `dpl_4aNhy7MrENjDZR4UveujF2wno4CG`, also `READY` behind `a7laundry.com` and `www`.
- Immediate public HTTP returned `200` for the transformed HTML, hero and tracking. Production matched preview at SHA-256 `5c5522c306d81364db7b475b8583e686a0098cee52f60c3fc77510744b23fd92` and `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` for HTML and tracking respectively.
- Public semantic smoke passed with seven official WhatsApp CTAs; exactly one complete `SEO-LBV-FLOAT` prefill; one `sms:+14076708839` route with `SEO-LBV-SMS`; three `tel:+14076708839` routes; the exact Google Business Profile, Instagram and Facebook destinations with safe external-link attributes; zero `facetime:` routes; exact two-value Instagram/Facebook `sameAs`; canonical; and four parseable JSON-LD blocks.
- Public visual QA at 390×844 and 1440×900 confirmed no horizontal overflow, the dock hidden in the hero, visible and fully inside the viewport after the hero, and hidden once the closing entered the viewport. Google Ads and paid-conversion settings remained unchanged.

### Owner-requested WhatsApp and SMS simplification — 2026-08-21

- Removed every `tel:` route from the Lake Buena Vista landing and retained only WhatsApp and SMS as direct-contact options.
- The floating support dock now has two larger actions, uses the complete WhatsApp mark and preserves the official `+1 407-670-8839` destination plus `SEO-LBV-FLOAT`/`SEO-LBV-SMS` attribution.
- The closing call route and footer phone route were replaced by prefilled SMS links. The release monitor contract now requires seven official WhatsApp links, three SMS routes, zero telephone routes and zero FaceTime routes.
- Approved local hashes: source HTML `00336cb5b31743deb6e102e0a381fc432c454e1445834486a7a71d3d659220cc`; transformed public HTML `f7fff1f8bb857f26d37af4f49b5c3558eead510f1431bb38822698709c009a93`; tracking remains `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Preview `dpl_AzkqwmuhcijzsAgfnzD4o2FHKCTL` was `READY` and matched the approved prebuilt HTML and tracking byte for byte. It was promoted exactly, without rebuild, to production `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS`, also `READY` behind `a7laundry.com` and `www`.
- Immediate public HTTP returned `200` for the transformed HTML, hero and tracking. Production remained byte-identical to preview at SHA-256 `f7fff1f8bb857f26d37af4f49b5c3558eead510f1431bb38822698709c009a93` and `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` for HTML and tracking respectively.
- Public semantic smoke passed with seven official WhatsApp links; three official `sms:+14076708839` routes carrying `SEO-LBV-SMS`; zero `tel:` and `facetime:` routes; exactly one complete `SEO-LBV-FLOAT` prefill; two dock actions; the complete two-path WhatsApp mark and visible label; canonical; and four parseable JSON-LD blocks.
- Google Ads and paid-conversion settings remained unchanged.

- Rollback target: the immediately preceding Vercel production deployment; do not delete the existing URL or assets.
- Immediate rollback triggers: HTTP/asset failure, broken WhatsApp/phone destination, lost funnel code/tracking, unsupported offer, material layout/contrast regression or indexation/canonical error.
- Commercial assessment uses qualified leads, paid orders, revenue and margin reconciled to source; it does not use raw WhatsApp clicks as sales.
- Monitoring checkpoints: immediate, 24h, 72h, 7d, 14d and 28d. Future checkpoints must remain open until their dates occur.

### Monitoring ledger

Release clock: production created **2026-08-21 00:23 EDT**. Checkpoints use Orlando local time.

| Checkpoint | Due | Status | Required evidence |
|---|---:|---|---|
| Immediate | 2026-08-21 00:29 EDT | Passed | Public HTML returned HTTP 200; canonical URL, `SEO-LBV-V2` and primary CTA text were present; production/preview hashes, CTA destinations, structured data and responsive visual smoke had already passed. |
| 24h | 2026-08-22 00:23 EDT | Open | Availability/assets, canonical/indexability, CTA/tel/prefill/tracking smoke, GA4 landing/CTA data when available, qualified leads and paid orders reconciled to source. |
| 72h | 2026-08-24 00:23 EDT | Open | Repeat technical checks; inspect search visibility/indexation when available; reconcile leads, paid orders, revenue/margin and deadline/handoff quality; inspect adjacent-page behavior without claiming causality. |
| 7d | 2026-08-28 00:23 EDT | Open | Technical health, CWV/field data when sampled, GSC/GA4, qualified leads, paid orders, revenue/margin and query/landing-page mix. |
| 14d | 2026-09-04 00:23 EDT | Open | Same evidence set with lag-aware reconciliation; review semantic overlap with Disney Springs and near-Disney URLs. |
| 28d | 2026-09-18 00:23 EDT | Open | Final monitored-release assessment using paid orders, qualified leads, revenue and margin; no uplift claim from raw clicks or a simple before/after comparison. |

At every checkpoint, unavailable analytics or insufficient sample size must be recorded as unavailable/insufficient rather than zero. Rollback requires a verified technical/operational failure or a sustained commercial decline that cannot reasonably be explained by attribution lag, mix or low volume.

The repeatable command is `npm run monitor:lbv -- --checkpoint <checkpoint> --out <new-evidence-file>`. It fails when availability, released hashes, canonical/H1, offer, CTA destination/prefill, telephone, funnel code, hero, JSON-LD, robots, sitemap or adjacent-page intent/linking contracts drift. The immediate machine-readable evidence is `monitoring/lbv-2026-08-21-immediate.json`; the expanded SEO evidence is `monitoring/lbv-2026-08-21-immediate-seo.json`. Both passed every applicable technical check and explicitly leave commercial reconciliation outside the smoke test.

The commercial boundary and checkpoint fields are defined in `monitoring/LBV-COMMERCIAL-RECONCILIATION.md`. At release, GA4/GSC were available only behind the protected MOS owner login and no authenticated monitoring session was present; WhatsApp conversations and paid-order records were not inspected. Those sources are therefore recorded as unavailable/not reconciled, never zero. The ledger prohibits PII and requires operator-adjudicated aggregate leads plus verified paid orders/revenue before any commercial conclusion.

The 24h starting record is `monitoring/lbv-commercial-checkpoint-template.json`. Validate a completed copy with `npm run monitor:lbv:commercial -- <checkpoint.json>`. The gate rejects unexpected/PII-shaped fields, revenue without reconciled orders, margin without revenue, operational leads without an inspected source, source attribution without evidence and a commercial rollback without sufficient reconciled sample.

### Discovery submission

At 2026-08-21 00:43 EDT, the public IndexNow key was verified and only `https://a7laundry.com/blog/laundry-lake-buena-vista` was submitted. The protocol endpoint accepted the request with HTTP 200. Evidence is preserved in `monitoring/lbv-indexnow-submission-2026-08-21.json`. This proves receipt only; it does not prove crawling, indexation, ranking or Google Search Console status.

At 2026-08-21 00:44 EDT, a read-only Search Console access probe reached `sc-domain:a7laundry.com`, but the active Google session did not have property access. No URL inspection was performed, no account identifier was stored and indexation remains `unavailable`, not false/zero. The PII-free boundary is recorded in `monitoring/lbv-gsc-access-2026-08-21.json`; an authorized property session or the protected MOS source is required for GSC evidence.

At 2026-08-21 00:46 EDT, a read-only Analytics probe confirmed that the active Google session can open GA4 but does not expose the contracted A7 Laundry USA property `543807649`. Metrics shown for other properties were recognized as out of scope and rejected rather than attributed to Orlando. No landing report was run, no account/user identifier or unrelated metric was stored, and LBV GA4 remains `unavailable`, not zero. Evidence: `monitoring/lbv-ga4-access-2026-08-21.json`.

The production monitor now also enforces final URL, HTML/WebP/JavaScript content types, HSTS, `nosniff`, frame denial, strict referrer policy and an explicit cache policy. The expanded delivery run passed all **39** technical/SEO/delivery checks; immutable evidence: `monitoring/lbv-2026-08-21-immediate-delivery.json`.

### Completion audit

The A7-011 acceptance checklist was reconciled against the actual files, public deployment, independent reviews and test output. Proven items were checked; only three acceptance items remain open:

1. a real screen-reader session, because that environment was unavailable;
2. real Safari, because Safari remote automation is disabled (Chrome and WebKit 26 passed);
3. the dated 24h/72h/7d/14d/28d monitoring series, which cannot be completed before those checkpoints occur.

These open items are not represented as failures or approvals. They remain explicit limitations. All other acceptance criteria are backed by the story evidence and public monitor; the release stays in `Released — Monitoring` rather than being declared fully complete.
