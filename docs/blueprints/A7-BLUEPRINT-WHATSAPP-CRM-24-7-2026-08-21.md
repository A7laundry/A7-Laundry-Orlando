# A7 Blueprint — WhatsApp Oficial + CRM Operacional 24/7

**Versão:** 1.0 (draft para auditoria)
**Data:** 2026-08-21
**Autor:** Claude Code (sessão de arquitetura)
**Destinatário da auditoria:** Codex
**Status:** `AGUARDANDO AUDITORIA` — nenhuma linha de código foi escrita a partir deste documento
**Executor após auditoria:** Codex assume configuração, implementação e operação

---

## 0. Como ler este documento

Este blueprint é feito para ser **auditado antes de ser executado**. Ele segue três regras:

1. **Nada é inventado.** Toda afirmação sobre o estado atual aponta para um arquivo real do repositório ou uma fonte oficial citada. O que ainda não existe está marcado como `[A CONSTRUIR]`. O que depende de decisão humana está marcado como `[DECISÃO PENDENTE]`.
2. **Toda escolha tem alternativa registrada.** A §4 lista as decisões de arquitetura com o que foi rejeitado e por quê, para o auditor poder discordar com base.
3. **Todo critério é verificável.** A §11 lista critérios de aceite binários, no padrão das stories `docs/stories/a7-0XX-*.md` deste repositório.

A §15 concentra as perguntas que o auditor precisa responder antes de qualquer implementação.

---

## 1. Objetivo

Fechar o vazamento de atendimento medido em julho/2026 — **3 a 4 falhas confirmadas em 12 leads novos (25,0%–33,3%)**, conforme a reconciliação das 19 threads em `docs/DIRECIONAMENTO-AGOSTO-2026.md` (rev. 3) — conectando o WhatsApp da A7 à API oficial da Meta, com um CRM mínimo que registre cada lead da entrada até o pedido pago, operando 24 horas por dia.

### 1.1 Resultado esperado (mensurável)

| Métrica | Hoje | Alvo da Fase 1 |
|---|---|---|
| Leads elegíveis sem resposta útil | 3–4 em 12 (25,0%–33,3%) | 0 |
| Tempo até a primeira resposta | não medido | ≤ 30 segundos, automático |
| Origem do lead (qual anúncio) conhecida | não | ≥ 90% dos leads |
| Fechamento (cotado → pedido pago) | 2÷8 = 25,0%, IC 95% 7,1%–59,1% | **medido com denominador explícito** |
| Receita atribuída por criativo | indisponível | reconciliada no MOS |

> A meta da Fase 1 **não é aumentar vendas**. É tornar o funil observável até o dinheiro e eliminar a perda por silêncio. Aumento de conversão é consequência esperada, não critério de aceite.

### 1.2 Fora de escopo (explícito)

- Campanhas de marketing ativo / disparo em massa no WhatsApp
- Substituição do MOS como painel — o CRM **alimenta** o MOS, não compete com ele
- Cobrança dentro do WhatsApp (permanece nos links Stripe existentes: `api/create-payment-link.js`)
- Atendimento de grupos do WhatsApp (não sincroniza em Coexistence — ver §5.1)
- Migração do Brasil / A7 Comercial BR — este blueprint é Orlando apenas

---

## 2. Estado atual verificado

Inventário levantado por leitura direta do repositório em 2026-08-21. **Esta seção é o alicerce da auditoria: se algum item aqui estiver errado, o plano inteiro precisa ser revisto.**

### 2.1 O que já existe e funciona

| Componente | Arquivo | O que faz |
|---|---|---|
| Contrato de atribuição V2 | `a7-attribution.js` | Gera `attribution_id` (128 bits) e `short_ref` (10 chars, alfabeto sem `0/1/I/O`); captura GCLID/GBRAID/WBRAID, UTMs, referrer, landing path; first touch imutável |
| Construtor de URL do WhatsApp | `a7-business-config.js:35` | `buildWhatsAppUrl(message, shortRef)` — anexa `A7 Ref: XXXXXXXXXX` na mensagem pré-preenchida e força destino `14076708839` |
| Tracking unificado | `a7-tracking.js` | Decora todos os `a[href*="wa.me/"]` em runtime e no clique; emite GA4 + Meta |
| Tracking de funil do blog | `wa-tracking.js` | Injeta UTM por slug/estágio/botão em cliques de blog |
| API de sessão de atribuição | `api/attribution/session.js` | Cria/recupera sessão; rate limit 60/min; origin allowlist; cookie HttpOnly só com consentimento explícito |
| Store de atribuição | `lib/attribution-store.js` | Três adaptadores: memória (`shadow_ephemeral`), **`durable_supabase`** e `unavailable` |
| RPCs duráveis já definidas | `lib/attribution-store.js:142+` | `a7_get_attribution`, `a7_get_attribution_by_short_ref`, `a7_upsert_attribution`, `a7_record_attribution_metrics`, `a7_attribution_health` |
| Métrica de clique WhatsApp | `api/attribution/metric.js` | Conta `whatsapp_clicks`, `whatsapp_clicks_with_ref`, `whatsapp_clicks_without_ref` |
| Painel operacional | `mos-app/` | App Vercel autenticado (PBKDF2 + cookie assinado), KPIs de mídia/SEO/receita |
| Templates de atendimento | `marketing/whatsapp/message-templates.md` | Copy de fechamento, regra de ouro ≤5 min, preços canônicos, idiomas |
| Fonte de verdade comercial | `MANIFESTO.md` | $3.25/lb normal, $3.95/lb express 8h, mínimo **$50 por pedido**, coleta/entrega grátis, comforter por tamanho, cobertura Orlando/Kissimmee/Reunion/Winter Park/Dr. Phillips/Lake Nona/Champions Gate/Disney |
| Esqueleto de agente | repo `A7laundry/a7-whatsapp-agent` | Express + Cloud API + Claude + Prisma/Postgres; webhook GET/POST; nunca personalizado |

