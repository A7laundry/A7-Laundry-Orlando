# Story A7-010 — Secure Payment Link Generator

**Status:** Done

**Created:** 2026-08-16

**Source:** Fechamento da release autorizado por Dennis. O gerador interno e a rota já estavam implementados localmente, mas ainda não possuíam teste automatizado nem credencial Vercel configurada.

## Story

**As an** A7 Laundry operator,
**I want** to generate a one-use Stripe Payment Link from an authenticated internal page,
**so that** every quoted order redirects to the verified confirmation flow without manual Stripe configuration.

## Business Invariants

- Only an operator holding `PAYMENT_LINK_TOKEN` can create a link.
- `STRIPE_SECRET_KEY` and `PAYMENT_LINK_TOKEN` remain server-side and never enter the browser bundle or Git.
- Amounts are USD, rounded to cents and limited to US$5–US$2,000.
- Each generated link allows one completed Checkout Session.
- Successful payment redirects to the existing verified confirmation endpoint with `{CHECKOUT_SESSION_ID}`.
- Creating a link does not claim that payment has occurred.

## Acceptance Criteria

- [x] Missing configuration fails closed with HTTP 503.
- [x] Missing or invalid operator token returns HTTP 401 before any Stripe request.
- [x] Invalid amount returns HTTP 400 before any Stripe request.
- [x] Valid input creates a Stripe Price and a one-use Payment Link with the verified confirmation URL.
- [x] Description and internal reference are bounded and stripped of control characters.
- [x] Automated tests cover method, configuration, authentication, amount validation, Stripe request contract and upstream failure.
- [x] Production and Preview Vercel environments contain encrypted `PAYMENT_LINK_TOKEN`.
- [x] The token is stored outside Git for operator retrieval.
- [x] Root lint, typecheck, tests, build and `git diff --check` pass.
- [x] Production probes confirm the page loads, unauthenticated API access fails closed and no secret is present in public artifacts.

## Tasks

- [x] Add server-handler regression tests.
- [x] Add tests to the root quality gate.
- [x] Configure the encrypted Vercel secret without printing it.
- [x] Deploy and validate production behavior.
- [x] Update validation notes and File List.

## Validation Notes

- Five focused handler tests passed for method, fail-closed configuration, authentication, amount bounds, text sanitation, Stripe request parameters and upstream failure.
- Root lint, typecheck, tests, public build, MOS tests and `git diff --check` passed before deployment.
- `PAYMENT_LINK_TOKEN` is encrypted in Vercel Production and in Preview for `feat/meta-ads-ops-structure`; `STRIPE_SECRET_KEY` remains encrypted in both environments.
- The operator token is stored in the macOS login Keychain as `A7 Laundry Orlando Payment Link Token`; no value was printed or written to Git.
- Production deployment `dpl_GPHsLUQADbK4EA2RpgYyjCZhJLtJ` reached `READY` and was aliased to `https://a7laundry.com`.
- Production `/payment-link` returned HTTP 200 with Express 8h and no secret pattern. GET `/api/create-payment-link` returned 405; unauthorized POST returned 401 rather than 503, proving the server configuration is present and fail-closed.
- No authorized production link was generated during verification, avoiding an unnecessary Stripe Price/Payment Link mutation.

## File List

- `docs/stories/a7-010-secure-payment-link-generator.md`
- `api/create-payment-link.js`
- `payment-link.html`
- `scripts/test-payment-link.mjs`
- `package.json`
- `vercel.json`
