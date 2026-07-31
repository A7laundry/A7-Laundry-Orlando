# A7 Laundry Orlando — Manifesto do Projeto

> **Fonte de verdade do projeto.** Em caso de conflito entre páginas, código ou documentos antigos, este arquivo prevalece. Atualizado em 2026-07-25.

---

## 1. O que é o A7 Laundry

**A7 Laundry Orlando** é uma lavanderia de coleta e entrega em Orlando, FL. O produto central é **guest wash & fold cobrado por libra (per-pound)** para hóspedes de hotéis, resorts, Airbnbs e vacation rentals, com agendamento por **WhatsApp** — sem app, sem contrato e sem assinatura.

**Tagline canônica:** *Enjoy Orlando. We handle your laundry.*

**Descrição curta canônica:** *Hotel & Airbnb laundry pickup. Washed, dried, folded and delivered. From $3.25/lb. $50 minimum. Book on WhatsApp.*

- **Domínio:** https://a7laundry.com (deploy via Vercel)
- **WhatsApp / booking:** +1 407-670-8839 — `https://wa.me/14076708839`
- **Idiomas:** EN como padrão público; PT-BR e ES em páginas comerciais e campanhas dedicadas. Não alegar paridade trilíngue onde ela não existe.

---

## 2. Modelo de negócio (CANÔNICO)

Modelo **pay-per-use por libra** — duas velocidades. **Não existe mais assinatura/membership por bag.**

| Serviço | Turnaround | Preço | Inclui |
|---------|-----------|-------|--------|
| **Normal** | 24h | **$3.25 / lb** | Coleta e entrega grátis, sorting & folding profissional, sabões hipoalergênicos premium |
| **Express** | 6h (same-day) | **$3.95 / lb** | Tudo do Normal + processamento prioritário, sempre sujeito a disponibilidade confirmada |

- **Pickup & delivery sempre grátis.**
- **Pedido mínimo:** **$50 por pedido** (valor, não peso). À tarifa Normal equivale a ~17 lbs.
- **Sem contrato, sem assinatura, sem taxas escondidas.**

> ⚠️ O antigo pilar de **assinatura por bag** (Essentials $59.90 / Family $109.90 / Premium $179.90) está **descontinuado**. Qualquer menção a subscription / membership / planos mensais nas páginas públicas é débito técnico a remover (ver §6).

---

## 3. Público-alvo

**Foco comercial validado:** guest wash & fold per-lb para hóspedes e viajantes no corredor turístico de Orlando.

| Prioridade | Segmento | Mensagem |
|-----------|----------|----------|
| Núcleo validado | Hóspedes de hotéis, resorts, Airbnbs e vacation rentals | "Enjoy Orlando. We handle your laundry." |
| Núcleo de idioma | Turistas gerais em EN e turistas brasileiros em PT-BR | Mesma oferta, no idioma do hóspede |
| Expansão controlada | Visitantes hispânicos em ES | Campanha e página separadas, com qualidade de lead medida |
| Apoio orgânico | Famílias e profissionais locais | Wash & fold por libra, sem retirar o foco da aquisição em hóspedes |
| B2B separado | Hosts e property managers | Turnover e enxoval sob orçamento, nunca misturados à roupa pessoal do hóspede |

Cidades atendidas: Orlando, Kissimmee, Reunion, Winter Park, Dr. Phillips, Lake Nona, Champions Gate e região de Disney/Disney Springs.

---

## 4. Escopo de serviços

**Carro-chefe:** wash & fold per-lb (§2).

**Add-ons / serviços complementares** (mantidos, com LPs próprias, mas fora do ciclo pago principal):
- Comforter cleaning *(zero venda confirmada no ciclo auditado; mídia paga pausada)*
- Carpet cleaning
- Shoe / sneaker cleaning
- Upholstery cleaning
- Vacation rental turnover laundry

---

## 5. Arquitetura do site

**Stack:** HTML/CSS/JS estático puro (sem framework, sem build). Deploy Vercel (`vercel.json` com URLs limpas + headers). Tracking: **GTM** (`GTM-KV9LGVRN`) + **GA4** (`G-JLQNRC7MK4`) + **Meta Pixel** + dataLayer + `a7-tracking.js`.

| Tipo | Páginas |
|------|---------|
| Home / hub | `index.html` (per-lb, Normal/Express) |
| Preços | `plans.html` |
| Serviços (add-ons) | `carpet-cleaning`, `shoe-cleaning`, `upholstery-cleaning`, `vacation-rental` |
| Comforter (serviço secundário) | `comforter-cleaning.html` + `comforter-thanks` |
| Campanha SEO | `a7-carpet-campaign/` |
| Blog SEO | 84 artigos publicados em `/blog/`; novas páginas ficam congeladas até revisão de indexação e qualidade |
| Interno (staff only) | `a7-command-center.html`, `criativos/` |

