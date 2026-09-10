# WashFold Orlando — Paid + SEO deep dive (sem viés)

**Data:** 10/set/2026  
**Escopo:** Meta Ad Library · Google Ads Transparency · cluster SEO · indexação · o que faltava no dossiê  
**Regra:** reconhecer o que eles fazem bem; separar **confirmado** de **incerto**; sem recomendar “esmagar” — só mapa.

Arquivos irmãos:
- `DOSSIER-ORIGINAL-2026-09-09.pdf`
- `INTEL-EXPANDED-2026-09-10.md` (ops / funil / preço / stack)

---

## 0. Snapshot honesto

| Canal | Achado 10/set | Leitura |
|---|---|---|
| **Meta Ads** | **2 ads ativos confirmados** na Ad Library (browser). Dossiê 09/set listou **~6**. | Ofensiva Meta é real; inventário **caiu ou parcialmente não reapareceu** em 24h. Tratar os 6 do dossiê como snapshot histórico. |
| **Google Ads** | **0 ads** em Transparency para `washfoldorlando.com` e `comforterwash.com` (all formats / US / all time) | Canal Search/YouTube/Display **não usado** (hoje). |
| **Bing Ads** | Não há criativo WashFold; em queries de wash & fold Orlando aparece **Orlando Laundry Room** (pago Bing) | Eles não estão no leilão Bing; concorrente local sim. |
| **SEO orgânico** | Site Kit no ar + 21 ZIPs + domínio espelho; Google ainda serve **resíduos da marca antiga “Wash Fold Clean”** em vários resultados | Presença orgânica **confusa**: migração de plataforma deixou rastros; cluster ZIP é doorway (jaccard ~1.0). |
| **Local / Maps** | Sem evidência forte de GBP dominante / map pack | Fraqueza clara vs Laundry Room (reviews em massa). |

**Onde eles são bons (reconhecer):**
1. **Checkout transacional completo** (raro no nível local) — reduz atrito vs WhatsApp-only.
2. **Oferta comforter com preço âncora simples** ($33 any size no ad/meta) — memorável, baixo cognitive load.
3. **Velocidade de teste Meta** — múltiplos ângulos em ~1 semana (família + geo; dossiê também viu vídeo/Airbnb).
4. **Arquitetura de produto** — W&F + Wash Only + Comforter + gift card + commercial RFQ + recurring (mesmo com monthly pausado).
5. **EN/ES nativo** no Kit e FAQ razoavelmente completo.
6. **Domínio nicho** `comforterwash.com` apontando para a mesma máquina — intenção de capturar query de comforter.

**Onde estão fracos (sem exagero):**
1. **Zero Google Ads** com demanda Search alta no vertical.
2. **SEO técnico raso** — sem canonical, OG, JSON-LD; ZIPs 100% template; lastmod único no sitemap.
3. **Prova social / Maps** muito atrás do Laundry Room.
4. **Inconsistências de oferta** (ad/meta $33 any size vs booking por tamanho; meta “Mon–Wed” vs calendário com fim de semana; dossiê HALFOFF vs LP genérica).
5. **Resíduo de indexação “Wash Fold Clean”** + URLs antigas 404 — dilui marca e confunde preço ($2.09/$2.29 ainda em SERP cache).
6. **Autoridade social** baixa (IG/FB orgânico mínimo).

---

## 1. Meta Ads — inventário

### 1.1 Confirmado em 10/set/2026 (Ad Library via browser)

| Ad Library ID | Status | Início | Placements | Formato | Ângulo | CTA | Destino |
|---|---|---|---|---|---|---|---|
| `1095439393442267` | Active | 03/set/2026 | FB, IG | Imagem | Família / tempo de volta — P&D wash & fold; headline ancora **comforter $33** | Learn more | washfoldorlando.com |
| `1667228144820540` | Active | 04/set/2026 | FB, IG, Audience Network, Messenger | Imagem | Time + **lista de bairros** (Lake Nona, Hunters Creek, Celebration, Winter Park, Baldwin Park, Downtown, College Park, Dr. Phillips, Windermere…) | Book now | washfoldorlando.com |

