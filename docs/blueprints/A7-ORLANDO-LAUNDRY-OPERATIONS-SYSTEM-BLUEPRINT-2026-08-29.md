# A7 Orlando — Blueprint do Sistema Operacional da Lavanderia

**Versão:** 0.4 — implantação incremental após o primeiro release útil

**Data:** 2026-08-29

**Atualizado:** 2026-08-30

**URL proposta:** `https://a7laundry.com/sistema`

**Escopo:** A7 Laundry Orlando; atendimento, orçamento, pedido, custódia, produção, cobrança, cliente e entrega

**Status:** `IMPLEMENTED THROUGH W1A.1 / LATER WAVES GATED`

**Story:** `docs/stories/a7-015-orlando-laundry-operations-system.md`

## 1. Decisão executiva

A7 precisa de um sistema operacional pequeno para executar um dia real de lavanderia, não de um
CRM genérico, ERP, SaaS multiempresa ou dashboard analítico.

O centro do sistema é o **pedido**:

```text
Cliente
→ Atendimento
→ Orçamento
→ Pedido
→ Coleta
→ Custódia
→ Processamento
→ Cobrança
→ Entrega
```

WhatsApp, IA, Stripe, atribuição e analytics são capacidades conectadas ao pedido. Nenhuma delas
substitui a verdade operacional. No primeiro release, WhatsApp continua sendo o canal externo e
`/sistema` passa a ser a verdade operacional; integração automática do canal e IA entram depois.

> **IA prepara. Humano confirma compromissos. O sistema registra, calcula, conecta e automatiza.**

O MVP estará validado somente quando a A7 conseguir operar um dia real inteiro nele e o owner
entender a situação completa em aproximadamente vinte segundos.

## 2. Requisitos e limites

| ID | Requisito | Origem |
|---|---|---|
| FR-01 | `/sistema` abre em `Hoje` e mostra o trabalho que exige ação. | Diretriz V0.2 §§2–3 |
| FR-02 | No primeiro release, o operador registra uma venda recebida fora do sistema e somente a confirmação humana cria cliente/lead/pedido. | Revisão operacional V0.3 |
| FR-03 | Na integração posterior, mensagem inbound válida cria lead e IA prepara contexto sem assumir compromisso. | Revisão operacional V0.3 |
| FR-04 | Pedido suporta múltiplos itens e preços por libra, unidade ou revisão manual. | Diretriz V0.2 §7 |
| FR-05 | Custódia/localização da roupa é explícita, auditável e sempre visível. | Diretriz V0.2 §6 |
| FR-06 | Express possui prazo e indicador determinístico de risco. | Diretriz V0.2 §8 |
| FR-07 | Invoice pertence ao pedido, soma seus itens e gera um Payment Link único e correto. | Diretriz V0.2 §10 |
| FR-08 | Cliente preserva histórico e valor sem se transformar em CRM de marketing. | Diretriz V0.2 §9 |
| FR-09 | Rotas oferecem motorista e sequência manual, sem otimização ou GPS. | Diretriz V0.2 §11 |
| FR-10 | Cada pedido apresenta uma próxima ação evidente. | Diretriz V0.2 §12 |
| NFR-01 | Interface mobile-first, aprendida em minutos e sem IDs técnicos. | Blueprint V0.1 §§2 e 4 |
| NFR-02 | Escritas são server-side, autorizadas, auditáveis e idempotentes. | Contrato de atribuição §§5–9 |
| NFR-03 | PII e segredos não entram em URLs, GA4, `dataLayer`, Stripe metadata ou logs. | Contrato de atribuição §9 |
| NFR-04 | Falhas ficam visíveis e não produzem sucesso falso ou duplicação. | Blueprint V0.1 §4 |
| CON-01 | Cada mutação remota exige story, gates, rollback e autorização própria; o blueprint não concede autorização implícita. | Diretriz V0.4 |
| CON-02 | CLI/serviços e observabilidade precedem controles de UI. | Constituição AIOS |

Regra contra expansão:

> Se a função não reduz trabalho, erro ou tempo que a A7 possui hoje, ela não entra no MVP.

## 3. Experiência completa

### 3.1 Fluxo do cliente

