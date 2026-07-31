import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectGoogleAdsKpis,
  readGoogleAdsKpiConfig,
  requestedPaidMediaPeriod
} from '../google-ads-kpis-contract.js';

const config = {
  apiVersion: 'v24',
  customerId: '2901132891',
  loginCustomerId: '1234567890',
  developerToken: 'developer-token-must-never-leak',
  accountTimeZone: 'America/Sao_Paulo'
};

test('native Google Ads configuration fails closed and normalizes account IDs', () => {
  assert.deepEqual(readGoogleAdsKpiConfig({}), {
    ok: false,
    missing: ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN']
  });
  assert.deepEqual(readGoogleAdsKpiConfig({
    GOOGLE_ADS_CUSTOMER_ID: '290-113-2891',
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: '123-456-7890',
    GOOGLE_ADS_DEVELOPER_TOKEN: 'token'
  }), {
    ok: true,
    apiVersion: 'v24',
    customerId: '2901132891',
    loginCustomerId: '1234567890',
    developerToken: 'token',
    accountTimeZone: 'America/Sao_Paulo'
  });
});

test('paid-media period includes the account current day and independent comparison windows', () => {
  assert.deepEqual(
    requestedPaidMediaPeriod(new Date('2026-07-29T01:30:00.000Z'), 'America/Sao_Paulo'),
    {
      startDate: '2026-06-29',
      endDate: '2026-07-28',
      todayDate: '2026-07-28',
      yesterdayDate: '2026-07-27',
      last7StartDate: '2026-07-22',
      timeZone: 'America/Sao_Paulo',
      state: 'intraday',
      rationale: 'Últimos 30 dias incluindo o dia corrente da conta de anúncios; valores intradiários podem mudar.'
    }
  );
});

test('native Google Ads contract reports current delivery, creatives, terms and conversions without exposing credentials', async () => {
  const requests = [];
  const authClient = {
    async request(request) {
      requests.push(request);
      const query = request.data.query;
      if (query.includes('FROM customer')) {
        return { data: { results: [{ customer: {
          id: '2901132891',
          descriptiveName: 'A7 Laundry',
          currencyCode: 'BRL',
          timeZone: 'America/Sao_Paulo',
          status: 'ENABLED',
          manager: false,
          testAccount: false
        } }] } };
      }
      if (query.includes('FROM campaign') && query.includes('campaign_budget.amount_micros')) {
        return { data: { results: [
          {
            campaign: {
              id: '101',
              name: 'Guest Laundry Search',
              status: 'ENABLED',
              primaryStatus: 'ELIGIBLE',
              advertisingChannelType: 'SEARCH',
              biddingStrategyType: 'MAXIMIZE_CONVERSIONS'
            },
            campaignBudget: { id: '201', name: 'Guest budget', amountMicros: '70000000' }
          },
          {
            campaign: {
              id: '102',
              name: 'Historical campaign',
              status: 'PAUSED',
              primaryStatus: 'PAUSED',
              advertisingChannelType: 'SEARCH'
            },
            campaignBudget: { id: '202', amountMicros: '10000000' }
          }
        ] } };
      }
      if (query.includes('FROM campaign') && query.includes('segments.date') && !query.includes('segments.conversion_action')) {
        return { data: { results: [
          { segments: { date: '2026-07-28' }, campaign: { id: '101' }, metrics: {
            impressions: '100', clicks: '10', costMicros: '25000000',
            conversions: '2', allConversions: '3', conversionsValue: '120'
          } },
          { segments: { date: '2026-07-27' }, campaign: { id: '101' }, metrics: {
            impressions: '80', clicks: '8', costMicros: '20000000',
            conversions: '1', allConversions: '1', conversionsValue: '60'
          } }
        ] } };
      }
      if (query.includes('FROM ad_group_ad') && query.includes('responsive_search_ad.headlines')) {
        return { data: { results: [{
          campaign: { id: '101', name: 'Guest Laundry Search' },
          adGroup: { id: '301', name: 'Hotel Guests', status: 'ENABLED' },
          adGroupAd: {
            status: 'ENABLED',
            primaryStatus: 'ELIGIBLE',
            ad: {
              id: '401',
              type: 'RESPONSIVE_SEARCH_AD',
              finalUrls: ['https://a7laundry.com/laundry-pickup-delivery-orlando'],
              responsiveSearchAd: {
                headlines: [{ text: 'Laundry Pickup Orlando' }, { text: 'Text Us Today' }],
                descriptions: [{ text: 'Pickup and delivery for hotel guests.' }]
              }
            }
          }
        }] } };
      }
      if (query.includes('FROM ad_group_ad') && query.includes('segments.date')) {
        return { data: { results: [{
          segments: { date: '2026-07-28' },
          adGroupAd: { ad: { id: '401' } },
          metrics: {
            impressions: '100', clicks: '10', costMicros: '25000000',
            conversions: '2', allConversions: '3', conversionsValue: '120'
          }
        }] } };
      }
      if (query.includes('FROM search_term_view')) {
        return { data: { results: [{
          campaign: { id: '101', name: 'Guest Laundry Search' },
          adGroup: { id: '301', name: 'Hotel Guests' },
          searchTermView: { searchTerm: 'hotel laundry service near me', status: 'ADDED' },
          metrics: {
            impressions: '20', clicks: '4', costMicros: '8000000',
            conversions: '1', allConversions: '1', conversionsValue: '60'
          }
        }] } };
      }
      if (query.includes('segments.conversion_action')) {
        return { data: { results: [{
          campaign: { id: '101', name: 'Guest Laundry Search' },
          segments: {
            conversionAction: 'customers/2901132891/conversionActions/501',
            conversionActionName: 'A7 - WhatsApp click (site)',
            conversionActionCategory: 'CONTACT'
          },
          metrics: {
            conversions: '2',
            allConversions: '3',
            conversionsValue: '120',
            allConversionsValue: '120'
          }
        }] } };
      }
      throw new Error('unexpected query');
    }
  };
  const result = await collectGoogleAdsKpis(authClient, config, {
    now: new Date('2026-07-29T01:30:00.000Z')
  });

  assert.equal(result.status, 'live');
  assert.equal(result.source, 'Google Ads API');
  assert.equal(result.account.currency, 'BRL');
  assert.equal(result.summary.activeCampaignCount, 1);
  assert.equal(result.summary.deliveringCampaignCount, 1);
  assert.equal(result.summary.deliveringAdCount, 1);
  assert.equal(result.summary.last30.cost, 45);
  assert.equal(result.summary.last30.conversions, 3);
  assert.equal(result.campaigns[0].performance.today.cost, 25);
  assert.equal(result.campaigns[0].deliveryStatus, 'delivering_today');
  assert.equal(result.campaigns[1].deliveryStatus, 'paused');
  assert.deepEqual(result.ads[0].creative.headlines, ['Laundry Pickup Orlando', 'Text Us Today']);
  assert.equal(result.searchTerms[0].term, 'hotel laundry service near me');
  assert.equal(result.conversions[0].actionName, 'A7 - WhatsApp click (site)');
  assert.ok(requests.every((request) => request.url.endsWith('/googleAds:searchStream')));
  assert.ok(requests.every((request) => request.headers['Content-Type'] === 'application/json'));
  assert.ok(requests.every((request) => request.headers['developer-token'] === config.developerToken));
  assert.ok(requests.every((request) => request.headers['login-customer-id'] === config.loginCustomerId));
  assert.equal(JSON.stringify(result).includes(config.developerToken), false);
});

