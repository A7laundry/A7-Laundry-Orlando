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
- Standard preview `dpl_6UpSbE5ZHc9xsUoMGREjvKpRKZXJ` proved the context fix reached and passed `build:public` plus `validate-site`, then failed in `validate-ai-search` because the public IndexNow key file was excluded by `.gitignore` and therefore absent from the GitHub clone. The same key file already existed locally, was copied by `build-site` and returned its public key in production, so it is a public verification artifact rather than a secret.

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
   - [x] A partially materialized or empty internal directory cannot, by itself, select complete-repository validation.
   - [ ] The successful preview uses the standard remote build path; it does not depend on `vercel deploy --prebuilt`.

2. **Complete-repository gates remain strict**
   - [x] In a complete checkout, validation still requires both `marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md` and `marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png`.
   - [x] A regression test proves repository-context validation fails when either required source file is absent.
   - [x] `npm test` and `npm run build` in the complete repository continue to execute the repository-context checks; no local gate is silently skipped because Vercel support was added.

3. **Public checks remain unconditional**
   - [x] Every context continues to require the optimized public hero `public/guest-laundry-hero.webp`, the public landing-page references and the existing public trust/tracking validations.
   - [x] The context boundary applies only to checks whose evidence is intentionally repository-private.

4. **Context selection is deterministic and observable**
   - [x] Validation does not infer “complete repository” solely from the existence of `marketing/google-ads/2026-07-guest-laundry-search`.
   - [x] The selected context is explicit in the command/configuration or derived from a complete, documented source-set contract.
   - [x] Validation output identifies the selected context and states when repository-private checks are intentionally not applicable.
   - [x] Unknown or contradictory context fails with an actionable error instead of silently weakening validation.

5. **Deployment privacy is preserved**
   - [x] The generated Vercel artifact contains no `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md`, command center or other paths already classified as private.
   - [x] `.vercelignore` is not relaxed to fix the preview.

