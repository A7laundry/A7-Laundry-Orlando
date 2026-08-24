# Release Evidence — Orlando Resort Area Guest Laundry

**Story:** A7-012  
**Target:** `https://a7laundry.com/blog/laundry-near-universal-orlando`  
**Status:** Released to production; immediate gate PASS; monitored window open  
**Baseline production deployment:** `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS`

## Baseline and rollback boundary

- Existing URL, rewrite, self-canonical, sitemap entry, blog card and tracking slug mappings are present and must be preserved.
- Baseline source HTML SHA-256: `1ab14ab70d7adcd323272e491a9ae0de2c5c6fcd632a6e1555afb80e0df3d164` (21,717 bytes).
- Baseline public hero SHA-256: `f8b876d7ed20e68dfdbfb71e5fb34dff4d7def63b4ef92ca869ba0176812b5fb` (238,030 bytes).
- Shared tracking SHA-256: `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- `a7-tracking.js` maps this slug to `page_type=bofu` and `geo=universal`; no shared tracking change is authorized unless a focused regression proves it necessary.
- Rollback: `@devops` promotes baseline production deployment `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS` or restores only the A7-012 files. No unrelated dirty-worktree file may be reset or overwritten.

## Baseline defects

- Tailwind CDN, remote fonts and Material Symbols are loaded by a static page.
- The LCP image is lazy-loaded and shows recognizable roller-coaster silhouettes.
- Copy repeats the I-Drive template and contains visible double-escaped entities.
- `Normal`, unconditional `free pickup`, chosen-time pickup and insufficiently qualified Express language drift from the current canonical offer.
- Contact paths and prefills do not match the current WhatsApp + SMS contract or the real guest-deadline intake.
- The page is long, repetitive and presents generated imagery without an explicit illustrative-workflow boundary.

## Claim matrix

| Claim | Source | Status | Publication rule |
|---|---|---|---|
| Standard from US$3.25/lb, approx. 24h | MANIFESTO + canonical paid offer | Approved | Keep price and approximate return together |
| Express from US$3.95/lb, up to 8h | MANIFESTO + canonical paid offer | Conditional | Same reading context must state availability, capacity and window are confirmed |
| US$50 minimum | MANIFESTO + canonical paid offer | Approved | Visible before conversion CTA and in FAQ/schema |
| Pickup and delivery included | Canonical paid offer | Conditional | Only for a confirmed service address/area |
| Hotel/front desk/Bell handoff | Operational evidence | Conditional | Only when the property permits and A7 confirms the handoff |
| Official WhatsApp/SMS +1 407-670-8839 | Business config | Approved | No call or FaceTime route on this page |
| Ratings, review count or named hotel pickups | No current page-specific evidence | Rejected | Do not publish |
| Park/hotel affiliation, attraction access or special privilege | No support; owner prohibited | Rejected | Never publish or imply |

## Intent boundary

| URL | Primary intent | Required differentiation |
|---|---|---|
| `/blog/laundry-near-universal-orlando` | Orlando resort guest who needs clean clothes for tomorrow's plans | Family/group, heat/wet clothes and the next full day remain dominant; checkout/flight/next hotel are secondary deadlines |
| `/blog/laundry-international-drive-orlando` | Broad I-Drive corridor coverage | Convention, shopping, attractions and corridor convenience remain dominant |
| `/blog/laundry-lake-buena-vista` | Proven LBV hotel corridor | LBV hotel-pickup relevance and its existing story remain untouched |

## Search and AI-discovery design

- Query families: `Orlando resort guest laundry`, `laundry pickup for tomorrow's plans`, `wash and fold pickup for resort guests`, and `resort-area laundry service`. Checkout and same-day intent remain secondary here so `/blog/laundry-before-checkout-orlando` retains the urgent checkout-day boundary.
- Answer-first entity chain: `A7 Laundry → independent Orlando laundry service → hotel/resort guest → pickup → wash/dry/fold → coordinated return → WhatsApp/SMS`.
- Google guidance recorded for this build: normal SEO foundations remain the basis for AI features; content must be accurate, useful, unique and people-first. No separate “AI ranking trick” is used.
- Bing/Copilot eligibility is supported by the canonical URL, crawlable internal links, XML sitemap and post-release IndexNow submission; none guarantees ranking or citation.

