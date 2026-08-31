# Auditoria live de configurações e anúncios — 2026-08-18

Status: **SOMENTE LEITURA / NENHUMA ALTERAÇÃO**  
Conta: `290-113-2891`  
Campanha: `24072699595`

## Configurações defensivas confirmadas

| Controle | Estado live | Julgamento |
| --- | --- | --- |
| Rede de Pesquisa Google | Ativa | Correto |
| Parceiros de pesquisa | Desativados | Correto; não ampliar antes de sinal final confiável |
| Rede de Display | Desativada | Correto |
| Localização | Orlando, Kissimmee, Lake Buena Vista, Davenport e Citrus Ridge | Coerente com a área planejada; validar capacidade por região antes de escalar |
| Opção de localização | Presença: pessoas que estão ou frequentam a área | Correto para hóspedes já presentes |
| Exclusão geográfica | Brasil | Coerente como proteção adicional; presença já é o controle principal |
| Idioma | English | Coerente com a campanha EN; espanhol exige estrutura própria |
| AI Max | Desativada; sem entrega em correspondências expandidas | Correto |
| Personalização de texto | Desativada | Correto |
| Expansão de URL final | Desativada | Crítico para evitar páginas públicas conflitantes |
| Recursos automáticos | Desativados; usar apenas recursos enviados | Correto |
| Correspondência ampla da campanha | Desativada | Correto |
| Search Partners/Display autoexpansion | Desativados | Correto |
| Autoaplicação de recomendações | 0/7 manutenção e 0/14 expansão | Correto; nada autoaplicado |
| Sufixo de URL | UTMs + `{adgroupid}`, `{creative}`, `{keyword}`, `{device}`, `{matchtype}`, `{network}` | Bom baseline; ainda falta provar persistência até pedido/pagamento |
| Auto-tagging da conta | Ativo (`Codificação automática: Sim`) | GCLID pode ser criado; ainda falta provar captura e persistência operacional |
| Negativas em nível de conta | Nenhuma | As 15 negativas auditadas estão diretamente na campanha |
| Aplicação automática na conta | Desativada | Confirmação redundante do painel de recomendações |

Sufixo observado:

`utm_source=google&utm_medium=cpc&utm_campaign=guest_search_orlando&utm_content={adgroupid}_{creative}&utm_term={keyword}&device={device}&matchtype={matchtype}&network={network}`

## Estado de anúncios

Existem dois RSAs ativos:

- `Hotel Guest Laundry`: toda a entrega, 2.997 impressões, 163 cliques e R$2.121,01; qualidade do anúncio `Excelente`.
- `Airbnb Guest Laundry`: zero impressão e zero clique; qualidade `Bom`.

O RSA Hotel envia para `https://a7laundry.com/laundry-pickup-delivery-orlando` e usa, entre outros:

- `Hotel Laundry Pickup`
- `Enjoy Orlando, Skip Laundry`
- `Wash, Fold & Delivered`
- `From $3.25/Lb`
- `$50 Minimum Order`
- `Pickup & Delivery Included`
- `24-Hour Normal Service`
- `A7 Laundry Orlando`
- `Check Times On WhatsApp`

Descrição principal observada: `Staying in Orlando? We pick up, wash, fold and return laundry to your hotel.`

O anúncio está alinhado com Standard e com a landing, mas não expressa claramente o produto premium/Express, pickup condicional em 1h ou retorno Express em até 8h. Isso é lacuna de posicionamento, não justificativa para editar o RSA controle.

## Assets observados

Sitelinks ativos incluem `Vacation Rental Laundry`, `Hotel Guest Laundry`, `How It Works`, `What We Wash`, `Pricing` e `Service Areas`. Callouts observados incluem `Contactless Service`, `Pickup & Delivery` e `$50 Minimum Order`. Há asset de chamada ativo.

A recomendação do Google para “adicionar frases de destaque” não deve ser aplicada automaticamente: assets de frase de destaque já foram observados ao vivo e a recomendação pode se referir a outro escopo/campanha.

As métricas de asset não provam que o texto isolado causou conversão. Em RSAs, recursos aparecem em combinações e a coluna Conversões continua contaminada por WhatsApp opens.

## Recomendações Google rejeitadas nesta fase

Não aplicar AI Max, Performance Max, parceiros de pesquisa, Display, broad match, mudanças automáticas de RSA ou qualquer item apenas para elevar o Optimization Score de 71,9%.

## Conclusão

Os controles de alcance e destino estão defensivos. O próximo aprimoramento de anúncio deve ser um RSA challenger Hotel/Express, preservando o RSA controle, com claims condicionais e sem alterar simultaneamente bidding, metas, orçamento ou negativas.

O auto-tagging ativo elimina uma hipótese de falha na origem do GCLID. Ele não prova que landing, WhatsApp, operador, MOS e Stripe preservam o identificador; essa continuidade continua sendo requisito do Gate B.

O preflight público da landing e do tracking passou em 2026-08-18 usando `scripts/preflight-google-ads-live.mjs`: destino HTTP 200, query preservada, preço/mínimo/Express corretos, WhatsApp oficial e source live de tracking igual ao local.
