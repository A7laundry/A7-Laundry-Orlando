# Prompt mestre — MOS Growth, SEO/GEO/AI Search sem regressão

## Missão

Executar a governança contínua do ecossistema de aquisição da A7 Laundry Orlando. Toda página, landing page, money page, página regional, artigo, hub, campanha e código de funil deve pertencer a um registro canônico, aparecer no MOS com proveniência e permanecer reconciliado com o artefato realmente publicado.

Não considerar a tarefa concluída por haver código local, preview ou teste autorreferente. Conclusão exige paridade observada entre registro, build, sitemap público, manifesto público, MOS autenticado e deployment promovido.

## Autoridade e limites

- Trabalhar pelas stories em `docs/stories/` e respeitar `.aios-core/constitution.md`.
- CLI primeiro, observabilidade depois, UI por último.
- Não publicar, promover, alterar Ads ou criar credenciais sem o gate e a autoridade do papel responsável.
- Google Ads, GA4, GSC e Meta são somente leitura nesta missão. Proibir endpoints `mutate`, uploads, ajustes de conversão, orçamento, billing e publicação.
- Nunca expor token, developer token, segredo, PII, source path privado ou identificador interno no browser, manifesto público, logs ou resposta de API.
- Ausência de linha em GSC/GA4/Ads é `unavailable`, `not_returned`, `ambiguous` ou `unmatched`; nunca zero inferido.

## Baseline forense obrigatório

Começar por estes fatos e revalidá-los; não os transformar em verdades eternas:

- sitemap-fonte: 97 URLs;
- sitemap público após quarentena: 62 URLs;
- quarentena: 35 URLs;
- blogs no corpus-fonte: 82;
- catálogo MOS legado: 7 funis manuais;
- MOS em produção não exibe catálogo TOFU/MOFU/BOFU/clusters;
- `/plans` foi promovida, mas o catálogo manual ainda a marcava como candidata;
- `SEO-LBV-SMS` estava ausente do catálogo manual;
- GA4 e GSC estão conectados em leitura no MOS;
- Meta Ads está conectada em leitura;
- Google Ads nativo está indisponível e o vínculo GA4 não substitui a API nativa.

## Fonte de verdade

Criar e manter um único registro autoral versionado para todos os ativos. Para cada ativo exigir:

- ID estável;
- canonical path e source file;
- papel do ativo: money page, regional, landing, hub, guide, article, pricing, service, legal ou system;
- estágio da jornada: TOFU, MOFU, BOFU, retention ou not applicable;
- geografia em dimensão separada do estágio;
- intenção e proprietário canônico da intenção;
- cluster, pilar e relação com o pilar;
- público, próxima ação e canais;
- aliases legados de funil e `asset_id` v2;
- política de indexação, robots e sitemap esperados;
- estado autoral separado do estado observado de release;
- evidência SEO, E-E-A-T e AI Search com fonte, data e status verificável;
- responsável por papel, data de revisão e referências de evidência.

Proibir `other` implícito, wildcard silencioso e registro manual paralelo em tracking, sitemap ou MOS.

## Estados que nunca podem ser misturados

1. `sourceState`: draft, reviewed candidate ou retired.
2. `buildState`: missing ou built.
3. `artifactState`: built; é o máximo que o manifesto estático pode declarar.
4. `observationState`: unobserved, preview verified, active production, production drift, rolled back ou unavailable.
5. `indexationIntent`: include, quarantine ou exclude.
6. `indexationObservation`: sitemap/robots públicos e, quando disponível, inspeção do GSC.

`active_production` só pode ser derivado quando o MOS/observer lê o manifesto e os hashes no alias de produção. Um preview promovido sem rebuild deve manter o mesmo manifesto; a observação externa é que muda.

## Pipeline obrigatório

```text
discover HTML + rewrites + sitemap-fonte
  → reconcile registry
  → validate completeness/topology/claims
  → compile tracking map + catálogo MOS + quarentena compatível
  → build público
  → gerar artifact manifest seguro e determinístico
  → preview protegido
  → QA independente
  → promoção exata sem rebuild
  → smoke público + hashes + canonical + sitemap
  → MOS lê manifesto público server-side
  → observation ledger append-only
  → monitor 24h/72h/7d/14d/28d
```

Adicionar página, rewrite ou `<loc>` sem registro deve falhar. Adicionar registro sem arquivo, canonical, pilar, política ou rota também deve falhar.

## MOS Growth

O MOS deve exibir duas visões complementares:

### Portfólio completo

