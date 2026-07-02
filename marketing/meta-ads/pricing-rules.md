# Pricing Rules — Meta Ads (por público)

> **Fonte de verdade:** `MANIFESTO.md` na raiz do repo. Preços de anúncio devem bater com estas regras; divergência entre público é **intencional** (segmentação), não bug.

## Wash & Fold (per-lb)

| Público / oferta | Preço no anúncio | Observação |
|---|---|---|
| **Local Laundry** (residentes Orlando) | **From $2.90/lb** | = preço do site/MANIFESTO |
| **Tourist Laundry** (hotel/Airbnb) | **From $3.25/lb** | preço premium turista |
| **Tourist Express** (same-day) | **From $3.95/lb** | + "Subject to availability" |

## Comforter Cleaning (por tamanho — NÃO é per-lb)

| Tamanho | Preço |
|---|---|
| Twin | From $35 |
| Full / Queen | From $40 |
| King | From $50 |

## Regras de validação (usadas por `*validate` e `*preflight`)

- Anúncio de **público local** → preço **$2.90/lb** (nunca o preço turista).
- Anúncio de **turista** → **$3.25/lb**; **express** → **$3.95/lb** + "subject to availability".
- Anúncio de **comforter** → preços por tamanho, **sem** "/lb".
- Qualquer preço fora desta tabela = **flag** (rever antes de publicar).

## Verticais futuros (a definir — placeholder)

| Vertical | Preço | Status |
|---|---|---|
| Carpet | (a definir no MANIFESTO) | pendente |
| Upholstery | (a definir no MANIFESTO) | pendente |
