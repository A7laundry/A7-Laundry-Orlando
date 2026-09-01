# A7 Orlando OS — Owner Decision Pack

**Date:** 2026-08-31
**Owner:** Dennis Leandro Arruda
**Purpose:** consolidate the product and policy decisions that block later bounded stories without authorizing code,
Production, external accounts, live payments or real messages.

## Safety boundary

Approving a policy in this document does **not** authorize:

- implementation, migration, commit, push, deploy or Production mutation;
- creation, deactivation or replacement of a live Stripe object;
- presentation of a live Payment Link, payment, charge or refund;
- WhatsApp onboarding, secret, webhook, QA send or real-customer send;
- AI SDK, secret, provider activation or transmission of a conversation/PII;
- a customer merge, route action or delivery transition;
- a broader Operator role.

Each effect above keeps its own exact GO, immutable artifact, smoke and rollback.

## Decision register

| Decision | Recommended lean policy | Current status | Unblocks after dependencies |
|---|---|---|---|
| W1C-B2 finance | Owner-only links; tip zero; old unpaid link inactive before replacement; paid/refunded invoice immutable | Pending Owner policy approval | W1C-B2 implementation after W1C-A/B1 live |
| Bell Desk | Intermediate custody; explicit Owner final confirmation; only for a confirmed Bell Desk handoff | Pending Owner policy approval | W1C-B3 after W1C-B2 live |
| W3-B value facts | Net confirmed ticket; paid/refund counts; strict null versus confirmed zero; tip excluded | Pending Owner policy approval | W3-B after financial truth live |
| W3-C reconciliation | Exact evidence only; no fuzzy/automatic merge; immutable preview; Owner-only append-only decision | Pending Owner policy approval | W3-C after dependencies live |
| W3-D route authority | Owner-only pilot; human labels; manual stop ordering; no driver login/GPS | Pending labels and Owner approval | W3-D after W1C-B3 live |
| WhatsApp transport | Due diligence only with a Meta-listed Coexistence partner for the existing public number | Pending Owner direction | Partner comparison; no onboarding |
| W2-D AI | Provider-neutral, disabled/fake adapter, deterministic minimization, human review and manual fallback | Pending Owner baseline approval | Policy evaluation only; no provider activation |

## Approval A — W1C-B2 financial policy

Recommended exact text:

```text
Aprovo as quatro políticas do W1C-B2:

1. somente o Owner pode emitir, desativar ou substituir Payment Link; Operator permanece somente leitura;
2. tip permanece indisponível e exatamente zero, sem campo editável;
3. para substituir uma invoice não paga, o Payment Link anterior deve primeiro ser desativado no Stripe e registrado como inativo; somente depois a nova invoice e o novo link podem tornar-se vigentes;
4. invoices pagas, parcialmente reembolsadas ou reembolsadas são imutáveis; qualquer correção financeira usa o fluxo governado e append-only de refund mediante autorização específica.

Esta decisão aprova somente as políticas. Não autoriza implementação, migration, deploy, criação de objeto Stripe live, apresentação de Payment Link live, cobrança, refund, mudança de Operator, WhatsApp, Google Ads, GA4 ou Production.
```

Source: Story A7-024 and the W1C-B financial-readiness audit.

## Approval B — Bell Desk completion policy

Recommended exact text:

```text
Aprovo a regra de Bell Desk como custódia intermediária: deixar o pedido no Bell Desk não encerra o pedido, não altera o lifecycle para `delivered` e não emite `order_delivered`.

Bell Desk só pode ser escolhido quando o método de handoff confirmado no pedido autorizar essa entrega. A confirmação final será explícita e, no primeiro release, somente o Owner poderá executá-la. Na rota, a parada física será marcada como visitada/aguardando confirmação final, enquanto o pedido permanece pendente até essa confirmação.

Esta decisão aprova somente a regra de produto. Não autoriza código, migration, deploy, rota, WhatsApp, entrega real ou ação financeira.
```

Source: Stories A7-027 and A7-031.

## Approval C — W3-B customer-value formulas

Recommended exact text:

```text
Aprovo integralmente o contrato de métricas W3-B da Story A7-026: ticket médio confirmado líquido será receita líquida confirmada dividida pela quantidade de pedidos pagos; pedido pago permanece no contador de pagos após refund; qualquer refund de serviço confirmado maior que zero inclui o pedido no contador de reembolsados; sem histórico pago, valores monetários, ticket e primeiro/último pedido pago serão indisponíveis (`null`), enquanto um pedido pago totalmente reembolsado terá receita líquida conhecida de $0. Tip permanece excluída da receita e dos refunds de serviço.

Esta decisão aprova somente as fórmulas. Não autoriza implementação, migration, deploy ou qualquer alteração em invoice, payment, refund, customer, attribution, GA4 ou Ads.
```

