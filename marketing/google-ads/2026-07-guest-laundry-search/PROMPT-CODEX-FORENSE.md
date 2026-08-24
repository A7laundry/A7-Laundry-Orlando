# Prompt para o Codex — Auditoria forense do Google Ads (A7 Laundry Orlando)

> Gerado em 2026-08-18. Copie o bloco abaixo inteiro para o Codex.

---

## MISSÃO

Executar uma auditoria **somente-leitura** da conta de Google Ads da A7 Laundry Orlando e
entregar os dados brutos em arquivos, para análise posterior.

O objetivo de negócio é responder três perguntas:

1. **Em que momentos estamos perdendo o leilão** — e se perdemos por **orçamento** (falta de
   verba) ou por **classificação/rank** (relevância e lance). Quebrado por **hora do dia** e
   **dia da semana**.
2. **Quais termos de busca consomem verba sem converter.**
3. **O que o Google está recomendando** e qual o impacto projetado.

## REGRA INEGOCIÁVEL

**NÃO ALTERE NADA NA CONTA.** Nenhuma mudança de lance, orçamento, status, palavra-chave,
anúncio ou aplicação de recomendação. Nenhum `mutate`. Somente `search` / `searchStream` e
exports. Se qualquer passo exigir escrita, PARE e reporte.

## CONTEXTO

| Item | Valor |
|---|---|
| Repositório | `/Users/dennisarruda/projects/A7_Laundry_Orlando` |
| Conta Google Ads | `290-113-2891` → customer ID `2901132891` |
| `ocid` (para URLs do painel) | `7195799757` |
| Conta Google com acesso | `dennizarruda@gmail.com` |
| Campanha em foco | `A7 \| Search \| Guest Laundry \| Orlando \| EN \| JUL26` — ID `24072699595` |
| Moeda / fuso da conta | BRL / GMT-03:00 (Brasília) |
| Janela de análise | Últimos 30 dias |
| Projeto Vercel do painel | `a7-laundry-mos` (time `dennis-a7s-projects`) |

Contexto de negócio que orienta a leitura: a A7 cobra **US$3,25/lb (mín. US$50)**, enquanto os
concorrentes do mesmo leilão cobram **US$1,95** (The Laundry Room), **~US$1,90** (HappyNest) e
**~US$1,00** (Poplin). A A7 é a mais cara do leilão. A hipótese a testar é que as keywords
genéricas (especialmente `"wash and fold delivery near me"`, correspondência de frase, no grupo
`Pickup Delivery Orlando`) consomem a verba do nicho defensável (`Hotel Guest`, `Airbnb Guest`)
e perdem sistematicamente por rank.

## TRAVAS JÁ MAPEADAS — e como resolver cada uma

Estas quatro travas já foram diagnosticadas. Resolva-as antes de tentar as queries.

### Trava 1 — o token do gcloud não tem escopo `adwords`
A ADC local está autenticada como `dennizarruda@gmail.com`, mas só com escopo
`cloud-platform`. A Google Ads API exige `https://www.googleapis.com/auth/adwords`.

**Solução (destrava Ads, GA4 e GSC de uma vez):**
```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/adwords,\
https://www.googleapis.com/auth/analytics.readonly,\
https://www.googleapis.com/auth/webmasters.readonly,\
https://www.googleapis.com/auth/cloud-platform
```
Autorize com **dennizarruda@gmail.com** (é a conta que tem o Google Ads).

**Verificar que funcionou:**
```bash
TOK=$(gcloud auth application-default print-access-token)
curl -s "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=$TOK" | grep -o adwords
```
Deve imprimir `adwords`. Se não imprimir, o login não pegou o escopo.

### Trava 2 — o developer token não é legível pelo CLI do Vercel
As variáveis `GOOGLE_ADS_DEVELOPER_TOKEN` e `GOOGLE_ADS_CUSTOMER_ID` existem no projeto
Vercel `a7-laundry-mos`, mas são marcadas como sensíveis: `vercel env pull` traz a chave com
valor **vazio**. Confirmado — `MOS_SESSION_SECRET` também vem vazio e o painel funciona em
produção, provando que o pull não entrega sensíveis.

**Solução A (preferida):** ler o valor no dashboard do Vercel
→ Project `a7-laundry-mos` → Settings → Environment Variables → revelar
`GOOGLE_ADS_DEVELOPER_TOKEN`.

