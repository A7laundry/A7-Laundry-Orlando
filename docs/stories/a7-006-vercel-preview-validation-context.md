# Story A7-006 — Vercel Preview Validation Context

**Status:** Ready for Review

**Created:** 2026-08-06

**Source:** Failed Vercel preview `dpl_9UHfkwAeWonZ6sMxYFfqAjfot9EN` for branch `feat/meta-ads-ops-structure`, commit `7c39c61`

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
  - "npm run build"
  - "vercel build"
  - "git diff --check"
```

## Story

**As an** A7 Laundry release operator,
**I want** repository-only validation and public Vercel build validation to use explicit, deterministic contexts,
**so that** previews build from the publishable source set without exposing internal marketing files or weakening the stricter checks used in a complete local checkout.

## Goal

Restore the normal remote preview pipeline. A partial or excluded `marketing/` tree must not be misclassified as a complete campaign archive, while a complete repository checkout must continue to fail when the Lovart production brief or master image is missing.

## Incident Evidence

- Preview deployment `dpl_9UHfkwAeWonZ6sMxYFfqAjfot9EN` failed because `.vercelignore` excludes `marketing/`, but the build context still exposed `marketing/google-ads/2026-07-guest-laundry-search` sufficiently for `scripts/validate-site.mjs` to enter its repository-only branch.
- That branch then required two files absent from the public upload: `LOVART-HERO-PROMPT.md` and `assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png`.
- The Vercel log records 426 files removed by `.vercelignore`, followed by the two Lovart-source failures during `npm run build`; this story addresses that build-context classification failure, not runtime behavior.

## Scope

### Included

- Explicit validation contexts for a complete checkout and a public Vercel build.
- Strict local Lovart-source validation, regression coverage for both contexts and artifact-privacy verification.
- Standard remote preview flow without the prebuilt production workaround.

### Excluded

- Publishing internal files; weakening local source gates; changing public content, tracking, campaigns, A7-003, A7-005 or `AGENTS.md`.
- Production deployment or domain changes; those require a separate authorized release action.

## Acceptance Criteria

1. **Remote preview succeeds with the public source set**
   - [ ] A Vercel preview build completes when `marketing/`, `MANIFESTO.md`, `docs/` and other internal sources are excluded according to `.vercelignore`.
   - [ ] A partially materialized or empty internal directory cannot, by itself, select complete-repository validation.
   - [ ] The successful preview uses the standard remote build path; it does not depend on `vercel deploy --prebuilt`.

2. **Complete-repository gates remain strict**
   - [ ] In a complete checkout, validation still requires both `marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md` and `marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png`.
   - [ ] A regression test proves repository-context validation fails when either required source file is absent.
   - [ ] `npm test` and `npm run build` in the complete repository continue to execute the repository-context checks; no local gate is silently skipped because Vercel support was added.

3. **Public checks remain unconditional**
   - [ ] Every context continues to require the optimized public hero `public/guest-laundry-hero.webp`, the public landing-page references and the existing public trust/tracking validations.
   - [ ] The context boundary applies only to checks whose evidence is intentionally repository-private.

4. **Context selection is deterministic and observable**
   - [ ] Validation does not infer “complete repository” solely from the existence of `marketing/google-ads/2026-07-guest-laundry-search`.
   - [ ] The selected context is explicit in the command/configuration or derived from a complete, documented source-set contract.
   - [ ] Validation output identifies the selected context and states when repository-private checks are intentionally not applicable.
   - [ ] Unknown or contradictory context fails with an actionable error instead of silently weakening validation.

5. **Deployment privacy is preserved**
   - [ ] The generated Vercel artifact contains no `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md`, command center or other paths already classified as private.
   - [ ] `.vercelignore` is not relaxed to fix the preview.

6. **Regression coverage and release readiness**
   - [ ] Automated coverage includes: complete repository success, missing brief failure, missing master failure, public context success with internal paths absent, and public context success with a partial/empty internal directory.
   - [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `vercel build` and `git diff --check` pass before review.
   - [ ] The executor records the new successful preview deployment ID supplied by the authorized preview action and confirms that no production deployment was triggered by the validation run.

7. **Scope isolation**
   - [ ] A7-003 and A7-005 remain unchanged.
   - [ ] No customer-facing HTML, commercial value, tracking contract, campaign configuration or `AGENTS.md` is changed.

## Tasks / Subtasks

- [x] **Task 1 — Reproduce and classify the failed build context** (AC: 1, 4)
  - [x] Capture the failing validator messages from preview `dpl_9UHfkwAeWonZ6sMxYFfqAjfot9EN`.
  - [x] Record the remote source set and define the minimum reliable context contract.

- [x] **Task 2 — Separate public and repository-private validation contexts** (AC: 2, 3, 4)
  - [x] Refactor the build/validator entrypoints so the intended context is explicit or validated against a complete source-set contract.
  - [x] Keep public page, asset, trust and tracking gates active in every build context.
  - [x] Keep Lovart archive and other internal commercial-source gates mandatory in complete-repository quality commands.
  - [x] Fail closed for unsupported or contradictory context values.

- [x] **Task 3 — Add regression coverage** (AC: 1, 2, 4, 6)
  - [x] Add isolated fixtures or equivalent deterministic tests for repository and public contexts.
  - [x] Cover both missing-source failures, absent/partial public internals and context reporting.

- [ ] **Task 4 — Verify deployment privacy and standard preview flow** (AC: 1, 5, 6)
  - [x] Inspect the built artifact for every private path listed in AC 5.
  - [x] Run the local quality gates and a local Vercel build.
  - [ ] After review authorization, hand off the normal remote preview action to `@devops`; record the deployment ID and result returned by that authorized action.

- [x] **Task 5 — Update the story record** (AC: 6, 7)
  - [x] Record commands, results, implementation decisions and rollback notes.
  - [x] Update the File List with only files actually changed.
  - [x] Confirm via diff that A7-003, A7-005, customer-facing HTML and `AGENTS.md` were untouched.

## Dev Notes

### Existing behavior and failure boundary

- `.vercelignore` intentionally excludes `marketing/`, `docs/`, `AGENTS.md`, `MANIFESTO.md`, the command center and framework/process directories from the customer-facing deployment. Relaxing those exclusions is outside scope. [Source: `.vercelignore#L1-L30`]
- `scripts/validate-site.mjs` currently enables the Lovart repository-source checks when only `marketing/google-ads/2026-07-guest-laundry-search` exists. That single-directory existence check is the immediate false-positive boundary. [Source: `scripts/validate-site.mjs#L140-L148`]
- The same validator already treats other internal commercial checks as conditional on a fuller pair of source markers (`MANIFESTO.md` and `marketing/meta-ads/pricing-rules.md`), documenting that internal commercial sources are omitted from the public Vercel upload. [Source: `scripts/validate-site.mjs#L150-L218`]
- `scripts/build-site.mjs` invokes `scripts/validate-site.mjs` before recreating `dist/`; therefore the context contract must be wired through the normal build entrypoint, not bypassed after validation. [Source: `scripts/build-site.mjs#L1-L12`]
- `npm test` and `npm run build` both include static-site validation. The implementation must preserve their strict behavior in a full checkout. [Source: `package.json#scripts`]
- A7-001 established the deployment privacy boundary and previously verified that `marketing/`, `docs/`, Markdown/YAML campaign sources and the command center were absent from the production artifact. [Source: `docs/stories/a7-001-delivery-readiness-remediation.md#Acceptance-Criteria`; `docs/stories/a7-001-delivery-readiness-remediation.md#Validation-Notes`]

