# A7 Laundry Orlando — Prompt Estratégico: Página Central + Planos de Assinatura

> **Agente recomendado:** General-purpose agent com foco em product strategy + copywriting + web design
> **Fase:** Planejamento de produto, pricing e criação da página central
> **Output esperado:** Página HTML central (index.html) com 3 planos de assinatura por bag

---

## 1. CONTEXTO DO PROJETO

### O que já existe

A7 Laundry Orlando possui 5 landing pages de serviços especializados, todas em HTML/CSS/JS estático, deploy via GitHub Pages:

| # | Página | Público-alvo | Oferta principal | Cor/Tema | Preço |
|---|--------|-------------|------------------|----------|-------|
| 1 | `carpet-cleaning.html` | Homeowners com carpete, famílias com pets | 1st room FREE, 3 rooms $107 | Amber/Gold | $45-$65/room |
| 2 | `shoe-cleaning.html` | Sneakerheads, jovens 18-35 | Buy 2 Get 1 FREE | Coral/Red | $35-$85/par |
| 3 | `upholstery-cleaning.html` | Homeowners, famílias | FREE Scotchgard ($50 value) | Purple/Violet | Incluído no serviço |
| 4 | `vacation-rental.html` | Hosts Airbnb/VRBO, property managers | 1st cleaning FREE | Teal/Emerald | A partir de $149 |
| 5 | `carpet-campaign/` | SEO campaign - carpet cleaning | Campanha com GBP setup | Campanha separada | — |

### Padrões compartilhados entre as LPs
- **Framework de copy:** PAS (Problem-Agitation-Solution) + Hormozi Value Stack
- **CTA principal:** WhatsApp (407-787-8590)
- **Idiomas:** EN / PT-BR / ES (language switcher)
- **Elementos de conversão:** Live viewers widget, scroll progress bar, urgency bar com countdown, FAQ accordion
- **Membership:** Todas mencionam "A7 Members Save 25% on Every Cleaning"
- **Stack técnico:** HTML/CSS/JS puro, Google Fonts (Inter + Space Grotesk), GitHub Pages
- **Assets:** `a7-logo.jpg`, `LOGO HORIZONTAL-01.png`
- **Tom:** Direto, urgente, value-oriented, com provas sociais (reviews, números)

---

## 2. PESQUISA DE MERCADO — ORLANDO, FL

### 2.1 Cenário competitivo (Laundry Subscription / Bag Service)

**Nenhum grande player nacional domina Orlando ainda.** Tide Cleaners NÃO opera em Orlando (só South FL). O mercado é fragmentado entre apps gig e pequenos locais.

| Concorrente | Modelo | Preço | Diferencial |
|-------------|--------|-------|-------------|
| Poplin (ex-SudShare) | Per-pound, gig workers | $1/lb standard, $2/lb express | Mínimo $30, sem assinatura |
| hampr | Per-load, app | $39/ano membership + pay-as-you-go | Eco bags fornecidas, ~$1/lb |
| Rinse | Subscription per-bag | $1.39/lb (subscription), $2.50/lb (avulso) | Bags com rollover |
| Bolt Laundry | Per-pound | $1.99/lb (weekly), $2.25/lb (avulso) | Hypoallergenic |
| Push Laundry | Per-pound | $1.99/lb (2-day), $2.60/lb (next-day) | Free pickup/delivery |
| HappyNest | Per-bag flat | $32.95-$34.95/bag | All-inclusive |
| WashFoldGo (Tampa) | Subscription bags/mês | 2 bags $109/mês, 4 bags $210/mês, 8 bags $399/mês | Mais próximo benchmark |

### 2.2 Dados demográficos Orlando Metro

- **População metro:** ~2.94 milhões (MSA Orlando-Kissimmee-Sanford)
- **Crescimento:** 2.7% em 2024 — **#1 entre as 30 maiores metros dos EUA**
- **+267K novos moradores desde 2020** (65% imigração internacional)
- **Hispânicos/Latinos:** 35.6% da população (crescendo 11.9%)
- **Brasileiros no metro:** ~66,000 — **maior concentração de brasileiros na FL**
- **Short-term rentals ativos:** 15,000+ (Airbnb/VRBO), 65% ocupação, ~237 noites/ano
- **UCF:** ~72,000 estudantes (uma das maiores universidades dos EUA)

### 2.3 Tamanho do mercado

- **Mercado US de laundry services:** $12.9-$16.6 bilhões (2025)
- **Crescimento:** 4.8-6.3% CAGR até 2030-2035
- **Gasto médio por household:** ~$1,500/ano (total laundry costs)
- **Subscribers regulares gastam:** $200-$400/mês

### 2.4 Segmentos-alvo prioritários

