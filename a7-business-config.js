/* A7 Laundry — public business and measurement configuration.
   Public identifiers only. Never place credentials or customer data here. */
(function (root, factory) {
  var config = factory();
  if (typeof module === 'object' && module.exports) module.exports = config;
  if (root) root.A7_BUSINESS_CONFIG = config;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var config = {
    businessName: 'A7 Laundry Orlando',
    phoneE164: '+14076708839',
    whatsappNumber: '14076708839',
    displayPhone: '(407) 670-8839',
    serviceArea: 'Orlando and surrounding service area',
    measurement: {
      ga4Id: 'G-JLQNRC7MK4',
      googleAdsId: 'AW-17146169189',
      whatsappConversion: 'AW-17146169189/dhI0CO_7xNgcEOWO9-8_',
      websiteCallConversion: 'AW-17146169189/83lbCLK53NgcEOWO9-8_',
      metaPixelId: '1452877649635363'
    }
  };

  function cleanMessage(message) {
    return typeof message === 'string'
      ? message.replace(/(?:\r?\n)?A7 Ref:\s*[A-Z0-9|._-]+\s*$/i, '').trim()
      : '';
  }

  function validShortRef(shortRef) {
    return typeof shortRef === 'string' && /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/i.test(shortRef);
  }

  config.buildWhatsAppUrl = function buildWhatsAppUrl(message, shortRef) {
    var text = cleanMessage(message);
    if (validShortRef(shortRef)) {
      text += (text ? '\n' : '') + 'A7 Ref: ' + shortRef.toUpperCase();
    }
    var url = 'https://wa.me/' + config.whatsappNumber;
    return text ? url + '?text=' + encodeURIComponent(text) : url;
  };

  config.cleanWhatsAppMessage = cleanMessage;
  config.isValidShortRef = validShortRef;
  return Object.freeze(config);
}));
