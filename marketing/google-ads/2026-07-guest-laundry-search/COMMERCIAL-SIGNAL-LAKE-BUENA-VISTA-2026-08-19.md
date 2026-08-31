# Sinal comercial — Lake Buena Vista — 2026-08-18 a 2026-08-19

Status: **VALIDAÇÃO COMERCIAL INFORMADA PELO PROPRIETÁRIO / ATRIBUIÇÃO TÉCNICA PARCIAL**  
Privacidade: registro agregado; nenhum nome, telefone, quarto ou endereço de hóspede é armazenado.

## Resultado executivo

O funil `Google → site A7 → WhatsApp → pedido` produziu demanda comercial real em dois dias consecutivos, com concentração relevante em Lake Buena Vista e hotéis/resorts do corredor Disney.

Isso valida três premissas do projeto:

1. hóspedes já instalados em hotéis são um público comprador, não apenas uma audiência de pesquisa;
2. conveniência de pickup, coordenação pelo WhatsApp e handoff com a operação do hotel resolvem uma dor real;
3. tickets observados/projetados acima do mínimo público sustentam o posicionamento premium sem desconto como mensagem principal.

## Evidência operacional informada

### 2026-08-18

- três contatos comerciais observados no período operacional;
- dois pedidos confirmados na região-alvo de hotéis/resorts;
- US$410 recebidos nos dois pedidos;
- US$391 correspondem aos pedidos antes da gorjeta identificada;
- US$19 correspondem a gorjeta e devem permanecer separados da receita usada para otimização;
- um contato informou Hallandale Beach, mas a leitura do Google Ads não encontrou clique, impressão ou custo correspondente nessa cidade.

### 2026-08-19

- três novos clientes informados na região de Lake Buena Vista;
- expectativa operacional superior a US$120 por pedido;
- o proprietário projeta aproximadamente US$800 de faturamento bruto acumulado nos dois dias;
- enquanto os pagamentos finais do segundo dia não estiverem registrados por transação, a diferença acima dos US$410 já recebidos permanece `projected`, não `paid`.

Leitura live somente leitura do Google Ads no mesmo dia, ainda sujeita a atraso de relatório:

- 74 impressões;
- 6 cliques;
- R$104,99 de custo;
- 2 conversões pendentes, ambas `A7 - WhatsApp click (site)`;
- zero compra e zero valor de conversão registrados;
- 5 dos 6 cliques ocorreram em smartphones; as duas aberturas de WhatsApp ocorreram em smartphones.

A operação relatou três clientes, enquanto o Ads registrou duas aberturas de WhatsApp. A diferença pode representar descoberta orgânica/direta, atraso de conversão, bloqueio de tracking ou uma entrada não coberta pela ação. Não é válido atribuir automaticamente os três clientes à campanha paga.

Se os cinco pedidos-alvo encerrarem os dois dias em US$800, o ticket médio bruto observado será aproximadamente US$160. Esse cálculo é cenário de fechamento, não valor importável para o Google Ads.

## Evidência live do Google Ads em 2026-08-18

Leitura somente leitura da campanha `24072699595`, no fuso da conta `(GMT-03:00) Horário Padrão de Brasília`:

- 126 impressões;
- 8 cliques, todos em smartphones;
- R$182,78 de custo;
- 3 conversões;
- as três conversões foram exclusivamente `A7 - WhatsApp click (site)`;
- zero compra registrada e zero valor de conversão no relatório daquele dia;
- cidades correspondentes com clique: Orlando, 7 cliques e 2 aberturas de WhatsApp; Orlovista, 1 clique e 1 abertura de WhatsApp;
- Hallandale Beach não apareceu nos locais correspondentes;
- os termos visíveis cobriram somente 4 dos 8 cliques e nenhuma das três conversões, portanto não identificam os pedidos individualmente.

## Limite da confirmação de origem

O proprietário confirmou que os clientes encontraram a A7 no Google, entraram no site e seguiram para o WhatsApp. Isso confirma o canal e o percurso relatado pelo cliente.

Nos dois dias, a coincidência entre movimento operacional e aberturas de WhatsApp no Ads é um sinal forte de contribuição paga, mas não uma chave determinística por pedido. Em 19 de agosto há inclusive uma diferença explícita entre três clientes operacionais e duas conversões Ads pendentes.

Ainda não está comprovado, por pedido individual:

- se a descoberta ocorreu em anúncio pago ou resultado orgânico;
- qual campanha, keyword e search term originou cada pedido;
- qual GCLID/GBRAID/WBRAID corresponde a cada pedido;
- qual `A7 Ref`, order ID e payment ID fecham a cadeia técnica.

Sem essas chaves, os pedidos devem ser classificados como `owner_confirmed_google_site_whatsapp` e não como `google_ads_paid_attributed`.

## Decisão estratégica

- Preservar a campanha e o RSA controle enquanto o novo sinal comercial é reconciliado.
- Não aumentar orçamento, alterar tCPA ou trocar metas usando apenas dois dias de resultado.
- Tratar Lake Buena Vista como segmento prioritário de observação por 7 a 14 dias.
- Preparar um challenger específico para Lake Buena Vista/Disney somente após confirmar fechamento, margem, capacidade e atribuição.
- Priorizar purchase/qualified lead com valor real como sinal futuro; WhatsApp aberto continua sendo microconversão.
- Separar gorjeta, imposto, refund e receita do serviço no ledger.

## Próxima entrada necessária

Para cada um dos pedidos desses dois dias, preencher o ledger redigido com:

`order_id | payment_id | timestamp UTC | status | service amount | tip amount fora do valor Ads | currency | service | hotel_region | A7 Ref/attribution ID | click ID quando disponível | UTM | refund`.

Nenhuma informação pessoal do hóspede deve entrar no repositório.
