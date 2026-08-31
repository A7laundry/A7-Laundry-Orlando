'use strict';

const { requireBridgeAuth, jsonBody, sendText } = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    requireBridgeAuth(req);
    const body = jsonBody(req);
    const result = await sendText(body.to, body.text);
    json(res, 200, { ok: true, ...result });
  } catch (error) {
    fail(res, error);
  }
};
