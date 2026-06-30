# A7 Laundry — Article Template Guide (Phase 1E)

> **INTERNAL REFERENCE ONLY.** Not a published page. Not in `sitemap.xml`, not in `blog/index.html`, no route in `vercel.json`. Pairs with `blog/_TEMPLATE.html`.
> Use this as the official standard for the 15 new articles. Build one at a time, each approved → written → validated → committed → confirmed live.

---

## 0. Non-negotiable rules

- **Money page** = `/laundry-pickup-delivery-orlando`. Every article links to it when relevant.
- CTAs priority: **WhatsApp → SMS → Call**. Number: **(407) 670-8839** · `wa.me/14076708839` · `sms:+14076708839` · `tel:+14076708839`.
- **Conditional same-day only:** "ask for today's availability", "depending on availability", "Express availability may vary", "request pickup today". Never "guaranteed same-day".
- **No fabrication:** no invented address, reviews, ratings, customer counts, certifications or partnerships. **No `AggregateRating`** without approval.
- Prices (real): Normal **$2.90/lb** (24h) · Express **$3.20/lb** (6h) · free pickup & delivery · **$50 minimum**. Comforter from **$33**.
- Funnel terms (TOFU/MOFU/BOFU/PILLAR) are **staff-only** — never visible. Use friendly badges.
- FAQ **visible = FAQPage schema** (5–7 Q&A). Always include **BreadcrumbList**. Always a **GEO answer block** near the top.
- On the real article set `robots` to `index, follow` (the template file is `noindex`).
- Local hero images in `/blog/img/{{slug}}-hero.jpg` (provisional Unsplash OK; replace with A7 creatives later).

---

## A. Per-article checklist (fill before writing)

```yaml
slug:
seo_title:                 # <=60 char core + " | A7 Laundry"
meta_description:          # 150–160 char
h1:                        # must differ from the money page H1
primary_keyword:
secondary_keywords:        []
search_intent:             informational | commercial | transactional | local
funnel_stage_internal:     tofu | mofu | bofu | geo | persona   # never visible
friendly_badge:            # Guide | Tips | Compare | Booking | Same-Day | Near Disney | For Hotel Guests ...
persona:                   tourist | hotel | airbnb | vacation-guest | family | no-car | checkout
geo:                       orlando | i-drive | universal | kissimmee | winter-garden | windermere | clermont | ocoee
main_pain:
main_cta:                  # WhatsApp prefilled
secondary_cta:             # SMS body
money_page_link:           /laundry-pickup-delivery-orlando   # varied anchor
supporting_links:          # choose: /plans (price), /service-areas (geo), /comforter, /vacation (host only), pillar, 2 cluster
faq:                       # 5–7 Q&A (visible == schema)
schema_types:              [Article, FAQPage, BreadcrumbList, (LocalBusiness|Service)?]
hero_image_alt:
suggested_image_filename:  blog/img/{{slug}}-hero.jpg
gmb_snippet:
social_caption:
whatsapp_microcopy:
sms_microcopy:
include_meta_pixel:        true (BOFU/persona) | false (TOFU/geo)
include_sticky_cta:        true (BOFU/persona) | false
```

---

## B. Funnel variations (same skeleton, different dials)

| | BOFU | MOFU | TOFU | Geo | Persona |
|---|---|---|---|---|---|
| Title shape | "Need [X] in Orlando? [action]" | "[A] vs [B] in Orlando" | "How to [task] in Orlando" | "Laundry Pickup in [area], FL" | "Laundry Pickup for [persona] in Orlando" |
| Badge | Booking / Same-Day | Compare | Guide / Tips | [Area] | For [Persona] |
| CTA tone | direct/urgent (no spam) | consultative | soft | local | persona-specific |
| Required links | money page, /plans, /service-areas | money page, /plans, compared-pair article | money page, pillar | money page, **/service-areas**, pillar | money page, /service-areas, cluster |
| Extra schema | (Service) | — | — | **LocalBusiness(areaServed)** | Service |
| Meta Pixel / sticky | yes | optional | no | optional | yes |

