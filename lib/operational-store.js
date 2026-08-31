'use strict';

const crypto = require('node:crypto');
const { supabaseHeaders } = require('./supabase-headers.js');

class OperationalStoreError extends Error {
  constructor(message, code = 'operational_store_error') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class OperationalStorageUnavailableError extends OperationalStoreError {
  constructor(message = 'Operational storage is unavailable.') {
    super(message, 'operational_storage_unavailable');
  }
}

class InvalidTransitionError extends OperationalStoreError {
  constructor(message = 'Invalid operational transition.') {
    super(message, 'invalid_transition');
  }
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function iso(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) throw new InvalidTransitionError('Invalid event timestamp.');
  return date.toISOString();
}

function required(value, label) {
  const clean = String(value || '').trim();
  if (!clean) throw new InvalidTransitionError(`${label} is required.`);
  return clean;
}

function hasQaMarker(value) {
  return /(?:^|[^A-Z0-9])QA(?:[^A-Z0-9]|$)|DO NOT FULFILL|DO NOT DISPATCH/i.test(String(value || ''));
}

function isQaOrder(order, lead, customer) {
  const operational = lead?.operational_data || {};
  return Boolean(order?.is_qa) || [
    customer?.profile_name, operational.order_notes, operational.property,
    operational.location_notes
  ].some(hasQaMarker);
}

function confirmedServiceRevenue(order, payments, isQa) {
  if (!order || isQa || order.order_status === 'cancelled') return null;
  const payment = [...payments.values()].find((row) => row.order_id === order.id);
  const confirmed = new Set(['paid', 'partially_refunded', 'refunded']);
  if (!payment || !confirmed.has(payment.status) || !confirmed.has(order.payment_status)) return null;
  const serviceAmount = Number(order.service_amount);
  if (!Number.isFinite(serviceAmount)) return null;
  return Math.max(serviceAmount - (Number(payment.refund_total) || 0), 0);
}

function acquisitionSource(order) {
  const snapshot = order?.attribution_snapshot;
  if (!snapshot || snapshot.confidence !== 'deterministic') return null;
  const source = String(snapshot.first_touch?.source || '').trim();
  const medium = String(snapshot.first_touch?.medium || '').trim();
  if (!source) return null;
  return medium && medium !== source ? `${source} / ${medium}` : source;
}

class MemoryOperationalStore {
  constructor() {
    this.mode = 'memory';
    this.leads = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.events = new Map();
    this.eventKeys = new Map();
    this.payments = new Map();
    this.refunds = new Map();
    this.stripeEvents = new Map();
    this.outbox = new Map();
    this.operationalEvents = new Map();
    this.orderItems = new Map();
    this.itemWeightEvents = new Map();
    this.systemInvoices = new Map();
    this.systemInvoiceLines = new Map();
    this.systemInvoiceEvents = new Map();
    this.messageDrafts = new Map();
    this.messageDraftEvents = new Map();
    this.operationalSettings = {
      timezone: 'America/New_York', status: 'pending_approval',
      attention_minutes: null, risk_minutes: null
    };
  }

  async systemHealth() {
    return true;
  }

