# Google Ads conversion tracking audit — 2026-07-29

## Scope

Account `290-113-2891` (`A7 Laundry - 01`), public acquisition site and unified tracking source. Stripe purchase tracking was inspected but intentionally excluded from this implementation at the owner's request.

## Findings before remediation

| Funnel signal | Site/GA4 | Google Ads before remediation | Finding |
|---|---|---|---|
| WhatsApp open | `whatsapp_click` emitted with attribution | No dedicated action | Observable in GA4, unavailable to native Google Ads optimization |
| Phone-button click | `call_click` emitted with attribution | No website-click action | Diagnostic click existed, but it did not prove that a call happened |
| Call directly from ad | Not a site event | `Calls from ads` active | Existing and preserved |
| Call after visiting site | No duration measurement | Missing | Google could not connect a meaningful website-originated call to the ad |
| Pickup CTA | `pickup_cta_click` emitted | No conversion action | Correctly remains an intent signal, not a confirmed booking |
| Guest lead form | No operational Guest Laundry form | Missing | No truthful form-success event can be emitted yet |
| Qualified lead | No CRM/MOS import | Missing | Requires retained click ID and operational qualification status |
| Stripe purchase | Native action exists but was inactive | Excluded | No change in this increment |

The account also contained locked Business Profile call actions. They were not edited. The live GTM container previously audited with zero published tags means the public site continues to depend on `/a7-tracking.js`.

## Remediation performed

1. Created native Google Ads action `A7 - WhatsApp click (site)`.
   - Destination: `AW-17146169189/dhI0CO_7xNgcEOWO9-8_`
   - Count: one per ad interaction
   - Monetary value: zero
   - Meaning: WhatsApp was opened; this is not a qualified lead or sale
2. Created native Google Ads action `A7 - Website call 60s`.
   - Destination: `AW-17146169189/83lbCLK53NgcEOWO9-8_`
   - Official destination and display number: `+1 407-670-8839`
   - Qualification threshold: 60 seconds
   - Monetary value: not assigned
   - Uses a Google forwarding number only for eligible ad-originated visits; calls still route to the official A7 number
3. Kept enhanced conversions disabled. No email, phone or other customer-provided data was authorized for transmission in this increment.
4. Updated `/a7-tracking.js` to:
   - send the WhatsApp native conversion once through the unified click listener;
   - configure the 60-second website-call conversion;
   - retain GA4 `whatsapp_click`, `call_click`, `sms_click` and `pickup_cta_click` diagnostics;
   - avoid counting a phone-button click as a completed call.
5. Added automated tests and production build guards for both Google Ads destinations and the official `8839` number.

## Deliberate boundaries

- No Stripe code, conversion action or payment flow was changed.
- No generic `generate_lead` event was added because Guest Laundry has no operational lead form with a verified success state.
- `pickup_cta_click` was not mislabeled as a booking.
- A real form submission, confirmed pickup or operator-qualified lead must be introduced as a separate event when that workflow exists.
- No customer data is collected or transmitted by the new implementation.

## Acceptance checks

- WhatsApp click emits GA4 `whatsapp_click` and native Google Ads `conversion`.
- Phone link emits GA4 `call_click`, but not the 60-second call conversion.
- Google Ads phone configuration pins the official `+1 407-670-8839`.
- Campaign attribution remains available through UTM, GCLID/GBRAID/WBRAID and `A7 Ref`.
- Production build fails if either conversion destination or the official phone configuration regresses.
