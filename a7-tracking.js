/* A7 Laundry — unified tracking v3 (GA4 + Google Ads + Meta Pixel + conversion events)
   Single source of truth. Include on every public page:
     <script src="/a7-tracking.js" defer></script>
   - Initializes GA4 (G-JLQNRC7MK4), Google Ads (AW-17146169189) and
     Meta Pixel (1452877649635363) — idempotent
     (skips init + PageView if a page already inlined the Pixel, so no double count).
   - Fires Lead (Meta Pixel) + a GA4 event on WhatsApp / SMS / Call / pickup-CTA clicks.
   - Fires a typed page_view (money_page_view / service_page_view / blog_pageview) and
     ViewContent (Pixel) on money + service pages.
   - Persists campaign parameters for the current browser session so a lead click
     keeps its acquisition source after the visitor moves between pages.
   - Enriches every event with page_path, article_slug, funnel_stage, persona, geo,
     campaign attribution, cta_location, channel and destination. */
(function () {
  'use strict';

  var GA4_ID = 'G-JLQNRC7MK4';
  var GOOGLE_ADS_ID = 'AW-17146169189';
  var GOOGLE_ADS_WHATSAPP_DESTINATION = 'AW-17146169189/dhI0CO_7xNgcEOWO9-8_';
  var GOOGLE_ADS_PHONE_DESTINATION = 'AW-17146169189/83lbCLK53NgcEOWO9-8_';
  var OFFICIAL_PHONE = '+1 407-670-8839';
  var PIXEL_ID = '1452877649635363';
  var CHECKOUTS = {
    '7sY00jbJy8FE0oTbRfeZ207': { item_id: 'comforter-twin', item_name: 'Twin Comforter Cleaning', value: 33 },
    'aFa8wP3d2f420oT6wVeZ208': { item_id: 'comforter-queen', item_name: 'Full / Queen Comforter Cleaning', value: 37 },
    '8x200jaFu7BA6Nh2gFeZ209': { item_id: 'comforter-king', item_name: 'King Comforter Cleaning', value: 40 },
    'bJe14n8xm2hg1sXdZneZ20a': { item_id: 'comforter-down', item_name: 'Down / Feather Comforter Cleaning', value: 45 }
  };

  /* ---------------- GA4 (gtag.js) ---------------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (!document.getElementById('ga4-js')) {
    var g = document.createElement('script');
    g.async = true; g.id = 'ga4-js';
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
  }
  gtag('js', new Date());
  gtag('config', GA4_ID);
  gtag('config', GOOGLE_ADS_ID);
  gtag('config', GOOGLE_ADS_PHONE_DESTINATION, {
    phone_conversion_number: OFFICIAL_PHONE
  });

  /* ---------------- Meta Pixel (idempotent) ---------------- */
  if (!window.fbq) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView'); // only when this file did the init → avoids double PageView
  }

  /* ---------------- context maps ---------------- */
  var FUNNEL = {
    // phase-1 (persona/BOFU + geo + TOFU)
    'hotel-laundry-service-orlando': 'bofu', 'airbnb-laundry-service-orlando': 'bofu',
    'laundry-before-checkout-orlando': 'bofu', 'hotel-vs-pickup-laundry-orlando': 'mofu',
    'family-vacation-laundry-orlando': 'bofu', 'laundry-international-drive-orlando': 'bofu',
    'laundry-near-universal-orlando': 'bofu', 'laundry-winter-garden-fl': 'geo',
    'laundry-windermere-fl': 'geo', 'laundry-clermont-fl': 'geo', 'laundry-ocoee-fl': 'geo',
    'same-day-laundry-tourists-orlando': 'tofu', 'pack-less-orlando-trip-laundry': 'tofu',
    'no-car-laundry-orlando': 'tofu', 'laundry-tips-orlando-vacation': 'tofu',
    // legacy
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
    'family-vacation-laundry-orlando': 'family',
    'airbnb-host-laundry-tips-orlando': 'host', 'how-often-wash-vacation-rental-linens': 'host',
    'laundry-subscription-vacation-rental': 'host', 'vacation-rental-checklist-orlando': 'host',
    'a7-laundry-review': 'host', 'orlando-vacation-rental-laundry-guide': 'host',
    'vacation-rental-laundry-orlando': 'host'
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

  /* ---------------- campaign attribution ---------------- */
  var ATTRIBUTION_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'gclid', 'gbraid', 'wbraid', 'fbclid'
  ];
  var ATTRIBUTION_STORAGE_KEY = 'a7_campaign_attribution';

  function safeSessionRead() {
    try {
      var raw = window.sessionStorage && window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function safeSessionWrite(value) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(value));
      }
    } catch (error) {
      // Tracking must never block navigation when storage is unavailable.
    }
  }

  function readCampaignAttribution() {
    var saved = safeSessionRead();
    var params = new URLSearchParams(location.search || '');
    var foundCampaignParam = false;

    for (var i = 0; i < ATTRIBUTION_KEYS.length; i++) {
      var key = ATTRIBUTION_KEYS[i];
      var value = params.get(key);
      if (value) {
        saved[key] = value.slice(0, 250);
        foundCampaignParam = true;
      }
    }

    if (!saved.landing_page) saved.landing_page = location.pathname;
    if (foundCampaignParam) {
      saved.attribution_captured_at = new Date().toISOString();
      safeSessionWrite(saved);
    } else if (!safeSessionRead().landing_page) {
      safeSessionWrite(saved);
    }
    return saved;
  }

  function leadReference(attribution) {
    var parts = [
      attribution.utm_source,
      attribution.utm_campaign,
      attribution.utm_content
    ].filter(Boolean);
    if (!parts.length && attribution.gclid) parts.push('google-ads');
    if (!parts.length && attribution.fbclid) parts.push('meta');
    return parts.length
      ? parts.join('|').replace(/[^a-zA-Z0-9_|.-]/g, '-').slice(0, 120)
      : 'direct';
  }

  function decorateWhatsAppLinks(attribution) {
    if (!document.querySelectorAll) return;
    var reference = leadReference(attribution);
    if (reference === 'direct') return;
    var links = document.querySelectorAll('a[href*="wa.me/"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      try {
        var url = new URL(link.getAttribute('href'), 'https://a7laundry.com');
        var message = url.searchParams.get('text') || '';
        if (message.indexOf('A7 Ref:') === -1) {
          url.searchParams.set('text', message + '\nA7 Ref: ' + reference);
          link.setAttribute('href', url.toString());
        }
      } catch (error) {
        // A malformed third-party link must not affect the rest of the page.
      }
    }
  }

  var SLUG = getSlug();
  var PATH = location.pathname;
  var ATTRIBUTION = readCampaignAttribution();
  decorateWhatsAppLinks(ATTRIBUTION);
  var isBlog = /^\/blog\//.test(PATH) || SLUG === 'blog-index';
  var isMoney = /laundry-pickup-delivery-orlando/.test(PATH);
  var isThankYou = /comforter-thanks/.test(PATH);
  var isService = /(service-areas|comforter|carpet|shoe|upholstery|vacation|plans)/.test(PATH) && !isMoney && !isThankYou;

  function baseParams(extra) {
    var p = {
      page_path: PATH,
      article_slug: SLUG,
      funnel_stage: FUNNEL[SLUG] || (isMoney ? 'bofu' : 'other'),
      persona: PERSONA[SLUG] || 'general',
      geo: GEO[SLUG] || 'orlando',
      landing_page: ATTRIBUTION.landing_page || PATH,
      lead_reference: leadReference(ATTRIBUTION)
    };
    for (var i = 0; i < ATTRIBUTION_KEYS.length; i++) {
      var attributionKey = ATTRIBUTION_KEYS[i];
      if (ATTRIBUTION[attributionKey]) p[attributionKey] = ATTRIBUTION[attributionKey];
    }
    if (extra) for (var k in extra) p[k] = extra[k];
    return p;
  }

  /* ---------------- typed page_view ---------------- */
  var pageEvent = isMoney ? 'money_page_view' : isBlog ? 'blog_pageview' : isService ? 'service_page_view' : 'page_view_typed';
  gtag('event', pageEvent, baseParams());
  if ((isMoney || isService) && window.fbq) {
    fbq('track', 'ViewContent', { content_name: SLUG, content_category: isMoney ? 'money_page' : 'service_page' });
  }

  /* ---------------- click tracking (WhatsApp / SMS / Call / pickup) ---------------- */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var channel = href.indexOf('wa.me/') > -1 ? 'whatsapp'
      : href.indexOf('buy.stripe.com/') > -1 ? 'checkout'
      : href.indexOf('sms:') === 0 ? 'sms'
      : href.indexOf('tel:') === 0 ? 'call'
      : (/laundry-pickup-delivery-orlando/.test(href) || /schedule pickup|book (a )?pickup|request pickup/i.test(a.textContent || '')) ? 'pickup'
      : null;
    if (!channel) return;

    var evName = channel === 'whatsapp' ? 'whatsapp_click'
      : channel === 'checkout' ? 'begin_checkout'
      : channel === 'sms' ? 'sms_click'
      : channel === 'call' ? 'call_click' : 'pickup_cta_click';

    var params = baseParams({ cta_location: ctaLocation(a), channel: channel, destination: href, source_page: PATH });
    if (channel === 'checkout') {
      var checkoutId = href.split('/').pop().split('?')[0];
      var checkout = CHECKOUTS[checkoutId];
      if (checkout) {
        params.currency = 'USD';
        params.value = checkout.value;
        params.items = [{ item_id: checkout.item_id, item_name: checkout.item_name, price: checkout.value, quantity: 1 }];
      }
    }
    gtag('event', evName, params);
    if (channel === 'whatsapp') {
      gtag('event', 'conversion', {
        send_to: GOOGLE_ADS_WHATSAPP_DESTINATION
      });
    }
    if (window.fbq) {
      if (channel === 'checkout') {
        fbq('track', 'InitiateCheckout', {
          content_name: params.items ? params.items[0].item_name : SLUG,
          content_category: 'comforter_cleaning',
          value: params.value,
          currency: params.currency || 'USD'
        });
      } else {
        fbq('track', 'Lead', { content_name: SLUG, content_category: params.funnel_stage, source: channel + ':' + params.cta_location });
      }
    }
  }, true);
})();
