# Auditoria do WhatsApp — 2026-07-30

**Método:** leitura direta das conversas (somente leitura), 19 threads analisadas em profundidade
de um universo de ~44–47 leads do período 30 jun – 30 jul 2026.
**Cruzamento:** dados de mídia do Meta Ads (API oficial) + preços do repositório.

---

## ⚠️ ERRATA FINAL — reconciliação direta de 2026-07-31

O corpo original misturava leads, recompras e contatos fora do funil. A correção completa está em
[`docs/DIRECIONAMENTO-AGOSTO-2026.md`](../docs/DIRECIONAMENTO-AGOSTO-2026.md).

| O que diz aqui | Correção |
|---|---|
| "9 de 19 leads foram ignorados" | As 19 threads eram 12 leads novos, 3 recompras e 4 exclusões. Há 3 falhas confirmadas e 1 caso por áudio ainda incerto |
| "3 áudios ignorados" | Falso: `·207-2488` era automotivo; `·242-7487` recebeu resposta em áudio; `·437-5263` foi iniciado pela A7 |
| "28,6% é a taxa real de fechamento" | Há 8 cotados, não 7. Descrição da amostra: **2÷8 = 25,0%**, IC 95% **7,1%–59,1%** |
| "Impacto total: US$ 906" | Soma gasto afundado com receita bruta hipotética — economicamente inválido. O correto é **contribuição perdida**, ainda desconhecida |
| "CAC de US$ 70,31" | É **contrafactual**, não observado. Vale só se todo lead for cotado e a taxa se mantiver |
| "O canal pago não era inviável" | Atendimento é gargalo comprovado. Mídia, oferta e público **não foram absolvidos** — só não foram testados |

**O que permanece válido:** existem três falhas de atendimento inequívocas e uma pendência de
classificação por áudio. Isso justifica corrigir o processo, sem extrapolação financeira.

---

## O achado

As 19 threads reconciliadas não eram 19 leads pagos:

| Classe | Quantidade | Evidência |
|---|---:|---|
| Leads novos | 12 | serviço solicitado por número novo |
| Recompras | 3 | Kathryn, Ace e Simon |
| Fora do funil | 4 | automotivo, câmbio, outbound e emprego |

Entre os 12 leads, três falhas são confirmadas: Marco pediu preço duas vezes e não recebeu;
`·246-4493` perguntou sobre pressing e ficou sem resposta; `·963-2601` recebeu apenas "Good
morning". O lead `·242-7487` recebeu resposta humana em áudio no mesmo dia, mas o conteúdo ainda
precisa ser classificado. Assim, falha observada = **3/12 confirmada**, ou **4/12 no pior caso**.

Não se extrapola perda financeira para as ~44 conversas. Isso exigiria, ao mesmo tempo, que a
amostra fosse representativa, que todos fossem leads elegíveis, que o mix de fontes fosse igual,
que 2÷8 fosse a taxa populacional e que ticket e margem se mantivessem. A contribuição perdida
continua **desconhecida** até cada lead e cada pedido serem reconciliados.

---

## A taxa de conversão estava sendo medida errada

A auditoria de mídia estimou 19,4% de conversa→pedido dividindo 6 pedidos por 31 conversas.
Esse número mistura leads atendidos com leads ignorados e esconde o problema real.

Separando:

| Recorte | Cálculo | Taxa | Custo por pedido novo |
|---|---|---:|---:|
| Threads revisadas | 2 ÷ 19 | 10,5% | Não atribuível |
| Leads novos reconciliados | 2 ÷ 12 | 16,7% | Não atribuível |
| Entre cotados, descritivo | 2 ÷ 8 | **25,0%** | Não atribuível |

O recorte por cotados é selecionado depois do atendimento e não demonstra ganho causal. Ele
prova que existe vazamento operacional; não prova que o mesmo mix de leads fecharia a 25% se
todos fossem atendidos. CAC de mídia, viabilidade do canal, oferta e público permanecem abertos.

---

## A recompra existe e ninguém estava contando

Dos 5 pedidos observados no período, **3 são recompra** (Kathryn, Ace e Simon Douek, todos
repetindo em 30/jul). Há ainda clientes de 2025 (MEIR, Usman) voltando espontaneamente.

