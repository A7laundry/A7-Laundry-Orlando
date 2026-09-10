# A7 Laundry Orlando — Engenharia Reversa WashFold + Plano de Ataque

**Documento interno · 10 de setembro de 2026**  
**Classificação:** Confidencial  
**Escopo:** Reverso da máquina WashFold Orlando · plano de ataque · ações · KPIs · 90 dias  
**Regra de ouro:** não copiar guerra de 50% · escalar só com pedido pago reconciliado · preservar posição premium (hotel / urgência / concierge)

---

## 0. Sumário executivo

WashFold Orlando é uma **máquina transacional eficiente** (WashFoldKit + Stripe + Meta), não uma autoridade local. Comprou velocidade de produto e checkout; ainda não comprou reputação, Maps, Search nem prova operacional.

A7 tem a **melhor história para Orlando** (GBP 5,0/25, Express 8h/24h, WhatsApp, A7 OS, Google Ads) e ainda **não tem a melhor máquina de distribuição** (placar financeiro único + LPs por motor + fricção de booking).

### Decisão estratégica

| Fazer | Não fazer |
|---|---|
| Igualar fricção de pedido **sem** abandonar concierge | HALFOFF / half-price em mídia fria |
| 3 motores com LP + oferta + prova + CTA próprios | Doorway ZIP vazio |
| Ocupar Google Search (eles = 0 ads) | Escalar Meta/Google por “conversas” sem ledger |
| Blindar GBP e reviews | Competir só em $/lb |
| Message match Airbnb/host | Mandar todo tráfego para a mesma home |

### Resultado esperado em 90 dias (se disciplina for mantida)

- Placar spend → pedido pago operacional  
- 3 LPs no ar com atribuição  
- +8–12 reviews GBP / mês potencial  
- Google por intenção (hotel / bedding / brand) com purchase reconciliado  
- Meta competindo com **prova**, não desconto  
- Host pilot documentado  

---

## 1. Engenharia reversa — como a máquina WashFold funciona

### 1.1 Diagrama da máquina

```
AQUISIÇÃO          LANDING              CONVERSÃO           OPERAÇÃO            RETENÇÃO
Meta Ads      →    Homepage genérica →  Book 4 passos  →  WashFoldKit     →  Conta + SMS
(família/geo/      (comforter $33       ZIP → serviço      (rotas, SMS,         Preferências
 comforter /       any size no title)   → janela/prefs     tracking)            Recurring
 Airbnb*)                               → Stripe preauth                        Gift card
                                        ···············
Google Ads = 0                          *Airbnb ad (dossiê) cai na home — message mismatch
SEO = 29 URLs / 21 ZIP doorway / FAQ forte / sem blog
GBP próprio = não localizado (09/set)
Social orgânico = mínimo (IG ~22 / FB ~8)
```

### 1.2 Peças desmontadas

| Camada | O que existe | Força real | Fraqueza explorável |
|---|---|---|---|
| **Aquisição Meta** | 2 ads ativos confirmados 10/set (dossiê viu ~6 em 09/set): família, geo, (hist.) vídeo, Airbnb+HALFOFF | Velocidade de teste; âncora $33 clara | Pouca prova social no copy; CTA passivo; inventário instável |
| **Google Ads** | Zero (Transparency) | — | **Campo aberto** para intent alto |
| **Landing** | Home + 3 serviços + commercial + FAQ | Checkout a 1–2 cliques | Home genérica; Airbnb sem LP; title $33 vs booking por tamanho |
| **Conversão** | `/book/*` 4 etapas, min 18 lb, $2.69/$2.55, wash only $2.19, comforter $29–$43 | Fricção mínima; preauth transparente o bastante | Cupons não validados publicamente; promo desalinhada |
| **Ops stack** | WashFoldKit · Next/Vercel · Stripe · Supabase · Twilio | White-label maduro; SMS | Genérico; endereço Clean Laundry Kissimmee (parceria, não marca Maps) |
| **SEO** | 29 URLs espelhadas em comforterwash.com | Cobertura ZIP declarada | Doorway jaccard 1.0; sem canonical/OG/JSON-LD; SERP suja com legado “Wash Fold Clean” |
| **Prova** | Depoimentos genéricos no site | — | Sem GBP forte; IG/FB irrelevantes |
| **Retenção** | Conta, recurring, gift, commercial RFQ | Arquitetura LTV pronta | Monthly plans pausados; pouco brand love |

