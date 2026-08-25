# Preflight — Guest Laundry Search

## Current verdict

**NO-GO for activation. READY for paused draft build.**

## Identity and destination

- [ ] Account is exactly `290-113-2891`, BRL, Brasília timezone.
- [ ] Advertiser and billing documentation remain valid.
- [ ] Final domain is only `a7laundry.com`; no temporary Vercel domain.
- [ ] Public brand is A7 Laundry Orlando.
- [ ] Phone/WhatsApp is exactly `+1 407-670-8839`.
- [ ] Landing page returns HTTP 200 and visibly states US$3.25/lb, US$3.95/lb, US$50 minimum and Express availability.
- [ ] `npm run preflight:google-ads:live` passes against the public landing and tracking script.

## Campaign safety

- [ ] Campaign, ad groups and ads are created PAUSED.
- [ ] Search only; Search Partners and Display expansion OFF.
- [ ] Location option is Presence only.
- [ ] English only for this campaign.
- [ ] Exact and phrase match only; no broad match.
- [ ] Shared negative list applied before publication.
- [ ] Auto-apply recommendations, auto-created assets and final-URL expansion OFF.
- [ ] PMax, comforter, housekeeping, carpet and upholstery remain outside this test.

## Measurement

- [ ] Google Ads auto-tagging ON.
- [ ] Final URL suffix is installed exactly as specified; the Final URL itself is not replaced by a tracking template.
- [ ] Test click preserves GCLID and UTM values across the landing page.
- [ ] Attributed WhatsApp message contains `A7 Ref`.
- [ ] `sms_click`, `call_click` and page views are secondary; `whatsapp_click` is never labeled as a conversation, qualified lead or sale.
- [ ] Website WhatsApp is the primary mandatory-entry proxy; Stripe `purchase` remains secondary financial evidence until end-to-end attribution coverage is proven.
- [ ] Qualified-lead import remains OFF until the full click identifier is stored durably.
- [ ] Raw calls are not counted as sales.

## Copy and operations

- [ ] All RSA headlines are at most 30 characters and descriptions at most 90.
- [ ] No guarantee, top-rated claim, unsupported discount or protected park brand.
- [ ] Every Express ad says it is subject to availability.
- [ ] English WhatsApp replies are installed and tested.
- [ ] Operator records hotel/Airbnb, minimum acceptance, qualification, sale value and loss reason.

## Budget and authorization

- [ ] Owner explicitly approves R$70/day and R$490 maximum test spend.
- [ ] Funds are added only after all other items pass.
- [ ] Stop rules are recorded in the campaign notes.
- [ ] Final activation receives a separate explicit authorization.