## Lovart asset ledger

| Asset | Tool/date | Prompt evidence | Rights/inspection | Decision/derivatives |
|---|---|---|---|---|
| `assets/orlando-resort-area-hero-lovart-master-v1.png` | Lovart.ai GPT Image 2 / 2026-08-21 | Exact prompt below; Lovart project `3a984c5cc0e24ba0a4e72f8b3ea18788` | Owner-authorized original generation in the authenticated Lovart workspace for commercial website use. Human inspection at source resolution found no logo, pseudo-text, attraction, recognizable property, plate or PII; hands, faces, bag and geometry passed. | Approved. SHA-256 `b5c883410f789a93a3c5c804b640553435d8f349de6e123d572b04d9028e1628`; derivatives: hero 1600×900/87KB and 960×540/41KB. |
| `assets/orlando-resort-area-relief-lovart-master-v1.png` | Lovart.ai GPT Image 2 / 2026-08-21 | Same exact prompt and project | Same rights basis. Human inspection found no mark, pseudo-text, recognizable property or PII; people, folded clothes, transparent wrap and room geometry passed. | Approved. SHA-256 `d7aeb18bf890918a1d2fc4fc3083aaf8c7fdc32dd380bb8fdb148db2016bc67f`; derivatives: 1600×900/113KB and 960×540/52KB. |
| `assets/orlando-resort-area-handoff-lovart-master-v1.png` | Lovart.ai GPT Image 2 / 2026-08-21 | Same exact prompt and project | Same rights basis. Human inspection found no hotel/vehicle mark, plate, pseudo-text, recognizable architecture or PII; anatomy, bag and vehicle geometry passed. | Approved as an independent illustrative scene, not documentary proof and not claimed to depict the same family/worker. SHA-256 `52b63ac8e641b67a2dc0b535b75c222ee889489af687d194a2ae8c974b556e58`; derivatives: 1600×900/124KB and 960×540/60KB. |

### Exact Lovart prompt

> Create THREE SEPARATE high-resolution 16:9 photorealistic editorial images for an independent Orlando hotel-guest laundry pickup landing page. Deliver each scene as its own downloadable image, not a collage. Keep the same believable family and the same plain-navy laundry-service worker across the set for visual continuity. VISUAL DIRECTION: premium but warm, human, energetic Florida resort-area hospitality; natural skin and fabric texture; believable hotel interiors; cinematic daylight; navy, aqua, coral and warm ivory accents; sophisticated editorial framing; no glossy AI-plastic look. SCENE 1 — HERO / THE GUEST MOMENT: inside a generic upscale Orlando hotel room after a long active day. A family with two children is getting ready to continue their evening plans while a friendly independent laundry-service worker at the doorway receives a full plain navy drawstring laundry bag. Show lightweight vacation clothes, a damp towel and a nearly empty suitcase naturally, without mess becoming grotesque. Compose the people and bag toward the right half and preserve a calm darker area on the left for website headline text. The emotional read is: plans continue because laundry is handled. SCENE 2 — RELIEF / NEXT DAY READY: the same generic hotel room the next morning. Clean folded family clothes are neatly returned on the bed, with a plain transparent protective wrap nearby; the family is heading out through the doorway, relaxed and ready for the day. Human, candid, organized, not staged like a catalog. Leave moderate negative space for editorial layout. SCENE 3 — HUMAN HANDOFF / LOCAL SERVICE: outside the covered entrance of a completely generic Orlando resort-area hotel, the same plain-navy laundry worker coordinates a laundry handoff with the adult guest. A neutral unbranded vehicle is nearby, palm trees and multiple generic hotel buildings are softly visible in the distance. The scene should communicate real local pickup, proximity and trust without depicting any specific property. MANDATORY NEGATIVE CONSTRAINTS FOR ALL THREE: absolutely no Universal, Disney, Epic Universe, CityWalk or any other park/hotel/company name; no logos except none at all; no text, letters, numbers, signage, badges, license plates, watermarks or pseudo-glyphs; no roller coasters, rides, castles, globes, mascots, characters, attraction silhouettes, fireworks or recognizable park/hotel architecture; no branded uniforms or vehicles; no maps or location pins; no visual similarity to protected trade dress. Correct anatomy, hands, fingers, faces, fabric, bag geometry, reflections and shadows. No identifiable real person. No claims embedded in the art. Commercial website use, 16:9 landscape, minimum 2048px wide.

