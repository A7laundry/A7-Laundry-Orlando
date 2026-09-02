'use strict';

const crypto = require('node:crypto');
const { service, safeAnalyticsContext } = require('./operational-lifecycle.js');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { resolveItems } = require('./system-catalog.js');
const { deliverOutbox } = require('./ga4-server.js');
const { customerIdFromReference } = require('./system-customer-service.js');
const { leadIdFromReference } = require('./system-lead-reference.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REF = /^[23456789A-HJ-NP-Z]{10}$/;
const TYPES = new Set(['guest', 'host', 'resident']);
const ACCOMMODATIONS = new Set(['hotel', 'airbnb', 'residence']);
const LANGUAGES = new Set(['en', 'pt', 'es', 'other']);
const TIERS = new Set(['normal', 'express']);
const PICKUP_LOCATIONS = new Set([
  'bell_services', 'front_desk', 'guest_room', 'airbnb_residence', 'meet_customer', 'other'
]);
const CARE_OPTIONS = new Set(['no_dryer', 'hand_wash', 'hypoallergenic', 'custom_care']);
const AGREED_MINIMUMS = new Set([50, 60]);
const ORDER_NUMBER = /^(?:A7-ORL-\d{4,}|MCO \d{4,})$/;
const MCO_LOOKUP = /^MCO[\s-]*(\d{4,12})$/;

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeOrderNumber(value) {
  const input = clean(value, 32).toUpperCase();
  if (/^\d{4,12}$/.test(input)) return `MCO ${input}`;
  const mco = input.match(MCO_LOOKUP);
  if (mco) return `MCO ${mco[1]}`;
  return ORDER_NUMBER.test(input) ? input : null;
}

function phone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) {
    throw new InvalidTransitionError('Enter the WhatsApp number with country code (8 to 15 digits).');
  }
  return digits;
}

