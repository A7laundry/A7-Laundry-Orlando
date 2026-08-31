'use strict';

const { requireBridgeAuth, mediaResponse } = require('../../lib/whatsapp-bridge.js');
const { method, fail } = require('./_http.js');

module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    requireBridgeAuth(req);
    const { response, record, metadata } = await mediaResponse(req.query.id);
    const mimeType = metadata.mime_type || record.media_mime_type || 'application/octet-stream';
    const filename = String(record.media_filename || `whatsapp-${record.media_id}`)
      .replace(/[^A-Za-z0-9._-]/g, '_');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    const bytes = Buffer.from(await response.arrayBuffer());
    res.status(200).send(bytes);
  } catch (error) {
    fail(res, error);
  }
};
