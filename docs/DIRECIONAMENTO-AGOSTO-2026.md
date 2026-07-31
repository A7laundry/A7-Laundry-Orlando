# Direcionamento — Agosto de 2026

**Data:** 2026-07-30 · **Revisão 3 em 2026-07-31** (reconciliação direta das 19 threads)
**Natureza:** experimento operacional controlado. Não é plano de escala.
**Fontes:** Meta Ads (API oficial), GA4, GSC, Google Ads, leitura de 19 conversas de WhatsApp

---

## O que a evidência sustenta — e o que não sustenta

### Sustenta

**Há um vazamento real, menor que o primeiro relatório afirmou.** A reconciliação das 19 threads
separou 12 leads novos, 3 recompras e 4 contatos fora do funil. Entre os 12 leads, três falhas de
atendimento são confirmadas (Marco, pressing e `·963-2601`) e um caso respondido por áudio ainda
precisa de classificação. Portanto, a faixa observada é **3/12 a 4/12 = 25,0%–33,3%**, não 47,4%.

Essa amostra não foi aleatória; intervalo binomial não transforma a taxa em estimativa da
população. A evidência basta para corrigir o processo, não para extrapolar dinheiro perdido.

### NÃO sustenta

Três afirmações da versão anterior deste documento foram retiradas:

| Afirmação retirada | Por quê |
|---|---|
| "O anúncio nunca foi o problema" | Atendimento é um gargalo comprovado na amostra. Mídia, oferta, preço e público **não foram absolvidos** — apenas não foram testados. |
| "5,7x é o multiplicador disponível" | Cenário otimista, não projeção. Com o intervalo real do fechamento, a faixa é de **3,3 a 25,4 pedidos**. O 11,3 isolado não informa nada. |
| "Com recompra, agosto lucra" | **Falso.** Ver abaixo. |

---

## A correção que inverte a conclusão

A versão anterior tratou ROAS bruto de 1,03x como ponto de equilíbrio. **ROAS bruto não é
equilíbrio econômico** — receita não é contribuição.

| Cenário | Receita | ROAS bruto | Contribuição a 50% − gasto |
|---|---:|---:|---:|
| 11,3 pedidos (sem recompra) | US$ 925 | 1,03x | **−US$ 437** |
| 17 pedidos (com recompra) | US$ 1.391 | 1,55x | **−US$ 204** |

Para o mês empatar seria preciso:

- com 11,3 pedidos → margem de contribuição de **97,3%** (impossível)
- com 17 pedidos → margem de **64,7%**
- com margem de 50% → **22 pedidos**, não 17

**Nenhum cenário projetado fecha a conta.** A conclusão correta não é "agosto lucra com
recompra". É: **agosto não tem como lucrar nos números conhecidos, e por isso deve ser tratado
como mês de medição, não de retorno.**

---

## Erros corrigidos nesta revisão