Lovart did not preserve the same worker/family with sufficient identity consistency across all three files. The page therefore treats them as separate illustrative service moments and makes no continuity or documentary claim.

## QA and release ledger

- Local hero review in the authenticated Chrome session passed at the available desktop viewport: offer, headline, CTA, worker and family remain legible; no overlap or horizontal overflow observed.
- Focused monitor: 5/5 TAP tests passed, including a negative regression fixture for visible FAQ/schema parity.
- Repository validators: static site, AI Search and business destinations passed.
- Full `npm test`: 32 TAP + 15 MOS TAP tests and all validators passed after integrating the focused monitor.
- `npm run lint`, `npm run typecheck`, `npm run build:public` and `git diff --check`: passed.
- Build output: `dist/`, zero legacy creative assets.
- Final local artifact hashes: source HTML `a3b9a711e20c2ee2f21e3fec377ba7bdbec5285497c6160996fb51e3d2153219`; built HTML `e90d9f47b49941f5e441b6ae27ba2949700d21e7e6b8461d16b9d5813d04e75d`; hero `22c83e8b465f3ddcb9b3728ae91a1b20aaa72e3d57b76039fe8ff9a169ad3b81`; tracking `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Independent SEO/GEO/AI Search review: GREEN. The resort/next-day intent is materially differentiated from checkout-day, broad hotel, I-Drive and LBV pages.
- Independent brand/claims/privacy/performance-static review: GREEN. No third-party marks, unqualified offer claim, PII, call route, responsive overflow or sticky collision remains.
- Independent design/CRO/responsive preview gate: PASS across 320×568, 375×667, 390×844, 430×932, 768×900, 1024×768, 1100×800, 1101×800 and 1440×900; no overflow, truncated CTA, sticky collision or target below 44px remains.
- Protected preview `dpl_66kkjvf7hcZmMX4YAjGCATghdwsv` reached `READY` at `https://a7-laundry-orlando-adgw33guz-dennis-a7s-projects.vercel.app`. Authenticated HTML, hero and tracking downloads returned HTTP 200 and matched the approved prebuilt hashes byte for byte.
- Lighthouse mobile on the exact byte-identical artifact: **Performance 99, Accessibility 100, Best Practices 96, SEO 100**; FCP 0.92s, LCP 2.11s, CLS 0, TBT 24ms, Speed Index 0.92s and 276KB transferred. The protected preview prevented an anonymous network-only Lighthouse run; the measured artifact was independently proven byte-identical before promotion.
- Playwright WebKit 26 passed at 390×844: no horizontal overflow, primary CTA in the first viewport, five WhatsApp and two SMS routes, required funnel fields, four JSON-LD blocks, canonical, all lazy assets, ≥44px targets and zero page errors.
- Exact Vercel promotion, without rebuild, created production deployment `dpl_23n52R27SoJaB4t3WYzGe3oHVi8r`, `READY` behind `https://a7laundry.com` and `https://www.a7laundry.com`.
- Production HTML, hero, tracking and sitemap returned HTTP 200. HTML `e90d9f47b49941f5e441b6ae27ba2949700d21e7e6b8461d16b9d5813d04e75d`, hero `22c83e8b465f3ddcb9b3728ae91a1b20aaa72e3d57b76039fe8ff9a169ad3b81` and tracking `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` match local and preview exactly.
- Public Chrome smoke passed at 390×844 and 1440×900: no overflow, hero CTA in the first viewport, exact canonical, five WhatsApp, two SMS, complete prefills, four JSON-LD blocks, zero call/FaceTime and zero page errors. All responsive image endpoints separately returned HTTP 200.
- Immediate monitor passed every check and was saved at `monitoring/orlando-resort-area-2026-08-21-immediate.json`. It validates page/assets/tracking/sitemap HTTP status, hashes, canonical, H1, WhatsApp/SMS, funnel fields, zero call routes, responsive images, FAQ parity, offer, social destinations and the visible-brand boundary.
- Rollback target remains the immediately preceding production deployment `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS`. No commit, Git push or Google Ads action occurred in this release.
- Monitoring checkpoints 24h/72h/7d/14d/28d remain open. Clicks and pageviews remain micro-signals; only reconciled leads/orders/revenue may support a commercial conclusion.