  async upsertCustomer(input) {
    const waId = required(input.wa_id, 'wa_id');
    const existing = [...this.customers.values()].find((row) => row.wa_id === waId);
    if (existing) {
      if (input.profile_name) existing.profile_name = String(input.profile_name).slice(0, 100);
      existing.updated_at = new Date().toISOString();
      return clone(existing);
    }
    const customer = {
      id: crypto.randomUUID(), unit_key: 'orlando', wa_id: waId,
      profile_name: input.profile_name ? String(input.profile_name).slice(0, 100) : null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    this.customers.set(customer.id, customer);
    return clone(customer);
  }

  event(input) {
    const existingId = this.eventKeys.get(input.idempotency_key);
    if (existingId) return { duplicate: true, event: clone(this.events.get(existingId)) };
    const event = {
      event_id: required(input.event_id, 'event_id'),
      idempotency_key: required(input.idempotency_key, 'idempotency_key'),
      event_name: required(input.event_name, 'event_name'),
      event_version: 1,
      source_system: required(input.source_system, 'source_system'),
      lead_id: input.lead_id || null,
      order_id: input.order_id || null,
      occurred_at: iso(input.occurred_at),
      recorded_at: new Date().toISOString(),
      payload: clone(input.payload || {}),
      schema_valid: true
    };
    if (this.events.has(event.event_id)) throw new InvalidTransitionError('event_id already exists.');
    this.events.set(event.event_id, event);
    this.eventKeys.set(event.idempotency_key, event.event_id);
    return { duplicate: false, event: clone(event) };
  }

  queue(event, analyticsContext) {
    if (!['order_accepted', 'purchase', 'refund'].includes(event.event_name)) return;
    const clientId = analyticsContext?.client_id || analyticsContext?.ga_client_id || null;
    this.outbox.set(event.event_id, {
      event_id: event.event_id,
      event_name: event.event_name,
      client_id: clientId,
      session_id: analyticsContext?.session_id || analyticsContext?.ga_session_id || null,
      safe_payload: clone(event.payload),
      occurred_at: event.occurred_at,
      delivery_status: clientId ? 'pending' : 'pending_identity',
      attempts: 0,
      created_at: new Date().toISOString()
    });
  }

  async createLead(input) {
    const key = required(input.idempotency_key, 'idempotency_key');
    const existing = [...this.leads.values()].find((lead) => lead.idempotency_key === key);
    if (existing) {
      if (existing.lead_origin !== input.lead_origin
        || existing.customer_id !== (input.customer_id || null)
        || existing.conversation_id !== (input.conversation_id || null)) {
        throw new InvalidTransitionError('Idempotency key conflicts with another lead.');
      }
      return { created: false, lead: clone(existing) };
    }
    const lead = {
      id: input.lead_id || crypto.randomUUID(),
      unit_key: 'orlando',
      idempotency_key: key,
      conversation_id: input.conversation_id || null,
      customer_id: input.customer_id || null,
      attribution_id: input.attribution_id || null,
      lead_reference: input.lead_reference || null,
      attribution_resolution: input.attribution_resolution || 'unknown',
      status: 'new',
      lead_origin: required(input.lead_origin, 'lead_origin'),
      service_type: input.service_type || null,
      customer_type: input.customer_type || 'unknown',
      language: input.language || 'unknown',
      accommodation_type: input.accommodation_type || null,
      service_area_bucket: input.service_area_bucket || null,
      operational_data: clone(input.operational_data || {}),
      created_at: iso(input.occurred_at),
      updated_at: iso(input.occurred_at),
      qualified_at: null
    };
    this.leads.set(lead.id, lead);
    this.event({
      event_id: input.event_id,
      idempotency_key: `event:${key}`,
      event_name: 'generate_lead',
      source_system: lead.lead_origin === 'whatsapp_inbound' ? 'whatsapp' : 'crm',
      lead_id: lead.id,
      occurred_at: input.occurred_at,
      payload: {
        lead_id: lead.id,
        lead_origin: lead.lead_origin,
        lead_reference: lead.lead_reference,
        service_type: lead.service_type,
        customer_type: lead.customer_type,
        attribution_resolution: lead.attribution_resolution
      }
    });
    return { created: true, lead: clone(lead) };
  }

  async qualifyLead(input) {
    const existingEvent = this.eventKeys.get(input.idempotency_key);
    const lead = this.leads.get(input.lead_id);
    if (!lead) throw new InvalidTransitionError('Lead not found.');
    if (existingEvent) {
      const event = this.events.get(existingEvent);
      if (event?.event_name !== 'qualified_guest_lead' || event?.lead_id !== input.lead_id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another transition.');
      }
      return { duplicate: true, lead: clone(lead) };
    }
    if (!input.service_area_accepted || !input.timing_accepted || !input.minimum_basis_accepted) {
      throw new InvalidTransitionError('Lead does not satisfy qualification contract.');
    }
    if (!['new', 'qualifying', 'qualified'].includes(lead.status)) throw new InvalidTransitionError('Lead cannot be qualified.');
    lead.status = 'qualified';
    lead.service_type = required(input.service_type, 'service_type');
    lead.service_area_accepted = true;
    lead.timing_accepted = true;
    lead.minimum_basis_accepted = true;
    lead.qualified_at = iso(input.occurred_at);
    lead.updated_at = new Date().toISOString();
    this.event({
      ...input,
      event_name: 'qualified_guest_lead',
      source_system: 'operations',
      payload: {
        lead_id: lead.id,
        service_type: lead.service_type,
        customer_type: lead.customer_type,
        service_area_accepted: true,
        timing_accepted: true,
        minimum_basis_accepted: true
      }
    });
    return { duplicate: false, lead: clone(lead) };
  }

  async getLead(leadId) {
    return clone(this.leads.get(leadId) || null);
  }

  async updateLeadStatus(input) {
    const existingEvent = this.eventKeys.get(input.idempotency_key);
    const lead = this.leads.get(input.lead_id);
    if (!lead) throw new InvalidTransitionError('Lead not found.');
    if (existingEvent) {
      const event = this.events.get(existingEvent);
      if (event?.event_name !== input.event_name || event?.lead_id !== input.lead_id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another transition.');
      }
      return { duplicate: true, lead: clone(lead) };
    }
    const reason = String(input.reason || '').trim() || null;
    if (input.event_name === 'lead_qualification_started') {
      if (lead.status !== 'new') throw new InvalidTransitionError('Only a new lead can start qualification.');
      lead.status = 'qualifying';
    } else if (input.event_name === 'lead_disqualified') {
      if (!['new', 'qualifying', 'qualified'].includes(lead.status) || !reason) {
        throw new InvalidTransitionError('A disqualification reason is required for an active lead.');
      }
      lead.status = 'disqualified';
      lead.disqualification_reason = reason;
    } else if (input.event_name === 'lead_lost') {
      if (!['new', 'qualifying', 'qualified'].includes(lead.status)) {
        throw new InvalidTransitionError('Only an active lead can be marked lost.');
      }
      lead.status = 'lost';
      lead.loss_reason = reason;
    } else {
      throw new InvalidTransitionError('Unsupported lead transition.');
    }
    lead.updated_at = new Date().toISOString();
    this.event({
      ...input,
      source_system: 'operations',
      payload: { lead_id: lead.id, status: lead.status, reason }
    });
    return { duplicate: false, lead: clone(lead) };
  }

  async acceptOrder(input) {
    const existingEvent = this.eventKeys.get(input.idempotency_key);
    const lead = this.leads.get(input.lead_id);
    if (!lead) throw new InvalidTransitionError('Lead not found.');
    const existingOrder = [...this.orders.values()].find((order) => order.lead_id === input.lead_id);
    if (existingEvent) {
      const event = this.events.get(existingEvent);
      if (!existingOrder || event?.event_name !== 'order_accepted' || event?.lead_id !== input.lead_id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another transition.');
      }
      return { duplicate: true, order: clone(existingOrder) };
    }
    if (lead.status !== 'qualified') throw new InvalidTransitionError('Qualified lead required.');
    const priorOrders = lead.customer_id
      ? [...this.orders.values()].filter((order) => order.customer_id === lead.customer_id).length
      : 0;
    const record = input.attribution_record || null;
    const confidence = record ? 'deterministic'
      : ['ctwa', 'prior_customer'].includes(lead.attribution_resolution) ? 'partial' : 'unattributed';
    const order = {
      id: input.order_id || crypto.randomUUID(),
      unit_key: 'orlando',
      lead_id: lead.id,
      customer_id: lead.customer_id,
      service_type: required(input.service_type, 'service_type'),
      customer_type: lead.customer_type,
      service_tier: input.service_tier || null,
      pricing_model: input.pricing_model || 'per_lb',
      order_status: 'accepted',
      payment_status: 'pending',
      custody_state: 'with_customer',
      production_state: 'awaiting_intake',
      promised_by: null,
      promise_version: 0,
      operational_waiting_since: iso(input.occurred_at),
      accepted_at: iso(input.occurred_at),
      pickup_window_start: input.pickup_window_start || null,
      pickup_window_end: input.pickup_window_end || null,
      estimated_lbs: input.estimated_lbs == null ? null : Number(input.estimated_lbs),
      actual_lbs: null,
      weighed_at: null,
      service_amount: null,
      tip_amount: null,
      currency: null,
      invoice_id: null,
      payment_id: null,
      paid_at: null,
      delivered_at: null,
      attribution_confidence: confidence,
      attribution_snapshot: {
        attribution_id: record?.attribution_id || null,
        lead_reference: lead.lead_reference,
        confidence,
        first_touch: clone(record?.first_touch || null),
        last_touch: clone(record?.last_touch || null),
        ga_client_id: input.analytics_context?.client_id || null,
        ga_session_id: input.analytics_context?.session_id || null,
        contract_version: 1,
        created_at: new Date().toISOString()
      },
      is_repeat_customer: priorOrders > 0,
      customer_order_number: priorOrders + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1
    };
    this.orders.set(order.id, order);
    lead.status = 'order_accepted';
    lead.updated_at = new Date().toISOString();
    const result = this.event({
      ...input,
      event_name: 'order_accepted',
      source_system: 'operations',
      order_id: order.id,
      payload: {
        lead_id: lead.id,
        order_id: order.id,
        service_type: order.service_type,
        customer_type: order.customer_type,
        service_area_bucket: lead.service_area_bucket,
        is_repeat_customer: order.is_repeat_customer,
        attribution_confidence: confidence
      }
    });
    this.queue(result.event, input.analytics_context);
    return { duplicate: false, order: clone(order) };
  }

  async recordTransition(input) {
    const existingEvent = this.eventKeys.get(input.idempotency_key);
    const order = this.orders.get(input.order_id);
    if (!order) throw new InvalidTransitionError('Order not found.');
    if (existingEvent) {
      const event = this.events.get(existingEvent);
      if (event?.event_name !== input.event_name || event?.order_id !== input.order_id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another transition.');
      }
      return { duplicate: true, order: clone(order) };
    }
    const when = iso(input.occurred_at);
    const payload = input.payload || {};
    if (input.event_name === 'pickup_scheduled') {
      const start = new Date(payload.pickup_window_start || '');
      const end = new Date(payload.pickup_window_end || '');
      if (order.order_status !== 'accepted' || !Number.isFinite(start.getTime())
        || !Number.isFinite(end.getTime()) || end <= start) {
        throw new InvalidTransitionError('Invalid pickup schedule transition.');
      }
      order.order_status = 'pickup_scheduled';
      order.pickup_window_start = start.toISOString();
      order.pickup_window_end = end.toISOString();
    } else if (input.event_name === 'pickup_completed') {
      if (!['accepted', 'pickup_scheduled'].includes(order.order_status)) throw new InvalidTransitionError('Invalid pickup transition.');
      order.order_status = 'picked_up';
      order.picked_up_at = when;
    } else if (input.event_name === 'order_weighed') {
      const weight = Number(payload.actual_lbs);
      if (order.order_status !== 'picked_up' || !Number.isFinite(weight) || weight <= 0) throw new InvalidTransitionError('Invalid weighing transition.');
      order.order_status = 'weighed';
      order.actual_lbs = weight;
      order.weighed_at = when;
    } else if (input.event_name === 'invoice_created') {
      const amount = Number(payload.service_amount);
      const tip = Number(payload.tip_amount || 0);
      if (order.order_status === 'invoice_created' || !String(payload.invoice_id || '').trim()
        || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(tip) || tip !== 0
        || payload.currency !== 'USD') throw new InvalidTransitionError('Invalid invoice transition.');
      if (order.pricing_model === 'per_lb' && order.order_status !== 'weighed') throw new InvalidTransitionError('Per-pound order must be weighed.');
      order.order_status = 'invoice_created';
      order.payment_status = 'invoice_created';
      order.invoice_id = String(payload.invoice_id).trim();
      order.service_amount = amount;
      order.tip_amount = 0;
      order.currency = 'USD';
    } else if (input.event_name === 'order_ready_for_delivery') {
      if (order.payment_status !== 'paid' || order.order_status !== 'invoice_created') {
        throw new InvalidTransitionError('Paid invoiced order required before delivery readiness.');
      }
      order.order_status = 'ready_for_delivery';
    } else if (input.event_name === 'order_delivered') {
      if (order.payment_status !== 'paid' || !['invoice_created', 'ready_for_delivery'].includes(order.order_status)) {
        throw new InvalidTransitionError('Paid order required for delivery.');
      }
      order.order_status = 'delivered';
      order.delivered_at = when;
    } else if (input.event_name === 'order_cancelled') {
      const reason = String(payload.reason || '').trim();
      if (order.order_status === 'delivered' || order.order_status === 'cancelled' || !reason) {
        throw new InvalidTransitionError('A cancellation reason is required before delivery.');
      }
      order.order_status = 'cancelled';
      order.cancellation_reason = reason;
      order.cancelled_at = when;
    } else {
      throw new InvalidTransitionError('Unsupported lifecycle event.');
    }
    order.updated_at = new Date().toISOString();
    order.version += 1;
    this.event({ ...input, source_system: input.source_system || 'operations', lead_id: order.lead_id, payload });
    return { duplicate: false, order: clone(order) };
  }

  async getOrder(orderId) {
    return clone(this.orders.get(orderId) || null);
  }

  async getSystemOrderByNumber(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return null;
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    return {
      order_number: order.order_number,
      order_status: order.order_status,
      payment_status: order.payment_status,
      customer_name: customer?.profile_name || null,
      property: lead?.operational_data?.property || null,
      accommodation_type: lead?.accommodation_type || null,
      service_tier: order.service_tier,
      pickup_window_start: order.pickup_window_start,
      pickup_window_end: order.pickup_window_end,
      next_action: ['accepted', 'pickup_scheduled'].includes(order.order_status) ? 'Start pickup' : null,
      items: clone(this.orderItems?.get(order.id) || []).map((item) => ({
        label: item.label, unit: item.unit, quantity: item.quantity,
        estimated_lbs: item.estimated_lbs, unit_price: item.unit_price,
        minimum_amount: item.minimum_amount, requires_manual_review: item.requires_manual_review
      }))
    };
  }

  async getSystemPickupOrderByNumber(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return null;
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    const operational = lead?.operational_data || {};
    return {
      order_number: order.order_number,
      order_status: order.order_status,
      accepted_at: order.accepted_at,
      customer: {
        name: customer?.profile_name || null,
        whatsapp_number: customer?.wa_id || null,
        language: lead?.language || null,
        room: operational.room || null
      },
      property: {
        type: lead?.accommodation_type || null,
        name: operational.property || null,
        address: operational.property_address || null
      },
      service: {
        tier: order.service_tier,
        items: clone(this.orderItems?.get(order.id) || []).map((item) => ({
          label: item.label, unit: item.unit, quantity: item.quantity,
          estimated_lbs: item.estimated_lbs, unit_price: item.unit_price,
          minimum_amount: item.minimum_amount, requires_manual_review: item.requires_manual_review
        }))
      },
      pickup: {
        window_start: order.pickup_window_start,
        window_end: order.pickup_window_end,
        location: operational.pickup_location || null,
        instructions: operational.location_notes || null,
        bags_expected: order.bags_expected ?? operational.bags_expected ?? null
      },
      delivery: { needed_by: operational.needed_by || null },
      special_instructions: {
        care_options: Array.isArray(operational.care_options) ? operational.care_options : [],
        customer_notes: operational.order_notes || null
      }
    };
  }

  operationalRow(order) {
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    const operational = lead?.operational_data || {};
    const timeline = [
      ...[...this.events.values()].filter((event) => event.order_id === order.id).map((event) => ({
        occurred_at: event.occurred_at, action: event.event_name, actor_label: null
      })),
      ...[...this.operationalEvents.values()].filter((event) => event.order_id === order.id).map((event) => ({
        occurred_at: event.occurred_at, action: event.action, actor_label: event.actor_role
      })),
      ...[...this.systemInvoiceEvents.values()].filter((event) => event.order_id === order.id).map((event) => ({
        occurred_at: event.occurred_at, action: event.action, actor_label: event.actor_role
      }))
    ].sort((left, right) => String(left.occurred_at).localeCompare(String(right.occurred_at)));
    return {
      order_number: order.order_number, order_status: order.order_status,
      payment_status: order.payment_status, customer_name: customer?.profile_name || null,
      whatsapp_last4: String(customer?.wa_id || '').slice(-4), property: operational.property || null,
      room: operational.room || null, accommodation_type: lead?.accommodation_type || null,
      service_tier: order.service_tier || 'normal', custody_state: order.custody_state || null,
      production_state: order.production_state || null, accepted_at: order.accepted_at,
      pickup_window_start: order.pickup_window_start, pickup_window_end: order.pickup_window_end,
      needed_by: operational.needed_by || null, promised_by: order.promised_by || null,
      operational_waiting_since: order.operational_waiting_since || order.accepted_at,
      estimated_lbs: order.estimated_lbs, bags_expected: order.bags_expected ?? operational.bags_expected ?? null,
      special_instructions: operational.order_notes || null,
      items: clone(this.orderItems?.get(order.id) || []).map((item) => ({
        item_id:item.id, catalog_code:item.catalog_code, service_type:item.service_type,
        label:item.label, unit:item.unit, quantity:item.quantity, estimated_lbs:item.estimated_lbs,
        unit_price:item.unit_price, minimum_amount:item.minimum_amount,
        actual_lbs:item.actual_lbs ?? null, weighed_at:item.weighed_at ?? null,
        subtotal:item.subtotal ?? null, weight_version:item.weight_version ?? 0,
        requires_manual_review:item.requires_manual_review
      })), timeline, is_qa:isQaOrder(order, lead, customer), version:order.version
    };
  }

  async getSystemOperationalSnapshot() {
    const orders = [...this.orders.values()].filter((order) => order.order_number).map((order) => this.operationalRow(order));
    const waitingLeads = [...this.leads.values()].filter((lead) => ['new', 'qualifying', 'qualified'].includes(lead.status)
      && ![...this.orders.values()].some((order) => order.lead_id === lead.id)
      && !hasQaMarker(lead.operational_data?.order_notes) && !hasQaMarker(lead.operational_data?.property))
      .map((lead) => {
        const customer = this.customers.get(lead.customer_id);
        return { customer_name:customer?.profile_name || 'Customer', whatsapp_last4:String(customer?.wa_id || '').slice(-4) || null,
          property:lead.operational_data?.property || null, customer_type:lead.customer_type || 'unknown',
          created_at:lead.created_at || null, status:lead.status };
      });
    return { orders, waiting_confirmation:waitingLeads.length, waiting_leads:waitingLeads,
      settings:clone(this.operationalSettings) };
  }

  async getSystemOperationalOrderByNumber(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    return order ? this.operationalRow(order) : null;
  }

  async getSystemW1cOrderByNumber(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return null;
    const row = this.operationalRow(order);
    const itemTimeline = [...this.itemWeightEvents.values()]
      .filter((event) => event.order_id === order.id)
      .map((event) => ({
        occurred_at:event.occurred_at,
        action:event.previous_actual_lbs == null ? 'item_weight_recorded' : 'item_weight_corrected',
        actor_label:event.actor_role
      }));
    row.timeline = [...row.timeline, ...itemTimeline]
      .sort((left, right) => String(left.occurred_at).localeCompare(String(right.occurred_at)));
    return row;
  }

  async getSystemMessageContext(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return null;
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    const available = [];
    if (!['cancelled', 'delivered'].includes(order.order_status)) available.push('order_confirmed');
    if (['picked_up', 'weighed', 'invoice_created', 'ready_for_delivery', 'delivered'].includes(order.order_status)
      || ['with_driver_pickup', 'at_laundry', 'with_driver_delivery', 'bell_desk', 'delivered'].includes(order.custody_state)) {
      available.push('pickup_confirmed');
    }
    if (['at_laundry', 'with_driver_delivery', 'bell_desk', 'delivered'].includes(order.custody_state)) {
      available.push('received_at_laundry');
    }
    if (order.production_state === 'ready') available.push('ready_for_delivery');
    if (order.payment_status === 'paid') available.push('payment_confirmed');
    if (order.order_status === 'delivered' || order.custody_state === 'delivered') available.push('delivered');
    return {
      order_id:order.id,
      order_number:order.order_number,
      order_status:order.order_status,
      payment_status:order.payment_status,
      custody_state:order.custody_state,
      production_state:order.production_state,
      service_tier:order.service_tier || 'normal',
      pickup_window_start:order.pickup_window_start || null,
      pickup_window_end:order.pickup_window_end || null,
      promised_by:order.promised_by || null,
      customer_name:customer?.profile_name || null,
      whatsapp_last4:String(customer?.wa_id || '').slice(-4),
      language:lead?.language || 'en',
      is_qa:isQaOrder(order, lead, customer),
      available_templates:available
    };
  }

  async listSystemMessageDrafts(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return [];
    return [...this.messageDrafts.values()].filter((row) => row.order_id === order.id)
      .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at))
        || String(right.id).localeCompare(String(left.id))).map(clone);
  }

  async createSystemMessageDraft(input) {
    const order = [...this.orders.values()].find((row) => row.order_number === input.order_number);
    if (!order) throw new InvalidTransitionError('Order not found.');
    const context = await this.getSystemMessageContext(input.order_number);
    if (context.is_qa) throw new InvalidTransitionError('QA orders cannot create customer messages.');
    if (order.order_status === 'cancelled' || !context.available_templates.includes(input.template_key)) {
      throw new InvalidTransitionError('Message template is not available for the current order state.');
    }
    const prior = [...this.messageDraftEvents.values()].find((row) => row.idempotency_key === input.idempotency_key);
    if (prior) {
      const draft = this.messageDrafts.get(prior.draft_id);
      const same = prior.action === 'draft_created' && prior.order_id === order.id
        && draft?.template_key === input.template_key && draft?.language === input.language
        && draft?.rendered_text === input.rendered_text && draft?.facts_hash === input.facts_hash;
      if (!same) throw new InvalidTransitionError('Idempotency key conflicts with another message draft.');
      return { duplicate:true, draft:clone(draft) };
    }
    const when = iso(input.occurred_at);
    const draft = {
      id:crypto.randomUUID(), order_id:order.id, template_key:input.template_key,
      language:input.language, rendered_text:input.rendered_text, facts_hash:input.facts_hash,
      status:'drafted', created_by:input.actor_id, approved_by:null, approved_at:null,
      copied_at:null, version:1, created_at:when, updated_at:when
    };
    this.messageDrafts.set(draft.id, draft);
    const event = {
      id:crypto.randomUUID(), draft_id:draft.id, order_id:order.id, action:'draft_created',
      actor_id:input.actor_id, actor_role:input.actor_role, idempotency_key:input.idempotency_key,
      draft_version:draft.version, occurred_at:when, recorded_at:new Date().toISOString()
    };
    this.messageDraftEvents.set(event.id, event);
    return { duplicate:false, draft:clone(draft) };
  }

  async actOnSystemMessageDraft(input) {
    const draft = this.messageDrafts.get(input.draft_id);
    if (!draft) throw new InvalidTransitionError('Message draft not found.');
    const order = this.orders.get(draft.order_id);
    const context = await this.getSystemMessageContext(order.order_number);
    if (context.is_qa) throw new InvalidTransitionError('QA orders cannot create customer messages.');
    const action = input.action === 'approve' ? 'draft_approved'
      : input.action === 'copy' ? 'draft_copied' : null;
    if (!action) throw new InvalidTransitionError('Message action is invalid.');
    const prior = [...this.messageDraftEvents.values()].find((row) => row.idempotency_key === input.idempotency_key);
    if (prior) {
      if (prior.action !== action || prior.draft_id !== draft.id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another message action.');
      }
      return { duplicate:true, draft:clone(draft) };
    }
    if (Number(input.expected_version) !== draft.version) throw new InvalidTransitionError('Message draft version is stale.');
    const when = iso(input.occurred_at);
    if (input.action === 'approve') {
      if (draft.status !== 'drafted' || input.current_facts_hash !== draft.facts_hash
        || order.order_status === 'cancelled' || !context.available_templates.includes(draft.template_key)) {
        throw new InvalidTransitionError('Message draft is stale or cannot be approved.');
      }
      draft.status = 'approved'; draft.approved_by = input.actor_id; draft.approved_at = when;
    } else {
      if (!['approved', 'copied'].includes(draft.status)) throw new InvalidTransitionError('Approve the message before copying.');
      draft.status = 'copied'; draft.copied_at = when;
    }
    draft.version += 1; draft.updated_at = when;
    const event = {
      id:crypto.randomUUID(), draft_id:draft.id, order_id:order.id, action,
      actor_id:input.actor_id, actor_role:input.actor_role, idempotency_key:input.idempotency_key,
      draft_version:draft.version, occurred_at:when, recorded_at:new Date().toISOString()
    };
    this.messageDraftEvents.set(event.id, event);
    return { duplicate:false, draft:clone(draft) };
  }

  async recordSystemItemWeight(input) {
    const order = [...this.orders.values()].find((row) => row.order_number === input.order_number);
    if (!order) throw new InvalidTransitionError('Order not found.');
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    if (isQaOrder(order, lead, customer)) throw new InvalidTransitionError('QA orders are read-only.');
    const items = this.orderItems.get(order.id) || [];
    const item = items.find((row) => row.id === input.order_item_id);
    if (!item) throw new InvalidTransitionError('Order item not found.');
    const existing = [...this.itemWeightEvents.values()]
      .find((event) => event.idempotency_key === input.idempotency_key);
    if (existing) {
      const same = existing.order_id === order.id && existing.order_item_id === item.id
        && existing.actual_lbs === input.actual_lbs
        && existing.requested_version === input.expected_weight_version
        && (existing.reason || null) === (input.reason || null);
      if (!same) throw new InvalidTransitionError('Idempotency key conflicts with another item weight.');
      return { duplicate:true, complete:order.order_status === 'weighed', order:await this.getSystemW1cOrderByNumber(order.order_number) };
    }
    if (order.custody_state !== 'at_laundry'
      || !['awaiting_weight', 'awaiting_processing'].includes(order.production_state)
      || !['picked_up', 'weighed'].includes(order.order_status)) {
      throw new InvalidTransitionError('Weight is unavailable from the current state.');
    }
    if (item.unit !== 'lb') throw new InvalidTransitionError('Only per-pound items can be weighed.');
    if ((item.weight_version || 0) !== input.expected_weight_version) {
      throw new InvalidTransitionError('Item weight version conflict.');
    }
    if (item.actual_lbs != null && !input.reason) {
      throw new InvalidTransitionError('A reason is required to correct item weight.');
    }
    if (order.order_status === 'weighed' && order.production_state !== 'awaiting_processing') {
      throw new InvalidTransitionError('Weight correction is unavailable after processing starts.');
    }
    const snapshot = {
      order:clone(order), items:clone(items), events:clone([...this.events]),
      eventKeys:clone([...this.eventKeys]), itemWeightEvents:clone([...this.itemWeightEvents])
    };
    try {
      const when = iso(input.occurred_at);
      const price = Number(item.unit_price);
      const subtotal = !item.requires_manual_review && Number.isFinite(price)
        ? Math.round(input.actual_lbs * price * 100) / 100 : null;
      const previousWeight = item.actual_lbs ?? null;
      const previousSubtotal = item.subtotal ?? null;
      item.actual_lbs = input.actual_lbs;
      item.weighed_at = when;
      item.subtotal = subtotal;
      item.weight_version = (item.weight_version || 0) + 1;
      const weightEvent = {
        id:crypto.randomUUID(), order_id:order.id, order_item_id:item.id,
        actor_id:input.actor_id, actor_role:input.actor_role,
        idempotency_key:input.idempotency_key, requested_version:input.expected_weight_version,
        previous_actual_lbs:previousWeight, actual_lbs:input.actual_lbs,
        previous_subtotal:previousSubtotal, subtotal, reason:input.reason || null,
        occurred_at:when, recorded_at:new Date().toISOString()
      };
      this.itemWeightEvents.set(weightEvent.id, weightEvent);
      const poundItems = items.filter((row) => row.unit === 'lb');
      const pending = poundItems.filter((row) => row.actual_lbs == null).length;
      const total = poundItems.reduce((sum, row) => sum + (Number(row.actual_lbs) || 0), 0);
      if (pending === 0) {
        if (order.order_status === 'picked_up') {
          await this.recordTransition({
            order_id:order.id, event_name:'order_weighed',
            event_id:`order_weighed:${crypto.randomUUID()}`,
            idempotency_key:`${input.idempotency_key}:lifecycle`,
            payload:{ actual_lbs:total }, occurred_at:when
          });
        } else {
          order.actual_lbs = total;
          order.weighed_at = when;
          order.updated_at = new Date().toISOString();
          order.version += 1;
        }
        order.production_state = 'awaiting_processing';
        order.operational_waiting_since = when;
        order.updated_at = new Date().toISOString();
        order.version += 1;
      }
      return { duplicate:false, complete:pending === 0, pending_items:pending,
        order:await this.getSystemW1cOrderByNumber(order.order_number) };
    } catch (error) {
      Object.assign(order, snapshot.order);
      this.orderItems.set(order.id, snapshot.items);
      this.events = new Map(snapshot.events);
      this.eventKeys = new Map(snapshot.eventKeys);
      this.itemWeightEvents = new Map(snapshot.itemWeightEvents);
      throw error;
    }
  }

  invoicePayload(invoice) {
    return invoice ? { ...clone(invoice), invoice_id:invoice.id,
      lines:clone(this.systemInvoiceLines.get(invoice.id) || []) } : null;
  }

  async listSystemInvoices(orderNumber) {
    const order = [...this.orders.values()].find((row) => row.order_number === orderNumber);
    if (!order) return [];
    return [...this.systemInvoices.values()].filter((row) => row.order_id === order.id)
      .sort((left, right) => right.version - left.version).map((row) => this.invoicePayload(row));
  }

  async reviewSystemInvoice(input) {
    const order = [...this.orders.values()].find((row) => row.order_number === input.order_number);
    if (!order) throw new InvalidTransitionError('Order not found.');
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    if (isQaOrder(order, lead, customer)) throw new InvalidTransitionError('QA orders are read-only.');
    const prior = [...this.systemInvoiceEvents.values()].find((row) => row.idempotency_key === input.idempotency_key);
    if (prior) {
      if (prior.action !== 'invoice_issued' || prior.order_id !== order.id
        || prior.facts_hash !== input.facts.facts_hash
        || prior.requested_version !== input.expected_invoice_version
        || (prior.reason || null) !== (input.reason || null)) {
        throw new InvalidTransitionError('Idempotency key conflicts with another invoice action.');
      }
      return { duplicate:true, invoice:this.invoicePayload(this.systemInvoices.get(prior.invoice_id)) };
    }
    if (order.production_state !== 'ready' || order.order_status === 'cancelled') {
      throw new InvalidTransitionError('Order must be ready before invoice review.');
    }
    if (Number(order.version) !== Number(input.expected_order_version)) {
      throw new InvalidTransitionError('Order changed before invoice review.');
    }
    if (['paid', 'partially_refunded', 'refunded'].includes(order.payment_status)) {
      throw new InvalidTransitionError('Paid invoice is immutable.');
    }
    const invoiceHistory = [...this.systemInvoices.values()].filter((row) => row.order_id === order.id);
    const current = invoiceHistory.find((row) => row.status === 'issued');
    if (!current && invoiceHistory.length) {
      throw new InvalidTransitionError('Voided invoice cannot be reissued in W1C-B1.');
    }
    const currentVersion = current?.version || 0;
    if (currentVersion !== input.expected_invoice_version) throw new InvalidTransitionError('Invoice version is stale.');
    if (current && !input.reason) throw new InvalidTransitionError('A reason is required to replace an invoice.');
    if (current && current.facts_hash === input.facts.facts_hash) {
      throw new InvalidTransitionError('Invoice facts have not changed.');
    }
    const linkedPayment = [...this.payments.values()].some((row) => row.order_id === order.id && row.payment_link_id);
    if (invoiceHistory.some((row) => row.payment_link_id) || order.payment_link_id || linkedPayment) {
      throw new InvalidTransitionError('Linked invoice cannot be replaced in W1C-B1.');
    }
    const when = iso(input.occurred_at);
    if (current) {
      current.status = 'superseded'; current.superseded_at = when; current.updated_at = when;
    }
    const invoice = {
      id:crypto.randomUUID(), order_id:order.id, version:currentVersion + 1, status:'issued',
      supersedes_invoice_id:current?.id || null, item_subtotal:input.facts.item_subtotal,
      minimum_amount:input.facts.minimum_amount, minimum_adjustment:input.facts.minimum_adjustment,
      service_amount:input.facts.service_amount, tip_amount:0, currency:'USD', facts_hash:input.facts.facts_hash,
      reason:input.reason || null, issued_by:input.actor_id, issued_at:when, voided_at:null,
      created_at:when, updated_at:when
    };
    this.systemInvoices.set(invoice.id, invoice);
    this.systemInvoiceLines.set(invoice.id, input.facts.lines.map((line, index) => ({
      id:crypto.randomUUID(), invoice_id:invoice.id, line_number:index + 1, ...clone(line)
    })));
    if (!current && order.invoice_id == null) {
      await this.recordTransition({
        order_id:order.id, event_name:'invoice_created', event_id:`invoice_created:${crypto.randomUUID()}`,
        idempotency_key:`${input.idempotency_key}:lifecycle`, source_system:'operations',
        payload:{ invoice_id:invoice.id, service_amount:invoice.service_amount, tip_amount:0, currency:'USD' },
        occurred_at:when
      });
    } else {
      order.order_status = 'invoice_created'; order.payment_status = 'invoice_created';
      order.invoice_id = invoice.id; order.service_amount = invoice.service_amount;
      order.tip_amount = 0; order.currency = 'USD'; order.updated_at = when; order.version = (order.version || 0) + 1;
    }
    order.current_invoice_id = invoice.id;
    const event = {
      id:crypto.randomUUID(), order_id:order.id, invoice_id:invoice.id, action:'invoice_issued',
      actor_id:input.actor_id, actor_role:input.actor_role, idempotency_key:input.idempotency_key,
      requested_version:input.expected_invoice_version, invoice_version:invoice.version,
      facts_hash:input.facts.facts_hash, reason:input.reason || null, occurred_at:when,
      recorded_at:new Date().toISOString()
    };
    this.systemInvoiceEvents.set(event.id, event);
    return { duplicate:false, invoice:this.invoicePayload(invoice) };
  }

  async voidSystemInvoice(input) {
    const order = [...this.orders.values()].find((row) => row.order_number === input.order_number);
    if (!order) throw new InvalidTransitionError('Order not found.');
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    if (isQaOrder(order, lead, customer)) throw new InvalidTransitionError('QA orders are read-only.');
    const prior = [...this.systemInvoiceEvents.values()].find((row) => row.idempotency_key === input.idempotency_key);
    if (prior) {
      if (prior.action !== 'invoice_voided' || prior.order_id !== order.id
        || prior.requested_version !== input.expected_invoice_version || prior.reason !== input.reason) {
        throw new InvalidTransitionError('Idempotency key conflicts with another invoice action.');
      }
      return { duplicate:true, invoice:this.invoicePayload(this.systemInvoices.get(prior.invoice_id)) };
    }
    if (['paid', 'partially_refunded', 'refunded'].includes(order.payment_status)) {
      throw new InvalidTransitionError('Paid invoice is immutable.');
    }
    const current = [...this.systemInvoices.values()].find((row) => row.order_id === order.id && row.status === 'issued');
    if (!current || current.version !== input.expected_invoice_version) {
      throw new InvalidTransitionError('Invoice version is stale.');
    }
    const invoiceHistory = [...this.systemInvoices.values()].filter((row) => row.order_id === order.id);
    const linkedPayment = [...this.payments.values()].some((row) => row.order_id === order.id && row.payment_link_id);
    if (invoiceHistory.some((row) => row.payment_link_id) || order.payment_link_id || linkedPayment) {
      throw new InvalidTransitionError('Linked invoice cannot be voided in W1C-B1.');
    }
    const when = iso(input.occurred_at);
    current.status = 'void'; current.voided_at = when; current.voided_by = input.actor_id;
    current.void_reason = input.reason; current.updated_at = when;
    order.current_invoice_id = null; order.invoice_id = null; order.service_amount = null;
    order.tip_amount = null; order.payment_status = 'void'; order.updated_at = when; order.version = (order.version || 0) + 1;
    const event = {
      id:crypto.randomUUID(), order_id:order.id, invoice_id:current.id, action:'invoice_voided',
      actor_id:input.actor_id, actor_role:input.actor_role, idempotency_key:input.idempotency_key,
      requested_version:input.expected_invoice_version, invoice_version:current.version,
      facts_hash:current.facts_hash, reason:input.reason, occurred_at:when, recorded_at:new Date().toISOString()
    };
    this.systemInvoiceEvents.set(event.id, event);
    return { duplicate:false, invoice:this.invoicePayload(current) };
  }

  async transitionSystemOperationalOrder(input) {
    const existing = [...this.operationalEvents.values()].find((event) => event.idempotency_key === input.idempotency_key);
    const order = [...this.orders.values()].find((row) => row.order_number === input.order_number);
    if (!order) throw new InvalidTransitionError('Order not found.');
    const lead = this.leads.get(order.lead_id);
    const customer = this.customers.get(order.customer_id);
    if (isQaOrder(order, lead, customer)) throw new InvalidTransitionError('QA orders are read-only.');
    if (existing) {
      if (existing.action !== input.action || existing.order_id !== order.id) {
        throw new InvalidTransitionError('Idempotency key conflicts with another operational transition.');
      }
      return { duplicate:true };
    }
    const before = { custody_state:order.custody_state || null, production_state:order.production_state || null,
      order_status:order.order_status, promised_by:order.promised_by || null };
    const when = iso(input.occurred_at);
    if (input.action === 'schedule_pickup') {
      if (order.order_status !== 'accepted' || !['with_customer', 'awaiting_pickup'].includes(order.custody_state)) {
        throw new InvalidTransitionError('Pickup cannot be scheduled from the current state.');
      }
      order.order_status = 'pickup_scheduled';
      order.custody_state = 'awaiting_pickup';
    } else if (input.action === 'confirm_pickup') {
      if (order.order_status !== 'pickup_scheduled' || order.custody_state !== 'awaiting_pickup') {
        throw new InvalidTransitionError('Pickup cannot be confirmed from the current state.');
      }
      await this.recordTransition({ order_id:order.id, event_name:'pickup_completed',
        event_id:`pickup_completed:${crypto.randomUUID()}`, idempotency_key:`${input.idempotency_key}:lifecycle`, payload:{}, occurred_at:when });
      order.custody_state = 'with_driver_pickup'; order.production_state = 'awaiting_intake';
    } else if (input.action === 'receive_at_laundry') {
      if (order.order_status !== 'picked_up' || order.custody_state !== 'with_driver_pickup') {
        throw new InvalidTransitionError('Order cannot be received from the current state.');
      }
      const requiresWeight = (this.orderItems.get(order.id) || []).some((item) => item.unit === 'lb');
      order.custody_state = 'at_laundry';
      order.production_state = requiresWeight ? 'awaiting_weight' : 'awaiting_processing';
    } else if (input.action === 'start_processing') {
      if (order.custody_state !== 'at_laundry' || order.production_state !== 'awaiting_processing') {
        throw new InvalidTransitionError('Processing cannot start from the current state.');
      }
      order.production_state = 'processing';
    } else if (input.action === 'mark_ready') {
      if (order.custody_state !== 'at_laundry' || order.production_state !== 'processing') {
        throw new InvalidTransitionError('Order cannot be marked ready from the current state.');
      }
      order.production_state = 'ready';
      if (order.payment_status === 'paid' && order.order_status === 'invoice_created') {
        await this.recordTransition({ order_id:order.id, event_name:'order_ready_for_delivery',
          event_id:`order_ready_for_delivery:${crypto.randomUUID()}`, idempotency_key:`${input.idempotency_key}:lifecycle`, payload:{}, occurred_at:when });
      }
    } else if (input.action === 'start_delivery') {
      if (order.production_state !== 'ready' || order.payment_status !== 'paid' || order.custody_state !== 'at_laundry'
        || !['invoice_created', 'ready_for_delivery'].includes(order.order_status)) {
        throw new InvalidTransitionError('Delivery cannot start from the current state.');
      }
      if (order.order_status === 'invoice_created') {
        await this.recordTransition({ order_id:order.id, event_name:'order_ready_for_delivery',
          event_id:`order_ready_for_delivery:${crypto.randomUUID()}`, idempotency_key:`${input.idempotency_key}:lifecycle`, payload:{}, occurred_at:when });
      }
      order.custody_state = 'with_driver_delivery';
    } else if (input.action === 'leave_bell_desk') {
      if (order.production_state !== 'ready' || order.custody_state !== 'with_driver_delivery') {
        throw new InvalidTransitionError('Bell Desk handoff is unavailable from the current state.');
      }
      order.custody_state = 'bell_desk';
    } else if (input.action === 'complete_delivery') {
      if (order.production_state !== 'ready' || order.payment_status !== 'paid'
        || !['with_driver_delivery', 'bell_desk'].includes(order.custody_state)) {
        throw new InvalidTransitionError('Delivery cannot be completed from the current state.');
      }
      await this.recordTransition({ order_id:order.id, event_name:'order_delivered',
        event_id:`order_delivered:${crypto.randomUUID()}`, idempotency_key:`${input.idempotency_key}:lifecycle`, payload:{}, occurred_at:when });
      order.custody_state = 'delivered';
    } else if (input.action === 'set_promised_by') {
      if (order.service_tier !== 'express' || !input.promised_by) throw new InvalidTransitionError('Express promise is invalid.');
      if (order.promised_by && !input.reason) throw new InvalidTransitionError('A reason is required to correct promised-by.');
      order.promised_by = iso(input.promised_by);
      order.promise_version = (order.promise_version || 0) + 1;
    } else throw new InvalidTransitionError('Operational action is invalid.');
    order.operational_waiting_since = when; order.updated_at = new Date().toISOString(); order.version += 1;
    const event = { id:crypto.randomUUID(), order_id:order.id, order_number:order.order_number,
      action:input.action, actor_id:input.actor_id, actor_role:input.actor_role,
      idempotency_key:input.idempotency_key, previous_state:before,
      new_state:{ custody_state:order.custody_state || null, production_state:order.production_state || null,
        order_status:order.order_status, promised_by:order.promised_by || null }, reason:input.reason || null, occurred_at:when };
    this.operationalEvents.set(event.id, event);
    return { duplicate:false };
  }

  async runW1bSmokeProbe(input) {
    const isolated = new MemoryOperationalStore();
    const customerId = crypto.randomUUID();
    const leadId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    isolated.customers.set(customerId, {
      id:customerId, unit_key:'orlando', wa_id:`system-smoke-${input.request_id}`,
      profile_name:'System Smoke Fixture'
    });
    isolated.leads.set(leadId, {
      id:leadId, customer_id:customerId, status:'order_accepted', language:'en',
      accommodation_type:'hotel', operational_data:{ property:'System Smoke Fixture' }
    });
    isolated.orders.set(orderId, {
      id:orderId, lead_id:leadId, customer_id:customerId, order_number:'MCO 990000000000',
      order_status:'accepted', payment_status:'pending', service_tier:'normal',
      custody_state:'with_customer', production_state:'awaiting_intake',
      pickup_window_start:new Date(Date.now() + 3_600_000).toISOString(),
      pickup_window_end:new Date(Date.now() + 7_200_000).toISOString(), version:1
    });
    const idempotencyKey = `w1b-smoke:${input.request_id}`;
    const transition = { order_number:'MCO 990000000000', action:'schedule_pickup',
      actor_id:input.actor_id, actor_role:input.actor_role, idempotency_key:idempotencyKey,
      reason:'Transactional smoke probe', occurred_at:iso(input.occurred_at) };
    const first = await isolated.transitionSystemOperationalOrder(transition);
    const retry = await isolated.transitionSystemOperationalOrder(transition);
    const order = isolated.orders.get(orderId);
    return {
      passed:first.duplicate === false && retry.duplicate === true
        && order.order_status === 'pickup_scheduled' && order.custody_state === 'awaiting_pickup'
        && isolated.operationalEvents.size === 1,
      first_duplicate:Boolean(first.duplicate), retry_duplicate:Boolean(retry.duplicate),
      event_count:isolated.operationalEvents.size, final_order_status:order.order_status,
      final_custody_state:order.custody_state, residue_count:0
    };
  }

  async searchSystemCustomers(input) {
    const mode = input.mode;
    const query = String(input.query || '').toLocaleLowerCase('en-US');
    const limit = Math.max(1, Math.min(Number(input.limit) || 12, 20));
    const matches = [...this.customers.values()].filter((customer) => {
      const hasOrder = [...this.orders.values()].some((order) => order.customer_id === customer.id && order.order_number);
      if (!hasOrder) return false;
      if (mode === 'phone_last4') return String(customer.wa_id || '').slice(-4) === query;
      if (mode === 'phone') return String(customer.wa_id || '') === query;
      if (mode === 'email') return String(customer.email || '').toLocaleLowerCase('en-US') === query;
      if (mode === 'order_number') {
        return [...this.orders.values()].some((order) => order.customer_id === customer.id && order.order_number === input.query);
      }
      return String(customer.profile_name || '').toLocaleLowerCase('en-US').includes(query);
    }).map((customer) => {
      const orders = [...this.orders.values()]
        .filter((order) => order.customer_id === customer.id && order.order_number)
        .sort((left, right) => String(right.accepted_at).localeCompare(String(left.accepted_at))
          || String(right.order_number).localeCompare(String(left.order_number)));
      const commercial = orders.filter((order) => {
        const lead = this.leads.get(order.lead_id);
        return order.order_status !== 'cancelled' && !isQaOrder(order, lead, customer);
      });
      const latest = commercial[0] || null;
      const lead = latest ? this.leads.get(latest.lead_id) : null;
      return {
        customer_id: customer.id,
        profile_name: customer.profile_name || null,
        whatsapp_last4: String(customer.wa_id || '').slice(-4),
        latest_property: lead?.operational_data?.property || null,
        latest_accepted_at: latest?.accepted_at || null,
        order_count: commercial.length,
        confirmed_service_revenue: commercial.reduce((total, order) => {
          const amount = confirmedServiceRevenue(order, this.payments, false);
          return total + (amount == null ? 0 : amount);
        }, 0),
        currency: 'USD'
      };
    }).sort((left, right) => String(right.latest_accepted_at).localeCompare(String(left.latest_accepted_at))
      || String(left.profile_name || '').localeCompare(String(right.profile_name || ''))
      || String(left.customer_id).localeCompare(String(right.customer_id)));
    return matches.slice(0, limit);
  }

  async getSystemCustomerById(customerId) {
    const customer = this.customers.get(customerId);
    if (!customer) return null;
    const orders = [...this.orders.values()]
      .filter((order) => order.customer_id === customerId && order.order_number)
      .sort((left, right) => String(right.accepted_at).localeCompare(String(left.accepted_at))
        || String(right.order_number).localeCompare(String(left.order_number)));
    if (!orders.length) return null;
    const decorated = orders.map((order) => {
      const lead = this.leads.get(order.lead_id);
      const qa = isQaOrder(order, lead, customer);
      return { order, lead, qa, revenue: confirmedServiceRevenue(order, this.payments, qa) };
    });
    const commercial = decorated.filter(({ order, qa }) => !qa && order.order_status !== 'cancelled');
    const latest = commercial[0] || decorated[0];
    const first = commercial[commercial.length - 1] || null;
    const latestLead = latest?.lead;
    return {
      customer_id: customer.id,
      profile_name: customer.profile_name || null,
      whatsapp_number: customer.wa_id || null,
      email: customer.email || null,
      language: latestLead?.language || 'unknown',
      customer_type: latest?.order?.customer_type || latestLead?.customer_type || 'unknown',
      latest_property: latestLead?.operational_data?.property || null,
      latest_accommodation_type: latestLead?.accommodation_type || null,
      order_count: commercial.length,
      confirmed_service_revenue: commercial.reduce((total, row) => total + (row.revenue == null ? 0 : row.revenue), 0),
      currency: 'USD',
      first_order_at: first?.order?.accepted_at || null,
      last_order_at: commercial[0]?.order?.accepted_at || null,
      acquisition_source: acquisitionSource(first?.order),
      orders: decorated.map(({ order, lead, qa, revenue }) => {
        return {
          order_number: order.order_number,
          accepted_at: order.accepted_at,
          order_status: order.order_status,
          payment_status: order.payment_status,
          service_tier: order.service_tier,
          property: lead?.operational_data?.property || null,
          accommodation_type: lead?.accommodation_type || null,
          confirmed_service_revenue: revenue,
          currency: 'USD',
          is_qa: qa
        };
      })
    };
  }

  async recordPayment(input) {
    if (this.stripeEvents.has(input.stripe_event_id)) {
      return { duplicate: true, payment: clone(this.payments.get(input.transaction_id) || null) };
    }
    const order = this.orders.get(input.order_id);
    if (!order || !order.invoice_id) throw new InvalidTransitionError('Invoiced order required.');
    if (Number(input.amount) !== Number(order.service_amount) || input.currency !== 'USD') {
      throw new InvalidTransitionError('Payment amount does not match invoiced service amount.');
    }
    let payment = this.payments.get(input.transaction_id);
    const orderPayment = [...this.payments.values()].find((row) => row.order_id === order.id);
    if (orderPayment && orderPayment.transaction_id !== input.transaction_id) {
      throw new InvalidTransitionError('Order is already bound to a different payment intent.');
    }
    const duplicate = Boolean(payment);
    if (payment && (
      payment.order_id !== order.id
      || Number(payment.amount) !== Number(input.amount)
      || payment.currency !== input.currency
    )) throw new InvalidTransitionError('Payment intent conflicts with the existing sale.');
    if (!payment) {
      payment = {
        id: crypto.randomUUID(), order_id: order.id, provider: 'stripe',
        transaction_id: input.transaction_id, checkout_session_id: input.checkout_session_id || null,
        payment_link_id: input.payment_link_id || null, amount: Number(input.amount), currency: 'USD',
        status: 'paid', paid_at: iso(input.paid_at), refund_total: 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      this.payments.set(payment.transaction_id, payment);
      order.payment_status = 'paid';
      order.payment_id = payment.transaction_id;
      order.paid_at = payment.paid_at;
      order.updated_at = new Date().toISOString();
      order.version += 1;
      const eventId = `purchase:${payment.transaction_id}`;
      const result = this.event({
        event_id: eventId,
        idempotency_key: eventId,
        event_name: 'purchase',
        source_system: 'stripe',
        lead_id: order.lead_id,
        order_id: order.id,
        occurred_at: payment.paid_at,
        payload: {
          transaction_id: payment.transaction_id,
          order_id: order.id,
          value: payment.amount,
          currency: 'USD',
          service_type: order.service_type,
          customer_type: order.customer_type,
          is_repeat_customer: order.is_repeat_customer,
          attribution_confidence: order.attribution_confidence,
          items: [{ item_id: order.service_type, item_name: order.service_type }]
        }
      });
      this.queue(result.event, order.attribution_snapshot);
    }
    this.stripeEvents.set(input.stripe_event_id, {
      stripe_event_id: input.stripe_event_id,
      event_type: input.event_type,
      object_id: input.checkout_session_id,
      order_id: order.id,
      transaction_id: input.transaction_id,
      status: duplicate ? 'ignored' : 'processed'
    });
    return { duplicate, payment: clone(payment) };
  }

  async recordPaymentState(input) {
    if (this.stripeEvents.has(input.stripe_event_id)) return { duplicate: true };
    const order = this.orders.get(input.order_id);
    if (!order || order.lead_id !== input.lead_id || !order.invoice_id) {
      throw new InvalidTransitionError('Invoiced order required.');
    }
    const status = String(input.status || '');
    if (!['failed', 'void'].includes(status)) throw new InvalidTransitionError('Invalid payment state.');
    const immutableFinancialStates = ['paid', 'partially_refunded', 'refunded'];
    const ignored = immutableFinancialStates.includes(order.payment_status);
    if (!ignored) {
      order.payment_status = status;
      order.updated_at = new Date().toISOString();
      order.version += 1;
    }
    this.stripeEvents.set(input.stripe_event_id, {
      stripe_event_id: input.stripe_event_id,
      event_type: input.event_type,
      object_id: input.checkout_session_id || null,
      order_id: order.id,
      transaction_id: input.transaction_id || null,
      status: ignored ? 'ignored' : 'processed'
    });
    return { duplicate: false, ignored, order: clone(order) };
  }

  async recordRefund(input) {
    if (this.stripeEvents.has(input.stripe_event_id) || this.refunds.has(input.refund_id)) {
      return { duplicate: true, refund: clone(this.refunds.get(input.refund_id) || null) };
    }
    const payment = this.payments.get(input.transaction_id);
    if (!payment) throw new InvalidTransitionError('Original payment not found.');
    const order = this.orders.get(payment.order_id);
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0 || input.currency !== 'USD') throw new InvalidTransitionError('Invalid refund amount.');
    const totalBefore = [...this.refunds.values()]
      .filter((row) => row.payment_id === payment.id && ['created', 'succeeded'].includes(row.status))
      .reduce((sum, row) => sum + row.amount, 0);
    const countedAmount = ['created', 'succeeded'].includes(input.status || 'created') ? amount : 0;
    if (totalBefore + countedAmount > payment.amount) throw new InvalidTransitionError('Refund total exceeds payment.');
    const refund = {
      refund_id: input.refund_id,
      payment_id: payment.id,
      order_id: order.id,
      transaction_id: payment.transaction_id,
      amount,
      currency: 'USD',
      status: input.status || 'created',
      created_at: new Date().toISOString()
    };
    this.refunds.set(refund.refund_id, refund);
    const total = [...this.refunds.values()]
      .filter((row) => row.payment_id === payment.id && ['created', 'succeeded'].includes(row.status))
      .reduce((sum, row) => sum + row.amount, 0);
    payment.refund_total = total;
    if (total > 0) {
      payment.status = total >= payment.amount ? 'refunded' : 'partially_refunded';
      order.payment_status = payment.status;
    }
    order.updated_at = new Date().toISOString();
    order.version += 1;
    const eventId = `refund:${refund.refund_id}`;
    const result = this.event({
      event_id: eventId,
      idempotency_key: eventId,
      event_name: 'refund',
      source_system: 'stripe',
      lead_id: order.lead_id,
      order_id: order.id,
      occurred_at: input.occurred_at,
      payload: { transaction_id: payment.transaction_id, order_id: order.id, value: amount, currency: 'USD' }
    });
    this.queue(result.event, order.attribution_snapshot);
    this.stripeEvents.set(input.stripe_event_id, {
      stripe_event_id: input.stripe_event_id,
      event_type: input.event_type,
      object_id: input.refund_id,
      order_id: order.id,
      transaction_id: payment.transaction_id,
      status: 'processed'
    });
    return { duplicate: false, refund: clone(refund) };
  }

  async getOutbox(eventId) {
    return clone(this.outbox.get(eventId) || null);
  }

  async getRetryableOutbox(limit = 25) {
    const bounded = Math.max(1, Math.min(Number(limit) || 25, 100));
    return [...this.outbox.values()]
      .filter((row) => ['pending', 'failed', 'disabled'].includes(row.delivery_status))
      .sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)))
      .slice(0, bounded)
      .map(clone);
  }

  async markOutbox(eventId, update) {
    const row = this.outbox.get(eventId);
    if (!row) return null;
    Object.assign(row, clone(update), { attempts: row.attempts + 1, last_attempt_at: new Date().toISOString() });
    return clone(row);
  }
}

