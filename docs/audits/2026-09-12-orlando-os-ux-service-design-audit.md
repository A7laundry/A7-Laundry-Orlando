# Auditoria de experiência do A7 Orlando OS

## 1. Resumo executivo

O A7 Orlando OS já possui uma base operacional mais rigorosa do que sua aparência sugere: regras server-side, quatro eixos de estado, trilha de auditoria, controle de papéis, idempotência e separação financeira. O problema central não é falta de regra. É que a interface expõe a estrutura interna do sistema em vez de organizar o trabalho do operador.

O sistema parece “quadrado” por cinco causas combinadas:

1. **A jornada foi construída como uma sequência de lançamentos**, não como um workspace contínuo do pedido. Cada avanço exige localizar uma seção, interpretar estados internos e confirmar uma nova etapa.
2. **A Home mistura sinal, inventário e histórico.** Há contagens e alertas, mas nem sempre é evidente qual pedido merece ação e por quê. Um pedido/teste antigo apareceu como prioridade do dia em 12/09/2026.
3. **A tela do pedido apresenta muitas verdades com a mesma importância visual.** Dados cadastrais, documentos, invoice, pagamento, próxima ação e histórico formam uma longa coluna de painéis.
4. **Exceções reais não têm caminho operacional completo.** Substituir Payment Link, reconciliar uma execução já feita fora do sistema ou corrigir uma divergência exige sair da interface ou improvisar.
5. **A confiança cai quando projeções divergem dos fatos.** No pedido real MCO 1007, o banco conciliou US$66,00 (US$60,00 de serviço + US$6,00 de gorjeta), enquanto a tela mostrou “Total pago US$60,00”. O mesmo pedido mostrou handoff “Não informado”, embora a nota registrasse Front Desk, e o histórico exibiu “Deixado no Bell Desk”.

O redesign recomendado não é uma reconstrução. É uma evolução incremental em torno de três superfícies:

- **Central operacional:** prioridades, filas e exceções reconciliadas.
- **Busca universal:** pedido, cliente, telefone, hotel, quarto e referência A7 em um só ponto.
- **Workspace do pedido:** cabeçalho fixo, etapa atual, uma ação principal, resumo financeiro reconciliado, timeline e detalhes sob demanda.

O primeiro investimento deve corrigir confiança e encerramento, antes de estética: total financeiro, handoff, histórico, pedidos concluídos que continuam acionáveis e substituição segura de Payment Link.

## 2. Escopo, método e limites

Foram usados quatro tipos de evidência:

- inspeção do repositório, stories, serviços, contratos de estado e estilos;
- inspeção autenticada e somente leitura da produção em 12/09/2026;
- rastreamento do pedido real MCO 1007, já concluído pela operação;
- benchmark em páginas oficiais de produtos de lavanderia, fulfillment, field service e pagamentos.

Nenhum pedido foi alterado, nenhuma cobrança foi criada, nenhuma mensagem foi enviada e nenhum dado de produção foi escrito durante esta auditoria.

Esta é uma avaliação heurística feita por um especialista, não um estudo moderado com vários operadores. Segundo a própria metodologia de avaliação heurística, avaliadores diferentes encontram problemas diferentes; portanto, os achados devem ser complementados por testes observacionais com Owner, Manager e Operator antes do redesign final.[^1]

## 3. Modelo atual do produto

### 3.1 Personas e permissões

| Persona | Objetivo principal | Acesso observado/contratado | Risco de UX atual |
|---|---|---|---|
| Owner | Garantir operação, dinheiro e exceções | Acesso total, equipe, segurança e transições críticas | Vira integrador humano entre sistema, Stripe e operação |
| Manager | Coordenar pedidos, motoristas, invoices e financeiro | Operação e gestão, sem administração máxima | Precisa interpretar estados técnicos e exceções sem caminho explícito |
| Operator | Executar etapas autorizadas com rapidez | Atendimento e execução operacional delimitada | Depende de memorização do fluxo e de escalonamento frequente |
| Driver | Coletar/entregar e registrar evidência | Não possui workspace dedicado no sistema atual | A execução móvel depende de instruções externas e posterior lançamento |

### 3.2 Entidades centrais

```text
Cliente ─┬─ Atendimento/Lead ─ Pedido ─ Itens/Pesos
         │                       ├─ Invoice/versões
         │                       ├─ Payment Link/Pagamento/Gorjeta
         │                       ├─ Coleta/Entrega/Motoristas
         │                       ├─ Handoff
         │                       └─ Eventos/Histórico
         └─ Hotel/Quarto/Instruções

Rota ─ Paradas ─ Pedido
Usuário ─ Papel/Permissões
```

### 3.3 Quatro eixos de estado

| Eixo | Pergunta que responde | Exemplos atuais |
|---|---|---|
| Lifecycle | Em que marco global o pedido está? | Aceito, coleta agendada, invoice criada, entregue |
| Custódia | Quem está fisicamente com a roupa? | Cliente, motorista, lavanderia, recepção, entregue |
| Produção | O que aconteceu com a roupa? | Aguardando peso, processando, pronto |
| Financeiro | O dinheiro está reconciliado? | Pendente, invoice criada, pago, falhou, estornado |

Separar os eixos é correto. O problema é apresentá-los como quatro rótulos paralelos sem explicar a relação entre eles, o bloqueio atual e a próxima ação.

### 3.4 Inventário de telas

