# Prompt mestre — execução completa do redesign do A7 Orlando OS

Copie todo o conteúdo entre `PROMPT START` e `PROMPT END` para uma nova tarefa Codex aberta no projeto A7 Laundry Orlando.

---

## PROMPT START

Você é o agente principal responsável por executar até o final a evolução de experiência do A7 Orlando OS.

Trabalhe no repositório:

`/Users/dennisarruda/projects/A7_Laundry_Orlando`

Sistema em produção:

`https://a7laundry.com/sistema`

### Missão

Transforme o A7 Orlando OS em um back office moderno, simples de ler, rápido de operar, determinístico e confiável, preservando as regras de negócio, segurança, histórico, auditabilidade e pedidos em andamento.

Não pare na análise, no planejamento, em wireframes ou em recomendações. Execute a transformação completa: stories, arquitetura, contratos, implementação, testes, validação visual, migrações aditivas quando necessárias, release e verificação final.

Continue trabalhando até que todos os requisitos e critérios de conclusão deste prompt estejam implementados e comprovados. Não encerre dizendo apenas o que deveria ser feito.

### Fontes obrigatórias e ordem de autoridade

Antes de alterar qualquer arquivo, leia integralmente:

1. `AGENTS.md`;
2. `.aios-core/constitution.md`;
3. `docs/audits/2026-09-12-orlando-os-ux-service-design-audit.md`;
4. `docs/blueprints/A7-ORLANDO-LAUNDRY-OPERATIONS-SYSTEM-BLUEPRINT-2026-08-29.md`;
5. todas as stories relacionadas ao Orlando OS;
6. contratos de arquitetura, estados, pagamentos, custódia, produção, entrega e atribuição;
7. frontend, serviços, APIs, testes e migrations que sustentam `/sistema`.

Em caso de conflito:

1. segurança, integridade financeira e custódia prevalecem;
2. a Constitution prevalece sobre conveniência de implementação;
3. fatos atuais do código, banco e produção prevalecem sobre memória ou documentação obsoleta;
4. requisitos deste prompt e da auditoria prevalecem sobre preferências meramente estéticas;
5. não invente requisito: registre a lacuna e derive a decisão de evidência existente.

### Autorização do Owner

O Owner autoriza expressamente:

- criar ou atualizar documentação, arquitetura, stories e critérios de aceitação necessários para esta missão;
- modificar o código do A7 Orlando OS;
- adicionar ou alterar testes, fixtures sintéticas, scripts, serviços, APIs, estilos e componentes;
- criar migrations exclusivamente aditivas, reversíveis e compatíveis com pedidos em andamento;
- construir previews, ambientes seguros e artefatos de release;
- executar lint, typecheck, testes, build, validações de estrutura e smokes;
- publicar incrementalmente em produção após aprovação dos gates definidos neste prompt;
- executar smokes autenticados e somente leitura em produção;
- corrigir defeitos encontrados durante a execução quando estiverem diretamente relacionados ao escopo;
- preparar rollback e aplicá-lo imediatamente se um gate de produção falhar.

Esta autorização não permite:

- criar cobranças reais para testes;
- enviar mensagens reais a clientes;
- alterar, cancelar, reembolsar ou apagar pedidos/pagamentos reais para validar o redesign;
- inventar receita, pagamento, gorjeta, custódia, prazo ou evidência;
- editar dados diretamente no banco para fazer um teste passar;
- executar migrations destrutivas ou apagar histórico;
- alterar Stripe, WhatsApp, Google Ads ou outros sistemas externos fora da necessidade estrita do produto e sem fixtures/sandbox;
- fazer push, criar PR, release ou tag fora da autoridade exclusiva de `@devops`.

Use dados sintéticos, ambientes isolados, transações com rollback e inspeção read-only. Qualquer teste de escrita em produção é proibido, salvo autorização posterior que nomeie exatamente os registros e efeitos.