**Copy (síntese fiel ao observado):**
- Emocional: “reclaim family time” / laundry off your schedule  
- Mecânica: pick up → wash → fold → deliver  
- Preço no headline: **Comforter Wash & Delivery | $33 Any Size**  
- Geo listado no body do ad 2  

**O que isso faz bem:** mensagem clara, preço âncora, geo específico, placements amplos no ad 2 (AN + Messenger). Para marca nova, é um setup competente de cold traffic.

### 1.2 Snapshot do dossiê 09/set (não reconfirmado 1:1 em 10/set)

| ID (dossiê) | Início | Ângulo declarado |
|---|---|---|
| 1095439393442267 | 03/set | Família + P&D |
| 1667228144820540 | 04/set | Cobertura geográfica |
| 1048719811278394 | 05/set | Vídeo ~10s / agendar W&F |
| 1627114758970583 | 08/set | We PickUp – Wash – Fold – Deliver |
| 1413859370715903 | 08/set | Mesmo eixo, múltiplas versões |
| 1774647257108809 | 09/set | Airbnb + code **HALFOFF** → homepage genérica |

**Status 10/set:** IDs de vídeo / multi-versão / Airbnb **não reapareceram** na busca ativa por página. Hipóteses válidas (sem escolher uma):
- pausados após teste curto;
- visibilidade de Library incompleta por região/login;
- IDs do dossiê com tipografia próxima mas não idêntica.

**Regra de trabalho:**  
- **Operacional agora = 2 ads.**  
- **Capacidade demonstrada = até 6 criativos/ângulos em 7 dias** (usar o dossiê como evidência de velocidade de teste, não como inventário vivo).

### 1.3 Lacunas Meta (deles) — factuais
- Pouca (ou nenhuma) **prova social** no copy vs Laundry Room (“top-rated on Google”).
- CTA misto Learn more / Book now — ok, mas sem urgency offer estável no landing.
- Ad Airbnb (se existiu) **sem LP dedicada** (dossiê) — quebraria message match.
- Pixel público: **PageView**; eventos de funil profundo não observados no HTML.
- Sem UTM ricos observados no destino público.

### 1.4 Concorrentes Meta no mesmo radar (contexto, não “inimigo”)
- **The Laundry Room:** ads longevos, vídeo/carrossel, prova Google, CTA Order now, app discount.
- **Players turista/hotel (ex. A7-style / outros):** WhatsApp CTA, same-day, hotel pickup — ângulo que WashFold **não** ocupa nos ads confirmados.

---

## 2. Google Ads Transparency

| Domínio / busca | Resultado |
|---|---|
| washfoldorlando.com | **0 ads** (Search / Display / YouTube / Shopping — US, all time) |
| comforterwash.com | **0 ads** |
| Nome anunciante “WashFold” / “Wash Fold Orlando” | Sem anunciante listado |

**Implicação neutra:**  
Eles concentraram 100% do paid observado em Meta. Isso **não é erro automático** (CAC Meta pode estar ok no começo), mas deixa **intenção Search sem cobertura paga** — terreno aberto para quem quiser disputar queries de alto intent (`wash and fold orlando`, `comforter cleaning orlando`, `laundry pickup delivery orlando`).

**Bing:** em testes de SERP, ads de wash & fold Orlando apontam para **orlandolaundryroom.com**, não WashFold.

---

## 3. Cluster SEO — mapa completo

### 3.1 Inventário indexável declarado (sitemap)

**29 URLs** em `washfoldorlando.com` **e** mirror idêntico em `comforterwash.com`:

```
/                          /pricing                 /faq
/service-areas             /commercial
/services/wash-fold        /services/comforter-wash /services/wash-only
/service-areas/{21 ZIPs}
```

**ZIPs (21):**  
32827, 32832, 32837, 34747, 32821, 32824, 34741, 34743, 34744, 34771, 34746, 32789, 32792, 32804, 32814, 32801, 34786, 32819, 32836, 32826, 32828

**lastmod:** um único timestamp dinâmico no fetch (ex. `2026-09-10T02:17:18Z`) — típico de sitemap gerado, não editorial.

### 3.2 Cluster temático (como o site se organiza)

