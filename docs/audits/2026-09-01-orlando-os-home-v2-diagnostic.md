# A7 Laundry Orlando OS — Diagnóstico e proposta da Home v2

**Data:** 2026-09-01
**Fase:** diagnóstico e proposta técnica
**Status:** `ANALISADO / NÃO IMPLEMENTADO`
**Ambiente auditado:** código local e Home autenticada de Production, somente leitura

## 1. Veredito executivo

A evolução faz sentido e deve ser priorizada. A Home atual é funcional como índice de filas, mas não responde rapidamente como o negócio está e apresenta onze cartões com o mesmo peso visual. O problema mais importante, porém, não é cosmético: a fila inicial usa um universo diferente dos contadores e hoje inclui pedidos históricos concluídos. Assim, os cartões podem mostrar operação zerada enquanto a fila exibe pedidos antigos como se fossem prioridade.

A menor evolução com ganho real é:

1. corrigir a fila inicial para mostrar somente trabalho ativo e acionável;
2. reutilizar o contrato financeiro Owner já publicado para quatro KPIs coerentes;
3. condensar os onze contadores em quatro blocos operacionais;
4. criar uma lista curta de exceções e manter apenas cinco próximas ações;
5. comparar sete dias com os sete dias anteriores usando o mesmo contrato financeiro.

Essa primeira versão não precisa de tabela, coluna, view, índice ou cache novo. Ela deve ser construída como projeção read-only sobre dados existentes. A recomendação é `GO`, com escopo reduzido e role-aware.

## 2. Diagnóstico da Home atual

### O que funciona

- autenticação e papéis já estão resolvidos;
- timezone operacional já é `America/New_York`;
- filas, SLA Express e próxima ação são calculados no servidor;
- contadores excluem QA, cancelados e entregues;
- os cartões abrem filas filtradas;
- existe separação entre custódia, produção, lifecycle e pagamento;
- o sistema já possui leitura financeira Owner auditável;
- desktop e mobile usam a mesma UI sem framework adicional.

### Problemas encontrados

1. **Fila principal inconsistente.** `decorateSnapshot()` calcula os contadores sobre pedidos reais ativos, mas retorna todos os pedidos. `loadToday()` usa `today.orders.filter(!is_qa).slice(0, 12)` na fila inicial, sem excluir entregues e cancelados. O Production auditado exibiu pedidos concluídos abaixo de contadores operacionais zerados.
2. **Onze cartões têm hierarquia idêntica.** Receita, risco, produção e tarefas não estão agrupados por significado.
3. **Home não mostra saúde comercial.** Receita confirmada, ticket e volume real existem em contratos separados, mas não aparecem em Hoje.
4. **“Para cobrar” e “Aguardando pagamento” competem visualmente.** São estágios úteis, mas deveriam formar uma única área de exceção financeira.
5. **“Na lavanderia” pode sobrepor subprocessos.** É um agregado de custódia, enquanto “Para pesar”, “Processando” e “Prontos” são produção. A relação não está explicada.
6. **Dados históricos incompletos parecem falha ativa.** Pedidos importados podem não possuir estado operacional ou prazo Express; esses registros não devem entrar na fila de trabalho atual.
7. **Home Owner e Operator precisariam de conteúdos diferentes.** O financeiro atual é Owner-only. Expor receita ao Operator seria expansão de autorização e não deve acontecer implicitamente.
8. **Layout usa apenas 980 px no desktop.** Funciona, mas comprime uma tela gerencial que poderia usar aproximadamente 1180–1240 px sem perder foco.

## 3. Componentes, APIs e serviços atuais

