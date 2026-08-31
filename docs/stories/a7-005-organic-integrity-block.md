# Story A7-005 — Organic Integrity Block

**Status:** Done

**Closed:** 2026-08-16 — owner-authorized release; production deployment `dpl_GPHsLUQADbK4EA2RpgYyjCZhJLtJ` passed the public validation context and was aliased to `https://a7laundry.com`.
**Created:** 2026-08-06
**Source commit:** `a45994a` (`fix(organic): harden tracking and public claims`)
**Origin:** Retrospective split from `A7-003 — Conversion Observability`

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
  - "npm run build"
  - "git diff --check"
```

## Story

**As an** A7 Laundry growth operator,
**I want** the first organic-integrity increment isolated behind explicit evidence and automated gates,
**so that** it can be reviewed and released without incorrectly closing unrelated work in A7-003.

## Goal

Make the first organic-integrity increment independently reviewable and releasable by correcting public commercial facts, preserving trustworthy hotel handoffs, identifying WhatsApp origin beyond paid UTMs, removing duplicate or empty contact instrumentation, and recording Search Console query-to-page evidence before any redirect decision.

## Relationship to A7-003

This story contains only the completed organic increment originally recorded inside A7-003. It does not replace A7-003, which remains `In Progress` for its other work. The pending Google Ads native-report propagation check and the guest “how it works” carousel remain exclusively in A7-003.

The implementation predates this split and is fully contained in commit `a45994a`. This story is therefore a traceability and release-boundary correction; it does not authorize new implementation.

## Scope

### Included

- Public price-example corrections and property-approved hotel handoff language.
- WhatsApp source classification for organic search, AI assistants, referral and direct visits, while preserving campaign attribution.
- Removal of the verified empty GTM container and legacy inline contact tracking.
- Automated gates and tests protecting commercial math, source references and canonical contact events.
- Authenticated Search Console query-to-page evidence captured before redirects.

### Excluded

- Google Ads manager/service-account propagation and first successful native report.
- Campaign-aligned guest “how it works” carousel and caption.
- Any redirect, URL merge or canonical migration.
- Bloco 2 content, schema or editorial changes.
- Campaign activation, budget or delivery changes.

## Acceptance Criteria

- [x] Organic, referral, AI-assistant and direct WhatsApp opens carry a page-level `A7 Ref`; paid campaign references retain their UTM/click provenance.
- [x] Tracking events expose `origin_class`, `origin_source`, `landing_page` and `lead_reference`, with the source context persisted for the browser session.
- [x] The authenticated GTM audit records zero tags and zero pending changes for `GTM-KV9LGVRN` before its public snippets are removed.
- [x] Unified `a7-tracking.js` remains the canonical source for `whatsapp_click`, `sms_click` and `call_click`; inline contact events are removed and blocked by the build.
- [x] Public examples calculate 15 lb as US$48.75 billed at the US$50 minimum, 20 lb as US$65, and the 15–20 lb range as US$50–65.
- [x] Hotel delivery/handoff language requires a front desk, bell desk or other property-approved meeting point, and Express remains subject to capacity confirmation.
- [x] The production trust gate rejects stale US$43.50, US$44–58 and US$50–58 examples and rejects reintroduction of the empty GTM or inline contact handlers.
- [x] Search Console query-to-page evidence for same-day/drop-off and airport intent is archived before any redirect; no redirect is implemented in this increment.
- [x] Root lint, typecheck, tests, production build and `git diff --check` pass for the completed increment.

## Tasks / Subtasks

- [x] Audit Search Console query-to-page distribution for the two priority queries.
- [x] Audit the live GTM container and establish that it has no active or pending measurement configuration.
- [x] Correct public price math, comparison wording, hotel handoff claims and Express qualification.
- [x] Extend WhatsApp references and event parameters for organic, AI, referral and direct origins.
- [x] Remove empty GTM snippets and inline WhatsApp/SMS/telephone tracking across public HTML.
- [x] Add build gates for stale commercial examples, empty GTM and inline contact tracking.
- [x] Add automated tracking cases for organic, AI-assistant and direct origin classification.
- [x] Record implementation decisions, exclusions and query evidence in the organic plan and audit.
- [x] Run all required quality gates.

## Validation Evidence

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- Search Console (`sc-domain:a7laundry.com`, 2026-06-30 through 2026-08-04): `orlando same day drop off laundry service` recorded 40 impressions at position 13.8, split across the tourist same-day article (27), drop-off article (7) and homepage (6).
- Search Console: `orlando airport area laundry pickup and delivery` recorded 44 impressions at position 15.8, split across the tourist same-day article (35) and homepage (9); the airport page recorded none for that query.
- GTM container `GTM-KV9LGVRN`: zero tags and zero pending changes; functional measurement remains in `a7-tracking.js`.
- Redirect boundary: no same-day, hotel or airport redirect was applied.
- Release boundary: the evidence document records this increment as implemented locally and not yet published at the time of the audit.

## Dev Notes

- `a7-tracking.js` is the only public contact-event implementation retained by this increment. It owns origin classification, session persistence, lead-reference construction and GA4/Meta/Google contact dispatch.
- `scripts/build-site.mjs` is the production fail-closed gate for stale commercial examples, the retired GTM container and inline contact handlers.
- `scripts/test-tracking.mjs` exercises organic, AI-assistant and direct origin behavior in addition to the pre-existing paid attribution cases.
- The public HTML edits are mechanical trust/instrumentation corrections. They do not authorize redirects, campaign changes or new commercial promises.
- The numerical and authenticated-tool evidence is archived in `docs/audits/2026-08-06-seo-tracking-cleanup.md`; the operating sequence and deferred Bloco 2 are in `docs/PLANO-ORGANICO-COMPETITIVO-AGOSTO-2026.md`.

## Testing

- Run `npm run lint` and `npm run typecheck` for repository-level static validation.
- Run `npm test`; the tracking suite must retain paid attribution and pass organic, AI-assistant and direct reference cases.
- Run `npm run build`; the build must fail if stale price examples, `GTM-KV9LGVRN` or inline contact tracking are reintroduced.
- Run `git diff --check` before handoff.
- After deployment, probe the homepage, representative corrected pages and `/a7-tracking.js`; confirm HTTP 200, no empty GTM snippet and the expected origin fields in the deployed script.

## CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `.aios-core/core-config.yaml`. Quality validation uses the recorded manual and automated project gates.

## File List

The list below maps the exact files changed by commit `a45994a`. The original A7-003 bookkeeping entry is replaced by this story file to reflect the retrospective split.
- `a7-tracking.js`
- `about.html`
- `area-rug-cleaning.html`
- `blog/_TEMPLATE.html`
- `blog/a7-laundry-review.html`
- `blog/airbnb-host-laundry-tips-orlando.html`
- `blog/airbnb-laundry-service-orlando.html`
- `blog/book-laundry-whatsapp-orlando.html`
- `blog/comforter-cleaning-service-orlando-v2.html`
- `blog/comforter-cleaning-service-orlando.html`
- `blog/express-laundry-orlando.html`
- `blog/family-vacation-laundry-orlando.html`
- `blog/hotel-laundry-service-orlando.html`
- `blog/hotel-vs-pickup-laundry-orlando.html`
- `blog/how-often-wash-vacation-rental-linens.html`
- `blog/how-to-clean-comforter.html`
- `blog/index.html`
- `blog/laundry-aviana-resort.html`
- `blog/laundry-balmoral-resort.html`
- `blog/laundry-before-checkout-orlando.html`
- `blog/laundry-bella-vida-resort.html`
- `blog/laundry-celebration.html`
- `blog/laundry-champions-gate.html`
- `blog/laundry-clermont-fl.html`
- `blog/laundry-college-park.html`
- `blog/laundry-compass-bay-resort.html`
- `blog/laundry-convention-center-orlando.html`
- `blog/laundry-cost-orlando.html`
- `blog/laundry-davenport.html`
- `blog/laundry-disney-springs-area.html`
- `blog/laundry-emerald-island-resort.html`
- `blog/laundry-encore-resort-reunion.html`
- `blog/laundry-festival-resort-davenport.html`
- `blog/laundry-for-vacation-rental-guests.html`
- `blog/laundry-highlands-reserve.html`
- `blog/laundry-international-drive-orlando.html`
- `blog/laundry-kissimmee.html`
- `blog/laundry-lake-buena-vista.html`
- `blog/laundry-magic-village-resort.html`
- `blog/laundry-margaritaville-resort-orlando.html`
- `blog/laundry-near-disney-world.html`
- `blog/laundry-near-seaworld-orlando.html`
- `blog/laundry-near-universal-orlando.html`
- `blog/laundry-oakwater-resort.html`
- `blog/laundry-oasis-club-championsgate.html`
- `blog/laundry-ocoee-fl.html`
- `blog/laundry-orlando-airport.html`
- `blog/laundry-paradise-palms-resort.html`
- `blog/laundry-port-canaveral-cruise.html`
- `blog/laundry-providence-resort.html`
- `blog/laundry-regal-oaks-resort.html`
- `blog/laundry-retreat-championsgate.html`
- `blog/laundry-runaway-beach-club.html`
- `blog/laundry-sand-lake-restaurant-row.html`
- `blog/laundry-service-orlando.html`
- `blog/laundry-solara-resort.html`
- `blog/laundry-solterra-resort.html`
- `blog/laundry-sonoma-resort-tapestry.html`
- `blog/laundry-southchase.html`
- `blog/laundry-storey-lake-resort.html`
- `blog/laundry-subscription-vacation-rental.html`
- `blog/laundry-terra-verde-resort.html`
- `blog/laundry-thornton-park.html`
- `blog/laundry-tips-orlando-vacation.html`
- `blog/laundry-tuscan-hills-davenport.html`
- `blog/laundry-veranda-palms-resort.html`
- `blog/laundry-villas-seven-dwarfs.html`
- `blog/laundry-vista-cay-resort.html`
- `blog/laundry-watersong-resort.html`
- `blog/laundry-west-haven-davenport.html`
- `blog/laundry-windermere-fl.html`
- `blog/laundry-windsor-hills-resort.html`
- `blog/laundry-windsor-island-resort.html`
- `blog/laundry-winter-garden-fl.html`
- `blog/lavanderia-a-domicilio-orlando.html`
- `blog/linen-towel-service-orlando.html`
- `blog/no-car-laundry-orlando.html`
- `blog/orlando-hotel-no-washer-laundry.html`
- `blog/orlando-laundromat-vs-delivery.html`
- `blog/orlando-vacation-rental-laundry-guide.html`
- `blog/pack-less-orlando-trip-laundry.html`
- `blog/reunion-resort-laundry-service.html`
- `blog/same-day-drop-off-laundry-orlando.html`
- `blog/same-day-laundry-orlando.html`
- `blog/same-day-laundry-tourists-orlando.html`
- `blog/snowbird-laundry-orlando.html`
- `blog/vacation-rental-checklist-orlando.html`
- `blog/vacation-rental-laundry-orlando.html`
- `carpet-cleaning.html`
- `comforter-cleaning-v2.html`
- `comforter-cleaning-v4.html`
- `comforter-cleaning-v5.html`
- `comforter-cleaning-v6.html`
- `comforter-cleaning.html`
- `curtain-cleaning.html`
- `docs/PLANO-ORGANICO-COMPETITIVO-AGOSTO-2026.md`
- `docs/audits/2026-08-06-seo-tracking-cleanup.md`
- `docs/stories/a7-005-organic-integrity-block.md`
- `index.html`
- `laundry-pickup-delivery-orlando.html`
- `mattress-cleaning.html`
- `plans.html`
- `privacy-policy.html`
- `scripts/build-site.mjs`
- `scripts/test-tracking.mjs`
- `service-areas.html`
- `shoe-cleaning.html`
- `upholstery-cleaning.html`
- `vacation-rental.html`

## PO Review Checklist

- [x] Confirm the scope contains no Google Ads propagation or carousel work.
- [x] Confirm every acceptance criterion is supported by commit `a45994a` or the archived audit evidence.
- [x] Confirm the implementation file list matches the commit, with story bookkeeping recorded separately.
- [x] Change status to `Ready for Review` only after validation.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5 family)

### Debug Log References

No unresolved debug log. Validation evidence is recorded above and in the linked audit.

### Completion Notes List

- The implementation was completed before this retrospective story split.
- No redirect, campaign mutation, budget change or Bloco 2 content work is included.
- Production publication remains a DevOps handoff after this PO review.

### File List

See the canonical `## File List` section above.

## QA Results

Pending independent QA/architect review; PO validation found the story release-ready with the repository gates passing.

## PO Validation Result

- **Decision:** GO
- **Implementation readiness:** 10/10 for retrospective review and release gating.
- **Confidence:** High.
- **Traceability:** Acceptance criteria map to commit `a45994a` and the archived audit; no new implementation requirement was introduced.
- **Boundary:** A7-003 remains `In Progress` with its unrelated pending work intact.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-06 | 1.0 | Retrospective split of the completed organic-integrity increment from A7-003 for independent PO review and release gating. | @sm |
| 2026-08-06 | 1.1 | PO validation completed; executor, testing, agent record and release boundary added; status moved to Ready for Review. | @po |
