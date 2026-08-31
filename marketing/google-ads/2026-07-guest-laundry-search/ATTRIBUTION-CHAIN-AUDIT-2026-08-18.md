# Auditoria da cadeia de atribuição — 2026-08-18

Status: **SOMENTE LEITURA / NÃO IMPLEMENTADO**

## Resultado

A origem do click ID está preparada, mas a cadeia final de atribuição não está fechada de forma operacional e durável.

```text
Google Ads auto-tagging
  → landing captura GCLID/GBRAID/WBRAID + UTMs
  → API gera attribution_id + A7 Ref
  → WhatsApp recebe somente A7 Ref
  → operador precisa registrar/copiar A7 Ref
  → payment-link aceita referência manual no metadata Stripe
  → pagamento confirmado dispara purchase no navegador
  → não há vínculo automático comprovado com MOS/pedido/offline conversion
```

## Evidência confirmada

### Google Ads e landing

- Auto-tagging live: ativo.
- Sufixo final live: UTMs e ValueTrack configurados.
- O site de produção carrega `/a7-attribution.js` e `/a7-tracking.js`.
- A versão pública de `a7-attribution.js` contém captura de `gclid`, `gbraid` e `wbraid` e faz POST para `/api/attribution/session`.
- GET no endpoint de produção retornou HTTP 405, confirmando que a rota existe e aceita somente o método esperado. Nenhum POST sintético foi executado para não poluir o armazenamento.

### Contrato do tracking

- `a7-attribution.js` captura full click IDs no `touch.click_ids` e guarda continuidade no `sessionStorage` do navegador.
- `api/attribution/session.js` pode persistir o record completo e devolve apenas presença booleana de click IDs ao browser.
- O WhatsApp recebe um `A7 Ref` opaco de dez caracteres; o GCLID não é exposto ao cliente nem enviado como parâmetro GA4.
- `a7-tracking.js` dispara a conversão WhatsApp em todo clique de abertura, independentemente de conversa, qualificação ou pagamento.

### Armazenamento

- O servidor possui adapters `durable_supabase`, `shadow_ephemeral` e `unavailable`.
- Em produção, o adapter durável depende de `A7_ATTRIBUTION_SUPABASE_URL` e `A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY`.
- A listagem não interativa de environment variables da Vercel não retornou uma relação verificável de chaves nesta auditoria. Portanto, o modo live deve permanecer `NÃO COMPROVADO`; não é válido afirmar que o storage é durável ou ausente.
- O repositório atual não contém, no escopo pesquisado, migrations/RPC SQL que permitam reproduzir e auditar as funções Supabase referenciadas.

### WhatsApp, MOS e Stripe

- O `A7 Ref` é anexado ao texto do WhatsApp, mas depende de o operador preservar essa referência.
- `payment-link.html` oferece `Referência interna (opcional)` e envia o texto digitado ao servidor.
- `api/create-payment-link.js` grava esse texto em `metadata[a7_reference]` do Stripe. O preenchimento é opcional e não valida que seja o `A7 Ref` do contato.
- `api/stripe-session.js` confirma a sessão e retorna status, valor, moeda, serviço e payment link, mas não retorna metadata de atribuição.
- `guest-payment-confirmation.html` dispara purchase/conversion com transaction ID e dedupe local após confirmação Stripe.
- A busca no código não encontrou MOS/CRM armazenando `short_ref`, `attribution_id`, GCLID/GBRAID/WBRAID ou resolvendo `A7 Ref` para click ID.
- Não há webhook Stripe no escopo auditado que grave pagamento/refund e metadata em um ledger operacional durável.

## Pontos de ruptura

1. `A7 Ref` pode se perder quando a conversa vira pedido.
2. A referência Stripe é opcional e manual.
3. O status do storage de atribuição em produção não está comprovado.
4. Mesmo com storage durável, não há fluxo operacional comprovado de resolução `A7 Ref → click ID → order/payment ID`.
5. Purchase no Ads prova uma confirmação client-side, mas não fecha refund, cancelamento, margem ou vínculo MOS.
6. O dedupe de purchase usa `localStorage`; o transaction ID ajuda o Google a deduplicar, mas a reconciliação externa continua obrigatória.

## Correção proposta para changeset futuro

Esta é uma especificação, não autorização de implementação:

1. Provar o modo live do attribution store por healthcheck autenticado ou evidência do ambiente, sem expor segredos.
2. Versionar as migrations/RPCs do storage durável e adicionar testes de retenção, unicidade e resolução.
3. Tornar `order_id` e `A7 Ref` campos explícitos no fluxo operacional, evitando nome/telefone como chave.
4. Exigir ou validar `A7 Ref` no gerador de payment link quando a origem for contato atribuído; permitir exceção documentada para direto/orgânico.
5. Gravar `order_id`, `a7_reference` e origem no metadata Stripe.
6. Criar ingestão durável de Stripe payment/refund por webhook ou job reconciliador idempotente.
7. Resolver server-side `A7 Ref → attribution record` e armazenar click ID apenas em ambiente protegido.
8. Só então criar/importar `qualified_guest_lead` e/ou pagamento offline conforme consentimento e regras do Google.

## Gate de aceite

O Gate B não fecha até existir uma amostra real em que:

`click ID → A7 Ref → conversa → order ID → payment ID → paid/refunded`

seja reconciliável sem usar nome, telefone, screenshot ou semelhança de valor como chave.

## Verificação local

Executado em 2026-08-18, sem mudança na conta ou em dados de produção:

- `node scripts/test-attribution-v2.mjs` — passou; contrato V2 e inventário de CTAs válidos.
- `node scripts/test-tracking.mjs` — passou; tracking unificado preserva o comportamento esperado.
- `node scripts/test-payment-link.mjs` — 5/5 testes passaram.
- `node scripts/test-stripe-confirmation.mjs` — passou.
- `git diff --check` — passou.

Esses testes comprovam os contratos locais; não comprovam o adapter live, a disciplina operacional de registrar `A7 Ref` nem a reconciliação das cinco compras reais.
