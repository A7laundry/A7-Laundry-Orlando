# Story A7-003 — Conversion Observability

**Status:** In Progress
**Created:** 2026-07-17
**Source:** Delivery continuation requested by project owner
**Related release boundary:** The completed organic-integrity increment was split to `A7-005 — Organic Integrity Block` for independent review and release.

## Goal

Make the production conversion funnel observable from acquisition CTA through Stripe checkout and confirmed comforter purchase.

## Acceptance Criteria

- [x] Every production HTML page loads the unified tracking script.
- [x] WhatsApp, phone and pickup CTAs retain enriched GA4 and Meta events.
- [x] Stripe links emit GA4 `begin_checkout` and Meta `InitiateCheckout`.
- [x] Comforter confirmation emits GA4 and Meta purchase events once per browser session.
- [x] Comforter pages do not double-initialize the Meta Pixel or double-fire `ViewContent`.
- [x] Automated build gates protect tracking coverage and identifiers.
- [x] Production build and post-deploy checks pass.
- [x] MOS exposes acquisition, SEO, content, paid media and revenue KPIs with source, period and data-status metadata.
- [x] Unknown financial values are shown as unavailable, never inferred as zero.
- [x] KPI snapshot has a CLI validation gate and remains excluded from the public production bundle with the internal Command Center.
- [x] MOS can be built as a separate online application without exposing it through the public acquisition site.
- [x] MOS login is validated server-side using an allowlisted email and PBKDF2 password hash.
- [x] Authenticated access uses a signed, HttpOnly, Secure, SameSite session cookie with expiry and logout.
- [x] Dashboard HTML and KPI data assets are both inaccessible without a valid session.
- [x] Authentication and online MOS build have automated validation.
- [x] Meta Ads KPIs reflect the active A7 Laundry USA account, with an explicit reporting window and refresh timestamp.
- [x] MOS distinguishes source snapshots from live integrations and does not mix unrelated historical ad accounts into the operating scorecard.
- [x] Active campaign creatives are visible with delivery status, creative identity and ad-level performance.
- [x] MOS provides operational filters for channel, health and creative focus without implying unavailable reporting windows.
- [x] A decision header and visible thresholds identify good, attention, critical, unavailable and context-only metrics at a glance.
- [x] KPI, SEO and creative views react consistently to filters and provide a clear empty state.
- [x] Meta verification records currency, account timezone, attribution, link metrics and active-versus-paused reconciliation.
- [x] Period filter uses only verified Meta windows and updates paid-media KPIs, health and decision status without implying unavailable ad-level splits.
- [x] GA4 snapshot separates partially reliable traffic metrics from unreliable lead, checkout, purchase, revenue and paid-attribution metrics.
- [x] MOS exposes GA4 acquisition mix and instrumentation findings without summing duplicate event names as unique conversions.
- [x] GSC reconciliation corrects unsupported content-growth claims and records exact performance, query, page, indexation, device and quality snapshots.
- [x] SEO view distinguishes verified core metrics from anonymized query counts, small-base growth and unavailable field CWV data.
- [x] GSC XLSX exports are archived with immutable hashes, explicit export limitations and a truthful workbook-inspection boundary.
- [x] The protected MOS operating experience defaults to Brazilian Portuguese, including login, filters, decisions, KPI explanations and locale-aware formatting.
- [x] MOS exposes prioritized action plans for paid media, analytics, SEO and revenue, with owners, deadlines and success criteria.
- [x] A decision-grade creative test sprint preserves current winners, uses current pricing and prepares new challengers without publishing or increasing spend.
- [x] Optimization priorities distinguish Meta conversations from owner-confirmed sales and focus the next paid cycle on guest wash-and-fold by the pound.
- [x] A manual guest-laundry campaign launches at the authorized US$30/day cap without Advantage+ audience or duplicate active budget.
- [x] Owner-reported guest-laundry orders, revenue, repeat purchase and invalid-lead patterns are visible without presenting them as Stripe- or ad-level-verified.
- [x] Tourist minimum order is reconciled to the official US$50 source of truth across current campaign documentation and MOS.
- [x] Meta organic performance and Planner capacity are reconciled from archived exports and read-only calendar evidence without treating duplicate downloads or visual Planner data as separate exports.
- [x] MOS exposes Facebook and Instagram organic KPIs, the Pacific reporting timezone, calendar saturation, future free dates and retention gaps.
- [x] A read-only Meta Ad Library scan identifies active Orlando laundry concepts, records public longevity/repetition signals and separates evidence from inferred performance.
- [x] MOS records the read-only Google Ads audit for account `290-113-2891` as a separate BRL snapshot, without mixing it into Meta Ads or owner-reported revenue.
- [x] Google Ads KPIs distinguish call conversions from qualified leads and sales, expose the exhausted-funds delivery block, and keep revenue/ROAS unavailable.
- [x] MOS provides a dedicated Google Ads filter, campaign table, measurement findings and prioritized remediation actions in Portuguese.
- [x] A generic guest-laundry payment confirmation page restores the visitor to the emotional Orlando vacation context without using third-party park brands or unsupported promises.
- [x] The guest confirmation page never claims payment success or emits purchase events until a Stripe Checkout Session is verified server-side as paid.
- [x] The verified page displays only sanitized order data, removes the Checkout Session ID from the visible URL and offers a direct WhatsApp pickup handoff.
- [x] Phase 0 establishes one customer-facing message around hotel, resort and Airbnb guest laundry, with A7 Laundry Orlando as the public brand.
- [x] Normal and Express pricing use the US$50 minimum consistently; Express is always subject to availability.
- [x] Unsupported public response, ranking and hosting-testimonial claims are removed and protected by production build gates.
- [x] The comforter paid-media library is quarantined because it has zero confirmed sales and contains stale prices in image pixels.
- [x] WhatsApp templates use current pricing, qualify the guest location and avoid promising an unverified pickup slot.
- [x] Session-level UTM, Google Ads and Meta click attribution persists across pages and enriches lead events with a stable reference.
- [x] Phase 1 provides a Guest Laundry Search package for account `290-113-2891` that is build-ready but explicitly blocked from activation.
- [x] The first Google Search cycle uses only exact/phrase high-intent guest terms, four paused RSAs, shared negatives and a controlled R$70/day seven-day envelope.
- [x] PMax, Display, Search Partners, broad match, call-only optimization and comforter are excluded from the Phase 1 test.
- [x] The Google Ads landing page uses the canonical guest message, US$50 minimum, included pickup/delivery and non-guaranteed Express availability.
- [x] Attributed WhatsApp links receive a compact `A7 Ref`, while the measurement plan states that it does not replace the full click identifier required for offline import.
- [x] MOS exposes the Phase 1 campaign, proposed budget, asset counts and activation NO-GO without mixing BRL spend and USD revenue.
- [x] Google Search preflight is repeatable from the CLI, uses a Final URL suffix without replacing the landing destination, prevents duplicate inline contact events and documents the paused-build activation sequence.
- [x] Public business facts are consistent across visible pages, structured data and `llms.txt`, with unsupported or stale promises excluded.
- [x] OpenAI SearchBot and standard search crawlers can access the public site, while a controlled IndexNow workflow can notify supported search engines after verified releases.
- [x] Near-duplicate local/resort pages are excluded from production indexation until each page has distinct local evidence and useful first-hand content.
- [x] A public About/operations page explains the service-area model, official offer, coverage, contact path and fact-verification date without implying a walk-in storefront.
- [ ] The Google Ads Guest Laundry campaign contains the four approved intent groups, exact/phrase inventory, shared negatives, paused RSAs and WhatsApp-entry-led measurement before activation.
- [x] The verified Stripe confirmation emits the native Google Ads purchase action with dynamic value, currency and transaction ID only after server-side paid-session verification.
- [x] The proven guest-laundry campaign is reinforced by a new English 4:5 feed carousel that explains the hotel/Airbnb pickup flow, uses official pricing and ends in a WhatsApp CTA.
- [x] MOS reads GA4 and Search Console through protected server-side APIs while preserving the dated KPI snapshot only as explicit historical context, never as a current fallback.
- [x] Every live KPI exposes source, requested period, freshness and availability status; API or schema failures never become numeric zero.
- [x] Google credentials remain server-side, read-only and absent from the browser bundle, repository and public acquisition deployment.
- [x] Contract, fallback and freshness tests block deployment when a required KPI disappears, changes type or loses provenance metadata.
- [x] MOS models the live acquisition journey as connected entities: channel/campaign/ad → landing page or article → GA4 event/contact, without presenting cross-platform counts as deduplicated users.
- [x] GA4 live data exposes source/medium, campaign, landing page, content page and event performance for the requested period, with independent partial-failure states.
- [x] Search Console queries and pages connect to the same canonical site paths used by GA4 so organic demand can be inspected per landing page or article.
- [x] Google Ads is represented as native live, linked-GA4 partial live or unavailable according to the actual credential path; a linked-GA4 view is never labeled as the native Google Ads API.
- [x] Meta Ads campaign, ad set, ad, creative and insight entities are read through a server-side read-only credential before being labeled live.
- [x] Every funnel entity exposes source, requested period, fetched-at time and connection status; unavailable data remains null and never becomes zero.
- [x] The marketing graph is queryable through the protected server contract before it is rendered in the MOS UI, and no dashboard action can change campaigns, budgets or ads.
- [x] MOS ranks observed `/blog/` articles by GA4 views and lets the operator reorder them by entrances, key events or Search Console clicks.
- [x] Article ranking reconciles GA4 content, landing-page and page-event rows with Search Console pages through the canonical URL, without presenting cross-source counts as deduplicated users.
- [x] A separate GA4 intraday view reports article activity for the current America/New_York calendar day and labels it as processing data rather than a final report.
- [x] MOS renders the complete observable network funnel as discovery → content → entry → intent → conversation → sale → retention, with source and attribution boundaries visible at every stage.
- [x] Funnel stages with no article-level or cross-platform attribution remain explicitly partial or unavailable instead of inheriting aggregate conversions.
- [x] Meta campaign artifacts fail closed unless the official WhatsApp destination is `+1 407-670-8839`; the Meta test number is forbidden outside its explicit account-level blocklist declaration and audit evidence.
- [x] The MOS raises a critical live guardrail when an active Meta ad set exposes a WhatsApp destination other than the official number, without treating an unavailable destination field as verified.
- [x] Paid creative promotion requires an explicit placement-preview attestation; 4:5 carousel assets with critical copy outside the verified safe area remain organic-only or quarantined.
- [x] The fresh official-number Guest Laundry path contains a controlled four-ad matrix with two Portuguese and two English creatives, no related-media mixing and no automated creative transformations.
- [x] Native Google Ads measurement covers attributed WhatsApp opens and website-originated calls lasting at least 60 seconds without changing Stripe tracking.
- [x] Phone-button and pickup-CTA clicks remain diagnostic events and are not mislabeled as qualified calls or confirmed bookings.
- [x] The official `+1 407-670-8839` destination and both native Google Ads conversion destinations are protected by automated tracking gates.
- [x] Measurement V2 Phase 0 centralizes public business configuration and adds executable phone/WhatsApp destination guards plus a CLI CTA inventory.
- [x] Measurement V2 Phase 1 creates explicit first-touch/last-touch contracts, opaque attribution IDs and non-ambiguous short references without exposing click IDs in WhatsApp or GA4 event parameters.
- [x] The shadow attribution API validates bounded same-origin payloads, uses a replaceable storage adapter and fails open when durable storage is unavailable.
- [x] WhatsApp URL construction and compatible event contracts are centralized while the existing native Google Ads WhatsApp conversion fires exactly once per interaction.
- [x] Shadow diagnostics are development/authorized-only, masked and free of click-ID values, message contents and customer PII.
- [x] No persistent attribution cookie is created without an affirmative consent signal; the missing CMP remains an explicit gap.
- [x] Root lint, typecheck, tests and build pass without changing Google Ads, Stripe conversion logic, campaign delivery or bidding.
- [x] A local CLI validates a redacted Gate B ledger, rejects PII columns and links Ads, orders and payments only through deterministic technical IDs.
- [x] Gate B reconciliation reports paid attributed/unattributed cases, duplicates, refunds and the expected Google Ads purchase-count check without mutating external systems.
- [x] The Aug 18–19 Lake Buena Vista commercial signal is recorded without customer PII, separating received service revenue, tips, projected revenue and technically attributed Google Ads purchases.
- [x] The Aug 19 Drive forensic audit and adversarial review are reduced to a controlled local delta that accepts new evidence without importing unsafe bidding, value or negative-keyword recommendations.
- [x] The Lake Buena Vista SEO page converts the observed hotel, handoff and deadline needs into a mobile-first path without unsupported same-day or special-care guarantees; its WhatsApp path carries a static funnel code plus the unique A7 reference.
- [x] The existing `/laundry-pickup-delivery-orlando` URL is refreshed as the owner of broad commercial Orlando guest-laundry pickup intent without creating a new slug or competing with the Lake Buena Vista, resort-area, International Drive, before-checkout or hotel-guide pages.
- [x] The refreshed money page uses visible, extractable HTML to answer audience, hotel/resort/vacation-rental pickup, handoff, bag identification, Standard, conditional Express, price, minimum, included pickup/delivery, needed-by requests, coverage, international payment and contact questions with exact FAQ/schema parity.
- [x] The refreshed money page removes Tailwind CDN and Material Symbols dependencies, uses responsive project-owned imagery with an archived generation ledger, preserves canonical/sitemap/Google Ads anchors and unified tracking, and keeps WhatsApp/SMS as the primary conversion paths.
- [x] The refreshed money page passes the 390px, tablet and desktop forensic gate with no overlap, inaccessible targets, unsupported claims, false proof, tracking regression or unresolved critical SEO/CRO/AI-search issue.
- [x] The approved Orlando money page receives a bounded Taste Skill polish that reduces repeated uppercase eyebrow treatment and generic equal-column rhythm without changing its canonical intent, offer, schema, anchors, contact contract or tracking.
- [x] Hotel, resort and vacation-rental guidance is reweighted into an editorial composition that reflects the hotel-guest priority while keeping all three supported stay types explicit in visible HTML.
- [x] Guest-facing copy sounds direct and human while every operational dependency remains conditional; FAQ visible text and FAQPage JSON-LD remain byte-for-byte equivalent.
- [x] WhatsApp, SMS, navigation, local-area, verification and FAQ controls receive restrained hover/pressed feedback with visible focus and reduced-motion support, without adding a framework or runtime dependency.
- [x] The Taste Skill candidate passes the existing repository gates plus desktop/mobile visual comparison before production; the exact approved preview was promoted only after explicit owner approval.
- [x] The existing International Drive URL is rebuilt as the owner of hotel, resort and convention-corridor guest intent without competing for broad Orlando, generic resort-next-day, hotel-guide or checkout-day intent.
- [x] The International Drive source candidate uses the canonical Standard/conditional-Express offer, confirmed-area language, exact FAQ/schema parity, verifiable public evidence and a dedicated `SEO-IDRIVE-V1` WhatsApp/SMS intake contract.
- [x] The International Drive source candidate removes remote UI dependencies, telephone and overlay CTAs, legacy free-delivery/Normal claims and unqualified property coverage while preserving its URL, rewrite, sitemap and internal hub links.
- [ ] Complete independent SEO/brand/QA review plus the protected preview gate for the International Drive candidate.
- [ ] Promote the exact owner-approved International Drive preview without rebuild and record public smoke, hashes, rollback and monitoring.
- [x] The protected MOS has a canonical registry for every managed SEO/growth funnel, including intent, audience, action, canonical path, attribution codes and truthful active/candidate/legacy release state.
- [x] The MOS joins live Search Console queries/pages and GA4 landing, interaction, journey and observed-campaign rows to each funnel by exact canonical path while preserving null for unavailable rows.
- [x] Funnel cards expose source freshness and attribution limits and never treat GA4-linked Google Ads traffic as native campaign, budget, balance or delivery status.
- [x] The existing Orlando hotel-laundry guide is normalized as educational decision support with a distinct intent boundary, canonical offer, hotel-handoff conditions, exact FAQ/schema parity and `SEO-HOTEL-GUIDE-V1` WhatsApp/SMS intake.
- [x] The existing before-checkout URL is normalized around a fixed checkout, flight or next-hotel needed-by time with canonical offer, conditional Express, exact FAQ/schema parity and `SEO-BEFORE-CHECKOUT-V1` WhatsApp/SMS intake.
- [x] The before-checkout candidate removes remote UI dependencies, telephone, legacy 6 PM cutoff, absolute free-delivery language and automatic same-day framing while preserving its URL, indexation and distinct checkout-day intent.
- [ ] Complete independent QA and protected preview for the MOS funnel catalog and hotel-guide source candidates.
- [ ] Promote only the exact owner-approved MOS and public-site previews, then record hashes, rollback and production monitoring separately.
- [x] The Aug 24 attribution remediation prevents Stripe from becoming a new GA4 acquisition referrer on the transactional confirmation route, carries a validated opaque `A7 Ref` from one-use payment-link metadata into the verified purchase event, and never exposes raw click IDs or customer PII.
- [x] The legacy `/blog/laundry-lake-buena-vista.html` route permanently redirects to the clean canonical path so GA4 and Search Console can converge on one Lake Buena Vista URL without changing page content.
- [x] The Aug 1–24 live GA4/GSC/Google Ads/Meta forensic checkpoint is appended to the MOS audit ledger with exact periods, source boundaries and explicit attribution uncertainty.
- [x] Google Ads uses the website WhatsApp action as the primary mandatory-entry proxy and keeps Stripe purchase as secondary financial evidence; both the superseded purchase-led change and the owner-corrected WhatsApp-first state remain append-only in the MOS audit ledger.
- [x] The Orlando operational attribution contract defines durable lead/order identities, separate operational and financial states, `order_accepted` and `purchase` macro outcomes, Stripe linkage, PII boundaries and an end-to-end QA gate without changing campaign goals.
- [x] The local P0 implementation creates durable lead/order/event/payment contracts, freezes an attribution snapshot at acceptance, requires an invoiced `order_id` for Stripe, ingests payment/refund webhooks idempotently and keeps the browser confirmation informational.
- [x] The protected branch Preview uses durable Supabase storage, branch-isolated runtime credentials and a Stripe test-mode signed webhook; synthetic QA proves failed, void, paid, delivered, refunded and repeat-order paths, webhook idempotency and safe analytics payloads, then removes all synthetic business records and deactivates the test payment objects.
- [ ] Complete contract §16 check 13 in GA4 DebugView and separately approve/configure the Production cutover before release. `money_page_view` was removed from GA4 key events on 2026-08-28 and verified absent after reload; `purchase` remained enabled. The tagged deterministic journey and browser/WhatsApp evidence are complete.
- [ ] Every privileged Supabase consumer uses a validated `sb_secret_` key through the `apikey` header only; the compromised legacy `service_role` key is deactivated only after Core, MOS and the separate WhatsApp Bridge have deployed the compatible code and zero legacy consumers are confirmed.

