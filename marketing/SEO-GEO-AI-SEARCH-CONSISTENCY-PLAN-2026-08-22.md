# Plano de consistência e consolidação — SEO, GEO, E-E-A-T e AI Search

**Data:** 2026-08-22  
**Escopo:** presença orgânica da A7 Laundry Orlando para guest wash & fold, páginas locais,
conteúdo de apoio, entidade, conversão e mensuração.  
**Estado:** plano executivo; não autoriza redirects, `noindex`, canonicalização, remoção de URL,
publicação ou alteração em Google Ads sem story, diff, QA e aprovação aplicáveis.

## 1. Objetivo

Transformar o conjunto atual de páginas em um sistema coerente no qual:

1. cada intenção comercial tenha uma única URL proprietária;
2. páginas locais existam apenas quando houver intenção, conteúdo e evidência próprios;
3. preço, mínimo, prazo, cobertura, handoff, contato e pagamento usem a mesma verdade canônica;
4. Google, mecanismos de resposta e visitantes encontrem respostas iguais em HTML, schema,
   `llms.txt`, hubs e páginas de conversão;
5. prova operacional e identidade sejam verificáveis, datadas e não confundidas com imagem
   ilustrativa;
6. o resultado seja medido por contato qualificado, pedido pago, receita e margem, nunca apenas por
   clique em WhatsApp ou impressão.

## 2. Verdade atual e limite da conclusão

- O sitemap público contém 97 URLs.
- O repositório contém 102 HTMLs com canonical, 95 com `FAQPage`, 96 com `LocalBusiness` ou
  `LaundryService` e 75 com `BreadcrumbList`. Quantidade de schema não prova qualidade ou
  indexação.
- O núcleo reformado — money page de Orlando, Lake Buena Vista e resort-area — possui intenção,
  oferta, contato e mensuração distintos e validados.
- O legado ainda contém linguagem anterior como `Normal`, `free pickup/delivery` e retornos de 8h
  ou 24h apresentados de forma mais absoluta que a fonte canônica atual.
- Dados atuais de GA4 e Search Console por URL estão indisponíveis neste contexto. Portanto, não se
  autoriza consolidar, redirecionar ou remover uma URL apenas por julgamento editorial.
- O histórico de aproximadamente 29 URLs indexadas não é tratado como fotografia atual sem uma nova
  exportação do Search Console.

## 3. Arquitetura-alvo de intenção

| Papel | URL proprietária | Intenção dominante | Conversão/fonte |
|---|---|---|---|
| Money page | `/laundry-pickup-delivery-orlando` | pickup e delivery para viajantes em Orlando | `SEO-ORLANDO-MONEY-V2` |
| Local transacional | `/blog/laundry-lake-buena-vista` | hotel laundry pickup em Lake Buena Vista | família `SEO-LBV-*` |
| Resort transacional | `/blog/laundry-near-universal-orlando` | roupa para os planos do próximo dia de hóspedes de resort | `SEO-ORLANDO-RESORT-V1` |
| Corredor local | `/blog/laundry-international-drive-orlando` | pickup para hóspedes no corredor I-Drive | novo código somente após mapping/aprovação |
| Urgência | `/blog/laundry-before-checkout-orlando` | deadline de checkout/voo/próximo hotel | novo código somente após mapping/aprovação |
| Hotel informacional | `/blog/hotel-laundry-service-orlando` | como funciona hotel laundry pickup em Orlando | encaminha para a money page |
| Hub local | `/service-areas` | descobrir e confirmar área atendida | encaminha para a leaf correta |
| Oferta/preço | `/plans` | preço, mínimo, modalidades e pagamento | encaminha para contato oficial |
| Guias | `/blog/...` | dúvidas, comparação e preparação | linkam para a proprietária, sem competir com ela |

### Boundary obrigatório

- A money page não tenta ranquear como cada bairro/corredor.
- Lake Buena Vista não vira guia genérico de Disney/Orlando.
- Resort-area não disputa `before checkout` nem hotel service genérico.
- Before-checkout mantém urgência e Express condicionado.
- Hotel guide informa e transfere intenção comercial para a money page.
- I-Drive fica restrita ao corredor e não reivindica toda a região turística.
- Nenhuma nova página local nasce sem evidência de intenção, conteúdo único e capacidade operacional.

