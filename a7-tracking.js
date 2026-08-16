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
  if (!document.getElementById('ga4-js')) {
    var script = document.createElement('script');
    script.async = true;
    script.id = 'ga4-js';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(script);
  }
  try {
    gtag('js', new Date());
    gtag('config', GA4_ID);
    gtag('config', GOOGLE_ADS_ID);
    gtag('config', GOOGLE_ADS_PHONE_DESTINATION, { phone_conversion_number: OFFICIAL_PHONE });
  } catch (_) { diagnose('google_tag_init_failed'); }

  if (!window.fbq) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    try { fbq('init', PIXEL_ID); fbq('track', 'PageView'); } catch (_) { diagnose('meta_init_failed'); }
  }

  var FUNNEL = {
    'hotel-laundry-service-orlando': 'bofu', 'airbnb-laundry-service-orlando': 'bofu',
    'laundry-before-checkout-orlando': 'bofu', 'hotel-vs-pickup-laundry-orlando': 'mofu',
    'family-vacation-laundry-orlando': 'bofu', 'laundry-international-drive-orlando': 'bofu',
    'laundry-near-universal-orlando': 'bofu', 'laundry-winter-garden-fl': 'geo',
    'laundry-windermere-fl': 'geo', 'laundry-clermont-fl': 'geo', 'laundry-ocoee-fl': 'geo',
    'same-day-laundry-tourists-orlando': 'tofu', 'pack-less-orlando-trip-laundry': 'tofu',
    'no-car-laundry-orlando': 'tofu', 'laundry-tips-orlando-vacation': 'tofu',
    'laundry-service-orlando': 'tofu', 'how-to-clean-comforter': 'tofu',
    'vacation-rental-laundry-orlando': 'mofu', 'same-day-laundry-orlando': 'bofu',
    'laundry-kissimmee': 'geo', 'laundry-near-disney-world': 'geo',
    'laundry-disney-springs-area': 'geo', 'laundry-champions-gate': 'geo',
    'reunion-resort-laundry-service': 'geo', 'laundry-for-vacation-rental-guests': 'bofu',
    'orlando-laundromat-vs-delivery': 'mofu', 'vacation-rental-checklist-orlando': 'tofu',
    'airbnb-host-laundry-tips-orlando': 'tofu', 'how-often-wash-vacation-rental-linens': 'tofu',
    'express-laundry-orlando': 'bofu', 'a7-laundry-review': 'bofu',
    'book-laundry-whatsapp-orlando': 'bofu', 'laundry-subscription-vacation-rental': 'mofu',
    'comforter-cleaning-service-orlando': 'mofu', 'comforter-cleaning-service-orlando-v2': 'bofu',
    'orlando-vacation-rental-laundry-guide': 'pillar'
  };
  var PERSONA = {
    'hotel-laundry-service-orlando': 'hotel', 'hotel-vs-pickup-laundry-orlando': 'hotel',
    'airbnb-laundry-service-orlando': 'airbnb', 'laundry-for-vacation-rental-guests': 'airbnb',
    'family-vacation-laundry-orlando': 'family', 'airbnb-host-laundry-tips-orlando': 'host',
    'how-often-wash-vacation-rental-linens': 'host', 'laundry-subscription-vacation-rental': 'host',
    'vacation-rental-checklist-orlando': 'host', 'a7-laundry-review': 'host',
    'orlando-vacation-rental-laundry-guide': 'host', 'vacation-rental-laundry-orlando': 'host'
  };
  var GEO = {
    'laundry-international-drive-orlando': 'i-drive', 'laundry-near-universal-orlando': 'universal',
    'laundry-winter-garden-fl': 'winter-garden', 'laundry-windermere-fl': 'windermere',
    'laundry-clermont-fl': 'clermont', 'laundry-ocoee-fl': 'ocoee', 'laundry-kissimmee': 'kissimmee',
    'laundry-near-disney-world': 'disney', 'laundry-disney-springs-area': 'disney-springs',
    'laundry-champions-gate': 'champions-gate', 'reunion-resort-laundry-service': 'reunion'
  };

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
      funnel_stage: FUNNEL[SLUG] || (isMoney ? 'bofu' : 'other'),
      persona: PERSONA[SLUG] || 'general',
      geo: GEO[SLUG] || 'orlando',
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