### 1.3 O que reconhecer (sem ego)

WashFold **vence hoje** em:
1. Checkout self-serve completo  
2. Velocidade de teste criativo Meta  
3. Preferências / gift / recurring no produto  
4. Clareza cognitiva da âncora $33 em anúncio  

A7 **vence hoje** em:
1. Google Business Profile e reviews  
2. Urgência real (8h/24h)  
3. Hotel / front desk / concierge WhatsApp  
4. Google Ads já ligado  
5. Cluster SEO editorial maior + OS próprio com ledger  

---

## 2. Matriz de ataque — adaptar · superar · ignorar

### 2.1 Adaptar (engenharia reversa útil)

| # | Peça WashFold | Ação A7 concreta | Dono sugerido | Prazo |
|---|---|---|---|---|
| A1 | Booking 4 passos | Evoluir `/order`: ZIP → serviço → janela → preferências → Payment Link; WhatsApp como concierge, não como formulário | Produto / Dev | D7–30 |
| A2 | Preauth + peso | Manter Stripe; exibir mínimo e lógica de peso/itens na LP e no order | Ops + Produto | D7–21 |
| A3 | SMS status | Templates OS: coletado / em processo / a caminho / entregue (WA ou SMS) | Ops | D14–30 |
| A4 | Recurring | Oferta Resident Care: weekly/biweekly com rota; pause fácil | Growth + Ops | D30–60 |
| A5 | Gift / referral | Gift card ou “$X credit for friend” pós-entrega 5★ | Growth | D30–45 |
| A6 | Âncora simples no ad | Âncora por **resultado**: “Back in 24h” / “Express 8h when confirmed” / “Hotel pickup” — não half price | Media | D1–14 |
| A7 | Geo no criativo | Nomear hotel corridor + bairros **reais** de rota | Media + Ops | D1–14 |
| A8 | Ritmo de teste Meta | 2–3 criativos/semana depois placar paid-order | Media | Contínuo pós D14 |

### 2.2 Superar (onde A7 esmaga a assimetria)

| # | Vantagem A7 | Ação concreta | Dono | Prazo |
|---|---|---|---|---|
| S1 | GBP 5,0 / 25 | Pedido de review pós-entrega (link/QR); meta +8–12/mês; 4–8 fotos ops/mês; 1 post/semana | Ops + Growth | D1–21 e contínuo |
| S2 | Express 8h / 24h | LP Guest Rescue com SLA explícito e CTA “Confirm pickup window” | Growth + Ops | D7–30 |
| S3 | WhatsApp ≤5 min | SLA de resposta; idiomas PT/ES/EN; deep link pré-preenchido por LP | Atendimento | D1–7 |
| S4 | Front desk | Página/prova Bell Desk; hotel selecionável; 3 cases anonimizados | Ops + Growth | D14–45 |
| S5 | Google Ads (WF = 0) | Campanhas por intenção: hotel urgente · bedding · brand; purchase reconciliado | Media | D21–60 |
| S6 | SEO editorial | Refresh titles pos 7–15; hub comforter; hotel guides; matar mismatch dry-clean/laundromat | SEO | D1–30 |
| S7 | A7 OS | Painel spend→paid order; Order ID em todo close; atribuição obrigatória | Owner + Dev | **72h–D14** |
| S8 | Multilíngue real | Criativos e atendimento no idioma do guest (PT-BR turista) | Media + CS | D14–45 |

### 2.3 Ignorar (não gastar energia)

- HALFOFF / 50% / half price em cold traffic  
- Clonar 21 ZIPs doorway  
- Domínio espelho sem conteúdo  
- Empilhar cupons conflitantes  
- Reagir a cada criativo Meta sem evidência de share de mercado  

---

## 3. Três frentes de ataque (motores)

### Frente 1 — Guest Rescue (prioridade MÁXIMA)

**Inimigo a explorar:** WashFold quase não fala com hóspede/hotel nos ads confirmados.

