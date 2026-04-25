/* A7 Laundry — WhatsApp tracking + UTM injection
   Disparado em todo click em link wa.me. Push pro dataLayer (GTM lê),
   também dispara fbq Lead se Pixel estiver carregado.
   Auto-anexa UTM nos hrefs no load pra rastreio funil completo. */
(function () {
  'use strict';

  var FUNNEL_MAP = {
    'laundry-service-orlando': 'tofu',
    'how-to-clean-comforter': 'tofu',
    'vacation-rental-laundry-orlando': 'tofu',
    'same-day-laundry-orlando': 'tofu',
    'laundry-kissimmee': 'tofu',
    'laundry-near-disney-world': 'tofu',
    'laundry-for-vacation-rental-guests': 'tofu',
    'orlando-laundromat-vs-delivery': 'tofu',
    'laundry-disney-springs-area': 'tofu',
    'vacation-rental-checklist-orlando': 'tofu',
    'airbnb-host-laundry-tips-orlando': 'mofu',
    'comforter-cleaning-service-orlando': 'mofu',
    'laundry-champions-gate': 'mofu',
    'how-often-wash-vacation-rental-linens': 'mofu',
    'express-laundry-orlando': 'mofu',
    'a7-laundry-review': 'bofu',
    'book-laundry-whatsapp-orlando': 'bofu',
    'laundry-subscription-vacation-rental': 'bofu',
    'reunion-resort-laundry-service': 'bofu',
    'comforter-cleaning-service-orlando-v2': 'bofu',
    'orlando-vacation-rental-laundry-guide': 'pillar'
  };

  function getSlug() {
    var path = window.location.pathname.replace(/\/$/, '');
    var parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'home';
    if (parts[0] === 'blog' && parts.length === 1) return 'blog-index';
    return parts[parts.length - 1].replace(/\.html$/, '');
  }

  function getStage(slug) {
    return FUNNEL_MAP[slug] || 'other';
  }

  function getButtonType(el) {
    if (!el) return 'unknown';
    if (el.classList && el.classList.contains('wa-fab')) return 'fab';
    var inNav = el.closest && el.closest('nav');
    if (inNav) return 'nav';
    var inRelated = el.closest && el.closest('.related-card, .related');
    if (inRelated) return 'related';
    var inHero = el.closest && el.closest('header, .hero, [class*="hero"]');
    if (inHero) return 'hero';
    var inFooter = el.closest && el.closest('footer');
    if (inFooter) return 'footer';
    return 'inline';
  }

  function buildUtm(slug, stage, button) {
    return {
      utm_source: 'blog',
      utm_medium: 'organic',
      utm_campaign: slug,
      utm_content: stage + '-' + button
    };
  }

  function appendUtm(href, utm) {
    try {
      var url = new URL(href);
      Object.keys(utm).forEach(function (k) {
        if (!url.searchParams.has(k)) url.searchParams.set(k, utm[k]);
      });
      return url.toString();
    } catch (e) {
      return href;
    }
  }

  var slug = getSlug();
  var stage = getStage(slug);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (!a) return;

    var btn = getButtonType(a);
    var originalHref = a.getAttribute('href') || '';
    var utm = buildUtm(slug, stage, btn);
    var newHref = appendUtm(originalHref, utm);
    if (newHref !== originalHref) a.setAttribute('href', newHref);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'whatsapp_click',
      page_stage: stage,
      article_slug: slug,
      button_type: btn,
      wa_url: newHref
    });

    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', 'Lead', {
          content_name: slug,
          content_category: stage,
          source: btn
        });
      } catch (err) { /* noop */ }
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('a[href*="wa.me/"]');
    links.forEach(function (a) {
      var btn = getButtonType(a);
      var utm = buildUtm(slug, stage, btn);
      var href = a.getAttribute('href') || '';
      var newHref = appendUtm(href, utm);
      if (newHref !== href) a.setAttribute('href', newHref);
    });

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'blog_pageview',
      page_stage: stage,
      article_slug: slug
    });
  });
})();
