# A7 Guest Ecosystem — Lake Buena Vista first
## Planner estratégico: estar onde o hóspede pesquisa, entregar valor, só depois vender lavanderia

**Data:** 10/set/2026  
**Status:** Blueprint (próximo passo: MVP LBV)  
**Regra:** valor primeiro · lavanderia como consequência · nunca 50% off como porta de entrada  

---

## 1. A “loucura” reformulada (tese)

Hoje o funil típico de lavanderia é:

```
preciso lavar roupa → busco laundry → escolho marca → peço
```

WashFold vive nesse funil (Meta → book → Stripe).

A A7 pode construir **outro funil**, que o concorrente Kit genérico não pensa:

```
vou / estou em Orlando (LBV)
        ↓
pesquiso problema de VIAGEM (não de lavanderia)
        ↓
encontro ferramenta/guia útil da A7
        ↓
recebo valor (planner, checklist, mapa, dia de chuva…)
        ↓
entra no ecossistema (pixel · WhatsApp · save · email opcional)
        ↓
só ENTÃO vê lavanderia — quando a dor aparece
        ↓
ads de remarketing / WhatsApp / Maps reforçam
```

**Objetivo:** o hóspede “passou por nós” dias antes de precisar lavar. Quando a mala fedida aparecer, a A7 já é familiar — não um anúncio frio de $33 comforter.

Isso **não substitui** Guest Rescue / Google Ads laundry. **Alimenta** o topo e barateia o retarget.

---

## 2. Por que Lake Buena Vista é o laboratório perfeito

| Motivo | Evidência operacional / mercado |
|---|---|
| Vocês já atendem volume ali | Corredor Disney Springs / Hotel Plaza / resorts LBV |
| Busca alta + intenção turística | Packing, rest day, rain day, Disney Springs, hotel tips |
| Dor de roupa é **latente**, não dia 1 | Família 5–8 dias · chuva · kids · pack light → laundry mid-trip |
| WashFold quase não joga hotel guest | Dossiê/RE: overlap hotel guest baixo; ads = família/residente |
| Conteúdo “laundry LBV” já existe | `blog/laundry-lake-buena-vista.html` — bom, mas ainda **vende lavanderia no H1** |

**Insight:** páginas `laundry near X` capturam fundo de funil. O ecossistema captura **antes** — quando ainda estão packing ou no rest day.

---

## 3. O que o hóspede LBV realmente pesquisa (mapa de intenção)

