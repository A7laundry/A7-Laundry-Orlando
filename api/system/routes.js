'use strict';

const { systemRouteService } = require('../../lib/system-route-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');
const { submissionFromRequest } = require('../../lib/system-auth.js');

module.exports = async function handler(req, res) {
  const actor = await requireSession(req, res, ['owner', 'manager']);
  if (!actor) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST'); return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const routes = systemRouteService();
    if (body.action === 'list') return json(res, 200, { ok:true, routes:await routes.list({ route_date:body.route_date }, actor) });
    if (body.action === 'detail') {
      const route = await routes.detail(body.route_id, actor);
      return route ? json(res, 200, { ok:true, route }) : json(res, 404, { ok:false, code:'not_found', error:'Route not found.' });
    }
    if (body.action === 'eligible') return json(res, 200, { ok:true, eligible:await routes.eligible({ route_id:body.route_id }, actor) });
    const requestId = submissionFromRequest(req);
    if (!requestId) return json(res, 409, { ok:false, code:'submission_required', error:'Restart the route action.' });
    const input = { ...body, request_id:requestId };
    const actions = {
      create:() => routes.create(input, actor), add_stop:() => routes.addStop(input, actor), remove_stop:() => routes.removeStop(input, actor),
      reorder:() => routes.reorder(input, actor), set_eta:() => routes.setEta(input, actor), start:() => routes.start(input, actor),
      execute_stop:() => routes.executeStop({ ...input, action:body.transition_action }, actor), exception:() => routes.recordException(input, actor),
      complete:() => routes.complete(input, actor), cancel:() => routes.cancel(input, actor)
    };
    if (!actions[body.action]) return json(res, 400, { ok:false, code:'invalid_action', error:'Route action is invalid.' });
    return json(res, 200, { ok:true, result:await actions[body.action]() });
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      const status = error.code === 'route_forbidden' ? 403 : 409;
      return json(res, status, { ok:false, code:error.code, error:error.message });
    }
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Route storage failed.' });
    console.error('system_route_action_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Route request failed.' });
  }
};
