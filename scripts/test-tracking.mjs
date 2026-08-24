import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const configSource = fs.readFileSync(new URL('../a7-business-config.js', import.meta.url), 'utf8');
const attributionSource = fs.readFileSync(new URL('../a7-attribution.js', import.meta.url), 'utf8');
const eventsSource = fs.readFileSync(new URL('../a7-events.js', import.meta.url), 'utf8');
const trackingSource = fs.readFileSync(new URL('../a7-tracking.js', import.meta.url), 'utf8');

function anchor(href, textContent, placement = 'inline') {
  const attributes = {href};
  return {
    textContent,
    classList: {contains(value) { return placement === 'sticky-fab' && value === 'wa-fab'; }},
    getAttribute(name) { return Object.hasOwn(attributes, name) ? attributes[name] : null; },
    setAttribute(name, value) { attributes[name] = String(value); },
    closest(selector) {
      if (selector === 'a') return this;
      if (placement === 'hero' && selector.includes('hero')) return {};
      if (placement === 'nav' && selector === 'nav') return {};
      if (placement === 'footer' && selector === 'footer') return {};
      return null;
    }
  };
}

async function trackingRuntime({pathname = '/', search = '', referrer = '', initialStorage = {}, pageLinks = [], apiFailure = false, gtagFailure = false, deferVendorTags = false} = {}) {
  const gaEvents = [];
  const metaEvents = [];
  const listeners = {};
  const windowListeners = {};
  const appendedScripts = [];
  const storage = {...initialStorage};
  const sessionStorage = {
    getItem(key) { return Object.hasOwn(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = String(value); }
  };
  const location = {
    pathname,
    search,
    hostname: 'a7laundry.com',
    href: `https://a7laundry.com${pathname}${search}`
  };
  const gtag = (...args) => {
    if (gtagFailure && args[0] === 'event') throw new Error('synthetic gtag failure');
    gaEvents.push(args);
  };
  const fbq = (...args) => metaEvents.push(args);
  const document = {
    referrer,
    head: {appendChild(node) { appendedScripts.push(node); }},
    getElementById() { return null; },
    createElement() { return {}; },
    getElementsByTagName() { return [{parentNode: {insertBefore() {}}}]; },
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) {
      if (listeners[type]) listeners[type] = listeners[type].filter((candidate) => candidate !== handler);
    },
    querySelectorAll(selector) { return selector.includes('wa.me/') ? pageLinks : []; }
  };
  const fetch = async () => {
    if (apiFailure) throw new Error('synthetic attribution outage');
    return {
      ok: true,
      async json() {
        return {
          version: 2,
          attribution_id: 'at_0123456789abcdef0123456789abcdef',
          short_ref: '7KQ9W3M2HX',
          first_touch: {entry_type: search ? 'campaign' : referrer ? 'referral' : 'direct', source: search ? 'google' : referrer ? 'google.com' : 'direct', medium: search ? 'cpc' : referrer ? 'referral' : 'none', landing_page: pathname},
          last_touch: {entry_type: search ? 'campaign' : referrer ? 'referral' : 'direct', source: search ? 'google' : referrer ? 'google.com' : 'direct', medium: search ? 'cpc' : referrer ? 'referral' : 'none', landing_page: pathname},
          click_id_present: {gclid: search.includes('gclid='), gbraid: false, wbraid: false},
          restored: false,
          storage_mode: 'shadow_ephemeral'
        };
      }
    };
  };
  const window = {
    dataLayer: [], gtag, fbq, sessionStorage, fetch,
    __A7_DEFER_VENDOR_TAGS__: deferVendorTags,
    addEventListener(type, handler) { (windowListeners[type] ||= []).push(handler); }
  };
  const context = vm.createContext({window, document, location, gtag, fbq, fetch, URL, URLSearchParams, WeakSet, Date, console, setTimeout, clearTimeout});
  for (const source of [configSource, attributionSource, eventsSource]) vm.runInContext(source, context);
  window.A7_BUSINESS_CONFIG = context.A7_BUSINESS_CONFIG;
  window.A7_ATTRIBUTION = context.A7_ATTRIBUTION;
  window.A7_EVENTS = context.A7_EVENTS;
  vm.runInContext(trackingSource, context);
  vm.runInContext(trackingSource, context); // repeated inclusion must be idempotent
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {window, gaEvents, metaEvents, listeners, windowListeners, appendedScripts, storage};
}

function click(runtime, target, event = {target}) {
  for (const listener of runtime.listeners.click || []) listener(event);
  return event;
}

