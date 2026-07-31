# GA4 export evidence — 2026-07-22

Read-only exports from GA4 account/property **A7 Laundry USA** for **2026-06-22 through 2026-07-21**. These canonical copies were preserved from the browser's Downloads folder; the originals were not moved or deleted.

## Canonical files

| File | SHA-256 |
|---|---|
| `A7_GA4_2026-06-22_2026-07-21_TRAFFIC_ACQUISITION.csv` | `3ace4263fd9d64431ca371e40613aa5b3d0895031b564dd9ece17700eac6af26` |
| `A7_GA4_2026-06-22_2026-07-21_USER_ACQUISITION.csv` | `4667b44e4cb15a8d6edf46664dd800f87c489e378ffe20f74b3677498e920611` |
| `A7_GA4_2026-06-22_2026-07-21_SOURCE_MEDIUM.csv` | `6b9828780e18165b0ddaa0c9e2117a4209402d2d207a9b1d36c879c6bbe86e54` |
| `A7_GA4_2026-06-22_2026-07-21_CAMPAIGNS.csv` | `44d512528742af9e4d191468a9be4cee87e20042c40b4330279f3cc05d63fcbe` |
| `A7_GA4_2026-06-22_2026-07-21_LANDING_PAGES.csv` | `72352825f07fb4bae3ba243cf3b123f17cd5aa1e62df486fb850197695c18458` |
| `A7_GA4_2026-06-22_2026-07-21_PAGES_SCREENS.csv` | `0cc660d566f045b528e507d9e65d7fdd0b5354df7f2c673d9b1433ab498c626b` |
| `A7_GA4_2026-06-22_2026-07-21_EVENTS.csv` | `13b2c0cf9a04e38726fc6ef2b10a28139f8b61214576931f3cb0a5037e86f124` |
| `A7_GA4_2026-06-22_2026-07-21_KEY_EVENTS_LEADS.csv` | `9ca92072c04ee61f3420b30930eda8b7f8d12b64f9f5c3e6bce997fc4f176c56` |
| `A7_GA4_2026-06-22_2026-07-21_GEOGRAPHY_COUNTRY.csv` | `151ff92fb5ccfd8f2de8c4c7e73a0665d032304c5ac8ab4d1eb1dada113665c7` |
| `A7_GA4_2026-06-22_2026-07-21_TECHNOLOGY_BROWSER.csv` | `2443c37491bd4c5546e37cde5ff94f74d80748f87ee16699d5f886ee43336dc1` |
| `A7_GA4_2026-06-22_2026-07-21_DAILY_DEVICE_USERS.csv` | `ffa8c36e9ba742ea9166cc5db0b0524d1177145dcfecfc26b9791016f71912da` |
| `A7_GA4_COMPARISON_2026-07-03_2026-07-10.csv` | `6c1837385361549af63c058c7ff376932e7696ee079b9cddb127b3cda3010e54` |
| `A7_GA4_COMPARISON_2026-07-11_2026-07-21.csv` | `80e9c02b7e9ba9933c1373a34284e44b1de94dee65fae9881ef5184ff811ac01` |
| `A7_GA4_2026-06-22_2026-07-21_ECOMMERCE_EMPTY.csv` | `2683e7ab11a697bb8909bdbf8437fc8e485adecf0b9f96701d6b2e51f5f47e35` |

## Integrity observations

- Traffic Acquisition has one canonical file plus three byte-identical duplicate downloads.
- Landing Pages and Events each have one byte-identical duplicate download.
- Ecommerce also has one byte-identical duplicate that was not called out in the browser summary.
- No original or duplicate in Downloads was deleted.
- No distinct Overview export was located. The generic acquisition exports are Traffic Acquisition reports, not a separate overview file.
- The ecommerce file contains headers and zero data rows, preserving evidence that no ecommerce item data was available.
- The events file contains `whatsapp_click`, `wa_fab_click`, `call_click`, and `phone_call`; it does not contain `purchase`, `begin_checkout`, or `generate_lead`.
- The lead acquisition file records zero new, qualified, and converted leads.

## Reliability use

These exports support traffic, acquisition, page, event, geography, device, and comparison-window observations. They do **not** establish purchases, revenue, customer count, or ROAS.