---

## C. Internal-link rules

- Minimum **4 internal links/article**: 1 money page + 1 pillar/cluster + 1 (/service-areas OR /plans) + 1 cluster.
- `/laundry-pickup-delivery-orlando` → always (vary anchors).
- `/service-areas` → when an area/neighborhood is mentioned.
- `/plans` → when price/estimate is mentioned.
- `/vacation` → **only** host/turnover/vacation-rental operations.
- `/comforter` → comforter/bedding topics.
- Pillar `/blog/orlando-vacation-rental-laundry-guide` → vacation-rental/guide pieces.
- Don't repeat the exact same money-page anchor more than once per article.
- **Money-page anchors (rotate):** "laundry pickup and delivery in Orlando" · "Orlando laundry pickup service" · "schedule laundry pickup in Orlando" · "wash and fold pickup and delivery" · "request laundry pickup today".

---

## D. CTA library (button / block / final · WA prefilled · SMS body)

> WA = `wa.me/14076708839?text=` · SMS = `sms:+14076708839?&body=`

- **Tourist** — "Schedule Pickup" / "Don't waste vacation time on laundry — we pick up & deliver." / "Wash. Fold. Delivered." · WA `Hi! I'm visiting Orlando and need laundry pickup. My location:` · SMS `Hi! Laundry pickup in Orlando. My location:`
- **Hotel guest** — "Pickup from my hotel" / "Text us your hotel & room and a pickup time." / "Pickup from hotels across Orlando." · WA `Hi! I'm at a hotel in Orlando and need laundry pickup. Hotel & room:` · SMS `Hi! Hotel laundry pickup. Hotel/room:`
- **Airbnb guest** — "Pickup from my Airbnb" / "Send your address and we'll pick up." / "Pickup from Airbnbs across Orlando." · WA `Hi! I'm at an Orlando Airbnb and need laundry pickup. Address:` · SMS `Hi! Airbnb laundry pickup. Address:`
- **Vacation-rental guest** — "Schedule Pickup" / "We pick up from your rental, wash & fold, deliver back." · WA `Hi! I'm at an Orlando vacation rental and need laundry pickup.`
- **Family** — "Schedule Family Pickup" / "Theme-park days = piles of laundry. We handle it." / "Less laundry, more vacation." · WA `Hi! Family laundry pickup in Orlando — about __ lbs.`
- **Checkout/last-minute** — "Request pickup today" / "Checking out today? Ask for today's availability." · WA `Hi! I check out today in Orlando — can you do same-day laundry? Time/location:`
- **Same-day/Express** — "Ask for today's availability" / "Need it today? Express 6h, depending on availability." · WA `Hi! I need laundry today in Orlando — what's today's Express availability?`
- **Long stay** — "Set up recurring pickups" / "Here a while? Recurring pickup, same per-lb rate, no subscription." · WA `Hi! Long stay in Orlando — recurring laundry pickups?`
- **No car** — "We come to you" / "No car? Free pickup at your door." · WA `Hi! No car in Orlando — can you pick up my laundry? Location:`
- **Disney area** — "Pickup near Disney" · WA `Hi! Laundry pickup near Disney World. Location:`
- **Universal area** — "Pickup near Universal" · WA `Hi! Laundry pickup near Universal Orlando. Location:`
- **Kissimmee** — "Pickup in Kissimmee" · WA `Hi! Laundry pickup in Kissimmee. Address:`
- **International Drive** — "Pickup on I-Drive" · WA `Hi! Laundry pickup on International Drive. Hotel/address:`

Default fallback: WhatsApp "Schedule Pickup on WhatsApp" → SMS "Text us your location" → Call "(407) 670-8839".

---

## E. FAQ models (anchor questions by type)

