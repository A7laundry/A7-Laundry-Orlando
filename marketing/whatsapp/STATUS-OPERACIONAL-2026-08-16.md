# Adendo operacional do WhatsApp — 2026-08-16

Este adendo não altera o registro auditado de 2026-07-31. Ele substitui somente a
classificação operacional do card Everyday registrada naquela data.

## Correção vigente

- O card Everyday de julho não está mais aprovado para atendimento, publicação ou mídia.
- Seus pixels contêm o prazo anterior ao Express 8h.
- O master, o PNG aprovado na época e o JPEG de envio foram preservados sem edição em
  `assets/2026-07-guest-onboarding/quarantined/obsolete-pre-8h-duration/`.
- Para a oferta principal, usar as respostas rápidas atuais ou o carrossel Guest How It
  Works de agosto, que contém Normal 24h, Express 8h sujeito a disponibilidade, preços
  atuais, mínimo de US$50 e o WhatsApp oficial.
- O card Special Item permanece aprovado porque exige foto e cotação separada sem
  publicar o prazo obsoleto.

## Regra anti-regressão

O gate `npm run validate:guest-carousel` falha se qualquer variante Everyday retornar à
pasta `approved/`, desaparecer da quarentena histórica ou voltar a ser apresentada como
arte aprovada no registro de templates.
