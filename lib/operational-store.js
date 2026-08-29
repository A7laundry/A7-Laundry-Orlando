'use strict';

const crypto = require('node:crypto');

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

function supabaseHeaders(key) {
  const headers = { apikey: key };
  if (!String(key).startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  return headers;
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
  async createLead() { return this.fail(); }
  async upsertCustomer() { return this.fail(); }
  async qualifyLead() { return this.fail(); }
  async updateLeadStatus() { return this.fail(); }
  async getLead() { return this.fail(); }
  async acceptOrder() { return this.fail(); }
  async recordTransition() { return this.fail(); }
  async getOrder() { return this.fail(); }
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
  iso,
  supabaseHeaders
};
