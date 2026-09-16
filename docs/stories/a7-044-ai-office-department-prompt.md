# Story A7-044 — Office IA da A7 e prompt de operação por departamentos

**Status:** Done — pacote documental revisado e encaminhado; não representa ativação operacional.
**Criada:** 2026-09-13.
**Origem:** pedido do Owner nesta sessão para organizar a A7 como um office vivo, focado em captação e operação, com participação de Codex, Claude e Cursor e reporte ao projeto Meu Ceo.
**Preparação:** `@sm`; coordenação documental: Codex; aceite independente: `@qa`.
**Escopo:** documentação local e encaminhamento contextual à task central existente.

## Story

Como Owner da A7 Laundry Orlando, quero um prompt mestre e um manual enxuto de departamentos, responsabilidades, entregas e passagem de trabalho entre as IAs, para transformar a captação em pedidos pagos e entregues com margem, aproveitar as ferramentas contratadas e reduzir a dependência de memória e coordenação manual.

O resultado desta story é um pacote operacional concreto e revisável. A ambição de uma empresa operada por IA será traduzida em estágios verificáveis de autonomia digital; coleta, lavagem, pesagem, transporte e confirmação de capacidade continuam exigindo execução e evidência reais.

## Contexto e fontes

| Fonte | Uso neste pacote |
|---|---|
| Pedido do Owner nesta sessão | Office vivo, captação, departamentos, Codex/Claude/Cursor, eficiência e subordinação a Meu Ceo. |
| `AGENTS.md` e `.aios-core/constitution.md` §§I–V | CLI primeiro, stories, autoridades de agentes, fontes e qualidade. |
| `MANIFESTO.md` §§2–4 e §§7–8 | Oferta canônica, guest como núcleo validado, preço, mínimo, cobertura, Express condicionado e prova verificável. |
| `marketing/PLAYBOOK-ATENDIMENTO.md` §§1.2, 3 e 4 | Responsável e backup, primeira resposta, fila diária, follow-up e indicadores; números de julho são históricos. |
| `marketing/OPERACAO-FUNIL.md` §§1–5 | Conversa, pedido, custo variável, contribuição e recompra separados; gasto só faz sentido com economia verificável. |
| `marketing/funnel-intelligence/README.md` | Hipóteses versionadas, CLI, venda reconciliada e contribuição como requisitos de promoção interna. |
| `docs/blueprints/A7-ORLANDO-COMMERCIAL-COVERAGE-SWARM-PLAN-2026-09-09.md` §§5–6 e §§10–15 | Reaproveitamento de criativos, funil, taxonomia, capacidade, responsáveis e North Star. |
| `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md` §§1 e 3–5 | Lead durável, pedido aceito, pagamento e entrega; clique não é venda; identidade e estados separados. |
| `docs/architecture/site-mos-growth-governance.md` — Decision | Autoria por CLI, MOS consumidor e estados distintos de fonte, build e observação de implantação. |
| `docs/stories/a7-014-whatsapp-ai-agent.md`, A7-025, A7-028 e A7-029 | Canal oficial, Coexistence, envio revisado, inbound e copilot têm dependências explícitas; implementação documental não implica ativação. |
| `docs/stories/a7-039-orlando-commercial-coverage-swarm.md` | A estratégia comercial está planejada; campanhas e orçamento não foram ativados por essa story. |
| `docs/stories/a7-040-mos-operational-config-pair.md` e A7-041 | Integrações locais recentes e reporte já existente a Meu Ceo; revisão/ativação/promoção têm estados próprios. |
| `docs/audits/2026-09-12-orlando-os-ux-service-design-audit.md` §§1–4 | Gargalos documentados de confiança financeira, handoff, encerramento e próximo trabalho do operador. |

O inventário da central deve ser lido antes de definir o organograma final. Preservar os nomes e mandatos das seis células existentes, documentar sua fonte e registrar qualquer lacuna como proposta. Não tratar auditorias, story status ou snapshots antigos como leitura live de hoje.

## Requisitos rastreáveis