| Camada | Artefato | Responsabilidade |
|---|---|---|
| Home HTML | `sistema.html` (`todayView`) | Cabeçalho, onze cartões e fila operacional |
| Home browser | `sistema.js` (`loadToday`) | Chama Hoje, cria cartões e abre filas |
| Estilo | `sistema.css`, `sistema-w1b.css` | Shell, navegação, cartões, listas e responsividade |
| API Hoje | `GET /api/system/today` | Sessão Owner/Operator e snapshot seguro |
| API Pedidos | `POST /api/system/operational-orders` | Filas, busca e filtros de custódia/produção |
| API Financeiro | `POST /api/system/finance` | Relatório financeiro Owner-only por período |
| Serviço operacional | `lib/system-operations-service.js` | Filas, SLA, prioridade e próxima ação |
| Serviço financeiro | `lib/system-finance-service.js` | Períodos, validação, disponibilidade e reconciliação |
| Store | `lib/operational-store.js` | RPCs operacionais e financeiros |
| CLI operacional | `scripts/a7-system-operations.mjs` | Leitura operacional antes da UI |
| CLI financeiro | `scripts/a7-system-finance.mjs` | Leitura financeira antes da UI |

## 4. Fontes de dados atuais

| Dado | Fonte principal | Confiabilidade atual |
|---|---|---|
| pedido confirmado | `a7_orlando_orders.accepted_at` | alta |
| cliente durável | `a7_orlando_orders.customer_id` → `a7_wa_contacts` | alta quando resolvido |
| peso real | `a7_orlando_orders.actual_lbs/weighed_at`, derivado dos itens | alta para pedidos W1C-A |
| item pesado | `a7_orlando_order_items.actual_lbs/weighed_at` | alta |
| invoice | `a7_orlando_invoices` e `current_invoice_id` | alta para versão emitida |
| pagamento confirmado | `a7_orlando_payments.paid_at/status` | alta para pagamentos reconciliados |
| refund | `a7_orlando_payments.refund_total` e `a7_orlando_refunds` | alta |
| gorjeta | fato explícito no pedido/importação histórica | parcial, nunca inferida |
| coleta | `pickup_window_start/end`, `picked_up_at`, custódia | alta para novos pedidos |
| entrega | `delivered_at`, lifecycle e custódia | alta quando finalizada explicitamente |
| serviço | `service_type`, `service_tier` e itens | alta |
| SLA Express | `promised_by` + thresholds 240/120 min | alta quando `promised_by` existe |
| prazo Standard | `needed_by` em `lead.operational_data` | útil, mas menos estruturado |
| hotel | `hotel_id` → `a7_orlando_hotels`; fallback histórico em lead | crescente/parcial |
| motorista atribuído | não existe em Production | indisponível |
| rota/stop | W3-D permanece Draft/bloqueado | indisponível |
| invoice/link enviado ao cliente | não há um estado canônico completo | indisponível |
| pagamento manual Cash/Zelle | modelo de pagamentos atual restringe `provider='stripe'` | indisponível como receita total multicanal |

Não há view materializada ou dashboard table a reutilizar. Os read models atuais são funções SQL service-role-only: `a7_orlando_w1c_a_snapshot()` e `a7_orlando_owner_finance(date,date)`.

## 5. Origem dos contadores atuais

Todos os contadores operacionais são derivados em `decorateSnapshot()` sobre pedidos não QA, não cancelados e não entregues.

| Contador | Regra atual |
|---|---|
| Esperando confirmação | leads `new/qualifying/qualified` sem pedido |
| Coletas | `awaiting_pickup` cuja janela começa hoje em Orlando |
| Com motorista | custódia `with_driver_pickup` ou `with_driver_delivery` |
| Na lavanderia | custódia `at_laundry` |
| Para pesar | produção `awaiting_weight` |
| Processando | produção `processing` |
| Prontos | produção `ready` |
| Para cobrar | pronto + pagamento `pending/void` |
| Aguardando pagamento | pagamento `invoice_created/failed` |
| Entregas | pronto + pago + custódia ainda não entregue |
| Express em atenção | SLA `attention/risk/late` |

## 6. Readiness dos KPIs propostos

