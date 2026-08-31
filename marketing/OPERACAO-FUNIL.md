# Operação do funil — instrumento de medição

**Criado:** 2026-07-30
**Propósito:** responder a única pergunta que importa hoje —
*"Coloquei US$ 100 em anúncio. Quanto sobrou no caixa depois de atender os pedidos gerados?"*

Enquanto essa pergunta não tiver resposta, otimização de mídia é secundária.

---

## Por que este documento existe

A auditoria de 2026-07-30 mediu bem o topo do funil (custo por conversa, CTR, CPM) e não mediu
nada do que acontece depois. O resultado foi rigor estatístico aplicado à pergunta errada.

O que se sabe:

| | |
|---|---:|
| Custo por conversa | ~US$ 20 |
| Conversas → pedido (estimado) | ~19,4% |
| **Custo por pedido** | **~US$ 100** |
| Ticket médio | US$ 82 |
| **Custo variável por pedido** | **DESCONHECIDO** |

Se o custo variável for zero — impossível — a operação já perde US$ 18 por pedido.
Com custo variável realista de 50%, perde US$ 59 por pedido.

**A campanha atual, pelos números disponíveis, destrói caixa.** Nenhuma otimização de criativo,
placement ou orçamento muda isso. O que muda: taxa de fechamento, ticket, custo variável e
recompra.

---

## 1. Classificação das conversas (fazer primeiro)

Abrir as conversas do WhatsApp do período e preencher uma linha por conversa.
Arquivo de trabalho: `marketing/data/conversas.csv`

| Campo | Valores | Por que importa |
|---|---|---|
| `data` | AAAA-MM-DD | Cruzar com o que estava no ar |
| `anuncio` | A4 PT / A3 EN / Front Desk EN / LA7 / orgânico / indicação / não sei | Atribuição real, feita na mão |
| `tempo_resposta_min` | número | Maior alavanca isolada de fechamento |
| `tipo` | hóspede / residente / host / fora do perfil | Quem realmente compra |
| `dentro_area` | sim / não | Quanto do gasto vai para fora do raio |
| `libras_estimadas` | número ou vazio | Ticket potencial |
| `recebeu_preco` | sim / não | Quantos nem chegaram na oferta |
| `objecao` | preço / prazo / área / sumiu / outro dia / nenhuma | Onde a venda morre |
| `virou_pedido` | sim / não | Resultado |
| `receita` | US$ | Faturamento do pedido |
| `ja_era_cliente` | sim / não | Separar aquisição de recompra |

**O que procurar:** o número de conversas que *nunca receberam preço* e o *tempo de resposta*
das que fecharam versus as que sumiram. É onde costuma estar o dinheiro parado.

---

## 2. Contribuição por pedido (fazer junto)

Sem sistema. Uma linha por pedido em `marketing/data/pedidos.csv`:

```
receita − lavagem/secagem − embalagem − taxa de pagamento − combustível − mão de obra variável = contribuição
```

Exemplo de referência (números a confirmar, não são reais):

| Item | Valor |
|---|---:|
| Receita | US$ 82,00 |
| Lavagem + secagem | ? |
| Embalagem | ? |
| Taxa de pagamento (Stripe ~2,9% + $0,30) | ~US$ 2,68 |
| Combustível (coleta + entrega) | ? |
| Mão de obra variável | ? |
| **Contribuição** | **?** |

**Este é o número mais valioso que a empresa não tem.** Ele define o teto de CAC. Tudo o mais
é derivado dele.

---

## 3. Recompra (a alavanca mais barata)

Com 6 clientes, remarketing pago é desperdício. A ação é conversa direta:

> Hi, [name]. We have pickup availability this week. Would you like us to schedule your laundry again?

Registrar em `marketing/data/recompra.csv`: quem, quando foi o último pedido, respondeu,
recomprou, em quantos dias, qual ticket.

Uma recompra por WhatsApp custa ~US$ 0. Uma aquisição nova custa ~US$ 100.
**Se a taxa de recompra for razoável, ela muda a viabilidade do canal pago inteiro** — porque
o CAC passa a ser amortizado por N pedidos, não por um.

Para turistas a recompra é estruturalmente limitada. O equivalente é indicação e parceria com
anfitriões de Airbnb e recepção de hotel — canal de custo próximo de zero que nunca foi testado.

---

## 4. Oferta e script (antes de gastar mais)

A comunicação precisa responder **antes do clique**, para filtrar curioso:

- US$ 3,25/lb (normal) · US$ 3,95/lb (express)
- **Pedido mínimo US$ 50** — já existe, precisa estar visível no anúncio
- Coleta e entrega incluídas
- Prazo: 24h normal / 8h express (sujeito a disponibilidade)
- Área atendida
- Como funciona em hotel/Airbnb (deixar na recepção)
- Prova social
- CTA: *"Send your hotel and estimated laundry amount."*

Isso provavelmente derruba o CTR. **Isso é desejável.** Menos conversas melhores custam menos
por pedido do que muitas conversas ruins.

---

## 5. O teste — e por que a ordem importa

O teste proposto: **US$ 210 em 7 dias, com todas as conversas registradas.** Critério de sucesso:

> Contribuição dos pedidos atribuídos ao Meta ≥ gasto com Meta

### Aviso quantitativo: com os números de hoje, este teste falha por construção

| Etapa | Cálculo | Resultado |
|---|---|---:|
| Conversas esperadas | US$ 210 ÷ US$ 20 | 10,5 |
| Pedidos esperados | 10,5 × 19,4% | **2,0** |
| Receita esperada | 2,0 × US$ 82 | **US$ 167** |
| Gasto | — | US$ 210 |

**Mesmo com custo variável ZERO — fisicamente impossível — o teste perde US$ 43.**
Com contribuição de 50%, perde US$ 126.

Para o teste empatar, seria preciso uma destas condições:

| Alavanca | Valor necessário | Hoje | Viável? |
|---|---:|---:|---|
| Taxa de fechamento | **~48%** | 19,4% | Difícil, mas é a de maior alavancagem |
| Custo por conversa | **~US$ 8** | US$ 20 | Improvável neste volume |
| Ticket médio | **~US$ 200** | US$ 82 | Só com mudança de mix |
| Contribuição por pedido | **~US$ 105** | ? | Depende do item 2 |

**Conclusão operacional:** rodar o teste *antes* de trabalhar fechamento, oferta e ticket só
queima US$ 210 para confirmar o que a aritmética já indica. O teste é válido — mas como
**verificação depois das melhorias**, não como diagnóstico.

Por isso a ordem dos itens 1–4 antes do 5 não é burocracia. É o que decide se o teste tem
alguma chance de passar.

---

## 6. A alavanca que não foi considerada: pedido mínimo

O mínimo é **US$ 50** e o ticket médio realizado é **US$ 82** — os clientes já compram 64% acima
do mínimo. Isso significa que o mínimo não está sendo o fator limitante do ticket, e que existe
espaço para testá-lo como filtro de qualificação.

Simulação (mantendo a proporção de contribuição do exemplo, ~51%):

| Mínimo | Ticket médio provável | Contribuição/pedido | Pedidos p/ cobrir US$ 210 | Fechamento necessário |
|---:|---:|---:|---:|---:|
| US$ 50 (atual) | US$ 82 | US$ 42 | 5,0 | **48%** |
| US$ 75 | ~US$ 110 | ~US$ 56 | 3,8 | **36%** |
| US$ 90 | ~US$ 120 | ~US$ 61 | 3,4 | **33%** |

Subir o mínimo reduz volume de conversas qualificadas, mas **reduz muito mais a taxa de
fechamento necessária para o canal fechar a conta.** Merece teste — e custa zero para testar,
porque é mudança de copy, não de mídia.

⚠️ Os tickets projetados são estimativa, não dado. Confirmar com a distribuição real de libras
por pedido (item 1) antes de decidir.

---

## Ordem de execução

1. Classificar as conversas do período — quem respondeu, quando, o que travou
2. Identificar quais dos 6 pedidos vieram do Meta de fato
3. Calcular a contribuição real por pedido
4. Acionar recompra dos residentes por WhatsApp
5. Reescrever oferta e script de atendimento
6. Testar pedido mínimo maior no copy
7. Só então rodar o teste de US$ 210 com registro completo
8. Só depois discutir criativo, público e escala

---

## O que deixa de ser prioridade agora

Registrado para não voltar a consumir atenção antes da hora:

- Sair de Learning Limited e o limiar de 50 eventos em 7 dias
- Significância estatística entre anúncios com 1–2 conversas
- Diferença de CTR entre 0,88% e 1,55%
- Escolher criativo vencedor sem vendas atribuídas
- Atribuição no GA4 para anúncios que vão direto ao WhatsApp — a medição tem que ser
  no WhatsApp, não no GA4
- Canal "AI Assistant" com 8 sessões
- Esperar uma data fixa sem mudar o que está sendo medido

Tudo isso volta a importar quando houver um funil medido.
