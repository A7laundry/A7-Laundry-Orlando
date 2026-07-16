# A7 Laundry — Growth Playbook (Competitor Audit + AI Search)

> Síntese de 2 auditorias (2026-07-16): (1) audit competitivo do líder **The Laundry Room** e (2) estratégia de **busca por IA (GEO/AEO)**. As duas convergem: nossas geo pages premium são a resposta aos dois.

---

## PARTE 1 — O que o líder (The Laundry Room) faz, e o que copiar

**Stack:** WordPress + Yoast SEO + Curbside Laundries (booking SaaS). **~1.150–1.300 páginas indexadas**, ~1.000+ **programáticas** (matrix service × location).

**A arma deles — matrix geo em escala.** Padrões de URL:
- `/residential-service/wash-and-fold-laundry-service-in-{area}-fl/` (~148 áreas)
- `/commercial-service/comforter-cleaning-service-in-{area}-fl/` (~160) ← **sobrepõe nosso comforter**
- `/commercial-service/blanket-cleaning-service-in-{area}-fl/` (~130)
- `/service-areas/laundry-services-{area}/` e `/laundry-services-{ZIP}/` (~233, **ZIP-level!**)
- Spanish `self-laundry` + páginas de raio por coordenada
- **Dimensões:** bairro × cidade × condado × ZIP — esgotam toda granularidade geo. Cobrem Kissimmee, Four Corners, Davenport, ChampionsGate, Celebration, LBV, Disney/Universal + ~80 ZIPs.

**Por que dominam:** superfície programática gigante em long-tail local + blog buyer-intent (54 posts) que funila pra geo pages + internal linking denso + 4 lojas físicas + reviews Google.

**Fraquezas deles (nossa brecha):**
1. **Conteúdo thin/boilerplate** — só trocam o nome do bairro, zero detalhe local real
2. **Sem FAQ/FAQPage schema na maioria das geo pages**
3. **Sem AggregateRating on-page** (sem estrelas no rich snippet)
4. **Zero WhatsApp** — form-first + telefone (nossa vantagem estrutural)
5. **Storytelling turístico fraco** — tratam vacation rental como qualquer vertical comercial
6. **Preço budget** ($1.95–2.25/lb) — deixam o premium/concierge aberto

**Wedge A7 (não competir em breadth/preço):** DEPTH em comforter + vacation rental · corredor turístico · **WhatsApp instantâneo** · bilíngue · premium.

### Táticas a copiar (priorizadas)
- **P1 — Matrix geo com conteúdo RICO** (bate o thin deles). Não escalar 1.000 no dia 1 — ganhar **30–50 geos de alta intenção** do corredor turístico primeiro: Kissimmee, Four Corners/Davenport, ChampionsGate, Reunion, Celebration, LBV, Windsor Hills/Palms, Storey Lake, Solterra, Windermere, Lake Nona.
- **P2 — Cada geo com FAQ+FAQPage + LocalBusiness + AggregateRating + review** → rich snippets que eles não têm.
- **P3 — ZIP pages** pros ZIPs turísticos (34747, 34746, 34741, 33896, 32836, 32821, 32830, 32819).
- **P4 — WhatsApp como CTA primário** (blind spot deles) — já é nosso padrão.
- **P5 — Bilíngue** (ES + PT) pra host/turista internacional. *(Nota: feed orgânico = EN; isto é SEO on-site, escopo diferente.)*
- **P6 — Blog buyer-intent** funilando (ex.: "you're getting ripped off using Disney hotel laundry", "Airbnb turnover Orlando", "down comforter care").
- **P7 — Produtizar:** "Linen Kits" por propriedade + promo 1º pedido + funil "Quote pra portfólio" (property managers).
- **P8 — Hygiene técnica:** sitemap index, schema auto, breadcrumbs, title `{Service} in {Location}, FL | A7 Laundry`, internal linking blog↔geo↔hub.

---

## PARTE 2 — Busca por IA (GEO/AEO)

**Contexto:** a IA recomenda só **~1,2% dos negócios locais no ChatGPT** (vs ~36% no Google 3-pack). Espaço quase vazio. **O a7laundry.com já recebeu 4 sessões de ChatGPT** (GA4, últimos 7d) — a onda já começou.

**A7 já forte:** LocalBusiness+LaundryService schema · **FAQPage em ~44 páginas** (182 Q&A) · robots permite crawlers · sitemap completo.

**Gaps críticos:**
1. **Sem `sameAs`** (link schema→Google Business/Yelp/Instagram) — maior miss; é como a IA confirma que você é real
2. **Sem `llms.txt` nem seção AI-bots no robots.txt**
3. **`aggregateRating` inconsistente** (4.9/527, 5/2500, /327) — contradição = penalidade + risco de review inventado
4. 🔴 **Preço desatualizado no LIVE** ($2.90/$3.20) vs repo ($3.25/$3.95) — **deploy atrasado**
5. Sem `geo`/GeoCoordinates + `serviceArea` GeoCircle no schema
6. **A7 ausente do Yelp "best laundry Orlando"** (lista que a IA cita)

**Plano IA:**
- **Quick wins técnicos:** `sameAs` + `aggregateRating` real + `geo`/`serviceArea` no schema da home/money · `llms.txt` · robots pros AI-bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot, Google-Extended) · refrescar `lastmod`
- **Conteúdo:** answer-first no 1º parágrafo (Princeton: +115% citação) · tabelas de comparação "best of" · FAQ com as perguntas literais ("same-day laundry near Disney?")
- **Off-page (maior alavanca local):** **Google Business Profile** + reviews Yelp/TripAdvisor (meta 4.3★+) · presença Reddit (r/orlando, r/DisneyWorld — Perplexity mina isso) · entrar nas listicles "best laundry Orlando"

---

## PARTE 3 — Plano unificado (as duas convergem)

Nossas **geo pages premium (v3)** já são a resposta aos dois audits: matrix rica (bate o thin do TLR) + schema/FAQ/WhatsApp (bom pra IA). Falta:

| Prioridade | Ação | Quem |
|---|---|---|
| 🔴 P0 | Fix preço no live (redeploy $3.25/$3.95) | @devops/Dennis |
| 🟢 P1 | Quick wins de schema (sameAs, aggregateRating real, geo/serviceArea) + llms.txt + robots AI-bots | Claude |
| 🟢 P1 | Answer-first no topo das money/service/geo pages | Claude |
| 🟠 P2 | Escalar geo matrix premium — 30–50 geos do corredor turístico + ZIP pages | Claude |
| 🟠 P2 | Google Business Profile + Yelp + reviews | Dennis |
| 🟡 P3 | Bilíngue (ES/PT) das geo/vacation pages · blog buyer-intent · Reddit/listicles | Claude + Dennis |

**Não competir com o TLR em preço ou volume bruto. Vencer por profundidade premium + WhatsApp + IA-first — onde eles são estruturalmente fracos.**