| ID | Requisito | Origem |
|---|---|---|
| FR-01 | Preparar um prompt mestre copiável e instruções claras para operação de um office vivo. | Pedido do Owner. |
| FR-02 | Mapear as seis células existentes, cada uma com dono, entrada, saída, prazo, KPI e passagem de trabalho. | Organização departamental solicitada; inventário central a verificar. |
| FR-03 | Distribuir trabalho complementar entre Codex, Claude e Cursor com pacotes distintos e revisão independente. | Pedido do Owner e autoridades da Constitution. |
| FR-04 | Conectar captação a lead qualificado, pedido, pagamento, entrega e retenção, mantendo evidência da origem. | Pedido do Owner; contrato de atribuição e blueprint comercial. |
| FR-05 | Definir piloto, cadência, níveis de autonomia, critérios de avanço e indicadores de negócio e eficiência. | Pedido de objetividade/eficiência; dependências das stories de operação e WhatsApp. |
| FR-06 | Preparar e encaminhar reporte à task central existente, preservando pausa e estado das demais tasks. | Pedido de responder a Meu Ceo; contexto central a verificar. |
| NFR-01 | Distinguir fonte observada, evidência histórica, hipótese, proposta, implantação e ativação. | Constitution IV; governança de estados e atribuição. |
| NFR-02 | Manter cliente, pedido e finanças nas autoridades existentes, sem CRM paralelo nem PII em relatórios de gestão. | Contrato de atribuição; blueprint do OS. |
| NFR-03 | Otimizar entregas aceitas e resultados, sem usar consumo de tokens como objetivo. | Pedido de eficiência; North Star comercial. |
| CON-01 | Esta entrega não cria campanhas, disparos, agendamentos, despesas, providers ou integrações de produção. | Escopo documental do pedido e mandato desta story. |

## Critérios de aceite

- [x] AC-01 — Fontes do repositório auditadas somente em leitura; oferta, fluxo, ativos e gargalos identificados com distinção entre histórico e live não verificado.
- [x] AC-02 — Inventário central conferido e seis células existentes preservadas com dono, limites, entradas, entregas, frequência, KPI e destino de cada handoff.
- [x] AC-03 — `PROMPT-MESTRE.md` é copiável, define reporte a Meu Ceo, ordem de leitura, prioridades, formato de trabalho e critérios de conclusão sem prometer operação ativa.
- [x] AC-04 — Pipeline cobre origem → lead → qualificação → pedido aceito → coleta/pesagem → invoice → pagamento → entrega → review/indicação/recompra; métricas não confundem clique, conversa e receita.
- [x] AC-05 — Pacotes Claude e Cursor têm mandatos distintos, arquivos permitidos, insumos, entregáveis, critérios de aceite e revisão; Codex coordena e integra respeitando as autoridades do projeto.
- [x] AC-06 — Piloto e cadência indicam atividades, donos, dependências e evidências; avanço de autonomia depende de capacidade demonstrada e limites documentados.
- [x] AC-07 — KPIs incluem resposta, leads qualificados, fechamento, pedidos pagos, contribuição quando disponível, pontualidade, retenção e eficiência das IAs, com fonte, período e desconhecidos explícitos.
- [x] AC-08 — O pacote explica que assinaturas e tokens disponíveis precisam de acesso executável verificado; não afirma que Claude/Cursor foram acionados nem que assinatura de aplicativo fornece API.
- [x] AC-09 — Reporte à central identifica decisões, entregas, próximos passos e limitações; encaminhamento usa a task existente e preserva a pausa operacional, sem iniciar outras tasks ou automações.
- [x] AC-10 — Revisão documental independente, referências/caminhos, preservação do escopo e gates exigidos são registrados; checklist e File List refletem o resultado real.

## Tasks / Subtasks

