# MOS release — WhatsApp-first correction

**Release date:** 2026-08-24 (America/New_York)
**Purpose:** publish the append-only correction that supersedes the temporary Stripe-primary acquisition model.

## Delivered

- 16 immutable MOS audits compiled and validated.
- Latest ledger tip: `2026-08-24-google-ads-whatsapp-first-correction`.
- The prior purchase-led action remains visible as historical evidence; the new audit is authoritative for current Google Ads goal state.
- The Claude 30-day audit is adjudicated item by item without turning small-sample recommendations into account mutations.

## Deployment chain

- Protected Preview: `dpl_HbzBqyGTUfZz42Tv5XssD2KWAZ9V`, READY.
- Preview URL: `https://a7-laundry-j5o91qm7r-dennis-a7s-projects.vercel.app`.
- Production promotion without rebuild: `dpl_35XV8TDcfi46KokAdDtAkwQtDgj8`, READY.
- Production aliases: `https://mos.a7laundry.com`, `https://a7-laundry-mos.vercel.app`.
- Rollback: `dpl_5kTgmvXEacvMcGcr5X2kGSqnhfWB`.

## Artifact identity

| Artifact | SHA-256 |
| --- | --- |
| `dist/audit-registry.js` | `f014f74ed3d01778c53294a024c1ed0de266cd3501dd3c08f33f390047d500dc` |
| prebuilt `audit-registry.js` | `f014f74ed3d01778c53294a024c1ed0de266cd3501dd3c08f33f390047d500dc` |
| correction audit JSON | `f65222660aba27a40972076d248802fedddc9d41bb9fd762eed108f8232952f4` |
| prebuilt correction audit JSON | `f65222660aba27a40972076d248802fedddc9d41bb9fd762eed108f8232952f4` |

The deployed Preview used the exact prebuilt output above. Production was created by promoting that Preview rather than rebuilding source.

## Validation

- Root lint, typecheck, 44 TAP tests, 62 MOS tests and repository build passed.
- `node scripts/mos-audits.mjs validate` confirmed 16 chained audits.
- Preview `/login` returned HTTP 200 through the authenticated Vercel inspection path.
- Preview ledger returned HTTP 302 to `/login` for an unauthenticated app request.
- Production `/login` returned HTTP 200 with private no-store, CSP, `X-Frame-Options: DENY` and noindex headers.
- Production `/audit-registry.js` and `/api/google-kpis` returned HTTP 302 to `/login` without a MOS session.
- An authenticated dashboard data smoke was not performed because no active MOS session was available; no credential was recovered, copied or bypassed.

## External account state

- WhatsApp is primary and Stripe purchase is secondary in Google Ads, each verified after reload.
- No campaign, budget, tCPA, keyword, RSA, negative, schedule, geography, billing, balance or delivery setting changed in this correction.