**Convenção:** termos de funil (TOFU/MOFU/BOFU/PILLAR) são **staff-only** — nunca expor na UI pública; usar rótulos amigáveis ("Guide", "Service", "Reviews").

---

## 6. Migração do modelo antigo — STATUS (2026-06-28/29)

### 6.1 ✅ Concluído
- **Preços alinhados $3.25 / $3.95:** `index.html`, `plans.html` (incl. estimador JS + schema FAQ), e antiga `premium.html`.
- **`premium.html` ARQUIVADO** em `_archive/premium.html`; rewrite `/premium` removido do `vercel.json`.
- **Pedido mínimo = $50** (antes 25 lbs): `plans.html` (copy + estimador agora valida `max($50, peso×tarifa)`), `index.html`, docs.
- **Resíduo de assinatura/membership removido das páginas públicas:** `vacation-rental.html` (seção SUBSCRIPTION, membership, toasts falsos, nav), `shoe-cleaning.html`, `carpet-cleaning.html`, `upholstery-cleaning.html`, `privacy-policy.html`, `README.md`.
- **Painéis internos migrados:** `a7-command-center.html` (stats/Stripe/card premium → per-lb), `criativos/` (15 decks de anúncio: index, painel + 13 estilos → per-lb, cupom FIRSTBAG→FIRSTWASH).
- **Blog migrado (~12 artigos):** artigo dedicado `laundry-subscription-vacation-rental.html` reescrito para "recurring pickups" per-lb (mesma URL), removida a falsa economia de assinatura; menções/cards/seções de assinatura nos demais artigos → per-lb; corrigido o erro "Express = mesmo preço" (Express é $3.95, não grátis) em `express-laundry-orlando`, `same-day-laundry-orlando`, `a7-laundry-review`, `laundry-kissimmee`, `laundry-near-disney-world`, `book-laundry-whatsapp-orlando`.
- **Labels de funil saneados (13 artigos):** pills "TOFU/MOFU/BOFU/PILLAR" visíveis → categorias amigáveis (Guide / Tips / Service / Complete Guide), classes de cor mantidas; removidos os pills de calendário "Day N" (regra staff-only [[feedback_funnel_labels]] agora respeitada na UI do blog).

### 6.2 Pendências conhecidas (fora do escopo desta passada)
- `reunion-resort-laundry-service.html` — "custom pricing on volume orders" para property managers (B2B borderline; deixado).
- `STRATEGY-PROMPT.md` — documento da estratégia de assinatura (obsoleto; manter como histórico ou arquivar).
- CSS morto das antigas seções `.membership`/`.member-card` nas LPs de serviço (invisível; opcional remover).

---

## 7. Princípios

1. **Per-lb, não por bag.** O preço é por libra, transparente, sem assinatura.
2. **WhatsApp-first.** Toda conversão termina no WhatsApp 407-670-8839.
3. **Guest Laundry primeiro.** Hóspedes são o núcleo de aquisição até outro segmento provar venda e margem.
4. **EN como padrão; PT/ES dedicados.** Não misturar idiomas na mesma peça nem prometer cobertura inexistente.
5. **Grátis o que importa:** pickup & delivery sempre incluídos.
6. **Uma marca pública:** A7 Laundry Orlando. Nomes legais ficam restritos a documentos legais e faturamento.
7. **Express sem promessa absoluta.** 6h somente quando a disponibilidade for confirmada.
8. **Prova real.** Reviews, números, tempos, fotos e resultados precisam ter fonte verificável.
9. **Termos de funil são internos.** Nunca expor na UI pública.

---

## 8. Arquitetura de mensagem (CANÔNICA)

| Camada | Mensagem |
|---|---|
| Marca | **A7 Laundry Orlando** |
| Categoria | **Guest Laundry Pickup & Delivery** |
| Promessa emocional | **Enjoy Orlando. We handle your laundry.** |
| Promessa funcional | Hotel & Airbnb pickup. Washed, dried, folded and delivered. |
| Oferta Normal | From **$3.25/lb** · 24h · **$50 minimum** |
| Oferta Express | From **$3.95/lb** · 6h · **subject to availability** · **$50 minimum** |
| Conveniência | Pickup & delivery included · no app · contactless handoff |
| CTA | Book on WhatsApp · **+1 407-670-8839** |
| Prova autorizada | 5.0/23 Google reviews enquanto esse número continuar verificado; operação e fotos reais |

Serviços secundários podem aparecer como complemento, nunca como a mensagem principal de home, anúncios de aquisição ou atendimento inicial de guest laundry.
