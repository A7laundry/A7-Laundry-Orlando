'use strict';

const { issueSubmission, submissionCookie } = require('../../lib/system-auth.js');
const { json, allowedOrigin, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!await requireSession(req, res)) return;
  if (!allowedOrigin(req)) return json(res, 403, { ok: false, code: 'origin_not_allowed' });
  const submission = issueSubmission();
  res.setHeader('Set-Cookie', submissionCookie(submission.token));
  return json(res, 201, { ok: true });
};
