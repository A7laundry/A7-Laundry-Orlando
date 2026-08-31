'use strict';

const crypto = require('node:crypto');
const attribution = require('../a7-attribution.js');
const { createAttributionStore } = require('./attribution-store.js');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { deliverOutbox } = require('./ga4-server.js');

const LEAD_ORIGINS = new Set(['order_form', 'whatsapp_inbound', 'manual']);
const CUSTOMER_TYPES = new Set(['guest', 'host', 'commercial', 'resident', 'unknown']);
const LANGUAGES = new Set(['en', 'pt', 'es', 'other', 'unknown']);
const PRICING_MODELS = new Set(['per_lb', 'fixed']);
const SERVICE_TIERS = new Set(['normal', 'express']);
const LEAD_STATUS_EVENTS = new Set(['lead_qualification_started', 'lead_disqualified', 'lead_lost']);
const LIFECYCLE_EVENTS = new Set([
  'pickup_scheduled', 'pickup_completed', 'order_weighed', 'invoice_created',
  'order_ready_for_delivery', 'order_delivered', 'order_cancelled'
]);
const GA_CLIENT_ID_PATTERN = /^\d{1,20}\.\d{1,20}$/;
const GA_SESSION_ID_PATTERN = /^\d{1,20}$/;

function clean(value, max = 160) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function opaqueEventId(eventName, idempotencyKey) {
  const digest = crypto.createHash('sha256').update(`${eventName}|${idempotencyKey}`).digest('hex').slice(0, 32);
  return `${eventName}:${digest}`;
}

function requireIdempotency(value) {
  const key = clean(value, 200);
  if (!key) throw new InvalidTransitionError('idempotency_key is required.');
  return key;
}

function safeEnum(value, allowed, fallback) {
  const normalized = clean(value, 80) || fallback;
  if (!allowed.has(normalized)) throw new InvalidTransitionError(`Unsupported value: ${normalized}.`);
  return normalized;
}

function safeAnalyticsContext(value) {
  if (!value || typeof value !== 'object') return null;
  const clientId = clean(value.client_id || value.ga_client_id, 48);
  const sessionId = clean(value.session_id || value.ga_session_id, 24);
  return {
    client_id: GA_CLIENT_ID_PATTERN.test(clientId) ? clientId : null,
    session_id: GA_SESSION_ID_PATTERN.test(sessionId) ? sessionId : null
  };
}

async function resolveAttribution(input, store) {
  const shortRef = clean(input.lead_reference, 10).toUpperCase();
  const attributionId = clean(input.attribution_id, 64);
  try {
    let record = null;
    if (attribution.validAttributionId(attributionId)) record = await store.get(attributionId);
    if (!record && attribution.validShortRef(shortRef)) record = await store.getByShortRef(shortRef);
    if (!record) return {
      record: null,
      attribution_id: null,
      lead_reference: attribution.validShortRef(shortRef) ? shortRef : null,
      resolution: ['ctwa', 'prior_customer'].includes(input.attribution_resolution)
        ? input.attribution_resolution : 'unknown'
    };
    return {
      record,
      attribution_id: record.attribution_id,
      lead_reference: record.short_ref,
      resolution: attribution.validAttributionId(attributionId) ? 'attribution_id' : 'short_ref'
    };
  } catch (_) {
    return {
      record: null,
      attribution_id: null,
      lead_reference: attribution.validShortRef(shortRef) ? shortRef : null,
      resolution: ['ctwa', 'prior_customer'].includes(input.attribution_resolution)
        ? input.attribution_resolution : 'unknown'
    };
  }
}

