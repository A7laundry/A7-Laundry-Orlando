import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

await import('../../mos-kpis.js');
await import('../generated/audit-registry.js');

function dashboardRuntime() {
  delete globalThis.A7_MOS_LIVE;
  delete globalThis.A7_MOS_LIVE_STATE;
  const html = fs.readFileSync(path.resolve(import.meta.dirname, '../../a7-command-center.html'), 'utf8');
  const marker = '<script src="mos-kpis.js"></script>';
  const script = html.slice(html.indexOf(marker) + marker.length).match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, { id, value: id === 'mosPeriodFilter' ? 'full' : 'all', innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {} } });
    return elements.get(id);
  };
  globalThis.document = {
    getElementById: element,
    querySelectorAll: () => [],
    querySelector: () => ({ classList: { add() {}, remove() {} } })
  };
  globalThis.window = { addEventListener() {}, scrollTo() {} };
  const api = new Function(`${script}; return { renderMosKpis, renderMosAuditRegistry, changeMosCreativeFocus, resetMosFilters };`)();
  return { api, element };
}

test('MOS filters produce decision-grade paid, creative and revenue views', () => {
  const { api, element } = dashboardRuntime();
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /Aguardando fontes atuais/);
  assert.match(element('mosScorecard').innerHTML, /Indisponível/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, />68</);
  assert.match(element('mosHistoricalScorecard').innerHTML, /RETRATO HISTÓRICO/);
  assert.match(element('mosActions').innerHTML, /Corrigir a atribuição da mídia paga/);
  assert.match(element('mosActions').innerHTML, /Conectar receita e pedidos/);
  assert.equal((element('mosActiveAds').innerHTML.match(/<article/g) || []).length, 3);
  assert.equal((element('mosCreativeTests').innerHTML.match(/<article/g) || []).length, 5);

  element('mosChannelFilter').value = 'paid';
  element('mosPeriodFilter').value = 'early';
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /estado atual do Meta Ads não está disponível/);
  assert.match(element('mosMediaStatus').innerHTML, /DADOS ATUAIS INDISPONÍVEIS/);
  assert.doesNotMatch(element('mosMediaStatus').innerHTML, /206,88/);
  assert.match(element('mosActiveAds').innerHTML, /divisão por criativo não foi coletada/);

  api.resetMosFilters();
  element('mosCreativeFilter').value = 'comforter';
  api.changeMosCreativeFocus();
  assert.equal(element('mosChannelFilter').value, 'paid');
  assert.equal((element('mosActiveAds').innerHTML.match(/<article/g) || []).length, 1);
  assert.match(element('mosActiveAds').innerHTML, /C2 \| Edredom/);
  assert.match(element('mosDecision').innerHTML, /decision-light">Indisponível/);
  assert.match(element('mosActions').innerHTML, /Concentrar verba no serviço que vendeu/);
  assert.equal((element('mosCreativeTests').innerHTML.match(/<article/g) || []).length, 2);
  assert.match(element('mosCreativeTests').innerHTML, /BACKLOG — NÃO PUBLICAR/);

  api.resetMosFilters();
  element('mosChannelFilter').value = 'analytics';
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /indicadores atuais do GA4 não estão disponíveis/);
  assert.match(element('mosScorecard').innerHTML, /Usuários ativos no GA4/);
  assert.match(element('mosScorecard').innerHTML, /Google Analytics Data API/);
  assert.match(element('mosScorecard').innerHTML, /Período atual não recebido/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, />68</);
  assert.match(element('mosAnalyticsFindings').innerHTML, /Atribuição da mídia paga ausente/);
  assert.match(element('mosActions').innerHTML, /UTMs padronizadas/);
  assert.equal(element('mosMediaSection').style.display, 'none');

  api.resetMosFilters();
  element('mosChannelFilter').value = 'google_ads';
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /API nativa ainda não está conectada/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /RETRATO HISTÓRICO · 24 JUL 2026/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /R\$ 0,10/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /não são tratados como atuais/);
  assert.doesNotMatch(element('mosGoogleAdsSummary').innerHTML, /Chamadas registradas/);
  assert.match(element('mosGoogleAdsCampaigns').innerHTML, /Estado operacional indisponível/);
  assert.match(element('mosGoogleAdsFindings').innerHTML, /Concluir a credencial nativa/);
  assert.match(element('mosGoogleAdsTerms').innerHTML, /Termos atuais indisponíveis/);
  assert.match(element('mosActions').innerHTML, /Medir vendas reais no Google Ads/);
  assert.match(element('mosActions').innerHTML, /Construir o Search de Guest Laundry pausado/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, /Investimento no Meta Ads/);
  assert.equal(element('mosMediaSection').style.display, 'none');

  api.resetMosFilters();
  element('mosChannelFilter').value = 'organic';
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /busca orgânica atual não está disponível/);
  assert.match(element('mosScorecard').innerHTML, /Google Search Console API/);
  assert.match(element('mosScorecard').innerHTML, /Período atual não recebido/);
  assert.match(element('mosContentSignal').innerHTML, /33 → 60 impressões/);
  assert.match(element('mosContentSignal').innerHTML, /Visualizações no Instagram/);
  assert.match(element('mosContentSignal').innerHTML, /30 jul de 2026 · 10:00 no Planner — não programada/);
  assert.match(element('mosContentSignal').innerHTML, /3 CSVs únicos, 4 downloads encontrados e 1 duplicata/);
  assert.doesNotMatch(element('mosContentSignal').innerHTML, />\+700%<\/div>/);
  assert.match(element('mosSeoPageRows').innerHTML, /Nenhuma página orgânica/);
  assert.match(element('mosActions').innerHTML, /Melhorar CTR e indexação orgânica/);
  assert.match(element('mosActions').innerHTML, /Redistribuir o calendário orgânico/);

  api.resetMosFilters();
  element('mosChannelFilter').value = 'revenue';
  api.renderMosKpis();
  assert.match(element('mosDecision').innerHTML, /Vendas e receita atuais ainda não possuem fonte integrada/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, /Receita bruta informada/);
  assert.match(element('mosManualScorecard').innerHTML, /MANUAL · NÃO É AO VIVO/);
  assert.match(element('mosManualScorecard').innerHTML, /491,00/);
  assert.match(element('mosManualScorecard').innerHTML, /Fonte: Relato do proprietário/);
  assert.match(element('mosManualScorecard').innerHTML, /Período: 22 jun–21 jul de 2026/);
  assert.doesNotMatch(element('mosManualScorecard').innerHTML, /API ao vivo/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, /Investimento no Meta Ads/);
});

