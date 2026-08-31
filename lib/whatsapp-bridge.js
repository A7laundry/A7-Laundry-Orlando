'use strict';

const crypto = require('node:crypto');

const DEFAULT_UNIT_KEY = 'orlando';
const DEFAULT_GRAPH_VERSION = 'v25.0';
const MAX_TEXT_LENGTH = 4096;

class BridgeError extends Error {
  constructor(message, statusCode = 500, code = 'bridge_error') {
    super(message);
    this.name = 'BridgeError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function env(name, source = process.env) {
  const value = String(source[name] || '').trim();
  if (!value) throw new BridgeError(`Missing configuration: ${name}.`, 503, 'not_configured');
  return value;
}

function unitKey(source = process.env) {
  return String(source.WHATSAPP_UNIT_KEY || DEFAULT_UNIT_KEY).trim().toLowerCase();
}

function safeEqual(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !provided || !expected) return false;
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearerToken(req) {
  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  const header = req.headers['x-a7-token'];
  return Array.isArray(header) ? header[0] : header;
}

function requireBridgeAuth(req, source = process.env) {
  if (!safeEqual(bearerToken(req), env('WHATSAPP_BRIDGE_TOKEN', source))) {
    throw new BridgeError('Unauthorized.', 401, 'unauthorized');
  }
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody)) rawBody = Buffer.from(rawBody || '');
  if (typeof signature !== 'string' || !signature.startsWith('sha256=') || !secret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  return safeEqual(signature, expected);
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length) return Buffer.concat(chunks);
  // A parsed object cannot reproduce Meta's signed bytes. Fail closed instead of
  // accepting a signature against re-serialized JSON.
  throw new BridgeError('Raw webhook body unavailable.', 503, 'raw_body_unavailable');
}

function jsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    try { return JSON.parse(String(req.body)); } catch (_) { return {}; }
  }
  return {};
}

function cleanPhone(value) {
  const phone = String(value || '').replace(/\D/g, '');
  if (!/^\d{7,15}$/.test(phone)) throw new BridgeError('Invalid WhatsApp recipient.', 400, 'invalid_recipient');
  return phone;
}

function cleanText(value) {
  if (typeof value !== 'string') throw new BridgeError('Text is required.', 400, 'invalid_text');
  const text = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!text || text.length > MAX_TEXT_LENGTH) {
    throw new BridgeError(`Text must contain 1-${MAX_TEXT_LENGTH} characters.`, 400, 'invalid_text');
  }
  return text;
}

function messageContent(message) {
  const type = String(message?.type || 'unknown');
  if (type === 'text') return { text: message.text?.body || null, caption: null, media: null };
  const media = message?.[type] || null;
  if (type === 'image' || type === 'audio' || type === 'document' || type === 'video' || type === 'sticker') {
    return {
      text: null,
      caption: media?.caption || null,
      media: media ? {
        id: media.id || null,
        mime_type: media.mime_type || null,
        sha256: media.sha256 || null,
        filename: media.filename || null
      } : null
    };
  }
  if (type === 'button') return { text: message.button?.text || null, caption: null, media: null };
  if (type === 'interactive') {
    const reply = message.interactive?.button_reply || message.interactive?.list_reply;
    return { text: reply?.title || reply?.id || null, caption: null, media: null };
  }
  return { text: null, caption: null, media: null };
}

function messageTimestamp(message, fallbackSeconds) {
  const seconds = Number(message?.timestamp || fallbackSeconds || Date.now() / 1000);
  return new Date(seconds * 1000).toISOString();
}

function normalizeMessage(message, context) {
  const content = messageContent(message);
  const waId = context.direction === 'outbound'
    ? (message.to || context.threadWaId || message.recipient_id)
    : (message.from || context.threadWaId);
  if (!message?.id || !waId) return null;
  return {
    unit_key: context.unitKey,
    phone_number_id: context.phoneNumberId || '',
    wa_id: String(waId),
    profile_name: context.profileName || null,
    wa_message_id: String(message.id),
    direction: context.direction,
    source: context.source,
    message_type: String(message.type || 'unknown'),
    text_body: content.text,
    caption: content.caption,
    media_id: content.media?.id || null,
    media_mime_type: content.media?.mime_type || null,
    media_sha256: content.media?.sha256 || null,
    media_filename: content.media?.filename || null,
    reply_to_wa_message_id: message.context?.id || null,
    referral: message.referral || null,
    occurred_at: messageTimestamp(message, context.fallbackSeconds),
    is_historical: Boolean(context.isHistorical),
    status: message.history_context?.status || (context.direction === 'outbound' ? 'sent' : 'received')
  };
}

