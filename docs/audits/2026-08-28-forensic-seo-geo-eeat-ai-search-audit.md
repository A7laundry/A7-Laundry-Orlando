# A7 Laundry Orlando — Forensic SEO, GEO, E-E-A-T & AI Search Audit

**Audit date:** 2026-08-28
**Domain:** `https://a7laundry.com`
**Market:** Orlando, Florida
**Business model verified on the website:** service-area business; no customer-facing walk-in storefront; booking/qualification through WhatsApp or SMS.
**Primary commercial offer:** guest wash and fold pickup and delivery, from $3.25/lb normal and $3.95/lb express when available, with a $50 minimum.

## Audit standard and evidence boundaries

This report cross-references:

- live Google Search Console data accessed through `a7laundry.usa@gmail.com` on 2026-08-28;
- live GA4 property `543807649` accessed on 2026-08-28;
- a live crawl of all 62 sitemap URLs;
- the repository's 97-URL inventory and 98-asset governed content catalog;
- source HTML, `robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD and Vercel routing;
- public organic results, competitor websites and public entity records;
- historical GSC/GA4 exports and existing attribution audits in this repository.

Evidence labels used throughout:

- **Confirmed:** directly observed in the website, code, GSC, GA4 or an authoritative source.
- **Strong evidence:** multiple consistent signals support the finding.
- **Probable:** the available evidence supports the explanation, but causality is not proven.
- **Hypothesis:** plausible and testable, but not established.
- **DATA REQUIRED / NOT VERIFIED:** the needed source was unavailable or incomplete.

The audit made no changes to the website, GA4, Search Console or Google Business Profile.

---

# A. Executive verdict

## Final verdict

The website has a good strategic core but is not yet an integrated acquisition-to-revenue engine. It has clear pricing, a differentiated tourist/guest proposition, a working WhatsApp conversion path, valid crawlability and early non-branded/AI visibility. The limiting factors are not a lack of pages. They are:

1. unreliable conversion and revenue attribution;
2. only 34 of 62 sitemap URLs indexed;
3. excessive supporting content relative to site authority and internal linking;
4. one unresolved canonical/cannibalization cluster;
5. weak third-party authority and inconsistent entity/address signals;
6. an online-first promise that still ends in a manual messaging handoff rather than a complete self-service order experience.

The recent decline in customers is **not supported as an organic-demand collapse**. In the GA4 last-seven-day comparison, Organic Search sessions increased 46.2%, Paid Search sessions fell 40%, and purchases fell 63.6%. In GSC, 17–23 August delivered the same 7 clicks as 10–16 August while impressions increased 60.3%. Organic visibility held or improved; paid volume, conversion quality, operations, measurement or normal short-term demand variance are stronger suspects.

## Scorecard

| Dimension | Score | Rationale |
|---|---:|---|
| **SEO Health** | **55/100** | Early non-brand visibility is real, but indexation, authority, architecture and measurement limit growth. |
| **Technical SEO** | **64/100** | All sitemap URLs return 200 with canonicals; HTTPS and enhancements are healthy. Canonical duplication and incomplete performance evidence remain. |
| **Local SEO** | **43/100** | Clear service-area model and local relevance, but GBP details are unverified, NAP/entity signals conflict and external citations are extremely weak. |
| **Content** | **56/100** | Useful intent coverage and transparent pricing, but the site expanded faster than Google indexed/trusted it; several pages are generic or repetitive. |
| **E-E-A-T** | **47/100** | Active legal entity, real reviews and clear pricing help; named expertise, original evidence, policies and third-party validation are insufficient. |
| **Entity SEO** | **48/100** | Brand, phone, offer and Orlando focus are understandable; address history, sparse `sameAs`, and mixed service naming weaken reconciliation. |
| **GEO/AEO** | **67/100** | Answer-ready pricing/process content, static HTML and early generative visibility are strengths; original evidence and citations are weak. |
| **AI Search Readiness** | **68/100** | 208 generative-search impressions prove retrieval. Indexation and authority constrain citation probability. |
| **Analytics** | **28/100** | `money_page_view` is a key event, Stripe receives revenue credit, GSC is unlinked, and durable order-level attribution is not proven. |
| **Conversion** | **52/100** | Clear price, trust and WhatsApp CTA; no complete self-service booking/order flow and no trustworthy channel-to-order reporting. |

## Decision

**Current architecture: NEEDS REVISION.**
Do not rebuild the visual site or publish more location templates. Consolidate and clarify the existing system first.

---

# B. Ten critical findings

| # | Problem | Evidence | Diagnosis / probable cause | SEO impact | Commercial impact | AI/GEO impact | Severity | Confidence | Effort | Priority | Recommended action | Validation KPI |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | GA4 reports page views as conversions | In the last 28 days, 399 key events equal exactly 249 `money_page_view` + 118 `whatsapp_click` + 32 `purchase`. Paid Search shows a 100% key-event session rate. | `money_page_view` was marked as a key event. | Corrupts SEO/channel quality evaluation. | Makes campaigns and landing pages appear to convert when they may not. | Prevents reliable prioritization of AI/organic traffic. | Critical | Confirmed | Low | **P0** | Remove `money_page_view` from key events. Separate macro conversion (`purchase`/qualified order) from micro conversions. | Paid/organic key-event rates normalize; macro conversion rate is independently reportable. |
| 2 | Revenue attribution breaks at Stripe | 90 days: Stripe referral confirmation generated $3,607.43 of $3,797.43 revenue; Google organic and paid landing rows show $0. Existing audit finds no proven durable click/ref/order/payment chain. | Cross-domain/session continuity and order-level attribution are incomplete. | Organic revenue cannot be measured. | Budget decisions are made without knowing which channel produced orders. | AI referrals can be observed but not valued. | Critical | Confirmed | Medium | **P0** | Implement server-side payment confirmation, Stripe cross-domain/referral handling and durable `a7_ref`/UTM/click-ID/order linkage. | ≥95% of purchases retain original source/medium and order/reference ID; Stripe no longer owns acquisition. |
| 3 | Indexation is only 54.8% for submitted pages | GSC sitemap: 34 indexed and 28 discovered-not-indexed out of 62; all 28 show no last crawl. | Site authority and internal discovery are insufficient for the current page volume; some pages are low-priority/near-duplicate. | Half the intended search surface cannot rank. | New service/location pages produce no demand. | Non-indexed pages cannot appear in Google's generative search features. | High | Confirmed | Medium | **P1** | Prioritize 10–15 commercial pages, strengthen hub/contextual links, improve unique proof, and remove/merge low-value supply before submitting more URLs. | Priority indexation ≥85%; crawled/indexed count increases without sitemap growth. |
| 4 | Internal authority is concentrated and many pages are weak | Repository graph: 58/97 total URLs and 23/62 sitemap URLs have ≤2 incoming internal links; one sitemap URL is orphaned (`/blog/laundry-disney-springs-area`). GSC sees only 67 internal links, all currently attributed to home and `/comforter`. | Templates and hubs do not distribute authority according to business value. | Slows crawling and weakens rankings. | High-value local/service pages remain invisible. | Reduces retrievability and context relationships. | High | Confirmed | Medium | **P1** | Build service, location and decision-guide hubs; link contextually from top pages; fix the orphan; enforce minimum inlinks for indexable pages. | Every indexable money/support page has ≥3 relevant inlinks; GSC internal-link coverage broadens. |
| 5 | Comforter cluster has a live canonical conflict | Both `/blog/comforter-cleaning-service-orlando` and `-v2` are in the sitemap and return 200. The old URL canonicals to `-v2`, but its Article `mainEntityOfPage` still identifies the old URL. The old URL has 106 impressions/2 clicks. | Migration was left in an adjudication state instead of completed. | Splits signals and wastes crawl attention. | Users and Google may land on the non-owner version. | Entity and document identity are contradictory. | High | Confirmed | Low | **P1** | Select one owner, 301 every alternate, remove alternates from sitemap, update internal links and JSON-LD. Preserve the URL with the strongest data unless content quality dictates otherwise. | Only one comforter guide appears in sitemap/GSC; alternates redirect in one hop. |
| 6 | Organic snippets attract mismatched intent | GSC shows impressions for laundry equipment/components/leasing, `laundromat near me` and `dry cleaners near me`, while A7 is pickup/delivery and dry cleaning is not verified. | Location pages use ambiguous laundry terminology and insufficient negative clarification. | Low CTR and diluted topical relevance. | Unqualified visitors cannot buy the actual service. | AI systems can misclassify A7 as a laundromat/equipment/dry-clean provider. | High | Strong evidence | Low | **P1** | Clarify “pickup & delivery—no self-service machines/no walk-in” in titles/intros where relevant; do not target dry cleaning unless verified. | Mismatch-query impressions fall; qualified pickup/delivery CTR and WhatsApp rate rise. |
| 7 | Local entity/address signals conflict | Core pages describe a service-area business with no street; several legacy pages and Nextdoor show 10097 Tuller Loop; official Sunbiz now shows 15048 Chapter Way. | Historical address data remains across first- and third-party sources. | Weakens local entity reconciliation and trust. | Customers may expect a storefront or use the wrong address. | Conflicting facts reduce citation confidence. | High | Confirmed | Medium | **P1** | Decide the canonical public SAB identity with the GBP owner. Do not expose a private/non-customer address. Remove stale on-site street addresses and correct legitimate citations. | Website, GBP and key citations agree on brand, phone, SAB status and permitted location representation. |
| 8 | Backlink authority is nearly absent | GSC reports 1 external link, from `mapquest.com`, pointing to the homepage. | Content production significantly outpaced earned authority. | Limits competitiveness and crawl priority. | A7 remains dependent on paid demand and low-volume long tails. | Third-party corroboration is too weak for consistent citations. | High | Confirmed | High | **P1** | Earn local/partner links from hotels, property managers, vacation-rental operators, chambers and Orlando publications. Avoid bulk directories. | Relevant referring domains grow from 1 to 10+; priority pages earn contextual links. |
| 9 | E-E-A-T proof is thin and some claims are unsupported | About page has no named operators/process credentials; only privacy policy exists; no terms/refund/service policy page found. Some articles contain unsourced numerical claims such as “top 5 complaints” or “40%”. | SEO-style content was published without a consistent evidence/editorial standard. | Weakens quality and trust signals. | Premium price faces avoidable trust objections. | Answer engines prefer attributable, specific and corroborated facts. | High | Confirmed | Medium | **P1** | Add named experience, real process photos, handling standards, service/rewash/cancellation terms and citations; remove or source unsupported statistics. | Higher qualified CTA rate; no unsupported numeric claims; stronger branded/entity results. |
| 10 | The online-first promise is incomplete | Website journey ends at WhatsApp/SMS; no customer account is required, but there is no verified self-service schedule/order/status flow. | The current operation is message-first, not end-to-end online ordering. | Indirect SEO effect through engagement/conversion. | Manual qualification creates delay, capacity limits and after-hours leakage. | Agentic/AI systems cannot complete a structured transaction. | High | Confirmed | High | **P1** | Describe the proposition truthfully as “message in minutes, we confirm pickup”; then introduce a lightweight structured order/availability form before full software. | Form/order completion rate, response time, qualified-lead rate and order rate improve. |

---

# C. What the strategy got right

Do not undo these strengths:

- **Clear primary offer:** guest wash and fold pickup/delivery is explicit.
- **Transparent terms:** $3.25/lb normal, $3.95/lb express, $50 minimum and confirmation conditions are clear.
- **Low account friction:** WhatsApp/SMS is easier for tourists than mandatory app signup.
- **Service-area honesty:** the About page clearly states there is no walk-in storefront.
- **Strong intent insight:** airport, same-day, I-Drive, hotels, vacation rentals and cost are supported by real GSC demand.
- **Technical baseline:** all 62 sitemap URLs return 200 and have canonical tags; HTTPS has no reported issue.
- **Governed quarantine:** 35 repetitive location/resort assets are already withheld for review instead of all being indexed.
- **Static, crawlable HTML:** main content is not dependent on client-side rendering.
- **AI-readable facts:** `llms.txt`, consistent business facts, service/pricing statements and structured content help non-Google systems. Google states that `llms.txt` itself neither helps nor harms Google rankings.
- **Real AI visibility:** GSC reports 208 impressions in generative Search experiences over three months.
- **Early non-brand acquisition:** the GSC brand filter containing “a7” returned 0 clicks and 1 impression; nearly all measurable search discovery is non-branded.

---

# D. Business and architecture reconstruction

## Current architecture and role

```text
/
├── /laundry-pickup-delivery-orlando     primary guest-laundry money page
├── /plans                               pricing/plans
├── /service-areas                       coverage hub
├── /about                               entity/process/trust
├── /privacy-policy                      legal/privacy
├── /vacation                            vacation-rental service
├── /comforter                           specialty money page
├── /carpet /area-rug /upholstery        specialty cleaning
├── /mattress /curtain /shoes            specialty cleaning
└── /blog                                guides and local pages
    ├── commercial-investigation guides
    ├── same-day/deadline guides
    ├── hotel/tourist/local guides
    ├── vacation-rental/host guides
    ├── comforter-care guides
    ├── geographic pages
    └── 35 quarantined resort/location templates
