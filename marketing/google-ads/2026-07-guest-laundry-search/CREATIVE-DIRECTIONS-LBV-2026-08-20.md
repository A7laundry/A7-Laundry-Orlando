# Creative Directions — Lake Buena Vista

## Decision

Selected direction: **The Day Is Still Yours**. It best translates the proven need—hotel pickup around a deadline—into an emotional promise without weakening search clarity or inventing operational claims.

## A — The Day Is Still Yours (selected)

- **Thesis:** the service gives the guest the day back; laundry exits the itinerary.
- **Headline:** “Your vacation is still yours.”
- **Support:** “Hotel laundry pickup in Lake Buena Vista, planned around the return window we confirm with you.”
- **CTA:** “Check today’s pickup window.”
- **Visual:** cinematic full-bleed Orlando resort morning; family leaving for the day, folded clothes ready, dark editorial negative space for copy.
- **Palette:** midnight navy, warm ivory, pool aqua, restrained sunrise coral.
- **Typography:** Newsreader + Manrope, both Google Fonts/OFL; system fallbacks remain usable.
- **Motion:** owner-requested slow hero “breathing” scale; no smooth-scroll library; `prefers-reduced-motion` disables the continuous effect.
- **Risk:** image may feel aspirational rather than operational. Mitigation: immediate factual service rail and a process-proof sequence.

## B — Hotel → Handoff → Back to Orlando

- **Thesis:** concierge certainty shown as a precise three-act service choreography.
- **Headline:** “Send the hotel. Send the deadline. Keep the day.”
- **Support:** “We confirm the handoff and return window before pickup.”
- **CTA:** “Plan my hotel pickup.”
- **Visual:** editorial triptych of bag identification, hotel-permitted handoff and folded return.
- **Palette:** warm paper, ink navy, signal blue.
- **Typography:** Fraunces + system sans.
- **Motion:** restrained line progression through the three acts.
- **Risk:** stronger proof but less immediate emotional impact; requires multiple trustworthy images.

## C — Before Checkout

- **Thesis:** deadline control for guests whose clothes must return before the next move.
- **Headline:** “Clean clothes. Before your next move.”
- **Support:** “Tell us your hotel and needed-by time. We confirm what fits before pickup.”
- **CTA:** “Check my deadline.”
- **Visual:** editorial departure-board rhythm with oversized time typography and compact service pace.
- **Palette:** deep ink, parchment, muted citrus.
- **Typography:** editorial serif + neutral grotesk.
- **Motion:** quiet timestamp transitions.
- **Risk:** can over-index on urgency and underrepresent families staying several days.

## Scorecard (1–5)

| Direction | Clarity | Emotion | Originality A7 | Search intent | Mobile | Performance | Conversion | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A — The Day Is Still Yours | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 35 |
| B — Hotel → Handoff | 5 | 4 | 4 | 5 | 4 | 4 | 5 | 31 |
| C — Before Checkout | 4 | 4 | 5 | 4 | 5 | 5 | 4 | 31 |

## Asset ledger

