# Auditoria Claude — adjudicação WhatsApp-first

**Conta:** A7 Laundry - 01 (`290-113-2891`)  
**Data da adjudicação:** 2026-08-24  
**Artefato analisado:** `71a7a261-585f-4318-83a4-bd92e606546c`, “A7 Laundry — Raio-X de 30 dias”  
**Janela do artefato:** 2026-07-25–2026-08-23, fuso da conta GMT-3, moeda BRL  
**Autoridade operacional nova:** o proprietário confirmou que todo cliente precisa iniciar a jornada no WhatsApp antes de receber o link de pagamento.

## Veredito

O relatório é útil como mapa de investigação, mas não pode ser aplicado como plano de mutação. Ele mistura 47 cliques no WhatsApp com 11 compras Stripe, depois usa a ausência de receita Stripe por segmento para prescrever cortes de horário, dia, dispositivo, cidade e keyword. Esse desenho perde vendas cujo pagamento sai do WhatsApp e não preserva a mesma sessão atribuível.

A correção anterior `WhatsApp secondary / Stripe primary` foi revertida na conta depois da confirmação do funil real:

- `A7 - WhatsApp click (site)`: **principal**, categoria Contato, uma por clique, sem valor inventado;
- `A7 Guest Laundry - Stripe purchase`: **secundária**, preservando valor e contagem em `Todas as conversões`;
- nenhuma campanha, orçamento, lance, keyword, anúncio, faturamento ou entrega foi alterado nessa correção.

Essa configuração ainda usa um proxy imperfeito: clique não prova mensagem enviada. O sinal-alvo futuro é `conversa iniciada → lead qualificado`, importado com chave de atribuição deduplicada. Até esse elo existir, o clique de WhatsApp é o único sinal nativo que representa a entrada obrigatória do funil.

## Hierarquia de resultados

| Estágio | Uso atual | O que não pode significar |
| --- | --- | --- |
| Clique no WhatsApp | Primary de aquisição; proxy de entrada | Venda, conversa ou lead qualificado |
| Conversa iniciada | Medição operacional pendente | Compra |
| Lead qualificado | Futuro primary ideal por importação offline | Receita sem pedido |
| Pedido/pagamento Stripe | Secondary financeiro e reconciliação | Cobertura integral do funil de mídia |
| Receita e margem reconciliadas | Decisão de escala | Conversão atribuída sem chave transacional |

## Adjudicação dos 13 problemas do artefato

