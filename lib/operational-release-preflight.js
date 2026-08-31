'use strict';

const { resolveSupabaseConfig } = require('./operational-store.js');

const PROFILES = new Set(['preview-validation', 'preview-debugview', 'preview-steady', 'production']);
const ORLANDO_MEASUREMENT_ID = 'G-JLQNRC7MK4';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function enabled(value) {
  return text(value).toLowerCase() === 'true';
}

function check(name, ok, reason) {
  return { name, status: ok ? 'pass' : 'fail', ...(ok ? {} : { reason }) };
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
  const strictValidation = profile === 'preview-validation';
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

  return {
    schema_version: '1.0',
    profile,
    ready: checks.every((item) => item.status === 'pass'),
    storage_source: storage?.source || null,
    checks
  };
}

module.exports = { PROFILES, ORLANDO_MEASUREMENT_ID, evaluateOperationalRelease };