```text
Cliente encontra a A7
→ chama no WhatsApp
→ recebe resposta/orçamento revisado por humano
→ confirma o serviço
→ recebe confirmação da coleta
→ recebe atualizações úteis
→ recebe a cobrança correta
→ paga no Stripe
→ recebe confirmação e entrega
```

O cliente não cria conta, não entra em `/sistema` e não precisa aprender um aplicativo.

### 3.2 Fluxo do operador — primeiro release

```text
/sistema
→ Login
→ Atendimento
→ Novo atendimento
→ Cliente
→ Confirmar venda e criar pedido
→ Hoje
→ Próxima ação
```

O caminho começa depois que a venda foi aceita pelo WhatsApp Business normal:

```text
Cliente aceita pelo WhatsApp Business normal
→ operador abre Atendimento
→ clica Novo atendimento
→ registra somente os dados já combinados
→ confirma a venda
→ sistema resolve cliente e lead
→ operador clica Confirmar venda e criar pedido
→ sistema gera order_id e número humano
→ pedido entra na fila Hoje
→ coleta, custódia, peso, produção, invoice, pagamento e entrega avançam
→ cliente e atribuição são atualizados
```

O primeiro release não replica conversas, histórico ou inbox do WhatsApp. Ele registra uma venda
recebida fora do sistema. Na W2, WhatsApp passa também a ser entrada automática e o mesmo serviço
de criação do pedido recebe os dados organizados pelo canal e pela IA.

O operador nunca informa UUID, `lead_id`, `order_id`, `customer_id`, `attribution_id` ou chave de
idempotência.

## 4. Navegação do MVP

```text
/sistema
├── Hoje
├── Atendimento
├── Pedidos
├── Clientes
└── Rotas
```

Conta, usuários, saída e saúde das integrações ficam em área secundária.

Não haverá menus principais separados para leads, invoices, Stripe, campanhas, analytics,
integrações, IA, serviços ou webhooks. Essas informações aparecem em contexto.

## 5. Hoje — home operacional

### 5.1 Objetivo

Responder imediatamente: **o que precisa ser feito agora?**

```text
HOJE

Esperando confirmação      3
Coletas                    5
Com motorista              2
Na lavanderia              4
Para pesar                 2
Para cobrar                1
Aguardando pagamento       2
Prontos                    3
Entregas                   4
Express em atenção         1
```

Cada bloco abre a fila correspondente. Não há gráficos no MVP.

### 5.2 Ordenação

As filas priorizam, de forma determinística:

1. Express em risco;
2. item atrasado;
3. próxima janela ou prazo;
4. item mais antigo aguardando ação.

Os limiares de `OK`, `Atenção` e `Risco` são configuração operacional governada. Não serão
inventados pela interface nem estimados por IA.

### 5.3 Mini gestão do owner

Em bloco discreto:

- hoje: receita confirmada, pedidos, ticket médio, clientes novos/repetidos, pagamentos pendentes,
  Express ativos e concluídos;
- 30 dias: receita confirmada, pedidos, clientes, ticket médio, repetição e receita por origem.

Métricas mostram período, timezone, fonte, atualização e indisponibilidade. Ausência de dado nunca
vira zero por inferência.

## 6. Atendimento manual e evolução integrada

### 6.1 Primeiro release: registrar venda externa

`Atendimento` abre uma lista curta do que está esperando confirmação e oferece `Novo atendimento`.
O operador não transcreve a conversa: registra apenas os fatos necessários para nascer um pedido:

- cliente: nome, WhatsApp e idioma;
- local: Hotel, Airbnb ou Residence; hotel/propriedade e quarto quando houver;
- serviço: Normal ou Express, janela de coleta e `needed_by`;
- pedido: Wash & Fold ou item especial, peso estimado opcional e observações operacionais.

Preço-base, mínimo e regras aplicáveis vêm do catálogo governado. O operador não os digita
manualmente. A ação final é `Confirmar venda e criar pedido`.

### 6.2 W2: inbox e entrada automática

Depois do primeiro release, Atendimento reúne conversas, não lidas, histórico, mídia, idioma, tipo
de cliente, hotel/propriedade, origem resumida, `A7 Ref`, resumo da IA, lacunas, rascunho de
resposta/orçamento e o botão `Criar pedido`.

### 6.3 Lead automático

Uma primeira mensagem inbound válida cria ou resolve de forma idempotente:

- `conversation_id`;
- contato protegido;
- `lead_id`;
- atribuição determinística, parcial ou não atribuída.

Isso significa atendimento iniciado, não venda.

### 6.4 Copiloto de orçamento

```text
Mensagem recebida
→ extrair fatos explícitos
→ identificar campos ausentes ou contraditórios
→ consultar catálogo, preços, mínimo e regras governadas
→ produzir resumo, perguntas faltantes e orçamento preliminar
→ operador revisa
→ operador envia
```

Estimativas permanecem identificadas como estimativas. Peso e valor finais dependem do processo
real e da revisão humana.

### 6.5 IA pode

- detectar idioma, traduzir e resumir;
- extrair nome, hotel/propriedade, quarto, prazo, serviço, itens e bags informados;
- identificar informações faltantes;
- consultar serviços e preços oficiais;
- calcular orçamento preliminar e mínimo;
- sugerir perguntas e respostas;
- preencher o formulário do pedido;
- preparar mensagens operacionais conforme o estado.

### 6.6 IA não pode

- inventar serviço, preço, peso ou dado do cliente;
- prometer disponibilidade, Express, prazo ou horário;
- aplicar desconto;
- aceitar ou cancelar pedido;
- confirmar valor final;
- gerar ou enviar cobrança sem ação humana;
- reembolsar ou marcar entregue.

O sistema continua operável se a IA estiver indisponível. O operador pode preencher e responder
manualmente; a falha da IA nunca bloqueia WhatsApp ou altera estado operacional.

### 6.7 Mensagens contextuais

O sistema pode preparar, no idioma do cliente, coleta confirmada, motorista a caminho, coleta
realizada, roupa pesada/pronta, invoice enviada, pagamento confirmado, ETA e entrega realizada ou
deixada no Bell Desk. O operador revisa e envia.

## 7. Lead, cliente e criação do pedido

### 7.1 Fronteira comercial

```text
Primeiro release: venda externa revisada → operador confirma → Cliente + Lead + Pedido
W2: Conversation → Lead automático → operador confirma → Pedido
```

`Criar pedido` é a única fronteira que gera `order_accepted`.

### 7.2 Formulário curto

No primeiro release, recebe os fatos mínimos da venda externa. Na W2, reaproveita a conversa e
mostra somente o que precisa de confirmação:

- cliente, tipo e idioma;
- local e instruções protegidas de coleta/entrega;
- janela de coleta e `needed_by`;
- Normal ou Express;
- bags/peso estimados quando informados;
- itens/serviços;
- base comercial e mínimo aplicável, sempre carregados pelo sistema e não digitados pelo operador.

### 7.3 Confirmação idempotente

Uma ação server-side:

1. resolve/cria cliente e lead;
2. valida itens contra o catálogo governado;
3. resolve a atribuição;
4. registra qualificação;
5. aceita o pedido;
6. gera `order_id` opaco e número humano como `A7-ORL-1042`;
7. congela a atribuição;
8. cria itens iniciais e o estado inicial de coleta/pickup;
9. retorna a próxima ação.

Retry com a mesma chave não duplica lead, pedido ou itens.

## 8. Modelo do pedido

### 8.1 Agregado central

```text
Order
├── Customer
├── Lead / Conversation
├── Attribution snapshot
├── Order Items
├── Operational timeline
├── Custody timeline
├── Production state
├── Invoice
├── Payment
└── Route stops
```

### 8.2 Múltiplos itens

```text
Wash & Fold Express — 25.7 lb
King Comforter — 1 unidade
Custom Care — 2 peças
```

Cada item mantém no mínimo:

| Campo | Regra |
|---|---|
| `order_item_id` | ID opaco e estável |
| `order_id` | Pedido proprietário |
| `service_type` | Serviço do catálogo governado |
| `quantity` | Null até conhecida; maior que zero quando confirmada |
| `unit` | Unidade governada, como `lb`, `unit` ou `piece` |
| `unit_price` | Snapshot aprovado; null enquanto pendente |
| `subtotal` | Derivado e confirmado no servidor |
| `notes` | Observação operacional protegida |
| `requires_manual_review` | Verdadeiro para exceção/preço não padronizado |
| `weighed_at` | Obrigatório junto ao peso real de item por libra |

