# Drift check live — 2026-08-20

Modo: **SOMENTE LEITURA / NENHUMA ALTERAÇÃO PUBLICADA**  
Conta: `290-113-2891`  
Campanha: `24072699595`

## Veredito

O baseline defensivo permanece preservado. Foram encontrados dois deltas materiais:

1. o RSA Hotel ainda contém a descrição obsoleta `Express 6h`, incompatível com a oferta canônica de até 8h após confirmação e disponibilidade;
2. os fundos disponíveis caíram para R$162,30, apenas 1,08 vezes o orçamento diário de R$150.

O primeiro delta justifica um lote factual isolado. O segundo bloqueia aumento de orçamento, lances ou alcance e exige decisão financeira do proprietário.

## Estado live

| Controle | Estado em 2026-08-20 | Drift |
| --- | --- | --- |
| Campanha | Ativada; qualificada (limitada) | Sem mudança de status |
| Orçamento | R$150/dia | Sem mudança desde 16/08 |
| Estratégia | CPA desejado | Sem mudança desde 13/08 |
| tCPA | R$49,25 | Sem mudança |
| Rede | Rede de Pesquisa Google | Sem drift observado |
| Metas | Padrão da conta: Compras, Contatos e Lead telefônico | Sem mudança |
| AI Max | Não ativada | Sem drift |
| Personalização/expansão de URL | Desativadas | Sem drift |
| Recursos automáticos | Desativados | Sem drift |
| Broad da campanha | Desativada | Sem drift |
| Idioma | English | Sem drift |
| Locais | 5 segmentados; Brasil excluído | Sem drift no resumo |
| Fundos disponíveis | R$162,30 | **Crítico** |
| Último pagamento | R$500, Pix manual, 18/08 | Atualização financeira |

O simulador informa que a campanha ficou limitada pelo orçamento nos últimos sete dias. Isso é apenas um diagnóstico de entrega; não autoriza elevar verba antes de reconciliar pedidos, margem e capacidade.

## Performance exibida

Janela de 30 dias da interface: 21/07–19/08/2026.

| Métrica | Valor |
| --- | ---: |
| Impressões | 3.241 |
| Cliques | 178 |
| Custo | R$2.427,42 |
| Conversões agregadas | 47 |
| Stripe purchases | 7 |
| WhatsApp opens | 40 |
| Valor de conversão exibido | 3.408,94 |

No total acumulado exibido em 20/08, a interface mostrava 8 Stripe purchases e 42 WhatsApp opens. A diferença para a janela de 30 dias pode refletir data/período e atraso de relatório; não deve ser tratada como pedido físico sem reconciliação.

## Metas e ações de conversão

| Ação | Otimização | Contagem | Janela | Meta da conta | 30 dias |
| --- | --- | --- | --- | --- | ---: |
| A7 Guest Laundry - Stripe purchase | Principal | Todas | 90 dias | Sim | 7 |
| A7 - WhatsApp click (site) | Principal | Uma | 90 dias | Sim | 40 |
| Calls from ads | Principal | Todas | 30 dias | Sim | 0 |
| A7 - Website call 60s | Principal | Uma | 30 dias | Sim | 0 |

O sinal de bidding continua dominado por abertura de WhatsApp: 40 de 47 conversões na janela, ou 85,1%. Não alterar metas ou tCPA no lote factual.

## RSA Hotel — inconsistência confirmada

Entidade do anúncio: `818373306214`  
Ad group: `Hotel Guest Laundry` (`203857555652`)

Descrição live incompatível:

`Normal 24h. Express 6h is subject to availability. Check times on WhatsApp.`

Oferta canônica:

- Standard: cerca de 24h;
- Express: até 8h após confirmação e sujeito à disponibilidade;
- mínimo público: US$50.

Os demais campos observados estão coerentes: URL final canônica, Standard a US$3,25/lb, mínimo US$50, pickup/delivery incluídos e atendimento via WhatsApp.

## Negativas

As 15 negativas do baseline continuam aplicadas diretamente à campanha. Nenhuma negativa nova foi observada no histórico. A negativa ampla `laundromat` permanece como risco conhecido e não será alterada no lote factual.

## Histórico de alterações

Não há mudança registrada depois de 16/08 na janela exibida. Últimos eventos materiais:

- 16/08 11:21: orçamento aumentado;
- 13/08 09:00: recomendação de CPA desejado aplicada;
- 06/08 12:27: orçamento aumentado.

## Destino e tracking

O comando `npm run preflight:google-ads:live` passou em 20/08: destino, termos comerciais, atribuição na URL e source live de tracking válidos.

## Decisão

- elegível para aprovação: correção isolada da descrição `Express 6h` para `Express up to 8h` com condição explícita;
- bloqueados: orçamento, tCPA, metas, negativas, estrutura, geografia, agenda e expansão de alcance;
- ação externa necessária: definir reposição de fundos antes de a campanha consumir o saldo disponível.

