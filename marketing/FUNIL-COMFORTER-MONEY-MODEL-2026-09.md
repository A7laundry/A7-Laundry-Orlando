# Funil de Comforter & Bedding — Money Model aplicado

**Criado:** 2026-09-08
**Escopo:** lavagem de edredom, cobertor e roupa de cama — Orlando / Kissimmee / Osceola, FL
**Método:** frameworks de Alex Hormozi (Value Equation, Grand Slam Offer, Money Model, Core Four)
aplicados aos números reais da A7, não a benchmarks genéricos.

> **Relação com o MANIFESTO:** o `MANIFESTO.md` §4 classifica comforter como *add-on fora do ciclo
> pago principal*, com "zero venda confirmada no ciclo auditado; mídia paga pausada", e o Princípio 3
> diz "Guest Laundry primeiro". **Este documento não revoga isso.** Ele desenha o funil sob a condição
> de que comforter entre por canais de CAC próximo de zero e prove venda antes de disputar mídia paga.

---

## 0. O gate aritmético — leia antes de tudo

Hormozi tem uma única regra que decide se um funil existe ou não: **o lucro bruto dos primeiros
30 dias de um cliente precisa superar o custo de adquiri-lo e servi-lo.** Aplicando aos números
reais da A7 (`marketing/OPERACAO-FUNIL.md`, `project_unit_economics`):

| Variável | Valor real A7 | Fonte |
|---|---:|---|
| Custo por conversa (Meta) | US$ 20,09 | histórico realizado |
| Conversa → pedido | 19,4% | 6 ÷ 31 conversas |
| **Custo por pedido adquirido** | **~US$ 104** | derivado |
| Ticket comforter Full/Queen | US$ 37 | tabela vigente |
| Ticket médio geral | US$ 81,83 | autorrelatado |
| Custo variável por pedido | **DESCONHECIDO** | `custos-servico.csv` vazio |

### Veredito 1 — comforter avulso em mídia fria é matematicamente impossível

| Cenário | Conta | Resultado |
|---|---|---:|
| Receita de 1 comforter Queen | — | US$ 37 |
| Custo de adquirir esse pedido | US$ 20,09 ÷ 19,4% | US$ 104 |
| **Resultado com custo variável ZERO** | 37 − 104 | **− US$ 67** |

Para o comforter avulso empatar apenas em **receita bruta** no canal pago, seria preciso uma destas
condições — todas fora de alcance:

| Alavanca | Necessário | Hoje |
|---|---:|---:|
| Taxa de fechamento | **54%** | 19,4% |
| Custo por conversa | **US$ 7,18** | US$ 20,09 |
| Ticket do pedido de bedding | **US$ 104** | US$ 37 |

**Conclusão:** o edredom não pode ser o produto que paga a mídia. Ele só existe no funil como
**porta de entrada barata** (Attraction Offer) ou como **upsell de rota já paga**. Qualquer plano que
comece com "vamos anunciar comforter no Meta" repete o ciclo que já produziu zero venda.

### Veredito 2 — o preço não é defensável, o esforço é

| Concorrente | Preço | Coleta | Prazo |
|---|---:|---|---|
| CD One Price Cleaners | US$ 25 qualquer tamanho | você leva | próximo dia 17h |
| Express Wash & Fold | a partir de US$ 20 | incluída | — |
| ZIPS | ~US$ 25/un | você leva | — |
| **WashFold Orlando** (entrante direto) | **US$ 33 qualquer tamanho** | incluída | **72h** |
| **A7** | **US$ 33 / 37 / 40 / 45** | incluída | **24h** |

A A7 é a **mais cara por tamanho** e a **mais rápida**. O entrante já copiou o preço ($33) e o
pickup — o que sobrou de vantagem real é **72h → 24h** e o atendimento humano. Toda a construção
de oferta abaixo se apoia nisso, nunca em preço.

### Veredito 3 — o conflito do pedido mínimo

O mínimo canônico é **US$ 50 por pedido**. Um comforter Queen custa **US$ 37**. Um pedido só de
comforter **viola o próprio mínimo** — ou a rota sangra, ou o cliente é forçado a combinar.
Isso não é um detalhe operacional: é o que obriga o funil a ser um **bundle**, não um item avulso.

---

## 1. A Grand Slam Offer