- [x] Auditar documentos comerciais, funil, operação e governança (AC-01).
- [x] Conferir o inventário central e reconciliar as seis células com os ativos existentes (AC-02).
- [x] Elaborar `docs/office/README.md` com mapa operacional, piloto, autonomia e scorecard (AC-02, 04, 06–08).
- [x] Elaborar `docs/office/PROMPT-MESTRE.md` para coordenação contínua e reporte (AC-03, 06, 09).
- [x] Elaborar `docs/office/PACOTES-CLAUDE-CURSOR.md` com trabalho complementar, limites e formato de retorno (AC-05, 08).
- [x] Elaborar `docs/office/REPORTE-MEU-CEO.md` como pacote de encaminhamento (AC-09).
- [x] Revisar coerência comercial, fontes, níveis de autonomia, instruções de pausa e ausência de declarações de ativação (AC-01–09).
- [x] Rodar os gates aplicáveis e registrar resultados sem atribuir falhas preexistentes ao delta documental (AC-10).
- [x] Encaminhar o pacote para a task central existente no escopo autorizado e registrar o resultado (AC-09).
- [x] Atualizar os aceites, status e File List após revisão final (AC-10).

## Dev Notes

- O MOS é consumidor de classificação e evidência, não uma segunda superfície de autoria. O office deve orquestrar os registros existentes, sem manter outra verdade de pedidos ou caixa. [Source: `docs/architecture/site-mos-growth-governance.md` — Decision]
- `order_accepted` e `purchase` têm autoridades e significados distintos. Ausência de atribuição não pode bloquear um pedido real; ausência de evidência permanece desconhecida. [Source: `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md` §§1 e 3]
- O plano comercial de setembro define margem de contribuição de pedidos pagos e entregues no prazo como North Star. O piloto deve preservar o foco guest e tratar expansão como experimento documentado. [Source: `docs/blueprints/A7-ORLANDO-COMMERCIAL-COVERAGE-SWARM-PLAN-2026-09-09.md` §§11–15; `MANIFESTO.md` §§3–4]
- Esta story não requer API, dependência, banco, variável de ambiente ou alteração de runtime. Os quatro novos documentos ficam sob `docs/office/`, conforme o mandato desta sessão.
- ID final A7-044: a revisão encontrou A7-043 reservado na central para a home em A7O-013, ainda pausada e não aplicada. Esta entrega preserva essa reserva; somente seus próprios documentos foram renumerados.
- O formato segue a convenção local `a7-NNN-*.md`. Preparação local baseada no pedido explícito; nenhuma task ou sincronização ClickUp faz parte do escopo.

## Validação

Revisão documental deve verificar: cobertura de cada requisito, seis células e nomes conferidos na central, complementaridade entre executores, oferta correta, pipeline completo, fontes datadas, KPI com fórmula/fonte, pausa preservada e ausência de segredos/PII/declarações de ativação.

Não adicionar testes que apenas repitam o conteúdo dos documentos. O coordenador registrará os gates exigidos por `AGENTS.md`: `npm run lint`, `npm run typecheck` e `npm test`, além de `git diff --check` e revisão independente. Registrar o contexto exato de execução e eventuais limitações; não declarar PASS antes de executar.

### CodeRabbit Integration

`coderabbit_integration.enabled` não está definido na configuração lida. Não declarar a integração habilitada ou desabilitada por inferência. A Constitution exige ausência de achados CRITICAL no gate de promoção; eventual indisponibilidade da ferramenta deve ser registrada separadamente da revisão documental local. Esta story não prevê commit, PR ou deploy.

### Resultado da preparação por @sm

Contexto, entregáveis, rastreabilidade e critérios definidos por @sm; inventário central, quatro documentos, revisão @qa e encaminhamento concluídos pelo coordenador. A story foi renumerada para A7-044 após verificar a reserva central de A7-043.

## File List

Arquivos criados nesta entrega:

- `docs/stories/a7-044-ai-office-department-prompt.md`

- `docs/office/README.md`
- `docs/office/PROMPT-MESTRE.md`
- `docs/office/PACOTES-CLAUDE-CURSOR.md`
- `docs/office/REPORTE-MEU-CEO.md`

## Registro de execução

