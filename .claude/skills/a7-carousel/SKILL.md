---
name: a7-carousel
description: Gera carrosséis para o Instagram/Facebook da A7 Laundry Orlando — slides HTML deslizáveis com exportação individual em PNG 1080×1350px via Playwright. Modo claro + paleta azul da marca A7, capa cinematográfica. Use SEMPRE que o pedido envolver carrossel, slides para Instagram, post de múltiplos slides, conteúdo educativo em sequência, listicle, depoimento ou marco numérico da A7 Laundry. NÃO usar para anúncio pago 9:16 (ver marketing/meta-ads/creative-production-standard.md), Reels/vídeo, nem imagem de site.
---

# Carrossel Instagram/Facebook — A7 Laundry Orlando

Gera carrosséis completos com a identidade da A7 Laundry aplicada: HTML deslizável para aprovação
+ exportação em PNG 1080×1350px por slide, pronto pra postar. **Feed orgânico** — parte do
ecossistema `marketing/ECOSYSTEM.md` (Ads ↔ Feed ↔ Stories → WhatsApp).

Arquivos relacionados: `brand-profile.md` (identidade) · `templates.md` (skin HTML/CSS) ·
`../../../marketing/ECOSYSTEM.md` · `../../../marketing/meta-ads/pricing-rules.md` · `MANIFESTO.md`.

**A skin visual, componentes, papéis de ícone, arquitetura de HTML e mecânica de export vêm de `templates.md`.** Este arquivo documenta só o que é exclusivo do fluxo: escolha de hook, sequências por tipo de conteúdo, humanização em lote e o script de exportação multi-slide.

## ⚡ Protocolo de disciplina de token

1. **NÃO leia arquivos inteiros sem necessidade** — leia só a seção relevante de `templates.md`.
2. **Valide com 1 slide renderizado por vez**, não re-exporte o carrossel inteiro a cada ajuste.
3. **Corrija só o slide mencionado** no feedback — não regenere tudo.
4. **Use os dados canônicos do `brand-profile.md`** (e `pricing-rules.md`) em vez de procurar no site.

---

## Pré-requisito — Brand Profile

Antes de qualquer geração, ler `brand-profile.md` (nesta pasta) e carregar:

- **Paleta de cores** (tokens `{brand_blue}`, `{brand_blue_deep}`, `{ink}`, `{tangerine}`, `{amber}`, `{bg}`, `{bg_alt}`, `{card_white}`, `{border}`, `{wave}`, `{hero_dark}`) + **regra de fundo claro no miolo** (só capa/CTA escuros)
- **Tipografia:** Anton (capa) · Bebas Neue (números) · Inter (corpo/título Nike) · Playfair Display (emoção)
- **Logo:** colorida (fundo claro/miolo) / branca (capa+CTA escuros), canto inferior direito — obrigatório
- **Frame IG:** handle `a7laundry` + avatar
- **Vocabulário de ícones temáticos** (serviço → Font Awesome)
- **Público + idioma** (EN primário · PT turista BR · ES hispânico) + tom Nike/cuidado
- **Humanização:** tabela IA → humano (no idioma do post)
- **Dados factuais:** WhatsApp +1 407-670-8839, serviços, **preços de `pricing-rules.md`**, tagline. Nunca inventar preço/prazo/endereço/review.

---

## Passo 1 — Coletar dados do post

Perguntar ao Dennis antes de gerar:

1. **Tipo de conteúdo** — Educativo · Depoimento · Dicas/Listicle · Marco Numérico · Data Comemorativa
2. **Tema/serviço** — o que o carrossel ensina/mostra (wash & fold turista, comforter, vacation rental turnover, delivery, etc.)
3. **Público** — tourist/host/comforter/resident (define copy, preço e persona). **Idioma do feed = sempre EN** (PT/ES só nos ads — ver `brand-profile.md`)
4. **Imagens** — foto real (banco/fornecida) ou 100% tipográfico com ícone
5. **CTA final** — WhatsApp (padrão +1 407-670-8839)

Se disser "faz um carrossel sobre X" sem detalhe, inferir o tipo/público mais adequado e confirmar antes de gerar. **Dado de hoje:** turista vence em todo canal (Meta + orgânico) → quando em dúvida, priorizar ângulo turista (EN/PT).

**Imagem primeiro, tipográfico depois:** para capa/slide-chave, preferir foto real premium (cena ultrarrealista de Orlando, sem rosto). Só cair pro ícone puro se não houver foto coerente.

---

