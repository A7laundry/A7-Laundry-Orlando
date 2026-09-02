# Story A7-023 — A7 Orlando OS W1C-B1 Reviewed Versioned Invoice

**Status:** Done — isolated W1C-B1 + PDFs deployed to Production on 2026-08-31

## 2026-08-31 amendment — official immutable invoice renderer

Owner requirement supersedes the prior independent HTML/PDF layout for invoice output only. The approved blank
background is now versioned as `A7_ORLANDO_INVOICE_V1`. Every invoice PNG/PDF must compose immutable invoice,
order, customer, service and financial data over that unchanged asset. Service/SLA language is dynamic and may
never be inferred from artwork. The thermal label remains governed separately.

Additional acceptance criteria:

- [x] Official blank asset is stored with a recorded SHA-256 and is never modified during rendering.
- [x] Invoice PNG and PDF both use `A7_ORLANDO_INVOICE_V1`; no legacy layout is selectable.
- [x] Invoice preview uses the same immutable `A7_ORLANDO_INVOICE_V1` background and fails closed without a governed preview.
- [x] Service and SLA derive from the persisted order (`EXPRESS_8H`, `STANDARD_24H` or actual custom-care promise).
- [x] Hayley invoice #230 is generated from persisted system data and visually validated.
- [ ] Final PDF is delivered only to the internal WhatsApp `+1 (407) 670-8839` and reviewed after five minutes.
- [ ] Absence of a WhatsApp response remains `PENDING`, never implicit approval.

Implementation evidence on 2026-08-31:

- Production renderer deployment: `dpl_2g7MtWnnTmyQuZirhsaVkvEAbTu5` (`READY`).
- Renderer predecessor: `dpl_6MG5kA2WjaZjLPdci7ZbVycTjDJy` (`READY`, rollback available).
- Rollback targets: renderer predecessor `dpl_HUVmkAdwkQygdh6YfiARhzwykCiE`; pre-renderer Production
  `dpl_5TUQWFBmRhViuBx2nYneSKeWv2zG`.
- Required lint, typecheck, test and build gates passed; focused invoice contracts 13/13, private OS tests 86/86
  and MOS tests 67/67 passed.
- Runtime template integrity is pinned to SHA-256 `9eb9db4ddc39e47e54b406807ce21a12e9b5db96a2a295ca46939cc2faf9e94d`.
- Vercel Production packaging contains that exact asset and checksum inside the private
  `api/system/order-documents` function. The asset is intentionally not exposed as a public URL.
- Final Hayley acceptance remains blocked because persisted `MCO-1003` is `NORMAL / STANDARD / awaiting payment`,
  while the approved customer facts are `EXPRESS 8h / Stripe paid`. No PDF was sent and no production fact was
  rewritten to hide the discrepancy.
- Persisted-data artifacts were generated and visually validated without overriding that structured state:
  `output/pdf/A7-Invoice-230-Hayley-Sanderson-A7_ORLANDO_INVOICE_V1.png` and
  `output/pdf/A7-Invoice-230-Hayley-Sanderson-A7_ORLANDO_INVOICE_V1.pdf`. The Standard-specific render correctly
  replaces all Express SLA text and marks the Standard return commitment.
- Internal WhatsApp delivery remains pending because no authenticated, controllable WhatsApp Web session was
  available to the automation. No alternate channel or authentication bypass was used.

## 2026-09-01 correction pass — strict invoice data binding

The renderer now consumes an exact canonical service code (`EXPRESS_8H`, `STANDARD_24H` or `CUSTOM_CARE`) exposed
by the protected order adapter. It does not infer service from price, SLA text, pickup time or artwork. Before any
PNG/PDF composition, it verifies the persisted per-pound rate, line rounding, item subtotal, minimum threshold,
minimum adjustment, total and zero-tip contract. Contradictory inputs fail closed.

Correction evidence:

