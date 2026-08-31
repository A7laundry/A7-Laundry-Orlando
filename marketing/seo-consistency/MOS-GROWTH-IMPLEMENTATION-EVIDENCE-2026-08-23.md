# MOS Growth Governance — Implementation Evidence — 2026-08-23

## Scope and safety

- The governed site candidate and protected MOS were published only as Vercel Preview deployments. No production alias, commit, push, Google Ads mutation or Meta mutation occurred in this evidence run.
- Existing dirty-worktree changes were preserved.
- Native Google Ads remains read-only and `unavailable` until the server identity, manager relationship and developer-token preflight succeed.

## Governed corpus

| Layer | Observed count | Meaning |
|---|---:|---|
| Deployable HTML | 101 | 98 marketing assets + 3 explicit transactional/system exclusions |
| Governed marketing registry | 98 | Includes the discovered Davenport source candidate |
| Explicit system exclusions | 3 | Payment tool and confirmation routes; exact path/file/reason, no wildcard |
| Vercel rewrites | 100 | 97 marketing non-root routes + 3 system routes; `/` is implicit |
| Source sitemap | 97 | Authorial sitemap; not equivalent to deployed indexable scope |
| Built sitemap | 62 | Final indexable build after 35 quarantined routes |
| Observed public sitemap | 62 | Live `a7laundry.com/sitemap.xml`, reconciled read-only on 2026-08-23 |

`node scripts/growth-content.mjs reconcile --dist dist` returned zero critical drift and one governed canonical adjudication warning (Comforter v1/v2).

## Single-source outputs

- `governance/content-registry.mjs` is the authorial classification source.
- `mos-app/generated/content-catalog.json` is the deterministic authenticated catalog.
- `mos-app/generated/a7-growth-map.js` is the deterministic browser tracking map.
- `dist/.well-known/a7-growth-manifest.json` is build-only public evidence (`artifactState: built`); it contains 98 assets and no deployment observation.
- `mos-app/generated/release-ledger.json` contains one valid, append-only `preview_verified` observation. No historical release was invented.

## Release truth and regression protection

- Raw/manual release objects cannot activate a funnel.
- Exact preview evidence must precede an `active_production` record.
- Preview and production must match manifest hash, registry hash, build revision, full route digest and full sitemap counts.
- Ledger records are closed-schema, append-only, hash-chained and written with exclusive creation.
- Validated ledgers are deeply immutable; verified states must agree with route, manifest, sitemap and count evidence.
- Preview approval requires QA evidence; active production requires DevOps/owner release evidence and a verifiable build revision.
- Rollback appends a new observation, must restore a different artifact that was previously active and derives the replaced production record as `rolled_back`; it never deletes history.
- The full target observer checks every registered asset plus the complete sitemap. A one-route mismatch makes the artifact ineligible.
- The exact local candidate observation passed 98/98 routes and 62/62 sitemap URLs with zero failures. This is build evidence, not a deployment observation.

## Remote preview evidence

- Public site Preview: deployment `dpl_GBb7aLC2yq71r1xs6MENtXU48e7X`, protected URL `https://a7-laundry-orlando-jjcave88z-dennis-a7s-projects.vercel.app`.
- The remote full-registry observer passed 98/98 governed assets and 62/62 sitemap URLs with zero HTTP, canonical, robots or hash failures.
- Exact public artifact identity: schema `2.0.0`, build revision `rev_1acc745752b7f23c59ebbb833c52acef79d80b05f04b366689cbbca8c3b5615f`, manifest SHA-256 `f6431b1588df7120e995db114c46f5945132af03b07625acd409a50dee5ecb1a` and sitemap SHA-256 `2a1e1cb3f386b6d7234f800be331d879b4e31670d002b49a7649152ba5af4b4f`.
- QA-approved observation `obs-20260823T210210701Z-5fafa7505eaa` was appended as `preview_verified`; the compiled ledger contains one record and preserves its hash chain.
- Protected MOS Preview: deployment `dpl_8hcoiAwCYyMmpdKexG8CczkCd2BQ`, protected URL `https://a7-laundry-hzue43u0c-dennis-a7s-projects.vercel.app`.
- MOS unauthenticated access redirects to `/login`; temporary Preview-only credentials authenticate successfully; authenticated dashboard and governed artifacts return HTTP 200.
- Authenticated Preview returns catalog schema `2.0.0`, 98 governed assets, 13 clusters, 3 explicit exclusions and the single append-only preview observation.
- Exactly ten approved variables are available to Preview. The four MOS authentication values are separate Preview-only sensitive records; the six Google configuration values reuse the approved configuration. Google Ads and Meta credentials remain Production-only and unavailable in Preview.
- GA4/GSC fail closed in Preview because the existing Google IAM binding intentionally accepts only Vercel subject `owner:dennis-a7s-projects:project:a7-laundry-mos:environment:production` (documented in A7-003). The Preview subject is not trusted. This is a production-only federation boundary, not missing MOS configuration; it must not be widened silently for QA.

