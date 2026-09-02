'use strict';

const { resolveSupabaseConfig } = require('./operational-store.js');

const PROFILES = new Set(['preview-validation', 'preview-debugview', 'preview-steady', 'staging-e2e', 'production']);
const ORLANDO_MEASUREMENT_ID = 'G-JLQNRC7MK4';
const ORLANDO_PRODUCTION_PROJECT_REF = 'wiwawtpaxnrueugppasi';
const FORBIDDEN_FOREIGN_PROJECT_REF = 'zquefoznqwkfbnnfalmt';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function enabled(value) {
  return text(value).toLowerCase() === 'true';
}

function check(name, ok, reason) {
  return { name, status: ok ? 'pass' : 'fail', ...(ok ? {} : { reason }) };
}

function supabaseProjectRef(value) {
  try {
    const hostname = new URL(text(value)).hostname.toLowerCase();
    const match = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return match?.[1] || null;
  } catch (_) { return null; }
}

function isIsolatedPreviewHost(value) {
  const raw = text(value);
  if (!raw) return false;
  try {
    const hostname = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase();
    return hostname.endsWith('.vercel.app')
      && hostname !== 'a7laundry.com' && hostname !== 'www.a7laundry.com';
  } catch (_) { return false; }
}

function stagingWebhookUrl(env = {}) {
  const raw = text(env.VERCEL_URL);
  if (!isIsolatedPreviewHost(raw)) return null;
  try {
    const origin = new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
    return `${origin}/api/stripe-webhook`;
  } catch (_) { return null; }
}

function evaluateOperationalRelease(env = {}, profile = '') {
  if (!PROFILES.has(profile)) {
    return {
      schema_version: '1.0', profile: profile || null, ready: false,
      checks: [check('profile', false, 'unsupported_profile')]
    };
  }

  const storage = resolveSupabaseConfig(env);
  const production = profile === 'production';
  const stagingE2e = profile === 'staging-e2e';
  const strictValidation = profile === 'preview-validation' || stagingE2e;
  const debugView = profile === 'preview-debugview';
  const stripeKey = text(env.STRIPE_SECRET_KEY);
  const checks = [
    check('operational_store_pair', Boolean(storage), 'missing_complete_supabase_pair'),
    check('operations_api_token', Boolean(text(env.OPERATIONS_API_TOKEN)), 'missing'),
    check('payment_link_token', Boolean(text(env.PAYMENT_LINK_TOKEN)), 'missing'),
    check('stripe_secret_key', production
      ? stripeKey.startsWith('sk_live_') || stripeKey.startsWith('rk_live_')
      : stripeKey.startsWith('sk_test_') || stripeKey.startsWith('rk_test_'),
      production ? 'live_mode_required' : 'test_mode_required'),
    check('stripe_webhook_secret', text(env.STRIPE_WEBHOOK_SECRET).startsWith('whsec_'), 'missing_or_invalid_prefix'),
    check('ga4_measurement_id', text(env.GA4_MEASUREMENT_ID) === ORLANDO_MEASUREMENT_ID, 'orlando_stream_required'),
    check('ga4_measurement_protocol_secret', Boolean(text(env.GA4_MEASUREMENT_PROTOCOL_SECRET)), 'missing'),
    check('ga4_protocol_validation_mode', enabled(env.GA4_MEASUREMENT_PROTOCOL_DEBUG) === strictValidation,
      strictValidation ? 'must_be_enabled' : 'must_be_disabled'),
    check('ga4_debugview_mode', enabled(env.GA4_DEBUG_MODE) === debugView,
      debugView ? 'must_be_enabled' : 'must_be_disabled'),
    check('memory_storage_forbidden', !production || (
      text(env.NODE_ENV) === 'production'
      && text(env.A7_OPERATIONS_STORAGE_MODE) !== 'memory'
      && text(env.A7_ATTRIBUTION_STORAGE_MODE) !== 'memory'
    ), 'durable_storage_required_in_production')
  ];

  if (stagingE2e) {
    const stagingRef = text(env.A7_STAGING_SUPABASE_PROJECT_REF).toLowerCase();
    const urls = [env.A7_OPERATIONS_SUPABASE_URL, env.A7_ATTRIBUTION_SUPABASE_URL,
      env.WHATSAPP_SUPABASE_URL].map(text).filter(Boolean);
    const allowedRef = /^[a-z0-9]{20}$/.test(stagingRef)
      && ![ORLANDO_PRODUCTION_PROJECT_REF, FORBIDDEN_FOREIGN_PROJECT_REF].includes(stagingRef);
    const isolatedUrls = urls.length >= 2
      && urls.every((url) => supabaseProjectRef(url) === stagingRef);
    checks.push(
      check('vercel_preview_only', text(env.VERCEL_ENV) === 'preview', 'preview_environment_required'),
      check('isolated_preview_host', isIsolatedPreviewHost(env.VERCEL_URL),
        'non_production_vercel_preview_required'),
      check('dedicated_staging_project_ref', allowedRef, 'dedicated_orlando_staging_ref_required'),
      check('all_supabase_namespaces_isolated', allowedRef && isolatedUrls,
        'operations_and_attribution_must_share_dedicated_staging'),
      check('staging_secret_key', text(env.A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY).startsWith('sb_secret_')
        && text(env.A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY).startsWith('sb_secret_'),
      'server_only_sb_secret_required'),
      check('team_auth_boundary', text(env.A7_SYSTEM_ACCESS_MODE) === 'team'
        && text(env.A7_SYSTEM_SESSION_SECRET).length >= 32, 'staging_team_auth_required'),
      check('ga4_validation_only', text(env.A7_STAGING_GA4_MODE) === 'validation_only'
        && enabled(env.GA4_MEASUREMENT_PROTOCOL_DEBUG) && !enabled(env.GA4_DEBUG_MODE),
      'debug_validation_without_collection_required'),
      check('stripe_webhook_endpoint_id', /^we_[A-Za-z0-9]+$/.test(text(env.STRIPE_WEBHOOK_ENDPOINT_ID)),
        'test_webhook_endpoint_id_required'),
      check('stripe_webhook_test_binding', false, 'runtime_verification_required')
    );
  }

  return {
    schema_version: '1.0',
    profile,
    ready: checks.every((item) => item.status === 'pass'),
    storage_source: storage?.source || null,
    checks
  };
}