{
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'hero');
  const runtime = await trackingRuntime({pathname: '/laundry-pickup-delivery-orlando', search: '?utm_source=google&utm_medium=cpc&utm_campaign=guest&gclid=SYNTHETIC', pageLinks: [whatsapp]});
  assert.equal(runtime.listeners.click.length, 1, 'Repeated script inclusion must install one click listener.');
  assert.match(new URL(whatsapp.getAttribute('href')).searchParams.get('text'), /A7 Ref: 7KQ9W3M2HX$/);
  assert.ok(!whatsapp.getAttribute('href').includes('SYNTHETIC'), 'Click ID must not enter the WhatsApp URL.');
  const eventObject = {target: whatsapp};
  click(runtime, whatsapp, eventObject);
  click(runtime, whatsapp, eventObject);
  const waEvents = runtime.gaEvents.filter((entry) => entry[0] === 'event' && entry[1] === 'whatsapp_click');
  const conversions = runtime.gaEvents.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion');
  assert.equal(waEvents.length, 1, 'One DOM interaction must emit one WhatsApp event.');
  assert.equal(conversions.length, 1, 'One DOM interaction must emit one Ads conversion.');
  assert.equal(conversions[0][2].send_to, 'AW-17146169189/dhI0CO_7xNgcEOWO9-8_');
  assert.equal(waEvents[0][2].gclid, undefined);
  assert.equal(waEvents[0][2].utm_campaign, undefined);
  assert.equal(waEvents[0][2].lead_reference, '7KQ9W3M2HX');

  whatsapp.setAttribute('href', 'https://wa.me/14076708839?text=Estimator%20changed%20this');
  click(runtime, whatsapp, {target: whatsapp});
  assert.match(new URL(whatsapp.getAttribute('href')).searchParams.get('text'), /A7 Ref: 7KQ9W3M2HX$/, 'A dynamic CTA rewrite must regain the short ref at click time.');
}

{
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'nav');
  const runtime = await trackingRuntime({pathname: '/plans', pageLinks: [whatsapp], apiFailure: true});
  assert.ok(runtime.gaEvents.some((entry) => entry[0] === 'event' && entry[1] === 'service_page_view'));
  assert.equal(new URL(whatsapp.getAttribute('href')).pathname, '/14076708839');
  click(runtime, whatsapp);
  assert.equal(runtime.gaEvents.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').length, 1);
  assert.doesNotMatch(new URL(whatsapp.getAttribute('href')).searchParams.get('text'), /A7 Ref:/);
}

{
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'nav');
  const runtime = await trackingRuntime({pathname: '/plans', pageLinks: [whatsapp], gtagFailure: true});
  assert.doesNotThrow(() => click(runtime, whatsapp), 'Google tracking failure must not break the CTA handler.');
  assert.equal(new URL(whatsapp.getAttribute('href')).pathname, '/14076708839');
}

{
  const runtime = await trackingRuntime({pathname: '/laundry-pickup-delivery-orlando'});
  const phoneConfig = runtime.gaEvents.find((entry) => entry[0] === 'config' && entry[1] === 'AW-17146169189/83lbCLK53NgcEOWO9-8_');
  assert.equal(phoneConfig[2].phone_conversion_number, '+1 407-670-8839');
  const phone = anchor('tel:+14076708839', 'Call', 'hero');
  click(runtime, phone);
  assert.ok(runtime.gaEvents.some((entry) => entry[0] === 'event' && entry[1] === 'call_click'));
  assert.ok(!runtime.gaEvents.some((entry) => entry[0] === 'event' && entry[1] === 'conversion' && entry[2].send_to === 'AW-17146169189/83lbCLK53NgcEOWO9-8_'));
}

{
  const whatsapp = anchor('https://wa.me/14076708839?text=Hello', 'WhatsApp', 'hero');
  const runtime = await trackingRuntime({pathname: '/blog/laundry-lake-buena-vista', pageLinks: [whatsapp], deferVendorTags: true});
  assert.equal(runtime.appendedScripts.length, 0, 'LBV must queue measurement without loading vendors during the critical render.');
  assert.equal(runtime.listeners.pointerdown.length, 1, 'The first user intent must release queued vendor tags.');
  runtime.listeners.pointerdown[0]();
  assert.deepEqual(
    runtime.appendedScripts.map((script) => script.src),
    ['https://www.googletagmanager.com/gtag/js?id=G-JLQNRC7MK4', 'https://connect.facebook.net/en_US/fbevents.js'],
    'The interaction release must load each measurement vendor once.'
  );
  click(runtime, whatsapp);
  assert.equal(runtime.gaEvents.filter((entry) => entry[0] === 'event' && entry[1] === 'whatsapp_click').length, 1);
  assert.equal(runtime.gaEvents.filter((entry) => entry[0] === 'event' && entry[1] === 'conversion').length, 1);
}

{
  const runtime = await trackingRuntime({pathname: '/comforter'});
  const checkout = anchor('https://buy.stripe.com/aFa8wP3d2f420oT6wVeZ208', 'Book Now', 'hero');
  click(runtime, checkout);
  const event = runtime.gaEvents.find((entry) => entry[0] === 'event' && entry[1] === 'begin_checkout');
  assert.equal(event[2].value, 37);
  assert.equal(event[2].currency, 'USD');
  assert.ok(runtime.metaEvents.some((entry) => entry[0] === 'track' && entry[1] === 'InitiateCheckout'));
}

console.log('Unified tracking V2 foundation tests passed.');