```
                    [Home — title viesado comforter $33]
                              |
        +---------------------+---------------------+
        |                     |                     |
   Services hub          Service Areas           Utility
   W&F / Comforter /     hub + 21 ZIP pages      FAQ / Pricing
   Wash Only             (doorway template)      Commercial / Gift
        |                     |
        +---------> /book/* (transacional; fora do sitemap)
```

**Intents cobertos:**
| Intent | Página | Qualidade do conteúdo |
|---|---|---|
| Comforter cleaning + P&D | Home title + `/services/comforter-wash` + domínio `comforterwash.com` | Âncora forte de oferta; body de serviço ~200 palavras |
| Wash & fold P&D | `/services/wash-fold` | Adequado, genérico Kit |
| Budget / unfold | `/services/wash-only` | Adequado |
| Geo “near me” / ZIP | 21× `/service-areas/{zip}` | **Doorway puro** — texto idêntico (jaccard 1.0 entre ZIPs amostrados; só troca cidade/ZIP) |
| Commercial / Airbnb B2B | `/commercial` | Melhor página editorial (~450 palavras) + form |
| Trust / friction | `/faq` | **Melhor ativo de conteúdo** (~1100 palavras) |
| Pricing plans | `/pricing` | Fraco — monthly **paused** |

**Intents NÃO cobertos (lacunas SEO reais):**
- Airbnb host / turnover / linen SLA (página dedicada)
- Hotel guest / same-day / express
- Blog / guides (allergens, “comforter too big for washer”, pet hair, etc.)
- Neighborhood pages com conteúdo único (só ZIP template)
- Comparativos / pricing transparency table indexável alinhada ao booking
- PT-BR ou outros idiomas além EN/ES

### 3.3 SEO técnico (audit HTML 10/set)

| Sinal | Status |
|---|---|
| Title / meta description | Presentes; home **dominada por comforter $33** |
| `rel=canonical` | **Ausente** (crítico com domínio espelho) |
| Open Graph / Twitter cards | **Ausentes** |
| JSON-LD (LocalBusiness / FAQ / Service) | **Ausente** |
| hreflang | Ausente (apesar de EN/ES no UI) |
| robots.txt | Allow / ; Disallow admin/staff/driver/partner/track — ok |
| ads.txt | 404 |
| Homepage SSR | Conteúdo hero majoritariamente client-side; title/meta ok |
| Soft-404 legado | URLs antigas Wash Fold Clean → **404** (`/wash-and-fold/`, `/pickup-and-delivery/`, areas nominadas) |
| Domínio espelho | `comforterwash.com` **HTML idêntico** à home WashFold (duplicação total) |

### 3.4 Indexação / SERP (o que o mercado vê)

**Achado importante (vieses à parte):**  
Consultas públicas ainda devolvem títulos/snippets da marca antiga **“Wash Fold Clean”** com preços **$2.09 / $2.29 / $1.99** e min **$39**, e paths que hoje 404. Ou seja:

- A **migração WashFoldKit não limpou a SERP**.
- Isso é **bom e ruim** para eles: ainda há descoberta de marca/domínio, mas com **preço e nome errados**.
- Para A7: não assumir que o Google já “entende” o site novo; a guerra orgânica ainda é contra Laundry Room / Express / Orchid + diretórios.

**Map pack:** Laundry Room (e laundromats com reviews) dominam; WashFold **não** aparece como força local consolidada.

**Query Airbnb laundry Orlando:** resultados orgânicos levam Laundry Room / Express — **WashFold não figura** no material amostrado.

### 3.5 Onde o SEO deles é bom (de verdade)
- Sitemap existe e cobre serviços + geo.
- FAQ substancial (melhor página thin-content-wise).
- Commercial page com intent B2B explícito (Airbnb listado como indústria).
- Meta titles de serviço razoáveis (“Free Pickup & Delivery”).
- Domínio nicho comforter (estratégia certa para um bucket de query).

### 3.6 Onde o SEO deles é fraco (de verdade)
- Doorway ZIPs (risco de qualidade + pouco ranking sustentável).
- Duplicate domain sem canonical.
- Sem schema / OG.
- Home title desalinhada do booking real (tamanho × preço).
- Sem content cluster editorial.
- Legado dirty SERP.

---

## 4. Matriz paid × orgânico (como as peças se encaixam)