| Tela/superfície | Função atual | Observação |
|---|---|---|
| Login / primeiro acesso | Autenticação e troca obrigatória de senha | Fluxo coerente e isolado |
| Hoje | Alertas, operação, ações e resultados | Boa intenção; mistura resumo e trabalho sem explicar causa |
| Atendimento | Registrar venda já fechada no WhatsApp | Conceito claro, mas separado de busca/pedidos |
| Novo atendimento | Criar cliente/lead/pedido/itens | Formulário longo e orientado ao cadastro |
| Pedidos | Filas, busca e filtros por eixos | Poderoso, mas exige conhecer o modelo interno |
| Pedido | Executar e auditar todo o ciclo | Principal fonte de densidade e rolagem |
| Clientes Lite | Busca e histórico comercial | “Lite” e “sem CRM” são linguagem de projeto, não de operação |
| Hotéis | Diretório e desempenho | Útil; handoff deveria alimentar o pedido de forma mais visível |
| Faturamento | KPIs e períodos | Separação financeira correta, mas desconectada da exceção do pedido |
| Equipe | Usuários e papéis | Coerente, porém papéis misturam português e inglês |
| Rotas W3-D | Rotas, paradas e exceções | Nome de wave exposto ao usuário; operação deveria ver “Rotas” |
| Pickup Order | Documento operacional/impresso | Superfície paralela, útil para impressão |

### 3.5 Arquitetura de informação atual

```text
Hoje
Atendimento
├─ Novo atendimento
└─ Reabrir pedido
Pedidos
├─ Filas
├─ Filtros de custódia/produção
└─ Detalhe do pedido
   ├─ Estados
   ├─ Pedido/itens
   ├─ Documentos
   ├─ Pesagem
   ├─ Invoice/Payment Link
   ├─ Pagamento
   ├─ Motoristas/Handoff
   ├─ Próxima ação
   └─ Histórico
Clientes Lite
Hotéis
Faturamento
Equipe
Rotas W3-D
```

A estrutura é orientada às features entregues por wave. Para o operador, contudo, “atendimento”, “pedido”, “cliente” e “rota” são perspectivas da mesma jornada. A navegação atual obriga a escolher a entidade antes de começar a tarefa.

### 3.6 Jornada por persona

| Persona | Gatilho | Caminho atual | Necessidade não atendida | Jornada-alvo |
|---|---|---|---|---|
| Owner | Abrir o dia e descobrir riscos | Hoje → alerta → Pedidos → pedido → sistemas externos em exceções | Distinguir urgência real, dívida histórica e divergência financeira | Central → prioridade explicada → ação ou exceção governada → confirmação |
| Manager | Coordenar coleta, produção e entrega | Pedidos/Rotas → filtros → pedido → designações e transições | Trabalhar por horizonte, responsável e bloqueio sem interpretar códigos | View salva “Minha operação hoje” → lote priorizado → workspace contextual |
| Operator | Executar o próximo passo | Atendimento/Pedidos → procurar → rolar → localizar “Próxima ação” | Saber o que fazer e por que está liberado | Busca/Agora → ação primária acima da dobra → feedback → próximo passo |
| Driver | Receber e concluir uma parada | Instrução fora do sistema → execução → lançamento posterior por Owner/Manager | Jobs do dia, endereço/handoff, evidência e exceção no celular | Rota do dia → próxima parada → confirmar/evidenciar → exceção contextual |

Momentos críticos por persona:

- **Owner:** manhã (priorização), cobrança (confiança), fim do dia (fechamento e reconciliação).
- **Manager:** montagem de rotas, fila da lavanderia, despacho e exceções.
- **Operator:** entrada, pesagem, processamento e entrega assistida.
- **Driver:** aceite da parada, chegada, coleta/handoff e prova de execução.

## 4. Mapa da experiência atual

### 4.1 Jornada principal observada

```text
WhatsApp externo
  → Atendimento
  → Novo atendimento
  → Pedido aceito
  → Definir prazo Express
  → Agendar coleta
  → Designar motorista da coleta
  → Confirmar coleta
  → Receber na lavanderia
  → Registrar peso
  → Revisar/emitir invoice
  → Gerar/copiar Payment Link
  → Aguardar conciliação
  → Iniciar processamento
  → Marcar pronto
  → Designar motorista da entrega
  → Sair para entrega
  → Registrar handoff
  → Confirmar entrega
  → Pedido concluído
```

No MCO 1007, a timeline registrou 19 eventos visíveis e incluiu eventos de sistema e de Owner para o mesmo marco. A operação é auditável, mas a timeline não diferencia claramente “ação humana”, “efeito automático” e “correção”.

### 4.2 Esforço estimado por macrofluxo

| Macrofluxo | Telas/estados visitados | Cliques estimados | Decisões relevantes | Principal hesitação |
|---|---:|---:|---:|---|
| Criar pedido conhecido | 2–3 | 12–18 | 8–12 | Encontrar cliente ou recriar identidade |
| Coleta | 1–2 | 6–9 | 3–4 | Diferença entre agendar, designar e confirmar |
| Entrada e pesagem | 1 | 4–7 | 2–3 | Estado que libera peso e correção |
| Invoice e cobrança | 1 + Stripe quando há exceção | 6–12 | 4–6 | Mínimo, gorjeta, link atual e conciliação |
| Produção e entrega | 1–2 | 8–13 | 4–6 | Handoff intermediário versus conclusão |
| Exceção/reconciliação | 2+ sistemas | Indeterminado | Alto | Não existe caminho único e governado |

Os cliques são estimativas derivadas da interface e do rastro do MCO 1007; devem ser cronometrados em teste de usabilidade. A oportunidade não é simplesmente reduzir cliques, mas agrupar decisões que pertencem ao mesmo momento operacional.

## 5. Avaliação heurística

Escala: 1 = crítico, 3 = aceitável com atrito, 5 = excelente.

