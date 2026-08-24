# Gate B — especificação de reconciliação de conversões

Status: **ENTRADA NECESSÁRIA / SEM ALTERAÇÃO NA CONTA**  
Objetivo: reconciliar Google Ads, Stripe, WhatsApp e MOS/CRM para distinguir abertura de contato, lead qualificado, pedido e pagamento.

## Sinal incremental de 18–19 de agosto

O proprietário confirmou o percurso relatado por novos clientes como `Google → site → WhatsApp`, com concentração em Lake Buena Vista. Dois pedidos de 18 de agosto somaram US$410 recebidos, dos quais US$19 foram identificados como gorjeta. Para 19 de agosto, três novos clientes e faturamento acumulado de aproximadamente US$800 nos dois dias foram informados como expectativa operacional.

Esse sinal está documentado em `COMMERCIAL-SIGNAL-LAKE-BUENA-VISTA-2026-08-19.md`. Ele valida demanda e canal relatado, mas não fecha atribuição paga por pedido. Até existir `click ID/A7 Ref → order_id → payment_id`, classificar as linhas como `owner_confirmed_google_site_whatsapp`; não importar os US$800 projetados como valor de conversão.

No dia 19, o Ads registrou duas aberturas de WhatsApp para três clientes informados pela operação. Essa diferença deve ser explicada no ledger; não deve ser preenchida por inferência nem tratada automaticamente como falha da campanha.

## Entradas mínimas

Fornecer exports do período 2026-07-19 a 2026-08-17, com uma margem adicional de 7 dias após a janela para capturar atraso de conversão:

1. Google Ads: ações de conversão segmentadas por data, campanha, keyword e search term quando disponível.
2. Stripe: payment/charge ID único, data/hora, status, valor, moeda, refund e metadata de origem.
3. MOS/CRM: order ID único, status do pedido, serviço, hotel/região, valor, origem e identificadores de clique disponíveis.
4. WhatsApp operacional: apenas dados agregados ou IDs internos redigidos que permitam marcar conversa iniciada, hóspede qualificado, cotação, pedido e pagamento. Não incluir conteúdo de mensagens nem PII desnecessária.

## Chave de linha e campos obrigatórios

Cada linha deve representar uma transação/pedido real, nunca uma imagem ou revisão de template.

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `order_id` | Sim | ID único e estável no MOS/CRM |
| `payment_id` | Para pagos | Stripe payment/charge ID único |
| `event_datetime_utc` | Sim | Timestamp com fuso explícito; preservar original em coluna separada |
| `status` | Sim | `contact_open`, `conversation`, `qualified`, `quoted`, `confirmed`, `paid`, `refunded`, `cancelled` |
| `amount` | Para financeiro | Valor numérico sem símbolo |
| `currency` | Para financeiro | `USD`, `BRL` ou outra moeda explícita |
| `service` | Sim | `standard`, `express` ou `unknown` |
| `hotel_region` | Quando disponível | Região agregada; não usar nome/endereço do hóspede |
| `gclid` | Quando disponível | Click ID original, sem reconstrução ou inferência |
| `gbraid`/`wbraid` | Quando disponível | Identificadores alternativos de clique |
| `utm_source`/`utm_campaign`/`utm_term` | Quando disponível | Valores originais |
| `google_conversion_action` | Para eventos Ads | Nome exato da ação |
| `is_duplicate` | Sim | Booleano com critério documentado |
| `refund_amount` | Quando aplicável | Mesmo padrão de moeda do pagamento |

Gorjetas devem permanecer em campo financeiro operacional separado e não compor `amount` quando esse valor for usado para otimização de mídia. O template canônico atual representa apenas o valor elegível de serviço; qualquer `tip_amount` precisa permanecer no ledger financeiro protegido ou em uma extensão explicitamente aprovada do contrato.

`invoice_number` das imagens de Downloads não pode ser usado como chave: números foram reutilizados em versões com hotéis, valores e serviços diferentes.

## Regras de reconciliação

1. Fazer match determinístico por `payment_id`, `order_id` ou click ID. Não associar por semelhança de valor/imagem.
2. Deduplicar reload de thank-you, reenvio de link e eventos repetidos antes de somar receita.
3. Preservar a moeda original. Se houver conversão para BRL, registrar taxa, fonte e data em campos separados.
4. Separar `WhatsApp click` de conversa iniciada e de lead qualificado.
5. Marcar compras sem click ID como `paid_unattributed`, não como Google Ads por inferência.
6. Tratar refunds/cancelamentos como estado financeiro, não apagar a transação original.

Estado live já confirmado: o auto-tagging do Google Ads está ativo. O teste pendente é verificar se o GCLID/GBRAID/WBRAID chega à landing, é capturado no início do contato e permanece ligado ao pedido/payment ID.

O audit de código em `ATTRIBUTION-CHAIN-AUDIT-2026-08-18.md` confirmou captura na landing e geração de `A7 Ref`, mas encontrou uma quebra operacional: a referência do payment link é opcional/manual e não há integração MOS/pedido comprovada.

## Saídas e critérios de aprovação

O Gate B fecha somente quando houver:

- contagem reconciliada das 5 compras do Google Ads;
- explicação de qualquer diferença Ads ↔ Stripe ↔ MOS;
- confirmação de moeda e receita líquida;
- taxa `clique → WhatsApp → qualificado → confirmado → pago`;
- lista de keywords/search terms associada a pedidos pagos ou leads qualificados quando identificável;
- diagnóstico de perda de click IDs e plano de correção;
- decisão documentada sobre manter WhatsApp como Primary, migrar para Secondary ou usar qualificado/purchase como sinal principal;
- aprovação explícita do proprietário antes de qualquer mudança de meta ou bidding.

## Formas seguras de fornecer os dados

- Export CSV redigido de Stripe e MOS/CRM salvo na pasta de auditoria; ou
- sessão autenticada aberta pelo proprietário para leitura assistida; ou
- relatório agregado que preserve IDs técnicos e remova nome, telefone, endereço e conteúdo de conversa.

Não solicitar nem armazenar senha, código 2FA ou credenciais.

## Reconciliador local preparado

O template canônico está em `gate-b-ledger-template.csv`. Depois de preencher o ledger redigido, executar:

```bash
npm run google-ads:reconcile-gate-b -- \
  --input marketing/google-ads/2026-07-guest-laundry-search/gate-b-ledger.csv \
  --out marketing/google-ads/2026-07-guest-laundry-search/gate-b-report.json \
  --expected-ads-purchases 5
```

O CLI falha se houver colunas de PII, timestamps sem fuso, linhas pagas sem IDs/valor/moeda, eventos duplicados sem marcação ou ausência de identificador técnico determinístico. O arquivo de saída é criado sem sobrescrever um relatório existente. Um resultado `ready: true` comprova apenas a integridade técnica do ledger; o Gate B ainda exige revisão operacional e aprovação do proprietário.
