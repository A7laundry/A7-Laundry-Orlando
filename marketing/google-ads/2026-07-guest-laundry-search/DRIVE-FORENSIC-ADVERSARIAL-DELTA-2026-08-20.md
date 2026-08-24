# Delta controlado — auditoria forense e segunda opinião do Drive

Data da incorporação: 2026-08-20  
Modo: **SOMENTE LEITURA / NENHUMA ALTERAÇÃO NO GOOGLE ADS**  
Status: **DELTA ACEITO COM RESSALVAS; RELATÓRIOS-FONTE NÃO SÃO AUTORIDADE OPERACIONAL**

## Objetivo

Comparar três relatórios externos de 19 de agosto com a auditoria já existente no repositório e incorporar somente informações que ainda não estavam cobertas, sem regredir os gates de atribuição, oferta, privacidade e implantação.

## Fontes externas lidas diretamente no Google Drive

| Fonte | ID do Drive | Uso neste delta |
| --- | --- | --- |
| `01a - Auditoria Forense (Parte 1 de 2)` | `10rL6iAMsHZ0StOIdhwikBUFi0o1WLyLz` | Snapshot atualizado; keywords, termos, negativas, anúncios e tracking |
| `01b - Auditoria Forense (Parte 2 de 2)` | `1HWwez3DLZiTscwAZQsS5x9b0-m4xp6Z3` | Geografia, bidding, scorecard, desperdício e plano original |
| `02 - Segunda Opinião Adversarial` | `1IH-Zk9ay0pcGNF_-xD7jxfkhpOgcsP24` | Teste das hipóteses, segmentação por ação e correções propostas |

Os três arquivos permanecem como evidência externa. Eles não foram copiados integralmente para evitar duplicação, linguagem obsoleta e recomendações conflitantes com os controles do projeto.

## Hierarquia de autoridade

1. Estado live mais recente, lido na conta correta.
2. Pedidos e pagamentos reconciliados por `click ID/A7 Ref → order_id → payment_id`.
3. Oferta canônica e regras operacionais aprovadas.
4. Exports brutos e artefatos versionados.
5. Auditorias e interpretações externas.

Uma conclusão de nível inferior não substitui evidência ausente de nível superior.

## Delta factual aceito

### Snapshot acumulado até 19 de agosto

| Métrica | Baseline local de 18/08 | Relatório externo de 19/08 | Leitura correta |
| --- | ---: | ---: | --- |
| Janela | 19/07–17/08 | 27/07–19/08 | Janelas diferentes; não comparar como variação diária |
| Impressões | 2.997 | 3.196 | Atualização acumulada |
| Cliques | 163 | 177 | Atualização acumulada |
| Custo | R$2.121,01 | R$2.408,78 | Atualização acumulada |
| Conversões agregadas | 38 | 43 | Continuam misturando micro e macroconversões |
| WhatsApp opens | 33 | 38 | Microconversão, não lead ou venda |
| Stripe purchases | 5 | 5 | Contagem não cresceu no relatório |
| Valor de conversão | 2.237,89 | 2.237,89 | Moeda e transações continuam não reconciliadas |

O snapshot atualizado não comprova ROAS 0,93 nem CPA final de R$481,76. Esses cálculos só são descritivos dentro da plataforma até confirmar moeda, status pago, refund, duplicidade e atribuição.

### Segmentação keyword × ação de conversão

Esta tabela é o principal delta útil dos relatórios:

| Keyword | Custo | WhatsApp | Stripe | Decisão atual |
| --- | ---: | ---: | ---: | --- |
| `"wash and fold near me"` | R$822,87 | 13,5 | 0 | Segregar/testar após Gate B; não pausar automaticamente |
| `"laundry service orlando"` | R$582,36 | 10 | 0 | Segregar/testar após Gate B |
| `"laundry service near me"` | R$402,44 | 6,5 | 1,5 | Preservar; intenção e compra parcial observadas |
| `"laundry pickup and delivery"` | R$366,62 | 2 | 1 | Preservar como controle |
| `"laundry pickup near me"` | R$118,89 | 3 | 1 | Preservar; forte aderência ao serviço |
| `"hotel laundry service"` | R$13,26 | 1 | 1,5 | Preservar; amostra mínima e alta afinidade |
| Demais cinco keywords com gasto | R$102,34 | 2 | 0 | Dados insuficientes |

Os somatórios fecham 38 aberturas de WhatsApp e 5 compras Stripe. Mesmo assim, uma compra fracionária é atribuição do modelo do Google, não contagem física de pedidos. A tabela melhora a priorização, mas não substitui a reconciliação transacional.

### Termo `laundry near me`

A segunda opinião encontrou R$246,17 de valor rastreado no tema `laundry near me`. Fica aceita a correção defensiva:

- não adicionar `[laundry near me]` como negativa;
- não bloquear `near me` amplamente;
- reduzir ou separar exposição somente em experimento aprovado e após Gate B;
- não inferir qual keyword originou o valor porque o relatório não fecha esse vínculo.

Isso reforça a adjudicação local já existente; não a substitui.

### Janela pré/pós-tCPA

A comparação limpa informada foi:

| Métrica | 06–12/08 | 13–18/08 |
| --- | ---: | ---: |
| Cliques/dia | 8,29 | 8,50 |
| CPC médio | R$9,81 | R$19,94 |
| Custo/dia | R$81,29 | R$169,47 |
| WhatsApp | 16 | 10 |
| Stripe purchases | 1 | 2 |
| Custo/compra de plataforma | R$569,03 | R$508,41 |

