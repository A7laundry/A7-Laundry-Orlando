'use strict';

const { systemOperationsService } = require('../../lib/system-operations-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = requireSession(req, res, ['owner']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const operations = systemOperationsService();
    if (body.action === 'list') {
      return json(res, 200, { ok:true, ...(await operations.list({ queue:body.queue, query:body.query,
        custody_state:body.custody_state, production_state:body.production_state })) });
    }
    if (body.action === 'detail') {
      const order = await operations.detail(body.order_number);
      return order ? json(res, 200, { ok:true, order })
        : json(res, 404, { ok:false, code:'not_found', error:'Order not found.' });
    }
    if (body.action === 'transition') {
      const requestId = submissionFromRequest(req);
      if (!requestId) return json(res, 409, { ok:false, code:'submission_required', error:'Restart the operational action.' });
      const result = await operations.transition({ ...body, action:body.transition_action, request_id:requestId }, actor);
      return json(res, 200, { ok:true, result });
    }
    return json(res, 400, { ok:false, code:'invalid_action', error:'Operational action is invalid.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_operational_order_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Operational order request failed.' });
  }
};