## 4. Classificação das 97 URLs

Cada URL recebe uma decisão somente depois de preencher a matriz abaixo.

| Dimensão | Evidência requerida |
|---|---|
| Intenção | query/necessidade dominante e URL que já a possui |
| Demanda | GSC atual, termos pagos ou evidência comercial redigida; ausência é `unavailable` |
| Unicidade | resposta local/situacional que não cabe adequadamente em outra página |
| Verdade | claims compatíveis com oferta canônica e operação atual |
| Entidade | A7, serviço, área, contato e relações de schema consistentes |
| Conversão | CTA oficial, intake mínimo, código de funil/mapping e tracking preservados |
| Qualidade | conteúdo útil, prova adequada, acessibilidade, performance e mobile |
| Links | pai, filhos e destino comercial claros; sem páginas órfãs |
| Resultado | landing, contato qualificado e pedido pago quando disponíveis |

### Decisões permitidas

1. **KEEP:** intenção própria, conteúdo válido e papel claro.
2. **REFRESH:** intenção própria, mas oferta, design, prova ou schema estão antigos.
3. **MERGE CANDIDATE:** conteúdo redundante; exige GSC, backlinks, tráfego e plano de redirect.
4. **NOINDEX CANDIDATE:** utilidade operacional/temporária sem valor de busca; exige revisão técnica.
5. **REMOVE FROM SITEMAP CANDIDATE:** não deve ser promovida para indexação, sem implicar exclusão.
6. **ARCHIVE:** fora do site público e sem dependência ativa; operação recuperável e documentada.

Nenhuma URL muda de estado por contagem de palavras, aparência antiga ou zero observado em uma fonte
incompleta.

## 5. Ondas de execução

### Onda 0 — truth lock, inventário e baseline

**Prazo-alvo:** 2 dias úteis.  
**Objetivo:** impedir que a reforma espalhe uma nova contradição.

Entregáveis:

- export versionado das 97 URLs com title, H1, canonical, robots, schema, lastmod, links, CTA,
  código de funil, claims e status HTTP;
- export atual de GSC por página/query e GA4 por landing page, ou `unavailable` documentado;
- snapshot de sitemap, robots, `llms.txt`, hubs e redirects;
- matriz canônica assinada: Standard, Express, mínimo, cobertura, handoff, pagamento, contato,
  booking, special care e uso de marcas;
- mapa de intenção e canibalização das URLs principais;
- baseline de pedidos/leads reconciliados quando tecnicamente possível.

Gate de saída:

- nenhuma decisão de merge/noindex/redirect sem linha de evidência;
- fonte canônica sem divergência operacional;
- backup e rollback definidos.

### Onda 1 — corrigir as fontes que contaminam todo o sistema

**Prazo-alvo:** semana 1.  
**Ordem:** `/plans` → I-Drive → hotel guide → before-checkout.

#### 1A. `/plans`

- trocar `Normal` por `Standard` onde guest wash & fold for o serviço canônico;
- substituir linguagem absoluta por retorno aproximado/condicionado;
- normalizar `free` para `included in the confirmed service area`;
- alinhar FAQ, schema, meta, exemplos de preço e pagamento;
- manter estimador apenas se usar a mesma fórmula/fonte canônica.

#### 1B. International Drive

- manter a intenção do corredor;
- remover promessa ampla de cobertura de todo o corredor sem confirmação;
- corrigir title/meta/FAQ/schema/copy antigos;
- preservar conteúdo específico para hotéis, convention visitors e ausência de carro sem tomar a
  intenção ampla da money page;
- adicionar intake e código de funil somente após mapping formal.

#### 1C. Hotel guide

- tornar a página genuinamente informacional;
- remover comparação de economia não sustentada e coleta categórica em qualquer hotel;
- explicar opções, handoff condicionado, preço e como avaliar prazo;
- CTA e links transferem intenção comercial para a money page.

