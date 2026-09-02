'use strict';

const { systemOperationalCycleService } = require('../../lib/system-operational-cycle-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res, ['owner', 'manager']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const service = systemOperationalCycleService();
    if (body.action === 'list') {
      const drivers = await service.listDrivers({ include_inactive:body.include_inactive }, actor);
      return json(res, 200, { ok:true, drivers });
    }
    const requestId = submissionFromRequest(req);
    if (!requestId) return json(res, 409, { ok:false, code:'submission_required', error:'Restart the driver action.' });
    if (body.action === 'save') {
      const result = await service.saveDriver({ ...body, request_id:requestId }, actor);
      return json(res, 200, { ok:true, result });
    }
    if (body.action === 'assign') {
      const result = await service.assignDriver({ ...body, request_id:requestId }, actor);
      return json(res, 200, { ok:true, result });
    }
    return json(res, 400, { ok:false, code:'invalid_action', error:'Driver action is invalid.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_driver_action_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Driver action failed.' });
  }
};