**Value Equation:** `Valor = (Sonho × Probabilidade percebida) ÷ (Tempo × Esforço)`

O erro de leitura mais caro é achar que o cliente quer "um edredom limpo". Ele não quer.
Ele quer **dormir numa cama que parece de hotel, sem ácaro e sem cheiro de mofo, sem carregar nada
e sem sair de casa** — e na Flórida a variável emocional dominante é a umidade.

| Componente | Alavanca A7 | Como aparece na oferta |
|---|---|---|
| **Sonho** ↑ | cama de hotel em casa; ar respirável para quem tem alergia | "Hotel-clean bedding. Delivered to your door." |
| **Probabilidade** ↑ | Google 5.0★/23 reviews, foto antes/depois, garantia | garantia de refazer sem custo |
| **Tempo** ↓ | **24h contra as 72h do entrante** | "Picked up today. Back on your bed tomorrow." |
| **Esforço** ↓ | zero: não carrega, não vai à laundromat, não estaciona | "You don't lift anything. You don't leave the house." |

### Oferta principal — *The Orlando Bedding Reset*

| | |
|---|---|
| **O que é** | Edredom + jogo de lençóis + 2 fronhas, lavados, higienizados, dobrados e devolvidos prontos |
| **Preço-âncora sugerido** | **US$ 89** (a validar contra custo variável — ver Gate 0) |
| **Prazo** | 24h |
| **Garantia** | "Se não chegar cheirando limpo, refazemos sem custo." |
| **Por que funciona** | resolve o conflito do mínimo (89 > 50), **sai da comparação de preço com o "$33 any size"** — não é o mesmo produto — e sobe o ticket 2,4× sobre o comforter avulso |

O bundle é a jogada central: enquanto o produto for "um edredom", a A7 perde para $25 e $33.
Quando o produto passa a ser "a cama inteira, resetada, sem você fazer nada", a comparação morre.

---

## 2. Os momentos — quando alguém compra isso

Funil não se organiza por canal, se organiza por **gatilho**. Estes são os momentos reais de compra,
ordenados por urgência (proxy de disposição a pagar):

| # | Momento | Urgência | Sazonal? | Ativo A7 hoje |
|---|---|---|---|---|
| 1 | **Derramou / pet / criança / doença** | máxima | não | nenhum |
| 2 | **Não coube na máquina** | alta | não | copy pronta ("It doesn't fit, does it?") |
| 3 | **Cheiro de mofo após a estação de chuva** | alta | **jun–set** | nenhum — e é o mais local que existe |
| 4 | **Alergia / asma / ácaro** | média-alta | mar–mai | nenhum |
| 5 | **Chegou visita / feriado** | média | Thanksgiving, Natal, Spring Break | nenhum |
| 6 | **Troca de estação** | média | **mar–mai e ago–out** | nenhum |
| 7 | **Mudança / colchão novo** | média | não | nenhum |
| 8 | **Turnover de vacation rental** | recorrente | contínuo | `vacation-rental.html` |
| 9 | **Pós-viagem / pós-cruzeiro** | baixa p/ bedding | contínuo | segmento já validado (27% dos pedidos) |

**O momento 3 é o whitespace real.** "Meu edredom está com cheiro de mofo" é uma dor da Flórida,
não uma dor genérica de lavanderia — nenhum concorrente comunica isso, e a umidade de Orlando
garante o público todo ano. É o ângulo com maior chance de escapar da guerra de preço.

---

## 3. As camadas do funil

Nomenclatura interna — nunca exposta na UI pública (`MANIFESTO.md` §5).

### Topo — quem ainda não sabe que tem o problema

| Item | Definição |
|---|---|
| **Objetivo** | ser encontrado no instante do gatilho |
| **Formato** | conteúdo de busca + social orgânico |
| **Peças** | "Why does my comforter smell musty in Florida?" · "It won't fit in the washer — now what?" · "How often should you wash a comforter in a humid climate?" |
| **Métrica** | impressões e cliques por gatilho, não por keyword genérica |
| **Custo** | ~US$ 0 — canal Content do Core Four |
| **CTA** | não vender ainda: oferecer o diagnóstico (ver Lead Magnet) |

### Meio — sabe que tem o problema, está escolhendo como resolver