Source: Story A7-026.

## Approval D — W3-C customer reconciliation policy

Recommended exact text:

```text
Aprovo integralmente as regras de reconciliação da Story A7-030:

1. WhatsApp normalizado exato pode resolver cliente conhecido somente quando não houver contradição;
2. email normalizado exato cria candidato, nunca merge automático;
3. nome, propriedade, quarto, valor, horário, mensagem e similaridade são apenas contexto;
4. novo telefone exige evidência e revisão Owner;
5. integrações podem propor, nunca sobrescrever dado confirmado;
6. somente Owner resolve, descarta ou faz merge;
7. todo merge exige survivor, preview imutável, tombstone e alias;
8. histórico pago ou reembolsado exige segunda confirmação vinculada ao mesmo preview;
9. merge não altera IDs de negócio, valores, eventos, lifecycle ou snapshot de atribuição;
10. correções são novas ações append-only, sem apagar auditoria nem simular unmerge.

Esta decisão aprova somente a regra de produto. Não autoriza migration, implementação, deploy nem um merge específico. Cada merge real continua exigindo preview e confirmações próprias.
```

Source: Story A7-030.

## Approval E — W3-D drivers and route authority

This approval is incomplete until the Owner replaces the placeholder with truthful driver labels.

```text
Aprovo W3-D inicialmente com autoridade Owner-only: somente o Owner poderá ativar/desativar motoristas, criar rota, selecionar motorista, adicionar ou remover paradas ainda pendentes, reordenar paradas, marcar saída e registrar resultados. Motoristas não terão login, app, GPS ou autoridade de escrita.

A lista inicial de labels ativos é: [PREENCHER LABELS REAIS]. A desativação impede novas atribuições e preserva todo o histórico.

Esta decisão não autoriza implementação, migration, deploy, criação de perfil privado, Operator, WhatsApp ou rota real. W3-D permanece bloqueado até W1C-B3/Bell Desk estar live e aceito.
```

Source: Story A7-031.

## Approval F — WhatsApp transport direction

Recommended exact text for **due diligence only**:

```text
Eu, Dennis Leandro Arruda, aprovo como direção arquitetural do A7 Orlando OS avaliar somente parceiros oficialmente listados pela Meta que comprovem, por escrito, Business App Coexistence para o número existente +1 407-670-8839, preservação do WhatsApp Business no celular e ownership/exportabilidade dos ativos pela A7.

Esta aprovação autoriza apenas due diligence e comparação documentada. Não autoriza contratação, criação ou transferência de conta/WABA, onboarding do número, classic migration, criação de secrets, ativação de webhook, alteração de Production ou envio de mensagem. A ativação exigirá novo GO nomeando parceiro, conta, WABA, número, QA consentido, smoke, kill switch e rollback.
```

Required evidence before a future activation GO:

- official Meta listing and written Coexistence support for the existing US number;
- A7 ownership/exportability, final portfolio/WABA and permission model;
- fees/SLA, subprocessors, region, retention and incident terms;
- Business App send/receive continuity;
- consented QA inbound/outbound, same app conversation, `sent`/`delivered`/`read`, idempotency and kill switch.

Source: Stories A7-025/A7-028 and the W2 readiness audit.

## Approval G — W2-D AI baseline

Recommended exact text for **policy evaluation only**:

```text
Eu, Dennis Leandro Arruda, aprovo como baseline arquitetural do W2-D um copiloto provider-neutral, sem tool calling ou autoridade operacional, com adapter fake/desabilitado, revisão humana obrigatória e fallback manual.

A política exige: no training; provedor/modelo/região fixados por GO; minimização e redaction determinísticas antes do provedor; leak scan depois da resposta; proibição de nome, telefone, email, endereço, hotel, room, mídia, IDs internos, A7 Ref, atribuição e dados financeiros; logs content-minimized; exclusão documentada; kill switch.

Esta aprovação autoriza somente avaliação documental e desenho da política. Não autoriza implementar W2-D, instalar SDK, criar secret, ativar provedor nem transmitir conversa ou PII. O Gate G0 completo e um novo GO serão obrigatórios.
```

Required evidence before a future provider GO:

- provider, exact model/API product, A7 tenant and processing region;
- DPA, no-training evidence, subprocessors and international transfers;
- input/output retention, abuse/safety logs, deletion including backups and incident response;
- exact field allowlist, notice/consent basis, redaction version, leak scan, timeout/rate/cost limits and kill switch.

Source: Story A7-029.

## Immediate release authorization remains separate

None of the approvals above replaces the exact W1C-A cutover GO in the W1C-A runbook. The safe release chronology
remains:

```text
W1C-A 050000
→ W2-A 060000
→ W3-A 070000
→ W1C-B1 080000
→ later bounded stories only after their dependencies and policy gates
```
