# WashFold Orlando — Inteligência competitiva expandida

**Fontes:** dossiê A7 de 09/set/2026 (16:15–16:35 EDT) + revalidação pública em 10/set/2026.  
**Concorrente:** [washfoldorlando.com](https://www.washfoldorlando.com/) · [@washfoldorlando](https://www.instagram.com/washfoldorlando/) · Facebook [Wash Fold Orlando](https://www.facebook.com/p/Wash-Fold-Orlando-61592641570081/)  
**Uso:** material base para engenharia reversa vs A7 (lacunas, brechas, contra-posicionamento).  
**Limite ético:** research-only — não copiar criativos, marcas ou assets.

---

## 0. Veredito em uma página

WashFold Orlando **já opera como máquina transacional**, não como landing. Stack: **WashFoldKit** (white-label) + **Next.js/Vercel** + **Stripe** + **Supabase** + **Twilio SMS** + **Meta Pixel** (PageView confirmado).

**Força atual:** checkout self-service completo, preço residencial agressivo, 6 anúncios Meta novos (3–9/set), 21 ZIPs no sitemap, oferta Airbnb no criativo.

**Fraqueza atual:** autoridade orgânica quase zero, prova social fraca, SEO programático raso, mensagens promocionais desalinhadas, **sem GBP/Google Reviews detectáveis**, sem telefone/WhatsApp público, homepage/meta ainda “comforter $33 any size” enquanto o booking cobra **por tamanho**, domínio duplicado `comforterwash.com`, histórico de marca/plataforma anterior (WashFold Clean / Curbside) ainda em índices de busca.

**Nível de ameaça (dossiê, mantido):** Meta alto · checkout alto · SEO local médio · autoridade baixa · Airbnb médio · hotel guest baixo–médio.

---

## 1. Tudo que o dossiê já trouxe (inventário 100%)

### 1.1 Identidade e cronologia
| Item | Dado do dossiê |
|---|---|
| Domínio | washfoldorlando.com |
| Registro RDAP | 29/nov/2024 |
| Plataforma | “Powered by WashFoldKit.com” |
| Infra | Next.js em Vercel |
| Facebook Page ID | 61592641570081 |
| Endereço no FB | 1359 E Vine St, Orlando, FL **34744** (na prática Kissimmee ZIP) |
| Relação endereço | Mesmo endereço listado para **Clean Laundry** (lavanderia física) — sugere uso operacional/parceria, **não prova** propriedade societária |
| Instagram (09/set) | 4 posts · 22 seguidores · 0 following |
| Facebook (09/set) | 8 seguidores |

### 1.2 Funil de aquisição paga (Meta Ad Library)
| Ad Library ID | Início | Ângulo |
|---|---|---|
| 1095439393442267 | 03/set/2026 | Tempo com família; pickup → wash → fold → delivery |
| 1667228144820540 | 04/set/2026 | Cobertura: Lake Nona, Hunters Creek, Celebration, Winter Park, Baldwin Park, Downtown, College Park, Dr. Phillips, Windermere |
| 1048719811278394 | 05/set/2026 | Vídeo 10s; agendamento Wash & Fold |
| 1627114758970583 | 08/set/2026 | “We PickUp – We Wash – We Fold – We Deliver” |
| 1413859370715903 | 08/set/2026 | Mesmo eixo criativo, múltiplas versões |
| 1774647257108809 | 09/set/2026 | WashFold Orlando + **Airbnb** |

**Oferta Airbnb (criativo do Owner):**  
> The laundry solution for Airbnb hosts. First order half price off. Free pickup & delivery. Use code: **HALFOFF**.

**Destino do ad Airbnb:** homepage genérica — **sem** LP Airbnb no sitemap, **sem** UTM além de `fbclid`.

### 1.3 Homepage / posicionamento
- “Your Laundry. Done.”
- Pickup & delivery grátis
- Funil visual: You order → We pick up → We wash & fold → We deliver
- CTA agendamento · ZIP checker · preços · serviços · depoimentos · FAQ · **EN/ES**
- Público dominante: **residentes/famílias** (não host, não hotel guest)

### 1.4 Reserva / checkout (confirmado no dossiê)
- US$ **2,69/lb** one-time
- US$ **2,55/lb** recurring
- Mínimo **18 lb**
- Pré-autorização ~**US$ 60,53** / 1 bag
- Cupom + gift card
- Detergente / extras
- Google Places no endereço
- Stripe Embedded Checkout (live)
- Cobrança ajustada após pesagem
- Consentimento SMS
- Foto da bag na coleta
- Conta do cliente + tracking

### 1.5 Retenção / receita
- Recurring weekly/biweekly
- Planos mensais **pausados** para novos
- Wash Only (entrada mais barata)
- Comforter Wash (por item/tamanho)
- Gift cards
- Conta do cliente
- Comercial por orçamento
- Cross-sell entre serviços no booking

### 1.6 Cluster SEO (sitemap = 29 URLs)
- 1 homepage
- 3 serviços: `/services/wash-fold` · `/services/comforter-wash` · `/services/wash-only`
- 21 páginas ZIP
- `/service-areas` · `/commercial` · `/faq` · `/pricing`

**Limitações citadas:** sem blog; ZIPs template; sem canonical/JSON-LD/OG/Twitter observados; `comforterwash.com` duplica marca; URL antiga `/service-areas/winter-springs-area` → 404; lastmod do sitemap “agora”; title da home dominado por comforter.

### 1.7 Ofertas públicas simultâneas (desalinhamento)
Dossiê aponta ≥3 mensagens promo ao mesmo tempo; cupom **HALFOFF** não validado em transação real.

### 1.8 Tech / instrumentação
**Confirmado:** Next.js · Vercel · WashFoldKit · Stripe · Supabase client · Google Places · Meta Pixel `2496495747524401` · PageView · SMS/tracking declarados.  
**Não confirmado:** ViewContent / Lead / InitiateCheckout / Purchase · CAPI · GA4 · Google Ads tag · UTMs por ad · atribuição ad→order→revenue.

### 1.9 Sobreposição com A7
**Alta:** comforter · P&D · Orlando/Kissimmee/Celebration/Dr. Phillips/Lake Nona · Airbnb/VR · wash & fold residencial · Meta vídeo/imagem.  
**Baixa:** hotel guest · Bell/Front Desk · urgência turística · Express 8h · WhatsApp concierge · idiomas além EN/ES · prova operacional (hotéis/SLA).

### 1.10 Resposta recomendada no dossiê (para A7)
1. Não guerra de 50% / HALFOFF  
2. Hub residencial (comforter + bundle)  
3. Separar LP Airbnb de resident  
4. Prova operacional como barreira  
5. Monitoramento semanal enxuto  

---

## 2. Revalidação 10/set/2026 — o que confirmamos ao vivo

| Afirmação do dossiê | Status 10/set |
|---|---|
| Domínio registrado 29/nov/2024 | ✅ RDAP Verisign: `2024-11-29T23:21:36Z`; registrar GoDaddy; expires `2026-11-29` |
| Next.js + Vercel | ✅ headers `server: Vercel`, `x-powered-by: Next.js`, deploy id `dpl_6PDkJdwxujxFQ4JaP7JfMhWXW5Z4` |
| Powered by WashFoldKit | ✅ rodapé em todas as páginas |
| Sitemap 29 URLs / 21 ZIPs | ✅ listados abaixo |
| Pixel 2496495747524401 + PageView | ✅ presente; Purchase/Lead/InitiateCheckout **não** no HTML |
| Preços 2.69 / 2.55 / 18 lb / preauth 60.53 | ✅ `/book/wash-fold` |
| Monthly plans paused | ✅ `/pricing` |
| comforterwash.com = mesma marca | ✅ homepage idêntica (mesmo title/meta/pixel) |
| FB page 61592641570081 | ✅ `Wash Fold Orlando \| Orlando FL` |
| Meta Ad Library inventário | ⚠️ bloqueado por 403 neste ambiente; **manter números do dossiê** até rechecagem humana |
| Instagram 4 posts / 22 followers | ⚠️ IG exige login (429); **manter dado do dossiê** |

### DNS / hospedagem
- `washfoldorlando.com` → Vercel DNS (`7580b3dc94992b27.vercel-dns-016.com`) · A `216.150.1.1`
- `comforterwash.com` → **mesmo** padrão Vercel / mesmo IP footprint

---

## 3. O que o dossiê não trouxe (ou trouxe incompleto) — gaps críticos

### 3.1 Preço real no booking (mais granular que o dossiê)

| Serviço | Preço público no booking (10/set) | Mínimo / nota |
|---|---|---|
| Wash & Fold one-time | **$2.69/lb** | 18 lb · preauth **$60.53** (1 bag ≈ 18 lb) |
| Wash & Fold recurring | **$2.55/lb** | weekly/biweekly; pause/cancel via conta |
| Wash Only | **$2.19/lb** | 18 lb · preauth est. **$39.42** · retorna limpo **sem dobrar** |
| Comforter Twin | **$29** | até 50"×70" |
| Comforter Full | **$33** | até 54"×75" |
| Comforter Queen | **$38** | até 60"×80" |
| Comforter King | **$43** | até 108"×90" |

**Inconsistência de marketing (lacuna explorável):**
- Title/meta da homepage: **“$33 Any Size”** + “72-hour turnaround” + pickup “Mon through Wed”
- Booking de comforter: **preço por tamanho** ($29–$43) e copy “Pricing varies by size”
- Calendário de booking (10/set): pickups disponíveis **incluindo sex/sáb/dom** — contradiz meta “Mon–Wed”

### 3.2 Contato e canal de atendimento
| Canal | Achado |
|---|---|
| Email | `hello@washfoldorlando.com` (FAQ/Terms/Privacy) |
| Telefone público | **Não encontrado** no site |
| WhatsApp | **Não encontrado** |
| Resposta declarada | “within a few hours during business hours” |
| Comercial | form “reply within one business day” · phone placeholder demo `(407) 555-0100` no exemplo |

→ Funil **100% self-serve + email**, sem concierge humano em tempo real.

### 3.3 Política operacional (Terms / FAQ — May 2026)
- Sem dry cleaning; só machine-washable
- Não checam bolsos; cliente responsável
- Cancelamento grátis até **2h** antes; depois **$10**
- Missed pickup: **$10**
- Lost item: notificar em **5 dias úteis**; liability máx. **3× cleaning charge** até **$75/item**
- Wash: warm water + medium dry (não leem care labels individuais no W&F)
- Comforter: 48–72h típico; sem pillows; sem weighted/featherbed/DCO
- Stain removal = add-on, **sem garantia**
- Dye-grabber sheets (mixed loads)
- Embalagem retorno: “sanitary clear bags”
- SMS via **Twilio** (2–4 msgs/ciclo); STOP/HELP
- Dados em **Supabase (Postgres)**; pagamentos **Stripe**

### 3.4 Gift cards
Valores: **$25 / $50 / $75 / $100 / $150 / $200** · email para destinatário · sem expiração declarada · aplicável a comforter / W&F / wash only.

### 3.5 Comercial — segmentos explícitos na página
Hotels · Airbnb/STR · Gyms · Spas · Restaurants · Medical/Dental · Construction · Offices  
Promessas: volume pricing · 24–48h · rush disponível · **sem contrato longo** · month-to-month.

### 3.6 Facebook — sinal além de “8 followers”
Meta OG (10/set): **8 likes · 84 talking about this**.  
“Talking about” sugere engajamento/alcance recente (compatível com ofensiva de ads), não base orgânica consolidada.

### 3.7 Google Business Profile / Reviews
Buscas públicas **não localizaram** um GBP claro “WashFold Orlando” / “Wash Fold Orlando” com reviews.  
→ **Lacuna forte:** quase zero prova social indexável no Google Maps (enquanto The Laundry Room / Orchid / Express competem com reviews).

### 3.8 Histórico de plataforma / marca anterior (importante para RE)
Índices de busca ainda servem conteúdo antigo sob o mesmo domínio:

| Camada | Evidência |
|---|---|
| **WashFold Clean** (marca anterior no domínio) | SERPs ainda citam “Wash Fold Clean”, preços antigos **$2.09/$2.29/$1.99**, mínimo **$39**, FREE laundry bag, áreas Midtown/Winter Springs/Oviedo etc. |
| **Curbside Laundries** | URL viva de registro: `washfoldorlando.curbsidelaundries.com/Account/SignUp` — stack anterior de booking |
| **Migração WashFoldKit** | Site atual white-label; Terms/Privacy “Last updated: May 2026” |

Leitura: o domínio **não nasceu em set/2026**; a ofensiva Meta + site Kit é **evolução/repivot**, não greenfield absoluto — alinhado ao dossiê (“domínio 2024 + aceleração recente”).

### 3.9 WashFoldKit — modelo de negócio por trás
[washfoldkit.com](https://washfoldkit.com/): kit para lançar P&D em ~**2–3 dias** sem possuir lavanderia.
- Booking branded EN/ES
- Ops hub (rotas/pedidos)
- Playbook + supplier links
- Modelos: **home-based** · **laundromat partner** · facility própria depois

Implicação competitiva: capacidade de **replicar UX rápido**, mas diferenciação de marca/ops/prova tende a ser **genérica** (template). Endereço no Clean Laundry Kissimmee encaixa no modelo “laundromat-based”.

### 3.10 Homepage SSR fraca
HTML inicial da `/` (10/set) renderiza sobretudo nav + “Powered by WashFoldKit”; conteúdo hero parece **client-side**.  
→ SEO on-page da home depende de JS; title/meta ainda ancorados em comforter $33.

### 3.11 Rotas de booking reais
| Rota | Status |
|---|---|
| `/book/wash-fold` | ✅ |
| `/book/comforter-wash` | ✅ |
| `/book/wash-only` | ✅ |
| `/book` | 404 |
| `/gift-cards` | ✅ |
| `/account` · `/login` | ✅ |
| `/how-it-works` | 404 (âncora `#how` na home) |

### 3.12 ZIPs oficiais (sitemap + `/service-areas`) — mapa operacional

| ZIP | Label no site | Leitura geográfica |
|---|---|---|
| 32789 | Winter Park | Norte premium |
| 32792 | Winter Park | Norte |
| 32801 | Downtown Orlando | Centro |
| 32804 | College Park | Centro-norte |
| 32814 | Baldwin Park | Centro-leste |
| 32819 | Dr. Phillips | Sudoeste turístico |
| 32821 | Orlando | Corredor International Dr / tourist |
| 32824 | Orlando | Sul |
| 32826 | Alafaya | Leste / UCF |
| 32827 | Orlando | Lake Nona cluster |
| 32828 | Waterford Lakes / Avalon Park | Leste |
| 32832 | Orlando | Lake Nona / southeast |
| 32836 | Dr. Phillips | Sudoeste |
| 32837 | Orlando | Hunters Creek / south |
| 34741 | Kissimmee | Turismo sul |
| 34743 | Kissimmee | |
| 34744 | Kissimmee | **Endereço FB / Clean Laundry** |
| 34746 | Kissimmee | |
| 34747 | Orlando (label) | **Celebration / 192 corridor** |
| 34771 | St. Cloud | Leste Osceola |
| 34786 | Windermere | Oeste premium |

**Não listados agora (mas ads/SERP antigo citam):** Winter Springs, Oviedo, Casselberry, Altamonte, Maitland, UCF Campus como páginas dedicadas — cobertura de mídia **maior** que inventário SEO atual.

---

## 4. Presença digital — mapa consolidado

```
Meta Ads (6 ativos, set/2026)
        │
        ▼
Homepage (comforter-biased title) ──► Service pages ──► /book/*
        │                                 │
        ├── /service-areas + 21 ZIP pages ┤
        ├── /commercial (RFQ form)        │
        ├── /faq /pricing /gift-cards     │
        └── comforterwash.com (duplicate) │
                                          ▼
                              Stripe hold → weigh → charge
                                          │
                              Twilio SMS + Account tracking
```

| Superfície | Maturidade | Nota |
|---|---|---|
| Site/checkout | Alta | Funil completo |
| Meta Ads | Alta e crescente | Ofensiva de 1 semana |
| Instagram | Muito baixa | 4 posts / 22 followers (dossiê) |
| Facebook | Baixa orgânica / ads ativos | 8 likes; 84 talking |
| Google Maps/Reviews | **Ausente ou invisível** | Brecha |
| Yelp/BBB/etc. | Não confirmado | — |
| Blog/editorial | Ausente | — |
| App nativo | Não | Web booking |

---

## 5. Como ele opera (hipótese operacional defensável)

Com base em WashFoldKit + endereço Clean Laundry + Terms:

1. **Aquisição:** Meta Ads → site → booking self-serve.  
2. **Coleta:** rota por janela; bag do cliente; foto da bag; SMS “driver en route”.  
3. **Processamento:** provavelmente **lavanderia parceira** (Clean Laundry Kissimmee) e/ou setup Kit — não há prova de planta própria.  
4. **Entrega:** 48h+ W&F; comforter 48–72h; free P&D.  
5. **Cobrança:** pré-auth no book → peso real → ajuste Stripe.  
6. **Suporte:** email; sem WhatsApp/phone público.  
7. **Upsell:** comforter + wash only + gift card + commercial RFQ + recurring.

**Não afirmar:** volume de pedidos, CAC real, taxa de conversão HALFOFF, se o código funciona, ou vínculo societário com Clean Laundry.

---

## 6. Landscape local (contexto — não só WashFold)

Do research A7 jul/2026 + web 10/set:

| Player | Posição | Preço referência |
|---|---|---|
| **WashFold Orlando** | P&D digital agressivo | $2.69 / $2.55 · Wash Only $2.19 · comforter $29–$43 |
| The Laundry Room | Full-stack + reviews fortes + Meta longo prazo | ~$1.95–$2.25 · min $45 |
| Express Wash and Fold | P&D Central FL | $2.50 next / $3.50 same · min 15 lb |
| Orchid Cleaners | Premium dry clean + W&F | comforter from ~$33.50 |
| Poplin / apps gig | Piso de mercado | ~$1/lb |
| Vacation Laundry / Taurus | Turista / VR | quote / ~$3/lb tier |

WashFold está **acima do piso gig**, **alinhado/ligeiramente acima** de independentes locais no one-time, e **abaixo** do posicionamento premium/urgente da A7.

---

## 7. Lacunas e brechas (para engenharia reversa com A7)

Quando a A7 trouxer seus dados, cruzar nestas frentes:

### Brechas dele (atacar)
1. **Prova social Google/IG quase nula** vs ads altos  
2. **Hotel guest / Bell Desk / Express 8h** — whitespace dele  
3. **WhatsApp concierge + telefone** — ele não compete  
4. **PT-BR / multilíngue turista** — só EN/ES template  
5. **LP Airbnb dedicada** — criativo existe, pós-clique genérico  
6. **Inconsistência $33 any size vs preço por tamanho** — confiança  
7. **HALFOFF sem continuidade** — atrito pós-clique / CAC ruim  
8. **SEO raso + domínio duplicado** — autoridade frágil  
9. **Liability / cuidado genérico** — A7 pode ganhar com protocolo claro  
10. **Sem blog / educação** — queries long-tail abertas  

### Forças dele (não ignorar / não copiar errado)
1. Checkout nativo com pouquíssimo atrito  
2. Recurring + wash only + gift card (arquitetura de LTV)  
3. Velocidade de teste Meta (6 ads / 7 dias)  
4. Cobertura ZIP ampla no sul/leste Orlando + Kissimmee  
5. Preço residencial transparente no booking  

### O que A7 NÃO deve fazer (dossiê + math)
- Guerra de **50% / HALFOFF** em mídia fria  
- Mandar Airbnb e família para a mesma LP  
- Competir só em $/lb sem prova/urgência/hotel  

---

## 8. Checklist de monitoramento semanal

| Campo | Como checar | Baseline 09–10/set/2026 |
|---|---|---|
| # ads ativos Meta | Ad Library “Wash Fold Orlando” | ~6 |
| Novos criativos/ângulos | Ad Library | Família · geo · vídeo 10s · Airbnb |
| Oferta/cupom | Criativo + booking | HALFOFF (não validado) |
| Destino do ad | Link do anúncio | Homepage genérica |
| Preços booking | `/book/*` | 2.69 / 2.55 / 2.19 · comforter 29–43 |
| Sitemap URLs | `/sitemap.xml` | 29 |
| Social IG/FB | Perfis públicos | IG 22 · FB 8 likes / 84 talking |
| GBP/reviews | Google Maps | Não detectado |
| Novos domínios/LPs | DNS + sitemap | comforterwash.com ativo |

**Gatilho de reação:** evidência de ganho de mercado (reviews, share of SERP, overlap de leads), **não** só volume de criativos.

---

## 9. Fontes

### Dossiê original
- Upload: `A7-Dossie-WashFold-Orlando-2026-09-09` (7 páginas)

### Revalidação 10/set/2026
- https://www.washfoldorlando.com/ (+ pricing, faq, commercial, service-areas, services/*, book/*, gift-cards, terms, privacy)
- https://www.comforterwash.com/
- https://washfoldkit.com/
- https://www.facebook.com/p/Wash-Fold-Orlando-61592641570081/
- RDAP: washfoldorlando.com
- Clean Laundry Kissimmee: https://cleanlaundry.com/locations/florida/kissimmee/laundromat-at-1359-us-192-kissimmee-fl-34744/
- Legacy Curbside signup: https://washfoldorlando.curbsidelaundries.com/Account/SignUp
- Research interno A7: `marketing/meta-ads/competitors/orlando-laundry/ADS-LIBRARY-RESEARCH-2026-07.md`

### Não acessível neste ambiente
- Meta Ad Library HTML (403)
- Instagram público (login wall)
- Wayback CDX (timeout)

---

## 10. Próximo passo (engenharia reversa)

Quando chegar o pacote A7, montar matriz lado a lado:

1. Preço / mínimo / SLA / canais  
2. Funil (ad → LP → conversão → retenção)  
3. Cobertura ZIP real vs declarada  
4. Prova social e reputação  
5. Segmentos: resident · Airbnb host · hotel guest · commercial  
6. Onde A7 **preenche** as 10 brechas da §7 sem diluir premium  

Arquivo pronto para receber a coluna A7 na próxima iteração.

---

## 11. Complemento 10/set — Ads + SEO deep dive

Ver **`ADS-SEO-DEEPDIVE-2026-09-10.md`** no mesmo diretório:

- Meta Ad Library revalidada (2 ativos confirmados vs ~6 no dossiê 09/set)
- Google Ads Transparency = **0**
- Cluster SEO / ZIPs doorway / duplicate `comforterwash.com`
- Scorecard de forças e fragilidades **sem viés**
