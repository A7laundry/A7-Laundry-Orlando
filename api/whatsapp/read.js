'use strict';

const { requireBridgeAuth, jsonBody, markRead } = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    requireBridgeAuth(req);
    const result = await markRead(jsonBody(req).conversation_id);
    json(res, 200, { ok: true, result });
  } catch (error) {
    fail(res, error);
  }
};