| Momento | Meta (pago) | Orgânico | Gap |
|---|---|---|---|
| Awareness família | Ad emocional + $33 comforter | Home/title comforter | Message match parcial (ad vende W&F+comforter; home SSR fraca) |
| Geo | Ad lista bairros | ZIP pages template | Pago mais específico que SEO |
| Airbnb | Criativo no dossiê (09/set); **não confirmado 10/set** | Só menção em `/commercial` | Sem LP Airbnb |
| High-intent Search | **Sem Google Ads** | SERP dominada por outros + legado Clean | Maior buraco de aquisição |
| Conversão | Booking Stripe | `/book/*` fora do sitemap | Funil forte; atribuição Pixel rasa |

---

## 5. O que faltava no dossiê / no intel anterior — checklist

| Item | Antes | Agora |
|---|---|---|
| Inventário Meta vivo vs snapshot | 6 ads como “ativos” | **2 confirmados 10/set**; 6 = capacidade/histórico |
| Google Ads | Não coberto a fundo | **Confirmado 0** |
| Bing Ads | — | Concorrente local anuncia; WashFold não |
| Duplicate domain SEO risk | Mencionado | Confirmado body idêntico + **sem canonical** |
| ZIP doorway proof | “template” | Jaccard **1.0** entre ZIPs |
| FAQ como ativo | Parcial | ~1.1k palavras — melhor URL de conteúdo |
| Commercial copy depth | Parcial | ~450 palavras + indústrias |
| Indexação legado Wash Fold Clean | Mencionado de passagem | SERP ainda serve preços/nome antigos; URLs 404 |
| robots / ads.txt | — | robots ok; ads.txt 404 |
| Booking meta “from $35” vs sizes $29–$43 vs home $33 | Parcial | **Tríplice inconsistência** documentada |
| Concorrentes paid no mesmo leilão | Laundry Room no research jul | Confirmado forte em Meta + Bing + Maps |

---

## 6. Forças vs fragilidades (scorecard sem torcida)

| Dimensão | Nota (1–5) | Comentário curto |
|---|---|---|
| Checkout / produto digital | **5** | Melhor arma atual |
| Velocidade Meta / teste criativo | **4** | Demonstrada; inventário vivo menor hoje |
| Message match ad→LP | **2** | Ofertas e segmentos desalinhados |
| Google Ads | **1** | Ausente |
| SEO técnico | **2** | Base Kit; dívida alta |
| SEO conteúdo / cluster | **2** | FAQ/commercial ok; ZIPs inúteis; sem blog |
| Local authority (Maps/reviews) | **1** | Quase inexistente vs líderes |
| Prova social ads | **1** | Não usam |
| Clareza de preço comforter | **3** | Âncora $33 boa; booking contradiz |
| Cobertura geo declarada | **4** | Ads + 21 ZIPs + commercial — ampla no papel |

---

## 7. Implicações para engenharia reversa (A7) — neutras

Quando cruzar com dados A7, priorizar perguntas — não slogans:

1. Em **Search intent** (comforter + wash & fold + Airbnb), quem captura hoje: orgânico A7, pago A7, ou Laundry Room/Express?
2. O checkout WashFold é vantagem estrutural — A7 iguala UX ou vence no **pós-clique humano** (WhatsApp/SLA)?
3. O $33 âncora é forte em mídia fria — A7 responde com **valor/urgência/prova**, não com 50%.
4. Doorway ZIP deles = oportunidade de **páginas locais com substância** (se operação cobrir).
5. Monitorar Ad Library **2×/semana**: se os 4 ads “sumidos” voltarem (vídeo/Airbnb), atualizar ameaça.

---

## 8. Fontes e limites

**Fontes:** Meta Ad Library (browser 10/set) · Google Ads Transparency · fetches live site/sitemap/robots/booking · Bing SERP amostral · web SERP · dossiê 09/set · research interno A7 jul/2026.

**Limites:**  
- Library US não mostra spend/impressions.  
- Instagram rate-limit.  
- `site:` operators instáveis neste ambiente — indexação inferida por SERP + fetches, não por Search Console deles.  
- Ads podem ser geo-gated; inventário browser ≠ inventário 100% da conta.

**Próxima atualização sugerida:** re-checar Ad Library (active + inactive) e Transparency na mesma janela semanal do checklist do intel expandido.
