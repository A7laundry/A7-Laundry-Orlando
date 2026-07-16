# A7 Laundry — Plano de Páginas Geo (bairro por bairro)

> **Por quê:** o líder do orgânico em Orlando (**The Laundry Room**) domina por **volume de páginas geo** — uma página por bairro/cidade ("comforter cleaning in Tangerine / Clermont / Orlo Vista / Meadow Woods…"). É a alavanca #1 pra travar o topo local. Esta é a resposta da A7.

## O que JÁ existe (5 geo pages — boa qualidade)

Todas com schema local rico (LocalBusiness + City/Place + FAQPage + Article + BreadcrumbList), ~1.500–1.700 palavras, title otimizado, CTA WhatsApp com texto pré-preenchido do bairro:

| Bairro | URL | Foco |
|---|---|---|
| Kissimmee | `/blog/laundry-kissimmee` | vacation rentals US-192, near Disney |
| Champions Gate | `/blog/laundry-champions-gate` | resort communities + Davenport |
| International Drive | `/blog/laundry-international-drive-orlando` | hotéis/resort corridor |
| Windermere | `/blog/laundry-windermere-fl` | luxury homes |
| Reunion Resort | `/blog/reunion-resort-laundry-service` | vacation home turnovers |

## Silo de links (corrigido 2026-07-15)

- ✅ **Hub → filhos:** `service-areas.html` agora linka pras 5 geo pages (era o buraco: o hub não apontava pros filhos).
- ✅ **Canonical fix:** 8 páginas de serviço tinham `canonical`/`og`/schema apontando pro `a7laundry.vercel.app` (dividia autoridade) → corrigido pra `a7laundry.com`.
- ⏳ **A fazer:** interlinking horizontal (cada geo page linkar pras 2-3 vizinhas) + garantir todas apontando pro `orlando-vacation-rental-laundry-guide` (hub de conteúdo) e money page.

## Gaps prioritários (criar — ordem de valor)

Baseado em valor de vacation rental + o que o `service-areas.html` já cita sem página dedicada:

| Prioridade | Bairro | Por quê |
|---|---|---|
| 🔴 1 | **Davenport / Four Corners** | Epicentro de vacation rentals (Solterra, Windsor Island, ChampionsGate belt) |
| 🔴 2 | **Lake Buena Vista** | Disney area — altíssima densidade de resorts/rentals |
| 🟠 3 | **Celebration** | Afluente, Disney-adjacent, casas + rentals |
| 🟠 4 | **Lake Nona** | Residencial afluente (wash & fold recorrente) |
| 🟡 5 | **Dr. Phillips** | Residencial premium (Restaurant Row) |
| 🟡 6 | **Clermont** | Crescendo, vacation + residencial |
| 🟡 7 | **Winter Garden** | Residencial afluente |
| 🟡 8 | **Winter Park** | Residencial premium |

## Template de página geo (molde: `laundry-kissimmee.html`)

- **URL:** `/blog/laundry-<bairro>` (ou `/laundry-<bairro>` via rewrite pra bairros-âncora)
- **Title:** `Laundry Pickup & Delivery in <Bairro>, FL — Wash & Fold [Near <landmark>] | A7 Laundry`
- **Meta:** descrição com a query + benefício + WhatsApp
- **Schema:** LocalBusiness + City/Place + FAQPage (3-5 Q) + Article + BreadcrumbList
- **Conteúdo (~1.500w):** intro do bairro → serviços (wash&fold, comforter, vacation turnover) → resorts/comunidades locais nomeadas → como funciona → preços (tourist $3.25 / express $3.95 / comforter $35-50) → FAQ local
- **Links (silo):** → money page · → `/service-areas` · → 2-3 geo vizinhas · → vacation guide
- **CTA:** WhatsApp `wa.me/14076708839` com texto pré-preenchido do bairro
- ⚠️ **Sem review inventado. Canonical em `a7laundry.com` (nunca vercel.app).**

## Como escalar (produção)

1. Duplicar `laundry-kissimmee.html` → trocar bairro, landmarks, comunidades, FAQ, schema, CTA.
2. Adicionar ao `sitemap.xml` + rewrite no `vercel.json` se URL curta.
3. Linkar no `service-areas.html` (hub) + nas 2 geo vizinhas.
4. Solicitar indexação no GSC.
5. Emparelhar com carrossel de feed do bairro quando fizer sentido (ver `CONTENT-ENGINE.md`).

## Meta

Cobrir os 8 gaps → **13 geo pages** cobrindo o cinturão de vacation rental + residencial afluente. Isso é o que compete de frente com o volume geo do The Laundry Room, no ângulo premium/vacation onde a A7 já tem tração (é a única posicionada como luxury concierge).
