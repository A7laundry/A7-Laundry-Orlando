'use strict';

const { systemUserService } = require('../../lib/system-user-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { CAPABILITIES } = require('../../lib/system-rbac.js');
const { json, bodyOf, allowedOrigin, requireCapability } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  const actor = await requireCapability(req, res, CAPABILITIES.TEAM_MANAGE);
  if (!actor) return;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok:false, code:'method_not_allowed' }); }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  const users = systemUserService();
  try {
    if (body.action === 'list') return json(res, 200, { ok:true, users:await users.list(actor) });
    if (body.action === 'history') return json(res, 200, { ok:true, events:await users.history(body.user_id, actor) });
    if (body.action === 'create') return json(res, 201, { ok:true, ...(await users.create(body, actor)) });
    if (body.action === 'update') return json(res, 200, { ok:true, user:await users.update(body, actor) });
    if (body.action === 'reset_password') return json(res, 200, { ok:true, ...(await users.resetPassword(body.user_id, actor)) });
    return json(res, 400, { ok:false, code:'invalid_action' });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 422, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Team storage is unavailable.' });
    return json(res, 500, { ok:false, code:'internal_error' });
  }
};