## Tasks

- [x] Audit the live GTM container and deployed tracking coverage.
- [x] Harden unified checkout and purchase tracking.
- [x] Add production tracking gates.
- [x] Validate and deploy.
- [x] Reconcile the MOS Meta snapshot against the active account and expose active creatives.
- [x] Re-run quality gates and deploy the corrected protected MOS.
- [x] Add decision-grade health rules and interactive MOS filters.
- [x] Validate and deploy the filtered MOS cockpit.
- [x] Incorporate the browser-verified Meta reconciliation and comparison windows.
- [x] Validate and deploy the reconciled period-aware MOS.
- [x] Incorporate the read-only GA4 audit with explicit reliability status.
- [x] Validate and deploy the GA4-aware MOS cockpit.
- [x] Incorporate the read-only Search Console reconciliation and remove the unsupported +700% signal.
- [x] Validate and deploy the GSC-reconciled MOS.
- [x] Archive the five GSC exports, extend the evidence gate and deploy the evidence-aware MOS.
- [x] Localize the operating MOS to Brazilian Portuguese, validate and deploy.
- [x] Build the optimization action plan and creative test matrix from reconciled MOS data.
- [x] Produce, validate and register new universal-safe-zone creative challengers.
- [x] Add the action plan to the protected MOS, validate and deploy.
- [x] Reprioritize the sprint from comforter lead generation to the only owner-confirmed sold service, then validate and deploy.
- [x] Create, preview, activate and reconcile the manual hotel/Airbnb guest campaign while pausing the mixed comforter campaign.
- [x] Reconcile six owner-reported orders and US$491 revenue for the audited Meta period.
- [x] Correct the campaign minimum-order drift from US$60 to the official US$50 and quarantine stale-price assets.
- [x] Archive and hash the unique Meta organic exports, reconcile the duplicate download and register the Planner export limitation.
- [x] Add verified organic-social KPIs, calendar actions and scheduling evidence to the MOS.
- [x] Map active Orlando laundry advertisers and translate the strongest public creative patterns into an A7-specific challenger brief.
- [x] Archive the Jul 24 read-only Google Ads audit and add validation guards for its account, currency, performance and null financial semantics.
- [x] Add the audited Google Ads view to the protected MOS and remove the stale “Ready to Launch” Google Ads summary.
- [x] Run the project quality gates and deploy the protected MOS update.
- [x] Build and validate the magical-Orlando guest payment confirmation experience.
- [x] Add a read-only Stripe Checkout Session verification endpoint and automated security tests.
- [x] Deploy the public confirmation route and document the Stripe Payment Link redirect still required.
- [x] Complete Phase 0 message, pricing, claim and customer-facing brand normalization.
- [x] Quarantine stale comforter and superseded tourist campaign materials.
- [x] Add session-level campaign attribution and automated commercial consistency gates.
- [x] Build and validate the paused Google Guest Laundry Search package.
- [x] Align the money page and WhatsApp attribution handoff with Google Search intent.
- [x] Add the Phase 1 plan and activation boundary to the Portuguese MOS.
- [x] Redesign the Guest Laundry landing hero around the campaign promise, retention flow and official A7 logo.
- [x] Replace the temporary local resort visual with the visually approved Lovart hero master.
- [x] Add a clean, native Everyday Laundry versus Special Items decision section to the Guest Laundry landing.
- [x] Strengthen the landing's machine-readable entity, service, image and trust signals without unsupported claims.
- [x] Produce, validate and archive the two English WhatsApp guest-onboarding service cards.
- [x] Harden the Google Search URL attribution, contact-event integrity and live activation preflight.
- [x] Reconcile the public entity/fact layer and add automated AI-search/indexation gates.
- [x] Quarantine scaled near-duplicate resort/location pages from the production sitemap and index until rewritten with unique evidence.
- [x] Publish and validate the A7 About/operations entity page.
- [ ] Complete the paused Google Search build and reconcile conversion goals before requesting final activation.
- [x] Create and install the native Google Ads purchase action without enabling enhanced conversions or exposing customer data.
- [x] Produce and visually validate the campaign-aligned guest “how it works” carousel and its publication-ready caption.
- [x] Create the dedicated `a7-laundry-mos` Google Cloud project and enable the Google Analytics Data API and Search Console API.
- [x] Provision the read-only MOS workload identity and grant it access to GA4 property `543807649` and `sc-domain:a7laundry.com`.
- [x] Implement the protected Google KPI API, live/snapshot reconciliation and visible freshness states in the MOS.
- [x] Add anti-regression tests, run all quality gates and deploy the live-data MOS without changing campaign delivery.
- [x] Extend the protected Google contract with acquisition, content, event and linked-Google-Ads reports plus canonical-path joins.
- [x] Add the protected Meta Ads read-only contract and provision the minimum required Meta asset access without changing delivery.
- [x] Add the native Google Ads read-only contract; expose linked GA4 Ads reporting as a clearly partial interim source.
- [x] Give Meta Ads and Google Ads independent paid-media periods instead of reusing the delayed Search Console period.
- [x] Derive current Meta campaign/ad/creative status from the Marketing API and remove stale snapshot status from current-state decisions.
- [x] Make Google Ads fail closed when the native credential is absent; historical balance, campaign state and search terms cannot represent the current account.
- [x] Add contract and dashboard regression tests for native-live, linked-partial and unavailable states.
- [x] Provision or identify a Google Ads manager account, issue its developer token, grant the MOS technical identity read-only access and configure the production secrets.
- [ ] Confirm the first successful native Google Ads report after Google propagates the new manager/service-account access; keep the MOS fail-closed while the upstream API returns HTTP 500.
- [x] Render the connected acquisition/content/event graph in Portuguese with filters and truthful live/partial/unavailable states.
- [x] Run anti-regression and production probes for the complete marketing observability graph.
- [x] Extend the protected GA4 contract with current-day article activity while preserving the finalized 30-day Google period.
- [x] Build the article-performance ranking and complete network-funnel view in the protected MOS.
- [x] Add ranking, intraday and attribution-boundary regression tests, then run all quality gates and production probes.
- [x] Add executable Meta destination and creative-placement guardrails, reconcile the paused test-number campaign and validate the MOS alert contract.
- [x] Reinforce the new Guest Laundry ad set with the proven A4 PT and A3 EN controls plus the LA7 PT challenger, validate placement previews and submit all three ads for Meta review.
- [x] Audit the current Google Ads conversion inventory and reconcile existing call, contact and purchase actions.
- [x] Create native WhatsApp and 60-second website-call actions while leaving enhanced conversions and Stripe unchanged.
- [x] Wire the new destinations into unified tracking and add anti-regression tests.
- [x] Reconcile the 19-thread WhatsApp sample into new leads, repeat orders and excluded contacts; correct the quoted denominator and remove the unsupported three-audio-loss claim.
- [x] Install current-price WhatsApp quick replies and document the remaining mobile-only, ownership, schedule, coverage and unit-economics decisions.
- [x] Convert owner-confirmed operations into canonical rules: 24/7 contact, Dennis primary,
  A7 Laundry — Backup 1 after five minutes, 40 km coverage, custom-service 48h reference with
  unit confirmation, Express requests until 6 PM and volume-qualified B2B pricing.
- [x] Retire the historical recovery queue without sending messages, update the live WhatsApp
  shortcuts and add anti-regression gates for stale Express cutoffs and non-24/7 schema hours.
