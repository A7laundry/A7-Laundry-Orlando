# Story A7-004 — Inteligência de Funil Criativo no MOS

**Status:** Done

**Closed:** 2026-08-16 — owner-authorized release; the protected MOS deployment `dpl_FKnLn5W8vrLH9drFXk66jXRgoXGq` includes the validated read-only funnel artifact and UI.
**Created:** 2026-07-30
**Source:** Solicitação direta do owner para estruturar aquisição, retenção e experimentação criativa no MOS
**Depends on:** A7-003 Conversion Observability (`In Progress`) para os contratos observacionais e limites de atribuição já existentes

## Goal

Criar no MOS um módulo observacional de Inteligência de Funil Criativo, sustentado por um motor CLI/data-first, para pesquisar frameworks atuais, organizar hipóteses criativas não repetitivas e acompanhar cada hipótese desde pesquisa até retenção sem confundir clique ou conversa com venda.

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools:
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
```

**Specialized contribution:** `@analyst` executa a pesquisa de especialistas, frameworks e práticas atuais; `@dev` implementa somente a partir do registro de evidências aprovado.

## Story

**As an** operador de growth da A7 Laundry Orlando,
**I want** organizar pesquisa, ofertas, hipóteses criativas, testes e evidências de resultado em um funil único,
**so that** a equipe explore novos ângulos com disciplina, evite repetição/canibalização e invista apenas em challengers que avancem por evidência.

## Scope Boundaries

### In scope

- Registro versionado da pesquisa atual de aquisição, hooks, hype e retenção.
- Motor e taxonomia dimensionados para até dez itens/ofertas com oito hipóteses criativas distintas por item.
- Catálogo inicial com candidatos explicitamente rotulados pela força da evidência, sem preencher “mais vendidos” por inferência.
- Piloto de um item/oferta com oito territórios criativos e uma primeira onda limitada a `control + 2 challengers`.
- Taxonomia que torne repetição, sobreposição e lacunas visíveis.
- Estágios de funil e histórico de transições.
- CLI como fonte de verdade para validar, consultar e atualizar o estado interno do backlog.
- Menu/painel observacional no MOS para leitura, filtros, cobertura, evidências e alertas.

### Out of scope

- Criar, publicar, ativar, pausar ou editar campanhas/anúncios em Meta, Google ou qualquer plataforma.
- Alterar orçamento, público, placement ou objetivo de otimização.
- Exigir dez itens ou 80 hipóteses no seed inicial sem evidência comercial ou confirmação explícita do owner.
- Produzir ou publicar simultaneamente os 80 criativos previstos na visão de expansão.
- Inferir pedido, receita, ROAS ou retenção a partir de clique, sessão, evento, chamada ou conversa.
- Definir os dez itens por palpite quando não houver evidência de vendas ou confirmação do owner.

## Acceptance Criteria

1. **Research registry atual e rastreável**
   - [x] Existe um registro versionado de pesquisa sobre aquisição, hooks, hype, retenção e experimentação criativa usado nos Estados Unidos.
   - [x] Cada finding registra especialista/organização, fonte primária ou material diretamente atribuível, URL, data de publicação/atualização quando disponível, data de consulta, tipo de evidência, claim original resumido, limitação e tradução proposta para o contexto da A7.
   - [x] O registro distingue princípio testável, opinião de creator, case divulgado e evidência de plataforma; popularidade não é apresentada como prova de causalidade.
   - [x] Mudanças de plataforma ou frameworks sem data verificável são marcadas como potencialmente desatualizadas.
   - [x] MrBeast pode ser usado como benchmark de engenharia de atenção/retenção, mas nenhuma técnica é tratada como aplicável à A7 sem hipótese e critério de validação próprios.

2. **Catálogo inicial sem invenção**
   - [x] O contrato suporta pelo menos dez itens/ofertas, mas o seed inicial contém somente candidatos com origem rastreável; cardinalidade menor que dez é válida e exibida como cobertura incompleta, não como erro.
   - [x] Cada item registra evidência de origem: vendas observadas, dado owner-reported explicitamente rotulado, ou confirmação direta do owner.
   - [x] O seed inicial registra `guest wash-and-fold` como oferta agregada com a evidência disponível e registra tênis e calça somente como `owner_idea`/candidatos; nenhum dos três recebe status de “mais vendido” sem evidência no nível correspondente.
   - [x] Os sete slots restantes não são preenchidos por palpite; a expansão até dez exige vendas observadas reconciliadas ou confirmação explícita do owner para cada novo item/oferta.
   - [x] Cada item possui identificador estável, nome, serviço relacionado, público elegível, preço/fonte de preço quando conhecido, restrições operacionais e status de validação.
   - [x] Valores desconhecidos permanecem `null`/indisponíveis e não viram zero nem estimativa silenciosa.

3. **Piloto 1×8 e expansão condicionada**
   - [x] O piloto usa um único item/oferta elegível — `guest wash-and-fold` — e contém oito hipóteses em territórios estrategicamente distintos, derivados do registro de pesquisa e validados pela taxonomia.
   - [x] Uma hipótese não é um asset pronto nem autorização de publicação; as oito hipóteses permanecem no backlog até seleção explícita.
   - [x] A primeira onda contém no máximo três membros: um controle e até dois challengers; os cinco restantes permanecem fora da onda.
   - [x] O motor suporta a visão completa de dez itens × oito hipóteses, mas a criação dos 80 registros de produção só pode ocorrer após evidência/owner confirmation dos dez itens e decisão explícita de expansão.
   - [x] Cada hipótese contém uma pergunta testável, motivo, público, estágio de awareness, conceito, métrica primária observável, critério de aprendizado e evidência necessária para avançar.

4. **Taxonomia anticópia e anticanibalização**
   - [x] Toda hipótese classifica, no mínimo: persona, dor/necessidade, nível de awareness, ângulo, hook, formato, promessa e CTA.
   - [x] A combinação taxonômica gera uma assinatura comparável; duplicatas exatas são bloqueadas e sobreposições relevantes são sinalizadas para revisão.
   - [x] Duplicidade semântica relevante é bloqueada mesmo quando o texto difere; dois registros não podem compartilhar o mesmo `externalMetaAdId`.
   - [x] O motor produz uma matriz de cobertura que mostra quais personas, dores, níveis de awareness e ângulos já estão cobertos e onde existem lacunas.
   - [x] Duas hipóteses para o mesmo item só podem coexistir quando a diferença estratégica está registrada; mera troca de palavras, cor ou ordem não conta como hipótese nova.
   - [x] A UI permite identificar hipóteses que podem disputar o mesmo público/promessa sem afirmar causalmente que houve canibalização.

5. **Funil de evidência completo**
   - [x] Cada hipótese pode ser acompanhada nos estágios `research → idea → production → organic → paid_challenger → conversation → sale → retention`.
   - [x] O histórico registra estágio anterior, estágio novo, timestamp, responsável, justificativa e evidência vinculada.
   - [x] `paid_challenger` significa elegibilidade/observação interna e nunca implica anúncio publicado ou campanha ativa.
   - [x] Avanço até `conversation` requer uma conversa observada com proveniência; avanço até `sale` requer venda confirmada por fonte operacional/owner e vínculo explícito; avanço até `retention` requer recompra ou retenção confirmada.
   - [x] Quando o vínculo entre etapas não existir, o funil exibe `partial` ou `unavailable` e não calcula conversão causal.
   - [x] Uma decisão `PROMOTE` falha fechado sem venda confirmada e contribuição reconciliada; sinal de atenção, clique, chamada ou conversa não autoriza promoção.

6. **Motor CLI/data-first**
   - [x] O catálogo, as hipóteses, a taxonomia, os estados e as evidências vivem em dados versionados/contratos validáveis fora da UI.
   - [x] O fluxo principal funciona sem abrir o MOS pelos comandos `validate`, `inventory`, `lint-semantic` e `compile`.
   - [x] Entradas inválidas, item sem origem, hipótese duplicada/semanticamente equivalente, `externalMetaAdId` repetido, mais de três membros por lane/onda, métrica sem proveniência, `PROMOTE` sem venda/contribuição, transição sem evidência obrigatória e campos financeiros inferidos falham fechado com mensagem acionável.
   - [x] A saída do motor é determinística e consumível pela UI observacional e pelos testes automatizados.
   - [x] Nenhum comando do módulo chama APIs de escrita de mídia ou controla campanhas.

7. **Menu observacional no MOS**
   - [x] O MOS inclui o submenu `Marketing → Funil Criativo`, que observa o artefato compilado produzido pelo motor CLI.
   - [x] O painel permite filtrar por item/oferta, persona, dor, awareness, ângulo, hook, formato, promessa, CTA e estágio.
   - [x] O painel mostra catálogo, cobertura taxonômica, backlog, onda selecionada, histórico, evidências e gargalos do funil.
   - [x] Toda métrica mostra fonte, período, freshness e disponibilidade seguindo o contrato observacional da A7-003.
   - [x] A UI não contém controles para publicar, pausar, ativar, editar campanha ou alterar orçamento; ações internas não são rotuladas como ações de plataforma.
   - [x] Estados vazios, dados parciais e fontes indisponíveis são visíveis e não são convertidos em zero.

8. **Medição por estágio, sem vanity metric como venda**
   - [x] O registro de pesquisa define métricas úteis por estágio e documenta as limitações de cada plataforma/fonte.
   - [x] Hook/retention metrics, alcance, view, clique, sessão, chamada e conversa permanecem sinais distintos.
   - [x] Venda, receita, margem, recompra e LTV só aparecem quando houver fonte correspondente e reconciliação explícita.
   - [x] O MOS não calcula ROAS, CAC por venda ou taxa conversa→venda quando o denominador/numerador não forem conciliados no mesmo período/coorte.
   - [x] Owner-reported permanece rotulado como `owner_reported`, separado de dados instrumentados ou de plataforma.

9. **Qualidade e regressão**
   - [x] Testes de contrato cobrem: capacidade sintética de 10×8, seed válido menor que dez, piloto real 1×8, onda `control + 2 challengers`, IDs únicos, taxonomia obrigatória, duplicidade exata/semântica, `externalMetaAdId`, transições válidas/inválidas, proveniência e semântica `null`.
   - [x] Testes do MOS cobrem menu, filtros, estados vazios/parciais, cobertura e ausência de controles de campanha.
   - [x] Um gate automatizado falha se clique/conversa for apresentado como venda, se `paid_challenger` for apresentado como campanha ativa, se `PROMOTE` não tiver venda/contribuição ou se qualquer caminho de mutação de mídia for introduzido.
   - [x] `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam antes de concluir a story.
   - [x] Checklist e File List desta story são atualizados pelo executor antes de solicitar review.