function normalizeWebhook(body, options = {}) {
  const normalized = { messages: [], statuses: [], contacts: [], events: [] };
  if (body?.object !== 'whatsapp_business_account') return normalized;
  const currentUnit = options.unitKey || DEFAULT_UNIT_KEY;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id || '';
      const fallbackSeconds = entry.time;

      if (change.field === 'messages') {
        for (const status of value.statuses || []) {
          if (status?.id && status?.status) normalized.statuses.push({
            unit_key: currentUnit,
            wa_message_id: String(status.id),
            status: String(status.status),
            occurred_at: messageTimestamp(status, fallbackSeconds),
            errors: status.errors || null
          });
        }
        const profileByWaId = new Map((value.contacts || []).map((contact) => [
          String(contact.wa_id || ''), contact.profile?.name || null
        ]));
        for (const message of value.messages || []) {
          const item = normalizeMessage(message, {
            unitKey: currentUnit,
            phoneNumberId,
            profileName: profileByWaId.get(String(message.from || '')),
            direction: 'inbound',
            source: 'cloud_api',
            fallbackSeconds
          });
          if (item) normalized.messages.push(item);
        }
      } else if (change.field === 'smb_message_echoes') {
        for (const message of value.message_echoes || value.messages || []) {
          const item = normalizeMessage(message, {
            unitKey: currentUnit,
            phoneNumberId,
            direction: 'outbound',
            source: 'business_app',
            fallbackSeconds
          });
          if (item) normalized.messages.push(item);
        }
      } else if (change.field === 'history') {
        for (const history of value.history || []) {
          for (const thread of history.threads || []) {
            const threadWaId = thread.id || thread.wa_id || thread.phone_number;
            for (const message of thread.messages || []) {
              const outbound = Boolean(message.to) || message.from === value.metadata?.display_phone_number;
              const item = normalizeMessage(message, {
                unitKey: currentUnit,
                phoneNumberId,
                threadWaId,
                profileName: thread.contact?.name || thread.name || null,
                direction: outbound ? 'outbound' : 'inbound',
                source: 'history_sync',
                fallbackSeconds,
                isHistorical: true
              });
              if (item) normalized.messages.push(item);
            }
          }
          if (history.errors?.length) normalized.events.push({ type: 'history_error', errors: history.errors });
        }
      } else if (change.field === 'smb_app_state_sync') {
        for (const state of value.state_sync || value.contacts || []) normalized.contacts.push(state);
      } else if (change.field === 'account_update') {
        normalized.events.push({ type: 'account_update', event: value.event || null });
      }
    }
  }
  return normalized;
}

function supabaseConfig(source = process.env) {
  return {
    url: env('WHATSAPP_SUPABASE_URL', source).replace(/\/$/, ''),
    key: env('WHATSAPP_SUPABASE_SERVICE_ROLE_KEY', source)
  };
}

function supabaseHeaders(key) {
  const headers = { apikey: key };
  if (!String(key).startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function supabaseRequest(path, options = {}, source = process.env) {
  const { url, key } = supabaseConfig(source);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(key),
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new BridgeError('WhatsApp storage operation failed.', 503, `storage_${response.status}`);
  return payload;
}

async function rpc(name, body, source = process.env) {
  return supabaseRequest(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body || {}) }, source);
}

async function ingestNormalized(normalized, source = process.env) {
  for (const message of normalized.messages) {
    await rpc('a7_wa_ingest_message', {
      p_unit_key: message.unit_key,
      p_phone_number_id: message.phone_number_id,
      p_wa_id: message.wa_id,
      p_profile_name: message.profile_name,
      p_wa_message_id: message.wa_message_id,
      p_direction: message.direction,
      p_source: message.source,
      p_message_type: message.message_type,
      p_text_body: message.text_body,
      p_caption: message.caption,
      p_media_id: message.media_id,
      p_media_mime_type: message.media_mime_type,
      p_media_sha256: message.media_sha256,
      p_media_filename: message.media_filename,
      p_reply_to_wa_message_id: message.reply_to_wa_message_id,
      p_referral: message.referral,
      p_occurred_at: message.occurred_at,
      p_is_historical: message.is_historical,
      p_status: message.status
    }, source);
  }
  for (const status of normalized.statuses) {
    await rpc('a7_wa_update_message_status', {
      p_unit_key: status.unit_key,
      p_wa_message_id: status.wa_message_id,
      p_status: status.status,
      p_occurred_at: status.occurred_at
    }, source);
  }
}

function graphConfig(source = process.env) {
  return {
    token: env('WHATSAPP_TOKEN', source),
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID', source),
    version: String(source.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION)
  };
}

