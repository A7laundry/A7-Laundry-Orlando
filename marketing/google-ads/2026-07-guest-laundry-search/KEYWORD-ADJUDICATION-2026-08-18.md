# Adjudicação de keywords e search terms — 2026-08-18

Status: **SOMENTE LEITURA / NÃO EXECUTAR**  
Conta: `290-113-2891`  
Campanha: `24072699595`  
Janela: 2026-07-19 a 2026-08-17

## Limites da evidência

- Os search terms visíveis cobrem 111/163 cliques (68,1%), R$1.478,39/R$2.121,01 (69,7%) e 24,5/38 conversões agregadas (64,5%). O restante está oculto por limiares e agregação.
- As 38 conversões misturam 33 aberturas de WhatsApp e 5 compras. Portanto, conversão de plataforma não é prova de lead qualificado nem venda.
- `laundry service price list near me` e `crown linen laundry` exibem cliques maiores que impressões no CSV. Devem ser confirmados na interface antes de qualquer uso decisório.
- 359/412 linhas têm zero clique/custo. São `INSUFFICIENT_DATA`, exceto quando a incompatibilidade semântica do serviço for confirmada.

## Decisão provisória sobre as keywords live

### KEEP — preservar como controle

| Keyword | Evidência | Decisão |
| --- | --- | --- |
| `"hotel laundry service"` | Intenção hotel perfeita; R$13,26; amostra mínima; rank perdido 76,30% | Manter; melhorar relevância sem escalar por enquanto |
| `"laundry pickup and delivery"` | Serviço exato; R$323,88; QS 8 | Manter como controle |
| `"laundry pickup near me"` | Forte afinidade; R$88,13; valor registrado ainda não reconciliado | Manter como controle |

### SEGREGATE/TEST — não pausar em bloco

| Keyword | Evidência | Próximo teste permitido após Gate B |
| --- | --- | --- |
| `"wash and fold near me"` | R$756,90; QS 3; maior gasto; valor registrado 0 | Separar em genérico com teto próprio e message match hotel |
| `"laundry service orlando"` | R$508,79; QS 7; valor registrado 0 | Separar em genérico/local |
| `"laundry service near me"` | R$350,10; QS 5; relevância abaixo da média | Separar e melhorar anúncio/landing |
| `"same day laundry service"` | R$61,42; zero conversão agregada; boa intenção Express | Testar em estrutura Express com claim condicional |
| `"wash and fold orlando"` | R$8,17; amostra insuficiente | Manter em teste genérico |

Keywords com entrega mínima ou zero, inclusive as dez do grupo Airbnb, permanecem `INSUFFICIENT_DATA`. Zero impressão não prova baixa qualidade nem autoriza exclusão.

## Search terms por intenção

### KEEP — coerentes com hotel, pickup ou serviço móvel

Manter e usar para arquitetura futura: `laundry service kissimmee fl`, `laundry pickup service near me`, `laundry pick up and delivery near me`, `laundry pick up service`, `pickup delivery laundry service near me`, `laundry delivery near me`, `mobile laundry service near me`, `vacation rental laundry service`, `caribe royale orlando laundry` e `valet laundry service`.

O risco de residentes continua existindo; deve ser reduzido por copy e landing voltadas a hóspedes, não por negativa ampla.

### SEGREGATE/TEST — intenção plausível, mas não comprovada

- Genéricos: `laundry near me`, `laundry service near me`, `wash dry fold near me`, `wash and fold near me`, `laundry room near me`, `laundry orlando`, termos de preço e variantes wash/fold.
- Espanhol: `laundry cerca de mí`, `laundry cerca de mi`, `lavandería near me`. Separar somente se houver atendimento e landing em espanhol; não negativar por idioma.
- Concorrente: `the laundry room orlando`, R$56,90 e zero conversão agregada. Decidir entre teste de conquest isolado ou negativa exata; nunca account-level.
- Self-service/laundromat: linguagem ambígua para turista. Não usar frase/ampla adicional até reconciliar pedidos.

### NEGATIVE_EXACT_CANDIDATE — rascunho condicionado

Somente no nível da campanha Guest e somente após confirmar que o serviço não é oferecido:

1. `[mobile dry cleaning]`
2. `[same day dry cleaners near me]`
3. `[dry cleaning near me]`
4. `[24 hours dry cleaners near me]`
5. `[dry cleaners lake nona]`
6. `[1800 dry clean near me]`
7. `[linen delivery companies]`
8. `[crown linen laundry]`
9. `[laundry subscription]`
10. `[ironing service near me]`

Os seis primeiros formam o lote de menor risco **apenas se** a A7 confirmar que não oferece dry cleaning. Os itens 7–10 dependem também da matriz de linhas de negócio e da validação das métricas anômalas. Nenhum item está aprovado para implantação.

## Negativas live e conflito detectado

A conta possui 15 negativas na campanha. A maioria cobre emprego, reparo, equipamento, insumos, gratuidade e autosserviço. O item crítico é `laundromat` em correspondência ampla.

Essa negativa pode alcançar consultas de hóspedes que usam `laundromat` como sinônimo genérico de serviço de lavanderia. Como `public laundry near me` e `laundromats close to my location` registraram microconversões, a decisão correta é `REVIEW_EXISTING_NEGATIVE`, não remoção automática e não expansão.

Não adicionar como phrase/broad: `dry`, `laundry room`, `near me`, `cheap`, `coupon`, `price`, espanhol, concorrentes, hotéis, Disney, Kissimmee ou `laundromat` adicional.

## Regra de implantação futura

1. Exportar search terms segmentados por ação de conversão e reconciliar GCLID/order/payment ID.
2. Confirmar matriz de serviços e conflitos com todas as campanhas.
3. Gerar diff exato e obter aprovação do proprietário.
4. Aplicar primeiro um lote pequeno de negativas exatas no nível mínimo necessário.
5. Validar elegibilidade e termos imediatamente após a alteração.
6. Monitorar em 24h, 72h e 7d; reverter se cair entrega/pedido qualificado de hotel/pickup.

## Resultado atual

- Nenhuma keyword positiva deve ser pausada com os dados disponíveis.
- Nenhuma nova negativa deve ser aplicada antes do Gate B e da confirmação da matriz de serviços.
- A estrutura futura deve separar Hotel/Pickup, Express, Generic, Competitor e Spanish somente por lotes aprovados, preservando o controle vencedor.