| KPI/bloco | Pode agora? | Fonte/observação | Complexidade |
|---|---:|---|---|
| Revenue Today | sim, com ressalva | finance read model; representa serviço pago reconciliado, não Cash/Zelle ausente | baixa |
| Orders Today | sim | `accepted_at`, real/non-QA/non-cancelled | baixa |
| Average Order | sim | receita de serviço / pedidos pagos no mesmo período | baixa |
| Pounds Today | sim | peso real com `weighed_at` hoje | baixa |
| Pickups + próxima janela | sim | custódia + pickup window | baixa |
| With Driver pickup/delivery | sim, sem nome | custódia distingue direção, não identidade do motorista | baixa |
| Processing + pounds | sim | produção + `actual_lbs` | baixa |
| Ready | sim | produção/custódia | baixa |
| Ready without driver | não como escrito | não existe driver assignment; usar “Ready for dispatch” | bloqueado |
| Payment pending | sim, agregado | payment status e service amount conhecido | média |
| Not invoiced / invoice issued / failed | parcialmente | estados atuais permitem parte do funil | média |
| Invoice sent/link sent | não | falta estado canônico durável | bloqueado |
| Express at risk/late | sim | `promised_by` + SLA aprovado | baixa |
| Operational blockers | sim | `next_action`, estados ausentes e prazo Express ausente | baixa |
| Last 7 days | sim | duas leituras do finance read model | baixa |
| New/repeat | sim | `customer_id` + flag durável do pedido | baixa |
| On-time rate geral | ainda não | cobertura histórica de `promised_by` insuficiente; Standard não tem compromisso estruturado equivalente | média/baixa confiabilidade |

## 7. Contratos formais recomendados

### Revenue Today

- **Source:** `a7_orlando_owner_finance(today,today)`.
- **Field/date:** `a7_orlando_payments.paid_at` em `America/New_York`.
- **Filter:** pagamento `paid/partially_refunded/refunded`, pedido real, não cancelado, não QA.
- **Formula:** soma de `confirmed_service_revenue`, líquido de refunds confirmados.
- **Excludes:** tips, pendências, invoice sem pagamento, tentativa, link, QA e cancelamento.
- **Drill-down:** Faturamento filtrado para Hoje.
- **Ressalva:** não representa Cash/Zelle enquanto esses pagamentos não forem ingeridos por contrato próprio.

### Orders Today

- **Source:** `a7_orlando_orders` via snapshot operacional.
- **Field/date:** `accepted_at` em `America/New_York`.
- **Filter:** `order_number` presente, não QA, não cancelado.
- **Formula:** pedidos confirmados no dia.
- **Drill-down:** Pedidos filtrados por confirmação de hoje.

### Average Order

- **Nome visual recomendado:** `Average paid order` ou `Avg. paid order`.
- **Source:** finance read model.
- **Formula:** `confirmed_service_revenue / paid_order_count` no mesmo período de `paid_at`.
- **Null:** nenhum pagamento produz `—`, não `$0.00`.
- **Motivo:** não dividir receita recebida por pedidos recém-criados e ainda não pagos.

### Pounds Today

- **Source:** peso final de pedidos reais.
- **Field/date:** `weighed_at` em `America/New_York`.
- **Formula:** soma de `orders.actual_lbs` para pedidos pesados hoje.
- **lb/order:** pounds / quantidade de pedidos pesados, não Orders Today.
- **Excludes:** peso estimado, QA, cancelados e linhas ainda sem peso.
- **Drill-down:** Pedidos pesados hoje.

### Last 7 Days

- **Current:** hoje e seis dias anteriores.
- **Previous:** os sete dias imediatamente anteriores.
- **Timezone:** `America/New_York`.
- **Cards coerentes:** confirmed service revenue, paid orders, average paid order e paying customers.
- **Delta:** `(current - previous) / previous`; base anterior zero produz `—`, não infinito.
- **Drill-down:** Faturamento nos sete dias atuais.

## 8. Pipeline operacional recomendado

1. **Pickups:** pedidos ativos ainda com cliente/aguardando coleta; subtítulo com a próxima janela. Pedidos sem janela aparecem em Needs Attention.
2. **With driver:** custódia `with_driver_pickup` e `with_driver_delivery`; subtítulo `X pickup · Y delivery`. Não mostrar nome nem “assigned” até W3-D existir.
3. **Processing:** produção `processing`; subtítulo soma de `actual_lbs` disponível.
4. **Ready:** produção `ready` ainda não entregue; subtítulo deve separar `at laundry`, `in delivery` e `bell desk`. Não usar “without driver”.

