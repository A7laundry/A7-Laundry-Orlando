/* A7 Measurement V2 — browser-safe attribution contract and shadow client. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.A7_ATTRIBUTION = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = 2;
  var STORAGE_KEY = 'a7_attribution_v2';
  var LEGACY_STORAGE_KEY = 'a7_campaign_attribution';
  var CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'];
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var SAFE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  var INTERNAL_HOSTS = ['a7laundry.com'];

  function text(value, max) {
    if (typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function hostname(value) {
    if (!value) return '';
    try { return new URL(value).hostname.toLowerCase().replace(/^www\./, '').slice(0, 120); } catch (_) { return ''; }
  }

  function isInternalHost(host) {
    return INTERNAL_HOSTS.some(function (internal) { return host === internal || host.endsWith('.' + internal); });
  }

  function randomBytes(size, cryptoProvider) {
    var bytes = new Uint8Array(size);
    var provider = cryptoProvider || (typeof crypto !== 'undefined' ? crypto : null);
    if (!provider || typeof provider.getRandomValues !== 'function') {
      throw new Error('Cryptographic randomness is unavailable.');
    }
    provider.getRandomValues(bytes);
    return bytes;
  }

  function hex(bytes) {
    return Array.prototype.map.call(bytes, function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
  }

  function generateAttributionId(cryptoProvider) {
    return 'at_' + hex(randomBytes(16, cryptoProvider));
  }

  function generateShortRef(cryptoProvider) {
    var bytes = randomBytes(10, cryptoProvider);
    var out = '';
    for (var i = 0; i < 10; i++) out += SAFE_ALPHABET[bytes[i] & 31];
    return out;
  }

  function validAttributionId(value) { return /^at_[a-f0-9]{32}$/.test(value || ''); }
  function validShortRef(value) { return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/i.test(value || ''); }

  function classifySource(values, referrerHost, initial) {
    if (values.gclid || values.gbraid || values.wbraid) return { entry_type: 'campaign', source: values.utm_source || 'google-ads', medium: values.utm_medium || 'paid' };
    if (values.fbclid) return { entry_type: 'campaign', source: values.utm_source || 'meta', medium: values.utm_medium || 'paid-social' };
    if (values.utm_source || values.utm_medium || values.utm_campaign) return { entry_type: 'campaign', source: values.utm_source || 'campaign', medium: values.utm_medium || 'unknown' };
    if (referrerHost && !isInternalHost(referrerHost)) {
      if (referrerHost === 'google.com' || referrerHost.endsWith('.google.com')) return { entry_type: 'referral', source: 'google-organic', medium: 'organic' };
      if (referrerHost === 'bing.com' || referrerHost.endsWith('.bing.com')) return { entry_type: 'referral', source: 'bing-organic', medium: 'organic' };
      if (referrerHost === 'yahoo.com' || referrerHost.endsWith('.yahoo.com')) return { entry_type: 'referral', source: 'yahoo-organic', medium: 'organic' };
      var aiSources = {
        'chatgpt.com': 'ai-chatgpt', 'openai.com': 'ai-openai', 'perplexity.ai': 'ai-perplexity',
        'claude.ai': 'ai-claude', 'gemini.google.com': 'ai-gemini', 'copilot.microsoft.com': 'ai-copilot'
      };
      return { entry_type: 'referral', source: aiSources[referrerHost] || referrerHost, medium: aiSources[referrerHost] ? 'ai-assistant' : 'referral' };
    }
    return { entry_type: initial ? 'direct' : 'internal', source: initial ? 'direct' : 'internal', medium: 'none' };
  }

  function captureTouch(input) {
    input = input || {};
    var url;
    try { url = new URL(input.url || 'https://a7laundry.com/'); } catch (_) { url = new URL('https://a7laundry.com/'); }
    var values = {};
    UTM_KEYS.concat(CLICK_KEYS).concat(['fbclid']).forEach(function (key) {
      var value = url.searchParams.get(key);
      if (value) values[key] = text(value, 250);
    });
    var referrerHost = hostname(input.referrer);
    var source = classifySource(values, referrerHost, Boolean(input.initial));
    return {
      entry_type: source.entry_type,
      source: text(source.source, 120),
      medium: text(source.medium, 80),
      campaign: text(values.utm_campaign, 250),
      term: text(values.utm_term, 250),
      content: text(values.utm_content, 250),
      click_ids: {
        gclid: text(values.gclid, 250),
        gbraid: text(values.gbraid, 250),
        wbraid: text(values.wbraid, 250)
      },
      fbclid: text(values.fbclid, 250),
      referrer_host: referrerHost && !isInternalHost(referrerHost) ? referrerHost : '',
      landing_page: text(url.pathname || '/', 500) || '/',
      timestamp: input.timestamp || new Date().toISOString()
    };
  }

  function isExternalTouch(touch) {
    return Boolean(touch && (touch.entry_type === 'campaign' || touch.entry_type === 'referral'));
  }

  function touchFingerprint(touch) {
    if (!touch) return '';
    return [touch.entry_type, touch.source, touch.medium, touch.campaign, touch.term, touch.content, touch.referrer_host, touch.landing_page].join('|');
  }

  function mergeRecord(existing, touch, ids) {
    var current = existing && typeof existing === 'object' ? existing : null;
    var record = current ? Object.assign({}, current) : {
      version: VERSION,
      attribution_id: ids && ids.attribution_id,
      short_ref: ids && ids.short_ref,
      created_at: new Date().toISOString(),
      first_touch: touch,
      last_touch: touch
    };
    if (!record.first_touch) record.first_touch = touch;
    if (!record.last_touch) record.last_touch = record.first_touch;
    if (isExternalTouch(touch) && touchFingerprint(touch) !== touchFingerprint(record.last_touch)) {
      record.last_touch = touch;
    }
    record.updated_at = new Date().toISOString();
    return record;
  }

  function maskId(value) {
    return validAttributionId(value) ? value.slice(0, 7) + '…' + value.slice(-4) : 'unavailable';
  }

  function clickIdPresence(touch) {
    var ids = touch && touch.click_ids || {};
    return { gclid: Boolean(ids.gclid), gbraid: Boolean(ids.gbraid), wbraid: Boolean(ids.wbraid) };
  }

  function safeRead(storage) {
    try {
      var raw = storage && storage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && validAttributionId(parsed.attribution_id) && validShortRef(parsed.short_ref) ? parsed : null;
    } catch (_) { return null; }
  }

  function safeWrite(storage, record) {
    try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch (_) {}
  }

  function readLegacy(storage) {
    try {
      var raw = storage && storage.getItem(LEGACY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function createBrowserClient(options) {
    options = options || {};
    var win = options.window || (typeof window !== 'undefined' ? window : null);
    var session = options.sessionStorage || (win && win.sessionStorage);
    var state = safeRead(session);
    var listeners = [];

    function notify(kind) {
      listeners.forEach(function (listener) { try { listener(state, kind); } catch (_) {} });
    }

    function consentState() {
      var consent = win && win.A7_CONSENT_STATE;
      return {
        durable_storage: Boolean(consent && consent.attribution_storage === 'granted') ? 'granted' : 'unknown'
      };
    }

    async function initialize(input) {
      var touch = captureTouch(Object.assign({}, input, { initial: !state }));
      var legacy = !state ? readLegacy(session) : null;
      var legacyFirstTouch = null;
      if (legacy) {
        var legacySource = text(legacy.utm_source || legacy.origin_source, 120);
        legacyFirstTouch = Object.assign({}, touch, {
          entry_type: legacySource && legacySource !== 'direct' ? 'campaign' : 'direct',
          source: legacySource || 'direct',
          medium: text(legacy.utm_medium, 80) || (legacySource && legacySource !== 'direct' ? 'unknown' : 'none'),
          campaign: text(legacy.utm_campaign, 250),
          term: text(legacy.utm_term, 250),
          content: text(legacy.utm_content, 250),
          landing_page: text(legacy.landing_page, 500) || touch.landing_page,
          timestamp: legacy.attribution_captured_at || touch.timestamp
        });
      }
      var payload = {
        version: VERSION,
        attribution_id: state && state.attribution_id,
        short_ref: state && state.short_ref,
        cached_first_touch: state && state.first_touch || legacyFirstTouch,
        touch: touch,
        legacy_source: legacy ? { source: text(legacy.utm_source || legacy.origin_source, 120), medium: text(legacy.utm_medium, 80) } : null,
        consent: consentState()
      };
      notify(state ? 'attribution_restored' : 'attribution_requested');
      try {
        var response = await (options.fetch || (win && win.fetch))('/api/attribution/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response || !response.ok) throw new Error('Attribution API unavailable.');
        var result = await response.json();
        if (!validAttributionId(result.attribution_id) || !validShortRef(result.short_ref)) throw new Error('Invalid attribution response.');
        state = result;
        safeWrite(session, state);
        notify(result.restored ? 'attribution_restored' : 'attribution_created');
        return state;
      } catch (_) {
        notify('attribution_api_failed');
        return state;
      }
    }

    return {
      initialize: initialize,
      getState: function () { return state; },
      subscribe: function (listener) { if (typeof listener === 'function') listeners.push(listener); },
      clickIdPresence: function () { return clickIdPresence(state && state.last_touch); }
    };
  }

  return {
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    CLICK_KEYS: CLICK_KEYS,
    UTM_KEYS: UTM_KEYS,
    captureTouch: captureTouch,
    mergeRecord: mergeRecord,
    isExternalTouch: isExternalTouch,
    touchFingerprint: touchFingerprint,
    generateAttributionId: generateAttributionId,
    generateShortRef: generateShortRef,
    validAttributionId: validAttributionId,
    validShortRef: validShortRef,
    maskId: maskId,
    clickIdPresence: clickIdPresence,
    createBrowserClient: createBrowserClient
  };
}));