Peso real pertence ao item por libra. A soma dos itens confirmados alimenta a invoice. Serviço de
preço fixo não exige pesagem.

O evento contratual `order_weighed` só é emitido quando todos os itens que exigem peso possuem peso
real confirmado. Isso preserva o evento existente sem fingir que o peso agregado ainda é a fonte de
verdade.

### 8.3 Próxima ação

```text
A7-ORL-1042
Status: Coletado
Custódia: Na lavanderia

Próxima ação: REGISTRAR PESO
```

Ações incompatíveis ficam indisponíveis. Cancelamento/correções ficam em menu secundário, exigem
motivo e acrescentam histórico.

## 9. Estados sem mistura de responsabilidades

A V0.3 não coloca tudo em um único `order_status`.

### 9.1 Lifecycle contratual

```text
accepted → pickup_scheduled → picked_up → weighed
→ invoice_created → ready_for_delivery → delivered
```

`cancelled` continua terminal conforme contrato.

### 9.2 Custódia

```text
with_customer
→ awaiting_pickup
→ with_driver_pickup
→ at_laundry
→ with_driver_delivery
→ bell_desk
→ delivered
```

### 9.3 Produção

```text
awaiting_intake → awaiting_weight → awaiting_processing → processing → ready
```

A interface combina custódia e produção para exibir: `Com o cliente`, `Aguardando coleta`, `Com
motorista`, `Na lavanderia`, `Em processamento`, `Pronto`, `Com motorista para entrega`, `Na
recepção / Bell Desk` e `Entregue`.

### 9.4 Financeiro

```text
pending → invoice_created → paid
                         ├→ failed
                         └→ void
paid → partially_refunded → refunded
```

### 9.5 Transições coordenadas

| Ação | Lifecycle | Custódia | Produção |
|---|---|---|---|
| Agendar coleta | `pickup_scheduled` | `awaiting_pickup` | — |
| Motorista coletou | `picked_up` | `with_driver_pickup` | `awaiting_intake` |
| Receber na lavanderia | — | `at_laundry` | `awaiting_weight` |
| Registrar peso | `weighed` quando completo | `at_laundry` | `awaiting_processing` |
| Iniciar processamento | — | `at_laundry` | `processing` |
| Marcar pronto | `ready_for_delivery` somente se pago | `at_laundry` | `ready` |
| Sair para entrega | — | `with_driver_delivery` | `ready` |
| Deixar no Bell Desk | — | `bell_desk` | `ready` |
| Concluir entrega | `delivered` | `delivered` | `ready` |

As regras preservam pagamento antes de `ready_for_delivery`. Qualquer mudança exige revisão do
contrato, não apenas da interface.

## 10. Express como SLA visível

Express exige:

- `promised_by` aprovado pelo operador;
- relógio regressivo baseado no servidor;
- estado determinístico `OK`, `Atenção`, `Risco` ou `Atrasado`;
- destaque em `Hoje`, pedido e rota;
- histórico de correção do prazo com motivo e operador.

Não haverá previsão por IA. Os limiares precisam de definição operacional antes da W1.

## 11. Pedidos

Filas:

```text
[Novos] [Coletas hoje] [Na lavanderia] [Pesar]
[Processando] [Cobrar] [Aguardando pagamento] [Entregar]
```

Filtros mínimos: hoje, atrasados, Express, custódia, próxima ação, pagamento e busca por nome,
telefone protegido ou número do pedido.

Cartão operacional:

```text
A7-ORL-0231
Nadia Asher • Signia by Hilton • EXPRESS

Custódia: Com motorista
Produção: Pronto
Pagamento: Pago
Prazo: 32 min restantes

Próxima ação: ENTREGAR
```

O detalhe exibe cliente/local, itens, modalidade, janela/prazo, custódia/motorista, próxima ação,
timeline, invoice/pagamento e conversa relacionada.

## 12. Invoice, tip e Stripe

### 12.1 Cálculo

```text
Order Items confirmados
→ cálculo server-side
→ mínimo/ajuste governado
→ revisão humana
→ Invoice imutável/versionada
→ Payment Link do pedido
```

Cada linha da invoice é snapshot do item/preço aprovado. Correção cria nova versão ou evento de
ajuste; não reescreve silenciosamente cobrança emitida.

### 12.2 Tip

Tip permanece separada de `service_amount` e não compõe receita elegível de serviço para anúncios.

