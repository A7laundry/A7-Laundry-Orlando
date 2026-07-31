# MANIFEST — Tourist Laundry Reinforcement (pipeline de criativos)

> **Status geral: BIBLIOTECA DE ORIGEM — NÃO PUBLICAR DIRETAMENTE.** Os conceitos foram produzidos, mas este rascunho foi substituído pela campanha manual de Guest Laundry. Todo ativo precisa passar novamente pelo preflight e pela conferência do texto incorporado.
> Fluxo: `originals/` → valida → `optimized/` → compliance → `approved/` (ou `rejected/`).

## Regras de compliance (todas obrigatórias)
- **Tourist:** From $3.25/lb · Minimum $50 · Pickup & delivery included. **NÃO usar $2.90/lb.**
- **Express:** From $3.95/lb · Minimum $50 · "Subject to availability" / "Ask for today's availability". **NÃO usar** "guaranteed same-day", "guaranteed before checkout" nem "guaranteed 6h".
- Sem watermark · sem marca protegida · **sem nome real de parque** (parque genérico OK) · sem texto ilegível · sem promessa enganosa.
- **LOGO: usar a oficial (ver `../../brand/`). NUNCA gerar logo por IA.** Design nasce com faixa inferior livre → compor `a7-logo-05.png` (fundo claro) ou `a7-logo-06.png` (fundo escuro) via ImageMagick, escolhendo por criativo.
- DNA: premium, alto impacto, Nike/dopamina, hiper-saturado, Orlando magic, contraste forte — não parecer barato.

## WhatsApp / CTA
- CTA: **WhatsApp** (`WHATSAPP_MESSAGE`) → +1 407-670-8839
- **Tourist msg:** "Hi A7! I'm at a hotel/Airbnb in Orlando & need laundry pickup. My location is:"
- **Express msg:** "Hi A7! Need same-day laundry pickup at my Orlando hotel/Airbnb. My location is:"

## Slots (9 = 3 conceitos × 3 formatos)

| # | creative_id_local | conceito / ângulo | ad set | formato | dims alvo | status |
|---|---|---|---|---|---|---|
| 1 | tourist-laundry-parks-1x1 | "You didn't come to Orlando to do laundry" | TOURIST | 1:1 | 1080×1080 | ✅ APPROVED |
| 2 | tourist-laundry-parks-4x5 | idem | TOURIST | 4:5 | 1080×1350 | ✅ APPROVED |
| 3 | tourist-laundry-parks-9x16 | idem | TOURIST | 9:16 | 1080×1920 | ✅ APPROVED |
| 4 | tourist-pack-less-1x1 | "Pack less. We wash the rest." | TOURIST | 1:1 | 1080×1080 | ✅ APPROVED |
| 5 | tourist-pack-less-4x5 | idem | TOURIST | 4:5 | 1080×1350 | ✅ APPROVED |
| 6 | tourist-pack-less-9x16 | idem | TOURIST | 9:16 | 1080×1920 | ✅ APPROVED |
| 7 | tourist-express-checkout-1x1 | "Dirty clothes before checkout?" | EXPRESS | 1:1 | 1080×1080 | ✅ APPROVED |
| 8 | tourist-express-checkout-4x5 | idem | EXPRESS | 4:5 | 1080×1350 | ✅ APPROVED |
| 9 | tourist-express-checkout-9x16 | idem | EXPRESS | 9:16 | 1080×1920 | ✅ APPROVED |

## Pricing exibido esperado
- tourist-laundry-parks / tourist-pack-less → **From $3.25/lb · min $50**
- tourist-express-checkout → **From $3.95/lb · min $50 · subject to availability**

## Checklist de validação por asset
- [ ] abre / não corrompido · dimensão bate · peso adequado (otimizar WebP/JPG)
- [ ] pricing correto (Tourist $3.25 / Express $3.95; nunca $2.90)
- [ ] Express sem "guaranteed" (usar "subject to availability")
- [ ] sem watermark / marca / logo inventado / parque real
- [ ] mover p/ approved/ ou rejected/