test('MOS preserves and exposes the complete immutable audit timeline', () => {
  const {api, element} = dashboardRuntime();
  const auditCount = globalThis.A7_MOS_AUDIT_REGISTRY.auditCount;
  api.renderMosKpis();
  assert.match(element('mosAuditRegistrySummary').innerHTML, new RegExp(`${auditCount} auditorias imutáveis preservadas`));
  assert.match(element('mosAuditRegistrySummary').innerHTML, /Mais recente.*apenas um ponteiro/);
  assert.equal((element('mosAuditTimeline').innerHTML.match(/<button/g) || []).length, auditCount);
  assert.match(element('mosAuditTimeline').innerHTML, /2026-07-10/);
  assert.match(element('mosAuditTimeline').innerHTML, /2026-08-06/);
  assert.match(element('mosAuditTimeline').innerHTML, /2026-08-24/);
  assert.match(element('mosAuditTimeline').innerHTML, /auditoria de mensagem e conversão/i);
  assert.match(element('mosAuditTimeline').innerHTML, /auditoria de atendimento/i);
  assert.match(element('mosAuditDetail').innerHTML, /24-day GA4, GSC and paid-media forensic checkpoint/);
  element('mosAuditSelect').value = '2026-08-06-seo-tracking-cleanup';
  api.renderMosAuditRegistry();
  assert.match(element('mosAuditDetail').innerHTML, /SEO e tracking/);
  assert.match(element('mosAuditDetail').innerHTML, /SHA-256/);
  assert.match(element('mosAuditComparison').innerHTML, /não inventa valores/);
  element('mosAuditSelect').value = '2026-07-27-mos-kpi-snapshot';
  element('mosAuditCompareSelect').value = '2026-07-24-google-ads-meta-organic';
  api.renderMosAuditRegistry();
  assert.match(element('mosAuditDetail').innerHTML, /snapshot completo de KPIs/i);
  assert.match(element('mosAuditDetail').innerHTML, /mos-data\/snapshots\/2026-07-27-mos-kpis\.js/);
});