## Passo 1.3 — Gerar 4 hooks de capa (Slide 1)

Gerar **4 opções internamente** (não apresentar ainda), no tom A7 (conveniência premium, sem culpar o cliente), **no idioma do post**:
- 1 **educativa** ("What actually happens to your laundry on vacation")
- 1 **número/lista** ("3 things every Airbnb host forgets before check-in")
- 1 **pergunta direta** ("Spending your Disney trip doing laundry?")
- 1 **emocional/imperativa Nike** ("Don't wash it. Send it.")

**Filtro de marca (aplicar antes de pontuar):**
- Eliminar tom agressivo/negativo que gere culpa ou insegurança.
- Capa é foto cinematográfica escura (não fundo claro chapado).
- Priorizar: imperativa Nike curta, número/lista, pergunta que abre curiosidade.

Avançar para o Passo 1.4.

---

## Passo 1.4 — Eleger o hook campeão (rubrica autônoma)

Pontuar as 4 opções. **Não perguntar ao Dennis — decidir de forma autônoma e apresentar só o resultado.**

| Critério | Peso | O que avaliar |
|---|---|---|
| Tensão de informação | ×3 | Abre uma lacuna que só fecha deslizando? |
| Especificidade | ×2 | Número + consequência concreta. "3 things hosts forget" > "common mistakes". |
| Identificação imediata | ×2 | O leitor pensa "isso é sobre mim / minha viagem / meu Airbnb"? |
| Força do gatilho | ×2 | Gatilho certo pro objetivo? Vender → medo de perder tempo/review. Engajar → identificação. |
| Economia de palavras | ×1 | Nike: ≤4 na capa. Cada palavra pesa. |
| Promessa cumprível | ×1 | O carrossel entrega o que o hook promete? |

**Máx: 33 pts.** Desempate → maior **Tensão de informação**.

Apresentar: (1) tabela de pontuação, (2) hook campeão + justificativa de 1 linha, (3) avançar sem aguardar aprovação.

---

## Passo 1.5 — Ícone temático + capa cinematográfica

Escolher o ícone do serviço/tema (ver `brand-profile.md` → "Vocabulário de ícones temáticos"). Papéis (hero, badge, fundo fantasma, decorativo, rótulo) e CSS mask: ver `templates.md`.

- **Fundo fantasma** = mesmo ícone em todos os slides de conteúdo → continuidade.

### ⭐ Capa = imagem cinematográfica (padrão, não negociável)
A capa (Slide 1) **sempre** usa uma **imagem de IA cinematográfica em tela cheia** (cena premium de Orlando — quarto de resort, mala arrumada, roupa dobrada em luz rica; escura/dramática) + overlay escuro + Anton uppercase + palavra em `{tangerine}`. Ver `templates.md` → "CAPA CINEMATOGRÁFICA". **Gerar no lovart.ai** (padrão oficial desde 2026-07-15 — as capas ficam melhores; via browser/Claude in Chrome, login do Dennis). Prompt-receita em `image-prompt.md`. Higgsfield (`generate_image`, `nano_banana_pro`, 4:5) = fallback rápido. Sempre 4:5, mood escuro, base fadeando pro escuro pro texto. O texto é **sempre** composto por cima na skin HTML — nunca deixar a IA escrever. Só cair pra "capa sem foto" (fallback) se não houver imagem viável.

O **miolo** (slides 2–N) é o oposto: **editorial claro** (`bg`/`bg-alt`), respiro, linhas finas, setas →, destaque em `{brand_blue}`. Capa para o dedo, miolo para ler.

---

## Passo 1.8 — Humanizar TODOS os slides (gate obrigatório)

**NUNCA gerar o HTML sem antes humanizar o texto de todos os slides** (menos a capa, que já vem do Passo 1.3), **no idioma do post**.

1. Redigir rascunho completo em texto plano (sem HTML).
2. Aplicar a tabela de humanização do `brand-profile.md` no rascunho inteiro.
3. Usar o texto humanizado no HTML — nunca o rascunho cru.

**Critério:** qualquer frase passa se **alguém escreveria assim numa mensagem de WhatsApp** (no idioma).

**Atenção aos TÍTULOS (2–N):** checar cada título contra negação dupla e vago/genérico → nomear o item/situação/bairro de Orlando.

---

## Passo 1.9 — Verificação visual (gate obrigatório)

**NUNCA apresentar o carrossel sem verificar todos os slides visualmente.** Problemas corrigidos silenciosamente.

