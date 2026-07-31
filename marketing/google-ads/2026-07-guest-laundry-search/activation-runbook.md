# Activation runbook — Google Guest Laundry Search

> **Control boundary:** creating paused drafts is allowed only in the confirmed account. Adding funds, enabling campaigns, changing account-level conversion goals or expanding the test requires explicit owner authorization.

## 1. Read-only verification

1. Confirm account `290-113-2891`, BRL and Brasília timezone.
2. Run `npm run preflight:google-ads:live`.
3. Confirm advertiser verification and billing documentation show no blocking alert.
4. Inspect account-level conversion goals without changing them.
5. Confirm auto-tagging is enabled.

Any identity, billing, destination or measurement failure is an immediate **NO-GO**.

## 2. Build paused

1. Create campaign `A7 | Search | Guest Laundry | Orlando | EN | JUL26` as **PAUSED**.
2. Set Search only, Google Search on, Search Partners off and Display expansion off.
3. Set location targeting to Presence only. Resolve each included place as the Florida/United States location before saving.
4. Set English only, R$70/day and Maximize Clicks with R$18 maximum CPC.
5. Install the exact Final URL suffix from `campaign-spec.yaml`.
6. Create the four ad groups, import the 16 exact/phrase keywords and apply the shared negative list.
7. Create one paused RSA per ad group from `responsive-search-ads.csv`.
8. Add the four sitelinks and callouts. Keep the call asset off.
9. Keep auto-created assets, final-URL expansion and auto-apply recommendations off.

After saving, confirm the campaign, all four ad groups and all four ads still show **PAUSED**.

## 3. Measurement test

1. Open the final landing URL with the test UTM parameters while the campaign remains paused.
2. Confirm the query parameters remain in the browser URL.
3. Open WhatsApp from the hero and confirm the draft includes `A7 Ref: google|guest_search_orlando|...`.
4. In GA4 DebugView or Realtime, confirm one `money_page_view` and one `whatsapp_click` for the test interaction.
5. Confirm page views and contact clicks are secondary; only verified paid Stripe purchases are immediately eligible as primary.
6. Record the test timestamp and result in the launch log or MOS.

Do not use the compact `A7 Ref` as an offline Google conversion identifier.

## 4. Final GO/NO-GO

GO requires:

- every checkbox in `preflight-checklist.md` completed;
- paused drafts reviewed for copy, URLs, locations and assets;
- English WhatsApp response flow tested;
- owner approval for R$70/day and R$490 maximum;
- sufficient funds for the authorized envelope;
- separate explicit authorization to enable the campaign.

Until then, the operational state remains **NO-GO / PAUSED**.

## 5. Controlled first seven days

- Review search terms and negatives daily.
- Reconcile clicks, contact attempts, qualified guest leads and verified orders separately.
- Record revenue in USD and media in BRL; add exchange-rate source/date only when calculating a blended return.
- Pause for review at 20 clicks with zero qualified leads.
- Pause for review at R$180 with zero qualified leads.
- Pause for review at R$350 with zero verified orders.
- Do not broaden keywords, add PMax or raise budget during the initial envelope.

The success event is verified guest-laundry revenue. A raw WhatsApp click, phone click or call is not a sale.
