# Story A7-012 — Premium Orlando Resort Area Guest-Laundry Redesign

**Status:** Released — Monitoring

**Created:** 2026-08-21

**Source:** Autorização explícita do proprietário para reformar a URL existente `/blog/laundry-near-universal-orlando` no padrão premium/editorial alcançado em Lake Buena Vista, com SEO, GEO, AI Search, imagens originais geradas via Lovart.ai, comunicação orientada às dores reais de hóspedes e publicação após QA. O proprietário determinou não mencionar nem reproduzir marcas de parques, hotéis ou terceiros.

## Owner Authorization

Em 2026-08-21, o proprietário autorizou a execução desta story de ponta a ponta, incluindo criação dos assets no Lovart.ai, download, otimização, implementação, QA e publicação. A autorização permite avançar autonomamente até o release quando todos os gates estiverem verdes e o resultado permanecer dentro desta story. Ela não dispensa preservação da URL, canonical, sitemap e tracking, inspeção humana dos assets, rollback, QA independente nem a autoridade exclusiva de `@devops` para push, release e deploy.

### Owner-authorized payment reassurance amendment

Após o primeiro release, o proprietário solicitou uma camada discreta no rodapé para reduzir a fricção de pagamento, especialmente para visitantes estrangeiros. O incremento deve listar somente opções comprovadas no projeto: link seguro de pagamento em USD, Zelle, Venmo, Cash App e dinheiro; informar que o total é confirmado após a pesagem; e alertar para nunca enviar dados de cartão pelo WhatsApp. Não deve exibir bandeiras de cartão não verificadas, transformar a página em checkout nem alterar preço, tracking ou contato.

## Executor Assignment

```yaml
executor: "@ux-design-expert"
quality_gate: "@dev"
quality_gate_tools:
  - "Lovart.ai asset generation through the authenticated Chrome session"
  - "human inspection of every generated asset at 100% zoom"
  - "browser visual inspection at required desktop and mobile viewports"
  - "manual WCAG 2.1 AA inspection"
  - "structured-data and AI-search validation"
  - "npm run lint"
  - "npm run typecheck"
  - "npm test"
  - "npm run build:public"
  - "focused attribution, tracking and business-destination tests"
  - "git diff --check"
```

**Handoffs obrigatórios:** `@dev` implementa/revisa os contratos técnicos, `@qa` emite o veredito final e `@devops` executa qualquer publicação remota. Se o Lovart.ai estiver indisponível, se um asset não puder ser licenciado/inspecionado ou se a única solução exigir marca de terceiro, a implementação deve pivotar para composição original neutra ou pausar esse asset; nunca relaxar o gate de marca.

## Story

**As a** hotel or resort guest in Orlando with another full day of plans,
**I want** a clear, human and trustworthy laundry-pickup experience built around my hotel, clothing needs and return deadline,
**so that** I can keep my trip moving and contact A7 with enough information to confirm the right service pace.

## Business Context

A URL existente representa a região turística ao norte da International Drive, mas hoje parece um artigo/template genérico: usa Tailwind CDN e fontes/ícones remotos, contém copy repetitiva, entidades HTML duplamente escapadas, chamadas telefônicas que já não pertencem ao padrão atual e afirmações operacionais absolutas como pickup “at the time you choose”. A imagem atual contém silhuetas de atração reconhecíveis, o que conflita com a decisão do proprietário de não usar marcas ou trade dress.

O padrão Lake Buena Vista provou uma arquitetura editorial mais clara: dor concreta do hóspede, prazo, handoff condicionado, escolha Standard/Express, prova operacional e conversão por mensagem. Esta story reutiliza os princípios e contratos validados, não o design ou a narrativa de Lake Buena Vista. A nova página deve possuir identidade própria e se diferenciar da página de International Drive.

### Intent boundary

| URL | Intenção primária | Público e contexto | Conteúdo que deve dominar |
|---|---|---|---|
| `/blog/laundry-near-universal-orlando` | Hóspede/família entre dias intensos de atrações, com roupas acumuladas e prazo para o próximo plano | Hotel/resort, calor, roupas usadas ou molhadas, crianças/grupo, checkout/voo/próximo hotel | Recuperar roupas limpas sem interromper a viagem; hotel + deadline + volume + escolha de ritmo |
| `/blog/laundry-international-drive-orlando` | Cobertura ampla do corredor I-Drive | Hotéis, convenções, compras, atrações e deslocamento ao longo do corredor | Alcance geográfico amplo e conveniência no corredor; não competir pelo mesmo H1/FAQ/anchors da página desta story |
| `/blog/laundry-lake-buena-vista` | Hotel pickup em Lake Buena Vista | Corredor hoteleiro específico e sinal comercial próprio | Relevância local LBV, hotel handoff e preservação do tempo de férias |

A ausência voluntária de nomes de parques/hotéis reduz a superfície de branded search que a página pode capturar. Isso é um trade-off aceito pelo proprietário. SEO/GEO/AI Search devem ser fortes em intenção, entidade A7, região turística de Orlando, hotel laundry pickup, wash and fold, prazo e respostas úteis — nunca por repetição de marca de terceiro.

## Dependencies and Preconditions

