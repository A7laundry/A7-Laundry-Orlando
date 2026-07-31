import test from 'node:test';
import assert from 'node:assert/strict';
import { collectMetaKpis, readMetaKpiConfig } from '../meta-kpis-contract.js';

const config = {
  apiVersion: 'v-test',
  adAccountId: '650201661142284',
  accessToken: 'secret-token-never-returned'
};
const period = {
  startDate: '2026-06-24',
  endDate: '2026-07-23',
  timeZone: 'America/New_York'
};

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return data;
    }
  };
}

test('Meta configuration fails closed without exposing a token', () => {
  assert.deepEqual(readMetaKpiConfig({}), {
    ok: false,
    missing: ['META_GRAPH_API_VERSION', 'META_AD_ACCOUNT_ID', 'META_ACCESS_TOKEN']
  });
  const parsed = readMetaKpiConfig({
    META_GRAPH_API_VERSION: 'v-test',
    META_AD_ACCOUNT_ID: 'act_650201661142284',
    META_ACCESS_TOKEN: 'secret-token-never-returned'
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.adAccountId, '650201661142284');
});

test('Meta read-only contract connects campaign, ad set, ad, creative destination and insights', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options });
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/campaigns')) {
      return response({ data: [{ id: 'cmp1', name: 'Guest Laundry', status: 'ACTIVE', effective_status: 'ACTIVE' }] });
    }
    if (pathname.endsWith('/adsets')) {
      return response({ data: [{
        id: 'set1',
        campaign_id: 'cmp1',
        name: 'Hotels',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        promoted_object: { whatsapp_phone_number: '+1 407-670-8839' }
      }] });
    }
    if (pathname.endsWith('/ads')) {
      return response({ data: [{
        id: 'ad1',
        adset_id: 'set1',
        campaign_id: 'cmp1',
        name: 'Hotel pickup',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        creative: {
          id: 'cr1',
          thumbnail_url: 'https://example.test/thumb.jpg',
          object_story_spec: {
            link_data: { link: 'https://a7laundry.com/laundry-pickup-delivery-orlando?utm_source=meta' }
          }
        }
      }] });
    }
    return response({ data: [{
      account_id: '650201661142284',
      campaign_id: 'cmp1',
      campaign_name: 'Guest Laundry',
      adset_id: 'set1',
      adset_name: 'Hotels',
      ad_id: 'ad1',
      ad_name: 'Hotel pickup',
      date_start: '2026-07-23',
      date_stop: '2026-07-23',
      spend: '30.50',
      impressions: '1000',
      reach: '800',
      frequency: '1.25',
      clicks: '50',
      inline_link_clicks: '30',
      ctr: '5',
      cpc: '0.61',
      actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '4' }]
    }] });
  };
  const result = await collectMetaKpis(fetchImpl, config, period, new Date('2026-07-26T14:00:00.000Z'));
  assert.equal(result.status, 'live');
  assert.equal(result.insights[0].dateStart, '2026-07-23');
  assert.equal(result.insights[0].dateStop, '2026-07-23');
  assert.equal(result.insights[0].spend, 30.5);
  assert.equal(result.insights[0].messagingConversations, 4);
  assert.ok(result.graph.edges.some((edge) => edge.type === 'campaign_to_ad_set'));
  assert.ok(result.graph.edges.some((edge) => edge.type === 'ad_set_to_ad'));
  assert.ok(result.graph.edges.some((edge) => edge.type === 'ad_to_page'));
  assert.ok(result.graph.nodes.some((node) => node.id === 'page:/laundry-pickup-delivery-orlando'));
  assert.equal(result.guardrails.whatsappDestination.status, 'verified');
  assert.equal(result.guardrails.whatsappDestination.officialNumber, '+14076708839');
  assert.ok(requests.every((request) => request.options.headers.Authorization === 'Bearer secret-token-never-returned'));
  assert.ok(requests.every((request) => !request.url.includes('secret-token-never-returned')));
  assert.equal(JSON.stringify(result).includes('secret-token-never-returned'), false);
});

test('Meta guardrail fails closed when an active ad set uses the test WhatsApp number', async () => {
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/campaigns')) {
      return response({ data: [{ id: 'cmp1', name: 'Guest Laundry', status: 'ACTIVE', effective_status: 'ACTIVE' }] });
    }
    if (pathname.endsWith('/adsets')) {
      return response({ data: [{
        id: 'set-test',
        campaign_id: 'cmp1',
        name: 'Wrong destination',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        promoted_object: { whatsapp_phone_number: '+1 555-628-7241' }
      }] });
    }
    if (pathname.endsWith('/ads')) return response({ data: [] });
    return response({ data: [] });
  };
  const result = await collectMetaKpis(fetchImpl, config, period, new Date('2026-07-27T23:30:00.000Z'));
  assert.equal(result.guardrails.whatsappDestination.status, 'critical');
  assert.equal(result.guardrails.whatsappDestination.blocked.length, 1);
  assert.equal(result.guardrails.whatsappDestination.blocked[0].adSetId, 'set-test');
});

test('Meta guardrail never treats a missing destination field as verified', async () => {
  const fetchImpl = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/campaigns')) {
      return response({ data: [{ id: 'cmp1', name: 'Guest Laundry', status: 'ACTIVE', effective_status: 'ACTIVE' }] });
    }
    if (pathname.endsWith('/adsets')) {
      return response({ data: [{
        id: 'set-unverified',
        campaign_id: 'cmp1',
        name: 'Destination unavailable',
        status: 'ACTIVE',
        effective_status: 'ACTIVE'
      }] });
    }
    if (pathname.endsWith('/ads')) return response({ data: [] });
    return response({ data: [] });
  };
  const result = await collectMetaKpis(fetchImpl, config, period, new Date('2026-07-27T23:30:00.000Z'));
  assert.equal(result.guardrails.whatsappDestination.status, 'unavailable');
  assert.equal(result.guardrails.whatsappDestination.unverified.length, 1);
  assert.equal(result.guardrails.whatsappDestination.verifiedOfficial, 0);
});

test('Meta permission failure remains unavailable and never becomes zero', async () => {
  const fetchImpl = async () => response({ error: { message: 'permission denied' } }, 403);
  const result = await collectMetaKpis(fetchImpl, config, period, new Date('2026-07-26T14:00:00.000Z'));
  assert.equal(result.status, 'unavailable');
  assert.equal('insights' in result, false);
  assert.equal(JSON.stringify(result).includes('permission denied'), false);
  assert.deepEqual(result.errors.map((error) => error.code), [
    'ACCESS_DENIED',
    'ACCESS_DENIED',
    'ACCESS_DENIED',
    'ACCESS_DENIED'
  ]);
});