function date(value, label) {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) throw new InvalidTransitionError(`${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function suggestPromisedBy(pickupWindowStart) {
  const start = Date.parse(pickupWindowStart || '');
  if (!Number.isFinite(start)) return null;
  return new Date(start + 8 * 60 * 60 * 1000).toISOString();
}

function validate(input = {}) {
  const submissionId = clean(input.submission_id, 64).toLowerCase();
  if (!UUID.test(submissionId)) throw new InvalidTransitionError('submission_id is invalid.');
  const name = clean(input.name, 100);
  const customerType = clean(input.customer_type, 24) || 'guest';
  const accommodation = clean(input.accommodation_type, 24);
  const language = clean(input.language, 12) || 'en';
  const tier = clean(input.service_tier, 12);
  const property = clean(input.property, 180);
  const hotelId = clean(input.hotel_id, 36) || null;
  if (hotelId && (!UUID.test(hotelId) || accommodation !== 'hotel')) {
    throw new InvalidTransitionError('Hotel identity is invalid.');
  }
  if (!name || !property || !TYPES.has(customerType) || !ACCOMMODATIONS.has(accommodation)
    || !LANGUAGES.has(language) || !TIERS.has(tier)) throw new InvalidTransitionError('Manual order fields are invalid.');
  const start = date(input.pickup_window_start, 'Pickup window');
  const end = date(input.pickup_window_end, 'Pickup window');
  const neededBy = date(input.needed_by, 'Needed-by time');
  if (Date.parse(end) <= Date.parse(start) || Date.parse(neededBy) <= Date.parse(start)) {
    throw new InvalidTransitionError('Pickup and needed-by timing are inconsistent.');
  }
  const promisedBy = tier === 'express' ? date(input.promised_by, 'Promised delivery') : null;
  if (tier === 'express' && Date.parse(promisedBy) <= Date.parse(start)) {
    throw new InvalidTransitionError('Express promised delivery must be after pickup.');
  }
  const leadReference = clean(input.lead_reference, 10).toUpperCase();
  if (leadReference && !REF.test(leadReference)) throw new InvalidTransitionError('A7 Ref is invalid.');
  let items = resolveItems(input.items, tier);
  const agreedMinimum = input.agreed_minimum_amount == null || input.agreed_minimum_amount === ''
    ? 50 : Number(input.agreed_minimum_amount);
  if (!AGREED_MINIMUMS.has(agreedMinimum)) {
    throw new InvalidTransitionError('Agreed minimum must be an approved sale-time value.');
  }
  items = items.map((item) => item.service_type === 'wash_fold_guest'
    ? { ...item, minimum_amount:agreedMinimum } : item);
  const wash = items.find((item) => item.service_type === 'wash_fold_guest');
  const pickupLocation = clean(input.pickup_location, 32);
  if (!PICKUP_LOCATIONS.has(pickupLocation)) throw new InvalidTransitionError('Pickup location is invalid.');
  const bagsExpected = input.bags_expected == null || input.bags_expected === ''
    ? null : Number(input.bags_expected);
  if (bagsExpected !== null && (!Number.isInteger(bagsExpected) || bagsExpected < 1 || bagsExpected > 100)) {
    throw new InvalidTransitionError('Expected bags must be a whole number between 1 and 100.');
  }
  const careOptions = Array.isArray(input.care_options) ? [...new Set(input.care_options.map((value) => clean(value, 32)))] : [];
  if (careOptions.length > CARE_OPTIONS.size || careOptions.some((value) => !CARE_OPTIONS.has(value))) {
    throw new InvalidTransitionError('Special care options are invalid.');
  }
  return {
    submission_id: submissionId,
    name,
    whatsapp_number: phone(input.whatsapp_number),
    language,
    customer_type: customerType,
    accommodation_type: accommodation,
    hotel_id: hotelId,
    property,
    property_address: clean(input.property_address, 240) || null,
    room: clean(input.room, 40) || null,
    location_notes: clean(input.location_notes, 500) || null,
    pickup_location: pickupLocation,
    bags_expected: bagsExpected,
    care_options: careOptions,
    service_tier: tier,
    agreed_minimum_amount: agreedMinimum,
    pickup_window_start: start,
    pickup_window_end: end,
    needed_by: neededBy,
    promised_by:promisedBy,
    order_notes: clean(input.order_notes, 500) || null,
    lead_reference: leadReference || null,
    service_type: wash ? 'wash_fold_guest' : items[0].service_type,
    pricing_model: items.some((item) => item.unit === 'lb') ? 'per_lb' : 'fixed',
    estimated_lbs: wash?.estimated_lbs || null,
    items,
    analytics_context: safeAnalyticsContext(input.analytics_context)
  };
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function safeResult(result, input) {
  return {
    duplicate: Boolean(result.duplicate),
    customer_reused: Boolean(result.customer_reused),
    is_repeat_customer: result.is_repeat_customer == null ? null : Boolean(result.is_repeat_customer),
    order_number: result.order_number,
    pickup_order_path: `/sistema/orders/${encodeURIComponent(result.order_number)}/pickup-order`,
    customer_name: input.name,
    property: input.property,
    accommodation_type: input.accommodation_type,
    hotel_id: input.hotel_id,
    service_tier: input.service_tier,
    promised_by:input.promised_by,
    pickup_window_start: input.pickup_window_start,
    pickup_window_end: input.pickup_window_end,
    next_action: 'AGENDAR COLETA',
    items: input.items.map((item) => ({
      label: item.label, unit: item.unit, unit_price: item.unit_price,
      minimum_amount: item.minimum_amount, requires_manual_review: item.requires_manual_review
    }))
  };
}

async function createInMemory(input, actor, store, options, knownCustomerId = null) {
  store.manualRequests ||= new Map();
  store.orderItems ||= new Map();
  store.operatorAudit ||= new Map();
  store.mcoOrderSequence ||= 1001;
  const key = input.submission_id;
  const requestFingerprint = fingerprint(input);
  const existing = store.manualRequests.get(key);
  if (existing) {
    if (existing.fingerprint !== requestFingerprint) throw new InvalidTransitionError('Idempotency key conflicts with another manual order.');
    return safeResult({
      duplicate:true,
      order_number:existing.order_number,
      customer_reused:Boolean(knownCustomerId),
      is_repeat_customer:store.orders.get(existing.order_id)?.is_repeat_customer
    }, input);
  }
  const snapshot = structuredClone({
    customers: [...store.customers], leads: [...store.leads], orders: [...store.orders], events: [...store.events],
    eventKeys: [...store.eventKeys], outbox: [...store.outbox], orderItems: [...store.orderItems],
    operatorAudit: [...store.operatorAudit], mcoOrderSequence: store.mcoOrderSequence
  });
  try {
    const customer = knownCustomerId
      ? structuredClone(store.customers.get(knownCustomerId))
      : await store.upsertCustomer({ wa_id: input.whatsapp_number, profile_name: input.name });
    if (!customer) throw new InvalidTransitionError('Known customer was not found.');
    const lifecycle = service({ ...options, operationalStore: store });
    const lead = await lifecycle.createLead({
      idempotency_key: `manual:${key}`, lead_origin: 'manual', customer_id: customer.id,
      lead_reference: input.lead_reference, service_type: input.service_type,
      attribution_resolution:knownCustomerId ? 'prior_customer' : 'unknown',
      customer_type: input.customer_type, language: input.language,
      accommodation_type: input.accommodation_type, service_area_bucket: 'orlando_pending_route',
      operational_data: {
        hotel_id:input.hotel_id, property: input.property, property_address: input.property_address, room: input.room,
        location_notes: input.location_notes, pickup_location: input.pickup_location,
        bags_expected: input.bags_expected, care_options: input.care_options,
        pickup_window_start: input.pickup_window_start, pickup_window_end: input.pickup_window_end,
        needed_by: input.needed_by, order_notes: input.order_notes,
        analytics_context: input.analytics_context
      }
    });
    await lifecycle.qualifyLead({
      idempotency_key: `manual:qualify:${key}`, lead_id: lead.lead.id, service_type: input.service_type,
      service_area_accepted: true, timing_accepted: true, minimum_basis_accepted: true
    });
    const accepted = await lifecycle.acceptOrder({
      idempotency_key: `manual:accept:${key}`, lead_id: lead.lead.id,
      service_type: input.service_type, service_tier: input.service_tier,
      pricing_model: input.pricing_model, pickup_window_start: input.pickup_window_start,
      pickup_window_end: input.pickup_window_end, estimated_lbs: input.estimated_lbs,
      analytics_context: input.analytics_context
    });
    store.mcoOrderSequence += 1;
    accepted.order.order_number = `MCO ${store.mcoOrderSequence}`;
    accepted.order.hotel_id = input.hotel_id;
    const createdLead = store.leads.get(accepted.order.lead_id);
    if (createdLead) createdLead.hotel_id = input.hotel_id;
    accepted.order.bags_expected = input.bags_expected;
    accepted.order.promised_by = input.promised_by;
    accepted.order.promise_version = input.promised_by ? 1 : 0;
    accepted.order.payment_total = null;
    store.orders.set(accepted.order.id, structuredClone(accepted.order));
    store.orderItems.set(accepted.order.id, input.items.map((item) => ({
      id:crypto.randomUUID(), order_id:accepted.order.id, ...item,
      actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0
    })));
    store.operatorAudit.set(key, {
      actor_id:actor.actor_id,
      actor_role:actor.role,
      action:knownCustomerId ? 'known_customer_order_created' : 'manual_order_created',
      order_id:accepted.order.id
    });
    store.manualRequests.set(key, { fingerprint: requestFingerprint, order_id: accepted.order.id, order_number: accepted.order.order_number });
    return safeResult({
      duplicate: false,
      order_number: accepted.order.order_number,
      customer_reused:Boolean(knownCustomerId),
      is_repeat_customer:accepted.order.is_repeat_customer
    }, input);
  } catch (error) {
    for (const [name, rows] of Object.entries(snapshot)) {
      if (name === 'mcoOrderSequence') store.mcoOrderSequence = rows;
      else store[name] = new Map(rows);
    }
    throw error;
  }
}

async function acceptExistingInMemory(input, actor, store, options, leadId, requestFingerprint) {
  store.manualRequests ||= new Map();
  store.orderItems ||= new Map();
  store.operatorAudit ||= new Map();
  store.mcoOrderSequence ||= 1001;
  const key = input.submission_id;
  const existing = store.manualRequests.get(key);
  if (existing) {
    if (existing.fingerprint !== requestFingerprint || existing.lead_id !== leadId) {
      throw new InvalidTransitionError('Idempotency key conflicts with another order.');
    }
    return safeResult({ duplicate:true, order_number:existing.order_number,
      customer_reused:true, is_repeat_customer:false }, input);
  }
  const lead = await store.getSystemActionableLeadById(leadId);
  if (!lead) throw new InvalidTransitionError('Lead is no longer awaiting confirmation.');
  const snapshot = structuredClone({
    leads:[...store.leads], orders:[...store.orders], events:[...store.events], eventKeys:[...store.eventKeys],
    outbox:[...store.outbox], orderItems:[...store.orderItems], operatorAudit:[...store.operatorAudit],
    manualRequests:[...store.manualRequests], mcoOrderSequence:store.mcoOrderSequence
  });
  try {
    const storedLead = store.leads.get(leadId);
    storedLead.operational_data = { ...storedLead.operational_data,
      hotel_id:input.hotel_id, property:input.property, property_address:input.property_address,
      room:input.room, location_notes:input.location_notes, pickup_location:input.pickup_location,
      bags_expected:input.bags_expected, care_options:input.care_options,
      pickup_window_start:input.pickup_window_start, pickup_window_end:input.pickup_window_end,
      needed_by:input.needed_by, promised_by:input.promised_by, order_notes:input.order_notes };
    const lifecycle = service({ ...options, operationalStore:store });
    await lifecycle.qualifyLead({ idempotency_key:`existing-lead:qualify:${key}`, lead_id:leadId,
      service_type:input.service_type, service_area_accepted:true, timing_accepted:true,
      minimum_basis_accepted:true });
    const accepted = await lifecycle.acceptOrder({ idempotency_key:`existing-lead:accept:${key}`,
      lead_id:leadId, service_type:input.service_type, service_tier:input.service_tier,
      pricing_model:input.pricing_model, pickup_window_start:input.pickup_window_start,
      pickup_window_end:input.pickup_window_end, estimated_lbs:input.estimated_lbs });
    store.mcoOrderSequence += 1;
    accepted.order.order_number = `MCO ${store.mcoOrderSequence}`;
    accepted.order.hotel_id = input.hotel_id;
    accepted.order.bags_expected = input.bags_expected;
    accepted.order.promised_by = input.promised_by;
    accepted.order.promise_version = input.promised_by ? 1 : 0;
    store.orders.set(accepted.order.id, structuredClone(accepted.order));
    store.orderItems.set(accepted.order.id, input.items.map((item) => ({
      id:crypto.randomUUID(), order_id:accepted.order.id, ...item,
      actual_lbs:null, weighed_at:null, subtotal:null, weight_version:0
    })));
    store.operatorAudit.set(`existing-lead:${key}`, { actor_id:actor.actor_id, actor_role:actor.role,
      action:'existing_lead_order_created', order_id:accepted.order.id });
    store.manualRequests.set(key, { fingerprint:requestFingerprint, lead_id:leadId,
      order_id:accepted.order.id, order_number:accepted.order.order_number });
    return safeResult({ duplicate:false, order_number:accepted.order.order_number,
      customer_reused:true, is_repeat_customer:accepted.order.is_repeat_customer }, input);
  } catch (error) {
    for (const [name, rows] of Object.entries(snapshot)) {
      if (name === 'mcoOrderSequence') store.mcoOrderSequence = rows;
      else store[name] = new Map(rows);
    }
    throw error;
  }
}

function systemOrderService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  async function withGovernedHotel(input) {
    if (!input.hotel_id) return input;
    const rows = await store.listSystemHotels({ query:'', include_inactive:false, limit:200 });
    const hotel = (Array.isArray(rows) ? rows : []).find((row) => (row.hotel_id || row.id) === input.hotel_id);
    if (!hotel) throw new InvalidTransitionError('Active hotel not found.');
    return { ...input, property:hotel.canonical_name, property_address:hotel.address_line };
  }
  return {
    store,
    async createManualOrder(raw, actor) {
      if (!actor || !['owner', 'manager', 'operator'].includes(actor.role)) throw new InvalidTransitionError('Operator authorization is required.');
      // Manual W1A orders may resolve attribution through an A7 Ref, but the operator/browser
      // is never trusted to supply an analytics identity.
      const input = await withGovernedHotel(validate({ ...raw, analytics_context: null }));
      if (store.mode === 'memory') return createInMemory(input, actor, store, options);
      const result = await store.createManualOrder({ ...input, request_fingerprint: fingerprint(input), actor });
      if (!result.duplicate) {
        await deliverOutbox(store, `order_accepted:${input.submission_id}`, options).catch(() => null);
      }
      return safeResult(result, input);
    },
    async createKnownCustomerOrder(raw, actor) {
      if (!actor || !['owner', 'manager', 'operator'].includes(actor.role)) {
        throw new InvalidTransitionError('Operator authorization is required.');
      }
      const customerId = customerIdFromReference(raw.customer_ref, options.env || process.env);
      const customer = await store.getSystemCustomerById(customerId);
      if (!customer) throw new InvalidTransitionError('Known customer was not found.');
      const input = await withGovernedHotel(validate({
        ...raw,
        name:customer.profile_name,
        whatsapp_number:customer.whatsapp_number,
        language:raw.language || customer.language || 'en',
        customer_type:raw.customer_type || customer.customer_type || 'guest',
        analytics_context:null
      }));
      const protectedInput = { ...input, known_customer_id:customerId };
      const requestFingerprint = fingerprint(protectedInput);
      const retry = await store.resolveKnownCustomerOrderRetry({
        submission_id:input.submission_id,
        request_fingerprint:requestFingerprint,
        customer_id:customerId
      });
      if (retry) return safeResult(retry, input);
      if (Number(customer.order_count) < 1) {
        throw new InvalidTransitionError('Known customer requires prior real order history.');
      }
      if (store.mode === 'memory') return createInMemory(protectedInput, actor, store, options, customerId);
      const result = await store.createKnownCustomerOrder({
        ...protectedInput,
        customer_id:customerId,
        request_fingerprint:requestFingerprint,
        actor
      });
      if (!result.duplicate) {
        await deliverOutbox(store, `order_accepted:${input.submission_id}`, options).catch(() => null);
      }
      return safeResult(result, input);
    },
    async createExistingLeadOrder(raw, actor) {
      if (!actor || !['owner', 'manager', 'operator'].includes(actor.role)) {
        throw new InvalidTransitionError('Operator authorization is required.');
      }
      const leadId = leadIdFromReference(raw.lead_ref, options.env || process.env);
      const requestFingerprint = fingerprint({ existing_lead_id:leadId, request:raw });
      const retry = await store.resolveExistingLeadOrderRetry({ submission_id:raw.submission_id,
        request_fingerprint:requestFingerprint, lead_id:leadId });
      if (retry) return { ...retry, pickup_order_path:`/sistema/orders/${encodeURIComponent(retry.order_number)}/pickup-order`,
        next_action:'AGENDAR COLETA' };
      const lead = await store.getSystemActionableLeadById(leadId);
      if (!lead) throw new InvalidTransitionError('Lead is no longer awaiting confirmation.');
      const input = await withGovernedHotel(validate({
        ...raw,
        name:lead.customer_name,
        whatsapp_number:lead.whatsapp_number,
        language:lead.language || 'en',
        customer_type:lead.customer_type || 'guest',
        accommodation_type:lead.accommodation_type,
        service_type:lead.service_type,
        lead_reference:lead.lead_reference,
        analytics_context:null
      }));
      const protectedInput = { ...input, existing_lead_id:leadId };
      if (store.mode === 'memory') return acceptExistingInMemory(input, actor, store, options, leadId, requestFingerprint);
      const result = await store.createExistingLeadOrder({ ...protectedInput, lead_id:leadId,
        request_fingerprint:requestFingerprint, actor });
      if (!result.duplicate) {
        await deliverOutbox(store, `order_accepted:existing:${input.submission_id}`, options).catch(() => null);
      }
      return safeResult(result, input);
    },
    async getByOrderNumber(orderNumber) {
      const value = normalizeOrderNumber(orderNumber);
      if (!value) throw new InvalidTransitionError('Order number is invalid. Use 1002 or MCO 1002.');
      let row = await store.getSystemOrderByNumber(value);
      if (!row && /^MCO \d+$/.test(value)) {
        row = await store.getSystemOrderByNumber(value.replace(/^MCO /, 'A7-ORL-'));
      }
      if (!row) return null;
      return row;
    },
    async getPickupOrderByNumber(orderNumber) {
      const value = normalizeOrderNumber(orderNumber);
      if (!value) throw new InvalidTransitionError('Order number is invalid. Use 1002 or MCO 1002.');
      let row = await store.getSystemPickupOrderByNumber(value);
      if (!row && /^MCO \d+$/.test(value)) {
        row = await store.getSystemPickupOrderByNumber(value.replace(/^MCO /, 'A7-ORL-'));
      }
      return row;
    }
  };
}

module.exports = { systemOrderService, validate, fingerprint, safeResult, normalizeOrderNumber,
  suggestPromisedBy, ORDER_NUMBER };
