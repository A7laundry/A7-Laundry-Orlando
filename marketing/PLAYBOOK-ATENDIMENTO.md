# Playbook de atendimento — prevenção

**Criado:** 2026-07-30 · **Reconciliado:** 2026-07-31
**Origem:** auditoria que encontrou três falhas confirmadas entre 12 leads novos e um caso incerto
(`AUDITORIA-WHATSAPP-2026-07-30.md`)

---

## O princípio

O vazamento operacional aconteceu porque não existia:

- quem é o dono da primeira resposta
- em quanto tempo ela tem que sair
- o que exatamente responder
- quem confere no fim do dia se sobrou alguém

**Nesta operação, tudo que depende de alguém lembrar vai falhar.** Uma operação pequena não tem
folga para disciplina heroica. A prevenção precisa ser estrutural.

Daí a ordem de construção: **primeiro o que funciona sozinho, depois o que depende de rotina,
por último o que depende de análise.**

---

## Camada 1 — O que funciona sem ninguém (fazer hoje)

O WhatsApp Business já tem tudo isto instalado. Nada custa dinheiro.

### 1.1 Mensagem de saudação automática

Dispara sozinha no primeiro contato de qualquer número novo. **É o único mecanismo que elimina
o "nunca respondeu" mesmo se ninguém estiver olhando o celular.**

Configuração: WhatsApp Business › Ferramentas comerciais › Mensagem de saudação › Enviar a
*todos que não estão nos contatos*.

Ela não substitui o atendimento humano. Ela confirma o recebimento e coleta os dados mínimos;
o efeito sobre fechamento ainda precisa ser medido.

### 1.2 Mensagem de ausência

Fora do horário de operação, responde sozinha com prazo de retorno. Evita que o lead da
madrugada apareça como ignorado.

### 1.3 Respostas rápidas (atalhos)

Cadastrar os textos da seção Templates como atalhos (`/preco`, `/coleta`, `/minimo`, `/fup1`).
Elimina o "How can I help you?" — que a auditoria mostrou ser o que mais mata lead.

---

## Camada 2 — Etiquetas como pipeline

Você já usa etiquetas (o lead `·381-4954` tinha "Novo pedido"). Falta transformá-las em sistema.

**Cinco etiquetas. Toda conversa tem exatamente uma. Sempre.**

| Etiqueta | Significa | Sai daqui quando |
|---|---|---|
| 🔴 `1-Novo` | Chegou, ainda não foi cotado | Recebeu preço |
| 🟡 `2-Cotado` | Recebeu preço, aguardando decisão | Fechou ou foi para follow-up |
| 🔵 `3-Follow-up` | Cotado há mais de 1 dia, sem resposta | Fechou ou foi descartado |
| 🟢 `4-Cliente` | Fechou pedido | Nunca — vira base de recompra |
| ⚫ `5-Perdido` | Recusou ou sumiu após 2 follow-ups | Nunca |

**A regra que sustenta tudo: `1-Novo` tem que estar vazia no fim do dia.**

Uma conversa em `1-Novo` às 20h é dinheiro de anúncio no lixo. É o indicador mais simples e mais
caro da operação, e dá para verificar em cinco segundos filtrando a etiqueta.

---

## Camada 3 — Rotina diária (2 minutos)

**Fim do expediente:**

1. Filtrar `1-Novo` → tem que estar vazia. Se tiver alguém, responder antes de fechar.
2. Filtrar `2-Cotado` → quem foi cotado ontem passa para `3-Follow-up` e recebe a mensagem D+1.
3. Filtrar `3-Follow-up` → quem está há 3 dias recebe o D+3. Depois disso, `5-Perdido`.

Só isso. Dois minutos.

**Regra dos áudios:** áudio é lead, não é recado. Três leads foram perdidos por áudio não ouvido.
Se não puder ouvir na hora, responder em texto: *"Recebi seu áudio, já te respondo em instantes"* —
e voltar. O que não pode é ficar sem nada.

---

## Camada 4 — Revisão semanal (15 minutos)

Toda segunda, contar e registrar em `marketing/data/semanal.csv`:

| Indicador | Meta | Alarme | Baseline atual |
|---|---|---|---|
| Leads elegíveis com falha de atendimento | **0** | ≥ 1 | 3/12 confirmados; 1/12 incerto |
| Tempo médio da 1ª resposta | < 5 min | > 15 min | não medido |
| % dos leads que receberam cotação | > 90% dos elegíveis | < 80% | 8/12 = 66,7% dos leads novos |
| Follow-ups enviados / cotados | 100% | < 80% | 0% |
| Fechamento entre os cotados | acompanhar, sem meta inicial | — | 2/8 = 25,0%; IC 95% 7,1%–59,1% |
| Recompra no mês | acompanhar | — | 3 de 5 pedidos |

O baseline é o número da auditoria. **Qualquer semana pior que o baseline é regressão** — e o
baseline foi apurado no pior cenário possível, então subir dele deve ser fácil.

---

## Camada 5 — Automação (quando o volume justificar)

Não fazer agora. Registrado para não ser reinventado depois:

1. **Código por anúncio na mensagem pré-preenchida** do Meta (`[A4PT]`, `[A3EN]`) — dá atribuição
   exata por criativo. Exige editar anúncio, então só junto com a consolidação já prevista.