| Data | Papel | Resultado |
|---|---|---|
| 2026-09-13 | `@analyst` / `@sm` | Auditoria local e story documental preparadas. |
| 2026-09-13 | Coordenador / `@architect` | Contrato, prompt, pacotes e reporte criados; arquitetura existente e pausa preservadas. |
| 2026-09-13 | `@qa` | PASS documental independente; achados corrigidos e relidos. |
| 2026-09-13 | Coordenador | Encaminhado por `send_message_to_thread` à tarefa “Estruturar centro de execução”, ID `01a097ac-d337-7320-8d6b-15a4804964dc`, somente para leitura e recebimento. Ferramenta confirmou envio; `wait_threads` confirmou conclusão da rodada receptora, sem erro. Não foi inferida ativação operacional. |

### Gates executados pelo coordenador

| Verificação | Resultado e evidência local |
|---|---|
| `npm run lint` | PASS, exit 0; `/tmp/a7-office-lint.log` |
| `npm run typecheck` | PASS, exit 0; `/tmp/a7-office-typecheck.log` |
| `npm test` | PASS, exit 0; 169 + 95 + 84 testes TAP, zero falhas, além dos validadores; `/tmp/a7-office-test.log` |
| `npm run build` | PASS, exit 0; `/tmp/a7-office-build.log` |
| Referências e formato | Quatro documentos com links locais resolvidos, newline final e sem espaços finais; `git diff --check` sem achados |
| Preservação | Status Git final conserva alterações preexistentes; novos arquivos desta entrega limitados à File List |
| Revisão independente | PASS documental na seção QA Results |
| CodeRabbit | Não executado nesta entrega documental sem PR/deploy; não alegar gate de promoção aprovado |

Testes/build emitiram aviso de adjudicação canônica já registrada entre URLs de comforter; não é erro dos gates e não foi alterado por esta entrega. Esses checks não comprovam readiness do WhatsApp, campanhas, infraestrutura contínua ou resultados de negócio. Os logs em `/tmp` são evidência temporária; este registro preserva comando, resultado e escopo.

## QA Results

### Revisão documental independente — 2026-09-13

**Revisor:** `@qa` (Quinn), após leitura da definição do papel. **Parecer: PASS documental**, limitado aos quatro arquivos de `docs/office/` e à coerência desta story; não é aceite de ativação ou de operação comercial.

- As seis células e seus nomes foram conferidos contra `Meu Ceo/marketing/a7-orlando/office/OFFICE.md`. Dono funcional, executor proposto, entrada, gatilho/frequência, entrega, handoff e indicador estão explícitos.
- Oferta e tempo de resposta conferidos contra `MANIFESTO.md` e `marketing/PLAYBOOK-ATENDIMENTO.md`. Pipeline, coortes, contribuição e origem preservam a distinção entre contato, qualificação, aceite, pagamento e entrega; desconhecidos não são convertidos em zero.
- `PROMPT-MESTRE.md` é copiável e define leitura, despacho com ID da tarefa e `run_id`, evidência, base/escopo, dono, revisão e reporte. Claude, Cursor e Codex têm entregas complementares; o piloto usa cenários sintéticos e o pacote Cursor permanece somente leitura.
- Pausa conferida em `Meu Ceo/ESTADO.md`: o pacote preserva a central, A7O-013 e retomadas específicas, mantém fila/runtime existentes e não afirma acionamento de executores, operação autônoma ou implantação de copilot. Fronteiras de A7-014/025/028/029 permanecem explícitas.
- Achados iniciais resolvidos pelo integrador e relidos: entradas/frequências por célula, `run_id`, recompra/indicação por coorte e conflito de identificação. A7-043 estava referenciada no pacote pausado da home; a renumeração para A7-044 preserva essa reserva e os links locais foram atualizados.
- `git diff --check` dirigido ao pacote não reportou problemas nesta revisão. O coordenador informou conclusão de lint, typecheck, testes e build com exit 0; os resultados técnicos completos devem permanecer no registro próprio do coordenador. Esta revisão não executou CodeRabbit nem reexecutou as suítes.

Não restam achados documentais bloqueantes. Encaminhamento efetivo à task central e fechamento de checklist/status continuam sob responsabilidade do coordenador, com registro do resultado real; o reporte preparado sozinho não comprova recebimento.
