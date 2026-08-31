# CHANGESET-GADS-2026-08-20-L1 — integridade factual

Status: **AGUARDANDO APROVAÇÃO EXPLÍCITA / NÃO EXECUTADO**  
Conta: `290-113-2891`  
Campanha: `24072699595`  
Ad group: `Hotel Guest Laundry` (`203857555652`)  
RSA: `818373306214`

## Escopo

Alterar uma única descrição do RSA Hotel. Nenhuma outra configuração faz parte desta autorização.

### Antes

`Normal 24h. Express 6h is subject to availability. Check times on WhatsApp.`

### Depois

`Normal 24h. Express up to 8h after confirmation, subject to availability. Check WhatsApp.`

Comprimento: 89 de 90 caracteres.

## Motivo

A descrição live promete Express em 6h. A oferta pública canônica e a landing definem Express em até 8h após confirmação e disponibilidade. A correção remove o message mismatch sem criar promessa absoluta.

## Invariantes

- manter os outros 15 títulos e três descrições sem edição;
- manter URL final e caminhos;
- manter RSA ativo como controle;
- não alterar orçamento, tCPA, metas, negativas, assets de campanha, localização, idioma ou agenda;
- não aceitar recomendação do Google durante o fluxo;
- não ativar AI Max, broad, Partners, Display ou expansão de URL.

## QA após salvar

1. Confirmar que o histórico registra apenas uma alteração no RSA `818373306214`.
2. Reabrir o anúncio e validar o texto exato.
3. Confirmar status de política/revisão e que o anúncio continua ativo ou em análise sem erro.
4. Confirmar URL final canônica e tracking.
5. Conferir que orçamento e tCPA continuam R$150/dia e R$49,25.

## Rollback

Se o anúncio for reprovado por motivo relacionado ao novo texto, restaurar somente a descrição pelo baseline registrado, sem restaurar a promessa incorreta de 6h. Se necessário, substituir por uma versão factual mais curta: `Normal 24h. Ask about 8-hour Express availability on WhatsApp.`

Não apagar ou pausar o RSA controle como rollback automático.

## Risco e observação

Risco operacional: baixo. Risco de revisão do anúncio: médio. A edição pode reiniciar a avaliação do RSA, mas corrige uma promessa comercial incorreta. O saldo disponível de R$162,30 é um bloqueio financeiro separado e não faz parte deste changeset.

## Autorização necessária

Para publicar somente esta mudança, o proprietário deve responder exatamente:

`APROVADO: CHANGESET-GADS-2026-08-20-L1`