| Item | Definição |
|---|---|
| **Objetivo** | eliminar as três objeções: preço, prazo, "vão estragar?" |
| **Peças** | página de comforter reescrita em cima do bundle · comparativo honesto "levar você mesmo × A7" · antes/depois real · garantia visível |
| **Prova obrigatória** | 5.0★/23 (não inventar review — `feedback` do projeto) |
| **Métrica** | % de visitantes que chegam ao WhatsApp com a mensagem pré-preenchida |

### Fundo — quer comprar agora

| Item | Definição |
|---|---|
| **Objetivo** | fechar em minutos, não em horas |
| **Canal** | WhatsApp + Stripe link direto |
| **Regra dura** | **responder em menos de 5 minutos** |
| **Gargalo conhecido** | 9 de 19 leads da auditoria de julho **nunca receberam resposta** |

> **A alavanca mais barata do funil inteiro está aqui.** A literatura de speed-to-lead aponta
> ~21× mais qualificação respondendo em 5 min contra 30 min, e ~78% dos clientes compram de quem
> responde primeiro. Na A7 quase metade dos leads não recebeu resposta nenhuma. Nenhum criativo,
> nenhuma oferta e nenhum lance de mídia compete com consertar isso — e custa US$ 0.

---

## 4. O Money Model — a sequência de ofertas

As quatro peças de Hormozi, traduzidas para o que a A7 pode entregar hoje:

### 4.1 Attraction Offer — a porta

| Opção | Preço | Papel | Risco |
|---|---:|---|---|
| **A. Bedding Reset** | US$ 89 | ticket alto, respeita o mínimo, fora da comparação de preço | menos volume |
| **B. Comforter avulso** | US$ 33–45 | fricção mínima, alta intenção | **abaixo do mínimo de US$ 50** — só viável com upsell garantido |
| **C. "First Reset" com desconto** | US$ 69 | acelera prova de conceito | corrói margem antes de conhecer o custo |

**Recomendação: A como oferta padrão, B apenas como downsell.** C fica bloqueada até o Gate 0.

### 4.2 Upsell — onde o dinheiro realmente está

O upsell da A7 tem uma propriedade rara: **custo marginal quase zero**. O carro já está na porta,
a rota já foi paga, o cliente já confiou. Hormozi chama isso de o momento de maior conversão da
relação inteira.

> **No ato da coleta:** *"Já que estou aqui — tem mais alguma coisa para lavar? Wash & fold sai a
> US$ 3,25/lb e volta junto com a cama amanhã."*

| Cenário | Receita do cliente |
|---|---:|
| Só o Bedding Reset | US$ 89 |
| Reset + wash & fold no ticket médio | **US$ 170,83** |

**O attach rate desse upsell é a métrica que decide se o funil escala.** Ele transforma um pedido de
US$ 89 num pedido de US$ 171 sem gastar um centavo a mais de aquisição.

### 4.3 Downsell — recuperar o "não"

| Objeção | Downsell |
|---|---|
| "É caro" | comforter avulso US$ 33–45, sem os lençóis |
| "Não tenho pressa" | Standard 24h em vez de prioridade |
| "Prefiro levar" | endereço de drop-off + desconto de logística |
| "Vou pensar" | **agendamento futuro** — reserva a data, cobra depois |

O último é o mais subutilizado: em vez de perder o lead, marca o próximo gatilho sazonal.

### 4.4 Continuity — recorrência sem assinatura

O `MANIFESTO.md` Princípio 1 proíbe assinatura, e a decisão está certa — o modelo por bag já falhou.
Mas **continuity não precisa ser contrato**. A versão compatível é comportamental:

> **Seasonal Bedding Reset** — o cliente escolhe a frequência (a cada 3 ou 4 meses) e a A7 manda
> **uma mensagem no WhatsApp** no mês certo. Sem cobrança recorrente, sem cartão salvo, sem
> compromisso. Ele só confirma.

A base técnica é a recomendação de higiene: edredom pede lavagem a cada 3–4 meses, e mais em clima
quente e úmido — exatamente Orlando. **O produto tem uma cadência natural de 3 a 4 compras por ano,
e a A7 nunca a explorou.** Uma recompra por WhatsApp custa ~US$ 0 contra ~US$ 104 de uma aquisição
nova. É a diferença entre um funil que perde dinheiro e um que fecha.

---

