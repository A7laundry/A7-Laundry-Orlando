'use strict';

const { systemUserService } = require('../../lib/system-user-service.js');
const { sessionFromRequestAsync, persistentActor, signSession, sessionCookie } = require('../../lib/system-auth.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok:false, code:'method_not_allowed' }); }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const actor = await sessionFromRequestAsync(req);
  if (!actor) return json(res, 401, { ok:false, code:'unauthorized' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const updated = await systemUserService().changeOwnPassword(body, actor);
    const nextActor = persistentActor(updated);
    res.setHeader('Set-Cookie', sessionCookie(signSession(nextActor)));
    return json(res, 200, { ok:true, user:{ display_name:nextActor.display_name,
      role:nextActor.role, must_change_password:false } });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return json(res, 422, { ok:false, code:error.code, error:error.message });
    if (error instanceof OperationalStoreError) return json(res, 503, { ok:false, code:error.code, error:'Team storage is unavailable.' });
    return json(res, 500, { ok:false, code:'internal_error' });
  }
};
