'use strict';

const crypto = require('node:crypto');
const { createOperationalStore, InvalidTransitionError } = require('./operational-store.js');
const { normalizeOrderNumber } = require('./system-order-service.js');

const TEMPLATE_KEYS = Object.freeze([
  'order_confirmed', 'pickup_confirmed', 'received_at_laundry',
  'ready_for_delivery', 'payment_confirmed', 'delivered'
]);
const TEMPLATE_LABELS = Object.freeze({
  order_confirmed:'Pedido confirmado',
  pickup_confirmed:'Coleta confirmada',
  received_at_laundry:'Recebido na lavanderia',
  ready_for_delivery:'Pronto para entrega',
  payment_confirmed:'Pagamento confirmado',
  delivered:'Entregue'
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function languageOf(value) {
  const language = clean(value, 8).toLowerCase();
  return ['en', 'pt', 'es'].includes(language) ? language : 'en';
}

function dateTime(value, language) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-US' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    timeZone:'America/New_York', month:'short', day:'numeric', hour:'numeric', minute:'2-digit'
  }).format(new Date(value));
}

function pickupWindow(context, language) {
  const start = dateTime(context.pickup_window_start, language);
  const end = dateTime(context.pickup_window_end, language);
  if (!start || !end) return null;
  return `${start} – ${end}`;
}

function factSnapshot(context, templateKey) {
  const common = {
    order_number:clean(context.order_number, 40),
    template_key:templateKey,
    language:languageOf(context.language)
  };
  if (templateKey === 'order_confirmed') return {
    ...common,
    service_tier:clean(context.service_tier, 20) || 'normal',
    pickup_window_start:context.pickup_window_start || null,
    pickup_window_end:context.pickup_window_end || null,
    promised_by:context.promised_by || null
  };
  return {
    ...common,
    order_status:clean(context.order_status, 40),
    payment_status:clean(context.payment_status, 40),
    custody_state:clean(context.custody_state, 40),
    production_state:clean(context.production_state, 40)
  };
}

function factsHash(context, templateKey) {
  return crypto.createHash('sha256').update(JSON.stringify(factSnapshot(context, templateKey))).digest('hex');
}

