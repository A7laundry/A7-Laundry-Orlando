'use strict';

const { requireBridgeAuth, getUnread } = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    requireBridgeAuth(req);
    const conversations = await getUnread(req.query.limit);
    json(res, 200, { conversations });
  } catch (error) {
    fail(res, error);
  }
};
