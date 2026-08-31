'use strict';

const { createOperationalStore } = require('../../lib/operational-store.js');
const { usersFromEnv, roleAllowed, accessMode } = require('../../lib/system-auth.js');
const { json, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!requireSession(req, res)) return;
  const store = createOperationalStore();
  const authReady = usersFromEnv().some((user) => roleAllowed(user.role))
    && String(process.env.A7_SYSTEM_SESSION_SECRET || '').length >= 32;
  const storageReady = store.mode !== 'unavailable' && await store.systemHealth().catch(() => false);
  return json(res, authReady && storageReady ? 200 : 503, {
    ok: authReady && storageReady,
    checks: {
      auth: authReady ? 'ready' : 'unavailable',
      storage: storageReady ? 'ready' : 'unavailable',
      access_mode: accessMode()
    },
    checked_at: new Date().toISOString()
  });
};
