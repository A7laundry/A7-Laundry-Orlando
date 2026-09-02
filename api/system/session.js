'use strict';

const { sessionFromRequestAsync } = require('../../lib/system-auth.js');
const { json } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  const actor = await sessionFromRequestAsync(req);
  if (!actor) return json(res, 401, { ok: false, code: 'unauthorized' });
  return json(res, 200, { ok:true, user:{ display_name:actor.display_name, role:actor.role,
    must_change_password:Boolean(actor.must_change_password) } });
};
