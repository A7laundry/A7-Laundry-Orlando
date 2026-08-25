# Release evidence — attribution and Lake Buena Vista canonical remediation

**Release date:** 2026-08-24 (America/New_York)
**Public site:** `https://a7laundry.com`
**Scope:** Stripe/GA4 attribution, one-use payment-link reference, Lake Buena Vista canonical redirect

## Exact deployment chain

- Failed standard CLI Preview: `dpl_3mLDJYx93RWQTb5SUNgpXKGFCvUt` — no artifact was published because `.vercelignore` excluded the build-time `marketing/growth/content-registry.mjs` dependency.
- Local Vercel build: target `preview`, `build:public` passed, output `.vercel/output`.
- Approved prebuilt Preview: `dpl_FxwDkGsbSMrVqLkm3z5uaF9GEBUD`, READY.
- Production promotion without rebuild: `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`, READY and aliased to `a7laundry.com` and `www.a7laundry.com`.
- Rollback deployment: `dpl_7KRoef7F2mV3P1WSRV2waxSV5j9t`.

## Artifact identity

| Artifact | Local / Preview / Production SHA-256 |
|---|---|
| `a7-tracking.js` | `4deb9f0816a64ab71d65f85a4cf8fcdd70a0b88cea1abd3f5b5e1d8c61f2f069` |
| `guest-payment-confirmation.html` | `6fee20cd0ad6cfa38f8271dbbb41a806043a19b6538f765a944a2916921f1e40` |
| `payment-link.html` | `05fc118a4080b0ac37e694f8c0e6d202759b19c7e684a5e9895523f682c55238` |

## Preview and public smoke

- `/blog/laundry-lake-buena-vista.html` returns HTTP 308 to `/blog/laundry-lake-buena-vista`.
- The clean Lake Buena Vista route returns the self-canonical and preserves `SEO-LBV-V2` conversion paths.
- `/guest-payment-confirmation` is `noindex,nofollow,noarchive`, self-canonical and fails closed without a secure Stripe session.
- `/a7-tracking.js` contains the confirmation-only `ignore_referrer: true` contract.
- `GET /api/stripe-session?session_id=invalid` returns sanitized HTTP 400 with `private, no-store`.
- `GET /api/create-payment-link` returns HTTP 405 and `Allow: POST`.
- No valid charge, payment link, customer data or Stripe secret was used during smoke.

## Quality gates

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS — 44 root TAP tests and 62 MOS tests, plus focused validators.
- `npm run build`: PASS.
- `vercel build`: PASS in public Preview context.
- `git diff --check`: PASS.

The existing content-registry warning for the two comforter canonicals remains open and unrelated to this release.

## Rollback

Reassign the production aliases to `dpl_7KRoef7F2mV3P1WSRV2waxSV5j9t`. This would restore the previous public files but would not revert the separately documented Google Ads conversion-action change. That external rollback is defined in `GOOGLE-ADS-CONVERSION-GOAL-CHANGE-2026-08-24.md`.