- A7-011 é a referência de padrão editorial, QA, assets, performance, tracking e release; não deve ser copiada literalmente nem reaberta.
- `MANIFESTO.md` e `CANONICAL-PAID-OFFER-2026-08-18.md` definem a oferta e prevalecem sobre a copy antiga da página.
- `blog/TEMPLATE-GUIDE.md` orienta SEO, FAQ, links internos e GEO answer blocks, mas sua prioridade antiga `WhatsApp → SMS → Call` foi superada para esta experiência pela decisão recente do proprietário: manter somente WhatsApp e SMS.
- A página, o rewrite, o card no blog, o sitemap e o mapeamento de tracking já existem. A implementação deve preservar esses contratos e só editá-los quando uma atualização for necessária e testada.
- O worktree contém alterações do proprietário. Baseline, diff e rollback devem ser registrados antes da primeira edição, sem sobrescrever mudanças preexistentes.
- Dados GSC, GA4, CrUX ou operação não disponíveis devem ser registrados como `unavailable`, nunca como zero.
- Toda informação local, operacional, social ou factual nova deve possuir fonte verificável antes de entrar na copy ou schema.

## Scope

### Included

- Auditoria e reconstrução da URL existente como experiência premium/editorial, mobile-first e diferenciada.
- Copy em inglês americano estruturada pelas dores reais de hóspedes, com resposta direta para mecanismos de busca e agentes de IA.
- Imagens originais geradas via Lovart.ai pelo agente principal, download dos masters, inspeção humana, ledger, conversão e publicação de derivados WebP/AVIF responsivos.
- SEO on-page, GEO/local relevance, entity consistency, answer-first content, FAQ e JSON-LD factual.
- Conversão exclusivamente por WhatsApp e SMS, com mensagem pré-preenchida e atribuição regional.
- Preservação de URL, canonical, rewrite, sitemap, blog index e contratos de tracking.
- QA visual, técnico, acessível, de performance, marca/claims, publicação por `@devops`, validação pública, rollback e monitoramento.

### Excluded

- Novo slug, redirect, canonical para outra página ou nova money page.
- Reforma da página de International Drive, Lake Buena Vista ou qualquer outra URL.
- Alteração de Google Ads, orçamento, campanha, palavras-chave, bidding ou conversões.
- Uso público de nome, logo, personagem, atração, hotel, parque, mapa proprietário, arquitetura reconhecível, trade dress, uniforme, fonte, slogan, áudio, badge ou imagem de terceiros.
- Qualquer texto que sugira “official”, “partner”, “approved”, “preferred”, acesso especial, endosso ou afiliação.
- Reviews, ratings, volume de clientes, tempos, disponibilidade, cobertura, cutoff, hotel handoff ou prova operacional sem revalidação.
- Telefone/call/FaceTime, formulário falso, chatbot falso, pop-up automático, countdown, fake scarcity, autoplay ou widget social pesado.
- Dependência nova, framework novo, Tailwind CDN, fonte/ícone remoto ou script visual de terceiro sem necessidade demonstrada e aprovação arquitetural.

## Business, Claim and Brand Invariants

- Standard: a partir de **US$3.25/lb**, retorno aproximado em **24h**.
- Express: a partir de **US$3.95/lb**, retorno em até **8h somente após confirmação de disponibilidade, capacidade e janela**.
- Pedido mínimo turístico: **US$50**.
- Pickup e delivery: incluídos somente na área/endereço confirmados.
- WhatsApp/SMS oficial: **+1 407-670-8839**.
- Endereço/hotel, handoff, janela, preço, disponibilidade e prazo de retorno são confirmados antes da coleta.
- Lobby, front desk, concierge ou bell services só podem aparecer como possibilidades condicionadas à política do hotel; nunca como parceria ou procedimento garantido.
- Solicitações podem chegar 24/7; isso não significa pickup 24/7.
- “Pickup in as little as 1 hour” e Express 8h só podem aparecer quando a condição de confirmação estiver no mesmo contexto de leitura.
- O identificador estático proposto para esta página é `SEO-ORLANDO-RESORT-V1`; sua adoção exige mapeamento explícito no tracking antes da publicação. Se o contrato atual não aceitar um novo código, preservar o identificador existente e documentar a decisão — nunca trocar silenciosamente.
- Clique de WhatsApp/SMS é microconversão, não venda, pedido pago ou receita.
- Nenhum nome ou marca de parque/hotel/atração aparece em copy visível, metadata, schema, alt text, nome exposto de seção ou asset visual. A string do slug/canonical histórico é a única exceção técnica autorizada.
- Não publicar `guaranteed`, `instant`, `cheapest`, `lowest price`, `best`, `#1`, `top-rated`, `no minimum`, `at your chosen time`, `same day` absoluto ou afiliação.

## Communication Framework

A página deve seguir um fluxo humano e escaneável, baseado em `situação → fricção → prazo → alívio → prova → escolha → ação`:

1. **Situação:** o hóspede ainda tem planos em Orlando e as roupas limpas estão acabando.
2. **Fricção:** calor, roupa usada/molhada, crianças/grupo e mala cheia criam volume mais rápido que o esperado.
3. **Prazo:** checkout, voo, próximo hotel, jantar ou o próximo dia planejado definem a necessidade real.
4. **Alívio:** A7 coordena pickup e return para que o hóspede não pare o roteiro.
5. **Prova:** explicar o processo, confirmação humana, handoff condicionado, roupas lavadas/secas/dobradas e retorno coordenado; sem selos ou números inventados.
6. **Escolha:** Standard ou Express como decisão de agenda, com preço, mínimo e condições juntos.
7. **Ação:** enviar hotel/endereço, room opcional, needed-by, volume aproximado e ritmo desejado por WhatsApp ou SMS.