### 2.2 O buraco central

```
[ Anúncio / Blog / LP ]
          │  a7-attribution.js gera short_ref
          ▼
[ Clique no CTA ]  ── api/attribution/session.js grava a sessão ──▶ [ store ]
          │  a7-business-config.js injeta "A7 Ref: 7KQ9W3M2HX"
          ▼
[ WhatsApp abre com a mensagem pré-preenchida ]
          │
          ▼
   ╔══════════════════════════════════════════╗
   ║   ✖  A CORRENTE MORRE AQUI               ║
   ║                                          ║
   ║   Ninguém lê o "A7 Ref:" que chega.      ║
   ║   getByShortRef() existe e nunca é       ║
   ║   chamada por nada em produção.          ║
   ║   Não há registro de lead, de resposta,  ║
   ║   de pedido nem de receita.              ║
   ╚══════════════════════════════════════════╝
```

**Consequências medidas hoje:**
- `mos-app/generated/funnel-intelligence.json` declara: *"Sales, contribution and retention are unavailable until explicitly reconciled."*
- O store de atribuição roda em `shadow_ephemeral` (memória de processo) — perde tudo a cada deploy
- `docs/measurement-v2-foundation.md` já prevê o próximo passo: *"A later story must provide a durable adapter implementing `get(id)`, `getByShortRef(ref)` and `save(record)` with encryption, unique constraints, retention and access controls."*

**Este blueprint é a execução daquela story prevista, somada ao canal de atendimento.**

### 2.3 Restrições do repositório que o plano deve respeitar

Levantadas de `package.json` e da estrutura:

- **Zero dependências de runtime** no site principal (`dependencies: {}`). Vanilla JS, HTML estático, sem build de framework.
- Toda validação é CLI: `npm run lint` (`node --check` em 40+ arquivos), `npm test`, `npm run build`, `npm run guard:business`.
- Guards bloqueiam destino comercial errado (`scripts/guard-business-destinations.mjs`) e inventariam CTAs (`scripts/inventory-ctas.mjs`).
- Stories exigem Acceptance Criteria binários, testes automatizados e seção de rollback.

> **Regra para o executor:** o CRM é uma aplicação separada (como o `mos-app`). **Não introduzir dependências nem build no site público.**

---

## 3. Arquitetura alvo

```
                        ┌─────────────────────────────────────┐
   Meta Ads (CTWA) ────▶│                                     │
   Google Ads      ────▶│   a7laundry.com  (estático)         │
   Blog / SEO      ────▶│   a7-attribution.js → short_ref     │
                        └──────────────┬──────────────────────┘
                                       │ POST /api/attribution/session
                                       ▼
                        ┌─────────────────────────────────────┐
                        │  Postgres (Supabase)  [A CONSTRUIR] │
                        │  attribution + CRM na mesma base    │
                        └──────────────┬──────────────────────┘
                                       │ getByShortRef()
   ┌───────────────────────────────────┴──────────────────────┐
   │                                                          │
   │   WhatsApp Cloud API  (número +1 407-670-8839)           │
   │   modo Coexistence: celular continua funcionando         │
   │                                                          │
   └───────┬──────────────────────────────────────────┬───────┘
           │ webhook (inbound)                        │ Graph API (outbound)
           ▼                                          │
   ┌───────────────────────────────────────────────────────────┐
   │  a7-crm  [A CONSTRUIR]                                    │
   │                                                           │
   │  1. verifica assinatura X-Hub-Signature-256               │
   │  2. dedup por message.id                                  │
   │  3. grava mensagem  ──▶ responde 200 em <1s               │
   │  4. resolve atribuição:                                   │
   │       a) referral.source_id do CTWA (nativo Meta)         │
   │       b) "A7 Ref: XXXXXXXXXX" no corpo da mensagem        │
   │       c) desconhecido                                     │
   │  5. agente responde (Claude) ou escala para humano        │
   │  6. atualiza estado do lead + SLA                         │
   └───────┬───────────────────────────────────┬───────────────┘
           │                                   │
           ▼                                   ▼
   ┌────────────────┐              ┌──────────────────────────┐
   │ Celular Dennis │              │ MOS (mos-app/)           │
   │ app WA Business│              │ receita real por criativo│
   │ assume quando  │              │ tempo de resposta        │
   │ quiser         │              │ fechamento com denominad.│
   └────────────────┘              └──────────────────────────┘
```

---

## 4. Decisões de arquitetura

Cada decisão traz a alternativa rejeitada. **O auditor deve contestar aqui, não na implementação.**

### ADR-1 — Cloud API oficial, não biblioteca não-oficial

**Decisão:** WhatsApp Cloud API da Meta.

**Rejeitado:** `@open-wa/wa-automate`, Baileys, `whatsapp-web.js`, Evolution API.

**Razão:** clientes não-oficiais violam o ToS do WhatsApp e a detecção é automática. O `+1 407-670-8839` é o único canal de fechamento da A7 e o destino de todos os anúncios Click-to-WhatsApp — um ban permanente derruba vendas e mídia paga no mesmo dia. Avaliação completa em `memory/project_whatsapp_api_avaliacao.md`.

