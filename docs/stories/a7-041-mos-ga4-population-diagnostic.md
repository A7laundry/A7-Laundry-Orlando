# Story A7-041 — Diagnóstico de populações GA4 no MOS

**Status:** Ready for Review — integrado localmente e gates aprovados; ativação, CodeRabbit e promoção pendentes.
**Created:** 2026-09-13
**Source:** A7O-011 e `reports/a7-ga4-filtro-qa-proposta.md` do centro Meu Ceo.

## Story

Como operador da A7, quero comparar o total GA4 com tráfego técnico explicitamente
marcado, origem indeterminada e candidatos sem marcador conhecido, para observar
contaminação de QA sem tratar receita da plataforma como receita financeira.

## Acceptance Criteria do patch diagnóstico

- [x] O coletor normal e a rota continuam consultando a população total.
- [x] O diagnóstico separado consulta as quatro populações; aplica a mesma regra
  ao resumo, canais, aquisição, landing, conteúdo, eventos, jornadas, interações
  e conteúdo do dia corrente, com período intradia separado.
- [x] Apenas `audit / test` e `qa / synthetic`, com caixa/espaços normalizados,
  entram em técnico marcado. Ausentes, indefinidos ou pares malformados ficam
  indeterminados; o restante é candidato, sem inferir intenção comercial.
- [x] Resumos vêm da API; não subtrair taxas nem somar usuários entre populações.
- [x] Falha de uma população/relatório não herda total, histórico nem zero.
- [x] Metadados preservam linhas retornadas/esperadas, truncamento, amostragem,
  thresholding, restrições e fuso/moeda observados. Completude desconhecida é explícita.
- [x] Fixtures cobrem partição, falhas, limites e regressão do coletor normal.

## Limites e aceite posterior

- Sem nova rota, UI, cron, credencial, coleta real, ingestão ou alteração de fontes.
- Sem filtros em Google Ads vinculado, GSC, Meta ou ledger.
- Uma execução explícita faz 36 consultas GA4: nove por população, sem retry
  nem paginação automática. A rota atual faz exatamente as consultas anteriores.
- O diagnóstico não entrega ainda seleção visível de população no dashboard,
  integração dos consumidores nem comparação real; A7O-011 permanece aberto.
- Lint, typecheck, teste/build completos e revisão QA local aprovados na integração abaixo.
- Permanecem pendentes antes de promoção: CodeRabbit sem CRITICAL e validação
  de compatibilidade/metadados na fonte real, mediante escopo autorizado.

## Evidência dos marcadores

- `audit / test`: observado pela central no MOS em 2026-09-13T05:33Z,
  run `2026-09-13T05-35-25-579Z-29012616.json`; evidência agregada, não autoria.
- `qa / synthetic`: fixture existente `scripts/test-tracking.mjs`.

## File List

- `docs/stories/a7-041-mos-ga4-population-diagnostic.md`
- `mos-app/google-kpis-contract.js`
- `mos-app/tests/ga4-populations.test.mjs`


## Integração local — 13/09/2026 UTC

O ciclo central autorizou a aplicação local do patch diagnóstico já revisado, sem ativação. A aplicação efetiva foi conferida em **2026-09-13T07:29:08Z**, com escalada técnica aprovada, pré-imagem idêntica e os dois arquivos novos antes ausentes.

- HEAD preservado: `e845763f72e51751fcd1dece891c68b826f62701`.
- Branch preservada: `feat/orlando-w3d-routes-lite`.
- Patch SHA-256: `86f5178fa7174f0a43e32a99a8c2490eba0141a7dc6b726ca426e69846f915b2`.
- Contrato SHA-256: `c2bc61ec49fb161a5448c94724c4d17ebab4f2cdde545ba7bb0af77682b42313`.
- Novo teste SHA-256: `728f0eaf64ff86c7dcaede04c1c4dac43e7f93cbb7a6074fbdd47340bd84318b`.

### Checklist de integração

- [x] Revalidar instruções, HEAD/branch, pré-imagens, story e estado concorrente.
- [x] Aplicar somente os três caminhos do patch revisado.
- [x] Preservar correção MOS A7-040, 14 arquivos anteriores e índice sem alterações.
- [x] `git apply --check --whitespace=error-all` antes, `git apply --reverse --check` imediatamente após o patch e `git diff --check`: PASS.
- [x] `npm run lint` e `npm run typecheck` diretamente na origem: PASS.
- [x] `node --test mos-app/tests/ga4-populations.test.mjs mos-app/tests/google-kpis.test.mjs` diretamente na origem: **20/20 PASS**.
- [x] `npm test` completo: **348/348 PASS** (169 pretest, 95 raiz e 84 MOS), mais validadores e build MOS; exit 0.
- [x] `npm run build` no contexto `repository`: PASS, exit 0.
- [x] Revisão independente local do artefato integrado: sem achados acionáveis.
- [ ] CodeRabbit sem CRITICAL: CLI `coderabbit`/`coderabbit-cli` não encontrado no PATH; gate não executado.
- [ ] Ativação/comparação real/consumidores e promoção: fora desta integração, nenhuma autorização presumida.

Os gates geradores rodaram em `/private/tmp/a7-ga4-integracao-20260913-o2vcszld/source`, cópia das pós-imagens integradas de 1250 arquivos rastreados mais esta story, a story A7-040 e o novo teste GA4. Dependências já instaladas foram acessadas por symlink, sem instalação. Os 14 arquivos não rastreados anteriores ficaram fora dos builds; a story A7-040 e todo o código MOS anterior foram preservados. Nenhum arquivo-fonte da cópia mudou pelos gates; artefatos gerados ficaram no temporário. Node v22.23.2, npm 10.9.8.

O aviso existente de adjudicação canônica entre `/blog/comforter-cleaning-service-orlando` e `/blog/comforter-cleaning-service-orlando-v2` permaneceu, com gates exit 0 e sem alteração desse escopo.

### QA Results

O coordenador realizou revisão independente dos hashes/diff integrados, preservação MOS, índice vazio e ausência de consumidor runtime do novo export: **sem achados acionáveis no delta revisado**. Os gates acima concluíram com sucesso após esse parecer. A revisão do preparo também está em `/Users/dennisarruda/Documents/ChatGPT/Meu Ceo/reports/revisao-a7-ga4-diagnostico-2026-09-13.md`. Este parecer local não substitui CodeRabbit, compatibilidade real nem autorização de promoção.

Varredura do código rastreado e novo teste encontrou `collectGa4PopulationDiagnostics` somente no módulo e nos testes. O diagnóstico permanece sem rota/cron/UI. Nenhuma consulta GA4 real foi executada. A chamada futura continuaria implicando 36 consultas, exigindo decisão de frequência/quota/latência e escopo próprio. Sem commit, push, merge, deploy, alteração de credenciais, cliente ou mídia. A7O-011 permanece aberta; candidatos não equivalem a usuários humanos/comerciais comprovados, e receita GA4 não equivale a receita financeira reconciliada.

Relatório central e hashes finais: `/Users/dennisarruda/Documents/ChatGPT/Meu Ceo/reports/a7-ga4-diagnostico-integracao-2026-09-13.md`. Logs temporários: `/private/tmp/a7-ga4-integracao-20260913-o2vcszld/{lint,typecheck,targeted,test-full,build}.log`.
