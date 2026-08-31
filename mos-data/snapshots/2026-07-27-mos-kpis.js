/* A7 Laundry MOS — versioned KPI snapshot.
 * Operational rule: null means unavailable/not integrated. Never coerce null to zero.
 * This file is a dated snapshot, not a live API connection.
 */
globalThis.A7_MOS_KPIS = Object.freeze({
  updatedAt: '2026-07-27T23:20:00-04:00',
  status: 'partial',
  reportingNote: 'Retratos datados das fontes — não é uma conexão em tempo real. A mídia paga do Meta vai até 21 de julho; o Meta orgânico e a auditoria do Google Ads vão até 24 de julho. O Google Ads é um histórico separado em BRL, está sem entrega por fundos esgotados e mede chamadas, não vendas. Seis pedidos e US$ 491 de receita foram informados pelo proprietário apenas para o período do Meta.',
  decision: {
    health: 'critical',
    label: 'Crítico',
    headline: 'A campanha de hóspedes foi pausada porque o destino de WhatsApp regrediu para uma conta de teste da Meta.',
    detail: 'Não retomar a veiculação até o Ads Manager confirmar +1 407-670-8839 no anúncio e as prévias de Feed, Stories e Reels preservarem toda informação crítica.'
  },
  actions: [
    { id: 'lock_meta_whatsapp_destination', priority: 'P0', title: 'Travar o destino oficial do Meta Ads', action: 'Bloquear o número de teste, confirmar +1 407-670-8839 no anúncio e executar o preflight de destino antes de qualquer publicação.', owner: 'Marketing + desenvolvimento', deadline: 'Antes de reativar', success: 'Zero conjunto ativo com destino não verificado; número oficial confirmado no Ads Manager e no MOS.', channel: 'paid', health: 'critical' },
    { id: 'fix_paid_attribution', priority: 'P0', title: 'Corrigir a atribuição da mídia paga no GA4', action: 'Aplicar UTMs padronizadas em todos os anúncios e validar os eventos de WhatsApp, lead, checkout e compra.', owner: 'Marketing + desenvolvimento', deadline: '48 horas', success: 'Sessões de Paid Social aparecem e cada anúncio pode ser conciliado pela UTM.', channel: 'analytics', health: 'critical' },
    { id: 'connect_revenue', priority: 'P0', title: 'Conectar receita e pedidos', action: 'Transformar o registro manual de seis pedidos em uma fonte recorrente e conciliá-lo por anúncio, cliente e custo variável.', owner: 'Operações + desenvolvimento', deadline: '7 dias', success: 'Receita, ticket médio, recompra, CAC e ROAS verificáveis por anúncio e período.', channel: 'revenue', health: 'attention' },
    { id: 'google_ads_measure_sales', priority: 'P0', title: 'Medir vendas reais no Google Ads', action: 'Importar purchase verificado do Stripe com valor; manter cliques de WhatsApp/SMS como secundários e só criar qualified_guest_lead quando o MOS armazenar o identificador completo do clique.', owner: 'Marketing + desenvolvimento + operações', deadline: 'Antes de adicionar saldo', success: 'A campanha otimiza para compra verificada ou lead qualificado importável, nunca para chamada ou clique bruto.', channel: 'google_ads', health: 'critical' },
    { id: 'google_ads_identity', priority: 'P0', title: 'Unificar domínio e telefone no Google Ads', action: 'Validar o telefone oficial, substituir o domínio temporário pelo a7laundry.com e corrigir anúncios reprovados antes de retomar a entrega.', owner: 'Operações + marketing', deadline: 'Antes de adicionar saldo', success: 'Um único telefone oficial, domínio próprio e zero anúncio reprovado nas campanhas que voltarão a veicular.', channel: 'google_ads', health: 'critical' },
    { id: 'google_ads_rebuild', priority: 'P1', title: 'Construir o Search de Guest Laundry pausado', action: 'Usar o pacote da Fase 1 com 16 termos exatos/frase, quatro RSAs, landing de hóspedes, negativas compartilhadas e orçamento proposto de R$70/dia por sete dias.', owner: 'Marketing', deadline: 'Após concluir os P0', success: 'Campanha criada pausada, sem PMax/broad/call-only, aprovada no preflight antes de receber saldo.', channel: 'google_ads', health: 'attention' },
    { id: 'focus_confirmed_sales', priority: 'P0', title: 'Concentrar verba no serviço que vendeu', action: 'Retomar somente roupa por libra para hóspedes de hotéis e Airbnbs depois de validar o destino oficial e todas as prévias.', owner: 'Marketing', deadline: 'Após corrigir o destino', success: 'Campanha manual ativa a US$ 30/dia somente com +1 407-670-8839 e criativos sem corte.', channel: 'paid', health: 'critical' },
    { id: 'tourist_en_creative_test', priority: 'P1', title: 'Reduzir o custo do criativo Turista EN', action: 'Testar um challenger com hook curto, demonstração da coleta no hotel e o mesmo público do controle A3.', owner: 'Marketing', deadline: '72 horas de teste', success: 'CTR ≥ 1,70% e custo por conversa ≤ US$ 20.', channel: 'paid', health: 'attention', focus: 'tourist' },
    { id: 'protect_tourist_pt_winner', priority: 'P1', title: 'Preservar o vencedor Turista PT', action: 'Manter o A4 ativo e testar um challenger estilo UGC sem substituir o controle durante a coleta da amostra.', owner: 'Marketing', deadline: '72 horas de teste', success: 'Challenger supera US$ 19,79 por conversa com pelo menos 3 conversas.', channel: 'paid', health: 'good', focus: 'tourist' },
    { id: 'seo_ctr_indexation', priority: 'P1', title: 'Melhorar CTR e indexação orgânica', action: 'Revisar títulos/snippets, criar links internos e investigar as 18 URLs descobertas e não indexadas.', owner: 'Conteúdo + SEO', deadline: '14 dias', success: 'CTR desktop ≥ 1,0% e redução das URLs descobertas e não indexadas.', channel: 'organic', health: 'attention' },
    { id: 'balance_organic_calendar', priority: 'P1', title: 'Redistribuir o calendário orgânico', action: 'Evitar nova saturação depois de 24–28 de julho e ocupar agosto com cadência espaçada, usando os dias livres verificados no Planner.', owner: 'Conteúdo', deadline: 'Antes do próximo agendamento', success: 'Próximas publicações distribuídas sem mais de um post de feed por dia e com os horários conferidos no fuso do Planner.', channel: 'organic', health: 'attention' },
    { id: 'improve_social_retention', priority: 'P1', title: 'Criar conteúdo que mereça ser salvo', action: 'Transformar o fluxo de coleta em hotel/Airbnb em conteúdo utilitário, com instruções claras e operação real, e acompanhar salvamentos e seguimentos por publicação.', owner: 'Conteúdo + social', deadline: 'Próximos 4 posts', success: 'Estabelecer uma linha de base por post e sair de zero salvamentos ou seguimentos nos próximos quatro conteúdos.', channel: 'organic', health: 'attention' }
  ],
  healthRules: [
    { metric: 'CTR da campanha no Meta', good: '≥ 1,50%', attention: '1,00–1,49%', critical: '< 1,00%', basis: 'Referência interna da campanha JUL26' },
    { metric: 'Custo por conversa no WhatsApp', good: '≤ US$ 20', attention: 'US$ 20,01–25', critical: '> US$ 25', basis: 'Referência interna da campanha JUL26' },
    { metric: 'Posição média orgânica', good: '≤ 10', attention: '10,1–20', critical: '> 20', basis: 'Meta orgânica do MOS' },
    { metric: 'Funil comercial no GA4', good: 'Lead → checkout → compra recebidos', attention: 'Cobertura parcial de eventos', critical: 'Lead/checkout/compra ausentes', basis: 'Integridade dos eventos do GA4' },
    { metric: 'Disponibilidade do Google Ads', good: 'Saldo e cobrança operacionais', attention: 'Saldo baixo ou risco de interrupção', critical: 'Fundos esgotados', basis: 'Auditoria de faturamento do Google Ads' },
    { metric: 'Conversão do Google Ads', good: 'Venda importada com valor', attention: 'Lead qualificado validado', critical: 'Somente chamada bruta ou sem mensuração', basis: 'Integridade das metas do Google Ads' },
    { metric: 'Receita / ROAS', good: 'ROAS bruto ≥ 1,50x e margem confirmada', attention: '1,00–1,49x ou atribuição parcial', critical: '< 1,00x', unavailable: 'Sem receita conciliada', basis: 'Meta + pedidos do mesmo período' }
  ],
  healthChecks: [
    { id: 'campaign_ctr', label: 'CTR da campanha no Meta', value: 1.61, format: 'percent', health: 'good', channel: 'paid', reason: 'Acima do limite verde de 1,50%.' },
    { id: 'campaign_cpr', label: 'Custo por conversa', value: 20.12, format: 'usd', health: 'attention', channel: 'paid', reason: 'US$ 0,12 acima do limite verde.' },
    { id: 'organic_position', label: 'Posição média orgânica', value: 19.1, format: 'decimal', health: 'attention', channel: 'organic', reason: 'Ainda fora da meta de ficar entre os 10 primeiros.' },
    { id: 'gsc_reconciliation', label: 'Métricas principais do GSC', value: 4, format: 'integer', health: 'good', channel: 'organic', reason: 'Cliques, impressões, CTR e posição reconciliam com apenas 0,4% de diferença temporal nas impressões.' },
    { id: 'gsc_content_growth', label: 'Crescimento do artigo para turistas', value: 82, format: 'percent', health: 'attention', channel: 'organic', reason: '33→60 impressões verificadas; direção positiva, ainda sobre base pequena. A antiga afirmação de +700% foi removida.' },
    { id: 'gsc_indexation', label: 'Descobertas, não indexadas', value: 18, format: 'integer', health: 'attention', channel: 'organic', reason: '18 URLs foram descobertas, mas ainda não foram indexadas.' },
    { id: 'meta_organic_saves', label: 'Salvamentos no Instagram', value: 0, format: 'integer', health: 'attention', channel: 'organic', reason: 'Nenhum salvamento foi registrado nas 12 distribuições do período; o conteúdo ainda não demonstra retenção utilitária.' },
    { id: 'meta_organic_follows', label: 'Seguimentos pelo conteúdo', value: 0, format: 'integer', health: 'attention', channel: 'organic', reason: 'Nenhum seguimento foi atribuído às 12 distribuições do Instagram no período.' },
    { id: 'ga4_collection', label: 'Coleta de tráfego do GA4', value: 101, format: 'integer', health: 'attention', channel: 'analytics', reason: 'As sessões são coletadas, mas o baixo volume e o tráfego de bots/data centers reduzem a confiança.' },
    { id: 'ga4_paid_attribution', label: 'Sessões pagas no GA4', value: 0, format: 'integer', health: 'critical', channel: 'analytics', reason: 'Nenhuma sessão de Social Pago ou UTM de campanha foi identificada.' },
    { id: 'ga4_commercial_funnel', label: 'Instrumentação de lead → compra', value: null, format: 'integer', health: 'critical', channel: 'analytics', reason: 'generate_lead, begin_checkout e purchase não apareceram no período auditado.' },
    { id: 'google_ads_funds', label: 'Fundos disponíveis no Google Ads', value: 0.10, format: 'brl', health: 'critical', channel: 'google_ads', reason: 'A conta está ativa, mas praticamente sem veiculação porque os fundos se esgotaram.' },
    { id: 'google_ads_measurement', label: 'Mensuração de vendas no Google Ads', value: null, format: 'integer', health: 'critical', channel: 'google_ads', reason: 'As 18 conversões são chamadas de anúncios; vendas, receita e importação offline não estão configuradas.' },
    { id: 'google_ads_housekeeping', label: 'CPA de chamada · Housekeeping', value: 96.21, format: 'brl', health: 'attention', channel: 'google_ads', reason: 'É o melhor CPA registrado, mas representa uma chamada contabilizada — não um cliente ou uma venda.' },
    { id: 'google_ads_pmax', label: 'Conversões · Performance Max', value: 0, format: 'integer', health: 'critical', channel: 'google_ads', reason: 'A campanha consumiu R$ 1.121,15 e não registrou conversões.' },
    { id: 'creative_a4', label: 'A4 Turista PT', value: 19.79, format: 'usd', health: 'good', channel: 'paid', focus: 'tourist', reason: 'CTR e custo por conversa saudáveis.' },
    { id: 'creative_a3', label: 'A3 Turista EN', value: 22.66, format: 'usd', health: 'attention', channel: 'paid', focus: 'tourist', reason: 'CTR e custo por conversa estão na faixa de atenção.' },
    { id: 'creative_c2', label: 'C2 Edredom', value: 0, format: 'integer', health: 'critical', channel: 'paid', focus: 'comforter', reason: 'Três conversas no Meta, mas zero vendas confirmadas de edredom/cobertor segundo o proprietário.' },
    { id: 'revenue_visibility', label: 'Receita informada', value: 491, format: 'usd', health: 'attention', channel: 'revenue', reason: 'Seis pedidos informados pelo proprietário; falta atribuição por anúncio e custo variável.' }
  ],
  scorecard: [
    { id: 'search_clicks', label: 'Cliques orgânicos', value: 17, format: 'integer', source: 'Google Search Console', period: '30 jun–17 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Contexto de volume; ainda não há meta aprovada.' },
    { id: 'search_impressions', label: 'Impressões na busca', value: 1145, format: 'compact', source: 'Google Search Console', period: '30 jun–17 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Retrato exato somando dispositivos; +5 em relação à leitura anterior arredondada.' },
    { id: 'search_ctr', label: 'CTR orgânico', value: 1.5, format: 'percent', source: 'Google Search Console', period: '30 jun–17 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Ainda não há meta aprovada para o CTR orgânico.' },
    { id: 'search_position', label: 'Posição média', value: 19.1, format: 'decimal', source: 'Google Search Console', period: '30 jun–17 jul de 2026', status: 'verified', health: 'attention', channel: 'organic', target: '< 10', healthReason: 'Fora da meta do MOS de ficar entre os 10 primeiros.' },
    { id: 'meta_organic_feed_pieces', label: 'Conteúdos únicos de feed', value: 12, format: 'integer', source: 'Meta Business Suite · exportações orgânicas', period: '24 jun–24 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Doze peças foram distribuídas em Facebook e Instagram; volume é contexto, não sucesso isolado.' },
    { id: 'meta_organic_ig_views', label: 'Visualizações orgânicas no Instagram', value: 562, format: 'integer', source: 'Meta Business Suite · Instagram', period: '24 jun–24 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Total do export do Instagram; não representa pessoas únicas.' },
    { id: 'meta_organic_fb_views', label: 'Visualizações orgânicas no Facebook', value: 206, format: 'integer', source: 'Meta Business Suite · Facebook', period: '24 jun–24 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Total do export do Facebook; não representa pessoas únicas.' },
    { id: 'meta_organic_ig_likes', label: 'Curtidas orgânicas no Instagram', value: 35, format: 'integer', source: 'Meta Business Suite · Instagram', period: '24 jun–24 jul de 2026', status: 'verified', health: 'context', channel: 'organic', target: null, healthReason: 'Interação observada no período; ainda sem meta aprovada.' },
    { id: 'meta_spend', label: 'Investimento no Meta Ads', value: 543.17, format: 'usd', source: 'Meta Ads · conta 650201661142284', period: '22 jun–21 jul de 2026', status: 'verified', health: 'context', channel: 'paid', target: null, healthReason: 'Investimento é contexto, não uma métrica de sucesso isolada.' },
    { id: 'meta_conversations', label: 'Conversas no WhatsApp', value: 27, format: 'integer', source: 'Meta Ads · conversas por mensagem iniciadas', period: '22 jun–21 jul de 2026', status: 'verified', health: 'context', channel: 'paid', target: null, healthReason: 'Contexto de volume; deve ser analisado junto do custo por conversa.' },
    { id: 'revenue', label: 'Receita bruta informada', value: 491, format: 'usd', source: 'Relato do proprietário', period: '22 jun–21 jul de 2026', status: 'owner_reported', health: 'attention', channel: 'revenue', target: null, healthReason: 'Seis pedidos informados; ainda sem conciliação por anúncio, comprovante ou custo variável.' },
    { id: 'roas', label: 'ROAS bruto mesclado', value: 0.9, format: 'ratio', source: 'Meta Ads + relato do proprietário', period: '22 jun–21 jul de 2026', status: 'owner_reported', health: 'critical', channel: 'revenue', target: '≥ 1,50x + margem positiva', healthReason: 'US$ 491 ÷ US$ 543,17. Não é ROAS por anúncio e não considera custos operacionais.' },
    { id: 'ga4_active_users', label: 'Usuários ativos no GA4', value: 68, format: 'integer', source: 'Google Analytics 4', period: '22 jun–21 jul de 2026', status: 'verified', health: 'context', channel: 'analytics', target: null, healthReason: 'Contexto de tráfego; parcialmente afetado por bots e data centers.' },
    { id: 'ga4_sessions', label: 'Sessões no GA4', value: 101, format: 'integer', source: 'Google Analytics 4', period: '22 jun–21 jul de 2026', status: 'verified', health: 'context', channel: 'analytics', target: null, healthReason: 'Contexto de tráfego; não há atribuição das campanhas pagas.' },
    { id: 'ga4_engagement', label: 'Taxa de engajamento', value: 47.52, format: 'percent', source: 'Google Analytics 4', period: '22 jun–21 jul de 2026', status: 'verified', health: 'context', channel: 'analytics', target: null, healthReason: 'Taxa observada; ainda não há meta aprovada no MOS.' },
    { id: 'ga4_key_events', label: 'Eventos principais do GA4', value: 17, format: 'integer', source: 'Google Analytics 4', period: '22 jun–21 jul de 2026', status: 'verified', health: 'attention', channel: 'analytics', target: null, healthReason: 'Os eventos principais se limitam ao WhatsApp e páginas comerciais; não representam vendas confirmadas.' },
    { id: 'google_ads_spend', label: 'Investimento histórico no Google Ads', value: 4714.27, format: 'brl', source: 'Google Ads · conta 290-113-2891', period: '2 jun de 2025–24 jul de 2026', status: 'verified', health: 'context', channel: 'google_ads', target: null, healthReason: 'Histórico em BRL; não deve ser somado ao investimento do Meta em USD.' },
    { id: 'google_ads_calls', label: 'Chamadas registradas como conversão', value: 18, format: 'integer', source: 'Google Ads · conversões usadas pelas campanhas', period: '2 jun de 2025–24 jul de 2026', status: 'verified', health: 'attention', channel: 'google_ads', target: null, healthReason: 'São chamadas de anúncios, não leads qualificados ou vendas confirmadas.' },
    { id: 'google_ads_cpa', label: 'CPA médio por chamada', value: 261.90, format: 'brl', source: 'Google Ads · conta 290-113-2891', period: '2 jun de 2025–24 jul de 2026', status: 'verified', health: 'critical', channel: 'google_ads', target: null, healthReason: 'O CPA não mede aquisição de cliente porque a conversão atual é apenas chamada bruta.' },
    { id: 'google_ads_revenue', label: 'Receita atribuída ao Google Ads', value: null, format: 'brl', source: 'Google Ads · metas de vendas', period: '2 jun de 2025–24 jul de 2026', status: 'not_integrated', health: 'critical', channel: 'google_ads', target: null, healthReason: 'Não há meta de vendas, valor de pedido ou importação offline configurada.' },
    { id: 'google_ads_roas', label: 'ROAS do Google Ads', value: null, format: 'ratio', source: 'Google Ads · metas de vendas', period: '2 jun de 2025–24 jul de 2026', status: 'not_integrated', health: 'critical', channel: 'google_ads', target: null, healthReason: 'Sem receita atribuída, o ROAS não pode ser calculado.' }
  ],
  funnel: [
    { stage: 'Impressões na busca', value: 1145, source: 'Google Search Console', period: '30 jun–17 jul', status: 'verified', channel: 'organic', health: 'context' },
    { stage: 'Cliques orgânicos', value: 17, source: 'Google Search Console', period: '30 jun–17 jul', status: 'verified', channel: 'organic', health: 'context' },
    { stage: 'Impressões dos anúncios no Meta', value: 29502, source: 'Meta Ads', period: '22 jun–21 jul', status: 'verified', channel: 'paid', health: 'context' },
    { stage: 'Cliques nos anúncios do Meta', value: 474, source: 'Meta Ads', period: '22 jun–21 jul', status: 'verified', channel: 'paid', health: 'context' },
    { stage: 'Conversas iniciadas no WhatsApp', value: 27, source: 'Meta Ads', period: '22 jun–21 jul', status: 'verified', channel: 'paid', health: 'context' },
    { stage: 'Cliques históricos no Google Ads', value: 167, source: 'Google Ads', period: '2 jun de 2025–24 jul de 2026', status: 'verified', channel: 'google_ads', health: 'context' },
    { stage: 'Chamadas registradas no Google Ads', value: 18, source: 'Google Ads', period: '2 jun de 2025–24 jul de 2026', status: 'verified', channel: 'google_ads', health: 'attention' },
    { stage: 'Pedidos confirmados', value: 6, source: 'Relato do proprietário', period: '22 jun–21 jul', status: 'owner_reported', channel: 'revenue', health: 'attention' }
  ],
  seo: {
    snapshotPeriod: '30 jun–17 jul de 2026',
    verification: { verdict: 'mostly_verified', checkedAt: '2026-07-22T15:15:00-04:00', property: 'sc-domain:a7laundry.com', searchType: 'Web', latestPerformanceDate: '2026-07-20', note: 'As métricas principais reconciliam. A quantidade de consultas é parcial devido à anonimização. A antiga afirmação de +700% para o conteúdo não tinha sustentação.' },
    exportEvidence: { canonicalFiles: 5, hashed: true, path: 'docs/audits/evidence/2026-07-22/gsc', workbookInspection: 'pending_runtime', unavailableExports: ['Sitemaps', 'Core Web Vitals'] },
    indexedPages: 29,
    nonIndexedPages: 21,
    sitemapUrls: 62,
    queries: 181,
    queryCountStatus: 'partial_due_to_anonymization',
    manualActions: 0,
    securityIssues: 0,
    articleSignal: { path: '/blog/same-day-laundry-tourists-orlando', previousImpressions: 33, currentImpressions: 60, impressionGrowthPercent: 82, comparison: '11–17 jul vs. 3–10 jul de 2026', health: 'attention', note: 'Direção positiva, mas a base é pequena. A antiga afirmação de +700% era inválida para esta página e comparação.' },
    indexationReasons: [
      { reason: 'Página com redirecionamento', pages: 3, health: 'attention' },
      { reason: 'Descoberta – atualmente não indexada', pages: 18, health: 'attention' }
    ],
    devices: [
      { name: 'Celular', clicks: 13, impressions: 415, ctr: 3.1, position: 11.4, health: 'good' },
      { name: 'Computador', clicks: 4, impressions: 729, ctr: 0.5, position: 23.5, health: 'critical' },
      { name: 'Tablet', clicks: 0, impressions: 1, ctr: 0, position: null, health: 'context' }
    ],
    pages: [
      { path: '/', clicks: 13, impressions: 696, ctr: 1.9, position: 25.9, health: 'critical' },
      { path: '/blog/same-day-laundry-tourists-orlando', clicks: 1, impressions: 93, ctr: 1.1, position: 8.2, health: 'attention' },
      { path: '/blog/how-to-clean-comforter', clicks: 1, impressions: 22, ctr: 4.5, position: 7.6, health: 'good' },
      { path: '/blog/comforter-cleaning-service-orlando', clicks: 1, impressions: 17, ctr: 5.9, position: 6.7, health: 'good' },
      { path: '/blog/laundry-for-vacation-rental-guests', clicks: 1, impressions: 4, ctr: 25, position: 4.8, health: 'good' },
      { path: '/blog/orlando-vacation-rental-laundry-guide', clicks: 0, impressions: 65, ctr: 0, position: 6.5, health: 'critical' }
    ],
    quality: { manualActions: 0, securityIssues: 0, httpsUrls: 3, nonHttpsUrls: 0, coreWebVitals: null, coreWebVitalsReason: 'Dados de campo insuficientes nos últimos 90 dias', validBreadcrumbs: 1, validReviewSnippets: 2 },
    opportunities: [
      { query: 'laundry near me', impressions: 143, clicks: 1, ctr: 0.7, position: 19.2, health: 'attention' },
      { query: 'orlando airport area laundry pickup and delivery', impressions: 27, clicks: 0, ctr: 0, position: 12.7, health: 'attention' },
      { query: 'orlando same day drop off laundry service', impressions: 23, clicks: 0, ctr: 0, position: 13.0, health: 'attention' },
      { query: 'orlando comforter laundry service', impressions: 15, clicks: 0, ctr: 0, position: 13.0, health: 'attention' },
      { query: 'laundromat near me', impressions: 13, clicks: 0, ctr: 0, position: 6.5, health: 'good' },
      { query: 'lavanderia cerca de mi', impressions: 4, clicks: 0, ctr: 0, position: 5.8, health: 'good' }
    ]
  },
  organicSocial: {
    period: '24 jun–24 jul de 2026',
    timezone: 'Horário do Pacífico',
    exportEvidence: {
      canonicalFiles: 3,
      downloadedFiles: 4,
      duplicateFiles: 1,
      reportedDownloads: 5,
      hashed: true,
      path: 'docs/audits/evidence/2026-07-24/meta-organic',
      plannerExportAvailable: false
    },
    summary: {
      uniqueFeedPieces: 12,
      facebook: { distributions: 12, views: 206, reach: 162, interactions: 14, reactions: 2, comments: 0, shares: 12, clicks: 0 },
      instagram: { distributions: 12, carousels: 11, images: 1, views: 562, reach: 260, likes: 35, comments: 2, shares: 0, saves: 0, follows: 0 }
    },
    topContent: [
      { platform: 'Instagram', title: 'More vacation. Less laundry.', publishedAt: '29 jun de 2026', views: 144, reach: 77, interactions: 8, metric: 'curtidas', health: 'good' },
      { platform: 'Facebook', title: 'Your carpet may be dirtier than it looks.', publishedAt: '28 jun de 2026', views: 152, reach: 115, interactions: 12, metric: 'compartilhamentos', health: 'good' },
      { platform: 'Instagram', title: 'Enjoy Orlando — we handle the laundry.', publishedAt: '15 jul de 2026', views: 76, reach: 40, interactions: 6, metric: 'curtidas', health: 'context' }
    ],
    calendar: {
      checkedPeriod: '24 jul–31 ago de 2026',
      source: 'Leitura visual do Planner; exportação indisponível',
      saturatedDates: ['24 jul', '25 jul', '26 jul', '27 jul'],
      occupiedDates: ['28 jul · feed 18:00', '2 ago · feed 18:00'],
      nextFreeDates: ['29 jul', '30 jul', '31 jul', '1 ago', '3 ago'],
      recommendation: '30 jul de 2026 · 10:00 no Planner',
      recommendationStatus: 'not_scheduled',
      note: 'A recomendação não foi agendada. Eventos de calendário e sugestões do Instagram não foram contados como posts. Conferir o fuso no compositor antes de programar.'
    },
    findings: [
      { health: 'attention', title: 'Calendário concentrado demais', detail: '24–27 de julho estavam saturados, enquanto quase todo agosto permanecia livre.' },
      { health: 'attention', title: 'Retenção ainda zerada', detail: 'O Instagram registrou zero salvamentos e zero seguimentos atribuídos às 12 distribuições.' },
      { health: 'attention', title: 'Fuso diferente da operação', detail: 'O relatório do Meta está em Horário do Pacífico, três horas atrás de Orlando nesta data.' },
      { health: 'context', title: 'Contagem de exportações reconciliada', detail: 'Foram encontrados quatro downloads, três arquivos únicos e uma duplicata; a declaração de cinco downloads não foi confirmada no disco.' }
    ],
    note: 'O alcance não deve ser somado entre plataformas como pessoas únicas.'
  },
  analytics: {
    period: '22 jun–21 jul de 2026',
    reliability: 'partial',
    exportEvidence: { canonicalFiles: 14, hashed: true, path: 'docs/audits/evidence/2026-07-22/ga4', overviewExportPresent: false },
    verdict: 'O tráfego tem confiabilidade parcial; as conversões comerciais e a atribuição da mídia paga não são confiáveis.',
    summary: { activeUsers: 68, newUsers: 68, returningUsers: 10, sessions: 101, engagedSessions: 48, engagementRate: 47.52, avgEngagementUserSeconds: 27, views: 115, eventCount: 546, keyEvents: 17, purchases: null, revenueUsd: null },
    channels: [
      { name: 'Direto', sessions: 47, engagedSessions: 16, engagementRate: 34.04, keyEvents: 3, health: 'context' },
      { name: 'Busca orgânica', sessions: 29, engagedSessions: 16, engagementRate: 55.17, keyEvents: 7, health: 'context' },
      { name: 'Social orgânico', sessions: 14, engagedSessions: 10, engagementRate: 71.43, keyEvents: 0, health: 'context' },
      { name: 'Assistente de IA', sessions: 8, engagedSessions: 5, engagementRate: 62.5, keyEvents: 7, health: 'context' },
      { name: 'Não atribuído', sessions: 2, engagedSessions: 0, engagementRate: 0, keyEvents: 0, health: 'attention' },
      { name: 'Referência', sessions: 1, engagedSessions: 1, engagementRate: 100, keyEvents: 0, health: 'context' }
    ],
    findings: [
      { health: 'critical', title: 'Atribuição da mídia paga ausente', detail: 'Os 474 cliques do Meta não podem ser reconciliados com o GA4; nenhuma sessão foi classificada como paga.' },
      { health: 'critical', title: 'Funil comercial ausente', detail: 'generate_lead, begin_checkout e purchase não foram recebidos.' },
      { health: 'attention', title: 'Nomes de eventos fragmentados', detail: 'Visualizações de página, rolagem, WhatsApp e interações por telefone usam nomes de eventos sobrepostos.' },
      { health: 'attention', title: 'Ruído na qualidade do tráfego', detail: 'O baixo volume, somado ao tráfego de data centers e sem engajamento, torna as contagens de usuários e sessões apenas direcionais.' },
      { health: 'unavailable', title: 'Receita e ROAS indisponíveis', detail: 'O GA4 informa US$ 0 porque não existe instrumentação de compra/Stripe; isso não comprova que não houve vendas.' }
    ],
    eventNotes: { whatsappClick: 19, whatsappFabClick: 5, phoneCall: 3, callClick: 3, purchase: null, beginCheckout: null, generateLead: null }
  },
  googleAds: {
    account: {
      id: '290-113-2891',
      name: 'A7 Laundry - 01',
      currency: 'BRL',
      timezone: 'GMT-03:00 — Horário Padrão de Brasília',
      status: 'ACTIVE',
      advertiser: 'A7 MEGA LAVANDERIA LTDA — Brasil'
    },
    audit: {
      checkedAt: '2026-07-24T20:00:00-04:00',
      source: 'Auditoria somente leitura na interface autenticada do Google Ads',
      availablePeriod: '2 jun de 2025–24 jul de 2026',
      exportDownloaded: false,
      liveConnection: false,
      evidencePath: 'docs/audits/evidence/2026-07-24/google-ads',
      note: 'Retrato histórico separado em BRL. Nenhum dado deste bloco deve ser somado ao Meta Ads em USD ou à receita informada pelo proprietário.'
    },
    phase1Plan: {
      status: 'READY_FOR_BUILD_PAUSED',
      campaign: 'A7 | Search | Guest Laundry | Orlando | EN | JUL26',
      packagePath: 'marketing/google-ads/2026-07-guest-laundry-search',
      revenueMilestoneUsd: 250,
      proposedDailyBudgetBrl: 70,
      testDays: 7,
      maximumTestSpendBrl: 490,
      keywordCount: 16,
      rsaCount: 4,
      matchTypes: 'Exata e frase',
      destination: 'https://a7laundry.com/laundry-pickup-delivery-orlando',
      primaryConversion: 'Compra Stripe verificada; lead qualificado apenas após importação durável',
      secondaryConversions: 'WhatsApp, SMS, chamada e visualização',
      excluded: 'PMax, Display, parceiros de pesquisa, broad match, comforter e anúncios somente para chamadas',
      activationVerdict: 'NO-GO até os P0, preflight e aprovação separada de orçamento'
    },
    delivery: {
      accountActive: true,
      enabledCampaigns: 3,
      pausedCampaigns: 2,
      enabledDailyBudgetBrl: 348.18,
      availableFundsBrl: 0.10,
      fundsExhausted: true,
      health: 'critical',
      note: 'Há três campanhas ativadas, mas a conta está praticamente sem veiculação porque os fundos se esgotaram.'
    },
    performance: {
      impressions: 8080,
      clicks: 167,
      ctr: 2.07,
      averageCpcBrl: 28.23,
      spendBrl: 4714.27,
      interactions: 199,
      callConversions: 18,
      conversionRate: 9.05,
      averageCallCpaBrl: 261.90,
      sales: null,
      revenueBrl: null,
      roas: null
    },
    campaigns: [
      { name: 'Housekeeping (Vacation Homes)', status: 'Ativada', dailyBudgetBrl: 116, spendBrl: 865.87, impressions: 2021, interactions: 28, callConversions: 9, callCpaBrl: 96.21, health: 'attention', note: 'Melhor CPA registrado, mas ainda é custo por chamada, não por venda.' },
      { name: 'Lavanderia Pickup & Delivery', status: 'Ativada', dailyBudgetBrl: 116.18, spendBrl: 881.42, impressions: 1319, interactions: 19, callConversions: 5, callCpaBrl: 176.28, health: 'attention', note: 'Português registrou 3 chamadas a R$ 156,36; inglês registrou 2 a R$ 206,17.' },
      { name: 'Carpet & Upholstery Cleaning Orlando', status: 'Ativada', dailyBudgetBrl: 116, spendBrl: 663.03, impressions: 301, interactions: 10, callConversions: 2, callCpaBrl: 331.51, health: 'critical', note: 'CPA elevado e sem venda mensurada.' },
      { name: 'Leads-Search-Orlando', status: 'Pausada', dailyBudgetBrl: 100, spendBrl: 1182.81, impressions: 1792, interactions: 34, callConversions: 2, callCpaBrl: 591.40, health: 'critical', note: 'CPA muito elevado e anúncios reprovados.' },
      { name: 'A7 Max Orlando', status: 'Pausada', dailyBudgetBrl: 80, spendBrl: 1121.15, impressions: 2647, interactions: 108, callConversions: 0, callCpaBrl: null, health: 'critical', note: 'Performance Max consumiu verba sem registrar conversões.' }
    ],
    adGroups: [
      { name: 'Housekeeping', callConversions: 9, callCpaBrl: 96.21, health: 'attention' },
      { name: 'Português – Pickup Orlando', callConversions: 3, callCpaBrl: 156.36, health: 'attention' },
      { name: 'Inglês – Laundry Pickup Orlando', callConversions: 2, callCpaBrl: 206.17, health: 'attention' }
    ],
    geography: [
      { name: 'Kissimmee', callConversions: 4, callCpaBrl: 54.78, health: 'attention' },
      { name: 'Davenport', callConversions: 1, callCpaBrl: 116.83, health: 'attention' }
    ],
    devices: {
      smartphoneCostShare: 97.3,
      smartphoneImpressionShare: 94.7,
      smartphoneClickShare: 95.2,
      note: 'A conta é essencialmente mobile e dependente de anúncios de chamada.'
    },
    searchTerms: {
      useful: ['laundry service for hotels', 'commercial laundry service', 'laundromats orlando fl'],
      excludeOrReview: ['application for laundry service', 'commercial office cleaning', 'the laundry room orlando', 'dry cleaners near me'],
      accountNegativeLists: 0,
      note: 'A estrutura depende fortemente de correspondência ampla e não possui lista negativa no nível da conta.'
    },
    identity: {
      temporaryDomain: 'my-laundry-app-flax.vercel.app',
      officialDomain: 'a7laundry.com',
      callAdPhone: '(689) 407-2015',
      eligibleCallAssetPhone: '(407) 718-8393',
      phoneValidated: false,
      legacyCallOnlyAds: 8,
      disapprovedAdsPresent: true,
      logoStatus: 'Pendente/em análise',
      businessNameStatus: 'Qualificado com limitação'
    },
    measurement: {
      optimizationEvent: 'Chamadas a partir de anúncios',
      callConversions: 18,
      contactActionsExcludedFromGoals: 5,
      salesGoalsConfigured: false,
      siteMeasurementConfigured: false,
      offlineSalesImport: false,
      revenueConfigured: false,
      verdict: 'As campanhas otimizam para chamadas brutas. Lead qualificado, venda, receita, margem e ROAS não são mensurados.',
      findings: [
        { health: 'critical', title: 'Conversão não representa venda', detail: 'As 18 conversões usadas pelas campanhas são chamadas a partir de anúncios.' },
        { health: 'critical', title: 'Receita e ROAS indisponíveis', detail: 'Não há meta de vendas, valor de pedido ou importação offline do MOS.' },
        { health: 'critical', title: 'Identidade divergente', detail: 'O domínio temporário e dois números de telefone diferentes precisam ser reconciliados.' },
        { health: 'attention', title: 'Estrutura de anúncios antiga', detail: 'Os oito anúncios de Pesquisa visíveis são anúncios somente para chamadas e devem migrar para anúncios responsivos com recursos de ligação.' },
        { health: 'attention', title: 'Termos sem proteção', detail: 'Correspondência ampla e ausência de negativas permitem buscas por emprego, concorrentes e serviços não oferecidos.' }
      ]
    },
    billing: {
      availableFundsBrl: 0.10,
      lastPayment: '23 de setembro · R$ 500 via Pix',
      july2026CostBrl: 0,
      july2026PaymentsBrl: 0,
      taxesAndFeesSeptemberBrl: 425.16,
      politicalAdsDeclarationPending: true
    }
  },
  media: {
    account: { id: '650201661142284', name: 'A7 LAUNDRY USA', currency: 'USD', status: 'ACTIVE' },
    salesValidation: {
      source: 'Relato do proprietário em 23 jul 2026',
      status: 'owner_reported',
      period: '22 jun–21 jul de 2026',
      soldService: 'Roupa por libra para hóspedes',
      minimumOrderUsd: 50,
      comforterSales: 0,
      blanketSales: 0,
      saleCount: 6,
      revenueUsd: 491,
      orderValuesUsd: [48, 48, 155, 140, 50, 50],
      averageOrderUsd: 81.83,
      medianOrderUsd: 50,
      repeatOrders: 1,
      uniqueCustomersMin: 4,
      uniqueCustomersMax: 5,
      grossBlendedRoas: 0.9,
      invalidLeadPattern: 'Contatos em espanhol procurando relacionamento, sem intenção de lavanderia',
      note: 'Valores conciliados apenas no total do período, sem anúncio/idioma e sem custo variável. O ROAS de 0,90x usa todo o investimento Meta de US$ 543,17 e não representa margem.'
    },
    verification: {
      verdict: 'verified',
      checkedAt: '2026-07-22T13:45:00-04:00',
      source: 'Reconciliação no navegador com o Gerenciador de Anúncios da Meta',
      timezone: 'Horário do Pacífico',
      attribution: 'Clique em 7 dias ou visualização em 1 dia',
      statusFilter: 'Todos os anúncios (ativos + pausados)',
      differenceCount: 0,
      note: 'As 12 métricas da campanha no MOS coincidiram exatamente com o Meta. O alcance é deduplicado e não deve ser somado entre conjuntos de anúncios.'
    },
    periods: {
      full: { label: '22 jun–21 jul', spendUsd: 543.17, impressions: 29502, reach: 13374, frequency: 2.21, clicks: 474, ctr: 1.61, cpcUsd: 1.15, cpmUsd: 18.41, linkClicks: 266, linkCtr: 0.90, linkCpcUsd: 2.04, messagingConversations: 27, costPerConversationUsd: 20.12, period: '22 jun–21 jul de 2026', health: 'attention' },
      early: { label: '3–10 jul', spendUsd: 206.88, impressions: 11171, reach: 5882, frequency: 1.90, clicks: 197, ctr: 1.76, cpcUsd: 1.05, cpmUsd: 18.52, linkClicks: 104, messagingConversations: 11, costPerConversationUsd: 18.81, period: '3–10 jul de 2026', health: 'good' },
      recent: { label: '11–21 jul', spendUsd: 336.29, impressions: 18331, reach: 9786, frequency: 1.87, clicks: 277, ctr: 1.51, cpcUsd: 1.21, cpmUsd: 18.35, linkClicks: 162, messagingConversations: 16, costPerConversationUsd: 21.02, period: '11–21 jul de 2026', health: 'attention' }
    },
    current: {
      spendUsd: 543.17,
      deliveringCampaigns: 1,
      activeAds: 3,
      messagingConversations: 27,
      costPerConversationUsd: 20.12,
      impressions: 29502,
      reach: 13374,
      clicks: 474,
      ctr: 1.61,
      cpcUsd: 1.15,
      cpmUsd: 18.41,
      linkClicks: 266,
      linkCtr: 0.90,
      linkCpcUsd: 2.04,
      period: '22 jun–21 jul de 2026'
    },
    deliverySplit: {
      active: { ads: 3, spendUsd: 447.20, conversations: 23 },
      paused: { ads: 4, spendUsd: 95.97, conversations: 4 }
    },
    campaign: {
      id: '120248527506970261',
      name: 'A7 | WhatsApp Conversas | Laundry+Comforter | JUL26',
      status: 'PAUSED',
      dailyBudgetUsd: 30,
      objective: 'OUTCOME_ENGAGEMENT'
    },
    liveCampaign: {
      checkedAt: '2026-07-27T23:20:00-04:00',
      source: 'Ads Manager + Meta Business Settings — verificação operacional',
      id: '120249142919120261',
      name: 'A7 | Guest Laundry | Manual | WhatsApp | JUL26',
      status: 'PAUSED',
      objective: 'OUTCOME_ENGAGEMENT',
      budgetType: 'Orçamento diário no conjunto (ABO)',
      dailyBudgetUsd: 30,
      officialWhatsapp: '+1 407-670-8839',
      destinationGuard: 'BLOCKED_TEST_DESTINATION',
      advantageCampaignBudget: false,
      advantageAudience: false,
      placements: 'Manuais — Facebook/Instagram Feed, Stories e Reels',
      adSet: { id: '120249142921280261', name: 'AS | Guest Hotel-Airbnb | Manual | Orlando', status: 'PAUSED_BY_CAMPAIGN' },
      activeAds: [],
      pausedAds: [
        { name: 'A4 | CONTROL | Guest PT', adId: '120249142929850261' },
        { name: 'A3 | CONTROL | Guest EN', adId: '120249142930300261' },
        { name: 'LA7 | CHALLENGER | Guest PT Feed', adId: '120249142930930261' },
        { name: 'LA8 | CHALLENGER | Guest EN Feed', adId: '120249142931360261' },
        { name: 'T5 | CHALLENGER | Guest PT Vertical', adId: '120249142932520261' },
        { name: 'T6 | CHALLENGER | Guest EN Vertical', adId: '120249142933100261' }
      ],
      replacedCampaign: { id: '120248527506970261', status: 'PAUSED' },
      note: 'Campanha pausada após o Ads Manager exibir destino ligado à conta de teste da Meta. Reativação bloqueada até confirmar o número oficial no anúncio.'
    },
    activeAds: [
      { name: 'A4 | Turista PT | SafeZone', adId: '120248703515560261', creativeId: '2787425211625550', image: 'active-creatives/tourist_pt_9x16.png', focus: 'tourist', health: 'good', healthReason: 'CTR de 1,71% e custo por conversa de US$ 19,79 estão na faixa verde.', spendUsd: 336.42, impressions: 19946, reach: 9301, clicks: 341, ctr: 1.71, cpcUsd: 0.99, cpmUsd: 16.87, conversations: 17, costPerConversationUsd: 19.79 },
      { name: 'A3 | Turista EN | SafeZone', adId: '120248702969370261', creativeId: '4650807441822042', image: 'active-creatives/tourist_en_9x16.png', focus: 'tourist', health: 'attention', healthReason: 'CTR de 1,44% e custo por conversa de US$ 22,66 estão na faixa de atenção.', spendUsd: 67.99, impressions: 3260, reach: 2043, clicks: 47, ctr: 1.44, cpcUsd: 1.45, cpmUsd: 20.86, conversations: 3, costPerConversationUsd: 22.66 },
      { name: 'C2 | Edredom | SafeZone', adId: '120248703659920261', creativeId: '1027281063552025', image: 'active-creatives/comforter_en_9x16.png', focus: 'comforter', health: 'critical', healthReason: 'CTR de 0,76%, três conversas e zero vendas confirmadas de edredom/cobertor. Conversa não é venda.', spendUsd: 42.79, impressions: 1580, reach: 889, clicks: 12, ctr: 0.76, cpcUsd: 3.57, cpmUsd: 27.08, conversations: 3, costPerConversationUsd: 14.26 }
    ],
    creativeTests: [
      { testId: 'OPT-C3', name: 'Edredom — Não é só a capa', image: 'test-creatives/opt-c3-nao-so-a-capa_pt_9x16.png', control: 'C2 Edredom', focus: 'comforter', health: 'unavailable', status: 'BACKLOG — NÃO PUBLICAR', hypothesis: 'Arquivado após confirmação de zero vendas do serviço.', target: 'Sem teste pago autorizado' },
      { testId: 'OPT-C4', name: 'Edredom — Cama renovada', image: 'test-creatives/opt-c4-cama-renovada_pt_9x16.png', control: 'C2 Edredom', focus: 'comforter', health: 'unavailable', status: 'BACKLOG — NÃO PUBLICAR', hypothesis: 'Arquivado após confirmação de zero vendas do serviço.', target: 'Sem teste pago autorizado' },
      { testId: 'OPT-T5', name: 'Turista PT — Coleta no hotel', image: 'test-creatives/opt-t5-hotel-pickup_pt_9x16.png', control: 'A4 Turista PT', focus: 'tourist', health: 'unavailable', status: 'PREÇO ANTIGO — NÃO PUBLICAR', hypothesis: 'Mostrar a entrega da sacola na recepção reduz a incerteza sobre o serviço.', target: 'Regenerar com mínimo US$ 50 antes de qualquer teste' },
      { testId: 'OPT-T6', name: 'Turista EN — Pack less', image: 'test-creatives/opt-t6-pack-less_en_9x16.png', control: 'A3 Turista EN', focus: 'tourist', health: 'unavailable', status: 'PREÇO ANTIGO — NÃO PUBLICAR', hypothesis: 'Hook curto e mala visualmente leve melhoram o CTR do controle em inglês.', target: 'Regenerar com mínimo US$ 50 antes de qualquer teste' },
      { testId: 'OPT-OP1', name: 'Turista PT — Operação real e discrição', image: 'test-creatives/opt-op1-discricao-operacao-real_pt_9x16.png', control: 'A4 Turista PT', focus: 'tourist', health: 'attention', status: 'APROVADO — NÃO PUBLICADO', hypothesis: 'Fotografias reais, discrição e evidência do processo aumentam a proporção de conversas qualificadas.', target: 'Substituir LA7 após a janela inicial · mínimo 3 conversas qualificadas e 1 venda' }
    ],
    pausedAds: 4,
    accountStatusNote: 'Campanha manual de hóspedes pausada em 27 jul após regressão do destino de WhatsApp. Nenhuma campanha Meta deve voltar a veicular antes do preflight do número oficial e das prévias por placement.'
  },
  integrations: [
    { name: 'GA4', state: 'warning', health: 'attention', channel: 'analytics', detail: 'O tráfego é coletado, mas a atribuição da mídia paga e a instrumentação de lead/checkout/compra estão incompletas. Quatorze exportações canônicas estão arquivadas com hashes SHA-256.' },
    { name: 'Google Search Console', state: 'active', health: 'good', channel: 'organic', detail: 'Propriedade de domínio verificada; métricas principais reconciliadas até 17 de julho. Cinco XLSX estão arquivados com hashes SHA-256; a quantidade de consultas continua parcial devido à anonimização.' },
    { name: 'Meta orgânico', state: 'warning', health: 'attention', channel: 'organic', detail: 'Três CSVs únicos até 24 de julho estão arquivados com hashes SHA-256. Um quarto download era duplicado, o Planner não oferece exportação e os relatórios usam Horário do Pacífico.' },
    { name: 'Pixel da Meta', state: 'active', health: 'good', channel: 'paid', detail: 'O Pixel 1452877649635363 está recebendo eventos do site e de leads.' },
    { name: 'Meta Ads', state: 'blocked', health: 'critical', channel: 'paid', detail: 'Conta oficial 650201661142284 conectada em leitura; campanha 120249142919120261 pausada porque o destino de WhatsApp não estava no número oficial. Reativação depende do preflight +1 407-670-8839 e das prévias por placement.' },
    { name: 'Google Ads', state: 'blocked', health: 'critical', channel: 'google_ads', detail: 'Conta 290-113-2891 auditada em BRL; R$ 0,10 de fundos, três campanhas ativadas sem entrega efetiva e 18 conversões que representam chamadas, não vendas. Receita e ROAS indisponíveis.' },
    { name: 'Stripe', state: 'blocked', health: 'unavailable', channel: 'revenue', detail: 'O acesso de leitura ao painel não está autorizado. Há US$ 491 de receita informada manualmente, mas ainda sem comprovante integrado, custo variável ou atribuição por anúncio.' }
  ]
});