| # | Erro | Correção |
|---|---|---|
| 1 | "9 de 19 leads foram ignorados" | As 19 threads continham **12 leads novos, 3 recompras e 4 contatos fora do funil**. Falhas confirmadas: **3/12**; um caso por áudio segue incerto |
| 2 | "3 áudios ignorados" | Falso: um era contato automotivo, um recebeu resposta em áudio no mesmo dia e um era conversa iniciada pela A7 |
| 3 | "7 cotados / 28,6%" | Há **8 cotados**: 6 sem pedido confirmado + 2 pedidos novos. Fechamento descritivo: **2÷8 = 25,0%**, IC 95% **7,1%–59,1%** |
| 4 | "Funil 3x melhor" | Compara todos os leads com o subconjunto selecionado que chegou à cotação. Não é ganho causal |
| 5 | "CAC de US$ 70,31" | É CAC **contrafactual**, não observado. Vale só se todo lead for cotado e a taxa se mantiver |
| 6 | "Impacto de US$ 906" | Soma gasto afundado (US$ 419) com receita bruta hipotética (US$ 487). Economicamente inválido. O correto é **contribuição perdida**, ainda desconhecida |
| 7 | "Dois cálculos independentes" | Falso. Ambos reutilizam gasto, CPA, fechamento e ticket |
| 8 | US$ 899,61 como gasto mensal | É o total de **maio a julho**. Agosto a US$ 30/dia custaria **US$ 930** |
| 9 | ROAS de julho 0,86x | US$ 491 ÷ US$ 899,61 = **0,55x**. O 0,86x usava outro denominador. Sem pareamento temporal, não há ROAS válido |
| 10 | "Sem recompra empata" | Perde **US$ 437** com margem de 50% |
| 11 | "Com recompra lucra" | Perde **US$ 204** com margem de 50% |
| 12 | "CAC cai para US$ 52,95" | Recompra não reduz CAC de aquisição. É **custo de mídia diluído por pedido**. O CAC dos novos segue US$ 79,43 |
| 13 | "50% de recompra" | Ambíguo. O cálculo assumia 0,5 pedido extra por cliente = **33,3% dos pedidos**, não 50% |
| 14 | "US$ 410 recuperáveis em follow-up" | Assumia 100% de conversão. Receita e contribuição recuperáveis são desconhecidas |

---

## O ponto cego: os denominadores

O erro estrutural da versão anterior foi misturar populações. "Atendido", "cotado", "pedido" e
"cliente novo" apareciam na mesma linha vindos de amostras diferentes.

**Definições que passam a valer. Nenhum número neste projeto pode ser reportado sem dizer a
qual destes se refere.**

| Termo | Definição operacional |
|---|---|
| `lead` | Primeira mensagem recebida de um número novo no período |
| `lead elegível` | Dentro da área, serviço disponível, não é spam/emprego/engano |
| `atendido` | Recebeu resposta humana útil (saudação automática **não** conta) |
| `cotado` | Recebeu preço explícito para o caso dele |
| `pedido` | Coleta confirmada **e** pagamento recebido |
| `cliente novo` | Primeiro pedido na história |
| `recompra` | Pedido de quem já tinha pedido anterior |
| `contribuição` | Receita − lavagem/secagem − embalagem − taxa de pagamento − combustível − mão de obra variável |

Sem um **identificador único por lead** ligando origem → elegibilidade → cotação → pedido →
receita → contribuição → recompra, qualquer ROAS continuará sendo montagem de populações
diferentes.

---

## Agosto — experimento controlado

Agosto **não vai provar que o negócio é lucrativo**. Os números conhecidos não permitem isso.
Agosto vai produzir os dados que hoje não existem.

### Semana 1 — corrigir antes de gastar

1. ~~Definir o mínimo oficial~~ → ✅ **US$ 50** (2026-07-30). O site já estava correto em 104
   arquivos / 357 ocorrências — nenhuma mudança de código foi necessária.
   ✅ Os dois assets aprovados do WhatsApp foram validados visualmente em 2026-07-31: o card
   Everyday mostra **$50 minimum order** e o card Special não publica mínimo.
2. **Contribuição preliminar por serviço** — levantamento grosseiro serve; zero não serve.
3. **Confirmar o número oficial** no destino de todos os anúncios.
4. ✅ **Operação WhatsApp definida:** 24/7; Dennis responsável; A7 Laundry — Backup 1 acionado
   após 5 minutos sem resposta humana; cobertura de até 40 km de Orlando.
5. **Ler e classificar as conversas restantes** — sem extrapolar; as 19 originais já foram
   reconciliadas em 12 leads, 3 recompras e 4 exclusões.
6. **Criar o registro por lead** com identificador único.
7. ✅ **Encerrar o histórico sem recuperação:** por decisão do owner, os leads antigos não serão
   contatados. Usar a reconciliação somente como baseline e começar o fluxo limpo daqui em diante.

### Semana 2 — aquisição sob controle

