# CHANGESET-GADS-2026-08-18-A — rascunho bloqueado

Status: **GATE A CONCLUÍDO; GATE B BLOQUEADO / NÃO EXECUTAR**  
Conta: `290-113-2891`  
Campanha: `24072699595`

Atualização de 2026-08-19: o sinal comercial de Lake Buena Vista valida o funil relatado `Google → site → WhatsApp → pedido`, incluindo US$410 recebidos em dois pedidos de 18 de agosto e três novos clientes no dia seguinte. A campanha deve ser preservada durante a reconciliação. O novo sinal não remove o bloqueio do Gate B porque o Ads registrou apenas aberturas de WhatsApp, sem compra/valor, e os pedidos ainda não possuem cadeia técnica individual documentada. Ver `COMMERCIAL-SIGNAL-LAKE-BUENA-VISTA-2026-08-19.md`.

Atualização de 2026-08-20: a auditoria forense e a segunda opinião armazenadas no Drive foram comparadas com o baseline local. O snapshot e a segmentação keyword × ação foram aceitos como evidência adicional; tCPA de ~R$35, valor estimado por WhatsApp open, enhanced conversions e negativas chamadas de “risco nulo” foram bloqueados. Ver `DRIVE-FORENSIC-ADVERSARIAL-DELTA-2026-08-20.md`.

Este documento organiza a sequência de correção. Ele não contém autorização para alterar a conta.

## Princípio do primeiro lote

O primeiro lote não deve aumentar alcance nem trocar várias famílias de controle. A prioridade é transformar a medição em uma representação confiável do funil final sem retirar abruptamente o único sinal de volume disponível para o tCPA.

## Gate A — verdade comercial

Concluído em `CANONICAL-PAID-OFFER-2026-08-18.md` com base na instrução atual do proprietário, no manifesto e na confirmação registrada em 2026-07-22:

| Campo | Estado no repositório | Evidência operacional recente | Decisão necessária |
| --- | --- | --- | --- |
| Standard | US$3,25/lb; ~24h | US$3,25/lb; 24h | Confirmado para planejamento |
| Express | US$3,95/lb; até 8h após confirmação | US$3,95/lb; 8h | Confirmado com ressalva de capacidade |
| Mínimo | US$50 | US$45, US$60 e um caso sem mínimo | US$50 público; demais tratados como exceção privada |
| Pickup em até 1h | Meta informada pelo proprietário | Há materiais com ASAP, mas sem prova de duração real | Claim condicional; nunca garantia absoluta |
| Booking | WhatsApp-first | Pedidos coordenados pela operação | Atendimento online, não self-service integral |

Saída produzida: política comercial datada, com regra padrão e exceções fora da mídia pública.

## Gate B — reconciliação de conversões

Antes de mudar bidding ou metas:

1. Reconciliar as 5 compras exibidas com Stripe e pedidos reais.
2. Confirmar moeda/valor, duplicidade, reembolso e data de cada compra.
3. Identificar quais das 33 aberturas de WhatsApp viraram conversa, lead qualificado, pedido confirmado e pagamento.
4. O auto-tagging está confirmado como ativo. Confirmar preservação de GCLID/GBRAID/WBRAID na landing, WhatsApp, MOS e Stripe ou declarar exatamente onde a cadeia se rompe.
5. Produzir a taxa real `clique → WhatsApp → qualificado → pedido → pago`.

O audit de Downloads confirmou que invoice/order numbers são reutilizados entre versões, hóspedes, hotéis e valores. Portanto, as imagens não podem fechar este gate. É necessário um export Stripe ou ledger MOS/CRM com payment/order ID único e status.

Sem essa tabela, nenhuma keyword pode ser classificada como vencedora apenas pela coluna Conversões.

A adjudicação provisória completa está em `KEYWORD-ADJUDICATION-2026-08-18.md`.
A entrada necessária para fechar o gate está definida em `GATE-B-CONVERSION-RECONCILIATION-SPEC.md`.
O CLI read-only `scripts/reconcile-google-ads-gate-b.mjs` e o template canônico redigido estão preparados e testados; falta somente fornecer o ledger real normalizado.

## Lote A1 proposto — integridade e contenção

Ainda sem valores finais; depende dos Gates A e B.

| ID | Família | Proposta | Risco | Rollback |
| --- | --- | --- | --- | --- |
| A1-01 | Destinos | Garantir que expansão de URL final e assets automáticos não enviem tráfego para páginas com “no minimum” ou Express absoluto | Baixo se apenas desativação confirmada | Restaurar configuração anterior registrada |
| A1-02 | Search terms | Adicionar somente negativas exatas de intenção comprovadamente incompatível e sem conflito | Médio | Remover a negativa pelo ID/lista e validar entrega |
| A1-03 | Ads/assets | Preservar o RSA controle; criar challenger hotel/express alinhado à oferta canônica | Médio | Pausar challenger, mantendo controle intacto |
| A1-04 | Medição | Implantar observabilidade de lead qualificado/pedido pago antes de reclassificar WhatsApp | Alto | Restaurar configuração anterior; validar tags e contagem |

