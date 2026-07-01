/* A7 Laundry — unified tracking v2 (GA4 + Meta Pixel + conversion events)
   Single source of truth. Include on every public page:
     <script src="/a7-tracking.js" defer></script>
   - Initializes GA4 (G-JLQNRC7MK4) and Meta Pixel (1452877649635363) — idempotent
     (skips init + PageView if a page already inlined the Pixel, so no double count).
   - Fires Lead (Meta Pixel) + a GA4 event on WhatsApp / SMS / Call / pickup-CTA clicks.
   - Fires a typed page_view (money_page_view / service_page_view / blog_pageview) and
     ViewContent (Pixel) on money + service pages.
   - Enriches every event with page_path, article_slug, funnel_stage, persona, geo,
     cta_location, channel, destination. */
(function () {
  'use strict';

  var GA4_ID = 'G-JLQNRC7MK4';
  var PIXEL_ID = '1452877649635363';

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

  var SLUG = getSlug();
  var PATH = location.pathname;
  var isBlog = /^\/blog\//.test(PATH) || SLUG === 'blog-index';
  var isMoney = /laundry-pickup-delivery-orlando/.test(PATH);
  var isService = /(service-areas|comforter|carpet|shoe|upholstery|vacation|plans)/.test(PATH) && !isMoney;

  function baseParams(extra) {
    var p = {
      page_path: PATH,
      article_slug: SLUG,
      funnel_stage: FUNNEL[SLUG] || (isMoney ? 'bofu' : 'other'),
      persona: PERSONA[SLUG] || 'general',
      geo: GEO[SLUG] || 'orlando'
    };
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
      : href.indexOf('sms:') === 0 ? 'sms'
      : href.indexOf('tel:') === 0 ? 'call'
      : (/laundry-pickup-delivery-orlando/.test(href) || /schedule pickup|book (a )?pickup|request pickup/i.test(a.textContent || '')) ? 'pickup'
      : null;
    if (!channel) return;

    var evName = channel === 'whatsapp' ? 'whatsapp_click'
      : channel === 'sms' ? 'sms_click'
      : channel === 'call' ? 'call_click' : 'pickup_cta_click';

    var params = baseParams({ cta_location: ctaLocation(a), channel: channel, destination: href, source_page: PATH });
    gtag('event', evName, params);
    if (window.fbq) {
      fbq('track', 'Lead', { content_name: SLUG, content_category: params.funnel_stage, source: channel + ':' + params.cta_location });
    }
  }, true);
})();
