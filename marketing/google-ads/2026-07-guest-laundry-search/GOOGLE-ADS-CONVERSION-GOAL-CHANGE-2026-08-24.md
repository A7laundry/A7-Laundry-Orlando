# Google Ads — purchase-led conversion goal change

**Account:** A7 Laundry - 01 (`290-113-2891`)  
**Observed and changed:** 2026-08-24  
**Google Ads report window visible during change:** 2026-07-25–2026-08-23

## Before

- `A7 Guest Laundry - Stripe purchase`: active, primary, included in account goals, 11.00 all conversions, R$5,750.46 all-conversion value.
- `A7 - WhatsApp click (site)`: active, primary, included in account goals, 47.00 all conversions, zero assigned value.
- The account total of 58 conversions therefore mixed 11 verified purchases with 47 contact clicks.

## Change applied

`A7 - WhatsApp click (site)` was changed from **primary** to **secondary** under action optimization.

Post-save reload confirmed:

- category: `Contatos`;
- optimization: `Ação secundária`;
- not used for bidding optimization by default;
- reported only in `Todas as conversões`;
- one-per-click counting and the 90-day click window remained unchanged.

`A7 Guest Laundry - Stripe purchase` remained the primary purchase action. No campaign, budget, bid, keyword, ad, billing or delivery setting was changed.

## Reason

A WhatsApp click is contact intent, not a qualified lead or paid order. Keeping it primary let 47 microconversions outweigh 11 server-verified Stripe purchases in optimization and headline conversion reporting. The new state preserves the click as diagnostic evidence while making the commercial goal purchase-led.

## Rollback

If purchase volume proves too sparse for the active bid strategy and performance degrades materially, reopen `A7 - WhatsApp click (site)` → Settings → Action optimization and restore **Primary action used for bidding optimization**. Record the reason, timestamp and before/after performance window before rollback.

Do not roll back merely because the headline conversion count falls from the mixed 58 total toward the true primary-purchase count; that drop is the intended taxonomy correction.
