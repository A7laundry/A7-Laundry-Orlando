# ADR — Site → MOS Growth Registry and Release Observation

**Status:** Approved for incremental delivery under A7-013  
**Date:** 2026-08-23  
**Decision owner:** `@architect`  
**Implementation authority:** `@dev`  
**Release authority:** `@devops`

## Context

The public site and MOS are separate Vercel projects. The source sitemap contains 97 URLs, the public build removes 35 quarantined routes and emits 62 indexable URLs, while the MOS candidate contains seven manually maintained funnels. A public release does not update that array. This already caused `/plans` to remain `source_candidate` after production promotion and omitted the deployed `SEO-LBV-SMS` alias.

The project also has parallel manual taxonomies in the MOS and `a7-tracking.js`. Tests used each hand-maintained list as its own expectation, so green tests did not prove corpus or release parity.

## Decision

Adopt a single versioned content/growth registry as the authorial classification source and compile every consumer from it. Delivery is incremental; no big-bang replacement is allowed.

### Truth axes

Keep these axes independent:

1. **Source state** — authorial lifecycle.
2. **Build/artifact state** — whether expected bytes were built.
3. **Deployment observation** — what an authenticated observer verified on preview or the production alias.
4. **Indexation intent and observation** — expected sitemap/robots versus public/GSC evidence.

The static public manifest may declare only `artifactState: built`. It cannot know whether its exact preview artifact was later promoted. `active_production` is derived only when the server-side observer fetches the same manifest and route hashes from `a7laundry.com` and records the successful observation in an append-only ledger.

### Control plane and data plane

- CLI is the authoring, discovery, validation and compilation control plane.
- The public site exposes a deterministic, non-sensitive artifact manifest.
- The authenticated MOS is a consumer. It must not become a second authoring surface.
- GA4, GSC, Meta and Google Ads are measurement sources. Missing or rejected data remains nullable and provenance-labeled.

### Registry model

Each asset must resolve to a stable identity, canonical route, source file, role, journey stage, geography, cluster/pillar, intent owner, audience, next action, conversion aliases, tracking identity, indexation policy and evidence/governance state.

Geography is orthogonal to TOFU/MOFU/BOFU. A regional transactional page is normally BOFU with a geographic scope; `geo` is not a journey stage.

During M1/M2 the governed data may be represented by an ESM registry module to preserve deterministic grouped imports. Before M5 makes the MOS a production consumer, it must compile to a schema-versioned JSON catalog and generated tracking map. Generated outputs are never edited manually.

### Manifest model

`dist/.well-known/a7-growth-manifest.json` is a safe artifact view. It may include:

- schema and registry hash;
- `artifactState: built`;
- canonical paths;
- stable public asset identifiers;
- intended indexation;
- public route hashes;
- non-sensitive stage/cluster/funnel metadata.

It must exclude source paths, evidence paths, owner identities, analytics rows, account IDs not already public, PII, secrets, cookies, tokens and every deployment observation field.

### Corpus reconciliation

Always report separately:

- A: source-deployable routes;
- B: source sitemap;
- C: final built sitemap;
- D: publicly observed sitemap;
- E: registry/MOS catalog.

The current baseline is B=97, quarantine=35 and C=62. Quarantined pages may still be served with `noindex,follow`; served does not mean indexable or an active acquisition funnel.

### Measurement joins

- GSC: exact normalized canonical; missing query/page row is not zero or indexation proof.
- GA4: prefer stable `asset_id`; canonical path fallback is labeled `mapped_path`.
- Google Ads: normalize `final_urls`; multi-destination rows are ambiguous and campaign cost must not be duplicated across assets.
- Search terms without a deterministic final URL remain at campaign/ad-group scope.
- Contacts, qualified leads, paid orders, revenue and margin remain separate stages.

The current `SEO-*` prefill strings are legacy editorial aliases, not durable attribution. Tracking removes the visible `A7 Ref` and replaces it with a short opaque reference. Revenue attribution requires the server-side attribution record joined to order/payment IDs.

## Delivery sequence

1. M0 baseline/freeze.
2. M1 registry contract and 97-route import.
3. M2 report-only reconciliation and known drift repair.
4. M3 deterministic artifact manifest.
5. M4 observer shadow and append-only ledger.
6. M5 MOS dual-read.
7. M6 prove 100% coverage.
8. M7 enable global fail-closed CI.
9. M8 live data joins, then native Google Ads.
10. M9 QA, exact promotion and monitoring.

Immediate validation may fail closed for every newly introduced route. Global enforcement over the legacy corpus activates only after M6 proves full reconciliation.

## Consequences

Positive:

- a release no longer relies on a manually flipped MOS label;
- new pages cannot silently bypass governance;
- 97 source and 62 public URLs remain distinguishable;
- tracking, sitemap and MOS can converge on one identity model;
- rollback changes an observed state without erasing history.

Costs and risks:

- two deployments still require careful dual-read migration;
- enabling global enforcement too early can block all releases;
- incorrect canonical-owner decisions can create SEO regressions;
- Google Ads native data remains unavailable until server-side credentials and report access succeed.

## Rejected alternatives

- Keep `FUNNEL_REGISTRY` as a manual MOS array — already produced factual drift.
- Treat the source sitemap as the production sitemap — ignores quarantine.
- Let the static manifest declare production — impossible with exact preview promotion without rebuild.
- Infer page-level Ads cost from campaign/search-term rows — can duplicate or fabricate attribution.
- Treat no GSC row as zero/noindex — unsupported by Search Console sampling and privacy limits.

