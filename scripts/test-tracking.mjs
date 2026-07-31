import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../a7-tracking.js', import.meta.url), 'utf8');

function trackingRuntime(pathname, search = '', initialStorage = {}, pageLinks = []) {
  const gaEvents = [];
  const metaEvents = [];
  const listeners = {};
  const gtag = (...args) => gaEvents.push(args);
  const fbq = (...args) => metaEvents.push(args);
  const document = {
    head: { appendChild() {} },
    getElementById() { return {}; },
    createElement() { return {}; },
    getElementsByTagName() { return [{ parentNode: { insertBefore() {} } }]; },
    addEventListener(type, handler) { listeners[type] = handler; },
    querySelectorAll(selector) { return selector.includes('wa.me/') ? pageLinks : []; }
  };
  const storage = { ...initialStorage };
  const sessionStorage = {
    getItem(key) { return Object.hasOwn(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = String(value); }
  };
  const window = { dataLayer: [], gtag, fbq, sessionStorage };
  const context = vm.createContext({
    window,
    document,
    location: { pathname, search },
    gtag,
    fbq,
    URL,
    URLSearchParams
  });
  vm.runInContext(source, context);
  return { gaEvents, metaEvents, listeners, storage };
}

function anchor(href, textContent, location = 'inline') {
  const attributes = { href };
  return {
    textContent,
    classList: { contains(value) { return location === 'sticky-fab' && value === 'wa-fab'; } },
    getAttribute(name) { return Object.hasOwn(attributes, name) ? attributes[name] : null; },
    setAttribute(name, value) { attributes[name] = String(value); },
    closest(selector) {
      if (selector === 'a') return this;
      if (location === 'hero' && selector.includes('hero')) return {};
      if (location === 'nav' && selector === 'nav') return {};
      if (location === 'footer' && selector === 'footer') return {};
      return null;
    }
  };
}

{
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'hero');
  trackingRuntime(
    '/laundry-pickup-delivery-orlando',
    '?utm_source=google&utm_medium=cpc&utm_campaign=guest_search_orlando&utm_content=hotel',
    {},
    [whatsapp]
  );
  const decorated = new URL(whatsapp.getAttribute('href'));
  assert.match(decorated.searchParams.get('text'), /A7 Ref: google\|guest_search_orlando\|hotel/);
}

{
  const runtime = trackingRuntime('/comforter');
  const checkout = anchor('https://buy.stripe.com/aFa8wP3d2f420oT6wVeZ208', 'Book Now', 'hero');
  runtime.listeners.click({ target: checkout });
  const event = runtime.gaEvents.find((entry) => entry[0] === 'event' && entry[1] === 'begin_checkout');
  assert.ok(event, 'Stripe click must emit GA4 begin_checkout');
  assert.equal(event[2].value, 37);
  assert.equal(event[2].currency, 'USD');
  assert.equal(event[2].items[0].item_id, 'comforter-queen');
  assert.ok(runtime.metaEvents.some((entry) => entry[0] === 'track' && entry[1] === 'InitiateCheckout'));
}

{
  const runtime = trackingRuntime('/plans');
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'Schedule Pickup', 'nav');
  runtime.listeners.click({ target: whatsapp });
  const event = runtime.gaEvents.find((entry) => entry[0] === 'event' && entry[1] === 'whatsapp_click');
  assert.ok(event, 'WhatsApp click must emit GA4 whatsapp_click');
  assert.equal(event[2].channel, 'whatsapp');
  assert.equal(event[2].cta_location, 'nav');
  const googleAdsConversion = runtime.gaEvents.find(
    (entry) => entry[0] === 'event' && entry[1] === 'conversion'
  );
  assert.ok(googleAdsConversion, 'WhatsApp click must emit the native Google Ads conversion');
  assert.equal(
    googleAdsConversion[2].send_to,
    'AW-17146169189/dhI0CO_7xNgcEOWO9-8_'
  );
  assert.ok(runtime.metaEvents.some((entry) => entry[0] === 'track' && entry[1] === 'Lead'));
}

{
  const runtime = trackingRuntime('/laundry-pickup-delivery-orlando');
  const phoneConfig = runtime.gaEvents.find(
    (entry) => entry[0] === 'config' && entry[1] === 'AW-17146169189/83lbCLK53NgcEOWO9-8_'
  );
  assert.ok(phoneConfig, 'Google Ads website-call conversion must be configured');
  assert.equal(phoneConfig[2].phone_conversion_number, '+1 407-670-8839');

  const call = anchor('tel:+14076708839', 'Call A7 Laundry', 'hero');
  runtime.listeners.click({ target: call });
  const callClick = runtime.gaEvents.find(
    (entry) => entry[0] === 'event' && entry[1] === 'call_click'
  );
  assert.ok(callClick, 'Phone click must remain available as a GA4 diagnostic event');
  assert.ok(
    !runtime.gaEvents.some(
      (entry) => entry[0] === 'event'
        && entry[1] === 'conversion'
        && entry[2].send_to === 'AW-17146169189/83lbCLK53NgcEOWO9-8_'
    ),
    'A phone click alone must not be counted as a qualified 60-second call'
  );
}

{
  const runtime = trackingRuntime('/comforter-thanks');
  assert.ok(runtime.gaEvents.some((entry) => entry[0] === 'event' && entry[1] === 'page_view_typed'));
  assert.ok(!runtime.metaEvents.some((entry) => entry[0] === 'track' && entry[1] === 'ViewContent'));
}

{
  const runtime = trackingRuntime(
    '/laundry-pickup-delivery-orlando',
    '?utm_source=google&utm_medium=cpc&utm_campaign=guest_orlando&utm_content=hotel_search&gclid=test-click'
  );
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'hero');
  runtime.listeners.click({ target: whatsapp });
  const event = runtime.gaEvents.find((entry) => entry[0] === 'event' && entry[1] === 'whatsapp_click');
  assert.equal(event[2].utm_source, 'google');
  assert.equal(event[2].utm_medium, 'cpc');
  assert.equal(event[2].utm_campaign, 'guest_orlando');
  assert.equal(event[2].utm_content, 'hotel_search');
  assert.equal(event[2].gclid, 'test-click');
  assert.equal(event[2].landing_page, '/laundry-pickup-delivery-orlando');
  assert.equal(event[2].lead_reference, 'google|guest_orlando|hotel_search');
  assert.ok(runtime.storage.a7_campaign_attribution, 'Campaign attribution must persist in session storage');
}

{
  const storedAttribution = JSON.stringify({
    utm_source: 'meta',
    utm_campaign: 'guest_manual',
    utm_content: 'front_desk',
    landing_page: '/landing'
  });
  const runtime = trackingRuntime('/plans', '', { a7_campaign_attribution: storedAttribution });
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'Schedule Pickup', 'nav');
  runtime.listeners.click({ target: whatsapp });
  const event = runtime.gaEvents.find((entry) => entry[0] === 'event' && entry[1] === 'whatsapp_click');
  assert.equal(event[2].utm_source, 'meta');
  assert.equal(event[2].utm_campaign, 'guest_manual');
  assert.equal(event[2].landing_page, '/landing');
  assert.equal(event[2].lead_reference, 'meta|guest_manual|front_desk');
}

console.log('Unified tracking tests passed.');