- todas as URLs-fonte;
- estado de indexação pretendido e observado;
- TOFU/MOFU/BOFU;
- cluster/pilar;
- canonical owner;
- release observado;
- gaps de tracking, evidência, E-E-A-T e AI Search;
- órfãs, colisões e candidatos a consolidação.

### Funis gerenciados

- intenção, público, próxima ação e código/asset ID;
- origem/campanha → página → contato → lead qualificado → pedido → pagamento;
- GSC por canonical e query;
- GA4 por `asset_id`, com fallback rotulado por canonical;
- Google Ads nativo por `final_urls`, sem duplicar custo;
- Meta por destino/UTM;
- receita e margem somente após reconciliação.

Nunca somar page-view e landing metrics como se fossem a mesma métrica. Nunca chamar clique WhatsApp de venda.

## SEO, GEO, E-E-A-T e AI Search

- Congelar novas URLs enquanto o corpus não estiver integralmente classificado e reconciliado.
- Não consolidar ou redirecionar em massa sem GSC atual page×query, cobertura, backlinks e evidência comercial.
- Corrigir primeiro conflitos factuais e técnicos: canonical/sitemap, páginas órfãs, claims obsoletos, ratings não verificados e `llms.txt` divergente.
- E-E-A-T e AI Search são checklists baseados em evidência; proibir score inventado.
- Página regional não é template por trocar topônimo. Exigir necessidade local, operação verificável, boundary semântico e relação com hub/pilar.
- Separar hóspede B2C de host/turnover B2B.
- Manter ausência de GSC como ausência de observação, não prova de inutilidade.

## Google Ads nativo — gate de conexão

Exigir, no servidor:

- customer ID do anunciante;
- login customer ID do manager quando aplicável;
- developer token com acesso de produção;
- Google Ads API habilitada;
- WIF/OIDC e service identity somente leitura;
- escopo `https://www.googleapis.com/auth/adwords`;
- versão suportada e única entre código/runbook;
- timezone da conta;
- GAQL exclusivamente `SELECT`.

Diagnosticar relatório por relatório. HTTP 500 não autoriza inferir token, versão ou vínculo como causa única. MCP serve para operação/inspeção, não para transportar segredo ao runtime.

## Gates de mutação e CI

Testar falha para:

1. URL nova sem registro;
2. registro sem arquivo/rota/canonical;
3. ID, canonical ou alias duplicado;
4. pilar ausente, ciclo ou owner de intenção duplicado;
5. página em quarentena ainda no sitemap final ou sem noindex;
6. página incluída ausente do sitemap;
7. artefato compilado editado manualmente;
8. build não determinístico;
9. manifesto com segredo, source path ou evidência interna;
10. hash público divergente;
11. rollback que apaga histórico;
12. fonte indisponível convertida em zero;
13. Ads com múltiplas final URLs duplicando custo;
14. query Google Ads não-SELECT;
15. tracking map divergente do registro;
16. divergência entre 97 source, 35 quarantine e 62 public no baseline atual.

O teste raiz deve executar a suíte MOS completa. O workflow só pode escrever “produção” no ClickUp após Vercel READY, smoke e paridade; push isolado não prova deploy.

## Migração segura

- M0: congelar e registrar baseline.
- M1: importar 97 URLs, 35 quarentenas, 7 funis e tracking em shadow mode.
- M2: reconciliar e corrigir drift provado (`/plans`, LBV SMS).
- M3: gerar artefatos sem substituir consumidores.
- M4: migrar quarentena e tracking para outputs compilados.
- M5: publicar manifesto em preview e criar observer.
- M6: MOS consumir manifesto/catálogo e expor portfólio/clusters.
- M7: joins GSC/GA4.
- M8: Google Ads nativo e paid joins.
- M9: ativar fail-closed integral após 100% de cobertura e QA.

Cada fase deve ser pequena, reversível, com diff, hashes, rollback e um único conjunto de variáveis alterado.

## Critério final de conclusão

- 97/97 URLs-fonte classificadas;
- 62/62 indexáveis em paridade com o sitemap público atual;
- 35/35 quarentenas fora do sitemap e com noindex;
- zero rota órfã do registro;
- zero `other` implícito;
- `/plans` e todos os funis exibindo estado observado correto;
- MOS e site expondo o mesmo registry SHA;
- GA4/GSC com proveniência e null correto;
- Google Ads live ou explicitamente unavailable com diagnóstico sanitizado;
- CI, mutation tests, preview, QA, produção, smoke e rollback documentados;
- nova página futura aparece automaticamente no MOS após release observada, sem edição manual do catálogo.

