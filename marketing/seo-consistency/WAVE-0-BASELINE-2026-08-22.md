# Wave 0 baseline — SEO, GEO, E-E-A-T and AI Search consistency

**Date:** 2026-08-22  
**Mode:** read-only inventory and adjudication baseline; no redirect, noindex, canonical change,
publication or Google Ads mutation.  
**Program:** `marketing/SEO-GEO-AI-SEARCH-CONSISTENCY-PLAN-2026-08-22.md`

## Executive verdict

The site has a validated three-page guest-laundry acquisition core surrounded by a much larger legacy
corpus. The next correct action is factual normalization and evidence collection, not more URL
creation.

- All 97 sitemap URLs resolve to a local source through their Vercel rewrite contract.
- Only three URLs carry dedicated static SEO funnel codes.
- Ninety-four sitemap URLs have a `lastmod` before August 2026; the three August updates are the
  money page, Lake Buena Vista and resort-area experiences.
- Forty-nine URLs receive no more than one internal link from another sitemap URL.
- One URL is currently orphaned in the sitemap link graph: `/blog/laundry-disney-springs-area`.
- Thirty resort-template URLs form the clearest consolidation-candidate cluster; every one receives
  only one internal link in the current graph.
- Current GA4, GSC and final-order evidence was not available through the protected owner boundary.
  This blocks destructive consolidation decisions but does not block factual repair and inventory.

The row-level export is `URL-INVENTORY-2026-08-22.tsv`. Its actions are provisional and must not be
treated as redirect instructions.

## Inventory method

The inventory parses the current `sitemap.xml`, resolves clean URLs through `vercel.json`, reads each
mapped source and records:

- URL, source file and sitemap `lastmod`;
- title, H1 and canonical;
- FAQ/Breadcrumb schema presence;
- internal incoming-link count within the sitemap graph;
- official WhatsApp, SMS and telephone route counts;
- static SEO funnel codes;
- automated flags for legacy terminology, `free` framing, no-minimum statements, absolute timing and
  remote UI dependencies.

Automated flags identify review candidates, not proven violations. For example, `free delivery` can
describe the same economics as included delivery but remains inconsistent with the current canonical
language; `remoteUi` can indicate Tailwind, Google Fonts or Material Symbols without proving a user
experience failure.

## Quantitative baseline

| Signal | Result | Interpretation |
|---|---:|---|
| Sitemap URLs | 97 | promoted public corpus |
| Locally resolved sources | 97 | rewrite/source mapping complete |
| Dedicated SEO funnel URLs | 3 | attribution depth is concentrated in the premium core |
| FAQPage schema | 92 | high coverage; parity/quality still require page-level validation |
| BreadcrumbList schema | 72 | 25 promoted URLs need applicability/review |
| Incoming links ≤1 | 49 | weak internal support or templated leaf behavior |
| Incoming links =0 | 1 | Disney Springs guide is orphaned |
| `Normal` terminology flag | 78 | widespread legacy naming |
| `free pickup/delivery` framing flag | 87 | widespread cross-source language drift |
| no-minimum flag | 5 | requires line-by-line service-scope adjudication |
| absolute Express flag | 1 | `/plans` is the confirmed P0 timing source risk |
| absolute Standard flag | 1 | `/plans` is the confirmed P0 timing source risk |
| remote UI dependency flag | 93 | legacy implementation is nearly site-wide |

## Corpus segmentation

| Segment | URLs | Weak incoming (≤1) | Initial handling |
|---|---:|---:|---|
| Core | 7 | 0 | keep validated core; refresh home/blog/plans |
| Primary service pages | 8 | 3 | separate service-scope review |
| Intent guides | 29 | 7 | refresh or merge only after GSC |
| Geo/local pages | 19 | 8 | preserve distinct local intent where evidenced |
| Service-content guides | 4 | 1 | inspect comforter duplication and B2B boundaries |
| Resort-template cluster | 30 | 30 | merge candidates; no action without current evidence |

## Current validated core

| URL | Owner intent | Funnel | State |
|---|---|---|---|
| `/laundry-pickup-delivery-orlando` | broad Orlando guest pickup/delivery | `SEO-ORLANDO-MONEY-V2` | KEEP_VALIDATED |
| `/blog/laundry-lake-buena-vista` | Lake Buena Vista hotel pickup | `SEO-LBV-*` | KEEP_VALIDATED |
| `/blog/laundry-near-universal-orlando` | resort guests preparing for tomorrow's plans | `SEO-ORLANDO-RESORT-V1` | KEEP_VALIDATED |