- Express regression fixture: 11.9 lb × US$3.95 = US$47.01; US$12.99 minimum adjustment; US$60.00 total.
- Tip boxes contain only final totals: US$66.00, US$69.00 and US$72.00.
- Empty special instructions render no placeholder text.
- Service item four is dynamic from the exact service code.
- The entire fixed footer/QR crop is pixel-identical after the normal render pipeline.
- Corrected visual preview and one-page PDF were rendered and inspected at full resolution:
  `output/pdf/A7-Invoice-230-Hayley-Sanderson-CORRECTION-PREVIEW-A7_ORLANDO_INVOICE_V1.png` and
  `output/pdf/A7-Invoice-230-Hayley-Sanderson-CORRECTION-PREVIEW-A7_ORLANDO_INVOICE_V1.pdf`.
- The preview is not classified as the official persisted Hayley invoice: the last protected read of MCO 1003
  showed `normal / STANDARD_24H`, US$3.25/lb and a different persisted pickup/return timeline. No order, paid
  invoice or attribution snapshot was rewritten by this correction pass.
- WhatsApp delivery remains blocked until the persisted order is explicitly reconciled and all required assertions
  pass against the official record.
- Corrected renderer deployment: `dpl_CJESB3UcjpvkDshZx9sHoroEnwpo`, target Production, aliases
  `a7laundry.com` and `www.a7laundry.com`, status `READY`.
- Immediate application rollback target: `dpl_2g7MtWnnTmyQuZirhsaVkvEAbTu5`.
- Production smoke preserved the private boundary (`401` without a signed session); no data mutation was executed.

## 2026-09-01 local calibration pass — bounded invoice typography

Owner authorized local calibration only. The immutable `A7_ORLANDO_INVOICE_V1` background and strict binding rules
remain unchanged; no deployment, database mutation, WhatsApp delivery or external financial action was executed.

- [x] Every dynamic invoice field is mapped to a bounded template box.
- [x] Text uses deterministic width estimation, controlled wrapping and automatic font reduction.
- [x] Representative short, medium and long customer/property/address/instruction values fit without clipping.
- [x] Checkmarks use vector paths centered on the template checkboxes.
- [x] Service/delivery and pickup/return values are centered inside their orange template rectangles.
- [x] Pickup and return locations render below their fixed `LOCATION` labels.
- [x] Minimum, total and tip values remain inside their fixed pricing boxes.
- [x] Hayley calibration PNG and one-page letter PDF were rendered and visually inspected at full resolution.
- [x] The fixed footer/QR integrity regression remains active.
- [x] Focused document tests pass 10/10; private OS pretests pass 84/84; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

Local review artifacts:

- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V1.png`
- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V1.pdf`

This remains a supplied-facts calibration preview, not authorization to replace the contradictory persisted MCO 1003
record or send a customer-facing invoice.

## 2026-09-01 local QR replacement — A7_ORLANDO_INVOICE_V2

The Owner supplied the real Google review QR after identifying that the decorative QR embedded in V1 was broken.
V1 remains immutable and preserved. A deterministic builder created V2 by changing only the governed QR region.

- [x] Supplied QR is stored with SHA-256 `17460b644dcac11fca0b17c4bafd5066f36d67d653c5d802ffe286f3b51db418`.
- [x] V2 template is stored with SHA-256 `33505e829831aaeeae97f384fabf64225f770750cbf2858669585bc3051c6e07`.
- [x] QR is resized with nearest-neighbor at exactly three pixels per QR module and embedded without smoothing.
- [x] Pixel regression proves the V2 QR crop equals the resized supplied QR.
- [x] Independent decoding proves both the supplied file and rendered PDF resolve to `https://share.google/69Q20CslFhQGZfgHY`.
- [x] Full PDF was rendered at 200 DPI and visually inspected; QR, footer, borders and surrounding copy are intact.
- [x] Focused document tests pass 11/11; private OS pretests pass 85/85; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] No deploy, WhatsApp delivery, database mutation or financial action was executed.

Local V2 review artifacts:

- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V2.png`
- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V2.pdf`

## 2026-09-01 local official-logo replacement — A7_ORLANDO_INVOICE_V3