**Evidência:** auditoria técnica completa do open-wa em `docs/audits/2026-08-21-open-wa-technical-risk-audit.md` — execução de código remoto não assinado dentro da sessão do WhatsApp, servidor de licença que recebe o número e devolve JS executável, ramo estável congelado desde dez/2024, e bug de "TOS block" reportado sem resposta.

**Custo da decisão:** processo de onboarding com a Meta e dependência de aprovação. Aceito.

### ADR-2 — Coexistence, mantendo o número no celular

**Decisão:** onboarding em modo **Coexistence** — o número roda no app WhatsApp Business **e** na Cloud API simultaneamente.

**Rejeitado (a):** migração clássica, que desconecta o app do celular. Rejeitado porque elimina a rede de segurança do atendimento humano durante a transição.
**Rejeitado (b):** número novo dedicado. Rejeitado porque fragmenta o canal, exige trocar o destino de todos os anúncios e do site, e perde o histórico.

**Fonte:** [Meta — Onboard WhatsApp Business app users](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/) — *"They can still send messages on a one-to-one basis using the WhatsApp Business app, and WhatsApp keeps messaging history between both apps in sync."*

**⚠️ Restrição crítica descoberta:** Coexistence exige onboarding via **Embedded Signup de um Solution Partner ou Tech Provider**. Não é o fluxo self-service de criar um app no Meta for Developers. Ver §15 Q1 — **esta é a principal questão aberta do blueprint**.

### ADR-3 — CRM próprio mínimo, não SaaS

**Decisão:** CRM próprio, servido como app Vercel separado, no mesmo padrão do `mos-app`.

**Rejeitado:** HubSpot, Pipedrive, Chatwoot, GoHighLevel.

**Razão:** o valor não está em gerir contatos — está em **casar `short_ref` com pedido pago**, que é lógica exclusiva da A7 e já tem metade da infraestrutura escrita (`getByShortRef`, RPCs Supabase, contrato de atribuição). Um SaaS exigiria construir a mesma ponte por fora, pagando mensalidade e perdendo o controle do dado.

**Custo da decisão:** manutenção própria. Mitigado pelo escopo deliberadamente pequeno (§7).

### ADR-4 — Postgres/Supabase único para atribuição e CRM

**Decisão:** uma base Postgres (Supabase) servindo atribuição durável **e** CRM.

**Rejeitado:** bases separadas.

**Razão:** o join entre `short_ref` e pedido é a razão de existir do sistema. Separar as bases transforma a consulta central em integração distribuída. Além disso, `SupabaseAttributionStore` já está implementado em `lib/attribution-store.js:140` — a escolha já foi feita pelo repositório.

### ADR-5 — Agente responde, humano fecha (Fase 1)

**Decisão:** o agente responde em segundos, informa preço e condições do `MANIFESTO.md`, qualifica (endereço, volume, prazo, idioma) e **escala para humano** ao chegar em agendamento ou qualquer exceção.

**Rejeitado:** agente fechando venda de forma autônoma.

**Razão:** preço por libra com mínimo de $50, express condicionado a disponibilidade e cobertura geográfica variável são compromissos com dinheiro real. Um erro do agente é prejuízo e promessa feita em nome da A7.

**Status:** `[DECISÃO PENDENTE]` — o dono não confirmou o nível de autonomia. Ver §15 Q2. O blueprint assume ADR-5 como padrão até decisão contrária.

### ADR-6 — Responder 200 antes de processar, com continuação garantida

**Decisão:** o webhook grava a mensagem, responde `200` imediatamente e processa a resposta do agente em continuação garantida (`waitUntil` do Vercel Functions ou fila).

**Rejeitado:** o padrão atual do `a7-whatsapp-agent`, que faz `res.sendStatus(200)` e depois `await` do processamento.

**Razão:** em serverless a função pode ser encerrada após a resposta HTTP, matando o processamento pendente. É um bug latente no código existente (`src/routes/webhook.ts:28`). A Meta reenvia webhooks não confirmados, o que combinado com ausência de dedup gera resposta duplicada ao cliente.

---

## 5. Componente C1 — Conexão WhatsApp

### 5.1 Modo Coexistence: o que muda na prática

| Aspecto | Comportamento |
|---|---|
| App no celular | Continua funcionando. Dennis atende normalmente |
| Histórico | Sincroniza 180 dias para trás; daí em diante nos dois sentidos, em tempo real |
| Contatos | Sincronizam todos |
| Grupos | **Não sincronizam.** Permanecem só no app |
| Mensagens temporárias / ver-uma-vez | **Desativadas automaticamente** |
| Listas de transmissão | Viram somente leitura |
| Throughput | Fixo em 20 mensagens/segundo (irrelevante no volume atual) |
| Inatividade | **Se o celular ficar 14 dias sem abrir o WhatsApp, a conexão cai** → vira item de monitoramento (§10) |
| Elegibilidade geográfica | EUA suportado. Não suportado em EEA/UE/Reino Unido, Austrália, Japão, Nigéria, Filipinas, Rússia, Coreia do Sul, África do Sul, Turquia, Suíça |
| Versão mínima do app | WhatsApp Business 2.24.17+ |

### 5.2 Economia — por que o custo tende a zero

Fonte: [Meta — WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)

- **Free Entry Point (FEP):** quando o usuário chega por **Click-to-WhatsApp Ad**, abre uma janela de **72 horas** em que **qualquer tipo de mensagem é gratuita**.
- **Customer Service Window (CSW):** 24 horas a partir de qualquer mensagem do cliente; mensagens não-template são gratuitas.
- Cobrança só ocorre em **template entregue fora de janela**.

