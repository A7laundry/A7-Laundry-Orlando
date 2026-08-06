# Auditoria de integridade SEO e tracking — 6 de agosto de 2026

**Escopo:** Bloco 1 do plano orgânico competitivo
**Estado:** implementado localmente; não publicado neste documento
**Story:** `A7-003 — Conversion Observability`

## 1. Search Console: consulta × página

Fonte verificada no Search Console `sc-domain:a7laundry.com`, conta
`a7laundry.usa@gmail.com`. Período exibido: 30 de junho a 4 de agosto de 2026.

### `orlando same day drop off laundry service`

- 40 impressões, 0 cliques, posição média 13,8.
- `/blog/same-day-laundry-tourists-orlando`: 27 impressões.
- `/blog/same-day-drop-off-laundry-orlando`: 7 impressões.
- homepage: 6 impressões.

Decisão: a página turística é a candidata vencedora, mas nenhum redirect foi aplicado. O
cluster precisa ser confirmado com as demais consultas de same-day/Express antes de fundir a
página de drop-off.

### `orlando airport area laundry pickup and delivery`

- 44 impressões, 0 cliques, posição média 15,8.
- `/blog/same-day-laundry-tourists-orlando`: 35 impressões.
- homepage: 9 impressões.
- `/blog/laundry-orlando-airport`: nenhuma impressão para esta consulta no relatório.

Decisão: não redirecionar a página de aeroporto. O resultado indica desalinhamento de intenção
ou indexação, não uma vencedora de aeroporto. O Bloco 2 deve diferenciar a página de MCO e reduzir
o alcance excessivamente genérico da página same-day.

## 2. GTM e GA4

Container verificado: `A7 Laundry USA / a7laundry.com / GTM-KV9LGVRN`.

- zero tags no container;
- zero alterações pendentes;
- o painel sinaliza qualidade urgente com dois issues, coerente com um container vazio;
- nenhuma configuração GA4 foi encontrada dentro do GTM;
- a medição funcional já vive em `a7-tracking.js`.

Decisão: remover o snippet vazio de GTM das páginas públicas e bloquear sua reintrodução no
build. Isso não remove uma fonte de dados ativa; elimina uma requisição sem função e preserva
`a7-tracking.js` como fonte única.

## 3. Correções públicas aplicadas

- 15 lb a US$ 3,25 calcula US$ 48,75 e é faturado pelo mínimo de US$ 50.
- 20 lb a US$ 3,25 custa US$ 65.
- O intervalo ilustrativo de 15–20 lb passa a ser US$ 50–65.
- Comparações deixam explícito quando delivery custa mais em dólares e vende conveniência/tempo.
- Hotel passa a usar front desk, bell desk ou outro handoff aprovado pela propriedade.
- Express permanece condicionado à confirmação de capacidade e janela de retorno.

O build agora rejeita os exemplos antigos de US$ 43,50, US$ 44–58 e US$ 50–58.

## 4. Referência de origem no WhatsApp

Todo link `wa.me` passa a receber `A7 Ref`, inclusive quando não há UTM:

- campanha: `google|guest_search_orlando|hotel`;
- orgânico: `google-organic|laundry-service-orlando`;
- assistente: `ai-chatgpt|laundry-near-disney-world`;
- referral: `ref-dominio.com|pagina`;
- acesso sem referrer: `direct|pagina`.

O mesmo contexto é enviado nos eventos como `origin_class`, `origin_source`, `landing_page` e
`lead_reference`. A classificação persiste durante a sessão.

## 5. Integridade dos eventos

- Eventos inline em links de WhatsApp, SMS e telefone foram removidos.
- O evento canônico permanece em `a7-tracking.js`: `whatsapp_click`, `sms_click` ou `call_click`.
- Google Ads continua recebendo a conversão nativa de WhatsApp separadamente.
- Um gate de build bloqueia novo `onclick` em link de contato.

## 6. Schema

O Search Console registra um item válido de review snippet em `/comforter`, `A7 Laundry —
Comforter Cleaning`, detectado em 17 de julho de 2026. Nenhum ganho de rich result foi observado
para os schemas repetidos dos artigos locais. A limpeza ampla desses schemas fica para o Bloco 2,
depois da consolidação de URLs; não houve remoção indiscriminada neste bloco.

## 7. Quality gates

- `npm run lint` — passou.
- `npm run typecheck` — passou.
- `npm test` — passou.
- `npm run build` — passou.