| Item | Decisão | Razão e próxima ação válida |
| --- | --- | --- |
| P01 — Google compra cliques, não clientes | **Parcialmente aceito, solução substituída** | A mistura de estágios era real. Stripe-only também erra o funil. WhatsApp permanece primary sem valor; Stripe vira secondary; construir importação de conversa/lead qualificado. |
| P02 — cortar dom/seg/sáb | **Bloqueado** | O “R$0 de receita” depende do subconjunto Stripe e de 11 compras. Auditar SLA e reconciliar conversas/pedidos por dia antes de excluir entrega. |
| P03 — reduzir 14h–20h e madrugada; aumentar manhã/noite | **Rejeitado como ajuste imediato** | Smart Bidding já usa hora/local no leilão e ignora ajustes manuais de agenda. Uma agenda restrita excluiria tráfego. O painel atual cita Orlando em fins de semana e Lake Buena Vista em dias úteis entre seus sinais; aguardar nova janela WhatsApp-first. |
| P04 — QS 3 de `wash and fold near me` | **Aceito como diagnóstico** | Separar intenção genérica, RSA e message match é experimento válido; não pausar nem prometer economia de CPC antes de uma janela pós-correção. |
| P05 — termos sem conversão e poucas negativas | **Aceito como fila, não como lista automática** | Dry cleaning, marcas, espanhol e “near me” podem incluir hóspedes. Avaliar negativas exatas contra a matriz de serviço e as conversas qualificadas; nenhuma negativa foi aplicada. |
| P06 — termos ocultos por privacidade | **Fato aceito** | Correspondência exata aumenta controle, mas não torna o inventário completo nem prova desperdício. Testar por grupo, sem migração ampla. |
| P07 — saldo baixo | **Fato operacional** | Em 24/08 o painel mostrou R$783,78 após aporte de R$650. Monitorar continuidade; nenhum aporte ou mudança de billing foi feito nesta adjudicação. |
| P08 — um RSA recebe todo o tráfego | **Aceito como experimento futuro** | Segundo RSA/challenger precisa de hipótese, diff, janela estável e métrica WhatsApp-first. A alegação genérica de +5–15% CTR não é previsão da conta. |
| P09 — cortar desktop/tablet/Davenport/Citrus Ridge | **Rejeitado** | Amostra pequena e receita Stripe incompleta. Smart Bidding já usa dispositivo e localização; ajustes manuais de local não são suportados em tCPA e dispositivo -100% seria exclusão. |
| P10 — ligações sem conversão | **Verificação aceita** | O número diferente pode ser encaminhamento do Google. O funil público é WhatsApp/SMS; manter chamadas fora da decisão de escala e testar rastreamento separadamente antes de qualquer remoção. |
| P11 — sem públicos/remarketing | **Aceito com gate de privacidade e volume** | Criar observação somente com consentimento, política, retenção e limiar mínimo. Não ativar campanha de remarketing nem enhanced conversions automaticamente. |
| P12 — fuso Brasília | **Aceito e já documentado** | Relatórios horários usam GMT-3; converter por data para America/New_York. A diferença não autoriza dayparting. |
| P13 — Airbnb, display path, `{ignore}`, telefone e landing | **Quase todo já coberto** | Airbnb zero volume já estava registrado; display path não precisa ser URL real; UTMs e A7 Ref passam preflight; número de anúncio exige confirmar encaminhamento; landing foi reconstruída depois da janela do relatório. |

## O que realmente entra no plano

1. Manter WhatsApp como primary de entrada, sem valor modelado.
2. Manter Stripe como secondary financeiro; preservar evento, valor e `A7 Ref` para reconciliação.
3. Implantar o próximo elo mensurável: `whatsapp_click → conversation_started → qualified_guest_lead → order → paid/refunded`.
4. Classificar cada conversa por `hotel/resort`, `Airbnb/vacation rental`, `resident`, `outside coverage`, região, prazo e outcome.
5. Reavaliar keywords, dia, hora, dispositivo e geografia somente após uma janela completa pós-correção com leads qualificados.
6. Priorizar challenger de intenção hotel/Lake Buena Vista e melhoria de QS, mas como experimento isolado, não reestruturação em lote.
7. Não aplicar Display expansion, PMax, broad, negativas amplas, dayparting, cortes geográficos ou alteração de tCPA com base neste artefato.

## Gate de decisão

Uma mudança de mídia por segmento exige, no mínimo:

- definição do denominador (`click`, `conversation`, `qualified`, `paid`);
- amostra pós-correção e atraso de conversão maturado;
- reconciliação com pedido real e status de pagamento/refund;
- capacidade operacional e SLA no período;
- diff isolado, baseline, stop-loss e rollback.

O Google informa que Smart Bidding considera dispositivo, localização e hora em cada leilão e não usa ajustes manuais de local/agenda; uma programação de anúncios, por outro lado, exclui rigidamente os horários definidos. Também informa que mudanças de meta precisam de tempo de aprendizado. Fontes oficiais: [Smart Bidding](https://support.google.com/google-ads/answer/7065882), [bid adjustments](https://support.google.com/google-ads/answer/2732132), [primary and secondary actions](https://support.google.com/google-ads/answer/11461796) e [changing conversion goals](https://support.google.com/google-ads/answer/14571185).

## Estado final verificado

- WhatsApp: `Contatos, Ação principal`, confirmado após salvar e recarregar.
- Stripe: `Compras, Ação secundária`, confirmado após salvar e recarregar.
- Enhanced conversions: não configuradas.
- Saldo observado: R$783,78; alerta de saldo baixo continua visível.
- Alterações adicionais: nenhuma.