Se o cliente médio fizer 2 pedidos, o CAC amortiza:

| Cenário | CAC por pedido | Ticket | Situação |
|---|---:|---:|---|
| Aquisição observada | Não reconciliada por fonte | US$ 81,83 autorrelatado | Margem desconhecida |
| Uma recompra | CAC não muda | Ticket da recompra desconhecido | Contribuição desconhecida |
| Duas recompras | CAC não muda | Tickets futuros desconhecidos | Contribuição desconhecida |

Recompra pode diluir o custo de aquisição por pedido e elevar LTV, mas não reduz o CAC de
aquisição. Sem coorte, frequência, ticket e contribuição, não se pode afirmar que torna o negócio
viável.

⚠️ Base pequena: 5 pedidos observados, 3 recompras. Direção forte, confirmação pendente.

---

## Divergência de preço entre o site e o atendimento

| Onde | Pedido mínimo |
|---|---:|
| Site inteiro (`plans.html`, `index.html`, ~40 páginas de blog, `README.md`, `MANIFESTO.md`) | **US$ 50** |
| Resposta histórica enviada ao lead `·954-6497` | **US$ 60** |
| Assets aprovados atuais do WhatsApp | **US$ 50** |

O cliente lê US$ 50 no site, chega no WhatsApp e ouve US$ 60. Isso não é só perda de venda —
é quebra de confiança no primeiro contato.

Caso concreto: o lead `·954-6497` pediu um Twin de US$ 35, ouviu que o mínimo era US$ 60 e sumiu.

**Status 2026-07-31:** resolvido nos materiais aprovados. Os dois assets em
`marketing/whatsapp/assets/2026-07-guest-onboarding/approved/` foram validados visualmente; o
Everyday mostra mínimo de US$ 50 e o Special não publica mínimo. A divergência permanece apenas
como evidência histórica do atendimento e em qualquer cópia antiga fora do inventário aprovado.

---

## Onde o dinheiro está vazando — em ordem de valor

| # | Vazamento | Evidência | Custo estimado |
|---|---|---|---:|
| 1 | **Falhas confirmadas de atendimento** | 3 de 12 leads novos; 1 caso incerto | Impacto financeiro desconhecido |
| 2 | **Lead B2B abandonado** | `·440-6440` — proposta para **9 casas de temporada** a US$1,95/lb, sem nenhum follow-up | Receita recorrente, valor não estimável |
| 3 | **Follow-up incompleto pós-cotação** | 6 cotados sem pedido confirmado | Receita recuperável desconhecida |
| 4 | **Classificação por áudio** | 1 lead recebeu resposta em áudio cujo conteúdo ainda não foi auditado | Impacto desconhecido |
| 5 | **Abertura genérica** | "How can I help you?" em vez de preço + coleta já na primeira mensagem | Efeito ainda não medido |
| 6 | **Mínimo sem escada** | Cliente de 1 item ouve "mínimo US$ 60" e não recebe alternativa | Perde o ticket pequeno inteiro |
| 7 | **Preço histórico inconsistente** | US$ 50 no site vs resposta de US$ 60 ao lead | Corrigido nos assets aprovados; retirar cópias antigas |

O item 2 merece destaque: **9 casas de temporada em regime recorrente** provavelmente vale mais
do que todo o resto desta lista somado. Está parado desde 16 de julho.

---

## Atribuição — o que já existe e o que falta

### Já funciona

`a7-tracking.js:179-197` injeta automaticamente uma tag em todo link `wa.me` da página:

```
A7 Ref: {utm_source}|{utm_campaign}|{utm_content}
```

Foi assim que o lead `·727-7757` chegou carimbado com
`A7 Ref: google|guest_search_orlando|203857555652_818373306214`.

**Cobertura: 100% do tráfego que passa pelo site.**

### O buraco

Os anúncios do Meta são click-to-WhatsApp: vão do anúncio direto para a conversa, **sem passar
pelo site**. Nunca recebem a tag. Restam apenas os carimbos nativos do WhatsApp:

