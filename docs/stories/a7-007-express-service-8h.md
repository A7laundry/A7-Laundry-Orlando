# Story A7-007 — Correct Express Service Duration from 6h to 8h

**Status:** Done

**Created:** 2026-08-10

**Source:** Requisito autoritativo de Dennis: “corrigir a informação de Express em 6 horas; vamos colocar isso para 8h”.

## Story

**As an** A7 Laundry Orlando customer or operator,  
**I want** the Express service to be consistently communicated as an 8-hour service,  
**so that** public promises, operational guidance and current marketing material reflect the approved duration.

## Business Invariants

- Express price remains **$3.95/lb**.
- Minimum order remains **$50**.
- Express requests remain accepted until **6 PM**; later requests are evaluated by the unit.
- Express remains **subject to availability**.
- Normal service remains **24h**.
- URLs, campaign IDs and internal analytics identifiers such as `express_6h` remain unchanged.

## Acceptance Criteria

- [x] Current public copy, multilingual variants, metadata, JSON-LD, FAQs, CTAs, calculators and WhatsApp prefilled messages communicate Express as 8h.
- [x] Current operational and marketing sources communicate Express as 8h while preserving price, minimum, cutoff and availability rules.
- [x] `llms.txt` and other current machine-readable content communicate Express as 8h.
- [x] `_archive/**`, completed stories, audit evidence, filenames, URLs and internal analytics identifiers remain unchanged.
- [x] A deterministic validation gate rejects obsolete customer-facing Express 6h variants without rejecting the valid 6 PM cutoff.
- [x] The production build rejects obsolete public prices $2.90/lb and $3.20/lb.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check` pass in the isolated release worktree.
- [x] Production publication is performed only after Dennis's explicit authorization on 2026-08-11.

## Tasks

- [x] Inventory current Express-duration references and classify exclusions.
- [x] Correct active public, SEO, structured-data, operational and marketing sources.
- [x] Add the obsolete-duration regression guard.
- [x] Run quality gates and review commercial invariants; record the unrelated attribution-suite blocker.
- [x] Update this checklist, completion notes and File List.

## Scope Notes

- `_archive/**`, `docs/stories/**` historical records and audit evidence are excluded.
- Active reusable HTML creative sources are included; historical binary creative evidence is not rewritten.
- `6 PM` is a cutoff, not a duration, and must not be changed to `8 PM`.

## Validation Notes

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `node scripts/validate-site.mjs --validation-context=repository`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `npm test`: passed in the isolated release worktree, excluding the unrelated in-progress attribution files from the original dirty worktree.
- Final inventory found no obsolete Express 6-hour duration in the guarded current scope and no accidental 8 PM cutoff.
- Vercel preview `dpl_7nAtMacey1gvtNsiuwbDirj4ERQs`: Ready; authenticated page checks passed.
- Vercel production `dpl_CEPs1V3aboJQB5WsYsLKkrfrFJJu`: Ready and aliased to `a7laundry.com` on 2026-08-11.
- Post-deploy checks confirmed $3.25/lb Normal, $3.95/lb Express, $50 minimum and Express 8h on the home, plans, Guest Laundry landing and pricing blog page.

## Completion Notes

- Updated current public pages, multilingual content, SEO/JSON-LD, blog articles, booking labels, WhatsApp copy, operator sources and reusable creative HTML from Express 6h to Express 8h.
- Preserved $3.95/lb, $50 minimum, Normal 24h, 6 PM cutoff and availability qualification.
- Preserved archives, historical evidence and internal analytics identifiers.
- Added repository and production-build guards against reintroducing the obsolete duration.
- Release prepared in an isolated worktree from commit `516651b`; unrelated attribution and local work were excluded.
- The validated preview was promoted to production without rebuilding a different source set.

## File List

- `MANIFESTO.md`
- `README.md`
- `a7-command-center.html`
- `about.html`
- `blog/TEMPLATE-GUIDE.md`
- `blog/_TEMPLATE.html`
- `blog/a7-laundry-review.html`
- `blog/airbnb-host-laundry-tips-orlando.html`
- `blog/airbnb-laundry-service-orlando.html`
- `blog/book-laundry-whatsapp-orlando.html`
- `blog/comforter-cleaning-service-orlando-v2.html`
- `blog/comforter-cleaning-service-orlando.html`
- `blog/express-laundry-orlando.html`
- `blog/family-vacation-laundry-orlando.html`
- `blog/hotel-laundry-service-orlando.html`
- `blog/hotel-vs-pickup-laundry-orlando.html`
- `blog/how-to-clean-comforter.html`
- `blog/index.html`
- `blog/laundry-aviana-resort.html`
- `blog/laundry-balmoral-resort.html`
- `blog/laundry-before-checkout-orlando.html`
- `blog/laundry-bella-vida-resort.html`
- `blog/laundry-celebration.html`
- `blog/laundry-champions-gate.html`
- `blog/laundry-clermont-fl.html`
- `blog/laundry-college-park.html`
- `blog/laundry-compass-bay-resort.html`
- `blog/laundry-convention-center-orlando.html`
- `blog/laundry-cost-orlando.html`
- `blog/laundry-davenport.html`
- `blog/laundry-disney-springs-area.html`
- `blog/laundry-emerald-island-resort.html`
- `blog/laundry-encore-resort-reunion.html`
- `blog/laundry-festival-resort-davenport.html`
- `blog/laundry-for-vacation-rental-guests.html`
- `blog/laundry-highlands-reserve.html`
- `blog/laundry-international-drive-orlando.html`
- `blog/laundry-kissimmee.html`
- `blog/laundry-lake-buena-vista.html`
- `blog/laundry-magic-village-resort.html`
- `blog/laundry-margaritaville-resort-orlando.html`
- `blog/laundry-near-disney-world.html`
- `blog/laundry-near-seaworld-orlando.html`
- `blog/laundry-near-universal-orlando.html`
- `blog/laundry-oakwater-resort.html`
- `blog/laundry-oasis-club-championsgate.html`
- `blog/laundry-ocoee-fl.html`
- `blog/laundry-orlando-airport.html`
- `blog/laundry-paradise-palms-resort.html`
- `blog/laundry-port-canaveral-cruise.html`
- `blog/laundry-providence-resort.html`
- `blog/laundry-regal-oaks-resort.html`
- `blog/laundry-retreat-championsgate.html`
- `blog/laundry-runaway-beach-club.html`
- `blog/laundry-sand-lake-restaurant-row.html`
- `blog/laundry-service-orlando.html`
- `blog/laundry-solara-resort.html`
- `blog/laundry-solterra-resort.html`
- `blog/laundry-sonoma-resort-tapestry.html`
- `blog/laundry-southchase.html`
- `blog/laundry-storey-lake-resort.html`
- `blog/laundry-subscription-vacation-rental.html`
- `blog/laundry-terra-verde-resort.html`
- `blog/laundry-thornton-park.html`
- `blog/laundry-tips-orlando-vacation.html`
- `blog/laundry-tuscan-hills-davenport.html`
- `blog/laundry-veranda-palms-resort.html`
- `blog/laundry-villas-seven-dwarfs.html`
- `blog/laundry-vista-cay-resort.html`
- `blog/laundry-watersong-resort.html`
- `blog/laundry-west-haven-davenport.html`
- `blog/laundry-windermere-fl.html`
- `blog/laundry-windsor-hills-resort.html`
- `blog/laundry-windsor-island-resort.html`
- `blog/laundry-winter-garden-fl.html`
- `blog/lavanderia-a-domicilio-orlando.html`
- `blog/no-car-laundry-orlando.html`
- `blog/orlando-hotel-no-washer-laundry.html`
- `blog/orlando-vacation-rental-laundry-guide.html`
- `blog/pack-less-orlando-trip-laundry.html`
- `blog/reunion-resort-laundry-service.html`
- `blog/same-day-drop-off-laundry-orlando.html`
- `blog/same-day-laundry-orlando.html`
- `blog/same-day-laundry-tourists-orlando.html`
- `blog/snowbird-laundry-orlando.html`
- `blog/vacation-rental-laundry-orlando.html`
- `carpet-cleaning.html`
- `criativos/boldtype.html`
- `criativos/clean.html`
- `criativos/duotone.html`
- `criativos/editorial.html`
- `criativos/glass.html`
- `criativos/gradient.html`
- `criativos/impact.html`
- `criativos/index.html`
- `criativos/lifestyle.html`
- `criativos/minimal.html`
- `criativos/neon.html`
- `criativos/painel.html`
- `criativos/retro.html`
- `criativos/social.html`
- `criativos/split.html`
- `docs/PLANO-ORGANICO-COMPETITIVO-AGOSTO-2026.md`
- `docs/stories/a7-007-express-service-8h.md`
- `index.html`
- `laundry-pickup-delivery-orlando.html`
- `llms.txt`
- `marketing/OPERACAO-FUNIL.md`
- `marketing/PLAYBOOK-ATENDIMENTO.md`
- `marketing/SEO-KEYWORD-GAPS.md`
- `marketing/SITE-CRO-AUDIT.md`
- `marketing/data/custos-servico.csv`
- `marketing/google-ads/2026-07-guest-laundry-search/README.md`
- `marketing/google-ads/2026-07-guest-laundry-search/responsive-search-ads.csv`
- `marketing/meta-ads/campaigns/2026-07-tourist-hotel-geo-leads/lead-form.md`
- `marketing/meta-ads/pricing-rules.md`
- `marketing/whatsapp/STATUS-OPERACIONAL-2026-07-31.md`
- `marketing/whatsapp/assets/2026-07-guest-onboarding/INVENTORY.md`
- `marketing/whatsapp/message-templates.md`
- `payment-link.html`
- `plans.html`
- `scripts/build-site.mjs`
- `scripts/validate-site.mjs`
- `upholstery-cleaning.html`