#### 1D. Before checkout

- manter `checkout/flight/next hotel` como entidade dominante;
- Express continua até 8h somente após capacidade e janela confirmadas;
- alinhar Standard, mínimo, área e pagamento;
- não competir com a narrativa de `tomorrow's plans` da resort-area.

Gate de saída por página:

- matriz `claim → fonte → copy/schema` sem divergência;
- uma única H1 e self-canonical;
- visible FAQ = FAQPage exatamente;
- WebPage/Service/LocalBusiness/Breadcrumb consistentes quando aplicáveis;
- links pai/filho/destino comercial testados;
- intake, destino, código de funil e tracking validados;
- 320/390/768/1440, teclado, contraste e reduced motion;
- lint, typecheck, testes, build, preview byte-idêntico, QA independente e aprovação antes de produção.

### Onda 2 — consolidar hubs e clusters

**Prazo-alvo:** semanas 2 e 3.

Entregáveis:

- `service-areas` como hub geográfico, sem copiar o conteúdo das leaf pages;
- blog index organizado por necessidade: local, deadline, comparação, planejamento e operação;
- cada guia com um destino comercial primário e no máximo links contextuais úteis;
- anchors descritivos, breadcrumbs visíveis quando apropriado e zero página órfã;
- mapa de query/intenção para money, LBV, resort, I-Drive, checkout, hotel guide e vacation rental;
- lista de merge candidates entre páginas de resort/bairro genéricas.

Gate de consolidação:

- redirect 301 apenas com origem/destino, backlinks, GSC, links internos, sitemap, canonical e rollback
  documentados;
- não usar canonical cruzado como substituto improvisado de uma decisão editorial;
- não declarar ausência de canibalização antes da janela pós-publicação.

### Onda 3 — fortalecer E-E-A-T com prova real

**Prazo-alvo:** semanas 3 e 4.

Entregáveis:

- módulo de equipe/operador responsável com identidade e escopo aprovados;
- ledger de fotografias reais, licença/consentimento e redação de PII;
- três microcasos anonimizados: situação, área, deadline, solução e resultado, sem inventar atribuição;
- página About com história, processo editorial, revisão factual e canais oficiais atuais;
- política `written by / fact-checked by / last reviewed` para guias relevantes;
- Google Business Profile, Instagram e Facebook consistentes; YouTube somente após URL oficial;
- rating/review apenas quando verificado, datado e rotulado como prova da empresa, não de uma região;
- política clara de serviço, pagamento e privacidade ligada às páginas comerciais.

Gate:

- nenhuma imagem gerada apresentada como operação real;
- nenhuma marca/hotel/parque usado como prova de parceria;
- PII zero em fotos, casos e arquivos públicos;
- cada claim de experiência/prova aponta para evidência arquivada.

### Onda 4 — alinhar AI Search e GEO generativo

**Prazo-alvo:** semana 4.

Entregáveis:

- atualizar `llms.txt` para a revisão de agosto e incluir as páginas proprietárias atuais;
- alinhar `sameAs`, nome, telefone, área, serviço e `@id` estável em toda a entidade;
- direct-answer blocks curtos para preço, prazo, cobertura, handoff, itens aceitos, pagamento e contato;
- FAQ somente quando acrescentar decisão real; não criar perguntas para inflar schema;
- schema validado contra o conteúdo visível e sem preço total enganoso;
- sitemap com apenas URLs canônicas promovidas e `lastmod` materialmente verdadeiro;
- robots mantendo acesso aos crawlers aprovados sem expor áreas internas;
- teste automatizado de divergência entre fonte canônica, páginas principais, schema e `llms.txt`.

Gate:

- uma pergunta operacional recebe a mesma resposta factual na money page, página local, FAQ, schema e
  `llms.txt`;
- nenhuma afirmação de ranking, parceria, garantia, cobertura ou rating sem prova atual.

### Onda 5 — mensuração e decisão por resultado

**Prazo-alvo:** iniciar na semana 1; leitura em 24h/72h/7d/14d/28d.