### Constraints for implementation

- Do not use the mere existence of a parent directory as proof that all repository-private evidence is available.
- Do not solve the incident by swallowing missing-file errors, broadly skipping `validate-site`, copying internal source files into the Vercel upload or weakening `.vercelignore`.
- Keep context selection testable without network access. The remote preview is release evidence, not the only regression test.
- Prefer the smallest change to existing Node-based build and validation scripts; no new framework, database, service or runtime dependency is authorized.
- Any choice between explicit command modes and a documented complete-source sentinel is an implementation detail requiring `@architect` review against AC 2–4.

### Suggested implementation touchpoints

- `scripts/validate-site.mjs`
- `scripts/build-site.mjs`
- `package.json`
- `vercel.json` only if the standard preview command must explicitly select public-build context
- A focused regression test under `scripts/` or the existing test layout
- `.vercelignore` may be asserted by tests but must not be relaxed

## Testing

- **Repository positive:** complete checkout passes and confirms both Lovart source files were validated.
- **Repository negative — brief:** validation fails when only the Lovart brief is unavailable.
- **Repository negative — master:** validation fails when only the Lovart master image is unavailable.
- **Public positive — absent internals:** public build context passes with internal source paths omitted.
- **Public positive — partial internals:** public build context passes when the parent campaign directory exists but private files are intentionally absent.
- **Context safety:** invalid or contradictory context fails with an actionable message; output reports the selected valid context.
- **Privacy:** built output rejects `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md` and the command center.
- **Regression gates:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `vercel build`, `git diff --check`.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-06 | 0.1 | Draft created from failed Vercel preview evidence | River (`@sm`) |
| 2026-08-06 | 0.2 | PO validation: incident evidence reconciled, agent authority clarified and story approved without relaxing deployment privacy | Pax (`@po`) |
| 2026-08-06 | 0.3 | Explicit repository/public validation contexts, offline regression coverage and local Vercel preview build implemented | Dex (`@dev`) |