- **BOFU/Checkout/Same-day:** "Can I get same-day laundry in Orlando?" · "What's the cutoff for same-day?" · "How much is Express?" · "Do you pick up from hotels/Airbnbs?" · "What if same-day isn't available?" · "How do I request pickup?"
- **MOFU/Comparison:** "Is [A] or [B] cheaper in Orlando?" · "What's the difference?" · "Which is best for tourists?" · "How fast is each?" · "How do I book pickup?"
- **TOFU:** "Can I do laundry without a washer in my rental?" · "Is laundry pickup worth it on vacation?" · "How does pickup & delivery work?" · "How much laundry does a family generate on a trip?"
- **Geo:** "Do you offer laundry pickup in [area]?" · "How much is laundry in [area]?" · "What areas near [area] do you serve?" · "How fast is delivery in [area]?" · "How do I book in [area]?"
- **Persona (hotel/Airbnb):** "Do you pick up from [hotels/Airbnbs]?" · "How do I arrange pickup from my [hotel/rental]?" · "How much does it cost?" · "How fast is it?" · "Do I need to be there for pickup?"

**Reusable price answer:** *"Wash & fold is $2.90/lb (Normal 24h) or $3.20/lb (Express 6h), with free pickup & delivery and a $50 minimum order."*

---

## F. GEO/AI answer blocks (2–3 sentences)

- **Pickup & delivery:** "A7 Laundry offers laundry pickup & delivery across Orlando. We collect from your hotel, resort, Airbnb or home, wash and fold, and deliver back — from $2.90/lb with free pickup. Book on WhatsApp at (407) 670-8839."
- **Same-day:** "Need laundry today in Orlando? A7 Laundry offers Express 6-hour pickup & delivery, depending on availability. Ask for today's availability — Express is $3.20/lb (vs $2.90/lb Normal)."
- **Hotel guest:** "Staying at an Orlando hotel? A7 Laundry picks up from your hotel, washes & folds, and delivers back — from $2.90/lb, free pickup. Text your hotel and room."
- **Airbnb guest:** "At an Orlando Airbnb? A7 Laundry picks up from your rental, washes & folds, and delivers back — from $2.90/lb, free pickup. Send your address on WhatsApp."
- **Checkout:** "Checking out of an Orlando rental today? Ask for today's Express availability — we may be able to pick up, wash & fold, and return before checkout. Express is $3.20/lb, free pickup."
- **Family:** "Theme-park days fill the hamper fast. A7 Laundry picks up your family's laundry, washes & folds, and delivers back — from $2.90/lb, free pickup. No laundromat, no lost vacation time."
- **Geo/local:** "A7 Laundry offers free laundry pickup & delivery in [area], FL. Wash & fold is $2.90/lb (Normal 24h) or $3.20/lb (Express 6h), with free pickup. Book on WhatsApp at (407) 670-8839."
- **Comparison:** "Comparing [A] vs [B] in Orlando? [B] is usually easier for visitors — A7 Laundry picks up, washes & folds, and delivers from $2.90/lb with free pickup."

---

## G. Images (provisional — replace with A7 creatives later)

| Type | Description | Alt text pattern | Filename | Stock search terms |
|---|---|---|---|---|
| Hero | Persona/geo scene | "{{keyword}} in {{geo}}" | `blog/img/{{slug}}-hero.jpg` | "laundry delivery doorstep", "{{geo}} vacation home", "family Orlando vacation" |
| Section | Support (machines, folded linens) | "Professional wash and fold laundry" | `blog/img/{{slug}}-section.jpg` | "commercial laundry machines", "folded towels stack" |
| CTA | Delivery/bag | "Laundry pickup and delivery in Orlando" | `blog/img/{{slug}}-cta.jpg` | "laundry pickup bag", "delivery van neighborhood" |

Rules: local path + SEO filename + descriptive alt; `loading="lazy"` on section/CTA, `eager` on hero. Provisional Unsplash `?w=900&q=80`.

---

## H. GMB / Social / WhatsApp / SMS snippets (generate per article)

