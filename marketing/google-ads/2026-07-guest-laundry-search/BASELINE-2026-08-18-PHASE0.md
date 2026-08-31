# Baseline ao vivo — Fase 0 Google Ads

Data da verificação: 2026-08-18  
Modo: somente leitura  
Conta: A7 Laundry - 01 (`290-113-2891`)  
Campanha: `A7 | Search | Guest Laundry | Orlando | EN | JUL26` (`24072699595`)

## Estado confirmado ao vivo

| Item | Estado observado |
| --- | --- |
| Campanha | Ativada; Qualificada (limitada) |
| Motivo exibido | Limitada pelo volume de pesquisas |
| Tipo | Pesquisa |
| Orçamento | R$150/dia |
| Estratégia | CPA desejado |
| tCPA nos ad groups | R$49,25 |
| Pontuação de otimização | 71,9% |
| Fuso da conta | GMT-03:00, Brasília |
| Saldo disponível | R$488,91 |
| Último pagamento | R$500 em 2026-08-18, Pix manual |
| Atividade de 2026-08-18 | 6 cliques; custo R$140,24 |

O saldo corresponde a aproximadamente 3,26 orçamentos diários completos se a campanha consumir R$150/dia. Pagamento ou alteração de cobrança não fez parte desta auditoria.

## Janela de performance exibida

Período do painel: 2026-07-19 a 2026-08-17.

| Métrica | Valor |
| --- | ---: |
| Impressões | 2.997 |
| Cliques | 163 |
| CTR | 5,44% |
| CPC médio | R$13,01 |
| Custo | R$2.121,01 |
| Conversões agregadas | 38 |
| Taxa de conversão agregada | 23,31% |
| Custo/conversão agregado | R$55,82 |

## Composição live das conversões

| Ação | Origem | Otimização | Contagem | Janela | Incluída nas metas | Todas as conversões | Valor |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| A7 Guest Laundry - Stripe purchase | Site | Principal | Todas | 90 dias | Sim | 5 | 2.237,89 |
| A7 - WhatsApp click (site) | Site | Principal | Uma | 90 dias | Sim | 33 | 0 |
| Calls from ads | Chamada a partir de anúncio | Principal | Todas | 30 dias | Sim | 0 | 0 |
| A7 - Website call 60s | Site | Principal | Uma | 30 dias | Sim | 0 | 0 |

O Google Ads está somando 5 compras e 33 aberturas de WhatsApp como 38 conversões. Assim, 86,8% do sinal contabilizado é abertura de contato, não pedido ou lead qualificado. O custo bruto por compra conhecida seria R$424,20, mas esse cálculo ainda não prova CAC atribuído: as cinco compras precisam ser reconciliadas com Stripe, pedidos e identificadores de clique.

## Estrutura e entrega

| Ad group | Status | Impressões | Cliques | Custo | Conversões agregadas |
| --- | --- | ---: | ---: | ---: | ---: |
| Hotel Guest Laundry | Ativado | 2.997 | 163 | R$2.121,01 | 38 |
| Airbnb Guest Laundry | Ativado | 0 | 0 | R$0 | 0 |

Toda a entrega observada está concentrada em `Hotel Guest Laundry`. A estrutura live tem dois ad groups, embora `campaign-spec.yaml` descreva uma estrutura histórica com quatro grupos. O estado live é a autoridade para qualquer diff futuro.

## Histórico relevante

- 2026-08-16 11:21:12: orçamento da campanha aumentado; snapshot anterior registra R$100 → R$150/dia.
- 2026-08-16 11:33–11:34: três recursos foram alterados; o snapshot anterior identifica a limpeza dos sitelinks.
- 2026-08-13 09:00: recomendação de CPA desejado aplicada e campanha alterada.
- Não foram observadas mudanças posteriores de campanha no histórico carregado até 2026-08-17.

## Configurações e anúncios

