'use strict';

const { requireBridgeAuth, unitKey, supabaseRequest } = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    requireBridgeAuth(req);
    await supabaseRequest('a7_wa_conversations?select=id&limit=1');
    json(res, 200, { ok: true, unit: unitKey(), channel: 'whatsapp_cloud_api' });
  } catch (error) {
    fail(res, error);
  }
};
