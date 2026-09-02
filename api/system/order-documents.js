'use strict';

const { systemDocumentService } = require('../../lib/system-document-service.js');
const { OperationalStoreError, InvalidTransitionError } = require('../../lib/operational-store.js');
const { json, bodyOf, allowedOrigin, requireSession } = require('../../lib/system-http.js');

module.exports = async function handler(req, res) {
  if (!await requireSession(req, res, ['owner', 'manager', 'operator'])) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok:false, code:'method_not_allowed' });
  }
  if (!allowedOrigin(req)) return json(res, 403, { ok:false, code:'origin_not_allowed' });
  const body = bodyOf(req);
  if (!body) return json(res, 400, { ok:false, code:'invalid_body' });
  try {
    const result = await systemDocumentService().render(body.document_type, body.order_number);
    if (!result) return json(res, 404, { ok:false, code:'not_found', error:'Order not found.' });
    res.statusCode = 200;
    res.setHeader('Content-Type', result.mime_type || 'application/pdf');
    if (result.template_version) res.setHeader('X-A7-Invoice-Template-Version', result.template_version);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', String(result.buffer.length));
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.end(result.buffer);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return json(res, 409, { ok:false, code:error.code, error:error.message });
    }
    if (error instanceof OperationalStoreError) {
      return json(res, 503, { ok:false, code:error.code, error:'Operational storage failed.' });
    }
    console.error('system_order_document_failed', { name:error?.name || 'Error' });
    return json(res, 500, { ok:false, code:'unexpected_error', error:'Order document generation failed.' });
  }
};