| Elemento | Spec |
|---|---|
| **Promessa** | Coletamos onde você está e devolvemos dobrado em 24h; Express 8h quando confirmado |
| **LP** | `/guest-laundry-orlando` (ou equivalente) — 1 promessa, 1 prova, 1 CTA |
| **Prova** | Reviews GBP · foto handoff hotel-safe · order status |
| **CTA** | WhatsApp “Confirm my pickup window” + /order |
| **Paid** | Google: hotel laundry, urgent laundry hotel Orlando, laundry pickup near me (hotel geo) · Meta: suitcase / vacation |
| **Orgânico** | GBP posts · hotel corridor pages · Maps |
| **KPI** | Pedidos pagos Guest / semana · on-time % · CAC guest |

**Ações (checklist):**
1. [ ] Publicar LP Guest Rescue (EN + ES; PT se volume BR)  
2. [ ] Deep link WA com UTM + hotel/ZIP  
3. [ ] 3 criativos suitcase / “don’t waste a day in Orlando”  
4. [ ] Google search group “urgent/hotel” com negativas fortes  
5. [ ] Pedir review a todo guest pós-entrega  

### Frente 2 — Resident Care (prioridade ALTA)

**Inimigo a explorar:** Eles ganham checkout; perdem em prova e profundidade comforter/bedding.

| Elemento | Spec |
|---|---|
| **Promessa** | Item volumoso limpo sem carregar até a lavanderia; bundle wash & fold |
| **LP** | Hub comforter/duvet/blanket — **não** só preço seco |
| **Prova** | Antes/depois · “não cabe na máquina” · pets/alergia · reviews |
| **CTA** | Get bedding pickup quote / Schedule pickup |
| **Paid** | Meta comforter (whitespace histórico) · Google comforter cleaning Orlando |
| **Oferta** | Bundle (comforter + W&F), **não** 50% off |
| **KPI** | Pedidos bedding · AOV bundle · repeat residente |

**Ações:**
1. [ ] Fechar canonical/cluster comforter (Manual P0)  
2. [ ] LP Resident Bedding com tamanhos reais alinhados ao preço operacional  
3. [ ] Criativo before/after + free pickup (área confirmada)  
4. [ ] Cross-sell W&F no pós-pedido comforter  
5. [ ] Alinhar “free pickup” só à área real (evitar conflito de promessa)  

### Frente 3 — Host Reliability (prioridade ALTA e RÁPIDA)

**Inimigo a explorar:** Criativo Airbnb deles cai em homepage genérica — message mismatch.

| Elemento | Spec |
|---|---|
| **Promessa** | Turnover sem surpresa: coleta, custódia e entrega visíveis |
| **LP** | `/airbnb-laundry-orlando` ou Host Reliability — SLA, janelas, inventário, piloto |
| **Prova** | Custódia · comprovantes · rota · cases anonimizados |
| **CTA** | Request reliability plan / Start property pilot |
| **Paid** | Meta só **depois** da LP no ar; Google “Airbnb laundry Orlando” |
| **Oferta** | Piloto por propriedade, sem contrato longo; volume progressivo — **sem** HALFOFF frio |
| **KPI** | Leads host qualificados · pilots ativos · receita B2B |

**Ações:**
1. [ ] Publicar LP Host **antes** de gastar em Airbnb ads  
2. [ ] Form/WA com: #unidades, turnover days, volume toalhas/lençóis  
3. [ ] Outreach 20 hosts/semana no corredor Disney/Universal  
4. [ ] 1 case study host/mês  
5. [ ] Monitorar se WashFold lança LP Airbnb (gatilho)  

---

## 4. Plano de ataque por horizonte

### 4.1 Primeiras 72 horas — estabilizar a verdade

| ID | Ação | Output | Owner |
|---|---|---|---|
| H1 | Painel mínimo: spend Google + Meta → conversas → pedidos aceitos → **pagos** | Planilha/OS view diária | Owner |
| H2 | Auditar termos Google (negativas dry-clean/laundromat irrelevantes) | Lista negativas + ad/LP match | Media |
| H3 | Checar capacidade Express 8h e janelas por ZIP | Mapa “pode prometer / não pode” | Ops |
| H4 | Meta SET26: monitorar frequência e qualidade das 9 conversas | Decisão: manter / pausar / criativo | Media |
| H5 | Snapshot WashFold Ad Library + Transparency | Baseline competitivos | Analyst |

