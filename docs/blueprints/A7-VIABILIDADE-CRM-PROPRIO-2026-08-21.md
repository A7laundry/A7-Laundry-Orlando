# Vale a pena construir o nosso? — avaliação franca

**Data:** 2026-08-21
**Autor:** Claude Code
**Para:** Dennis (decisão) · Codex (segunda opinião)
**Complementa:** `docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md` (o *como*) — este documento é o *se* e o *quanto*
**Pedido original:** *"seja sincero"*

---

## 0. Correção antes de qualquer coisa

O blueprint de ontem abria dizendo **"9 de 19 leads sem resposta (47,4%)"**. Está errado.

`docs/DIRECIONAMENTO-AGOSTO-2026.md` (rev. 3, 2026-07-31) já havia reconciliado as 19 threads: **12 leads novos, 3 recompras, 4 contatos fora do funil**, com **3 a 4 falhas confirmadas em 12 = 25,0%–33,3%**. O 47,4% é número de uma versão retirada.

Já corrigi o blueprint em quatro pontos. Registro aqui porque muda a conta: o vazamento é **um terço menor** do que eu usei para justificar o projeto. A justificativa continua de pé, mas por um motivo diferente do que escrevi — ver §4.

---

## 1. Resposta curta

**Sim, dá para construir. Tecnicamente não é difícil, e o custo de rodar é irrisório.**

**Mas construir não é o gargalo — e o retorno direto é pequeno.** Se a decisão for "construir para recuperar leads perdidos", os números não sustentam. Se for "construir para saber se o negócio fecha a conta", aí sim se sustenta — e nesse caso já está no plano de agosto como item pendente.

O resto deste documento é a conta.

---

## 2. O escopo que você pediu é maior que o blueprint

Comparando o que você descreveu agora com o que está no blueprint:

| O que você pediu | No blueprint? | Observação |
|---|---|---|
| Alguém atendendo o cliente | Sim (C3) | Fase 1 |
| Tirar pedido | Sim (C2) | `order_record` |
| Dados do cliente no CRM | Sim (C2) | `contact` |
| Funil | Sim (C4) | Já mapeado nos KPIs |
| **Ordem de coleta** | **Não** | Documento operacional para quem dirige |
| **Invoice** | **Não** | Emissão de fatura, numeração, envio |
| **"Dispara para o sisteminha"** | **Não** | Não sei que sistema é esse — §9 Q1 |
| **LTV** | Parcialmente | Precisa de coorte, não de soma |

**As três lacunas não são detalhe.** Ordem de coleta e invoice são **operação**, não atendimento — mudam quem depende do sistema. Enquanto é só atendimento, se cair, você responde pelo celular. Quando a ordem de coleta vive lá dentro, o motorista para. É outra classe de compromisso.

E sobre LTV, uma armadilha que o próprio direcionamento de agosto já registra:

> *"Não usar essa reativação como LTV da coorte de agosto — os clientes que voltaram em julho foram adquiridos em 2025; medir recompra exige coorte."*

**LTV não é um campo que se calcula — é uma coorte que se espera.** O CRM pode começar a acumular o dado agora, mas o número só existe daqui a meses. Qualquer LTV entregue em 30 dias seria invenção.

---

## 3. Capacidade de investimento — a conta real

### 3.1 O que o negócio comporta hoje

De `docs/DIRECIONAMENTO-AGOSTO-2026.md` e `docs/audits/2026-07-30-audit-consolidado.md`:

| Indicador | Valor |
|---|---|
| Ticket médio | US$ 81,83 (base de 6 pedidos autorrelatados) |
| Mídia em agosto | US$ 30/dia ≈ **US$ 930/mês** |
| Contribuição a 50%, cenário 11,3 pedidos | **−US$ 437** |
| Contribuição a 50%, cenário 17 pedidos | **−US$ 204** |
| Margem necessária para empatar com 17 pedidos | 64,7% |
| **Custo variável por pedido** | **DESCONHECIDO** — gap de alta prioridade |