```

## Architecture verdict by section

| Section | Verdict | Reason |
|---|---|---|
| Homepage | **KEEP + CHANGE** | Keep proposition and pricing; strengthen service hierarchy and structured qualification. |
| Main guest-laundry page | **KEEP + EXPAND** | Primary money page; needs organic authority, FAQs based on real objections and direct order structure. |
| Pricing | **KEEP + CHANGE** | Useful decision page, but `/plans` naming and offer boundaries should be clearer. |
| About | **KEEP + EXPAND** | Good SAB explanation; add named experience and verifiable operating proof. |
| Service areas | **KEEP + EXPAND** | Correct hub concept; link only to justified, provable areas. |
| Specialty services | **KEEP selectively** | Preserve only verified services with distinct operations, pricing and demand. |
| Blog/local pages | **MERGE/UPDATE selectively** | Too many pages for current authority; use a smaller number of strong intent owners. |
| Resort templates | **KEEP NOINDEX/QUARANTINE** | Do not release without unique proof and demand. |
| Comforter guides | **MERGE + REDIRECT** | Two URLs compete/contradict canonical ownership. |
| Policies | **ADD** | Service terms, rewash guarantee, cancellation/no-show, special-care and refund handling are missing. |
| Booking/order | **ADD** | A digital-first business needs structured lead/order capture, even if fulfillment stays manual. |

## Recommended architecture

Avoid a disruptive mass URL migration now. First establish conceptual owners and redirect only confirmed duplicates.

```text
/
├── /laundry-pickup-delivery-orlando/       primary acquisition page
├── /services/
│   ├── /wash-and-fold/                      only if operationally distinct from main page
│   ├── /vacation-rental-laundry/
│   ├── /comforter-cleaning/
│   └── verified specialty services only
├── /service-areas/
│   ├── /orlando-tourist-corridor/
│   ├── /international-drive/
│   ├── /orlando-airport/
│   ├── /lake-buena-vista-disney-area/
│   └── other proven areas with unique operating detail
├── /pricing/
├── /how-it-works/
├── /order/                                  structured availability/order intake
├── /about/
├── /reviews/                                only real, attributable reviews
├── /policies/
│   ├── /service-terms/
│   ├── /cancellation-refund/
│   └── /privacy/
└── /resources/
    ├── /cost-and-options/
    ├── /tourist-laundry-guides/
    ├── /vacation-rental-linen-care/
    └── /garment-and-fabric-care/
