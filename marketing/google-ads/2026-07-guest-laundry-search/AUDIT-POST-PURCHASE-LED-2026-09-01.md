# Auditoria Google Ads — 24h após a virada purchase-led

**Data:** 2026-09-01 · **Conta:** A7 Laundry - 01 (290-113-2891) · **Moeda:** BRL · **Fuso:** GMT-03:00
**Método:** leitura direta do painel (somente leitura, sessão autenticada). Nenhum lance, orçamento, status ou campanha foi alterado.
**Campanha:** `A7 | Search | Guest Laundry | Orlando | EN | JUL26` (id 24072699595) — única ativa da conta.

---

## 1. O que aconteceu ontem (31/ago, 13:03–13:22)

Sequência real do Histórico de Alterações, tudo manual, tudo em 19 minutos:

| Hora | Alteração |
|------|-----------|
| 13:03 | `A7 Guest Laundry - Stripe purchase` → **Ação principal**, incluir em "Conversões" = **Sim** |
| 13:10 | `A7 - WhatsApp click (site)` → **Ação secundária** (apenas observação), incluir = **Não** |
| 13:16 | Campanha mudou |
| 13:21 | **14 programações de anúncios removidas** (passou a rodar 24/7) |
| 13:22 | **Orçamento diminuído** (estado atual: R$ 150,00/dia) |

Contexto imediatamente anterior:
- **28/ago 08:16** — as mesmas 14 programações tinham sido *adicionadas*.
- **29/ago 12:41–12:42** — duas recomendações do Google aplicadas **pelo app móvel**: "Aumento de orçamento" e "ROAS desejado". A segunda mudou a estratégia para **Maximizar o valor da conversão**.

Estado atual da campanha: `Maximizar o valor da conversão`, **sem ROAS desejado e sem CPA desejado definidos**, só Rede de Pesquisa, inglês, Davenport/Kissimmee + 3 (1 excluído), todos os dias, todos os dispositivos.

---

## 2. O efeito medido

| Métrica | 25–31/ago (média/dia) | 31/ago | 01/set (parcial) |
|---|---|---|---|
| Impressões | 51 | **11** | **12** |
| Cliques | 3,4 | 0 | 3 |
| Custo | R$ 58,47 | R$ 0,00 | R$ 49,43 |
| CPC médio | R$ 17,05 | — | R$ 16,48 |
| Parcela de impressões | 34,57% | — | **< 10%** |
| Perdida por **rank** | 63,27% | — | **> 90%** |
| Perdida por **orçamento** | 2,17% | — | **0,00%** |
| Conversões | 3 (WhatsApp) | 0 | 0 |

Entrega caiu ~77%. **Não é orçamento** (perda por orçamento = 0%) e **não é saldo** (R$ 970,66 disponíveis, último Pix de R$ 650 em 29/ago). É rank: a campanha parou de ganhar leilão.

---

## 3. A causa: 83% do sinal de lance foi cortado

Distribuição real das conversões da campanha em **02–31/ago**:

| Ação de conversão | Conversões | Valor |
|---|---|---|
| A7 Guest Laundry - Stripe purchase | **9** | **R$ 4.889,60** |
| A7 - WhatsApp click (site) | **45** | R$ 0,00 |
| **Total** | **54** | R$ 4.889,60 |

Ao rebaixar o WhatsApp click, a campanha perdeu **45 dos 54 sinais mensais**. Sobrou uma base de **9 conversões/mês** para alimentar uma estratégia de valor — contra o mínimo prático de 15 (CPA desejado) a 30 (ROAS desejado) conversões/mês. Sem sinal, o Smart Bidding recua, e o recuo aparece exatamente onde apareceu: perda por rank > 90%.

Agravante: **nos últimos 7 dias a campanha não teve nenhuma compra atribuída** (a única compra Stripe da conta no período, R$ 607,95, não foi atribuída a esta campanha). A meta foi promovida justamente quando o sinal dela estava em zero havia uma semana.

---

## 4. A economia real de agosto (o que estava funcionando)

| Indicador | Valor |
|---|---|
| Investimento | R$ 3.119,13 |
| Receita rastreada (9 compras) | R$ 4.889,60 |
| **ROAS** | **1,57×** |
| Custo por venda real | R$ 346,57 |
| Custo por conversa de WhatsApp | R$ 69,31 |
| Ticket rastreado | R$ 543,29 |
| CTR | 5,84% · CPC R$ 15,83 |

