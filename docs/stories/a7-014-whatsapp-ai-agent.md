# Story A7-014 — WhatsApp conectado a uma IA de atendimento

**Status:** In Progress — ponte operacional Orlando implementada; onboarding Coexistence bloqueado pela separação obrigatória entre portfólio provedor e portfólio cliente

**Created:** 2026-08-21

**Source:** Priorização do owner: recortar do blueprint `docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md` **apenas** a trilha de canal + agente, e entregá-la ao Codex antes do restante do sistema.

**Executor:** Codex (configuração + implementação)

## Owner recut — Orlando bridge first (2026-08-26)

Antes do agente de IA, o owner priorizou a ponte operacional do número atual de
Orlando: webhook de entrada, envio de texto, fila de não lidas, histórico e
recebimento de áudio/foto. A ponte expõe token próprio para o sistema e mantém o
WhatsApp Business do celular por Coexistence. O agente automático permanece
desligado neste incremento.

O gate de aceite deste recorte é concreto: ler e responder pelo sistema, ver a
resposta chegar ao hóspede e ver a mesma bolha no celular A7 Orlando. WhatsApp
Web continua apenas como reserva manual.

---

## Story

**As an** A7 Laundry operator,
**I want** every WhatsApp message from a guest to receive a useful reply in seconds, in the guest's own language, without a human being awake,
**so that** no eligible lead is lost to silence and every conversation is recorded with its origin.

---

## Recorte de escopo

Esta story entrega **o canal e o agente**. Nada além.

**Dentro:**
- Número `+1 407-670-8839` conectado à WhatsApp Cloud API oficial
- Agente Claude respondendo, qualificando e escalando
- Registro mínimo de contato, conversa e mensagem (o histórico que o agente precisa para responder)
- Captura bruta do `A7 Ref` e do `referral` do Click-to-WhatsApp
- Escalação para humano com notificação efetiva
- Kill switch

**Fora — não construir nesta story:**
- CRM completo, pedido, ordem de coleta, pesagem, `order_cost`, invoice, LTV (blueprint §6.4)
- Resolução da atribuição (`getByShortRef()` → sessão) — depende da Fase 0. **Mas o `A7 Ref` deve ser gravado bruto desde o primeiro dia**, para não perder o dado enquanto a Fase 0 não existe
- KPIs no MOS
- Qualquer disparo ativo / campanha / mensagem em massa

---

## Decisões já tomadas (não reabrir sem argumento novo)

| # | Decisão | Base |
|---|---|---|
| 1 | **Cloud API oficial da Meta.** Nada de open-wa, Baileys, whatsapp-web.js, Evolution | `docs/audits/2026-08-21-open-wa-technical-risk-audit.md` — execução de código remoto não assinado na sessão, servidor de licença que recebe o número e devolve JS, estável congelado desde dez/2024, bug de "TOS block" sem resposta |
| 2 | **Modo Coexistence.** O número permanece funcional no app do celular | Rede de segurança: qualquer falha degrada para o atendimento manual de hoje, nunca para menos |
| 3 | **Partir do repo `A7laundry/a7-whatsapp-agent`**, não do zero | O fluxo webhook → Claude → Graph API → Postgres já está correto; são 9 defeitos a corrigir, não uma reescrita |
| 4 | **O agente responde e qualifica; o humano fecha** | `[ASSUMIDO na ausência de decisão do owner]` — preço por libra com mínimo de US$ 50, express condicionado a disponibilidade e cobertura variável são compromissos com dinheiro real. Reversível depois de ≥50 conversas auditadas |

---

## Business Invariants

Regras que não podem ser violadas em nenhuma versão desta story.

**Do canal:**
- Toda requisição de webhook tem a assinatura `X-Hub-Signature-256` validada com `WHATSAPP_APP_SECRET`. Assinatura ausente ou inválida → 403, sem processar.
- `wa_message_id` é único. Webhook reenviado pela Meta nunca gera segunda resposta ao cliente.
- O webhook responde `200` em menos de 1 segundo; o processamento do agente ocorre em continuação garantida (`waitUntil`), nunca em `await` após a resposta HTTP.
- Nenhum segredo em repositório. `.env.example` com placeholders.

**Do agente:**
- Preço, prazo, mínimo e cobertura são **gerados** de `MANIFESTO.md`. Nunca escritos à mão no prompt. Um guard CLI falha o build se divergirem.
- O agente responde no idioma em que o cliente escreveu (EN / PT / ES).
- O agente **não pode**: confirmar agendamento, prometer express sem confirmação da unidade, dar desconto, criar preço, negociar, afirmar cobertura fora das cidades do manifesto, ou inventar prazo ou serviço.
- Áudio, imagem e documento **nunca são ignorados em silêncio** — geram escalação.
- Toda incerteza do agente termina em escalação, nunca em resposta inventada.