2. **Varredura periódica por `A7 Ref`** — atribui todo lead que passa pelo site, retroativamente.
3. **WhatsApp Business API + webhook** — grava origem, horário e tempo de resposta
   automaticamente. Elimina a contagem manual. Só compensa acima do volume atual.

---

## Templates

✅ **Mínimo oficial: US$ 50** (decidido em 2026-07-30). Site e textos abaixo alinhados.

✅ **Assets aprovados validados em 2026-07-31:** o card Everyday mostra mínimo de US$ 50 e o card
Special não publica mínimo. Usar somente os arquivos `SEND.jpg` listados no inventário; retirar
de circulação qualquer cópia histórica com US$ 60.

✅ **Passadoria está no escopo** (confirmado 2026-07-30), mas sem preço nem prazo definidos e
ausente do site. Não prometer valor até definir.

### Primeira resposta — EN

```
Hi! Thanks for reaching out to A7 Laundry 👋

Wash, dry & fold with pickup and delivery:
• $3.25/lb — ready in 24h
• $3.95/lb — express 6h (subject to availability)
• Minimum order $50

Just send me:
1. Your hotel / Airbnb and address
2. Roughly how many pounds
3. Best pickup time — today or tomorrow

I'll confirm your slot right away.
```

### Primeira resposta — PT

```
Oi! Aqui é da A7 Laundry 👋

Lavamos, secamos e dobramos, com coleta e entrega:
• $3.25/lb — pronto em 24h
• $3.95/lb — express 6h (sujeito a disponibilidade)
• Pedido mínimo $50

Me manda só:
1. Hotel / Airbnb e endereço
2. Quantas libras, mais ou menos
3. Melhor horário de coleta — hoje ou amanhã

Já confirmo seu horário.
```

### Follow-up D+1

```
Hi [nome], just checking in — do you still want us to pick up your laundry?
I can fit you in today or tomorrow.
```

```
Oi [nome], passando pra saber se ainda quer a coleta.
Consigo encaixar hoje ou amanhã.
```

### Follow-up D+3 (último)

```
Hi [nome], last check — your pickup slot is still open if you need it.
Just say the word and I'll schedule it.
```

### Escada do mínimo

Para quando o pedido fica abaixo do mínimo — foi exatamente onde o lead `·954-6497` morreu:

```
That comes to $35, just under our $50 minimum.
If you add a few more items — towels, sheets, anything you have — we can pick it up today.
Want me to hold a slot for you?
```

### Recompra

Para a base de `4-Cliente`, sem campanha paga:

```
Hi [nome]! We have pickup availability this week.
Want us to schedule your laundry again?
```

### Lead B2B (casas de temporada, hosts)

Não usar o template padrão. Estes valem recorrência e merecem tratamento próprio:

```
Hi [nome], thanks for reaching out!

For vacation rentals we work with recurring turnover pricing —
different from our per-guest rate. Tell me:
• How many properties?
• Roughly how many turnovers per week?
• Do you need linens and towels included?

I'll put together a plan that fits your schedule.
```

**Regra:** todo lead B2B tem um dono nomeado e cadência própria. O lead das 9 casas
(`·440-6440`) foi perdido justamente por não ter isso.

---

## Por onde começar

**Hoje — o que funciona sozinho**
1. Ativar a mensagem de saudação automática com preço (Camada 1.1). *Este item sozinho elimina
   o maior vazamento e não depende de ninguém.*
2. Ativar a mensagem de ausência.
3. Cadastrar as respostas rápidas.

✅ Em 2026-07-31 foram cadastrados no WhatsApp Business os atalhos `/precoen`, `/precopt`,
`/fup1en`, `/fup1pt`, `/fup3en`, `/fup3pt`, `/minimoen`, `/b2ben` e `/pressingen`.
Saudação e ausência continuam dependendo da configuração no aplicativo móvel.

**Esta semana — o que depende de rotina**
4. Criar as cinco etiquetas e classificar as conversas abertas dos últimos 30 dias.
5. Começar o ritual de fim de dia: `1-Novo` vazia.
6. Recuperar os pendentes reconciliados: o B2B das 9 casas, seis cotados sem pedido confirmado e
   três falhas de atendimento. Os três áudios originais foram reclassificados e não formam uma
   fila de recuperação.

**Este mês — o que depende de medição**
7. Primeira revisão semanal com números.
8. ✅ Mínimo oficial, site e assets aprovados alinhados em US$ 50.
9. Levantar a contribuição por pedido — segue sendo o dado que falta para saber quanto se pode
   pagar por cliente.

**Só depois disso, mídia.** Consolidar anúncios, aplicar código de atribuição por criativo e
rediscutir orçamento. O efeito do atendimento corrigido sobre CAC e contribuição será medido;
não é conhecido antecipadamente.

---

## O que mudou na forma de olhar

Antes o painel era **CTR, CPM, custo por conversa**. Isso mede se o anúncio funciona.

O painel agora é **leads sem resposta, % cotados, fechamento dos cotados, recompra**. Isso mede
se a empresa transforma conversa em dinheiro — que é onde estava o problema o tempo todo.

Métrica de mídia volta a importar quando o atendimento parar de ser o gargalo.
