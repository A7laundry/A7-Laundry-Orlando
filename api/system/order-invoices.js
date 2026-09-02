'use strict';

const { systemInvoiceService } = require('../../lib/system-invoice-service.js');
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
    const invoices = systemInvoiceService();
    if (body.action === 'context') {
      const context = await invoices.context(body.order_number);
      return context ? json(res, 200, { ok:true, context })
        : json(res, 404, { ok:false, code:'not_found', error:'Order not found.' });
    }
    const requestId = submissionFromRequest(req);
    if (!requestId) {
      return json(res, 409, { ok:false, code:'submission_required', error:'Restart the invoice action.' });
    }
    if (body.action === 'review') {
      return json(res, 201, { ok:true, result:await invoices.review({ ...body, request_id:requestId }, actor) });
    }
    if (body.action === 'void') {
      return json(res, 200, { ok:true, result:await invoices.void({ ...body, request_id:requestId }, actor) });
    }
    return json(res, 400, { ok:false, code:'invalid_action', error:'Invoice action is invalid.' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { ok:false, code:error.code, error:error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    }
    console.error('system_order_invoice_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Order invoice request failed.' });
  }
};
