# Google Ads API nativa no MOS

## Objetivo

Conectar a conta Google Ads `290-113-2891` ao MOS em modo somente leitura, sem
transformar dados do GA4 ou snapshots históricos em estado atual da conta.

## Contrato operacional

- O MOS só declara campanha, anúncio e entrega atuais quando a fonte responde como
  `Google Ads API`.
- O vínculo Google Ads → GA4 continua útil para campanha → landing page → evento,
  mas permanece identificado como `partial_live`.
- Falha de credencial ou da API resulta em `unavailable`; nunca em saldo, custo,
  campanha ou conversão iguais a zero.
- Google Ads, Meta Ads, GA4 e Search Console usam períodos independentes.
- O contrato é somente leitura: as consultas usam Google Ads Query Language e não
  executam mutate, upload, orçamento, campanha ou cobrança.

## Pré-requisitos externos

1. Uma conta administradora Google Ads vinculada à conta `290-113-2891`.
2. Developer token emitido no Centro de API da conta administradora.
3. O usuário técnico
   `mos-readonly@a7-laundry-mos.iam.gserviceaccount.com` adicionado com acesso
   somente leitura à conta administradora ou diretamente à conta anunciante.
4. A Google Ads API habilitada no projeto Google Cloud já usado pelo MOS.

O Centro de API não fica disponível em uma conta anunciante comum. Criar ou
vincular a conta administradora é uma ação externa e deve ser confirmada antes de
salvar qualquer alteração.

## Variáveis no servidor do MOS

```dotenv
GOOGLE_ADS_CUSTOMER_ID=2901132891
GOOGLE_ADS_LOGIN_CUSTOMER_ID=ID_DA_CONTA_ADMINISTRADORA
GOOGLE_ADS_DEVELOPER_TOKEN=TOKEN_DO_CENTRO_DE_API
GOOGLE_ADS_API_VERSION=v25
GOOGLE_ADS_ACCOUNT_TIME_ZONE=America/Sao_Paulo
```

O developer token deve existir apenas nas variáveis protegidas da Vercel. Ele não
deve ser salvo no repositório, no HTML, em logs, screenshots ou documentos.

## Validação depois da configuração

1. Abrir o MOS autenticado.
2. Confirmar `Google Ads — API AO VIVO`.
3. Confirmar conta `2901132891`, moeda `BRL` e fuso da conta.
4. Conferir campanhas ativas e campanhas com entrega hoje.
5. Conferir investimento, impressões, cliques e conversões em 30 dias.
6. Conferir anúncios responsivos, URLs finais, termos de pesquisa e ações de
   conversão.
7. Comparar ao menos uma campanha e um anúncio com a interface do Google Ads no
   mesmo período.
8. Simular credencial ausente em ambiente de teste e confirmar que o MOS mostra
   `API NATIVA NÃO CONECTADA`, sem reutilizar R$ 0,10 ou status de 24 de julho.

## Diagnóstico rápido

- `API NATIVA NÃO CONECTADA`: variáveis incompletas ou inexistentes.
- `ACCESS_DENIED`: developer token, usuário técnico ou vínculo da conta não têm
  acesso suficiente.
- `API PARCIAL`: ao menos um relatório respondeu, mas outro falhou; revisar os
  erros sanitizados por relatório.
- `ATIVA, SEM ENTREGA HOJE`: campanha habilitada, porém sem impressão e sem custo
  no dia da conta.
- `ENTREGANDO HOJE`: campanha habilitada e com impressão ou custo no dia da
  conta.