```

This is a target information model, not authorization for immediate URL renaming. Preserve URLs with impressions/backlinks unless the redirect case is proven.

## Conceptual internal-link graph

```text
Homepage
├── Primary guest-laundry money page
│   ├── Pricing
│   ├── How it works
│   ├── Order/availability
│   └── Highest-value local pages
├── Service hub
│   └── Verified specialty service owners
├── Service-area hub
│   └── Evidence-rich area owners
└── Resource hubs
    ├── Decision guides → money page/pricing/order
    ├── Local guides → area owner/money page
    └── Care guides → relevant service owner
```

Rules:

- every indexable page should have at least three relevant internal inlinks;
- every support page should link to one primary money page and one next-step page;
- navigation links should not substitute for contextual links;
- a location page must not exist solely because a city name can be inserted;
- quarantined pages must not receive sitewide links or enter the sitemap.

---

# E. Search Console forensic findings

## Data availability

- Live property data starts on 2026-06-30; a true 16-month or YoY comparison is **DATA REQUIRED / not available for this property history**.
- Three-month live window observed: 2026-06-30 through 2026-08-26.
- Search Console has approximately a two-day reporting lag.

## Three-month performance

| Metric | Result |
|---|---:|
| Clicks | 63 |
| Impressions | 3,968 |
| CTR | 1.6% |
| Average position | 14.6 |
| Brand query filter containing `a7` | 0 clicks / 1 impression / position 5 |
| Generative Search impressions | 208 |

**Interpretation:** the site is acquiring incremental non-brand visibility. The problem is scale and click/conversion capture, not brand dependence.

## Week-over-week scene

Comparison: 17–23 August vs 10–16 August.

| Metric | Current | Previous | Change |
|---|---:|---:|---:|
| Clicks | 7 | 7 | 0% |
| Impressions | 691 | 431 | +60.3% |
| CTR | 1.0% | 1.6% | -0.6 pp |
| Average position | 11.5 | 12.0 | Improved 0.5 |

The week was not an organic visibility collapse. More impressions at similar clicks and slightly better position indicate broader exposure, with weaker click capture or less-aligned query expansion.

## Top pages, three months

| Page | Clicks | Impressions | CTR | Position | Decision |
|---|---:|---:|---:|---:|---|
| `/` | 46 | 2,019 | 2.3% | 20.4 | KEEP; investigate query mix because homepage dominates clicks but ranks broadly. |
| `/blog/how-to-clean-comforter` | 3 | 182 | 1.6% | 9.5 | UPDATE/EXPAND with cited experience and service bridge. |
| `/blog/same-day-laundry-tourists-orlando` | 2 | 235 | 0.9% | 8.8 | UPDATE snippet/intent; preserve URL. |
| `/blog/laundry-international-drive-orlando` | 2 | 183 | 1.1% | 7.2 | UPDATE to exclude equipment intent and strengthen hotel pickup proof. |
| `/blog/comforter-cleaning-service-orlando` | 2 | 106 | 1.9% | 7.8 | Resolve canonical owner before editing. |
| `/blog/laundry-service-orlando` | 1 | 306 | 0.3% | 7.5 | MERGE/REPOSITION as comparison/decision guide; avoid competing with money page. |
| `/blog/orlando-laundromat-vs-delivery` | 1 | 239 | 0.4% | 8.1 | UPDATE; strong comparison/AEO potential, low CTR. |
| `/blog/same-day-laundry-orlando` | 1 | 179 | 0.6% | 9.0 | MERGE or sharply distinguish from tourist same-day page. |
| `/blog/orlando-vacation-rental-laundry-guide` | 1 | 156 | 0.6% | 8.3 | KEEP/EXPAND with original host operations evidence. |
| `/blog/laundry-near-disney-world` | 1 | 65 | 1.5% | 9.2 | KEEP/UPDATE; add precise service proof and route details. |

## Query opportunities

| Query/topic | Clicks | Impressions | Position | Intent | Ideal owner | Opportunity |
|---|---:|---:|---:|---|---|---|
| `laundry near me` | 3 | 246 | 17.4 | Local transactional | Homepage/primary money page + GBP | High, but local-pack/authority dependent. |
| `orlando same day drop off laundry service` | 0 | 82 | 15.0 | Local transactional | Same-day owner | Clarify whether drop-off exists; do not claim it if SAB-only. |
| `orlando airport area laundry pickup and delivery` | 0 | 73 | 15.1 | Local transactional | Airport page | High; submitted for recrawl. |
| `orlando laundry service` | 0 | 56 | 16.6 | Transactional | Primary money page | High business value, competitive. |
| `orlando comforter laundry service` | 0 | 41 | 12.9 | Local transactional | `/comforter` | High; fix guide/service relationship. |
| `laundry service orlando` | 0 | 39 | 16.9 | Transactional | Primary money page | High. |
| `laundromat near me` | 0 | 35 | 5.0 | Walk-in/self-service | No valid owner | Mismatch; do not optimize toward an unavailable service. |
| `wash and fold orlando` | 0 | 33 | 19.7 | Transactional | Primary money page | High, but needs authority. |
| `orlando airbnb linen service` | 0 | 31 | 13.7 | B2B/host | Vacation-rental service | High if recurring linen work is operationally verified. |
| `hotel laundry orlando` | 0 | 21 | 10.6 | Commercial investigation | Hotel guide → money page | Strong quick win. |
| `lavanderia perto de mim` | 0 | 9 | 3.6 | Portuguese local transactional | Language-qualified money section/page | Validate demand and service language; improve multilingual ownership. |

## CTR diagnosis

CTR is not merely a title problem. Three mechanisms are visible:

1. rankings frequently sit below the top results;
2. SERPs contain local packs and established storefront brands;
3. pages are appearing for equipment, leasing, laundromat and dry-cleaning intents that do not match the offer.

Priority CTR work should start on pages already in positions 7–10 with qualified intent, after query mismatch and canonical ownership are corrected.

## Device and geography

| Segment | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| Mobile | 50 | 1,769 | 2.8% | 10.0 |
| Desktop | 13 | 2,163 | 0.6% | 18.2 |
| Tablet | 0 | 36 | 0% | 20.1 |
| United States | 52 | 3,601 | 1.4% | 14.9 |

Mobile is the commercial priority. Desktop receives more impressions but much weaker rank/CTR, likely reflecting broader research and mismatched queries.

## Indexation

GSC reports 38 known indexed pages and 35 known non-indexed pages overall. When filtered to the submitted 62-URL sitemap, 34 are indexed and 28 are discovered but not indexed.

The 28 sitemap URLs awaiting crawl/indexation are:

`/about`, `/area-rug`, `/blog`, `/blog/airbnb-host-laundry-tips-orlando`, `/blog/airbnb-laundry-service-orlando`, `/blog/family-vacation-laundry-orlando`, `/blog/hotel-vs-pickup-laundry-orlando`, `/blog/laundry-before-checkout-orlando`, `/blog/laundry-clermont-fl`, `/blog/laundry-convention-center-orlando`, `/blog/laundry-cost-orlando`, `/blog/laundry-kissimmee`, `/blog/laundry-near-seaworld-orlando`, `/blog/laundry-near-universal-orlando`, `/blog/laundry-orlando-airport`, `/blog/laundry-port-canaveral-cruise`, `/blog/laundry-windermere-fl`, `/blog/linen-towel-service-orlando`, `/blog/no-car-laundry-orlando`, `/blog/pack-less-orlando-trip-laundry`, `/blog/snowbird-laundry-orlando`, `/carpet`, `/curtain`, `/mattress`, `/privacy-policy`, `/shoes`, `/upholstery`, `/vacation`.

Ten priority URLs were already submitted through URL Inspection and accepted on 2026-08-28. Submission is a request, not a guarantee of indexation.

## Cannibalization

**Confirmed:**

- `/blog/comforter-cleaning-service-orlando` vs `-v2`.

**Strong evidence / must be adjudicated with query-level exports:**

- `/blog/same-day-laundry-orlando` vs `/blog/same-day-laundry-tourists-orlando`;
- `/blog/laundry-service-orlando` vs `/laundry-pickup-delivery-orlando` vs homepage for generic Orlando laundry intent;
- `/comforter` vs comforter service guides for transactional intent.

Do not merge the latter groups solely from titles. Export query-by-page overlap and preserve the distinct decision-guide intent where it exists.

---

# F. GA4 and analytics forensic findings

## Recent business signal

GA4 home snapshot, last seven days compared with the preceding seven days:

| Metric/channel | Result |
|---|---:|
| Active users | 76 (-31.5%) |
| Key events | 89 (-11%) |
| Purchases | 4 (-63.6%) |
| Paid Search sessions | 33 (-40%) |
| Direct sessions | 33 (+5.7%) |
| Organic Search sessions | 19 (+46.2%) |
| Unassigned sessions | 22 (+214.3%) |
| AI Assistant sessions | 2 |

This does not prove that the market was strong or weak. It proves that the observed customer decline happened while organic sessions increased. The immediate causal investigation should focus on paid delivery, lead quality, response/fulfillment, tracking breaks and normal weekly variance.

## 90-day acquisition

| Metric | Result |
|---|---:|
| Sessions | 686 |
| Engaged sessions | 448 |
| Engagement rate | 65.31% |
| Average engagement | 1:00 |
| Key events | 474 |
| Reported revenue | $3,797.43 |

Important landing/channel observations:

- Google organic → homepage: 55 sessions, 65.45% engagement, 23 key events, $0 attributed revenue.
- Google organic → money page: 10 sessions, 9 engaged, 20 key events, $0 revenue.
- ChatGPT/AI Assistant → homepage: 27 sessions, 74.07% engagement, 25 key events, $0 revenue.
- Stripe referral → confirmation: 47 sessions, 35 key events, $3,607.43 revenue.
- Google CPC → mobile money page: 185 sessions, 277 key events, 100% key-event session rate, $0 revenue.

The reported conversion rates are not usable until key-event configuration is corrected.

## Landing-page behavior

| Landing page | Sessions (90d) | Key observations |
|---|---:|---|
| `/` | 236 | Main organic/direct entry; 18.64% reported key-event rate; $0 attributed revenue. |
| Primary money page | 234 | Dominated by paid traffic; 98.72% key-event rate is artificial because page view is a key event. |
| Confirmation | 50 | Captures virtually all reported revenue after Stripe session/referral break. |
| `(not set)` | 35 | Measurement hygiene issue. |
| Lake Buena Vista variants | 25 combined | Canonical and `.html` rows plus long audit sessions indicate test/audit contamination. |

## Event audit

Last 28 days:

| Event | Count | Assessment |
|---|---:|---|
| `page_view` | 706 | Base event. |
| `money_page_view` | 249 | Useful diagnostic event; must not be a key event. |
| `whatsapp_click` | 118 | Valid micro conversion; distinguish qualified vs accidental clicks. |
| `purchase` | 32 | Macro conversion, but source continuity is broken. |
| `estimator` | 69 | Useful commercial engagement. |
| `pricing_cta` | 6 | Low-volume intent event. |
| `pickup_cta` | 5 | Low-volume intent event. |
| `call_click` | 2 | Micro conversion. |
| `sms_click` | 4 | Micro conversion. |

Not confirmed in the current event list: `begin_checkout`, structured booking started/completed, service-area check, qualified lead, order accepted, pickup completed, repeat order. These are **DATA REQUIRED / should be designed around the real operation**.

## Required measurement model

```text
Source/query/campaign
→ landing page
→ availability/order start
→ qualified lead
→ order accepted + order ID created
→ pickup completed
→ order weighed
→ invoice created
→ purchase confirmed server-side
→ delivery completed
→ repeat order
```

The two macro outcomes are deliberately separate: `order_accepted` is the operational acquisition conversion, while `purchase` is the financial revenue conversion. Stripe closes the financial chain; it does not originate attribution. The implementation contract is `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`.

Every step should carry:

- first-touch and last-touch source/medium/campaign;
- `gclid`/`gbraid`/`wbraid` where applicable;
- `a7_ref` and CTWA referral payload where applicable;
- anonymous/session ID before qualification;
- durable lead/order ID;
- Stripe session/payment intent ID;
- revenue and currency;
- customer type: guest, host, commercial, recurring.

## Analytics backlog, ordered

1. **P0:** unmark `money_page_view` as a key event.
2. **P0:** implement separate server-side macros for `order_accepted` (acquisition) and `purchase` (financial).
3. **P0:** preserve first-touch attribution through WhatsApp/order/payment.
4. **P1:** configure Stripe cross-domain/referral handling and test session continuity.
5. **P1:** link GA4 and Search Console; GA4 currently recommends the link and it is not active.
6. **P1:** filter internal/audit traffic.
7. **P1:** add structured lead/order lifecycle events.
8. **P2:** build landing-page → qualified order → revenue reporting by intent cluster.

## SEO-to-revenue model status

The exact model `Query → SERP → Landing Page → Session → Order → Revenue` **cannot currently be calculated reliably**.

- Organic conversion rate: **NOT RELIABLE** because page views are key events and purchase attribution breaks.
- Revenue per organic session: **NOT VERIFIED**; GA4 reports $0 but this is not proof of no organic revenue.
- Revenue per query cluster: **DATA REQUIRED** after GSC/GA4 linkage and durable order attribution.
- Incremental opportunity: directional only until 30 days of corrected data exist.

---

# G. Technical SEO forensic audit

## Crawlability and indexability

| Area | Evidence | Verdict |
|---|---|---|
| `robots.txt` | Allows public crawling, blocks operational/private routes, exposes sitemap. | Good. |
| AI crawlers | Explicitly allowed. | Fine for non-Google systems; not a ranking lever. |
| Sitemap | 62 URLs; all live-tested as 200 and canonicalized. | Good baseline. |
| Meta robots | 61/62 explicitly index/follow; homepage lacks a robots tag but remains indexable by default. | No critical issue. |
| HTTPS | GSC reports 0 non-HTTPS URLs in its sample. | Good. |
| Redirects | Three known redirects in coverage; `.html` normalization is inconsistent. | Needs cleanup. |
| 4xx/5xx in sitemap | None found. | Good. |
| Canonical mismatch | One sitemap URL canonicals to a different sitemap URL. | P1. |
| Quarantine | 35 repetitive/low-confidence pages withheld from index. | Correct strategic control. |

## Duplicate/URL normalization

- `/blog/laundry-lake-buena-vista.html` returns 308 to the clean URL.
- `/privacy-policy.html`, `/index.html`, and `/blog/comforter-cleaning-service-orlando.html` return 200 rather than redirecting.
- Canonical tags mitigate some duplication, but redirects should consistently collapse alternate paths.
- GA4 has recorded both clean and `.html` landing rows, proving that alternate URLs reached users/measurement.

## Structured data

Observed schema includes `LocalBusiness`/`LaundryService`, `Service`, `WebPage`, `Article`, `BreadcrumbList`, `FAQPage`, `Offer` and `AggregateRating` on selected pages.

Strengths:

- structured entity ID and consistent phone/service facts on core pages;
- breadcrumbs validate in GSC: 3 valid, 0 invalid;
- review snippets report 2 valid, 0 invalid;
- article dates and publisher are commonly present.

Problems:

- old comforter page `mainEntityOfPage` conflicts with its canonical;
- historical street address appears in some specialty/local schemas;
- `AggregateRating` is repeated across self-owned LocalBusiness pages. Google states that a LocalBusiness/Organization controlling reviews about itself is ineligible for the star review feature; semantic markup must be separated from rich-result expectations;
- an Organization author does not demonstrate who created or reviewed care advice;
- FAQ markup should be used only for visible, factual FAQs and not expected to generate a rich result for this business type.

## Core Web Vitals and page experience

- GSC reports insufficient field data for both mobile and desktop.
- PageSpeed Insights API returned a quota-exceeded response during this audit.
- Exact current LCP, INP, CLS and lab TTFB are therefore **DATA REQUIRED**.
- Static HTML, WebP assets and server-rendered content are positive structural signals.
- Third-party analytics/ads scripts and large hero media remain probable performance contributors, but no performance change should be approved without a measured Lighthouse/WebPageTest baseline.

Required test set:

1. homepage, mobile and desktop;
2. primary money page, mobile and desktop;
3. pricing;
4. top organic guide;
5. order/confirmation journey.

Acceptance targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile; lab tests should record TTFB and blocking time separately.

---

# H. On-page, intent and content forensics

## Strategic page roles

| Page/group | Primary intent | Funnel | Expected CTA | Decision |
|---|---|---|---|---|
| Homepage | Brand + broad local transactional | BOFU | Check availability/order | KEEP + clarify hierarchy. |
| Primary pickup/delivery page | Transactional | BOFU | WhatsApp/order | KEEP + build authority. |
| Pricing | Commercial investigation | MOFU/BOFU | Estimate/order | KEEP + rename conceptually to pricing. |
| Service areas | Local qualification | MOFU/BOFU | Confirm address | KEEP + strengthen proof. |
| About | Trust/entity | MOFU | Verify/process/contact | EXPAND. |
| Specialty pages | Distinct service transactional | BOFU | Photo/quote/order | KEEP only verified owners. |
| Cost/comparison guides | Commercial investigation | MOFU | Pricing/money page | KEEP/EXPAND. |
| Tourist/deadline guides | Situational local intent | MOFU/BOFU | Availability | KEEP, consolidate overlap. |
| Resort templates | Hyperlocal/B2B | MOFU/BOFU | Host quote | NOINDEX until unique proof. |
| Generic tips | Informational | TOFU | Relevant service/resource | UPDATE only when expert/original. |

## Content classification

The governed catalog contains 98 assets:

- 62 `index`;
- 35 `noindex_review`;
- 1 `adjudication_required` in the generated catalog; the validator reports two open adjudication conditions including the comforter owner conflict.

Recommended portfolio actions:

| Action | Scope |
|---|---|
| **KEEP** | Homepage, primary money page, pricing, service-area hub, About, proven specialty pages, high-impression decision guides. |
| **UPDATE** | Same-day tourist, I-Drive, laundromat-vs-delivery, cost, airport, hotel, vacation-rental guide, top comforter care content. |
| **MERGE** | Comforter duplicate; same-day overlap after query-by-page analysis; generic laundry guide vs money-page overlap where intent is not distinct. |
| **EXPAND** | About/entity proof, real process, service policies, price/turnaround FAQs, location logistics, original case evidence. |
| **REDIRECT** | Non-owner comforter variants and inconsistent `.html` alternates. |
| **DELETE/NOINDEX** | Keep the 35 repetitive resort/local templates quarantined unless each gains unique proof and actual demand. |
| **CREATE** | Structured order page, how-it-works owner, service terms, cancellation/refund policy, evidence-rich reviews/case studies. |

## Thin/generic content risk

Thirty-five resort/location assets follow a highly repetitive pattern and are correctly quarantined. Google's current guidance warns that generating many pages without additional value can violate scaled-content policies. The safe threshold is not word count. It is unique operational usefulness:

- real pickup handoff instructions;
- verified area availability;
- actual turnaround constraints;
- local proof/customer experience;
- route or scheduling implications;
- distinct questions;
- unique images or data.

If those elements cannot be supplied, one corridor hub is better than 20 city/resort variants.

## Originality and E-E-A-T issues

The strongest content is decision-oriented: cost, hotel-vs-pickup, same-day, booking process and local logistics. The weakest content reads like broadly generated SEO advice or asserts unattributed statistics.

Editorial rule:

- factual operational claims must be sourced to A7's current service facts;
- external statistics must cite a credible source;
- fabric/care advice should identify reviewer expertise and safety boundaries;
- case studies should use anonymized but real order facts: location type, load, timing, problem, handling and outcome;
- automation/AI-assisted drafting should receive a human fact review and a visible last-reviewed date where appropriate.

## Multilingual

- A Spanish page exists, but hreflang is not reciprocal from a clear English equivalent and no `x-default` was found.
- Claims about free coverage and response speed should be kept synchronized with canonical business facts.
- Portuguese query visibility exists, but a full Portuguese acquisition page should be created only if service and editorial support are operationally real.

---

# I. Local SEO, entity and authority

## Entity conclusion

Google can generally answer:

- **Who:** A7 Laundry Orlando;
- **What:** pickup, wash, dry, fold and delivery, primarily for guests;
- **Where:** Orlando tourist corridor/service area;
- **How to engage:** WhatsApp/SMS;
- **Price basis:** starting per-pound rates and minimum.

It cannot reconcile with equal confidence:

- the current canonical business/address representation;
- every specialty service relationship;
- the depth of real-world experience behind editorial advice;
- broad third-party authority.

## NAP and service-area business

Confirmed sources conflict:

- website core pages: no storefront; Orlando service-area identity; phone `+1 407-670-8839`;
- legacy on-site pages and Nextdoor: `10097 Tuller Loop, Winter Garden, FL 34787`;
- official Florida Sunbiz record: active corporation; principal/mailing address changed on 2026-04-30 to `15048 Chapter Way, Winter Garden, FL 34787`.

**NOT VERIFIED:** whether either street address is eligible or intended for public customer use. A corporate/principal address is not automatically a storefront. The GBP owner must confirm the profile's address visibility and service-area configuration before citation cleanup.

## Google Business Profile

Public site copy reports 5.0 from 23 Google reviews as last verified on 2026-07-16. The following remain **DATA REQUIRED / NOT VERIFIED** in this audit:

- exact primary and secondary GBP categories;
- current profile completeness, hours, holiday hours and service list;
- address hidden/shown state;
- review velocity, recency and response rate;
- photos, products/services, posts and Q&A;
- local-pack rank by searcher location;
- suspension/policy history.

Required GBP audit should use the owner dashboard and a geographically distributed local rank grid, not a single personalized search.

## Backlinks and citations

GSC currently reports:

- 1 external link;
- 1 linking domain: `mapquest.com`;
- homepage as the only externally linked page;
- anchor reported as “web”.

This is not competitive authority for a local premium service. Ahrefs/Semrush/Majestic data were unavailable, but the GSC evidence alone confirms a severe gap.

Priority link opportunities:

1. real hotel/front-desk and vacation-rental manager partner pages;
2. Orlando tourism/visitor resources where service inclusion is editorially legitimate;
3. chambers and local business associations actually joined;
4. property-management vendor directories;
5. complementary cleaning/concierge businesses;
6. original local data stories, such as turnaround/cost comparisons based on A7's anonymized operations.

Avoid bulk directory blasts, paid link packages, fabricated partner pages and fake neighborhood offices.

## E-E-A-T verdict

| Dimension | Current evidence | Gap |
|---|---|---|
| Experience | Real offer/process language, reviews, service-area operation. | Named operators, real facility/process images, cases and order evidence. |
| Expertise | Some fabric/comforter and logistics content. | Reviewer credentials/experience, sources, handling standards and claim QA. |
| Authoritativeness | Active Florida corporation and Google reviews. | Relevant backlinks, local mentions, partnerships and editorial citations. |
| Trust | Prices, minimum, phone, privacy, service confirmation and rewash guarantee. | Terms, cancellation/refund, damage/special-care handling, current review source and entity consistency. |

---

# J. Competitor SEO gap matrix

The comparison uses organic competitors that appear for commercial Orlando laundry queries, not only operator-defined rivals.

| Competitor | Strength | Weakness | Keyword/content advantage | Authority/local advantage | Conversion advantage | A7 opportunity |
|---|---|---|---|---|---|---|
| The Laundry Room | Deep residential/local service architecture; explicit delivery terms. | More utilitarian messaging. | Pickup/delivery, residential, hotel and location coverage. | Physical locations, strong local entity, reviews and operating proof. | Online account/booking, clear $2.25/lb, $45 minimum, next-day, text updates. | Own tourist urgency, multilingual and WhatsApp ease; match proof and booking clarity. |
| WashFold Orlando | Strong online service explanation, FAQ, pricing/add-ons and recurring plans. | Less distinctive tourist positioning. | Wash/fold, subscription, FAQ and modifiers. | Clear operational/business identity. | Zip check and online booking. | Build a structured availability/order step without forcing an app. |
| BayHill Cleaners | Established local trust and broader garment-care positioning. | Dry-clean focus may not match guest wash/fold urgency. | Dry cleaning and local service breadth. | Real location/entity recognition. | App/online flow. | Do not compete on dry cleaning; focus pickup wash/fold and tourist logistics. |
| College Park Laundry | Storefront proof, price list and testimonials. | Geographic/storefront model differs from A7. | Laundromat/wash-and-fold local terms. | Address, neighborhood relevance and customer proof. | Booking plus walk-in alternatives. | Explicitly position as no-car/no-walk-in pickup alternative. |
| Eola Laundry | Clear pickup/delivery process and local identity. | Less developed tourist information architecture. | Local pickup/delivery. | In-house/no-gig-worker trust claims and text updates. | Simple scheduling and clear turnaround. | Publish verifiable handling/process proof and response standards. |

Competitor pages reviewed:

- `https://orlandolaundryroom.com/laundry-delivery/`
- `https://orlandolaundryroom.com/residential-service/pickup-and-delivery/`
- `https://www.washfoldorlando.com/services/wash-fold`
- `https://www.washfoldorlando.com/faq`