Evitar jargão interno, linguagem de framework, “marketing voice”, ataque à lavanderia do hotel e repetição mecânica de keywords. A mensagem central é preservar continuidade e controle da viagem.

## Acceptance Criteria

1. **Baseline, truth, rights and rollback are captured before editing**
   - [ ] Registrar `git status`, mudanças preexistentes, commit/deployment público de referência e procedimento de rollback sem tocar em arquivos fora do escopo.
   - [ ] Capturar screenshots desktop/mobile, HTML/metadata/schema/headings, links, CTAs, prefills, tracking, assets/peso e métricas disponíveis da página atual.
   - [ ] Produzir matrizes `claim | fonte | data | status | condição | copy permitida` e `asset | origem | titularidade/licença | prompt | inspeção | derivados`.
   - [ ] Registrar mapa das três URLs da tabela de intent boundary, incluindo title, H1, canonical, anchors, FAQ e GSC quando disponível.

2. **The design establishes an original Orlando resort-area identity**
   - [ ] O resultado atinge o padrão premium/editorial de A7-011 sem duplicar hero, cores, sequência visual ou imagens de Lake Buena Vista.
   - [ ] A direção visual comunica calor da Flórida, hotel/resort, família/grupo, movimento e alívio por meio de composição original neutra.
   - [ ] Não parece template, dashboard, bento grid, stock genérico, página de turismo, dark/gold automático ou cópia de uma marca de hospitalidade.
   - [ ] Hero, header e primeiro CTA funcionam em 1440×900 e 390×844 antes de expandir a implementação para a página inteira.

3. **Lovart.ai assets are original, lawful and production-ready**
   - [ ] O agente principal gera os assets na sessão autenticada do Lovart.ai com prompts que proíbem explicitamente logos, texto, park imagery, rides, mascots, recognizable architecture, uniforms, signage e trade dress.
   - [ ] Masters são baixados e preservados em diretório de evidência; prompts integrais, data, ferramenta e decisão de uso/rejeição entram no ledger.
   - [ ] Cada imagem é inspecionada em 100% para anatomia, mãos, tecido, bag/embalagem, reflexos, geometria, placas, pseudo-texto, pseudo-logo, PII e semelhança com propriedade real.
   - [ ] Qualquer glyph, nome, marca, atração ou arquitetura reconhecível reprova o asset; retocar só é permitido quando não mascara risco material.
   - [ ] Derivados desktop/mobile usam WebP/AVIF, dimensões explícitas, `srcset`/`sizes`; apenas o LCP recebe `fetchpriority="high"`, demais imagens são lazy.

4. **The page tells one continuous guest story**
   - [ ] A abertura comunica, em até cinco segundos: laundry pickup para hóspedes na região turística de Orlando, preservação dos planos e ação por mensagem.
   - [ ] A narrativa segue o Communication Framework e cobre roupas acabando, calor/roupa molhada, família/grupo e prazo sem virar uma grade pesada de cards.
   - [ ] “How it works” explica mensagem → confirmação → handoff permitido → wash/dry/fold → retorno coordenado.
   - [ ] Standard e Express são escolhas de agenda; condições, preço e mínimo permanecem juntos e escaneáveis no mobile.
   - [ ] Prova operacional verificável e presença humana aparecem antes do fechamento; prova visual gerada não é apresentada como fotografia documental da operação real.
   - [ ] O fechamento oferece apenas WhatsApp e SMS, Google Business Profile e redes oficiais verificadas quando já existirem no projeto.

5. **WhatsApp and SMS conversion reflect the real customer need**
   - [ ] CTAs primários levam ao WhatsApp oficial; SMS é a única rota secundária. Não existe `tel:`, Call ou FaceTime na página.
   - [ ] O prefill solicita `Hotel/address`, `Room (optional)`, `Checkout / needed by`, `Approximate bag/load`, `Standard or Express` e o código regional aprovado.
   - [ ] O botão WhatsApp usa o logo completo, possui nome acessível e não depende de biblioteca externa.
   - [ ] CTA aparece no hero, após serviço/preço/prova e no fechamento sem multiplicação excessiva ou competição entre ações.
   - [ ] GCLID/GBRAID/WBRAID/UTM, first/last touch, `page_type=bofu`, `geo=universal` existente e `A7 Ref` permanecem preservados; analytics falho não bloqueia a navegação.
   - [ ] Um clique dispara um único evento/microconversão e nunca é contabilizado como venda.