The Owner supplied the official A7 Laundry light-background horizontal logo for the invoice header. V1 and V2
remain immutable and preserved. A deterministic builder created V3 from V2, replacing only the governed header
wordmark region while retaining the approved field calibration and exact Google review QR.

- [x] Supplied official logo is stored with SHA-256 `f59d188ab833a76c0dfb193d29c4395337540be62cf9543252d947e62ce37b06`.
- [x] V3 template is stored with SHA-256 `40420d2d5eaa0da1a406cdd20ece55040e694d5453b1b37cce37b0859303a1e7`.
- [x] Transparent source pixels are flattened onto white before resizing, preventing dark fringe artifacts.
- [x] Pixel regression proves the V3 header crop equals the supplied horizontal logo composition.
- [x] Pixel regression proves the V3 QR crop remains identical to the approved supplied QR.
- [x] One-page letter PDF was rendered at 200 DPI and visually inspected; logo, fields, QR, footer and borders are intact.
- [x] Focused document tests pass 12/12; private OS pretests pass 86/86; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] No deploy, WhatsApp delivery, database mutation or financial action was executed.

Local V3 review artifacts:

- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V3.png`
- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V3.pdf`

## 2026-09-01 local header-spacing correction — A7_ORLANDO_INVOICE_V4

The Owner identified that the V3 white logo plate covered small parts of the Ferris wheel and skyline. V4 is built
directly from V2 with a reduced official logo and a narrower governed plate aligned to the prior wordmark footprint.

- [x] Official logo is reduced from 500 x 100 px to 460 x 82 px and remains aspect-safe.
- [x] White plate is narrowed from x=125..665 to x=140..655.
- [x] Pixel regression proves the Ferris-wheel region at x=0..140 and skyline region at x=655..1024 remain identical to V2.
- [x] V4 template is stored with SHA-256 `fbcde47e06f63f27e66c0d6f416574e11cfc1787b4dc515d6c19be192e14f9fe`.
- [x] Exact official-logo and Google-review-QR regressions remain active.
- [x] One-page letter PDF was rendered at 200 DPI and visually inspected with no clipping or residual artwork.
- [x] Focused document tests pass 13/13; private OS pretests pass 87/87; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] No deploy, WhatsApp delivery, database mutation or financial action was executed.

Local V4 review artifacts:

- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V4.png`
- `output/pdf/A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V4.pdf`

## 2026-09-01 local 4 x 6 thermal-label template — A7_ORLANDO_LABEL_V1

The Owner supplied the blank A7 Orlando laundry form as the governed thermal-label background. The existing private
label endpoint now composes persisted order facts over the immutable 1024 x 1536 source and emits a true 4 x 6 PDF.

- [x] Supplied label template is stored with SHA-256 `2d9d0bccd5415d9c926fee7585312e35952b916cd8e40f3271cd4cb942f0b63f`.
- [x] Invoice number, guest, property, room, date, bags, service, return and special-instruction fields have bounded layouts.
- [x] Unknown bag count remains `-`; blank special instructions remain blank.
- [x] Express service renders as `EXPRESS 8-HOUR` and return uses the persisted Orlando-local time.
- [x] Output is one 288 x 432 pt page, matching physical 4 x 6 inch media.
- [x] 300-DPI PDF rendering was visually inspected with no clipping, overlap or unreadable text.
- [x] Focused document tests pass 15/15; private OS pretests pass 89/89; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] The existing private system label action uses the new renderer without invoice or financial mutation.
- [x] No deploy, WhatsApp delivery, database mutation or financial action was executed.

Local label review artifacts:

- `output/pdf/A7-Label-230-Hayley-Sanderson-4x6-A7_ORLANDO_LABEL_V1.png`
- `output/pdf/A7-Label-230-Hayley-Sanderson-4x6-A7_ORLANDO_LABEL_V1.pdf`

## 2026-09-01 local official-QR replacement — A7_ORLANDO_LABEL_V2

The Owner requested the previously supplied official QR in place of the broken decorative QR. Because the governed
asset resolves to the A7 Google review destination, the adjacent CTA was corrected from `SCAN TO BOOK` to
`SCAN TO REVIEW` so printed instructions remain truthful.

- [x] V1 remains immutable and preserved.
- [x] Official Google review QR retains SHA-256 `17460b644dcac11fca0b17c4bafd5066f36d67d653c5d802ffe286f3b51db418`.
- [x] QR is rendered at 185 x 185 px with nearest-neighbor scaling and five pixels per governed QR module.
- [x] Pixel regression proves the V2 QR crop equals the supplied official QR composition.
- [x] The exact governed QR was previously decoded to `https://share.google/69Q20CslFhQGZfgHY`.
- [x] V2 template is stored with SHA-256 `3a82de77474f7eea69cad141018218d5152f87fee9292576d7f05c0d977e4397`.
- [x] One-page 4 x 6 PDF was rendered at 300 DPI and visually inspected with no clipping or overlap.
- [x] Focused document tests pass 16/16; private OS pretests pass 90/90; repository tests pass 86/86; MOS tests pass 67/67.
- [x] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.
- [x] No deploy, WhatsApp delivery, database mutation or financial action was executed.

