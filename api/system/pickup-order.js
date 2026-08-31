'use strict';

const { systemOrderService } = require('../../lib/system-order-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!requireSession(req, res)) return;
  try {
    const orderNumber = Array.isArray(req.query?.order_number)
      ? req.query.order_number[0] : req.query?.order_number;
    const pickupOrder = await systemOrderService().getPickupOrderByNumber(orderNumber);
    return pickupOrder
      ? json(res, 200, { ok: true, pickup_order: pickupOrder })
      : json(res, 404, { ok: false, code: 'not_found', error: 'Pickup Order not found.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { ok: false, code: error.code, error: error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok: false, code: error.code, error: 'Operational storage failed.' });
    }
    console.error('system_pickup_order_failed', { name: error?.name || 'Error' });
    return json(res, 500, { ok: false, code: 'unexpected_error', error: 'Pickup Order lookup failed.' });
  }
};