A auditoria detalhada está em `LIVE-CAMPAIGN-SETTINGS-AUDIT-2026-08-18.md`. Em resumo: somente Pesquisa Google; parceiros e Display desligados; presença física; expansão de URL, personalização de texto, recursos automáticos, broad e autoaplicação desligados; UTMs configuradas; auto-tagging ativo; nenhuma negativa em nível de conta. O RSA Hotel é o único com entrega e está alinhado ao Standard, mas não posiciona claramente Express/VIP. Um challenger não executável está em `RSA-CHALLENGER-HOTEL-EXPRESS-DRAFT.md`.

## Negativas confirmadas ao vivo

A aba `Palavras-chave negativas` exibia 15 itens, todos adicionados diretamente à campanha. Não foi observada, nessa tela, associação a lista compartilhada.

| Negativa | Correspondência | Avaliação inicial |
| --- | --- | --- |
| `24 hour laundromat` | Frase | Manter sob revisão; pode capturar hóspede buscando conveniência 24h |
| `coin laundry` | Frase | Coerente se a campanha Guest não atende autosserviço |
| `commercial laundry equipment` | Frase | Alta confiança; intenção de equipamento |
| `do it yourself laundry` | Frase | Coerente se autosserviço não é oferecido |
| `dryer repair` | Frase | Alta confiança; reparo |
| `free laundry` | Frase | Alta confiança para posicionamento premium |
| `laundromat` | Ampla | **Risco elevado de falso bloqueio; revisar antes de qualquer novo lote** |
| `laundry equipment` | Frase | Alta confiança; equipamento |
| `laundry job` | Frase | Alta confiança; emprego |
| `laundry jobs` | Frase | Alta confiança; emprego |
| `laundry supplies` | Frase | Alta confiança; insumos |
| `nearest laundromat` | Frase | Revisar; a busca visível já aparece como excluída |
| `self service laundry` | Frase | Coerente se autosserviço não é oferecido |
| `washing machine rental` | Frase | Alta confiança; aluguel de equipamento |
| `washing machine repair` | Frase | Alta confiança; reparo |

O maior risco atual é a negativa ampla `laundromat`. Termos visíveis como `public laundry near me` e `laundromats close to my location` registraram conversões de plataforma, ainda sem prova de venda. Não remover nem ampliar esse bloqueio sem reconciliar os cliques e simular conflitos.

## Bloqueadores para mudança

1. A campanha aprende majoritariamente abertura de WhatsApp, enquanto o objetivo é pedido final de funil.
2. Não há, neste pacote, reconciliação dos 5 purchases com pedidos reais, moeda, duplicidade, reembolso e click ID. O auto-tagging está ativo, mas a persistência do GCLID até MOS/Stripe não foi provada.
3. Oferta pública canônica e artefatos operacionais divergem sobre pedido mínimo.
4. “Pickup em até 1 hora” foi informado pelo proprietário, mas não está autorizado nas fontes públicas canônicas e não possui regra operacional documentada.
5. Há páginas públicas antigas com “no minimum” e/ou promessa absoluta de Express 8h.
6. O orçamento e o tCPA foram alterados recentemente; uma nova mudança simultânea impediria atribuição causal.
7. O fuso de Brasília precisa ser convertido por data para Orlando antes de qualquer dayparting.
8. A negativa ampla `laundromat` pode bloquear consultas de hóspedes que usam linguagem genérica; seu impacto real ainda não foi reconciliado.
9. A landing captura click IDs e gera `A7 Ref`, mas a referência do payment link é opcional/manual e não há vínculo MOS/pedido comprovado; veja `ATTRIBUTION-CHAIN-AUDIT-2026-08-18.md`.
10. A campanha veicula 24/7 e 95,1% dos cliques são de smartphones. Cidade, dispositivo e hora continuam sem pedido final reconciliado; veja `GEO-DEVICE-SCHEDULE-AUDIT-2026-08-18.md`.

## Confirmação de integridade

Nenhum objeto da conta foi alterado. Não houve `mutate`, aplicação de recomendação, mudança de meta, orçamento, lance, status, keyword, negativa, anúncio, asset, localização, agenda, faturamento ou pagamento.
