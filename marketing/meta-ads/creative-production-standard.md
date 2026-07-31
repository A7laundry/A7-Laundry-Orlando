# A7 — Padrão de Produção de Criativos (Meta Ads)

> Fonte única de verdade pra **todo** criativo sair production-correct e **nunca mais cortar info**. Aplica a Lovart/ChatGPT/qualquer gerador.

## 1. Formato: **Universal Safe-Zone 9:16** (default)
Um único arquivo **1080×1920 (9:16)** que cabe em **todos** os placements sem cortar info. É o default — só produzir 3 formatos separados (per-placement) DEPOIS, pra um criativo já comprovado vencedor.

## 2. A regra de ouro — Safe Zone
No canvas 9:16 (1080×1920), **TODA info crítica** (headline, preço, selos, **espaço da logo**, CTA) fica **dentro do quadrado central 1:1** → **y 420 a 1500** (os 1080px do meio).
- **Topo 0–420px (~22%):** só **fundo/atmosfera** (cena de quarto/viagem). Sem texto/logo.
- **Base 1500–1920px (~22%):** só **fundo**. Sem texto/logo.

**Por quê:** o Feed corta o 9:16 pra 1:1/4:5 (come topo+base) e a UI de Stories/Reels cobre topo (~perfil/"patrocinado") e base (~legenda + botão CTA). O miolo central 1:1 é o único pedaço que **sobrevive a tudo**.

```
┌─────────────┐  0
│  fundo only │
│ ─────────── │  420  ← início da SAFE ZONE
│  HEADLINE   │
│  [preço]    │
│  imagem     │
│  [LOGO]     │
│ ─────────── │  1500 ← fim da SAFE ZONE
│  fundo only │
└─────────────┘  1920
```

## 3. Logo
- **NUNCA** gerar logo por IA. Gerar **logo-free** e **compor a oficial** (ImageMagick) de `../brand/`: **05** (colorida, fundo claro) · **06** (branca, fundo escuro).
- **Posição da logo no universal:** parte de baixo da **safe zone** (~y 1350–1460), **não** na borda inferior (a base some no Stories). O script de composição deve mirar a safe zone, não o rodapé extremo.

## 4. Compliance (obrigatório)
- Preço conforme `pricing-rules.md`: Local $2.90/lb · Tourist $3.25/lb (min $50) · Express $3.95/lb "subject to availability" (nunca "guaranteed") · Comforter por tamanho (Twin $33 · Full/Queen $37 · King $40 · Down/Feather $45, nunca /lb).
- Before/after **realista** (não sujo forçado). Sem watermark · sem marca de terceiro · sem nome real de parque · sem texto ilegível.
- DNA: premium, alto contraste, Nike/dopamina, Orlando.

## 5. Export & arquivo
- **1080×1920**, PNG (ou WebP otimizado), sRGB, < 4 MB.
- **Nomes:** `<conceito>_<lang>_9x16.png` (ex: `comforter_en_9x16`, `tourist_pt_9x16`).
- **Pastas:** `campaigns/<slug>/assets/originals/` (logo-free) → `optimized/` (com logo oficial composta) → `approved/`.

## 6. Fluxo de produção
1. Gerar **logo-free safe-zone 9:16** no Lovart/ChatGPT (usar prompt-base com as regras acima).
2. Baixar full-res → `originals/`.
3. **Compor logo oficial** (ImageMagick, na safe zone) → `optimized/`.
4. Validar (dimensão, safe zone, pricing, compliance) → `approved/`.
5. Gerar e registrar prévias reais de **Instagram Feed, Facebook Feed, Instagram Stories, Facebook Stories, Instagram Reels e Facebook Reels**. Sem a atestação das seis prévias, o criativo permanece `ORGANIC-ONLY` ou `QUARANTINED`.
6. Subir no Ads Manager (upload não é possível via MCP).

> A dimensão correta do arquivo não comprova enquadramento correto. A prévia de cada placement é um gate separado e obrigatório; corte automático nunca pode decidir a posição de headline, preço, logo ou CTA.

## 7. Per-placement (só depois, pra vencedor comprovado)
Quando um criativo provar escala, aí sim produzir 1:1 (1080×1080), 4:5 (1080×1350), 9:16 (1080×1920) sob medida + placement customization. Antes disso, **universal safe-zone basta**.