### A1-02 — diff candidato, ainda bloqueado

Negativas exatas candidatas no nível da campanha Guest, condicionadas à confirmação de serviços e à reconciliação:

`[mobile dry cleaning]`, `[same day dry cleaners near me]`, `[dry cleaning near me]`, `[24 hours dry cleaners near me]`, `[dry cleaners lake nona]`, `[1800 dry clean near me]`, `[linen delivery companies]`, `[crown linen laundry]`, `[laundry subscription]`, `[ironing service near me]`.

O lote mínimo absoluto seria somente os seis termos exatos de dry cleaning, e apenas se a operação confirmar que não oferece esse serviço. As negativas live já incluem `laundromat` em correspondência ampla; esse item deve ser auditado por falso bloqueio antes de adicionar qualquer negativa relacionada a self-service/laundromat. Não há autorização para aplicar ou remover nenhum termo nesta versão.

### A1-03 — challenger criativo, ainda bloqueado

O RSA controle `Hotel Guest Laundry` permanece intacto. A proposta de challenger com 15 títulos, quatro descrições, claims condicionais, callouts e sitelinks está em `RSA-CHALLENGER-HOTEL-EXPRESS-DRAFT.md`.

Antes/depois pretendido:

- antes: um RSA Hotel ativo, orientado a Standard, com toda a entrega;
- depois: controle preservado + challenger Hotel Express VIP;
- invariantes: mesma landing canônica, expansão de URL desligada, recursos automáticos desligados, sem mudança simultânea de meta, tCPA, orçamento, negativas ou agenda.

### A1-04 — cadeia de atribuição, ainda bloqueada

A auditoria técnica está em `ATTRIBUTION-CHAIN-AUDIT-2026-08-18.md`. O site captura click IDs e gera `A7 Ref`, e o gerador pode salvar uma referência no metadata Stripe. Porém o preenchimento é opcional/manual, o modo durável live não foi comprovado e não foi encontrada ligação automática com MOS/pedido.

O changeset final deve separar, em lotes próprios:

1. prova/healthcheck do storage durável e migrations versionadas;
2. captura obrigatória de `order_id` + `A7 Ref` no fluxo atribuído;
3. metadata Stripe e reconciliação/webhook idempotente;
4. import de lead qualificado somente depois de consentimento, click ID e dedupe comprovados;
5. transição de Primary/Secondary e bidding apenas em lote posterior.

O lote A1 não inclui aumento de orçamento, troca de tCPA, Broad Match, PMax, Display, Search Partners, AI Max, geo expansion, dayparting ou edição destrutiva do RSA vencedor.

Também não inclui atribuir valor probabilístico ao WhatsApp open nem ativar enhanced conversions. Essas propostas externas dependem de reconciliação, consentimento e prova de dedupe e permanecem fora do changeset.

A pesquisa externa de demanda foi filtrada em `PERPLEXITY-STRATEGIC-DELTA-2026-08-18.md`. Ela não autoriza novas campanhas, páginas ou keywords. O único delta aceito para o changeset é exigir prova operacional de cadeia de custódia/status e capturar o deadline/next-leg do hóspede antes de testar novas mensagens. Claims de bag labeling, tracking, front desk universal ou status proativo ficam bloqueados até o SOP existir.

A auditoria `GEO-DEVICE-SCHEDULE-AUDIT-2026-08-18.md` confirma que a campanha está 24/7, 95,1% dos cliques vêm de smartphones e as cidades/horas só possuem conversões agregadas. Portanto, nenhum ajuste de agenda, dispositivo ou geo entra no A1.

## Lote A2 futuro — transição de bidding

Só pode ser desenhado após dados reconciliados e volume suficiente. Deve escolher uma única transição por vez:

- manter WhatsApp como sinal transitório com relatório separado; ou
- torná-lo secundário após qualified lead/purchase confiável; ou
- testar outra estratégia em experimento isolado.

Não alterar meta de conversão e estratégia de lance no mesmo momento sem plano explícito de aprendizado e stop-loss.

## Stop conditions

- política comercial ainda divergente;
- tracking não reconciliado;
- saldo incapaz de sustentar a janela aprovada;
- estado live diferente do baseline;
- mudança anterior ainda sem janela mínima;
- destino/checkout indisponível;
- ausência de aprovação do changeset final;
- capacidade operacional incompatível com os claims.

## Próxima versão

Depois dos Gates A e B, este rascunho deve virar `CHANGESET-GADS-2026-08-18-A.md` contendo, para cada item, objeto/ID, antes/depois exato, evidência, impacto, QA e rollback.

Somente essa versão final poderá solicitar:

`APROVADO: CHANGESET-GADS-2026-08-18-A`
