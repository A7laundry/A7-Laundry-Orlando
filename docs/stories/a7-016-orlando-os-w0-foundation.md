# Story A7-016 — A7 Orlando OS W0 Foundation

**Status:** Done — Owner-only Production pilot

**Created:** 2026-08-30

**Source:** approved goal `88684f8c-fe3e-40e7-8c2e-587aacdfa6f5`

**Blueprint:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`

## Story

**As the** A7 Orlando owner,

**I want** a private, role-aware `/sistema` foundation,

**so that** the team can operate customer orders without exposing operational data or secrets.

## Authorization boundary

The Owner authorized a controlled Production pilot on 2026-08-30, conditional on a documented final GO
gate before any mutation. Initial access must be Owner-only. W1B+, Google Ads, WhatsApp, Stripe, `/order`,
financial-flow changes and new automation remain unauthorized.

## Acceptance criteria

- [x] Private login with secure signed session, future role support and Production `owner_only` fail-closed mode.
- [x] Every private API enforces authorization server-side.
- [x] `/sistema` is `noindex`, private/no-store and absent from public discovery artifacts.
- [x] Sanitized health endpoint exposes readiness without secrets or PII.
- [x] CLI/service path exists before the UI path.
- [x] Synthetic fixtures and auth/authorization tests exist.
- [x] Rollback is documented and does not require destructive migration.
- [x] No secret, PII or internal lifecycle identifier is exposed in URLs, logs or browser storage.

## Quality gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `git diff --check`
- [x] Production Owner-only smoke QA after GO

## File List

- `api/system/catalog.js`
- `api/system/health.js`
- `api/system/login.js`
- `api/system/logout.js`
- `api/system/order-draft.js`
- `api/system/orders.js`
- `api/system/session.js`
- `lib/system-auth.js`
- `lib/system-http.js`
- `scripts/a7-system-manual-order.mjs`
- `scripts/test-system-w0-w1a.mjs`
- `tests/fixtures/orlando-os-w1a-order.json`
- `docs/runbooks/a7-orlando-os-w0-w1a-preview.md`
- `docs/runbooks/a7-orlando-os-w0-w1a-production-pilot.md`
- `docs/audits/2026-08-30-orlando-os-w0-w1a-production-gate.md`
- `governance/content-registry.mjs`
- `scripts/build-site.mjs`
- `sistema-state.css`
- `vercel.json`