| Prioridade | Segmento | Por que? | Como comunicar |
|-----------|----------|----------|----------------|
| **#1** | Busy professionals (25-45) | Renda $50K+, 45+ hrs/semana, valorizam tempo | "Stop spending 5+ hrs/week on laundry" |
| **#2** | Famílias com crianças | Volume alto, recorrência garantida, LTV alto | "Your kids make the mess. We make it disappear." |
| **#3** | Vacation rental hosts | 15K+ listings, turnover constante, B2B play | "Guest-ready linens, every time" |
| **#4** | Comunidade brasileira (66K) | Cultural trust, rede forte via WhatsApp/igreja, boca-a-boca rápido | "Cuidado brasileiro para seu lar em Orlando" |
| **#5** | College students (UCF 72K) | Volume previsível, sensíveis a preço, viral potential | Plano entry-level, TikTok/Instagram |

### 2.5 Pain points do consumidor

1. **Tempo:** Americano médio gasta ~240 horas/ano lavando roupa
2. **Volume:** Famílias produzem pilhas infinitas
3. **Preço imprevisível:** Per-pound gera "sticker shock" — bag resolve isso
4. **Confiança:** Entregar roupas pessoais a desconhecidos
5. **Qualidade inconsistente:** Danos, dobras erradas, detergente errado
6. **Inconveniência:** Ir/vir da lavanderia, esperar, carregar

### 2.6 Canais de comunicação efetivos

1. **WhatsApp** (já usado pela A7 — perfeito para comunidade brasileira e hispânica)
2. **Google Business Profile** (46% das buscas Google têm intenção local)
3. **Local SEO / Landing Pages** (já existem — expandir)
4. **Facebook/Instagram Ads** (target por zip code, idade 25-55)
5. **Nextdoor** (alto fator confiança para serviços de vizinhança)
6. **Referral program** ("Give $10, Get $10" ou "Free bag per referral")
7. **Parcerias:** Grupos de hosts Airbnb, property managers, UCF housing, academias

---

## 3. DEFINIÇÃO DOS 3 PLANOS DE ASSINATURA

### Modelo: Subscription por BAG (flat-rate, previsível, sem surpresas)

Baseado na pesquisa competitiva e no posicionamento de entrada a $59.90:

| | **ESSENTIALS** | **FAMILY** (Most Popular) | **PREMIUM** |
|--|---------------|--------------------------|-------------|
| **Preço mensal** | $59.90/mês | $109.90/mês | $179.90/mês |
| **Bags/mês** | 1 XL bag (~15 lbs) | 3 XL bags (~45 lbs) | 5 XL bags (~75 lbs) + dry cleaning |
| **Per-pound equiv.** | ~$3.99/lb | ~$2.44/lb | ~$2.40/lb |
| **Turnaround** | 48 horas | 24 horas | Same-day priority |
| **Pickup/Delivery** | 1x/semana (dia fixo) | 2x/semana (dias flexíveis) | Unlimited on-demand |
| **Extras incluídos** | Eco bag fornecida, detergente premium | + Stain treatment, fabric softener | + Dry cleaning items, garment bags, steam press |
| **Rollover** | Não | Sim (até 2 bags) | Sim (unlimited) |
| **Desconto serviços A7** | 10% off carpet/upholstery/shoes | 20% off todos serviços A7 | 25% off + priority scheduling |
| **Ideal para** | Singles, estudantes, casais | Famílias 2-4 pessoas | Famílias grandes, hosts, profissionais |
| **Add-on bag avulsa** | $49.90 | $39.90 | $34.90 |
| **Compromisso** | Mensal (cancela quando quiser) | Mensal (cancela quando quiser) | Mensal (cancela quando quiser) |

### Diferencial competitivo do pricing:
- **HappyNest** cobra $32.95-$34.95/bag mas SEM assinatura estruturada
- **WashFoldGo** (Tampa) cobra $109/mês para 2 bags — A7 oferece 3 bags por $109.90
- **Poplin** cobra $1/lb mas é gig worker sem controle de qualidade
- **A7 combina:** preço competitivo + qualidade artesanal brasileira + serviços complementares (carpet, shoes, upholstery)

---

## 4. POSICIONAMENTO E MENSAGEM CENTRAL

### Tagline principal
**"Your Laundry. Our Care. One Bag at a Time."**
PT-BR: **"Sua Roupa. Nosso Cuidado. Uma Bag por Vez."**
ES: **"Tu Ropa. Nuestro Cuidado. Una Bolsa a la Vez."**

### Value proposition (Hormozi Stack)
> **Pare de gastar 5+ horas por semana lavando roupa.**
> Encha a bag. Deixe na porta. Receba de volta limpa, dobrada e perfumada.
> Planos a partir de **$59.90/mês** — sem contrato, sem surpresas, sem stress.

### Mensagens por segmento

| Segmento | Headline | Sub-headline |
|----------|----------|-------------|
| Professionals | "Get 5 Hours of Your Week Back" | "Fill a bag. Leave it out. Get it back fresh." |
| Families | "Your Kids Make the Mess. We Make It Disappear." | "3 XL bags, 45 lbs of laundry handled — $109.90/mo" |
| Vacation Hosts | "Guest-Ready Linens on Every Turnover" | "Same-day priority + 25% off all A7 services" |
| Brazilians | "Cuidado Brasileiro Para Seu Lar em Orlando" | "A mesma qualidade e carinho — agora na sua lavanderia" |
| Students | "Laundry Done. More Time for Everything Else." | "Starting at $59.90/mo. No commitment." |

