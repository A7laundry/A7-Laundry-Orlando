# Plans release evidence — 2026-08-22

## Decision and scope

- Owner approved the complete `/plans` normalization, typography and official-logo candidate.
- Independent QA: PASS after `.review-card strong{color:#fff}`.
- Runtime commit: `75b5d63` (`plans.html` only).
- The tracked official logo was reused unchanged: `A7 LAUNDRY-05.png`, SHA-256 `f59d188ab833a76c0dfb193d29c4395337540be62cf9543252d947e62ce37b06`.
- Google Ads was not changed.

## Gates

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 34 repository tests plus 15 MOS tests.
- `npm run build`: PASS.
- `git diff --check -- plans.html`: PASS.
- Responsive smoke at 390x844 and 1440x900: PASS, no horizontal overflow, official logo loaded, review text contrast preserved.

## Deployments

- Previous production / rollback: `dpl_98FASVxTNWedYknntjBgDte5N7mh`.
- Protected preview: `dpl_ATS8noHnPkQ2A9WvC9qzYxp9Ds9d`.
- Preview URL: `https://a7-laundry-orlando-20v4adzuz-dennis-a7s-projects.vercel.app`.
- Exact no-rebuild production promotion: `dpl_7KRoef7F2mV3P1WSRV2waxSV5j9t`.
- Production state: READY with `a7laundry.com` and `www.a7laundry.com` aliases.

## Byte identity and isolation

- `/plans` build = preview = production SHA-256: `4e62028d5f662643c702ac282179a56ce71778587be3440d179a48aae2ee70d4`.
- Orlando money page remained production-identical: `53b057e4176bb5b7e28049c8e2921377837ad1dbb3d68e087288f180e0392390`.
- Universal page remained production-identical: `c64bd5e7c856aae5801f988e95585406a295bc121c60602139724f2aa5499b06`.
- Sitemap remained production-identical: `f497e0597775855be939f7a00c397c6e785110c3a9a5b686a9c1edb51eee35b3`.

## Immediate public monitor

- `GET https://a7laundry.com/plans`: HTTP 200, `text/html`, 96,975 bytes.
- Canonical: `https://a7laundry.com/plans`.
- Structured data: five top-level entities; FAQPage contains six questions.
- Contact contract: 11 static WhatsApp references, two SMS links, zero `tel:` links, and 12 `SEO-ORLANDO-PLANS-V1` references.
- Brand contract: five official-logo references and zero legacy `logo-a7-laundry.png` references.
- Adjacent public bytes and sitemap match the approved preview.

## Rollback

If the public monitor detects a material regression, promote `dpl_98FASVxTNWedYknntjBgDte5N7mh` and repeat the HTTP, hash, canonical, contact, schema and responsive smokes.