## 5. Core Four — por onde os leads entram

Hormozi: só existem quatro formas de conseguir cliente. A A7 opera **uma** delas, e é justamente
a mais cara para este produto.

| Canal | Custo | Status A7 | Ação para comforter |
|---|---|---|---|
| **1. Warm outreach** | ~US$ 0 | **não usado** | mensagem para toda a base existente: *"Quando foi a última vez que seu edredom foi lavado?"* — **é a primeira ação do plano** |
| **2. Content** | ~US$ 0 | 82 URLs no blog, comforter mal conectado | artigos por gatilho (momentos 1–6), todos linkando o bundle |
| **3. Cold outreach** | trabalho, não dinheiro | **não usado** | B2B: property managers de vacation rental em Kissimmee/Osceola — dezenas de milhares de casas, turnover de bedding recorrente por construção |
| **4. Paid ads** | US$ 20/conversa | único canal ativo | **somente busca de fundo de funil**: `comforter cleaning near me`, `duvet dry cleaning orlando`. Nunca prospecção fria no Meta — já produziu zero venda |

**A ordem importa.** 1 e 3 têm CAC próximo de zero e são os únicos que sobrevivem ao Veredito 1.
O canal 4 só entra depois que 1, 2 e 3 provarem que existe demanda e que o attach rate se sustenta.

### Lead magnet

O lead magnet certo resolve **de graça** um problema estreito, e ao resolvê-lo revela o problema maior:

> **"The Florida Bedding Check" — 6 perguntas no WhatsApp.**
> Cheiro? Manchas? Quanto tempo desde a última lavagem? Alguém com alergia em casa? Pet na cama?
> Cabe na sua máquina?
> **Resposta:** um diagnóstico honesto — inclusive *"dá para lavar em casa, veja como"* quando for
> o caso — e uma cotação quando não for.

Custa zero, qualifica antes de gastar atendimento, e o "às vezes eu digo para você não me contratar"
é o gerador de confiança mais barato que existe.

---

## 6. Gates e métricas

Nenhum passo avança sem o anterior. São gates, não sugestões.

| Gate | Condição | Por quê |
|---|---|---|
| **0. Custo variável do comforter** | preencher `custos-servico.csv` para twin/queen/king/down | Sem isso, US$ 89 é chute. Lavar um edredom king é mensurável em uma tarde: água, energia, detergente, tempo de máquina, embalagem, combustível da rota. **É o número mais valioso que a empresa não tem.** |
| **1. Speed-to-lead < 5 min** | zero lead sem resposta em uma semana | Hoje 9/19 sem resposta. Dobrar o fechamento aqui é de graça. |
| **2. Attach rate ≥ 30%** | pedidos de bedding que viram bedding + wash&fold | Abaixo disso o funil não paga aquisição paga em nenhum cenário. |
| **3. Teto de CAC** | contribuição por pedido × 0,33 | Só calculável depois do Gate 0. Antes dele, **nenhum orçamento novo de mídia para comforter.** |

### Painel do funil

| Métrica | Onde medir | Meta inicial |
|---|---|---|
| Leads de bedding por gatilho | `marketing/data/leads.csv` (coluna de gatilho) | contar, não estimar |
| Tempo de resposta | `conversas.csv` | mediana < 5 min |
| Conversa → cotação | idem | > 80% |
| Cotação → pedido | idem | > 35% |
| Attach rate do upsell | `pedidos.csv` | ≥ 30% |
| Recompra em 120 dias | `recompra.csv` | ≥ 25% |
| Contribuição por pedido | `pedidos.csv` | > US$ 0 (sim, é o estado atual da arte) |

⚠️ **Regra dos denominadores:** registrar apenas o que foi contado. Não misturar amostra com
extrapolação, não reportar taxa sem o denominador ao lado.

---

## 7. Sequência de execução — e por que setembro

A sazonalidade medida de Orlando (`project_orlando_sazonalidade`) diz que o **fundo do ano é
8–19 de setembro** e a virada real é **9 de outubro**, com o Fall Break. A pesquisa de bedding
aponta picos de demanda em **mar–mai** e **ago–out**.

**Isso torna o timing quase ideal:** estamos no vale de tráfego pago, e o pico de bedding começa
em outubro. Setembro é para construir ativos de CAC zero; outubro é para ligar a mídia — se os
gates passarem.

