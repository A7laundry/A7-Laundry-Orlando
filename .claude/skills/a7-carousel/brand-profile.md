# Brand Profile — A7 Laundry (Orlando / USA)

> Identidade visual e verbal da A7 Laundry Orlando aplicada a carrosséis de Instagram/Facebook.
> Carregado como pré-requisito pela skill `a7-carousel` antes de qualquer geração.
> Fonte de verdade das cores, tipografia, logo, ícones, vocabulário e dados factuais.
> **Modo CLARO** (arejado, premium) com a **paleta azul da marca A7** — não dark mode.
> Referências no repo: `marketing/ECOSYSTEM.md` · `marketing/meta-ads/creative-production-standard.md` · `marketing/meta-ads/pricing-rules.md` · `MANIFESTO.md`.

---

## Filosofia visual — CLARO + azul da marca

Dois registros diferentes de propósito (padrão A7-carousel):
- **Capa cinematográfica** (Slide 1) = imagem de IA dramática **em tela cheia** + overlay escuro + Anton uppercase + palavra-chave em **`{tangerine}`** (accent quente brilha sobre o escuro). É o scroll-stopper. Fundo claro chapado na capa = cara de Canva.
- **Miolo editorial CLARO e arejado** (slides 2–N) = fundos claros (`{bg}`/`{bg_alt}`/branco), muito respiro, linhas finas, uma ideia por slide, palavra-destaque em **`{brand_blue}`** (o azul brilha sobre o claro).

Capa para o dedo (escura), miolo para ler (claro). Regra de cor por registro: **quente sobre escuro, azul sobre claro.**

---

## Paleta de cores (tokens) — azul da marca, modo claro

| Token | Hex | Uso |
|---|---|---|
| `{brand_blue}` | `#2563eb` | **Cor-mãe.** Palavra de tensão no título (miolo), botões, gota, números, detalhes |
| `{brand_blue_deep}` | `#1e3a8a` | Azul escuro: gradiente CTA, texto forte, kicker |
| `{ink}` | `#10213f` | Texto de corpo/título sobre fundo claro (navy escuro, alto contraste ~12:1) |
| `{tangerine}` | `#ffb596` | **Accent quente.** Palavra-destaque na CAPA (sobre escuro), ícone decorativo, toque de energia |
| `{amber}` | `#ffb95f` | Accent quente alternativo / estrelas / kicker de urgência |
| `{bg}` | `#f4f8ff` | Fundo claro padrão dos slides de miolo (azul quase branco) |
| `{bg_alt}` | `#e8f0ff` | Fundo claro alternado (slides 2–N) — azul-gelo |
| `{card_white}` | `#ffffff` | Cards, caixas de destaque |
| `{border}` | `#d3e2fb` | Bordas suaves de card |
| `{wave}` | `#25d366` | **Só** CTA de WhatsApp (botão + ícone `fa-whatsapp`) |
| `{hero_dark}` | `#0a1830` | Overlay da capa cinematográfica / fundo escuro raro (slide CTA) |

**Gradiente CTA azul:** `linear-gradient(135deg, {brand_blue_deep} 0%, {brand_blue} 100%)`, texto branco.
**Gradiente CTA-WhatsApp:** `linear-gradient(135deg, {brand_blue_deep} 0%, {wave} 130%)`.
**Overlay de capa:** base fadeando pra `{hero_dark}` (`rgba(10,24,48,.96)`).

### Regra de fundo (obrigatória)
- **Slides 1 a N-1: fundo SEMPRE claro** (`{bg}` / `{bg_alt}` / `{card_white}`). A CAPA usa foto cinematográfica (o "claro" vale pros slides de miolo).
- **Só o slide final (CTA)** pode usar gradiente/fundo escuro.
- **Palavra de maior tensão:** no miolo (claro) → `{brand_blue}`; na capa (escura) → `{tangerine}`. Resto do título em `{ink}` (miolo) ou branco (capa).

---

## Tipografia

Base Inter (fonte do site) + fontes de impacto do padrão A7-carousel. Carregar via `<link>`:

