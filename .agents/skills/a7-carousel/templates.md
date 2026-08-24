# Templates — Skin visual do carrossel A7 Laundry Orlando (HTML/CSS)

> A "skin" da A7 Laundry: scaffold HTML, componentes reutilizáveis, papéis de ícone,
> família carrossel, verificação de contraste e mecânica de exportação.
> **Modo claro + paleta azul da marca** (ver `brand-profile.md`).
> Cores/tipografia vêm de `brand-profile.md` — interpolar o hex real, nunca deixar `{token}` no CSS final.

---

## Formato

- **Perfil Feed 4:5** — viewport de preview **420×525**, exportação **1080×1350** (`device_scale_factor = 1080/420 = 2.5714`).
- Um único HTML contém **todos os slides** num track deslizável (preview) → o script de export captura slide a slide.

---

## Scaffold HTML (base do arquivo)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;500;700;900&family=Playfair+Display:ital,wght@1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
  :root{
    --blue:#2563eb; --blue-deep:#1e3a8a; --ink:#10213f;
    --tangerine:#ffb596; --amber:#ffb95f; --wave:#25d366; --hero-dark:#0a1830;
    --bg:#f4f8ff; --bg-alt:#e8f0ff; --white:#fff; --border:#d3e2fb;
  }
  *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
  body{background:#c9d2dc;display:flex;justify-content:center;padding:24px;font-family:'Inter',system-ui,sans-serif}

  /* ---- Frame Instagram (só no preview; escondido no export) ---- */
  .ig-frame{width:420px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.18)}
  .ig-header{display:flex;align-items:center;gap:9px;padding:11px 13px}
  .ig-header img{width:34px;height:34px;border-radius:50%;object-fit:cover}
  .ig-header .name{font-weight:700;font-size:13px;color:#111}
  .ig-header .more{margin-left:auto;color:#111}

  /* ---- Viewport 4:5 + track ---- */
  .carousel-viewport{width:420px;height:525px;overflow:hidden;position:relative;cursor:grab}
  .carousel-track{display:flex;transition:transform .35s ease}
  .slide{width:420px;height:525px;flex:0 0 420px;position:relative;overflow:hidden;
         display:flex;flex-direction:column;justify-content:flex-start;
         padding:46px 40px 64px;color:var(--ink)}

  /* fundos */
  .bg      {background:var(--bg)}
  .bg-alt  {background:var(--bg-alt)}
  .bg-white{background:var(--white)}
  .bg-cta  {background:linear-gradient(135deg,var(--blue-deep) 0%,var(--blue) 100%);color:#fff}
  .bg-cta-wa{background:linear-gradient(135deg,var(--blue-deep) 0%,var(--wave) 130%);color:#fff}

  /* ---- Tipografia ---- */
  .kicker{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;color:var(--blue-deep);opacity:.85;margin-bottom:14px}
  .title{font-family:'Inter';font-weight:900;font-size:30px;line-height:1.08;letter-spacing:-.03em}
  .title .hot{color:var(--blue)}
  .bg-cta .title .hot,.bg-cta-wa .title .hot{color:#fff;text-decoration:underline;text-decoration-color:rgba(255,255,255,.55)}
  .subtitle{font-weight:700;font-size:17px;line-height:1.3;margin-top:10px;opacity:.85}
  .body{font-weight:400;font-size:15px;line-height:1.5;margin-top:14px}
  .num-giant{font-family:'Bebas Neue';font-size:150px;line-height:.9;color:var(--blue)}
  .num-item{font-family:'Bebas Neue';font-size:64px;line-height:1;color:var(--blue)}
  .emotional{font-family:'Playfair Display';font-style:italic;font-weight:600;font-size:26px;line-height:1.25}

  /* ---- Componentes ---- */
  .highlight{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:18px 20px;margin-top:18px;box-shadow:0 4px 18px rgba(37,99,235,.08)}
  .quote-mark{font-family:'Playfair Display';font-size:80px;line-height:.5;color:var(--blue);height:34px}
  .stars{color:var(--amber);font-size:18px;letter-spacing:2px}
  .swipe{position:absolute;bottom:64px;left:40px;display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--blue-deep)}
  .swipe i{animation:nudge 1.1s ease-in-out infinite;color:var(--blue)}
  @keyframes nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
  .cta-btn{display:inline-flex;align-items:center;gap:9px;background:var(--wave);color:#fff;font-weight:900;font-size:15px;padding:13px 22px;border-radius:999px;margin-top:20px}
  .logo{position:absolute;bottom:26px;right:34px;width:82px;opacity:.97}
  .bg-cta .logo,.bg-cta-wa .logo{width:88px}

  /* ícone fantasma (fundo) */
  .ghost{position:absolute;right:-30px;bottom:-30px;font-size:230px;opacity:.06;color:var(--blue);pointer-events:none}
  .bg-cta .ghost,.bg-cta-wa .ghost{color:#fff;opacity:.10}
  /* ícone hero */
  .hero-icon{font-size:52px;color:var(--blue);margin-bottom:16px}
  /* badge circular (nunca oval) */
  .badge{display:inline-flex;align-items:center;justify-content:center;min-width:60px;min-height:60px;width:60px;height:60px;border-radius:50%;background:var(--blue);color:#fff;font-size:26px}

  /* ---- Dots + ações (só preview) ---- */
  .ig-actions{display:flex;gap:16px;padding:11px 13px 4px;font-size:20px;color:#111}
  .ig-actions .right{margin-left:auto}
  .ig-dots{display:flex;gap:5px;justify-content:center;padding:6px 0 10px}
  .ig-dots i{width:6px;height:6px;border-radius:50%;background:#c7c7c7}
  .ig-dots i.on{background:var(--blue)}
  .ig-caption{padding:2px 13px 14px;font-size:13px;color:#222;line-height:1.4}
</style>
</head>
<body>
  <div class="ig-frame">
    <div class="ig-header">
      <img src="AVATAR_BASE64" alt="">
      <span class="name">a7laundry</span>
      <span class="more">···</span>
    </div>

    <div class="carousel-viewport">
      <div class="carousel-track">
        <!-- SLIDES AQUI -->
      </div>
    </div>

    <div class="ig-actions">
      <i class="fa-regular fa-heart"></i><i class="fa-regular fa-comment"></i>
      <i class="fa-regular fa-paper-plane"></i>
      <i class="fa-regular fa-bookmark right"></i>
    </div>
    <div class="ig-dots"><!-- 1 <i> por slide, primeiro .on --></div>
    <div class="ig-caption"><b>a7laundry</b> CAPTION_HERE</div>
  </div>
</body>
</html>
```

> **Regra de cor:** sempre interpolar o hex real do `brand-profile.md` — nunca deixar nome de variável quebrado. As `var(--x)` do `:root` já resolvem; se gerar inline, usar o hex.

---

## ⭐ CAPA CINEMATOGRÁFICA (Slide 1) — o scroll-stopper

> **Regra de ouro (validada 2026-07-14 analisando @brandsdecoded__):** a capa NÃO é fundo
> claro chapado — isso vira cara de Canva. A capa é uma **imagem cinematográfica de IA em
> tela cheia** (cena premium A7 Orlando, escura/dramática) + overlay escuro na base +
> tipografia **Anton condensada uppercase** + palavra-chave em `{tangerine}` (accent quente
> brilha sobre o escuro). É ela que para o dedo. O miolo (2–N) SIM é editorial claro.

**Pipeline da capa:** gerar a imagem de fundo cinematográfica (Higgsfield `recraft-v4-1` ou
`generate_image`, 4:5, 2k, mood **escuro/dramático**, cena premium de Orlando — quarto de resort,
mala arrumada, roupa dobrada em luz rica, sem rosto reconhecível, sem texto/logo — com
"lower third fades to darker shadow for text overlay") → recortar 1080×1350 → compor o texto
por cima (nunca deixar a IA escrever o texto: erro/typo em dado sensível). Fonte: `Anton`.

```html
<div class="slide cover">
  <img class="photo" src="COVER_BASE64_or_PATH" alt="">
  <div class="veil"></div>
  <div class="top">
    <span>A7 Laundry ®</span><span>@a7laundry</span><span>Orlando ®</span>
  </div>
  <div class="cover-block">
    <div class="handle"><i class="fa-solid fa-droplet"></i> a7laundry <i class="fa-solid fa-circle-check"></i></div>
    <div class="cover-kick">Wash &amp; Fold · Pickup &amp; Delivery</div>
    <h1 class="cover-title">Don't waste<br>vacation on <span class="hot">laundry</span></h1>
    <div class="cover-sub"><i class="fa-solid fa-arrow-right"></i> We pick up, wash, fold &amp; deliver to your hotel or Airbnb</div>
  </div>
</div>
```
```css
/* Anton já está no <link> de fontes */
.slide.cover{padding:0;background:#000}
.cover .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover .veil{position:absolute;inset:0;background:linear-gradient(180deg,
   rgba(10,24,48,.55) 0%,rgba(10,24,48,0) 22%,rgba(10,24,48,0) 40%,rgba(10,24,48,.72) 66%,rgba(10,24,48,.96) 100%)}
.cover .top{position:absolute;top:16px;left:20px;right:20px;display:flex;justify-content:space-between;
   font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:700}
.cover-block{position:absolute;left:26px;right:26px;bottom:34px;color:#fff}
.cover .handle{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;margin-bottom:12px}
.cover .handle i{color:var(--tangerine)}
.cover-kick{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--tangerine);font-weight:700;margin-bottom:8px}
.cover-title{font-family:'Anton';font-size:50px;line-height:1.0;text-transform:uppercase;letter-spacing:.5px}
.cover-title .hot{color:var(--tangerine)}
.cover-sub{font-size:13px;font-weight:500;margin-top:12px;color:rgba(255,255,255,.9);display:flex;align-items:center;gap:8px}
.cover-sub i{color:var(--tangerine)}
```

**Ajustes finos (herdados da prova A7):** `line-height:1.0` (não .94 — Anton encavala); `bottom:34px`
no bloco (não 26 — a última linha do subtexto encostava na borda); overlay escurecendo a partir de
~66% garante contraste do título sem apagar a cena. **Palavra-destaque da capa em `{tangerine}`**
(sobre o escuro brilha; o azul da marca sumiria no escuro).

---

## Slide — anatomia (miolo)

Cada `.slide` de miolo recebe uma classe de fundo (`bg` / `bg-alt` / `bg-white` / `bg-cta` / `bg-cta-wa`) + logo + (opcional) ícone fantasma.

### Capa alternativa (sem foto) — só quando não há imagem
```html
<div class="slide bg">
  <i class="fa-solid fa-suitcase-rolling ghost"></i>
  <div class="hero-icon"><i class="fa-solid fa-suitcase-rolling"></i></div>
  <div class="kicker">Tourist • Wash &amp; Fold</div>
  <h1 class="title">Don't waste vacation on <span class="hot">laundry</span></h1>
  <p class="subtitle">We pick up, wash, fold &amp; deliver — right to your hotel or Airbnb.</p>
  <div class="swipe"><span>Swipe to see how</span><i class="fa-solid fa-arrow-right"></i></div>
  <img class="logo" src="LOGO_COLOR_BASE64" alt="">
</div>
```
> ⚠️ Fallback. Sempre que houver imagem, usar a CAPA CINEMATOGRÁFICA acima.

### Conteúdo (2–N) — ponto único
```html
<div class="slide bg-alt">
  <i class="fa-solid fa-truck-fast ghost"></i>
  <div class="kicker">Step 01</div>
  <h2 class="title">We <span class="hot">pick it up</span> where you're staying</h2>
  <p class="body">Text us on WhatsApp, tell us your hotel or Airbnb, and we grab your load — no need to pause the trip.</p>
  <div class="highlight"><b>In practice:</b> most pickups happen same day across Greater Orlando.</div>
  <img class="logo" src="LOGO_COLOR_BASE64" alt="">
</div>
```

### Marco numérico
```html
<div class="slide bg">
  <i class="fa-solid fa-bed ghost"></i>
  <div class="num-giant">$35</div>
  <h2 class="title">comforters <span class="hot">cleaned right</span></h2>
  <p class="body">Twin from $35 · Queen from $40 · King from $50. Back fresh and fluffy — no home washer needed.</p>
  <img class="logo" src="LOGO_COLOR_BASE64" alt="">
</div>
```

### Listicle — item numerado
```html
<div class="slide bg-alt">
  <i class="fa-solid fa-house-chimney ghost"></i>
  <div class="num-item">03</div>
  <h2 class="title">Turnovers that beat the <span class="hot">next check-in</span></h2>
  <p class="body">Fresh linens between guests, on schedule. Ready before they arrive — protect those 5-star reviews.</p>
  <img class="logo" src="LOGO_COLOR_BASE64" alt="">
</div>
```

### Depoimento (sem inventar — só depoimento real fornecido pelo Dennis)
```html
<div class="slide bg-white">
  <div class="quote-mark">“</div>
  <p class="emotional">They picked up at our Airbnb and had everything back the next morning, folded.</p>
  <div class="highlight" style="margin-top:auto">
    <div class="stars">★★★★★</div>
    <b style="font-size:15px">Guest — Kissimmee</b>
  </div>
  <img class="logo" src="LOGO_COLOR_BASE64" alt="">
</div>
```

### CTA final (gradiente escuro → logo BRANCA)
```html
<div class="slide bg-cta-wa">
  <i class="fa-solid fa-droplet ghost"></i>
  <p class="emotional" style="color:#fff">Your weekend is yours.<br>The laundry is ours.</p>
  <p class="body" style="opacity:.92">Message us on WhatsApp — pickup &amp; delivery across Greater Orlando.</p>
  <a class="cta-btn"><i class="fa-brands fa-whatsapp"></i> Message us on WhatsApp</a>
  <img class="logo" src="LOGO_WHITE_BASE64" alt="">
</div>
```

> ⚠️ **Logo por fundo:** slides claros (miolo) → `LOGO_COLOR` (`logo-horizontal-fundo-claro.png`).
> Capa + CTA (escuros) → `LOGO_WHITE` (`logo-horizontal-fundo-escuro.png`).

---

## Papéis do ícone temático

O ícone é **elemento de arte**, não só rótulo. Cinco papéis (combináveis):

| Papel | Classe | Tamanho | Posição | Cor |
|---|---|---|---|---|
| **Hero** | `.hero-icon` | 52px | topo, antes do título | `{brand_blue}` |
| **Badge** | `.badge` | 60px círculo | inline no fluxo | branco sobre `{brand_blue}` |
| **Fundo fantasma** | `.ghost` | 230px | canto inferior direito | `{brand_blue}` @ 6% (branco @ 10% no CTA) |
| **Decorativo** | inline `<i>` | 24–32px | dentro de highlight/lista | tema |
| **Rótulo** | dentro do `.kicker` | 13px | junto ao kicker | tema |

- **Fundo fantasma** dá textura e **continuidade** — mesmo ícone em todos os slides de conteúdo pra amarrar a sequência.
- **Recolorir PNG monocromático** via CSS mask:
```css
.icon-mask{width:52px;height:52px;background:var(--blue);
  -webkit-mask:url(ICON.png) center/contain no-repeat; mask:url(ICON.png) center/contain no-repeat}
```

---

## Família Carrossel — papéis de slide

| Papel | Função | Fundo típico |
|---|---|---|
| **Capa** | hook + promessa + "swipe" | cinematográfica (foto) |
| **Desenvolvimento** | um ponto/argumento | `bg-alt` (alternar com `bg`) |
| **Exemplo/Prova** | caso concreto, dado, antes/depois | `bg-white` + highlight |
| **Checklist/Lista** | item numerado | alternar |
| **Fechamento/CTA** | frase emocional + CTA + contato | `bg-cta` / `bg-cta-wa` |

**Bookending:** o Fechamento pode reaproveitar a foto da capa como fundo cheio com overlay do gradiente da marca (~85–90%) + texto branco. Fecha o carrossel retomando a capa.

---

## Ajuste de escala (preview 420×525 ↔ export 1080×1350)

Fator = 2.5714. As medidas do `:root`/exemplos estão em **px de preview** (420-base) e o export
multiplica automático via `device_scale_factor`. Ao citar a tabela do `brand-profile` (que está em
px de **export** 1080), dividir por 2.5714 pra achar o px de preview (ex.: título capa 54–72px export
≈ 21–28px preview → `.cover-title` em ~50px preview já sai grande no 1080; ajustar por olho na verificação).

---

## Imagens fornecidas pelo usuário / banco

1. Embutir **sempre como base64** no HTML — nunca caminho relativo (o export via Playwright roda com `set_content`, path relativo quebra). Gerar base64 via Python.
2. Foto em card claro → overlay `rgba(244,248,255,.35)` pra garantir leitura do texto sobreposto.
3. Foto full-bleed sem texto: dar um slide inteiro só pra foto em vez de espremer atrás do texto.
4. Estilo das fotos: cena ultrarrealista premium de Orlando (resort/quarto/mala/roupa dobrada), luz rica/dopamina, **sem rosto reconhecível, sem texto/logo na foto**. Capa = mood escuro/cinematográfico.

---

## Verificação automática de contraste (medição por pixel)

Antes de aprovar cada slide, medir contraste texto×fundo (WCAG). Regra prática A7 Laundry:
- **Corpo/legenda:** ratio ≥ 4.5:1. `{ink}` (#10213f) sobre `{bg}` (#f4f8ff) = ~12:1 ✅.
- **Título grande (≥30px):** ratio ≥ 3:1. `{brand_blue}` (#2563eb) sobre `{bg}` = ~4.7:1 ✅ (ok pra palavra-destaque de título).
- ❌ **`{tangerine}` #ffb596 / `{amber}` sobre fundo claro em bloco de corpo reprova** — accent quente só sobre escuro (capa/CTA), como ícone, ou detalhe grande. No claro, destaque = `{brand_blue}`.
- Branco sobre gradiente CTA = ok (o ponto mais claro do gradiente ainda dá ≥4.5).
- Se um bloco reprovar → escurecer o texto (`{ink}`/`{brand_blue_deep}`) ou card branco atrás, e re-render antes de seguir.

---

## Validação narrativa do carrossel (sequência, não só slide)

Depois que cada slide passa individualmente:
- Promessa da **capa** é cumprida ao longo dos slides?
- Progressão lógica (cada slide puxa o próximo)?
- Texto equilibrado (nenhum slide com parágrafo gigante ao lado de um vazio)?
- Fechamento **retoma** a capa (bookending)?
- CTA só no slide final?
- Mesmo ícone fantasma / família de fundo em todos → parece uma peça só?

---

## Exportação — perfil Feed 4:5 (mecânica)

- Viewport 420×525 + `device_scale_factor = 2.5714` → screenshot nativo **1080×1350** (sem reamostrar).
- Ocultar o chrome do preview antes de capturar: `.ig-header,.ig-dots,.ig-actions,.ig-caption`.
- Usar `Object.assign(el.style,{...})` — **nunca** `style.cssText='...'` (apaga o inline e some com o fundo do slide).
- `transition:none` no track antes de trocar o `transform`, senão os slides borram.
- Aguardar Google Fonts (`wait_for_timeout(3000)` após `networkidle`).

Script de export completo (loop multi-slide): ver `SKILL.md` → "Exportação".

### Erros comuns
| Erro | Consequência | Correção |
|---|---|---|
| Não ocultar `.ig-dots` | Dots no PNG | Ocultar junto com header/actions/caption |
| `transition` ativa no loop | Slides borrados | `transition:none` antes de mover |
| `style.cssText=` | Fundo some | Usar `Object.assign(el.style,{...})` |
| Cor como nome de var não resolvido | CSS inválido | Interpolar hex real |
| Path relativo em `<img>` | Imagem some no export | base64 inline |