### Setembro (agora) — custo de mídia: US$ 0

1. **Gate 0:** medir o custo variável real de um comforter. Uma tarde de trabalho.
2. **Warm outreach:** mensagem de bedding para 100% da base existente.
3. **Speed-to-lead:** definir quem responde, em quanto tempo, e registrar cada lead.
4. **Reescrever a página de comforter** em cima do *Bedding Reset* e do ângulo de umidade/mofo.
5. **Cold outreach B2B:** lista de property managers de Kissimmee/Osceola; 20 contatos por semana.
6. **3 artigos de gatilho** (mofo na Flórida, não coube na máquina, com que frequência lavar).

### Outubro — só se os gates 0, 1 e 2 passarem

7. Google Ads **apenas em busca de alta intenção** de bedding, com teto derivado do Gate 3.
8. Ativar o *Seasonal Reset* para todo mundo que comprou entre junho e setembro.
9. Meta **somente retargeting** de quem visitou a página — nunca público frio.

### O que não fazer

- Anunciar comforter no Meta para público frio. Já foi testado, deu zero venda, e a aritmética do
  Veredito 1 explica por quê.
- Competir em preço com o "US$ 33 qualquer tamanho". A A7 perde essa disputa por construção.
- Criar assinatura. O modelo por bag já falhou uma vez.
- Definir o preço do bundle antes do Gate 0.
- Escalar qualquer coisa enquanto 9 de 19 leads seguirem sem resposta.

---

## 8. Onde este funil pode quebrar

Registrado explicitamente, porque um plano sem hipótese de falha é propaganda:

| Risco | Sinal de alerta | O que fazer |
|---|---|---|
| Custo variável alto demais | contribuição do Reset < US$ 30 | subir o preço ou matar o produto — não subsidiar |
| Attach rate baixo | < 15% após 20 pedidos | comforter volta a ser add-on, não porta de entrada |
| Demanda inexistente no orgânico | < 50 cliques/mês nos artigos de gatilho | o gatilho de mofo estava errado; testar alergia |
| B2B não responde | < 5% de resposta em 100 contatos | a oferta B2B precisa ser turnover completo, não bedding |
| Canibalização do core | pedidos de guest laundry caem | Princípio 3 do MANIFESTO prevalece: guest laundry primeiro |

---

## Fontes

Frameworks: [$100M Offers — resumo](https://www.gregfaxon.com/blog/100m-offers-summary) ·
[Grand Slam Offer anatomy](https://alexhormozi.wiki/frameworks/grand-slam-offer-anatomy) ·
[$100M Money Models — resumo](https://businessbookclub.substack.com/p/100m-money-models-by-alex-hormozi) ·
[Money Models em home services](https://phlashconsulting.com/i-read-100m-money-models-heres-how-it-actually-works-for-home-service-businesses/) ·
[$100M Leads / Core Four](https://www.shortform.com/blog/100m-leads-alex-hormozi/)

Mercado e comportamento: [WashFold Orlando — US$ 33 qualquer tamanho](https://www.washfoldorlando.com/) ·
[CD One — comforters e cobertores](https://cdonepricecleaners.com/service/comforters-blankets/) ·
[Express Wash and Fold — preços](https://expresswashandfoldlaundry.com/pricing/) ·
[Orchid Cleaners](https://orchidcleaners.com/orlando-dry-cleaning) ·
[Frequência de lavagem de edredom](https://shopping.yahoo.com/home-garden/bedding/article/how-often-should-you-wash-your-duvet-or-comforter-183330077.html) ·
[Ácaros, umidade e bedding](https://magiclinen.com/blogs/blog/allergy-aware-linen-care-a-clinicians-guide-to-reducing-dust-mites-at-home) ·
[Sazonalidade de limpeza](https://www.numerator.com/resources/blog/season-change-spring-cleaning/) ·
[Speed to lead — estatísticas](https://www.leadangel.com/blog/operations/speed-to-lead-statistics/) ·
[Linens em vacation rental](https://www.breezeway.io/blog/vacation-rental-linen-program)

Internas: `MANIFESTO.md` · `marketing/OPERACAO-FUNIL.md` · `marketing/data/custos-servico.csv` ·
`marketing/AUDITORIA-WHATSAPP-2026-07-30.md`