**Da operação:**
- Toda degradação termina em **humano notificado**. Nenhuma falha do sistema pode reproduzir o silêncio que ele veio corrigir.
- O kill switch desliga o agente por variável de ambiente, sem deploy.
- Logs e diagnósticos nunca registram corpo de mensagem, telefone completo ou endereço.

---

## Acceptance Criteria

### Canal
- [ ] WABA criada, verificação de negócio concluída, número `+1 407-670-8839` onboarded
- [ ] **O app WhatsApp Business no celular continua funcional após o onboarding** — verificado enviando e recebendo pelo aparelho
- [ ] Histórico e contatos sincronizados conforme Coexistence
- [ ] `WHATSAPP_TOKEN` é System User token de longa duração, não token temporário de dev
- [ ] `WHATSAPP_PHONE_NUMBER_ID`, `WABA_ID` e `WHATSAPP_APP_SECRET` configurados como variáveis de ambiente encriptadas
- [ ] Webhook verificado; campos `messages`, `message_template_status_update` e `account_update` inscritos
- [ ] Requisição sem assinatura válida é rejeitada com 403 — coberto por teste
- [ ] Webhook duplicado não gera segunda resposta — coberto por teste

### Agente
- [ ] Responde em ≤30 segundos
- [ ] Responde em EN, PT e ES conforme o idioma do cliente — teste com uma mensagem em cada
- [ ] Preço, prazo, mínimo e cobertura conferem com `MANIFESTO.md`, verificado por guard CLI
- [ ] Áudio, imagem e documento geram escalação em vez de silêncio
- [ ] `A7 Ref` presente na primeira mensagem é gravado no registro da conversa
- [ ] `referral.ctwa_clid` e `referral.source_id` são persistidos quando presentes
- [ ] Model ID atualizado (o repo está em `claude-sonnet-4-6-20250514`)
- [ ] Nenhuma resposta duplicada em 100 mensagens de teste

### Escalação e operação
- [ ] Escalação notifica um destino real e registra `acknowledged_at`
- [ ] Falha da API Anthropic → mensagem estática de acolhimento + escalação, nunca silêncio
- [ ] Falha do banco → responde 200, grava em fila de erro, alerta
- [ ] Falha da Graph API → 3 retries exponenciais, depois escalação + alerta
- [ ] Kill switch desliga o agente sem deploy — verificado
- [ ] Alerta configurado para inatividade do celular >10 dias (o corte do Coexistence é aos 14)

### Qualidade
- [ ] `npm run lint`, `npm test` e `npm run build` passam na raiz sem regressão
- [ ] Novos guards integrados ao `npm test`
- [ ] Rollback testado: desligar o agente devolve o atendimento 100% ao celular sem perda de mensagem

---

## Tasks

### Bloco 1 — Decidir o caminho de onboarding
- [x] Investigar e recomendar entre: (a) A7 se registra como Tech Provider, (b) entrar por um BSP com Coexistence pronto, (c) — último recurso — onboarding clássico. Caminho escolhido: **Independent Tech Provider**, sem BSP/Twilio, com Embedded Signup configurado para `whatsapp_business_app_onboarding`.
- [ ] **GATE:** não executar migração de número sem autorização explícita do owner. O caminho (c) desconecta o app do celular e não é reversível sem custo

### Bloco 2 — Preparar o código antes do canal existir
Tudo abaixo independe da aprovação da Meta e pode ser feito em paralelo ao Bloco 1.

- [x] Decidir a casa do código — ponte serverless em `api/whatsapp/` + núcleo testável em `lib/whatsapp-bridge.js` dentro deste repositório
- [ ] Gerador de system prompt a partir de `MANIFESTO.md` + `marketing/whatsapp/message-templates.md`
- [ ] Guard CLI `guard:whatsapp-prompt` — falha se o prompt divergir do manifesto
- [ ] Detecção de idioma e resposta em EN / PT / ES
- [x] Recebimento de `audio`, `image` e `document` com metadados e proxy autenticado de mídia
- [x] Validação de `X-Hub-Signature-256`
- [x] Deduplicação por `wa_message_id`
- [ ] Captura de `referral` e de `A7 Ref` bruto
- [x] Correção do padrão serverless: 200 primeiro, processamento em `waitUntil`
- [ ] Atualização do model ID
- [ ] Tabela de escalação + notificação efetiva
- [ ] Kill switch do agente (fora do recorte bridge-first; agente ainda não ativado)
- [x] Testes da ponte: assinatura, texto, imagem, áudio, ecos do celular, histórico, status e token

