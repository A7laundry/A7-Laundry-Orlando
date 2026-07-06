# Placements — Stopgap + plano do 9:16 correto (JUL26)

**Data:** 2026-07-04 · **Status:** stopgap a aplicar (manual, no Ads Manager) · 9:16 correto = segunda.

## Problema (confirmado por dados)
A JUL26 está em **placements automáticos (Advantage+)** e entrega em Stories/Reels (9:16), onde os criativos atuais (A/A2 = 4:5, C = 1:1, B = 1.91:1) **são cortados** — cortando preço/headline (visto ao vivo no Instagram do dono). Corte também atrai clique ruim → conecta com as "2 conversas de pessoas aleatórias".

### Evidência — entrega por placement (acum. 3–4/jul, ~$34,67)
| Placement | Impr. | Gasto | CTR | Encaixe |
|---|---|---|---|---|
| Feed (FB+IG) | 1.187 | $22,35 | 1,26% | ✅ ok (1:1/4:5) |
| Instagram Stories | 287 | $6,91 | **0,70%** | ❌ cortado |
| Instagram Reels | 174 | $3,70 | **2,87%** | ❌ cortado (mas CTR alto!) |
| Facebook Reels | 66 | $1,43 | **0%** | ❌ cortado |
| FB Stories / Marketplace / Search / etc. | ~57 | ~$0,5 | baixo | ⚠️ |

**~35% do gasto (~$12) foi pra verticais cortados.** IG Stories CTR 0,70% vs Feed 1,26% = prejuízo do corte. **IG Reels 2,87%** mostra que o vertical tem potencial **se tiver o 9:16 certo**.

## Por que NÃO editar via MCP
`ads_update_entity` exigiria reescrever o targeting inteiro e **não dá pra ler o geo/idade atual** pra preservar → risco de apagar o público. Além disso força PAUSE. **Fazer no Ads Manager.**

## ⚠️ Atenção: 3 rascunhos pendentes
A conta tem **"Conferir e publicar (3)"** pré-existentes (não são nossos, origem desconhecida). Ao publicar o stopgap, **conferir na tela de revisão** pra não empurrar rascunho estranho junto. Se não reconhecer, **Descartar rascunhos**.

## Stopgap — passo-a-passo (Ads Manager, ~2 min)
Para **AS1** e **AS2**:
1. Selecionar o conjunto → **Editar**.
2. Rolar até **Posicionamentos**.
3. Trocar **"Advantage+ (automático)" → "Posicionamentos manuais"**.
4. **Desmarcar:** Stories (FB+IG) e Reels (FB+IG).
5. **Manter:** Feed do Facebook, Feed do Instagram (opcional: Explore, Marketplace).
6. **Publicar** conferindo que só as suas mudanças vão.

## Verificação (depois de publicar)
Puxar de novo a quebra por `platform_position` (via MCP, leitura) e confirmar **Stories/Reels ≈ 0** e gasto concentrado no Feed.

## Plano de segunda — 9:16 correto (fix definitivo)
1. **Safe zone:** regenerar os 9:16 com **preço/headline no miolo central (~60%)** — a UI de Stories/Reels cobre ~14% topo (perfil/"patrocinado") e ~20% base (legenda + CTA). Logo/headline nas bordas somem.
2. **Placement customization:** no anúncio, atribuir **9:16 → Stories/Reels** e **1:1/4:5 → Feed** (já temos os 3 formatos de tourist + comforter).
3. Reativar Stories/Reels (onde o Reels já deu CTR 2,87%).

> Regra aprendida: ter os 3 formatos não basta — precisa **atribuir por placement** + **respeitar safe zone** no 9:16.
