# A7 Laundry Orlando — Auditoria consolidada de desempenho

**Data:** 2026-07-30
**Escopo:** Meta Ads (dados ao vivo até 29/jul), GA4, Google Search Console, Google Ads, saúde técnica do repositório
**Natureza:** somente leitura. Nenhuma campanha, orçamento ou configuração foi alterada.
**Decisão recomendada:** **NÃO INTERVIR.** Ver seção 7.

---

## ⚠️ ERRATA DE PRIORIZAÇÃO — 2026-07-30, após revisão

Este documento mede bem o topo do funil e não mede nada depois dele. A revisão apontou,
corretamente, que o enquadramento está errado.

**A pergunta central não é "o algoritmo aprendeu?". É "coloquei US$ 100, quanto sobrou no caixa?"**

Com CPA de ~US$ 100 por pedido e ticket de US$ 82, a operação paga destrói caixa antes mesmo de
contabilizar custo variável. Nenhuma conclusão sobre Learning Limited, significância estatística
ou CTR altera esse fato.

Correções ao que está escrito abaixo:

| Seção | O que dizia | Correção |
|---|---|---|
| §5 | Learning Limited como "achado mais consequente" | É secundário. Importa quando o funil fechar a conta. |
| §6 itens 3–4 | Atribuição/funil no GA4 como severidade Alta | Os anúncios vão direto ao WhatsApp. A medição tem de ser **no WhatsApp**, não no GA4. |
| §7 | HOLD até 11/ago sem mudar a medição | Errado. Gastaria ~US$ 360 gerando dados igualmente inconclusivos. O que muda é **começar a registrar cada conversa**, não esperar. |
| §4 | Rigor estatístico entre criativos | Aplicado à pergunta errada. Com 1–2 conversas por anúncio, a comparação não decide nada relevante. |

**O plano operacional válido está em [`marketing/OPERACAO-FUNIL.md`](../../marketing/OPERACAO-FUNIL.md).**
Este documento permanece como registro dos dados brutos e da apuração de mídia, que seguem
corretos e verificáveis. A leitura de prioridade é a da errata.

---

## 0. Contexto para leitura independente

A7 Laundry Orlando é um serviço de lavanderia com coleta e entrega em Orlando, Flórida. Opera
em dois públicos: hóspedes de hotéis/Airbnb (turistas) e residentes locais. O modelo é por libra
(US$ 3,25 normal / US$ 3,95 express), sem assinatura. A conversão acontece por **WhatsApp**
(`+1 407-670-8839`), não por checkout no site. O site `a7laundry.com` é estático, hospedado na
Vercel, e funciona como camada de descoberta orgânica e prova social — não como funil de compra.

Consequência estrutural importante: **as campanhas de Meta Ads levam para o WhatsApp, não para o
site.** Por isso o GA4 não registra tráfego pago, e por isso o volume de sessões do site
(101 em 30 dias) não deve ser lido como proxy de demanda do negócio.

---

## 1. Fontes e integridade

| Fonte | Período | Método | Integridade |
|---|---|---|---|
| Meta Ads | 1 mai – 29 jul 2026 | API oficial (MCP), leitura ao vivo | Direto da fonte |
| GA4 | 22 jun – 21 jul 2026 | 14 CSVs exportados | SHA-256 verificado |
| Google Search Console | 30 jun – 17 jul 2026 | 5 XLSX exportados | SHA-256 verificado; inspeção célula a célula pendente |
| Meta orgânico | 24 jun – 24 jul 2026 | 3 CSVs exportados | SHA-256 verificado |
| Google Ads | all-time até 24 jul 2026 | Leitura de interface | Snapshot de navegador, não API |
| Receita/pedidos | 22 jun – 21 jul 2026 | **Relato do proprietário** | **Não verificado por sistema** |

**Limitação declarada:** receita e pedidos são autorrelatados (6 pedidos, US$ 491). Não existe
instrumentação de compra. Todo cálculo de unit economics neste documento herda essa incerteza.

Conta de anúncios operacional: `650201661142284` (A7 LAUNDRY USA, USD, ativa).

---