The largest competitive disadvantage is not content breadth. It is local proof, external authority and a structured order experience.

---

# K. GEO, AEO and AI Search

## What is already working

- 208 Google generative-search impressions in three months;
- 116 of those impressions occurred in the last 28 days;
- homepage accounts for 96 impressions;
- comparison and situational guides are also retrieved: laundromat-vs-delivery 21, same-day tourist 19, I-Drive 17, generic Orlando service guide 14, comforter service 9;
- static crawlable HTML, direct answers, transparent pricing and process steps are retrieval-friendly;
- GA4 also identifies 27 ChatGPT/AI Assistant sessions to the homepage over 90 days with 74.07% engagement.

## What limits citation probability

1. 28 priority sitemap pages are not indexed;
2. only one external link is recognized by GSC;
3. address/entity facts conflict;
4. much content summarizes generic knowledge rather than presenting original evidence;
5. author/reviewer expertise is usually only “A7 Laundry” Organization;
6. policies and operational edge cases are incomplete;
7. duplicate/canonical owners create contradictory document identities;
8. no structured transaction endpoint exists for agentic completion.

## Answer-engine readiness by question

| Question | Current answerability | Best owner | Required improvement |
|---|---|---|---|
| How does pickup/delivery work? | Strong | About/money page | One canonical how-it-works section/page and order states. |
| How much does laundry cost in Orlando? | Strong | Pricing + cost guide | Add dated comparison methodology and avoid unsourced competitor claims. |
| How long does wash and fold take? | Strong | Money page | Preserve “about/when available” qualifiers everywhere. |
| What areas are served? | Medium | Service-area hub | Add verified ZIP/area qualification and local operating proof. |
| Can I schedule online? | Medium/ambiguous | Order page | Explain WhatsApp confirmation vs true online scheduling. |
| What happens after scheduling? | Medium | How it works | Define confirmation, pickup, status, payment and return. |
| Is recurring pickup available? | NOT VERIFIED | Vacation-rental/commercial owner | Confirm operation before publishing. |
| How should fabrics/stains be handled? | Medium | Care-resource hub | Add named expert review, sources and safety boundaries. |

