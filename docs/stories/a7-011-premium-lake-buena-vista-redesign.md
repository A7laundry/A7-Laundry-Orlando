# Story A7-011 — Premium Lake Buena Vista Hospitality Redesign

**Status:** Released — Monitoring

**Created:** 2026-08-20

**Source:** Autorização explícita do proprietário para iniciar a execução do prompt `PROMPT-CODEX-REDESIGN-PREMIUM-LAKE-BUENA-VISTA.md`. Esta story é nova e não reabre nem altera a A7-003.

## Owner Authorization

Em 2026-08-20, o proprietário autorizou explicitamente a execução desta story de ponta a ponta, incluindo implementação, validação, finalização e publicação. A autorização permite avançar autonomamente até o release depois que os gates da story estiverem verdes; ela não dispensa QA, integridade de claims, preservação do tracking/SEO, rollback nem a autoridade exclusiva de `@devops` para operações remotas e publicação.

## Executor Assignment

```yaml
executor: "@ux-design-expert"
quality_gate: "@dev"
quality_gate_tools:
  - "browser visual inspection at required viewports"
  - "manual WCAG AA inspection"
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
  - "npm run build:public"
  - "focused tracking and business-destination tests"
  - "git diff --check"
```

**Handoffs obrigatórios:** `@dev` para implementação/revisão técnica, `@qa` para veredito de qualidade e `@devops` para qualquer publicação remota. A autorização do proprietário para seguir até o release já está registrada acima; o pacote visual/claims/diff ainda deve ser apresentado, mas só exige nova pausa/aprovação se houver desvio material da story ou condição não autorizada.

## Story

**As a** guest staying in the Lake Buena Vista hotel corridor,
**I want** a memorable, trustworthy and mobile-first A7 hospitality experience that immediately explains hotel laundry pickup around my deadline,
**so that** I can recover control of my vacation schedule and confidently contact A7 without waiting around or interpreting generic marketing.

## Business Context

Lake Buena Vista produziu sinal comercial informado pelo proprietário de hóspedes que percorreram `Google → site → WhatsApp`, com pedidos/tickets relevantes, mas sem atribuição paga determinística por pedido. A necessidade mais consistente é `hotel + pickup + deadline`; o produto emocional é preservar a viagem, não vender preço baixo. A página atual já possui a oferta e o tracking essenciais, porém seu padrão visual de split hero, pills, cards repetitivos e navegação mínima foi rejeitado pelo proprietário como genérico e insuficiente para a responsabilidade turística de Orlando.

Esta story transforma a URL existente em uma experiência editorial de hospitalidade A7, preservando fatos, conversão, SEO, acessibilidade e mensuração. Não cria um novo slug, não muda Google Ads e não usa Disney ou hotéis como prova de afiliação.

## Dependencies and Preconditions

- A7-003 permanece concluída e serve apenas como fonte do contrato de atribuição, do sinal comercial e do rebuild anterior; não deve ser reaberta nem editada por esta story.
- A oferta e os claims devem ser revalidados antes de qualquer nova copy pública.
- O worktree existente contém mudanças do proprietário; baseline, diff e rollback devem ser registrados antes da primeira edição.
- Não há `docs/framework/` nem `docs/architecture/` neste checkout apesar de `core-config.yaml` apontar para esses caminhos. Essa ausência é uma lacuna documental, não autorização para inventar arquitetura. A implementação deve seguir o stack estático e os contratos verificáveis no código atual.
- Dados GSC/GA4/Core Web Vitals ausentes devem ser registrados como `unavailable`, nunca convertidos em zero.
- A autorização registrada nesta story permite publicar após a apresentação do pacote visual, de claims, métricas, riscos e diff e após todos os gates verdes; qualquer desvio material exige nova aprovação explícita.

## Scope

### Included

- Diagnóstico verificável da página atual e das páginas semanticamente próximas.
- Três direções criativas completas e recomendação fundamentada.
- Protótipos reais em 1440px e 390px para hero, header e primeiro CTA.
- Reformulação integral da URL existente como sistema `A7 Resort Editorial`.
- Copy em inglês americano, fotografia/assets, navegação, narrativa, preço, FAQ e CTA.
- Preservação e validação de SEO, schema, WhatsApp, atribuição e eventos.
- QA em viewports, navegadores, acessibilidade, performance, claims, marca e privacidade.
- Gate de aprovação, publicação por `@devops`, validação pública, rollback e monitoramento até 28 dias.

### Excluded

- Novo slug ou nova money page para Lake Buena Vista.
- Migração para React, Next.js ou outra stack sem decisão arquitetural explícita.
- Instalação de biblioteca/dependência sem justificativa, comparação de peso, fallback e aprovação arquitetural e do proprietário.
- Alteração de Google Ads, campanha, budget, bidding, RSA, keywords ou conversões nesta story.
- Parceria, endosso, logo ou trade dress de Disney, hotel ou concorrente.
- Reviews, ratings, contadores, selos, fotos, SLA, cutoff, coverage ou claims não revalidados.
- Dark patterns, autoplay sonoro, pop-up, countdown, chat/formulário falso, fake scarcity, scroll-jacking, cursor customizado, WebGL obrigatório ou smooth scroll por biblioteca.

## Business and Claim Invariants