- [x] Implement and validate Measurement V2 Phase 0 business configuration, phone guard and CTA inventory.
- [x] Implement and validate Measurement V2 Phase 1 attribution/event contracts, shadow API, fail-open WhatsApp builder and masked diagnostics.
- [x] Document current flow, privacy boundary, rollback and future durable-storage integration without advancing later measurement phases.
- [x] Audit the live Google Guest Laundry campaign after activation, raise the authorized budget to R$150/day without restarting it, reconcile the primary conversion mix and replace blog-bound sitelinks with commercial landing-page destinations.
- [x] Audit the live Meta Guest Laundry campaign without changing delivery, reconcile conversation, CPC, creative, age and placement performance, and verify the official WhatsApp destination and current US$20/day budget.
- [x] Archive and individually audit the 39-file multilingual creative package without publishing it, separating guest rework, future resident concepts and third-party/unsupported rejects.
- [x] Remove all eight US$3.00/lb creatives from the active intake library, archive them as old material and codify price-free new creative production with the current Normal and Express 8h exceptions.
- [x] Add and test the read-only Google Ads Gate B reconciliation CLI and canonical redacted input template.
- [x] Record the owner-confirmed Google → site → WhatsApp commercial signal for Lake Buena Vista without promoting projected revenue to paid attribution.
- [x] Compare the three Drive audit files with the local baseline and record accepted, rejected and pending deltas without changing campaign delivery.
- [x] Rebuild the Lake Buena Vista SEO page around hotel pickup, deadline and conditional handoff evidence; add source-page attribution and focused internal links without changing Google Ads delivery.
- [x] Inventory the live and local Orlando money page, Search Console/GA4 evidence, intent boundaries, offer truth and measurement dependencies before redesign.
- [x] Rebuild the existing Orlando money page around broad guest-laundry pickup intent, premium hospitality communication, direct answer blocks, safe operational trust and mobile-first WhatsApp/SMS conversion.
- [x] Generate, inspect, optimize and archive original broad-Orlando handoff and identified-return imagery without third-party marks, PII or unsupported operational claims.
- [x] Extend automated validation for money-page canonical, funnel code, CTA fields, FAQ parity, pricing/Express qualifiers, asset contracts and removal of production CDN dependencies.
- [x] Run the full repository gates, render required viewports, complete the money-page forensic audit and update this story's File List and Validation Notes.
- [x] Apply the bounded Taste Skill anti-template polish to the existing Orlando money page.
- [x] Validate the Taste Skill candidate and prepare a protected preview for owner comparison.
- [x] Inventory all 97 sitemap URLs with rewrite-aware source mapping, internal-link counts, schema, funnel codes and provisional actions.
- [x] Normalize the `/plans` source candidate around the approved Standard/conditional-Express contract, correct price math, self-canonical, verified entity graph and WhatsApp/SMS intake.
- [x] Add a deterministic regression gate for `/plans` canonical, price example, FAQ/schema parity, funnel code, Stripe payment truth and forbidden legacy claims.
- [x] Complete independent QA and the protected preview gate for the `/plans` normalization candidate.
- [x] Promote the exact approved `/plans` preview without rebuild and record public smoke, hashes, rollback and monitoring.
- [x] Rebuild the International Drive source candidate with a distinct corridor intent, responsive local asset, visible answer blocks, current offer and WhatsApp/SMS-only conversion path.
- [x] Extend deterministic validation for International Drive canonical, responsive assets, funnel fields, FAQ parity, current offer and forbidden legacy claims/dependencies.
- [ ] Complete independent QA and the protected preview gate for the International Drive candidate.
- [ ] Promote the exact approved International Drive preview without rebuild and record public smoke, hashes, rollback and monitoring.
- [x] Build and test the canonical MOS funnel registry and live GA4/Search Console joins.
- [x] Render truthful funnel cards in the protected command center with active/candidate/legacy status and null semantics.
- [x] Verify the current production MOS through the owner-authenticated read-only session and update the Wave 0 data-access boundary.
- [x] Close the MOS mobile-width and navigation-overlay regressions found by exact 390×844 CDP inspection.
- [x] Normalize and deterministically validate the Orlando hotel pickup guide without changing its URL.
- [x] Normalize and deterministically validate the Orlando before-checkout urgency funnel without changing its URL.
- [x] Deploy one exact protected public preview containing Plans, International Drive, Hotel Guide and Before Checkout; verify hashes, canonical paths, contact contracts, lazy assets and 390px layout without promoting production.
- [ ] Complete independent review, protected preview and owner approval for the MOS catalog and hotel guide.
- [x] Implement and test the Aug 24 Stripe attribution, Lake Buena Vista canonical and MOS evidence remediations before any external conversion-action change.
- [x] Prepare the Aug 26 mobile WhatsApp recovery candidate, matched-period baseline, deterministic CTA guard, clean Google Ads image pair and protected rollback evidence without changing production or campaign settings.
- [x] Specify the lead → accepted order → pickup → weighing → invoice → payment → delivery attribution contract and align the SEO Core 15 measurement gate.
- [x] Implement and validate the local P0 server candidate, then apply only the additive reviewed migration remotely; do not deploy the application or change Google Ads goals.
- [x] Configure the branch-isolated protected Preview, register the Stripe test webhook, execute the synthetic operational/financial lifecycle and remove its Supabase and Stripe test data.
- [x] Isolate Stripe Preview transport behind a dedicated `Stripe-QA` Vercel bypass, validate a signed non-financial probe on the unique deployment and stable alias, then remove the superseded test endpoint without changing the project-wide bypass.
- [x] Create and protect the GA4 Measurement Protocol secret after the owner confirms Google's user-data collection attestation, validate the server events in DebugView and preserve the separate authorization gate for any Production cutover. Editor-capable access through `a7laundry.usa@gmail.com` is confirmed; `money_page_view` was removed from key events, `purchase` remained enabled, all three server events passed strict validation and DebugView, and both Preview debug flags were returned to `false` on 2026-08-28.
- [ ] Complete the Supabase key incident cutover: replace the masked placeholder with a validated secret value, deploy compatible Core/MOS and Bridge runtimes, prove zero legacy consumers, then separately deactivate the compromised legacy key with rollback ready.
- [x] Rotate the exposed Production Stripe signing secret, rotate the unavailable operations token,
  redeploy the exact approved Core SHA, pass the authenticated Production preflight 10/10 and
  complete one signed non-financial ignored-event probe while keeping the live webhook disabled.
- [x] After the signed probe and a separate owner authorization, enable only the reviewed
  Production Stripe endpoint and verify its exact six-event scope and fail-closed public guards.

## File List

