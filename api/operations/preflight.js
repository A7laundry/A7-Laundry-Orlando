'use strict';

const { evaluateOperationalRelease } = require('../../lib/operational-release-preflight.js');

const AUTHORIZED_PREVIEW_BRANCH = 'feat/meta-ads-ops-structure';

function respond(res, status, body) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function handler(req, res) {
  if (process.env.VERCEL_ENV !== 'preview'
    || process.env.VERCEL_GIT_COMMIT_REF !== AUTHORIZED_PREVIEW_BRANCH) {
    return respond(res, 404, { error: 'not_found' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respond(res, 405, { error: 'method_not_allowed' });
  }

  const result = evaluateOperationalRelease(process.env, 'preview-steady');
  return respond(res, result.ready ? 200 : 503, result);
}

module.exports = handler;
module.exports.AUTHORIZED_PREVIEW_BRANCH = AUTHORIZED_PREVIEW_BRANCH;