---

## 5. ESTRUTURA DA PÁGINA CENTRAL (index.html)

### Arquitetura proposta

```
index.html (PÁGINA CENTRAL — A7 Laundry Hub)
├── Header (logo + nav para serviços + CTA WhatsApp)
├── Urgency bar (oferta de lançamento)
├── Hero section
│   ├── Headline: "Your Laundry. Our Care. One Bag at a Time."
│   ├── Sub: value proposition
│   ├── CTA: "Choose Your Plan" (scroll to pricing)
│   └── Trust badges (reviews, 2000+ families, same-day)
├── Problem section (PAS framework)
│   └── "You Spend 240+ Hours a Year on Laundry"
├── How It Works (3 steps: Fill → Schedule → Enjoy)
├── Pricing section (3 plan cards com toggle mensal/anual)
│   ├── Essentials $59.90
│   ├── Family $109.90 (highlighted)
│   └── Premium $179.90
├── Services hub (cards linkando para cada LP)
│   ├── Carpet Cleaning
│   ├── Shoe Cleaning
│   ├── Upholstery Cleaning
│   └── Vacation Rental
├── Social proof (reviews, before/after)
├── Guarantee section (100% satisfaction)
├── FAQ
├── Service area map
├── Final CTA (WhatsApp)
└── Footer
```

### Design system
- **Cor primária:** Azul (#2563eb) — transmite confiança, profissionalismo, limpeza
- **Cor secundária:** Amber/Gold (#f59e0b) — consistência com LPs existentes
- **Fonte:** Inter (já usada em todas as LPs)
- **Dark mode hero** (consistente com LPs existentes)
- **Responsivo:** Mobile-first (maioria do tráfego WhatsApp vem de mobile)
- **Idiomas:** EN / PT-BR / ES (language switcher como nas outras LPs)

---

## 6. INSTRUÇÃO PARA O AGENTE

### Prompt para o agente de desenvolvimento:

```
Crie a página central (index.html) para A7 Laundry Orlando seguindo estas especificações:

CONTEXTO:
- A7 Laundry é uma lavanderia brasileira em Orlando, FL que oferece serviço
  de assinatura por bag + serviços especializados (carpet, shoe, upholstery, vacation rental)
- Deploy: GitHub Pages (HTML/CSS/JS puro, sem frameworks)
- CTA principal: WhatsApp (407-787-8590)
- Idiomas: EN / PT-BR / ES com language switcher
- Público: busy professionals, famílias, hosts Airbnb, comunidade brasileira, estudantes

PLANOS DE ASSINATURA:
1. ESSENTIALS — $59.90/mês (1 XL bag, 48h turnaround, 1x/semana pickup)
2. FAMILY — $109.90/mês (3 XL bags, 24h turnaround, 2x/semana) [MOST POPULAR]
3. PREMIUM — $179.90/mês (5 XL bags + dry cleaning, same-day, unlimited pickup)

DESIGN:
- Mobile-first, dark hero, consistent com LPs existentes
- Cor primária azul (#2563eb), secundária amber (#f59e0b)
- Font: Inter + Space Grotesk
- Elementos: scroll progress, urgency bar, live viewers, FAQ accordion
- Copy framework: PAS + Hormozi Value Stack

SEÇÕES OBRIGATÓRIAS:
1. Hero com headline trilíngue e CTA
2. Problem/agitation (240 hrs/year on laundry)
3. How it works (3 steps)
4. Pricing cards (3 planos com toggle mensal)
5. Services hub (links para as 4 LPs existentes)
6. Social proof (reviews)
7. Guarantee
8. FAQ
9. Service area
10. Final CTA WhatsApp

REFERÊNCIAS DE COPY:
- "Your Laundry. Our Care. One Bag at a Time."
- "Fill a bag. Leave it out. Get it back fresh."
- "Stop spending 5+ hours a week on laundry."
- "One bag, one price. No surprises."

ARQUIVOS EXISTENTES NO PROJETO:
- carpet-cleaning.html, shoe-cleaning.html, upholstery-cleaning.html, vacation-rental.html
- a7-logo.jpg, LOGO HORIZONTAL-01.png
- WhatsApp: https://wa.me/14077878590
```

---

## 7. PRÓXIMOS PASSOS

1. **Agora:** Aprovar planos e posicionamento
2. **Fase 2:** Criar index.html (página central)
3. **Fase 3:** Atualizar navegação de todas as LPs para linkar ao hub central
4. **Fase 4:** Landing page específica para comunidade brasileira (PT-BR first)
5. **Fase 5:** Google Ads + Facebook Ads campaigns
6. **Fase 6:** Referral program page

---

*Documento gerado em 2026-02-26 com base em pesquisa de mercado real do ecossistema de Orlando, FL.*