- Standard: a partir de **US$3.25/lb**, retorno aproximado em **24h**.
- Express: a partir de **US$3.95/lb**, retorno em até **8h somente quando disponibilidade, capacidade e janela forem confirmadas**.
- Pedido mínimo turístico: **US$50**.
- Pickup e delivery: incluídos somente na área/endereço confirmados.
- WhatsApp oficial: **+1 407-670-8839**.
- Endereço, handoff, preço, disponibilidade e retorno são confirmados antes da coleta.
- Bell Services/front desk só podem aparecer como possibilidade condicionada à regra do hotel.
- Special care/no-dryer só podem ser tratados após confirmação de processo, preço e prazo.
- Solicitações podem chegar 24/7; isso não significa pickup 24/7 nem pickup rápido garantido.
- O código estático de funil permanece `SEO-LBV-V2` até aprovação explícita de outro identificador.
- Clique de WhatsApp é microconversão, não venda nem receita.
- Não publicar `no minimum`, `cheapest`, `lowest price`, `best`, `#1`, `top-rated`, `guaranteed`, `instant`, `book now`, afiliação, pickup garantido ou Express absoluto.

## Acceptance Criteria

1. **Baseline, truth and rollback are captured before editing**
   - [x] O executor registra estado Git e mudanças preexistentes sem sobrescrevê-las, commit/deploy público de referência e procedimento de rollback.
   - [x] Screenshots desktop/mobile, metadata, schema, headings, links, CTAs, prefill, tracking, peso, Lighthouse e CWV disponíveis da versão anterior são registrados; dados indisponíveis permanecem `unavailable`.
   - [x] É produzida a matriz `claim | fonte | data | status | copy pública permitida | condição` antes de reescrever copy.
   - [x] É produzido o mapa `URL | query/intenção | title | H1 | canonical | links/anchors | GSC`, quando disponível, para Lake Buena Vista, near-Disney e Disney-Springs.

2. **Three real creative directions precede implementation**
   - [x] São produzidas três direções distintas, cada uma com nome, tese, moodboard verbal, headline, supporting line, CTA, paleta, tipografia/licença, fotografia, movimento, visual thesis e risco.
   - [x] Cada direção é avaliada por clareza, emoção, originalidade A7, Search intent, mobile, performance e conversão.
   - [x] Uma direção é recomendada com justificativa orientada ao hóspede e à evidência, sem pedir ao proprietário que invente as alternativas.
   - [x] Nenhuma direção copia template, identidade Disney, hotel, concorrente ou estética SaaS.

3. **The prototype proves the premium opening before full-page implementation**
   - [x] Hero, header e primeiro CTA são prototipados com copy real em composições de 1440px e 390px.
   - [x] O hero não usa como fórmula dominante `texto à esquerda + imagem à direita + pills/cards` nem foto literal genérica de máquina/cesto/moedas.
   - [x] Em até cinco segundos, um usuário entende Lake Buena Vista, hotel pickup, benefício de recuperar tempo e a ação no WhatsApp.
   - [x] Em 390×844, o H1 ocupa no máximo quatro linhas; existe um único CTA dominante, exibido antes da foto; nenhum FAB/CTA secundário cobre ou compete com a ação.
   - [x] O protótipo parece uma experiência editorial de hospitalidade A7 e não um template, dashboard, bento grid, glassmorphism ou produção genérica de IA.

4. **The final experience tells one continuous guest story**
   - [x] A página tem no máximo seis grandes beats narrativos e percorre `tensão → controle → alívio → retorno à viagem` sem seções redundantes.
   - [x] O conteúdo vende tempo, controle e tranquilidade, sem competir por menor preço nem atacar a lavanderia do hotel.
   - [x] As necessidades de roupas acabando, grupo/família e deadline de checkout/voo/próximo hotel entram como composição editorial, não três cards genéricos.
   - [x] O fluxo de concierge explica hotel/deadline, confirmação, handoff condicionado, continuidade dos planos e retorno da roupa limpa/dobrada.
   - [x] Standard e Express são apresentados como decisões de agenda; preço, mínimo e condição de Express ficam próximos do primeiro CTA e consistentes na leitura mobile.
   - [x] Ao menos uma prova verificável aparece até a segunda dobra; sem foto/review atual validado, a prova é um módulo de processo verificável, nunca selo genérico.
   - [x] O contexto local menciona Lake Buena Vista, Hotel Plaza Boulevard e Disney Springs apenas de forma factual/geográfica, sem grade de hotéis que sugira acesso ou relação.

5. **Visual system and navigation meet the A7 Resort Editorial brief**
   - [x] O sistema usa hospitalidade contemporânea, calor da Flórida, precisão de concierge, navy profundo, marfim quente e no máximo um accent solar/cítrico ou aquático.
   - [x] Grid, escala, tipografia, fotografia, espaço negativo e ritmo são intencionais e consistentes da abertura ao footer; “premium” não depende de dark + gold.
   - [x] A combinação tipográfica possui licença documentada, legibilidade e estratégia de carregamento sem regressão material do LCP; Playfair Display + Inter não é repetida automaticamente.
   - [x] Desktop oferece wordmark com respiro, navegação curta (`How It Works`, `Service Pace`, `Lake Buena Vista`, `FAQ`), CTA hierárquico, foco/hover e sticky discreto após o hero.
   - [x] Mobile preserva logo e ação essenciais, touch targets de pelo menos 44px e não introduz overlay automático ou sticky que cubra conteúdo/safe-area.
   - [x] Movimento, se usado, limita-se a entrada curta e transições por opacity/transform de 150–500ms, no máximo uma entrada por bloco, com conteúdo sempre disponível sem JS e reduced-motion real.

6. **Assets are original, lawful, local and quality-controlled**
   - [x] Fotografia segue a prioridade: operação real redigida/licenciada, local licenciada, ou ImageGen original inspecionado em 100%.
   - [x] Todo asset externo ou gerado possui ledger com origem/titular, licença e escopo comercial, data, evidência, transformações e, quando gerado, ferramenta/modelo, prompt integral, data e inspeção humana.
   - [x] Nenhum asset contém PII, pessoa identificável sem autorização, texto/logo gerado, anatomia/geometria defeituosa, arquitetura impossível, aparência plástica de stock ou semelhança com propriedade Disney.
   - [x] Hero usa AVIF/WebP responsivo com dimensões, `srcset`/`sizes` e `fetchpriority="high"` somente no LCP; demais imagens são lazy e possuem alt apropriado.

