# Story A7-040 — Par completo de configuração operacional no MOS

**Status:** Ready for Review — integrado localmente; gates locais e globais executados, CodeRabbit e promoção pendentes.

**Criada:** 12/09/2026. **Fonte:** entrega A7O-003 do office A7 USA MKT, derivada do defeito reproduzido em `readOperationalKpiConfig` e da autorização para preparar patch testado sem alterar a origem ou produção. Critérios preparados no papel de `@sm`; implementação/integração por `@dev`; revisão independente por `@qa`; eventual release pertence a `@devops` e segue seu escopo próprio.

## Story

Como operador do MOS, quero que URL e chave venham de um mesmo par completo de configuração, para que uma configuração parcial não envie a chave de outro namespace ao destino selecionado.

O leitor atual faz fallback campo a campo. Uma URL `operations` e uma chave `whatsapp` são aceitas juntas mesmo sem nenhum par completo. A correção elimina esse defeito local. Não há prova de que ele seja a causa da indisponibilidade observada no MOS em produção.

## Escopo e invariantes

- Alterar somente `readOperationalKpiConfig`, seus testes e esta story.
- Prioridade permanece `A7_OPERATIONS_SUPABASE_URL` + `A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY`, depois `WHATSAPP_SUPABASE_URL` + `WHATSAPP_SUPABASE_SERVICE_ROLE_KEY`.
- `A7_ATTRIBUTION_SUPABASE_*` permanece fora do leitor MOS.
- Preservar collector, transporte, endpoints, headers, body, erros, períodos e métricas. Sem dependências novas, alteração de ambiente, banco, conta ou produção.
- MOS segue consumidor servidor autenticado, conforme `docs/architecture/site-mos-growth-governance.md`. Configuração indisponível não vira zero, como exigido em A7-008.

## Critérios de aceite

- [x] **AC1:** escolher o primeiro par completo; nunca cruzar URL/chave de namespaces diferentes.
- [x] **AC2:** um par `operations` completo tem prioridade; um par parcial permite fallback integral para `whatsapp` completo.
- [x] **AC3:** aplicar `String(valor || '').trim()` antes de avaliar presença; remover exatamente uma barra final da URL, preservando a semântica anterior e os caracteres internos da chave.
- [x] **AC4:** sucesso mantém `{ok: true, url, key, missing: []}`; rejeição retorna URL/chave vazias e ambos os nomes canônicos `A7_OPERATIONS_SUPABASE_*` em `missing`, sem fragmentos de valores.
- [x] **AC5:** configuração rejeitada provoca zero chamadas do collector e mantém `CONFIGURATION_INCOMPLETE`, período, métricas nulas e lista de landings vazia.
- [x] **AC6:** par `A7_ATTRIBUTION_SUPABASE_*`, sozinho ou junto de candidato parcial, continua rejeitado.
- [x] **AC7:** regressões significativas falham com a pré-imagem e passam com o patch; testes existentes de headers, período, coleta e joins permanecem válidos.
- [ ] **AC8:** antes de integrar/promover, revalidar pré-imagens, aplicação do patch, gates globais do repositório e revisão aplicável ao artefato integrado.

AC1–AC7 foram comprovados inicialmente na cópia isolada e revalidados após a integração local descrita abaixo. AC8 permanece aberto para a revisão CodeRabbit antes de qualquer promoção.

## Tasks

- [x] Ler AGENTS.md e constitution; definir story e aceite antes da implementação isolada.
- [x] Selecionar atomicamente apenas os dois pares existentes; trim e retorno rejeitado sem valores.
- [x] Testar prioridade, fallback parcial, cruzamento nas duas direções, espaços, chave interna, barra final, namespace excluído e zero requisições.
- [x] Testar o collector com destino e chave do fallback juntos.
- [x] Demonstrar falha das regressões na pré-imagem e sucesso no candidato.
- [x] Registrar revisão independente final do código e testes: PASS, sem achados acionáveis; suíte dirigida 18/18 executada independentemente.
- [x] Integrar a uma cópia de trabalho autorizada e executar gates locais/globais antes de qualquer merge/release.
- [ ] Obter o gate CodeRabbit antes de qualquer promoção; CLI não disponível nesta execução.

## Validação isolada

Base de origem: `e845763f72e51751fcd1dece891c68b826f62701`. A pré-imagem usada é o conteúdo efetivo dos dois arquivos de origem, com SHA-256 registrado no relatório de entrega; nenhum arquivo de origem foi editado.

```sh
node --test mos-app/tests/google-ads-kpis.test.mjs mos-app/tests/operational-kpis.test.mjs
node --check mos-app/operational-kpis-contract.js
node --check mos-app/tests/operational-kpis.test.mjs
```