## PO Validation

**Decision:** GO
**Readiness:** Ready for Review
**Implementation readiness:** 10/10
**Confidence:** High

- [x] Preview evidence verified: deployment `dpl_9UHfkwAeWonZ6sMxYFfqAjfot9EN` failed on commit `7c39c61` with the two Lovart-source errors described by the story.
- [x] Immediate failure boundary verified in `scripts/validate-site.mjs`: the existence of the campaign directory alone activates repository-private checks.
- [x] Executor assignment is valid: `@dev` implements code/validation logic and `@architect` performs the independent quality gate.
- [x] Remote preview authority is preserved through handoff to `@devops`; this story does not authorize `@dev` to push, release or deploy production.
- [x] `.vercelignore` remains strict and explicitly cannot be relaxed.
- [x] Public validation remains unconditional; only intentionally private source checks receive context-aware applicability.
- [x] Acceptance criteria are covered by sequenced tasks and deterministic offline regression cases.
- [x] Privacy, fail-closed context selection and artifact inspection are testable.
- [x] A7-003, A7-005, customer-facing HTML and `AGENTS.md` are protected by explicit scope-isolation criteria.
- [x] CodeRabbit skip notice is present; manual review applies because the integration is disabled.
- [x] No database, API, framework or runtime dependency is introduced.

**Skipped as not applicable:** greenfield setup, database/schema, API design, customer-facing UI/UX and production deployment. No blocking issue remains for implementation.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Failed preview evidence retained from `dpl_9UHfkwAeWonZ6sMxYFfqAjfot9EN`: the partial campaign directory incorrectly selected Lovart repository checks and reported the missing brief and master.
- Context contract: every validator/build invocation supplies exactly one `--validation-context=repository|public`; unsupported, missing or duplicate values fail before validation.
- Local `vercel build` completed with target `preview` and output `.vercel/output`; no remote or production deployment was triggered.

### Validation Notes