**Solução B:** pegar direto na fonte, em
`https://ads.google.com/aw/apicenter?ocid=7195799757` (requer conta de gerenciador/MCC).

**ATENÇÃO — verificar o nível do token.** No API Center, confira se o acesso é
`Test`, `Basic` ou `Standard`:
- **Test** → só funciona em contas de teste; **NÃO servirá** para a conta real. Nesse caso é
  preciso solicitar upgrade para Basic (o Google leva alguns dias). **Se for Test, pule para
  o PLANO B (exports manuais).**
- **Basic** ou **Standard** → serve.

**Gravar de forma persistente** (o arquivo já está no `.gitignore` do repo):
```bash
cd /Users/dennisarruda/projects/A7_Laundry_Orlando
cat >> .env.local <<'EOF'
GOOGLE_ADS_DEVELOPER_TOKEN=<valor>
GOOGLE_ADS_CUSTOMER_ID=2901132891
GOOGLE_ADS_API_VERSION=v24
EOF
```
Se a conta estiver sob um MCC, acrescente também
`GOOGLE_ADS_LOGIN_CUSTOMER_ID=<id do MCC, só dígitos>`.

### Trava 3 — impersonation de service account não é caminho
Já testado e descartado. A SA do painel é `mos-readonly@a7-laundry-mos.iam.gserviceaccount.com`,
num projeto GCP ao qual `dennizarruda@gmail.com` não tem acesso; a policy IAM volta vazia.
**Não perca tempo nessa rota** — use OAuth de usuário (Trava 1).

### Trava 4 — a conta pode estar sem saldo
Auditoria de 2026-08-16 registrou **R$500,05 de saldo** com orçamento em **R$150/dia**
(~3,3 dias). Esgotamento previsto por volta de 2026-08-19. **Confirme o saldo e se a veiculação
parou** — é a primeira coisa a checar, e pode explicar a queda de mensagens sozinha.

## O TRABALHO

Existe um script pronto e validado no repo:

```bash
cd /Users/dennisarruda/projects/A7_Laundry_Orlando
node scripts/audit-google-ads-forensic.mjs --days=30 --json
```

Ele lê as credenciais de `.env.local` (raiz ou `mos-app/`) ou de variáveis de ambiente, obtém o
token via `gcloud auth application-default print-access-token`, valida o escopo `adwords` e roda
tudo. Com `--json` grava o resultado em
`marketing/google-ads/2026-07-guest-laundry-search/forensic-<data>.json`.

**Se o script funcionar, o trabalho está feito** — pule para ENTREGA.

Se preferir/precisar rodar as queries manualmente, o endpoint é
`POST https://googleads.googleapis.com/v24/customers/2901132891/googleAds:searchStream`
com headers `Authorization: Bearer <token>`, `developer-token: <token>` e, se aplicável,
`login-customer-id`. As consultas GAQL essenciais:

**A) Panorama e perda de leilão**
```sql
SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros,
       campaign.bidding_strategy_type, metrics.cost_micros, metrics.impressions,
       metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions,
       metrics.conversions_value, metrics.search_impression_share,
       metrics.search_budget_lost_impression_share,
       metrics.search_rank_lost_impression_share,
       metrics.search_absolute_top_impression_share,
       metrics.search_top_impression_share
FROM campaign
WHERE segments.date DURING LAST_30_DAYS AND campaign.status != 'REMOVED'
```

**B) Por hora do dia** — o coração da pergunta
```sql
SELECT segments.hour, metrics.impressions, metrics.clicks, metrics.cost_micros,
       metrics.conversions, metrics.search_impression_share,
       metrics.search_budget_lost_impression_share,
       metrics.search_rank_lost_impression_share
FROM campaign
WHERE segments.date DURING LAST_30_DAYS AND campaign.status != 'REMOVED'
```

**C) Por dia da semana** — trocar `segments.hour` por `segments.day_of_week` em (B).

**D) Keywords com Quality Score**
```sql
SELECT ad_group.name, ad_group_criterion.keyword.text,
       ad_group_criterion.keyword.match_type,
       ad_group_criterion.quality_info.quality_score,
       metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
       metrics.conversions, metrics.average_cpc,
       metrics.search_impression_share, metrics.search_rank_lost_impression_share
FROM keyword_view
WHERE segments.date DURING LAST_30_DAYS AND ad_group_criterion.status != 'REMOVED'
```

