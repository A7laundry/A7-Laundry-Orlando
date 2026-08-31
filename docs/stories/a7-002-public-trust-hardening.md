# Story A7-002 — Public Trust Hardening

**Status:** Done

**Created:** 2026-07-17

**Source:** Post-deploy credibility audit requested by project owner

## Goal

Ensure every claim in the public production bundle is traceable to the canonical manifesto or verified Google Business evidence.

## Acceptance Criteria

- [x] Public pages contain no invented named testimonials.
- [x] Public pages contain no unsupported certifications, rankings, customer counts, medical claims or operational guarantees covered by the trust gate.
- [x] Express service is consistently described as subject to availability.
- [x] Legacy experiment pages and the unsafe carpet campaign are not deployed.
- [x] Automated tests block known fabricated names and unsupported claims from the production bundle.
- [x] Production build and post-deploy HTTP checks pass.

## Tasks

- [x] Retire unsafe legacy routes and experiments.
- [x] Replace specialty-page testimonials with verified company-level Google reviews.
- [x] Remove unsupported quantitative and certification claims.
- [x] Add trust gates to the build.
- [x] Validate and deploy.

## File List

- `docs/stories/a7-002-public-trust-hardening.md`
- `vercel.json`
- `scripts/build-site.mjs`
- `README.md`
- `carpet-cleaning.html`
- `upholstery-cleaning.html`
- `comforter-cleaning.html`
- `comforter-thanks.html`
- `vacation-rental.html`
- `blog/a7-laundry-review.html`
- `blog/comforter-cleaning-service-orlando-v2.html`
- `blog/express-laundry-orlando.html`
- `blog/orlando-vacation-rental-laundry-guide.html`

## Validation Notes

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed.
- `npm run build` — passed; production trust gate passed.
- `git diff --check` — passed.
- `vercel build --prod` — passed.
- Production deployment: `dpl_8Mh7gKWYN8ojzU9uykgUivUHg2NH`, aliased to `https://a7laundry.com`.
- HTTP 200: `/`, `/carpet`, `/upholstery`, `/comforter`, `/vacation`, Express article.
- Redirect verified: `/carpet-campaign` → `/carpet`; `/comforter-v3` → `/comforter`.
- HTTP 404: direct retired campaign and comforter experiment files.