## 2. Dados brutos — Meta Ads

### 2.1 Campanhas (1 mai – 29 jul 2026)

| Campanha | Status | Gasto | Impressões | Cliques | CTR | CPM | Conversas | Custo/conversa |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Guest Laundry \| Manual \| WhatsApp 8839 \| JUL28 | **ATIVA** | $63,05 | 3.084 | 39 | 1,26% | $20,44 | 3 | $21,02 |
| Guest Laundry \| Manual \| WhatsApp \| JUL26 | Pausada | $146,83 | 8.245 | 117 | 1,42% | $17,81 | 5 | $29,37 |
| WhatsApp Conversas \| Laundry+Comforter \| JUL26 | Pausada | $573,56 | 31.176 | 505 | 1,62% | $18,40 | 31 | $18,50 |
| Comfort Cleaning [MAR26] (objetivo: vendas) | Pausada | $116,17 | 9.691 | 872 | 9,00% | $11,99 | 2.189 views | $0,05 |
| 5 campanhas sem entrega | Pausadas | $0,00 | 0 | 0 | — | — | 0 | — |

**Total investido:** US$ 899,61
**Total de conversas (campanhas de mensagem):** 39 · gasto de mensagem US$ 783,44 · **média US$ 20,09/conversa**

### 2.2 Anúncios — últimos 7 dias (23–29 jul 2026)

Campanha **JUL26** (pausada em 28/jul):

| Anúncio | Gasto | Impressões | CTR | Conversas | Custo/conversa |
|---|---:|---:|---:|---:|---:|
| A4 · CONTROL · Guest PT · Manual | $43,62 | 2.531 | 1,58% | 1 | $43,62 |
| A4 · CONTROL · Guest PT · Resort Corridors | $42,47 | 2.483 | 1,57% | 2 | $21,24 |
| A3 · CONTROL · Guest EN · Manual | $40,97 | 2.085 | 1,25% | 2 | $20,49 |
| LA7 · CHALLENGER · Guest PT Feed | $9,08 | 545 | 1,10% | 0 | — |
| A3 · CONTROL · Guest EN · Resort Corridors | $3,17 | 181 | 1,66% | 0 | — |

Campanha **JUL28** (ativa desde 27/jul 21:37 PDT):

| Anúncio | Gasto | Impressões | CTR | Conversas | Custo/conversa |
|---|---:|---:|---:|---:|---:|
| A4 · CONTROL · Guest PT | $26,72 | 1.410 | 1,49% | 2 | $13,36 |
| LA7 · CHALLENGER · Guest PT Feed | $18,74 | 930 | 0,75% | 0 | — |
| AD · Guest Front Desk · EN | $15,59 | 654 | 1,68% | 1 | $15,59 |
| A3 · CONTROL · Guest EN | $2,00 | 90 | 0,00% | 0 | — |

Configuração da JUL28: orçamento diário do ad set **US$ 30,00**, objetivo `OUTCOME_ENGAGEMENT`
(maximizar conversas), Orlando +40 km, idade 25–55, placements Feed/Stories/Reels apenas,
Advantage+ e transformações automáticas desligadas.

---

## 3. Unit economics

Com ticket médio e taxa de conversão derivados dos dados disponíveis:

| Variável | Valor | Derivação |
|---|---:|---|
| Ticket médio | US$ 81,83 | US$ 491 ÷ 6 pedidos |
| Taxa conversa → pedido | 19,4% | 6 pedidos ÷ 31 conversas (campanha do mesmo período) |
| **Receita bruta por conversa** | **US$ 15,87** | 81,83 × 0,194 |

**Teto de custo por conversa para não perder dinheiro: US$ 15,87 em receita bruta.**

⚠️ **Ressalva material:** US$ 15,87 é *receita*, não *margem*. O custo variável de operação
(lavagem, secagem, dobra, combustível, tempo de coleta e entrega) não está contabilizado. Se a
margem de contribuição for 50%, o teto real de CPA cai para ~US$ 7,94. **Nenhuma decisão de
escala deve ser tomada antes de o custo variável por pedido ser conhecido.** Esse é o dado que
falta e que vale mais do que qualquer otimização de criativo.