async function verifyStagingRuntimeBindings(result, env = {}, fetchImpl = globalThis.fetch) {
  if (result?.profile !== 'staging-e2e') return result;
  const checkRow = result.checks.find((item) => item.name === 'stripe_webhook_test_binding');
  const endpointId = text(env.STRIPE_WEBHOOK_ENDPOINT_ID);
  const stripeKey = text(env.STRIPE_SECRET_KEY);
  const expectedUrl = stagingWebhookUrl(env);
  let verified = false;
  if (checkRow && endpointId && expectedUrl
    && (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('rk_test_'))
    && typeof fetchImpl === 'function') {
    try {
      const response = await fetchImpl(`https://api.stripe.com/v1/webhook_endpoints/${encodeURIComponent(endpointId)}`, {
        method:'GET', headers:{ Authorization:`Bearer ${stripeKey}` }
      });
      const endpoint = response.ok ? await response.json() : null;
      verified = endpoint?.id === endpointId && endpoint?.livemode === false
        && endpoint?.status === 'enabled' && endpoint?.url === expectedUrl;
    } catch (_) { verified = false; }
  }
  if (checkRow) {
    checkRow.status = verified ? 'pass' : 'fail';
    if (verified) delete checkRow.reason;
    else checkRow.reason = 'stripe_test_endpoint_binding_unverified';
  }
  result.ready = result.checks.every((item) => item.status === 'pass');
  return result;
}

module.exports = {
  PROFILES,
  ORLANDO_MEASUREMENT_ID,
  ORLANDO_PRODUCTION_PROJECT_REF,
  FORBIDDEN_FOREIGN_PROJECT_REF,
  supabaseProjectRef,
  stagingWebhookUrl,
  evaluateOperationalRelease,
  verifyStagingRuntimeBindings
};
