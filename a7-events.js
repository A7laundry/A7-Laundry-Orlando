/* A7 Measurement V2 — compatible browser event contract. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.A7_EVENTS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var contracts = Object.freeze({
    whatsapp_click: { wireName: 'whatsapp_click', channel: 'whatsapp' },
    phone_click: { wireName: 'call_click', channel: 'call' },
    service_page_view: { wireName: 'service_page_view', channel: 'website' }
  });
  var forbiddenKeys = new Set(['gclid', 'gbraid', 'wbraid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']);

  function safePayload(payload) {
    var out = {};
    payload = payload || {};
    Object.keys(payload).forEach(function (key) {
      if (!forbiddenKeys.has(key) && payload[key] !== undefined && payload[key] !== null && payload[key] !== '') out[key] = payload[key];
    });
    return out;
  }

  function track(name, payload, gtagFn) {
    var contract = contracts[name];
    if (!contract) throw new Error('Unsupported event contract: ' + name);
    var clean = safePayload(Object.assign({ channel: contract.channel }, payload));
    try { if (typeof gtagFn === 'function') gtagFn('event', contract.wireName, clean); } catch (_) {}
    return { name: name, wireName: contract.wireName, payload: clean };
  }

  return { contracts: contracts, safePayload: safePayload, track: track };
}));
