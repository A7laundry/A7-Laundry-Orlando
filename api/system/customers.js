'use strict';

const { systemCustomerService } = require('../../lib/system-customer-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res, ['owner', 'manager', 'operator']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok: false, code: 'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok: false, code: 'invalid_body' });

  try {
    const customers = systemCustomerService();
    if (body.action === 'search') {
      const results = await customers.search(body.query, body.limit);
      const safeResults = actor.role === 'operator' ? results.map((row) => ({
        customer_ref:row.customer_ref, name:row.name, whatsapp_last4:row.whatsapp_last4,
        latest_property:row.latest_property, order_count:row.order_count
      })) : results;
      return json(res, 200, { ok: true, customers: safeResults });
    }
    if (body.action === 'detail') {
      if (!['owner', 'manager'].includes(actor.role)) {
        return json(res, 403, { ok:false, code:'forbidden', error:'Customer detail requires management authorization.' });
      }
      const customer = await customers.getByReference(body.customer_ref);
      return customer ? json(res, 200, { ok: true, customer })
        : json(res, 404, { ok: false, code: 'not_found', error: 'Customer not found.' });
    }
    return json(res, 400, { ok: false, code: 'invalid_action', error: 'Customer action is invalid.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 400, { ok: false, code: error.code, error: error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok: false, code: error.code, error: 'Operational storage failed.' });
    }
    console.error('system_customer_failed', { name: error?.name || 'Error' });
    return json(res, 500, { ok: false, code: 'unexpected_error', error: 'Customer operation failed.' });
  }
};