6. **Regression coverage and release readiness**
   - [x] Automated coverage includes: complete repository success, missing brief failure, missing master failure, public context success with internal paths absent, and public context success with a partial/empty internal directory.
   - [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `vercel build` and `git diff --check` pass before review.
   - [ ] The executor records the new successful preview deployment ID supplied by the authorized preview action and confirms that no production deployment was triggered by the validation run.

7. **Scope isolation**
   - [x] A7-003 and A7-005 remain unchanged.
   - [x] No customer-facing HTML, commercial value, tracking contract, campaign configuration or `AGENTS.md` is changed.

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
  - [x] Record preview `dpl_6UpSbE5ZHc9xsUoMGREjvKpRKZXJ` and correct its newly exposed missing-public-artifact failure without relaxing `.vercelignore`.
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
| 2026-08-06 | 0.4 | Public IndexNow verification artifact restored to the GitHub source set with shared build/submission configuration and regression coverage | Dex (`@dev`) |

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
- Preview `dpl_6UpSbE5ZHc9xsUoMGREjvKpRKZXJ` passed `build:public` and `validate-site`, then failed with `ENOENT` for `d0f3f6cfc2be4b1f74ba4baba5000145.txt`; `.gitignore` excluded this intentionally public IndexNow verification file from the GitHub clone.
- Context contract: every validator/build invocation supplies exactly one `--validation-context=repository|public`; unsupported, missing or duplicate values fail before validation.
- Local `vercel build` completed with target `preview` and output `.vercel/output`; no remote or production deployment was triggered.

### Validation Notes

- `npm run lint` — passed.
- `npm run typecheck` — passed with reported `repository` context.
- `npm test` — passed, including 8 validation-context tests, 1 IndexNow artifact test and the existing 14 MOS tests.
- `npm run build` — passed with strict `repository` private-source checks.
- `npm run build:public` — passed while keeping all public site checks active.
- `vercel build` — passed through the standard `build:public` command; Vercel CLI reported `Build completed successfully` and target `preview`.
- `git diff --check` — passed.
- IndexNow verification passed: the tracked key file content matches its filename, shared submission key/location and deterministic public build list; both `dist/` and `.vercel/output` contain the expected public artifact.
- Privacy inspection returned no `marketing/`, `docs/`, `MANIFESTO.md`, `AGENTS.md`, command center, `.aios-core`, `.codex` or `.github` paths in `dist/` or `.vercel/output`.
- `.vercelignore`, A7-003, A7-005 and customer-facing HTML have no story-owned diff. The pre-existing unstaged `AGENTS.md` change remains untouched.
- CodeRabbit was not run: the story records the integration as disabled and the configured WSL executable is unavailable in this macOS workspace.

### Completion Notes List

- `vercel.json` now selects `build:public` explicitly, while local `npm test` and `npm run build` select strict `repository` validation.
- Repository context requires the complete declared private source set and preserves Lovart/commercial evidence validation. Public context skips only those repository-private checks and reports that decision in output.
- Public fixture coverage executes the real validator with internal sources absent and with a partial campaign directory, proving public asset, page, trust and tracking checks remain unconditional.
- The IndexNow key is centralized in `scripts/public-artifacts.mjs`; build, validation and submission consume the same public filename/key instead of maintaining divergent literals.
- `.gitignore` no longer misclassifies the public verification file as uncurated local material, allowing a standard GitHub/Vercel clone to contain it without changing `.vercelignore`.
- Rollback: restore the previous `buildCommand` and package scripts, then remove the context module/tests and context forwarding from both validator/build entrypoints. `.vercelignore` requires no rollback.
- Remaining release evidence is intentionally delegated: after independent review, `@devops` must create the normal remote preview and record its deployment ID/result; no commit, push or deploy was performed by `@dev`.

### File List

- `docs/stories/a7-006-vercel-preview-validation-context.md`
- `.gitignore`
- `d0f3f6cfc2be4b1f74ba4baba5000145.txt`
- `package.json`
- `scripts/build-site.mjs`
- `scripts/public-artifacts.mjs`
- `scripts/submit-indexnow.mjs`
- `scripts/test-indexnow-key.mjs`
- `scripts/test-validation-context.mjs`
- `scripts/validate-ai-search.mjs`
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

### Re-review — 2026-08-06 — IndexNow public artifact delta

**Decision:** PASS

**Reviewer:** Quinn (`@qa`)

**Scope of PASS:** correção local do segundo bloqueio de preview aprovada para novo handoff ao `@devops`; o preview remoto substituto continua obrigatório antes de encerrar a story.

#### Evidência independente do delta

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run build:public`, `vercel build` e `git diff --check` — PASS.
- `npm test` executou **9/9 testes** no grupo do delta: 8 de contexto e 1 do artefato IndexNow; os **14/14 testes MOS** também passaram.
- O teste focado `node --test scripts/test-indexnow-key.mjs` passou e o dry-run produziu `host`, `key`, `keyLocation` e URLs restritos a `https://a7laundry.com`.
- A chave `d0f3f6cfc2be4b1f74ba4baba5000145` é um artefato público de verificação, não uma credencial de acesso: o endpoint de produção já a retorna publicamente e seu uso no payload apenas referencia a prova hospedada pelo domínio.
- Nome do arquivo, conteúdo local, constante compartilhada, `keyLocation` e lista determinística de artefatos estão consistentes. O arquivo raiz, `dist/` e `.vercel/output/static/` produziram o mesmo SHA-256 `e7d79a35de4eb7742689c60783cf45e862f3ab54f48ba722e2de5614f02bb426`.
- `git check-ignore` confirmou que o arquivo não é mais ignorado. O único delta em `.gitignore` é a remoção da regra que ocultava esse artefato público.
- `scripts/public-artifacts.mjs` é a fonte única consumida por build, validação e submissão; não restou literal divergente nesses consumidores.

#### Privacidade, isolamento e preview

- `.vercelignore` permanece sem diff. A7-003, A7-005 e todos os HTML customer-facing permanecem sem diff.
- Foram reinspecionados **323 arquivos** em `dist/` e `.vercel/output`; nenhum caminho privado de AC 5 foi encontrado.
- A modificação preexistente em `AGENTS.md` permanece fora do escopo e não foi tocada.
- `vercel inspect` confirmou que `dpl_6UpSbE5ZHc9xsUoMGREjvKpRKZXJ` era target `preview` e terminou em `Error`; ele é evidência do defeito agora corrigido, não evidência de sucesso.
- **Pendência release-only:** o `@devops` deve criar um novo preview remoto padrão a partir do arquivo versionado, registrar deployment ID e resultado `Ready`, e confirmar que produção não foi acionada. A story não deve ser marcada `Done` antes disso.

**Blocking findings no delta:** nenhum.

## Architectural Quality Gate — IndexNow Delta

### Re-review — 2026-08-06

**Recommendation:** PASS

**Reviewer:** Aria (`@architect`)

**Scope:** delta posterior ao preview `dpl_6UpSbE5ZHc9xsUoMGREjvKpRKZXJ`; o preview remoto final continua reservado ao `@devops`.

- A chave IndexNow é um token de verificação que precisa ser servido por HTTP no próprio host; não concede acesso administrativo ao site ou à Vercel. A documentação oficial exige que o arquivo contenha a chave e recomenda mantê-la e sua localização não divulgadas além dos mecanismos necessários de verificação.
- O valor já existia como literal no arquivo versionado `scripts/submit-indexnow.mjs` antes deste delta. Versionar o arquivo de verificação não introduz uma nova classe de segredo nem amplia materialmente a exposição já existente.
- `.gitignore` deixou de excluir somente o nome exato do artefato; `.vercelignore` permaneceu intacto. Nenhuma regra ampla para arquivos `.txt` ou fontes internas foi relaxada.
- `scripts/public-artifacts.mjs` é a fonte única para chave, nome do arquivo e lista determinística de artefatos textuais. Build, validação e submissão consomem esse contrato.
- O dry-run continua restringindo URLs a `https://a7laundry.com`; a chave não permite submeter URLs de outro host por esse operador.
- O teste focado confirma conteúdo = nome = payload = `keyLocation`. `npm run build` e `vercel build` confirmaram o arquivo em `dist/` e `.vercel/output`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `vercel build` e `git diff --check` passaram. Nenhum commit, push ou deploy foi executado nesta revisão.

**Blocking findings:** nenhum no delta revisado.