7. **Commercial copy remains factual and operationally safe**
   - [x] A copy usa inglês americano natural, direto, calmo, caloroso e específico, sem jargão de software, autopromoção vazia ou poesia que esconda hotel/pickup.
   - [x] Standard, Express, mínimo, pickup/delivery e condições são idênticos em metadata, corpo, FAQ e schema.
   - [x] Express permanece condicional em toda leitura rápida, inclusive hero e mobile.
   - [x] Nenhum hotel específico é apresentado como coleta confirmada sem verificação individual de nome, endereço, status e forma permitida de referência.
   - [x] O disclaimer de independência permanece legível; nenhum logo, personagem, castelo, monorail, fonte, som, trade dress ou termo de parceria/endosso é usado.
   - [x] Nenhuma promessa operacional nova, review, rating, SLA, cutoff ou área é publicada sem fonte e revalidação.

8. **WhatsApp conversion and attribution contracts are preserved**
   - [x] CTA primário aparece no hero, após serviço/preço/prova e no fechamento e abre o WhatsApp oficial.
   - [x] O prefill solicita `Hotel/address`, `Checkout / needed by`, `Approximate bag/load`, `Standard or Express` e inclui `SEO-LBV-V2`, sem PII fixa no repositório.
   - [x] `A7 Ref` curto é anexado pelo tracking existente; GCLID/GBRAID/WBRAID/UTM, first/last touch e os mapeamentos `geo`/`hotel`/`lake-buena-vista` permanecem intactos.
   - [x] Cada clique dispara um único evento/microconversão e nunca é apresentado como compra, receita ou pedido pago.
   - [x] Telefone oficial/alternativo e destinos definidos em `a7-business-config.js` não regridem; falha de analytics não bloqueia navegação.

9. **SEO architecture and structured data do not regress**
   - [x] A URL pública e slug existentes são preservados; canonical, index/follow, rewrite, title com intenção `Hotel Laundry Pickup Lake Buena Vista`, meta description e uma única H1 permanecem válidos.
   - [x] Headings não saltam níveis; conteúdo local útil não é substituído por uma experiência somente visual.
   - [x] OG/Twitter, alt texts, sitemap/image sitemap existente e links internos relevantes são preservados/atualizados somente quando necessário.
   - [x] `WebPage`, `LocalBusiness/LaundryService`, `Service`, `FAQPage` e `BreadcrumbList` permanecem válidos, com IDs estáveis e fatos iguais ao conteúdo visível.
   - [x] FAQ visível e schema respondem às mesmas oito perguntas obrigatórias sobre hotel pickup, Bell Services, espera, checkout, Express, suitcase/bag, special care e custo.
   - [x] Nenhum `AggregateRating` ou review count entra sem revalidação; a diferenciação em relação a near-Disney e Disney-Springs é avaliada por evidência, sem alegar ausência de canibalização apenas por títulos/canonicals diferentes.

10. **Performance and accessibility pass objective gates**
    - [x] Em mobile, Lighthouse alcança Performance ≥90, Accessibility ≥95, Best Practices ≥95 e SEO ≥95; LCP ≤2.5s, CLS ≤0.1 e TBT sem regressão material/dentro do indicador “good”.
    - [x] INP ≤200ms é tratado como meta de campo pós-publicação somente com amostra suficiente; ausência de CrUX/RUM não aprova nem reprova.
    - [x] Primeira carga é preferencialmente ≤650KB, hero idealmente ≤250KB, CSS novo ≤50KB gzip e JS novo ≤20KB gzip; qualquer regressão material exige redesign ou aprovação explícita.
    - [x] Há zero overflow horizontal e nenhum FAB/sticky cobre CTA, texto, FAQ, consentimento ou safe-area em 320/375/390/430px.
    - [ ] WCAG AA é verificada com contraste ≥4.5:1, landmarks, teclado, foco visível, ordem de leitura, nomes acessíveis, leitor de tela, zoom, touch targets ≥44px, alt e conteúdo não dependente de cor/imagem. **Aberto:** leitor de tela real permaneceu indisponível; os demais itens foram verificados.
    - [x] Conteúdo essencial e navegação permanecem funcionais com JavaScript bloqueado e com `prefers-reduced-motion`.
    - [x] Toda imagem responsiva usa `width:100%`/`height:auto` ou caixa de aspect ratio explícita; a regressão de dimensões associada a `geo-bed.webp` é testada especificamente.

