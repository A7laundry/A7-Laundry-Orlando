'use strict';

const { systemHotelService } = require('../../lib/system-hotel-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res, ['owner', 'manager', 'operator']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const hotels = systemHotelService();
    if (body.action === 'list') {
      const rows = await hotels.list({ query:body.query, include_inactive:['owner', 'manager'].includes(actor.role) && body.include_inactive, limit:body.limit });
      return json(res, 200, { ok:true, hotels:rows });
    }
    if (body.action === 'save') {
      if (!['owner', 'manager'].includes(actor.role)) return json(res, 403, { ok:false, code:'forbidden', error:'Hotel management authorization is required.' });
      const requestId = submissionFromRequest(req);
      if (!requestId) return json(res, 409, { ok:false, code:'submission_required', error:'Restart hotel editing.' });
      const hotel = await hotels.save({ ...body, idempotency_key:`hotel:${requestId}` }, actor);
      return json(res, body.hotel_id ? 200 : 201, { ok:true, hotel });
    }
    return json(res, 400, { ok:false, code:'invalid_action', error:'Hotel action is invalid.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_hotel_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Hotel operation failed.' });
  }
};
