# Google Ads — correção WhatsApp-first

**Conta:** A7 Laundry - 01 (`290-113-2891`)  
**Aplicada e verificada:** 2026-08-24  
**Motivo:** o proprietário confirmou que toda venda começa obrigatoriamente no WhatsApp; o link Stripe é enviado depois dessa conversa e não representa, sozinho, a entrada atribuível do funil.

## Estado anterior temporário

Na mesma data, uma leitura purchase-led havia mudado o WhatsApp para secondary e mantido Stripe primary. A ação e o rollback permanecem no ledger como histórico imutável; não representam mais o estado atual.

## Estado atual

| Ação | Estado verificado | Uso correto |
| --- | --- | --- |
| `A7 - WhatsApp click (site)` | `Contatos, Ação principal` | Proxy de entrada obrigatória; usado para lances e coluna Conversões |
| `A7 Guest Laundry - Stripe purchase` | `Compras, Ação secundária` | Receita observacional em Todas as conversões; reconciliação, não aquisição |

Ambas as configurações foram salvas e confirmadas após recarregar suas páginas individuais. O WhatsApp permanece com contagem de uma conversão por clique, janela de 90 dias e sem valor atribuído. Stripe preserva valor dinâmico, contagem de todas as conversões e janela de 90 dias.

## Limite semântico

`whatsapp_click` não é venda, conversa nem lead qualificado. Ele é usado agora porque representa a única entrada nativa obrigatória e mensurável do funil. O substituto ideal é um evento deduplicado de conversa iniciada ou lead qualificado, importado depois de existir integração operacional confiável.

Stripe não foi removido. O evento continua sendo emitido somente após sessão paga verificada pelo servidor e mantém seu valor para análise financeira. A mudança apenas impede que um subconjunto de pagamentos com continuidade de sessão incompleta governe a aquisição.

## Rollback

Se o funil mudar para checkout direto, ou se a importação de lead qualificado/pedido reconciliado se tornar estável, reavaliar a composição das metas em um changeset isolado. Não voltar a Stripe-primary só porque a compra é um estágio mais fundo; primeiro provar que ele cobre o caminho real de aquisição sem viés de sessão, navegador ou pagamento enviado pelo WhatsApp.

## Escopo da mutação

Somente as duas configurações de otimização acima foram alteradas. Campanha, orçamento, tCPA, keywords, anúncios, assets, agenda, geografia, billing, saldo e entrega permaneceram intactos.

