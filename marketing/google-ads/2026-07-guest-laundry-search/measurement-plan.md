# Measurement plan — Google Guest Laundry Search

## Conversion hierarchy

| Event | Google Ads role | Meaning |
|---|---|---|
| `money_page_view` | Observation | Landing page loaded; never a lead. |
| `whatsapp_click` | Primary interim signal | Visitor opened WhatsApp. Native Google Ads action: `A7 - WhatsApp click (site)`. This is contact intent, not a qualified lead or sale. |
| Website call lasting at least 60 seconds | Primary | Google forwarding-number measurement for calls that originate after an ad visitor reaches the site. Native action: `A7 - Website call 60s`. |
| `sms_click` / `call_click` | Observation | Contact-button click. A phone click alone is not counted as a qualified call. |
| `pickup_cta_click` | Observation | Visitor moved toward the pickup flow. It is not a confirmed booking. |
| `qualified_guest_lead` | Primary after import is operational | Hotel/resort/Airbnb guest, service match, Orlando service area, US$50 minimum accepted and pickup need confirmed. |
| `purchase` | Primary | Stripe session verified as paid, with currency and value. |

## Qualification fields

Operations records: timestamp, customer language, hotel/resort/Airbnb, service area, preferred pickup window, approximate bag size, minimum accepted, lead status, loss reason, order value, payment status, source, campaign, content and `A7 Ref`.

Invalid dating/relationship contacts are recorded as `invalid_non_service` and never imported as a conversion.

## Attribution now available

`a7-tracking.js` persists UTM parameters, GCLID/GBRAID/WBRAID/FBCLID and landing page for the browser session. It enriches GA4 events and appends a compact `A7 Ref` to attributed WhatsApp messages. This supports campaign/ad reconciliation.

## Native Google Ads actions configured on 2026-07-29

- `A7 - WhatsApp click (site)` → `AW-17146169189/dhI0CO_7xNgcEOWO9-8_`
- `A7 - Website call 60s` → `AW-17146169189/83lbCLK53NgcEOWO9-8_`
- Enhanced conversions remained disabled because this increment does not collect or transmit customer-provided data.
- The existing `Calls from ads` action remains responsible for calls made directly from Google ad assets.

## Remaining external configuration

1. Enable Google Ads auto-tagging.
2. Validate the two new native actions after the production tag receives real/test traffic.
3. Keep `call_click`, `sms_click` and `pickup_cta_click` diagnostic in GA4.
4. Reassess whether `whatsapp_click` should remain a primary bidding signal after qualified-lead import is operational.
5. Import verified `purchase` only when the owner resumes the Stripe measurement phase.
6. Create `qualified_guest_lead` only when a durable CRM/MOS import can retain the full Google click identifier and qualification timestamp.
7. Do not upload the manual ledger as an offline conversion unless the exact GCLID/GBRAID/WBRAID and consent requirements are satisfied.

The compact `A7 Ref` is useful for operations but is not a substitute for the full click identifier required by Google offline conversion import.
