'use strict';

const { publicCatalog } = require('../../lib/system-catalog.js');
const { json, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, code: 'method_not_allowed' });
  }
  if (!await requireSession(req, res)) return;
  return json(res, 200, { ok: true, catalog: publicCatalog() });
};
