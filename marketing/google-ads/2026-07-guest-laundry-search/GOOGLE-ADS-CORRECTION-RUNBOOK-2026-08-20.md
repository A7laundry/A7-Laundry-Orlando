# Runbook de correção controlada — Google Ads

Data: 2026-08-20  
Conta: `290-113-2891`  
Campanha: `24072699595`  
Status: **PRONTO PARA PREFLIGHT; NENHUMA MUTAÇÃO AUTORIZADA**

## Objetivo

Corrigir a campanha sem interromper o fluxo que já produziu pedidos reais. O princípio é preservar o controle vencedor, corrigir primeiro a verdade comercial e a mensuração e alterar apenas uma família de variável por lote.

## Condições para iniciar

- [x] A aba live da conta e da campanha corretas respondeu à auditoria em 2026-08-20.
- [ ] Saldo e forma de cobrança sustentam ao menos sete dias no orçamento vigente.
- [ ] Histórico de alterações posterior a 2026-08-18 foi exportado.
- [ ] Configurações, anúncios, assets, negativas e metas foram exportados antes da mudança.
- [x] Landing e WhatsApp oficial passaram no preflight em 2026-08-20.
- [ ] Não existe outra alteração ainda em revisão ou aprendizado que impeça leitura causal.

Se qualquer condição falhar, parar. Não compensar com aumento de orçamento, lance ou alcance.

## Drift check obrigatório

Comparar o estado live com o baseline de 2026-08-18:

| Controle | Baseline esperado | Se houver divergência |
| --- | --- | --- |
| Orçamento | R$150/dia | Registrar; não corrigir automaticamente |
| Estratégia | tCPA | Registrar; não alterar neste lote |
| tCPA | R$49,25 | Registrar; não alterar neste lote |
| Redes | Pesquisa Google somente | Bloquear publicação se Partners/Display estiverem ativos |
| Localização | Presença somente | Bloquear publicação se houver interesse/presença expandida |
| Áreas | Orlando, Kissimmee, Lake Buena Vista, Davenport, Citrus Ridge | Validar capacidade antes de qualquer diferença |
| Idioma | English | Não acrescentar espanhol sem campanha própria |
| AI Max / broad | Desligados | Bloquear publicação se ativos |
| Expansão de URL / assets automáticos | Desligados | Bloquear publicação se ativos |
| Autoaplicação | Desligada | Bloquear publicação se ativa |
| Auto-tagging | Ativo | Corrigir tracking antes de escalar se inativo |
| RSA Hotel | Controle ativo | Não editar ou pausar como parte de outro lote |

## Lote 1 — integridade factual e de destino

Este é o primeiro lote elegível depois do drift check. Não inclui negativas, metas, bidding, orçamento ou estrutura.

1. Ler todos os títulos e descrições dos RSAs ativos.
2. Se houver promessa Express inferior a 8h, garantia absoluta ou mínimo diferente de US$50, registrar o asset e a combinação antes da correção.
3. Preservar o RSA `Hotel Guest Laundry` quando estiver factual. Não o reescrever apenas para reposicionamento.
4. Se existir claim factual incorreto, corrigir somente o asset incorreto para:
   - Standard: US$3,25/lb, cerca de 24h;
   - Express: US$3,95/lb, até 8h após confirmação e disponibilidade;
   - mínimo público: US$50;
   - booking: atendimento online via WhatsApp, sem prometer checkout autônomo.
5. Confirmar que todas as URLs comerciais levam à landing canônica ou a seções coerentes dela.
6. Conferir o asset de nome da empresa. Se estiver reprovado, registrar o motivo e tratar somente esse asset; não substituir por texto inventado.

### QA do Lote 1

- anúncio e assets sem `6-hour`, `guaranteed 8-hour`, `no minimum` ou promessa fixa de pickup;
- URL final HTTP 200 e parâmetros preservados;
- preço, mínimo, telefone e WhatsApp iguais à fonte canônica;
- controle continua ativo;
- nenhuma mudança em orçamento, tCPA, metas, negativas, regiões ou agenda.

### Rollback do Lote 1

Restaurar o asset anterior pelo ID e timestamp registrados. Se o texto anterior for comercialmente incorreto, pausar somente o asset afetado e manter o RSA controle factual; nunca restaurar uma promessa falsa apenas para recuperar entrega.

## Lote 2 — contenção de intenção incompatível