## Tasks / Subtasks

- [x] **Task 1 — Registrar pesquisa atual de aquisição e retenção** (AC: 1, 8)
  - [x] `@analyst` define protocolo de busca com recorte Estados Unidos, fontes diretamente atribuíveis e data de corte.
  - [x] Pesquisar práticas atuais de hooks, retenção, hype, packaging, ideação, testes criativos e aquisição.
  - [x] Registrar claims, limites, aplicabilidade à A7 e hipóteses derivadas sem transformar opinião em regra.
  - [x] Revisar terminologia e métricas de plataforma em fontes oficiais atuais quando houver dependência de definição vigente.

- [x] **Task 2 — Registrar o catálogo inicial e os gates de expansão** (AC: 2)
  - [x] Levantar evidência comercial disponível e separar instrumentado, owner-reported e desconhecido.
  - [x] Registrar `guest wash-and-fold`, tênis e calça com os rótulos de origem definidos no AC 2, sem afirmar ranking de venda.
  - [x] Manter os slots não confirmados ausentes e documentar o gate para expansão até dez itens.
  - [x] Registrar fonte de preço e restrições operacionais sem inventar margem ou demanda.

- [x] **Task 3 — Definir o contrato de dados e a máquina de estados** (AC: 3, 4, 5, 6, 8)
  - [x] Modelar catálogo, hipótese, taxonomia, assinatura, lane/onda de teste, controle, challenger, evidência, transição e proveniência.
  - [x] Definir validações fail-closed e semântica de `null`, `partial`, `unavailable` e `owner_reported`.
  - [x] Definir regras que separam sinais de atenção, aquisição, conversa, venda e retenção.
  - [x] Aplicar as localizações e boundaries aprovadas pelo `@architect` registradas em Project structure notes.