### Papéis e governança

Respeite as autoridades exclusivas definidas na Constitution:

- `@sm` ou `@po`: criação e aprovação formal das stories;
- `@architect`: decisões de arquitetura;
- `@ux-design-expert`: experiência, arquitetura de informação e validação dos wireframes;
- `@dev`: implementação;
- `@qa`: veredito independente de qualidade;
- `@devops`: deploy, push, PR, release e rollback remoto.

Antes de escrever código, transforme cada pacote abaixo em uma story válida em `docs/stories/`, com requisitos rastreáveis, critérios de aceitação mensuráveis, riscos, rollback e File List inicial. As stories podem ser executadas em sequência ou em pequenos lotes independentes, mas nenhuma mudança de código pode existir sem story aprovada.

Não crie uma única megastory. Preserve mudanças pequenas, revisáveis, compatíveis e reversíveis.

### Resultado obrigatório

Ao final, Owner, Manager e Operator devem conseguir:

1. abrir o sistema e entender a situação da operação em menos de 10 segundos;
2. encontrar qualquer pedido conhecido em até duas interações;
3. identificar etapa, custódia, processamento, pagamento, risco e prazo sem interpretar códigos internos;
4. ver uma única próxima ação, com motivo e condição de liberação;
5. executar um pedido normal com pelo menos 30% menos tempo e mudanças de contexto;
6. tratar exceções sem sair do sistema nem editar o banco;
7. substituir com segurança um Payment Link incorreto;
8. reconciliar uma operação concluída fora do sistema com evidência e auditoria;
9. confirmar Front Desk, Bell Desk, Concierge, cliente ou outro ponto sem divergência;
10. confiar que serviço, mínimo, gorjeta, reembolso e total pago reconciliam ao centavo;
11. concluir a jornada no desktop e em 390 px sem rolagem horizontal ou controles inacessíveis;
12. entender a timeline humana sem perder a trilha técnica completa.

### Princípios de produto

- Uma tela responde imediatamente: onde estou, o que está acontecendo e o que faço agora.
- Um pedido tem uma ação primária inequívoca.
- O sistema recomenda ações somente por regras explícitas e fatos verificáveis.
- Toda decisão crítica informa fatos considerados, regra aplicada, bloqueios e explicação curta.
- IA generativa não determina valores, pagamentos, custódia, prazos ou transições.
- Uma projeção visual nunca substitui a fonte de verdade.
- Não existem fallbacks silenciosos para valores financeiros ou estados desconhecidos.
- Unknown, partial e unavailable permanecem distintos de zero.
- O histórico registra intenção humana, efeito automático e correção sem duplicar ruído na leitura principal.
- Ações irreversíveis recebem confirmação proporcional ao impacto.
- Exceções são fluxos governados, não campos livres nem edição direta.
- Use a stack atual. Não migre framework ou introduza biblioteca sem necessidade comprovada.
- CLI First → Observability Second → UI Third.

## Plano obrigatório de execução

### Fase 0 — baseline e proteção

1. Registre o estado atual do worktree sem remover ou sobrescrever mudanças do usuário.
2. Identifique exatamente o artefato de produção, migrations aplicadas e rollback disponível.
3. Congele fixtures sintéticas que representem:
   - pedido Normal;
   - pedido Express;
   - mínimo comercial;
   - gorjeta;
   - Stripe pago;
   - pagamento manual;
   - Front Desk, Bell Desk, Concierge e entrega direta;
   - pedido antigo concluído fora do sistema;
   - Payment Link incorreto;
   - estados incompatíveis;
   - pedidos QA, cancelados e entregues.
4. Meça a experiência atual: tempo, cliques, mudanças de tela, rolagem, erros e recuos nas tarefas principais.
5. Registre screenshots desktop e 390 px somente com dados sintéticos ou produção em modo read-only.
6. Faça o inventário das APIs, estados e componentes afetados.