### Fase A — 30 a 7 dias antes (planejamento)
| Query-tipo | Dor | Conteúdo “cavalo de Troia” |
|---|---|---|
| packing list Disney World / Orlando | medo de esquecer / overpack | **Pack Less Planner** (por #dias, kids, season) |
| what to pack Orlando June/rain | chuva + calor | Season packing cards |
| Disney Springs vs parks rest day | day off | Rest Day LBV Guide |
| hotel Plaza Blvd / LBV which hotel | escolha | Corridor explainer (neutro, útil) |
| groceries near Disney Springs | reabastecer | Mini map “essentials near LBV” |

### Fase B — chegada / dias 1–3 (ainda sem laundry)
| Query-tipo | Dor | Conteúdo |
|---|---|---|
| Disney Springs tonight / rain | plano B | Rain Day LBV playbook |
| early entry / park hopping tips | otimizar dia | Day rhythm card (leve) |
| where to buy ponchos / sunscreen cheap | custo | Local essentials (sem spam) |

### Fase C — mid-stay (dor de roupa nasce)
| Query-tipo | Dor | Conteúdo → ponte A7 |
|---|---|---|
| laundry at Disney resort cost / LaundryView | $3–3.50/ciclo + tempo | “Resort laundry vs pickup” (comparativo honesto) |
| laundry near Lake Buena Vista / Hotel Plaza | precisa agora | Páginas laundry LBV (já existem) + WA |
| pack light mid trip / dirty clothes hotel | mala | Soft CTA: pickup tomorrow morning |

### Fase D — pós / próximo trip
| Query-tipo | Dor | Conteúdo |
|---|---|---|
| review / next trip packing | retenção | Email/WA “save your packing list” |

**Regra editorial:** nas fases A–B o brand A7 é **assinatura discreta** (“by A7 · Orlando locals”), não hero “Wash & Fold $3.25/lb”.

---

## 4. Produto âncora: o Planner (MVP)

### Nome de trabalho
**Orlando Stay Kit — Lake Buena Vista Edition**  
(ou: *LBV Guest Planner · by A7*)

### O que é
Uma **ferramenta web leve** (1 página, mobile-first) que o hóspede usa de verdade:

1. Quantos dias · adultos · kids · mês da viagem  
2. Gera: packing list enxuta · sugestão de 1 rest day · alerta chuva (Jun–Sep) · “day 4 laundry check”  
3. Botões: **Save list** (WhatsApp pra si mesmo / copy) · **Add to phone**  
4. Pixel + event `planner_complete`  
5. Soft footer: “Local tip: if bags get heavy mid-stay, hotels around LBV can get pickup — ask us on WhatsApp.”  

**Não é um blog post.** É um utilitário. Utilitário cria hábito e retorno.

### Por que WhatsApp (não só email)
- Hóspede já vive no celular  
- A7 já fecha pedido no WA  
- “Manda a lista no meu WhatsApp” = opt-in quente sem formulário frio  
- Depois: sequence humana curta (não spam): dia −3 tip · mid-stay “rest day?” · só se engajar → laundry tip  

### Variantes depois do MVP LBV
| Edição | Público |
|---|---|
| LBV / Disney Springs corridor | Hotel Plaza, Wyndham, Hilton, Signia, resorts LBV |
| Kissimmee / 192 / Reunion | VR + família |
| I-Drive / Universal | outro corredor |
| Host edition | turnover checklist (aí sim B2B) |

---

## 5. Ecossistema completo (como “ele passou por nós”)

```
                    ┌─────────────────────────┐
   Google/SEO/IG    │  STAY KIT / GUIDES      │  ← valor (sem cara de lavanderia)
   Pinterest/TikTok │  Pack Less · Rain Day   │
                    │  Rest Day LBV · Maps    │
                    └───────────┬─────────────┘
                                │ pixel + WA save + optional email
                                ▼
                    ┌─────────────────────────┐
                    │  ECOSYSTEM GRAPH        │
                    │  visitor_id · hotel geo │
                    │  trip_dates · kids flag │
                    └───────────┬─────────────┘
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
     Retarget Meta        Google RLSA /          WhatsApp
     (prova + hotel)      brand search           soft tips
            │                   │                   │
            └───────────────────┼───────────────────┘
                                ▼
                    ┌─────────────────────────┐
                    │  GUEST RESCUE LP        │  ← agora sim lavanderia
                    │  /order + WA            │
                    └─────────────────────────┘
```

### Camadas de presença (onde “estar”)

| Camada | Como | Cara de lavanderia? |
|---|---|---|
| **SEO utilitário** | `/stay/lbv-pack-less`, `/stay/lbv-rain-day` | Não (brand footer) |
| **Planner tool** | Interactive generator | Não |
| **GBP posts** | Tips LBV (não só oferta) | Leve |
| **IG/TikTok/Reels** | Pack with me · rain day · suitcase | Não |
| **Pinterest** | Packing checklists (altíssimo intent viagem) | Não |
| **WA broadcast lists / CRM leve** | Só quem pediu a lista | Soft |
| **Meta/Google remarketing** | Quem usou planner | Sim, mas aquecido |
| **Páginas laundry LBV** | Fundo de funil | Sim |

---

## 6. Tom e ética (para não parecer manipulação barata)

| Fazer | Evitar |
|---|---|
| Conteúdo genuinamente útil mesmo se nunca lavar | Clickbait “Disney hack” falso |
| Comparar resort laundry ($3–3.50/ciclo + tempo) com honestidade | Falar mal de Disney laundry rooms |
| Brand discreto no topo do funil | Esconder que é A7 (transparência) |
| Opt-in claro no WA | Spam diário não pedido |
| Remarketing com prova/hotel | Remarketing agressivo no dia 1 do planner |

**Frase de posicionamento do ecossistema:**  
*“We help you enjoy Orlando. Laundry is optional — until you need it.”*

---

## 7. Como isso ataca WashFold (sem citar eles pro cliente)

| WashFold | A7 Ecosystem |
|---|---|
| Compra atenção fria com “family laundry / $33” | Ganha atenção quente com utilidade de viagem |
| Homepage genérica | Corredor LBV com contexto de hotel |
| Sem GBP forte | GBP + conteúdo local + reviews |
| Funil = preciso lavar agora | Funil = estou em Orlando → confio em vocês → lavo |
| Kit white-label em qualquer cidade | **Densidade Orlando/LBV** que Kit não replica fácil |

A vantagem não é “mais blog”. É **ownership do momento pré-dor** no corredor que vocês já operam.

---

## 8. Arquitetura de conteúdo LBV (cluster)

```
/stay/lake-buena-vista/                 ← hub (o “ecossistema” público)
  pack-less-planner                     ← TOOL (MVP)
  rain-day-guide
  rest-day-disney-springs
  hotel-plaza-corridor-tips             ← neutro, útil
  mid-trip-reset                        ← ponte suave p/ laundry
→ /blog/laundry-lake-buena-vista        ← fundo de funil (já existe)
→ /guest-laundry-orlando                ← Guest Rescue LP (plano ataque)
→ wa.me                                 ← conversão
```

**Interlink:** Stay Kit sempre linka suave para mid-trip reset; mid-trip linka para laundry LBV; laundry LBV CTA WA.

---

## 9. Tracking mínimo (pra ads “começarem depois”)

| Evento | Onde | Uso |
|---|---|---|
| `planner_start` | tool | audiência topo |
| `planner_complete` | tool | audiência quente |
| `list_to_whatsapp` | CTA | lead/ecosystem entry |
| `midtrip_view` | artigo ponte | intent laundry emergente |
| `wa_click` / `order_start` | Guest LP | fundo |
| `purchase` / pedido pago OS | verdade | north star |

**Audiências Meta/Google sugeridas:**
1. Planner completers (7–30d) → criativo hotel/suitcase  
2. Mid-trip viewers → oferta Express  
3. WA engagers sem pedido → prova + janela  
4. Exclusão: já pediu pago (não irritar)

---

## 10. Plano de construção (como eu faria)

### Semana 1 — Blueprint → MVP copy
- [ ] Travar nome + URL hub `/stay/lake-buena-vista/`
- [ ] Wireframe Pack Less Planner (inputs + output + CTAs)
- [ ] 1 Rain Day + 1 Rest Day draft (EN; PT/ES depois)
- [ ] Pixel events spec
- [ ] Tom: “local Orlando helpers”, não “laundry company”

### Semana 2 — Ship MVP
- [ ] Tool live (estático + JS leve; sem app)
- [ ] Hub LBV no ar
- [ ] GTM events
- [ ] WhatsApp template: “Here’s your packing list…”
- [ ] Link a partir de GBP post + 1 Reel packing

### Semana 3 — Distribuição sem cara de ad
- [ ] SEO titles para packing/rain/rest (não laundry)
- [ ] Pinterest 10 pins checklist
- [ ] 5 Reels/TikToks (pack less, rain day, suitcase)
- [ ] Audiência remarketing ligada (ainda criativo soft)

### Semana 4 — Abrir a ponte laundry
- [ ] Mid-trip reset page
- [ ] Remarketing “dirty clothes / pack light” → Guest Rescue
- [ ] Medir: planner→WA→pedido pago (mesmo que volume baixo no mês 1)

### Métrica de sucesso do ecossistema (90 dias)
| KPI | Meta inicial |
|---|---|
| Planner completes | baseline → crescimento semanal |
| % completes → WA save | ≥25% |
| % ecosystem visitors → laundry page | ≥10% |
| Pedidos pagos atribuídos a ecosystem (UTM/first touch) | rastrear; meta qualitativa mês 1–2 |
| CAC guest com touch ecosystem vs cold Meta | ecosystem deve ser menor no tempo |

---

## 11. Exemplos de peças (para sentir o tom)

### Pack Less — headline (sem lavanderia)
> Pack for 8 days with 4 days of clothes.  
> Lake Buena Vista edition — built for park heat, pool, and surprise rain.

### Soft bridge (dia 4 do planner output)
> Mid-trip tip: if the dirty bag is winning, you don’t have to spend a rest day in a laundry room. Locals can help — message when you need.

### Rain Day — valor puro
> Storm at 2pm? Disney Springs, resort pool nap, or a long lunch on Hotel Plaza — here’s a no-park playbook for LBV.

---

## 12. O que NÃO fazer nessa jogada

- Transformar o planner em landing de preço $/lb  
- Comprar tráfego frio só para packing list sem remarketing setup  
- Copiar blogs Disney genéricos sem ângulo LBV operacional  
- Prometer “free pickup everywhere”  
- Construir app nativo antes do utilitário web validar  

---

## 13. Decisão recomendada

**Sim — montar o planner.**  
Começar **só Lake Buena Vista** (onde já há demanda real).  
Produto âncora = **Pack Less Planner**.  
Ecossistema = hub Stay Kit + 2 guias (rain/rest) + ponte mid-trip + remarketing.  
Conversão continua Guest Rescue / WA — o planner só esquenta o grafo.

### Próximo artefato de implementação
1. Wireframe + copy EN do Pack Less Planner  
2. Estrutura HTML `/stay/lake-buena-vista/`  
3. Spec de eventos GTM  
4. 5 ganchos de Reel/Pinterest  

Quando autorizar, eu baixo isso em páginas reais no repo.