| Asset | Origin / rights | Tool | Commercial scope | Inspection | Transformations |
|---|---|---|---|---|---|
| `assets/lbv-vacation-time-hero-source-v1-rejected-glyph.png` | Original OpenAI-generated output; rejected, not public | OpenAI built-in ImageGen; output `exec-0cc18e30-7b7f-47ac-a86c-84719b6137f4`; underlying model identifier was not exposed by the tool; 2026-08-20 | Not approved for publication | Rejected: small pseudo-logo glyph found on suitcase after red-team review | Moved outside public tree and retained only as audit evidence |
| `assets/lbv-vacation-time-hero-source-v2-clean.png` | Original project output owned by the customer as between customer and OpenAI under Section 4.1 of the [OpenAI Services Agreement](https://openai.com/policies/services-agreement/); A7 remains responsible for output use and third-party rights | OpenAI built-in ImageGen precise edit; output `exec-c9df49a5-b424-424f-ac97-3ac172813773`; underlying model identifier was not exposed by the tool; 2026-08-20 | A7 website and campaign derivative use, subject to applicable law and OpenAI terms | Passed 100% human inspection: no text/logo/glyph/PII; no recognizable hotel/Disney property; faces, hands, clothing, suitcase and room geometry plausible | Source archived outside public tree; edit prompt recorded below |
| `blog/img/lbv-vacation-time-hero-v4.webp` | Derivative of approved source v2 | ImageMagick 7 | Same commercial scope as source | Passed desktop crop and public-asset inspection | 1600×900, metadata stripped, WebP quality 76, 75KB |
| `blog/img/lbv-vacation-time-hero-v4-mobile.webp` | Derivative of approved source v2 | ImageMagick 7 | Same commercial scope as source | Passed 320/375/390/430 mobile crops | 960×540, metadata stripped, WebP quality 74, 35KB |
| `assets/lbv-vacation-time-hero-source-v3-a7-branded.png` | Precise edit of the owner-supplied `Hero A7 Laundry - Castelo Sutil.png`; owner explicitly authorized its use in this commercial hero on 2026-08-21. Source-file provenance and third-party generation terms were not independently available in the repository | OpenAI built-in ImageGen precise edit; output `exec-d00785bb-eff9-46ef-945a-5444d6803fd0`; underlying model identifier was not exposed by the tool; 2026-08-21 | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Passed human inspection: A7 mark integrated into hamper; mouse-ear headband removed; no recognizable castle, hotel logo, text watermark or PII; anatomy and room geometry plausible | Non-public master archived; edit prompt recorded below |
| `blog/img/lbv-vacation-time-hero-v5.webp` | Derivative of owner-authorized source v3 | Google WebP `cwebp` | Same commercial scope as source | Passed visual inspection at 1600×900 | 1600×900, WebP quality 84, 203,058 bytes |
| `blog/img/lbv-vacation-time-hero-v5-mobile.webp` | Derivative of owner-authorized source v3 | Google WebP `cwebp` | Same commercial scope as source | Passed live-browser first-fold inspection at 390×844 with no overflow, overlap or failed image | 960×540, WebP quality 82, 99,242 bytes |
| `assets/lbv-post-hero-relief-source-v1.png` | Owner-supplied `Imagem Pós-Hero A7 Laundry - Alívio e Continuidade.png`; owner explicitly requested its use in the post-hero block on 2026-08-21. Upstream provenance/license was not independently available in the repository | No generative edit; source copied unchanged to the non-public asset ledger | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Passed human inspection: clean folded clothes, generic resort room and family; no readable logo, PII or recognizable protected property | Non-public master archived; WebP derivatives only are public |
| `blog/img/lbv-post-hero-relief-v1.webp` | Derivative of owner-authorized post-hero source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed desktop composition at 1440×900; lazy-loaded with stable dimensions and factual alt | 1200×675, WebP quality 82, 107,600 bytes |
| `blog/img/lbv-post-hero-relief-v1-mobile.webp` | Derivative of owner-authorized post-hero source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed mobile composition at 390×844; text precedes image, no overflow or CTA added | 800×450, WebP quality 80, 55,148 bytes |
| `assets/lbv-how-it-works-storyboard-source-v1.png` | Owner-supplied `Storyboard A7 Laundry - Resort Genérico Orlando.png`; owner explicitly requested it as the visual source for Block 3 on 2026-08-21. Upstream provenance/license was not independently available in the repository | No generative edit; source copied unchanged to the non-public asset ledger | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Generic resort/hotel scenes; no recognizable property, PII or affiliation claim. Embedded turnaround headlines were deliberately excluded from public crops so operational conditions remain in HTML | Non-public master archived; four cropped WebP derivatives are public |
| `blog/img/lbv-how-step-01-hotel-pickup-v1.webp` | Crop of owner-authorized storyboard source v1 | ImageMagick 7 | Same commercial scope as source | Passed desktop/mobile visual inspection; Bell desk scene is qualified by adjacent hotel-policy HTML | 1200×492, WebP quality 82, 50,974 bytes |
| `blog/img/lbv-how-step-02-timing-v1.webp` | Crop of owner-authorized storyboard source v1 | ImageMagick 7 | Same commercial scope as source | Passed desktop/mobile visual inspection; embedded absolute turnaround copy excluded | 1200×492, WebP quality 82, 50,318 bytes |
| `blog/img/lbv-how-step-03-folded-return-v1.webp` | Tight crop of owner-authorized storyboard source v1 | ImageMagick 7 | Same commercial scope as source | Passed inspection after removing the source’s decorative bag text and headline from the crop | 1200×635, WebP quality 82, 37,232 bytes |
| `blog/img/lbv-how-step-04-keep-plans-v1.webp` | Crop of owner-authorized storyboard source v1 | ImageMagick 7 | Same commercial scope as source | Passed desktop/mobile inspection; generic Orlando-resort family scene with no protected property | 1200×492, WebP quality 82, 65,860 bytes |
| `assets/lbv-service-pace-day-night-source-v1.png` | Precise edit of owner-supplied `Bloco 4 - Express vs Standard A7 Laundry.png`; owner explicitly requested it for Block 4 on 2026-08-21. Upstream provenance/license was not independently available in the repository | OpenAI built-in ImageGen precise edit; output `exec-de33c61e-c906-4bfd-9986-387f02f1e40d`; underlying model identifier was not exposed by the tool; 2026-08-21 | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Passed human inspection: all embedded price/timing/service copy, labels, cards and pseudo-branding removed; day/night rooms, folded clothes and central clock preserved; no readable text, logo, PII or recognizable protected property | Non-public master archived; edit prompt recorded below |
| `blog/img/lbv-service-pace-day-night-v1.webp` | Derivative of approved service-pace source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed 1440×900 desktop block inspection with stable dimensions, no overflow and all offer facts in adjacent HTML | 1600×901, WebP quality 84, 82,091 bytes |
| `blog/img/lbv-service-pace-day-night-v1-mobile.webp` | Center crop derivative of approved service-pace source v1 | Apple `sips` + Google WebP `cwebp` | Same commercial scope as source | Passed 390×844 mobile block inspection; day/night split and clock remain visible, no text embedded, no overflow | 1000×750, WebP quality 84, 46,181 bytes |
| `assets/lbv-operational-proof-source-v1.png` | Owner-supplied `Bloco 5 - Prova Operacional A7 Laundry.png`; owner explicitly requested it for Block 5 on 2026-08-21. Upstream provenance/license was not independently available in the repository | No generative edit; source copied unchanged to the non-public asset ledger | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Passed human inspection: three generic hotel-service scenes, blank guest/room fields, no readable personal identifier, protected property or hotel logo. Published with an explicit illustrative-workflow caption; not represented as documentary proof or hotel partnership | Non-public master archived; responsive WebP derivatives only are public |
| `blog/img/lbv-operational-proof-v1.webp` | Derivative of owner-authorized operational-proof source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed 1440×900 inspection; stable dimensions, lazy loaded, no overflow and hotel-policy qualification visible | 1600×900, WebP quality 84, 98,366 bytes |
| `blog/img/lbv-operational-proof-v1-mobile.webp` | Responsive derivative of owner-authorized operational-proof source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed 390×844 inspection; all three scenes remain visible, one tracked CTA, no broken image or overflow | 1000×563, WebP quality 82, 46,710 bytes |
| `assets/lbv-local-coverage-source-v1.png` | Owner-supplied `Bloco 6 - Cobertura Local com Embalagem Transparente (1).png`; owner explicitly requested it for Block 6 on 2026-08-21. Upstream provenance/license was not independently available in the repository | No generative edit; source copied unchanged to the non-public asset ledger | A7 website derivative use as explicitly requested by the owner; A7 remains responsible for rights in the supplied source | Passed human inspection: generic resort buildings, hotel handoff concept and abstract route pins; no hotel logo, guest PII or identifiable protected property. Published with an explicit illustrative-service-area caption and no partnership claim | Non-public master archived; responsive WebP derivatives only are public |
| `blog/img/lbv-local-coverage-v1.webp` | Derivative of owner-authorized local-coverage source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed 1440×900 inspection; lazy loaded with stable dimensions and adjacent no-partnership qualification | 1600×900, WebP quality 84, 244,938 bytes |
| `blog/img/lbv-local-coverage-v1-mobile.webp` | Responsive derivative of owner-authorized local-coverage source v1 | Google WebP `cwebp` | Same commercial scope as source | Passed 390×844 and 320×568 inspection; image follows the heading and precedes the hotel list, with no overflow | 1000×563, WebP quality 82, 111,918 bytes |

**Rights evidence captured:** OpenAI Services Agreement, Section 4.1, accessed 2026-08-20, states that as between the customer and OpenAI, the customer owns Output to the extent permitted by law. The same agreement makes the customer responsible for evaluating and using Output. No third-party input image, real-person likeness, hotel image or trademark was supplied. Google Fonts requests use Newsreader and Manrope under their linked Google Fonts/OFL distribution; the page retains the project’s pre-existing Google Fonts delivery pattern.

For the owner-requested v5 replacement, a new third-party input image was supplied directly by the owner. The repository records the explicit publication request but cannot independently establish the source image’s upstream license. ImageGen was instructed to remove explicit theme-park trademark cues and preserve no recognizable property or affiliation signal.

### Full generation prompt

```text
Use case: ads-marketing
Asset type: premium website hero for a hotel guest laundry pickup service in Lake Buena Vista, Orlando
Primary request: Create a cinematic, photorealistic editorial hospitality photograph that communicates a family getting their vacation time back because hotel laundry is handled for them.
Scene/backdrop: upscale but believable Orlando resort hotel suite at warm early-morning light; subtle palm greenery and bright Florida atmosphere visible through a window, without recognizable hotel, theme park, castle, signage, or trademarked architecture.
Subject: on the RIGHT half, a stylish but natural traveling family preparing to leave for their day; one parent closes a small day bag while a child is ready near the door. In the foreground on the right-center, a neatly folded stack of real everyday family clothes sits in an open neutral suitcase on a luggage bench, suggesting laundry returned and ready. Human anatomy, hands, faces and clothing must be natural and credible.
Style/medium: high-end hospitality campaign photography, candid documentary realism, natural skin texture, subtle 35mm film grain, premium editorial composition, not glossy stock, not hyper-saturated, not 3D, not illustration.
Composition/framing: wide 16:9 landscape; subjects and suitcase concentrated on the right 55%; generous clean darker negative space on the left 40% for white headline copy; strong depth and layered framing; eye-level camera; no centered composition.
Lighting/mood: refined warm Florida sunrise, calm relief, movement toward a great vacation day, trustworthy and human.
Color palette: deep navy shadows, warm limestone, crisp white, restrained aqua accents, natural greens; no Disney palette imitation.
Materials/textures: linen, cotton, luggage fabric, subtle wood and stone, realistic creases and folds.
Constraints: no text, no logos, no visible brand marks, no hotel emblems, no Disney references, no theme-park icons, no laundry machines, no staff uniform, no fake UI, no watermark. Do not show money or pricing. Must look plausible at desktop hero crop and mobile crop; keep essential subjects away from extreme edges.
Avoid: AI-perfect symmetry, plastic skin, malformed fingers, duplicated clothes, impossible suitcase geometry, excessive teal-orange grading, neon, generic corporate stock-photo smiles, fantasy architecture, fireworks.
```

### Precise edit prompt

```text
Use case: precise-object-edit
Asset type: premium website hero photograph
Primary request: Remove only the small embossed square/circular pseudo-logo glyph on the lower-right front panel of the open suitcase. Replace it with the same plain taupe suitcase fabric, matching texture, lighting, shadow and perspective.
Input image: Image 1 is the edit target.
Constraints: change only that tiny glyph area. Preserve every person, face, hand, pose, clothing item, suitcase geometry, room, composition, crop, lighting, colors, grain and all other pixels as closely as possible. Do not add any text, logo, mark or watermark. No other retouching.
```

### Owner-requested branded v5 edit prompt

```text
Use case: precise-object-edit
Asset type: premium responsive website hero for A7 Laundry Orlando
Input images: the wide hotel-room vacation scene is the edit target; the supplied A7 Laundry logo images are the exact brand reference to place on the hamper.
Primary request: Preserve the original wide 16:9 photorealistic composition, people, hotel room, overflowing vacation laundry, warm sunlight, pool, palms, and the emotional contrast between laundry chaos and the family continuing their vacation. Add the official A7 Laundry brand mark cleanly and realistically to the front-facing area of the large navy laundry hamper/bag held by the worker, as a professionally printed fabric logo that follows the bag folds, perspective, light, and texture. Make it clearly visible but tasteful, not oversized.
Brand safety edit: remove the child's mouse-ear headband and replace it with ordinary loose hair or a simple neutral sun hat. Make any distant castle form generic, very subtle, soft-focus vacation-resort architecture with no recognizable Disney silhouette, logos, characters, trademarks, text, or implied affiliation.
Composition/framing: retain generous clean visual zones suitable for dark gradient and HTML headline overlay; keep the worker and branded hamper as the visual bridge between the laundry pile and the departing family.
Lighting/mood: warm golden hospitality editorial photography, vibrant but credible, cinematic depth, premium concierge energy.
Constraints: preserve facial identity, anatomy, family count, room geometry, camera perspective, clothing pile, pool and palms as closely as possible; modify only the hamper branding and explicit theme-park trademark cues; no embedded headline or marketing text; no watermark; no extra logos; exact brand spelling if any lettering is visible: A7 LAUNDRY.
```

### Owner-requested service-pace cleanup prompt

```text
Use case: precise-object-edit
Asset type: premium website section artwork for A7 Laundry Lake Buena Vista
Primary request: Remove every piece of embedded text, typography, lettering, label, card, and slogan from the supplied image while preserving the core visual concept.
Input image: edit target; preserve its overall day-versus-night split composition.
Keep unchanged: the bright daytime hotel-room side with blue folded clothes and Orlando-style resort/lake background; the warm nighttime hotel-room side with neutral folded clothes and resort skyline; the elegant centered split clock; balanced premium hospitality lighting and 16:9 landscape framing.
Remove: EXPRESS, STANDARD, SAME DAY SERVICE, NEXT DAY SERVICE, all supporting slogans, TODAY/TOMORROW labels, READY SAME DAY/READY NEXT DAY cards, ORLANDO RESORT LAUNDRY, and every other readable or pseudo-readable mark. Remove all visible brand marks and watermarks.
Finish: photorealistic premium resort hospitality editorial, natural textiles, clean negative space, visually coherent after text removal.
Constraints: no new text, no logos, no watermarks, no Disney or hotel trademarks, no castle, no characters, no additional objects; do not change the service scenes beyond what is necessary to cleanly remove the text.
```