**GO/NO-GO:** não aumentar budget até H1 existir.

### 4.2 Dias 1–14 — ganhar o clique e a prova local

| ID | Ação | Output |
|---|---|---|
| D14-1 | Reescrever title/meta das URLs em posição 7–15 | CTR ↑ nas queries que já impressam |
| D14-2 | Canonical comforter + alinhar preço anunciado × cobrado | Sem conflito $33 any size vs sizes |
| D14-3 | GBP: pedir reviews, publicar 4+ fotos reais, 2 posts | +reviews; completude perfil |
| D14-4 | SLA WhatsApp ≤5 min em horário comercial | Script + tracking tempo resposta |
| D14-5 | Âncora criativa nova (tempo/hotel) sem desconto destrutivo | 2–3 ads Meta/Google RSA |
| D14-6 | Corrigir promessa free pickup = área confirmada | Copy site + ads |

### 4.3 Dias 7–30 — três landing paths

| ID | Ação | Output |
|---|---|---|
| D30-1 | LP Guest Rescue live + UTM | URL + eventos |
| D30-2 | LP Resident Bedding live + UTM | URL + eventos |
| D30-3 | LP Host Reliability live + UTM | URL + form/WA |
| D30-4 | `/order` com ZIP + janela (mínimo viável) | Redução de atrito |
| D30-5 | Attribution key por motor no OS | Todo pedido pago com origem |
| D30-6 | Google: 3 ad groups por intenção | Hotel / Bedding / Brand |

### 4.4 Dias 14–45 — biblioteca de prova

| ID | Ação | Output |
|---|---|---|
| D45-1 | 12 vídeos curtos ops (coleta, dobra, selo, handoff) | Assets Meta/GBP/SEO |
| D45-2 | 3 cases anonimizados (guest, resident, host) | Páginas + ads |
| D45-3 | Prova front desk / Bell Desk | Foto + protocolo texto |
| D45-4 | Comforter handling video | Bedding ads |
| D45-5 | Cadência GaryV: 3 shorts/sem · 2 GBP/sem · 1 SEO refresh/sem | Ritmo |

### 4.5 Dias 21–60 — Search e Meta com disciplina

| ID | Ação | Output |
|---|---|---|
| D60-1 | Google: purchase reconciliado como macro conversão | CAC por venda real |
| D60-2 | Negativas fortes; QS; landing exact match | Menos desperdício (hoje loss by rank ~55%) |
| D60-3 | Meta: cold problema → retarget prova → WA janela | Funil por etapa |
| D60-4 | Frequência Meta < 3; criativo localizado | Controle |
| D60-5 | Alert se WashFold ligar Google Ads | Counter-brief |

### 4.6 Dias 45–90 — retenção e domínio

| ID | Ação | Output |
|---|---|---|
| D90-1 | Review + referral automatizados pós-entrega | Taxa review |
| D90-2 | Reminder opt-in segundo pedido (30/60d) | Repeat |
| D90-3 | Host pilot 5 propriedades | Receita B2B |
| D90-4 | Concierge/front desk outreach 10 hotéis | Parcerias |
| D90-5 | Backlinks locais legítimos (guias, chambers) | SEO |
| D90-6 | Reavaliar scorecard A7×WF | Decisão Q4 |

---

## 5. Funil A7 alvo (Hook → Story → Offer)

| Etapa | Mensagem | Ativo | KPI |
|---|---|---|---|
| **Descoberta** | “Enjoy Orlando. We handle the laundry.” | Google · Maps · Meta · hotel pages | Impr., video hold, share local |
| **Consideração** | Tempo perdido, bagagem, front desk, retorno no horário | Reviews, processo, pricing, FAQ | CTR, engaged, WA clicks |
| **Captura** | Janela + serviço + estimativa transparente | WA pré-fill /order | Conversas qualificadas |
| **Conversão** | Order ID + invoice + Payment Link | A7 OS | Pedidos pagos · CAC · AOV |
| **Entrega** | Status sem ansiedade · Bell Desk | SMS/WA templates | On-time · rewash · incidents |
| **Ascensão** | Review · bundle · host pilot · referral | CRM leve | Repeat 30/60/90 · LTV |