Entregáveis:

- taxonomia estática para cada funil prioritário, sem trocar códigos já publicados silenciosamente;
- mapping de slug → funnel/persona/geo e teste de destino/prefill;
- GA4 por landing page e CTA, GSC por página/query e status de indexação;
- reconciliação WhatsApp qualificado/pedido/Stripe com click IDs quando permitido e consentido;
- painel que separa clique WhatsApp, contato qualificado, pedido confirmado e compra paga;
- anotação de releases para não atribuir causalidade a uma simples comparação antes/depois.

Métricas norte:

- pedidos pagos e contatos qualificados de hóspedes;
- CPA por pedido/lead qualificado;
- receita, ticket e margem por landing/funil;
- query-to-landing fit e cobertura/indexação;
- taxa de contato qualificado por sessão, nunca clique bruto isolado.

## 6. Ordem de stories

Stories devem ser criadas pelo agente autorizado, cada uma com escopo reversível:

1. **Canonical truth + 97-URL inventory** — somente leitura e automação do inventário.
2. **Pricing source normalization** — `/plans` e testes de drift factual.
3. **International Drive intent refresh** — corredor local e tracking próprio.
4. **Hotel guide informational boundary** — descanibalização da money page.
5. **Before-checkout deadline refresh** — urgência sem promessa automática.
6. **Hub/internal-link consolidation** — service areas, blog index e páginas órfãs.
7. **E-E-A-T evidence system** — equipe, prova, casos, autoria e ledger.
8. **AI Search entity consistency** — `llms.txt`, schema graph e validator cross-source.
9. **Long-tail adjudication** — KEEP/REFRESH/MERGE/NOINDEX/ARCHIVE com GSC.
10. **Commercial reconciliation** — landing → contato qualificado → pedido pago.

Não agrupar todas as páginas em uma única release. Uma família de variável por lote preserva leitura,
rollback e descoberta de regressão.

## 7. Definition of Done do programa

O programa só está concluído quando:

- todas as 97 URLs têm decisão, evidência e owner;
- toda URL indexável possui intenção única, canonical, status, title/H1 e links coerentes;
- as fontes prioritárias não divergem em Standard, Express, mínimo, cobertura, handoff, pagamento ou
  contato;
- as URLs consolidadas têm redirects, links internos, sitemap e monitoramento validados;
- `llms.txt`, entity graph e páginas principais respondem com os mesmos fatos;
- provas E-E-A-T são reais, datadas, licenciadas/consentidas e sem PII;
- cada funil prioritário possui código/mapping e intake correto;
- GA4/GSC estão disponíveis ou formalmente marcados como indisponíveis por checkpoint;
- resultados finais são avaliados com pedidos/qualificação e lag, sem confundir microconversões;
- lint, typecheck, testes, build, schema, links, mobile, acessibilidade, performance e monitores passam;
- cada release tem preview aprovado, artefato byte-idêntico, smoke público e rollback.

## 8. Critérios de parada e rollback

Parar uma publicação se:

- oferta canônica estiver divergente;
- canonical, indexabilidade, sitemap ou destino de contato regredir;
- FAQ/schema não corresponder ao conteúdo visível;
- houver conflito de intenção sem GSC suficiente para decidir;
- prova, foto, marca ou review não tiver origem verificável;
- tracking disparar evento duplicado ou perder o código/mapping;
- build, QA mobile, acessibilidade ou performance falhar;
- uma mudança anterior ainda não tiver smoke/monitor mínimo.

Rollback restaura o deployment anterior exato, confirma HTTP/canonical/CTA/schema/tracking e registra
o motivo. Não se apagam páginas ou históricos para “limpar” o problema.

## 9. Próxima ação recomendada

Começar pela story **Canonical truth + 97-URL inventory** e, em paralelo apenas na coleta de dados,
solicitar exports atuais de Search Console e GA4. A primeira implementação pública deve ser
`/plans`, porque ela funciona como fonte transversal de oferta e atualmente propaga linguagem antiga
para usuários, páginas e mecanismos de resposta.