Conclusão do próprio documento, textual: *"agosto não tem como lucrar nos números conhecidos, e por isso deve ser tratado como mês de medição, não de retorno."*

**Traduzindo:** a A7 está gastando ~US$ 930/mês em mídia para perder entre US$ 204 e US$ 437 por mês. Não há folga para um projeto de infraestrutura caro. Qualquer proposta que custe mais do que a mídia mensal está fora de escala com o negócio.

### 3.2 Custo de rodar — a boa notícia

Dimensionei com a tabela de preços atual da API Anthropic.

Premissas: 40 conversas/mês (acima do observado, para folga), 15 trocas por conversa, system prompt de ~2.000 tokens com preços e regras (cacheado — leitura de cache custa ~10% do preço de entrada), histórico médio de ~2.000 tokens, resposta de ~150 tokens.

| Modelo | Preço in/out por 1M | Custo/conversa | **40 conversas/mês** | 400 conversas/mês |
|---|---|---:|---:|---:|
| Haiku 4.5 | $1 / $5 | ~$0,04 | **~$1,80** | ~$18 |
| Sonnet 5 | $3 / $15 | ~$0,13 | **~$5,20** | ~$52 |
| Opus 5 | $5 / $25 | ~$0,22 | **~$8,80** | ~$88 |

Somando a infraestrutura:

| Item | Mensal |
|---|---:|
| API Anthropic (Sonnet 5, 40 conversas) | ~US$ 5 |
| Supabase | US$ 0–25 (free tier provavelmente basta) |
| Vercel | US$ 0 incremental (já hospedado) |
| WhatsApp Cloud API | ~US$ 0 (janela FEP de 72h cobre leads de CTWA) |
| **Total de operação** | **US$ 5–30/mês** |

**Custo de rodar não é o problema.** É ~3% do que já se gasta em mídia. Mesmo a 10× o volume atual, cabe.

### 3.3 Custo de construir

O que **não** vai a mercado, porque já existe (levantado no blueprint §2.1): contrato de atribuição, geração e injeção do `A7 Ref`, `getByShortRef()`, adaptador Supabase, API de sessão, painel autenticado com PBKDF2, esqueleto do agente com webhook e Graph API. **Cerca de metade do caminho já está escrita.**

O que falta, em ordem de esforço:

| Bloco | Complexidade | Observação |
|---|---|---|
| Fase 0 — atribuição durável | Baixa | Trocar `shadow_ephemeral` por `durable_supabase` + migrations |
| Onboarding Meta (Coexistence) | **Alta em prazo, baixa em código** | Burocracia, verificação de negócio, Tech Provider/BSP. Semanas, não horas |
| Agente (9 defeitos do §7.1) | Média | Prompt do manifesto, multilíngue, áudio/imagem, assinatura, dedup |
| CRM + painel | Média | 7 tabelas, máquinas de estado, inbox |
| Ordem de coleta + invoice | **Média-alta** | Novo. Numeração, PDF, envio, conciliação |
| LTV / coorte | Baixa em código | Alta em **tempo de espera** |

O custo em dinheiro é de horas de agente, não de licença. O custo em **prazo** é dominado pelo onboarding da Meta, que não depende de nós.

### 3.4 O custo que ninguém coloca na planilha

**A pessoa de plantão.**

`DIRECIONAMENTO-AGOSTO-2026.md` já declara o SLA: *"24/7; Dennis responsável; A7 Laundry — Backup 1 acionado após 5 minutos sem resposta humana"*.

O agente cobre a primeira resposta. Mas todo handoff — agendamento, reclamação, áudio, fora de cobertura — cai em gente. Se ninguém pega às 2h da manhã, o sistema troca *"lead perdido"* por *"lead perdido com registro"*. O registro tem valor (é medição), mas não é venda.

**Este é o único custo do projeto que não tem solução técnica.** É a Q6 do blueprint, e continua sem resposta.

