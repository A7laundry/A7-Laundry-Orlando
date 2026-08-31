# Auditoria das evidências operacionais em Downloads

Data: 2026-08-18  
Modo: somente leitura  
Privacidade: relatório anonimizado; nomes, telefones, quartos e endereços individuais foram omitidos.

## O que os artefatos comprovam

Os invoices, pickup orders e delivery labels demonstram uma operação de guest laundry de padrão elevado:

- atendimento efetivo em hotéis e resorts premium dos corredores Disney, Universal, Bonnet Creek, International Drive e Lake Buena Vista;
- handoff operacional em lobby, front desk, concierge ou bell desk;
- Standard 24h e Express 8h;
- wash, dry & fold por peso;
- cuidado customizado por peça em alguns pedidos;
- comunicação em inglês, francês, português e espanhol em diferentes materiais;
- pagamento por cartão/link, Zelle ou dinheiro em diferentes versões;
- confirmação de pickup, janela de devolução, etiquetas por hóspede e instruções ao motorista.

Isso sustenta o posicionamento de conveniência premium e a prioridade em hóspedes já instalados em hotéis. Os documentos não comprovam, porém, aquisição pelo Google Ads nem pickup real em até uma hora.

## Preços observados

- Standard: US$3,25/lb aparece de forma recorrente.
- Express: US$3,95/lb aparece de forma recorrente.
- Mínimo: aparecem US$45 e US$60; uma peça residencial indica ausência de mínimo.
- Alguns pedidos ultrapassam amplamente o mínimo e incluem cuidado especial por peça.

Os rates por libra são consistentes. A regra de mínimo não é consistente.

## Falhas de integridade documental

Os arquivos são imagens geradas/revisadas em sequência e contêm versões intermediárias. Não devem ser contados como transações únicas.

| Identificador visível | Inconsistência observada |
| --- | --- |
| Invoice 61 | Aparece em contextos de hotel/serviço diferentes e com totais de US$45, US$60 e US$125,22. |
| Invoice 87 | Aparece em mais de um hóspede/contexto, com Standard/Express e totais como US$43 e US$226,25. |
| Invoice 110 | Aparece em hotéis, idiomas e serviços diferentes, com totais de US$60, US$65,29 e US$69,24. |
| Invoice/label 136 | O mesmo identificador aparece associado a hotéis diferentes. |
| Pickup 128 | Existem variantes Standard e Express do material. |
| Contato | O telefone oficial aparece na maioria das peças, mas há peças com outro telefone no rodapé. |
| Datas | Há pelo menos um caso em que o dia da semana escrito não corresponde à data do calendário. |

Essas diferenças podem representar correções de layout, reemissão, templates ou erros. Sem um registro transacional externo, não é possível determinar qual imagem é final.

## Conclusão de reconciliação

Os arquivos de Downloads são evidência **qualitativa forte** da operação e do público atendido, mas evidência **quantitativa insuficiente** para reconciliar as cinco compras do Google Ads.

Não é seguro:

- contar imagens como pedidos;
- somar os totais das imagens;
- usar invoice number como chave única;
- inferir origem Google Ads;
- inferir status pago;
- inferir SLA real a partir do texto prometido na peça.

## Fonte necessária para o ledger de fundo de funil

Para cada transação/pedido, a fonte autoritativa precisa fornecer:

`order_id único | stripe_payment_intent/session | status pago/reembolsado | created_at | hotel/corredor anonimizado | serviço | valor USD | source/UTM | gclid/gbraid/wbraid | WhatsApp qualificado | pickup confirmado | entregue_at`.

Fontes aceitáveis, em ordem:

1. export Stripe de pagamentos concluídos/reembolsados;
2. tabela transacional do MOS/CRM com chave única e status;
3. extrato de pagamento reconciliado com order ID;
4. ledger manual assinado, somente quando preservar a chave da transação e o status.

`A7 Ref` e invoice image podem complementar a linha, mas não substituir payment ID/click ID.

## Implicação para Google Ads

Até existir essa reconciliação:

- as 5 compras são eventos de plataforma ainda não reconciliados;
- as 33 aberturas de WhatsApp não são leads finais;
- decisões de keyword devem permanecer provisórias;
- WhatsApp não deve ser removido abruptamente do bidding, mas também não pode ser chamado de venda;
- nenhum claim de pickup em uma hora deve ser publicado a partir destes arquivos.

