# Story A7-009 — MOS Immutable Audit Registry

**Status:** Done

**Created:** 2026-08-15

**Source:** Requisito autoritativo de Dennis: o MOS deve preservar todas as auditorias anteriores; uma atualização nunca pode substituir o histórico e obrigar a repetição de auditorias já realizadas.

## Story

**As an** A7 Laundry operator or decision-maker,
**I want** every MOS audit stored in an append-only registry with its original evidence,
**so that** I can open and compare any prior audit after newer data is collected.

## Business Invariants

- A new audit appends a new immutable record; it never overwrites or deletes a prior record.
- “Latest” is a derived pointer to the newest audit, never the storage location of the only audit.
- Historical, live and manual data remain visibly separated.
- Missing historical facts are recorded as unavailable or partial; values are never invented.
- Every referenced evidence file is protected by a SHA-256 checksum.
- The protected MOS authentication boundary remains unchanged.

## Acceptance Criteria

- [x] A versioned registry lists every traceable historical audit and evidence checkpoint currently present in the repository.
- [x] The complete 27 July MOS KPI snapshot is preserved as an immutable dated artifact.
- [x] The CLI can list, show, validate and compare audits without requiring the UI.
- [x] Creating an audit with an existing ID fails and does not modify the existing record.
- [x] Registry validation detects missing evidence, changed evidence, a fork/cycle/missing predecessor and a broken hash chain.
- [x] A late backfill with an older audit date appends to the ledger without rewriting earlier records or replacing the latest chronological audit pointer.
- [x] The MOS bundle contains the complete registry and immutable snapshot artifacts, not only the latest snapshot.
- [x] The MOS interface exposes an audit timeline, audit detail and comparison between two selected audits.
- [x] Partial documentary audits never display invented KPI values.
- [x] Automated regression tests prove that adding a newer audit or late backfill preserves every older audit byte-for-byte.
- [x] Existing A7-008 data-truth and authentication tests continue to pass.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, MOS tests and `git diff --check` pass before review.
- [x] Dennis separately authorized the production deployment on 2026-08-16; no campaign or business-data mutation occurred.

## Tasks

- [x] Inventory traceable audits and evidence checkpoints.
- [x] Define the immutable audit schema and hash-chain rules.
- [x] Preserve the existing KPI snapshot under a dated immutable path.
- [x] Create the append-only CLI and generated browser registry.
- [x] Backfill historical audit records from repository evidence without invention.
- [x] Add timeline, detail and comparison UI.
- [x] Add immutability, migration, build and UI regression coverage.
- [x] Run quality gates and update this story's validation notes and File List.

## Scope Notes

- Repository-backed records are the first authoritative persistence layer for audited releases.
- Automatic scheduled collection may later append through durable database/object storage, but ephemeral server files must never be treated as durable history.
- A documentary checkpoint can have zero normalized metrics and still be a valid partial audit when its evidence is preserved.

## Validation Notes

- Twelve traceable audit checkpoints were migrated, covering 10 Jul–6 Aug 2026; documentary checkpoints without normalized metrics remain `partial`.
- The two reports found during final inventory were appended as late backfills. The first 10 audit files remained byte-for-byte unchanged.
- `mos-kpis.js` and `mos-data/snapshots/2026-07-27-mos-kpis.js` have the same SHA-256: `fc3d0b6c82544eaef801e37a087d2099b01c9b72f73ebfaf4857f5fe17a6c380`.
- `npm run mos:audit:validate`: passed — 12 immutable audits and a complete hash chain.
- CLI `list`, `show` and `compare`: exercised successfully against the migrated registry.
- Registry regression tests: passed for overwrite refusal, late backfill, byte preservation, evidence tampering and complete browser compilation.
- `cd mos-app && npm test`: passed — 37 tests plus protected bundle build and authentication coverage.
- DOM-level MOS UI regression test: passed for 12-card timeline, detail, checksum visibility, snapshot selection and no-invention comparison state.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `git diff --check`: passed on 2026-08-15.
- In-app visual automation was unavailable because the session browser plugin referenced a removed cache version; no environment-global workaround was applied.
- Authorized production deployment `dpl_FKnLn5W8vrLH9drFXk66jXRgoXGq` reached `READY` and was aliased to `https://mos.a7laundry.com` on 2026-08-16.
- Production authentication probes confirmed `/audit-registry.js` is inaccessible without a valid MOS session.

## File List

- `docs/stories/a7-009-mos-immutable-audit-registry.md`
- `a7-command-center.html`
- `mos-data/migration-catalog.json`
- `mos-data/audits/*.json`
- `mos-data/snapshots/2026-07-27-mos-kpis.js`
- `scripts/lib/mos-audit-registry.mjs`
- `scripts/mos-audits.mjs`
- `scripts/test-mos-audit-registry.mjs`
- `mos-app/generated/audit-registry.js`
- `mos-app/scripts/build.mjs`
- `mos-app/tests/dashboard.test.mjs`
- `mos-app/package.json`
- `package.json`
