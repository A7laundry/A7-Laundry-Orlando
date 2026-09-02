'use strict';

const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { leadReference, leadIdFromReference } = require('./system-lead-reference.js');

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeDetail(row, env) {
  if (!row) return null;
  const operational = row.operational_data && typeof row.operational_data === 'object'
    ? row.operational_data : {};
  return {
    lead_ref:leadReference(row.lead_id || row.id, env),
    status:['new', 'qualifying', 'qualified'].includes(row.status) ? row.status : 'unknown',
    lead_origin:row.lead_origin === 'order_form' ? 'order_form' : 'inbound',
    customer_name:clean(row.customer_name || operational.name, 100) || 'Customer',
    whatsapp_number:clean(row.whatsapp_number || operational.whatsapp_number, 24) || null,
    language:clean(row.language, 12) || 'unknown',
    customer_type:clean(row.customer_type, 24) || 'guest',
    accommodation_type:clean(row.accommodation_type, 24) || null,
    service_type:clean(row.service_type, 80) || null,
    lead_reference:clean(row.lead_reference, 10) || null,
    property:clean(operational.property, 180) || null,
    property_address:clean(operational.pickup_address || operational.property_address, 300) || null,
    room:clean(operational.room, 40) || null,
    location_notes:clean(operational.handoff_notes || operational.location_notes, 500) || null,
    pickup_window_start:operational.pickup_window_start || null,
    pickup_window_end:operational.pickup_window_end || null,
    needed_by:operational.needed_by || null,
    estimated_lbs:operational.estimated_lbs == null ? null : Number(operational.estimated_lbs),
    service_tier_preference:['normal', 'express'].includes(operational.service_tier_preference)
      ? operational.service_tier_preference : 'normal',
    analytics_identity_present:Boolean(operational.analytics_context?.client_id),
    created_at:row.created_at || null
  };
}

function systemLeadService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const env = options.env || process.env;
  return {
    store,
    async getByReference(reference) {
      const leadId = leadIdFromReference(reference, env);
      return safeDetail(await store.getSystemActionableLeadById(leadId), env);
    }
  };
}

module.exports = { systemLeadService, safeDetail };
