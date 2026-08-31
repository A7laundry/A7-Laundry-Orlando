# Release evidence — Orlando money page

Date: 2026-08-22  
Canonical: `https://a7laundry.com/laundry-pickup-delivery-orlando`  
Scope: the Orlando money page, its four new responsive WebP assets and the corresponding sitemap entry. Google Ads, GA4, Search Console, Stripe conversion logic and bidding were unchanged.

## Release chain

| Stage | Deployment | State | URL |
|---|---|---|---|
| Rollback baseline | `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9` | `READY` | former production |
| Approved preview | `dpl_ENBRJg6vKAtNEndtofH9sMpaqoQj` | `READY` | `https://a7-laundry-orlando-nvn7olodp-dennis-a7s-projects.vercel.app` |
| Production | `dpl_8mzMMHy2q6ZFPJV4HKgPMLwtgV6J` | `READY` | `https://a7-laundry-orlando-k5zi4dymi-dennis-a7s-projects.vercel.app` |

Production aliases: `https://a7laundry.com`, `https://www.a7laundry.com`.

## Exact artifact identity

| Artifact | Local/prebuilt/preview/production SHA-256 |
|---|---|
| Money-page HTML | `d247fd4a04713eac3476618ec27e7c8377d01402317194734ca72e814df61c38` |
| Desktop hero WebP | `03bb22c1f32f14d6953f2532d573f21dfabc09d916504d30fe89a5d12fd405f4` |
| Unified tracking | `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` |
| Sitemap | `f497e0597775855be939f7a00c397c6e785110c3a9a5b686a9c1edb51eee35b3` |

Before publication, the other dirty public-source files were compared against production and were byte-identical. The expected public delta was restricted to the money page, sitemap and new responsive imagery.

## Gates

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: pass — 34 TAP root tests plus 15 MOS tests and all static/tracking/Ads/Stripe validators.
- `npm run build`: pass.
- `git diff --check`: pass.
- Vercel prebuilt preview: pass.
- Preview Chrome review: pass; no first-party console error.
- Public Chrome desktop review: pass; no first-party console error.
- Public exact CDP 390×844: pass; `scrollWidth = innerWidth = 390`, nav CTA hidden, hero WhatsApp CTA at y=684–736, no visible target below the 44px gate.

## Production smoke

- HTTP 200 for canonical HTML, hero, tracking and sitemap.
- Title: `Laundry Pickup & Delivery Orlando for Travelers | A7`.
- H1: `Laundry pickup in Orlando. Your plans keep moving.`
- Canonical: exact.
- WhatsApp links: 3, all official and carrying `SEO-ORLANDO-MONEY-V2` plus location, needed-by, load and service fields.
- SMS links: 2, with the same contract.
- Footer telephone link: 1 secondary contact; no competing call CTA was introduced.
- Required anchors: `#how`, `#pricing`, `#care`, `#areas`, `#questions`.
- Visible FAQs: 10; schema entities in the single JSON-LD array: 5.
- Tailwind CDN: absent.
- Deferred identified-return image and official Stripe badge: loaded successfully.

## Rollback

Rollback deployment: `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9`.

Rollback if the public page, canonical/indexability, contact destinations, offer truth, tracking, responsive rendering or server availability regresses. After rollback, rerun the same HTTP/hash/contact/schema smoke before declaring recovery.

## Monitoring

| Checkpoint | Due | Required evidence |
|---|---|---|
| Immediate | Complete | Availability, byte identity, desktop/mobile render, canonical, CTAs, fields, anchors, schema and console. |
| 24h | 2026-08-23 | Availability, canonical/indexability, CTA/tracking health, qualified contacts and paid orders when reconciled. |
| 72h | 2026-08-25 | Same checks plus query/landing behavior when GA4/GSC sources are available. |
| 7d | 2026-08-29 | Technical health, qualified leads, paid orders, revenue/margin and page/query fit; no causal uplift claim from simple before/after. |
| 14d | 2026-09-05 | Search coverage, internal intent boundaries and conversion quality with lag considered. |
| 28d | 2026-09-19 | Full SEO/CRO/commercial review with an adequate reconciled sample or explicit insufficient-data status. |

GA4 and Search Console URL-level evidence was unavailable in the active audit context at release time and remains `unavailable`, never zero. WhatsApp clicks remain microconversions; final outcomes are qualified guest contacts and verified paid orders.

## Taste Skill owner-approved production amendment

The bounded anti-template candidate was built as a protected preview for owner comparison. After the
owner explicitly approved it, `@devops` promoted that exact deployment without rebuild. It reduces
repeated eyebrow treatments, replaces the equal audience-card rhythm with a hotel-led editorial
composition, humanizes supporting copy and adds restrained interaction feedback. Canonical intent,
offer, anchors, FAQ/schema, WhatsApp/SMS contract and tracking remain unchanged.

| Stage | Deployment | State | URL |
|---|---|---|---|
| Taste candidate preview | `dpl_BJWE6BuRG9dkQeVBXVkGmBtkdGvK` | `READY` | `https://a7-laundry-orlando-ns5o1th4y-dennis-a7s-projects.vercel.app` |
| Taste production | `dpl_98FASVxTNWedYknntjBgDte5N7mh` | `READY` | `https://a7-laundry-orlando-myovwe0eo-dennis-a7s-projects.vercel.app` |
| Rollback production | `dpl_8mzMMHy2q6ZFPJV4HKgPMLwtgV6J` | `READY` | preceding production |

- Source HTML SHA-256: `1fea29362841baabe59ae9e426577d8b38ffa962d1782ff84306c76db0416a5a`.
- Built/prebuilt/protected-preview HTML SHA-256: `53b057e4176bb5b7e28049c8e2921377837ad1dbb3d68e087288f180e0392390`.
- Hero SHA-256: `03bb22c1f32f14d6953f2532d573f21dfabc09d916504d30fe89a5d12fd405f4`.
- Tracking SHA-256: `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf`.
- Sitemap SHA-256: `f497e0597775855be939f7a00c397c6e785110c3a9a5b686a9c1edb51eee35b3`.
- Lint, typecheck, 34 root TAP + 15 MOS tests, build, tracking/attribution/business guards and
  `git diff --check`: pass.
- Independent QA and exact byte-identical prebuilt renders at 320×568, 390×844, 768×1024 and
  1440×900: pass, with no overflow, clipping or overlap.
- Preview and public-production smoke: canonical and required anchors exact; three WhatsApp and two
  SMS links with complete `SEO-ORLANDO-MONEY-V2` fields; five schema entities; visible/schema FAQ
  parity 10/10. Public HTML, hero, tracking and sitemap returned HTTP 200 and match preview hashes.
- Public Chrome at 390×844 and 1440×900 passed with no overflow, broken image, sub-44px visible target
  or page error; the hero CTA remained in the first viewport.
- Direct visual automation inside the protected URL was unavailable due deployment protection. It was
  not claimed as passed; authenticated byte download plus exact prebuilt rendering supplied the
  equivalent artifact evidence.
- Immediate immutable record: `monitoring/orlando-money-page-taste-2026-08-22-immediate.json`.
- No commit, push or Google Ads action occurred.
