# A7 Laundry Orlando — Manifesto do Projeto

> **Fonte de verdade do projeto.** Em caso de conflito entre páginas, código ou documentos antigos, este arquivo prevalece. Atualizado em 2026-06-28.

---

## 1. O que é o A7 Laundry

Lavanderia brasileira em Orlando, FL. O produto central é **wash & fold cobrado por libra (per-pound)**, com **pickup & delivery grátis** e agendamento por **WhatsApp** — sem app, sem contrato, sem assinatura.

**Tagline:** *We handle the laundry. You enjoy Orlando.*

- **Domínio:** https://a7laundry.com (deploy via Vercel)
- **WhatsApp / booking:** +1 407-670-8839 — `https://wa.me/14076708839`
- **Idiomas:** EN / PT-BR / ES (language switcher em todas as páginas públicas)

---

## 2. Modelo de negócio (CANÔNICO)

Modelo **pay-per-use por libra** — duas velocidades. **Não existe mais assinatura/membership por bag.**

| Serviço | Turnaround | Preço | Inclui |
|---------|-----------|-------|--------|
| **Normal** | 24h | **$2.90 / lb** | Coleta e entrega grátis, sorting & folding profissional, sabões hipoalergênicos premium |
| **Express** | 6h (same-day) | **$3.20 / lb** | Tudo do Normal + processamento prioritário / VIP |

- **Pickup & delivery sempre grátis.**
- **Pedido mínimo:** **$50 por pedido** (valor, não peso). À tarifa Normal equivale a ~17 lbs.
- **Sem contrato, sem assinatura, sem taxas escondidas.**

> ⚠️ O antigo pilar de **assinatura por bag** (Essentials $59.90 / Family $109.90 / Premium $179.90) está **descontinuado**. Qualquer menção a subscription / membership / planos mensais nas páginas públicas é débito técnico a remover (ver §6).

---

## 3. Público-alvo

**Foco:** wash & fold per-lb para **toda Orlando** — não apenas vacation rentals.

| Prioridade | Segmento | Mensagem |
|-----------|----------|----------|
| Núcleo | Famílias e profissionais ocupados de Orlando | "Pare de perder horas com lavanderia — a gente busca, lava, dobra e devolve" |
| Forte | Comunidade brasileira (~66K no metro) e hispânica | "Cuidado brasileiro para seu lar em Orlando" |
| Forte | Vacation rental hosts/guests (Airbnb/VRBO) | "Guest-ready linens, every turnover" — segmento de peso, mas **não** o centro |
| Apoio | Estudantes UCF | Entry-level, volume previsível |

Cidades atendidas: Orlando, Kissimmee, Reunion, Winter Park, Dr. Phillips, Lake Nona, Champions Gate e região de Disney/Disney Springs.

---

## 4. Escopo de serviços

**Carro-chefe:** wash & fold per-lb (§2).

**Add-ons / serviços complementares** (mantidos, com LPs próprias):
- Comforter cleaning *(campanha ativa — múltiplas variações em teste, ver §5)*
- Carpet cleaning
- Shoe / sneaker cleaning
- Upholstery cleaning
- Vacation rental turnover laundry

---

## 5. Arquitetura do site

**Stack:** HTML/CSS/JS estático puro (sem framework, sem build). Deploy Vercel (`vercel.json` com URLs limpas + headers). Tracking: **GTM** (`GTM-PM7QGX6L`) + **Meta Pixel** + dataLayer + `wa-tracking.js`.

| Tipo | Páginas |
|------|---------|
| Home / hub | `index.html` (per-lb, Normal/Express) |
| Preços | `plans.html` |
| Serviços (add-ons) | `carpet-cleaning`, `shoe-cleaning`, `upholstery-cleaning`, `vacation-rental` |
| Comforter (campanha) | `comforter-cleaning.html` → `v6` + `comforter-thanks` |
| Campanha SEO | `a7-carpet-campaign/` |
| Blog SEO | 22 artigos em `/blog/` (teia de funis orgânicos) |
| Interno (staff only) | `a7-command-center.html`, `criativos/` |

**Convenção:** termos de funil (TOFU/MOFU/BOFU/PILLAR) são **staff-only** — nunca expor na UI pública; usar rótulos amigáveis ("Guide", "Service", "Reviews").

---

## 6. Migração do modelo antigo — STATUS (2026-06-28/29)

### 6.1 ✅ Concluído
- **Preços alinhados $2.90 / $3.20:** `index.html`, `plans.html` (incl. estimador JS + schema FAQ), e antiga `premium.html`.
- **`premium.html` ARQUIVADO** em `_archive/premium.html`; rewrite `/premium` removido do `vercel.json`.
- **Pedido mínimo = $50** (antes 25 lbs): `plans.html` (copy + estimador agora valida `max($50, peso×tarifa)`), `index.html`, docs.
- **Resíduo de assinatura/membership removido das páginas públicas:** `vacation-rental.html` (seção SUBSCRIPTION, membership, toasts falsos, nav), `shoe-cleaning.html`, `carpet-cleaning.html`, `upholstery-cleaning.html`, `privacy-policy.html`, `README.md`.
- **Painéis internos migrados:** `a7-command-center.html` (stats/Stripe/card premium → per-lb), `criativos/` (15 decks de anúncio: index, painel + 13 estilos → per-lb, cupom FIRSTBAG→FIRSTWASH).
- **Blog migrado (~12 artigos):** artigo dedicado `laundry-subscription-vacation-rental.html` reescrito para "recurring pickups" per-lb (mesma URL), removida a falsa economia de assinatura; menções/cards/seções de assinatura nos demais artigos → per-lb; corrigido o erro "Express = mesmo preço" (Express é $3.20, não grátis) em `express-laundry-orlando`, `same-day-laundry-orlando`, `a7-laundry-review`, `laundry-kissimmee`, `laundry-near-disney-world`, `book-laundry-whatsapp-orlando`.

### 6.2 Pendências conhecidas (fora do escopo desta passada)
- **Termos de funil expostos na UI:** vários artigos do blog renderizam pills "BOFU/MOFU/TOFU/PILLAR" visíveis — viola a regra staff-only ([[feedback_funnel_labels]]). Sweep separado.
- `reunion-resort-laundry-service.html` — "custom pricing on volume orders" para property managers (B2B borderline; deixado).
- `STRATEGY-PROMPT.md` — documento da estratégia de assinatura (obsoleto; manter como histórico ou arquivar).
- CSS morto das antigas seções `.membership`/`.member-card` nas LPs de serviço (invisível; opcional remover).

---

## 7. Princípios

1. **Per-lb, não por bag.** O preço é por libra, transparente, sem assinatura.
2. **WhatsApp-first.** Toda conversão termina no WhatsApp 407-670-8839.
3. **Trilíngue sempre.** EN / PT-BR / ES em paridade.
4. **Grátis o que importa:** pickup & delivery sempre incluídos.
5. **Termos de funil são internos.** Nunca expor na UI pública.