test('native Google Ads failures remain unavailable and never become a zero-performance account', async () => {
  const authClient = {
    async request() {
      throw Object.assign(new Error('permission denied with secret detail'), {
        response: {
          status: 403,
          data: {
            error: {
              status: 'PERMISSION_DENIED',
              details: [{
                errors: [{
                  errorCode: {
                    authorizationError: 'USER_PERMISSION_DENIED'
                  },
                  message: 'permission denied with secret detail'
                }]
              }]
            }
          }
        }
      });
    }
  };
  const result = await collectGoogleAdsKpis(authClient, config, {
    now: new Date('2026-07-29T01:30:00.000Z'),
    retryAttempts: 1
  });
  assert.equal(result.status, 'unavailable');
  assert.equal('summary' in result, false);
  assert.equal(JSON.stringify(result).includes('permission denied'), false);
  assert.ok(result.errors.every((error) => error.code === 'ACCESS_DENIED'));
  assert.ok(result.errors.every((error) => error.message.includes('HTTP 403 · PERMISSION_DENIED · authorizationError:USER_PERMISSION_DENIED')));
  assert.ok(result.errors.every((error) => error.diagnostic.googleAdsCode === 'authorizationError:USER_PERMISSION_DENIED'));
});

test('native Google Ads retries transient internal errors before accepting a report', async () => {
  let requests = 0;
  const authClient = {
    async request() {
      requests += 1;
      if (requests === 1) {
        throw Object.assign(new Error('temporary internal error'), {
          response: {
            status: 500,
            data: {
              error: {
                status: 'INTERNAL'
              }
            }
          }
        });
      }
      return { data: { results: [] } };
    }
  };
  const result = await collectGoogleAdsKpis(authClient, config, {
    now: new Date('2026-07-29T01:30:00.000Z'),
    retryAttempts: 2,
    retryDelayMs: 0
  });
  assert.equal(result.status, 'live');
  assert.equal(requests, 8);
});
