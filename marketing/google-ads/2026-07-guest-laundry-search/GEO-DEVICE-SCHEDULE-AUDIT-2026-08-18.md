# Auditoria live — geografia, dispositivos e agenda

Status: **SOMENTE LEITURA / NENHUMA ALTERAÇÃO**  
Janela: 2026-07-19 a 2026-08-17  
Conta: GMT-03:00; operação Orlando

## Agenda live

A campanha está qualificada para veicular todos os dias, em todos os horários. Não há faixas ou ajustes de lance configurados.

Na janela auditada, Orlando estava em EDT (UTC-04) e a conta em GMT-03. Portanto:

`hora exibida no Google Ads − 1 hora = hora local de Orlando`

Exemplo: `09–10` na conta corresponde a `08–09` em Orlando para essa janela. A regra deve ser recalculada quando o horário de verão mudar; não usar uma subtração fixa o ano inteiro.

O relatório dia+hora contém 164 combinações. Ele mistura 33 aberturas de WhatsApp e 5 purchases. Uma linha de quinta-feira 09–10 exibe 4 cliques, 4,5 conversões e taxa de 112,5%, demonstrando por que esse relatório não pode ser interpretado como vendas por clique.

Decisão: `KEEP_24_7_PENDING_RECONCILIATION`. Não cortar horário antes de cruzar pedidos pagos/qualificados, atraso de conversão, capacidade de resposta e tempo real de pickup. Se a operação não confirma pickup fora de determinados períodos, o claim de 1h deve ser condicionado ou a agenda deve ser alinhada em changeset próprio.

## Dispositivos

| Dispositivo | Cliques | Impressões | Custo | Conversões agregadas | Julgamento |
| --- | ---: | ---: | ---: | ---: | --- |
| Smartphones | 155 | 2.798 | R$2.041,61 | 36 | 95,1% dos cliques e 96,3% do gasto; prioridade absoluta de UX |
| Computadores | 8 | 181 | R$79,40 | 2 | Amostra insuficiente; não excluir |
| Tablets | 0 | 18 | R$0 | 0 | Sem dados |

Não há ajuste de lance por dispositivo. A diferença aparente de CPA agregado não autoriza reduzir smartphones porque quase todo o público hospedeiro/WhatsApp está ali e as conversões são mistas.

QA mobile obrigatório para qualquer lote:

- landing carregando rapidamente em 4G;
- preço, mínimo, Express e condições visíveis antes do CTA;
- CTA WhatsApp funcionando e preservando `A7 Ref`;
- telefone e destino oficiais;
- sem pop-up/overlay bloqueando conversão;
- checkout/confirmation responsivos;
- mensagem curta que qualifique hotel, pickup, serviço e mínimo.

O preflight público `node scripts/preflight-google-ads-live.mjs` passou em 2026-08-18: HTTP 200, parâmetros preservados, termos comerciais canônicos, WhatsApp oficial e tracking live idêntico ao código local validado. Esse teste valida contrato técnico e conteúdo; não mede Core Web Vitals nem conversão real em aparelho/4G.

## Cidades correspondentes

Principais linhas live:

| Cidade correspondente | Cliques | Custo | Conversões agregadas | Estado de segmentação |
| --- | ---: | ---: | ---: | --- |
| Orlando | 90 | R$1.153,49 | 21,5 | Adicionado |
| Orlovista | 27 | R$348,86 | 6 | Correspondência dentro da área, não adicionada isoladamente |
| Kissimmee | 14 | R$204,55 | 3 | Adicionado |
| Citrus Ridge | 8 | R$75,66 | 1 | Adicionado |
| Edgewood | 5 | R$51,09 | 1 | Correspondência dentro da área |
| Lake Buena Vista | 5 | R$45,52 | 3,5 | Adicionado; forte afinidade hotel, amostra mínima |
| Davenport | 3 | R$64,58 | 1 | Adicionado |
| Poinciana | 3 | R$41,86 | 0 | Correspondência dentro da área |
| Lockhart | 2 | R$43,73 | 0 | Correspondência dentro da área |
| Pine Hills | 2 | R$20,41 | 1 | Correspondência dentro da área |
| Union Park | 2 | R$25,75 | 0 | Correspondência dentro da área |
| Pine Castle | 2 | R$45,50 | 0 | Correspondência dentro da área |

`Adicionado/excluído: Nenhuma` não significa tráfego fora da segmentação. A cidade pode corresponder a uma área maior incluída, especialmente Orlando. Não excluir Orlovista, Edgewood, Poinciana ou outras cidades apenas pelo rótulo ou por 0 conversões em 2–3 cliques.

Decisão: manter as cinco áreas atuais até conciliar pedidos, hotéis e capacidade. Qualquer expansão/exclusão futura deve usar pedido pago/qualificado, margem, tempo de rota e capacidade de pickup — não conversões agregadas.

## Riscos operacionais

1. A campanha 24/7 pode gerar expectativa de pickup imediato quando a operação só consegue confirmar a solicitação online.
2. Lake Buena Vista e corredores hoteleiros são estrategicamente relevantes, mas o volume atual é pequeno.
3. O predomínio mobile torna qualquer falha de WhatsApp/landing um risco P0.
4. A conta está uma hora adiantada em relação a Orlando na janela; dayparting sem conversão de fuso estaria errado.
5. Não há prova de pedidos finais por cidade/hora/dispositivo.

## Próximo gate

Acrescentar ao ledger reconciliado:

`order_id | paid/qualified | city/hotel corridor | device | Ads hour | Orlando hour | request time | confirmed pickup time | actual pickup time | service | margin`

Somente então propor agenda, geo ou device changeset.