## 2026-09-01 Owner template acceptance

- [x] `A7_ORLANDO_INVOICE_V4` is approved as the official system invoice template.
- [x] `A7_ORLANDO_LABEL_V2` is approved as the official system 4 x 6 label template.
- [x] Invoice generation uses the approved V4 renderer and immutable issued invoice facts.
- [x] Label generation uses the approved V2 renderer and persisted operational order facts.
- [x] V1-V3 invoice and V1 label assets remain preserved as immutable history, not active templates.
- [x] Approval changes governance status only; Production deployment remains separately gated.

Local V2 label review artifacts:

- `output/pdf/A7-Label-230-Hayley-Sanderson-4x6-A7_ORLANDO_LABEL_V2.png`
- `output/pdf/A7-Label-230-Hayley-Sanderson-4x6-A7_ORLANDO_LABEL_V2.pdf`

**Created:** 2026-08-30

**Source:** `docs/audits/2026-08-30-orlando-os-w1c-b-financial-readiness.md`

**Depends on:** A7-019 W1B Daily Operations and A7-020 W1C-A Item Weight

## Story

**As the** A7 Orlando Owner,

**I want** the system to derive and review one versioned invoice from confirmed order items,

**so that** the amount is explainable and frozen before any Stripe Payment Link is created.

## Scope lock

Only W1C-B1 is in scope: immutable invoice header/line snapshots, one current invoice version, governed minimum
adjustment, Owner review/correction/void, append-only audit, private API/CLI/UI and compatibility with the existing
order-level invoice fields. The issued invoice can be rendered as a branded customer PDF, and any real order can
render a separate 4 x 6 thermal bag label from protected order facts. Rendering never creates or changes financial
truth.

Stripe calls, Payment Links, webhook changes, purchase/refund behavior, delivery, tip, discounts, manual-price
resolution, WhatsApp, Google Ads, `/order`, customer editing and Production deployment remain unchanged.

## Policy lock for this local candidate

1. Owner is the only authority to issue, replace or void an invoice.
2. First issue requires all item prices, quantities and required weights to be resolved.
3. Service amount is the sum of server-derived item snapshots plus one governed minimum adjustment.
4. Tip is exactly `0`; it is not shown as an editable field.
5. Correction creates a new immutable version and requires a bounded reason.
6. A no-change correction is rejected rather than creating version noise.
7. Void requires a bounded reason and preserves every prior version and audit row.
8. Paid, partially refunded or refunded invoices are immutable.
9. Any current or historical Payment Link blocks B1 replacement/void until W1C-B2 implements safe deactivation.
10. Production still requires explicit Owner approval of this policy and an independent release GO.

## Requirements