Google's current guidance says AI Search uses the same core SEO/quality foundations, does not require special AI schema, and values unique non-commodity content. `llms.txt` can help other systems but is ignored by Google Search as a visibility signal.

## Original-data program

The strongest GEO asset A7 can create is not another generic article. It is a small, privacy-safe operational evidence base:

- median pickup-to-return time by service tier;
- common hotel/Airbnb handoff patterns;
- anonymized load-size and price examples;
- real special-care acceptance/rejection examples;
- Orlando visitor laundry cost comparison with dated methodology;
- case studies for family, hotel guest and vacation-rental host.

These facts support SEO, AI citations, trust and conversion simultaneously.

---

# L. Content gap and topical authority

## Create/expand opportunities

| Topic | Intent | Target page | Funnel | Search opportunity | AI value | Commercial value | Priority |
|---|---|---|---|---|---|---|---|
| How ordering works | Commercial investigation | `/how-it-works/` | MOFU/BOFU | Medium | High | High | P1 |
| Structured availability/order | Transactional | `/order/` | BOFU | Direct conversion | High for agents | Very High | P1 |
| Service/cancellation/rewash terms | Trust | `/policies/service-terms/` | BOFU | Low direct | High factual trust | High | P1 |
| Orlando airport pickup | Local transactional | Existing airport URL | BOFU | 73 impressions, pos. 15.1 | High | High | P1 |
| Hotel laundry | Commercial investigation | Existing hotel guide | MOFU/BOFU | Pos. 10.6 | High | High | P1 |
| Orlando laundry pricing | Commercial investigation | Existing pricing/cost owners | MOFU/BOFU | Active GSC demand | Very High | High | P1 |
| Laundromat vs pickup | Comparison | Existing guide | MOFU | 239 impressions, pos. 8.1 | Very High | Medium/High | P1 |
| Same-day/needed-by | Situational transactional | Consolidated existing owner | BOFU | 414 combined page impressions | High | High | P1 |
| Vacation-rental case studies | B2B investigation | Vacation-rental hub | MOFU/BOFU | Existing impressions | Very High | High | P2 |
| Portuguese service qualification | Local transactional | Existing language owner or section | BOFU | Query pos. 3.6, low volume | Medium | Medium | P2 |
| Fabric/comforter evidence | Informational/service | Care hub + `/comforter` | TOFU/MOFU | Top non-home clicks | High | Medium | P2 |

