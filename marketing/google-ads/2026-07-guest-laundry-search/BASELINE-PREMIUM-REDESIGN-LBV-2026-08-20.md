# Baseline — Premium Lake Buena Vista Redesign

**Story:** A7-011  
**Captured:** 2026-08-20  
**Public URL:** `https://a7laundry.com/blog/laundry-lake-buena-vista`  
**Source commit:** `eca4f21`  
**Reference deployment:** `E95boogMByYDHRzUnRKayKq3GjDD`

## Visual and technical baseline

| Signal | Desktop 1700×862 | Mobile 390×844 |
|---|---:|---:|
| Document height | 7,092px | 10,502px |
| Hero height | 975px | 1,227px |
| H1 | 1 headline | 5 lines / 265px |
| Hero image starts | first viewport | y=924px |
| Major sections | 8 | 8 |
| WhatsApp destinations | 4 | 4 |
| Horizontal overflow | none | none |

Confirmed baseline defects:

- The opening is a familiar split-hero template with pills, two competing CTAs and a generic suitcase image.
- The first mobile image begins after the first viewport; the main action competes with the floating WhatsApp button.
- `geo-bed.webp` reserves a 327×600 box on mobile because the HTML height wins over the intended aspect ratio before lazy load.
- The page repeats the same eyebrow/serif/cards/reveal formula and reaches 10,502px on mobile.
- A hotel-directory block can imply property relationships that are not established.
- There is no independently verifiable rating/photo proof above the fold. The redesign must therefore use a truthful process proof, not invent social proof.

## Preserved contracts

- URL, canonical, title intent, index/follow and stable JSON-LD IDs.
- One H1; visible FAQ synchronized with `FAQPage` schema.
- Standard from $3.25/lb, approximate 24h.
- Express from $3.95/lb, up to 8h only when capacity and the window are confirmed.
- $50 minimum; pickup and delivery included in the confirmed area.
- WhatsApp `+1 407-670-8839`, static funnel `SEO-LBV-V2`, dynamic `A7 Ref` and attribution parameters.
- Bell Services/front desk only when the hotel permits the handoff.

## Claim matrix

| Claim | Source | Status | Public copy allowed |
|---|---|---|---|
| Hotel guest wash, dry and fold | `MANIFESTO.md` | confirmed | Yes |
| Standard $3.25/lb | `MANIFESTO.md`, canonical paid offer | confirmed | “From $3.25/lb” |
| Standard 24h | canonical paid offer | conditional | “Approx. 24h” |
| Express $3.95/lb | `MANIFESTO.md`, canonical paid offer | confirmed | “From $3.95/lb” |
| Express up to 8h | canonical paid offer | conditional | Only with availability/capacity/window qualifier |
| $50 minimum | `MANIFESTO.md`, canonical paid offer | confirmed | Yes |
| Pickup/delivery included | canonical paid offer | conditional | Only in confirmed service area |
| Bell/front desk handoff | operational evidence | conditional | Only when hotel permits |
| Pickup within one hour | canonical offer lists a conditional formulation, but this release has no current operational confirmation | not used | No claim in this release |
| Hotel/Disney partnership | no support | rejected | No |
| Rating/review count | not revalidated for this release | unavailable | No |

## Adjacent intent map

| URL | Primary intent | Differentiation |
|---|---|---|
| `/blog/laundry-lake-buena-vista` | hotel laundry pickup in Lake Buena Vista | local transactional page; hotel + deadline + handoff |
| `/blog/laundry-near-disney-world` | laundry near the broader Walt Disney World area | broader destination discovery |
| `/blog/laundry-disney-springs-area` | laundry around Disney Springs | destination-area support article |

GSC query-level data: **unavailable in this execution context**, not zero. No causal claim about cannibalization is made.

## Rollback

The public rollback boundary is deployment `E95boogMByYDHRzUnRKayKq3GjDD` and source commit `eca4f21`. If the redesign causes availability, tracking, indexing, claim or material performance failure, restore the previous `blog/laundry-lake-buena-vista.html` and previous hero references, deploy through `@devops`, then verify HTTP 200, canonical, WhatsApp prefill and tracking again.