Comparação com o realizado:

- Média histórica de todas as campanhas de mensagem: **US$ 20,09/conversa** — acima do teto bruto
- Melhor campanha completa (Laundry+Comforter JUL26): **US$ 18,50/conversa** — acima do teto bruto
- ROAS bruto estimado do período dos pedidos: **~0,86x** (US$ 491 ÷ US$ 573,56)

**Conclusão:** no agregado, a operação paga de Meta ainda **não** atingiu o ponto de equilíbrio
bruto — e está mais distante ainda do equilíbrio de margem.

---

## 4. Análise de significância — por que os sinais recentes NÃO autorizam ação

Esta seção corrige uma leitura preliminar que destacou o A4 PT JUL28 (US$ 13,36/conversa) como
"melhor CPA da história". A afirmação não resiste ao teste.

### 4.1 O mesmo criativo produziu três CPAs incompatíveis

O criativo **A4 · CONTROL · Guest PT** rodou em três alocações nos últimos 7 dias:

| Alocação | Gasto | Conversas | Custo/conversa |
|---|---:|---:|---:|
| JUL26 · Manual | $43,62 | 1 | **$43,62** |
| JUL26 · Resort Corridors | $42,47 | 2 | **$21,24** |
| JUL28 | $26,72 | 2 | **$13,36** |
| **Agregado** | **$112,81** | **5** | **$22,56** |

Variação de **3,3x** no mesmo criativo, na mesma semana, na mesma região. O valor de US$ 13,36
é a ponta favorável da dispersão, não um novo patamar de desempenho. **O número honesto do A4 PT
é US$ 22,56** — acima da média histórica e acima do teto de breakeven.

### 4.2 O "vazamento" do LA7 não está provado

O LA7 Challenger acumulou US$ 27,82 em duas rodadas sem nenhuma conversa. Testes:

| Teste | Resultado | Veredito |
|---|---|---|
| P(0 conversas \| CPA de breakeven), só JUL28 | λ = 1,18 → **p = 0,307** | Não conclusivo |
| P(0 conversas \| CPA de breakeven), acumulado | λ = 1,75 → **p = 0,173** | Não conclusivo |
| CTR LA7 (0,88%, n=1.475) vs A4 PT (1,55%, n=3.941) | z = 1,88 → **p = 0,060** | Marginal, não significativo a 95% |

O sinal de CTR é o mais forte dos três e ainda assim fica **acima** de p = 0,05. A leitura correta
é "provável underperformer, não provado". Desligar com essa evidência é decisão de intuição
vestida de dado.

### 4.3 A amostra inteira é pequena demais

A campanha ativa tem **3 conversas em 2 dias**. Nenhum anúncio individual passa de 2 conversas.
Em contagens dessa ordem, a diferença entre "melhor" e "pior" anúncio é indistinguível de sorte.

---

## 5. 🔑 Achado estrutural: o ad set nunca vai sair do aprendizado

Este é o achado mais consequente da auditoria.

O Meta exige aproximadamente **50 eventos de otimização em 7 dias** para um ad set sair da fase de
aprendizado. O evento de otimização aqui é "conversa iniciada".

| Variável | Valor |
|---|---:|
| Eventos necessários por semana | 50 |
| CPA médio realizado | ~US$ 18 |
| Investimento semanal necessário | **US$ 900** |
| Investimento diário necessário | **US$ 128,57** |
| Orçamento diário atual | US$ 30,00 |
| **Percentual do limiar atingido** | **23%** |

**A US$ 30/dia, o ad set gera ~11,7 conversas por semana — 23% do necessário. Ele está em
`Learning Limited` de forma estrutural e permanente.**

Implicações que mudam a estratégia:

1. **"Esperar sair do aprendizado" não é um plano viável.** Não vai acontecer neste orçamento.
2. **Cada edição é mais cara do que o normal.** Em Learning Limited, o algoritmo já opera com
   sinal insuficiente. Reiniciar o aprendizado joga fora o pouco de sinal acumulado.
