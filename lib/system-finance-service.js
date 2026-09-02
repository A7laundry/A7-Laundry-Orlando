'use strict';

const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRESETS = new Set(['today', '7d', '30d', 'month', 'custom']);
const AVAILABILITY = new Set(['current', 'partial', 'unavailable', 'no_data']);

function calendarDate(value) {
  const text = String(value || '');
  if (!DATE.test(text)) throw new InvalidTransitionError('Finance date is invalid.');
  const parsed = new Date(`${text}T12:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new InvalidTransitionError('Finance date is invalid.');
  }
  return text;
}

function dateInNewYork(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(now);
  const value = (type) => parts.find((row) => row.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function shiftDate(value, days) {
  const date = new Date(`${calendarDate(value)}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeFinancePeriod(input = {}, now = new Date()) {
  const preset = String(input.preset || '30d').trim().toLowerCase();
  if (!PRESETS.has(preset)) throw new InvalidTransitionError('Finance period preset is invalid.');
  const today = dateInNewYork(now);
  let startDate;
  let endDate;
  if (preset === 'custom') {
    startDate = calendarDate(input.start_date);
    endDate = calendarDate(input.end_date);
  } else {
    endDate = today;
    if (preset === 'today') startDate = today;
    else if (preset === '7d') startDate = shiftDate(today, -6);
    else if (preset === '30d') startDate = shiftDate(today, -29);
    else startDate = `${today.slice(0, 7)}-01`;
  }
  if (startDate > endDate) throw new InvalidTransitionError('Finance start date must not follow end date.');
  const days = Math.round((new Date(`${endDate}T12:00:00.000Z`) - new Date(`${startDate}T12:00:00.000Z`)) / 86400000);
  if (days > 365) throw new InvalidTransitionError('Finance period cannot exceed 366 calendar days.');
  return { preset, start_date:startDate, end_date:endDate };
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new InvalidTransitionError('Finance source returned an invalid number.');
  return Math.round((result + Number.EPSILON) * 100) / 100;
}

function count(value) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 0) throw new InvalidTransitionError('Finance source returned an invalid count.');
  return result;
}

function safeAvailability(value) {
  const clean = String(value || 'unavailable');
  if (!AVAILABILITY.has(clean)) throw new InvalidTransitionError('Finance availability is invalid.');
  return clean;
}

function safeTimestamp(value) {
  const parsed = new Date(String(value || ''));
  if (!Number.isFinite(parsed.getTime())) {
    throw new InvalidTransitionError('Finance freshness timestamp is invalid.');
  }
  return parsed.toISOString();
}

function safeBreakdown(rows) {
  if (!Array.isArray(rows)) throw new InvalidTransitionError('Finance breakdown is unavailable.');
  return rows.slice(0, 200).map((row) => ({
    bucket:String(row?.bucket || 'Unknown').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180) || 'Unknown',
    paid_order_count:count(row?.paid_order_count),
    confirmed_service_revenue:numberOrNull(row?.confirmed_service_revenue) ?? 0
  }));
}

function safeFinanceReport(raw, requested) {
  if (!raw || typeof raw !== 'object') throw new InvalidTransitionError('Finance report is unavailable.');
  const summary = raw.summary || {};
  const result = {
    period:{ preset:requested.preset, start_date:calendarDate(raw.period?.start_date || requested.start_date),
      end_date:calendarDate(raw.period?.end_date || requested.end_date), timezone:'America/New_York',
      basis:'authoritative_paid_at' },
    summary:{ currency:'USD', paid_order_count:count(summary.paid_order_count),
      customer_count:count(summary.customer_count),
      confirmed_service_revenue:numberOrNull(summary.confirmed_service_revenue) ?? 0,
      gross_received:numberOrNull(summary.gross_received) ?? 0,
      confirmed_tips:numberOrNull(summary.confirmed_tips),
      average_service_ticket:numberOrNull(summary.average_service_ticket),
      new_customer_orders:count(summary.new_customer_orders),
      repeat_customer_orders:count(summary.repeat_customer_orders),
      normal_paid_orders:count(summary.normal_paid_orders),
      express_paid_orders:count(summary.express_paid_orders),
      pending_payment_count:count(summary.pending_payment_count),
      pending_payment_value:numberOrNull(summary.pending_payment_value) },
    availability:{ status:safeAvailability(raw.availability?.status),
      service_revenue:safeAvailability(raw.availability?.service_revenue),
      gross_received:safeAvailability(raw.availability?.gross_received),
      tips:safeAvailability(raw.availability?.tips),
      pending_payment_value:safeAvailability(raw.availability?.pending_payment_value),
      processing_fees:safeAvailability(raw.availability?.processing_fees),
      net_payout:safeAvailability(raw.availability?.net_payout) },
    breakdowns:{ service:safeBreakdown(raw.breakdowns?.service), hotel:safeBreakdown(raw.breakdowns?.hotel),
      acquisition:safeBreakdown(raw.breakdowns?.acquisition) },
    sources:Array.isArray(raw.sources) ? raw.sources.map((value) => String(value).slice(0, 100)).slice(0, 10) : [],
    freshness:{ generated_at:safeTimestamp(raw.freshness?.generated_at) }
  };
  const revenue = result.summary.confirmed_service_revenue;
  for (const [name, rows] of Object.entries(result.breakdowns)) {
    const sum = Math.round((rows.reduce((total, row) => total + row.confirmed_service_revenue, 0) + Number.EPSILON) * 100) / 100;
    if (Math.abs(sum - revenue) > 0.01) throw new InvalidTransitionError(`Finance ${name} breakdown does not reconcile.`);
  }
  if (result.summary.paid_order_count === 0 && result.summary.average_service_ticket !== null) {
    throw new InvalidTransitionError('Finance average ticket is inconsistent.');
  }
  return result;
}

function systemFinanceService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());
  return {
    store,
    async report(input, actor) {
      if (!actor || !['owner', 'manager'].includes(actor.role)) throw new InvalidTransitionError('Owner authorization or Manager financial authorization is required.');
      const period = normalizeFinancePeriod(input, now());
      const raw = await store.getSystemOwnerFinance(period);
      return safeFinanceReport(raw, period);
    }
  };
}

module.exports = { systemFinanceService, normalizeFinancePeriod, safeFinanceReport, dateInNewYork, shiftDate };