```yaml
gmb_post:
  text: "{{GEO_ANSWER first sentence}} Free pickup & delivery. {{persona/geo}}."
  cta_button: "Book" -> /laundry-pickup-delivery-orlando?utm_source=gbp
social_caption:
  text: "{{persona hook}} 🧺 We pick up, wash & fold, and deliver. From $2.90/lb, free pickup. Orlando."
  hashtags: "#OrlandoLaundry #LaundryPickup #WashAndFold #{{Geo}} #VisitOrlando"
whatsapp_broadcast:   # opt-in audiences only
  text: "Need laundry handled in Orlando? We pick up, wash & fold, deliver back. From $2.90/lb. Reply to schedule."
sms_followup:
  text: "A7 Laundry: want us to pick up your Orlando laundry? Reply with a time & address. Free pickup."
```
Never include invented stats. Rotate one geo/persona per GMB post (avoid area-list spam).

---

## I. Anti-cannibalization matrix (15 new × existing)

| Risk | Primary URL | Support | Anchor support→primary | Intent to keep | Tech action |
|---|---|---|---|---|---|
| same-day existing × new tourist same-day | `/blog/same-day-laundry-orlando` (transactional) | `same-day-laundry-tourists-orlando` (awareness) | "same-day laundry in Orlando" | transactional vs awareness | link only |
| laundry-service × money page | `/laundry-pickup-delivery-orlando` | `laundry-service-orlando` (informational) | "laundry pickup & delivery" | comparative vs transactional | link only (done in 1D) |
| kissimmee × new Kissimmee long-tail | `/blog/laundry-kissimmee` (hub) | future long-tail | "laundry pickup in Kissimmee" | hub vs long-tail | link up to hub; no 2nd "laundry kissimmee" page |
| hotel article × money page | money page + `hotel-laundry-service-orlando` | mutual | "laundry pickup from hotels" | persona ≠ generic | link only; distinct H1/keyword |
| Airbnb article × vacation-rental (host) | `airbnb-laundry-service-orlando` (guest) | `vacation-rental-laundry-orlando` (host) | "Airbnb laundry pickup" / "turnover" | guest ≠ host | link only |
| Disney × Kissimmee × LBV | one URL per geo | pillar | area name | 1 geo keyword/page | geos link to pillar, not each other |
| I-Drive × Universal | separate URLs | pillar | "I-Drive" / "near Universal" | distinct geos | link only |
| **LBV** | **near-disney + disney-springs (existing)** | — | — | — | **no new LBV page** (reinforce existing) |

General: no new noindex/redirect/canonical expected — resolve by distinct intent + linking.

---

## J. Approved order of the 15 new articles

**Block 1 — personas & conversion (BOFU/persona):**
1. hotel-laundry-service-orlando
2. airbnb-laundry-service-orlando
3. laundry-before-checkout-orlando
4. hotel-vs-pickup-laundry-orlando (MOFU comparison)
5. family-vacation-laundry-orlando

**Block 2 — geo pages:**
6. laundry-international-drive-orlando
7. laundry-near-universal-orlando
8. laundry-winter-garden-fl
9. laundry-windermere-fl
10. laundry-clermont-fl
11. laundry-ocoee-fl

**Block 3 — TOFU/awareness:**
12. same-day-laundry-tourists-orlando
13. pack-less-orlando-trip-laundry
14. no-car-laundry-orlando
15. laundry-tips-orlando-vacation

> Lake Buena Vista: **no dedicated page** — reinforce existing near-Disney / Disney Springs articles.

---

## K. Build workflow per article

1. Approve title/angle (briefing).
2. Copy `_TEMPLATE.html` → `blog/{{slug}}.html`; set `robots` to `index, follow`.
3. Fill all tokens + checklist; keep/remove optional blocks per type.
4. Validate: 3+ JSON-LD blocks parse · FAQ visible == schema · ≥4 internal links · no fabricated numbers · conditional same-day.
5. Add the route to `vercel.json` (clean URL) **and** the URL to `sitemap.xml` (real articles only — never this template).
6. Add a card to `blog/index.html` (friendly badge).
7. Commit (one article per commit) → push → confirm HTTP 200 live.
