# A7-036 — Repository cleanup and production baseline consolidation

**Status:** Done — repository clean and remotely preserved
**Date:** 2026-09-01
**Scope:** Git repository organization only; no Production, database, Stripe, WhatsApp, GA4 or Google Ads mutation.

## Objective

Leave the A7 Laundry Orlando repository clean and reproducible without losing approved Production code, future-wave work, internal audits, marketing evidence, generated customer documents or local scratch artifacts.

## Starting evidence

- Main worktree contained 171 dirty paths.
- 117 paths belonged to the already deployed Orlando OS/Home v2 baseline.
- 54 paths were outside that release: 22 under `tmp/`, 21 under `output/`, eight marketing paths, two audit documents and one local AIOS state file.
- Seven Git worktree records pointed to directories that no longer existed.
- The local `feat/meta-ads-ops-structure` branch mixed the Production baseline with unrelated and future-wave work.

## Preservation map

| Material | Durable location | State |
|---|---|---|
| Production baseline + Home v2 | `release/orlando-home-v2-production-20260901` at `5f42d34` | Pushed and validated |
| Pending Hotels/W2/W3 UI work | `wip/orlando-next-waves-preserved-20260901` at `a0e0a58` | Pushed and validated; not deployed |
| Historical Stripe reconciliation | `23f3375` on `chore/repository-cleanup-20260901` | Pushed and preserved |
| SEO and paid-media evidence | `c852bbb` on `chore/repository-cleanup-20260901` | Pushed and preserved |
| Generated PDFs/images and scratch files | Local `output/` and `tmp/` | Preserved byte-for-byte and ignored by Git |
| AIOS runtime state | Local `.aios/project-status.yaml` | Preserved and ignored by Git |
| Pre-cleanup complete snapshot | `safety/pre-repository-cleanup-2026-09-01` stash | Removed after exact remote hash verification |
| Older operational preview stash | `codex-exact-operational-preview-2026-08-28` | Preserved; outside this cleanup scope |

## Completed work

- [x] Created a reversible stash containing the complete dirty tree.
- [x] Fast-forwarded the approved Production/Home v2 baseline without conflicts.
- [x] Separated cleanup work from the previous Meta Ads branch.
- [x] Added Git ignore rules for local generated artifacts and AIOS runtime state.
- [x] Restored 44 local artifacts and verified zero missing files and zero hash mismatches.
- [x] Preserved future-wave differences in an isolated WIP branch.
- [x] Ran lint, typecheck, full tests and repository build on the Production baseline.
- [x] Ran lint, typecheck, 109 system tests, full tests and build on the WIP preservation branch.
- [x] Removed seven confirmed orphan worktree records.
- [x] Removed the two temporary live worktrees after their branches were protected.
- [x] Realigned local `feat/meta-ads-ops-structure` with its remote branch.
- [x] Confirmed the primary worktree is clean.

## Completion gate

- [x] Received explicit approval to push `chore/repository-cleanup-20260901`, including internal audit and marketing documents, to `A7laundry/A7-Laundry-Orlando`.
- [x] Pushed the cleanup branch and verified local and remote at `db5a7ed8d99ff3860ae725baba6bba16d8e23416`.
- [x] Dropped only `safety/pre-repository-cleanup-2026-09-01` after remote verification.
- [x] Preserved the older `codex-exact-operational-preview-2026-08-28` stash.
- [x] Confirmed the worktree remains clean and marked this story Done.

## Safety invariants

- Do not deploy the WIP branch.
- Do not modify Production or any external business system during repository cleanup.
- Do not remove `output/`, `tmp/` or `.aios/project-status.yaml` from the local filesystem.
- Do not drop the older 2026-08-28 stash.
- The cleanup safety stash may be dropped only after the cleanup branch is confirmed on the authorized remote. Completed on 2026-09-01.

## Verification evidence

- Production baseline gates: lint PASS; typecheck PASS; 96 system tests PASS; 86 general tests PASS; 67 MOS tests PASS; build PASS.
- WIP preservation gates: lint PASS; typecheck PASS; 109 system tests PASS; general tests PASS; MOS tests PASS; build PASS.
- Local artifact verification: 44 checked; zero missing; zero hash mismatches.
- Secret-shaped scan of committed audit/marketing payload: no matching secret patterns detected.
- Primary worktree after cleanup: clean on `chore/repository-cleanup-20260901`.
- Authorized remote verification: local and remote hashes matched at `db5a7ed8d99ff3860ae725baba6bba16d8e23416` before the cleanup stash was dropped.
