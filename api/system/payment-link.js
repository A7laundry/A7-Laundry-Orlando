'use strict';

const { systemPaymentLinkService } = require('../../lib/system-payment-link-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

function browserSafe(value) {
  if (!value || typeof value !== 'object') return value;
  const { payment_link_id:ignored, ...safe } = value;
  return safe;
}

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
    const service = systemPaymentLinkService();
    if (body.action === 'context') {
      const context = await service.context({ order_number:body.order_number }, actor);
      if (context?.current) context.current = browserSafe(context.current);
      return context ? json(res, 200, { ok:true, context })
        : json(res, 404, { ok:false, code:'not_found', error:'Order not found.' });
    }
    if (body.action !== 'create') {
      return json(res, 400, { ok:false, code:'invalid_action', error:'Payment Link action is invalid.' });
    }
    if (!submissionFromRequest(req)) {
      return json(res, 409, { ok:false, code:'submission_required', error:'Restart the Payment Link action.' });
    }
    const result = await service.create({ order_number:body.order_number, tip_amount:body.tip_amount ?? '0' }, actor);
    return json(res, 201, { ok:true, result:browserSafe(result) });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { ok:false, code:error.code, error:error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    }
    console.error('system_payment_link_failed', { name:error?.name || 'Error' });
    return json(res, 502, { ok:false, code:'stripe_failed', error:'Stripe could not create the Payment Link.' });
  }
};
