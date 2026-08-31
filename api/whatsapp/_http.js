'use strict';

const { BridgeError } = require('../../lib/whatsapp-bridge.js');

function json(res, statusCode, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.status(statusCode).json(body);
}

function method(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader('Allow', allowed.join(', '));
  json(res, 405, { error: 'Method not allowed.', code: 'method_not_allowed' });
  return false;
}

function fail(res, error) {
  if (error instanceof BridgeError) {
    json(res, error.statusCode, { error: error.message, code: error.code });
    return;
  }
  console.error('whatsapp_bridge_error', { name: error?.name || 'Error' });
  json(res, 500, { error: 'Unexpected bridge error.', code: 'unexpected_error' });
}

module.exports = { json, method, fail };