- Meta com teto de **US$ 30/dia**, sem aumento
- **Só veicular enquanto atendimento e capacidade estiverem verdes**
- Separar `lead` / `elegível` / `cotado` / `perdido` com motivo padronizado
- Registrar fonte, ticket, libras, custos e contribuição por pedido
- **Não exigir 25% de fechamento** — reportar a taxa observada com intervalo

### Semana 3 — oferta e retenção

- Testar a escada do pedido mínimo
- Separar turista, residente e B2B — são funis diferentes
- Reativação da base antiga como **experimento próprio**
- **Não usar essa reativação como LTV da coorte de agosto** — os clientes que voltaram em julho
  foram adquiridos em 2025; medir recompra exige coorte

### Semana 4 — decisão

---

## SLA realista

A operação será declarada 24/7. Para que isso não vire somente promessa pública, o controle
interno usa escalonamento entre responsável e backup:

| Regra | Alvo |
|---|---|
| Confirmação automática imediata | 100% |
| Resposta humana 24/7 | alvo em até 5 min; acionar Backup 1 ao estourar 5 min |
| Leads classificados até o fim do dia | 100% |
| Lead com mais de 24h sem tratamento | **Zero — alarme crítico** |
| Cotação | > 90% dos **elegíveis** (não do total) |

---

## Gates para escalar em setembro

Escalar só com **todos** presentes:

- [ ] Contribuição por pedido positiva e reconciliada
- [ ] CAC de clientes novos atribuível a fonte
- [ ] Pelo menos **30–40 cotações elegíveis** acumuladas
- [ ] Capacidade operacional disponível e medida
- [ ] SLA de atendimento cumprido
- [ ] Evidência de que oferta e público não estão destruindo conversão

Base estatística necessária: ~35 cotações dão ±15 pontos de precisão; ~79 dão ±10.
Com 8 cotações, a precisão atual continua ampla (IC 95% 7,1%–59,1%) — inutilizável para escala.

---

## Sazonalidade — ressalva

A revisão independente apontou que agosto **não** é pico em Orlando: ~6,46% da receita turística
anual contra 7,58% em julho e 8,56% em junho, com ocupação hoteleira de 62,9% em agosto de 2023.

⚠️ **Não verifiquei essas fontes de forma independente.** Se forem corretas, reforçam a decisão
de não escalar em agosto. Vale confirmar antes de usar como argumento.

---

## O que NÃO fazer

- **Não aumentar orçamento** antes da contribuição conhecida
- **Não gastar automaticamente os US$ 30/dia** — só com atendimento e capacidade verdes
- **Não trocar criativo** — não há evidência de que seja o gargalo, nem de que não seja
- **Não perseguir Learning Limited** — a US$ 30/dia o ad set atinge 23% do limiar
- **Não decidir por CPA de anúncio individual** com menos de 10 conversas
- **Não reabrir Google Ads** — sem fundos, mede chamada em vez de venda
- **Não tratar a correção do atendimento como suficiente** para tornar a mídia viável

---

## O que mudou permanentemente

**O painel.** De CTR, CPM e custo por conversa para: leads sem resposta, % de elegíveis cotados,
fechamento com intervalo, contribuição por pedido, recompra por coorte.

**A ordem das perguntas.** Antes de "o anúncio está caro?", perguntar "o que acontece com quem
responde ao anúncio?".

**O critério de decisão.** Nenhuma decisão de mídia sem contribuição por pedido conhecida.

**O rigor com denominadores.** Todo número reportado declara sua população e seu intervalo.

---

## Referências

| Documento | Conteúdo |
|---|---|
| `docs/audits/2026-07-30-audit-consolidado.md` | Dados brutos de mídia, GA4, GSC, Google Ads |
| `marketing/AUDITORIA-WHATSAPP-2026-07-30.md` | Leitura das conversas ⚠️ contém os erros 3, 5, 6 |
| `marketing/PLAYBOOK-ATENDIMENTO.md` | Sistema de prevenção em 5 camadas + templates |
| `marketing/OPERACAO-FUNIL.md` | Instrumento de medição |
| `marketing/data/semanal.csv` | Baseline e acompanhamento |
