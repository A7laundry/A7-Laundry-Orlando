# Pré-Flight Report — JUL26

**Data:** 2026-07-02 · **Modo:** somente leitura (MCP oficial + Claude in Chrome) · **Nada foi editado/publicado/pausado.**

## Veredito: 🟢 GO PLENO

## Checklist
| Item | Resultado |
|---|---|
| Status campanha | Programada — início 2026-07-03 05:00 PDT |
| Estrutura | 1 campanha · 2 ad sets · 4 anúncios — todos ACTIVE ✅ |
| Erros de entrega (`ads_get_errors`) | Vazio `{}` — sem bloqueios ✅ |
| Opportunity score | **94/100** (única sugestão: música auto — descartável p/ imagem estática) |
| Previews dos 4 anúncios | OK — imagem/copy/headline/preço corretos, sem erro visual ✅ |
| Tradução automática | OFF (inglês, sem sobreposição) ✅ |
| Formulário | Ausente — CTA WhatsApp nativo ✅ |
| CTA / destino | `WHATSAPP_MESSAGE` nos 4 ✅ |
| Página vinculada | `625129510685107` = A7 Laundry & Carpet Cleaning (única) ✅ |
| **Número WhatsApp** | **+1 407-670-8839** nos 4 anúncios (verificado no Ads Manager) ✅ |
| Número de teste | +1 555-628-7241 existe em WABA de teste — **ISOLADA, não usada** ✅ |
| Pricing por público | Local $2.90 · Tourist $3.25 · Express $3.95 · Comforter por tamanho — coerente c/ pricing-rules ✅ |

## Notas
- **Divergência de preço** entre públicos (local $2.90 vs turista $3.25/$3.95) é **segmentação intencional**, não bug.
- **Limitação:** MCP não expõe o número WhatsApp em read-only; nem o preview iframe (botão não abre). O número foi confirmado via **Ads Manager → editar anúncio → campo "Número de telefone do WhatsApp"**. WhatsApp Manager sozinho engana (só mostra WABAs de Cloud API).
- **Ação manual recomendada quando necessário:** reconfirmar +1 407-670-8839 via Ads Manager antes de grandes mudanças.

## Anúncios (formato)
- A (4:5), A2 (4:5), C (1:1) · **B é 1.91:1 horizontal** — otimização futura (pode entregar menos em placements verticais).
