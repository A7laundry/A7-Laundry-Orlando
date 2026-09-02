'use strict';

const { systemOrderService } = require('../../lib/system-order-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res);
  if (!actor) return;
  try {
    const orders = systemOrderService();
    if (req.method === 'GET') {
      const orderNumber = Array.isArray(req.query?.order_number) ? req.query.order_number[0] : req.query?.order_number;
      const order = await orders.getByOrderNumber(orderNumber);
      return order ? json(res, 200, { ok: true, order })
        : json(res, 404, { ok: false, code: 'not_found', error: 'Order not found.' });
    }
    if (req.method === 'POST') {
      if (!allowedOrigin(req)) return json(res, 403, { ok: false, code: 'origin_not_allowed' });
      const body = bodyOf(req);
      if (!body) return json(res, 400, { ok: false, code: 'invalid_body' });
      const submissionId = submissionFromRequest(req);
      if (!submissionId) return json(res, 409, { ok: false, code: 'submission_required', error: 'Start a new attendance before creating the order.' });
      const create = body.customer_ref ? orders.createKnownCustomerOrder.bind(orders) : orders.createManualOrder.bind(orders);
      const order = await create({ ...body, submission_id: submissionId, analytics_context: null }, actor);
      return json(res, order.duplicate ? 200 : 201, { ok: true, order });
    }
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok: false, code: error.code, error: error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok: false, code: error.code, error: 'Operational storage failed.' });
    console.error('system_order_failed', { name: error?.name || 'Error' });
    return json(res, 500, { ok: false, code: 'unexpected_error', error: 'Order operation failed.' });
  }
};