`At Laundry` deve ser uma linha secundária: `waiting weight + awaiting processing + processing + ready at laundry`. Assim a Home não duplica o mesmo pedido em dois KPIs principais sem explicar a relação.

## 9. Needs Attention recomendado

Mostrar somente blocos com valor maior que zero:

1. **Customer waiting:** leads sem pedido que requerem ação humana.
2. **Payments pending:** pedidos reais não pagos; valor apenas quando `service_amount` é conhecido. Separar internamente `not invoiced`, `invoice issued` e `failed`; não afirmar “sent”.
3. **Express risk/late:** separar amber `attention/risk` de red `late`.
4. **Ready for dispatch:** pronto + pago + `at_laundry`. Isso é confiável sem inventar motorista.
5. **Operational blockers:** `review_state`, estado não inicializado, Express sem `promised_by`, coleta sem janela ou combinação incompatível.

## 10. What needs to happen now

A fila deve conter no máximo cinco itens e usar apenas pedidos/leads ativos. Ordem recomendada:

1. Express atrasado;
2. Express em risco;
3. blocker estrutural;
4. coleta/entrega pela janela mais próxima;
5. maior tempo aguardando ação.

Cada linha mostra referência segura, cliente, hotel canônico quando disponível, serviço, prazo, pagamento e `next_action.label`. Entregues, cancelados, QA e importações históricas sem ação são excluídos.

## 11. Home v2 proposta

### Owner

```text
A7 LAUNDRY ORLANDO                         Tue, Sep 1 · Updated 6:29 PM

BUSINESS TODAY
Revenue             Orders confirmed      Avg paid order       Pounds weighed
$---.--              --                    $--.--                --.- lb
service paid         accepted today        per paid order        --.- lb/order

TODAY'S OPERATION
Pickups              With driver           Processing            Ready
-- · Next --         -- · x pickup/y del.  -- · --.- lb          -- · x at laundry

NEEDS ATTENTION
[only non-zero exceptions, amber/red only when justified]

WHAT NEEDS TO HAPPEN NOW                                      View all orders →
[maximum five active, deterministic rows]

LAST 7 DAYS
Revenue              Paid orders           Avg paid order        Paying customers
$--- · Δ              -- · Δ                $-- · Δ               -- · -- repeat
```

### Operator

O Operator inicia em Today's Operation, Needs Attention e What needs to happen now. Business Today e Last 7 Days financeiros ficam ausentes, não mascarados no browser. Essa decisão preserva a autorização Owner-only existente.

### Mobile

Ordem: Needs Attention → Today's Operation → What needs to happen now → Business Today (Owner) → Last 7 Days. Informação essencial não depende de hover. KPIs usam duas colunas e a fila vira cartões compactos.

## 12. Drill-downs

| Card | Destino |
|---|---|
| Revenue / Avg / Last 7 finance | Faturamento no mesmo período |
| Orders Today | Pedidos confirmados hoje |
| Pounds Today | Pedidos pesados hoje |
| Pickups / With driver / Processing / Ready | fila existente correspondente |
| Customer waiting | Atendimento |
| Payments pending | Pedidos, fila financeira combinada |
| Express risk/late | Pedidos Express filtrados |
| blocker | pedido específico ou fila de blockers |

A contagem do cartão e a lista aberta precisam ser produzidas pela mesma regra de serviço, não recalculadas no browser.

## 13. Impacto técnico mínimo

### Reutilizar

- `systemOperationsService.today()` e suas regras de SLA/prioridade;
- `systemFinanceService.report()` para today, 7d e períodos customizados;
- `getSystemOperationalSnapshot()`;
- `getSystemOwnerFinance()`;
- filas existentes e navegação de Faturamento/Pedidos/Atendimento;
- CSS vanilla e shell atual.

### Derivar no serviço

- grupos operacionais e seus subtotais;
- peso real de hoje e em processamento;
- fila curta e blockers;
- Orders Today;
- comparação de sete dias;
- payload role-aware sem PII extra.