- `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`
- `docs/runbooks/a7-orlando-operational-attribution-p0-release.md`
- `docs/audits/2026-08-28-operational-attribution-completion-audit.md`
- `docs/audits/2026-08-28-forensic-seo-geo-eeat-ai-search-audit.md`
- `marketing/seo-consistency/SEO-CORE-15-OPERATIONAL-PLAN-2026-08-28.md`
- `supabase/migrations/20260828020000_orlando_operational_attribution_p0.sql`
- `supabase/migrations/20260828030000_orlando_payment_order_uniqueness.sql`
- `supabase/migrations/20260828110000_orlando_ga4_event_time_fidelity.sql`
- `supabase/migrations/20260828120000_orlando_ga4_expired_outbox.sql`
- `supabase/migrations/20260828040000_orlando_order_intake_customer.sql`
- `supabase/migrations/20260828050000_orlando_payment_failure_states.sql`
- `supabase/migrations/20260828060000_orlando_financial_event_fidelity.sql`
- `supabase/migrations/20260828070000_orlando_state_transition_completion.sql`
- `supabase/migrations/20260828080000_orlando_idempotency_contract_hardening.sql`
- `supabase/migrations/20260828090000_orlando_operational_funnel_reporting.sql`
- `supabase/migrations/20260828100000_orlando_lead_idempotency_hardening.sql`
- `lib/operational-store.js`
- `lib/operational-lifecycle.js`
- `lib/operational-release-preflight.js`
- `lib/ga4-server.js`
- `api/order-intake.js`
- `api/operations/lifecycle.js`
- `api/operations/preflight.js`
- `api/stripe-webhook.js`
- `api/create-payment-link.js`
- `api/stripe-session.js`
- `payment-link.html`
- `order.html`
- `guest-payment-confirmation.html`
- `scripts/a7-order-lifecycle.mjs`
- `scripts/test-operational-attribution-p0.mjs`
- `scripts/preflight-operational-attribution.mjs`
- `scripts/test-operational-release-preflight.mjs`
- `scripts/test-operational-attribution-p0.sql`
- `scripts/test-payment-link.mjs`
- `scripts/test-stripe-confirmation.mjs`
- `scripts/test-tracking.mjs`
- `mos-app/operational-kpis-contract.js`
- `mos-app/tests/operational-kpis.test.mjs`
- `mos-app/api/google-kpis.js`
- `a7-command-center.html`
- `package.json`
- `scripts/reconcile-google-ads-gate-b.mjs`
- `scripts/test-reconcile-google-ads-gate-b.mjs`
- `marketing/google-ads/2026-07-guest-laundry-search/gate-b-ledger-template.csv`
- `marketing/google-ads/2026-07-guest-laundry-search/PROMPT-PERPLEXITY-DEMAND-PAIN-GAP-ORLANDO.md`
- `marketing/google-ads/2026-07-guest-laundry-search/PERPLEXITY-STRATEGIC-DELTA-2026-08-18.md`
- `marketing/google-ads/2026-07-guest-laundry-search/PROMPT-CODEX-REDESIGN-PREMIUM-LAKE-BUENA-VISTA.md`
- `blog/laundry-lake-buena-vista.html`
- `blog/img/lake-buena-vista-hotel-laundry-hero-v2.webp`
- `blog/index.html`
- `blog/hotel-laundry-service-orlando.html`
- `blog/laundry-near-disney-world.html`
- `blog/orlando-vacation-rental-laundry-guide.html`
- `marketing/google-ads/2026-07-guest-laundry-search/COMMERCIAL-SIGNAL-LAKE-BUENA-VISTA-2026-08-19.md`
- `marketing/google-ads/2026-07-guest-laundry-search/DRIVE-FORENSIC-ADVERSARIAL-DELTA-2026-08-20.md`
- `docs/stories/a7-003-conversion-observability.md`
- `a7-tracking.js`
- `comforter-cleaning.html`
- `comforter-thanks.html`
- `guest-payment-confirmation.html`
- `api/stripe-session.js`
- `scripts/test-stripe-confirmation.mjs`
- `payment-link.html`
- `api/create-payment-link.js`
- `scripts/test-payment-link.mjs`
- `vercel.json`
- `marketing/google-ads/2026-07-guest-laundry-search/FORENSIC-CHECKPOINT-2026-08-24.md`
- `marketing/google-ads/2026-07-guest-laundry-search/GOOGLE-ADS-CONVERSION-GOAL-CHANGE-2026-08-24.md`
- `marketing/google-ads/2026-07-guest-laundry-search/GOOGLE-ADS-WHATSAPP-FIRST-CORRECTION-2026-08-24.md`
- `marketing/google-ads/2026-07-guest-laundry-search/CLAUDE-AUDIT-WHATSAPP-FIRST-ADJUDICATION-2026-08-24.md`
- `mos-data/audits/2026-08-24-growth-forensic-checkpoint.json`
- `mos-data/audits/2026-08-24-google-ads-purchase-led-goal.json`
- `mos-data/audits/2026-08-24-google-ads-whatsapp-first-correction.json`
- `mos-data/audits/2026-08-24-attribution-canonical-release.json`
- `mos-app/generated/audit-registry.js`
- `mos-app/tests/dashboard.test.mjs`
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ATTRIBUTION-CANONICAL-2026-08-24.md`
- `marketing/seo-consistency/MOS-FORENSIC-LEDGER-RELEASE-2026-08-24.md`
- `marketing/seo-consistency/MOS-WHATSAPP-FIRST-RELEASE-2026-08-24.md`
- `marketing/google-ads/2026-07-guest-laundry-search/activation-runbook.md`
- `marketing/google-ads/2026-07-guest-laundry-search/preflight-checklist.md`
- `marketing/google-ads/2026-07-guest-laundry-search/campaign-spec.yaml`
- `mos-app/google-kpis-contract.js`
- `mos-app/api/google-kpis.js`
- `mos-app/tests/google-kpis.test.mjs`
- `mos-app/tests/dashboard.test.mjs`
- `a7-command-center.html`
- `marketing/seo-consistency/MOS-FUNNEL-CATALOG-EVIDENCE-2026-08-22.md`
- `marketing/seo-consistency/DATA-ACCESS-BOUNDARY-2026-08-22.json`
- `blog/hotel-laundry-service-orlando.html`
- `blog/img/hotel-laundry-service-orlando-hero-v2.webp`
- `blog/img/hotel-laundry-service-orlando-hero-v2-mobile.webp`
- `public/guest-intent-guide-v1.css`
- `marketing/seo-consistency/HOTEL-GUIDE-NORMALIZATION-EVIDENCE-2026-08-22.md`
- `blog/laundry-before-checkout-orlando.html`
- `blog/img/laundry-before-checkout-orlando-hero-v2.webp`
- `blog/img/laundry-before-checkout-orlando-hero-v2-mobile.webp`
- `marketing/seo-consistency/BEFORE-CHECKOUT-NORMALIZATION-EVIDENCE-2026-08-22.md`
- `marketing/seo-consistency/WAVE-1-PUBLIC-PREVIEW-EVIDENCE-2026-08-22.md`
- `vercel.json`
- `scripts/build-site.mjs`
- `sitemap.xml`
- `MANIFESTO.md`
- `README.md`
- `index.html`
- `vacation-rental.html`
- `carpet-cleaning.html`
- `shoe-cleaning.html`
- `upholstery-cleaning.html`
- `marketing/whatsapp/message-templates.md`
- `marketing/whatsapp/STATUS-OPERACIONAL-2026-07-31.md`
- `marketing/whatsapp/STATUS-OPERACIONAL-2026-08-16.md`
- `marketing/whatsapp/assets/2026-07-guest-onboarding/`
- `marketing/AUDITORIA-WHATSAPP-2026-07-30.md`
- `marketing/PLAYBOOK-ATENDIMENTO.md`
- `marketing/RECUPERACAO-PENDENTES.md`
- `marketing/data/leads.csv`
- `marketing/data/semanal.csv`
- `marketing/data/custos-servico.csv`
- `marketing/data/reconciliacao-whatsapp-2026-07-31.csv`
- `docs/DIRECIONAMENTO-AGOSTO-2026.md`
- `marketing/meta-ads/campaigns/2026-07-comforter-dedicated/`
- `scripts/validate-site.mjs`
- `plans.html`
- `blog/laundry-international-drive-orlando.html`
- `blog/img/laundry-international-drive-orlando-hero-v2.webp`
- `blog/img/laundry-international-drive-orlando-hero-v2-mobile.webp`
- `marketing/seo-consistency/INTERNATIONAL-DRIVE-NORMALIZATION-EVIDENCE-2026-08-22.md`
- `marketing/SEO-GEO-AI-SEARCH-CONSISTENCY-PLAN-2026-08-22.md`
- `marketing/seo-consistency/URL-INVENTORY-2026-08-22.tsv`
- `marketing/seo-consistency/DATA-ACCESS-BOUNDARY-2026-08-22.json`
- `marketing/seo-consistency/WAVE-0-BASELINE-2026-08-22.md`
- `marketing/seo-consistency/CANONICAL-TRUTH-DELTA-2026-08-22.md`
- `marketing/seo-consistency/PLANS-NORMALIZATION-PREFLIGHT-2026-08-22.md`
- `marketing/seo-consistency/PLANS-RELEASE-EVIDENCE-2026-08-22.md`
- `scripts/test-validation-context.mjs`
- `laundry-pickup-delivery-orlando.html`
- `sitemap.xml`
- `public/orlando-guest-laundry-handoff-v1.webp`
- `public/orlando-guest-laundry-handoff-v1-mobile.webp`
- `public/orlando-laundry-identified-return-v1.webp`
- `public/orlando-laundry-identified-return-v1-mobile.webp`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-guest-laundry-handoff-source-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-laundry-identified-return-source-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/CREATIVE-LEDGER-ORLANDO-MONEY-PAGE-2026-08-21.md`
- `marketing/google-ads/2026-07-guest-laundry-search/FORENSIC-AUDIT-ORLANDO-MONEY-PAGE-2026-08-22.md`
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ORLANDO-MONEY-PAGE-2026-08-22.md`
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/orlando-money-page-taste-2026-08-22-immediate.json`
- `marketing/google-ads/2026-07-guest-laundry-search/MOBILE-CTA-RECOVERY-2026-08-26.md`
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/orlando-mobile-cta-recovery-2026-08-26.json`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/image-extension/a7-guest-laundry-handoff-landscape-1200x628.jpg`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/image-extension/a7-guest-laundry-handoff-square-1200x1200.jpg`
- `marketing/google-ads/2026-07-guest-laundry-search/evidence/a7-mobile-sticky-recovery-390x844.png`
- `a7-carpet-campaign/index.html`
- `comforter-cleaning-v2.html`
- `blog/*.html` (Express cutoff and opening-hours consistency)
- `marketing/organic/instagram-feed/2026-07/2026-07-15-tourist-sameday-en/caption.md`
- `marketing/google-ads/2026-07-guest-laundry-search/`
- `marketing/google-ads/2026-07-guest-laundry-search/live-optimization-snapshot-2026-08-16.md`
- `marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png`
- `marketing/meta-ads/campaigns/2026-08-guest-how-it-works-carousel/`
- `scripts/build-guest-carousel.mjs`
- `scripts/validate-guest-carousel.mjs`
- `public/guest-laundry-hero.webp`
- `A7 LAUNDRY-06.png`
- `scripts/validate-google-ads-phase1.mjs`
- `scripts/preflight-google-ads-live.mjs`
- `a7-business-config.js`
- `a7-attribution.js`
- `a7-events.js`
- `api/attribution/session.js`
- `lib/attribution-store.js`
- `scripts/guard-business-destinations.mjs`
- `scripts/inventory-ctas.mjs`
- `scripts/test-attribution-v2.mjs`
- `docs/measurement-v2-foundation.md`
- `mos-app/tests/dashboard.test.mjs`
- `scripts/validate-audit-evidence.mjs`
- `scripts/validate-meta-ads-guardrails.mjs`
- `docs/audits/evidence/2026-07-22/ga4/`
- `docs/audits/evidence/2026-07-22/gsc/`
- `docs/audits/evidence/2026-07-24/meta-organic/`
- `docs/audits/evidence/2026-07-24/google-ads/`
- `marketing/meta-ads/campaigns/2026-07-optimization-sprint/`
- `marketing/meta-ads/campaigns/2026-07-tourist-hotel-geo-leads/`
- `marketing/meta-ads/campaigns/2026-07-guest-laundry-manual/snapshot-2026-07-28-reactivation.md`
- `marketing/meta-ads/campaigns/2026-07-guest-laundry-manual/live-audit-2026-08-16.md`
- `marketing/meta-ads/campaigns/2026-07-guest-laundry-manual/assets/incoming/2026-08-17-multilingual-package/`
- `marketing/meta-ads/archive/material-antigo/2026-08-17-valores-desatualizados/`
- `marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/`
- `marketing/meta-ads/pricing-rules.md`
- `marketing/meta-ads/creative-production-standard.md`
- `marketing/meta-ads/publishing-guardrails.yaml`
- `marketing/meta-ads/quarantine/2026-07-27-air-force-carousel.md`
- `marketing/meta-ads/research/2026-07-24-orlando-ad-library-scan.md`
- `marketing/organic/instagram-feed/2026-07/2026-07-23-guest-how-it-works-en/`
- `marketing/organic/SCHEDULING-KIT.md`
- `mos-app/`
- `mos-app/api/google-kpis.js`
- `mos-app/google-kpis-contract.js`
- `mos-app/google-ads-kpis-contract.js`
- `mos-app/meta-kpis-contract.js`
- `mos-app/tests/google-kpis.test.mjs`
- `mos-app/tests/google-ads-kpis.test.mjs`
- `mos-app/tests/meta-kpis.test.mjs`
- `mos-app/tests/dashboard.test.mjs`
- `mos-app/.env.example`
- `docs/runbooks/google-ads-native-mos.md`
- `mos-app/package.json`
- `mos-app/package-lock.json`
- `scripts/test-tracking.mjs`
- `docs/audits/2026-07-29-google-ads-conversion-tracking.md`
- `marketing/google-ads/2026-07-guest-laundry-search/measurement-plan.md`
- `package.json`
- `mos-kpis.js`
- `a7-command-center.html`
- `scripts/validate-mos-kpis.mjs`
- `scripts/build-site.mjs`

## Validation Notes

- Aug 22 Plans typography amendment: owner feedback rejected the Georgia treatment on the `/plans` hero hook. Only the H1 font stack, weight, line-height and tracking were refined to a heavy local/system sans; internal editorial headings retain Georgia. The protected preview `dpl_DxfgcRbCLb7TYJnYAjiqQkXxzWBA` is READY, its `/plans` HTML is byte-identical to the tested build (`89fcd22d…`), and 390×844/1440×900 renders plus all repository gates passed. Production remains unchanged pending owner approval.
- Aug 22 Plans identity correction: the typography preview exposed a legacy `A7 Lavanderia` header/footer asset. Both references now use the official USA `A7 LAUNDRY-05.png`, whose bytes match the owner-supplied Google Drive master (`f59d188a…`). Superseding preview `dpl_CBqG5XWrN1CMV1R7KpY4vG4ygJbb` is READY; protected HTML (`e9505b53…`) and logo are byte-identical to the tested build, and 390×844/1440×900 renders pass without overflow. Production remains unchanged pending owner approval.
- Aug 22 Plans release: independent QA passed after the review-card contrast correction. Scoped commit `75b5d63` contains only `plans.html`. Protected preview `dpl_ATS8noHnPkQ2A9WvC9qzYxp9Ds9d` was built from the current public-production baseline plus the approved `/plans` artifact only; money page (`53b057e4…`), Universal (`c64bd5e7…`) and sitemap (`f497e059…`) stayed byte-identical to production. Owner approval was followed by exact no-rebuild promotion to READY production `dpl_7KRoef7F2mV3P1WSRV2waxSV5j9t`. Public `/plans` is HTTP 200 and byte-identical to preview/build (`4e62028d…`); canonical, five schema entities, six FAQ entries, WhatsApp/SMS tracking, zero call links, official logo, and 390×844/1440×900 overflow checks passed. Rollback is `dpl_98FASVxTNWedYknntjBgDte5N7mh`.

- On Jul 29, authenticated Google Ads audit found four pre-existing active actions: inactive Stripe purchase, `Calls from ads`, and two locked Business Profile call/contact actions. There was no native website WhatsApp action and no duration-qualified call action for ad visitors who reached the site.
- Google Ads account `290-113-2891` now contains `A7 - WhatsApp click (site)` (`AW-17146169189/dhI0CO_7xNgcEOWO9-8_`) and `A7 - Website call 60s` (`AW-17146169189/83lbCLK53NgcEOWO9-8_`). The website-call action routes to the official `+1 407-670-8839`, requires 60 seconds and carries no inferred monetary value.
- Enhanced conversions remained disabled. No customer-provided email, phone or other personal data was enabled, and the Stripe purchase action was not changed.
- Unified tracking emits the native WhatsApp conversion while preserving the richer GA4 event. A phone-button click remains `call_click`; the Google forwarding-number configuration, not the click, determines whether a 60-second website call becomes a conversion.
- Root lint, typecheck, test and build gates pass after the conversion additions. Production deployment `dpl_4rMDt85MNSUNEFJge4gztqcZ4esH` is Ready and aliased to `https://a7laundry.com`; the live script contains both destinations, the forwarding-number configuration and the official phone.
- On Jul 28, owner-authorized Meta reactivation created one fresh Guest Laundry delivery path: campaign `120249258351190261`, ad set `120249258351200261` and ad `120249258351210261`. All three switches were enabled, the ad-set budget was published at US$30/day and the final table refresh showed `Preparando` with US$0.00 spend.
- On Jul 28, the same safe delivery path was reinforced without changing its US$30/day budget: A4 PT `120249259011110261`, A3 EN `120249259182640261` and LA7 PT `120249259292590261` were published and returned `Em processamento`; the original Front Desk EN ad remained `Preparando`.
- The final set contains four enabled ads, split 2 PT / 2 EN. Each new ad has exactly one authorized primary asset, zero related media, zero generated image/video assets, all creative enhancements off and a direct saved WhatsApp conversation template in the matching language.
- Placement previews confirmed the A3/A4 9:16 controls preserve their critical text. The LA7 1:1 challenger uses its native square in Feed and fits the complete square in Stories/Reels without cropping its headline, benefits, price or WhatsApp CTA.
- The reactivated path uses the official WhatsApp destination `+1 407-670-8839`, Orlando +40 km, ages 25–55, manual Feed/Stories/Reels placements and placement-specific 4:5/9:16 Front Desk assets. The prior campaign exposing `+1 555-628-7241` remains disabled.
- On Jul 27, authenticated Meta Business Settings verification removed the only person's access from `Test WhatsApp Business Account`; the test account now shows zero assigned people. Access to the real `A7 Lavanderia` WhatsApp account remained intact.
- Ads Manager account `650201661142284` returned no active ads after the guest campaign was paused. The separate enabled account `1082891519133766` exposed only unpublished drafts in the active view; no Air Force paid ad was found in either account.
- Meta Business Suite confirmed the Air Force 1 carousel as an organic Instagram/Facebook publication with 27 Instagram views at inspection time. The owner-supplied preview cuts the slide-2 headline, and its caption crosses `@a7laundry` with `@a7lavanderia` and Miami. The asset is quarantined from paid media until brand/GEO and all six placement previews pass.
- The CLI guard pins `+1 407-670-8839`, blocks `+1 555-628-7241`, rejects an unverified destination and requires Feed/Stories/Reels preview attestation. The protected live contract reports `critical`, `verified`, `unavailable` or `not_applicable` without converting missing destination data into approval.
- Root lint, typecheck, test, build and `git diff --check` pass. `mos-app` passes 21 tests, including official-number verification, test-number blocking and missing-destination fail-closed behavior.
- Production deployment `dpl_8RKC1779X3WNxQYKg6ZEvRoeqoCt` is Ready and aliased to `https://mos.a7laundry.com`. Anonymous dashboard and KPI requests still redirect to the Portuguese login.
- Marketing-graph deployment `dpl_8ts9DCMwPcZBEoNT8bGpHDehjvdx` is Ready and aliased to `https://mos.a7laundry.com`; the custom DNS record now resolves.
- Authenticated production validation on Jul 27 confirmed schema `1.1`, GA4 and Search Console `live`, period Jun 25–Jul 24, nine observed acquisition origins/campaigns, 14 canonical landing pages and 37 article/event nodes.
- The linked-Google-Ads report initially returned one unattributed `(not set)` row with 108 sessions, 17 key events and zero identifiable ad impressions, clicks or cost. Deployment `dpl_ALeQP1wF2A6P3cV7b5w5MJeMqgpd` now filters that row and truthfully reports `VÍNCULO GA4 SEM ATRIBUIÇÃO PAGA` instead of claiming one paid campaign.
- Protected schema `1.1` models GA4 campaign/source → canonical landing page/article → event and GSC query → canonical page while explicitly warning that platform counts are not deduplicated users.
- The GA4 contract now isolates summary, channel, acquisition, landing, content, event, journey, page-event and linked-Google-Ads reports so one incompatible report produces a partial state instead of erasing the other live data.
- Google Ads data received through the GA4 link is labeled `partial_live` and is not represented as the native Google Ads API. Native access remains blocked by the advertiser account's lack of a manager developer token.
- The server-only Meta contract is live for campaigns, ad sets, ads, creative destinations and daily ad insights. It keeps the bearer token out of URLs, browser payloads and error messages and requests no campaign mutation.
- Browser verification confirmed Meta app `A7 COMERCIAL` (`1999136107306205`), system user `Conversions API System User` (`61578413912697`) and ad account `A7 LAUNDRY USA` (`650201661142284`). The ad account retains only `Ver desempenho`; the app was returned to partial `Desenvolver app`, `Ver insights` and `Testar app` access after token issuance.
- The Meta system-user token has no expiry and contains only `ads_read`. It is stored as an encrypted Vercel production secret alongside `META_AD_ACCOUNT_ID=650201661142284` and the app-confirmed Graph API `v25.0`; no token value entered the repository, browser bundle or command output.
- Production deployment `dpl_8iBhMGLBkWvxax9xXF1MhJByMvKg` is Ready and aliased to `https://mos.a7laundry.com`.
- Authenticated production validation on Jul 27 reports Meta Marketing API `live` for Jun 25–Jul 24: 85 daily ad-level rows, US$625.90 spend, 34,122 impressions, 318 link clicks and 33 identified messaging conversations. The protected MOS identifies account `650201661142284` and labels the connection as a read-only query.
- Follow-up deployment `dpl_8o4ZQeFfKUKjnftznxJjPRZqS2tK` removed the stale header claim that Meta was disconnected. Authenticated production now states `Meta Ads está conectado pela API somente leitura` while the source and media cards independently remain `API AO VIVO`; the unavailable-credential wording is preserved only for a real unavailable state.
- Article-funnel deployment `dpl_FFQVbpvzUjJUkRRCm9WkzrXVeYiD` is Ready and aliased to `https://mos.a7laundry.com`. The protected contract is schema `1.2` and keeps the finalized Jun 25–Jul 24 Google window separate from the Jul 27 GA4 intraday report.
- Authenticated production validation found 35 observed article URLs, 16 finalized GA4 article views and zero intraday article views at the validation time. `/blog/laundry-davenport.html` ranked first by access with six views; the Google-click ordering control also changed the table correctly.
- The first observable content funnel reports 709 GSC article impressions → 16 GA4 article views → 10 article-entry sessions → zero article key events → zero article contact events. Six sales and one repeat order remain visible only as owner-reported all-channel totals, separated by an attribution boundary and excluded from conversion-rate calculations.
- `mos-app` now passes 19 tests, including Orlando-day calculation, intraday failure isolation, ranking order, canonical GA4/GSC joins and the sales-attribution boundary. Root lint, typecheck, test and build also pass.
- The Meta-backed marketing graph increased the protected summary to 17 campaign/origin entities, 68 ad-set/ad entities, 16 landing pages and 37 article/event entities without claiming cross-platform user deduplication.
- `mos-app` passes 17 tests, including partial-report behavior, canonical graph joins, Meta token non-disclosure and unavailable-not-zero semantics. Root lint, typecheck, test and build also pass after the Meta live cutover.
- Live GTM container `GTM-KV9LGVRN` currently publishes zero tags; GA4 and Meta delivery therefore depend on `a7-tracking.js` and any legacy inline pixels.
- All production HTML files load `/a7-tracking.js`; no page loads the retired `wa-tracking.js`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check` passed.
- Unified tracking unit tests verify WhatsApp Lead, Stripe checkout and thank-page classification.
- Phase 0 tracking tests verify current-page attribution capture and reuse of session-persisted attribution on a later page.
- Commercial consistency checks protect the Guest Laundry message, current Normal/Express pricing, campaign archive markers and non-guaranteed WhatsApp closing language.
- Google Ads Phase 1 validation protects the 16-keyword exact/phrase inventory, four paused RSAs, character limits, shared negatives, R$490 test ceiling and explicit activation NO-GO.
- The campaign now uses a Final URL suffix with controlled UTM and ValueTrack parameters, exposes four intent-relevant sitelinks and has a CLI live preflight plus a stepwise paused-build activation runbook.
- Landing contact actions rely on the unified click listener; legacy inline contact events were removed so SMS, call and WhatsApp interactions are not fragmented or double-counted.
- Google Search preflight deployment `dpl_3PfnSGEzN92JJGYSTSerKRdSTiiT` is Ready and aliased to `https://a7laundry.com`. The live CLI check passed for HTTP 200, preserved attribution parameters, current pricing, US$50 minimum, availability-qualified Express, WhatsApp destination and byte-identical unified tracking.
- No supported browser session was connected after the live preflight, so the Google Ads account was not changed. Paused-draft construction remains the next controlled account step.
- Phase 1 public deployment `dpl_EWWqPcr9vJvTPvwz5ShWdjpH6PdC` is Ready and aliased to `https://a7laundry.com`.
- Production checks returned HTTP 200 for the Guest Laundry landing and unified tracking script; the deployed source contains the canonical message, US$50 minimum, availability CTA, campaign-session storage and `A7 Ref`.
- Phase 1 MOS deployment `dpl_5g8eCnXoh2uWzMRRTu7GeKDhQjma` is Ready. Anonymous requests to both the dashboard and `mos-kpis.js` redirect to login.
- Guest Laundry hero redesign replaces the remote stock-photo dependency with a controlled local resort asset, adds the campaign retention sequence and uses the exact official `A7 LAUNDRY-05.png` wordmark. The final Lovart master remains a deliberate asset swap and has not been represented as complete.
- The Lovart production brief explicitly forbids generated logos, text, third-party marks and artificial anatomy; the official logo is composed by the website instead of being regenerated inside the hero image.
- The approved 1600×2000 Lovart master is archived with SHA-256 `3a49c510d43f6daaaa92ffe18394d3280b9aff0245367f09c4dc0fa0575b84ba`; its 212 KB WebP derivative is served by the landing while the official A7 wordmark remains an independent HTML overlay.
- Guest hero deployment `dpl_CWiNgxw4C1ZFzNFi8qxDKsV7EjPU` is Ready and aliased to `https://a7laundry.com`. Production checks confirmed the landing markup, campaign message, pricing, unified tracking, optimized WebP hero and official PNG wordmark; both public image assets return HTTP 200.
- The owner-supplied Drive asset `A7 LAUNDRY-06.png` was verified byte-for-byte against the repository brand master (SHA-256 `dc14a1b31dcc652cdde9bbc820064efe1bc4ebacdfcf0e53f23d3bf2d13a5cea`). Dark landing surfaces use this white wordmark; the white hero logo card keeps the blue `A7 LAUNDRY-05.png` variant.
- Contrast-corrected deployment `dpl_2hjANfXuBiUJCKGj8pKd3pib9hTd` is Ready and aliased to `https://a7laundry.com`. Production source contains two dark-surface uses of `A7 LAUNDRY-06.png`; both official wordmark variants and the Lovart hero return HTTP 200.
- Guest care architecture keeps everyday per-pound wash and fold separate from comforters, shoes, dry-clean-only labels and special requests; the page asks for a photo and confirmation instead of promising unsupported custom-care capabilities.
- The landing now connects the LocalBusiness, Service, WebPage and primary ImageObject entities; publishes a matching image sitemap entry, a descriptive HTML image and a visible service-review block. This supports machine understanding while keeping the visible content people-first.
- Clean guest-care deployment `dpl_ADfxg7hcoPqRixaqqYpki73ExoSy` is Ready and aliased to `https://a7laundry.com`. Production verification confirmed the Everyday/Special decision section, separate-quote guard, linked LocalBusiness/Service/WebPage/ImageObject entities, large image-preview directive, image sitemap and current last-modified date; stale US$60 and pre-8h Express claims are absent.
- Two 1600×2000 Lovart guest-onboarding masters were visually audited and archived in July. The Everyday variants were moved intact to `quarantined/obsolete-pre-8h-duration/` on Aug 16 because their pixels contain the former Express duration; they are historical evidence only and no longer approved. The Special Item variants remain approved because they request a photo and separate quote without stating the obsolete duration.
- No Google Ads campaign, budget, conversion goal, billing setting or account balance was changed. Ads Manager construction and activation remain separate authorized steps.
- MOS KPI validation protects required fields, duplicate identifiers and null semantics for unavailable financial data.
- The internal KPI snapshot and Command Center are excluded from the public production bundle.
- Separate protected MOS production deployment: `https://a7-laundry-mos.vercel.app`.
- Production authentication probe confirmed anonymous dashboard/data redirects and authenticated HTTP 200 access.
- Official Meta Ads read-only audit on Jul 22 confirmed account `650201661142284` ACTIVE, campaign `120248527506970261` ACTIVE, US$543.17 spend, 27 messaging conversations and three delivering ads for Jun 22–Jul 21.
- Corrected MOS separates dated source snapshots, removes unrelated BRL account history from the operating summary and displays the three active creative assets with ad-level KPIs.
- Filtered MOS cockpit deployment `dpl_8Zunk9RAVbk3eyArpdEykK2YoM3D` is Ready and aliased to `https://a7-laundry-mos.vercel.app`.
- Channel, health and creative-focus filters are backed by automated paid/creative/revenue view tests; health thresholds are visible and identify their internal baseline or target.
- Browser reconciliation confirmed zero differences across 12 MOS/Meta metrics, USD currency, Pacific Time reporting and 7-day click/1-day view attribution; active and paused ad totals reconcile exactly.
- Verified period filters cover Jun 22–Jul 21, Jul 3–10 and Jul 11–21; comparison windows reconcile exactly to the full-period spend, clicks, impressions and conversations.
- Reconciled period-aware deployment `dpl_9FDw98xRVb6id3PU8TT6isVuQ6WL` is Ready and aliased to `https://a7-laundry-mos.vercel.app`.
- GA4 read-only audit records 68 active users, 101 sessions, 47.52% engagement and 17 key events while explicitly classifying traffic as partially reliable and commercial conversion/revenue as unavailable.
- Website/GA4 channel view exposes acquisition mix, missing paid attribution, fragmented event names, bot/data-center noise and absent lead/checkout/purchase instrumentation.
- GA4-aware deployment `dpl_CujPwH2pq31AizbvNnPgAZahJZLL` is Ready and aliased to `https://a7-laundry-mos.vercel.app`.
- Search Console audit reconciled 17 clicks, 1,145 impressions, 1.5% CTR, 19.1 position, 29 indexed pages, 21 non-indexed pages and 62 sitemap URLs; visible query count is explicitly partial due to anonymization.
- Unsupported tourist-article +700% growth was replaced by the verified small-base +82% comparison (33→60 impressions), with device, page, indexation and CWV limitations shown in the SEO view.
- GSC-reconciled deployment `dpl_8r35ZGyYoY2deN9oof3t4iVSZPtD` is Ready and aliased to `https://a7-laundry-mos.vercel.app`.
- Fourteen canonical GA4 CSV exports were copied into versioned evidence storage with SHA-256 hashes; originals and duplicate downloads were preserved untouched.
- Local hash audit found three duplicate Traffic Acquisition downloads plus one duplicate each for Landing Pages, Events and Ecommerce. No distinct Overview export was present.
- The root test suite now verifies all 14 canonical hashes and the archived session, event, lead and empty-ecommerce semantics.
- Five canonical GSC XLSX exports were copied into versioned evidence storage, passed ZIP-container integrity checks and are protected by SHA-256 hashes; the original Downloads files remain untouched.
- The evidence manifest records that Sitemaps has no GSC export action and Core Web Vitals has neither an export action nor sufficient 90-day field data.
- Cell-level XLSX inspection is explicitly marked pending because the required spreadsheet inspection runtime was unavailable; browser-reconciled GSC KPIs remain separately classified as verified.
- Evidence-aware MOS deployment `dpl_AukhKV32DKX1Z2cCtYGvzofLSrU6` is Ready and aliased to `https://a7-laundry-mos.vercel.app`; anonymous access still redirects to login.
- GSC-evidence deployment `dpl_7s9vVpstxsBsmGL8sdZmebCHjMrM` is Ready and aliased to `https://a7-laundry-mos.vercel.app`; both dashboard and KPI data still redirect anonymous requests to login.
- The operating KPI panel now opens by default in Brazilian Portuguese; platform identifiers, technical event names and actual search queries remain unchanged to preserve source evidence.
- Portuguese MOS deployment `dpl_4hkNKypa6HKZ7kC4jooCu8A8b55t` is Ready and aliased to `https://a7-laundry-mos.vercel.app`; production probes confirmed the Portuguese login and anonymous redirect protection.
- Optimization sprint defines six prioritized actions, a no-budget-increase first cycle and an initial target of reducing cost per conversation from US$20.12 to ≤ US$18 without discounting the service.
- Four 1080×1920 challengers were generated with the built-in image tool, composed with the official A7 logo, visually checked, hashed and approved as NOT PUBLISHED candidates.
- Current winners remain controls; Meta publication and any budget change require a separate manual approval.
- Action-plan and creative-test MOS deployment `dpl_4qzNkxbqAnDXxhFtuaz41iggfQ6Y` is Ready at `https://a7-laundry-mos.vercel.app`; anonymous probes confirmed both the dashboard and test-creative assets remain protected by login.
- Post-deploy anonymous probes confirmed both the dashboard and KPI data redirect to login; the custom `mos.a7laundry.com` alias still requires working DNS resolution.
- Owner confirmation on Jul 22 identifies guest wash-and-fold by the pound as the only service with confirmed sales; comforters and blankets have zero confirmed sales. Exact order count and revenue were still unavailable at that checkpoint and were reconciled on Jul 23.
- On Jul 23 the owner reconciled six guest-laundry orders totaling US$491: 48, 48, 155, 140, 50 and 50 USD. The two 48 USD orders came from the same customer; ad-level attribution and variable cost remain unavailable.
- The same-period comparison against US$543.17 total Meta spend is displayed only as a 0.90x owner-reported gross blended ROAS, never as margin or ad-level ROAS.
- The owner confirmed the official tourist minimum as US$50, matching `MANIFESTO.md`; campaign documentation was corrected and T5/T6 were quarantined because their pixels still contain the stale US$60 minimum.
- Invalid Spanish-language contacts seeking relationships are recorded as a lead-quality pattern, not counted as qualified laundry leads.
- The next paid cycle is therefore proposed at 80% proven guest-laundry controls, 20% guest-laundry challengers and 0% comforter/blanket spend, with no total-budget increase and no publication before explicit approval.
- Guest-laundry challengers T5/T6 remain protected test candidates; comforter challengers C3/C4 are archived as `BACKLOG — NÃO PUBLICAR` rather than treated as validated demand.
- Sales-reprioritized MOS deployment `dpl_CeXJmGa3zSHsT9CGiHWAaKscdY5J` is Ready at `https://a7-laundry-mos.vercel.app`; production probes confirmed anonymous dashboard, KPI and creative requests redirect to login.
- Meta cutover on Jul 22 paused mixed campaign `120248527506970261` and activated manual guest campaign `120249142919120261` with ad-set budget US$30/day, manual Facebook/Instagram Feed/Stories/Reels placements and Advantage+ audience disabled.
- Active first-cycle ads are A4 control `120249142929850261`, A3 control `120249142930300261`, LA7 Lovart challenger `120249142930930261` and LA8 Lovart challenger `120249142931360261`; T5/T6 remain created and paused for the next round.
- Post-cutover verification found exactly one active US$30/day delivery path; AS1 comforter remains paused and the old campaign was paused before the new campaign was activated.
- Updated protected MOS deployment `dpl_H5eJqapQHcvj6ron15tCAR5EbRg5` is Ready. Anonymous dashboard and KPI requests redirect to login at `https://a7-laundry-mos.vercel.app`; custom `mos.a7laundry.com` still lacks DNS resolution.
- Jul 23 revenue/pricing deployment `dpl_BsP8a28SwHzNaEMVFFQyoGU5fR3U` is Ready. The protected MOS now exposes six owner-reported orders, US$491 revenue, 0.90x gross blended ROAS, the US$50 minimum and OP1 as approved/not published.
- Post-deploy probes confirmed anonymous dashboard and KPI requests still redirect to login. `mos.a7laundry.com` remains assigned in Vercel but unresolved in public DNS.
- Meta Business Suite read-only audit on Jul 24 confirmed Pacific Time reporting, 12 unique feed pieces, 206 Facebook views and 562 Instagram views for Jun 24–Jul 24.
- The Instagram export records 35 likes and two comments but zero saves, shares and follows; the Facebook export records 14 combined interactions, including 12 shares and zero clicks.
- Four CSV downloads were present locally, but SHA-256 reconciliation found only three unique files and one exact duplicate. The browser report's claim of five downloads remains recorded but unconfirmed.
- Three canonical Meta organic CSVs are archived with immutable hashes; the original Downloads files were preserved.
- Planner has no export action. Its visual read identified Jul 24–27 as saturated, Jul 28 and Aug 2 as occupied, and Jul 29–31, Aug 1 and Aug 3 onward as the next available windows.
- Jul 30 at 10:00 in the Planner was recorded as a recommendation only and was not scheduled. The compositor timezone must be checked before publishing because the account reports in Pacific Time.
- Jul 24 Meta Ad Library scan found 10 active ads across four concepts for The Laundry Room, two active catalog ads for Orlando Cleaners and four recently launched A7 ads. The other seven named local advertisers returned no reliable active-ad match.
- The Laundry Room's strongest public signals were five variations of its convenience/pickup concept and one catalog concept active since Oct 2024. These are longevity and repetition proxies, not evidence of sales or ROAS.
- The A7 was the only advertiser found making hotel/Airbnb the central offer and the only advertiser found using Portuguese. The recommended challenger adapts the competitor's proven structure to real front-desk pickup evidence without copying assets or discounting the current US$50 minimum.
- Jul 24 Google Ads read-only audit confirmed account `290-113-2891`, BRL currency, Brasília timezone, 5 campaigns, R$4,714.27 historical spend, 18 call conversions and R$261.90 average call CPA. Sales, revenue and ROAS remain unavailable.
- Google Ads delivery is classified critical because only R$0.10 of funds remain. Three campaigns are enabled, but the account is effectively not delivering; no funds were added and no settings were changed.
- The protected MOS now exposes a dedicated Google Ads filter, account/campaign KPIs, search-term and geography evidence, identity conflicts and P0 remediation actions without mixing BRL history with Meta USD reporting.
- Google Ads MOS deployment `dpl_FR6XF2p5wnSbNSeWiGHHBgFwQ5nz` is Ready and aliased to `https://a7-laundry-mos.vercel.app`. Anonymous dashboard and KPI requests redirect to login; `mos.a7laundry.com` remains assigned but unresolved in public DNS.
- Custom domain `mos.a7laundry.com` is assigned in Vercel and awaits the required HostGator DNS record.
- `vercel build --prod` passed.
- Production deployment: `dpl_2bFWxbGsVvLJrEmrrwyQqPjwyyGj`, aliased to `https://a7laundry.com`.
- HTTP 200: home, comforter, comforter confirmation and live tracking script.
- HTTP 404: `/_preview-edu.html`, which was identified as an internal preview and removed from the production bundle.
- The in-app visual browser could not initialize in this environment, and the public PageSpeed API returned daily quota exhaustion. Visual/Lighthouse scoring remains a follow-up rather than an A7-003 blocker.
- Generic guest confirmation deployment `dpl_okx7zVkZrTYMga62zR7JFciJzicn` is Ready and aliased to `https://a7laundry.com`; `/guest-payment-confirmation` returns HTTP 200 and invalid Checkout Session IDs return a sanitized HTTP 400.
- Production does not yet have `STRIPE_SECRET_KEY`; valid-looking sessions therefore fail closed with HTTP 503 and cannot claim payment success or emit purchase events.
- Stripe Payment Links remain unchanged. After the server key is configured, their post-payment redirect must be set to `https://a7laundry.com/guest-payment-confirmation?session_id={CHECKOUT_SESSION_ID}`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `vercel build --prod` and `git diff --check` passed for the generic guest confirmation delivery.
- `STRIPE_SECRET_KEY` was confirmed encrypted for Preview and Production without exposing its value. Deployment `dpl_3jYk39WVjg2k9cC4KFWJjYjqFq9V` is Ready and aliased to `https://a7laundry.com`.
- A production probe using a fictitious `cs_live_…` identifier returned the expected sanitized HTTP 404 from Stripe rather than the earlier configuration HTTP 503, confirming that server-side authentication is active without creating or modifying a payment.
- Jul 25 AI/search audit found 96 source sitemap URLs and 35 templated local/resort pages with at least one visible-text Jaccard similarity pair at or above 0.90; the highest observed pair was 0.989.
- The 35 scaled pages remain available for editorial revision but production now emits them as `noindex, follow` and removes them from the public sitemap. The production sitemap contains 62 focused URLs.
- Public entity facts were reconciled across the homepage, the new `/about` page, the Guest Laundry landing and `llms.txt`. Fixed response-time, fixed Express schedule, unverified re-wash guarantee and unconfirmed real-time availability claims are excluded from the AI fact layer.
- Homepage structured data now connects the canonical `LocalBusiness`/`LaundryService`, `WebSite` and `WebPage` entities without self-serving `aggregateRating` markup. The 5.0/23 review reference remains visible and dated to its last project verification rather than represented as immutable.
- OpenAI `OAI-SearchBot` access remains explicitly allowed. The production IndexNow key and five core URLs were validated, then accepted by the IndexNow endpoint with HTTP 202.
- AI/search production deployment `dpl_7LwSKTYLxUrW7R1Ap4M6A8Fqssfp` is Ready and aliased to `https://a7laundry.com`. Live probes returned HTTP 200 for `/about`, `/llms.txt`, `/sitemap.xml`, the IndexNow key and a quarantined page; the quarantined page contains `noindex, follow`.
- Native Google Ads purchase action `A7 Guest Laundry - Stripe purchase` retains dynamic value, all-conversions counting, a 90-day click window and data-driven attribution, but is secondary for acquisition after the owner confirmed that every sale begins in WhatsApp. Enhanced conversions remain unconfigured.
- Production deployment `dpl_3zPStP1tRFhX5WMJW98rq9FqxBR9` is Ready and aliased to `https://a7laundry.com`. Live source verifies Google tag `AW-17146169189` and the purchase destination `AW-17146169189/dkpRCJyC19YcEOWO9-8_`; the event is emitted only after a paid Stripe session and carries Stripe session ID, value and currency.
- Search campaign `24072699595` was created with a future Aug 1 start, then immediately paused before any impression or spend. Search Partners, Display and AI Max resource optimization remain off; English, presence-only Orlando-area targeting, R$70/day and R$18 max CPC remain configured.
- Google required account reauthentication while saving the Airbnb group. The campaign remains paused with only the Hotel group fully persisted until the owner completes the Google identity challenge.
- Google Cloud project `a7-laundry-mos` now exposes the Google Analytics Data API, Search Console API and IAM Service Account Credentials API. Service account `mos-readonly@a7-laundry-mos.iam.gserviceaccount.com` has GA4 Viewer access to property `543807649` and restricted Search Console access to `sc-domain:a7laundry.com`.
- Vercel production authenticates through Workload Identity Federation pool `vercel-mos-production` and provider `vercel-a7-laundry-mos`. The IAM binding accepts only subject `owner:dennis-a7s-projects:project:a7-laundry-mos:environment:production`; no long-lived Google JSON key was created.
- Protected endpoint `/api/google-kpis` returns a versioned contract with source, requested period, fetch timestamp, freshness, per-source availability and sanitized errors. Missing configuration or upstream failure never manufactures a numeric zero.
- The browser bundle contains only the protected relative endpoint. Google project number, service-account identity and workload-provider identifiers remain server-side Vercel environment values.
- Thirteen MOS tests passed, including authentication, OIDC configuration, read-only scopes, contract provenance, valid API zero semantics, unavailable-source semantics, live UI reconciliation, escaped GSC queries and dated-snapshot fallback. Root `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check` also passed.
- Live production validation on Jul 26 confirmed both sources as `API AO VIVO` for Jun 24–Jul 23: GA4 reported 73 active users, 105 sessions, 48.6% engagement and 17 key events; Search Console reported 26 clicks, about 1.63K impressions, 1.6% CTR and 18.5 average position.
- Live-data MOS deployment `dpl_HTBKpRqoLEyj4SmxisJPy5VPuCbP` is Ready. The authenticated browser loaded live GA4/GSC values through the protected endpoint while preserving the dated snapshot for every other source; no campaign, budget or delivery setting was changed.
- Anonymous production probes redirect both the dashboard and `/api/google-kpis` to login. `mos.a7laundry.com` remains assigned in Vercel but still does not resolve in public DNS; the working protected URL remains `https://a7-laundry-mos.vercel.app`.
- On Jul 26 the HostGator authoritative zone accepted `A mos.a7laundry.com 76.76.21.21` with TTL 14,400 seconds. The existing root, `www`, mail, MX and verification records were left untouched; public resolution remains pending within the DNS propagation window.
- Meta Business read-only setup review found the existing `Conversions API System User` (`61578413912697`) with no assigned assets and no usable MOS token. A durable Meta connection still requires assigning ad account `650201661142284`, granting insights-only permissions and generating/storing a server-side token without exposing it to the browser.
- Google Ads account `290-113-2891` reports that API Center is available only to manager accounts. Native Google Ads API access therefore requires a manager account, account linking and a developer-token application; the current advertiser account alone cannot issue the required API credential.
- Jul 29 MOS remediation added the native Google Ads v24 read-only contract for account, campaign, ad, responsive-search creative, daily performance, search-term and conversion-action reporting. The v24 endpoint remains supported and avoids coupling the MOS to the newly released v25. The developer token is accepted only from protected server configuration and is excluded from every response.
- Paid-media periods are now independent from the three-day Search Console latency. Meta uses its account reporting day; Google Ads uses the account timezone and includes the intraday current day.
- Current Meta campaign, ad set, ad, creative and delivery metrics now come from the Meta Marketing API. Google Ads current state remains unavailable while the upstream API returns HTTP 500; the Jul 24 R$0.10 balance and historical campaign statuses are explicitly prevented from representing the present.
- Twenty-eight protected-MOS tests pass across native Google live, GA4-linked partial, unavailable, transient-retry, Meta live and secret-redaction states.
- MOS deployment `dpl_DBUdtwNrEE6EX5eFxUvAF72R4vgV` is Ready and aliased to `https://mos.a7laundry.com`. Authenticated production labels Google Ads as `NATIVA PENDENTE`, Meta Ads as `API AO VIVO` and exposes four current active Meta ads; anonymous access remains protected by the login middleware.
- The Jul 29 authenticated production read reported one active Meta campaign, one active ad set, four active ads, US$774.78 spend and 37 messaging conversations for Jun 30–Jul 29. The API could not verify the active ad set's WhatsApp destination field, so the official `+1 407-670-8839` gate remains fail-closed rather than falsely verified.
- Google Ads manager `A7 Intelligence Manager` (`621-654-1066`) sent and completed the owner-approved link to Orlando advertiser `290-113-2891`; the advertiser and manager interfaces both confirm the active relationship.
- Service account `mos-readonly@a7-laundry-mos.iam.gserviceaccount.com` was recognized by Google Ads and added with `Somente leitura` to both the manager and the Orlando advertiser. No campaign, ad, keyword, bid, budget, conversion action or billing setting was changed.
- The existing developer token with Analytics/Explorer reporting access is stored as an encrypted Vercel Production secret. `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_API_VERSION=v24` and `GOOGLE_ADS_ACCOUNT_TIME_ZONE=America/Sao_Paulo` are configured server-side; the token value was removed from the clipboard and never entered repository files or the browser bundle.
- Google Cloud project `a7-laundry-mos`, authenticated as `a7laundry.usa@gmail.com`, now confirms `googleads.googleapis.com` with status `Ativadas`.
- Production deployments through `dpl_HjupeeymHvhVKHqU2gRpqU62A8e3` are Ready and aliased to `https://mos.a7laundry.com`. Authenticated validation keeps GA4, Search Console and Meta as `API AO VIVO`, while Google Ads truthfully remains `NÃO CONECTADO` because all native report attempts currently receive upstream HTTP 500.
- The native transport now uses the official `SearchStream` read-only method with explicit JSON headers, sequential reports and bounded exponential retry for HTTP 429/500/502/503/504. Persistent failure remains unavailable and never becomes zero performance.
- Jul 31 direct WhatsApp reconciliation found that the prior 19-thread audit mixed 12 new leads, three repeat orders and four non-funnel contacts. Three service-response failures are confirmed, one audio response remains unclassified, and the confirmed quoted denominator is eight rather than seven; the descriptive close rate is therefore 2/8 = 25.0%, not 28.6%.
- Nine current-price quick replies were installed in the Orlando WhatsApp Business account. The approved onboarding assets already show the US$50 minimum. Mobile-only greeting/away configuration, real service hours, primary/backup ownership, coverage, Express capacity, pressing pricing and variable costs remain explicit operating decisions rather than inferred values.
- Jul 31 owner decisions now define the operating contract: customer contact is declared 24/7;
  Dennis owns first response and A7 Laundry — Backup 1 is escalated after five minutes; addresses
  are confirmed within up to 40 km of Orlando; custom services normally target 48h but always
  require unit confirmation; Express requests are accepted until 6 PM and later requests are
  evaluated case by case; B2B can start at US$1.95/lb depending on volume, frequency, scope and
  capacity. Historical recovery contacts were closed without messages by owner decision.
- WhatsApp Business now contains verified current versions of `/precoen`, `/precopt`,
  `/pressingen` and the newly created `/b2ben`. The public location note states the 40 km limit;
  the radius selector was not rounded up to its only larger option (50 km). The invalid legacy
  map coordinate still requires removal in the mobile profile.
- Public JSON-LD hours were normalized to 24/7 and the old noon Express cutoff was removed from
  the source corpus. Static/build gates now reject the stale cutoff, malformed `6 PM:00 PM` text
  and legacy 07:00/08:00 schema openings.
- Aug 7 Measurement V2 Phase 0/1 foundation centralizes public business/measurement constants,
  inventories 864 contact/booking links and scans 105 production-source executable files for the
  official WhatsApp destination and legacy numbers. Attribution V2 uses a 128-bit opaque ID, a
  50-bit ten-character short reference, immutable first touch, external-entry-only last touch and
  a same-origin/rate-limited shadow API with a replaceable storage contract. The current adapter is
  explicitly ephemeral and creates no persistent cookie while consent is unknown.
- The public build injects the three foundation modules before unified tracking. Dynamic WhatsApp
  CTAs are normalized again at click time; module/API/Google-tag failures never cancel navigation.
  The existing `AW-17146169189/dhI0CO_7xNgcEOWO9-8_` action remains single-fire, raw click IDs and
  UTMs are excluded from GA4 event payloads, and Stripe/payment logic was not changed by this phase.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, focused attribution/tracking
  tests, the business-destination scan and `git diff --check` pass. The pre-existing internal
  untracked `payment-link.html` has an explicit acquisition-tracking build exemption; its Stripe
  behavior remains untouched.
- Aug 16 produced and visually inspected a five-slide English 1080×1350 Guest Laundry
  carousel with hotel/Airbnb pickup flow, Normal 24h from US$3.25/lb, Express 8h from
  US$3.95/lb subject to availability, US$50 minimum and the official WhatsApp CTA. The
  ImageGen source photos, deterministic build script, caption and validation gate are
  versioned; the package is approved as an asset but remains unpublished.
- The live Google Search preflight now rejects the actual obsolete pre-8h Express variants
  instead of incorrectly rejecting the current 8h language. Landing, attribution and
  commercial checks pass against production.
- Aug 22 refreshed and released the existing Orlando money page without creating a new slug or
  changing Google Ads, GA4 or Search Console. The page owns broad traveler pickup/delivery
  intent, preserves `#how`, `#pricing`, `#care`, `#areas` and `#questions`, and replaces Tailwind,
  Material Symbols and the stale numeric review claim with extractable offer/operation answers,
  exact 10-question FAQ/schema parity, original responsive illustrative imagery and the unified
  `SEO-ORLANDO-MONEY-V2` WhatsApp/SMS path. Exact CDP renders at 390×844 and 768×1024 have no
  horizontal overflow; the mobile CTA is inside the first viewport and all visible targets meet
  the 44px gate. Desktop Chrome inspection confirmed the first-view offer/CTA, responsive images,
  payment badge and five JSON-LD entities. `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build` and `git diff --check` pass. Current GA4/GSC URL evidence was unavailable in the
  active authorized context and is recorded as unavailable rather than zero. Preview
  `dpl_ENBRJg6vKAtNEndtofH9sMpaqoQj` was promoted to READY production
  `dpl_8mzMMHy2q6ZFPJV4HKgPMLwtgV6J`; HTML, hero, tracking and sitemap are byte-identical to the
  approved artifacts. Public Chrome and exact 390×844 CDP smoke passed with no first-party error.
  Rollback is `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9`. Evidence is archived in the forensic and release
  reports dated 2026-08-22.
- Aug 22 Taste Skill candidate applies a bounded anti-template polish to the existing Orlando money
  page: repeated uppercase eyebrow labels were reduced from eight to three, the equal three-column
  audience grid became an editorial hotel-led composition, guest copy was humanized, and the trust
  section now points to public operational channels without inventing reviews or photographic proof.
  Restrained hover/pressed states and reduced-motion behavior were added without a dependency.
  Independent QA passed source/dist inspection and Chrome renders at 320×568, 390×844, 768×1024 and
  1440×900 with no overflow, clipping or overlap. Canonical, anchors, exact 10/10 FAQ/schema parity,
  Standard/Express pricing and qualifiers, US$50 minimum, three WhatsApp and two SMS paths, complete
  `SEO-ORLANDO-MONEY-V2` prefills and local tracking remain intact. `npm run lint`,
  `npm run typecheck`, `npm test`, `npm run build:public` and `git diff --check` pass. Protected
  preview `dpl_BJWE6BuRG9dkQeVBXVkGmBtkdGvK` is READY at
  `https://a7-laundry-orlando-ns5o1th4y-dennis-a7s-projects.vercel.app`; authenticated download
  confirmed HTTP 200 and byte identity with built HTML `53b057e4176bb5b7e28049c8e2921377837ad1dbb3d68e087288f180e0392390`.
  After explicit owner approval, that exact preview was promoted without rebuild to READY production
  `dpl_98FASVxTNWedYknntjBgDte5N7mh`. Public HTML, hero, tracking and sitemap match the preview hashes;
  public 390×844 and 1440×900 smoke passed canonical, anchors, 3 WhatsApp, 2 SMS, complete prefills,
  five schema entities, exact 10/10 FAQ parity, images, targets and overflow. Rollback is
  `dpl_8mzMMHy2q6ZFPJV4HKgPMLwtgV6J`.
- Aug 24 live forensic remediation compares GA4/Search Console for Aug 1–24 against Jul 8–31,
  preserves the Jul 25–Aug 23 Google Ads period separately and excludes the wrong-country Meta
  organic asset. The Stripe confirmation now ignores payment-processor referrer acquisition,
  returns only a validated opaque `A7 Ref` from paid-session metadata and emits it as
  `lead_reference`; operator notes, click IDs and PII remain excluded. The one-use payment-link
  tool validates that reference, while the legacy Lake Buena Vista `.html` route permanently
  redirects to the clean canonical. In Google Ads account `290-113-2891`, the owner-authenticated
  UI confirmed 11 primary Stripe purchases and 47 primary WhatsApp clicks for Jul 25–Aug 23;
  WhatsApp was temporarily changed to secondary observation-only and remained secondary after
  reload. After the owner clarified that every customer must enter through WhatsApp before Stripe,
  the change was superseded: WhatsApp was restored to primary and Stripe was changed to secondary,
  with both states confirmed after reload. No campaign, budget, bid, keyword, ad, billing or
  delivery setting changed. Append-only MOS audits preserve the checkpoint, superseded change and
  WhatsApp-first correction. `npm run lint`,
  `npm run typecheck`, `npm test`, `npm run build` and `git diff --check` pass; 44 root TAP tests,
  62 MOS tests and 14 immutable MOS audits validate. The existing comforter canonical
  adjudication warning remains open and unrelated. Public-site and MOS deployment are pending the
  project DevOps release boundary.
- Aug 24 DevOps continuation promoted the exact prebuilt public Preview
  `dpl_FxwDkGsbSMrVqLkm3z5uaF9GEBUD` without rebuild to production
  `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`; local, Preview and production hashes match for tracking,
  guest confirmation and payment-link artifacts. Public HTTP smoke passed the LBV 308, clean
  canonical, noindex confirmation, referral-ignore tracking and fail-closed API contracts.
  Public rollback is `dpl_7KRoef7F2mV3P1WSRV2waxSV5j9t`. The MOS compiled 15 immutable audits,
  passed 62/62 tests, deployed protected Preview `dpl_3hbMZkLrrP2BjN5BKAReriAVS4vs` and promoted
  it to production `dpl_5kTgmvXEacvMcGcr5X2kGSqnhfWB`. Anonymous production requests to the
  ledger and Google KPI API redirect to login; the login remains private/no-store, noindex and
  frame-denied. MOS rollback is `dpl_FKnLn5W8vrLH9drFXk66jXRgoXGq`. The prior authenticated MOS
  browser session had expired, so no credential was recovered or bypassed; authenticated live-data
  smoke remains a monitoring follow-up rather than being represented as passed.
- Aug 24 WhatsApp-first correction superseded the temporary purchase-led account state after the
  owner confirmed that every sale begins in WhatsApp. `A7 - WhatsApp click (site)` is primary and
  `A7 Guest Laundry - Stripe purchase` is secondary; both persisted after reload. The Claude
  30-day audit was adjudicated item by item, and no recommended bid, schedule, device, geography,
  keyword, negative, budget or RSA mutation was applied from its small mixed-conversion sample.
  The 16-audit MOS ledger passed 44 root TAP and 62 MOS tests. Protected Preview
  `dpl_HbzBqyGTUfZz42Tv5XssD2KWAZ9V` was promoted without rebuild to READY production
  `dpl_35XV8TDcfi46KokAdDtAkwQtDgj8`; anonymous login, ledger and API boundaries passed. Rollback
  is `dpl_5kTgmvXEacvMcGcr5X2kGSqnhfWB`. Authenticated dashboard data smoke remains unclaimed
  because no active MOS session was available.
- Aug 26–27 recovery work preserved the live Vercel production deployment
  `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` and prepared a bounded source candidate instead of changing
  campaign economics. On screens up to 620px, one `wa-fab` WhatsApp path now appears only after
  the original hero CTA leaves the viewport; it retains the official number, complete intake
  prefill and `SEO-ORLANDO-MONEY-V2`, while desktop remains unchanged. Chrome checks at 390×844
  and 1440×900 passed visibility, safe-area, no-overlap and no-overflow conditions. The candidate
  has four WhatsApp and two SMS paths, and the site validator now fails closed on that contract.
  Two visually inspected, text-free Google Ads derivatives were prepared at 1200×628 and
  1200×1200. Account `290-113-2891` and the active campaign were selected, but Chrome blocked the
  file transfer because the ChatGPT extension lacks file-URL access; no asset was uploaded or
  saved and no account setting changed. `npm run lint`, `npm run typecheck`, `npm run build`, the
  static/public validators, destination guard, 44 root TAP tests, tracking/attribution tests and
  62 MOS TAP tests pass. The complete `npm test`/MOS compile remains blocked by a pre-existing
  immutable-ledger mismatch: audit `2026-08-24-attribution-canonical-release` expects SHA-256
  `18b07f6a...`, while the tracked evidence file at HEAD hashes to `a8a878d1...`; this recovery did
  not modify either immutable artifact.
- Aug 28 P0 operational attribution implementation applied additive Supabase migration
  `20260828020000` after two isolated PostgreSQL 15 smoke passes. The local server candidate now
  separates `order_accepted` from `purchase`, freezes the attribution snapshot, binds Payment
  Links to an invoiced order, verifies raw Stripe webhook signatures and deduplicates payments by
  stable PaymentIntent ID. Browser confirmation is informational and Stripe metadata is limited
  to `order_id`, `lead_id` and `contract_version`. Root lint, typecheck, focused 11-test P0 suite,
  confirmation security test, build and diff check pass. The full root test reaches 55 passing
  tests and then stops at the same pre-existing immutable-ledger hash mismatch. No application
  deployment or Google Ads change was made. Release remains blocked on Vercel webhook/API/GA4
  secrets, Stripe test-mode QA and GA4 editor access for removing `money_page_view` as a key event.
- Later on Aug 28, the owner authorized the five isolated Preview actions. Additive migrations
  `20260828020000` through `20260828050000` are applied, and protected branch Preview deployment
  `dpl_EDvRQCc1tfVLNUJMuKpaiPjk8jF3` is READY at
  `https://a7-laundry-orlando-n0nqul2j8-dennis-a7s-projects.vercel.app`. Its runtime contains the
  seven required branch/deployment-scoped variable names without exposing their values. Stripe
  endpoint `we_1U9VJ8DcFmXJh57PFy7UUfT3` is test-mode only and subscribes to completed,
  asynchronous success/failure, expiration and refund lifecycle events. Authorized `/order`
  returns 200, the protected route redirects without authorization and an invalid webhook
  signature returns 400. Synthetic run `QA-A7-1787945074393` passed durable lead creation,
  qualification, acceptance, pickup, weighing, invoice, test Payment Link, failed → void → paid
  reconciliation, duplicate-webhook idempotency, delivery, full refund and repeat-order continuity.
  The analytics ledger/outbox PII scan passed. Cleanup left zero matching leads, orders and contacts;
  the Payment Link was deactivated, products archived and all 16 related test prices deactivated.
  `npm run lint`, `npm run typecheck`, the focused 11/11 operational suite, attribution V2,
  `npm test` (63/63 root and 62/62 MOS) and `npm run build` pass. This supersedes only the stale
  Preview/test blocker statements above: Production remains unchanged and unauthorized, GA4
  Editor/Measurement Protocol access remains unavailable, `money_page_view` has not been changed,
  and no Google Ads goal, bid, budget or campaign setting changed. Contract §16 therefore remains
  partially open for deterministic tagged-entry attribution, browser CTA evidence and GA4
  DebugView/no-PII evidence.
- The final Aug 28 Preview hardening applied migrations `20260828060000` through
  `20260828100000`, completing financial event fidelity, lifecycle transitions, semantic
  idempotency, privacy-safe operational reporting and lead collision protection. Protected
  Preview `dpl_7SjMtjZF31iDpbrHhsEBzoL1v9La` is READY; test-mode Stripe endpoint
  `we_1U9WD0DcFmXJh57PM4SlnexS` is enabled for the six exact checkout/refund events handled by
  the server. A tagged real-browser entry created a durable A7 reference, and exactly one
  WhatsApp activation produced one sanitized `whatsapp_click`. Synthetic run
  `QA-A7-1787949500000` then proved deterministic snapshot freezing, order creation before weight
  or revenue, acceptance retry idempotency, and the landing-page row 1 lead → 1 qualified → 1
  accepted → 0 paid / $0 revenue. Independent cleanup verification returned zero matching leads,
  orders, events and attribution sessions. The opt-in Preview diagnostic is unavailable on the
  production hostname and exposes only masked IDs, source/medium, boolean click-ID presence and
  event names. Production, GA4 key-event configuration and Google Ads remain unchanged; contract
  §16 now has only check 13 partial, pending GA4 Measurement Protocol/DebugView evidence. Final
  gates pass with 71/71 root tests, 66/66 MOS tests, lint, typecheck and repository build. The
  attribution change scope passes `git diff --check`; five unrelated Aug 24 Ads evidence files
  retain their pre-existing whitespace findings and were not modified for this phase.
- Security cleanup removed obsolete Stripe test endpoint `we_1U9VJ8DcFmXJh57PFy7UUfT3` after
  confirming that its old URL embedded the project-wide Vercel automation bypass. The final
  endpoint has the exact six-event scope, but its protected alias deliberately omits that legacy
  token and is not yet claimed as externally reachable. Vercel shows one unnoted bypass added Jul
  24, and its other consumers are unknown. A dedicated Stripe-QA bypass plus explicit authorization
  to revoke the legacy token are required before the final signed-delivery probe.
- The owner then authorized a dedicated Stripe-QA bypass. Vercel now shows two masked bypasses:
  the Jul 24 project-wide system entry and a separate non-system entry labeled `Stripe-QA`.
  Protected Preview `dpl_GvKKuXdVHKrvucSDn4b2hjrNzjdq` is READY at
  `https://a7-laundry-orlando-p193prhv8-dennis-a7s-projects.vercel.app`, and the stable test-only
  alias remains `https://a7-attribution-qa-dennis-a7s-projects.vercel.app`. Test-mode Stripe
  endpoint `we_1U9WaIDcFmXJh57PGw4oFeVX` subscribes only to the six supported checkout/refund
  events. A correctly signed non-financial ignored-event probe returned HTTP 200 first on the
  unique deployment and then on the stable alias; only after both checks passed was endpoint
  `we_1U9WD0DcFmXJh57PM4SlnexS` deleted. Secret values were transferred ephemerally, excluded from
  logs/evidence and cleared after the cutover. The project-wide bypass remains intact because
  repository consumers use `VERCEL_AUTOMATION_BYPASS_SECRET`; its migration/revocation requires
  separate authorization. Production, GA4 and Google Ads remain unchanged.
- Completion auditing found one event-time fidelity defect: analytics retries did not carry the
  immutable lifecycle `occurred_at` into GA4. Additive migration `20260828110000` now synchronizes
  a mandatory outbox timestamp from the event ledger, and `lib/ga4-server.js` emits it as
  `timestamp_micros`. The complete migration chain and functional SQL suite passed fail-fast in a
  clean PostgreSQL 15 container; isolated verification returned zero event/outbox timestamp
  mismatches and `is_nullable=NO`. The migration was applied remotely, and local/remote histories
  align through `20260828120000`. Official-protocol reconciliation also corrected
  `timestamp_micros` to the required numeric type, rejects stale/future timestamps rather than
  accepting GA4's silent 72-hour shift, and distinguishes strict validation from collected
  `debug_mode` events. Out-of-window events now become terminally `expired` instead of retrying
  forever. The focused Node suite passes 18/18. These corrections do not satisfy the
  still-open GA4 Editor/DebugView gate. The final post-correction repository run also passes lint,
  typecheck, all 71 root tests, all 66 MOS tests and the production bundle build; the scoped diff
  check and secret-value scan are clean.
- The authorized browser session switched to `a7laundry.usa@gmail.com` and confirmed access to
  GA4 property `543807649`; the earlier missing-permissions result belonged to the wrong Google
  account context. `money_page_view` was removed from key events and verified absent after a fresh
  reload while `purchase` remained enabled. Measurement Protocol secret creation is paused at
  Google's user-data collection attestation, which requires owner confirmation. A read-only Vercel
  parity audit also confirmed that Production lacks
  `OPERATIONS_API_TOKEN`, `STRIPE_WEBHOOK_SECRET` and `GA4_MEASUREMENT_PROTOCOL_SECRET`; these
  remain hard cutover gates.
- Public alias inspection identifies `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9` as the actual live rollback
  baseline. Production route probes return 200 for `/` and 404 for the candidate-only `/order`,
  Stripe webhook and operations lifecycle routes, proving there is no partial activation. The
  previously validated Stripe-QA Preview predates the final GA4 timestamp/expiry correction and
  must not be promoted as the final artifact; a fresh exact-worktree Preview remains required.
- Environment-parity review found that the operational and attribution stores selected Supabase
  URLs and keys from independent fallback chains. Both now resolve one complete credential pair
  atomically, preventing cross-namespace credential mixing under partial configuration. The
  focused operational suite passes 19/19 and Attribution V2 covers its own fallback chain;
  the final repository gates pass lint, typecheck, 76/76 root tests, 66/66 MOS tests and build.
- A three-profile release preflight now gates strict Preview validation, collected DebugView and
  steady-state Production independently. It checks configuration without printing values and
  fails closed for missing variables, mixed Supabase namespaces, wrong Stripe mode, wrong GA4
  stream or crossed debug flags. Four focused preflight tests pass, and a clean-shell Production
  invocation correctly exits nonzero with sanitized reasons only.
- The owner confirmed Google's user-data collection attestation and explicitly authorized storing
  the Measurement Protocol secret in Vercel Preview. The secret was created for GA4 property
  `543807649` / stream `G-JLQNRC7MK4` and stored as one encrypted, Preview-only variable scoped to
  branch `feat/meta-ads-ops-structure`; its value never entered repository files, URLs, logs or
  evidence. Strict Preview `dpl_6QHzZHLB6Tcwfy1Toz1TUbykDeHJ` accepted `order_accepted`,
  `purchase` and `refund` with zero `/debug/mp/collect` validation errors. Collected DebugView
  Preview `dpl_3Ucdu5tEm38YpQuH7M9r5pNDn6P6` displayed one of each event for probe
  `84efedd55e1b4806aaee`; inspected parameters contained only approved opaque IDs, categorical
  service/attribution fields, currency and value, with no customer PII or raw click IDs.
- Deduplication probe `9a23fbaf717a4515a6cb` on Preview
  `dpl_2ZyqCUncgRu35nvcGKY4KucDQyAF` sent the purchase once and rejected the second attempt as
  `already_sent`, leaving the outbox state `sent`. The focused suite now includes all three GA4
  payload semantics/PII allowlists and passes 20/20. Both GA4 debug flags were reset to `false`,
  and final clean Preview `dpl_9B8qsLHKiE82J25uDSc62CZmFAQf` is READY with the staging-only QA
  endpoint removed (HTTP 404).
- The normal Vercel remote build remains blocked because `.vercelignore` excludes `marketing/`
  while the build imports `marketing/growth/content-registry.mjs`; the GA4 proof therefore used a
  constrained prebuilt QA staging copy and is not a Production-ready artifact. Preview also
  resolves a live-mode Stripe key, so no Stripe financial call was attempted and a test-mode key
  remains mandatory for further financial QA. Production still resolves to
  `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`; `/` is 200 while `/order`, `/api/stripe-webhook` and
  `/api/operations/lifecycle` are 404. No Google Ads goal, bid, budget, campaign or billing setting
  changed. Production cutover remains explicitly unauthorized.
- The subsequent pipeline correction moved the governed authorial registry from the ignored
  `marketing/` tree to `governance/content-registry.mjs`; `marketing/` remains completely excluded
  and `build-site.mjs` still fails if any private path enters `dist/`. Standard Vercel Preview
  `dpl_4rvoSZHwTywrZPmVGbesJTjzV3mA` passed the normal remote `build:public` path. The Stripe CLI
  test credential was confirmed with `livemode:false` and transferred without disclosure to the
  exact branch-scoped `STRIPE_SECRET_KEY` sensitive variable. Runtime `/api/operations/preflight`
  returned HTTP 200, `ready=true` and 10/10 sanitized checks, including test-mode Stripe, GA4
  secret/stream, durable storage/tokens and both debug flags disabled. This supersedes the two
  blockers in the preceding chronological note; an exact committed-SHA Preview and the separate
  Production authorization gate remain.
- Exact commit `9a7bb0512f8d21f7c7996785407ef437a36c7401` then passed the standard Vercel
  pipeline as READY Preview `dpl_4ckN44QVvdaB8MTvjVA661ZyJvRp`. The branch-only runtime preflight
  passed 10/10, `/order` returned 200 and `/api/qa/ga4-probe` returned 404. Read-only Production
  inspection remained on `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`; `/` stayed 200 and all candidate-only
  operational routes stayed 404. Production preflight is therefore NO-GO pending its own secrets,
  webhook/runtime configuration and separate owner authorization; no Production or Google Ads
  mutation occurred.
- Aug 29 incident response found that commit `1f37b57fcb6613788598edeff9a4ec63a77ea429`
  reached READY Preview, but real attribution and order-intake calls failed because the configured
  Supabase project URL was stale. It also proved the runtime preflight was configuration-only and
  could falsely report 10/10. The corrective candidate now makes the existing storage gate perform
  read-only attribution-health and operational-table probes, returning sanitized
  `runtime_unavailable` on failure without adding a new gate. Core attribution, operational storage
  and MOS now omit `Authorization: Bearer` for `sb_secret_` keys while retaining temporary legacy
  JWT compatibility; focused header and connectivity tests pass. The separate unlinked WhatsApp
  Bridge active deployment remains a legacy-Bearer consumer and was not deployed. Its exact local
  source was minimally adapted with the same header rule and passes 8/8 Bridge tests; a read-only
  source comparison proves the active deployment still equals that local source before the fix.
  Vercel Preview and
  both Production project scopes were updated without deploy, but the installed Supabase CLI had
  returned a masked default key that the gateway rejected with HTTP 401. Those environment values
  are therefore not releaseable and must be replaced with a validated revealed key before any new
  deployment. Existing deployments remain on their immutable legacy environment. The compromised
  legacy key remains active because zero consumers is not yet true. Root lint, typecheck, 77/77
  root tests, 67/67 MOS tests and repository build pass; no Production deploy, Stripe financial
  action, Google Ads mutation or legacy-key deactivation occurred.
- The first authorized Core Production cutover reached READY deployment
  `dpl_8hLcyTMYX2SnMUzmQYP1pr4Qg3Sm`, and public smoke checks returned 200 for `/` and `/order`
  with the expected method guards on the operational APIs. The mandatory Production preflight
  could not be proven because Vercel excludes Sensitive values from both `env pull` and
  `env run`, while the runtime preflight was intentionally Preview-only. The stop condition was
  enforced before any financial action, and Production was restored to rollback deployment
  `dpl_BXf9sAAgBTYnmbE7ZF72VY45NaL9`. The minimal corrective successor keeps anonymous Production
  requests indistinguishable as HTTP 404, permits the existing sanitized 10-check preflight only
  with a valid `OPERATIONS_API_TOKEN`, and reuses the existing read-only Supabase connectivity
  probe. The focused preflight suite passes 9/9; lint, typecheck, the complete root/MOS test suite
  and the repository Production build also pass. No new gate, event, field, state or integration
  was introduced.
- Final Production credential remediation retained exact Core commit
  `718797bd4dca4bd910353d806e52c38b55c3a79b`. The exposed Stripe signing secret and unavailable
  `OPERATIONS_API_TOKEN` were rotated as Sensitive Production variables, and READY deployment
  `dpl_C5S8sFqPnNd9hA7NMGmDR4ys7doa` was aliased to `a7laundry.com`. Anonymous Production
  preflight remains indistinguishable as HTTP 404; the authenticated runtime preflight returned
  HTTP 200, `ready=true` and 10/10 checks with no failures. Only after that gate passed, a signed
  synthetic `a7.qa.ignored` event returned HTTP 200 with `received=true`, `ignored=true` and
  `duplicate=false`. The event carried no order, customer, payment or value and follows the
  unsupported-event path without an operational write. Stripe endpoint
  `we_1U9af6DcFmXJh57POBb10Nz9` remained disabled before and after the probe. Temporary credential
  files and named in-memory secret variables were removed. No financial flow, live webhook,
  Google Ads goal, bid, budget, campaign or billing setting was enabled or changed.
- After that closed probe gate, the owner separately authorized live webhook activation. Stripe
  endpoint `we_1U9af6DcFmXJh57POBb10Nz9` changed from `Desativados` to `Ativo` without changing
  its URL, signing secret or six-event scope: `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
  `checkout.session.expired`, `refund.created` and `refund.updated`. Post-activation public smoke
  returned 200 for `/` and `/order`, anonymous preflight remained 404, webhook GET remained 405
  and an unsigned synthetic POST was rejected with 400. No signed financial event, payment,
  refund, order mutation, Google Ads change or additional deployment was executed during
  activation; Production remains deployment `dpl_C5S8sFqPnNd9hA7NMGmDR4ys7doa`.