Executar em dia separado, depois do QA do Lote 1. Exige confirmação operacional de que a A7 não oferece dry cleaning.

Adicionar como **negativas exatas no nível da campanha Guest**:

- `[mobile dry cleaning]`
- `[same day dry cleaners near me]`
- `[dry cleaning near me]`
- `[24 hours dry cleaners near me]`
- `[dry cleaners lake nona]`
- `[1800 dry clean near me]`

Não adicionar neste lote negativas de frase para `dry cleaning`. Não bloquear `laundry near me`, `near me`, `laundromat`, `laundry room`, espanhol, concorrentes, hotéis, Disney, Kissimmee ou Lake Buena Vista.

Antes de salvar, simular conflito com todas as keywords positivas. Depois de salvar, confirmar elegibilidade e registrar os IDs das seis negativas.

### Rollback do Lote 2

Remover somente as negativas criadas neste lote pelos IDs registrados. Acionar rollback se consultas válidas de hotel/pickup forem bloqueadas ou se houver queda anormal de entrega coerente sem outra explicação.

## Lote 3 — mensuração de fundo de funil

Este lote permanece bloqueado até o Gate B fechar.

1. Reconciliar as cinco compras históricas da plataforma.
2. Incluir pedidos confirmados de 18–19 de agosto com `order_id` e `payment_id`, mantendo gorjeta fora do valor de otimização.
3. Confirmar moeda original, refund, duplicidade e click IDs.
4. Tornar `A7 Ref` e `order_id` obrigatórios no fluxo atribuído de pagamento.
5. Garantir registro idempotente de pedido pago.
6. Criar/importar lead qualificado apenas com click ID, consentimento e dedupe comprovados.

Não transformar WhatsApp em Secondary no mesmo momento da implantação técnica. Primeiro provar que os sinais finais entram de forma estável; depois elaborar um lote exclusivo de metas.

## Lote 4 — estrutura e challenger

Somente após mensuração confiável:

- preservar Hotel/Guest como controle;
- separar genéricos de maior gasto em teste com teto próprio;
- criar teste Express usando claims condicionais;
- tratar Lake Buena Vista/Disney como challenger, não como substituição imediata;
- publicar no máximo uma família estrutural por vez.

O conteúdo criativo de referência está em `RSA-CHALLENGER-HOTEL-EXPRESS-DRAFT.md`, ainda sujeito à validação operacional dos claims.

## Mudanças explicitamente proibidas nesta execução

- reduzir o tCPA para aproximadamente R$35;
- aumentar orçamento com base em dois dias de vendas;
- atribuir valor estimado a abertura de WhatsApp;
- habilitar PMax, Display, Search Partners, broad, AI Max ou expansão de URL;
- ativar recomendações automáticas;
- trocar metas, bidding e orçamento simultaneamente;
- pausar em bloco keywords genéricas que já produziram sinal;
- excluir objetos quando pausa ou reversão for suficiente.

## Monitoramento

Após cada lote:

- imediato: política, elegibilidade, URLs, telefone, metas e ausência de drift;
- 24h: reprovações, gasto, termos inválidos, tracking e saldo;
- 72h: leads qualificados, pedidos, receita elegível e distribuição de consultas;
- 7d: CPA por pedido pago/lead qualificado, margem e comparação com o controle.

Parar ou reverter se tracking quebrar, saldo ameaçar a veiculação, gasto fugir do limite, geo inválida crescer, promessa divergir da operação ou pedidos/leads qualificados caírem de forma material.

## Aprovação

O preflight foi concluído; o diff live ainda precisa ser anexado. Somente depois disso o lote poderá solicitar uma autorização específica, por exemplo:

`APROVADO: LOTE 1 — INTEGRIDADE FACTUAL E DESTINOS`

Uma autorização de lote não autoriza os lotes seguintes.

## Evidência de preflight

Executado em 2026-08-20:

```bash
npm run preflight:google-ads:live
```

Resultado: destino público, termos comerciais, preservação de atribuição na URL e source live de tracking válidos. A leitura live também foi concluída em 2026-08-20 e está em `LIVE-DRIFT-CHECK-2026-08-20.md`. Foi confirmado um claim obsoleto de Express 6h e saldo disponível de R$162,30. O diff factual isolado está em `CHANGESET-GADS-2026-08-20-L1.md`, aguardando aprovação explícita. Nenhuma configuração da conta foi alterada.