6. **SEO, GEO and AI Search are strong without brand borrowing**
   - [ ] URL, clean rewrite, self-canonical, `index, follow`, sitemap e card do blog existentes permanecem ativos; nenhum redirect ou slug novo é criado.
   - [ ] Title, meta description, H1 único e headings refletem `Orlando hotel laundry pickup`, `resort-area laundry service`, `wash and fold pickup`, `hotel pickup` e prazo de retorno com linguagem natural, sem keyword stuffing.
   - [ ] Um answer-first block em HTML próximo ao topo responde quem atende, o que faz, para quem, área sujeita à confirmação, preço inicial, mínimo e como contatar.
   - [ ] Conteúdo oferece entidades e relações claras para AI Search: A7 Laundry → independent Orlando laundry service → hotel/resort guest → pickup → wash/dry/fold → coordinated return → WhatsApp/SMS.
   - [ ] FAQ visível e `FAQPage` respondem às mesmas perguntas sobre hotel pickup, handoff, necessidade de presença, prazo/checkout, Express condicional, preço/mínimo, volume/suitcase e como solicitar.
   - [ ] `WebPage` ou `Article`, `LocalBusiness/LaundryService`, `Service`, `FAQPage` e `BreadcrumbList` usam IDs estáveis e fatos idênticos à copy visível; não incluir `AggregateRating` sem revalidação.
   - [ ] OG/Twitter usam o asset original correto; alt texts descrevem o conteúdo sem inserir marcas ou keywords artificiais.
   - [ ] Ao menos quatro links internos úteis permanecem: money page, pricing, service areas e conteúdo de prazo/processo; anchors não duplicam a intenção de I-Drive.

7. **The page remains differentiated from International Drive and Lake Buena Vista**
   - [ ] Title, H1, opening, primary answer, FAQ e internal anchors não reutilizam o mesmo foco semântico dominante da página I-Drive.
   - [ ] A página desta story prioriza hóspede/família + roupas para o próximo dia + deadline; I-Drive permanece corredor amplo/convenções e LBV permanece contexto local próprio.
   - [ ] Não adicionar canonical cruzado, redirect, `noindex` ou consolidação sem evidência de GSC e decisão explícita.
   - [ ] Links entre Universal/I-Drive, se mantidos, explicam a diferença de intenção e não formam páginas doorway com copy substituída por localização.

8. **Accessibility, resilience and performance pass objective gates**
   - [ ] HTML semântico, landmarks, ordem de headings, foco visível, teclado, nomes acessíveis, contraste WCAG AA, touch targets ≥44px e zoom 200% passam.
   - [ ] Conteúdo essencial, navegação e contato permanecem disponíveis sem JavaScript; reduced motion remove entradas/transições não essenciais.
   - [ ] Não há overflow horizontal nem CTA/sticky cobrindo texto, FAQ, footer ou safe-area em 320/375/390/430px.
   - [ ] Lighthouse mobile atinge Performance ≥90 e Accessibility/Best Practices/SEO ≥95; LCP ≤2.5s, CLS ≤0.1 e TBT dentro do indicador “good”.
   - [ ] Hero idealmente ≤250KB, carga inicial preferencialmente ≤650KB, CSS novo ≤50KB gzip e JS novo ≤20KB gzip; qualquer regressão material exige redesign ou aprovação.
   - [ ] Tailwind CDN, Google Fonts e Material Symbols remotos da página antiga são removidos quando o design puder ser entregue em HTML/CSS/SVG local, sem introduzir nova dependência.

