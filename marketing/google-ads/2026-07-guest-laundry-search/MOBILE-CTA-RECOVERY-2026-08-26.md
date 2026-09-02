# Orlando paid-search recovery — 2026-08-26

## Decision

Prepare a bounded recovery candidate for the existing Orlando money page: restore one persistent WhatsApp path on screens up to 620 px, without changing the offer, campaign, bidding, budget, keywords, geography, WhatsApp destination or measurement contract.

This is a controlled response to a plausible conversion-friction regression, not a claim that the page change caused the commercial decline. The paid sample remains too small to establish causality.

## Forensic baseline

Fair complete-day comparison from the owner-authenticated Google Ads UI:

| Metric | Aug 24–25 | Aug 17–18 | Change |
| --- | ---: | ---: | ---: |
| Impressions | 157 | 282 | -44.3% |
| Clicks | 12 | 19 | -36.8% |
| CTR | 7.64% | 6.74% | +0.90 pp |
| Average CPC | R$17.40 | R$19.27 | -9.7% |
| Cost | R$208.81 | R$366.11 | -43.0% |
| Website WhatsApp clicks | 2 | 5 | -60.0% |
| WhatsApp click rate per paid click | 16.67% | 26.32% | -9.65 pp |
| Stripe purchases | 0 | 2 | -100% |

All 12 current-period paid clicks and all 19 prior-period spending clicks were on smartphones. Estimated eligible-query volume weakened, while search impression loss to rank also worsened. The observed decline therefore combines lower demand/eligibility with a possible on-page mobile-friction contribution.

## Candidate contract

- Keep the original hero CTA visible and unobstructed.
- Show the fixed CTA only after the hero WhatsApp CTA leaves the viewport.
- Keep the fixed CTA hidden above 620 px.
- Preserve official destination `14076708839`, the full intake prefill and `A7 Ref: SEO-ORLANDO-MONEY-V2`.
- Preserve unified tracking through the existing `wa-fab` placement contract; add no inline contact event.
- Reserve bottom safe-area space so the CTA cannot cover the final page content.
- Update WebPage `dateModified` to `2026-08-26`.

## Visual and deterministic evidence

- 390×844: no horizontal overflow; the hero CTA is unobstructed; the fixed CTA becomes fully visible after the hero CTA leaves the viewport.
- 1440×900: the fixed CTA remains hidden; no horizontal overflow.
- CTA inventory: four WhatsApp paths and two SMS paths, all on the official number.
- Mobile screenshot: `evidence/a7-mobile-sticky-recovery-390x844.png`.
- Candidate source SHA-256: `07d041e1e292593178bc7148102026a51c4d3215f597f9a66b4a01a3ea83569d`.

## Google Ads image replacement package

The Aug 25 image asset was rejected for text/image overlay and recorded zero impressions and zero clicks. Two clean derivatives were prepared from the already controlled Orlando handoff source, with no text overlay:

- Landscape 1200×628: `assets/image-extension/a7-guest-laundry-handoff-landscape-1200x628.jpg` — SHA-256 `2ded531fbbeb38dff6b8af8143bbfdc57d5bb9e9ee9c5548e1bf8aa35b41847e`.
- Square 1200×1200: `assets/image-extension/a7-guest-laundry-handoff-square-1200x1200.jpg` — SHA-256 `73d06856ec8c6510951e7fa71df4040749d05d6ba4012dcc7328648a6418c1ef`.

The owner-authenticated account `290-113-2891` and active campaign were selected in Google Ads. Chrome blocked the file transfer because the ChatGPT extension does not currently have file-URL access, so no replacement was uploaded or saved and no account setting changed. After that browser permission is enabled, resume from the open image dialog. Policy review remains an external state; do not describe these assets as serving until Google marks them eligible and reports impressions.

## Release and rollback boundary

Production was not changed while preparing this candidate. The verified live baseline is Vercel deployment `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`, Ready and aliased to `a7laundry.com`. If the candidate is later promoted, that deployment is the immediate rollback target.

Release must follow the repository's protected DevOps boundary. After promotion, record the new immutable deployment ID and public HTML hash before starting the post-release comparison.

## Monitoring

Use `monitoring/orlando-mobile-cta-recovery-2026-08-26.json` as the baseline. Compare seven complete post-release days with the same weekdays immediately before release. Report paid smartphone clicks, website WhatsApp clicks, WhatsApp-click rate, Stripe purchases, impressions, search impression share, rank loss and spend separately. Do not infer sales from WhatsApp clicks.

Immediate rollback conditions are functional: wrong destination or prefill, duplicated click events, desktop visibility, horizontal overflow, obstruction of the hero CTA, or obstruction of final-page content. Commercial performance should be observed, not rolled back from a handful of clicks.
