# Sprint de otimização — Meta, GA4, SEO e receita

**Data-base:** 22 de julho de 2026
**Estado:** nova campanha manual de hóspedes ativa a US$ 30/dia; primeira leva em veiculação
**Fonte:** MOS reconciliado com Meta Ads, GA4 e Google Search Console

## Decisão executiva

O proprietário confirmou que as vendas observadas vieram somente de **roupa por libra para hóspedes**. Edredons e cobertores não tiveram venda confirmada. Portanto, conversa iniciada no Meta não pode ser tratada como venda: o C2 registrou três conversas, mas zero vendas confirmadas do serviço.

Neste plano, “hóspedes” significa turistas/viajantes hospedados em hotéis e Airbnbs que contrataram wash & fold por libra. Esse resultado não deve ser atribuído ao público local nem às ofertas de edredom/cobertor.

O próximo ciclo deve concentrar toda a verba em guest wash & fold, preservar A4/A3 como controles e testar T5/T6 nos posicionamentos verticais e LA7/LA8 no Feed. Os criativos C3/C4 ficam no backlog, sem publicação e sem verba, até existir uma hipótese comercial nova ou demanda orgânica comprovada.

## Prioridades

| Prioridade | Área | Problema comprovado | Ação | Responsável sugerido | Prazo | Critério de sucesso |
|---|---|---|---|---|---|---|
| P0 | GA4/atribuição | 474 cliques do Meta e nenhuma sessão paga identificada | Aplicar UTMs padronizadas em todos os anúncios e validar `whatsapp_click`, `generate_lead`, `begin_checkout` e `purchase` | Marketing + desenvolvimento | 48 h | Sessões de Paid Social aparecem no GA4 e cada anúncio pode ser conciliado pela UTM |
| P0 | Receita | Receita e ROAS indisponíveis | Integrar leitura de pedidos/Stripe ao MOS sem transformar ausência em zero | Operações + desenvolvimento | 7 dias | Receita, ticket médio, CAC e ROAS verificáveis por período |
| P0 | Mix de serviços | Edredom teve 3 conversas no Meta, mas 0 vendas confirmadas | Retirar comforter do próximo ciclo pago e manter C3/C4 no backlog | Marketing | Antes do próximo teste | 100% da verba de teste aplicada a guest wash & fold; nenhuma publicação de C3/C4 |
| P1 | Turista EN | A3 tem CTR de 1,44% e custo/conversa de US$ 22,66 | Testar uma versão mais simples, com menos texto e demonstração clara da coleta no hotel | Marketing | 72 h de teste | CTR ≥ 1,70% e custo/conversa ≤ US$ 20 |
| P1 | Turista PT | A4 é o melhor controle: CTR 1,71% e custo/conversa US$ 19,79 | Preservar A4 e testar um challenger UGC sem substituir o vencedor | Marketing | 72 h de teste | Challenger supera A4 em custo/conversa com pelo menos 3 conversas |
| P1 | SEO | Posição média 19,1; CTR desktop 0,5%; 18 URLs descobertas e não indexadas | Melhorar títulos/snippets das páginas com posição 4–15, criar links internos e revisar as 18 URLs | Conteúdo + SEO | 14 dias | CTR desktop ≥ 1,0%, menos URLs “descobertas, não indexadas” e crescimento sem alegações de base pequena |

## Proteção de caixa

- Não aumentar o orçamento diário atual de **US$ 30** durante o primeiro ciclo.
- A arquitetura detalhada do orçamento está em `GUEST-LAUNDRY-30-DAY-STRATEGY.md`.
- Distribuição manual aprovada: concentrar **US$ 30/dia no AS2 Tourist-Hotel-Airbnb**, reaproveitando o público e os controles A4/A3; pausar AS1 local/comforter e adicionar LA7/T5 e LA8/T6 como challengers no AS2.
- LA7/LA8 são peças 1:1 exclusivas para Feed; T5/T6 são as peças 9:16 para Stories/Reels.
- “Força total” significa concentrar o orçamento no segmento comprovado, não usar automações Advantage+ neste ciclo e não elevar o limite diário sem autorização explícita.
- Não reduzir o preço do serviço: preço oficial continua sendo a fonte de verdade.
- Criar challengers inicialmente **PAUSADOS**; publicação é um gate manual separado.
- Quando aprovados, testar controle e challenger no mesmo público, posicionamentos e janela de atribuição.
- Evitar mudança simultânea de público, copy e criativo; cada célula deve testar uma hipótese principal.
- Não decidir vencedor por CTR sozinho: conversa e custo por conversa são os resultados principais.

## Regras de decisão após publicação

1. **Sem decisões antes de US$ 15 de gasto por criativo**, salvo erro de compliance.
2. **Pausar** challenger com zero conversa após US$ 30 de gasto.
3. **Revisar** entre US$ 15–30 se CTR ficar abaixo de 1,0%.
4. **Promover** quando atingir pelo menos 3 conversas e custo por conversa 15% menor que o controle.
5. **Escalar no máximo 20% ao dia** somente depois de dois ciclos consecutivos dentro da meta.
6. Se o volume for insuficiente em 72 h, prolongar a janela; não declarar vencedor com amostra fraca.

## O que significa “diminuir os valores”

O alvo é reduzir **custo por conversa qualificada, custo por venda e desperdício**, não desvalorizar o preço do serviço. A meta inicial é levar o custo por conversa do serviço comprovado de roupa por libra para **≤ US$ 18,00** e começar a registrar vendas por anúncio. Sem quantidade de vendas e receita conciliadas, CAC e ROAS permanecem indisponíveis.
