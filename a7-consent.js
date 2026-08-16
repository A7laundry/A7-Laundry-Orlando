/* A7 Measurement V2 — consent-state adapter foundation (no CMP UI). */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.A7_CONSENT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var VALID_STATES = ['unknown', 'granted', 'denied'];
  var customAdapter = null;

  function normalize(value) {
    value = typeof value === 'string' ? value.toLowerCase() : '';
    return VALID_STATES.indexOf(value) > -1 ? value : 'unknown';
  }

  function legacyState() {
    var current = root && root.A7_CONSENT_STATE || {};
    return {
      attribution_storage: normalize(current.attribution_storage),
      analytics_storage: normalize(current.analytics_storage),
      ad_storage: normalize(current.ad_storage)
    };
  }

  function getConsentState() {
    try {
      var state = customAdapter && typeof customAdapter.getConsentState === 'function'
        ? customAdapter.getConsentState()
        : legacyState();
      return {
        attribution_storage: normalize(state && state.attribution_storage),
        analytics_storage: normalize(state && state.analytics_storage),
        ad_storage: normalize(state && state.ad_storage)
      };
    } catch (_) {
      return { attribution_storage: 'unknown', analytics_storage: 'unknown', ad_storage: 'unknown' };
    }
  }

  function setAdapter(adapter) {
    if (!adapter || typeof adapter.getConsentState !== 'function') throw new Error('Invalid consent adapter.');
    customAdapter = adapter;
  }

  return {
    VALID_STATES: VALID_STATES.slice(),
    normalize: normalize,
    getConsentState: getConsentState,
    setAdapter: setAdapter
  };
}));