3. **Decisões devem ser tomadas em janelas longas** (14+ dias), por CPA agregado, nunca por
   leitura diária.
4. **Fragmentação é o inimigo.** Quatro anúncios dividindo US$ 30/dia recebem ~US$ 7,50/dia cada.
   Consolidar aumentaria o sinal por unidade — mas consolidar exige editar, e editar reinicia.
   O trade-off só compensa se feito **uma vez**, com convicção, e não repetidamente.

Isto valida a decisão do proprietário de não movimentar campanhas — e por um motivo mais forte do
que o receio inicial: não é só o risco de voltar ao aprendizado, é que **o ad set nunca saiu dele**,
e mexer agora destrói o único ativo que ele tem, que é histórico contínuo.

---

## 6. Regressões e riscos identificados

| # | Achado | Severidade | Evidência |
|---|---|---|---|
| 1 | Ad set em Learning Limited estrutural (23% do limiar) | **Alta** | 50 eventos/7d exigiria US$ 128,57/dia vs US$ 30 atual |
| 2 | Custo variável por pedido desconhecido | **Alta** | Impede calcular margem e teto real de CPA |
| 3 | Atribuição paga ausente no GA4 | **Alta** | 474 cliques do Meta, 0 sessões classificadas como pagas |
| 4 | Funil comercial ausente no GA4 | **Alta** | `generate_lead`, `begin_checkout`, `purchase` nunca recebidos |
| 5 | Google Ads sem fundos | **Alta** | R$ 0,10 de saldo; R$ 4.714,27 gastos all-time; 18 conversões são chamadas, 0 vendas medidas |
| 6 | Conta `1399309731969189` DISABLED | Média | "Flagged because of unusual activity" — não é a conta operacional |
| 7 | Qualidade do tráfego orgânico caiu | Média | Taxa de eventos-chave da Busca Orgânica: 44,4% (3–10 jul) → 5,26% (11–21 jul) |
| 8 | Desktop sem performance no SEO | Média | CTR 0,5%, posição 23,5 (729 impressões) vs mobile CTR 3,1%, posição 11,4 |
| 9 | Indexação represada | Média | 29 indexadas / 21 não indexadas / 18 em "Descoberta – não indexada"; +41 páginas publicadas recentemente |
| 10 | Instagram sem retenção | Baixa | 12 distribuições, 562 views, **0 saves, 0 follows** |
| 11 | Trabalho não versionado remotamente | Média | 110 arquivos não commitados; branch `feat/meta-ads-ops-structure` nunca enviada ao remoto |

### Pontos sólidos

- **Suíte técnica 100% verde:** 8 validadores + 6 testes do MOS passando. Guardas de destino do
  Google Ads, número oficial `8839` e segurança do fluxo Stripe travados por teste automatizado.
- **Canal "AI Assistant" é o de maior conversão do site:** 8 sessões, **62,5%** de taxa de
  eventos-chave (83,3% por usuário), 35,6s de engajamento médio, crescimento de 0 → 8 sessões em
  duas semanas. Único canal que converte acima da home. Valida o investimento em AEO/GEO.
- **Governança de dados exemplar:** 22 arquivos de evidência com SHA-256; `null` nunca coagido a
  zero no MOS; receita marcada explicitamente como `owner_reported`.

---

## 7. Decisão recomendada: HOLD com gatilhos pré-comprometidos

**Não alterar nenhuma campanha, anúncio, orçamento ou segmentação até 2026-08-11.**

Justificativa: a campanha tem 2 dias de vida, 3 conversas, opera em Learning Limited estrutural, e
nenhum sinal disponível atinge significância estatística. Qualquer edição agora troca informação
futura por uma decisão presente mal fundamentada.

### Gatilhos definidos agora, para não decidir no calor depois

Revisão em **11 de agosto de 2026** (14 dias de dados contínuos). Regras fixadas antecipadamente:

| Gatilho | Condição | Ação |
|---|---|---|
| **G1 — Desligar LA7** | CTR do LA7 permanecer < 1,00% **e** acumular ≥ US$ 60 sem nenhuma conversa | Pausar apenas o anúncio LA7 |
| **G2 — Consolidar** | Nenhum anúncio atingir 10 conversas em 14 dias | Consolidar para 2 anúncios (1 PT + 1 EN), edição única |
| **G3 — Escalar** | CPA agregado de 14 dias ≤ US$ 15,87 **e** custo variável por pedido conhecido | Aumentar orçamento em incrementos ≤ 20% |
| **G4 — Parar** | CPA agregado de 14 dias > US$ 30 | Pausar campanha e revisar oferta, não criativo |

Nenhuma ação fora destes gatilhos antes de 11/ago.

### Trabalho que NÃO toca em campanhas e deve avançar agora

Estas frentes não interferem no aprendizado e destravam decisão futura:

1. **Levantar o custo variável por pedido** — sem isso, o teto de CPA é desconhecido e nenhum
   gatilho de escala pode disparar com segurança. Maior prioridade do documento.
2. **Fechar o loop de receita** — transformar o registro manual de 6 pedidos em fonte recorrente,
   conciliável por anúncio e período.
3. **Padronizar UTMs** — nos links de destino, sem editar segmentação ou criativo. Destrava
   atribuição paga no GA4.
4. **Commitar e enviar a branch ao remoto** — todo o trabalho existe em uma única máquina.
5. **SEO desktop e indexação** — títulos, snippets e links internos para as 18 URLs descobertas e
   não indexadas.

---

## 8. Perguntas abertas para revisão independente

Pontos onde uma segunda opinião tem mais valor:

1. **Learning Limited permanente:** dado que US$ 128,57/dia é inviável, a resposta correta é
   (a) aceitar Learning Limited e julgar por janelas longas, (b) trocar o evento de otimização
   para um mais frequente (link click / landing page view) aceitando perda de qualidade, ou
   (c) consolidar drasticamente a estrutura para concentrar sinal? Qual tem melhor retorno
   esperado neste orçamento?

2. **Teto de CPA sem margem conhecida:** é defensável operar com o teto bruto de US$ 15,87 como
   referência provisória, ou toda decisão de alocação deveria ser suspensa até o custo variável
   ser levantado?

3. **Validade do ticket médio:** US$ 81,83 vem de 6 pedidos autorrelatados. Qual o intervalo de
   confiança prático dessa estimativa e a partir de quantos pedidos ela se torna utilizável para
   decisão de orçamento?

4. **Taxa conversa → pedido:** os 6 pedidos (22 jun–21 jul) foram atribuídos às 31 conversas da
   campanha Laundry+Comforter. Os períodos não são idênticos e não há prova de causalidade. Essa
   atribuição é aceitável como aproximação, ou introduz viés que invalida os 19,4%?

5. **Gatilhos propostos:** os limiares de G1–G4 estão calibrados corretamente para uma operação
   deste volume, ou são rígidos/frouxos demais?

6. **Alternativa não considerada:** com CPA de aquisição acima do ticket médio, faz mais sentido
   deslocar verba de aquisição para **retenção/recompra** da base existente? O modelo por libra
   sem assinatura sugere que o LTV pode estar sendo subutilizado — mas não há dado de recompra.

7. **Canal AI Assistant:** 62,5% de taxa de eventos-chave sobre 8 sessões. É sinal real de um
   canal emergente com alta intenção, ou artefato de amostra pequena? Vale investimento
   direcionado em AEO/GEO neste estágio?

---

## 9. Metodologia e reprodutibilidade

- Dados de Meta obtidos via MCP oficial da Meta, conta `650201661142284`, em 2026-07-30.
- Testes de proporção: teste z bicaudal para duas proporções, com variância agrupada.
- Probabilidade de zero eventos: distribuição de Poisson, λ = gasto ÷ CPA de breakeven (US$ 15,87).
- Limiar de aprendizado (50 eventos / 7 dias): documentação pública da Meta.
- Suíte técnica: `npm test` — 8 validadores + 6 testes do MOS, todos aprovados em 2026-07-30.
- Nenhum número neste documento foi estimado, arredondado favoravelmente ou inferido sem fonte.
  Onde o dado não existe, está declarado como ausente.