| Papel | Fonte | Peso | Onde |
|---|---|---|---|
| **Capa / impacto** | `Anton` | 400 | Título da capa cinematográfica (condensada, uppercase) |
| **Display / números** | `Bebas Neue` | 400 | Números gigantes (marco), número de item (listicle) |
| **Título / UI / corpo** | `Inter` | 900 (título Nike), 700 (subtítulo), 400–500 (corpo) | Todo o resto — comando Nike |
| **Emoção** | `Playfair Display` | 600 italic | Frase emocional do CTA / aspas de depoimento (uso pontual) |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;500;700;900&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet">
```

### Escala (exportação 1080×1350)
| Elemento | Tamanho | Fonte |
|---|---|---|
| Título capa (cinematográfica) | 54–72px | Anton uppercase |
| Título principal (miolo) | 46–64px | Inter 900 (`letter-spacing:-.03em`) |
| Número gigante (marco) | 160–200px | Bebas Neue |
| Número de item (listicle) | 90–120px | Bebas Neue |
| Subtítulo | 34–46px | Inter 700 |
| Corpo | 28–36px | Inter 400/500 |
| Frase emocional (CTA/depoimento) | 40–56px | Playfair Display italic |
| Rótulo / kicker | 20–24px, `letter-spacing:2.5px`, uppercase | Inter 700 |

> **Copy Nike (padrão do site):** título curto e imperativo, 1–4 palavras + ponto. Ex.: "Don't wash it. Send it." · "Your weekend is yours." · "Cleaned right."

Escala de preview (420×525): ver `templates.md` → "Ajuste de escala".

---

## Logo (obrigatório em todo slide) — OFICIAL, NÃO ALTERAR

> ⚠️ **Logomarca oficial da A7 Laundry.** **Sempre replicar igual, nunca redesenhar, recolorir, distorcer ou recriar por IA.** Cópias oficiais em `.claude/skills/a7-carousel/assets/` (idênticas às de `marketing/meta-ads/brand/`).

| Fundo do slide | Versão do logo | Arquivo (usar este) |
|---|---|---|
| **Claro** (padrão — todos os slides de miolo) | **Colorida/azul** (`a7-logo-05`) | `assets/logo-horizontal-fundo-claro.png` |
| **Escuro** (capa cinematográfica + slide CTA) | **Branca**, gota azul (`a7-logo-06`) | `assets/logo-horizontal-fundo-escuro.png` |

> Como o miolo é claro, o **default é a logo colorida** (`...-fundo-claro.png`). Só a capa e o CTA (escuros) usam a branca. Escolher sempre pelo **contraste do texto contra a zona onde a logo fica**, não pelo nome.

- **Posição:** canto inferior direito, largura ~120px (export), padding ~40px da borda.
- **Proporção oficial:** 2205×392 (≈ 5.63:1). Nunca esticar/achatar.
- **A gota d'água é o elemento-herói** — para ícone decorativo de marca, usar `fa-droplet` em `{brand_blue}`.

---

## Frame Instagram (preview)

| Token | Valor |
|---|---|
| `{brand_handle}` | `a7laundry` |
| `{brand_profile_name}` | `A7 Laundry` |
| Avatar do header | gota A7 sobre `{bg}` (ou logo empilhada recortada) |
| Dots | sim (é carrossel) |

> Instagram e Facebook usam o mesmo handle `@a7laundry` (confirmar variação final com o Dennis).

---

## Vocabulário de ícones temáticos

Font Awesome 6. Técnica de recolorir PNG via CSS mask: ver `templates.md` → "Papéis do ícone temático".

| Tema | Font Awesome | Cor padrão |
|---|---|---|
| Wash & Fold / roupa | `fa-shirt` | `{brand_blue}` |
| Comforter / cama | `fa-bed` | `{brand_blue}` |
| Pickup & delivery | `fa-truck-fast` | `{brand_blue}` |
| Vacation rental / Airbnb | `fa-house-chimney` (ou `fa-key`) | `{brand_blue}` |
| Turista / viagem | `fa-suitcase-rolling` (ou `fa-plane`) | `{brand_blue}` |
| Tapete / carpet | `fa-rug` | `{brand_blue}` |
| Sofá / upholstery | `fa-couch` | `{brand_blue}` |
| Tênis / shoes | `fa-shoe-prints` | `{brand_blue}` |
| Agilidade / same-day | `fa-clock` | `{amber}` |
| Cuidado | `fa-heart` | `{brand_blue}` |
| Água / marca / limpeza | `fa-droplet` | `{brand_blue}` |
| Frescor / higienização | `fa-spray-can-sparkles` | `{brand_blue}` |
| Garantia / segurança | `fa-shield-halved` | `{brand_blue_deep}` |
| Prova social / avaliação | `fa-star` | `{amber}` |
| WhatsApp (só CTA) | `fa-whatsapp` | `{wave}` |

---

## Público & idiomas (espelho de linguagem)

**⚠️ Idioma — FEED orgânico (esta skill) = SEMPRE EN.** Decisão do Dennis (2026-07-15): o carrossel de feed é **sempre em inglês** — marca única, língua franca do perfil. **PT e ES ficam exclusivamente nos ADS** (Meta, segmentados por público), NÃO no feed orgânico. Se alguém pedir carrossel de feed em PT/ES, confirmar antes (é exceção). Personas abaixo valem pro conteúdo; só o idioma do post fica travado em EN.

**Personas:**
| Persona | Quem | Dor | Desejo |
|---|---|---|---|
| **Tourist / guest** (hotel-Airbnb) | Família/casal em férias em Orlando (parques, Kissimmee, Reunion, I-Drive, Lake Nona) | Perder tempo de férias lavando roupa; mala suja no meio da viagem | Roupa lavada, dobrada e entregue no hotel/Airbnb sem sair do passeio |
| **Vacation rental host** | Dono/gestor de Airbnb — turnover entre hóspedes | Trocar toda a roupa de cama rápido entre check-outs; medo de review ruim | Turnaround confiável, roupa impecável, pontual, "ready before check-in" |
| **Comforter (resident)** | Morador de Orlando com edredom/king que a máquina de casa não dá conta | Máquina de casa não lava edredom grande; medo de estragar | Edredom volta limpo, fofo, como novo — sem laundromat |
| **Local resident** (Wash & Fold) | Morador ocupado de Greater Orlando | Sem tempo pra lavanderia semanal | Pega-e-entrega, tempo livre no fim de semana |

**Como o público fala (EN):** "pickup and delivery", "wash and fold", "same day", "hassle-free", "done for you", "vacation without laundry". **Palavras da marca:** cleaned right, pickup & delivery, done for you, fresh, like new, no hassle, your weekend is yours.
**Evitar:** "cheap", promoção agressiva, jargão técnico frio, tom que gere culpa/insegurança.

---

## Tom de voz

**Nike/dopamina + cuidado premium, nunca agressivo.** A A7 é quem **entrega conveniência premium** (não quem "conserta o erro do cliente").
- Copy imperativa curta: *"Don't wash it. Send it."* · *"Your weekend is yours."* · *"Cleaned right."*
- CTA sempre convite: "message us on WhatsApp", "send us the load — we handle it".
- PT (turista BR): mesmo tom, natural — "Curte Orlando. A gente cuida da roupa." · "Manda pra gente que a gente lava, dobra e entrega."
- ES: "Disfruta Orlando. Nosotros lavamos." · "Mándanos la ropa — la recogemos y la entregamos."

---

## Tagline e dados canônicos

- **Assinatura (EN):** `Your weekend is yours. The laundry is ours.` · alt: `Don't wash it. Send it.`
- **WhatsApp (único):** **+1 407-670-8839** → `14076708839` — suporte humano ≤5 min, funil de toda peça.
- **Área:** Greater Orlando — Kissimmee, Reunion, Lake Nona, Davenport, I-Drive, Windermere, Dr. Phillips.
- **Site:** a7laundry.com