---

## 4. O retorno — a parte desconfortável

Vou fazer a conta que justifica o projeto, do jeito honesto.

**Cenário otimista de recuperação:**

```
3,5 leads perdidos por ciclo  (ponto médio de 3–4)
  × 25% de fechamento         (2÷8 observado, IC 95% 7,1%–59,1%)
  = ~0,9 pedido recuperado
  × US$ 81,83 de ticket
  = ~US$ 72 de receita
  × 50% de margem hipotética  (custo variável real é DESCONHECIDO)
  = ~US$ 36 de contribuição por ciclo
```

**~US$ 36.** Contra US$ 930/mês de mídia e uma perda mensal entre US$ 204 e US$ 437.

E esse número tem um intervalo tão largo (7,1%–59,1% de fechamento sobre 8 cotações) que ele pode ser US$ 10 ou US$ 85. Estatisticamente, **é indistinguível de zero.**

> **Se o argumento para construir for "recuperar leads perdidos", o argumento não se sustenta.** Precisa ser dito, e é o oposto do que meu blueprint sugeria ontem.

### 4.1 Então por que ainda vale

Por três motivos que não são recuperação de receita:

**a) O registro por lead já é item pendente do plano de agosto.** Semana 1, item 6: *"Criar o registro por lead com identificador único."* E o diagnóstico do mesmo documento:

> *"Sem um identificador único por lead ligando origem → elegibilidade → cotação → pedido → receita → contribuição → recompra, qualquer ROAS continuará sendo montagem de populações diferentes."*

O CRM **é** esse registro. Não é ideia nova — é a tarefa que ficou.

**b) Sem ele, os gates de setembro não podem ser avaliados.** Os gates exigem contribuição por pedido reconciliada, CAC atribuível a fonte, e 30–40 cotações elegíveis acumuladas. Nenhum desses é apurável lendo conversa a mão. **Sem o registro, setembro chega e a decisão de escalar ou parar continua sem base** — e aí a A7 segue gastando US$ 930/mês no escuro.

**c) O valor real é a decisão de parar, não a de escalar.** Se o dado mostrar que a conta não fecha, US$ 930/mês economizados valem 26× os US$ 36 de leads recuperados. **O CRM se paga muito mais rápido provando que a mídia não funciona do que ajudando a mídia a funcionar.**

Este é o argumento honesto. O anterior não era.

---

## 5. Quem revisa — o buraco que você identificou

Você perguntou quem revisa a minha camada e a do Codex. Fui olhar, e a resposta atual é **ninguém, de forma automática**.

| Camada | Status real |
|---|---|
| Guards e testes CLI | **Existem e são bons** — `npm test` roda ~20 validadores, `npm run lint` faz `node --check` em 40+ arquivos |
| CI executando esses testes | **NÃO EXISTE.** `.github/workflows/` tem só `clickup-sync.yml` |
| CodeRabbit | **NÃO ATIVO.** A regra em `.claude/rules/coderabbit-integration.md` aponta para `.aiox-core/**`, `packages/**`, `bin/**` — caminhos que não existem neste repo. Não há `.coderabbit.yaml` |
| Revisão humana de código | Só você |
| Revisão de comportamento do agente | Não existe ainda (o agente não existe) |

Ou seja: hoje a proteção é boa **se alguém lembrar de rodar `npm test`**. Não há nada que impeça código quebrado de chegar em produção.

### 5.1 O que proponho — e por que não é "outro modelo revisando"

Colocar um terceiro modelo para revisar os dois primeiros **não resolve**: modelos concordam entre si com facilidade e erram junto no mesmo tipo de coisa (especialmente premissas erradas — foi assim que o 47,4% sobreviveu à minha própria escrita).

O que de fato revisa:

| Camada | O que é | Por que funciona |
|---|---|---|
| **1. Guards determinísticos** | Testes CLI que falham o build (blueprint §12) | Um teste que falha não tem opinião. Prova o preço do prompt contra o `MANIFESTO.md`, prova que webhook sem assinatura é rejeitado, prova que degradação termina em humano notificado |
| **2. CI de verdade** | GitHub Action rodando `npm test` em todo push | **A lacuna mais barata de fechar.** Meia hora de trabalho. Deveria ser feito antes de qualquer código do CRM |
| **3. Revisão cruzada Claude ↔ Codex** | O que já fazemos | Pega erro de arquitetura e premissa. **Não** pega erro que ambos compartilhem |
| **4. Revisão humana de comportamento** | Você lendo transcrições de conversa | O agente fala com cliente em nome da A7. Nenhum teste pega "o tom estava errado" ou "prometeu algo que não devia". Diário na 1ª semana |
| **5. Produção com kill switch** | Env var que desliga o agente sem deploy | O revisor final é o cliente real. Precisa poder desligar em segundos |

**A camada 4 é insubstituível e é sua.** Nenhum arranjo de agentes cobre "isso não é como a A7 fala com cliente".

E uma coisa que este documento demonstra: **o Codex vai encontrar coisas nas minhas.** Encontrei um erro material meu (§0) ao ler o repositório com mais cuidado hoje. Não porque eu tenha sido descuidado, mas porque a revisão cruzada funciona — inclusive comigo mesmo, um dia depois.

---

## 6. Os caminhos

### Caminho A — Registro mínimo primeiro *(recomendado)*

Fase 0 do blueprint + captura de lead, **sem agente e sem onboarding da Meta**.

- Atribuição durável, tabelas `contact`/`conversation`/`order_record`, painel de registro manual
- Você continua atendendo pelo celular como hoje, e **registra** o lead no painel
- **Prazo:** curto. Não depende da Meta
- **Custo de operação:** ~US$ 0–25/mês
- **Entrega:** os denominadores dos gates de setembro
- **Não entrega:** primeira resposta automática — o vazamento de 25–33% continua

**A favor:** destrava a decisão de setembro sem depender de aprovação externa, e é jogado fora se a decisão for parar.
**Contra:** exige disciplina sua de registrar. Se você não registrar, não serve para nada.

### Caminho B — Blueprint completo, em fases

Fases 0 → 1 → 2 como está escrito, com ordem de coleta e invoice adicionados na Fase 2.

- **Prazo:** dominado pelo onboarding da Meta (semanas, fora do nosso controle)
- **Custo:** ~US$ 5–30/mês
- **Entrega:** tudo que você pediu
- **Risco:** o volume atual (12 leads/ciclo) não exercita o sistema o suficiente para revelar seus defeitos antes do momento em que ele importa

### Caminho C — Comprar pronto

Wati (~US$ 29–119/mês), Respond.io (~US$ 79–159/mês), Chatwoot self-hosted.

- **Entrega:** inbox, automação básica, multiusuário — hoje
- **Não entrega:** o join `short_ref` → pedido → contribuição, que é **a única coisa que a A7 realmente precisa**. Nenhuma dessas plataformas conhece o seu `A7 Ref`
- **Custo:** US$ 350–1.900/ano, mais caro que construir e rodar

**Descartado**, mas registrado para o Codex contestar se discordar.

### Caminho D — Não construir agora

Continuar no celular, registrar lead em planilha, decidir em setembro com o dado que der.

- **Custo:** zero
- **Risco:** setembro chega sem os denominadores, a decisão de escalar continua sem base, e a A7 segue gastando ~US$ 930/mês no escuro

**Não é uma opção absurda** dado o volume. É o piso contra o qual as outras devem ser comparadas.

---

## 7. Minha recomendação

**Caminho A agora, B depois — e o CI antes de tudo.**

Ordem concreta:

1. **CI rodando `npm test`** — meia hora, fecha a maior lacuna de governança do repo
2. **Fase 0** — atribuição durável. Vale sozinha: hoje a atribuição morre a cada deploy
3. **Registro de lead com painel** — os denominadores começam a acumular imediatamente
4. **Iniciar o onboarding da Meta em paralelo** — é o item de maior prazo e menor esforço nosso; começar cedo não custa nada
5. **Agente só quando o canal estiver aprovado** e com kill switch desde o primeiro dia
6. **Ordem de coleta e invoice por último** — são o que mais amarra a operação ao sistema; entram quando o resto estiver estável

**Não construir a coisa inteira antes de ela ser usada.** Com 12 leads por ciclo, um sistema completo passaria a maior parte do tempo ocioso, acumulando defeitos que só apareceriam quando o volume chegasse.

E o mais importante, dito claramente: **este projeto não vai salvar a conta de agosto.** Ele produz o dado que permite decidir com base, em setembro — inclusive a decisão de parar. Se alguém apresentar isso como investimento que aumenta vendas, está vendendo o que ele não é.

---

## 8. Se eu estiver errado, é provavelmente aqui

Registro minhas próprias fragilidades para o Codex atacar:

1. **Posso estar sub-dimensionando o esforço de invoice e ordem de coleta.** Chamei de "média-alta" sem conhecer o processo de coleta da A7 nem exigências fiscais na Flórida.
2. **Minha estimativa de tokens é modelagem, não medição.** 15 trocas × 4.000 tokens é chute informado. Conversa com áudio transcrito pode ser 3× disso. Ainda assim ficaria barato — mas o número exato é meu, não observado.
3. **Assumi que o volume permanece baixo.** Se a A7 escalar de verdade, o Caminho A vira gargalo rápido e o retrabalho para B tem custo.
4. **Errei o número do vazamento ontem** (§0). Uma premissa errada atravessou um documento inteiro sem que eu percebesse. Vale como evidência de que a camada 3 (revisão cruzada) é necessária, não opcional.
5. ~~Não sei o que é "o sisteminha".~~ **Esclarecido:** não existe — é o alvo a construir (§11). Minha incerteza restante mudou de lugar: **não conheço o processo físico da A7** (quem coleta, como pesa, onde produz, como entrega). O §11 propõe uma camada de operação sem nunca ter visto a operação.

---

## 9. Perguntas para o Codex

**Q1 — ~~Que sistema é "o sisteminha"?~~ RESPONDIDA (2026-08-21).** Não existe ainda. O "sisteminha" **é** o alvo: tudo online, do lead até a entrega. Não há integração com legado a fazer — o CRM e o sistema de operação são o mesmo produto, construído em fases. Consequência: o escopo inclui **logística** (coleta, produção, entrega, pesagem), que este documento não havia modelado. Ver §11.

**Q2 — A conta de retorno da §4 está correta?** ~US$ 36 de contribuição recuperada por ciclo, estatisticamente indistinguível de zero. Se o Codex chegar a outro número, quero saber com que denominador.

**Q3 — O Caminho A é suficiente para os gates de setembro?** Registro manual disciplinado produz o mesmo dado que captura automática, ou a disciplina humana é o ponto de falha que invalida tudo?

**Q4 — Invoice e ordem de coleta: escopo ou distração?** Minha leitura é que amarram a operação ao sistema cedo demais. Contra-argumento válido: sem invoice, `paid_amount_usd` depende de conciliação manual com Stripe e a contribuição continua estimada.

**Q5 — Concorda com a arquitetura de revisão da §5?** Especificamente com a tese de que um terceiro modelo revisando os dois primeiros vale menos que guards determinísticos + CI.

**Q6 — Qual é o custo real de esperar?** Se a A7 não construir nada e setembro chegar sem denominadores, qual a probabilidade de outubro repetir agosto? Essa é a comparação que decide entre o Caminho A e o D.

**Q7 — Quem é o humano de plantão?** Continua sem resposta desde o blueprint. É a Q6 de lá e a Q7 daqui. **Se não houver resposta, o Caminho A é o teto do que faz sentido construir** — porque um agente que escala para ninguém é só um registrador caro.