- [x] **Task 4 — Construir o motor CLI/data-first** (AC: 3, 4, 5, 6)
  - [x] Implementar `scripts/mos-funnel.mjs` com `validate`, `inventory`, `lint-semantic` e `compile`.
  - [x] Implementar validação determinística do catálogo/backlog e compilação em `mos-app/generated/funnel-intelligence.json`.
  - [x] Implementar inventário, matriz de cobertura e relatório de lacunas/sobreposições.
  - [x] Implementar transições internas auditáveis com exigência de evidência por estágio.
  - [x] Garantir que não exista cliente de escrita ou mutação de Meta/Google Ads.

- [x] **Task 5 — Montar o piloto 1×8 e selecionar a primeira onda** (AC: 2, 3, 4)
  - [x] Criar oito hipóteses realmente distintas para `guest wash-and-fold`, fundamentadas na pesquisa registrada.
  - [x] Validar assinatura, sobreposição e cobertura antes de aceitar cada hipótese.
  - [x] Selecionar um controle e até dois challengers para a primeira onda; manter as demais cinco hipóteses no backlog.
  - [x] Documentar que 10×8 é capacidade e visão de expansão, não conteúdo obrigatório desta entrega.

- [x] **Task 6 — Adicionar o menu observacional ao MOS** (AC: 5, 7, 8)
  - [x] Implementar `mos-app/funnel-intelligence-contract.js` como contrato puro e renderizar o JSON compilado sem criar segunda fonte de verdade no HTML.
  - [x] Adicionar o submenu read-only `Marketing → Funil Criativo` em `a7-command-center.html`.
  - [x] Implementar filtros, matriz de cobertura, funil, histórico, evidências e estados de disponibilidade.
  - [x] Remover/bloquear qualquer affordance que possa ser interpretada como controle de campanha.
  - [x] Preservar autenticação, proveniência e limites de atribuição já usados pelo MOS.