These pages own different intents and passed their individual release gates. They are not merge
candidates in Wave 0.

## P0 and P1 correction queue

### P0 — `/plans`

The source is linked from 68 sitemap URLs, making it the largest factual multiplier after the main
navigation pages. It is the only inventory item flagged for both absolute Express and absolute
Standard timing and it contains legacy `Normal`/`free` framing. It must be normalized before broad
content consolidation.

### P1 — International Drive

Keep corridor intent, but replace legacy title/meta/body/FAQ/schema language and avoid categorical
coverage. Add a funnel identifier only after tracking mapping and approval.

### P1 — hotel guide

Retarget to informational hotel-service evaluation. Remove categorical hotel pickup and unsupported
price-savings framing; transfer commercial intent to the Orlando money page.

### P1 — before checkout

Preserve checkout/flight/next-hotel deadline intent. Express remains conditional and must not collide
with the resort page's next-full-day positioning.

## Consolidation candidates requiring GSC

### Resort-template cluster — 30 URLs

All thirty pages have one incoming sitemap link and share a highly repetitive vacation-rental resort
pattern. They require a query/page, backlink and commercial-evidence review before choosing among
KEEP, MERGE or removal from the sitemap. No blanket redirect is authorized.

### Same-day/Express cluster

Review together:

- `/blog/same-day-laundry-orlando`
- `/blog/same-day-laundry-tourists-orlando`
- `/blog/same-day-drop-off-laundry-orlando`
- `/blog/express-laundry-orlando`
- `/blog/laundry-before-checkout-orlando`

Historical GSC already showed query splitting in this family. A fresh query/page export is required
before changing URLs.

### Hotel/guest cluster

Review together:

- money page;
- hotel guide;
- hotel-no-washer guide;
- family vacation page;
- Airbnb guest page;
- no-car guide;
- hotel-versus-pickup guide.

The money page remains the commercial owner. The others must prove a distinct informational job.

### Vacation-rental cluster

The guide currently receives 23 incoming links and should not be casually merged. Review it alongside
the guest, host, checklist, subscription and primary `/vacation` service pages to separate guest wash
and fold from B2B turnover/linen intent.

### Comforter cluster

Two near-service guides plus the `/comforter` money page require a separate-service audit. Guest wash
and fold rules must not be copied into item-priced comforter services.

## Internal-link findings

- The money page, `/plans`, `/service-areas` and the vacation-rental guide are strong internal hubs.
- Disney Springs is the only sitemap URL with zero incoming links after rewrite-aware normalization.
- Forty-eight additional pages have only one incoming link, dominated by the resort-template cluster.
- Link counts measure the repository graph, not PageRank, clicks or search value.

## Data boundary

The protected MOS redirected to owner login. No credential was read or submitted. GA4 property
`543807649`, GSC property `sc-domain:a7laundry.com`, WhatsApp conversations, Stripe customers and order
records were not inspected in this pass.

Current metrics remain `unavailable`, not zero. Historical repository evidence can guide which queries
to request but cannot prove the current landing/indexation state. The PII-safe boundary is recorded in
`DATA-ACCESS-BOUNDARY-2026-08-22.json`.

## Wave 0 exit status

| Requirement | Status | Evidence |
|---|---|---|
| 97-URL versioned inventory | PASS | `URL-INVENTORY-2026-08-22.tsv` |
| rewrite/source resolution | PASS | all 97 mapped locally |
| claim drift baseline | PASS | row flags plus P0/P1 adjudication |
| intent/cluster baseline | PASS | core, geo, guides, services and resort cluster segmented |
| current GA4/GSC export | UNAVAILABLE | protected owner login boundary |
| current order reconciliation | UNAVAILABLE | no operational/private records inspected |
| redirect/noindex authorization | BLOCKED BY EVIDENCE | intentionally not executed |
| next implementation target | READY FOR STORY | `/plans` |

## Next actions

1. Owner signs into the protected MOS or provides current PII-safe GSC/GA4 exports.
2. Authorized story owner creates the `/plans` normalization story with the canonical claim matrix and
   automated cross-source drift test.
3. While data access is pending, review the 30 resort candidates and P1 pages in read-only mode; do not
   change their indexation state.
4. After `/plans` passes preview/QA, update `llms.txt` and the highest-risk pages in separate releases.