function renderMessage(context, templateKey) {
  if (!TEMPLATE_KEYS.includes(templateKey)) throw new InvalidTransitionError('Message template is invalid.');
  const language = languageOf(context.language);
  const number = clean(context.order_number, 40);
  const window = pickupWindow(context, language);
  const tier = clean(context.service_tier, 20).toLowerCase() === 'express' ? 'Express' : 'Normal';
  const promise = dateTime(context.promised_by, language);
  const messages = {
    en: {
      order_confirmed: `A7 Laundry order ${number} is confirmed.${window ? ` Pickup: ${window} (Orlando time).` : ''} Service: ${tier}.${promise ? ` Confirmed completion time: ${promise} (Orlando time).` : ''} We will confirm any changes here.`,
      pickup_confirmed: `Pickup for A7 Laundry order ${number} is complete. We will update you when the order reaches the laundry.`,
      received_at_laundry: `A7 Laundry order ${number} has arrived at the laundry. We will continue with weighing and processing and keep you updated here.`,
      ready_for_delivery: `A7 Laundry order ${number} is ready. We will coordinate the next confirmed delivery step here.`,
      payment_confirmed: `Payment for A7 Laundry order ${number} is confirmed. Thank you. We will coordinate delivery here.`,
      delivered: `A7 Laundry order ${number} was delivered. Thank you for choosing A7 Laundry Orlando.`
    },
    pt: {
      order_confirmed: `O pedido ${number} da A7 Laundry está confirmado.${window ? ` Coleta: ${window} (horário de Orlando).` : ''} Serviço: ${tier}.${promise ? ` Horário de conclusão confirmado: ${promise} (horário de Orlando).` : ''} Confirmaremos qualquer alteração por aqui.`,
      pickup_confirmed: `A coleta do pedido ${number} da A7 Laundry foi concluída. Avisaremos quando o pedido chegar à lavanderia.`,
      received_at_laundry: `O pedido ${number} da A7 Laundry chegou à lavanderia. Seguiremos com pesagem e processamento e manteremos você informado por aqui.`,
      ready_for_delivery: `O pedido ${number} da A7 Laundry está pronto. Coordenaremos por aqui a próxima etapa confirmada da entrega.`,
      payment_confirmed: `O pagamento do pedido ${number} da A7 Laundry está confirmado. Obrigado. Coordenaremos a entrega por aqui.`,
      delivered: `O pedido ${number} da A7 Laundry foi entregue. Obrigado por escolher a A7 Laundry Orlando.`
    },
    es: {
      order_confirmed: `El pedido ${number} de A7 Laundry está confirmado.${window ? ` Recogida: ${window} (hora de Orlando).` : ''} Servicio: ${tier}.${promise ? ` Hora de finalización confirmada: ${promise} (hora de Orlando).` : ''} Confirmaremos cualquier cambio por aquí.`,
      pickup_confirmed: `La recogida del pedido ${number} de A7 Laundry se completó. Le avisaremos cuando el pedido llegue a la lavandería.`,
      received_at_laundry: `El pedido ${number} de A7 Laundry llegó a la lavandería. Continuaremos con el pesaje y procesamiento y le mantendremos informado por aquí.`,
      ready_for_delivery: `El pedido ${number} de A7 Laundry está listo. Coordinaremos por aquí el siguiente paso confirmado de la entrega.`,
      payment_confirmed: `El pago del pedido ${number} de A7 Laundry está confirmado. Gracias. Coordinaremos la entrega por aquí.`,
      delivered: `El pedido ${number} de A7 Laundry fue entregado. Gracias por elegir A7 Laundry Orlando.`
    }
  };
  return messages[language][templateKey];
}

function safeDraft(row) {
  if (!row) return null;
  return {
    draft_id:String(row.draft_id || row.id || ''),
    template_key:clean(row.template_key, 40),
    template_label:TEMPLATE_LABELS[row.template_key] || 'Mensagem',
    language:languageOf(row.language),
    rendered_text:String(row.rendered_text || '').slice(0, 2000),
    status:['drafted', 'approved', 'copied', 'void'].includes(row.status) ? row.status : 'unknown',
    version:Number(row.version) || 1,
    created_at:row.created_at || null,
    approved_at:row.approved_at || null,
    copied_at:row.copied_at || null
  };
}

function requestId(raw) {
  const value = clean(raw, 64).toLowerCase();
  if (!REQUEST_UUID.test(value)) throw new InvalidTransitionError('Message request identity is invalid.');
  return value;
}

function actionKey(scope, parts) {
  return `w2-a:${scope}:${crypto.createHash('sha256').update(parts.join('|')).digest('hex')}`;
}

function assertOwner(actor) {
  if (!actor || actor.role !== 'owner' || !clean(actor.actor_id, 120)) {
    throw new InvalidTransitionError('Owner authorization is required.');
  }
}