Como praticamente todo lead da A7 entra por CTWA, a operação normal cai dentro da FEP. O custo relevante do sistema passa a ser **tokens da API Anthropic**, não mensageria.

`[A VALIDAR NA AUDITORIA]` Meta anunciou mudanças com efeito em 2026 (categoria de agentes de IA; templates utility passando a ser cobrados dentro da CSW a partir de 01/out/2026, conforme fontes secundárias). O auditor deve confirmar o impacto na tabela vigente antes do go-live. Ver §15 Q5.

### 5.3 Entregáveis do C1

- [ ] WABA (WhatsApp Business Account) criada e verificada no Meta Business Manager
- [ ] Verificação de negócio da A7 concluída
- [ ] Número `+1 407-670-8839` onboarded em modo Coexistence
- [ ] `WHATSAPP_TOKEN` de longa duração (System User token, não token temporário de dev)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` e `WABA_ID` registrados como env vars
- [ ] `WHATSAPP_APP_SECRET` registrado (necessário para validar assinatura — §9.1)
- [ ] Webhook assinado e verificado, apontando para o CRM
- [ ] Campos de webhook inscritos: `messages` (obrigatório), `message_template_status_update`, `account_update`
- [ ] Teste de ida e volta: mensagem do celular pessoal → aparece no CRM → resposta do CRM → chega no celular

---

## 6. Componente C2 — CRM

Princípio: **pequeno o suficiente para ser auditável inteiro, completo o suficiente para responder "quanto cada anúncio vendeu".**

### 6.1 Modelo de dados

Sete tabelas. Nada além disso na Fase 1.

```sql
-- 1. Pessoa que fala com a A7
contact
  id                uuid pk
  wa_id             text unique not null    -- E.164 sem '+', como a Meta envia
  profile_name      text
  language          text                    -- 'en' | 'pt' | 'es' | null (detectado)
  first_seen_at     timestamptz not null
  last_seen_at      timestamptz not null
  blocked           boolean default false

-- 2. Ciclo de atendimento (um contato pode voltar meses depois = nova conversation)
conversation
  id                uuid pk
  contact_id        uuid fk -> contact
  status            text not null           -- ver §6.2
  attribution_id    text                    -- join com a atribuição do site
  short_ref         text                    -- 'A7 Ref' lido da 1ª mensagem
  ctwa_clid         text                    -- referral.ctwa_clid do webhook CTWA
  ad_source_id      text                    -- referral.source_id (ID do anúncio)
  source_kind       text not null           -- 'ctwa' | 'short_ref' | 'organic' | 'unknown'
  opened_at         timestamptz not null
  first_response_at timestamptz             -- ⬅ métrica-mãe do vazamento
  first_response_by text                    -- 'agent' | 'human'
  human_since       timestamptz             -- quando escalou
  closed_at         timestamptz
  fep_expires_at    timestamptz             -- janela grátis de 72h
  csw_expires_at    timestamptz             -- janela de serviço de 24h

-- 3. Toda mensagem, nos dois sentidos
message
  id                uuid pk
  conversation_id   uuid fk -> conversation
  wa_message_id     text unique not null    -- ⬅ chave de deduplicação
  direction         text not null           -- 'in' | 'out'
  author            text not null           -- 'customer' | 'agent' | 'human'
  type              text not null           -- 'text' | 'audio' | 'image' | 'document' | 'other'
  body              text
  media_id          text
  transcript        text                    -- áudio transcrito, quando houver
  created_at        timestamptz not null

-- 4. O pedido — onde a atribuição vira dinheiro
order_record
  id                uuid pk
  conversation_id   uuid fk -> conversation
  service           text not null           -- 'wash_fold_normal' | 'wash_fold_express' | 'comforter' | 'other'
  status            text not null           -- ver §6.2
  estimated_lbs     numeric
  quoted_amount_usd numeric
  paid_amount_usd   numeric                 -- reconciliado com Stripe
  stripe_session_id text
  pickup_address    text                    -- PII, ver §9.2
  pickup_window     text
  created_at        timestamptz not null
  paid_at           timestamptz

-- 5. Fila de escalação humana
handoff
  id                uuid pk
  conversation_id   uuid fk -> conversation
  reason            text not null           -- 'scheduling' | 'complaint' | 'out_of_scope'
                                            -- | 'agent_uncertain' | 'customer_asked'
                                            -- | 'media_received' | 'sla_breach'
  created_at        timestamptz not null
  acknowledged_at   timestamptz
  acknowledged_by   text

-- 6. Trilha de auditoria imutável (padrão a7-009)
crm_event
  id                bigserial pk
  conversation_id   uuid
  kind              text not null
  payload           jsonb not null
  created_at        timestamptz not null

-- 7. Atribuição durável — implementa o contrato já existente
attribution_session
  attribution_id    text pk
  short_ref         text unique not null    -- ⬅ unique index exigido pelo measurement-v2
  touch             jsonb not null
  touch_fingerprint text
  consent_state     text not null
  expires_at        timestamptz not null
```

> `attribution_session` **deve** ser servida pelas RPCs que `lib/attribution-store.js` já espera: `a7_get_attribution`, `a7_get_attribution_by_short_ref`, `a7_upsert_attribution`, `a7_record_attribution_metrics`, `a7_attribution_health`. **Não inventar nomes novos** — o cliente já está escrito.

### 6.2 Máquinas de estado

**Conversa:**

```
new ──▶ auto_responded ──▶ qualifying ──▶ awaiting_human ──▶ human_handling
 │                                                                  │
 │                                                                  ▼
 └──────────────────────────────────────────────────────────▶ converted
                                                              │
                                                        lost / abandoned