| ID | Requirement |
|---|---|
| FR-01 | Invoice lines snapshot each eligible order item using server-owned price, quantity, actual weight and subtotal. |
| FR-02 | The order minimum is applied at most once as an explicit adjustment line. |
| FR-03 | Manual-review, unresolved fixed-price or unweighed per-pound items block issuance. |
| FR-04 | First review creates invoice version 1 and updates the existing order invoice header compatibly. |
| FR-05 | Correction creates a new version, supersedes the prior version and requires the expected version plus reason. |
| FR-06 | Void preserves history, requires reason and disables the order-level payable header. |
| FR-07 | The current issued invoice renders to a branded letter-size PDF using only its immutable line snapshot and protected order/contact facts. |
| FR-08 | A separate 4 x 6 thermal label renders from current order facts with a vector-only high-contrast mark, customer/property/room, service and timing. |
| FR-09 | Retrying the same request remains stable after financial/order facts change; semantic idempotency conflicts fail closed. |
| NFR-01 | Owner-only, same-origin and signed HttpOnly submission identity. |
| NFR-02 | No browser-supplied amount, price, minimum, invoice ID, PII or secret becomes financial authority. |
| NFR-03 | Additive service-role-only schema; app-first rollback and fail-closed exceptional SQL rollback. |
| CON-01 | No Stripe/Payment Link/webhook/GA4/Ads/WhatsApp change. |
| CON-02 | No Production mutation without a separate exact GO. |

## Acceptance criteria

- [x] Invoice preview is derived entirely from current protected item facts.
- [x] Invoice preview, PNG export and PDF export all compose the same immutable official background.
- [x] Per-pound and fixed-price lines use correct server-derived subtotals.
- [x] Minimum is represented once and total is exact to USD cents.
- [x] Unresolved/manual-review items block review with a visible error.
- [x] First issue, correction and void are Owner-only and append-only audited.
- [x] Correction requires reason/version and never rewrites an older invoice or line.
- [x] Paid or linked invoices cannot be corrected or voided in W1C-B1.
- [x] Same retry returns the prior immutable result after later fact/state changes; conflicting idempotency fails closed.
- [x] Browser ignores/rejects injected amount, price, minimum, tip and invoice IDs.
- [x] No PII/secret enters URLs, analytics, logs or invoice lines.
- [x] No Stripe, WhatsApp, Google Ads, `/order`, payment or delivery mutation occurs.
- [x] Desktop and 390 px UI are usable without document overflow.
- [x] Order detail exposes a 4 x 6 label download; an issued invoice exposes its separate customer PDF download.
- [x] PDF endpoints are private, same-origin, no-store, contain no PII in URLs and never mutate invoice/payment state.
- [x] Thermal branding is vector-only and remains crisp without converting the gradient logo into a black raster blot.
- [x] Migration/rollback dry-run, lint, typecheck, focused/full tests and build pass.
- [x] Production cutover uses an isolated artifact, exact rollback target and authenticated smoke without financial mutation.

## Rollback

Normal rollback is application-only. The exceptional SQL rollback drops W1C-B1 objects only when no invoice or audit
evidence exists. Once evidence exists, schema remains and the previous application artifact ignores the additive tables.

## File List