async function graphRequest(path, options = {}, source = process.env) {
  const config = graphConfig(source);
  const response = await fetch(`https://graph.facebook.com/${config.version}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const metaCode = payload?.error?.code ? String(payload.error.code) : String(response.status);
    throw new BridgeError('WhatsApp rejected the request.', 502, `graph_${metaCode}`);
  }
  return response;
}

async function sendText(to, text, source = process.env) {
  const recipient = cleanPhone(to);
  const body = cleanText(text);
  const config = graphConfig(source);
  const response = await graphRequest(`${config.phoneNumberId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: { preview_url: false, body }
    })
  }, source);
  const payload = await response.json();
  const messageId = payload?.messages?.[0]?.id;
  if (!messageId) throw new BridgeError('WhatsApp did not return a message id.', 502, 'graph_missing_message_id');
  const stored = await rpc('a7_wa_record_outbound', {
    p_unit_key: unitKey(source),
    p_phone_number_id: config.phoneNumberId,
    p_wa_id: recipient,
    p_wa_message_id: messageId,
    p_text_body: body,
    p_occurred_at: new Date().toISOString()
  }, source);
  return { message_id: messageId, conversation_id: stored?.conversation_id || stored?.[0]?.conversation_id || null };
}

async function getUnread(limit = 50, source = process.env) {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  const query = new URLSearchParams({
    select: 'id,wa_id,profile_name,unread_count,last_message_at,last_message_preview',
    unit_key: `eq.${unitKey(source)}`,
    unread_count: 'gt.0',
    order: 'last_message_at.desc',
    limit: String(safeLimit)
  });
  return supabaseRequest(`a7_wa_conversations?${query}`, {}, source);
}

async function findConversation(waId, source = process.env) {
  const query = new URLSearchParams({
    select: 'id',
    unit_key: `eq.${unitKey(source)}`,
    wa_id: `eq.${cleanPhone(waId)}`,
    limit: '1'
  });
  const rows = await supabaseRequest(`a7_wa_conversations?${query}`, {}, source);
  return rows?.[0]?.id || null;
}

async function getHistory({ conversationId, waId, limit = 100 }, source = process.env) {
  const id = conversationId || await findConversation(waId, source);
  if (!id) return { conversation_id: null, messages: [] };
  const safeLimit = Math.min(500, Math.max(1, Number(limit) || 100));
  const query = new URLSearchParams({
    select: 'id,wa_message_id,direction,source,message_type,text_body,caption,media_id,media_mime_type,media_filename,status,reply_to_wa_message_id,referral,occurred_at,is_historical,read_at',
    conversation_id: `eq.${id}`,
    order: 'occurred_at.asc',
    limit: String(safeLimit)
  });
  const messages = await supabaseRequest(`a7_wa_messages?${query}`, {}, source);
  return { conversation_id: id, messages };
}

async function markRead(conversationId, source = process.env) {
  if (!/^[0-9a-f-]{36}$/i.test(String(conversationId || ''))) {
    throw new BridgeError('Invalid conversation id.', 400, 'invalid_conversation');
  }
  return rpc('a7_wa_mark_read', {
    p_unit_key: unitKey(source),
    p_conversation_id: conversationId,
    p_read_at: new Date().toISOString()
  }, source);
}

async function mediaResponse(mediaId, source = process.env) {
  if (!/^[A-Za-z0-9_-]{6,200}$/.test(String(mediaId || ''))) {
    throw new BridgeError('Invalid media id.', 400, 'invalid_media');
  }
  const query = new URLSearchParams({
    select: 'media_id,media_mime_type,media_filename',
    media_id: `eq.${mediaId}`,
    limit: '1'
  });
  const rows = await supabaseRequest(`a7_wa_messages?${query}`, {}, source);
  if (!rows?.length) throw new BridgeError('Media not found.', 404, 'media_not_found');
  const metadata = await (await graphRequest(String(mediaId), {}, source)).json();
  if (!metadata?.url) throw new BridgeError('Media URL unavailable.', 404, 'media_unavailable');
  const config = graphConfig(source);
  const response = await fetch(metadata.url, { headers: { Authorization: `Bearer ${config.token}` } });
  if (!response.ok) throw new BridgeError('Media download failed.', 502, `media_${response.status}`);
  return { response, record: rows[0], metadata };
}

module.exports = {
  DEFAULT_UNIT_KEY,
  DEFAULT_GRAPH_VERSION,
  MAX_TEXT_LENGTH,
  BridgeError,
  env,
  unitKey,
  safeEqual,
  requireBridgeAuth,
  verifyWebhookSignature,
  readRawBody,
  jsonBody,
  cleanPhone,
  cleanText,
  messageContent,
  normalizeWebhook,
  supabaseHeaders,
  supabaseRequest,
  rpc,
  ingestNormalized,
  graphRequest,
  sendText,
  getUnread,
  getHistory,
  markRead,
  mediaResponse
};