### Bloco 3 — Ligar
- [x] Provisionar banco Orlando (North Virginia): `contact`, `conversation`, `message`; `handoff` permanece no incremento do agente
- [x] Deploy público estável dedicado em `a7-orlando-whatsapp-bridge.vercel.app`, sem alterar `a7laundry.com`
- [x] Apontar e verificar o webhook; seis eventos necessários para Coexistence estão assinados
- [ ] Teste de ida e volta com número pessoal
- [ ] Janela de observação com transcrições revisadas diariamente na primeira semana

### Evidência operacional — 2026-08-26

- Banco Orlando `wiwawtpaxnrueugppasi` recebeu a migration da ponte e passou smoke test remoto de deduplicação, não lidas, histórico e marcação de leitura; registros sintéticos foram removidos ao final.
- Deployment isolado Vercel `dpl_F2yk6j2drKPrLijNJLGSzRWZKyfQ` compilou com ambiente Production sem promover `a7laundry.com`.
- Smoke test autenticado: `GET /api/whatsapp/health` → `{"ok":true,"unit":"orlando","channel":"whatsapp_cloud_api"}`; `GET /api/whatsapp/unread` → `{"conversations":[]}`.
- `WHATSAPP_BRIDGE_TOKEN` foi rotacionado e entregue somente pelo clipboard; não foi gravado em arquivo nem log.
- Inventário Meta read-only encontrou WABAs no portfólio `a7laundry` (ID `1523774564935117`), mas nenhum contém o número público de Orlando `+1 407-670-8839`. Portanto, o próximo passo obrigatório é onboarding Coexistence; onboarding clássico permanece proibido.

### Evidência operacional — 2026-08-27

- App Meta dedicado `A7 Laundry Orlando Bridge` publicado, App ID `28611389461785981`, vinculado ao portfólio verificado `a7laundry` (`1523774564935117`).
- Integração iniciada como **Independent Tech Provider**; nenhum parceiro de solução, BSP ou Twilio foi associado.
- Configuração de Login for Business `A7 Orlando Coexistence` criada, Configuration ID `905654598886432`.
- Launcher hospedado pela Meta confirmado com `featureType=whatsapp_business_app_onboarding`, Embedded Signup v4 e session info v3.
- Ícone oficial A7 1024x1024 com fundo transparente carregado e aceito.
- Política de Não Discriminação aceita pelo owner. Usuário de sistema administrador `A7 Orlando WhatsApp Bridge` criado (ID `61593644949436`) e recebeu acesso total somente ao app Orlando.
- A emissão do token permanente foi solicitada apenas com `whatsapp_business_management` e `whatsapp_business_messaging`, as duas permissões atualmente expostas pela Meta para o app. A Meta passou a exigir verificação adicional da conta e informou que os dados foram enviados para análise; nenhum token foi emitido, exposto ou salvo.
- Os termos do Hosted Embedded Signup foram aceitos pelo owner e o fluxo avançou até a seleção de ativos. A Meta confirmou o app `A7 Laundry Orlando Bridge` e a configuração `905654598886432`.
- Auditoria visual confirmou que `a7laundry` (`1523774564935117`) é o portfólio correto: nome legal **A7 LAUNDRY ORLANDO CORP**, país **Estados Unidos da América**. Entretanto, o seletor do Embedded Signup o desabilita com a mensagem exata `This Meta Business Account owns the app`.
- Nenhum portfólio alternativo é Orlando: `A7 Lavanderia - 01` e `A7 Lavanderia - 02` têm endereço Brasil; `A7 Lavanderia - CD23` contém o WABA brasileiro `1447256778761207` e o número `+55 12 97412-8390`; `Dennis Arruda` possui a Página `A7 Lavanderia Manaus`. Nenhum foi selecionado.
- Próximo gate: separar o portfólio proprietário do app (provedor) do portfólio cliente Orlando por um caminho aprovado pela Meta, sem transferir WABA/número nem escolher um ativo brasileiro. Não criar novo app, transferir o app atual ou duplicar o portfólio sem decisão explícita do owner.
- A configuração rápida continua exibindo por padrão o ativo não-alvo `+1 321-667-4354`, WABA `1602826480815993`, Phone Number ID `1141042659097001`; ele não foi alterado nem usado. O onboarding do `+1 407-670-8839` seguirá exclusivamente pelo launcher de Coexistence.

