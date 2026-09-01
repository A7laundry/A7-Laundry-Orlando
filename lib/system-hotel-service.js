'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value, max) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function aliases(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values.map((item) => clean(item, 180)).filter((item) => item.length >= 2))].slice(0, 20);
}

function normalizeHotel(input = {}) {
  const hotelId = clean(input.hotel_id, 36) || null;
  if (hotelId && !UUID.test(hotelId)) throw new InvalidTransitionError('Hotel identity is invalid.');
  const canonicalName = clean(input.canonical_name, 180);
  const addressLine = clean(input.address_line, 240);
  if (canonicalName.length < 2 || addressLine.length < 5) throw new InvalidTransitionError('Hotel name and address are required.');
  return { hotel_id:hotelId, canonical_name:canonicalName, address_line:addressLine,
    region:clean(input.region, 100) || null, aliases:aliases(input.aliases),
    handoff_notes:clean(input.handoff_notes, 500) || null, active:input.active !== false };
}

function safeHotel(row) {
  if (!row) return null;
  return { hotel_id:row.hotel_id || row.id, canonical_name:row.canonical_name, address_line:row.address_line,
    region:row.region || null, aliases:Array.isArray(row.aliases) ? row.aliases : [],
    handoff_notes:row.handoff_notes || null, active:Boolean(row.active),
    order_count:Number(row.order_count) || 0, confirmed_order_count:Number(row.confirmed_order_count) || 0,
    confirmed_service_revenue:Number(row.confirmed_service_revenue) || 0,
    average_confirmed_ticket:row.average_confirmed_ticket == null ? null : Number(row.average_confirmed_ticket),
    normal_orders:Number(row.normal_orders) || 0, express_orders:Number(row.express_orders) || 0,
    new_customer_orders:Number(row.new_customer_orders) || 0, repeat_customer_orders:Number(row.repeat_customer_orders) || 0,
    last_service_at:row.last_service_at || null, currency:row.currency || 'USD' };
}

function systemHotelService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  return {
    store,
    async list(raw = {}) {
      const query = clean(raw.query, 160);
      const includeInactive = Boolean(raw.include_inactive);
      const rows = await store.listSystemHotels({ query, include_inactive:includeInactive, limit:raw.limit });
      return (Array.isArray(rows) ? rows : []).map(safeHotel);
    },
    async resolveActive(hotelId) {
      if (!UUID.test(String(hotelId || ''))) throw new InvalidTransitionError('Hotel identity is invalid.');
      const rows = await store.listSystemHotels({ query:'', include_inactive:false, limit:200 });
      const hotel = (Array.isArray(rows) ? rows : []).find((row) => (row.hotel_id || row.id) === hotelId);
      if (!hotel) throw new InvalidTransitionError('Active hotel not found.');
      return safeHotel(hotel);
    },
    async save(raw, actor) {
      if (!actor || actor.role !== 'owner') throw new InvalidTransitionError('Owner authorization is required.');
      const hotel = normalizeHotel(raw);
      const idempotencyKey = clean(raw.idempotency_key, 100) || `hotel:${crypto.randomUUID()}`;
      const saved = await store.upsertSystemHotel({ ...hotel, actor, idempotency_key:idempotencyKey });
      return safeHotel(saved);
    }
  };
}

module.exports = { systemHotelService, normalizeHotel, safeHotel };