## Payment reassurance amendment

- Owner request: reduce uncertainty for international guests by showing accepted payment paths in the footer without adding a checkout or unverified card-network badges.
- Source evidence: the live one-use Stripe payment-link flow provides a secure USD payment link; `plans.html` documents Zelle, Venmo, Cash App and cash after weighing. The amendment states only those verified options.
- Copy contract: total confirmed after weighing; secure USD payment link; Zelle, Venmo, Cash App and cash also accepted; never send card details through WhatsApp.
- UI at the initial payment-reassurance release: compact semantic footer section between operational social proof and the independence disclaimer; local generic card SVG only, with no external widget, iframe or payment-brand logo. The later Stripe trust amendment below supersedes only the final logo clause by adding Stripe's official, unmodified local badge.
- Focused monitor expanded to 6/6 tests with a negative fixture for a missing or changed payment option.
- Full local gates after the amendment: `npm run lint`, `npm run typecheck`, `npm test` (33 TAP + 15 MOS), `npm run build:public` and `git diff --check` — PASS.
- Amendment candidate hashes: source HTML `8206fc7b5e23d7e1eff4c3d238630bebe883ea539e67ac5935662d471be846ad`; built HTML `ab7790d8d15e90d83c7f451222d99350a453ff8857a2c833a90535d58351b4f7`; hero/tracking unchanged.
- Independent payment-block QA: PASS at 390px and 1440px, with no overflow, competing CTA, unsupported brand claim or accessibility issue.
- Protected preview `dpl_54pU8XkfneQfmkDp7v69bXXJ5fFx` reached `READY` at `https://a7-laundry-orlando-k76wn98a9-dennis-a7s-projects.vercel.app`. Authenticated HTML, hero and tracking returned HTTP 200 and matched the approved prebuilt hashes byte for byte.
- Preview smoke at 390×844 and 1440×900 passed: no overflow; the block remains compact (383px mobile / 202px desktop), sits after social proof and before the footer, contains the five verified methods and card-safety note, and introduces no competing CTA.
- Exact promotion without rebuild created production deployment `dpl_CqDazPyeqF7c7BuknDgr4tuyLUY8`, `READY` behind `https://a7laundry.com` and `https://www.a7laundry.com`.
- Public production HTML hash is `ab7790d8d15e90d83c7f451222d99350a453ff8857a2c833a90535d58351b4f7`; hero `22c83e8b465f3ddcb9b3728ae91a1b20aaa72e3d57b76039fe8ff9a169ad3b81` and tracking `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` remained unchanged and match preview/local exactly.
- Immediate payment-amendment monitor passed all 28 checks, including `paymentMethodsSafe`, and is stored at `monitoring/orlando-resort-area-2026-08-21-payment-amendment-immediate.json`.
- Payment-amendment rollback target: promote preceding production deployment `dpl_23n52R27SoJaB4t3WYzGe3oHVi8r`. No commit, Git push or Google Ads action occurred.

## Stripe trust amendment