11. **QA covers the full customer and technical path**
    - [x] São verificadas larguras 320, 375, 390, 768, 1024 e 1440 e primeiras dobras/página completa em 320×568, 390×844, 430×932, 1024×768 e 1440×900.
    - [ ] Chrome e Safari, teclado, reduced-motion, JavaScript bloqueado e rede mobile/4G simulada são verificados. **Aberto:** Chrome e WebKit 26 passaram; Safari real permaneceu indisponível porque remote automation está desativado.
    - [x] Todos os CTAs WhatsApp/tel/internal, prefill, `A7 Ref`, evento único, HTML, JSON-LD, canonical, robots, sitemap, rewrites e ausência de PII passam.
    - [x] Quatro revisões independentes cobrem: design/hospitalidade/CRO; SEO/local/canibalização; performance/acessibilidade manual; marca/claims/privacidade/red-team.
    - [x] Findings críticos estão zerados; findings médios foram corrigidos ou aceitos explicitamente pelo proprietário com justificativa.
    - [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, testes focados de tracking/negócio e `git diff --check` passam.

12. **Approval and release authority are respected**
    - [x] Antes do deploy, o proprietário recebe screenshots before/after desktop/mobile, hero em 320/375/390/1440, claim matrix, diff resumido, baseline versus build, dependências/pesos, riscos e rollback.
    - [x] A autorização registrada cobre o release quando visual, claims e diff permanecem dentro desta story e todos os gates passam; desvio material é apresentado e recebe nova aprovação explícita antes do deploy.
    - [x] Push, PR e produção são executados somente por `@devops`; nenhuma configuração do Google Ads é alterada nesta etapa.

13. **Production is verified and monitored without false victory claims**
    - [x] Após publicação autorizada, a URL e hero retornam HTTP 200; desktop/mobile, CTA, telefone, prefill, funnel code e tracking são verificados na versão pública e o deployment ID é registrado.
    - [x] Rollback é acionável para indisponibilidade, quebra de tracking, regressão material de performance/indexação, incompatibilidade operacional da mensagem ou queda sustentada de leads qualificados/pedidos sem explicação de mix/volume.
    - [ ] Evidências de 24h, 72h, 7d, 14d e 28d registram disponibilidade/assets, CWV quando houver amostra, indexação/GSC, GA4/CTA, leads qualificados, pedidos pagos, receita/margem reconciliadas, deadline/handoff e impacto nas URLs semanticamente próximas.
    - [x] Nenhuma conclusão de sucesso usa pageviews, CTR, clique de WhatsApp ou comparação before/after simples como causalidade; purchase/qualified lead reconciliado permanece a medida comercial.

## Tasks / Subtasks

- [x] **Task 1 — Freeze baseline and rollback boundary** (AC: 1, 9, 10, 12)
  - [x] Fontes, worktree, baseline, claim matrix, adjacent-URL map and rollback were recorded without replacing unavailable evidence with zero.
- [x] **Task 2 — Produce and adjudicate three creative directions** (AC: 2, 3, 4, 5)
  - [x] Three complete directions were scored; “The Day Is Still Yours” was selected and documented.
- [x] **Task 3 — Prototype the opening at 1440px and 390px** (AC: 3, 5, 7)
  - [x] Real-copy prototypes and five-second/mobile-fold checks passed before the full build.
- [x] **Task 4 — Create and clear the asset/rights package** (AC: 5, 6, 10)
  - [x] ImageGen source, exact prompts, rejected glyph, rights basis, inspection and WebP transformations were recorded.
- [x] **Task 5 — Implement the continuous A7 Resort Editorial experience** (AC: 3–7)
  - [x] Existing URL rebuilt in static HTML/CSS with six beats, no new dependency and content visible without JS.
- [x] **Task 6 — Preserve conversion and attribution** (AC: 8)
  - [x] Four CTA placements, official destination, prefill, `SEO-LBV-V2`, A7 Ref mapping and fail-open tracking passed.
- [x] **Task 7 — Preserve SEO and adjacent-page intent** (AC: 9)
  - [x] URL/canonical/schema/sitemap/links passed; Disney Springs was retargeted without unsupported canonical consolidation.
- [x] **Task 8 — Execute responsive, browser, accessibility and performance QA** (AC: 10, 11)
  - [x] Responsive matrix, keyboard/focus, contrast, reduced-motion, static-content and performance budgets passed.
  - [x] WebKit 26.0 passed at 390×844 without layout break. Lighthouse mobile passed 100/100/100/100 with FCP 0.8s, LCP 1.8s, CLS 0 and TBT 0ms. Real Safari automation remains unavailable because the owner’s Safari has remote automation disabled; no browser security setting was changed.
- [x] **Task 9 — Run four independent reviews** (AC: 7–11)
  - [x] Design/CRO, SEO/local, performance/a11y and brand/claims reviews completed; all confirmed technical blockers were corrected.
- [x] **Task 10 — Present the owner approval package** (AC: 12)
  - [x] Final 390/1440 captures, claims, risks, diff, weights and rollback were presented and recorded in the release evidence.
- [x] **Task 11 — Release through authorized handoff and verify production** (AC: 12, 13)
  - [x] Deploy preview through `@devops`, measure the public artifact, promote to production and record deployment IDs/public verification.
    - [x] Final protected Vercel preview `dpl_8MM6wLTLKeQtYUms3xNQHSH39ztA` reached `READY`; authenticated artifact checks matched the approved prebuilt HTML, hero and `a7-tracking.js` byte for byte. Earlier preview `dpl_8AFSgyTq6QqeJVQqCxRt5ToHz6um` is superseded.
    - [x] Exact promotion created production deployment `dpl_Rbqr8cDEUwidfkhwXAXYntKknKSh`; public HTML, hero and tracking returned HTTP 200 and matched the final preview byte for byte. Canonical, CTA/prefill/funnel/phone/JSON-LD and 390/1440 visual smoke passed.
  - [x] Google Ads remained unchanged; DevOps used only Vercel deployment/promotion and read-only public verification.
- [ ] **Task 12 — Complete the monitored release window** (AC: 13)
  - [x] Immediate checkpoint passed at 2026-08-21 00:29 EDT and the dated 24h/72h/7d/14d/28d ledger was opened in the release evidence.
  - [ ] Record 24h, 72h, 7d, 14d and 28d readings when those checkpoints occur; never claim causal uplift from raw clicks.
- [x] **Task 13 — Maintain the story record** (AC: 1–13)
  - [x] Execution evidence, decisions, findings, validation notes and the implementation file list are recorded below; only future monitoring checkpoints remain open.

## Dev Notes

### Authoritative sources and precedence

- O prompt aprovado define missão, baseline, direção criativa, processo, critérios de aceite e gate de publicação desta story. [Source: `marketing/google-ads/2026-07-guest-laundry-search/PROMPT-CODEX-REDESIGN-PREMIUM-LAKE-BUENA-VISTA.md#prompt-mestre--redesign-premium-lake-buena-vista`]
- O `MANIFESTO.md` é a fonte de verdade do produto e define Guest Laundry, WhatsApp oficial, stack estático, preços, mínimo e Express condicionado. [Source: `MANIFESTO.md#1-o-que-é-o-a7-laundry`; `MANIFESTO.md#2-modelo-de-negócio-canônico`; `MANIFESTO.md#5-arquitetura-do-site`; `MANIFESTO.md#7-princípios`]
- A oferta paga refinada condiciona endereço, handoff, janela, preço e disponibilidade e proíbe promessa garantida ou afiliação. Em divergência, usar copy condicional até revalidação, não a alternativa mais conveniente. [Source: `marketing/google-ads/2026-07-guest-laundry-search/CANONICAL-PAID-OFFER-2026-08-18.md#oferta`; `#claims-autorizáveis`; `#claims-não-autorizados`]
- O sinal LBV valida público e dor, mas não atribui deterministicamente cada pedido ao Google Ads; WhatsApp aberto continua microconversão. [Source: `marketing/google-ads/2026-07-guest-laundry-search/COMMERCIAL-SIGNAL-LAKE-BUENA-VISTA-2026-08-19.md#resultado-executivo`; `#limite-da-confirmação-de-origem`]
- A análise Perplexity confirma a tese e proíbe criar páginas/artigos duplicados ou regressar para hipóteses já descartadas. [Source: `marketing/google-ads/2026-07-guest-laundry-search/PERPLEXITY-STRATEGIC-DELTA-2026-08-18.md#veredito-executivo`]
- A7-003 já concluiu o rebuild anterior e estabeleceu `A7 Ref`, first touch e tratamento de WhatsApp como microconversão. Esta story usa esse contrato como dependência e não modifica o histórico da A7-003. [Source: `docs/stories/a7-003-conversion-observability.md#acceptance-criteria`; `#completion-notes-list`]

### Existing technical contract

- O site público é HTML/CSS/JS estático; o redesign deve permanecer nesse stack salvo decisão arquitetural explícita. [Source: `MANIFESTO.md#5-arquitetura-do-site`]
- A página-alvo é `blog/laundry-lake-buena-vista.html`; a URL, canonical, schema, WhatsApp e conteúdo atuais são baseline, não design a preservar. [Source: `blog/laundry-lake-buena-vista.html`]
- `a7-tracking.js` mapeia o slug como `FUNNEL=geo`, `PERSONA=hotel` e `GEO=lake-buena-vista`, adiciona o `A7 Ref` e rastreia clique de WhatsApp. [Source: `a7-tracking.js#L82-L180`; `a7-tracking.js#L203-L280`]
- `a7-business-config.js`, `a7-attribution.js` e `a7-events.js` são contratos compartilhados que devem ser preservados; alteração neles requer evidência de necessidade e regressão focada, não apenas conveniência visual. [Source: `docs/measurement-v2-foundation.md#contrato-público`; `docs/stories/a7-003-conversion-observability.md#acceptance-criteria`]
- Os comandos de qualidade verificáveis são `lint`, `typecheck`, `test` e `build:public`; testes focados existentes incluem atribuição, tracking e business destinations. [Source: `package.json#scripts`]

### Project structure notes

- O `core-config.yaml` aponta para `docs/framework/*` e fallbacks em `docs/architecture/*`, mas ambos estão ausentes neste checkout em 2026-08-20. Não há orientação arquitetural adicional disponível para citar. [Source: `.aios-core/core-config.yaml#devLoadAlwaysFiles`; inspeção do checkout]
- A story usa o padrão local `docs/stories/a7-NNN-*.md`, pois as stories A7 existentes não seguem o padrão genérico `{epic}.{story}.story.md` do template AIOS.
- Não criar um novo diretório de evidência por suposição. O executor deve usar uma convenção já existente ou registrar no Dev Agent Record onde screenshots, claim matrix e ledger foram armazenados, atualizando a File List.

### Implementation constraints

- Referências como shadcn/ui, Motion, GSAP e Lenis servem apenas para estudar princípios. Não copiar templates e não instalar dependência sem decisão/aprovação. Lenis/smooth scroll por biblioteca é proibido por padrão.
- Conteúdo essencial nunca pode depender de JavaScript. Animação não pode ocultar texto/CTA se o script falhar.
- Reviews e fotografia operacional só entram após revalidação e remoção completa de PII.
- Nenhum nome de propriedade permanece como prova sem verificação individual; logos são proibidos.
- `SEO-LBV-V2` não muda silenciosamente. Uma proposta de versão nova exige mapping e aprovação antes da publicação.
- A publicação é de autoridade exclusiva de `@devops`; a autorização do proprietário já está registrada, condicionada aos gates verdes e à ausência de desvio material.

## Testing

### Automated and build gates

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build:public`
- `node scripts/test-attribution-v2.mjs`
- `node scripts/test-tracking.mjs`
- `node scripts/guard-business-destinations.mjs`
- `git diff --check`

### Visual and interaction matrix

- Widths: 320, 375, 390, 768, 1024 and 1440px.
- Full first-fold/page captures: 320×568, 390×844, 430×932, 1024×768 and 1440×900.
- Chrome and Safari; mouse/touch and keyboard; 200% zoom; visible focus; screen-reader names/order; no JavaScript; reduced motion; simulated mobile/4G.
- Confirm no horizontal overflow, safe-area collision or CTA/FAB overlap.

### Contract and content cases

- CTA destination and prefill contain hotel, needed-by, approximate load, service and `SEO-LBV-V2`; tracking appends one valid short `A7 Ref`.
- A single click produces a single analytics/conversion event and navigation remains fail-open.
- Metadata, visible copy, FAQ and JSON-LD agree on offer and conditions.
- Express never loses its availability/capacity/window qualifier in desktop or mobile scanning.
- Canonical, robots, sitemap, rewrite, internal links and adjacent-page intent remain valid.
- No PII, hotel/Disney affiliation, fabricated proof, hidden content, essential color-only information or unsupported claim exists.

### Performance budgets

- Lighthouse mobile: Performance ≥90; Accessibility, Best Practices and SEO ≥95.
- LCP ≤2.5s; CLS ≤0.1; TBT without material regression and within Lighthouse “good”.
- Hero ideally ≤250KB; CSS new ≤50KB gzip; JS new ≤20KB gzip; initial transfer preferably ≤650KB.
- Field INP ≤200ms is assessed only when RUM/CrUX has sufficient sample.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-20 | 0.1 | Draft created from the owner-authorized premium Lake Buena Vista redesign prompt | River (`@sm`) |
| 2026-08-20 | 0.2 | Owner authorization to execute through validated publication recorded; story promoted to Ready for Dev | River (`@sm`) |
| 2026-08-21 | 0.9 | Design, content, assets, SEO differentiation, conversion contract and quality gates completed; ready for preview | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.2 | Owner-requested How It Works storyboard rebuilt, validated and promoted as the same approved preview artifact | Codex (`@ux-design-expert` / `@devops`) |
| 2026-08-21 | 1.3 | Owner-requested Time and Choice block rebuilt with canonical offer safeguards and responsive artwork | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.4 | Owner-requested Operational Proof block added with hotel-policy, evidence and tracking safeguards | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.5 | Owner-requested Local Coverage and Hotels block rebuilt with verified property names, responsive artwork and dedicated source tracking | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.6 | Owner-requested operational social proof added to the closing with verified profile constraints and schema linkage | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.7 | Trust pass adds an unobtrusive A7 contact dock, verified Google profile route and US-native SMS/call options without publishing unsupported FaceTime | Codex (`@ux-design-expert` / `@dev`) |
| 2026-08-21 | 1.8 | Owner-requested contact simplification removes every phone-call route, retains WhatsApp/SMS only and restores the complete WhatsApp mark | Codex (`@ux-design-expert` / `@dev`) |

## Dev Agent Record

### Agent Model Used

OpenAI Codex with independent design/CRO, SEO, performance/accessibility, QA and claims/red-team reviewers.

### Debug Log References

- `marketing/google-ads/2026-07-guest-laundry-search/BASELINE-PREMIUM-REDESIGN-LBV-2026-08-20.md`
- `marketing/google-ads/2026-07-guest-laundry-search/CREATIVE-DIRECTIONS-LBV-2026-08-20.md`
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-LBV-2026-08-21.md`

### Completion Notes List

- Rebuilt the existing LBV URL as the A7 Resort Editorial funnel; no new slug or dependency.
- Generated and retouched an original local hero; the first pseudo-logo variant was rejected and archived outside the public bundle.
- Preserved the canonical offer, conditional Express language, official WhatsApp, `SEO-LBV-V2` and conversion semantics.
- Added the required CTA after pricing and corrected internal-search intent overlap with the Disney Springs article.
- Corrected UnitPriceSpecification, image graph, internal links, responsive images, reduced motion, target sizes and all identified contrast failures.
- Replaced render-blocking remote fonts with a native editorial stack and added an LBV-only progressive vendor-tag gate that preserves immediate queues/click handlers while moving third-party execution out of the critical render.
- Google Ads settings were not touched.

### Validation Notes

- Final green commands: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, `git diff --check`.
- Automated result: 42 TAP tests plus site, AI-search, destination, attribution, tracking, Stripe, Ads, Meta, MOS and audit-evidence validators.
- Responsive/visual: 320/375/390/430/768/1024/1440; final 390×844 and 1440×900 first folds inspected after the last CSS change.
- Accessibility: keyboard order and visible focus passed; CTA 8.06:1, hover 10.11:1, muted 5.18:1, coral 5.34:1; no horizontal overflow; reduced-motion present.
- Lighthouse mobile lab: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.8s, LCP 1.8s, CLS 0, TBT 0ms, Speed Index 1.2s.
- Independent performance/accessibility final gate: PASS. All confirmed SEO and claims/red-team blockers were corrected.
- Cross-browser: Playwright WebKit 26.0 passed at 390×844; real Safari remains unavailable because remote automation is disabled. Field INP waits for sufficient sample, and a real screen-reader session remains unavailable.
- Owner authorization for validated publication is recorded at the top of this story. Preview/production deployment IDs and public verification were appended by `@devops`.
- Final preview deployment `dpl_8MM6wLTLKeQtYUms3xNQHSH39ztA` is `READY` at `https://a7-laundry-orlando-4u14tqwj7-dennis-a7s-projects.vercel.app`; Vercel protection remains enabled and authenticated HTML/hero/tracking hashes match the approved prebuilt artifact.
- Exact promotion completed without rebuild: production deployment `dpl_Rbqr8cDEUwidfkhwXAXYntKknKSh` is `READY` behind `https://a7laundry.com`; HTML, hero and tracking returned HTTP 200 and matched the preview hashes. Canonical, four CTA prefills, `SEO-LBV-V2`, official phone, JSON-LD and 390/1440 visual smoke passed. Immediate monitoring is complete; future 24h/72h/7d/14d/28d checkpoints remain open.
- Owner-requested branded hero revision promoted without rebuild on 2026-08-21: preview `dpl_3yz4vJKoYyq9qJoVNKupfRtpm9LW` and production `dpl_8tvwZ4S8dCNA2WKBYB73NLGRhaFn` are `READY`. Public HTML and v5 hero hashes match the approved preview (`dc78d6b…`, `7e7450dc…`); mobile 390×844 passed with the primary CTA in the first fold, zero overflow, four official WhatsApp CTAs and `SEO-LBV-V2` intact.
- Owner-requested post-hero relief revision promoted without rebuild on 2026-08-21: preview `dpl_CzecyLQqdXwHa1qx7qCpeh8A8hFF` and production `dpl_EepBdyTEETBJERkU9qkjE23Uy2hd` are `READY`. The block uses the approved copy and owner-supplied image, places text before media on mobile, adds no CTA, lazy-loads the responsive WebP and removes the internal “Lead with…” wording. Public mobile 390×844 passed with no overflow or broken image.
- Owner-requested How It Works revision promoted without rebuild on 2026-08-21: preview `dpl_F8T9DTnXq3tDY6YKVeKwMMN9oMHe` and production `dpl_2MySxYQX8mRK9YdoVLmBdxqCjpwy` are `READY`. The four owner-supplied storyboard scenes are presented as HTML-led editorial steps; unsafe embedded timing text was excluded from the crops, Express remains conditional, Standard remains approximate, and no CTA was added to the block. Public monitoring passed after promotion; Hero, Block 2, pricing, FAQ, tracking contract and Google Ads remained unchanged.
- Owner-requested Time and Choice revision promoted without rebuild on 2026-08-21: preview `dpl_9EsksfLwH8ymv5jDVBcvY5cRsTmQ` and production `dpl_3aXXFmuqw5KwDDRroDPhGBC1BXc7` are `READY`. The source image was cleaned through the built-in OpenAI ImageGen path so no unqualified timing or pricing claim remains embedded in the artwork. The HTML uses the canonical US$50 minimum despite the supplied brief's stale US$60 line, keeps Standard approximate and Express conditional, preserves `SEO-LBV-V2`, and passed 1440×900/390×844 visual QA with no overflow. Public asset hashes and the full monitor passed after promotion.
- Owner-requested Operational Proof revision promoted without rebuild on 2026-08-21: preview `dpl_GD6uLWKBqrbD1CsMH8zYZRxjanE3` and production `dpl_FvYktgiZH57oP69TFeNyCig26qBR` are `READY`. The new block presents the supplied three-scene image as an illustrative workflow rather than documentary proof, qualifies Bell/front-desk handoff by hotel policy, publishes no unverified rating or testimonial, and adds a fifth WhatsApp CTA with the dedicated `SEO-LBV-PROOF` source while preserving all required prefill fields. Desktop 1440×900 and mobile 390×844 passed with no overflow; public asset hashes and the full monitor passed after promotion.
- Owner-requested Local Coverage and Hotels revision promoted without rebuild on 2026-08-21: preview `dpl_E9RR8Rzq5E2gC9xtYCoV8WaJyqhH` and production `dpl_33wSp24rNv6Zw3LLRArNtwf6E4vz` are `READY`. The transformed HTML, desktop/mobile coverage artwork and tracking matched the approved hashes in preview and public production. The six property names remain an explicitly geographic list, not proof of partnership or guaranteed pickup; the sixth official WhatsApp CTA preserves the required hotel/address, needed-by, load and service fields and uses owner-authorized `SEO-LBV-HOTELS`. Canonical, four JSON-LD blocks, six hotels and all six WhatsApp CTAs passed the immediate public smoke. Google Ads remained unchanged.
- Owner-requested social-proof revision promoted without rebuild on 2026-08-21: preview `dpl_5ojm5UdiHHytEmhLqUrafkp8fDSb` and production `dpl_GyjuuV6NH6SygxK7frNPgR3QcC9F` are `READY`. Public HTML and tracking returned HTTP 200 and matched the approved preview hashes. The closing provides the exact Instagram and Facebook destinations with 48px targets, accessible labels and safe external-link attributes; the LocalBusiness `sameAs` contains only those two profiles and YouTube remains absent. Six WhatsApp CTAs, canonical and four JSON-LD blocks passed the immediate public smoke. Google Ads remained unchanged.
- Owner-requested trust/contact revision promoted without rebuild on 2026-08-21: preview `dpl_HUbcUKhpbDzWCM4jpkJMxAcc7edQ` and production `dpl_4aNhy7MrENjDZR4UveujF2wno4CG` are `READY`. The compact A7 guest-support dock appears only after the hero and is removed before the closing enters the viewport. It offers the verified WhatsApp destination, an SMS route and the existing telephone route with 44px targets; the new sources are `SEO-LBV-FLOAT` and `SEO-LBV-SMS`. The owner-supplied Google Business Profile share URL is presented as a visible verification route with safe external-link attributes but is deliberately excluded from `sameAs`; FaceTime remains absent. Preview and production matched the approved HTML/tracking hashes byte for byte. Public 390×844 and 1440×900 checks confirmed the dock visible after the hero, hidden in the closing and fully inside the viewport. Seven WhatsApp CTAs, one SMS route, three telephone links, canonical and four JSON-LD blocks passed the immediate public smoke. Google Ads remained unchanged.
- Owner-requested contact simplification promoted without rebuild on 2026-08-21: preview `dpl_AzkqwmuhcijzsAgfnzD4o2FHKCTL` and production `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS` are `READY`. All three `tel:` routes were removed from this landing. The closing and footer now offer prefilled SMS, while the compact dock is a two-choice WhatsApp/SMS control with the complete WhatsApp symbol. Preview and production matched the approved HTML/tracking hashes byte for byte; public HTML, hero and tracking returned HTTP 200. The release smoke confirmed seven official WhatsApp links, three official SMS routes, zero telephone/FaceTime routes, one complete `SEO-LBV-FLOAT` prefill, canonical and four JSON-LD blocks. WhatsApp destination, funnel codes and tracking semantics remain unchanged; Google Ads was not touched.

### File List — Implemented Scope

- `docs/stories/a7-011-premium-lake-buena-vista-redesign.md` — story and execution evidence.
- `blog/laundry-lake-buena-vista.html` — primary implementation target.
- `blog/img/` — only local assets actually created/optimized for the redesign; exact files must be recorded.
- `sitemap.xml` — only if the existing image/metadata entry requires a factual update.
- `blog/index.html` — only if its existing link/preview to the target becomes stale.
- `blog/hotel-laundry-service-orlando.html` — only if the current internal link/anchor requires adjustment.
- `blog/laundry-near-disney-world.html` — only if intent differentiation or internal linking requires adjustment.
- `blog/laundry-disney-springs-area.html` — only if intent differentiation or internal linking requires adjustment.
- `blog/orlando-vacation-rental-laundry-guide.html` — only if the current internal link/anchor requires adjustment.
- `blog/img/lbv-vacation-time-hero-v5.webp` — owner-requested branded desktop hero.
- `blog/img/lbv-vacation-time-hero-v5-mobile.webp` — owner-requested branded mobile hero.
- `blog/img/lbv-post-hero-relief-v1.webp` — owner-requested desktop image for the emotional relief block.
- `blog/img/lbv-post-hero-relief-v1-mobile.webp` — owner-requested mobile image for the emotional relief block.
- `blog/img/lbv-how-step-01-hotel-pickup-v1.webp` — cropped storyboard scene for hotel handoff.
- `blog/img/lbv-how-step-02-timing-v1.webp` — cropped storyboard scene for confirmed service timing.
- `blog/img/lbv-how-step-03-folded-return-v1.webp` — cropped storyboard scene for clean folded return.
- `blog/img/lbv-how-step-04-keep-plans-v1.webp` — cropped storyboard scene for the emphasized emotional close.
- `blog/img/lbv-service-pace-day-night-v1.webp` — cleaned desktop day/night service-choice artwork.
- `blog/img/lbv-service-pace-day-night-v1-mobile.webp` — responsive mobile crop of the cleaned service-choice artwork.
- `blog/img/lbv-operational-proof-v1.webp` — desktop operational-workflow illustration for the trust block.
- `blog/img/lbv-operational-proof-v1-mobile.webp` — responsive mobile operational-workflow illustration.
- `blog/img/lbv-local-coverage-v1.webp` — desktop local-coverage illustration.
- `blog/img/lbv-local-coverage-v1-mobile.webp` — responsive local-coverage illustration.
- `service-areas.html` — LBV internal link and canonical pickup/delivery wording.
- `sitemap.xml` — final v5 image graph.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-vacation-time-hero-source-v3-a7-branded.png` — non-public source master for the branded v5 hero.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-post-hero-relief-source-v1.png` — non-public owner-supplied source for the post-hero relief block.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-how-it-works-storyboard-source-v1.png` — non-public owner-supplied source for the four-scene How It Works storyboard.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-service-pace-day-night-source-v1.png` — non-public cleaned ImageGen master derived from the owner-supplied Block 4 concept.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-operational-proof-source-v1.png` — non-public owner-supplied source for the Block 5 operational workflow.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-local-coverage-source-v1.png` — non-public owner-supplied source for Block 6 local coverage.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-vacation-time-hero-source-v2-clean.png` — non-public source master.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-vacation-time-hero-source-v1-rejected-glyph.png` — rejected source retained as audit evidence.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-vacation-time-hero-v3-rejected-glyph.webp` — rejected derivative retained outside public bundle.
- `marketing/google-ads/2026-07-guest-laundry-search/assets/lbv-vacation-time-hero-v3-mobile-rejected-glyph.webp` — rejected mobile derivative retained outside public bundle.
- `marketing/google-ads/2026-07-guest-laundry-search/BASELINE-PREMIUM-REDESIGN-LBV-2026-08-20.md` — baseline/claims/rollback evidence.
- `marketing/google-ads/2026-07-guest-laundry-search/CREATIVE-DIRECTIONS-LBV-2026-08-20.md` — creative routes and asset ledger.
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-LBV-2026-08-21.md` — release, public verification and monitoring ledger.
- `a7-tracking.js` — conditional vendor-loading primitive used only when a page explicitly opts in; immediate attribution/event queues and fail-open destinations preserved.
- `scripts/test-tracking.mjs` — regression for deferred vendor release, single vendor load and single WhatsApp/Ads events.
- `scripts/monitor-lbv-release.mjs` — repeatable public checkpoint monitor with released-artifact hashes and conversion/claims contract checks.
- `scripts/test-monitor-lbv-release.mjs` — regression test for the LBV monitor contract.
- `package.json` — `monitor:lbv` command and monitor lint/test gates.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-2026-08-21-immediate.json` — immutable immediate production checkpoint evidence.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-2026-08-21-immediate-seo.json` — immutable expanded checkpoint covering robots, sitemap and adjacent-page intent.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/LBV-COMMERCIAL-RECONCILIATION.md` — PII-free source hierarchy, availability boundary and checkpoint adjudication contract.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-commercial-checkpoint-template.json` — valid 24h checkpoint template with unavailable values preserved as null.
- `scripts/validate-lbv-commercial-checkpoint.mjs` — fail-closed commercial checkpoint validator.
- `scripts/test-validate-lbv-commercial-checkpoint.mjs` — regressions against fabricated revenue, PII fields and unsupported commercial rollback.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-indexnow-submission-2026-08-21.json` — single-URL IndexNow receipt evidence with indexing limitation.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-gsc-access-2026-08-21.json` — PII-free record of the current Search Console access boundary.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-ga4-access-2026-08-21.json` — PII-free record proving that unrelated GA4 properties were rejected.
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/lbv-2026-08-21-immediate-delivery.json` — immutable 39-check delivery/security production evidence.

**Protected unless a separately evidenced regression requires change:** `a7-business-config.js`, `a7-attribution.js`, `a7-events.js`, `a7-tracking.js`, `vercel.json`, Google Ads artifacts and A7-003.