| Critério | Nota | Diagnóstico |
|---|---:|---|
| Visibilidade do estado | 3 | Estados existem, mas relações e discrepâncias não são explicadas |
| Correspondência com o mundo real | 2 | “Lifecycle”, “W3-D”, “Lite”, “handoff” e mistura EN/PT exigem tradução mental |
| Controle e liberdade | 2 | Poucos caminhos de correção; Payment Link incorreto exigiu saída da interface |
| Consistência | 2 | Front Desk/Bell Desk, total pago e evento sem label contradizem o fato |
| Prevenção de erros | 4 | Backend é conservador, idempotente e fail-closed |
| Reconhecimento vs. memorização | 2 | Operador precisa saber a sequência e interpretar quatro eixos |
| Eficiência | 2 | Muitas transições unitárias e rolagem longa |
| Clareza visual | 2 | Repetição de cards/painéis, caixa alta e igual peso visual |
| Recuperação de erros | 1 | Exceções importantes não têm workspace próprio |
| Ajuda contextual | 3 | Há textos auxiliares, mas frequentemente explicam o sistema, não a tarefa |
| Acessibilidade | 3 | Há foco e responsividade básicos; falta validação formal e hierarquia menos dependente de cor |
| Auditabilidade | 4 | Histórico e eventos são fortes, embora mal traduzidos |
| Confiança financeira | 1 | Um total de pagamento divergente invalida a confiança da tela inteira |

Nota composta: **2,5/5**. O backend é mais maduro que a experiência apresentada.

As heurísticas de Nielsen enfatizam visibilidade do estado, linguagem compatível com o mundo real, controle do usuário e consistência.[^2] Para mobile, os alvos devem ter ao menos 24×24 CSS px ou espaçamento equivalente, e todo foco de teclado deve permanecer visível.[^3][^4]

## 6. Achados priorizados

Frequência, risco e esforço usam escala 1–5. Prioridade = severidade × frequência × risco ÷ esforço.

| ID | Resumo | Sev. | Freq. | Risco | Esforço | Prioridade |
|---|---|---:|---:|---:|---:|---:|
| UX-01 | Total pago diverge do pagamento reconciliado | S4 | 4 | 5 | 1 | 80,0 |
| UX-02 | Handoff registrado não é projetado corretamente | S4 | 4 | 5 | 2 | 40,0 |
| UX-03 | Falta caminho de substituição de Payment Link | S4 | 3 | 5 | 2 | 30,0 |
| UX-04 | Operação concluída fora do sistema permanece acionável | S4 | 3 | 5 | 3 | 20,0 |
| UX-05 | Home prioriza registros antigos/teste | S3 | 4 | 4 | 2 | 24,0 |
| UX-06 | Evento financeiro aparece como “Não informado” | S3 | 4 | 4 | 1 | 48,0 |
| UX-07 | Jornada exige transições manuais excessivas | S3 | 5 | 4 | 4 | 15,0 |
| UX-08 | Tela do pedido é uma pilha longa de painéis | S2 | 5 | 3 | 2 | 15,0 |
| UX-09 | Quatro eixos não explicam bloqueio/causalidade | S3 | 4 | 4 | 3 | 16,0 |
| UX-10 | Busca fragmentada entre Atendimento, Pedidos e Clientes | S2 | 5 | 3 | 3 | 10,0 |
| UX-11 | Terminologia técnica e bilíngue | S2 | 5 | 3 | 2 | 15,0 |
| UX-12 | Métricas da Home não explicam causa nem impacto | S2 | 4 | 3 | 2 | 12,0 |
| UX-13 | Timeline duplica marco humano e efeito automático | S2 | 5 | 3 | 3 | 10,0 |
| UX-14 | Estado concluído mantém seção/controle redundante | S1 | 5 | 2 | 1 | 10,0 |
| UX-15 | Navegação mobile é uma faixa horizontal de módulos | S2 | 4 | 3 | 3 | 8,0 |

### UX-01