9. **QA verifies brand, claims, tracking and the full customer path**
   - [ ] Revisões independentes cobrem design/hospitalidade/CRO; SEO/GEO/AI Search/canibalização; performance/acessibilidade; marca/claims/privacidade.
   - [ ] Zero ocorrência pública de nome/logo/trade dress de parque, hotel ou atração, exceto a string inevitável no slug/canonical histórico, é confirmada por busca automatizada e inspeção visual.
   - [ ] Zero PII, prova fabricada, entidade HTML duplamente escapada, promessa absoluta ou call route permanece.
   - [ ] CTAs WhatsApp/SMS, prefill, código regional, `A7 Ref`, evento único, canonical, robots, sitemap, rewrite, JSON-LD e destinos oficiais passam.
   - [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, testes focados e `git diff --check` passam.

10. **Release is reversible and production is monitored**
   - [ ] Antes do deploy, registrar screenshots before/after em desktop/mobile, claim matrix, asset ledger, diff, pesos, resultados, riscos e rollback.
   - [ ] Push/release/deploy são executados exclusivamente por `@devops` após veredito verde de `@qa`.
   - [ ] Após publicação, página, CSS/JS e assets retornam HTTP 200; CTA, SMS, prefill, tracking, canonical, schema, robots e sitemap são verificados na URL pública.
   - [ ] Monitor sintético específico valida hash/versionamento, destinos, ausência de call/FaceTime/marcas, contratos SEO/schema e assets críticos sem declarar resultado comercial.
   - [ ] Evidências de 24h, 72h, 7d, 14d e 28d registram disponibilidade, indexação/GSC, CWV quando houver amostra, CTA, leads qualificados, pedidos pagos e receita/margem reconciliadas.
   - [ ] Rollback é acionável para indisponibilidade, quebra de tracking/contato, divergência de claims, violação de marca, regressão material de indexação/performance ou incompatibilidade operacional.

## Tasks / Subtasks

- [x] **Task 1 — Freeze baseline and rollback boundary** (AC: 1, 6, 10)
  - [x] Registrar worktree, commit/deploy público, screenshots, HTML/SEO/schema/tracking, pesos e dados disponíveis.
  - [x] Produzir claim matrix, intent map e rollback sem alterar arquivos do proprietário fora do escopo.

- [x] **Task 2 — Define the differentiated communication and visual direction** (AC: 2, 4, 7)
  - [x] Converter o Communication Framework em wireframe/copy real para hero e seis ou menos beats narrativos.
  - [x] Comparar a proposta com Universal/I-Drive/LBV e remover sobreposição semântica ou visual material.
  - [x] Validar a abertura em 1440×900 e 390×844 antes da página completa.

- [x] **Task 3 — Generate and qualify Lovart.ai assets** (AC: 2, 3, 9)
  - [x] Criar prompts neutros e negativos; gerar variantes na sessão autenticada e baixar masters.
  - [x] Rejeitar glyphs, marcas, atrações/arquitetura reconhecíveis, falhas humanas e aparência plástica.
  - [x] Registrar ledger, converter derivados responsivos e validar peso/dimensões/alt.

- [x] **Task 4 — Rebuild the existing static page** (AC: 2, 4, 5, 8)
  - [x] Implementar o sistema editorial em HTML/CSS/JS estático sem Tailwind CDN, fonte ou ícone remoto.
  - [x] Construir fluxo contínuo, prova operacional, escolha de ritmo e fechamento WhatsApp/SMS.
  - [x] Preservar progressive enhancement, reduced motion, foco, targets, safe-area e comportamento sem JS.

- [x] **Task 5 — Implement SEO/GEO/AI Search contracts** (AC: 6, 7)
  - [x] Reescrever metadata, headings, answer block, FAQ, internal links, alt/OG e JSON-LD com consistência factual.
  - [x] Preservar slug/canonical/rewrite/sitemap/blog index e registrar diferenças de intenção com I-Drive/LBV.
  - [x] Validar JSON-LD, FAQ parity, uma H1, headings e ausência de keyword/brand stuffing.

- [x] **Task 6 — Preserve conversion and attribution** (AC: 5, 9)
  - [x] Configurar WhatsApp/SMS oficiais e prefill com hotel, prazo, volume, ritmo e código aprovado.
  - [x] Preservar IDs/click handlers, `A7 Ref`, UTMs/click IDs, first/last touch, `page_type` e `geo`.
  - [x] Adicionar testes para evento único, fail-open, zero `tel:`/FaceTime e logo completo do WhatsApp.

- [x] **Task 7 — Add focused release monitoring and run QA** (AC: 8–10)
  - [x] Criar monitor/teste da página com allowlist de hashes/versionamento e contratos de contato/SEO/schema/assets/marca.
  - [x] Executar matriz visual, acessibilidade, reduced motion, no-JS, performance e quatro disciplinas de revisão independente.
  - [x] Rodar todos os gates obrigatórios e corrigir findings críticos/altos antes do handoff.

- [ ] **Task 8 — Release, verify and monitor** (AC: 10)
  - [x] `@qa` registra veredito verde para preview; `@devops` publica somente o artefato aprovado.
  - [x] Verificar produção, registrar deployment ID/hash/evidência e confirmar rollback.
  - [ ] Executar checkpoints 24h/72h/7d/14d/28d sem confundir cliques com vendas.

## Dev Notes

### Source-of-truth summary

- O produto é guest wash & fold por libra para hóspedes de hotel/resort/Airbnb, com agendamento WhatsApp-first. A promessa emocional canônica é preservar o tempo em Orlando. [Source: `MANIFESTO.md#1-o-que-é-o-a7-laundry`; `MANIFESTO.md#8-arquitetura-de-mensagem-canônica`]
- A oferta pública é Standard a partir de US$3.25/lb (~24h), Express a partir de US$3.95/lb (até 8h após confirmação), mínimo US$50 e pickup/delivery incluídos na área confirmada. [Source: `marketing/google-ads/2026-07-guest-laundry-search/CANONICAL-PAID-OFFER-2026-08-18.md#oferta`]
- A7-011 estabelece o padrão de narrativa editorial, asset ledger, hero responsivo, CTA/prefill, QA objetivo, release autorizado e monitoramento sem falsa causalidade. Esta story deve reutilizar contratos, não copiar identidade ou contexto LBV. [Source: `docs/stories/a7-011-premium-lake-buena-vista-redesign.md#acceptance-criteria`; `#testing`]
- A página atual já possui canonical, rewrite, sitemap, blog card, `page_type=bofu` e `geo=universal`; esses contratos são preservados. [Source: `blog/laundry-near-universal-orlando.html`; `vercel.json`; `sitemap.xml`; `blog/index.html`; `a7-tracking.js`]
- O template guide exige answer block, FAQ visível igual ao schema, BreadcrumbList, quatro links internos, conditional same-day e anti-canibalização I-Drive × Universal. A preferência de Call foi explicitamente superada nesta página por WhatsApp/SMS apenas. [Source: `blog/TEMPLATE-GUIDE.md#0-non-negotiable-rules`; `#f-geoai-answer-blocks-2–3-sentences`; `#i-anti-cannibalization-matrix-15-new--existing`]

### Current-page defects to remove

- Tailwind via CDN, Google Fonts e Material Symbols criam dependência remota desnecessária para uma página estática.
- O hero é lazy-loaded e usa silhuetas de montanha-russa; o novo LCP deve ser local, eager/high-priority e neutro.
- Existem links `tel:` e copy de Call; o contrato atual é WhatsApp + SMS.
- FAQ visível contém `&amp;amp;` e `&amp;mdash;`, divergindo do texto/schema.
- Copy antiga usa “Normal”, promete pickup no horário escolhido, apresenta free pickup sem condicionamento de área e contém prova genérica “Trusted by...” sem fonte.
- Hero/OG/schema ainda apontam para assets genéricos ou antigos e a estrutura repete o template I-Drive quase palavra por palavra.

### Project structure and implementation constraints

- A página continua em `blog/laundry-near-universal-orlando.html`; não migrar a stack nem criar slug paralelo.
- Assets públicos derivados ficam em `blog/img/`; masters/prompts/ledger ficam em diretório de evidência já usado pelo projeto, preferencialmente sob `marketing/google-ads/2026-07-guest-laundry-search/assets/` e documento de release adjacente.
- `a7-business-config.js`, `a7-attribution.js`, `a7-events.js` e `a7-tracking.js` são contratos compartilhados. Alterá-los apenas quando necessário para mapear o código regional, com testes focados e sem regressão de outras páginas.
- Não editar I-Drive/LBV para “forçar” diferenciação nesta story. Se a análise revelar mudança necessária fora do escopo, documentar como follow-up.
- Nenhum asset do Lovart.ai é publicado diretamente do download: preservar master, converter, inspecionar o derivado e definir width/height.
- A publicação é autoridade exclusiva de `@devops`.

## Testing

## Owner-authorized Stripe trust amendment

- Add the official unmodified `Powered by Stripe` badge in the existing payment reassurance section and link it to `https://stripe.com` with a clear accessible label.
- State that major cards are accepted through the secure Stripe-hosted payment link.
- Describe Apple Pay and Google Pay only as conditionally available on compatible devices at checkout; do not promise either wallet universally.
- Preserve the verified Zelle, Venmo, Cash App and cash options, the after-weighing total, and the warning never to send card details through WhatsApp.
- Do not add card-network logos, wallet logos, fake certification seals, endorsement language, `100% secure`, PCI claims or a new checkout CTA.
- Keep the block compact, responsive and non-interactive except for the official Stripe badge link; no iframe, payment widget or new tracking route.
- Record the official Stripe asset source and mark-usage basis, extend the focused monitor with positive and negative fixtures, run all repository gates, obtain independent QA, then release only through `@devops` using an exact preview promotion.

### Automated and build gates

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build:public`
- `node scripts/test-attribution-v2.mjs`
- `node scripts/test-tracking.mjs`
- `node scripts/guard-business-destinations.mjs`
- teste focado do monitor Universal/Orlando Resort Area criado nesta story
- `git diff --check`

### Visual and interaction matrix

- Widths: 320, 375, 390, 430, 768, 1024 and 1440px.
- First fold/full page: 320×568, 390×844, 430×932, 1024×768 and 1440×900.
- Chrome e Safari/WebKit quando disponíveis; mouse/touch, teclado, 200% zoom, reduced motion, JavaScript bloqueado e rede móvel simulada.
- Confirmar zero overflow, safe-area collision, sticky/FAB overlap e conteúdo essencial escondido.

### Content, brand and contract cases

- Busca automatizada e revisão visual confirmam zero marca de parque/hotel/atração fora do slug/canonical histórico.
- WhatsApp e SMS usam número oficial; zero `tel:`, Call e FaceTime.
- Prefill contém hotel/endereço, room opcional, needed-by, volume, serviço e código regional aprovado, sem PII fixa.
- Um clique gera um evento; falha do analytics não bloqueia o destino.
- Metadata, answer block, preço, FAQ e schema concordam sobre oferta e condições.
- Express e pickup rápido nunca perdem seus qualificadores na leitura desktop/mobile.
- URL, canonical, rewrite, sitemap, blog card e mapeamentos de tracking permanecem válidos.
- FAQ visível é idêntico ao FAQPage; JSON-LD parseia sem warning factual conhecido.
- I-Drive e a página desta story não compartilham title/H1/opening/FAQ dominantes.

### Performance budgets

- Lighthouse mobile: Performance ≥90; Accessibility, Best Practices and SEO ≥95.
- LCP ≤2.5s; CLS ≤0.1; TBT dentro de “good”.
- Hero idealmente ≤250KB; carga inicial preferencialmente ≤650KB; CSS novo ≤50KB gzip; JS novo ≤20KB gzip.
- INP ≤200ms é meta de campo somente quando houver amostra suficiente.

## Rollback and Monitoring

- Antes do deploy, registrar o deployment/commit de referência e o conjunto exato de arquivos desta story.
- Rollback preferencial: promover novamente o deployment de referência ou reverter somente o commit/artefatos desta story por `@devops`, preservando mudanças alheias.
- Gatilhos imediatos: HTTP não-200, CTA/destino quebrado, evento duplicado, código regional ausente, canonical/schema incorreto, asset com marca/glyph/PII, claim operacional incorreto ou regressão grave de layout/performance.
- Gatilhos pós-amostra: queda sustentada de leads qualificados/pedidos reconciliados ou regressão de indexação/CWV sem explicação de mix/volume; clique e pageview isolados não provam sucesso ou fracasso.
- Checkpoints: pós-deploy imediato, 24h, 72h, 7d, 14d e 28d.

## Expected File List

- `docs/stories/a7-012-premium-orlando-resort-area-redesign.md` (created; checklist/status updated throughout delivery)
- `blog/laundry-near-universal-orlando.html`
- `blog/img/laundry-near-universal-orlando-*.webp` and/or `.avif` (production derivatives only)
- `marketing/google-ads/2026-07-guest-laundry-search/assets/orlando-resort-area-*` (Lovart masters/evidence, exact names recorded by executor)
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ORLANDO-RESORT-AREA-2026-08-21.md`
- `scripts/monitor-universal-release.mjs`
- `scripts/test-monitor-universal-release.mjs`
- `a7-tracking.js` and `scripts/test-tracking.mjs` only if required for the approved regional code mapping
- `sitemap.xml` only if lastmod/image metadata requires an update; the existing URL must not be duplicated

The Dev Agent Record must replace this expected list with the exact created/modified files before the story can move to Review.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in `core-config.yaml`.

## Story Draft Validation

| Category | Status | Notes |
|---|---|---|
| Goal & Context Clarity | PASS | Outcome, guest problem, regional boundary and business value are explicit. |
| Technical Implementation Guidance | PASS | Existing contracts, files, asset flow, tracking and release constraints are named. |
| Reference Effectiveness | PASS | Critical source-of-truth facts are summarized with section-level references. |
| Self-Containment Assessment | PASS | Offer, claims, brand constraints, framework, edge cases and rollback are included. |
| Testing Guidance | PASS | Automated, visual, accessibility, performance, SEO/schema, brand and production cases are measurable. |
| CodeRabbit Integration | N/A | Disabled in `core-config.yaml`; manual multi-discipline review is required. |

**Final Assessment:** READY. The story is implementable without inventing offers, brands or architecture. A developer must still use live evidence for any new factual/local claim and reject any generated asset that fails the brand/rights gate.

## Change Log

| Date | Version | Description | Author |
|---|---:|---|---|
| 2026-08-21 | 0.1 | Owner-authorized story created for the differentiated premium Orlando resort-area redesign of the existing Universal slug | River (`@sm`) |
| 2026-08-21 | 1.0 | Approved preview promoted exactly to production; public hashes, Lighthouse, WebKit, contact/schema smoke and immediate monitor passed | Codex (`@devops`) |
| 2026-08-21 | 1.1 | Footer payment reassurance promoted exactly after independent QA; public payment/contact/schema smoke and immediate monitor passed | Codex (`@devops`) |
| 2026-08-21 | 1.2 | Official Stripe trust treatment promoted exactly after QA; public badge/copy/contact/schema smoke and immediate monitor passed | Codex (`@dev`, `@qa`, `@devops`) |

## Dev Agent Record

### Agent Model Used

Codex GPT-5, com geração visual em Lovart.ai GPT Image 2 e revisões independentes de design/CRO, SEO/GEO/AI Search e marca/claims/performance/acessibilidade.

### Debug Log References

- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ORLANDO-RESORT-AREA-2026-08-21.md`
- `node --test scripts/test-monitor-universal-release.mjs` — 5/5 PASS.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build:public`, `git diff --check` — PASS no candidato final local.
- Built HTML SHA-256: `e90d9f47b49941f5e441b6ae27ba2949700d21e7e6b8461d16b9d5813d04e75d`.
- Preview protegido `dpl_66kkjvf7hcZmMX4YAjGCATghdwsv` — READY e byte-idêntico ao build aprovado.
- Produção `dpl_23n52R27SoJaB4t3WYzGe3oHVi8r` — READY por promoção exata do preview, sem rebuild.
- Lighthouse mobile do artefato byte-idêntico: Performance 99, Accessibility 100, Best Practices 96, SEO 100; LCP 2.11s, CLS 0, TBT 24ms.
- WebKit 26 em 390×844 e Chrome público em 390×844/1440×900 — PASS; monitor imediato de produção — PASS.
- Adendo de pagamento: preview `dpl_54pU8XkfneQfmkDp7v69bXXJ5fFx` — READY e byte-idêntico; produção `dpl_CqDazPyeqF7c7BuknDgr4tuyLUY8` — READY por promoção exata sem rebuild.
- Built HTML do adendo: `ab7790d8d15e90d83c7f451222d99350a453ff8857a2c833a90535d58351b4f7`; hero e tracking permaneceram inalterados.
- Stripe trust amendment: selo oficial local e inalterado; cartões via link Stripe; Apple Pay/Google Pay estritamente condicionais; monitor 7/7 e suíte 34+15 verdes. Built HTML `c64bd5e7c856aae5801f988e95585406a295bc121c60602139724f2aa5499b06`.
- Stripe preview `dpl_ErgNRhk5hVLjp9c3TNBXzF4HCdkJ` — READY e byte-idêntico; produção `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9` — READY por promoção exata sem rebuild.
- Monitor público validou HTML, badge Stripe, hero e tracking com os hashes aprovados; rollback desta emenda é `dpl_CqDazPyeqF7c7BuknDgr4tuyLUY8`.

### Completion Notes List

- URL, rewrite e canonical históricos preservados; nenhum slug paralelo foi criado.
- Página reconstruída em HTML/CSS/JS estático, sem Tailwind CDN, Google Fonts ou biblioteca remota de ícones.
- Comunicação reposicionada para `Orlando resort guest + tomorrow's plans`, mantendo checkout/voo/próximo hotel como prazos secundários e evitando canibalização com a página específica de checkout.
- Três masters originais foram gerados no Lovart, inspecionados e derivados em WebP desktop/mobile; cenas são identificadas como ilustrativas.
- Oferta canônica, condições de Express, mínimo, handoff e área confirmada permanecem consistentes em copy, FAQ e schema.
- WhatsApp e SMS oficiais preservam o intake e o código `SEO-ORLANDO-RESORT-V1`; zero `tel:`/FaceTime.
- Dock flutuante foi ocultado no candidato final porque cobria conteúdo em viewports intermediários e desktop; CTAs estáticos permanecem no hero, serviço e fechamento.
- QA independente aprovou o candidato de preview sem finding crítico/alto aberto. Lighthouse e smoke público permanecem gates do preview/produção.
- O preview aprovado foi promovido exatamente, sem rebuild; produção, hero e tracking igualaram os hashes locais e do preview.
- O monitor imediato validou HTTP 200, canonical/H1, cinco WhatsApp, dois SMS, zero call/FaceTime, quatro JSON-LD, FAQ parity, oferta, ausência de marca visível, sitemap e hashes.
- O adendo de pagamento adiciona, no rodapé, link seguro em USD, Zelle, Venmo, Cash App e dinheiro, total confirmado após pesagem e aviso para nunca enviar dados de cartão pelo WhatsApp. QA independente passou em 390 e 1440px; monitor 6/6 e suíte 33+15 passaram.
- O adendo foi promovido sem rebuild; o smoke público confirmou a seção sem overflow/CTA concorrente e preservou cinco WhatsApp, dois SMS, quatro JSON-LD e o canonical.
- Rollback do adendo é acionável promovendo `dpl_23n52R27SoJaB4t3WYzGe3oHVi8r`; rollback integral da story permanece `dpl_8YqdmcK8UiEu7zj2wmQ47FxZjmhS`. Checkpoints futuros seguem abertos e não serão tratados como resultado comercial antecipado.

### File List

- `blog/laundry-near-universal-orlando.html`
- `blog/index.html`
- `service-areas.html`
- `sitemap.xml`
- `package.json`
- `blog/img/orlando-resort-area-hero-v1.webp`
- `blog/img/orlando-resort-area-hero-v1-mobile.webp`
- `blog/img/orlando-resort-area-relief-v1.webp`
- `blog/img/orlando-resort-area-relief-v1-mobile.webp`
- `blog/img/orlando-resort-area-handoff-v1.webp`
- `blog/img/orlando-resort-area-handoff-v1-mobile.webp`
- `blog/img/powered-by-stripe.svg`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/orlando-resort-area-hero-lovart-master-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/orlando-resort-area-relief-lovart-master-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/assets/orlando-resort-area-handoff-lovart-master-v1.png`
- `marketing/google-ads/2026-07-guest-laundry-search/RELEASE-EVIDENCE-ORLANDO-RESORT-AREA-2026-08-21.md`
- `scripts/monitor-universal-release.mjs`
- `scripts/test-monitor-universal-release.mjs`
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/orlando-resort-area-2026-08-21-immediate.json`
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/orlando-resort-area-2026-08-21-payment-amendment-immediate.json`
- `marketing/google-ads/2026-07-guest-laundry-search/monitoring/orlando-resort-area-2026-08-21-stripe-trust-amendment-immediate.json`
- `docs/stories/a7-012-premium-orlando-resort-area-redesign.md`

## QA Results

**Release gate: PASS.** Matriz independente validada em 320×568, 375×667, 390×844, 430×932, 768×900, 1024×768, 1100×800, 1101×800 e 1440×900. Zero overflow, CTA truncado, dock sobreposto ou target abaixo de 44px. FAQ/schema, monitor 5/5, suíte 32+15, build público e diff passaram. Preview `dpl_66kkjvf7hcZmMX4YAjGCATghdwsv` foi promovido sem rebuild para produção `dpl_23n52R27SoJaB4t3WYzGe3oHVi8r`. Lighthouse, WebKit, Chrome público, WhatsApp/SMS, canonical, schema, assets, tracking e monitor imediato passaram; somente os checkpoints temporais 24h/72h/7d/14d/28d permanecem abertos.

**Payment reassurance release gate: PASS.** O adendo foi verificado em 390px e 1440px: sem overflow, hierarquia compacta, sem CTA concorrente, contraste AA, seção/lista acessíveis e métodos sustentados pelo fluxo de payment link e por `plans.html`. Monitor 6/6, suíte 33+15, build público e diff passaram. Preview `dpl_54pU8XkfneQfmkDp7v69bXXJ5fFx` foi promovido exatamente, sem rebuild, para produção `dpl_CqDazPyeqF7c7BuknDgr4tuyLUY8`; hashes, payment block, WhatsApp/SMS, schema e canonical passaram no público.

**Stripe trust amendment release gate: PASS.** O badge local é byte-idêntico ao ativo oficial da Stripe, permanece inalterado e linkado a `stripe.com`; não há logos de redes de cartão/carteiras, selo falso, afiliação ou garantia absoluta. `Major cards` é apresentado pelo link Stripe e Apple Pay/Google Pay permanecem condicionais ao checkout/dispositivo. QA em 390×844 e 1440×900 passou sem overflow, clipping ou target abaixo de 44px. Monitor 7/7, suíte 34+15, build público e diff passaram. Preview `dpl_ErgNRhk5hVLjp9c3TNBXzF4HCdkJ` foi promovido exatamente, sem rebuild, para produção `dpl_3M8sZ2ytLGBAvr478Ye5gDeJpWY9`; badge/copy, hashes, WhatsApp/SMS, schema e canonical passaram no público.
