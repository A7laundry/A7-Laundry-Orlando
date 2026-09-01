'use strict';

const { systemFinanceService } = require('../../lib/system-finance-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');

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
    const report = await systemFinanceService().report(body, actor);
    return json(res, 200, { ok:true, finance:report });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { ok:false, code:error.code, error:error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    }
    console.error('system_finance_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Finance report failed.' });
  }
};
