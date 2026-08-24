#!/usr/bin/env node
/**
 * Auditoria forense da campanha de Search do Google Ads.
 *
 * Responde três perguntas, com dados vivos:
 *   1. Em que momentos perdemos o leilão — e se perdemos por orçamento ou por rank.
 *   2. Quais termos de busca consomem verba sem qualificar.
 *   3. O que o Google está recomendando e quanto vale.
 *
 * Somente leitura. Nenhuma chamada altera lances, orçamento, status ou recomendações.
 *
 * Pré-requisitos:
 *   1. Escopo adwords no ADC:
 *        gcloud auth application-default login \
 *          --scopes=https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/cloud-platform
 *   2. Credenciais da conta:
 *        cd mos-app && vercel env pull .env.local
 *      ou exporte GOOGLE_ADS_DEVELOPER_TOKEN e GOOGLE_ADS_CUSTOMER_ID.
 *
 * Uso:  node scripts/audit-google-ads-forensic.mjs [--days=30] [--json]
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24';

const args = process.argv.slice(2);
const DAYS = Number((args.find((a) => a.startsWith('--days=')) || '--days=30').split('=')[1]);
const AS_JSON = args.includes('--json');

/* ---------------------------------------------------------------- config -- */

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function readConfig() {
  const files = {
    ...loadEnvFile(resolve(ROOT, 'mos-app/.env.local')),
    ...loadEnvFile(resolve(ROOT, '.env.local')),
    ...loadEnvFile(resolve(ROOT, '.env'))
  };
  const pick = (k) => process.env[k] || files[k] || '';
  const developerToken = pick('GOOGLE_ADS_DEVELOPER_TOKEN');
  const customerId = pick('GOOGLE_ADS_CUSTOMER_ID').replace(/\D/g, '');
  const loginCustomerId = pick('GOOGLE_ADS_LOGIN_CUSTOMER_ID').replace(/\D/g, '');
  const missing = [];
  if (!developerToken) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!customerId) missing.push('GOOGLE_ADS_CUSTOMER_ID');
  return { developerToken, customerId, loginCustomerId, missing };
}

async function accessToken() {
  const { stdout } = await execFileAsync('gcloud', ['auth', 'application-default', 'print-access-token']);
  const token = stdout.trim();
  const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
  const info = await res.json().catch(() => ({}));
  if (!String(info.scope || '').includes('adwords')) {
    throw new Error(
      'O token do gcloud não tem o escopo adwords. Rode:\n' +
      '  gcloud auth application-default login \\\n' +
      '    --scopes=https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/cloud-platform'
    );
  }
  return token;
}

/* ------------------------------------------------------------------- api -- */

async function gaql(cfg, token, query) {
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${cfg.customerId}/googleAds:searchStream`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'developer-token': cfg.developerToken,
    'Content-Type': 'application/json'
  };
  if (cfg.loginCustomerId) headers['login-customer-id'] = cfg.loginCustomerId;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 600)}`);
  const chunks = JSON.parse(text);
  return chunks.flatMap((c) => c.results || []);
}

/* ---------------------------------------------------------------- format -- */

const pct = (v) => (v === null || v === undefined ? '  —  ' : `${(Number(v) * 100).toFixed(1)}%`);
const money = (micros) => (micros === null || micros === undefined ? '—' : (Number(micros) / 1e6).toFixed(2));
const int = (v) => Number(v || 0).toLocaleString('pt-BR');

function bar(value, width = 22) {
  const n = Math.max(0, Math.min(1, Number(value) || 0));
  const filled = Math.round(n * width);
  return '█'.repeat(filled) + '·'.repeat(width - filled);
}

function h(title) {
  console.log(`\n${'═'.repeat(74)}\n${title}\n${'═'.repeat(74)}`);
}

const DOW = {
  MONDAY: 'seg', TUESDAY: 'ter', WEDNESDAY: 'qua', THURSDAY: 'qui',
  FRIDAY: 'sex', SATURDAY: 'sáb', SUNDAY: 'dom'
};

/* ----------------------------------------------------------------- audit -- */

const RANGE = `segments.date DURING LAST_${DAYS}_DAYS`;