- Owner authorization: strengthen payment confidence with the official Stripe badge and accurate card/wallet language, without adding an embedded checkout or unverified payment-network seals.
- Official mark source: `https://images.stripeassets.com/fzn2n1nzq965/4M6d6BSWzlgsrJx8rdZb0I/733f37ef69b5ca1d3d33e127184f4ce4/Powered_by_Stripe.svg?q=80&w=1082`, discovered through Stripe's official newsroom asset page at `https://stripe.com/newsroom/information` and used without modification. Stripe states that businesses using Stripe may display this badge on checkout-related surfaces and suggests linking it to `https://stripe.com`; the local badge does so.
- Mark terms reviewed at `https://stripe.com/legal/marks`. No recoloring, redrawing, card-network logo, wallet logo, certification seal or endorsement claim was added.
- Payment behavior source: `https://docs.stripe.com/payment-links/create` documents that Payment Links open a Stripe-hosted payment page. Exact wallet visibility depends on enabled payment methods and device/browser compatibility, so the page says only: `Apple Pay and Google Pay may be available on compatible devices at checkout.`
- Published copy contract: secure USD link hosted by Stripe; major cards through the link; wallet availability conditional; Zelle, Venmo, Cash App and cash preserved; total confirmed after weighing; card details never sent through WhatsApp.
- Official SVG SHA-256: `f7679ac0b652521fe0a6b7453541a5bb649d63c373a0191975ce339bd9d3376d` (9,275 bytes), source and `dist/` byte-identical.
- Local amendment hashes: source HTML `45c9549da4b0ce1e7714d81af21bcbf2616df9279fcf6cb57cbdc82aa358d558`; built HTML `c64bd5e7c856aae5801f988e95585406a295bc121c60602139724f2aa5499b06`; hero/tracking unchanged.
- Focused monitor expanded to 7/7 with negative fixtures for a substituted badge and an unconditional wallet claim. Full local gates: lint, typecheck, 34 TAP + 15 MOS tests, public build and diff-check — PASS.
- Independent QA: PASS for production after documentary recheck. Exact official badge bytes, marks usage, conditional wallet language, 390×844/1440×900 layout, accessibility, source/dist and focused/full gates were approved with no open finding.
- Protected preview `dpl_ErgNRhk5hVLjp9c3TNBXzF4HCdkJ` reached `READY` at `https://a7-laundry-orlando-aw6l5ddnn-dennis-a7s-projects.vercel.app`. Authenticated HTML, official badge, hero and tracking returned HTTP 200 and matched the approved prebuilt hashes byte for byte.
- Preview smoke passed at 390×844 and 1440×900: zero overflow or page errors; official badge loaded at a 150×44 target and links safely to `https://stripe.com`; hosted-link/card language was present; wallet language remained conditional; five WhatsApp, two SMS, four JSON-LD, exact canonical and zero call routes were preserved.
- Exact promotion without rebuild created production deployment `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9`, `READY` behind `https://a7laundry.com` and `https://www.a7laundry.com`.
- Public hashes match preview/local exactly: HTML `c64bd5e7c856aae5801f988e95585406a295bc121c60602139724f2aa5499b06`; official Stripe badge `f7679ac0b652521fe0a6b7453541a5bb649d63c373a0191975ce339bd9d3376d`; hero `22c83e8b465f3ddcb9b3728ae91a1b20aaa72e3d57b76039fe8ff9a169ad3b81`; tracking `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Immediate Stripe-trust monitor passed all 31 checks, including badge HTTP/content type/hash, `stripeTrustSafe`, payment/contact/schema/sitemap and artifact hashes. Evidence: `monitoring/orlando-resort-area-2026-08-21-stripe-trust-amendment-immediate.json`.
- Stripe-amendment rollback target: promote preceding production deployment `dpl_CqDazPyeqF7c7BuknDgr4tuyLUY8`. No commit, Git push or Google Ads action occurred.
- Release remains pending protected preview, byte verification, responsive public smoke and exact no-rebuild production promotion by `@devops`.
