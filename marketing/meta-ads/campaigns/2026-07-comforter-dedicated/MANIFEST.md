# MANIFEST — Comforter Dedicated (ARQUIVADO / QUARENTENA)

> **NÃO PUBLICAR.** Não houve venda confirmada de comforter/blanket no período analisado e os arquivos deste lote carregam preços antigos no próprio pixel. A campanha fica com orçamento pago zero até nova decisão e novos assets validados.
> Fluxo: `originals/` → valida → `optimized/` → compliance → `approved/` (ou `rejected/`).

## Regras de compliance (todas obrigatórias)
- Preço vigente **por tamanho** (Twin $33 / Full-Queen $37 / King $40 / Down $45). **NUNCA** usar `/lb`, "per pound" ou misturar com wash & fold.
- Sem watermark · sem marca protegida · sem nome real de parque.
- **LOGO: usar a oficial (ver `../../brand/`). NUNCA gerar logo por IA.** Design nasce com faixa inferior livre → compor `a7-logo-05.png` (fundo claro) ou `a7-logo-06.png` (fundo escuro) via ImageMagick. Comforter (bright) → **05**.
- Sem texto pequeno ilegível · sem promessa enganosa.
- DNA: premium, alto impacto de thumbnail, Nike/dopamina, hiper-saturado, Orlando magic, contraste forte — **não parecer lavanderia barata**.

## WhatsApp / CTA (todos os anúncios)
- CTA: **WhatsApp** (`WHATSAPP_MESSAGE`) → +1 407-670-8839
- Mensagem pré-preenchida: **"Hi A7! I'd like to clean my comforter. Size:"**
- Ad set: **COMF_LOCAL** (ver audiences.yaml)

## Slots (9 = 3 conceitos × 3 formatos)

| # | creative_id_local | conceito / ângulo | formato | dims alvo | status | ad name sugerido |
|---|---|---|---|---|---|---|
| 1 | deep-clean-1x1 | deep clean (dor/sujeira) | 1:1 | 1080×1080 | ✅ APPROVED | Comforter Deep Clean |
| 2 | deep-clean-4x5 | deep clean | 4:5 | 1080×1350 | ✅ APPROVED | Comforter Deep Clean |
| 3 | deep-clean-9x16 | deep clean | 9:16 | 1080×1920 | ✅ APPROVED | Comforter Deep Clean |
| 4 | before-after-1x1 | before/after (prova) | 1:1 | 1080×1080 | ✅ APPROVED | Comforter Before/After |
| 5 | before-after-4x5 | before/after | 4:5 | 1122×1402 | ✅ APPROVED (ChatGPT design + logo 05 oficial composta) | Comforter Before/After |
| 6 | before-after-9x16 | before/after | 9:16 | 941×1672 | ✅ APPROVED (ChatGPT design + logo 05 oficial composta) | Comforter Before/After |
| 7 | fresh-bed-1x1 | fresh bed (benefício) | 1:1 | 1080×1080 | ✅ APPROVED | Comforter Fresh Bed |
| 8 | fresh-bed-4x5 | fresh bed | 4:5 | 1080×1350 | ✅ APPROVED | Comforter Fresh Bed |
| 9 | fresh-bed-9x16 | fresh bed | 9:16 | 1080×1920 | ✅ APPROVED | Comforter Fresh Bed |

## Metadados por criativo (preencher quando o asset chegar)
Para cada arquivo, registrar: `path`, `dimensions`, `file_size`, `source` (Lovart/Higgsfield/GPT), `prompt/source_link`, `pricing_shown`, `compliance_notes`, `status` (approved/review/rejected).

### Pricing exibido esperado em um lote futuro
Twin from $33 · Full/Queen from $37 · King from $40 · Down/Feather from $45 (por tamanho).

### Checklist de validação por asset
- [ ] abre / não corrompido
- [ ] dimensão bate com o formato
- [ ] peso adequado (< ~4 MB imagem; otimizar p/ WebP/JPG)
- [ ] pricing correto (by size, sem /lb)
- [ ] sem watermark / marca / logo inventado / parque real
- [ ] sem promessa proibida
- [ ] mover p/ approved/ ou rejected/
