# Story A7-010 — Secure Payment Link Generator

**Status:** In Progress

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

- [ ] Missing configuration fails closed with HTTP 503.
- [ ] Missing or invalid operator token returns HTTP 401 before any Stripe request.
- [ ] Invalid amount returns HTTP 400 before any Stripe request.
- [ ] Valid input creates a Stripe Price and a one-use Payment Link with the verified confirmation URL.
- [ ] Description and internal reference are bounded and stripped of control characters.
- [ ] Automated tests cover method, configuration, authentication, amount validation, Stripe request contract and upstream failure.
- [ ] Production and Preview Vercel environments contain encrypted `PAYMENT_LINK_TOKEN`.
- [ ] The token is stored outside Git for operator retrieval.
- [ ] Root lint, typecheck, tests, build and `git diff --check` pass.
- [ ] Production probes confirm the page loads, unauthenticated API access fails closed and no secret is present in public artifacts.

## Tasks

- [ ] Add server-handler regression tests.
- [ ] Add tests to the root quality gate.
- [ ] Configure the encrypted Vercel secret without printing it.
- [ ] Deploy and validate production behavior.
- [ ] Update validation notes and File List.

## Validation Notes

- Pending.

## File List

- `docs/stories/a7-010-secure-payment-link-generator.md`
- `api/create-payment-link.js`
- `payment-link.html`
- `scripts/test-payment-link.mjs`
- `package.json`
- `vercel.json`