Leitura aceita: o CPC e o gasto diário subiram materialmente após a ativação do tCPA, enquanto o volume diário ficou semelhante.

Leitura não aceita: afirmar causalidade ou melhora comercial. Há apenas uma compra contra duas, mudança de orçamento em 16/08, atribuição com janela de 90 dias, leilão variável e nenhuma reconciliação dos pedidos. O dado é diagnóstico, não autorização de lance.

### Lake Buena Vista

O relatório atualizado mostra 6 cliques, R$61,39 e 4,5 conversões agregadas atribuídas à região, com CPA de plataforma de R$13,64. Isso é aceito como sinal adicional de afinidade geográfica.

Não é aceito chamar R$13,64 de CPA por venda: as conversões misturam WhatsApp e Stripe. O sinal comercial informado pelo proprietário está separado em `COMMERCIAL-SIGNAL-LAKE-BUENA-VISTA-2026-08-19.md` e ainda precisa de chaves transacionais.

## Informações já cobertas no projeto

- WhatsApp aberto não equivale a venda ou lead qualificado.
- As cinco compras Stripe e o valor 2.237,89 precisam de conciliação de moeda e transação.
- Search terms são parciais e não representam o universo completo.
- Perda de impressão por rank é maior que por orçamento.
- Airbnb não teve entrega; zero impressão não prova baixa qualidade.
- Search Partners, Display, broad, AI Max, expansão de URL e autoaplicação devem permanecer desligados.
- Sitelinks de blog já foram redirecionados em 16/08; a auditoria externa não deve fazer esse estado regredir.
- Negativas devem ser exatas, no nível mínimo e verificadas contra intenção válida.
- Lake Buena Vista é prioritária para observação, não para escala automática.
- Nenhuma mudança de meta, bidding e orçamento deve ocorrer no mesmo lote.

## Recomendações rejeitadas ou bloqueadas

### tCPA de aproximadamente R$35

**Bloqueado.** O valor de R$33,47 usado como referência é CPA agregado de uma mistura dominada por WhatsApp. Não representa CPA de pedido, margem ou limite econômico. Reduzir o alvo agora pode restringir justamente o tráfego que passou a produzir pedidos premium.

Qualquer mudança de tCPA continua posterior ao Gate B, ao fechamento dos pedidos recentes e a um changeset com baseline, stop-loss e rollback.

### Valor aproximado de R$58 para cada WhatsApp open

**Rejeitado no estado atual.** O valor foi derivado de taxa contato→compra e ticket ainda não reconciliados. A abertura do WhatsApp pode não gerar mensagem, e o valor esperado muda por região, serviço, ticket, gorjeta, cancelamento e margem.

Não atribuir valor ao WhatsApp nem migrar para value bidding antes de existir uma amostra durável e deduplicada de `open → conversation → qualified → confirmed → paid/refunded`.

### Negativas chamadas de “risco nulo”

**Rejeitada a classificação de risco nulo.** Dry-cleaning, laundromat, espanhol e concorrentes podem ser linguagem imprecisa de hóspedes. A receita zero exibida não prova ausência de pedidos quando search terms e atribuição são parciais.

Permanecem apenas como candidatas exatas, condicionadas à matriz de serviços, conflito de keywords, reconciliação e aprovação.

### Conversões otimizadas nas duas ações

**Bloqueado.** Não ativar enhanced conversions sem fluxo de consentimento, dados elegíveis, política de privacidade, hashing/normalização, dedupe e teste ponta a ponta. WhatsApp open não deve receber dados pessoais apenas para aumentar match rate.

### “A landing não é gargalo”

**Não comprovado.** Uma taxa de conversão atribuída a uma pequena seleção de temas não isola o efeito da landing nem mede lead final, velocidade, abandono ou margem. A landing está coerente com a oferta atual, mas continua sujeita a QA e experimentação controlada.

### “Maioria do tráfego são moradores locais”

**Não comprovado.** Buscas genéricas não identificam residência. Um hóspede pode pesquisar `laundry near me`. A copy e a qualificação devem separar o público antes de usar negativas amplas.

## Conflitos e verificações pendentes

1. **RSA Express:** a auditoria externa transcreve uma descrição com duração Express antiga inferior a 8h; o arquivo canônico local e a landing usam 8h sujeito à disponibilidade. Verificar o RSA live antes de qualquer copy change.
2. **Valor Stripe:** confirmar se 2.237,89 é valor convertido corretamente para BRL ou moeda incorreta.
3. **Cinco compras:** reconciliar payment IDs, refunds, order IDs, click IDs e pedidos fechados fora do Stripe.
4. **Asset de nome da empresa:** confirmar ao vivo se permanece reprovado e qual o motivo antes de corrigir.
5. **Sitelinks:** manter como autoridade o estado live pós-limpeza de 16/08; não repetir a alegação histórica de que continuam apontando ao blog.
6. **Desperdício:** não adotar 66%, 37% ou R$900 como perda financeira até existir receita/margem por termo reconciliada.

## Decisão consolidada

- O diagnóstico central do projeto permanece: há demanda real e a mensuração não representa corretamente pedidos pagos.
- O delta novo melhora a prioridade de keywords, mas não libera mutações.
- Lake Buena Vista continua como segmento prioritário de observação e futuro challenger, não campanha separada imediata.
- O Gate B continua sendo o primeiro movimento.
- Nenhuma recomendação externa altera orçamento, tCPA, metas, negativas, anúncios ou estrutura sem diff e aprovação explícita.
