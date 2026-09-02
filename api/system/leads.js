'use strict';

const { systemLeadService } = require('../../lib/system-lead-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res, ['owner', 'manager', 'operator']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body || body.action !== 'detail') return json(res, 400, { ok:false, code:'invalid_action' });
  try {
    const lead = await systemLeadService().getByReference(body.lead_ref);
    return lead ? json(res, 200, { ok:true, lead })
      : json(res, 404, { ok:false, code:'not_found', error:'Lead is no longer awaiting confirmation.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_lead_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Lead operation failed.' });
  }
};
