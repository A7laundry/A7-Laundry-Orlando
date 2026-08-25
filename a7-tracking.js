/* A7 Laundry — unified tracking v4 shadow foundation.
   GA4 + Google Ads + Meta remain compatible. Attribution V2 is fail-open. */
(function () {
  'use strict';

  if (window.__A7_TRACKING_INITIALIZED__) return;
  window.__A7_TRACKING_INITIALIZED__ = true;

  var FALLBACK_CONFIG = {
    businessName: 'A7 Laundry Orlando',
    phoneE164: '+14076708839',
    whatsappNumber: '14076708839',
    displayPhone: '(407) 670-8839',
    measurement: {
      ga4Id: 'G-JLQNRC7MK4',
      googleAdsId: 'AW-17146169189',
      whatsappConversion: 'AW-17146169189/dhI0CO_7xNgcEOWO9-8_',
      websiteCallConversion: 'AW-17146169189/83lbCLK53NgcEOWO9-8_',
      metaPixelId: '1452877649635363'
    },
    buildWhatsAppUrl: function (message, shortRef) {
      var clean = typeof message === 'string' ? message.replace(/(?:\r?\n)?A7 Ref:\s*[^\r\n]+\s*$/i, '').trim() : '';
      if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/i.test(shortRef || '')) clean += (clean ? '\n' : '') + 'A7 Ref: ' + shortRef.toUpperCase();
      return 'https://wa.me/14076708839' + (clean ? '?text=' + encodeURIComponent(clean) : '');
    }
  };
  var CONFIG = window.A7_BUSINESS_CONFIG || FALLBACK_CONFIG;
  var GA4_ID = CONFIG.measurement.ga4Id;
  var GOOGLE_ADS_ID = CONFIG.measurement.googleAdsId;
  var GOOGLE_ADS_WHATSAPP_DESTINATION = CONFIG.measurement.whatsappConversion;
  var GOOGLE_ADS_PHONE_DESTINATION = CONFIG.measurement.websiteCallConversion;
  var OFFICIAL_PHONE = '+1 407-670-8839';
  var PIXEL_ID = CONFIG.measurement.metaPixelId;
  var CHECKOUTS = {
    '7sY00jbJy8FE0oTbRfeZ207': { item_id: 'comforter-twin', item_name: 'Twin Comforter Cleaning', value: 33 },
    'aFa8wP3d2f420oT6wVeZ208': { item_id: 'comforter-queen', item_name: 'Full / Queen Comforter Cleaning', value: 37 },
    '8x200jaFu7BA6Nh2gFeZ209': { item_id: 'comforter-king', item_name: 'King Comforter Cleaning', value: 40 },
    'bJe14n8xm2hg1sXdZneZ20a': { item_id: 'comforter-down', item_name: 'Down / Feather Comforter Cleaning', value: 45 }
  };

  var debugAllowed = location.hostname === 'localhost'
    || location.hostname === '127.0.0.1'
    || window.__A7_DEBUG_AUTHORIZED__ === true;
  var debugLog = [];
  function diagnose(type, detail) {
    if (!debugAllowed) return;
    debugLog.push({ at: new Date().toISOString(), type: type, detail: detail || {} });
    if (debugLog.length > 100) debugLog.shift();
  }
  if (debugAllowed) {
    window.__A7_MEASUREMENT_DEBUG__ = {
      entries: function () { return debugLog.slice(); },
      snapshot: function () {
        var state = attributionClient && attributionClient.getState();
        return {
          attribution_id: window.A7_ATTRIBUTION ? window.A7_ATTRIBUTION.maskId(state && state.attribution_id) : 'unavailable',
          short_ref: state && state.short_ref || '',
          click_id_present: state && state.click_id_present || { gclid: false, gbraid: false, wbraid: false },
          source: state && state.last_touch && state.last_touch.source || '',
          medium: state && state.last_touch && state.last_touch.medium || '',
          whatsapp_destination: CONFIG.whatsappNumber
        };
      }
    };
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  try {
    gtag('js', new Date());
    gtag('config', GA4_ID, location.pathname === '/guest-payment-confirmation'
      || location.pathname === '/guest-payment-confirmation.html'
      ? { ignore_referrer: true }
      : {});
    gtag('config', GOOGLE_ADS_ID);
    gtag('config', GOOGLE_ADS_PHONE_DESTINATION, { phone_conversion_number: OFFICIAL_PHONE });
  } catch (_) { diagnose('google_tag_init_failed'); }

  if (!window.fbq) {
    var metaQueue = window.fbq = function () {
      metaQueue.callMethod ? metaQueue.callMethod.apply(metaQueue, arguments) : metaQueue.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = metaQueue;
    metaQueue.push = metaQueue;
    metaQueue.loaded = true;
    metaQueue.version = '2.0';
    metaQueue.queue = [];
  }
  try { fbq('init', PIXEL_ID); fbq('track', 'PageView'); } catch (_) { diagnose('meta_init_failed'); }

  var vendorTagsLoaded = false;
  function loadVendorTags() {
    if (vendorTagsLoaded) return;
    vendorTagsLoaded = true;
    if (!document.getElementById('ga4-js')) {
      var googleScript = document.createElement('script');
      googleScript.async = true;
      googleScript.id = 'ga4-js';
      googleScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
      document.head.appendChild(googleScript);
    }
    if (!document.getElementById('meta-pixel-js')) {
      var metaScript = document.createElement('script');
      metaScript.async = true;
      metaScript.id = 'meta-pixel-js';
      metaScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(metaScript);
    }
  }

  if (window.__A7_DEFER_VENDOR_TAGS__ === true) {
    var releaseVendorTags = function () {
      loadVendorTags();
      document.removeEventListener('pointerdown', releaseVendorTags, true);
      document.removeEventListener('keydown', releaseVendorTags, true);
    };
    document.addEventListener('pointerdown', releaseVendorTags, true);
    document.addEventListener('keydown', releaseVendorTags, true);
    window.addEventListener('load', function () { setTimeout(releaseVendorTags, 8000); }, { once: true });
  } else loadVendorTags();

  function getSlug() {
    var parts = location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    if (!parts.length) return 'home';
    if (parts[0] === 'blog' && parts.length === 1) return 'blog-index';
    return parts[parts.length - 1].replace(/\.html$/, '');
  }

  function ctaLocation(el) {
    if (!el || !el.closest) return 'inline';
    if (el.classList && el.classList.contains('wa-fab')) return 'sticky-fab';
    if (el.closest('nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('header, .hero, [class*="hero"]')) return 'hero';
    if (el.closest('.related, .related-card')) return 'related';
    return 'inline';
  }

  var SLUG = getSlug();
  var PATH = location.pathname;
  var NORMALIZED_PATH = PATH.length > 1 ? PATH.replace(/\/$/, '').replace(/\.html$/, '') : '/';
  var GROWTH = window.A7_GROWTH_MAP && window.A7_GROWTH_MAP[NORMALIZED_PATH] || null;
  var isBlog = /^\/blog\//.test(PATH) || SLUG === 'blog-index';
  var isMoney = /laundry-pickup-delivery-orlando/.test(PATH);
  var isThankYou = /comforter-thanks/.test(PATH);
  var isService = /(service-areas|comforter|carpet|shoe|upholstery|vacation|plans)/.test(PATH) && !isMoney && !isThankYou;
  var attributionClient = null;

  function attributionState() { return attributionClient && attributionClient.getState(); }

  function baseParams(extra) {
    var state = attributionState();
    var touch = state && state.last_touch;
    var params = {
      page_path: PATH,
      article_slug: SLUG,
      asset_id: GROWTH && GROWTH.asset_id || 'unmapped',
      funnel_stage: GROWTH && GROWTH.funnel_stage_legacy || (isMoney ? 'bofu' : 'other'),
      funnel_stage_v2: GROWTH && GROWTH.journey_stage_v2 || 'unmapped',
      cluster_id: GROWTH && GROWTH.cluster_id || 'unmapped',
      content_role: GROWTH && GROWTH.content_role || 'unmapped',
      persona: GROWTH && GROWTH.persona || 'general',
      geo: GROWTH && GROWTH.geo_key || 'orlando',
      asset_match_method: GROWTH ? 'exact_canonical_path' : 'unmatched',
      landing_page: state && state.first_touch && state.first_touch.landing_page || PATH,
      lead_reference: state && state.short_ref || '',
      origin_class: touch && touch.entry_type || 'unknown',
      origin_source: touch && touch.source || 'unknown'
    };
    if (extra) for (var key in extra) params[key] = extra[key];
    return params;
  }

  function originalWhatsAppMessage(link) {
    try {
      var url = new URL(link.getAttribute('href'), 'https://a7laundry.com');
      return CONFIG.cleanWhatsAppMessage ? CONFIG.cleanWhatsAppMessage(url.searchParams.get('text') || '') : (url.searchParams.get('text') || '');
    } catch (_) { return ''; }
  }

  function buildWhatsAppLink(link) {
    if (!link) return;
    try {
      var state = attributionState();
      link.setAttribute('href', CONFIG.buildWhatsAppUrl(originalWhatsAppMessage(link), state && state.short_ref));
      diagnose('whatsapp_cta_built', { short_ref: state && state.short_ref || '', destination: CONFIG.whatsappNumber });
    } catch (_) { diagnose('whatsapp_cta_build_failed'); }
  }

  function decorateWhatsAppLinks() {
    if (!document.querySelectorAll) return;
    var links = document.querySelectorAll('a[href*="wa.me/"]');
    for (var i = 0; i < links.length; i++) buildWhatsAppLink(links[i]);
  }

  if (window.A7_ATTRIBUTION && typeof window.A7_ATTRIBUTION.createBrowserClient === 'function') {
    attributionClient = window.A7_ATTRIBUTION.createBrowserClient({ window: window });
    attributionClient.subscribe(function (state, kind) {
      var safeDetail = {
        attribution_id: window.A7_ATTRIBUTION.maskId(state && state.attribution_id),
        short_ref: state && state.short_ref || '',
        click_id_present: state && state.click_id_present || { gclid: false, gbraid: false, wbraid: false }
      };
      diagnose(kind, safeDetail);
      if (kind === 'attribution_created') diagnose('short_ref_generated', { short_ref: safeDetail.short_ref });
      if (state && state.first_touch) diagnose('first_touch', { source: state.first_touch.source, medium: state.first_touch.medium });
      if (state && state.last_touch) diagnose('last_touch', { source: state.last_touch.source, medium: state.last_touch.medium });
      if (state && state.short_ref) decorateWhatsAppLinks();
    });
    attributionClient.initialize({
      url: location.href,
      referrer: document.referrer || '',
      timestamp: new Date().toISOString()
    });
  } else {
    diagnose('attribution_module_unavailable');
  }

  var pageEvent = isMoney ? 'money_page_view' : isBlog ? 'blog_pageview' : isService ? 'service_page_view' : 'page_view_typed';
  try {
    if (pageEvent === 'service_page_view' && window.A7_EVENTS) window.A7_EVENTS.track('service_page_view', baseParams(), window.gtag);
    else gtag('event', pageEvent, baseParams());
  } catch (_) { diagnose('page_event_failed', { event: pageEvent }); }
  if ((isMoney || isService) && window.fbq) {
    try { fbq('track', 'ViewContent', { content_name: SLUG, content_category: isMoney ? 'money_page' : 'service_page' }); } catch (_) {}
  }

  var processedEvents = typeof WeakSet === 'function' ? new WeakSet() : null;
  document.addEventListener('click', function (event) {
    if (processedEvents) {
      if (processedEvents.has(event)) return;
      processedEvents.add(event);
    }
    var anchor = event.target && event.target.closest && event.target.closest('a');
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    var channel = href.indexOf('wa.me/') > -1 ? 'whatsapp'
      : href.indexOf('buy.stripe.com/') > -1 ? 'checkout'
      : href.indexOf('sms:') === 0 ? 'sms'
      : href.indexOf('tel:') === 0 ? 'call'
      : (/laundry-pickup-delivery-orlando/.test(href) || /schedule pickup|book (a )?pickup|request pickup/i.test(anchor.textContent || '')) ? 'pickup'
      : null;
    if (!channel) return;

    if (channel === 'whatsapp') {
      buildWhatsAppLink(anchor);
      href = anchor.getAttribute('href') || href;
    }
    var eventName = channel === 'whatsapp' ? 'whatsapp_click'
      : channel === 'checkout' ? 'begin_checkout'
      : channel === 'sms' ? 'sms_click'
      : channel === 'call' ? 'call_click' : 'pickup_cta_click';
    var params = baseParams({ cta_location: ctaLocation(anchor), channel: channel, destination: href, source_page: PATH });
    if (channel === 'checkout') {
      var checkoutId = href.split('/').pop().split('?')[0];
      var checkout = CHECKOUTS[checkoutId];
      if (checkout) {
        params.currency = 'USD'; params.value = checkout.value;
        params.items = [{ item_id: checkout.item_id, item_name: checkout.item_name, price: checkout.value, quantity: 1 }];
      }
    }

    try {
      if (channel === 'whatsapp' && window.A7_EVENTS) window.A7_EVENTS.track('whatsapp_click', params, window.gtag);
      else if (channel === 'call' && window.A7_EVENTS) window.A7_EVENTS.track('phone_click', params, window.gtag);
      else gtag('event', eventName, params);
    } catch (_) { diagnose('analytics_event_failed', { event: eventName }); }

    var adsConversionFired = false;
    if (channel === 'whatsapp') {
      try {
        gtag('event', 'conversion', { send_to: GOOGLE_ADS_WHATSAPP_DESTINATION });
        adsConversionFired = true;
      } catch (_) { diagnose('ads_conversion_failed'); }
    }
    if (window.fbq) {
      try {
        if (channel === 'checkout') {
          fbq('track', 'InitiateCheckout', {
            content_name: params.items ? params.items[0].item_name : SLUG,
            content_category: 'comforter_cleaning', value: params.value, currency: params.currency || 'USD'
          });
        } else {
          fbq('track', 'Lead', { content_name: SLUG, content_category: params.funnel_stage, source: channel + ':' + params.cta_location });
        }
      } catch (_) { diagnose('meta_event_failed', { event: eventName }); }
    }
    diagnose(channel === 'whatsapp' ? 'whatsapp_click' : 'contact_click', {
      event: eventName,
      attribution_id: window.A7_ATTRIBUTION ? window.A7_ATTRIBUTION.maskId(attributionState() && attributionState().attribution_id) : 'unavailable',
      short_ref: attributionState() && attributionState().short_ref || '',
      destination: channel === 'whatsapp' ? CONFIG.whatsappNumber : channel,
      ads_conversion_fired: adsConversionFired
    });
  }, true);
}());
