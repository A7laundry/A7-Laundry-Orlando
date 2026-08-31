# Google Search Console evidence — 2026-07-22

Read-only exports from the domain property `sc-domain:a7laundry.com`. The files below are canonical copies; the browser downloads remain untouched.

## Canonical exports

| File | Source report | Reporting period / snapshot | SHA-256 |
|---|---|---|---|
| `A7_GSC_2026-06-30_2026-07-17_PERFORMANCE.xlsx` | Performance: Overview, Queries, Pages, Countries, Devices, Search Appearance and Dates | 2026-06-30–2026-07-17 · Web · no filters | `252cadfa7137d0ed77b4c5fac725218bd573f229b763f3992186870abb81bfae` |
| `A7_GSC_2026-07-09_COVERAGE.xlsx` | Page indexing | Snapshot updated 2026-07-09 | `25c99ed854f66ff83a02151d3701d593bfa88eb2194e5bf5c76765c28f5a4660` |
| `A7_GSC_2026-07-21_HTTPS.xlsx` | HTTPS | Snapshot updated 2026-07-21 | `764ab5e1f8b420d7f73f937f2f85758121c881879d9418297ee38e80eb7e35c4` |
| `A7_GSC_2026-07-20_BREADCRUMBS.xlsx` | Breadcrumbs | Snapshot updated 2026-07-20 | `a85b57f36ab9433e5bade04a9cca7430e76256943ce2fb7d3bbea9a63dbd7f38` |
| `A7_GSC_2026-07-20_REVIEW_SNIPPETS.xlsx` | Review snippets | Snapshot updated 2026-07-20 | `cc0719a49b2849dbf5da4c4fbb2e35cb800ca2bdb783f64d43ba1cf553004fa0` |

All five files passed ZIP-container integrity checks after copying.

## Reports without an export

- Sitemaps: the GSC interface did not expose an export action. The read-only UI audit recorded `https://a7laundry.com/sitemap.xml` as processed, 62 discovered URLs, 0 videos, submitted and read on 2026-07-16, with no errors or warnings.
- Core Web Vitals: the overview did not expose an export and showed insufficient 90-day field data for both mobile and desktop.

## Verification boundary

The MOS core GSC metrics were reconciled separately in the read-only browser audit. This evidence package proves the identity and immutability of the downloaded XLSX files. Independent cell-level workbook inspection was not performed in this session because the required spreadsheet inspection runtime was unavailable; do not describe these XLSX files as independently parsed or cell-reconciled.