O contrato/backend atuais exigem `tip_amount=0`. Tip é requisito potencial da W3, mas só pode ser
habilitada após revisão explícita do contrato financeiro, cálculo, reembolso, reporting e Payment
Link. Até essa revisão, a interface não oferece tip.

### 12.3 Payment Link

O backend existente continua sendo a única autoridade e valida pedido, invoice vigente, valor exato,
IDs opacos e idempotência. O navegador nunca recebe segredos. O webhook assinado confirma
pagamento no mesmo pedido. Link manual/reutilizado fica fora do fluxo.

## 13. Clientes

Cada cliente mostra nome, WhatsApp, email quando disponível, idioma, tipo, hotel/propriedade,
histórico, quantidade de pedidos, receita confirmada, ticket médio, primeiro/último pedido e origem
inicial.

Um cliente possui vários pedidos; cada novo contato comercial cria lead e cada venda aceita cria
pedido, preservando `customer_id`.

WhatsApp/CRM é a autoridade inicial. Stripe pode complementar dados, mas não sobrescreve dado
confirmado, registra fonte/momento, normaliza antes de comparar e apresenta conflito para revisão.
Marketing, campanhas e loyalty não entram no MVP.

## 14. Rotas simples

```text
Motorista 1

1. Nadia — entregue
2. Adam — próximo
3. Jonathan — depois
```

Permite selecionar motorista, incluir paradas, ordenar manualmente, marcar saída/coleta/entrega,
informar ETA opcional e atualizar custódia por transição coordenada.

Não há otimização, mapa avançado, GPS ou dispatch engine.

## 15. Arquitetura e encaixe atual

```text
Browser autenticado em /sistema
        │
        ▼
API privada same-origin
        ├── leitura/fila
        ├── WhatsApp facade
        ├── IA copiloto
        ├── order application service
        ├── invoice/payment service
        └── customer/route service
              │
              ├── Supabase Orlando
              ├── WhatsApp Cloud API
              ├── provedor de IA aprovado
              ├── Stripe
              └── GA4 server-side
```

### 15.1 Preservado

| Componente | Situação |
|---|---|
| First/last touch, `A7 Ref` e snapshot imutável | Implementado |
| Leads, pedidos, eventos, pagamentos e outbox | Implementados |
| `customer_id` e repetição | Parcial via contatos WhatsApp |
| Lifecycle server-side e `order_id` | Implementados |
| W0/W1A, número `MCO` e Pickup Order | Implementados e verificados em Production |
| `/order` público | Implementado |
| Payment Link vinculado ao pedido | Implementado para invoice atual de valor único |
| Stripe webhook assinado/idempotente | Implementado |
| GA4 operacional server-side | Implementado |
| WhatsApp Bridge, histórico, mídia e envio | Técnico; número real depende do gate Coexistence |

### 15.2 Evoluções necessárias

| Área | Evolução |
|---|---|
| Leitura | Consultas privadas para `Hoje`, filas, detalhe, timeline e clientes |
| Pedido | Filas/detalhe, peso real e cálculo final por item; `order_number` e itens iniciais já existem |
| Operação | Custódia e produção como eixos/timelines separados |
| Express | `promised_by`, limiares governados e risco determinístico |
| Invoice | Header/linhas versionadas e total derivado dos itens |
| Cliente | Reconciliação, fontes e agregados básicos |
| Rotas | Motoristas, rotas/paradas e ordenação manual |
| Atendimento | Primeiro, registro de venda externa → cliente/lead/pedido; depois, ponte automática da conversa |
| IA | Adapter seguro, contexto mínimo e revisão humana |
| Auth | Sessão privada e Owner/Operator |

### 15.3 APIs conceituais

Devem existir primeiro como serviços/CLI testáveis; a UI apenas consome:

