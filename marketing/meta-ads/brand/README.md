# A7 Laundry — Brand Assets (logos oficiais)

> ⚠️ **Regra:** criativos **DEVEM** usar a logo oficial. **NUNCA** gerar/inventar logo por IA. Gerar o design com uma **zona livre** (faixa inferior limpa, sem texto) e **compor a logo oficial** por cima em pós (ImageMagick).

## Arquivos

| Arquivo | Versão | Dimensões | Usar em |
|---|---|---|---|
| `a7-logo-05.png` | **Colorida/azul** (A7 + gota + LAUNDRY azul) | 2205×392, transparente | **fundos CLAROS / brilhantes** |
| `a7-logo-06.png` | **Branca** (A7 + LAUNDRY brancos, gota azul) | 2205×392, transparente | **fundos ESCUROS** |

Fonte: Google Drive do dono (A7 LAUNDRY-05.png / -06.png), baixadas 2026-07-02.

## Regra de contraste (qual logo por criativo)
Escolher pela luminância da **zona onde a logo fica** (faixa inferior):
- zona clara (comforter branco, céu, luz) → **05 (colorida)**
- zona escura (gradiente escuro, sombra) → **06 (branca)**
- dúvida → colocar sobre uma faixa/plate sólida para garantir contraste.

## Composição (ImageMagick)
Design gerado SEM logo → compor a oficial:
```
magick design.png \( brand/a7-logo-05.png -resize 620x \) \
  -gravity south -geometry +0+80 -composite optimized/<nome>.png
```
(ajustar largura/offset por formato: 1:1 / 4:5 / 9:16)

## Compliance
- Logo oficial sempre; nunca inventada.
- Sem watermark, sem marca de terceiro, sem nome real de parque.
