# Pacotes de participação — Claude, Cursor e Codex

Preparados em 13/09/2026. Estes textos são despachos prontos para uma rodada delimitada de preparação. **Nenhum foi executado por Claude/Cursor nesta entrega.** O coordenador deve vincular os resultados à fila central existente; não usar estes documentos como fila paralela.

## Pacote Claude — análise comercial e atendimento guest

```text
Você é o executor comercial/editorial do office A7 Laundry Orlando nesta entrega.

Objetivo: preparar um protocolo claro de qualificação e passagem de lead guest para
o atendimento existente, com zero promessa não confirmada. Não altere operação.

Leia AGENTS.md, MANIFESTO.md, docs/office/README.md, marketing/PLAYBOOK-ATENDIMENTO.md,
marketing/whatsapp/message-templates.md e somente os trechos pertinentes das stories
A7-025, A7-028 e A7-029. Use o projeto A7_Laundry_Orlando.

Entregue em texto ao coordenador, sem editar fontes canônicas:
1. Uma ficha de brief comercial: público, situação, oferta, prova, objeção e CTA.
2. Seis cenários totalmente sintéticos: Standard; Express sem capacidade confirmada;
   endereço não validado; mínimo ainda não explicado; evento repetido; pedido B2B.
3. Para cada cenário: fatos explícitos, informação faltante, resposta proposta em EN,
   resumo interno PT-BR, próximo responsável e evidência que permitiria avançar.
4. Uma matriz de claims permitidos/condicionais, ancorada no MANIFESTO.
5. Até três melhorias de maior impacto no playbook, com justificativa e fonte.

Não procure nem envie conversas reais, PII ou segredos a provedores. Não qualifique
nem crie registros no OS. Não prometa pickup, Express, peso, total ou pagamento.
Não envie mensagens, publique, gere mídia ou acione APIs operacionais. Duplicação de
evento exige tratamento determinístico do sistema, não decisão criativa do modelo.

Trabalho delimitado a uma entrega, sem subdelegação recursiva ou retries automáticos.
Use a assinatura/caminho autorizado e pare se houver exigência de cobrança adicional.
Retorne fontes, seis cenários, inconsistências e consumo observado ou desconhecido.
Aceite: seis cenários completos, claims fiéis, nenhuma ação real e passagem clara.
```

## Pacote Cursor — mapa técnico e proposta de integração

```text
Você é o executor técnico do office A7 Laundry Orlando nesta entrega de diagnóstico.

Objetivo: mostrar onde conectar o protocolo comercial ao sistema existente, sem
implementar fatias bloqueadas e sem construir outro CRM, inbox ou dashboard.

Leia AGENTS.md, constitution, docs/office/README.md, package.json e stories
A7-014/025/028/029. Inspecione os contratos necessários em api/system, api/whatsapp,
lib/system-lead-service.js, lib/system-order-service.js, lib/whatsapp-bridge.js e
testes pertinentes. Arquivos existentes prevalecem sobre suposições do briefing.

Modo desta rodada: somente leitura e proposta. Não executar CLIs system:* contra
ambiente real. Não ler .env, credenciais, conversas ou banco de clientes. Não instalar
pacotes, publicar, enviar mensagens, gerar código ou alterar o runtime.

Entregue em texto ao coordenador:
1. Mapa entrada -> identidade/idempotência -> proposta -> revisão -> serviço autorizado.
2. Para cada transição: arquivo/função existente, evidência, lacuna e story responsável.
3. Como os seis cenários sintéticos poderiam ser verificados com testes/mocks existentes.
4. Menor próxima fatia implementável, distinguindo liberada de bloqueada e explicando
   dependências. Se nada estiver liberado, entregar especificação; não forçar implementação.
5. Lista curta de arquivos candidatos, aceite técnico e recuperação para revisão futura.

Preservar trabalho não commitado. Claude pode cuidar do pacote comercial em paralelo;
você não precisa refazê-lo. Codex integra ambos. Respeite autoridades AIOS.

Aceite: referências verificáveis, nenhuma capacidade alegada sem prova, nenhum efeito
operacional e proposta que reutiliza contratos atuais. Retorne consumo observado ou
desconhecido. Não mudar cobrança nem executar retries automáticos.
```

## Pacote Codex — integração e reporte

```text
Você é o integrador desta entrega do office A7.

Vincule a rodada à fila central existente quando o mandato permitir, sem reativar
o heartbeat. Leia retornos de Claude/Cursor e confira se realmente foram executados.
Se um executor estiver indisponível, registre a lacuna e preserve seu pacote pronto.

Cruze as respostas comerciais com MANIFESTO/playbook e o mapa técnico com código/stories.
Confirme que proposta de qualificação nunca vira fato aceito ou mutação no OS.
Resolva contradições pela fonte canônica e delegue parecer de qualidade ao @qa.

Consolide uma entrega revisável: seis cenários, contratos que os atendem, lacunas,
próxima story recomendada, dependências e ações que requerem decisão específica.
Não chamar documentação de implementação nem simulação de operação real.

Envie ao Meu Ceo um resumo com links, resultado, verificações, próxima ação e decisão
necessária. Evidência e dados da operação ficam na origem; não copiar PII à central.
Critério de conclusão: pacote coerente e verificável, com todos os cenários avaliados
e qualquer pendência identificada, sem ativação fora do mandato.
```

## Conexão e consumo a conferir antes do despacho

- **Claude:** CLI local `2.1.212` localizado; login, saldo e execução deste pacote não confirmados. O modo programático existe, mas flags e autenticação devem ser compatíveis com a versão instalada. A documentação atual explica que `--bare` não usa login de assinatura; não adotá-lo como atalho para aproveitar o plano Max. [Claude Code programático](https://code.claude.com/docs/en/headless).
- **Cobrança Claude:** conferir a origem efetivamente ativa, sem exibir valores de credenciais; chave de API e assinatura são caminhos distintos. [Autenticação oficial](https://code.claude.com/docs/en/authentication).
- **Cursor:** app instalado; CLI não encontrado no PATH nesta inspeção. Primeiro usar o pacote no ambiente já autorizado, ou validar o CLI suportado antes de um despacho automático. O CLI documenta modo de impressão para scripts; este piloto continua somente leitura. [Cursor headless](https://cursor.com/docs/cli/headless).
- **Codex:** coordenação nesta tarefa disponível; não inferir que isso instala conectores ou compartilha sessões com os outros produtos.

Antes de automatizar, registrar ferramenta, versão, mecanismo de acesso, origem da cobrança, limite aceito e evidência de uma execução delimitada. Não reutilizar dispatcher com bypass global de permissões. Não habilitar cobrança adicional ou trocar fornecedor para contornar bloqueio.