Comparação com o forense de 18/ago (19/jul–17/ago): **ROAS 1,05× → 1,57×**, 5 → 9 compras, custo/conversa R$ 55,82 (métrica misturada) → R$ 69,31 (só conversas). A campanha estava melhorando quando foi mexida.

---

## 5. Onde ainda sangra (25–31/ago)

| Palavra-chave | QS | Impr. | Custo | Conv. | Perda rank |
|---|---|---|---|---|---|
| "laundry service orlando" | **7/10** | 103 | R$ 189,55 | 2 | 60,75% |
| "laundry service near me" | 5/10 | 56 | R$ 98,13 | 1 | 62,71% |
| "wash and fold near me" | **3/10** | 109 | R$ 97,03 | **0** | 62,08% |
| "laundry delivery near me" | 5/10 | 14 | R$ 15,90 | 0 | 52,63% |
| "wash and fold orlando" | 4/10 | 14 | R$ 8,67 | 0 | 35,71% |

- `"wash and fold near me"` segue com **QS 3/10** e zero venda — é o mesmo vilão apontado em 18/ago (R$ 756,90 naquele recorte). Nada foi feito.
- **Grupo `Airbnb Guest Laundry`: 10 palavras-chave, 0 impressões em 30 dias**, 6 delas marcadas "Baixo volume de pesquisas". O anúncio do grupo nunca foi exibido.
- **`"hotel laundry service"` — a keyword de ROAS 46× do forense — não existe na conta.** O grupo se chama "Hotel Guest Laundry" mas compra tráfego genérico "near me".
- Termos comprados no período: `wash and fold near me` R$ 78,45 (0 conv), `cheapest wash and fold near me`, `wash clothes near me`, `laundry room service`, `snapwasher` (marca de concorrente). Hoje o único clique pago foi `laundry service near me pick up and delivery`.
- **45% do gasto (R$ 184,28 de R$ 409,28) está em "outros termos de pesquisa"** que o Google não revela.

Criativo não é o problema: o RSA `Hotel Laundry Pickup` tem qualidade **Excelente**. A extensão de imagem aplicada por recomendação em 25/ago teve **75 impressões e 0 cliques**.

---

## 6. Decisões

**Bloqueante — resolver o sinal de lance (hoje)**
1. Escolher uma das três saídas:
   - **a)** Reverter: WhatsApp click volta a principal, compra fica como observação até existir importação offline. Restaura a entrega imediatamente, mantém o problema antigo (algoritmo compra conversa, não venda).
   - **b)** Manter compra como principal, mas trocar a estratégia de `Maximizar o valor da conversão` para `Maximizar conversões` ou `Maximizar cliques com CPC máximo`. Aceita volume menor sem travar o leilão.
   - **c)** **Correta:** importação de conversão offline por `gclid` quando o pedido fecha (o `a7-tracking.js` já captura gclid/gbraid/wbraid e o Stripe webhook já está em produção). Alimenta o algoritmo com venda e valor reais. Enquanto não estiver no ar, operar com (a) ou (b).

**Alto impacto, baixo esforço**
2. Restaurar programação de anúncios nas horas que faturam (23h, 9h, 0h, 21h, 13h no forense de 18/ago) — ou, no mínimo, cortar 10–12h e 14–16h, que consumiram R$ 1.132 sem receita.
3. Negativar já: `cheapest`, `snapwasher`, `laundry room service`, `at home laundry service`, `wash clothes near me`.
4. Decidir sobre `"wash and fold near me"` (QS 3/10, 2º maior consumo, zero venda): pausar, ou isolar em grupo próprio com landing dedicada.

**Estrutural**
5. Adicionar as keywords que já provaram retorno: `hotel laundry service` (ROAS 46× em jul/ago) e reforçar `laundry pickup near me` (9,4×), hoje com 2 impressões.
6. Arquivar o grupo `Airbnb Guest Laundry` — 30 dias, 0 impressões.
7. Saldo: R$ 970,66 = ~6,5 dias no orçamento cheio de R$ 150/dia.

---

## Ressalvas

- A janela pós-mudança é de **2 dias, sendo hoje parcial**. Toda mudança de meta gera reaprendizado; parte da queda pode se recuperar sozinha em 24–72h.
- O que **não** depende de janela: o corte de 45 dos 54 sinais mensais é aritmética, não amostra.
- "Outros termos de pesquisa" (45% do gasto) permanece uma caixa-preta do Google.
- Insights de Leilão continua não exportado (pendência aberta desde 18/ago).