**E) Termos de busca**
```sql
SELECT search_term_view.search_term, segments.search_term_match_type, ad_group.name,
       metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
       metrics.conversions
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
```

**F) Ações de conversão** — para ver o que o Smart Bidding persegue
```sql
SELECT conversion_action.name, conversion_action.category, conversion_action.type,
       conversion_action.primary_for_goal, conversion_action.status,
       metrics.all_conversions, metrics.all_conversions_value
FROM conversion_action
WHERE segments.date DURING LAST_30_DAYS AND conversion_action.status = 'ENABLED'
```

**G) Recomendações do Google** — apenas LER, jamais aplicar
```sql
SELECT recommendation.type, recommendation.campaign,
       recommendation.impact.base_metrics.impressions,
       recommendation.impact.base_metrics.clicks,
       recommendation.impact.base_metrics.cost_micros,
       recommendation.impact.base_metrics.conversions,
       recommendation.impact.potential_metrics.impressions,
       recommendation.impact.potential_metrics.clicks,
       recommendation.impact.potential_metrics.cost_micros,
       recommendation.impact.potential_metrics.conversions
FROM recommendation
```

## PLANO B — se o developer token for nível Test ou a API não liberar

Não insista na API. Exporte os relatórios do painel em CSV (período: últimos 30 dias) e salve
em `marketing/google-ads/2026-07-guest-laundry-search/exports/`:

1. **Campanhas** (`https://ads.google.com/aw/campaigns?ocid=7195799757`) — adicionar as colunas
   *Parcela de impressões de pesquisa*, **Parcela de impressões perdida (orçamento)**,
   **Parcela de impressões perdida (classificação)**, *Parcela na parte superior*,
   *Parcela na primeira posição*.
2. **Campanhas segmentado por Hora do dia.**
3. **Campanhas segmentado por Dia da semana.**
4. **Palavras-chave** (`.../aw/keywords?ocid=7195799757`) — com **Índice de qualidade** e as
   mesmas colunas de parcela de impressões.
5. **Termos de pesquisa** (`.../aw/keywords/searchterms?ocid=7195799757`).
6. **Recomendações** (`.../aw/recommendations?ocid=7195799757`) — print serve.
7. **Faturamento** (`.../aw/billing/summary?ocid=7195799757`) — saldo atual.

Os itens 1, 2 e 5 já são suficientes para fechar o diagnóstico do leilão.

## SETUP PERMANENTE (para não travar de novo)

1. O login da Trava 1 destrava Ads + GA4 + GSC. Refazer só quando a ADC expirar.
2. Deixar `GOOGLE_ADS_DEVELOPER_TOKEN` e `GOOGLE_ADS_CUSTOMER_ID` em `.env.local` na raiz do
   repo (já coberto pelo `.gitignore`, linhas 2-3 e 8-9). **Nunca commitar.**
3. Se quiser independência de re-login futuro, criar um OAuth client próprio
   (Google Cloud Console → APIs & Services → Credentials → OAuth client ID, tipo Desktop) e
   guardar `client_id`, `client_secret` e `refresh_token` no mesmo `.env.local`.
4. Confirmar no API Center que o developer token está em nível **Basic** ou superior; se estiver
   em **Test**, solicitar o upgrade hoje — a aprovação demora dias e é o gargalo real.

## ENTREGA

Salvar em `marketing/google-ads/2026-07-guest-laundry-search/`:

- `forensic-<AAAA-MM-DD>.json` — saída do script (se a API funcionou), **ou**
- `exports/*.csv` — os relatórios do Plano B.

E um `RESULTADO-CODEX.md` curto declarando:
- Qual caminho funcionou (API ou export) e por quê.
- Nível do developer token encontrado (Test / Basic / Standard).
- **Saldo atual da conta e se a veiculação está ativa ou parada.**
- Qualquer trava nova encontrada e como foi resolvida.
- Confirmação explícita de que **nada foi alterado na conta**.

Não interprete os números nem proponha mudanças — só colete e entregue. A análise e o plano de
virada serão feitos em seguida.
