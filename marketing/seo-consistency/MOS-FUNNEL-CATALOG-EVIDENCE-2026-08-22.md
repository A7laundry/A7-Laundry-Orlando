# MOS live funnel catalog evidence — 2026-08-22

## Status

Local candidate complete. It is not production until the protected MOS preview, owner approval and exact-promotion gates are recorded.

## Why this exists

The MOS already exposes live GA4 and Search Console aggregates and a broad acquisition graph. This change adds an explicit operating registry for each managed funnel so growth decisions can be made from the page, intent and observed demand together.

## Registered funnels

| Funnel | Release truth | Canonical path | Attribution codes |
|---|---|---|---|
| Broad Orlando guest pickup | Active production | `/laundry-pickup-delivery-orlando` | `SEO-ORLANDO-MONEY-V2` |
| Lake Buena Vista hotel pickup | Active production | `/blog/laundry-lake-buena-vista` | LBV funnel codes |
| Orlando resort next-day plans | Active production | `/blog/laundry-near-universal-orlando` | `SEO-ORLANDO-RESORT-V1` |
| International Drive corridor | Source candidate | `/blog/laundry-international-drive-orlando` | `SEO-IDRIVE-V1` |
| Service/pricing plans | Source candidate | `/plans` | `SEO-ORLANDO-PLANS-V1` |
| Orlando hotel pickup guide | Source candidate | `/blog/hotel-laundry-service-orlando` | `SEO-HOTEL-GUIDE-V1` |
| Before-checkout urgency | Source candidate | `/blog/laundry-before-checkout-orlando` | `SEO-BEFORE-CHECKOUT-V1` |

Candidate and legacy states are visible. The UI must never present them as active production funnels.

## Live data contract

- Search Console rows are joined by exact canonical URL.
- GA4 landing-page, interaction and journey rows are joined by canonical path.
- Observed campaign/source rows remain evidence of traffic relationships; they do not replace native Google Ads account status.
- A missing row returns `null`/unavailable rather than fabricated zero.
- Search Console top queries are displayed inside the corresponding funnel card.
- Cross-platform users, contacts and purchases are not presented as deduplicated.
- Funnel catalog response schema is `1.4`.

## Owner-authenticated production baseline

Read-only browser verification of `https://mos.a7laundry.com/` on 2026-08-22 observed:

- GA4 API live for `2026-07-21–2026-08-19`;
- Search Console API live for `2026-07-21–2026-08-19`;
- Search Console totals of 35 clicks, approximately 1,960 impressions, 1.8% CTR and average position 13.7;
- page rows for the Orlando money page, Lake Buena Vista, International Drive and plans;
- Google Ads native API unavailable, while GA4 shows a partial Google Ads acquisition relationship.

The current production MOS does not yet contain `funnels`; that distinction was verified before this local candidate was declared complete. The registry was subsequently updated to represent the normalized before-checkout source candidate, so the first preview below is superseded and must not be promoted.

## Implementation

- `mos-app/google-kpis-contract.js`: canonical registry, larger bounded row limits and `buildFunnelCatalog` joins.
- `mos-app/api/google-kpis.js`: schema `1.4`, live catalog response and fail-closed fallback with null metrics.
- `a7-command-center.html`: compact funnel cards with intent, audience, action, release state, codes, live queries, campaigns and source limitations.
- `mos-app/tests/google-kpis.test.mjs`: registry/live join/null-semantics contract.
- `mos-app/tests/dashboard.test.mjs`: rendering, escaping and live metric coverage.

## Local gates

- Targeted MOS tests: PASS (`17/17`).
- Full MOS tests: PASS (`37/37`).
- Protected MOS bundle: PASS.
- Root repository lint, typecheck, tests, public build and diff check: PASS.
- Desktop local-fixture render at 1440×900: PASS.
- Exact CDP mobile viewport at 390×844: `innerWidth`, `clientWidth`, document `scrollWidth` and body `scrollWidth` are all 390px.
- The mobile funnel section occupies x=16–374px, uses a compact two-column summary and keeps the first funnel card inside the viewport.
- The inspection exposed and closed two inherited MOS issues before preview: main-content min-width overflow and the mobile navigation control covering section headings while scrolling.
- `vercel build --yes`: PASS, target `preview`, prebuilt output at `mos-app/.vercel/output`.

## Candidate hashes

| Artifact | SHA-256 |
|---|---|
| Protected dashboard HTML | `cc84944700c1b255ca2d5a92f4962a4475d626ffb7350ed0c732b719af21379e` |
| Google KPI API entry | `81fc4bfa300e7e98a483a28e79a33d3a8f8d821e61d81b12a28b7459aadfa8f4` |
| Funnel/Google KPI contract | `cd30a0427b40374e1d7a97ff925b304ffb6f7b2e612fb8e436efb113de51a69d` |
| Native Google Ads contract | `b49d5596abe9bd88eac6bd0a003c50d60997d74858e67fe34ad3ad6e4ae01479` |
| Meta read-only contract | `57bc8cfd9b8653eb9c10ef87ea6274488dbb8354969bfce8fe279616a81ecbb6` |

These hashes identify the current prebuilt preview candidate. The dashboard and API entry hashes remain unchanged because the registry update lives in the server-side Google KPI contract; that contract hash changed and was redeployed.

## Protected preview

- Superseded deployment: `dpl_6ZxNfVNGZfdKeKd7nHuMcurnA5q6` (`https://a7-laundry-1cxe8oup6-dennis-a7s-projects.vercel.app`). It predates the normalized before-checkout registry entry and must not be promoted.
- Current deployment: `dpl_6pyLGxNwdP9tXu4pQ2FiwvQ1ZW1N`.
- Current URL: `https://a7-laundry-k73x2ircj-dennis-a7s-projects.vercel.app`.
- Vercel state: `READY`; deployed from `.vercel/output` with the prebuilt output contract.
- Root request after Vercel protection bypass returns the MOS application redirect to `/login`; the dashboard remains inaccessible without an application session.
- `/api/google-kpis` returns HTTP `302` to `/login?returnTo=%2Fapi%2Fgoogle-kpis` without an application session and does not expose aggregate marketing data anonymously.
- Preview `login.html` is byte-identical to the prebuilt file: SHA-256 `25efe07b736159dbe4d4fd5e1da4daa1f3f899f815cc829e940e6f47fd39862c`.
- Authenticated GA4/GSC catalog verification remains a release gate; it cannot be replaced by the local visual fixture or by the currently deployed production MOS.

## Release gates still required

1. Independent QA of the protected MOS candidate.
2. Protected preview with authenticated API and visual smoke.
3. Owner approval of the exact preview.
4. Exact promotion without rebuild.
5. Production smoke confirming GA4/GSC freshness, seven registered funnels and null semantics.
6. Record hashes, rollback deployment and 24h/72h monitoring.