- `docs/stories/a7-023-orlando-os-w1c-b1-reviewed-invoice.md`
- `docs/audits/2026-08-30-orlando-os-w1c-b1-reviewed-invoice-gate.md`
- `lib/system-invoice-service.js`
- `lib/system-document-service.js`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V1.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V1.json`
- `assets/system/invoice/A7_GOOGLE_REVIEW_QR_V1.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V2.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V2.json`
- `assets/system/invoice/A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V3.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V3.json`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V4.png`
- `assets/system/invoice/A7_ORLANDO_INVOICE_V4.json`
- `assets/system/invoice/A7_ORLANDO_LABEL_V1.png`
- `assets/system/invoice/A7_ORLANDO_LABEL_V1.json`
- `assets/system/invoice/A7_ORLANDO_LABEL_V2.png`
- `assets/system/invoice/A7_ORLANDO_LABEL_V2.json`
- `assets/system/invoice/Inter-Variable.ttf`
- `assets/system/invoice/Inter-OFL.txt`
- `lib/system-auth.js`
- `lib/system-operations-service.js`
- `lib/operational-store.js`
- `api/system/invoice-draft.js`
- `api/system/order-invoices.js`
- `api/system/order-documents.js`
- `scripts/a7-system-invoices.mjs`
- `scripts/test-system-w1c-b1.mjs`
- `scripts/test-system-w1c-b1.sql`
- `scripts/test-system-documents.mjs`
- `scripts/render-invoice-calibration.mjs`
- `scripts/render-label-calibration.mjs`
- `scripts/build-label-template-v2.mjs`
- `scripts/build-invoice-template-v2.mjs`
- `scripts/build-invoice-template-v3.mjs`
- `scripts/build-invoice-template-v4.mjs`
- `supabase/migrations/20260830080000_orlando_os_w1c_b1_reviewed_invoice.sql`
- `supabase/rollbacks/20260830080000_orlando_os_w1c_b1_reviewed_invoice.rollback.sql`
- `sistema.js`
- `sistema-w1b.css`
- `package.json`

## Validation evidence

- Focused Node contract: 6/6 PASS.
- Focused PDF document contract: 5/5 PASS.
- Complete private OS pretest: 76/76 PASS.
- Repository test suite: 86/86 PASS; MOS suite: 67/67 PASS.
- PostgreSQL 15 migration chain through W1C-B1: PASS.
- SQL functional smoke (issue, delayed retry after fact/cancellation change, replace, immutable prior lines, delayed
  void retry, PII): PASS and transaction rollback.
- Exceptional rollback on unused schema: PASS; object removal verified.
- Exceptional rollback with synthetic invoice evidence: correctly refused and preserved evidence.
- `npm run lint`, `npm run typecheck`, `npm run build`, structure/agent validation and `git diff --check`: PASS.
- Visual QA: 1440 px and 390 px, no horizontal overflow; primary action height 46 px.
- PDF visual QA: branded letter invoice PASS; exact 4 x 6 thermal label PASS with vector-only A7 outline and no raster blot.
- Production-font correction (2026-09-01): the first CSS-embedded-font deployment `dpl_7xpQaZzkQwbWt4rGe85nK4Jkg4WX` was rejected after a newly downloaded Production label still rendered tofu/square glyphs. The renderer now converts every dynamic glyph to SVG vector outlines using the pinned Inter asset, so invoice/label output no longer depends on host fonts or librsvg `@font-face` support. MCO-1003 invoice and label were re-rendered at 144/200 DPI with every dynamic field legible. The focused document contract is 18/18 PASS and the full repository gates remain PASS. Replacement Production deployment `dpl_GMmUS57uU8T2expcNArwdU8suHAf` is READY and aliased to `a7laundry.com`; rollback remains `dpl_7xpQaZzkQwbWt4rGe85nK4Jkg4WX`.
- Production migration: only `20260830080000` applied to Supabase Orlando `wiwawtpaxnrueugppasi`.
- Production artifact: `dpl_BcZRqwNyHPRkJWeGC5TrPdqvoC7B`, target Production, aliases `a7laundry.com` and `www.a7laundry.com`, READY.
- Release-scope verifier: W1B + W1C-A + W1C-B1 + PDFs present; W2/W3 endpoints, migrations and executable symbols absent.
- Team access: existing protected Owner variable preserved; `A7_SYSTEM_TEAM_USERS_JSON` adds Andreia Batista Batemarque as `operator`; `A7_SYSTEM_ACCESS_MODE=team`.
- Authenticated Production smoke: operator login/session, private boundary, catalog, Owner-only denials, document route, shell, release scope and public-secret scan all PASS.
- Smoke created no order, invoice, payment, refund or database residue. Stripe, WhatsApp, Google Ads and `/order` were not changed.
- Rollback remains ready at `dpl_CyR1PBmX9E85V39JDG2gRFDjtH63`; not required.