---

## 10. Referências

`docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md` · `docs/DIRECIONAMENTO-AGOSTO-2026.md` (rev. 3) · `docs/audits/2026-07-30-audit-consolidado.md` · `docs/audits/2026-08-21-open-wa-technical-risk-audit.md` · `MANIFESTO.md` · `.claude/rules/coderabbit-integration.md` · `.github/workflows/`

Preços da API Anthropic conforme tabela vigente em 2026-08-21 (Opus 5 $5/$25, Sonnet 5 $3/$15, Haiku 4.5 $1/$5 por 1M tokens; leitura de cache ~0,1×).


---

## 11. Adendo — "o sisteminha" é o alvo, não um integrado

**Esclarecimento do dono em 2026-08-21:** não existe sistema hoje. A visão é **tudo online, da conexão do lead até a entrega**.

### 11.1 O que muda

Some a preocupação com integração legada. Entra uma camada que este documento não havia modelado: **operação física**.

```
lead → conversa → cotação → PEDIDO → coleta → PESAGEM → produção → entrega → pagamento → recompra
                            └─ o blueprint parava aqui ─┘└──── território novo ────┘
```

### 11.2 O elo que faltava: a pesagem

A A7 cobra **por libra**. Isso tem uma consequência que nenhum dos documentos anteriores tratou:

> **A cotação é estimativa. O valor do pedido só existe depois de pesar.**

Logo:
- `order_record` precisa de `actual_lbs` além de `estimated_lbs`
- O invoice **não pode** ser emitido antes da pesagem — só depois dela há valor real
- A diferença sistemática entre estimado e real é, por si só, um dado comercial (se o cliente subestima, o mínimo de US$ 50 é atingido com mais frequência do que a conversa sugere)

### 11.3 Por que isso melhora o argumento do projeto

O gap de **alta prioridade** do `docs/audits/2026-07-30-audit-consolidado.md` é: *"Custo variável por pedido desconhecido — impede calcular margem e teto real de CPA."* É o mesmo gap que torna toda a §4 deste documento uma conta com margem hipotética de 50%.

**O CRM de atendimento não resolve esse gap. A camada de operação resolve.** Peso real, tempo de processamento, insumos e rota são os componentes da contribuição. Um sistema que registra a operação produz o número que hoje falta — e a contribuição por pedido é o **gate #1 de setembro**.

Isso reforça, não enfraquece, a recomendação da §7: **construir em fases, na ordem em que cada fase destrava uma decisão.**

| Fase | Destrava |
|---|---|
| 0 — atribuição durável | Origem do lead sobrevive a deploy |
| 1 — registro de lead | Denominadores: lead → elegível → cotado |
| 2 — pedido | Fechamento com denominador real |
| 3 — **operação e pesagem** | **Contribuição por pedido — o gate #1** |
| 4 — invoice | Receita conciliada sem trabalho manual |
| 5 — entrega e recompra | LTV por coorte (meses depois, não semanas) |
| — agente 24/7 | Entra quando o canal Meta for aprovado; independe desta trilha |

### 11.4 O que isso não muda

Nada na §4. O retorno direto continua sendo ~US$ 36 por ciclo e continua indistinguível de zero. **A visão de sistema completo não melhora a conta de agosto** — ela descreve para onde o sistema cresce, não um retorno novo.

E a Q7 continua decidindo o teto: sem humano de plantão, o agente 24/7 não deve ser construído, por mais completa que a visão seja.

### 11.5 Nova pergunta para o Codex

**Q8 — Qual o mínimo da camada de operação que produz contribuição confiável?** Minha hipótese: `actual_lbs` + custo de insumo por libra + tempo de rota. Se isso bastar, a Fase 3 é pequena e vale ser antecipada — porque é ela, não o CRM, que fecha o gap de alta prioridade do audit de julho.