### Serviços + PREÇOS (fonte: `pricing-rules.md` / `MANIFESTO.md` — nunca inventar)
| Serviço | Preço | Regra |
|---|---|---|
| **Wash & Fold — Local** (resident) | **From $2.90/lb** | promo residente (abaixo do site) — só em peça segmentada a residente |
| **Wash & Fold — Tourist** (hotel/Airbnb) | **From $3.25/lb** | = preço do site (Normal 24h) |
| **Wash & Fold — Express** (same-day) | **From $3.95/lb** | + "subject to availability" (nunca "guaranteed") |
| **Comforter — Twin** | **From $35** | por tamanho, **nunca /lb** |
| **Comforter — Full/Queen** | **From $40** | por tamanho |
| **Comforter — King** | **From $50** | por tamanho |
| Vacation rental turnover · Carpet · Upholstery · Shoe cleaning | (a confirmar no MANIFESTO) | perguntar ao Dennis se faltar preço |

> **Dados factuais:** nunca inventar preço, prazo, avaliação (review) ou serviço fora desta tabela / do MANIFESTO. **Sem reviews inventados** (regra do projeto — já houve remoção de reviews falsos do site). Na dúvida, perguntar ao Dennis antes de gerar o slide.

---

## Humanização (padrões de IA → substitutos humanos)