**Value ladder:** checklist/estimador → 1ª coleta → Express/bundle → repeat → conta host.

---

## 6. Scoreboard semanal (toda segunda)

| Camada | KPI principal | KPI qualidade | Decisão |
|---|---|---|---|
| Demanda | Impr., reach | Fit query/segmento | Onde aumentar relevância |
| Captura | Cliques, CTR | Intent match | Qual promessa merece budget |
| Leads | Conversas qualificadas | Hotel/ZIP/serviço/prazo presentes | Qual canal traz demanda operável |
| Vendas | Pedidos aceitos | Lead → order | Oferta e follow-up |
| Financeiro | **Pedidos pagos + receita** | CAC, AOV, margem | Escalar / manter / pausar |
| Operação | On-time pickup/return | Incidentes, rewash | Capacidade vs promessa |
| Reputação | Reviews novas | Nota e temas | Prova e treino |
| Retenção | Repeat 30/60/90 | LTV, referral | Próxima oferta |
| Competidor | #ads WF · novos ângulos · Google Ads on/off | Destino LP · preço | Reagir só a ganho de mercado |

### North star
**Margem de contribuição de pedidos pagos e entregues no prazo, por motor de demanda.**

### Metas de ciclo
- ≥95% pagamentos com origem  
- ≥95% entregas no prazo  
- ≥4,8 nota Google  
- 100% spend com owner  
- +8 reviews/mês  

### Escalar somente se 4 sinais concordam
1. Pedido pago cresce  
2. CAC cabe na margem  
3. Entrega no prazo  
4. Reviews/repeat não deterioram  

---

## 7. Matriz RACI (resumo)

| Frente | Acountable | Responsible | Consulted |
|---|---|---|---|
| Placar financeiro | Owner | Dev/OS | Media |
| Guest Rescue | Growth | Media + Ops | CS |
| Resident Care | Growth | SEO + Media | Ops |
| Host Reliability | Growth | Ops + CS | Owner |
| GBP / reviews | Ops | CS | Growth |
| Google Ads | Media | Growth | Owner |
| Meta Ads | Media | Growth | Owner |
| Monitor WF | Analyst/Growth | — | Owner |

---

## 8. Riscos e limites (transparência)

| Risco | Mitigação |
|---|---|
| GA4/Google/Meta supervalorizam microeventos | Ledger OS/Stripe = verdade |
| Express 8h prometido sem capacidade | Mapa ZIP “confirmado / sob consulta” |
| Free pickup anunciado fora da área | Copy = área real; senão remover “free” |
| Copiar desconto WF por pânico | Regra escrita: sem 50% cold; bundle only |
| WF ligar Google Ads ou GBP | Gatilho semanal; não esperar trimestre |
| Aumentar budget por CTR alto | Bloqueio: precisa pedido pago |

---

## 9. Cronograma visual 90 dias

```
Semana  1  2  3  4  5  6  7  8  9 10 11 12
Placar  ████
GBP/SEO ████████████
3 LPs      ████████████
Prova         ████████████████
Google           ████████████████
Meta                ████████████████
Retenção/Host              ████████████████
Monitor WF  (contínuo 2×/semana) ────────────────────────
```

---

## 10. Conclusão

WashFold é uma ameaça de **distribuição e checkout**, não de **categoria**.  
A7 ataca em três frentes — Guest, Resident, Host — com placar único de pedido pago, prova local e Search, **sem** destruir margem em guerra de cupom.

Próximo passo de implementação imediata: **H1–H5 (72h)** e kickoff das 3 LPs.

---

## Fontes

- Manual de Crescimento A7 Laundry Orlando — 09/set/2026  
- Dossiê competitivo WashFold — 09/set/2026  
- Intel expandida WashFold — 10/set/2026  
- Ads + SEO deep dive WashFold — 10/set/2026  
- Fontes públicas: washfoldorlando.com, comforterwash.com, Meta Ad Library, Google Ads Transparency, Google Maps, GSC/GA4/Ads/Meta/Stripe (dados A7 do Manual)
