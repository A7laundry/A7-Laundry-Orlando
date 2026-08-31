# Creative ledger — Orlando money page

Date: 2026-08-21  
Page: `https://a7laundry.com/laundry-pickup-delivery-orlando`  
Status: locally implemented; publication requires the full forensic gate.

## Purpose

Replace the generic resort image treatment with original, broad-Orlando hospitality scenes that support the money page's commercial role without borrowing the local identity of Lake Buena Vista, International Drive or the resort-area page.

## Production method and usage basis

- Tool: OpenAI built-in image generation workflow available to the project agent.
- Inputs: text prompts only; no third-party photograph, hotel image, customer image or protected character was supplied.
- Intended use: A7 Laundry commercial website.
- Asset ownership record: generated specifically for A7 Laundry under the project owner's autonomous production authorization in the active goal.
- Source masters are retained outside the public bundle under this campaign's `assets/main-money-page/` directory.
- Public derivatives are compressed WebP files; the original generated files remain unmodified in the tool's generated-image archive.

## Asset 1 — guest handoff hero

Source:

`marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-guest-laundry-handoff-source-v1.png`

Public derivatives:

- `public/orlando-guest-laundry-handoff-v1.webp` — 1600×1067, 116,378 bytes
- `public/orlando-guest-laundry-handoff-v1-mobile.webp` — 960×640, 58,418 bytes

Prompt intent: an international-traveler family completes a calm handoff of a closed navy laundry bag with a local pickup attendant in a generic upscale Orlando hospitality setting. Broad left-side negative space supports the hero copy.

Negative constraints: no text, logo, hotel brand, park symbol, castle, character, recognizable ride, trademark, watermark, customer data or false partnership cue.

Inspection result: PASS. Hands, faces, bag and luggage are visually coherent at 100%; no readable text, PII, third-party mark or recognizable protected property was found. The scene is labeled illustrative in visible HTML and image metadata.

## Asset 2 — identified return

Source:

`marketing/google-ads/2026-07-guest-laundry-search/assets/main-money-page/orlando-laundry-identified-return-source-v1.png`

Public derivatives:

- `public/orlando-laundry-identified-return-v1.webp` — 1400×933, 70,512 bytes
- `public/orlando-laundry-identified-return-v1-mobile.webp` — 840×560, 31,364 bytes

Prompt intent: a traveler receives a closed navy bag with a blank identification sleeve beside neatly folded everyday clothes in a generic hotel room.

Negative constraints: no customer data, readable label, logo, hotel mark, official uniform, plastic wrap, tracking screen, watermark or testimonial implication.

Inspection result: PASS. The blank sleeve contains no PII or text; hands and clothing are visually coherent. The scene is labeled illustrative and is not used as evidence of a hotel relationship or customer testimonial.

## Implementation rules

- A7 branding is rendered in HTML through the project-owned wordmark, not generated into the photographs.
- The hero uses responsive `srcset`, dimensions, `fetchpriority="high"` and no lazy loading.
- The return image is lazy-loaded, dimensioned and served through responsive derivatives.
- Alt text describes the visible scene without keyword stuffing.
- Generated scenes never substitute for real customer proof; current Google Business Profile and social profiles are linked separately for verification.