- [x] **Task 7 — Implementar gates e testes** (AC: 4, 5, 6, 7, 8, 9)
  - [x] Implementar `scripts/validate-funnel-intelligence.mjs` e `mos-app/tests/funnel-intelligence.test.mjs`.
  - [x] Cobrir contrato, capacidade sintética 10×8, seed parcial, piloto 1×8, onda máxima de três, IDs, taxonomia, duplicidade exata/semântica, `externalMetaAdId` e transições.
  - [x] Cobrir semântica de venda/receita/retenção e falhas de proveniência.
  - [x] Cobrir menu, filtros, estados vazios/parciais e boundary somente leitura.
  - [x] Cobrir falha de `PROMOTE` sem venda/contribuição e ausência de qualquer mutação de mídia.
  - [x] Integrar compilação/cópia do JSON e os gates aos scripts de build/qualidade existentes.

- [x] **Task 8 — Atualizar documentação e preparar handoff** (AC: 9)
  - [x] Documentar uso CLI, contrato de evidência e leitura do painel.
  - [x] Atualizar checklist e File List com todos os arquivos efetivamente criados/alterados.
  - [x] Executar os quality gates e registrar os resultados.

## Dev Notes

### Existing behavior to preserve

- O MOS atual já representa o funil observável como descoberta → conteúdo → entrada → intenção → conversa → venda → retenção e torna limites de atribuição visíveis. A nova story deve estender esse princípio para hipóteses criativas, sem sobrescrever a semântica existente.
  [Source: `docs/stories/a7-003-conversion-observability.md#Acceptance-Criteria`]
- O marketing da A7 trabalha superfícies orgânica, paga e suporte que funilam para WhatsApp; cada superfície deve usar linguagem nativa.
  [Source: `marketing/ECOSYSTEM.md#Princípio-mestre`]
- A operação Meta já exige artefatos versionados, pré-flight e autorização explícita antes de qualquer mutação.
  [Source: `marketing/meta-ads/README.md#Regras-de-ouro-segurança`]
- O padrão criativo exige safe-zone e prévias reais de placements antes de elegibilidade paga. Esse gate continua valendo; o novo backlog não substitui produção nem preflight.
  [Source: `marketing/meta-ads/creative-production-standard.md#Fluxo-de-produção`]
- O teste atual do snapshot MOS já protege valores financeiros indisponíveis, owner-reported sales e inventário de challengers.
  [Source: `scripts/validate-mos-kpis.mjs`]

### Project structure notes

- O `@architect` aprovou um bounded context separado em `marketing/funnel-intelligence/`, sem banco novo e sem acoplamento aos artefatos de operação de mídia.
- Dados versionados:
  - `marketing/funnel-intelligence/items.json`
  - `marketing/funnel-intelligence/taxonomy.json`
  - `marketing/funnel-intelligence/briefs.json`
  - `marketing/funnel-intelligence/experiments.json`
  - `marketing/funnel-intelligence/evidence.json` e/ou `sources.json` somente se necessários para manter proveniência sem duplicar conteúdo.
