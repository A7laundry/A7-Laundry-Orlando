'use strict';

const { systemHomeService } = require('../../lib/system-home-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  const actor = requireSession(req, res, ['owner', 'operator']);
  if (!actor) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  try {
    return json(res, 200, { ok:true, home:await systemHomeService().report(actor) });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 409, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    console.error('system_home_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Home report failed.' });
  }
};
