'use strict';

const { clearSessionCookie, clearSubmissionCookie } = require('../../lib/system-auth.js');
const { json, allowedOrigin } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok: false, code: 'origin_not_allowed' });
  res.setHeader('Set-Cookie', [clearSessionCookie(), clearSubmissionCookie()]);
  return json(res, 200, { ok: true });
};