- Suíte no candidato isolado: **18/18 PASS** — 10 testes operacionais e 8 Google Ads.
- Mesmos 10 testes operacionais contra leitor original: **5 PASS / 5 FAIL esperados**, todas as cinco regressões novas expõem o comportamento antigo.
- Clientes e chaves são sintéticos; não há acesso de rede, leitura de segredos ou geração de build.
- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` completos não foram executados na preparação isolada; os resultados posteriores constam na seção de integração local. O comando `npm test` do MOS também faz build.
- Revisão independente `@qa`: PASS no escopo local delimitado; collector, helpers e pacote preservados. Gates globais e CodeRabbit não avaliados.
- Sucesso local não declara conexão restaurada, causa de produção resolvida ou autorização para implantação.

## File List

- `mos-app/operational-kpis-contract.js`
- `mos-app/tests/operational-kpis.test.mjs`
- `docs/stories/a7-040-mos-operational-config-pair.md`

## Change Log

| Data | Versão | Alteração |
|---|---|---|
| 2026-09-12 | 0.1 | Critérios preparados por `@sm`; correção e regressões verificadas em cópia isolada; integração pendente |
| 2026-09-13 | 0.2 | Patch integrado localmente; gates locais/globais e preservação de escopo verificados; promoção e CodeRabbit pendentes |


## Integração local — 13/09/2026 UTC

Mandato do ciclo agendado central de 13/09/2026, 02:23 UTC, autorizou integrar somente o patch A7O-003. O patch preparado foi aplicado efetivamente no checkout de origem por escalada técnica aprovada, com pré-imagens idênticas e story antes ausente. Não houve commit, push, merge, deploy, alteração de ambiente ou consulta às contas comerciais.

- HEAD preservado: `e845763f72e51751fcd1dece891c68b826f62701`.
- Branch preservada: `feat/orlando-w3d-routes-lite`.
- SHA-256 do patch aplicado: `1e8580980d7af7b15b0908b3d5bba1e18796c83001e0a2770f47cf8a3bcad8c9`.
- SHA-256 final do leitor: `7d66fc61a7f3d112193a4d41d33a24c7f998b9a934495a7df46ef285df6b0bf4`.
- SHA-256 final dos testes: `0dbcb2f29a2ef8c7c99b995dc3edd2235153aad047e8b518e2bdd828a53b9574`.
- `git apply --check --whitespace=error-all` antes e `git apply --reverse --check` imediatamente depois: PASS. `git diff --check`: PASS.
- `npm run lint` e `npm run typecheck` executados diretamente na origem: PASS.
- Suíte dirigida executada diretamente na origem: **18/18 PASS**.
- `npm test` completo: **340/340 PASS** (169 pretest, 95 raiz, 76 MOS), além dos validadores e build MOS.
- `npm run build`: PASS, contexto `repository`.

Os gates que geram arquivos foram executados em `/private/tmp/a7-mos-integracao-20260913-8_3q2ssi/source`, cópia de 1250 arquivos rastreados mais esta story, com as pós-imagens integradas idênticas à origem; dependências instaladas foram acessadas por symlink. Nenhum dos 14 arquivos não rastreados preexistentes foi incorporado aos builds ou alterado. Todos os arquivos-fonte do snapshot mantiveram seus hashes após os gates; as saídas geradas ficaram na cópia temporária. Node v22.23.2, npm 10.9.8.

O build apontou o aviso já existente de adjudicação canônica entre `/blog/comforter-cleaning-service-orlando` e `/blog/comforter-cleaning-service-orlando-v2`; o gate terminou com exit 0. Esse assunto não foi alterado.

## QA Results

Revisão independente local pelo coordenador, em papel de `@qa`: **PASS, sem achados acionáveis**. Conferidos diff, collector, rejeição segura, testes de cruzamento/fallback e resumos dos logs (18/18 e 169+95+76, build). Evidência: `/Users/dennisarruda/Documents/ChatGPT/Meu Ceo/reports/revisao-a7-mos-integracao-2026-09-13.md`. O parecer é local e não substitui o gate CodeRabbit.

Logs locais: `/private/tmp/a7-mos-integracao-20260913-8_3q2ssi/{lint,typecheck,targeted,test-full,build}.log`. Relatório central: `/Users/dennisarruda/Documents/ChatGPT/Meu Ceo/reports/a7-mos-config-pair-integracao-2026-09-13.md`.

O CodeRabbit não foi executado: `coderabbit` e `coderabbit-cli` não foram encontrados no PATH. O sucesso local corrige o fallback reproduzido; não comprova restauração do ledger MOS, resolução do HTTP 403 do Google Ads ou causa de falha em produção. Nenhuma promoção está declarada concluída.
