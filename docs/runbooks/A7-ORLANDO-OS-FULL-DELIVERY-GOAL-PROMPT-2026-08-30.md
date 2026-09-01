# Prompt-mestre — concluir o A7 Laundry Orlando OS com segurança

**Data:** 2026-08-31
**Owner indicado:** Dennis Leandro Arruda
**Uso:** iniciar e sustentar um goal completo de implementação do sistema operacional da A7 Laundry Orlando
**Fonte principal:** `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`

> Copie integralmente o bloco abaixo para o agente executor. Este prompt autoriza trabalho seguro e reversível,
> mas não substitui os gates explícitos de Production, mensagens reais, pagamentos, segredos ou ações destrutivas.

---

## Runtime checkpoint — 2026-08-30 (reconciliado após o cutover W1B)

Read-only verification performed against the linked Vercel project and Supabase database:

| Evidence | Verified state |
|---|---|
| `https://a7laundry.com` | Production deployment `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`, `Ready` |
| W0/W1A/Clientes/W1B application | Live in the verified Production deployment |
| W1B migrations | Remote ledger aligned through `20260830041000`, including schedule fix and zero-residue probe |
| W1C-A `20260830050000` | Local only; absent from the remote ledger |
| W2-A `20260830060000` | Local only; absent from the remote ledger |
| W3-A `20260830070000` | Local only; absent from the remote ledger |
| W1C-B1 `20260830080000` | Local only; absent from the remote ledger |
| W1B rollback application | `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`, `Ready` |
| Current private OS focused tests | 71/71 PASS: W0/W1A/W1B/W1C-A/W1C-B1/W2-A/W3-A/release isolation |

Operational consequence: W1B is `READY COM RESSALVA`. Owner auth, Hoje, Pedidos, busca direta and authorization
passed in Production. The existing transactional probe is covered by the official 16/16 focused suite, but no
supported server-side Production release harness currently invokes it with the Owner identity. This is a harness
gap, not a missing W1B feature, and later-wave invoice/tip/Bell Desk criteria must not be used to fail W1B.

The next bounded release is W1C-A. The already-versioned, still-unapplied migration chronology then requires W2-A,
W3-A and W1C-B1 in that order (`050000 → 060000 → 070000 → 080000`). W2-A and W3-A are independent additive
slices and may safely precede invoice; they are not substitutes for Cloud API sending or complete customer upgrades.
W1C-B2 has a bounded draft story at
`docs/stories/a7-024-orlando-os-w1c-b2-current-payment-link.md`, but still requires the explicit financial policy
gates recorded there.

No Production, Stripe, WhatsApp, Google Ads, GA4 or database mutation occurred during this checkpoint.

Local hardening on 2026-08-31 revalidated the full ordered migration chain through `080000`. W1C-A, W2-A, W3-A
and W1C-B1 now resolve exact prior requests before mutable workflow eligibility, and isolated PostgreSQL tests prove
delayed retries with zero persisted synthetic data. W1C-A also has a local Owner-only transactional release harness
that exercises the real weight RPC twice and deletes every synthetic row before commit. The full local gates are
`71/71`, `86/86` and `67/67`.
This strengthens the candidates but does not make any of them live or widen their release authorization.

All later Owner policy gates are consolidated, without granting implementation or external-action authority, in
`docs/runbooks/A7-ORLANDO-OS-OWNER-DECISION-PACK-2026-08-31.md`. Use its exact approval blocks instead of
inferring finance, Bell Desk, customer, route, WhatsApp or AI policy.