Entregável: baseline verificável e conjunto de testes que falha para os problemas comprovados.

### Fase 1 — verdade financeira

Corrija primeiro a confiança do sistema.

Requisitos:

- um contrato server-side canônico deve expor `service_amount`, `minimum_adjustment`, `tip_amount`, `refund_amount`, `paid_total`, moeda, fonte, status e disponibilidade;
- a equação exibida deve ser reconciliável ao centavo;
- a UI não pode calcular o total nem usar `service_amount` como fallback para `paid_total`;
- Stripe, manual e refund devem seguir semântica única;
- uma divergência entre ledger, invoice e provedor deve criar exceção explícita e bloquear afirmação de “conciliado”;
- pedido MCO 1007 deve ser utilizável apenas como prova read-only; valide a correção com fixture equivalente, nunca alterando o pedido real;
- gorjeta deve continuar separada da receita de serviço onde os contratos financeiros exigirem.

Critérios mínimos:

- 100% dos cenários financeiros testados reconciliam ao centavo;
- nenhum total desconhecido vira zero ou valor de serviço;
- API, CLI, Home, pedido e financeiro exibem a mesma verdade;
- teste de regressão cobre US$60 serviço + US$6 gorjeta = US$66 pago.

### Fase 2 — verdade de custódia e handoff

Requisitos:

- represente o estado de custódia separadamente do ponto de handoff;
- `handoff_point` deve preservar `front_desk`, `bell_desk`, `concierge`, `guest` ou `other`;
- resumo, timeline, documentos e API devem mostrar o mesmo ponto;
- “entrega no hotel” não pode ser traduzida automaticamente como Bell Desk;
- preserve a política aprovada de handoff intermediário versus conclusão;
- toda correção deve ser append-only, com ator, motivo e timestamp;
- não infira que o hóspede recebeu a roupa apenas porque ela foi deixada no hotel.

Critérios mínimos:

- testes parametrizados cobrem todos os pontos;
- zero ocorrências de Front Desk exibidas como Bell Desk;
- handoff registrado nunca aparece como “Não informado”;
- timeline humana e técnica preservam o mesmo fato.

### Fase 3 — catálogo de linguagem e eventos

Requisitos:

- crie um glossário compartilhado e uma fonte única de labels;
- remova da UI termos de projeto como “Lite” e “W3-D”;
- use português operacional claro por padrão;
- substitua `Lifecycle` por “Etapa do pedido”, `Needed by` por “Cliente precisa até”, `Handoff` por “Local da entrega”, `Bags` por “Bolsas” e labels equivalentes aprovadas;
- eventos governados não podem renderizar “Não informado”;
- evento desconhecido deve produzir observabilidade e label segura, sem esconder o código do diagnóstico;
- agrupe na leitura principal ação humana e efeito automático correlacionados, mantendo expansão técnica.

Critérios mínimos:

- teste exaustivo garante label humana para todo evento/estado/ação permitido;
- nenhuma wave ou sigla interna aparece na navegação;
- timeline resumida reduz pelo menos 40% das linhas visíveis em pedidos típicos sem excluir eventos técnicos.

### Fase 4 — Central operacional

Substitua a Home atual por uma Central orientada ao trabalho.

Estrutura obrigatória:

1. Agora;
2. Hoje;
3. Atrasados;
4. Exceções;
5. resumo do negócio somente para papéis autorizados.

Cada item deve mostrar:

- pedido e cliente;
- localização necessária à tarefa;
- prazo/idade;
- estado simples;
- motivo da prioridade;
- próxima ação;
- responsável quando conhecido.

Regras:

- dívida histórica não pode competir silenciosamente com trabalho de hoje;
- pedido entregue, cancelado ou QA não aparece em fila ativa;
- operação concluída fora do sistema aparece em “Dados para reconciliar”;
- card e drill-down usam a mesma regra server-side;
- prioridade permanece determinística: risco de custódia/financeiro, atraso, SLA, bloqueio, janela e tempo de espera;
- alertas respondem quantos, quais, por quê e o que fazer;
- Operator não recebe dados financeiros que não pode acessar.

