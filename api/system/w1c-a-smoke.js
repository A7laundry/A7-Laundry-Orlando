'use strict';

const { systemW1cASmokeService } = require('../../lib/system-w1c-a-smoke-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest, clearSubmissionCookie } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = requireSession(req, res, ['owner']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body || body.confirm !== 'W1C_A_TRANSACTIONAL_SMOKE') {
    return json(res, 400, { ok:false, code:'confirmation_required' });
  }
  const requestId = submissionFromRequest(req);
  if (!requestId) return json(res, 409, { ok:false, code:'submission_required' });
  try {
    const result = await systemW1cASmokeService().run(actor, requestId);
    res.setHeader('Set-Cookie', clearSubmissionCookie());
    return json(res, 200, { ok:true, result });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_w1c_a_smoke_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'W1C-A smoke failed.' });
  }
};
