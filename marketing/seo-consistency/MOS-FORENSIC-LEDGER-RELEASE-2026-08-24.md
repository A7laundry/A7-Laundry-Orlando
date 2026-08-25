# MOS release — forensic ledger and attribution repair

**Release date:** 2026-08-24 (America/New_York)

## Delivered

- 15 append-only MOS audits compiled and validated.
- The Aug 1–24 GA4/GSC forensic checkpoint is preserved with attribution uncertainty.
- The Google Ads WhatsApp-to-secondary change is preserved as historical evidence with rollback.
- Current account truth supersedes that release: WhatsApp is primary as the mandatory funnel-entry proxy and Stripe is secondary financial evidence, recorded in a later append-only audit.
- The public attribution/canonical production release is preserved with exact deployment IDs and hashes.

## Deployment chain

- Protected Preview: `dpl_3hbMZkLrrP2BjN5BKAReriAVS4vs`, READY.
- Production promotion without source rebuild: `dpl_5kTgmvXEacvMcGcr5X2kGSqnhfWB`, READY.
- Production aliases: `https://mos.a7laundry.com`, `https://a7-laundry-mos.vercel.app`.
- Rollback: `dpl_FKnLn5W8vrLH9drFXk66jXRgoXGq`.

## Validation

- `npm --prefix mos-app test`: 62/62 tests PASS.
- Protected Preview and production both redirect anonymous ledger and API access to `/login`.
- `/login` returns HTTP 200 with private no-store cache controls, restrictive CSP, `X-Frame-Options: DENY` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- Production `/api/google-kpis` redirects unauthenticated requests to login.
- An authenticated dashboard smoke was not performed because the prior browser session had expired; credentials were not recovered, copied or bypassed. The deterministic bundle, authentication contract and anonymous boundary were verified.

This release does not claim that current Google/Meta data sources are live merely because the dashboard deployed. Each connector must continue to expose its own availability, period and freshness state after an authorized login.