- Motor e gates:
  - `scripts/mos-funnel.mjs` — entrypoint CLI com `validate`, `inventory`, `lint-semantic` e `compile`.
  - `scripts/validate-funnel-intelligence.mjs` — gate automatizado.
  - `mos-app/funnel-intelligence-contract.js` — contrato puro e somente leitura.
  - `mos-app/generated/funnel-intelligence.json` — artefato determinístico compilado para consumo do MOS.
  - `mos-app/tests/funnel-intelligence.test.mjs` — testes do bounded context e integração observacional.
- Integração:
  - `a7-command-center.html` recebe `Marketing → Funil Criativo`, somente leitura.
  - O build copia o JSON compilado para a distribuição do MOS; o HTML não replica nem edita a fonte de verdade.
- Os caminhos acima são a decisão arquitetural desta story. Nenhuma nova biblioteca, banco, endpoint de mutação ou integração de escrita em mídia está autorizada. A hierarquia permanece `CLI → Observability → UI`.

### Data semantics

- `conversation` não é `sale`.
- `call` não é `sale`.
- `click`, `view`, `session` e evento principal não são receita.
- `paid_challenger` é estado interno do backlog, não status de plataforma.
- Campos desconhecidos ficam `null` e carregam status/fonte.
- Uma taxa entre etapas só existe quando numerador e denominador pertencem à mesma coorte/janela conciliada.
- `PROMOTE` é uma decisão interna baseada em venda e contribuição reconciliadas; não é publicação, ativação ou aumento de orçamento em plataforma.
- Cada lane/onda admite no máximo um controle e dois challengers.

### Architecture boundaries not specified

- Não há autorização para banco, endpoint de escrita ou novo framework.
- Detalhes internos além dos paths e boundaries aprovados devem seguir os padrões existentes do repositório e permanecer mínimos.

## Testing

- **Contract tests:** fixture sintética de capacidade 10×8, seed parcial válido, piloto real 1×8, onda máxima de três, IDs, campos obrigatórios, assinatura, duplicidade exata/semântica, `externalMetaAdId`, taxonomia e semântica de ausência.
- **State-transition tests:** caminhos permitidos, evidência obrigatória, histórico e rejeição de avanço indevido para sale/retention.
- **CLI tests:** validação, filtros, cobertura, relatório determinístico, erros acionáveis e ausência de mutação externa.
- **Dashboard tests:** menu, filtros, matriz, funil, fontes, freshness, estados vazios/parciais e ausência de controles de campanha.
- **Anti-inference tests:** falhar se clique, chamada, conversa ou `paid_challenger` forem rotulados como venda/campanha ativa.
- **Promotion/mutation tests:** falhar para `PROMOTE` sem venda/contribuição, métrica sem proveniência ou qualquer caminho de mutação de mídia.
- **Regression gates:** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Risks and Mitigations

| Risk | Impact | Mitigation required |
|---|---|---|
| Produzir 80 assets antes de validar | Alto custo e baixa velocidade de aprendizado | Entregar piloto 1×8; testar somente controle + até dois challengers |
| Hipóteses cosméticas contadas como novas | Falsa diversidade e competição interna | Assinatura taxonômica, bloqueio de duplicata e justificativa estratégica |
| “Hype” degradar confiança da marca | Atenção sem demanda qualificada | Claim rastreável, promessa compatível com operação e gate de trust existente |
| Misturar clique/conversa com venda | Decisões financeiras falsas | Evidência obrigatória, semântica fail-closed e testes anti-inferência |
| Dez itens escolhidos por palpite | Backlog desconectado de demanda | Seed parcial válido; expansão 10×8 condicionada a evidência/owner confirmation |
| Frameworks envelhecerem | Processo baseado em regra antiga | Datas, fonte, revisão de freshness e marcação de desatualizado |
| MOS parecer um Ads Manager | Mutação indevida ou expectativa errada | UI somente leitura e nenhum controle de plataforma |
| Sobreposição com A7-003 | Regressão no funil/contratos atuais | Dependência explícita e revisão de integração por `@architect` |
| Dados pessoais entrarem no backlog | Risco de privacidade | Evidências referenciadas por IDs não sensíveis; não armazenar conteúdo pessoal desnecessário |

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

## Approved Implementation Touchpoints