## Do not create yet

- more resort pages;
- fake neighborhood offices;
- dry-cleaning pages unless service is verified;
- “near me” pages;
- separate pages for every keyword variant;
- generic listicles without original experience;
- commercial laundry clusters until real commercial offer, capacity, pricing and fulfillment are documented.

## Topical cluster model

| Cluster | Owner | Supporting content | Business role |
|---|---|---|---|
| Guest pickup & delivery | Primary money page | hotel, no-car, WhatsApp booking, before-checkout | Core acquisition. |
| Pricing and decisions | Pricing/cost owner | hotel-vs-pickup, laundromat-vs-delivery, estimator | Commercial investigation. |
| Deadline/same-day | One consolidated owner | express, checkout/flight scenarios | Urgent acquisition. |
| Orlando locations | Service-area hub | airport, I-Drive, Disney/LBV, SeaWorld, Universal | Local qualification. |
| Vacation-rental laundry | Vacation service owner | host tips, linen frequency, real cases | B2B/recurring. |
| Garment/specialty care | Individual verified service owners | evidence-backed care guides | Expertise + service conversion. |

---

# M. Technical backlog for developers

| Issue | URL/template | Technical fix | Priority | QA method |
|---|---|---|---|---|
| False key event | GA4 configuration | Unmark `money_page_view`; preserve as normal event. | P0 | Realtime/DebugView and 24h standard report. |
| Broken order attribution | Tracking + Stripe + WhatsApp/order store | Persist source IDs through server-confirmed purchase. | P0 | End-to-end test from tagged landing to order/payment/revenue. |
| Stripe self-referral | GA4/Stripe | Configure cross-domain/referral exclusion only after durable attribution design. | P0 | Original source remains on purchase; no duplicate sessions. |
| Comforter canonical conflict | Two guide URLs + sitemap + JSON-LD | Select owner, 301 alternate, update `mainEntityOfPage`, links and sitemap. | P1 | Curl, crawler, Rich Results Test, GSC inspection. |
| Inconsistent `.html` responses | Vercel routes | 308/301 all public `.html` variants to clean canonical, including `/index.html` and privacy. | P1 | Route matrix returns one-hop redirect; GA4 stops receiving alternate landing paths. |
| GSC/GA4 unlinked | GA4 product links | Link domain property to GA4. | P1 | Search Console reports appear in GA4 after processing. |
| Audit traffic contamination | GA4/data collection | Define internal traffic and testing conventions. | P1 | Audit sessions excluded from production views/explorations. |
| Weak internal graph | Templates/hubs | Add contextual related-owner links and enforce minimum inlinks. | P1 | Repository graph + GSC internal links. |
| NAP schema drift | Legacy service/blog templates | Remove stale street data; use canonical SAB representation approved by owner. | P1 | Structured-data crawl and citation checklist. |
| Hreflang asymmetry | Spanish/English owners | Add reciprocal `en-US`, `es-US` and `x-default` only for true equivalents. | P2 | Hreflang validator/crawl. |
| Unsupported review rich-result expectation | LocalBusiness templates | Keep visible real proof; remove/adjust self-serving AggregateRating where it adds no semantic value. | P2 | Rich Results Test and schema review. |
| Performance baseline absent | Priority templates | Run Lighthouse/WebPageTest and archive mobile/desktop results. | P2 | LCP/INP/CLS/TTFB baseline and regression budget. |

