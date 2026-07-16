# A7 Laundry — Motor de Conteúdo Orgânico (SEO ↔ Social)

> **Objetivo:** subir a posição do a7laundry.com no Google, usando o orgânico que **já começou a aparecer**.
> Cada tema trabalha em **par**: um carrossel de feed (awareness/tráfego) + reforço on-page do artigo que rankeia (a alavanca que move o ranking).

## Como o motor move o Google

O Google **não** usa posts de IG/FB como sinal de ranking. Então o feed sozinho não sobe posição. O motor tem **2 pernas** que se reforçam:

| Perna | O que faz | Efeito no Google |
|---|---|---|
| 🔵 **Feed (carrossel)** | awareness + tráfego + brand; link na bio leva pro site | **Indireto:** brand search sobe ("A7 Laundry"), tráfego/engajamento no site |
| 🟢 **On-page (artigo)** | reforça o artigo que já imprime no GSC (conteúdo, links internos, title/meta, freshness) | **Direto:** é o que efetivamente sobe a query de pág 2 → pág 1 |

**Regra do motor:** todo tema de feed espelha uma **query real do GSC** (que já imprime) e é pareado a um **artigo do blog**. Publica o carrossel + reforça o artigo na mesma leva.

## Baseline (Search Console, 28d — medido 2026-07-15)

Total: **919 impressões · 12 cliques · CTR 1,3% · posição média 20,7 · 23 páginas rankeando.**
(Progresso vs 6/jul: era 334 impr / 3 cliques / pos 29,8 / 2 páginas.)

## Tabela mestre — 5 temas pareados

| # | Tema | Query-alvo (impr GSC 28d) | Carrossel (feed) | Artigo par (on-page) | Status |
|---|---|---|---|---|---|
| 1 | Tourist pickup & delivery | "orlando airport area laundry pickup and delivery" (22) | `2026-07-15-tourist-3steps-en` ✅ | blog/same-day-laundry-tourists-orlando | produzido |
| 2 | Same-day / Express | "orlando same day drop off laundry service" (18) | `2026-07-15-tourist-sameday-en` ✅ | blog/same-day-laundry-tourists-orlando | produzido |
| 3 | Comforter | "orlando comforter laundry service" (11) | `2026-07-15-comforter-washer-en` ✅ | /comforter (51 impr) | produzido |
| 4 | Vacation rental host | vacation rental guide (63 impr) | `2026-07-15-host-checkin-en` ✅ | blog/orlando-vacation-rental-laundry-guide | produzido |
| 5 | Wash & Fold: delivery > laundromat | "laundry service orlando" / "orlando laundry service" (11+13) | `2026-07-15-washfold-laundromat-en` ✅ | blog/orlando-laundromat-vs-delivery (49 impr) | produzido |

> Todos os carrosséis: Feed 4:5 (1080×1350), 5 slides + `caption.md`, em `instagram-feed/2026-07/`. Idioma EN (feed é sempre EN; PT/ES só nos ads).

## Calendário de postagem (sugerido — cadência 2/semana)

| Ordem | Carrossel | Data sugerida | Superfície |
|---|---|---|---|
| 1 | tourist-3steps | seg | IG + FB @a7laundry |
| 2 | comforter-washer | qui | IG + FB |
| 3 | washfold-laundromat | seg | IG + FB |
| 4 | tourist-sameday | qui | IG + FB |
| 5 | host-checkin | seg | IG + FB |

Horário sugerido: **09:00 ou 18:00 EST** (pico de turista/host online). Agendar no Planner do Meta Business Suite (business.facebook.com).

## Loop de operação (recorrente — mensal)

1. **Medir:** puxar Search Console (28d) → queries "orlando…" com impressão e pouca/nenhuma clique (pág 2-3 = oportunidade).
2. **Parear:** cada query vira 1 carrossel de feed + 1 artigo pra reforçar.
3. **Produzir:** carrossel via skill `a7-carousel` (feed EN); reforço on-page do artigo (conteúdo, links internos, title/meta).
4. **Publicar:** carrossel no Planner (2/semana); deploy do artigo reforçado.
5. **Repetir:** no mês seguinte, medir de novo — a query subiu de posição? A CTR melhorou? Ajustar.

## Métricas de sucesso (o que acompanhar)

- **Posição média** das queries "orlando…" (meta: 20,7 → <10, pág 1).
- **Cliques/CTR** no GSC (meta: 12 → crescente).
- **Brand search** ("a7 laundry", "a7 laundry orlando") aparecendo/subindo.
- **whatsapp_click** no GA4 vindo de orgânico + tráfego social.

## Referências
- Estratégia integrada: `ECOSYSTEM.md` (Ads ↔ Feed ↔ Stories)
- Skill de produção: `.claude/skills/a7-carousel/`
- Preços: `meta-ads/pricing-rules.md` · Analytics/GSC: memória `project_analytics_status`