- "Esta conversa foi iniciada em um anúncio no Facebook ou Instagram" → confirma Meta, **não diz
  qual anúncio**
- "Sua empresa usa um serviço seguro da Meta" → clique-para-WhatsApp gerenciado

Ou seja: dá para saber que veio do Meta, mas não de qual criativo, campanha ou público. É
exatamente a informação necessária para decidir onde alocar orçamento.

### Como fechar — três níveis

**Nível 1 — hoje, custo zero, sem tocar em campanha**
Buscar `A7 Ref` na busca do WhatsApp Web. Todo lead vindo do site fica atribuído com precisão
total, retroativamente. Cobre Google Ads, orgânico e qualquer tráfego que passe pelo site.

**Nível 2 — na próxima reestruturação de campanha**
Anúncios click-to-WhatsApp do Meta permitem definir a **mensagem pré-preenchida**. Basta um
código distinto por anúncio:

```
Hi! I'd like laundry pickup. [A4PT]
Hi! I'd like laundry pickup. [A3EN]
Hi! I'd like laundry pickup. [FD-EN]
```

O cliente envia o código sem perceber e a atribuição fica exata, por anúncio.

⚠️ **Isso exige editar o anúncio**, o que reinicia o aprendizado. Por isso: aplicar **junto** com
a consolidação já prevista (reduzir para 2–3 anúncios), em uma única edição, nunca isolado.

**Nível 3 — quando o volume justificar**
WhatsApp Business API com webhook: cada mensagem recebida cai automaticamente numa planilha ou
banco, com origem, horário e tempo de resposta. Elimina a leitura manual. Só vale a partir de
um volume que a operação atual ainda não tem.

---

## As correções que pagam mais — em ordem

| Prioridade | Ação | Custo | Retorno estimado |
|---|---|---|---|
| **1** | Responder todo lead elegível dentro do SLA, já com preço e próximo passo | Zero | Remove o vazamento; efeito em venda será medido |
| **2** | Retomar o lead B2B das 9 casas (`·440-6440`) | Uma mensagem | Receita recorrente |
| **3** | Follow-up D+1 e D+3 em todo lead que recebeu cotação | Template | Taxa de recuperação será medida |
| **4** | Registrar em texto o resumo de toda cotação feita por áudio | Rotina | Torna preço e próximo passo auditáveis |
| **5** | ✅ Mínimo e assets aprovados alinhados em **US$ 50** | Concluído | Evita repetir a quebra de confiança |
| **6** | Oferta de escada: "junte mais peças para chegar ao mínimo" | Copy | Recupera o ticket pequeno |
| **7** | Campanha de recompra nos clientes existentes | Uma mensagem | Mede receita e contribuição incremental sem nova mídia |

Nenhuma delas envolve tocar em campanha, criativo ou orçamento.

---

## Correção às auditorias anteriores

Este documento revisa duas conclusões:

| Documento | O que dizia | Correção |
|---|---|---|
| `docs/audits/2026-07-30-audit-consolidado.md` | Taxa conversa→pedido de 19,4% | Períodos e atribuição não reconciliam; não é taxa causal do canal |
| `marketing/OPERACAO-FUNIL.md` | Teste de US$ 210 "falha por construção" | Continua inconclusivo: atendimento, mídia, oferta e margem precisam ser medidos juntos |

O atendimento é um gargalo comprovado. Isso não absolve nem condena o canal pago: custo variável,
atribuição de pedidos, oferta e qualidade dos leads continuam sem evidência suficiente.

---

## Pendências desta auditoria

- **Conversas fora da amostra original** ainda precisam ser classificadas no novo registro.
- **`·242-7487`** precisa ter o áudio-resposta de 0:52 classificado: preço, prazo e próximo passo.
- **Varredura por `A7 Ref`** ainda não executada — destrava atribuição exata Meta × Google ×
  orgânico, retroativamente e sem custo.
- **Contribuição por pedido** segue desconhecida. Continua sendo o dado que falta para fechar o
  cálculo de viabilidade.
- **Badges de não-lida a restaurar:** `·727-7757` (2), `·407-961-8914` (1), Marco Soriano (2).
  Clique direito no chat → "Marcar como não lida".