function systemMessageService(options = {}) {
  const store = options.operationalStore || createOperationalStore(options);
  const now = options.now || (() => new Date());

  async function load(orderNumber) {
    const normalized = normalizeOrderNumber(orderNumber);
    if (!normalized) throw new InvalidTransitionError('Order number is invalid.');
    const context = await store.getSystemMessageContext(normalized);
    if (!context) return null;
    const available = Array.isArray(context.available_templates)
      ? context.available_templates.filter((key) => TEMPLATE_KEYS.includes(key)) : [];
    const drafts = (await store.listSystemMessageDrafts(normalized) || []).map(safeDraft);
    return {
      internal:context,
      safe:{
        order_number:normalized,
        whatsapp_last4:String(context.whatsapp_last4 || '').replace(/\D/g, '').slice(-4) || null,
        language:languageOf(context.language),
        is_qa:Boolean(context.is_qa),
        available_templates:available.map((key) => ({ key, label:TEMPLATE_LABELS[key] })),
        drafts
      }
    };
  }

  return {
    store,
    async context(orderNumber) {
      const loaded = await load(orderNumber);
      return loaded?.safe || null;
    },
    async create(raw, actor) {
      assertOwner(actor);
      const normalized = normalizeOrderNumber(raw.order_number);
      if (!normalized) throw new InvalidTransitionError('Order number is invalid.');
      const templateKey = clean(raw.template_key, 40);
      const id = requestId(raw.request_id);
      const idempotencyKey = actionKey('draft', [normalized, id]);
      const retry = await store.resolveSystemMessageCreateRetry({
        order_number:normalized,
        template_key:templateKey,
        idempotency_key:idempotencyKey
      });
      if (retry) return { duplicate:true, draft:safeDraft(retry.draft) };
      const loaded = await load(normalized);
      if (!loaded) throw new InvalidTransitionError('Order not found.');
      if (loaded.internal.is_qa) throw new InvalidTransitionError('QA orders cannot create customer messages.');
      if (!loaded.safe.available_templates.some((row) => row.key === templateKey)) {
        throw new InvalidTransitionError('Message template is not available for the current order state.');
      }
      const text = renderMessage(loaded.internal, templateKey);
      const hash = factsHash(loaded.internal, templateKey);
      const result = await store.createSystemMessageDraft({
        order_number:loaded.safe.order_number,
        template_key:templateKey,
        language:loaded.safe.language,
        rendered_text:text,
        facts_hash:hash,
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:idempotencyKey,
        occurred_at:now().toISOString()
      });
      return { duplicate:Boolean(result.duplicate), draft:safeDraft(result.draft) };
    },
    async approve(raw, actor) {
      assertOwner(actor);
      const loaded = await load(raw.order_number);
      if (!loaded) throw new InvalidTransitionError('Order not found.');
      const draftId = clean(raw.draft_id, 64).toLowerCase();
      const draft = loaded.safe.drafts.find((row) => row.draft_id === draftId);
      if (!UUID.test(draftId) || !draft) throw new InvalidTransitionError('Message draft is invalid.');
      const id = requestId(raw.request_id);
      const result = await store.actOnSystemMessageDraft({
        draft_id:draftId,
        action:'approve',
        expected_version:Number(raw.expected_version),
        current_facts_hash:factsHash(loaded.internal, draft.template_key),
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:actionKey('approve', [draftId, id]),
        occurred_at:now().toISOString()
      });
      return { duplicate:Boolean(result.duplicate), draft:safeDraft(result.draft) };
    },
    async copied(raw, actor) {
      assertOwner(actor);
      const loaded = await load(raw.order_number);
      if (!loaded) throw new InvalidTransitionError('Order not found.');
      const draftId = clean(raw.draft_id, 64).toLowerCase();
      const draft = loaded.safe.drafts.find((row) => row.draft_id === draftId);
      if (!UUID.test(draftId) || !draft) throw new InvalidTransitionError('Message draft is invalid.');
      const id = requestId(raw.request_id);
      const result = await store.actOnSystemMessageDraft({
        draft_id:draftId,
        action:'copy',
        expected_version:Number(raw.expected_version),
        current_facts_hash:'',
        actor_id:actor.actor_id,
        actor_role:actor.role,
        idempotency_key:actionKey('copy', [draftId, id]),
        occurred_at:now().toISOString()
      });
      return { duplicate:Boolean(result.duplicate), draft:safeDraft(result.draft) };
    }
  };
}

module.exports = {
  systemMessageService, renderMessage, factsHash, factSnapshot, safeDraft,
  languageOf, TEMPLATE_KEYS, TEMPLATE_LABELS
};