### Fase 5 — workspace do pedido

Redesenhe o pedido como workspace contínuo.

Acima da dobra no desktop e na primeira tela útil do mobile, mostre:

- número e cliente;
- hotel/quarto ou local;
- serviço;
- prazo/SLA;
- etapa atual;
- situação de custódia;
- total e pagamento;
- risco/exceção;
- próxima ação com explicação.

Organização recomendada:

- cabeçalho fixo e compacto;
- jornada visual resumida;
- coluna principal com próxima ação e atividade;
- painel lateral de cliente, financeiro e documentos no desktop;
- seções colapsáveis no mobile;
- timeline humana resumida e auditoria técnica expansível;
- ação de exceção governada disponível quando o fluxo normal não representa a realidade.

Após cada ação, mantenha o usuário no mesmo contexto, atualize os fatos e apresente o próximo passo. Não obrigue a voltar para a fila a cada transição.

### Fase 6 — busca universal

Crie uma busca privada disponível em todas as telas, acionável por `Command+K`/`Ctrl+K` e por controle visível.

Deve localizar com uma interação:

- número do pedido;
- nome do cliente;
- telefone completo ou últimos dígitos conforme política;
- hotel;
- quarto combinado com hotel;
- referência A7;
- motorista/rota quando autorizado.

Requisitos:

- consulta protegida no corpo da requisição;
- nenhuma PII em URL, analytics, logs ou storage;
- resultados agrupados por tipo;
- ações contextuais: abrir pedido, abrir cliente, iniciar pedido para cliente, abrir rota;
- resultados limitados, paginados e ordenados deterministicamente;
- atalhos e foco totalmente acessíveis por teclado.

### Fase 7 — substituição governada de Payment Link

Implemente a recuperação segura de link incorreto dentro do pedido.

Fluxo obrigatório:

1. mostrar link atual, valor e estado;
2. escolher “Substituir link”;
3. explicar o impacto;
4. revisar invoice/serviço/gorjeta;
5. confirmar por papel autorizado;
6. desativar o link anterior;
7. somente após sucesso, criar o novo link;
8. persistir e exibir o novo link atual;
9. auditar toda a operação.

Invariantes:

- no máximo um link ativo por invoice atual;
- falha ao desativar impede a criação do novo;
- retry idempotente retorna o mesmo resultado;
- concorrência nunca expõe dois links ativos;
- link pago/refunded segue política de imutabilidade e refund existente;
- testes usam Stripe sandbox/fake adapter; nunca gerar cobrança real.

### Fase 8 — reconciliação de operação externa

Crie um modo seguro para fatos que já ocorreram fora do sistema.

O fluxo deve:

- começar por “A operação já aconteceu?”;
- coletar somente fatos comprovados;
- mostrar o impacto nos quatro eixos;
- exigir evidência/motivo proporcional ao risco;
- exigir papel autorizado e confirmação adicional para pagamento/custódia;
- registrar eventos compensatórios append-only;
- preservar timestamps reais quando conhecidos e `unknown` quando não conhecidos;
- nunca fabricar sequência histórica;
- nunca editar diretamente registros para simular que o fluxo normal ocorreu;
- remover o pedido das filas falsas após reconciliação válida.

Inclua cenários de pedidos antigos, operação concluída, pagamento já recebido, entrega realizada e registros de teste que precisam ser encerrados sem contribuir para KPIs comerciais.

### Fase 9 — experiência mobile de execução

Para 390 px, priorize:

- ação atual;
- próxima parada/tarefa;
- cliente e localização mínima;
- instruções;
- prazo;
- confirmação e exceção;
- navegação inferior: Central, Pedidos, Rotas e Mais.