class SupabaseOperationalStore {
  constructor(options = {}) {
    this.mode = 'durable_supabase';
    this.url = String(options.url || '').replace(/\/$/, '');
    this.serviceRoleKey = String(options.serviceRoleKey || '');
    this.fetch = options.fetch || globalThis.fetch;
    if (!this.url || !this.serviceRoleKey || typeof this.fetch !== 'function') throw new OperationalStorageUnavailableError();
  }

  async request(path, options = {}) {
    let response;
    try {
      response = await this.fetch(`${this.url}/rest/v1/${path}`, {
        ...options,
        headers: {
          ...supabaseHeaders(this.serviceRoleKey),
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        }
      });
    } catch (_) {
      throw new OperationalStorageUnavailableError();
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const code = payload?.code || `storage_http_${response.status}`;
      throw new OperationalStoreError('Operational storage operation failed.', code);
    }
    return payload;
  }

  async rpc(name, body) {
    return this.request(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body || {}) });
  }

  async systemHealth() {
    await Promise.all([
      this.request('a7_orlando_orders?select=id&limit=1'),
      this.request('a7_orlando_order_items?select=id&limit=1')
    ]);
    return true;
  }

  async upsertCustomer(input) {
    return this.rpc('a7_orlando_upsert_customer', {
      p_wa_id: input.wa_id,
      p_profile_name: input.profile_name || null
    });
  }

  async createLead(input) {
    return this.rpc('a7_orlando_create_lead', {
      p_idempotency_key: input.idempotency_key, p_event_id: input.event_id,
      p_lead_origin: input.lead_origin, p_conversation_id: input.conversation_id || null,
      p_customer_id: input.customer_id || null, p_attribution_id: input.attribution_id || null,
      p_lead_reference: input.lead_reference || null,
      p_attribution_resolution: input.attribution_resolution || 'unknown',
      p_service_type: input.service_type || null, p_customer_type: input.customer_type || 'unknown',
      p_language: input.language || 'unknown', p_accommodation_type: input.accommodation_type || null,
      p_service_area_bucket: input.service_area_bucket || null,
      p_operational_data: input.operational_data || {}, p_occurred_at: iso(input.occurred_at)
    });
  }

  async qualifyLead(input) {
    return this.rpc('a7_orlando_qualify_lead', {
      p_lead_id: input.lead_id, p_event_id: input.event_id,
      p_idempotency_key: input.idempotency_key, p_service_type: input.service_type,
      p_service_area_accepted: input.service_area_accepted,
      p_timing_accepted: input.timing_accepted,
      p_minimum_basis_accepted: input.minimum_basis_accepted,
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async updateLeadStatus(input) {
    return this.rpc('a7_orlando_update_lead_status', {
      p_lead_id: input.lead_id,
      p_event_name: input.event_name,
      p_event_id: input.event_id,
      p_idempotency_key: input.idempotency_key,
      p_reason: input.reason || null,
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async getLead(leadId) {
    const rows = await this.request(`a7_orlando_leads?id=eq.${encodeURIComponent(leadId)}&select=*`);
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async acceptOrder(input) {
    return this.rpc('a7_orlando_accept_order', {
      p_lead_id: input.lead_id, p_event_id: input.event_id,
      p_idempotency_key: input.idempotency_key, p_service_type: input.service_type,
      p_service_tier: input.service_tier || null, p_pricing_model: input.pricing_model || 'per_lb',
      p_pickup_window_start: input.pickup_window_start || null,
      p_pickup_window_end: input.pickup_window_end || null,
      p_estimated_lbs: input.estimated_lbs || null,
      p_ga_client_id: input.analytics_context?.client_id || null,
      p_ga_session_id: input.analytics_context?.session_id || null,
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async createManualOrder(input) {
    return this.rpc('a7_orlando_create_manual_order_v2', {
      p_submission_id: input.submission_id,
      p_request_fingerprint: input.request_fingerprint,
      p_actor_id: input.actor.actor_id,
      p_actor_role: input.actor.role,
      p_wa_id: input.whatsapp_number,
      p_profile_name: input.name,
      p_language: input.language,
      p_customer_type: input.customer_type,
      p_accommodation_type: input.accommodation_type,
      p_service_area_bucket: 'orlando_pending_route',
      p_operational_data: {
        property: input.property,
        property_address: input.property_address,
        room: input.room,
        location_notes: input.location_notes,
        pickup_location: input.pickup_location,
        bags_expected: input.bags_expected,
        care_options: input.care_options,
        pickup_window_start: input.pickup_window_start,
        pickup_window_end: input.pickup_window_end,
        needed_by: input.needed_by,
        order_notes: input.order_notes,
        analytics_context: input.analytics_context
      },
      p_lead_reference: input.lead_reference,
      p_service_type: input.service_type,
      p_service_tier: input.service_tier,
      p_pricing_model: input.pricing_model,
      p_pickup_window_start: input.pickup_window_start,
      p_pickup_window_end: input.pickup_window_end,
      p_estimated_lbs: input.estimated_lbs,
      p_bags_expected: input.bags_expected,
      p_items: input.items,
      p_occurred_at: new Date().toISOString()
    });
  }

  async createKnownCustomerOrder(input) {
    return this.rpc('a7_orlando_create_known_customer_order', {
      p_submission_id:input.submission_id,
      p_request_fingerprint:input.request_fingerprint,
      p_actor_id:input.actor.actor_id,
      p_actor_role:input.actor.role,
      p_customer_id:input.customer_id,
      p_language:input.language,
      p_customer_type:input.customer_type,
      p_accommodation_type:input.accommodation_type,
      p_service_area_bucket:'orlando_pending_route',
      p_operational_data:{
        property:input.property,
        property_address:input.property_address,
        room:input.room,
        location_notes:input.location_notes,
        pickup_location:input.pickup_location,
        bags_expected:input.bags_expected,
        care_options:input.care_options,
        pickup_window_start:input.pickup_window_start,
        pickup_window_end:input.pickup_window_end,
        needed_by:input.needed_by,
        order_notes:input.order_notes,
        analytics_context:input.analytics_context
      },
      p_lead_reference:input.lead_reference,
      p_service_type:input.service_type,
      p_service_tier:input.service_tier,
      p_pricing_model:input.pricing_model,
      p_pickup_window_start:input.pickup_window_start,
      p_pickup_window_end:input.pickup_window_end,
      p_estimated_lbs:input.estimated_lbs,
      p_bags_expected:input.bags_expected,
      p_items:input.items,
      p_occurred_at:new Date().toISOString()
    });
  }

  async recordTransition(input) {
    return this.rpc('a7_orlando_record_transition', {
      p_order_id: input.order_id, p_event_name: input.event_name,
      p_event_id: input.event_id, p_idempotency_key: input.idempotency_key,
      p_source_system: input.source_system || 'operations', p_payload: input.payload || {},
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async getOrder(orderId) {
    const rows = await this.request(`a7_orlando_orders?id=eq.${encodeURIComponent(orderId)}&select=*`);
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async getSystemOrderByNumber(orderNumber) {
    const orders = await this.request(
      `a7_orlando_orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=order_number,order_status,payment_status,lead_id,customer_id,service_tier,pickup_window_start,pickup_window_end,id`
    );
    const order = Array.isArray(orders) ? orders[0] : null;
    if (!order) return null;
    const [leads, customers, items] = await Promise.all([
      this.request(`a7_orlando_leads?id=eq.${encodeURIComponent(order.lead_id)}&select=accommodation_type,operational_data`),
      this.request(`a7_wa_contacts?id=eq.${encodeURIComponent(order.customer_id)}&select=profile_name`),
      this.request(`a7_orlando_order_items?order_id=eq.${encodeURIComponent(order.id)}&select=label,unit,quantity,estimated_lbs,unit_price,minimum_amount,requires_manual_review&order=created_at.asc`)
    ]);
    const lead = Array.isArray(leads) ? leads[0] : null;
    const customer = Array.isArray(customers) ? customers[0] : null;
    return {
      order_number: order.order_number,
      order_status: order.order_status,
      payment_status: order.payment_status,
      customer_name: customer?.profile_name || null,
      property: lead?.operational_data?.property || null,
      accommodation_type: lead?.accommodation_type || null,
      service_tier: order.service_tier,
      pickup_window_start: order.pickup_window_start,
      pickup_window_end: order.pickup_window_end,
      next_action: ['accepted', 'pickup_scheduled'].includes(order.order_status) ? 'Start pickup' : null,
      items: Array.isArray(items) ? items : []
    };
  }

  async getSystemPickupOrderByNumber(orderNumber) {
    const orders = await this.request(
      `a7_orlando_orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=order_number,order_status,accepted_at,lead_id,customer_id,service_tier,pickup_window_start,pickup_window_end,bags_expected,id`
    );
    const order = Array.isArray(orders) ? orders[0] : null;
    if (!order) return null;
    const [leads, customers, items] = await Promise.all([
      this.request(`a7_orlando_leads?id=eq.${encodeURIComponent(order.lead_id)}&select=language,accommodation_type,operational_data`),
      this.request(`a7_wa_contacts?id=eq.${encodeURIComponent(order.customer_id)}&select=profile_name,wa_id`),
      this.request(`a7_orlando_order_items?order_id=eq.${encodeURIComponent(order.id)}&select=label,unit,quantity,estimated_lbs,unit_price,minimum_amount,requires_manual_review&order=created_at.asc`)
    ]);
    const lead = Array.isArray(leads) ? leads[0] : null;
    const customer = Array.isArray(customers) ? customers[0] : null;
    const operational = lead?.operational_data || {};
    return {
      order_number: order.order_number,
      order_status: order.order_status,
      accepted_at: order.accepted_at,
      customer: {
        name: customer?.profile_name || null,
        whatsapp_number: customer?.wa_id || null,
        language: lead?.language || null,
        room: operational.room || null
      },
      property: {
        type: lead?.accommodation_type || null,
        name: operational.property || null,
        address: operational.property_address || null
      },
      service: { tier: order.service_tier, items: Array.isArray(items) ? items : [] },
      pickup: {
        window_start: order.pickup_window_start,
        window_end: order.pickup_window_end,
        location: operational.pickup_location || null,
        instructions: operational.location_notes || null,
        bags_expected: order.bags_expected ?? operational.bags_expected ?? null
      },
      delivery: { needed_by: operational.needed_by || null },
      special_instructions: {
        care_options: Array.isArray(operational.care_options) ? operational.care_options : [],
        customer_notes: operational.order_notes || null
      }
    };
  }

  async searchSystemCustomers(input) {
    return this.rpc('a7_orlando_search_customers_lite', {
      p_mode: input.mode,
      p_query: input.query,
      p_limit: Math.max(1, Math.min(Number(input.limit) || 12, 20))
    });
  }

  async getSystemCustomerById(customerId) {
    return this.rpc('a7_orlando_get_customer_lite', { p_customer_id: customerId });
  }

  async getSystemOperationalSnapshot() {
    return this.rpc('a7_orlando_w1c_a_snapshot', {});
  }

  async getSystemOperationalOrderByNumber(orderNumber) {
    return this.rpc('a7_orlando_w1b_order', { p_order_number:orderNumber });
  }

  async getSystemW1cOrderByNumber(orderNumber) {
    return this.rpc('a7_orlando_w1c_a_order', { p_order_number:orderNumber });
  }

  async listSystemInvoices(orderNumber) {
    return this.rpc('a7_orlando_w1c_b1_invoices', { p_order_number:orderNumber });
  }

  async reviewSystemInvoice(input) {
    return this.rpc('a7_orlando_w1c_b1_review_invoice', {
      p_order_number:input.order_number,
      p_expected_invoice_version:input.expected_invoice_version,
      p_expected_order_version:input.expected_order_version,
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key,
      p_reason:input.reason || null,
      p_occurred_at:iso(input.occurred_at)
    });
  }

  async voidSystemInvoice(input) {
    return this.rpc('a7_orlando_w1c_b1_void_invoice', {
      p_order_number:input.order_number,
      p_expected_invoice_version:input.expected_invoice_version,
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key,
      p_reason:input.reason,
      p_occurred_at:iso(input.occurred_at)
    });
  }

  async getSystemMessageContext(orderNumber) {
    return this.rpc('a7_orlando_w2_a_context', { p_order_number:orderNumber });
  }

  async listSystemMessageDrafts(orderNumber) {
    return this.rpc('a7_orlando_w2_a_drafts', { p_order_number:orderNumber });
  }

  async createSystemMessageDraft(input) {
    return this.rpc('a7_orlando_w2_a_create_draft', {
      p_order_number:input.order_number,
      p_template_key:input.template_key,
      p_language:input.language,
      p_rendered_text:input.rendered_text,
      p_facts_hash:input.facts_hash,
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key,
      p_occurred_at:iso(input.occurred_at)
    });
  }

  async actOnSystemMessageDraft(input) {
    return this.rpc('a7_orlando_w2_a_act_on_draft', {
      p_draft_id:input.draft_id,
      p_action:input.action,
      p_expected_version:input.expected_version,
      p_current_facts_hash:input.current_facts_hash || '',
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key,
      p_occurred_at:iso(input.occurred_at)
    });
  }

  async recordSystemItemWeight(input) {
    return this.rpc('a7_orlando_w1c_a_record_item_weight', {
      p_order_number:input.order_number,
      p_order_item_id:input.order_item_id,
      p_actual_lbs:input.actual_lbs,
      p_expected_weight_version:input.expected_weight_version,
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key,
      p_reason:input.reason || null,
      p_occurred_at:iso(input.occurred_at)
    });
  }

  async transitionSystemOperationalOrder(input) {
    return this.rpc('a7_orlando_w1b_transition', {
      p_order_number:input.order_number, p_action:input.action,
      p_actor_id:input.actor_id, p_actor_role:input.actor_role,
      p_idempotency_key:input.idempotency_key, p_reason:input.reason || null,
      p_promised_by:input.promised_by || null, p_occurred_at:iso(input.occurred_at)
    });
  }

  async runW1bSmokeProbe(input) {
    return this.rpc('a7_orlando_w1b_transactional_smoke', {
      p_actor_id:input.actor_id,
      p_actor_role:input.actor_role,
      p_request_id:input.request_id
    });
  }

  async recordPayment(input) {
    return this.rpc('a7_orlando_record_payment', {
      p_stripe_event_id: input.stripe_event_id, p_order_id: input.order_id,
      p_event_type: input.event_type,
      p_transaction_id: input.transaction_id, p_checkout_session_id: input.checkout_session_id || null,
      p_payment_link_id: input.payment_link_id || null, p_amount: input.amount,
      p_currency: input.currency, p_paid_at: iso(input.paid_at)
    });
  }

  async recordPaymentState(input) {
    return this.rpc('a7_orlando_record_payment_state', {
      p_stripe_event_id: input.stripe_event_id,
      p_event_type: input.event_type,
      p_order_id: input.order_id,
      p_lead_id: input.lead_id,
      p_checkout_session_id: input.checkout_session_id || null,
      p_transaction_id: input.transaction_id || null,
      p_payment_status: input.status,
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async recordRefund(input) {
    return this.rpc('a7_orlando_record_refund', {
      p_stripe_event_id: input.stripe_event_id, p_refund_id: input.refund_id,
      p_event_type: input.event_type,
      p_transaction_id: input.transaction_id, p_amount: input.amount,
      p_currency: input.currency, p_status: input.status || 'created',
      p_occurred_at: iso(input.occurred_at)
    });
  }

  async getOutbox(eventId) {
    const rows = await this.request(`a7_orlando_analytics_outbox?event_id=eq.${encodeURIComponent(eventId)}&select=*`);
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async getRetryableOutbox(limit = 25) {
    const bounded = Math.max(1, Math.min(Number(limit) || 25, 100));
    const statuses = encodeURIComponent('(pending,failed,disabled)');
    const rows = await this.request(
      `a7_orlando_analytics_outbox?delivery_status=in.${statuses}&order=created_at.asc&limit=${bounded}&select=*`
    );
    return Array.isArray(rows) ? rows : [];
  }

  async markOutbox(eventId, update) {
    return this.rpc('a7_orlando_mark_outbox', {
      p_event_id: eventId,
      p_delivery_status: update.delivery_status,
      p_last_error_code: update.last_error_code || null,
      p_sent_at: update.sent_at || null
    });
  }
}

class UnavailableOperationalStore {
  constructor() { this.mode = 'unavailable'; }
  fail() { throw new OperationalStorageUnavailableError(); }
  async systemHealth() { return this.fail(); }
  async createLead() { return this.fail(); }
  async upsertCustomer() { return this.fail(); }
  async qualifyLead() { return this.fail(); }
  async updateLeadStatus() { return this.fail(); }
  async getLead() { return this.fail(); }
  async acceptOrder() { return this.fail(); }
  async createManualOrder() { return this.fail(); }
  async createKnownCustomerOrder() { return this.fail(); }
  async recordTransition() { return this.fail(); }
  async getOrder() { return this.fail(); }
  async getSystemOrderByNumber() { return this.fail(); }
  async getSystemPickupOrderByNumber() { return this.fail(); }
  async searchSystemCustomers() { return this.fail(); }
  async getSystemCustomerById() { return this.fail(); }
  async getSystemOperationalSnapshot() { return this.fail(); }
  async getSystemOperationalOrderByNumber() { return this.fail(); }
  async getSystemW1cOrderByNumber() { return this.fail(); }
  async listSystemInvoices() { return this.fail(); }
  async reviewSystemInvoice() { return this.fail(); }
  async voidSystemInvoice() { return this.fail(); }
  async getSystemMessageContext() { return this.fail(); }
  async listSystemMessageDrafts() { return this.fail(); }
  async createSystemMessageDraft() { return this.fail(); }
  async actOnSystemMessageDraft() { return this.fail(); }
  async recordSystemItemWeight() { return this.fail(); }
  async transitionSystemOperationalOrder() { return this.fail(); }
  async runW1bSmokeProbe() { return this.fail(); }
  async recordPayment() { return this.fail(); }
  async recordPaymentState() { return this.fail(); }
  async recordRefund() { return this.fail(); }
  async getOutbox() { return this.fail(); }
  async getRetryableOutbox() { return this.fail(); }
  async markOutbox() { return this.fail(); }
}

function resolveSupabaseConfig(env = {}) {
  const candidates = [
    ['operations', env.A7_OPERATIONS_SUPABASE_URL, env.A7_OPERATIONS_SUPABASE_SERVICE_ROLE_KEY],
    ['whatsapp', env.WHATSAPP_SUPABASE_URL, env.WHATSAPP_SUPABASE_SERVICE_ROLE_KEY],
    ['attribution', env.A7_ATTRIBUTION_SUPABASE_URL, env.A7_ATTRIBUTION_SUPABASE_SERVICE_ROLE_KEY]
  ];
  for (const [source, rawUrl, rawKey] of candidates) {
    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    const serviceRoleKey = typeof rawKey === 'string' ? rawKey.trim() : '';
    if (url && serviceRoleKey) return { source, url, serviceRoleKey };
  }
  return null;
}

function createOperationalStore(options = {}) {
  if (options.store) return options.store;
  if (globalThis.__A7_OPERATIONAL_STORE__) return globalThis.__A7_OPERATIONAL_STORE__;
  const env = options.env || process.env;
  const explicitMemory = env.A7_OPERATIONS_STORAGE_MODE === 'memory';
  const localMemory = env.NODE_ENV !== 'production' && env.A7_OPERATIONS_STORAGE_MODE !== 'unavailable';
  const supabase = resolveSupabaseConfig(env);
  if (explicitMemory || localMemory) {
    globalThis.__A7_OPERATIONAL_STORE__ = new MemoryOperationalStore();
  } else if (supabase) {
    globalThis.__A7_OPERATIONAL_STORE__ = new SupabaseOperationalStore(supabase);
  } else {
    globalThis.__A7_OPERATIONAL_STORE__ = new UnavailableOperationalStore();
  }
  return globalThis.__A7_OPERATIONAL_STORE__;
}

function resetOperationalStoreForTests() {
  delete globalThis.__A7_OPERATIONAL_STORE__;
}

module.exports = {
  OperationalStoreError,
  OperationalStorageUnavailableError,
  InvalidTransitionError,
  MemoryOperationalStore,
  SupabaseOperationalStore,
  UnavailableOperationalStore,
  resolveSupabaseConfig,
  createOperationalStore,
  resetOperationalStoreForTests,
  iso
};
