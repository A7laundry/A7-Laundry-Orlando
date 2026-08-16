'use strict';

const { createAttributionStore } = require('../../lib/attribution-store.js');
const { recordMetrics, safeLog } = require('../../lib/attribution-observability.js');
const { allowedOrigin, rateLimited } = require('./session.js');

async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed.' });
  if (rateLimited(req)) return res.status(429).json({ error: 'Too many requests.' });

  const payload = req.body && typeof req.body === 'object' ? req.body : {};
  if (payload.version !== 2 || payload.metric !== 'whatsapp_click' || typeof payload.has_short_ref !== 'boolean') {
    return res.status(400).json({ error: 'Invalid metric payload.' });
  }

  const store = createAttributionStore();
  const names = ['whatsapp_clicks', payload.has_short_ref ? 'whatsapp_clicks_with_ref' : 'whatsapp_clicks_without_ref'];
  const persisted = await recordMetrics(store, names);
  if (!persisted) safeLog('warn', 'whatsapp_metric_unavailable', { storage_mode: store.mode });
  return res.status(202).json({ accepted: persisted });
}

module.exports = handler;