| Endpoint | Finalidade |
|---|---|
| `GET /api/system/today` | Filas e mini gestão |
| `POST /api/system/orders` | Confirma venda externa e cria cliente/lead/pedido pelo mesmo serviço transacional |
| `GET /api/system/inbox` | Conversas e não lidas |
| `GET /api/system/conversations/:id` | Histórico protegido |
| `POST /api/system/conversations/:id/draft` | Rascunho sem envio |
| `POST /api/system/conversations/:id/reply` | Envio humano aprovado |
| `POST /api/system/conversations/:id/create-order` | Pedido/itens idempotentes |
| `GET /api/system/orders` | Filas e busca |
| `GET /api/system/orders/:id` | Agregado e próxima ação |
| `POST /api/system/orders/:id/transition` | Transição validada |
| `POST /api/system/orders/:id/invoice` | Invoice derivada e revisada |
| `POST /api/system/orders/:id/payment-link` | Link da invoice vigente |
| `GET /api/system/customers` | Busca/resumo de clientes |
| `GET /api/system/customers/:id` | Histórico protegido |
| `GET /api/system/routes` | Rotas/paradas |
| `POST /api/system/routes/:id/reorder` | Sequência manual auditada |
| `GET /api/system/health` | Saúde sanitizada |

Não criar caminho paralelo para lifecycle, Stripe ou atribuição. As fachadas reutilizam as regras
existentes e acrescentam somente contratos aprovados.

### 15.4 `business_id`

O schema atual é single-business. Adicionar `business_id` agora afetaria tabelas, RPCs, índices,
RLS, eventos e testes ativos; não é mudança de baixo custo. Portanto, fica fora do MVP e só será
reavaliado depois de a A7 provar os objetos e fluxos.

## 16. Segurança, privacidade e acesso

Papéis do MVP:

| Papel | Escopo |
|---|---|
| Owner | Operação completa, usuários e exceções aprovadas |
| Operator | Atendimento, pedido, coleta, peso, invoice, rota e entrega conforme regras |

Reembolso não será automatizado.

Sessão: login privado; cookie `HttpOnly`, `Secure`, `SameSite=Strict`; expiração, logout, rate limit,
autorização server-side; `/sistema` fora do sitemap, `noindex`, sem cache público; tokens somente no
servidor.

Antes da W2, provedor/política de IA precisam aprovação para dados mínimos, retenção, treinamento,
redaction, logs, exclusão e falha. Conversa/PII não entra em GA4, `dataLayer`, URL, Stripe metadata
ou logs diagnósticos.

Toda mutação registra ator, horário UTC, entidade, estado anterior/novo, idempotência e motivo.

## 17. Ordem de entrega

### W0 — Fundação e gates

1. autenticação, sessão e papéis;
2. health sanitizado;
3. contratos de leitura/agregação;
4. gate real do WhatsApp quando aplicável;
5. fixtures, test data e rollback;
6. nenhum acesso a Production sem gate explícito.

### W1A — Primeiro release útil

1. `Atendimento` manual e `Novo atendimento`;
2. busca/criação de cliente;
3. preço-base e mínimo derivados do catálogo;
4. `Confirmar venda e criar pedido`;
5. criação atômica e idempotente de cliente, lead, pedido, número humano e itens iniciais;
6. atribuição anexada quando disponível, estado inicial de coleta e próxima ação.

W1A já é utilizável com o WhatsApp Business normal e não depende de Cloud API, Coexistence ou IA.

### W1B — Operação diária

1. `Hoje`;
2. lista e detalhe do pedido;
3. próxima ação;
4. custódia e produção;
5. filas e alerta Express.

### W1C — Conclusão operacional e financeira

Peso por item, invoice por linhas/versão, revisão humana, decisão de tip, Payment Link vigente,
webhook, status financeiro e entrega.

### W2 — WhatsApp integrado e IA copiloto

Inbox, histórico, mídia, lead automático, preenchimento assistido, adapter de IA, orçamento
preliminar e resposta revisada por humano. A integração reutiliza a criação de pedido da W1A.

### W3 — Clientes, rotas e refinamentos

Histórico/LTV básico, reconciliação, motoristas, rotas/paradas, sequência manual e custódia
coordenada.

### W4 — Estabilização

Pedidos reais controlados, correção de UX/estados, prova ponta a ponta, runbook e teste de um dia.

Cada onda exige story própria, Preview, gates, evidência redigida e autorização antes de Production.

### 17.1 Fatias de implantação após W1A.1

As ondas grandes são divididas em releases menores, utilizáveis e reversíveis:

| Release | Entrega | Escrita operacional? | Limite explícito |
|---|---|---:|---|
| W1A.2 | Busca por `1002`, `MCO 1002`, `MCO1002` ou `MCO-1002` | Não | Somente normalização de consulta; sem migration |
| W1A.3 | `Clientes Lite`: busca, detalhe, pedidos e prefill de novo atendimento | Não, até confirmar o pedido existente | Sem edição, merge, LTV, marketing ou reconciliação |
| W1B-A | `Hoje`, `Pedidos`, filas e detalhe somente leitura | Não | Sem mudar custódia, produção ou financeiro |
| W1B-B | Próxima ação, custódia e produção auditáveis | Sim | Sem peso, invoice, pagamento ou entrega financeira |
| W1B-C | Express: `promised_by`, alerta e ordenação determinística | Sim | Depende de limiares operacionais aprovados |
| W1C-A | Peso real por item e conclusão de pesagem | Sim | Sem criar invoice até revisão humana |
| W1C-B | Invoice versionada, Payment Link, pagamento e entrega | Sim/financeira | Tip permanece zero até contrato separado |
| W2 | WhatsApp integrado e IA copiloto | Sim, com revisão humana | Depende de Coexistence e política de IA |
| W3 | Reconciliação/LTV, motoristas e rotas simples | Sim | Sem CRM de marketing, otimização ou GPS |
| W4 | Um dia real controlado e estabilização | Sim | Nenhuma expansão funcional nova |

`Clientes Lite` antecipa apenas a consulta necessária para a equipe encontrar pessoas já cadastradas.
Histórico financeiro, LTV, merge/reconciliação e fontes conflitantes permanecem na W3.

## 18. Critérios de aceite definitivos

1. `/sistema` abre em `Hoje` e mostra as filas requeridas sem gráficos.
2. Operador registra uma venda externa sem replicar manualmente a conversa do WhatsApp.
3. `Confirmar venda e criar pedido` cria cliente/lead/pedido uma vez e preços vêm do sistema.
4. IA produz rascunho e não envia nem muda estado.
5. Operador cria um pedido único com IDs e atribuição congelada.
6. Pedido aceita múltiplos itens por libra e preço fixo.
7. Retry não duplica entidades, invoice, link ou evento.
8. Custódia/produção são auditáveis e separadas do financeiro.
9. Pedido mostra uma próxima ação válida.
10. Express mostra prazo e risco determinístico governado.
11. Peso real fica no item correto.
12. Invoice soma snapshots, mínimo e ajustes aprovados.
13. Tip permanece indisponível enquanto o contrato exigir zero.
14. Payment Link corresponde à invoice vigente.
15. Stripe confirma uma vez e preserva a origem.
16. Cliente mostra histórico/receita/origem sem sobrescrita silenciosa.
17. Rota aceita motorista/sequência manual e coordena custódia.
18. Mensagens são revisadas antes do envio.
19. Nenhuma PII ou segredo aparece fora da fronteira aprovada.
20. Falhas são visíveis e não criam sucesso falso.
21. Fluxo funciona em 390 px e desktop.
22. Gates de código, segurança e QA visual passam por onda.
23. Um dia real controlado executa o teste definitivo sem memória paralela.
24. Owner entende a operação em aproximadamente vinte segundos em `Hoje`.

## 19. Teste definitivo

W4 demonstra primeiro o caminho manual real e depois as integrações disponíveis: venda recebida no
WhatsApp Business normal; registro mínimo; cliente/lead/pedido idempotentes; coleta;
motorista/custódia; recebimento; peso por item; múltiplos itens; invoice e link corretos; pagamento;
roupa pronta; rota/entrega; cliente atualizado; receita atribuída; e `Hoje` correto. WhatsApp
integrado e IA são validados quando estiverem habilitados, mas não bloqueiam o primeiro uso diário.

O teste não autoriza antecipadamente cobrança, mensagem ou mutação de Production.

## 20. V0.1 → V0.3

| V0.1 | V0.3 |
|---|---|
| Atendimento como entrada | `Hoje` é home; pedido é o centro |
| Atendimento/Pedidos/Conta | Hoje/Atendimento/Pedidos/Clientes/Rotas |
| IA genérica | Copiloto explícito de orçamento e mensagens |
| Um peso/valor | `Order → Order Items`; peso/subtotal por item |
| Um eixo operacional | Lifecycle, custódia, produção e financeiro separados |
| Express como label | SLA com `promised_by` e risco determinístico |
| Cliente técnico | Histórico/LTV básico e reconciliação |
| Entrega sem sequência | Rota simples e ordenação manual |
| Invoice de valor único | Invoice versionada por linhas |
| Tip sem conflito explícito | Bloqueada enquanto o contrato exige zero |
| Quatro fases de UI | W0, W1A–W1C, W2–W4; primeiro release útil antes da automação |