```

**Pedido:**

```
quoted ──▶ scheduled ──▶ picked_up ──▶ delivered ──▶ paid
   └──────────────────── cancelled ◀───────────────────┘
```

Regra: **nenhum estado é inferido.** `paid` só existe com reconciliação Stripe. Estado desconhecido é `unknown`, nunca zero — mesmo princípio já adotado pelo MOS (`a7-003`: *"Unknown financial values are shown as unavailable, never inferred as zero"*).

### 6.3 Resolução de atribuição (ordem de precedência)

```
1. webhook traz  referral.ctwa_clid       → source_kind = 'ctwa'      (mais confiável)
2. 1ª mensagem contém "A7 Ref: XXXXXXXXXX" → getByShortRef()           → 'short_ref'
3. contato já existe com conversa anterior atribuída → herda           → 'organic'
4. nenhum dos anteriores                                               → 'unknown'
```

O passo 2 é a ponte que faltava: liga `a7-attribution.js` (já em produção) ao atendimento.

> **Nota para o auditor:** o webhook CTWA da Meta entrega o objeto `referral` com `source_id`, `source_type`, `ctwa_clid` e headline do anúncio. Isso resolve atribuição de anúncio **sem depender do GA4** — exatamente o que `memory/feedback_funil_antes_de_midia.md` estabelece como regra ("atribuição no WhatsApp, não no GA4").

### 6.4 Camada de operação `[ADENDO 2026-08-21]`

**Esclarecimento do dono:** não existe "sisteminha" a integrar — ele **é** o alvo. A visão é tudo online, **do lead até a entrega**. Isso adiciona ao escopo uma camada que a §6.1 não modelava: a operação física.

```
lead → conversa → cotação → PEDIDO → coleta → PESAGEM → produção → entrega → pagamento
                            └── §6.1 parava aqui ──┘└──── camada nova ────┘
```

#### O elo estrutural: pesagem

A A7 cobra **por libra**. Portanto:

> **A cotação é estimativa. O valor do pedido só existe depois da pesagem.**

Consequências obrigatórias no modelo:

```sql
-- order_record ganha:
  estimated_lbs     numeric      -- dito pelo cliente na conversa
  actual_lbs        numeric      -- pesado na unidade  ← define o valor real
  weighed_at        timestamptz

-- nova: job de campo (coleta e entrega)
pickup_job
  id              uuid pk
  order_id        uuid fk -> order_record
  kind            text not null    -- 'pickup' | 'delivery'
  status          text not null    -- 'scheduled'|'en_route'|'done'|'failed'
  address         text not null    -- PII, acesso restrito (§9.2)
  window_start    timestamptz
  window_end      timestamptz
  assigned_to     text
  completed_at    timestamptz
  proof_media_id  text             -- foto de comprovação, quando houver

-- nova: produção
production_run
  id              uuid pk
  order_id        uuid fk -> order_record
  status          text not null    -- 'received'|'washing'|'drying'|'folding'|'ready'
  started_at      timestamptz
  ready_at        timestamptz

-- nova: componentes de custo — é isto que produz CONTRIBUIÇÃO
order_cost
  id              uuid pk
  order_id        uuid fk -> order_record
  kind            text not null    -- 'supplies'|'labor'|'fuel'|'payment_fee'|'other'
  amount_usd      numeric not null
  basis           text             -- 'measured' | 'allocated' | 'estimated'  ← nunca inferir