---

# N. SEO/content backlog

| Action | Owner | Priority | KPI |
|---|---|---|---|
| Resolve canonical intent owners before publishing more pages | SEO + developer | P1 | Zero duplicate owners in sitemap/catalog. |
| Refresh top position-7–10 pages using actual query intent | SEO/content | P1 | CTR and qualified clicks increase over 28 days. |
| Build internal links from home/top guides to priority unindexed pages | SEO/content | P1 | Priority indexation and GSC internal-link coverage. |
| Correct equipment/leasing/laundromat/dry-clean mismatch | SEO/content | P1 | Reduced mismatched impressions; higher qualified CTR. |
| Add real service policies and operating proof | Operations/content/legal review | P1 | Improved CTA rate and trust completeness. |
| Audit every unsupported statistic | Editor | P1 | 100% sourced, qualified or removed. |
| Establish one canonical entity facts file and publishing guard | SEO/dev/owner | P1 | Zero on-site NAP/price contradictions. |
| Keep 35 resort pages quarantined | SEO/owner | P1 | No index bloat; only evidence-rich releases. |
| Improve airport, hotel and cost owners after indexation | Content | P1 | Positions move into top 10 and earn qualified clicks. |
| Publish 3 real anonymized case studies | Operations/content | P2 | Engagement, assisted CTAs, AI impressions and links. |
| Earn 10 relevant local/partner referring domains | Partnerships/PR | P1/P2 | Referring domains and local-pack/organic visibility. |
| Complete GBP owner audit and review-response process | Local SEO/owner | P1 | Profile completeness, fresh reviews, response rate. |

---

# O. 30 / 60 / 90-day plan

## Days 1–30 — make decisions trustworthy

1. Correct GA4 key events and define macro/micro conversions.
2. Complete durable website/WhatsApp/order/Stripe attribution.
3. Link GA4 and GSC; exclude test traffic.
4. Resolve comforter canonical ownership and `.html` normalization.
5. Select the 10–15 priority URLs; strengthen internal links and inspect indexation weekly.
6. Freeze new location/resort page production.
7. Reconcile public SAB/NAP facts with GBP owner input.
8. Add service, cancellation/refund and rewash policy owners.
9. Rewrite mismatched page titles/intros only where query evidence supports it.
10. Establish CWV baselines for the five commercial templates.

## Days 31–60 — improve qualified acquisition and trust

1. Refresh airport, hotel, cost, I-Drive, same-day and laundromat-vs-delivery owners.
2. Consolidate same-day/generic service overlap after query-by-page export.
3. Add a structured availability/order intake with durable lead ID.
4. Expand About with named experience, process standards and real imagery.
5. Add reciprocal multilingual ownership where content is truly equivalent.
6. Complete GBP category/service/hour/photo/review audit.
7. Publish one operational case study per primary audience.
8. Begin partner outreach to property managers, hotels and visitor resources.

## Days 61–90 — build authority and compound learning

1. Earn the first 10 relevant referring domains.
2. Publish original Orlando laundry cost/logistics evidence.
3. Optimize pages using 30–60 days of corrected macro-conversion data.
4. Measure qualified order and revenue by landing page/intent cluster.
5. Review generative Search pages and AI-assistant referrals for assisted conversions.
6. Release a quarantined location page only if it has real demand, service proof and unique value.
7. Iterate local-pack/GBP work using an Orlando-area rank grid.

---

# P. Revenue-priority matrix

| Initiative | SEO impact | Revenue impact | Effort | Confidence | Priority |
|---|---|---|---|---|---|
| Correct key events and macro-conversion definition | Medium | Very High | Low | Confirmed | **P0** |
| Durable source → order → payment attribution | Medium | Very High | Medium | Confirmed | **P0** |
| Structured availability/order intake | Medium | Very High | Medium/High | Strong evidence | **P1** |
| Index and internally support priority commercial URLs | High | High | Medium | Confirmed | **P1** |
| Resolve comforter/canonical and intent overlap | High | Medium/High | Low/Medium | Confirmed | **P1** |
| Fix GBP/entity/NAP consistency | High | High | Medium | Confirmed | **P1** |
| Earn relevant local/partner backlinks | Very High | High | High | Confirmed gap | **P1** |
| Refresh position-7–15 commercial pages | High | High | Medium | Strong evidence | **P1** |
| Publish policies and real operational proof | Medium | High | Medium | Strong evidence | **P1** |
| Original-data/case-study program | High | Medium/High | Medium | Probable | **P2** |
| Release additional resort pages | Low/negative now | Low | Medium | Strong evidence | **Do not prioritize** |