Continuam válidos: confirmação humana, IDs opacos, atribuição congelada, servidor como autoridade,
falha visível, idempotência, PII protegida, mobile-first, WhatsApp/Stripe integrados e ausência de
portal do cliente.

## 21. Riscos e decisões bloqueantes

### 21.1 Riscos técnicos

| Risco | Tratamento |
|---|---|
| Um peso/valor por pedido hoje | W1A cria itens iniciais; W1C conclui peso e cobrança por item |
| Sem custódia/produção | Eixos/timelines separados sem quebrar eventos GA4 |
| Invoice em colunas do pedido | W1C cria header/linhas/versionamento compatível |
| Tip bloqueada | Manter zero até revisão financeira |
| Sem `order_number`, rotas ou motoristas | Contratos novos, idempotentes e auditados |
| Cliente parcialmente em contatos WhatsApp | Reconciliação sem merge destrutivo |
| WhatsApp real depende de Coexistence | W1A–W1C independentes; W2 depende do teste real |
| IA tratará PII | Aprovar provedor, retenção e minimização |
| Estados multidimensionais podem divergir | Transições atômicas e invariantes testadas |
| Schema Production sensível | Migrações aditivas, Preview, rollback e gates |

### 21.2 Decisões realmente bloqueantes

W0 não possui decisão de produto pendente além da autorização de sua story.

Antes de concluir W1A:

1. catálogo inicial de serviços, unidades, preços e mínimo;
2. atores iniciais Owner/Operator.

Antes de concluir W1B:

3. limiares `OK`, `Atenção` e `Risco` do Express;

Antes de concluir W1C:

4. decisão de tip e eventual revisão financeira;
5. autoridade/fluxo para corrigir ou cancelar invoice.

Antes de W2:

6. provedor/política de IA e gate real do WhatsApp.

Antes de W3:

7. regra de reconciliação de cliente;
8. motoristas iniciais e autoridade para reordenar;
9. definir se a entrega no Bell Desk encerra o pedido ou exige confirmação posterior.

São gates por onda, não motivo para atrasar W0.

## 22. Fora do MVP

- IA autônoma ou disparo comercial generalizado;
- portal/app/conta do cliente;
- CRM genérico, campanhas automáticas ou loyalty;
- marketplace, diretório ou portal de mão de obra;
- multi-company UI, SaaS billing ou `business_id` transversal;
- estoque, contabilidade, folha, ponto ou emissão fiscal;
- roteirização automática, GPS, mapa avançado ou dispatch engine;
- workflow builder, dezenas de permissões ou BI avançado;
- gestão de anúncios ou reembolso automático;
- serviço, preço ou promessa não validado.

## 23. Recomendação

**W0/W1A.1 concluídos em Production. GO CONDICIONAL para as fatias da §17.1**, com stories
separadas, CLI first, Preview, migrações aditivas quando necessárias, testes e autorização antes de
qualquer mutação remota ou Production.

Não há impedimento arquitetural conhecido para W0/W1A. Há evolução real de schema/APIs; portanto,
não é seguro tratar itens/custódia como campos cosméticos. W1B–W4 permanecem condicionadas aos
gates da §21.2 e às autorizações incrementais.

## 24. Referências internas

- `docs/blueprints/A7-ORLANDO-OPERATIONAL-ATTRIBUTION-CONTRACT-2026-08-28.md`
- `docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md`
- `docs/runbooks/whatsapp-orlando-cloud-api-bridge.md`
- `docs/runbooks/a7-orlando-operational-attribution-p0-release.md`
- `docs/stories/a7-003-conversion-observability.md`
- `docs/stories/a7-014-whatsapp-ai-agent.md`
- `lib/operational-lifecycle.js`
- `lib/operational-store.js`
- `api/operations/lifecycle.js`
- `api/create-payment-link.js`
- `api/stripe-webhook.js`
- `supabase/migrations/20260828020000_orlando_operational_attribution_p0.sql`