- `npm run lint` — passed.
- `npm run typecheck` — passed with reported `repository` context.
- `npm test` — passed, including 8 validation-context tests and the existing 14 MOS tests.
- `npm run build` — passed with strict `repository` private-source checks.
- `npm run build:public` — passed while keeping all public site checks active.
- `vercel build` — passed through the standard `build:public` command; Vercel CLI reported `Build completed successfully` and target `preview`.
- `git diff --check` — passed.
- Privacy inspection returned no `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md`, command center, `.aios-core`, `.codex` or `.github` paths in `dist/` or `.vercel/output`.
- `.vercelignore`, A7-003, A7-005 and customer-facing HTML have no story-owned diff. The pre-existing unstaged `AGENTS.md` change remains untouched.
- CodeRabbit was not run: the story records the integration as disabled and the configured WSL executable is unavailable in this macOS workspace.

### Completion Notes List

- `vercel.json` now selects `build:public` explicitly, while local `npm test` and `npm run build` select strict `repository` validation.
- Repository context requires the complete declared private source set and preserves Lovart/commercial evidence validation. Public context skips only those repository-private checks and reports that decision in output.
- Public fixture coverage executes the real validator with internal sources absent and with a partial campaign directory, proving public asset, page, trust and tracking checks remain unconditional.
- Rollback: restore the previous `buildCommand` and package scripts, then remove the context module/tests and context forwarding from both validator/build entrypoints. `.vercelignore` requires no rollback.
- Remaining release evidence is intentionally delegated: after independent review, `@devops` must create the normal remote preview and record its deployment ID/result; no commit, push or deploy was performed by `@dev`.

### File List

- `docs/stories/a7-006-vercel-preview-validation-context.md`
- `package.json`
- `scripts/build-site.mjs`
- `scripts/test-validation-context.mjs`
- `scripts/validate-site.mjs`
- `scripts/validation-context.mjs`
- `vercel.json`

## QA Results

### Review — 2026-08-06

**Decision:** PASS
**Reviewer:** Quinn (`@qa`)
**Scope of PASS:** implementation local aprovada para handoff ao `@devops`; a story não deve ser marcada `Done` até o preview remoto padrão ser executado e seu deployment ID/resultado ser registrado.

#### Evidência independente

- `npm run lint` — PASS.
- `npm run typecheck` — PASS; o contexto `repository` foi reportado explicitamente.
- `npm test` — PASS; **8/8 testes de contexto** e **14/14 testes MOS**.
- `npm run build` — PASS em contexto `repository`, mantendo obrigatórias as fontes privadas declaradas.
- `npm run build:public` — PASS em contexto `public`, mantendo ativos os gates públicos.
- `vercel build` — PASS local, target `preview`, pela rota padrão `npm run build:public`; não houve deploy.
- `git diff --check` — PASS.
- Chamadas reais sem contexto, com contexto desconhecido e com dois contextos contraditórios retornaram código 1 e mensagens acionáveis.
- A suíte real provou: repositório completo; falha sem brief; falha sem master; público sem internos; público com diretório interno parcial; e falha quando o hero público é removido.

#### Privacidade e isolamento

- Foram inspecionados **323 arquivos** em `dist/` e `.vercel/output`; nenhum caminho correspondeu a `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md`, command center, `.aios-core`, `.codex` ou `.github`.
- `.vercelignore` não tem diff e não foi relaxado.
- A7-003, A7-005 e os arquivos HTML customer-facing não têm diff desta story.
- A modificação preexistente em `AGENTS.md` permanece fora do escopo e não foi tocada.

#### Rastreabilidade e risco residual

- AC 2–5 e a cobertura local de AC 6–7 estão satisfeitos pelo diff e pelas execuções independentes.
- O modo `public` limita a dispensa aos checks cuja evidência é repository-private; assets, páginas, confiança e tracking continuam incondicionais.
- **Pendência release-only:** AC 1 e o último item de AC 6 ainda exigem um preview remoto padrão feito pelo `@devops`, com deployment ID, resultado e confirmação de que produção não foi acionada. Essa pendência não requer mudança de código e é condição para encerrar a story.

**Blocking findings:** nenhum no código revisado.
