# Pricing Rules — Meta Ads (por público)

> **Fonte de verdade:** `MANIFESTO.md` na raiz do repo. Preços de anúncio devem bater com estas regras; divergência entre público é **intencional** (segmentação), não bug.

## Wash & Fold (per-lb)

| Público / oferta | Preço no anúncio | Observação |
|---|---|---|
| **Local Laundry** (residentes Orlando) | **From $2.90/lb** | **promo residente** — ABAIXO do site (desconto segmentado) |
| **Tourist Laundry** (hotel/Airbnb) | **From $3.25/lb · minimum $50** | = **preço do site** (MANIFESTO Normal 24h) |
| **Tourist Express** (same-day) | **From $3.95/lb · minimum $50** | = **site Express 8h** + "Subject to availability" |

> **Mudança 2026-07-06:** o site/MANIFESTO subiu de $2.90/$3.20 → **$3.25 Normal / $3.95 Express** (alinhado às campanhas de turista). O **$2.90 sobrevive só como promo Local** (residente), abaixo do preço público.

> **Reconciliação 2026-07-23:** o proprietário confirmou **pedido mínimo oficial de $50**. O mínimo de $60 usado em alguns documentos e criativos de campanha era divergente do `MANIFESTO.md` e deve ser corrigido antes de qualquer republicação.

## Comforter Cleaning (por tamanho — NÃO é per-lb)

| Tamanho | Preço |
|---|---|
| Twin | From $33 |
| Full / Queen | From $37 |
| King | From $40 |
| Down / Feather | From $45 |

> **Confirmado pelo Dennis 2026-07-16:** preço oficial do comforter = $33/$37/$40 (+ Down $45), batendo com a página `/comforter` no ar. O antigo $35/$40/$50 deste doc estava DESATUALIZADO.

## Regras de validação (usadas por `*validate` e `*preflight`)

- Anúncio de **público local** → preço **$2.90/lb** (nunca o preço turista).
- Anúncio de **turista** → **$3.25/lb + mínimo de $50**; **express** → **$3.95/lb + mínimo de $50** + "subject to availability".
- Anúncio de **comforter** → preços por tamanho, **sem** "/lb".
- Qualquer preço fora desta tabela = **flag** (rever antes de publicar).

## Verticais futuros (a definir — placeholder)

| Vertical | Preço | Status |
|---|---|---|
| Carpet | (a definir no MANIFESTO) | pendente |
| Upholstery | (a definir no MANIFESTO) | pendente |