---

## Decisões pendentes do owner

Não bloqueiam o Bloco 2. **Bloqueiam o Bloco 3.**

**D1 — Para onde vai a escalação?**
O agente vai chamar alguém. Precisa de um destino concreto. A opção mais simples e que não depende de contratar ninguém: **notificar no WhatsApp pessoal do Dennis** via a própria Cloud API. Não garante que alguém acorde às 2h, mas garante que a notificação existe e fica registrada. Alternativas: e-mail, SMS, painel.

**D2 — Confirma o nível de autonomia?**
A story assume "responde e qualifica, humano fecha" (decisão 4). Se o owner quiser que o agente feche sozinho, o contrato de invariantes muda e a story precisa ser revista antes do Bloco 2.

**D3 — Autorização para migrar o número, se o Coexistence não for viável.**
Só o owner decide. Sem resposta, o Bloco 1 para no caminho (c).

---

## Rollback

| Situação | Ação | Perda |
|---|---|---|
| Agente respondendo mal | Kill switch → atendimento 100% celular | Nenhuma. Coexistence mantém o app funcional |
| Webhook problemático | Desinscrever na Meta | Mensagens seguem chegando no celular |
| Reverter tudo | Remover o número da WABA | Volta ao estado de hoje |

**Coexistence é a rede de segurança da story inteira:** como o celular nunca para, qualquer falha degrada para o atendimento manual atual — nunca para menos que isso.

---

## Notas para o auditor

1. **O número do vazamento foi corrigido.** A justificativa correta é 3–4 falhas em 12 leads novos (25,0%–33,3%), conforme `docs/DIRECIONAMENTO-AGOSTO-2026.md` rev. 3 — não os 47,4% que circularam numa versão anterior.
2. **O retorno direto desta story é pequeno** (~US$ 36 de contribuição por ciclo, estatisticamente indistinguível de zero — ver `docs/blueprints/A7-VIABILIDADE-CRM-PROPRIO-2026-08-21.md` §4). O owner priorizou esta trilha mesmo assim, e a decisão está registrada. O valor real aparece quando somada ao registro de lead e à camada de operação.
3. **O prazo é dominado pelo Bloco 1**, que não depende de código. Começar por ele e rodar o Bloco 2 em paralelo é o que encurta a entrega.
4. **Não há CI neste repositório** rodando `npm test`. Os guards existem e são bons, mas dependem de alguém executá-los. Fechar essa lacuna antes de adicionar código novo é barato e reduz o risco de tudo o que vem depois.

---

## Referências

`docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md` (§4 ADRs, §5 canal, §7 agente, §9 segurança, §10 operação 24/7) · `docs/blueprints/A7-VIABILIDADE-CRM-PROPRIO-2026-08-21.md` (§3 custos, §4 retorno, §5 revisão) · `docs/audits/2026-08-21-open-wa-technical-risk-audit.md` · `docs/DIRECIONAMENTO-AGOSTO-2026.md` · `MANIFESTO.md` · `marketing/whatsapp/message-templates.md` · repo `A7laundry/a7-whatsapp-agent`

Desenho visual da cadeia completa: https://claude.ai/code/artifact/e6c0d1a3-fb4f-48e4-acaf-d5189cd69435

## File List

- `docs/stories/a7-014-whatsapp-ai-agent.md`
- `.env.example`
- `api/whatsapp/_http.js`
- `api/whatsapp/health.js`
- `api/whatsapp/history.js`
- `api/whatsapp/media.js`
- `api/whatsapp/read.js`
- `api/whatsapp/send.js`
- `api/whatsapp/unread.js`
- `api/whatsapp/webhook.js`
- `docs/runbooks/whatsapp-orlando-cloud-api-bridge.md`
- `lib/whatsapp-bridge.js`
- `package.json`
- `package-lock.json`
- `scripts/test-whatsapp-bridge.mjs`
- `supabase/config.toml`
- `supabase/migrations/20260325_payments_utm.sql`
- `supabase/migrations/20260326_projects_intake_data.sql`
- `supabase/migrations/20260327_admin_find_user_rpc.sql`
- `supabase/migrations/20260328_diag_rpc.sql`
- `supabase/migrations/20260329_diag_fn_body.sql`
- `supabase/migrations/20260330_fix_handle_new_user.sql`
- `supabase/migrations/20260827010000_whatsapp_orlando_bridge.sql`
