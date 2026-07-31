# Recuperação de pendentes — executar na semana 1

**Origem:** auditoria de 2026-07-30, reconciliada diretamente em 2026-07-31.
**Status:** 19 threads classificadas; nenhuma mensagem de recuperação enviada.

✅ **Mínimo oficial decidido: US$ 50** (2026-07-30). Site, textos e os dois assets aprovados do
WhatsApp estão corretos. Usar somente os `SEND.jpg` do inventário e retirar qualquer cópia antiga
com US$ 60.

---

## Como usar

Ordem por valor potencial, não por data. Envie de cima para baixo.

Todas as mensagens reconhecem a demora. Passaram 8 a 19 dias — fingir que não passou soa pior
do que assumir. Reconhecer o atraso e ir direto ao ponto converte melhor do que pedir desculpas
longas.

Depois de cada envio: registrar em `marketing/data/leads.csv` e etiquetar `3-Follow-up`.

---

## 1 · B2B — 9 casas de temporada · `·440-6440`

**Prioridade máxima.** Proposta feita em 16/jul a US$ 1,95/lb, sem nenhum follow-up desde então.
Volume recorrente — sozinho provavelmente vale mais que todos os hóspedes do mês.

```
Hi! This is A7 Laundry — I'm following up on the quote we sent for your properties.
I'll be honest: we dropped the ball on the follow-up and I apologize.

We previously sent a $1.95/lb proposal. Before reconfirming that commercial rate, I need to
validate the current volume and schedule so we don't promise capacity we can't deliver. Two
questions:

1. How many turnovers per week, roughly?
2. Do you need linens and towels included, or just guest laundry?

I can put together a plan and confirm the next available capacity.
```

**Se responder:** este lead tem dono nomeado e cadência própria. Não entra no fluxo padrão.

---

## 2 · Áudios — classificação corrigida

| Contato | Classificação verificada | Ação |
|---|---|---|
| `·242-7487` | Lead Meta de hotel/Airbnb; recebeu resposta da A7 em áudio no mesmo dia | Ouvir a resposta de 0:52 e registrar se houve preço, prazo e próximo passo |
| `·207-2488` | Conversa de serviço automotivo/peças; não é laundry | Excluir do funil |
| `·437-5263` | Conversa iniciada pela A7 em áudio; não é lead inbound ignorado | Excluir da taxa de abandono; classificar como outbound |

Não enviar pedido de desculpas em massa para esses três. A alegação de que eram três leads
ignorados estava errada.

---

## 3 · Cotados sem pedido confirmado

Receberam preço e morreram sem uma única cobrança.

### `·954-6497` — pediu Twin de $35, morreu no mínimo

Este é o caso da escada. **Não repita o mínimo seco** — foi exatamente isso que matou.

```
Hi! Following up on your comforter — sorry for the delay.

That one came to $35, just under our $50 minimum. But if you have anything else —
towels, sheets, another blanket, regular laundry — we can combine it and pick
everything up in one trip.

If you still need it, tell me roughly what else you have and I'll check the next pickup.
```

### `·308-4212` — "deciding for our family"

Adiou educadamente. Follow-up natural.

```
Hi! Just checking back in — did your family decide on the laundry pickup?

Still happy to help. $3.25/lb, we pick up and deliver back within 24h.
If it's easier, tell me your dates and I'll check availability.
```

### `·561-4794`, `·276-5729` e `·609-4463`

```
Hi! Following up on the quote we sent — sorry it took a while.

Is the pickup still useful for you? Send me your location and dates and I'll check the next
available pickup.
```

---

## 4 · Falhas de atendimento confirmadas

Estes não receberam uma resposta comercial útil. **A retomada precisa resolver o pedido
específico**, sem fingir que a conversa está começando agora.

| Lead | Data | O que disseram |
|---|---|---|
| Marco Soriano | 18/jul | perguntou preço **2×**, respondemos "Bom dia" e nunca cotamos |
| `·246-4493` | 11/jul | "pressing/ironing?" |
| `·963-2601` | 22/jul | "Good morning" |

Exclusões verificadas: `·961-8914` era câmbio/Pix; `·381-4954` era cliente com pedido entregue;
`·535-0314` procurava emprego; `·609-4463` recebeu preço e atendimento para o Hyatt.

### Marco Soriano — o mais grave (perguntou duas vezes)

```
Oi Marco! Peço desculpas — você perguntou o preço e a gente não te respondeu direito.
Isso não deveria ter acontecido.

Sobre o terno: preciso confirmar o tecido e a etiqueta de cuidado antes de prometer o serviço.
Pode me enviar uma foto do terno e da etiqueta? Eu confirmo se conseguimos atender, o preço e
o prazo antes da coleta.
```

### `·246-4493` — perguntou passadoria

✅ Confirmado: **a A7 faz passadoria.** O serviço existe mas **não está documentado em lugar
nenhum do site** — não há preço nem prazo publicados. Por isso a mensagem confirma o serviço e
pede a peça para cotar, em vez de prometer valor que ainda não está definido.

```
Hi! Sorry for the late reply — you asked about pressing and we left you waiting.

Yes, we do pressing and ironing. We also do wash, dry & fold with free pickup
and delivery — $3.25/lb, minimum $50.

Tell me what you need pressed (how many pieces, what type) and I'll confirm the price and
turnaround before pickup.
```

⚠️ **Duas pendências abertas por esta resposta:**
1. Definir preço e prazo da passadoria — hoje não existem.
2. Se é serviço real e vendável, ele deveria estar no site. Hoje é receita invisível: ninguém
   procura o que não está publicado.

### `·963-2601` — pediu coleta de hotel/Airbnb

```
Hi! Sorry for the slow reply.

A7 Laundry — wash, dry & fold with pickup and delivery:
• $3.25/lb — ready in 24h
• $3.95/lb — express 6h
• Minimum order $50

Still need it? Send me your hotel/Airbnb address and roughly how many pounds or bags, and I'll
check the next available pickup.
```

---

## 5 · Recompra — a base existente

Clientes que já compraram. Custo de aquisição zero.

```
Hi [nome]! We have pickup availability this week.
Want us to schedule your laundry again?
```

**Medir por coorte, não no agregado.** Registrar em `marketing/data/leads.csv`:
quando foi adquirido, quando recomprou, quantos dias entre pedidos, ticket de cada um.

Os três que recompraram em julho (Kathryn, Ace, Simon) foram adquiridos em 2025 — **não servem
para estimar recompra dos clientes de agosto.** São coortes diferentes.

---

## Checklist

- [x] ~~Mínimo oficial definido~~ → **US$ 50**, textos já atualizados
- [x] ~~Confirmar se passadoria está no escopo~~ → **sim, fazem**
- [x] **Flyers aprovados validados** — Everyday mostra US$ 50; Special não publica mínimo
- [x] Respostas rápidas cadastradas no WhatsApp Business (9 atalhos operacionais)
- [ ] Definir preço e prazo da passadoria
- [ ] B2B das 9 casas — enviado e com dono nomeado
- [x] 3 áudios reclassificados — 1 lead respondido, 1 automotivo, 1 outbound
- [ ] 6 cotados sem pedido confirmado com follow-up
- [ ] 3 falhas confirmadas contatadas
- [ ] Base de recompra contatada
- [ ] Tudo registrado em `leads.csv` com etiqueta no WhatsApp

**Resultado esperado:** desconhecido. Estes leads têm 8 a 19 dias e a taxa de recuperação de
lead frio é significativamente menor que a de lead novo. Registre o que voltar — é o primeiro
dado real de recuperação que a operação vai ter.