test('MOS visible operating experience defaults to Brazilian Portuguese', () => {
  const html = fs.readFileSync(path.resolve(import.meta.dirname, '../../a7-command-center.html'), 'utf8');
  const login = fs.readFileSync(path.resolve(import.meta.dirname, '../login.html'), 'utf8');
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /Indicadores de desempenho/);
  assert.match(html, /Todas as situações/);
  assert.match(login, /Sistema de Gestão Operacional/);
});

test('MOS replaces only connected Google KPIs and labels their provenance', () => {
  const { api, element } = dashboardRuntime();
  globalThis.A7_MOS_LIVE = {
    schemaVersion: '1.2',
    status: 'live',
    fetchedAt: '2026-07-26T13:00:00.000Z',
    requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' },
    sources: {
      ga4: {
        status: 'live',
        source: 'Google Analytics Data API',
        requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' },
        summary: { activeUsers: 80, sessions: 123, engagementRate: 0.55, keyEvents: 22, ecommercePurchases: 10, totalRevenue: 491 },
        channels: [{ sessionDefaultChannelGroup: 'Organic Search', sessions: 50, engagedSessions: 30, engagementRate: 0.6, keyEvents: 8 }],
        landingPages: [
          { landingPage: '/blog/orlando-vacation-rental-laundry-guide.html', canonicalPath: '/blog/orlando-vacation-rental-laundry-guide.html', sessions: 12, activeUsers: 10, engagedSessions: 8, keyEvents: 1 },
          { landingPage: '/blog/laundry-cost-orlando.html', canonicalPath: '/blog/laundry-cost-orlando.html', sessions: 9, activeUsers: 8, engagedSessions: 6, keyEvents: 3 }
        ],
        contentPages: [
          { pagePath: '/blog/orlando-vacation-rental-laundry-guide.html', canonicalPath: '/blog/orlando-vacation-rental-laundry-guide.html', pageTitle: 'Orlando vacation laundry guide', screenPageViews: 30, activeUsers: 20, eventCount: 80, keyEvents: 1 },
          { pagePath: '/blog/laundry-cost-orlando.html', canonicalPath: '/blog/laundry-cost-orlando.html', pageTitle: 'Laundry cost in Orlando', screenPageViews: 20, activeUsers: 15, eventCount: 55, keyEvents: 3 }
        ],
        interactions: [
          { pagePath: '/blog/orlando-vacation-rental-laundry-guide.html', canonicalPath: '/blog/orlando-vacation-rental-laundry-guide.html', eventName: 'whatsapp_click', eventCount: 2, totalUsers: 2, keyEvents: 1 },
          { pagePath: '/blog/laundry-cost-orlando.html', canonicalPath: '/blog/laundry-cost-orlando.html', eventName: 'whatsapp_click', eventCount: 4, totalUsers: 3, keyEvents: 3 }
        ],
        currentDay: {
          status: 'live',
          source: 'Google Analytics Data API',
          requestedPeriod: { startDate: '2026-07-26', endDate: '2026-07-26', timeZone: 'America/New_York', state: 'intraday' },
          contentPages: [{ pagePath: '/blog/orlando-vacation-rental-laundry-guide.html', canonicalPath: '/blog/orlando-vacation-rental-laundry-guide.html', pageTitle: 'Orlando vacation laundry guide', screenPageViews: 4, activeUsers: 3, eventCount: 9, keyEvents: 1 }]
        }
      },
      searchConsole: {
        status: 'live',
        source: 'Google Search Console API',
        requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' },
        summary: { clicks: 25, impressions: 1900, ctr: 0.01316, position: 13.4 },
        queries: [{ query: '<script>unsafe</script>', clicks: 4, impressions: 200, ctr: 0.02, position: 8 }],
        pages: [
          { page: 'https://a7laundry.com/laundry-pickup-delivery-orlando', clicks: 10, impressions: 700, ctr: 0.0143, position: 9 },
          { page: 'https://a7laundry.com/blog/orlando-vacation-rental-laundry-guide.html', canonicalPath: '/blog/orlando-vacation-rental-laundry-guide.html', clicks: 5, impressions: 300, ctr: 0.0167, position: 8 },
          { page: 'https://a7laundry.com/blog/laundry-cost-orlando.html', canonicalPath: '/blog/laundry-cost-orlando.html', clicks: 3, impressions: 220, ctr: 0.0136, position: 12 }
        ]
      },
      googleAds: {
        status: 'partial_live',
        source: 'Google Analytics Data API — vínculo Google Ads',
        requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' },
        limitation: 'Não substitui a Google Ads API nativa.',
        rows: [{ sessionGoogleAdsCampaignName: 'A7 Guest', advertiserAdImpressions: 900, advertiserAdClicks: 40, advertiserAdCost: 55.2, sessions: 18, keyEvents: 4 }]
      },
      metaAds: {
        status: 'live',
        source: 'Meta Marketing API',
        adAccountId: '650201661142284',
        requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23', todayDate: '2026-07-23' },
        campaigns: [{ id: 'campaign-1', name: 'Guest Laundry', status: 'ACTIVE', effective_status: 'ACTIVE' }],
        adSets: [{ id: 'adset-1', campaign_id: 'campaign-1', name: 'Hotels', status: 'ACTIVE', effective_status: 'ACTIVE' }],
        ads: [{
          id: '120249142929850261',
          campaign_id: 'campaign-1',
          adset_id: 'adset-1',
          name: 'Hotel pickup',
          status: 'ACTIVE',
          effective_status: 'ACTIVE',
          creative: { id: 'creative-1', thumbnail_url: 'https://example.test/thumb.jpg' }
        }],
        insights: [{ date: '2026-07-23', dateStart: '2026-07-23', dateStop: '2026-07-23', adId: '120249142929850261', spend: 30, impressions: 1500, clicks: 18, linkClicks: 12, messagingConversations: 3 }]
      }
    },
    marketingGraph: {
      status: 'partial_live',
      nodes: [
        { id: 'campaign:1', type: 'campaign', label: 'A7 Guest', sourceMedium: 'google / cpc' },
        { id: 'page:/laundry-pickup-delivery-orlando', type: 'landing_page', label: '/laundry-pickup-delivery-orlando' },
        { id: 'event:whatsapp', type: 'event', label: '<script>whatsapp</script>' }
      ],
      edges: [
        { id: 'edge:1', type: 'campaign_to_page', from: 'campaign:1', to: 'page:/laundry-pickup-delivery-orlando', source: 'Google Analytics Data API', requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' }, metrics: { sessions: 18, keyEvents: 4 } },
        { id: 'edge:2', type: 'page_to_event', from: 'page:/laundry-pickup-delivery-orlando', to: 'event:whatsapp', source: 'Google Analytics Data API', requestedPeriod: { startDate: '2026-06-24', endDate: '2026-07-23' }, metrics: { eventCount: 7, keyEvents: 3 } }
      ]
    },
    funnels: [{
      id: 'orlando-money', name: 'Orlando Guest Pickup', canonicalPath: '/laundry-pickup-delivery-orlando', managedFunnel: true,
      funnelCodes: ['SEO-ORLANDO-MONEY-V2'], releaseStatus: 'active_production',
      intent: '<script>commercial intent</script>', audience: 'Hotel guests', action: 'Send stay and deadline', campaignRole: 'Main Guest Laundry destination',
      sources: { ga4: { status: 'observed' }, searchConsole: { status: 'observed' } },
      performance: { ga4: { sessions: 18, contactEvents: 7 }, searchConsole: { impressions: 700, clicks: 10, ctr: 0.0143, position: 9 } },
      campaigns: [{ sourceMedium: 'google / cpc', campaign: 'Guest Laundry Search', sessions: 18 }],
      topQueries: [{ query: '<script>hotel laundry</script>', impressions: 300 }],
      limitation: 'Sources are not deduplicated.'
    }],
    growthRegistry: {
      status: 'live', artifactState: 'built', sourceUrlCount: 98, publicIndexableCount: 62,
      assets: [
        { canonicalPath: '/laundry-pickup-delivery-orlando', journeyStage: 'bofu', clusterId: 'guest-laundry-orlando', intendedIndexation: 'index', observationState: 'active_production' },
        { canonicalPath: '/blog/laundry-solara-resort', journeyStage: 'bofu', clusterId: 'resort-property-review', intendedIndexation: 'noindex_review', observationState: 'unobserved' }
      ]
    }
  };
  globalThis.A7_MOS_LIVE_STATE = { status: 'live' };
  api.renderMosKpis();
  assert.match(element('mosKpiAlert').innerHTML, /Mapa de marketing consultado em modo somente leitura/);
  assert.match(element('mosKpiAlert').innerHTML, /Meta Ads está conectado pela API somente leitura/);
  assert.doesNotMatch(element('mosKpiAlert').innerHTML, /Meta Ads permanece não conectado/);
  assert.match(element('mosScorecard').innerHTML, /API ao vivo/);
  assert.match(element('mosScorecard').innerHTML, />123</);
  assert.match(element('mosFunnelCatalog').innerHTML, /Orlando Guest Pickup/);
  assert.match(element('mosFunnelCatalog').innerHTML, /Guest Laundry Search/);
  assert.match(element('mosFunnelCatalog').innerHTML, /700/);
  assert.match(element('mosFunnelCatalog').innerHTML, /&lt;script&gt;commercial intent&lt;\/script&gt;/);
  assert.doesNotMatch(element('mosFunnelCatalog').innerHTML, /<script>commercial intent<\/script>/);
  assert.match(element('mosFunnelCatalog').innerHTML, /&lt;script&gt;hotel laundry&lt;\/script&gt;/);
  assert.match(element('mosGrowthPortfolioSummary').innerHTML, /98/);
  assert.match(element('mosGrowthPortfolioSummary').innerHTML, /62/);
  assert.match(element('mosGrowthPortfolioRows').innerHTML, /laundry-solara-resort/);
  assert.match(element('mosGrowthPortfolioRows').innerHTML, /QUARENTENA/);
  const dashboardSource = fs.readFileSync(path.resolve(import.meta.dirname, '../../a7-command-center.html'), 'utf8');
  assert.match(dashboardSource, /schemaVersion:'1\.4',status:'unavailable',sources:\{\},funnels:\[\]/);
  element('mosChannelFilter').value = 'revenue';
  api.renderMosKpis();
  assert.match(element('mosScorecard').innerHTML, /Compras registradas no GA4/);
  assert.match(element('mosScorecard').innerHTML, />10</);
  assert.match(element('mosScorecard').innerHTML, /Receita registrada no GA4/);
  assert.match(element('mosScorecard').innerHTML, /491,00/);
  assert.match(element('mosScorecard').innerHTML, /Google Analytics Data API/);
  assert.match(element('mosScorecard').innerHTML, /2026-06-24–2026-07-23/);
  assert.match(element('mosScorecard').innerHTML, /API ao vivo/);
  element('mosChannelFilter').value = 'all';
  api.renderMosKpis();
  assert.match(element('mosAnalyticsSummary').innerHTML, /API AO VIVO/);
  assert.match(element('mosSeoRows').innerHTML, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.doesNotMatch(element('mosSeoRows').innerHTML, /<script>unsafe<\/script>/);
  assert.match(element('mosMarketingGraphRows').innerHTML, /Campanha → página/);
  assert.match(element('mosMarketingGraphRows').innerHTML, /Página → evento/);
  assert.match(element('mosMarketingGraphRows').innerHTML, /&lt;script&gt;whatsapp&lt;\/script&gt;/);
  assert.match(element('mosLiveSources').innerHTML, /Google Ads/);
  assert.match(element('mosLiveSources').innerHTML, /NATIVA PENDENTE/);
  assert.match(element('mosLiveSources').innerHTML, /Meta Ads/);
  assert.match(element('mosLiveSources').innerHTML, /API AO VIVO/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /API NATIVA NÃO CONECTADA/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /VÍNCULO GA4 PARCIAL/);
  assert.match(element('mosGoogleAdsCampaigns').innerHTML, /Estado operacional indisponível/);
  assert.match(element('mosMediaStatus').innerHTML, /META API AO VIVO/);
  assert.match(element('mosMediaStatus').innerHTML, /1 campanha\(s\) · 1 conjunto\(s\) · 1 anúncio\(s\) ativos/);
  assert.equal((element('mosActiveAds').innerHTML.match(/<article/g) || []).length, 1);
  assert.match(element('mosActiveAds').innerHTML, /Hotel pickup/);
  assert.match(element('mosActiveAds').innerHTML, /ATIVO PELA API/);
  assert.match(element('mosArticleSummary').innerHTML, /Orlando vacation laundry guide/);
  assert.match(element('mosArticleSummary').innerHTML, />4</);
  assert.ok(element('mosArticleRows').innerHTML.indexOf('Orlando vacation laundry guide') < element('mosArticleRows').innerHTML.indexOf('Laundry cost in Orlando'));
  assert.match(element('mosNetworkFunnel').innerHTML, /Descoberta/);
  assert.doesNotMatch(element('mosNetworkFunnel').innerHTML, /Retenção/);
  assert.doesNotMatch(element('mosNetworkFunnel').innerHTML, /Venda/);
  assert.match(element('mosNetworkFunnelBoundary').innerHTML, /Registros manuais/);

  element('mosArticleSort').value = 'keyEvents';
  api.renderMosKpis();
  assert.ok(element('mosArticleRows').innerHTML.indexOf('Laundry cost in Orlando') < element('mosArticleRows').innerHTML.indexOf('Orlando vacation laundry guide'));
});

test('MOS uses the native Google Ads API for current campaign and delivery state', () => {
  const { api, element } = dashboardRuntime();
  globalThis.A7_MOS_LIVE = {
    schemaVersion: '1.3',
    status: 'live',
    fetchedAt: '2026-07-29T13:00:00.000Z',
    requestedPeriod: { startDate: '2026-06-26', endDate: '2026-07-26' },
    sources: {
      googleAds: {
        status: 'live',
        source: 'Google Ads API',
        customerId: '2901132891',
        requestedPeriod: {
          startDate: '2026-06-30',
          endDate: '2026-07-29',
          todayDate: '2026-07-29'
        },
        account: {
          name: 'A7 Laundry',
          currency: 'BRL',
          timeZone: 'America/Sao_Paulo'
        },
        summary: {
          last30: {
            cost: 250,
            impressions: 5000,
            clicks: 140,
            conversions: 7,
            costPerConversion: 35.714
          }
        },
        campaigns: [{
          id: 'campaign-101',
          name: 'Guest Laundry Search',
          configuredStatus: 'ENABLED',
          deliveryStatus: 'delivering_today',
          budget: { dailyAmount: 70 },
          performance: {
            today: { cost: 18, impressions: 320, conversions: 1 },
            last30: { cost: 250, impressions: 5000, clicks: 140, conversions: 7, costPerConversion: 35.714 }
          }
        }],
        ads: [{
          id: 'ad-401',
          name: 'Laundry Pickup Orlando',
          configuredStatus: 'ENABLED',
          deliveryStatus: 'delivering_today',
          performance: { today: { cost: 18, impressions: 320, conversions: 1 } }
        }],
        searchTerms: [{
          term: 'hotel laundry service near me',
          metrics: { cost: 20 }
        }],
        conversions: [{
          actionName: 'A7 - WhatsApp click (site)',
          conversions: 5,
          allConversions: 6,
          conversionValue: 0
        }]
      }
    },
    marketingGraph: { status: 'partial_live', nodes: [], edges: [] }
  };
  globalThis.A7_MOS_LIVE_STATE = { status: 'live' };
  element('mosChannelFilter').value = 'google_ads';
  api.renderMosKpis();

  assert.match(element('mosDecision').innerHTML, /Google Ads está conectado e entregando hoje/);
  assert.match(element('mosDecision').innerHTML, /R\$ 18,00/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /GOOGLE ADS API NATIVA/);
  assert.match(element('mosGoogleAdsSummary').innerHTML, /1 campanha\(s\) ativa\(s\) · 1 entregando hoje/);
  assert.match(element('mosGoogleAdsCampaigns').innerHTML, /Guest Laundry Search/);
  assert.match(element('mosGoogleAdsCampaigns').innerHTML, /R\$ 70,00/);
  assert.match(element('mosGoogleAdsFindings').innerHTML, /A7 - WhatsApp click \(site\)/);
  assert.match(element('mosGoogleAdsTerms').innerHTML, /hotel laundry service near me/);
  assert.doesNotMatch(element('mosGoogleAdsSummary').innerHTML, /R\$ 0,10/);
  assert.doesNotMatch(element('mosGoogleAdsSummary').innerHTML, /Fundos esgotados/);
});

test('MOS fails closed and separates the dated snapshot when the live connection is unavailable', () => {
  const { api, element } = dashboardRuntime();
  globalThis.A7_MOS_LIVE = { schemaVersion: '1.0', status: 'unavailable', sources: {} };
  globalThis.A7_MOS_LIVE_STATE = { status: 'unavailable' };
  api.renderMosKpis();
  assert.match(element('mosKpiAlert').innerHTML, /Dados atuais indisponíveis/);
  assert.match(element('mosKpiAlert').innerHTML, /Nenhum número histórico foi usado como fallback/);
  assert.match(element('mosScorecard').innerHTML, /Usuários ativos no GA4/);
  assert.match(element('mosScorecard').innerHTML, /Indisponível/);
  assert.match(element('mosScorecard').innerHTML, /Google Analytics Data API/);
  assert.match(element('mosScorecard').innerHTML, /Período atual não recebido/);
  assert.match(element('mosAnalyticsSummary').innerHTML, /INDISPONÍVEL/);
  assert.doesNotMatch(element('mosScorecard').innerHTML, />68</);
  assert.match(element('mosHistoricalScorecard').innerHTML, />68</);
  assert.match(element('mosHistoricalScorecard').innerHTML, /RETRATO HISTÓRICO/);
  assert.match(element('mosManualScorecard').innerHTML, /MANUAL · NÃO É AO VIVO/);
  assert.doesNotMatch(element('mosManualScorecard').innerHTML, /API ao vivo/);
});

test('browser bundle contains no Google workload identity values or private keys', () => {
  const browserSource = fs.readFileSync(path.resolve(import.meta.dirname, '../../a7-command-center.html'), 'utf8');
  assert.doesNotMatch(browserSource, /936115008663/);
  assert.doesNotMatch(browserSource, /mos-readonly@a7-laundry-mos\.iam\.gserviceaccount\.com/);
  assert.doesNotMatch(browserSource, /private_key|BEGIN PRIVATE KEY/);
});