---

# Q. Explicit answers to the 15 required questions

## 1. Is the current architecture correct?

**Partly. It needs revision, not a critical rebuild.** The main money/pricing/area/about structure is sound. Content volume, ownership and the missing order/policy layers are not.

## 2. Is there cannibalization?

**Yes, one case is confirmed:** the two comforter service guides. Same-day, generic Orlando service and service-vs-guide overlaps have strong evidence but require query-by-page adjudication before merging.

## 3. Are local pages being created correctly?

**The best ones are directionally correct; the program as a whole expanded too far.** Thirty-five repetitive local/resort assets are rightly quarantined. Do not release them without unique operational proof.

## 4. Does Google understand exactly which services are offered?

**It understands the primary pickup/wash/fold/delivery offer, but not perfectly.** Impressions for laundromat, equipment/leasing and dry-cleaner queries prove service ambiguity. Specialty-service consistency also needs review.

## 5. Does Google understand where the business operates?

**It understands Orlando and the tourist corridor broadly, but local entity precision is weak.** Address history and SAB representation conflict.

## 6. Is the entity sufficiently clear?

**No.** Core facts are good, but sparse third-party corroboration, inconsistent addresses, limited `sameAs` and mixed legacy templates prevent strong entity confidence.

## 7. Is E-E-A-T competitive?

**Not yet.** Real reviews, prices and an active corporation help, but competitors have stronger locations, operations proof, links and ordering systems.

## 8. Does content demonstrate real experience or look generic?

**Both.** Process/pricing/local-decision pages feel operational. Several care/resort articles use generic templates or unsupported claims and can look SEO-generated.

## 9. Is the strategy compatible with AI Search?

**Yes, but incomplete.** GSC already reports 208 generative impressions. Indexation, original evidence, authority and entity consistency are the limiting factors.

## 10. Are there pages that answer engines can cite?

**Yes.** Homepage, laundromat-vs-delivery, same-day tourist, I-Drive, pricing/cost and comforter content already receive generative impressions. Their trust and originality should be strengthened.

## 11. Does Search Console show unexploited opportunities?

**Yes.** Airport pickup, hotel laundry, Orlando laundry, comforter, wash-and-fold, Airbnb linen and Portuguese local intent are visible in positions roughly 10–20 or better.

## 12. Is GA4 tracking the customer journey correctly?

**No.** `money_page_view` is a key event, conversion rates are inflated, GSC is unlinked, test traffic exists and order lifecycle events are incomplete.

## 13. Is attribution being lost through external booking/payment systems?

**Yes, confirmed at payment.** Stripe referral receives about 95% of reported 90-day revenue, while acquisition channels receive $0 revenue attribution.

## 14. Is organic traffic generating orders or only visits?

**Unknown with the current measurement.** Organic and AI traffic are engaged and trigger CTAs, but the purchase chain loses original attribution. It is wrong to conclude either “organic sells” or “organic does not sell” from current GA4 revenue rows.

## 15. Which five actions are most likely to produce commercial impact?

1. Correct GA4 conversions and implement durable source-to-order-to-payment attribution.
2. Add a structured availability/order intake while preserving WhatsApp convenience.
3. Concentrate internal authority/indexation on the 10–15 highest-value pages.
4. Resolve canonical/intent duplication and mismatched laundry terminology.
5. Strengthen GBP/entity consistency, real reviews/operational proof and locally relevant backlinks.

---

# R. Core 15 operationalization

The concentration phase is now operationalized in two companion artifacts:

- `marketing/seo-consistency/SEO-CORE-15-CONTROL-SHEET-2026-08-28.tsv` — editable weekly control sheet with URL role, intent, indexation, GSC/GA4 baseline, internal links, recommended title/H1, content action, schema, CTA, KPI, governance and status.
- `marketing/seo-consistency/SEO-CORE-15-OPERATIONAL-PLAN-2026-08-28.md` — page-by-page implementation plan, governance gates, internal-link map, measurement definitions and first 14-day execution sequence.

The Core 15 does not override the existing content registry or quarantine. It defines where authority and editorial effort should be concentrated while the broader portfolio remains governed.

---

# S. Data still required

| Data | Why needed |
|---|---|
| GBP owner export/screenshots | Categories, address visibility, hours, services, reviews, posts, Q&A and policy compliance. |
| Local rank grid | True map-pack visibility by searcher location. |
| 16-month/YoY GSC history | Property data observed only from 2026-06-30. |
| Query-by-page GSC export | Confirm same-day/generic-service cannibalization. |
| Corrected GA4 data for 30+ days | Conversion rate, organic revenue and landing-page profitability. |
| Order/Stripe/WhatsApp joined ledger | Source-to-order-to-revenue truth. |
| Ahrefs/Semrush/Majestic export | Broader link quality, lost links and competitor gap; GSC already confirms only one recognized external link. |
| Actual operating capacity and response SLA | Validate express, same-day and after-hours promises. |
| Verified service/service-area matrix | Prevent false specialty/location claims. |
| Lighthouse/WebPageTest runs | Current LCP, INP, CLS, TTFB and script/image diagnostics. |

---

# T. Sources

## Internal evidence

- `sitemap.xml`, `robots.txt`, `llms.txt`, `vercel.json`
- `marketing/seo-consistency/URL-INVENTORY-2026-08-22.tsv`
- `marketing/seo-consistency/SEO-GEO-AI-SEARCH-CONSISTENCY-PLAN-2026-08-22.md`
- `mos-app/generated/content-catalog.json`
- `indexation-quarantine.json`
- `marketing/google-ads/2026-07-guest-laundry-search/ATTRIBUTION-CHAIN-AUDIT-2026-08-18.md`
- `marketing/SITE-CRO-AUDIT.md`
- `marketing/SEO-KEYWORD-GAPS.md`
- live GSC and GA4 authenticated observations dated 2026-08-28

## External/authoritative evidence

- Google Search Central, review snippet guidelines: `https://developers.google.com/search/docs/appearance/structured-data/review-snippet`
- Google Search Central, generative AI optimization: `https://developers.google.com/search/docs/fundamentals/ai-optimization-guide`
- Google Search Central, AI-generated content guidance: `https://developers.google.com/search/docs/fundamentals/using-gen-ai-content`
- Google Search Central, helpful content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google Analytics account/property linking guidance: `https://support.google.com/analytics/answer/9679158`
- Florida Division of Corporations record: `https://search.sunbiz.org/Inquiry/corporationsearch/SearchResultDetail?aggregateId=domp-p25000028648-2b9e2313-4bc8-419f-bd6e-67ee0de1e062&directionType=Initial&inquirytype=EntityName&listNameOrder=A7FL+P140000474320&searchNameOrder=A7LAUNDRYORLANDO+P250000286480&searchTerm=A7FL+INC`
- Nextdoor public listing: `https://nextdoor.com/pages/a7-laundry-carpet-cleaning-winter-garden-fl/`
- The Laundry Room: `https://orlandolaundryroom.com/laundry-delivery/`
- WashFold Orlando: `https://www.washfoldorlando.com/services/wash-fold`

## Final success criterion

The next phase should not be judged by page count or rankings alone. It should be judged by:

**Qualified non-branded demand → verified lead/order → fulfilled order → attributed revenue → repeat customer.**