1. **Renderizar cada slide em 1080×1350** (reusar o script de export abaixo, `OUTPUT_DIR` → `_tmp/`, nomes `slide_XX_check.png`).
2. **Verificação de contraste por pixel** (`templates.md` → "Verificação de contraste") — atenção ao tangerine/amber sobre claro (reprova em corpo; no claro destaque = `{brand_blue}`).
3. **Autoavaliar cada slide** (papel na sequência). Logo sempre presente; CTA só no final.
4. **Teto de 7 tentativas por slide.** Se não converge, parar, seguir, e avisar o Dennis ao final.

**Checklist específico de carrossel (todos obrigatórios):**

| Critério | Verificar |
|---|---|
| Nada cortado | Texto, logo, botão, ícone dentro do slide |
| Nada sobreposto | Texto não cobre logo; botão não cobre logo |
| Badge redondo | `border-radius:50%` + `min-width/height` |
| "Swipe" visível | Na capa, sem sobrepor o subtitle |
| Fundo claro nos slides 2..N-1 | Miolo claro; escuro só capa/CTA |
| Logo certa por fundo | Colorida no claro, branca no escuro |
| Card/highlight inteiro | Não cortado na base |
| Sem overflow | `padding-bottom` reserva espaço |

### Validação narrativa do conjunto
Ver `templates.md` → "Validação narrativa": promessa da capa cumprida, progressão, equilíbrio, fechamento retomando a capa, CTA no lugar, mesma família visual.

Só depois de tudo aprovado → apagar `_tmp/` e seguir.

---

## Passo 1.10 — Criar legenda

Depois de todos os slides validados, escrever legenda + hashtags (tom da marca, **idioma do post**):
- **Ângulo** = o tipo de conteúdo do Passo 1.
- **Re-usar o que ficou na arte:** hook da capa + pontos + CTA — já humanizados.
- **CTA:** WhatsApp `14076708839` (`https://wa.me/14076708839`).
- Hashtags locais (EN): `#orlando`, `#kissimmee`, `#vacationrental`/`#airbnbhost`, serviço (`#washandfold`, `#laundrypickup`), `#orlandoflorida`.

Apresentar a legenda junto com o preview — nunca só os slides.

---

## Passo 2 — Sequências de slides por tipo

Papéis genéricos (Capa, Desenvolvimento, Exemplo, Checklist, Fechamento/CTA) em `templates.md` → "Família Carrossel". Aplicação por tipo:

### Educativo (5–7 slides)
| # | Papel | Fundo | Conteúdo | Ícone |
|---|---|---|---|---|
| 1 | Capa | cinematográfica | Título forte + "Swipe →" | Hero + fantasma |
| 2–N | Conteúdo | Alterna `bg`/`bg-alt` | Título do ponto + corpo + highlight opcional | Fantasma (mesmo ícone) |
| Final | CTA | `bg-cta-wa` | Frase emocional + CTA WhatsApp | Fantasma branco |

### Depoimento (3–5 slides) — só com depoimento REAL fornecido
| # | Papel | Fundo | Conteúdo | Ícone |
|---|---|---|---|---|
| 1 | Gancho | `bg-white` | Aspas + início do depoimento (Playfair italic) | Fantasma `fa-heart`/`fa-star` |
| 2–N | Continuação | `bg`/`bg-alt` | Continuação | Fantasma |
| Final | Identidade | `bg-white` | Nome + ★★★★★ + CTA sutil | Badge |

### Listicle — dicas/erros/fatos (5–8 slides)
| # | Papel | Fundo | Conteúdo | Ícone |
|---|---|---|---|---|
| 1 | Hook | cinematográfica | Número + promessa | Hero/Badge |
| 2–N | Item N | Alterna | `num-item` + título + explicação curta | Fantasma (mesmo) |
| Final | CTA | `bg-cta-wa` | Síntese + CTA | Fantasma branco |

### Marco Numérico (3–4 slides)
| # | Papel | Fundo | Conteúdo | Ícone |
|---|---|---|---|---|
| 1 | O número | `bg` | `num-giant` (Bebas) + descrição | Fantasma central |
| 2–N | Contexto | `bg-alt` | O que o número representa | Fantasma |
| Final | CTA | `bg-cta-wa` | Convite + contato | Badge branco |

### Data Comemorativa (3–5 slides)
| # | Papel | Fundo | Conteúdo | Ícone |
|---|---|---|---|---|
| 1 | Tema | cinematográfica | Data/tema + linha emocional | Hero |
| 2–N | Conexão | `bg-alt` | Conexão emocional (viagem/casa/tempo) | Fantasma |
| Final | CTA | `bg-cta-wa` | Fechamento + contato | Fantasma branco |

