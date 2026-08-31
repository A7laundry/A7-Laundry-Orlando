'use strict';

const { requireBridgeAuth, getHistory } = require('../../lib/whatsapp-bridge.js');
const { json, method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    requireBridgeAuth(req);
    if (!req.query.conversation_id && !req.query.wa_id) {
      return json(res, 400, { error: 'conversation_id or wa_id is required.', code: 'missing_conversation' });
    }
    json(res, 200, await getHistory({
      conversationId: req.query.conversation_id,
      waId: req.query.wa_id,
      limit: req.query.limit
    }));
  } catch (error) {
    fail(res, error);
  }
};