Aplicada no gate de humanização (Passo 1.8 da skill). Qualquer frase passa se **alguém escreveria assim numa mensagem de WhatsApp** (no idioma do post).

| Padrão robótico (evitar) | Correção humana (EN) |
|---|---|
| "Not just X, it's Y" | Afirmar direto o que o slide mostra |
| "Discover how…" / "Learn more about…" | "Here's what happens when…" / "Look:" |
| "Specially designed for you" | Nomear a pessoa/situação: "For anyone staying at an Airbnb near Disney" |
| "The ideal solution for your needs" | "Fixes the problem of [dor concreta]" |
| "Our highly qualified team" | "We handle every load ourselves" |
| Frase que serviria pra qualquer negócio | Nomear o item/serviço específico da A7 |
| "Transform your experience" | Falar do resultado real: "comes back fresh, folded, like new" |
| Reticências decorativas / emoji em excesso | 1 emoji com função, ou nenhum |

**Atenção aos TÍTULOS dos slides (não só ao corpo):** checar cada título contra (a) **negação dupla** ("Not just X, not just Y") → reescrever afirmando; (b) **vago/genérico** (serviria pra qualquer negócio) → nomear o item/situação/bairro de Orlando.

---

## Princípios de design (6)

1. **Fundo claro e arejado** nos slides de miolo — respiro é premium. (Só capa e CTA são escuros.)
2. **Uma ideia por slide.** Dois pontos = dois slides.
3. **Hierarquia clara:** título grande → corpo médio → detalhe pequeno. Nunca dois pesos competindo.
4. **A palavra de maior tensão colorida:** `{brand_blue}` no miolo claro, `{tangerine}` na capa escura. O resto em `{ink}`.
5. **Continuidade visual:** mesmo ícone fantasma + família de fundos alternando → o carrossel parece uma peça só.
6. **Logo sempre presente** (canto inferior direito — colorida no claro, branca no escuro). CTA obrigatório só no slide final.

## Restrições visuais (nunca fazer)
- ❌ Fundo escuro chapado em slide de miolo (miolo é claro; escuro só capa/CTA).
- ❌ `{tangerine}`/`{amber}` sobre fundo claro em bloco de corpo (baixo contraste — accent quente só sobre escuro, ou como ícone/detalhe). No claro, destaque = `{brand_blue}`.
- ❌ Mais de ~4 palavras no título de capa Nike (miolo até ~12).
- ❌ Foto de rosto reconhecível sem autorização · nome real de parque · review inventado · preço fora da tabela.
- ❌ Badge oval (sempre `border-radius:50%` + `min-width/height`).
- ❌ Logo por IA · elemento cortado na borda · logo sobreposto por texto.
