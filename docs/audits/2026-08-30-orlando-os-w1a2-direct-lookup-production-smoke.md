# A7 Orlando OS — W1A.2 Direct Lookup Production Smoke

**Date:** 2026-08-30
**Outcome:** `LIVE AFTER CORRECTED CUTOVER`

## Authorized scope

Publish only the direct order-number lookup refinement. No migration, customer feature, Stripe,
WhatsApp, Google Ads, GA4 or lifecycle mutation was authorized in this cutover.

## Deployment and evidence

- Previous healthy Production: `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa`.
- Candidate published: `dpl_DUNKsqDLKKL8YRrxtSgMyPnbX6su`.
- Build and alias assignment succeeded.
- Homepage returned `200`.
- Unauthenticated system session and order endpoints returned `401`.
- Production HTML contained the new `1002` placeholder and helper text.

## Authenticated failure

The Owner-session smoke submitted `1002`. The API request completed, but browser code tried to read
`event.currentTarget.elements` after an asynchronous `await`. The browser event had already cleared
`currentTarget`, producing `Cannot read properties of null (reading 'elements')`.

## Containment

- Immediate rollback restored `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa` and all Production aliases.
- Homepage returned `200` after rollback.
- No migration ran and no order/customer/payment state changed.

## Local correction

The submit handler now captures `const form = event.currentTarget` before awaiting the API request and
uses that stable reference afterward. A focused source regression test and local authenticated browser
smoke confirm the null-reference failure no longer occurs.

## Release gate

The first candidate remained rolled back until a second explicit Production GO authorized only the corrected
direct-number lookup. Clientes Lite remained local and was not bundled into the release.

## Corrected cutover

- Corrected Production deployment: `dpl_CRuPu4vnmTxhPahd4tAytNxd94Gk`.
- Immediate rollback target: `dpl_5FQZ1JYcYBFoZoUgD5joV6QGoyaa`.
- The isolated artifact passed lint, typecheck, public build and `vercel build --prod` before publication.
- The artifact contained the direct-number lookup correction and no Clientes Lite route, API or UI.
- `https://a7laundry.com/sistema` returned `200` with the `1002` lookup helper.
- `https://www.a7laundry.com/sistema` followed its existing redirect to the same corrected main-domain page.
- Unauthenticated session and order API probes remained `401`.

## Authenticated Owner smoke

- Numeric lookup `1002` normalized to `MCO 1002` and returned the existing QA order plus its Pickup Order action.
- Historical lookup `A7-ORL-1000` remained functional.
- No new order was created during the smoke.
- No migration or customer, order, payment, Stripe, WhatsApp, Google Ads, GA4 or `/order` mutation occurred.
- No PII or secret appeared in the public HTML, lookup URL or recorded evidence.

## Final gate

`GO` — W1A.2 direct-number lookup is live on the main Production domain. The prior healthy deployment remains
ready for immediate rollback. Clientes Lite still requires a separate migration and Production authorization.
