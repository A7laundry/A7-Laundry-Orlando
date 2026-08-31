# Completion Gate — finalização Google Ads A7

Data: 2026-08-18  
Estado geral: **AUDITORIA AVANÇADA; IMPLEMENTAÇÃO NÃO AUTORIZADA/NÃO CONCLUÍDA**

## Matriz requisito → prova → estado

| Requisito do proprietário | Evidência necessária | Evidência atual | Estado |
| --- | --- | --- | --- |
| Prompt robusto para finalizar sem decisões fracas | Prompt com fases, agentes, gates, rollback e métricas finais | `PROMPT-MESTRE-FINALIZACAO-GOOGLE-ADS.md` | Comprovado |
| Público principal: hóspede já no hotel | Oferta, keywords, anúncio e landing explicitamente hotel guest | Canonical offer, keyword adjudication, landing e RSA draft | Comprovado no plano; implantação parcial existente |
| Plataforma/atendimento online premium VIP | Copy fiel ao concierge online real, sem prometer self-service inexistente | Canonical offer + RSA challenger | Comprovado no plano; challenger não publicado |
| Pickup em até 1h | Claim condicionado à confirmação/capacidade e SLA operacional mensurável | Wording aprovado `as soon as 1 hour`; não há ledger de pickup real | Parcial / não comprovado operacionalmente |
| Express com retorno em até 8h | Preço, disponibilidade e tempos reais | US$3,95/lb e claim condicionado; materiais operacionais qualitativos | Parcial; tempo real não reconciliado |
| Preço superior ao concorrente sem competir por barato | Posicionamento premium e exclusão de claims cheapest | Canonical offer e RSA draft premium | Comprovado no plano |
| Não destruir a campanha/histórico | Baseline, backups, changeset, rollback e zero alteração sem aprovação | Baseline, draft changeset e auditoria live | Comprovado até agora; zero alteração |
| Auditar com agentes/skills antes de avançar | Revisões independentes e red team | Auditor de dados, oferta/site e red team concluídos | Comprovado |
| Entender invoices, pickup orders e labels | Auditoria visual, PII redigida e limites da evidência | `OPERATIONAL-EVIDENCE-AUDIT-2026-08-18.md` | Comprovado qualitativamente |
| Não errar keywords/negativas | Adjudicação por intenção, tracking e conflito | `KEYWORD-ADJUDICATION-2026-08-18.md`; 15 negativas live auditadas | Parcial; pedidos reais ainda ausentes |
| Lead final de funil como objetivo | Paid/confirmed/qualified reconciliados com Ads | 5 purchases + 33 WhatsApp opens conhecidos; sem ledger cruzado | Não comprovado |
| Medição confiável | Click ID → contato → order ID → payment ID → paid/refund | Captura técnica existe; ruptura operacional documentada | Não comprovado |
| Reconciliação local segura | CLI determinístico, sem PII e sem associação por similaridade | Reconciliador e template Gate B testados; aguardam ledger real | Ferramenta comprovada; dados pendentes |
| Configurações defensivas corretas | Pesquisa only, Presence, automações/expansões desligadas | `LIVE-CAMPAIGN-SETTINGS-AUDIT-2026-08-18.md` | Comprovado |
| Landing e tracking live íntegros | Preflight público e source implantado igual ao validado | `scripts/preflight-google-ads-live.mjs` passou | Comprovado tecnicamente |
| Mobile pronto para o tráfego real | UX/CTA/attribution em smartphone e performance real | 95,1% dos cliques são mobile; contrato técnico passou | Parcial; sem teste de conversão real/4G nesta auditoria |
| Geo e horário corretos | Presence, cidades, fuso e pedido real por hora/área | Presence correta; GMT-03 vs EDT documentado; 24/7 | Parcial; sem pedido final por cidade/hora |
| RSA Express/VIP correto | 15 headlines/4 descrições dentro dos limites, claims seguros | `RSA-CHALLENGER-HOTEL-EXPRESS-DRAFT.md`; counts validados | Pronto para changeset, não implantado |
| Implementar e finalizar | Aprovação exata, drift check, lote, QA e monitoramento | Não há `APROVADO: CHANGESET ...`; Gate B aberto | Não iniciado por design |
| Ser a lavanderia com maior captação diária sustentável | Pedidos pagos/dia, CAC, margem, capacidade e comparação longitudinal | Não existe coorte final reconciliada | Não comprovado |

## Requisitos que impedem declarar conclusão

1. Export Stripe e MOS/CRM com IDs únicos, status, moeda, refunds e metadata.
2. Reconciliação das cinco purchases e das 33 aberturas de WhatsApp.
3. Prova de preservação `GCLID/GBRAID/WBRAID → A7 Ref → order ID → payment ID`.
4. Tempos reais de confirmação, pickup e retorno Express para sustentar claims/capacidade.
5. Changeset final com objetos/IDs e diff revalidado contra estado live.
6. Aprovação explícita `APROVADO: CHANGESET <ID>`.
7. Implantação em lotes e QA imediato.
8. Monitoramento 24h/72h/7d e decisão com pedidos finais.

O reconciliador local `scripts/reconcile-google-ads-gate-b.mjs` e o template `gate-b-ledger-template.csv` estão prontos. Os gates completos de lint, typecheck, testes e build passaram em 2026-08-18. Isso reduz o bloqueio à obtenção e normalização dos dados reais; não representa autorização para publicar a campanha.

## Ações já proibidas pela evidência

- Pausar genéricos em bloco.
- Ampliar `laundromat` ou outras negativas ambíguas.
- Cortar domingo, horários ou cidades por 0 microconversões em amostra pequena.
- Reduzir smartphones por CPA agregado aparente.
- Ativar AI Max, broad, PMax, Display ou parceiros.
- Aumentar orçamento/lance para compensar rank antes de tracking/message match.
- Trocar WhatsApp para Secondary junto com bidding/meta.
- Sobrescrever o RSA controle.
- Publicar garantia absoluta de 1h/8h.

## Próxima prova obrigatória

Executar `GATE-B-CONVERSION-RECONCILIATION-SPEC.md` com dados reais. Até isso acontecer, o trabalho está avançado e seguro, mas não finalizado.