## Tracking and measurement joins

- All 98 marketing assets receive compiled `asset_id`, `funnel_stage_v2`, legacy stage, `cluster_id`, content role, persona, geography and exact-path match method.
- GA4 and GSC funnel joins use exact normalized canonical paths and preserve unavailable/not-returned states.
- Native Google Ads uses allowlisted A7 ad final URLs. An ad maps only when its entire unique destination set resolves to exactly one governed canonical; mixed, foreign, multi-asset and unknown destinations are not assigned cost.
- GA4 key events are not summed across landing-page and content-page report grains; landing attribution is preferred with a content fallback only when the landing row is absent.
- Fresh full-registry `production_drift` and `unavailable` observations override healthy seven-funnel spot checks, so drift in any of the other 91 governed assets cannot remain hidden behind a green managed-funnel probe.
- Contact click, qualified lead, paid order, revenue and margin remain separate. No ROAS is manufactured from contact events.

## Live read-only checkpoint

Authenticated MOS observation on 2026-08-23, displaying the API period **2026-07-22 through 2026-08-20**:

- GSC: 34 clicks, 1.94k impressions, CTR 1.8%, average position 13.1.
- GA4: 382 active users, 480 sessions, 66.7% engagement rate. Purchase/revenue values remain analytics observations and are not treated as reconciled financial truth.
- Native Google Ads: not connected / unavailable; no current account status, spend or funnel cost was inferred from the GA4 link or old snapshot.
- Comforter v1 (`/blog/comforter-cleaning-service-orlando`): 59 impressions, 1 click, CTR 1.7%, average position 8.1; 2 organic sessions and 0 key events displayed.
- Comforter v2 was not returned in the visible current MOS data. Absence is `not_returned`, never numeric zero.

Decision: preserve both Comforter files/routes and keep canonical adjudication open. Do not redirect, delete, noindex or remove either URL from governance until exact-URL GSC windows plus URL Inspection are captured and owner-approved.

## Automated gates

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS — 43 root TAP tests, all repository validators and the complete protected MOS suite.
- `npm --prefix mos-app test`: PASS — 62/62 tests plus protected MOS build.
- `npm run build:public`: PASS.
- `npm run validate:structure`: PASS.
- `npm run validate:agents`: PASS with 121 pre-existing dependency warnings and zero errors.
- `git diff --check`: PASS.

## Remaining release gates

1. Owner approval and exact no-rebuild production promotion by `@devops`; the already verified artifact must not be rebuilt.
2. Immediate authenticated production smoke must confirm the production-only Google federation restores GA4/GSC live data while Google Ads remains truthfully unavailable.
3. Full production observation chained to `obs-20260823T210210701Z-5fafa7505eaa`; only then can MOS display `active_production`.
4. Remove the four temporary Preview-only MOS credential records, remove Preview scope from the six temporarily expanded Google configuration records and delete the protected MOS Preview after production evidence is recorded.
5. Google Ads native preflight/configuration remains a separate server-side credential/permission gate; failure stays `unavailable`.