async function run() {
  const cfg = readConfig();
  if (cfg.missing.length) {
    console.error(`Faltam credenciais: ${cfg.missing.join(', ')}`);
    console.error('Rode:  cd mos-app && vercel env pull .env.local');
    process.exit(1);
  }
  const token = await accessToken();
  const report = { generatedAt: new Date().toISOString(), windowDays: DAYS };

  /* 1. Panorama da campanha ------------------------------------------------ */
  h('1 · PANORAMA — onde a verba está e quanto do leilão perdemos');
  const camps = await gaql(cfg, token, `
    SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
           campaign_budget.amount_micros, campaign.bidding_strategy_type,
           metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
           metrics.average_cpc, metrics.conversions, metrics.conversions_value,
           metrics.search_impression_share,
           metrics.search_budget_lost_impression_share,
           metrics.search_rank_lost_impression_share,
           metrics.search_absolute_top_impression_share,
           metrics.search_top_impression_share
    FROM campaign
    WHERE ${RANGE} AND campaign.status != 'REMOVED' AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC`);

  report.campaigns = camps;
  for (const r of camps) {
    const m = r.metrics, c = r.campaign;
    console.log(`\n▸ ${c.name}`);
    console.log(`  status ${c.status} · lance ${c.biddingStrategyType} · orçamento R$ ${money(r.campaignBudget?.amountMicros)}/dia`);
    console.log(`  custo R$ ${money(m.costMicros)} · ${int(m.impressions)} impr · ${int(m.clicks)} cliques · CTR ${pct(m.ctr)} · CPC médio R$ ${money(m.averageCpc)}`);
    console.log(`  conversões ${Number(m.conversions || 0).toFixed(1)} · valor R$ ${Number(m.conversionsValue || 0).toFixed(2)}`);
    console.log('');
    console.log(`  Impression share ...... ${bar(m.searchImpressionShare)} ${pct(m.searchImpressionShare)}`);
    console.log(`  PERDIDO por ORÇAMENTO . ${bar(m.searchBudgetLostImpressionShare)} ${pct(m.searchBudgetLostImpressionShare)}   ← dinheiro`);
    console.log(`  PERDIDO por RANK ...... ${bar(m.searchRankLostImpressionShare)} ${pct(m.searchRankLostImpressionShare)}   ← relevância/lance`);
    console.log(`  Topo absoluto ......... ${pct(m.searchAbsoluteTopImpressionShare)} · topo ${pct(m.searchTopImpressionShare)}`);
  }

  /* 2. Por hora ------------------------------------------------------------ */
  h('2 · POR HORA DO DIA — em que horas perdemos, e por quê');
  const hours = await gaql(cfg, token, `
    SELECT segments.hour, metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.search_impression_share,
           metrics.search_budget_lost_impression_share,
           metrics.search_rank_lost_impression_share
    FROM campaign
    WHERE ${RANGE} AND campaign.status != 'REMOVED'
    ORDER BY segments.hour`);

  const byHour = new Map();
  for (const r of hours) {
    const k = r.segments.hour;
    const a = byHour.get(k) || { impr: 0, clicks: 0, cost: 0, conv: 0, is: [], lb: [], lr: [] };
    a.impr += Number(r.metrics.impressions || 0);
    a.clicks += Number(r.metrics.clicks || 0);
    a.cost += Number(r.metrics.costMicros || 0);
    a.conv += Number(r.metrics.conversions || 0);
    if (r.metrics.searchImpressionShare != null) a.is.push(Number(r.metrics.searchImpressionShare));
    if (r.metrics.searchBudgetLostImpressionShare != null) a.lb.push(Number(r.metrics.searchBudgetLostImpressionShare));
    if (r.metrics.searchRankLostImpressionShare != null) a.lr.push(Number(r.metrics.searchRankLostImpressionShare));
    byHour.set(k, a);
  }
  const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
  console.log('hora   impr  cliques   custo   conv    IS     perda ORÇ   perda RANK');
  console.log('─'.repeat(74));
  report.byHour = [];
  for (const [hr, a] of [...byHour.entries()].sort((x, y) => x[0] - y[0])) {
    const row = { hour: hr, impressions: a.impr, clicks: a.clicks, costBrl: a.cost / 1e6,
      conversions: a.conv, is: avg(a.is), lostBudget: avg(a.lb), lostRank: avg(a.lr) };
    report.byHour.push(row);
    const flag = (avg(a.lb) || 0) > 0.25 ? ' ⚠ verba' : (avg(a.lr) || 0) > 0.5 ? ' ⚠ rank' : '';
    console.log(
      `${String(hr).padStart(2, '0')}h ${int(a.impr).padStart(7)} ${int(a.clicks).padStart(7)} ` +
      `${money(a.cost).padStart(8)} ${a.conv.toFixed(1).padStart(6)} ${pct(avg(a.is)).padStart(7)} ` +
      `${pct(avg(a.lb)).padStart(9)} ${pct(avg(a.lr)).padStart(10)}${flag}`
    );
  }

  /* 3. Por dia da semana --------------------------------------------------- */
  h('3 · POR DIA DA SEMANA');
  const dows = await gaql(cfg, token, `
    SELECT segments.day_of_week, metrics.impressions, metrics.clicks, metrics.cost_micros,
           metrics.conversions, metrics.search_impression_share,
           metrics.search_budget_lost_impression_share,
           metrics.search_rank_lost_impression_share
    FROM campaign
    WHERE ${RANGE} AND campaign.status != 'REMOVED'`);

  const byDow = new Map();
  for (const r of dows) {
    const k = r.segments.dayOfWeek;
    const a = byDow.get(k) || { impr: 0, clicks: 0, cost: 0, conv: 0, is: [], lb: [], lr: [] };
    a.impr += Number(r.metrics.impressions || 0);
    a.clicks += Number(r.metrics.clicks || 0);
    a.cost += Number(r.metrics.costMicros || 0);
    a.conv += Number(r.metrics.conversions || 0);
    if (r.metrics.searchImpressionShare != null) a.is.push(Number(r.metrics.searchImpressionShare));
    if (r.metrics.searchBudgetLostImpressionShare != null) a.lb.push(Number(r.metrics.searchBudgetLostImpressionShare));
    if (r.metrics.searchRankLostImpressionShare != null) a.lr.push(Number(r.metrics.searchRankLostImpressionShare));
    byDow.set(k, a);
  }
  console.log('dia    impr  cliques   custo   conv    IS     perda ORÇ   perda RANK');
  console.log('─'.repeat(74));
  report.byDayOfWeek = [];
  const order = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  for (const d of order) {
    const a = byDow.get(d); if (!a) continue;
    report.byDayOfWeek.push({ day: d, impressions: a.impr, clicks: a.clicks, costBrl: a.cost / 1e6,
      conversions: a.conv, is: avg(a.is), lostBudget: avg(a.lb), lostRank: avg(a.lr) });
    console.log(
      `${DOW[d].padEnd(4)} ${int(a.impr).padStart(7)} ${int(a.clicks).padStart(7)} ` +
      `${money(a.cost).padStart(8)} ${a.conv.toFixed(1).padStart(6)} ${pct(avg(a.is)).padStart(7)} ` +
      `${pct(avg(a.lb)).padStart(9)} ${pct(avg(a.lr)).padStart(10)}`
    );
  }

  /* 4. Grupos e keywords --------------------------------------------------- */
  h('4 · GRUPOS DE ANÚNCIO — quem merece a verba');
  const groups = await gaql(cfg, token, `
    SELECT ad_group.name, metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.ctr, metrics.conversions, metrics.cost_per_conversion,
           metrics.search_impression_share, metrics.search_rank_lost_impression_share
    FROM ad_group
    WHERE ${RANGE} AND ad_group.status != 'REMOVED' AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC`);
  report.adGroups = groups;
  console.log('grupo                       custo   impr  cliq   CTR   conv  custo/conv    IS');
  console.log('─'.repeat(74));
  for (const r of groups) {
    const m = r.metrics;
    console.log(
      `${r.adGroup.name.slice(0, 24).padEnd(25)} ${money(m.costMicros).padStart(8)} ${int(m.impressions).padStart(6)} ` +
      `${int(m.clicks).padStart(5)} ${pct(m.ctr).padStart(6)} ${Number(m.conversions || 0).toFixed(1).padStart(6)} ` +
      `${money(m.costPerConversion).padStart(10)} ${pct(m.searchImpressionShare).padStart(7)}`
    );
  }

  h('5 · KEYWORDS — quality score e perda por rank');
  const kws = await gaql(cfg, token, `
    SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
           ad_group_criterion.quality_info.quality_score,
           metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr,
           metrics.conversions, metrics.average_cpc,
           metrics.search_impression_share, metrics.search_rank_lost_impression_share
    FROM keyword_view
    WHERE ${RANGE} AND ad_group_criterion.status != 'REMOVED' AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC LIMIT 50`);
  report.keywords = kws;
  console.log('keyword                              QS   custo  cliq   conv   CPC   perdaRANK');
  console.log('─'.repeat(74));
  for (const r of kws) {
    const m = r.metrics, k = r.adGroupCriterion;
    const qs = k.qualityInfo?.qualityScore;
    const flag = qs && qs <= 4 ? ' ⚠' : '';
    console.log(
      `${(k.keyword.text || '').slice(0, 34).padEnd(35)} ${String(qs ?? '—').padStart(3)} ` +
      `${money(m.costMicros).padStart(7)} ${int(m.clicks).padStart(5)} ${Number(m.conversions || 0).toFixed(1).padStart(6)} ` +
      `${money(m.averageCpc).padStart(6)} ${pct(m.searchRankLostImpressionShare).padStart(8)}${flag}`
    );
  }

  /* 6. Termos de busca ----------------------------------------------------- */
  h('6 · TERMOS DE BUSCA — para onde a verba realmente foi');
  const terms = await gaql(cfg, token, `
    SELECT search_term_view.search_term, segments.search_term_match_type, ad_group.name,
           metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
    FROM search_term_view
    WHERE ${RANGE} AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC LIMIT 60`);
  report.searchTerms = terms;
  let wasted = 0;
  console.log('termo de busca                              custo  cliq  conv   grupo');
  console.log('─'.repeat(74));
  for (const r of terms) {
    const m = r.metrics;
    const conv = Number(m.conversions || 0);
    const cost = Number(m.costMicros || 0) / 1e6;
    if (conv === 0 && cost > 0) wasted += cost;
    const flag = conv === 0 && cost > 20 ? ' ⚠' : '';
    console.log(
      `${(r.searchTermView.searchTerm || '').slice(0, 40).padEnd(41)} ${cost.toFixed(2).padStart(7)} ` +
      `${int(m.clicks).padStart(5)} ${conv.toFixed(1).padStart(5)}   ${(r.adGroup?.name || '').slice(0, 18)}${flag}`
    );
  }
  report.wastedOnZeroConversionTerms = wasted;
  console.log(`\n  Total gasto em termos com ZERO conversão (top 60): R$ ${wasted.toFixed(2)}`);

  /* 7. Ações de conversão -------------------------------------------------- */
  h('7 · AÇÕES DE CONVERSÃO — o que o Smart Bidding está perseguindo');
  const convs = await gaql(cfg, token, `
    SELECT conversion_action.name, conversion_action.category, conversion_action.type,
           conversion_action.primary_for_goal, conversion_action.status,
           metrics.all_conversions, metrics.all_conversions_value
    FROM conversion_action
    WHERE ${RANGE} AND conversion_action.status = 'ENABLED'`);
  report.conversionActions = convs;
  console.log('ação                                    primária  conversões      valor');
  console.log('─'.repeat(74));
  for (const r of convs) {
    const c = r.conversionAction, m = r.metrics;
    const prim = c.primaryForGoal === false ? 'não' : 'SIM';
    console.log(
      `${(c.name || '').slice(0, 38).padEnd(39)} ${prim.padStart(7)} ` +
      `${Number(m.allConversions || 0).toFixed(1).padStart(10)} ${Number(m.allConversionsValue || 0).toFixed(2).padStart(10)}`
    );
  }

  /* 8. Recomendações do Google -------------------------------------------- */
  h('8 · RECOMENDAÇÕES DO GOOGLE — o que ele sugere (nada é aplicado)');
  try {
    const recs = await gaql(cfg, token, `
      SELECT recommendation.type, recommendation.campaign,
             recommendation.impact.base_metrics.impressions,
             recommendation.impact.base_metrics.clicks,
             recommendation.impact.base_metrics.cost_micros,
             recommendation.impact.base_metrics.conversions,
             recommendation.impact.potential_metrics.impressions,
             recommendation.impact.potential_metrics.clicks,
             recommendation.impact.potential_metrics.cost_micros,
             recommendation.impact.potential_metrics.conversions
      FROM recommendation`);
    report.recommendations = recs;
    if (!recs.length) console.log('  Nenhuma recomendação pendente.');
    for (const r of recs) {
      const rec = r.recommendation;
      const b = rec.impact?.baseMetrics || {}, p = rec.impact?.potentialMetrics || {};
      console.log(`\n▸ ${rec.type}`);
      if (p.conversions != null || p.clicks != null) {
        console.log(`   conversões ${Number(b.conversions || 0).toFixed(1)} → ${Number(p.conversions || 0).toFixed(1)}` +
                    ` · cliques ${int(b.clicks)} → ${int(p.clicks)}` +
                    ` · custo R$ ${money(b.costMicros)} → R$ ${money(p.costMicros)}`);
      }
    }
  } catch (err) {
    console.log(`  (recomendações indisponíveis: ${String(err.message).slice(0, 160)})`);
  }

  /* 9. Saldo / billing ----------------------------------------------------- */
  h('9 · CONTA');
  try {
    const acct = await gaql(cfg, token, `
      SELECT customer.id, customer.descriptive_name, customer.currency_code,
             customer.time_zone, customer.status
      FROM customer`);
    report.account = acct;
    for (const r of acct) {
      const c = r.customer;
      console.log(`  ${c.descriptiveName} (${c.id}) · ${c.currencyCode} · ${c.timeZone} · status ${c.status}`);
    }
  } catch (err) {
    console.log(`  (indisponível: ${String(err.message).slice(0, 120)})`);
  }

  if (AS_JSON) {
    const out = resolve(ROOT, `marketing/google-ads/2026-07-guest-laundry-search/forensic-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log(`\nJSON gravado em ${out}`);
  }
  console.log('\nAuditoria somente-leitura concluída. Nada foi alterado na conta.\n');
}

run().catch((err) => {
  console.error(`\nFalhou: ${err.message}\n`);
  process.exit(1);
});