function service(options = {}) {
  const operationalStore = options.operationalStore || createOperationalStore(options);
  const attributionStore = options.attributionStore || createAttributionStore(options);

  async function createLead(input = {}) {
    const idempotencyKey = requireIdempotency(input.idempotency_key);
    const origin = safeEnum(input.lead_origin, LEAD_ORIGINS, 'manual');
    const customerType = safeEnum(input.customer_type, CUSTOMER_TYPES, 'unknown');
    const language = safeEnum(input.language, LANGUAGES, 'unknown');
    const resolved = await resolveAttribution(input, attributionStore);
    return operationalStore.createLead({
      idempotency_key: idempotencyKey,
      event_id: opaqueEventId('generate_lead', idempotencyKey),
      lead_origin: origin,
      conversation_id: input.conversation_id || null,
      customer_id: input.customer_id || null,
      attribution_id: resolved.attribution_id,
      lead_reference: resolved.lead_reference,
      attribution_resolution: resolved.resolution,
      service_type: clean(input.service_type, 80) || null,
      customer_type: customerType,
      language,
      accommodation_type: clean(input.accommodation_type, 80) || null,
      service_area_bucket: clean(input.service_area_bucket, 120) || null,
      operational_data: input.operational_data && typeof input.operational_data === 'object'
        ? input.operational_data : {},
      occurred_at: input.occurred_at
    });
  }

  async function qualifyLead(input = {}) {
    const idempotencyKey = requireIdempotency(input.idempotency_key);
    const leadId = clean(input.lead_id, 80);
    if (!leadId) throw new InvalidTransitionError('lead_id is required.');
    return operationalStore.qualifyLead({
      lead_id: leadId,
      event_id: opaqueEventId('qualified_guest_lead', idempotencyKey),
      idempotency_key: idempotencyKey,
      service_type: clean(input.service_type, 80),
      service_area_accepted: input.service_area_accepted === true,
      timing_accepted: input.timing_accepted === true,
      minimum_basis_accepted: input.minimum_basis_accepted === true,
      occurred_at: input.occurred_at
    });
  }

  async function updateLeadStatus(input = {}) {
    const idempotencyKey = requireIdempotency(input.idempotency_key);
    const eventName = safeEnum(input.event_name, LEAD_STATUS_EVENTS, '');
    const leadId = clean(input.lead_id, 80);
    if (!leadId) throw new InvalidTransitionError('lead_id is required.');
    return operationalStore.updateLeadStatus({
      lead_id: leadId,
      event_name: eventName,
      event_id: opaqueEventId(eventName, idempotencyKey),
      idempotency_key: idempotencyKey,
      reason: clean(input.reason, 160) || null,
      occurred_at: input.occurred_at
    });
  }

  async function acceptOrder(input = {}) {
    const idempotencyKey = requireIdempotency(input.idempotency_key);
    const leadId = clean(input.lead_id, 80);
    if (!leadId) throw new InvalidTransitionError('lead_id is required.');
    const pricingModel = safeEnum(input.pricing_model, PRICING_MODELS, 'per_lb');
    const serviceTier = clean(input.service_tier, 40) || null;
    if (serviceTier && !SERVICE_TIERS.has(serviceTier)) {
      throw new InvalidTransitionError(`Unsupported value: ${serviceTier}.`);
    }
    const estimatedLbs = input.estimated_lbs == null || input.estimated_lbs === ''
      ? null : Number(input.estimated_lbs);
    if (estimatedLbs !== null && (!Number.isFinite(estimatedLbs) || estimatedLbs <= 0 || estimatedLbs > 500)) {
      throw new InvalidTransitionError('estimated_lbs is invalid.');
    }
    const lead = await operationalStore.getLead(leadId);
    if (!lead) throw new InvalidTransitionError('Lead not found.');
    const resolved = await resolveAttribution(lead, attributionStore);
    const eventId = opaqueEventId('order_accepted', idempotencyKey);
    const analyticsContext = safeAnalyticsContext(input.analytics_context || lead.operational_data?.analytics_context);
    const result = await operationalStore.acceptOrder({
      lead_id: leadId,
      event_id: eventId,
      idempotency_key: idempotencyKey,
      service_type: clean(input.service_type || lead.service_type, 80),
      service_tier: serviceTier,
      pricing_model: pricingModel,
      pickup_window_start: input.pickup_window_start || null,
      pickup_window_end: input.pickup_window_end || null,
      estimated_lbs: estimatedLbs,
      attribution_record: resolved.record,
      analytics_context: analyticsContext,
      occurred_at: input.occurred_at
    });
    if (!result.duplicate) await deliverOutbox(operationalStore, eventId, options).catch(() => null);
    return result;
  }

  async function recordTransition(input = {}) {
    const idempotencyKey = requireIdempotency(input.idempotency_key);
    const eventName = safeEnum(input.event_name, LIFECYCLE_EVENTS, '');
    const orderId = clean(input.order_id, 80);
    if (!orderId) throw new InvalidTransitionError('order_id is required.');
    let payload = input.payload && typeof input.payload === 'object' ? { ...input.payload } : {};
    if (eventName === 'invoice_created') {
      const serviceAmount = Number(payload.service_amount);
      const tipAmount = payload.tip_amount == null || payload.tip_amount === '' ? 0 : Number(payload.tip_amount);
      if (!Number.isFinite(serviceAmount) || serviceAmount <= 0 || !Number.isFinite(tipAmount) || tipAmount !== 0) {
        throw new InvalidTransitionError('Invoice amounts are invalid; tips are not enabled in the MVP.');
      }
      const amountDue = payload.amount_due == null || payload.amount_due === ''
        ? serviceAmount : Number(payload.amount_due);
      if (!Number.isFinite(amountDue) || amountDue !== serviceAmount) {
        throw new InvalidTransitionError('amount_due must equal eligible service revenue in the MVP.');
      }
      payload = { ...payload, service_amount: serviceAmount, tip_amount: 0, amount_due: amountDue };
    }
    return operationalStore.recordTransition({
      order_id: orderId,
      event_name: eventName,
      event_id: opaqueEventId(eventName, idempotencyKey),
      idempotency_key: idempotencyKey,
      source_system: 'operations',
      payload,
      occurred_at: input.occurred_at
    });
  }

  return { createLead, updateLeadStatus, qualifyLead, acceptOrder, recordTransition, operationalStore, attributionStore };
}

module.exports = {
  service,
  resolveAttribution,
  opaqueEventId,
  clean,
  safeAnalyticsContext,
  LEAD_ORIGINS,
  CUSTOMER_TYPES,
  LANGUAGES,
  PRICING_MODELS,
  SERVICE_TIERS,
  LEAD_STATUS_EVENTS,
  LIFECYCLE_EVENTS
};
