# Story A7-001 — Delivery Readiness Remediation

**Status:** Done

**Created:** 2026-07-17

**Source:** Repository and production audit requested by project owner

## Goal

Prepare the A7 Laundry digital platform for a clean client handoff by addressing the highest-risk findings from the delivery audit without changing the canonical business model.

## Acceptance Criteria

- [x] Internal dashboards, marketing strategy documents and campaign specs are not included in the public Vercel deployment.
- [x] Public service and campaign pages continue to receive every image asset they require.
- [x] The pricing page contains only verified Google reviews already approved on the home page.
- [x] Large images used by the home and pricing pages are replaced by optimized WebP derivatives.
- [x] Canonical pricing, comforter pricing, article count and tracking identifiers agree across active documentation.
- [x] Internal command-center pricing agrees with the canonical public pricing.
- [x] Vercel routes, sitemap targets, internal links, JSON-LD and JavaScript syntax validate successfully.
- [x] Project-level quality scripts exist and pass.

## Tasks

- [x] Add deployment exclusions and remove the public command-center route.
- [x] Replace unverified pricing-page testimonials with verified Google reviews.
- [x] Produce and wire optimized WebP assets.
- [x] Synchronize README, manifesto, creative standard and command center.
- [x] Run static validation and record results.

## File List

- `docs/stories/a7-001-delivery-readiness-remediation.md`
- `.vercelignore`
- `vercel.json`
- `plans.html`
- `index.html`
- `public/hero-resort-pool.webp`
- `public/hero-familia-orlando.webp`
- `public/familia-orlando-sem-preocupacoes.webp`
- `public/como-funciona-entrega-profissional.webp`
- `public/laundry-pickup-orlando.webp`
- `README.md`
- `MANIFESTO.md`
- `marketing/meta-ads/creative-production-standard.md`
- `a7-command-center.html`
- `a7-carpet-campaign/index.html`
- `package.json`
- `package-lock.json`
- `scripts/validate-site.mjs`
- `scripts/build-site.mjs`
- `.gitignore`

## Validation Notes

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed; routes, sitemap, internal links and JSON-LD validated.
- `npm run build` — passed; generated a 168-file, 45 MB public allowlisted bundle.
- `vercel build --prod` — passed; production output generated under `.vercel/output`.
- Production artifact inspection confirmed that `a7-command-center.html`, `marketing/`, `docs/`, Markdown and YAML campaign files are absent.
- Five full-resolution source images formerly totaling about 69 MB were replaced in active pages by WebP derivatives totaling about 1 MB.
- Production deployed with owner approval on 2026-07-17: `dpl_DUaKhmh2kiWAp9hCcu8qnZobfpYL`.
- Post-deploy HTTP checks passed for home, plans, privacy policy and optimized assets.
- Post-deploy checks confirmed HTTP 404 for `/command-center`, `/a7-command-center.html`, `/criativos/`, the growth playbook and campaign specs.
