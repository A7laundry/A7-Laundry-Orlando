import { getVercelOidcToken } from '@vercel/oidc';
import { ExternalAccountClient } from 'google-auth-library';
import { readCookie, verifySession } from '../auth.js';
import {
  collectGoogleKpis,
  externalAccountOptions,
  readGoogleKpiConfig
} from '../google-kpis-contract.js';
import {
  collectGoogleAdsKpis,
  readGoogleAdsKpiConfig,
  requestedPaidMediaPeriod
} from '../google-ads-kpis-contract.js';
import { collectMetaKpis, readMetaKpiConfig } from '../meta-kpis-contract.js';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function GET(request) {
  const session = await verifySession(readCookie(request, 'mos_session'), process.env.MOS_SESSION_SECRET);
  const allowedEmail = String(process.env.MOS_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!session || session.email !== allowedEmail) return json({ error: 'Não autorizado.' }, 401);

  const config = readGoogleKpiConfig();
  if (!config.ok) {
    return json({
      schemaVersion: '1.3',
      status: 'unavailable',
      error: {
        code: 'CONFIGURATION_INCOMPLETE',
        message: 'A conexão de leitura do Google ainda não está completamente configurada.'
      }
    }, 503);
  }

  try {
    const googleAdsConfig = readGoogleAdsKpiConfig();
    const oidcToken = await getVercelOidcToken({
      team: 'dennis-a7s-projects',
      project: 'a7-laundry-mos',
      expirationBufferMs: 60_000
    });
    const authClient = ExternalAccountClient.fromJSON(externalAccountOptions(config, oidcToken, {
      includeGoogleAds: googleAdsConfig.ok
    }));
    if (!authClient) throw new Error('External account client unavailable');
    const result = await collectGoogleKpis(authClient, config);
    result.schemaVersion = '1.3';
    result.periods = {
      googleOrganic: result.requestedPeriod,
      ga4CurrentDay: result.sources.ga4?.currentDay?.requestedPeriod || null,
      googleAds: googleAdsConfig.ok
        ? requestedPaidMediaPeriod(new Date(), googleAdsConfig.accountTimeZone)
        : null,
      metaAds: requestedPaidMediaPeriod(new Date(), 'America/Los_Angeles')
    };
    if (googleAdsConfig.ok) {
      const linkedFallback = result.sources.googleAds;
      const nativeGoogleAds = await collectGoogleAdsKpis(authClient, googleAdsConfig, {
        period: result.periods.googleAds
      });
      result.sources.googleAds = {
        ...nativeGoogleAds,
        linkedGa4Fallback: linkedFallback
      };
      result.errors.push(...(nativeGoogleAds.errors || []).map((error) => ({
        source: 'google_ads',
        ...error
      })));
    } else {
      result.sources.googleAds.nativeConnection = {
        status: 'unavailable',
        source: 'Google Ads API',
        limitation: 'A integração nativa aguarda GOOGLE_ADS_CUSTOMER_ID e GOOGLE_ADS_DEVELOPER_TOKEN no servidor.'
      };
    }
    const metaConfig = readMetaKpiConfig();
    if (metaConfig.ok) {
      const meta = await collectMetaKpis(fetch, metaConfig, result.periods.metaAds);
      result.sources.metaAds = meta;
      if (meta.graph) {
        const existingNodeIds = new Set(result.marketingGraph.nodes.map((node) => node.id));
        meta.graph.nodes.forEach((node) => {
          if (!existingNodeIds.has(node.id)) result.marketingGraph.nodes.push(node);
        });
        result.marketingGraph.edges.push(...meta.graph.edges);
        result.marketingGraph.status = meta.status === 'live' ? 'live' : 'partial_live';
      }
      if (meta.status === 'unavailable') {
        result.errors.push({
          source: 'meta_ads',
          code: 'UPSTREAM_ERROR',
          message: 'A conexão somente leitura da Meta não respondeu com dados válidos.'
        });
      }
    }
    return json(result, result.status === 'unavailable' ? 502 : 200);
  } catch {
    return json({
      schemaVersion: '1.3',
      status: 'unavailable',
      error: {
        code: 'GOOGLE_CONNECTION_FAILED',
        message: 'A conexão temporária com o Google falhou; os indicadores atuais devem permanecer indisponíveis.'
      }
    }, 502);
  }
}