```

**Regra de integridade:** `invoice` não pode ser emitido antes de `weighed_at`. Cotação não é fatura.

#### Por que esta camada vale mais que o CRM de atendimento

O gap de **alta prioridade** de `docs/audits/2026-07-30-audit-consolidado.md` é: *"Custo variável por pedido desconhecido — impede calcular margem e teto real de CPA."*

O CRM de atendimento **não fecha esse gap**. A tabela `order_cost` fecha. E contribuição por pedido é o **gate #1 para escalar em setembro**.

`basis` existe para preservar a regra do projeto: custo medido, rateado e estimado nunca se misturam num mesmo número. Sem `basis`, a contribuição vira média de coisas diferentes — o erro dos denominadores, repetido na camada financeira.

#### Faseamento revisado

| Fase | Entrega | Destrava |
|---|---|---|
| 0 | Atribuição durável | Origem sobrevive a deploy |
| 1 | Registro de lead | Denominadores lead → elegível → cotado |
| 2 | Pedido | Fechamento com denominador real |
| **3** | **Operação + pesagem + `order_cost`** | **Contribuição por pedido — gate #1** |
| 4 | Invoice | Receita conciliada sem trabalho manual |
| 5 | Entrega + recompra | LTV por coorte (meses, não semanas) |
| — | Agente 24/7 | Trilha paralela; depende da aprovação Meta e da Q6 |

> **Nota para o auditor:** este adendo descreve uma operação física que o autor **nunca observou**. Quem coleta, como pesa, onde produz e como entrega são desconhecidos. Trate a §6.4 como hipótese estruturada, não como levantamento de processo. Ver §15 Q8.

---

---

## 7. Componente C3 — Agente de atendimento

### 7.1 Base

Partir do repositório existente `A7laundry/a7-whatsapp-agent`, corrigindo os nove defeitos abaixo. **Não começar do zero** — o fluxo webhook → Claude → Graph API → Postgres está correto.

| # | Defeito | Arquivo | Correção |
|---|---|---|---|
| 1 | System prompt é template genérico (`[Nome da Empresa]`, "Seg-Sex 9h-18h") | `src/prompts/system-prompt.ts` | Gerar a partir de `MANIFESTO.md` + `marketing/whatsapp/message-templates.md` |
| 2 | Responde só em PT | idem | Detectar idioma e responder em EN/PT/ES no idioma do cliente |
| 3 | Ignora áudio e imagem em silêncio | `src/services/whatsapp.service.ts:extractMessage` | Aceitar `audio`/`image`/`document`; transcrever áudio; escalar mídia para humano |
| 4 | Sem verificação de assinatura | `src/routes/webhook.ts` | Validar `X-Hub-Signature-256` com `WHATSAPP_APP_SECRET` |
| 5 | Sem dedup | idem | Unique em `message.wa_message_id`; descartar repetido |
| 6 | Não lê `referral` do CTWA | idem | Persistir `ctwa_clid`, `source_id` |
| 7 | Sem handoff real | `src/prompts/`, novo serviço | Tabela `handoff` + notificação efetiva |
| 8 | Model ID desatualizado (`claude-sonnet-4-6-20250514`) | `src/services/claude.service.ts` | Atualizar para modelo vigente |
| 9 | Processa depois do `200` em serverless | `src/routes/webhook.ts:28` | ADR-6 |

### 7.2 Contrato do agente

**Pode:**
- Saudar em ≤30s e no idioma do cliente
- Informar preço, prazo, mínimo e cobertura exatamente como no `MANIFESTO.md`
- Perguntar endereço, volume estimado, janela desejada e serviço (normal/express)
- Explicar como funciona coleta e entrega
- Dizer que vai confirmar com a equipe

**Não pode:**
- Confirmar agendamento
- Prometer express sem confirmação da unidade (o `MANIFESTO.md` condiciona a disponibilidade)
- Dar desconto, criar preço ou negociar
- Afirmar cobertura fora das cidades listadas
- Inventar prazo, capacidade ou serviço inexistente

**Escala imediatamente quando:** cliente pede humano · pedido de agendamento · reclamação · mídia recebida (áudio/foto) · B2B/volume alto · fora de cobertura · qualquer incerteza.

### 7.3 Guardrail de preço

O agente **não pode ter preço escrito no prompt à mão**. O prompt é **gerado** a partir do `MANIFESTO.md` por script, e um guard CLI falha o build se divergirem — mesmo padrão do `scripts/guard-business-destinations.mjs`, que já protege o número de telefone.

Motivo: os preços já mudaram uma vez ($2.90/$3.20 → $3.25/$3.95). Preço duplicado à mão vira preço errado dito ao cliente.

---

## 8. Componente C4 — Integração com o funil atual

### 8.1 Ligações a construir

| De | Para | Como |
|---|---|---|
| `api/attribution/session.js` | Postgres | Trocar `shadow_ephemeral` por `durable_supabase` (adaptador já escrito) |
| Webhook WhatsApp | `attribution_session` | `getByShortRef()` na 1ª mensagem |
| `order_record.paid_at` | Stripe | Reconciliar via `api/stripe-session.js` e `api/create-payment-link.js` |
| CRM | MOS | Endpoint de KPIs consumido por `mos-app/` |
| CRM | Meta CAPI | `[FASE 3]` Enviar conversão offline com `ctwa_clid` para otimizar campanha |

### 8.2 KPIs que o CRM passa a fornecer ao MOS

Estes destravam o que `funnel-intelligence.json` hoje declara indisponível:

- Leads por origem (anúncio, campanha, página, orgânico)
- **Tempo até primeira resposta** — p50 e p90
- **% respondidos em ≤5 min** (a regra de ouro dos templates)
- Taxa de qualificação, de agendamento e de fechamento — **cada uma com denominador explícito**
- Ticket médio realizado
- **Receita por criativo** — o join `ad_source_id` → `paid_amount_usd`
- Conversas sem resposta abertas agora (operacional, tempo real)

> Todo KPI carrega `source`, `period` e `data-status`, no contrato que o MOS já usa (`a7-003`). Métrica sem base suficiente sai como **indisponível**, com intervalo de confiança quando aplicável — regra dos denominadores de `memory/project_virada_julho_2026.md`.

---

## 9. Segurança e privacidade

### 9.1 Não-negociáveis

| Controle | Exigência |
|---|---|
| Assinatura do webhook | Validar `X-Hub-Signature-256` (HMAC-SHA256 com `WHATSAPP_APP_SECRET`) em **toda** requisição. Sem isso, qualquer um que descubra a URL injeta mensagens e queima crédito da Anthropic |
| Verify token | `WHATSAPP_VERIFY_TOKEN` aleatório de ≥32 bytes, nunca commitado |
| Token da Graph API | System User token de longa duração, em env var, com rotação documentada |
| Secrets | Nenhum em repositório. `.env.example` com placeholders, como já é o padrão |
| Acesso ao painel | Reutilizar a auth do `mos-app` (PBKDF2 + cookie assinado HttpOnly/Secure/SameSite) — não inventar auth nova |
| Rate limit | No webhook e no painel, no padrão de `api/attribution/session.js` (60/min) |
| Transporte | HTTPS obrigatório; a Meta exige certificado válido |

### 9.2 Dados pessoais

O CRM passa a armazenar **PII real**: telefone, nome, endereço de coleta, conteúdo de conversa.

- Conteúdo de mensagem e endereço: retenção padrão **24 meses**, `[DECISÃO PENDENTE]` §15 Q4
- Endereço de coleta: campo de acesso restrito; não exposto em listagem nem em KPI
- Logs e diagnósticos: **nunca** registram corpo de mensagem, telefone completo, endereço ou e-mail — a regra já vale no `measurement-v2-foundation.md` e passa a valer no CRM
- Direito de exclusão: procedimento de apagar contato e conversas sob pedido
- Click IDs: permanecem reduzidos a presença booleana em diagnósticos, como já é hoje

### 9.3 Risco operacional a registrar

O agente responde clientes **em nome da A7, sem revisão prévia**. Mitigações: contrato fechado (§7.2), preço gerado do manifesto (§7.3), escalação por incerteza, e revisão humana das transcrições diariamente na primeira semana.

---

## 10. Operação 24/7

### 10.1 Topologia

| Camada | Escolha | Justificativa |
|---|---|---|
| Runtime | Vercel Functions (Fluid Compute, Node.js) | O projeto já é Vercel; timeout de 300s cobre processamento do agente |
| Banco | Supabase Postgres | Adaptador já escrito em `lib/attribution-store.js` |
| Continuação pós-200 | `waitUntil` | ADR-6 |
| Agendados | Vercel Cron | Varredura de SLA, heartbeat, relatório diário |

### 10.2 Monitoramento

| Verificação | Frequência | Alerta quando |
|---|---|---|
| Webhook vivo | 5 min | Nenhum evento recebido em 60 min de horário com tráfego |
| **Heartbeat Coexistence** | diário | Celular sem abrir o WhatsApp há **>10 dias** (corte é aos 14 — §5.1) |
| SLA de primeira resposta | 1 min | Conversa `new` há >2 min sem resposta |
| SLA de handoff | 5 min | `handoff` sem `acknowledged_at` há >15 min |
| Falha da Graph API | tempo real | Qualquer resposta não-2xx no envio |
| Falha da API Anthropic | tempo real | Erro ou timeout → **fallback para mensagem estática + handoff** |
| Fila de erro | 15 min | Qualquer mensagem não processada |
| Saldo/quota Anthropic | diário | Abaixo do limiar |

### 10.3 Degradação — o sistema nunca fica mudo

```
Claude indisponível        → mensagem estática de acolhimento + handoff imediato
Banco indisponível         → responde 200 (evita reenvio), grava em fila de erro, alerta
Graph API falhando         → retry exponencial 3x, depois handoff + alerta
Coexistence caiu           → alerta crítico; atendimento 100% no celular (o app continua funcionando)
Handoff sem resposta 15min → segunda notificação; após 30min, escalonamento
```

> A propriedade mais importante da operação: **nenhuma falha do sistema pode reproduzir o vazamento que ele veio corrigir.** Toda degradação termina em humano notificado, nunca em silêncio.

### 10.4 Runbook

`[A CONSTRUIR]` `docs/runbooks/whatsapp-crm-24-7.md`, no padrão de `docs/runbooks/google-ads-native-mos.md`, cobrindo: rotação de token, reconexão do Coexistence, replay de mensagem não processada, pausa do agente (kill switch para atendimento 100% humano), restauração de banco.

**O kill switch é obrigatório na Fase 1:** uma env var que desliga o agente e coloca tudo em handoff, sem deploy.

---

## 11. Fases e critérios de aceite

### Fase 0 — Fundação durável (não toca no WhatsApp)

- [ ] Supabase provisionado; schema §6.1 aplicado por migration versionada
- [ ] RPCs `a7_get_attribution`, `a7_get_attribution_by_short_ref`, `a7_upsert_attribution`, `a7_record_attribution_metrics`, `a7_attribution_health` implementadas
- [ ] Unique index em `attribution_session.short_ref`, com retry documentado em colisão
- [ ] `api/attribution/session.js` operando em `durable_supabase`; `/health` reporta o modo
- [ ] Atribuição sobrevive a deploy (teste: gravar → redeploy → recuperar por `short_ref`)
- [ ] `npm run lint`, `npm test`, `npm run build` passam sem regressão

> Fase 0 tem valor isolado: mesmo que o WhatsApp atrase, a atribuição para de morrer a cada deploy.

### Fase 1 — Canal e agente

- [ ] WABA verificada; número em Coexistence; app do celular **comprovadamente ainda funcional**
- [ ] Webhook com assinatura `X-Hub-Signature-256` validada; requisição sem assinatura válida é rejeitada com 403
- [ ] Dedup por `wa_message_id` comprovado com webhook duplicado
- [ ] Toda mensagem recebida vira `message` e abre/atualiza `conversation`
- [ ] `referral.ctwa_clid` e `source_id` persistidos quando presentes
- [ ] `A7 Ref` reconhecido na 1ª mensagem e resolvido via `getByShortRef()`
- [ ] Agente responde em ≤30s, no idioma do cliente (EN/PT/ES)
- [ ] Preço no prompt gerado do `MANIFESTO.md`; guard CLI falha se divergir
- [ ] Áudio, imagem e documento **não são ignorados** — geram handoff
- [ ] Handoff notifica um humano de verdade e registra `acknowledged_at`
- [ ] Kill switch desliga o agente sem deploy
- [ ] Nenhuma resposta duplicada em 100 mensagens de teste
- [ ] Rollback testado: desligar o agente devolve o atendimento 100% ao celular sem perda de mensagem

### Fase 2 — CRM operacional e MOS

- [ ] Painel autenticado listando conversas com estado e tempo de espera
- [ ] Humano pode responder pelo painel **ou** pelo celular, com histórico consistente nos dois
- [ ] `order_record` criado no agendamento e reconciliado com Stripe
- [ ] MOS exibe tempo de primeira resposta (p50/p90), % em ≤5 min, taxas com denominador, receita por criativo
- [ ] Nenhum KPI infere zero em dado ausente — sai como indisponível
- [ ] Relatório diário automático

### Fase 3 — Otimização (só após 30 dias de dado real)

- [ ] Conversão offline enviada à Meta CAPI com `ctwa_clid`
- [ ] Revisão do nível de autonomia do agente com base em ≥50 conversas auditadas
- [ ] Templates aprovados para reengajamento fora de janela, se justificado

---

## 12. Gates automáticos

No padrão CLI do repositório — nada de verificação manual:

| Guard | Falha quando |
|---|---|
| `guard:whatsapp-prompt` | Preço/prazo/mínimo/cobertura do prompt divergem do `MANIFESTO.md` |
| `guard:business` (existente) | Qualquer destino diferente de `14076708839` |
| `test:webhook-signature` | Requisição sem assinatura válida é aceita |
| `test:webhook-dedup` | `wa_message_id` repetido gera segunda resposta |
| `test:attribution-bridge` | `A7 Ref` válido não resolve para `attribution_id` |
| `test:crm-states` | Transição de estado inválida é aceita |
| `test:no-pii-in-logs` | Log contém telefone completo, endereço ou corpo de mensagem |
| `test:degradation` | Falha simulada de Claude/DB/Graph não termina em humano notificado |

Todos entram em `npm test`.

---

## 13. Rollback

| Fase | Como reverter | Perda |
|---|---|---|
| 0 | `A7_ATTRIBUTION_STORAGE_MODE=memory` | Volta a perder atribuição em deploy |
| 1 | Kill switch → atendimento 100% celular; desinscrever webhook | Nenhuma. Coexistence mantém o app funcional |
| 2 | Desligar painel, manter coleta | Operação volta ao celular; dado continua sendo gravado |

**Coexistence é a rede de segurança de todo o plano:** como o celular nunca para de funcionar, qualquer falha degrada para o atendimento manual de hoje — nunca para menos que isso.

---

## 14. Custo estimado

| Item | Estimativa | Base |
|---|---|---|
| Mensageria WhatsApp | ~US$0 | FEP 72h cobre leads de CTWA (§5.2) |
| Supabase | US$0–25/mês | Free tier provavelmente suficiente no volume atual |
| Vercel | US$0 incremental | Projeto já hospedado |
| API Anthropic | **`[A ESTIMAR]`** | Depende de volume e modelo — o auditor deve dimensionar (§15 Q3) |
| BSP/Tech Provider | **`[A DEFINIR]`** | Depende da resposta de §15 Q1 |

Referência de escala: as 19 threads auditadas equivalem a **12 leads novos, 3 recompras e 4 contatos fora do funil**. Não é um sistema de alto volume — é um sistema de **alta confiabilidade em volume baixo**.

---

## 15. Questões para o auditor

Bloqueiam a implementação. Ordenadas por impacto.

**Q1 — Coexistence exige Solution Partner / Tech Provider. Qual caminho?**
(a) A7 se registra como Tech Provider (mais controle, mais burocracia)
(b) Entrar por um BSP com Coexistence pronto (mais rápido, custo mensal, intermediário no canal)
(c) Abrir mão do Coexistence e migrar o número (perde o app no celular — contraria ADR-2)
→ *Recomendação do blueprint: (a) se viável no prazo; (b) como plano B. (c) só como último recurso.*

**Q2 — Nível de autonomia do agente.** ADR-5 assume "responde e qualifica, humano fecha". `[DECISÃO DO DONO — pendente]`

**Q3 — Dimensionamento de custo Anthropic.** Qual modelo e qual teto mensal? Precisa de limite rígido?

**Q4 — Retenção de PII.** 24 meses é adequado para conteúdo de conversa e endereço? Há exigência legal na Flórida a considerar?

**Q5 — Mudanças de pricing da Meta em 2026.** Confirmar na tabela oficial vigente o efeito de: categoria de agentes de IA e cobrança de templates utility dentro da CSW a partir de 01/out/2026 (fontes secundárias, não confirmado em doc oficial nesta sessão).

**Q6 — Quem é o humano de plantão 24/7?** O sistema notifica — alguém precisa atender. Sem isso, o handoff vira o mesmo silêncio, só que com log. **Esta é a questão que decide se o projeto funciona.**

**Q8 — Qual o mínimo da camada de operação (§6.4) que produz contribuição confiável?** Hipótese do autor: `actual_lbs` + custo de insumo por libra + tempo de rota. Se bastar, a Fase 3 é pequena e deve ser **antecipada** — é ela, não o CRM, que fecha o gap de alta prioridade do audit de julho. Requer levantamento do processo físico real, que não foi feito.

**Q7 — Divisão em stories.** Sugestão: `A7-012` Fase 0 · `A7-013` Fase 1 canal · `A7-014` Fase 1 agente · `A7-015` Fase 2 CRM/MOS · `A7-016` runbook 24/7. Confirmar com o padrão de `docs/stories/`.

---

## 16. Referências

**Internas:**
`MANIFESTO.md` · `docs/measurement-v2-foundation.md` · `docs/stories/a7-003-conversion-observability.md` · `docs/stories/a7-009-mos-immutable-audit-registry.md` · `marketing/whatsapp/message-templates.md` · `lib/attribution-store.js` · `a7-attribution.js` · `a7-business-config.js` · `api/attribution/session.js` · repo `A7laundry/a7-whatsapp-agent`

**Externas:**
- [Meta — Onboard WhatsApp Business app users (Coexistence)](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/)
- [Meta — WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
- [Meta — Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)

---

*Fim do blueprint v1.0. Nenhuma implementação deve começar antes das respostas de §15.*