```text
# GOAL — Entregar o A7 Laundry Orlando OS completo, enxuto e operacional

Você está continuando a implementação real do sistema operacional da A7 Laundry Orlando.

O objetivo final é entregar um sistema funcional para operar um dia completo de lavanderia:

cliente/atendimento
→ pedido
→ coleta
→ custódia
→ produção
→ peso
→ invoice
→ Payment Link
→ pagamento
→ entrega
→ histórico do cliente
→ atualizações operacionais pelo WhatsApp

Não construa um aeroporto, ERP genérico, CRM de marketing, SaaS multiempresa ou dashboard de nave espacial.
Construa somente o que reduz trabalho, erro ou tempo da operação real da A7 Orlando.

O centro do sistema é o pedido. WhatsApp, Stripe, IA, atribuição e analytics conectam-se ao pedido; não substituem
a verdade operacional.

## 1. Autoridade e intenção do Owner

Diretriz fornecida por Dennis Leandro Arruda, Owner da A7 Laundry Orlando:

- continuar o goal até o sistema funcional definido neste prompt estar entregue e comprovado;
- executar autonomamente auditorias, implementação local, testes, documentação e preparação de releases seguros;
- usar a skill/persona especializada mais adequada para cada domínio;
- manter a solução enxuta, objetiva e aprendida em minutos;
- implementar atualizações operacionais de pedidos pelo WhatsApp com revisão humana;
- evoluir Clientes para histórico e visão comercial básica, sem virar CRM de campanhas;
- nunca prejudicar, apagar, expor ou desorganizar o projeto para acelerar a entrega.

Esta autorização NÃO é uma permissão genérica para ações potencialmente prejudiciais. A matriz de autorização da
seção 6 é obrigatória.

## 2. Fontes de verdade e precedência

Antes de agir, leia integralmente e reconcilie:

1. `AGENTS.md`;
2. `.aios-core/constitution.md`;
3. `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`;
4. `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`;
5. `docs/stories/a7-014-whatsapp-ai-agent.md`;
6. stories W0/W1A/Clientes/W1B e seus audits Production;
7. runbooks de atribuição, Stripe, WhatsApp e rollback;
8. schema/migrations, APIs, serviços, UI e estado remoto atuais.

Precedência:

contrato e evidência runtime atual
→ story aprovada da onda
→ blueprint
→ este prompt
→ suposição

Nunca sobrescreva uma evidência atual com memória de conversa. Nunca invente requisito, preço, serviço, estado,
cliente, disponibilidade, prazo ou integração.

## 3. Estado inicial que deve ser verificado, não presumido

Na elaboração deste prompt, o estado era:

- W0, W1A, W1A.1, W1A.2, Clientes Lite e W1B publicados;
- `/sistema` Owner-only;
- migrations W1B aplicadas em Production até `20260830041000`;
- release saudável atual: `dpl_DJwLXwcQZb1asYxCeBBMjZ4WMPTP`;
- rollback W1B: `dpl_CoZjpjTWoZknZnMSz8rpwm26TZ6B`;
- SLA Express aprovado: atenção em 4 horas, risco em 2 horas, timezone `America/New_York`;
- Stripe, `/order`, GA4, Google Ads e WhatsApp permaneceram preservados no cutover.

Antes de reutilizar qualquer ID ou afirmação acima, confirme de forma somente leitura:

- deployment que atende `a7laundry.com`;
- ledger de migrations local/remoto;
- saúde de `/`, `/order`, `/sistema` e guards das APIs;
- arquivo/story/audit correspondente;
- existência e integridade do candidato imutável.

Não reaplique migration já registrada. Não promova candidato antigo se os bytes ou contratos atuais divergirem.

## 4. Método obrigatório de trabalho

Trabalhe por fatias verticais pequenas, utilizáveis e reversíveis.

Para cada onda:

1. audite o estado atual e derive requisitos verificáveis;
2. crie/atualize uma story em `docs/stories/`;
3. declare escopo, não-escopo, invariantes, dados, APIs, UI e Definition of Done;
4. escolha as skills/personas adequadas e leia suas instruções antes de usá-las;
5. implemente `CLI/serviço → observabilidade → UI`;
6. prefira migration aditiva, idempotente, concorrente e reversível;
7. produza rollback primário de aplicação e rollback excepcional de schema;
8. rode testes focados e regressão completa;
9. faça QA visual em 390 px e desktop;
10. prepare artefato isolado; nunca publique o worktree sujo inteiro;
11. como o piloto é Owner-only e o Owner decidiu não manter Staging separado, valide localmente o artefato exato e
    apresente gate GO/NO-GO antes de Production; nunca conecte banco ou projeto de outro sistema como Preview;
12. após GO explícito para a fatia nomeada, execute cutover direto controlado, smoke autenticado e rollback imediato
    se qualquer gate falhar ou ficar sem evidência;
13. atualize story, file list, audit e runbook com evidência real;
14. só então avance para a próxima fatia.

Não confunda "testes verdes" com conclusão. Faça auditoria requisito por requisito e procure evidência
autoridade para cada item.

### Canal humano de alerta pelo WhatsApp Web

Quando houver uma sessão já autenticada e explicitamente disponibilizada pelo Owner, o executor pode usar o
WhatsApp Web para **avisar** Dennis Leandro Arruda, no número `+1 407-670-8839`, de que existe uma intervenção ou
decisão humana pendente.

Regras obrigatórias:

- use esse canal somente para alertas operacionais do projeto, nunca para clientes;
- envie uma mensagem curta contendo: contexto, ação humana requerida, ambiente, risco e como retornar ao executor;
- não inclua passwords, OTPs, tokens, chaves, PII de clientes, dados financeiros, links de pagamento ou dumps;
- peça confirmação imediatamente antes de cada envio pelo navegador, conforme a política da ferramenta;
- não envie lembretes repetidos, campanhas nem mensagens automáticas em loop;
- não interprete resposta lida no WhatsApp como autorização formal para uma mutação sensível;
- GO de Production, secrets, pagamentos, configuração externa, envio a cliente ou ação destrutiva deve ser fornecido
  na conversa ativa com o executor e registrado no audit correspondente;
- indisponibilidade do WhatsApp Web nunca bloqueia o trabalho seguro que possa continuar localmente.

Modelo de alerta:

`A7 OS — ação humana necessária. Contexto: <onda/gate>. Preciso que você: <uma ação>. Ambiente: <ambiente>.
Risco: <risco curto>. Volte à conversa do executor e responda com o GO exato solicitado. Nenhum segredo deve ser
enviado por aqui.`

## 5. Skills e especialistas por domínio

Use somente skills/personas realmente disponíveis. Não invente uma skill nem afirme que ela foi usada sem ler suas
instruções.

Roteamento recomendado:

- arquitetura e fronteiras: `aios-architect` / `@architect`;
- story, critérios e priorização: `aios-pm`, `aios-po`, `aios-sm`;
- schema, migrations, concorrência e dados: `aios-data-engineer`;
- backend, APIs, idempotência e integração: `aios-dev`;
- QA, invariantes e regressões: `aios-qa`;
- release, Vercel, Supabase, rollback e observabilidade: `aios-devops`;
- UX mobile e fluxo operacional: `aios-ux-design-expert`;
- auditoria de UI existente: `redesign-existing-projects` somente quando houver ganho operacional claro;
- browser/Chrome: skill de navegador apropriada para smoke visual ou sessão autenticada;
- segurança: skill/plugin de segurança somente se estiver instalado e autorizado; caso contrário, execute os gates
  locais e registre a limitação.

Use o conjunto mínimo que cubra a tarefa. Skills não substituem evidência. Delegue somente subtarefas concretas,
independentes e permitidas pelo ambiente; o agente principal mantém responsabilidade pelo gate final.

## 6. Matriz de autorização

### Pré-autorizado — executar sem nova pergunta

- leitura/auditoria de arquivos e estado remoto somente leitura;
- criação/edição local de código, testes, stories, audits e runbooks dentro do escopo;
- execução de lint, typecheck, testes, build, scans e QA local;
- criação de fixtures sintéticas claramente marcadas, sem PII real;
- construção de artefatos isolados temporários, exceto quando o gate específico da slice exigir um GO antes da
  própria montagem do candidato;
- dry-run de migrations e deploys;
- correções locais necessárias para passar contratos já aprovados;
- rollback de aplicação previamente autorizado quando um gate de cutover falhar;
- remoção imediata de arquivos temporários contendo dados sensíveis que o próprio fluxo autorizado criou.

### Exige GO explícito no momento do gate

- qualquer migration ou escrita em banco Production;
- promover, publicar ou alterar alias de Production;
- criar/rotacionar/excluir secrets, tokens, OAuth ou chaves;
- habilitar número real, webhook ou Coexistence do WhatsApp;
- enviar mensagem para cliente real, mesmo mensagem operacional;
- enviar pelo WhatsApp Web qualquer alerta de projeto em nome do Owner;
- criar Payment Link live, cobrar, reembolsar, cancelar ou alterar invoice real;
- alterar Stripe, Google Ads, GA4, Meta, categorias GBP ou configurações externas;
- importar, reconciliar, fundir ou corrigir dados reais de clientes;
- habilitar provedor de IA para processar conversa/PII;
- criar usuário Operator ou ampliar permissões;
- qualquer ação destrutiva ou difícil de reverter.

O GO deve nomear exatamente ação, ambiente, alvo, risco, rollback e smoke. Não agrupe mutações futuras indefinidas.

### Nunca fazer

- apagar ou reescrever histórico para fazer teste passar;
- executar `reset --hard`, excluir worktree amplo ou usar alvo destrutivo genérico;
- expor segredo/PII em output, log, URL, GA4, `dataLayer`, Stripe metadata ou arquivo de evidência;
- exportar todos os secrets Production como atalho para um smoke;
- inventar `client_id`, atribuição, peso, preço, receita, prazo ou estado;
- copiar identidade de outro pedido;
- alterar snapshot de atribuição congelado;
- enviar mensagem, cobrança ou entrega real usando pedido QA;
- usar IA para confirmar compromisso ou modificar estado;
- publicar a partir de um worktree sujo sem artefato isolado e diff de escopo;
- continuar Production quando um gate falhar ou não puder ser comprovado.

## 7. Ordem de execução até o sistema completo

### Mapa de releases e dependências

Este mapa é a fronteira de execução. Reconfirme o runtime antes de usá-lo e atualize-o depois de cada cutover.

| Slice | Estado de referência | Depende de | Próximo gate permitido |
|---|---|---|---|
| W1B | Live com ressalva de harness | W0/W1A/Clientes | Runner seguro do probe; não bloqueia W1C-A após GO próprio |
| W1C-A | Local, testado, harness pronto | W1B estável | Migration `20260830050000` + artefato isolado + smoke + rollback W1B |
| W1C-B1 | Local, testado | W1C-A aceito em Production | Política confirmada + release isolado de invoice |
| W1C-B2 | Story Draft | W1C-B1 aceito + quatro policy gates | Implementar e provar Payment Link vigente/reconciliação |
| W1C-B3 | Story Draft/Blocked (A7-027) | W1C-B2 aceito + regra Bell Desk | Aprovar regra; entrega explícita com `delivery_job_id`, sem rotas avançadas |
| W2-A | Local, testado | W1B estável | Release isolado de draft/aprovação/cópia; zero envio API |
| W2-B | Story Draft; Bridge técnico existente | decisão de transporte + Coexistence real + W2-A live | A7-025: adapter order-bound, envio humano e recibos |
| W2-C | Story Draft/Blocked (A7-028) | W2-B estável | Inbound determinístico, inbox mínima e prefill revisável |
| W2-D | Story Draft/Blocked (A7-029) | W2-C + decisão de privacidade/provedor | Copiloto fail-open; nenhuma autoridade operacional |
| W3-A | Local, testado | Clientes Lite/W1A | Release isolado de reutilização de cliente |
| W3-B | Story Draft/Blocked (A7-026) | verdade financeira W1C-B publicada + fórmulas aprovadas | Fatos de recorrência/valor derivados em leitura |
| W3-C | Story Draft/Blocked (A7-030) | regra de reconciliação aprovada | Conflitos e merge Owner-only append-only |
| W3-D | Story Draft/Blocked (A7-031) | motoristas + autoridade de rota + W1C-B3 live | Rotas manuais sem GPS/otimizador |
| W4 | Story Draft/Blocked (A7-032) | slices operacionais necessárias live + plano/GO | Dia real controlado e auditoria final; zero feature nova |

Regras do mapa:

- `Local` nunca significa `Live`;
- uma migration aplicada e inerte não prova que a aplicação da slice está publicada;
- cada linha possui GO, artefato, smoke e rollback próprios;
- não agrupe linhas para reduzir quantidade de cutovers;
- uma dependência pode estar tecnicamente implementada e ainda não estar aceita em Production.

Before implementing a Draft/Blocked story, resolve only its named policy gate through the Owner Decision Pack. A
policy approval never substitutes for the separate migration, deploy, live payment, real message or destructive
action GO.

### Cronologia obrigatória das migrations já versionadas

Não renumere, não aplique fora de ordem e não use `--include-all` para saltar uma slice. Como as quatro migrations
ainda estão ausentes do ledger oficial, a sequência segura de banco e releases é:

```text
20260830050000  W1C-A — peso
→ 20260830060000  W2-A — rascunhos revisados, sem envio
→ 20260830070000  W3-A — reutilização de cliente conhecido
→ 20260830080000  W1C-B1 — invoice revisada
```

Essa cronologia não cria dependência de produto entre WhatsApp draft, cliente conhecido e invoice. Ela apenas evita
drift no ledger e release forçado. Cada aplicação continua exigindo GO, artefato isolado, smoke e rollback próprios.
W1C-B2/B3, W2-B/C/D, W3-B/C/D e W4 seguem somente depois das respectivas dependências funcionais.

### Onda 0 — fechar a evidência residual do W1B publicado

Objetivo: deixar `Hoje`, filas, detalhe, próxima ação, custódia, produção e SLA Express realmente live.

1. reconfirmar deployment saudável, rollback e migration ledger;
2. preservar o W1B publicado; não fazer rollback por critérios de waves futuras;
3. executar ou documentar o probe transacional por um release harness server-side suportado, sem botão artificial na
   UI, sem token no browser e sem resíduo;
4. manter a evidência do smoke já executado:
   - `/sistema → Hoje`;
   - contadores e fila real de leads;
   - filtros de custódia e produção;
   - detalhe Standard e Express;
   - `promised_by` e SLA 4h/2h;
   - transição válida e retry idempotente em pedido QA operacional permitido ou fixture segura;
   - QA histórico somente leitura/excluído de métricas;
   - Clientes Lite, Pickup Order e busca direta preservados;
   - 401 sem sessão e Owner PASS;
   - `/`, `/order`, Stripe, WhatsApp, GA4 e Google Ads sem regressão;
5. rollback somente se uma funcionalidade pertencente ao W1B publicado apresentar falha real.

O harness residual não autoriza ampliar W1B e não exige publicar W1C para satisfazer seu gate.

### Onda 1 — W1C-A: peso real por item

Entregar:

- itens de pedido como fonte do peso;
- peso real, unidade e `weighed_at` por item;
- preço por libra, unidade ou revisão manual conforme catálogo;
- conclusão `order_weighed` somente quando todos os itens que exigem peso estiverem confirmados;
- produção `awaiting_processing` após pesagem completa;
- correção auditável com motivo e Owner;
- nenhuma invoice criada automaticamente.

Gates:

- múltiplos itens e preço fixo/per-pound;
- quantidade zero/null tratada corretamente;
- concorrência e retry;
- total ainda indisponível não vira zero;
- W1B e atribuição preservados.

Harness obrigatório do cutover:

- usar `/api/system/w1c-a-smoke`, Owner-only, same-origin e submission-bound;
- o probe interno não é um pedido QA mutável: ele cria uma fixture opaca não comercial, chama o RPC real duas
  vezes, valida uma escrita + um retry, um único `order_weighed` e remove tudo antes do commit;
- exigir `residue_count=0`; nunca usar cliente ou pedido real para provar o release;
- seguir integralmente
  `docs/runbooks/A7-ORLANDO-OS-W1C-A-CUTOVER-RUNBOOK-2026-08-31.md`.

### Onda 2A — W1C-B1: invoice versionada e revisada

Antes de publicar o candidato local, confirmar com o Owner:

- manter `tip_amount=0` (recomendado para o MVP);
- correção/cancelamento de invoice: Owner-only, append-only, com motivo; invoice paga nunca é silenciosamente editada.

Entregar:

- invoice header/linhas versionadas derivadas de itens confirmados;
- mínimo e ajustes governados visíveis;
- revisão humana antes da emissão;
- correção cria nova versão e preserva as anteriores;
- invoice paga, parcialmente reembolsada ou reembolsada permanece imutável;
- nenhum Stripe call, Payment Link, pagamento, entrega ou WhatsApp nesta fatia.

W1C-B1 já existe como candidato local, mas depende de W1C-A aceito em Production e deve possuir migration, artefato,
smoke e rollback próprios.

### Onda 2B — W1C-B2: Payment Link vigente e pagamento reconciliado

Antes de implementar, obter aprovação explícita dos quatro policy gates da Story A7-024:

- somente Owner emite, desativa ou substitui Payment Link;
- tip permanece indisponível e exatamente zero;
- substituir invoice não paga desativa o link antigo antes de criar o novo;
- invoice paga, parcialmente reembolsada ou reembolsada é imutável e correção financeira usa refund governado.

Entregar:

- um Payment Link vigente por versão pagável;
- integração com backend Stripe existente, sem caminho financeiro paralelo;
- webhook assinado/idempotente reconciliando o mesmo `order_id`;
- estados pending/invoice_created/paid/failed/void/refund sem mistura;
- tip separada e desabilitada enquanto o contrato exigir zero;
- timeline e próxima ação financeira atualizadas;
- nenhum envio WhatsApp automático e nenhuma entrega nesta fatia.

Nenhum teste live cobra automaticamente. O Payment Link live só pode ser apresentado após todos os gates
pré-pagamento e GO específico.

### Onda 2C — W1C-B3: entrega e Bell Desk

Antes de implementar, o Owner deve aprovar a regra de conclusão no Bell Desk. Depois entregar:

- pronta/entrega respeitando pagamento confirmado;
- saída para entrega e custódia coerentes;
- entrega direta concluída somente por confirmação operacional explícita;
- Bell Desk permanece estado intermediário ou final conforme a regra aprovada, nunca por inferência;
- um `delivery_job_id` opaco e controlado pelo servidor acompanha todas as transições e o evento final;
- timeline, ator, horário, motivo quando necessário e idempotência;
- nenhuma otimização de rota nesta fatia.

### Onda 3A — W2-A: rascunho operacional revisado, sem envio por API

Primeiro audite Story A7-014, Bridge atual, Cloud API, Coexistence, número real e políticas Meta.

Entregar primeiro a fatia que independe da Meta:

- templates determinísticos EN/PT/ES derivados somente do estado real do pedido;
- preview humano, aprovação explícita e congelamento do texto aprovado;
- copiar o texto aprovado para a conversa existente no WhatsApp Business;
- draft, approval e copy acknowledgement append-only e idempotentes;
- nenhuma chamada à Meta, nenhuma automação de WhatsApp Web e nenhuma alegação de envio pelo sistema;
- QA, pedido cancelado ou estado incompatível falham fechados;
- fallback manual permanece o canal real enquanto Coexistence não estiver provado.

W2-A já existe como candidato local e deve ser publicado somente por artefato isolado, migration exata, smoke Owner e
rollback próprios. Não o misture com W1C ou com ativação do canal.

### Onda 3B — W2-B: envio oficial e recibos, ainda sem IA autônoma

Antes de implementar ou publicar W2-B:

1. decidir formalmente entre uma estrutura realmente separada de provider/client e um parceiro listado pela Meta
   que suporte Coexistence do número Business App existente;
2. concluir o onboarding do número público `+1 407-670-8839` exclusivamente por Coexistence;
3. provar que o WhatsApp Business do celular continua enviando e recebendo;
4. provar ida/volta Cloud API com destinatário QA consentido e recibos correlacionados;
5. manter migração clássica do número e automação de WhatsApp Web proibidas.

Somente então entregar o envio humano aprovado de atualizações do pedido, estritamente vinculado ao rascunho W2-A:

- confirmação do pedido/coleta;
- motorista a caminho;
- coleta realizada;
- recebido na lavanderia;
- peso/valor pronto para revisão;
- invoice/Payment Link enviado;
- pagamento confirmado;
- pedido pronto;
- saída para entrega/ETA;
- entregue ou deixado no Bell Desk.

Regras de envio:

- operador visualiza exatamente destinatário, idioma, template/texto e pedido;
- botão `Revisar e enviar`; nunca autoenvio no MVP;
- nenhuma mensagem de marketing, campanha ou upsell automático;
- mensagem nasce do estado server-side, mas o estado nunca nasce da mensagem;
- idempotência impede duplicação de envio;
- status provider/message ID ficam protegidos e auditáveis;
- erro de envio não altera pedido nem produz sucesso falso;
- QA usa número/test mode aprovado; nunca cliente real;
- o primeiro envio para cliente real exige GO explícito no momento da ação.

### Onda 3C — W2-C: entrada assistida, ainda sem autonomia

Depois que W2-B estiver estável:

- entregar uma inbox operacional simples com conversas/não lidas, histórico e mídia protegidos;
- expor saúde sanitizada do canal e preservar a operação manual quando o canal falhar;
- resolver contato, conversa e lead de forma idempotente;
- vincular conversa inbound a cliente/lead/pedido apenas por identidade determinística;
- preservar `A7 Ref`, CTWA referral e origem sem colocar PII em analytics ou URL;
- mostrar mensagem/mídia no contexto privado necessário;
- permitir prefill revisável do atendimento;
- nunca criar pedido, preço, promessa ou confirmação a partir da mensagem sem ação humana.

Seguir a Story A7-028. W2-C não contém IA e não autoriza inferência por nome, hotel, valor, horário ou conteúdo
parecido. A indisponibilidade do canal preserva o atendimento manual.

### Onda 4 — W2-D: IA copiloto

Antes de habilitar PII, obter decisão do Owner sobre:

- provedor/modelo;
- região, retenção, treinamento, redaction, logs e exclusão;
- campos mínimos permitidos;
- fallback manual.

IA pode:

- detectar idioma, traduzir, resumir e extrair fatos explícitos;
- apontar ausências/contradições;
- consultar catálogo oficial;
- preparar orçamento preliminar, perguntas e mensagens;
- preencher formulário sem confirmar.

IA não pode:

- enviar mensagem;
- inventar ou prometer;
- aceitar/cancelar pedido;
- aplicar desconto;
- confirmar peso/valor final;
- gerar cobrança, reembolso ou entrega;
- modificar lifecycle, custódia, produção ou financeiro.

Todo rascunho exibe fontes/fatos usados, campos ausentes e botão humano de aprovação. Indisponibilidade da IA não
bloqueia a operação.

Seguir a Story A7-029. Nenhum dado operacional ou PII pode ser enviado ao provedor antes da aprovação documentada
de modelo, região, retenção, treinamento, redaction, logs, exclusão, matriz de campos e fallback.

### Onda 5A — W3-A: reutilizar cliente conhecido

Entregar somente o fluxo já aprovado na Story A7-022:

- selecionar cliente real em Clientes Lite;
- resolver `customer_ref` opaco no servidor;
- reutilizar identidade confirmada sem redigitar nome/WhatsApp;
- revisar os fatos operacionais do novo atendimento;
- preservar `customer_id` e criar novos `lead_id`/`order_id`;
- retry idempotente e QA/cancelled-only fail closed;
- nenhuma edição, merge, ticket/LTV, marketing ou automação WhatsApp.

W3-A já existe como candidato local e requer seu próprio gate de Production.

### Onda 5B — W3-B: fatos básicos de recorrência e valor

Somente depois que a verdade financeira W1C-B estiver publicada e comprovada, derivar em leitura:

- quantidade de pedidos reais e pedidos pagos;
- cliente novo/repetido por histórico durável;
- receita líquida confirmada;
- reembolso separado da receita líquida;
- ticket médio confirmado ou null quando indisponível;
- primeira/última compra paga e pedido concluído mais recente;
- origem inicial e confiança da atribuição;
- QA, cancelado, não pago e tip excluídos conforme contrato.

Não persistir score/LTV estimado e não criar gráficos obrigatórios.

Seguir a Story A7-026. Antes de implementar, o Owner deve aprovar a fórmula do ticket médio líquido, a definição de
pedido reembolsado e a semântica de `null` versus zero confirmado. W3-B permanece read-only e não envia WhatsApp,
não edita cliente e não cria CRM de marketing.

### Onda 5C — W3-C: conflitos e reconciliação Owner-only

Antes de reconciliação/merge, aprovar regra específica. Default seguro: não fundir automaticamente; preservar IDs e
mostrar conflito. Stripe pode complementar, nunca sobrescrever silenciosamente.

Se autorizado, entregar inbox de conflitos, preview dos registros afetados, atualização/merge transacional,
alias/tombstone e ledger append-only. Snapshot de atribuição, pagamentos, mensagens e histórico nunca são reescritos.

Não implementar campanhas, tags de marketing, loyalty, scoring, exportação em massa ou disparos.

Seguir a Story A7-030. Nenhum match por nome, hotel, valor, horário ou similaridade autoriza merge. A regra de
reconciliação precisa ser aprovada pelo Owner antes de qualquer implementação.

### Onda 6 — W3-D: rotas simples

Após aprovação dos motoristas iniciais e da regra Bell Desk, entregar:

- selecionar motorista;
- criar rota/paradas;
- ordenar manualmente;
- marcar saída, coleta, entrega e Bell Desk;
- ETA opcional;
- transições coordenadas de custódia;
- histórico/ator/idempotência;
- mobile-first.

Não implementar mapa avançado, GPS, otimização ou dispatch engine.

Seguir a Story A7-031. A rota organiza trabalho humano; ela não se torna autoridade financeira, não conclui entrega
fora do contrato W1C-B3 e não envia WhatsApp automaticamente.

### Onda 7 — W4: estabilização e um dia real controlado

Executar um dia real controlado de ponta a ponta:

WhatsApp/venda
→ cliente/lead/pedido
→ coleta/custódia
→ peso por item
→ produção
→ invoice revisada
→ Payment Link
→ pagamento reconciliado
→ entrega
→ cliente/receita/atribuição atualizados
→ Hoje correto

O teste exige plano, responsáveis, dados reais mínimos, rollback e GO específico para cada mensagem/pagamento.
Não use memória, planilha ou WhatsApp como verdade paralela para compensar lacuna do sistema.

Seguir a Story A7-032. W4 não adiciona código, schema, integração ou comportamento: ele prova o artefato integrado
com um pedido legítimo e participante consentido. Qualquer lacuna funcional descoberta interrompe o piloto e vira
uma story corretiva separada; nunca é construída durante o dia controlado.

Depois do piloto:

- corrigir falhas observadas;
- repetir regressões e QA visual;
- documentar operação e incidente/rollback;
- produzir runbook diário curto para Owner/Operator;
- recomendar GO/NO-GO para uso normal;
- não iniciar expansão funcional nova.

## 8. Interface mínima obrigatória

Navegação principal:

/sistema
├── Hoje
├── Atendimento
├── Pedidos
├── Clientes
└── Rotas

Cada tela deve responder uma pergunta operacional:

- Hoje: o que exige ação agora?
- Atendimento: o que falta confirmar?
- Pedidos: onde está e qual a próxima ação?
- Clientes: quem é e qual o histórico verdadeiro?
- Rotas: quem leva e qual a sequência?

Regras:

- mobile-first 390 px e desktop;
- sem UUID/IDs técnicos;
- sem gráficos no Hoje;
- uma ação principal evidente;
- estados Lifecycle, Custódia, Produção e Financeiro separados;
- indisponível/null não vira zero;
- falha fica visível;
- nenhum dado do cliente em query string pública.

## 9. Gates obrigatórios por onda

### Código e contrato

- `npm run lint`;
- `npm run typecheck`;
- testes focados;
- `npm test`;
- `npm run build`;
- `git diff --check`;
- file list e checklist da story atualizados;
- cobertura explícita de idempotência, concorrência, null, QA e autorização.

### Banco

- schema atual auditado;
- migration aditiva mínima;
- histórico não reescrito;
- invariantes/constraints/índices/RLS/grants revisados;
- dry-run oficial mostra apenas migrations esperadas;
- ledger local/remoto antes e depois;
- rollback documentado e testado quando possível;
- unknown permanece unknown quando não há derivação segura.

### Segurança e privacidade

- Owner-only até GO separado para Operator;
- 401 sem sessão e 403 para papel não autorizado;
- cookies `HttpOnly`, `Secure`, `SameSite=Strict`;
- same-origin e método correto;
- rate limit onde o risco exigir;
- nenhum secret value no bundle/output;
- nenhuma PII em URL, analytics, logs, metadata externa ou evidência;
- exportação de secrets não é método de smoke;
- artefato isolado comparado ao release-base.

### UI e operação

- QA em 390 px e desktop;
- sem overflow e sem conteúdo atrás do login;
- teclado/foco/labels básicos;
- estados vazio, parcial, erro, carregando e sucesso;
- próximo passo evidente;
- cards/fila ordenados deterministicamente;
- Owner consegue entender Hoje em aproximadamente vinte segundos.

### Compatibilidade

Verificar que permanecem íntegros:

- homepage e aquisição;
- `/order`;
- atribuição e snapshot congelado;
- MCO, Pickup Order e busca direta;
- Clientes já publicados;
- Stripe, webhook e Payment Link existentes;
- WhatsApp manual/Bridge;
- GA4 server-side;
- Google Ads e Meta sem alteração não autorizada;
- QA excluído de métricas/receita/ações reais.

### Release

- baseline de Production e rollback ID registrados;
- artefato isolado/prebuilt, não worktree amplo;
- sem Staging separado neste piloto: candidato exato validado localmente e cutover direto somente após GO específico;
- nunca conectar Preview, branch ou projeto de outro sistema a credenciais de escrita do Supabase Orlando;
- gate final GO/NO-GO antes de mutação;
- smoke público e autenticado após deploy;
- rollback imediato em falha ou evidência ausente;
- observação pós-release;
- audit redigido sem secrets/PII.

## 10. Relatório de progresso e comportamento persistente

Mantenha um plano curto e atualizado. Trabalhe continuamente até o objetivo final, mas não atravesse gates que
exigem decisão humana.

Não pare apenas porque uma onda ficou localmente pronta. Pare somente quando:

- precisa de GO para Production/ação externa;
- precisa de decisão de produto realmente bloqueante;
- precisa que o usuário faça login, CAPTCHA, pagamento ou confirmação sensível;
- um rollback foi executado e é necessário restabelecer evidência segura.

Quando bloqueado, informe exatamente:

- o que está pronto;
- qual evidência falta;
- por que não é seguro inferir;
- a única ação curta que o Owner precisa executar.

Não faça perguntas que possam ser respondidas pelo repositório ou por auditoria somente leitura.

## 11. Definition of Done final

Não declare o goal completo até provar, requisito por requisito:

1. W1B live com smoke Owner;
2. Hoje/filas/detalhe/next action/custódia/produção/SLA funcionais;
3. peso real correto por item;
4. invoice versionada e revisada;
5. Payment Link corresponde à invoice vigente;
6. Stripe reconcilia exatamente uma vez e preserva atribuição;
7. entrega e Bell Desk seguem regra aprovada;
8. WhatsApp recebe e permite enviar atualizações operacionais revisadas por humano;
9. IA, se habilitada, atua somente como copiloto e falha aberta para operação manual;
10. Clientes mostra histórico, receita confirmada e origem sem merge destrutivo;
11. Rotas simples funcionam sem GPS/otimização;
12. QA, PII, secrets, autorização, idempotência e concorrência passam;
13. 390 px e desktop passam;
14. regressões de `/order`, Stripe, atribuição, GA4, WhatsApp e Ads passam;
15. um dia real controlado é concluído e documentado;
16. runbook diário e rollback estão prontos;
17. Owner consegue operar sem planilha paralela e entender Hoje em cerca de vinte segundos.

Entrega final obrigatória:

- URL e deployment atual;
- migrations aplicadas;
- ondas/stories concluídas;
- telas e fluxos entregues;
- mensagens WhatsApp habilitadas e limites;
- decisões humanas registradas;
- testes e QA;
- segurança/privacidade;
- regressões;
- rollback;
- limitações conhecidas;
- recomendação GO/NO-GO para operação normal.

Não marque complete com evidência parcial. Não transforme o sistema em algo maior que a operação real da A7.
```

---

## Observação de governança

A declaração do Owner orienta autonomia para trabalho seguro. Ela não serve como credencial, assinatura digital nem
consentimento antecipado para transmitir PII, enviar mensagens reais, movimentar dinheiro ou executar ações
destrutivas. Esses pontos permanecem sujeitos ao gate explícito descrito no prompt.