Requisitos:

- zero rolagem horizontal;
- alvos mínimos compatíveis com WCAG 2.2;
- foco visível;
- ação principal acessível sem percorrer toda a página;
- não depender apenas de cor;
- estados loading, offline, empty, partial, unavailable e error;
- `prefers-reduced-motion` respeitado;
- nenhum dado financeiro indevido para Driver/Operator.

### Fase 10 — acabamento visual e design system

Somente depois das correções estruturais:

- estabeleça tipografia legível e hierarquia clara;
- reduza caixa alta;
- use números tabulares para pesos, horários e valores;
- limite o uso de cards a agrupamentos com significado;
- reduza bordas, sombras e raios repetitivos;
- use cor para estado e risco, não decoração;
- mantenha a identidade A7 e uma paleta consistente;
- normalize spacing, foco, hover, pressed, disabled, loading e error;
- crie tokens e componentes compartilhados dentro da stack atual;
- preserve densidade adequada a um back office, sem transformar o sistema em landing page.

Não aplique efeitos cinematográficos, glassmorphism, animações decorativas ou padrões de marketing ao ambiente operacional.

## Arquitetura de informação final

```text
Central
├─ Agora
├─ Hoje
├─ Atrasados
└─ Exceções

Pedidos
├─ Todos
├─ Minhas visualizações
└─ Filtros avançados

Rotas
├─ Hoje
├─ Planejamento
└─ Motoristas

Clientes
Hotéis
Financeiro
Administração

Busca universal — disponível em toda tela
Novo pedido — ação global, não item de navegação
```

## Contrato obrigatório de próxima ação

O serviço deve fornecer, no mínimo:

```json
{
  "decision": "assign_delivery_driver",
  "label": "Designar motorista para entrega",
  "enabled": true,
  "facts": [
    "produção pronta",
    "pagamento conciliado",
    "custódia na lavanderia"
  ],
  "rule": "READY_PAID_AT_LAUNDRY",
  "blocked_by": [],
  "explanation": "O pedido está pronto e pago; falta definir quem fará a entrega.",
  "risk": "operational",
  "requires_confirmation": false
}
```

O browser renderiza esse contrato. Ele não recria regras de elegibilidade, SLA, financeiro ou transição.

## Observabilidade obrigatória

Implemente métricas sem PII para medir:

- tempo por tarefa e por etapa;
- mudanças de contexto/tela;
- ação apresentada, executada, bloqueada ou abandonada;
- recuos e correções;
- eventos desconhecidos;
- divergências financeiras;
- divergências de estado/handoff;
- pedidos ativos sem ação válida;
- operações reconciliadas;
- erros de busca;
- uso desktop/mobile;
- sucesso e falha por fluxo.

Não registre nome, telefone, endereço, quarto, Payment Link, mensagem, UUID protegido ou conteúdo de nota.

## Testes e gates

Para cada story:

1. teste de contrato/serviço;
2. teste de autorização e privacidade;
3. teste de idempotência e concorrência quando houver escrita;
4. teste de estados incompatíveis e falha fechada;
5. teste DOM/browser desktop;
6. teste exato em 390 px;
7. teste de regressão do fluxo anterior;
8. verificação visual;
9. rollback documentado;
10. checklist e File List atualizados.