- `marketing/funnel-intelligence/items.json`
- `marketing/funnel-intelligence/taxonomy.json`
- `marketing/funnel-intelligence/briefs.json`
- `marketing/funnel-intelligence/experiments.json`
- `scripts/mos-funnel.mjs`
- `scripts/validate-funnel-intelligence.mjs`
- `mos-app/funnel-intelligence-contract.js`
- `mos-app/generated/funnel-intelligence.json`
- `mos-app/tests/funnel-intelligence.test.mjs`
- `a7-command-center.html`
- `scripts/build-site.mjs`
- `package.json`

## Dev Agent Record

### Agent Model Used

- Codex GPT-5 (`@dev`)

### Debug Log References

- `node scripts/mos-funnel.mjs validate` — PASS
- `node scripts/mos-funnel.mjs inventory` — PASS; 3 itens, 8 briefs, 3 selecionados, 5 no backlog, capacidade 80
- `node scripts/mos-funnel.mjs lint-semantic` — PASS; nenhuma duplicidade ou sobreposição bloqueada
- `node scripts/mos-funnel.mjs compile` — PASS
- `node scripts/validate-funnel-intelligence.mjs` — PASS
- `node --test mos-app/tests/funnel-intelligence.test.mjs` — PASS; 8/8
- `node mos-app/scripts/build.mjs` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS; 14/14 testes Node
- `npm run build` — PASS

### Completion Notes List

- Registro de pesquisa versionado com protocolo Estados Unidos, data de corte, proveniência, freshness, limitações e tradução testável para a A7.
- Catálogo seed mantém sete slots ausentes; `guest wash-and-fold` é piloto e tênis/calça permanecem `owner_idea`, sem ranking inventado.
- Motor CLI/data-first valida contrato, proveniência, taxonomia, sobreposição, ondas, transições e `PROMOTE`, e compila artefato determinístico.
- Piloto contém oito territórios distintos; primeira onda é `control + 2 challengers`, com cinco hipóteses no backlog.
- MOS adiciona `Marketing → Funil Criativo`, filtros completos e estados parciais/indisponíveis, sem qualquer affordance ou cliente de mutação de mídia.
- DoD aplicável passou. Não foram adicionadas dependências, variáveis de ambiente, banco, endpoint ou integração de escrita.

## File List

- `a7-command-center.html`
- `docs/stories/a7-004-creative-funnel-intelligence.md`
- `marketing/funnel-intelligence/README.md`
- `marketing/funnel-intelligence/briefs.json`
- `marketing/funnel-intelligence/evidence.json`
- `marketing/funnel-intelligence/experiments.json`
- `marketing/funnel-intelligence/items.json`
- `marketing/funnel-intelligence/sources.json`
- `marketing/funnel-intelligence/taxonomy.json`
- `mos-app/funnel-intelligence-contract.js`
- `mos-app/generated/funnel-intelligence.json`
- `mos-app/scripts/build.mjs`
- `mos-app/tests/funnel-intelligence.test.mjs`
- `package.json`
- `scripts/mos-funnel.mjs`
- `scripts/validate-funnel-intelligence.mjs`

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-07-30 | 0.1 | Draft inicial com boundaries CLI-first, taxonomia 10×8, funil de evidência e MOS observacional | River (`@sm`) |
| 2026-07-30 | 0.2 | PO refinement: MVP 1×8, wave controle + 2 challengers, seed parcial sem invenção, expansão 10×8 condicionada e paths aprovados pelo `@architect` | Pax (`@po`) |
| 2026-07-30 | 1.0 | MVP implementado: research registry, seed rastreável, piloto 1×8, motor CLI, contrato/artefato, MOS read-only, gates e testes | Dex (`@dev`) |

## Draft Validation

**Readiness:** READY FOR REVIEW
**Clarity score:** 10/10

| Category | Result | Notes |
|---|---|---|
| Goal & context | PASS | Resultado, valor, dependência e boundaries explícitos |
| Technical guidance | PASS | Bounded context, contrato, CLI, artefato gerado, gate, testes e integração MOS localizados pelo `@architect` |
| References | PASS | Referências existentes apontam para artefatos relevantes |
| Self-containment | PASS | Taxonomia, estágios, semântica e riscos estão definidos |
| Testing | PASS | Capacidade 10×8 separada do seed, piloto 1×8, wave máxima, contrato, CLI, UI e gates fail-closed cobertos |
| CodeRabbit | N/A | Desabilitado/ausente em `core-config.yaml` |

**PO decision:** GO. O bloqueio de No Invention foi removido: 10×8 permanece como capacidade e visão de expansão, enquanto o MVP exige apenas dados rastreáveis e um piloto implementável.