**Tela/fluxo:** Pedido → Pagamento.  
**Problema:** serviço US$60 + gorjeta US$6, mas “Total pago” mostra US$60.  
**Evidência:** MCO 1007 em produção; o ledger conciliado registra US$66. O adaptador visual cai para `amount`/`service_amount` quando não recebe `total_amount` ([`sistema.js`, linha 1084](../../sistema.js#L1084)).  
**Causa provável:** projeção de leitura financeira não preserva um total canônico até a UI.  
**Impacto:** Owner não consegue confiar no caixa nem na gorjeta.  
**Severidade:** S4. **Frequência:** sistemática para o formato de payload afetado. **Risco:** conciliação e repasse incorretos.  
**Recomendação:** criar contrato único `service + tip - refunds = paid_total`, validado server-side; UI nunca recalcula nem usa fallback silencioso.  
**Exemplo visual:** linha de reconciliação com parcelas e selo “Conciliado via Stripe”.  
**Critério de aceitação:** em 100% dos fixtures Stripe/manual, soma exibida, total persistido e total do provedor são iguais ao centavo; divergência bloqueia conclusão financeira e mostra causa.

### UX-02

**Tela/fluxo:** Pedido → Entrega/Handoff/Histórico.  
**Problema:** Front Desk registrado na nota, campo de handoff “Não informado” e histórico “Deixado no Bell Desk”.  
**Evidência:** MCO 1007, produção, 12/09/2026. O catálogo visual traduz toda ação `leave_bell_desk` como “Deixado no Bell Desk” ([`sistema.js`, linha 382](../../sistema.js#L382)), embora o formulário aceite Front Desk e Concierge.  
**Causa provável:** estado de custódia colapsa pontos de hotel em `bell_desk`, enquanto a evidência detalhada não chega corretamente à projeção.  
**Impacto:** a equipe não sabe onde a roupa foi deixada; risco de perda e disputa.  
**Severidade:** S4. **Frequência:** qualquer Front Desk/Concierge pode ser afetado. **Risco:** custódia e cliente.  
**Recomendação:** separar `custody_state=hotel_handoff` de `handoff_point=front_desk|bell_desk|concierge`; projetar ambos de uma única evidência imutável.  
**Exemplo visual:** “Deixado no Front Desk · Leo Ferrari · 18:24 · confirmação pendente/concluída”.  
**Critério de aceitação:** ponto escolhido aparece igual em resumo, timeline, documentos e API; teste parametrizado cobre todos os pontos.

### UX-03

**Tela/fluxo:** Invoice → Payment Link.  
**Problema:** o link atual pode ser aberto/copied, mas não substituído pela UI.  
**Evidência:** correção do MCO 1007 exigiu desativação fora do sistema. A Stripe suporta desativar links e impede novos pagamentos após a desativação.[^5]  
**Causa provável:** story inicial previu governança do link atual, mas a interface entregue não expôs recuperação segura.  
**Impacto:** link de valor incorreto pode permanecer válido; operação depende do Owner técnico.  
**Severidade:** S4. **Frequência:** ocasional. **Risco:** cobrança duplicada/incorreta.  
**Recomendação:** ação “Substituir link” com prévia do impacto, confirmação, desativação do anterior e criação do novo em uma operação governada.  
**Exemplo visual:** drawer com “Atual US$60 → Novo US$66; o link anterior deixará de aceitar pagamentos”.  
**Critério de aceitação:** nunca existem dois links ativos para a invoice; falha na desativação impede o novo link; todo resultado é auditado.

### UX-04

**Tela/fluxo:** Exceções/fechamento.  
**Problema:** pedidos concluídos/pagos fora do sistema não têm reconciliação guiada.  
**Evidência:** registros anteriores precisaram ser tratados operacionalmente fora da jornada normal; Home ainda apresentou Andreia Batemarque como coleta pendente.  
**Causa provável:** motor suporta apenas transição ideal sequencial.  
**Impacto:** backlog falso, alertas vencidos e perda de confiança.  
**Severidade:** S4. **Frequência:** recorrente em operação migrada/WhatsApp. **Risco:** estado e custódia falsos.  
**Recomendação:** modo de reconciliação com fatos observados, impacto, evidências mínimas, confirmação por papel e eventos compensatórios — sem edição direta no banco.  
**Exemplo visual:** “A operação já ocorreu?” → selecionar marcos comprovados → revisar estados derivados → confirmar.  
**Critério de aceitação:** pedido externo pode alcançar estado verdadeiro em um fluxo auditável; sistema não presume horários, pagamentos ou custódia ausentes.

### UX-05

**Tela/fluxo:** Home.  
**Problema:** “Visão do dia” mostra coleta de 30/08 e pedido de 07/09 como prioridade em 12/09.  
**Evidência:** captura somente leitura da Home em produção.  
**Causa provável:** dados antigos continuam ativos e a Home cumpre o contrato técnico de “acionável”, mas não distingue dívida histórica de trabalho de hoje.  
**Impacto:** o operador perde tempo e pode ignorar uma urgência real.  
**Severidade:** S3. **Frequência:** diária enquanto houver dívida. **Risco:** atraso.  
**Recomendação:** separar “Agora”, “Hoje”, “Atrasados” e “Dados para reconciliar”; nunca misturar dívida histórica com fila corrente.  
**Critério de aceitação:** 100% dos itens em “Agora” possuem ação válida e horizonte explícito; históricos aparecem em exceções.

### UX-06

**Tela/fluxo:** Timeline.  
**Problema:** evento de pagamento conciliado aparece como “Não informado”.  
**Evidência:** MCO 1007 às 15:32.  
**Causa provável:** label ausente em `ACTION_LABELS` ou evento não mapeado.  
**Impacto:** trilha perde legibilidade justamente no evento financeiro.  
**Severidade:** S3. **Frequência:** sistemática por tipo de evento. **Risco:** auditoria.  
**Recomendação:** catálogo exaustivo de eventos, validação que falha em teste quando um evento não tem linguagem humana.  
**Critério de aceitação:** nenhum evento governado renderiza “Não informado”; eventos desconhecidos mostram código seguro e alerta de observabilidade.

### UX-07

**Tela/fluxo:** Ciclo completo.  
**Problema:** 18–20 marcos visíveis e muitas confirmações unitárias.  
**Evidência:** timeline do MCO 1007 e [`nextActionFor()`](../../lib/system-operations-service.js#L130) sequencial.  
**Causa provável:** cada wave adicionou uma ação à mesma coluna, sem recompor momentos de trabalho.  
**Impacto:** baixa velocidade, fadiga e esquecimentos.  
**Severidade:** S3. **Frequência:** todo pedido. **Risco:** produtividade e atraso.  
**Recomendação:** manter eventos separados no backend, mas agrupar a interface por momentos: Coleta, Entrada, Produção, Cobrança e Entrega. Após uma ação, oferecer a próxima no mesmo contexto.  
**Critério de aceitação:** pedido normal sem exceção exige no máximo 5 mudanças de contexto e reduz em 35% o tempo mediano sem perder eventos.

### UX-08

**Tela/fluxo:** Pedido.  
**Problema:** uma longa pilha de detalhes compete com a próxima ação.  
**Evidência:** MCO 1007 apresenta estados, 17 fatos, itens, documentos, invoice, pagamento, próxima ação e 20 eventos em sequência.  
**Causa provável:** componentes adicionados cronologicamente por feature.  
**Impacto:** rolagem e busca visual.  
**Severidade:** S2. **Frequência:** todo pedido. **Risco:** hesitação.  
**Recomendação:** cabeçalho/resumo fixo; coluna central de ação/timeline; painel lateral com cliente, dinheiro e documentos; detalhes progressivos.  
**Critério de aceitação:** estado, risco, total e próxima ação aparecem acima da dobra em 1366×768 e em até uma tela inicial mobile.

### UX-09

**Tela/fluxo:** Cabeçalho do pedido.  
**Problema:** quatro eixos mostram estado, mas não explicam por que a ação está disponível/bloqueada.  
**Evidência:** [`nextActionFor()`](../../lib/system-operations-service.js#L130) possui regras determinísticas ricas que a UI reduz a label e `blocked_by`.  
**Causa provável:** perda de explicabilidade entre serviço e apresentação.  
**Impacto:** operador memoriza regras ou procura suporte.  
**Severidade:** S3. **Frequência:** todo pedido. **Risco:** ação errada.  
**Recomendação:** contrato de decisão com fatos considerados, regra aplicada, ação e bloqueio em linguagem humana.  
**Critério de aceitação:** toda ação crítica exibe “por que agora” e todo bloqueio exibe condição para liberar.

### UX-10

**Tela/fluxo:** Navegação e busca.  
**Problema:** há busca de pedido em Atendimento, busca mais ampla em Pedidos e busca de cliente em Clientes.  
**Evidência:** três formulários separados em [`sistema.html`](../../sistema.html): pedido operacional, reabertura por número e cliente.  
**Causa provável:** evolução por módulo.  
**Impacto:** usuário decide onde buscar antes de saber o que existe.  
**Severidade:** S2. **Frequência:** alta. **Risco:** tempo.  
**Recomendação:** busca universal acessível no topo e por `⌘K/Ctrl+K`, com categorias e ações. Shopify usa busca global no admin e o atalho `Command/Ctrl+K` para localizar pedidos, clientes e outros recursos.[^6]  
**Critério de aceitação:** número, nome, telefone, hotel, quarto e referência encontram o destino correto em uma interação, sem PII na URL.

### UX-11 a UX-15 — síntese

| ID | Problema/evidência | Recomendação | Critério de aceitação |
|---|---|---|---|
| UX-11 | “Lifecycle”, “handoff”, “Bags”, “Needed by”, “Invoice”, “Clientes Lite”, “Rotas W3-D” e caixa alta | Glossário operacional único e labels em sentence case | 100% dos termos aprovados passam por catálogo compartilhado; nenhuma wave aparece na UI |
| UX-12 | Card “Pagamento requer atenção” diz “Valor não disponível neste resumo” | Mostrar causa, pedido mais urgente e ação; se valor for desconhecido, dizer por quê | Todo alerta responde “quantos, quais, por quê e o que fazer” |
| UX-13 | “Coleta agendada” e “Coleta concluída” aparecem como eventos humanos e de sistema no mesmo segundo | Agrupar evento-intenção e efeito numa entrada expansível | Timeline resumida reduz ruído em 40% e preserva auditoria expandida |
| UX-14 | Pedido concluído mostra texto e botão desabilitado idênticos | Substituir por fechamento compacto com data, evidência e reabrir somente via exceção | Nenhum controle sem ação é anunciado como botão |
| UX-15 | Mobile transforma sidebar em faixa horizontal e mantém alta densidade | Navegação inferior/overflow “Mais”; ação primária fixa; resumos colapsáveis | Tarefas principais passam a 390 px sem rolagem horizontal e com alvo mínimo WCAG |

## 7. Benchmark competitivo

O benchmark identifica padrões, não layouts para copiar.

| Player | Padrão observado | Problema resolvido | Evidência | Aplicabilidade à A7 | Risco de copiar |
|---|---|---|---|---|---|
| Cents | Dispatch com mapa, planejamento de 7 dias, rotas salvas/editáveis, zonas e atualizações | Coordenação de frota e previsibilidade | [Cents Pickup & Delivery](https://www.trycents.com/solutions/pickup-delivery-software) | Alta para Rotas e visão diária | Alto se a A7 adotar complexidade de frota antes do volume |
| CleanCloud | Driver app com jobs do dia, foto, assinatura, chat e fluxo Picked Up/Delivered reduzido | Evidência de custódia e menos toques | [CleanCloud Pickup & Delivery](https://cleancloudapp.com/pickup-and-delivery) e [Driver App](https://cleancloudapp.com/blog/laundromat-pickup-and-delivery-meet-the-new-cleancloud-driver-app) | Alta para handoff e experiência móvel | Médio; evitar app separado prematuro |
| Starchup | Rota, mensagens bidirecionais e rastreamento em tempo real integrados | Fragmentação entre operação e comunicação | [Starchup](https://www.starchup.com/) | Média; primeiro unificar fatos/mensagens | Médio/alto por escopo |
| Turns | Fluxo estruturado de pedido de coleta do site ao POS | Entrada multicanal previsível | [Turns Help Center](https://help.turnsapp.com/en/articles/9541520-pickup-request-flow-from-website-till-pos) | Alta para WhatsApp → pedido | Baixo se mantida revisão humana |
| Rinse | Jornada simples Pickup → Cleaning → Delivery; ETA mais estreito por texto | Reduz ansiedade do cliente | [Rinse — How it works](https://www.rinse.com/how-it-works/) | Alta para comunicação e resumo de fase | Baixo |
| Poplin | Três etapas, preferências viajam com o pedido e updates no app | Clareza para cliente e operador | [Poplin — How it works](https://poplin.co/how-it-works) | Média; bom modelo mental, não o marketplace | Alto se copiar economia/marketplace |
| Square | Filtrar por status/origem/pagamento; ordenar; activity log; bulk actions | Localização e fulfillment em volume | [Square Order Manager](https://api.squareup.com/help/us/en/article/6923-pickup-orders-on-square-point-of-sale) | Alta para Pedidos e timeline | Médio; bulk actions críticas exigem limites |
| Shopify Admin | Busca global, filtros combináveis e views salvas | Encontrabilidade e filas por papel | [Admin search](https://help.shopify.com/en/manual/shopify-admin/admin-search) e [Order filters](https://help.shopify.com/en/manual/fulfillment/managing-orders/viewing-orders/filtering-orders) | Muito alta | Baixo se aplicado incrementalmente |
| DoorDash Merchant | Central de pedidos ao vivo, marcação Ready, comunicação e exceção no contexto | Operação sob pressão | [Order Manager](https://help.doordash.com/en-us/merchants/article/tablet-getting-started-guide) e [Fulfill orders](https://help.doordash.com/en-us/merchants/article/fulfill-orders) | Alta para “Agora” e exceções | Médio; contexto de restaurante é mais síncrono |
| Stripe | Link pode ser desativado e deixa de aceitar pagamento; estado pode ser atualizado por API | Recuperação de cobrança incorreta | [Share/deactivate](https://docs.stripe.com/payment-links/share) e [Update Payment Link](https://docs.stripe.com/api/payment-link/update) | Muito alta | Baixo; exige operação transacional e auditoria |

Padrões que se repetem nos melhores produtos:

- uma central de trabalho, não um mural de KPIs;
- busca global e views salvas;
- estados simples para leitura, detalhes técnicos sob demanda;
- ação no contexto do pedido;
- timeline de atividade como explicação, não como dump;
- exceções tratadas no produto;
- experiência móvel específica para execução;
- comunicação e prova de entrega conectadas ao evento operacional.

## 8. Nova arquitetura de informação

```text
Central
├─ Agora
├─ Hoje
├─ Atrasados
└─ Exceções

Pedidos
├─ Todos
├─ Minhas visualizações
└─ Busca/filtros avançados

Rotas
├─ Hoje
├─ Planejamento
└─ Motoristas

Clientes
Hotéis
Financeiro
Administração

Busca universal — disponível em toda tela
```

Mudanças principais:

- “Hoje” vira **Central**, porque inclui agora, atrasos e reconciliações.
- “Atendimento” deixa de ser destino principal e vira ação **Novo pedido**.
- “Clientes Lite” vira **Clientes**.
- “Rotas W3-D” vira **Rotas**.
- “Equipe” passa para Administração.
- criação, reabertura e busca deixam de competir em módulos diferentes.

## 9. Fluxo ideal do pedido

```text
Entrada revisada
  → Coleta [planejar + motorista + confirmação no mesmo contexto]
  → Entrada [custódia + bolsas + peso]
  → Produção [iniciar + pronto]
  → Cobrança [invoice + link + conciliação]
  → Entrega [motorista + saída + handoff/prova]
  → Concluído

Em paralelo:
  Exceção → diagnóstico → ação permitida → confirmação → evento auditável
```

O backend pode preservar todas as transições atuais. A interface agrupa passos correlatos, atualiza o workspace após cada ação e mantém a próxima ação visível.

## 10. Proposta da Home/Central

### Desktop — wireframe de baixa fidelidade

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ A7 Orlando OS      [ Buscar pedido, cliente, hotel…  ⌘K ]   Hoje 18:59  DA │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ Central       │ AGORA                                           [Atualizar] │
│ Pedidos       │ 3 ações · 1 atraso · 1 exceção                             │
│ Rotas         │                                                              │
│ Clientes      │ ┌ Atrasado ─ MCO 1001 ─ Andrea ───────────────────────────┐ │
│ Hotéis        │ │ Coleta de 07/09 não reconciliada                         │ │
│ Financeiro    │ │ [Reconciliar operação]                    há 5 dias      │ │
│ Administração │ └──────────────────────────────────────────────────────────┘ │
│               │ ┌ MCO 1012 ─ Brian ─ Express ─ vence em 1h42 ────────────┐ │
│               │ │ Na lavanderia · pronto · pago                           │ │
│               │ │ [Designar entrega]                                      │ │
│               │ └──────────────────────────────────────────────────────────┘ │
│               │                                                              │
│               │ HOJE        Coletas 3  Na lavanderia 2  Entregas 4          │
│               │ EXCEÇÕES    Pagamento 1 · Custódia 1 · Dados 1              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

### Mobile — wireframe de baixa fidelidade

```text
┌──────────────────────────────┐
│ A7 OS             Buscar  ◯  │
│ AGORA · 3 ações              │
│                              │
│ ATRASADO · há 5 dias         │
│ MCO 1001 · Andrea            │
│ Coleta não reconciliada      │
│ [Reconciliar operação]       │
│                              │
│ EXPRESS · vence em 1h42      │
│ MCO 1012 · Brian             │
│ Pronto · pago                │
│ [Designar entrega]           │
│                              │
│ Hoje: 3 coletas · 4 entregas │
├──────────────────────────────┤
│ Central Pedidos  Rotas  Mais │
└──────────────────────────────┘
```

## 11. Proposta do workspace do pedido

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Pedidos  MCO 1007 · Brian Malin   Express   Concluído                     │
│ Signia Bonnet Creek · 1541          Pago US$66 · entregue 18:24            │
├──────────────────────────────────────────────┬───────────────────────────────┤
│ PRÓXIMA AÇÃO                                 │ RESUMO                        │
│ Pedido concluído                             │ Cliente  Brian · final 6336   │
│ Front Desk · Leo · 18:24                     │ Serviço  8,6 lb · US$60       │
│ [Ver comprovante] [Abrir exceção]            │ Gorjeta  US$6                 │
│                                              │ Total pago  US$66 ✓ Stripe   │
│ JORNADA                                      │                               │
│ ✓ Coleta  ✓ Entrada  ✓ Produção  ✓ Pagamento │ DOCUMENTOS                    │
│ ✓ Entrega                                    │ Etiqueta · Invoice · Link     │
│                                              │                               │
│ ATIVIDADE                                    │ DETALHES                       │
│ 18:24 Entrega confirmada — Front Desk        │ Cliente · Hotel · Itens       │
│ 15:32 Pagamento conciliado — Stripe US$66    │ Prazos · Auditoria            │
│ [Mostrar atividade técnica]                  │                               │
└──────────────────────────────────────────────┴───────────────────────────────┘
```

Princípios:

- cabeçalho contém identidade, SLA, risco e total;
- jornada compacta substitui quatro cards desconectados;
- ação principal permanece acima da dobra;
- financeiro e custódia mostram reconciliação, não apenas estado;
- atividade humana é legível; detalhes técnicos são expansíveis;
- exceção é uma ação governada, não edição livre.

## 12. Motor determinístico de próxima ação

Contrato recomendado:

```json
{
  "decision": "assign_delivery_driver",
  "label": "Designar motorista para entrega",
  "enabled": true,
  "facts": ["produção pronta", "pagamento conciliado", "custódia na lavanderia"],
  "rule": "READY_PAID_AT_LAUNDRY",
  "blocked_by": [],
  "explanation": "O pedido está pronto e pago; falta definir quem fará a entrega.",
  "risk": "operational",
  "requires_confirmation": false
}
```

Regras de apresentação:

- uma ação primária por pedido;
- ações secundárias não podem mudar estado silenciosamente;
- bloqueio informa a condição que falta;
- divergência entre eixos vira exceção, não fallback;
- IA generativa pode resumir a timeline, mas não definir valor, custódia, pagamento ou transição.

### Matriz estado → ação → bloqueio → explicação

| Fatos principais | Ação | Bloqueio | Explicação ao operador |
|---|---|---|---|
| Aceito + prazo Express ausente | Definir prazo | — | “O Express precisa de compromisso de retorno.” |
| Aceito + roupa com cliente | Planejar coleta | Janela ausente | “Informe quando e onde coletar.” |
| Coleta planejada + sem motorista | Designar coleta | Motorista | “A coleta ainda não tem responsável.” |
| Com motorista na coleta | Confirmar coleta | Evidência mínima | “Confirme somente após receber a bolsa.” |
| Na lavanderia + sem peso | Registrar entrada e peso | Item/peso | “O valor final depende do peso confirmado.” |
| Peso completo | Iniciar produção | Invoice não deve bloquear produção salvo regra aprovada | “Pesagem concluída.” |
| Pronto + invoice ausente | Revisar cobrança | Itens/minimum | “Confira os valores calculados.” |
| Invoice + não pago | Cobrar/acompanhar | Link atual/estado | “Existe cobrança pendente.” |
| Pronto + pago + na lavanderia | Planejar entrega | Motorista | “Pedido liberado para entrega.” |
| Em entrega + hotel | Registrar handoff | Ponto/evidência | “Informe exatamente onde a bolsa ficou.” |
| Handoff intermediário | Confirmar conclusão | Regra de recebimento | “Confirme o marco final sem apagar o ponto de entrega.” |
| Qualquer combinação incompatível | Resolver exceção | Papel/evidência | “Os fatos não permitem uma transição normal.” |

## 13. Glossário recomendado

| Atual | Recomendado | Observação |
|---|---|---|
| Lifecycle | Etapa do pedido | Termo interno pode permanecer na API |
| Custódia | Com quem está | “Custódia” pode aparecer em auditoria |
| Produção | Processamento | Familiar à equipe |
| Financeiro | Pagamento | No pedido; “Financeiro” permanece no módulo |
| Handoff | Local da entrega | Valores: Cliente, Front Desk, Bell Desk, Concierge, Outro |
| Needed by | Cliente precisa até | Não confundir com promessa A7 |
| Prometido Express | Entrega prometida | Mostrar timezone apenas no detalhe |
| Bags | Bolsas | Padronizar unidade |
| Invoice | Fatura | “Invoice PDF” pode aparecer no documento, não como label principal |
| Clientes Lite | Clientes | “Lite” é escopo interno |
| Rotas W3-D | Rotas | Wave nunca aparece ao operador |
| Próxima ação | Próximo passo | Linguagem menos técnica |

## 14. Quick wins

1. Corrigir a projeção de total pago e adicionar teste de reconciliação ao centavo.
2. Corrigir `handoff_point` e os labels de Front Desk/Bell Desk/Concierge em resumo e timeline.
3. Mapear todo tipo de evento; eliminar “Não informado” do histórico.
4. Remover “Lite”, “W3-D” e mistura EN/PT dos rótulos visíveis.
5. Separar dívida histórica/testes da fila “Agora”.
6. Mover “Próxima ação” para o topo do pedido e manter resumo financeiro ao lado.
7. Substituir o botão desabilitado “PEDIDO CONCLUÍDO” por um comprovante de fechamento.
8. Expor motivo dos alertas da Home, não somente a contagem.

## 15. Roadmap 30/60/90 dias

### 0–30 dias — confiança e verdade

- Corrigir UX-01, UX-02, UX-05 e UX-06.
- Criar catálogo único de termos/eventos.
- Instrumentar tempos, recuos, erros e etapas por pedido sem PII.
- Desenhar e aprovar stories de Payment Link e reconciliação externa.
- Testar protótipo do workspace com Owner, Manager e Operator.

### 31–60 dias — workspace e central

- Entregar cabeçalho e próxima ação acima da dobra.
- Agrupar timeline humana e técnica.
- Reorganizar Central em Agora/Hoje/Atrasados/Exceções.
- Introduzir busca universal e views salvas básicas.
- Entregar substituição governada de Payment Link.

### 61–90 dias — execução móvel e exceções

- Entregar modo de reconciliação de operação externa.
- Simplificar experiência móvel de coleta/entrega.
- Incluir prova de handoff adequada ao risco (ponto, nota e, se aprovado, foto/assinatura).
- Evoluir Rotas com foco em jobs do dia antes de otimização avançada.
- Rodar teste comparativo e publicar métricas antes/depois.

## 16. Backlog proposto em stories

Estas stories são propostas para avaliação de PO/SM. Não estão aprovadas e não autorizam código.

| Ordem | Story proposta | Resultado | Dependência |
|---:|---|---|---|
| 1 | Verdade financeira do pedido | Total, gorjeta, serviço e reembolso reconciliados | Contratos atuais de pagamento |
| 2 | Verdade de handoff e custódia | Front/Bell/Concierge consistentes em todas as projeções | Contrato de entrega |
| 3 | Catálogo de eventos e linguagem | Zero eventos desconhecidos; glossário único | Stories 1–2 |
| 4 | Central operacional por horizonte | Agora/Hoje/Atrasados/Exceções reconciliados | Home v2 |
| 5 | Workspace do pedido v1 | Próximo passo e resumo acima da dobra | Stories 1–3 |
| 6 | Substituição governada de Payment Link | Recuperação sem sair do sistema | Story financeira |
| 7 | Reconciliação de execução externa | Fechamento auditável de operações já ocorridas | Matriz de estados aprovada |
| 8 | Busca universal privada | Encontrabilidade em uma interação | Clientes/Pedidos/Hotéis |
| 9 | Timeline operacional em camadas | Leitura simples + auditoria completa | Catálogo de eventos |
| 10 | Execução mobile de coleta/entrega | Menos toques e handoff confiável | Workspace e rotas |

## 17. Critérios de aceitação mensuráveis do programa

| Métrica | Baseline a medir | Meta inicial |
|---|---:|---:|
| Tempo mediano pedido aceito → coleta planejada | Instrumentar | −30% |
| Mudanças de contexto por pedido sem exceção | Estimado 5+ | ≤3 |
| Cliques para localizar pedido conhecido | 2–5 | ≤2 |
| Pedidos concluídos ainda acionáveis | Observado >0 | 0 |
| Divergências financeiras exibidas | Observado 1 crítico | 0 |
| Eventos sem label humano | Observado >0 | 0 |
| Handoffs com ponto ausente após registro | Observado 1 | 0 |
| Payment Link incorreto corrigível no sistema | Não | 100% dos elegíveis |
| Tarefa principal visível acima da dobra | Parcial | 100% |
| Taxa de conclusão sem ajuda por Operator | A medir | ≥90% |
| Erros/recuos por pedido | A medir | −40% |
| SUS (System Usability Scale) | A medir | ≥80 após duas iterações |

Plano de validação:

1. cinco tarefas moderadas por persona, com dados sintéticos;
2. teste desktop e mobile 390 px;
3. medir tempo, sucesso, erro, recuo, hesitação e confiança declarada;
4. comparar versão atual e protótipo com as mesmas tarefas;
5. liberar incrementalmente com observabilidade e rollback por story.

## 18. Decisão recomendada

**Não iniciar por troca de fonte, cor ou cards.** Essas mudanças podem melhorar acabamento, mas não resolverão a causa da sensação burocrática.

O melhor primeiro pacote é:

1. verdade financeira;
2. verdade de handoff;
3. catálogo de eventos/termos;
4. Central separando agora, atraso e exceção;
5. workspace do pedido com uma ação principal.

Esse pacote reduz risco operacional, aumenta confiança e prepara o terreno para simplificar cliques sem enfraquecer auditabilidade. Implementação só deve começar após PO/SM transformar o pacote escolhido em stories aprovadas, conforme a Constitution do projeto.

## Sources

[^1]: Nielsen Norman Group. “[The Theory Behind Heuristic Evaluations](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/).” 1994.
[^2]: Nielsen Norman Group. “[10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/).” Revisado em 2024.
[^3]: W3C Web Accessibility Initiative. “[Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).” WCAG 2.2.
[^4]: W3C Web Accessibility Initiative. “[Understanding SC 2.4.7: Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible).” WCAG 2.2.
[^5]: Stripe. “[Share a payment link](https://docs.stripe.com/payment-links/share)” e “[Update a payment link](https://docs.stripe.com/api/payment-link/update).”
[^6]: Shopify Help Center. “[Searching your Shopify admin](https://help.shopify.com/en/manual/shopify-admin/admin-search).”

Fontes competitivas adicionais: [Cents](https://www.trycents.com/solutions/pickup-delivery-software), [CleanCloud](https://cleancloudapp.com/pickup-and-delivery), [Starchup](https://www.starchup.com/), [Turns](https://help.turnsapp.com/en/articles/9541520-pickup-request-flow-from-website-till-pos), [Rinse](https://www.rinse.com/how-it-works/), [Poplin](https://poplin.co/how-it-works), [Square](https://api.squareup.com/help/us/en/article/6923-pickup-orders-on-square-point-of-sale), [Shopify](https://help.shopify.com/en/manual/fulfillment/managing-orders/viewing-orders/filtering-orders), [DoorDash](https://help.doordash.com/en-us/merchants/article/fulfill-orders) e [Stripe](https://docs.stripe.com/payment-links/share).