---

## Passo 3 — Imagens, arquitetura e componentes

Seguir `templates.md` para: imagens (base64, gerar via Python), formato Feed 4:5 (420×525 preview / 1080×1350 export), logo obrigatório, componentes e frame IG de preview. Overlay pra foto de fundo em slide claro: `rgba(244,248,255,.35)`.

---

## Fluxo de revisão

Apresentar preview (frame IG com dots) + legenda do Passo 1.10 juntos. Ao receber feedback, **corrigir só os slides mencionados**. Se a correção mudar texto que a legenda referencia, repetir o Passo 1.10 antes de exportar.

---

## Exportação — PNG 1080×1350px por slide

Salvar em `marketing/organic/instagram-feed/<AAAA-MM>/<AAAA-MM-DD>-<tema>/`:
- Subpasta com data primeiro, tema depois (ordenação cronológica).
- Nomes com zero à esquerda: `slide_01.png`, `slide_02.png`, …
- Salvar a legenda final em `caption.md` na mesma pasta, só **após** export bem-sucedido.

O HTML intermediário fica em `_tmp/a7-carousel.html`. Arquivos temporários **sempre** sob `_tmp/`.

### Script de exportação (loop multi-slide)

Reusado no Passo 1.9 (só muda `OUTPUT_DIR` → `_tmp/` e nomes → `slide_XX_check.png`).

```python
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

INPUT_HTML = Path("_tmp/a7-carousel.html")
OUTPUT_DIR = Path("marketing/organic/instagram-feed/2026-07/2026-07-15-tema")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOTAL_SLIDES = 7          # atualizar conforme o carrossel
VIEW_W, VIEW_H = 420, 525
SCALE = 1080 / 420        # 2.5714 → export nativo 1080×1350

async def export_slides():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": VIEW_W, "height": VIEW_H},
                                       device_scale_factor=SCALE)
        page_html = INPUT_HTML.read_text(encoding="utf-8")
        await page.set_content(page_html, wait_until="networkidle")
        await page.wait_for_timeout(3000)  # Google Fonts

        await page.evaluate("""() => {
            document.querySelectorAll('.ig-header,.ig-dots,.ig-actions,.ig-caption')
                .forEach(el => el.style.display='none');
            // Object.assign, NUNCA cssText (cssText apaga o inline e some com o fundo do slide)
            const frame = document.querySelector('.ig-frame');
            Object.assign(frame.style,{maxWidth:'none',borderRadius:'0',boxShadow:'none',overflow:'hidden',margin:'0'});
            const vp = document.querySelector('.carousel-viewport');
            Object.assign(vp.style,{aspectRatio:'unset',overflow:'hidden',cursor:'default'});
            Object.assign(document.body.style,{padding:'0',margin:'0',display:'block',overflow:'hidden',background:'#fff'});
        }""")
        await page.wait_for_timeout(400)

        for i in range(TOTAL_SLIDES):
            await page.evaluate("""(idx) => {
                const t = document.querySelector('.carousel-track');
                t.style.transition='none';                      // sem borrão
                t.style.transform='translateX(' + (-idx*420) + 'px)';
            }""", i)
            await page.wait_for_timeout(400)
            await page.screenshot(path=str(OUTPUT_DIR / f"slide_{i+1:02d}.png"),
                                  clip={"x":0,"y":0,"width":VIEW_W,"height":VIEW_H})
            print(f"Exportado slide {i+1}/{TOTAL_SLIDES}")
        await browser.close()

asyncio.run(export_slides())
```

### Erros específicos a evitar
| Erro | Consequência | Correção |
|---|---|---|
| Não ocultar `.ig-dots` | Dots no PNG | Ocultar com header/actions/caption |
| `transition` ativa no loop | Slides borrados | `transition:none` antes de mover |
| Não limpar `_tmp/` | Sujeira acumula | `shutil.rmtree('_tmp')` ao final |
| Cor como nome de var não resolvido | CSS inválido | Interpolar hex real |
| `<img>` com path relativo | Imagem some | base64 inline |

---

## Quando NÃO usar esta skill
- **Anúncio pago** (Meta Ads) → é 9:16 safe-zone, ver `marketing/meta-ads/creative-production-standard.md`.
- Reel/Stories em vídeo → skill de vídeo (se/quando existir).
- Imagem de site (hero/cover de blog) → geração de imagem direta (Higgsfield/Gemini).