### Estrutura de aplicação sugerida para uma futura story

1. `lib/system-home-service.js`: contrato único e read-only, precedido por CLI.
2. `scripts/a7-system-home.mjs`: Today/7d/previous-7 validation.
3. `api/system/home.js`: Owner/Operator role-aware, somente leitura.
4. `sistema.js/html` e CSS: renderização sem regras de negócio duplicadas.

Para Owner, o serviço pode executar em paralelo: snapshot operacional, finance today, finance last 7 e finance previous 7. Para Operator, apenas o snapshot operacional. Nenhuma regra financeira deve ir para o browser.

## 14. Banco, índices e performance

### Migration

Não recomendada para a Home v2 mínima. Todos os fatos necessários ao escopo recomendado já existem.

### Índices

Não adicionar preventivamente. O volume atual é pequeno e já existem índices de status operacional e pedidos. Medir o plano/latência antes de considerar um índice de pagamentos por `paid_at` ou `(order_id, paid_at desc)`.

### Performance

- evitar N+1: nunca buscar detalhes por pedido;
- agregar a partir do snapshot e dos finance read models;
- executar leituras independentes em paralelo;
- limitar a fila a cinco itens no payload;
- não introduzir cache até existir evidência de latência.

## 15. Riscos

| Risco | Mitigação |
|---|---|
| históricos contaminam a fila | filtrar ativo no serviço e testar reconciliação card/lista |
| operador recebe receita indevidamente | payload role-aware no servidor |
| Revenue parece incluir Cash/Zelle | rotular cobertura e não inventar ingestão manual |
| double count de estados | cada KPI possui regra formal; agregado At Laundry fica secundário |
| peso estimado vira volume real | usar somente `actual_lbs` + `weighed_at` |
| média usa cohort errado | dividir somente receita por pedidos pagos do mesmo período |
| dia muda em UTC | todas as fronteiras no servidor em New York |
| Express sem prazo some do radar | blocker separado “Define Express promise” |
| valor pendente parece zero | preservar `null/partial/unavailable` |
| dashboard fica lento | poucas leituras agregadas e fila limitada |

## 16. Complexidade por bloco

| Bloco | Complexidade |
|---|---|
| correção da fila ativa | baixa |
| Business Today Owner | baixa |
| Orders/Pounds Today | baixa |
| Today's Operation | baixa |
| Needs Attention | média |
| fila de cinco prioridades | baixa |
| Last 7 Days + comparação | média |
| role-aware Owner/Operator | média |
| Ready without driver real | alta/bloqueada por W3-D |
| invoice/link sent real | alta/bloqueada por estado ausente |
| on-time rate geral | média, mas não confiável agora |

## 17. O que não construir agora

- tabelas de dashboard, snapshots duplicados ou materialized views;
- motorista/rota fictícios;
- status “invoice sent” inferido de link criado;
- Revenue total Cash/Zelle sem ingestão governada;
- on-time rate geral com cobertura insuficiente;
- gráficos, forecast, CAC, LTV, ROAS, churn ou cohorts;
- cache, job agendado ou data warehouse;
- customização de cards por usuário;
- troca de framework ou biblioteca visual.

## 18. Recomendação final

**GO para uma Home v2 mínima e read-only, depois de criar uma story própria e seus contratos CLI-first.**

O “up” correto é de hierarquia e verdade operacional, não de efeitos visuais. A paleta e o shell atuais podem permanecer. A melhoria visual deve concentrar-se em reduzir os onze cartões, usar números tabulares, ampliar o container desktop, reservar verde/amber/vermelho para significado real e compor estados de loading/empty/error.

Gate recomendado antes de implementação:

1. Owner confirma que receita financeira continua invisível ao Operator;
2. Owner aceita o rótulo `Ready for dispatch` em vez de `Ready without driver`;
3. Owner aceita `Average paid order` como denominador coerente;
4. story formaliza cada KPI e drill-down;
5. testes provam que card e lista reconciliam, inclusive dia vazio, DST, refund, tip parcial, QA e históricos.
