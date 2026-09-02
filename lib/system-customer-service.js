'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF_PREFIX = 'cust_';
const MAX_RESULTS = 20;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_NUMBER = /^(?:A7-ORL-\d{4,}|MCO[\s-]*\d{4,12})$/i;

function clean(value, max = 80) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeCustomerSearch(value) {
  const query = clean(value);
  const digits = query.replace(/\D/g, '');
  if (ORDER_NUMBER.test(query)) {
    const upper = query.toUpperCase();
    const match = upper.match(/^MCO[\s-]*(\d{4,12})$/);
    return { mode: 'order_number', query: match ? `MCO ${match[1]}` : upper };
  }
  if (query.includes('@')) {
    const email = query.toLowerCase();
    if (!EMAIL.test(email) || email.length > 160) throw new InvalidTransitionError('Enter a valid customer email.');
    return { mode: 'email', query: email };
  }
  if (/^[\d\s()+.-]+$/.test(query)) {
    if (digits.length === 4) return { mode: 'phone_last4', query: digits };
    if (digits.length >= 7 && digits.length <= 15) return { mode: 'phone', query: digits };
    throw new InvalidTransitionError('Enter a full phone number or exactly the last 4 WhatsApp digits.');
  }
  if (query.length < 3) throw new InvalidTransitionError('Enter at least 3 name characters, a phone, email or explicit order number.');
  return { mode: 'name', query };
}

function referenceKey(env = process.env) {
  const secret = String(env.A7_SYSTEM_SESSION_SECRET || '');
  if (secret.length < 32) throw new InvalidTransitionError('Customer references are unavailable.');
  return crypto.createHash('sha256').update(`a7-system-customer-ref-v1:${secret}`).digest();
}

function customerReference(customerId, env = process.env) {
  if (!UUID.test(String(customerId || ''))) throw new InvalidTransitionError('Customer identity is invalid.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', referenceKey(env), iv);
  const encrypted = Buffer.concat([cipher.update(customerId, 'utf8'), cipher.final()]);
  return `${REF_PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')}`;
}

function customerIdFromReference(reference, env = process.env) {
  const token = String(reference || '');
  if (!token.startsWith(REF_PREFIX) || token.length > 180) throw new InvalidTransitionError('Customer reference is invalid.');
  try {
    const raw = Buffer.from(token.slice(REF_PREFIX.length), 'base64url');
    if (raw.length < 29) throw new Error('short');
    const decipher = crypto.createDecipheriv('aes-256-gcm', referenceKey(env), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const customerId = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    if (!UUID.test(customerId)) throw new Error('uuid');
    return customerId;
  } catch (_) {
    throw new InvalidTransitionError('Customer reference is invalid.');
  }
}

function safeSearchRow(row, env) {
  return {
    customer_ref: customerReference(row.customer_id, env),
    name: row.profile_name || 'Customer',
    whatsapp_last4: String(row.whatsapp_last4 || '').slice(-4),
    latest_property: row.latest_property || null,
    latest_accepted_at: row.latest_accepted_at || null,
    order_count: Number(row.order_count) || 0,
    confirmed_service_revenue: Number(row.confirmed_service_revenue) || 0,
    currency: row.currency || 'USD'
  };
}

function safeDetail(row, env) {
  if (!row) return null;
  return {
    customer_ref: customerReference(row.customer_id, env),
    name: row.profile_name || 'Customer',
    whatsapp_number: row.whatsapp_number || null,
    email: row.email || null,
    language: row.language || 'unknown',
    customer_type: row.customer_type || 'unknown',
    latest_property: row.latest_property || null,
    latest_accommodation_type: row.latest_accommodation_type || null,
    summary: {
      order_count: Number(row.order_count) || 0,
      confirmed_service_revenue: Number(row.confirmed_service_revenue) || 0,
      currency: row.currency || 'USD',
      first_order_at: row.first_order_at || null,
      last_order_at: row.last_order_at || null,
      acquisition_source: row.acquisition_source || null
    },
    orders: Array.isArray(row.orders) ? row.orders.map((order) => ({
      order_number: order.order_number,
      accepted_at: order.accepted_at,
      order_status: order.order_status,
      payment_status: order.payment_status,
      service_tier: order.service_tier,
      property: order.property || null,
      accommodation_type: order.accommodation_type || null,
      confirmed_service_revenue: order.confirmed_service_revenue == null
        ? null : Number(order.confirmed_service_revenue),
      currency: order.currency || 'USD',
      is_qa: Boolean(order.is_qa),
      pickup_order_path: `/sistema/orders/${encodeURIComponent(order.order_number)}/pickup-order`
    })) : []
  };
}

function systemCustomerService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const env = options.env || process.env;
  return {
    store,
    async search(rawQuery, rawLimit = 12) {
      const normalized = normalizeCustomerSearch(rawQuery);
      const limit = Math.max(1, Math.min(Number(rawLimit) || 12, MAX_RESULTS));
      const rows = await store.searchSystemCustomers({ ...normalized, limit });
      return (Array.isArray(rows) ? rows : []).slice(0, limit).map((row) => safeSearchRow(row, env));
    },
    async getByReference(reference) {
      const customerId = customerIdFromReference(reference, env);
      const row = await store.getSystemCustomerById(customerId);
      return safeDetail(row, env);
    }
  };
}

module.exports = {
  systemCustomerService,
  normalizeCustomerSearch,
  customerReference,
  customerIdFromReference,
  MAX_RESULTS
};
