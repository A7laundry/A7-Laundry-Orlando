# Wave 1 public funnel preview evidence — 2026-08-22

## Release truth

Protected preview only. No production alias, sitemap submission or IndexNow notification was changed.

- Deployment: `dpl_DAGiwdeWMt7T2vn7WYM5RFEcyZ4S`
- URL: `https://a7-laundry-orlando-izlivvj8c-dennis-a7s-projects.vercel.app`
- State: `READY`
- Build path: exact prebuilt `.vercel/output`, target `preview`

## Candidate pages

| Funnel | Path | SHA-256 |
|---|---|---|
| Pricing and service choice | `/plans` | `a6accbb46c3e84a9a6493c31cdd303945e7bb941c3e01ae21bbfccf602df2e67` |
| International Drive corridor | `/blog/laundry-international-drive-orlando` | `00ef427d1254fb3b8f624ce57dea581120952da078ed4d439ad8e921507e227e` |
| Orlando hotel pickup guide | `/blog/hotel-laundry-service-orlando` | `05dcf281163480614cadc09bc00f2861dd5c2b5c406778ead0211f9b875dee3a` |
| Before-checkout urgency | `/blog/laundry-before-checkout-orlando` | `d78b5c140b62ef12c3a2c0c88aca60e75eaf40daa1ac7d31d014ad5a1726e9ca` |
| Unified tracking | `/a7-tracking.js` | `af0bb70c4e044e25e62e6dcd9405c3c30f187bb53014d7f5eb67d20ffe4a23bf` |
| Sitemap | `/sitemap.xml` | `2a1e1cb3f386b6d7234f800be331d879b4e31670d002b49a7649152ba5af4b4f` |

Authenticated Vercel downloads returned HTTP 200 and matched every local prebuilt hash exactly.

## Public-preview browser smoke

All four paths were opened through the preview URL in Chrome.

- exact 390×844 viewport: `documentElement.scrollWidth === body.scrollWidth === innerWidth === 390` for every page;
- first meaningful WhatsApp CTA visible inside the first viewport: Plans ≈662px, I-Drive ≈789px, Hotel Guide ≈715px, Before Checkout ≈741px;
- canonical URLs point to their intended production paths, not the preview hostname;
- WhatsApp and SMS use the official `+1 407-670-8839`; no telephone link is present;
- Hotel Guide, I-Drive and Before Checkout each expose 8 visible FAQs and matching schema;
- scrolling each page to the bottom loaded every lazy image with zero broken images;
- direct HTTP/hash checks confirmed the Plans hero and official Stripe badge were present; their initial `naturalWidth=0` state was expected lazy loading, not a missing asset;
- no first-party page error was observed; Chrome-extension errors were excluded from the site verdict.

## Gates completed before preview

- root lint: PASS;
- root typecheck: PASS;
- root tests: PASS (`34/34` plus tracking/attribution/validation suites);
- public build and AI-search validation: PASS;
- MOS focused tests after registry update: PASS (`25/25`);
- full protected MOS tests/build: PASS (`37/37`);
- `git diff --check`: PASS.

## Gates still required

1. Owner visual approval of the exact public preview.
2. Independent SEO/brand/QA verdict for the four candidate pages.
3. Authenticated live-data smoke of the separate MOS preview.
4. Exact production promotions by the authorized release role, without rebuild.
5. Production hash, canonical, CTA, schema, image and live-GSC/GA4 smoke.
6. Rollback IDs and 24h/72h monitoring records.

## Plans hero typography amendment

Owner feedback identified the Georgia hero hook as too editorial. The bounded amendment changes only the `/plans` H1 to a heavy local/system sans display stack; section headings retain the established editorial serif. Copy, markup, canonical, funnel codes, CTAs, pricing, schema and tracking are unchanged by this amendment.

- Deployment: `dpl_DxfgcRbCLb7TYJnYAjiqQkXxzWBA`
- Preview: `https://a7-laundry-orlando-2f3njgt16-dennis-a7s-projects.vercel.app/plans`
- State: `READY`, target `preview`; production was not changed.
- Built and protected-preview `/plans` SHA-256: `89fcd22d4f889eea13426fd213c30bec5f6b8f8ccad1f77dc8fd08286052db55` (byte-identical).
- Chrome local render: 390×844 and 1440×900 passed with no horizontal overflow; computed H1 weight `800`; the primary CTA remains inside the first viewport at both sizes.
- Root lint, typecheck, tests (`34/34` plus `15/15` MOS), public build and `git diff --check`: PASS.

### Official A7 Laundry identity correction

The first typography preview still inherited `logo-a7-laundry.png`, a legacy A7 Lavanderia lockup. The current candidate replaces only the header and footer references with the official USA `A7 LAUNDRY-05.png` already present in the repository. Its SHA-256 is byte-identical to the owner-supplied Google Drive master.

- Superseding deployment: `dpl_CBqG5XWrN1CMV1R7KpY4vG4ygJbb`
- Preview: `https://a7-laundry-orlando-q7evvg7gn-dennis-a7s-projects.vercel.app/plans`
- State: `READY`, target `preview`; production was not changed.
- Built and protected-preview `/plans` SHA-256: `e9505b53523b0179e08d434c62885d0d77d0d353f2d2bd98a9294e47a5aa31c2`.
- Official logo source and protected-preview SHA-256: `f59d188ab833a76c0dfb193d29c4395337540be62cf9543252d947e62ce37b06`.
- Chrome 390×844 and 1440×900: the 2205×392 transparent master loads at the correct aspect ratio with no overflow or hero/CTA displacement.
- Root lint, typecheck, tests (`34/34` plus `15/15` MOS), public build and `git diff --check`: PASS.