Antes de considerar qualquer story concluída, rode:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:structure
npm run validate:agents
git diff --check
```

Se um comando não existir ou apresentar falha preexistente, prove isso com evidência, não esconda a falha e execute o substituto mais próximo autorizado pela Constitution.

Antes de release:

- QA independente deve emitir veredito;
- diff deve estar limitado às stories aprovadas;
- migration list deve ser exata;
- migrations devem ser aditivas e ensaiadas em ambiente descartável;
- artefato deve ser imutável e identificável;
- rollback deve nomear o alvo exato;
- não pode haver segredo ou PII no bundle, logs ou URLs;
- produção deve receber apenas o pacote aprovado.

Após deploy:

- execute smoke público de segurança;
- execute smoke autenticado somente leitura para Owner, Manager e Operator;
- verifique desktop e 390 px;
- compare contratos financeiros e operacionais sem modificar pedidos;
- confirme que não houve cobrança, mensagem ou mudança de dados reais;
- se qualquer gate falhar, aplique rollback imediatamente e continue o reparo local.

## Metas de sucesso

Meça baseline e resultado com as mesmas tarefas e fixtures.

- entendimento da Central em menos de 10 segundos;
- pedido conhecido localizado em até duas interações;
- redução mínima de 30% no tempo mediano do fluxo normal;
- no máximo três mudanças de contexto por pedido sem exceção;
- redução mínima de 40% do ruído visual da timeline;
- 0 divergências financeiras exibidas;
- 0 handoffs divergentes ou ausentes após registro;
- 0 eventos governados sem label humano;
- 0 pedidos concluídos em filas ativas;
- 100% dos Payment Links elegíveis substituíveis com segurança;
- pelo menos 90% de conclusão das tarefas principais sem ajuda em teste com Operator;
- SUS alvo de 80 ou mais após duas iterações.

Se uma meta não puder ser comprovada por falta de baseline real, entregue o instrumento de medição, execute com fixtures representativas e marque claramente a validação humana pendente. Isso não autoriza inventar um resultado.

## Regras de autonomia e parada

- Faça suposições locais e reversíveis quando houver evidência suficiente.
- Não peça confirmação para leitura, análise, implementação local, testes ou correções diretamente incluídas nesta autorização.
- Quando uma decisão de negócio ainda não estiver definida e mudar dinheiro, custódia, autoridade ou integridade, prepare opções concretas, recomende uma e só então solicite a decisão mínima necessária.
- Não use ausência de preferência estética como motivo para parar; derive do design system, auditoria e testes.
- Não reduza o escopo para terminar mais cedo.
- Não marque o programa concluído porque uma primeira story foi entregue.
- Continue após cada pacote até cumprir a Definition of Done global.

## Definition of Done global

O trabalho só está concluído quando existir evidência atual de que:

1. todas as stories necessárias foram criadas e aprovadas pelos papéis corretos;
2. os dez pacotes foram implementados ou formalmente descartados por evidência e decisão registrada;
3. todos os requisitos deste prompt possuem teste, inspeção ou artefato que os comprove;
4. todos os quality gates passam;
5. QA independente aprovou cada release;
6. produção está no artefato final ou houve rollback saudável com razão documentada;
7. smokes autenticados read-only passaram para os papéis aplicáveis;
8. nenhuma cobrança, mensagem ou mutação de pedido real ocorreu durante a validação;
9. métricas antes/depois e limitações estão documentadas;
10. documentação, arquitetura, runbooks, story checklists e File Lists refletem o estado final;
11. o Owner recebe um resumo objetivo do que mudou, evidências, riscos residuais e como operar a nova experiência.

## Entrega final

Ao concluir, apresente em português:

- resultado alcançado;
- links para stories, arquitetura, relatório de QA e runbook;
- resumo visual das novas telas;
- tabela requisito → evidência;
- resultados dos quality gates;
- identificador do artefato/deploy e rollback;
- métricas antes/depois;
- riscos residuais reais;
- confirmação explícita de que testes não alteraram clientes, cobranças, mensagens ou pedidos reais.

Use linguagem simples. Comece pelo resultado. Não faça uma retrospectiva extensa de ferramentas ou tentativas.

## PROMPT END

---

Referência de prompting: a documentação oficial da OpenAI recomenda definir resultado, critérios de sucesso, persistência, limites de autorização e verificação para fluxos agentivos longos: [Model guidance](https://developers.openai.com/api/docs/guides/latest-model).
