'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  let activeUserRole = null;
  const views = ['todayView', 'ordersView', 'orderDetailView', 'attendanceView', 'customersView', 'hotelsView', 'financeView', 'teamView', 'routesView', 'passwordChangeView', 'newOrderView', 'successView'];
  let catalog = null;
  let activeQueue = 'all';
  let priorOperationalView = 'todayView';
  let activeFinanceRequest = { preset:'30d' };
  let orderFormDirty = false;
  let customerSuggestionTimer = null;
  let suppressHistory = false;

  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload.error || 'Request failed.'), { status: response.status, code: payload.code });
    return payload;
  }

  async function downloadOrderDocument(documentType, orderNumber, button, feedback) {
    const priorLabel = button.textContent;
    button.disabled = true;
    button.textContent = documentType === 'invoice_png' ? 'Gerando PNG…' : 'Gerando PDF…';
    if (feedback) feedback.textContent = '';
    try {
      const response = await fetch('/api/system/order-documents', {
        method:'POST', credentials:'same-origin',
        headers:{ Accept:documentType === 'invoice_png' ? 'image/png' : 'application/pdf', 'Content-Type':'application/json' },
        body:JSON.stringify({ document_type:documentType, order_number:orderNumber })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Não foi possível gerar o documento.');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1]
        || `A7-${documentType}-${String(orderNumber).replace(/\s+/g, '-')}.${documentType === 'invoice_png' ? 'png' : 'pdf'}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = filename; anchor.rel = 'noopener';
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (feedback) feedback.textContent = documentType === 'label'
        ? 'Etiqueta 4×6 pronta. Imprima em tamanho real (100%).'
        : documentType === 'invoice_png'
          ? 'Invoice PNG pronta, gerada com o template oficial A7_ORLANDO_INVOICE_V4.'
          : 'Invoice PDF pronta para enviar ao cliente, gerada com o template oficial A7_ORLANDO_INVOICE_V4.';
    } catch (error) {
      if (feedback) feedback.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = priorLabel;
    }
  }

  async function loadInvoiceTemplatePreview(orderNumber, image, feedback) {
    const response = await fetch('/api/system/order-documents', {
      method:'POST', credentials:'same-origin',
      headers:{ Accept:'image/png', 'Content-Type':'application/json' },
      body:JSON.stringify({ document_type:'invoice_preview', order_number:orderNumber })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Não foi possível gerar a prévia oficial.');
    }
    const blob = await response.blob();
    const priorUrl = image.dataset.objectUrl;
    if (priorUrl) URL.revokeObjectURL(priorUrl);
    const url = URL.createObjectURL(blob);
    image.dataset.objectUrl = url;
    image.src = url;
    image.hidden = false;
    feedback.textContent = 'Prévia gerada com o template oficial A7_ORLANDO_INVOICE_V4.';
  }

  function invoiceTemplatePreview(orderNumber, feedback, title) {
    const figure = node('figure', 'invoice-template-preview');
    figure.append(node('figcaption', '', title));
    const image = node('img', 'invoice-template-preview-image');
    image.alt = `Prévia oficial da invoice do pedido ${orderNumber}`;
    image.hidden = true;
    image.loading = 'lazy';
    figure.append(image);
    loadInvoiceTemplatePreview(orderNumber, image, feedback).catch((error) => {
      feedback.textContent = error.message;
    });
    return figure;
  }

  function show(view) {
    for (const id of views) $(id).hidden = id !== view;
    $('todayNav').classList.toggle('active', view === 'todayView');
    $('ordersNav').classList.toggle('active', ['ordersView', 'orderDetailView'].includes(view));
    $('attendanceNav').classList.toggle('active', ['attendanceView', 'newOrderView', 'successView'].includes(view));
    $('customersNav').classList.toggle('active', view === 'customersView');
    $('hotelsNav').classList.toggle('active', view === 'hotelsView');
    $('financeNav').classList.toggle('active', view === 'financeView');
    $('teamNav').classList.toggle('active', view === 'teamView');
    $('routesNav').classList.toggle('active', view === 'routesView');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function setRoute(path, replace = false) {
    if (suppressHistory || location.pathname === path) return;
    history[replace ? 'replaceState' : 'pushState']({ a7System:true }, '', path);
  }

  async function restoreCurrentRoute() {
    const path = decodeURIComponent(location.pathname);
    const orderMatch = path.match(/^\/sistema\/orders\/(A7-ORL-\d{4,}|MCO[ -](?:\d{4,12}))$/i);
    suppressHistory = true;
    try {
      if (orderMatch) return await refreshOperationalDetail(orderMatch[1].toUpperCase(), true);
      if (path === '/sistema/orders') { show('ordersView'); return await loadOperationalOrders(activeQueue, ''); }
      if (path === '/sistema/customers') return show('customersView');
      if (path === '/sistema/billing') return await openFinance();
      if (path === '/sistema/routes') return await openRoutes();
      if (path === '/sistema/attendance') return show('attendanceView');
      if (path === '/sistema/hotels') return $('hotelsNav').click();
      if (path === '/sistema/team' && activeUserRole === 'owner') return $('teamNav').click();
      show('todayView');
      return await loadToday();
    } finally { suppressHistory = false; }
  }

  function money(value) { return value == null ? 'Review required' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); }
  function confirmedMoney(value) { return value == null ? 'Não confirmado' : money(value); }
  function shortDate(value) { return value ? new Date(value).toLocaleDateString() : 'Não informado'; }
  function dateTime(value) {
    return value ? new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short'
    }).format(new Date(value)) : 'Não informado';
  }
  function customerType(value) {
    return ({ guest: 'Visitor', resident: 'Resident', host: 'Host', commercial: 'Business' })[value] || 'Não informado';
  }
  function localIso(value) { return value ? new Date(value).toISOString() : null; }
  function selectedTier() { return new FormData($('orderForm')).get('service_tier') || 'normal'; }
  function service(code) { return catalog?.services.find((row) => row.code === code); }
  function pickupPath(orderNumber) { return `/sistema/orders/${encodeURIComponent(orderNumber)}/pickup-order`; }

  function displayOrderNumber(order) {
    const value = String(order?.order_number || '').trim();
    const legacyDate = /^HIST-(\d{4})(\d{2})(\d{2})-(\d+)$/i.exec(value);
    if (legacyDate) return `Histórico · ${legacyDate[3]}/${legacyDate[2]}/${legacyDate[1]} · ${Number(legacyDate[4])}`;
    if (/^HIST-STRIPE-/i.test(value)) {
      const date = order?.accepted_at ? shortDate(order.accepted_at) : '';
      return date && date !== '—' ? `Histórico · ${date}` : 'Pedido histórico';
    }
    const oldOperational = /^A7-ORL-(\d+)$/i.exec(value);
    if (oldOperational) return `MCO ${Number(oldOperational[1])}`;
    return value;
  }

  function refreshCommercial() {
    if (!catalog) return;
    const tier = selectedTier();
    const wash = service(tier === 'express' ? 'wash_fold_express' : 'wash_fold_normal');
    $('normalPrice').textContent = `${money(service('wash_fold_normal').unit_price)}/lb · ${money(service('wash_fold_normal').minimum_amount)} minimum`;
    $('expressPrice').textContent = `${money(service('wash_fold_express').unit_price)}/lb · subject to availability`;
    const data = new FormData($('orderForm'));
    const agreedMinimum = Number(data.get('agreed_minimum_amount') || wash.minimum_amount);
    $('washRule').textContent = `${money(wash.unit_price)}/lb · ${money(agreedMinimum)} minimum agreed`;
    const lines = [];
    if (data.get('wash_fold')) lines.push(`Wash & Fold ${tier}: ${money(wash.unit_price)}/lb; ${money(agreedMinimum)} minimum agreed for this sale.`);
    if (data.get('special_code')) {
      const special = service(data.get('special_code'));
      lines.push(`${special.label}: ${money(special.unit_price)} per ${special.unit}.`);
    }
    $('commercialSummary').textContent = lines.join(' ') || 'Select at least one service.';
    syncExpressPromise();
  }

  function localFieldValue(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }

  function syncExpressPromise() {
    const form = $('orderForm');
    const express = selectedTier() === 'express';
    const field = $('promisedByField');
    const input = form.elements.promised_by;
    field.hidden = !express;
    input.required = express;
    if (!express) { input.value = ''; input.dataset.userEdited = ''; return; }
    const pickup = new Date(form.elements.pickup_window_start.value || '');
    if (!input.dataset.userEdited && Number.isFinite(pickup.getTime())) {
      input.value = localFieldValue(new Date(pickup.getTime() + 8 * 60 * 60_000));
    }
  }

  function confirmOrderFormExit() {
    return !orderFormDirty || window.confirm('Há dados ainda não salvos neste atendimento. Deseja sair mesmo assim?');
  }

  async function loadCatalog() {
    const payload = await request('/api/system/catalog');
    catalog = payload.catalog;
    const select = $('orderForm').elements.special_code;
    for (const row of catalog.services.filter((item) => !item.tier)) {
      const option = document.createElement('option');
      option.value = row.code;
      option.textContent = `${row.label} · ${money(row.unit_price)}`;
      select.append(option);
    }
    refreshCommercial();
  }

  function defaultTimes() {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(now.getTime() + 60 * 60_000);
    const needed = new Date(now.getTime() + 24 * 60 * 60_000);
    $('orderForm').elements.pickup_window_start.value = localFieldValue(now);
    $('orderForm').elements.pickup_window_end.value = localFieldValue(end);
    $('orderForm').elements.needed_by.value = localFieldValue(needed);
  }

  async function openNew() {
    await request('/api/system/order-draft', { method: 'POST' });
    $('orderForm').reset();
    $('orderForm').elements.name.readOnly = false;
    $('orderForm').elements.whatsapp_number.readOnly = false;
    orderFormDirty = false;
    $('orderForm').elements.promised_by.dataset.userEdited = '';
    $('customerSuggestions').hidden = true;
    $('customerSuggestions').replaceChildren();
    $('orderError').textContent = '';
    defaultTimes();
    if (!catalog) await loadCatalog();
    refreshCommercial();
    show('newOrderView');
    setRoute('/sistema/attendance');
  }

  async function openExistingLead(leadRef) {
    if (!leadRef) throw new Error('Este atendimento não possui uma referência segura. Atualize a página.');
    const payload = await request('/api/system/leads', {
      method:'POST', body:JSON.stringify({ action:'detail', lead_ref:leadRef })
    });
    await openNew();
    const lead = payload.lead;
    const form = $('orderForm');
    form.elements.lead_ref.value = lead.lead_ref;
    form.elements.customer_ref.value = '';
    form.elements.name.value = lead.customer_name;
    form.elements.name.readOnly = true;
    form.elements.whatsapp_number.value = lead.whatsapp_number || '';
    form.elements.whatsapp_number.readOnly = true;
    if (['en', 'pt', 'es', 'other'].includes(lead.language)) form.elements.language.value = lead.language;
    if (['guest', 'resident', 'host'].includes(lead.customer_type)) form.elements.customer_type.value = lead.customer_type;
    if (['hotel', 'airbnb', 'residence'].includes(lead.accommodation_type)) form.elements.accommodation_type.value = lead.accommodation_type;
    form.elements.property.value = lead.property || '';
    form.elements.property_address.value = lead.property_address || '';
    form.elements.room.value = lead.room || '';
    form.elements.location_notes.value = lead.location_notes || '';
    form.elements.lead_reference.value = lead.lead_reference || '';
    form.elements.estimated_lbs.value = lead.estimated_lbs || '';
    if (lead.pickup_window_start) form.elements.pickup_window_start.value = localFieldValue(new Date(lead.pickup_window_start));
    if (lead.pickup_window_end) form.elements.pickup_window_end.value = localFieldValue(new Date(lead.pickup_window_end));
    if (lead.needed_by) form.elements.needed_by.value = localFieldValue(new Date(lead.needed_by));
    const tier = lead.service_tier_preference === 'express' ? 'express' : 'normal';
    form.querySelector(`[name="service_tier"][value="${tier}"]`).checked = true;
    $('customerSuggestions').classList.add('customer-suggestion-selected');
    $('customerSuggestions').replaceChildren(node('span', '',
      `Solicitação do site selecionada · identidade analítica ${lead.analytics_identity_present ? 'presente' : 'ausente'}. O lead original será preservado.`));
    $('customerSuggestions').hidden = false;
    syncExpressPromise();
    refreshCommercial();
    orderFormDirty = false;
  }

  async function openNewForCustomer(customer) {
    await openNew();
    const form = $('orderForm');
    form.elements.customer_ref.value = customer.customer_ref;
    form.elements.name.value = customer.name;
    form.elements.whatsapp_number.value = `+•••• ${String(customer.whatsapp_number || '').slice(-4)}`;
    if (['en', 'pt', 'es', 'other'].includes(customer.language)) form.elements.language.value = customer.language;
    if (['guest', 'resident', 'host'].includes(customer.customer_type)) form.elements.customer_type.value = customer.customer_type;
    if (['hotel', 'airbnb', 'residence'].includes(customer.latest_accommodation_type)) {
      form.elements.accommodation_type.value = customer.latest_accommodation_type;
    }
    if (customer.latest_property) form.elements.property.value = customer.latest_property;
    $('customerSuggestions').classList.add('customer-suggestion-selected');
    $('customerSuggestions').replaceChildren(node('span', '', `Cliente existente selecionado: ${customer.name}. O contato protegido será reutilizado.`));
    $('customerSuggestions').hidden = false;
    orderFormDirty = true;
  }

  function itemsFromForm(data) {
    const items = [];
    if (data.get('wash_fold')) items.push({ code: 'wash_fold', estimated_lbs: data.get('estimated_lbs') || null });
    if (data.get('special_code')) items.push({ code: data.get('special_code'), quantity: data.get('special_quantity') || 1 });
    return items;
  }

  function clearKnownCustomer() {
    $('orderForm').elements.customer_ref.value = '';
    $('customerSuggestions').classList.remove('customer-suggestion-selected');
  }

  async function suggestCustomers(query) {
    const box = $('customerSuggestions');
    if ($('orderForm').elements.customer_ref.value) return;
    const source = String(query || '').trim();
    const digits = source.replace(/\D/g, '');
    if (source.length < 3 || (/^[\d\s()+.-]+$/.test(source) && digits.length < 7)) {
      box.hidden = true; box.replaceChildren(); return;
    }
    try {
      const payload = await request('/api/system/customers', {
        method:'POST', body:JSON.stringify({ action:'search', query:source, limit:5 })
      });
      box.replaceChildren();
      for (const customer of payload.customers || []) {
        const button = node('button', 'customer-suggestion'); button.type = 'button';
        const identity = node('span');
        identity.append(node('strong', '', customer.name), node('small', '', [
          customer.whatsapp_last4 ? `WhatsApp final ${customer.whatsapp_last4}` : null,
          customer.latest_property, `${customer.order_count || 0} pedido(s)`
        ].filter(Boolean).join(' · ')));
        button.append(identity, node('strong', '', 'Usar cliente'));
        button.addEventListener('click', () => {
          const form = $('orderForm');
          form.elements.customer_ref.value = customer.customer_ref;
          form.elements.name.value = customer.name;
          form.elements.whatsapp_number.value = `+•••• ${customer.whatsapp_last4 || ''}`;
          box.classList.add('customer-suggestion-selected');
          box.replaceChildren(node('span', '', `Cliente existente selecionado: ${customer.name}. O cadastro protegido será reutilizado.`));
          box.hidden = false; orderFormDirty = true;
        });
        box.append(button);
      }
      box.hidden = !box.childElementCount;
    } catch (_) {
      box.hidden = true; box.replaceChildren();
    }
  }

  function showOrder(order, target) {
    target.className = 'lookup-result';
    target.innerHTML = `<strong>${escapeText(displayOrderNumber(order))}</strong><p>${escapeText(order.customer_name || 'Customer')} · ${escapeText(order.property || 'Property')} · ${escapeText((order.service_tier || '').toUpperCase())}</p><small>Next action: ${escapeText(order.next_action || order.order_status)}</small><a class="pickup-inline-link" href="${pickupPath(order.order_number)}" target="_blank" rel="noopener">Abrir Pickup Order</a>`;
  }

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text != null) result.textContent = text;
    return result;
  }

  const QUEUE_LABELS = {
    all:'Todos', new:'Novos', pickups_today:'Coletas', with_driver:'Com motorista',
    at_laundry:'Na lavanderia', awaiting_weight:'Para pesar', processing:'Processando', ready:'Prontos',
    charge:'Para cobrar', awaiting_payment:'Aguardando pagamento', deliveries:'Entregas', express:'Express',
    express_attention:'Express em atenção', express_risk:'Express em risco', express_late:'Express atrasado',
    late:'Atrasados', home_pickups:'Aguardando coleta',
    payment_attention:'Pagamento requer atenção', ready_dispatch:'Prontos para sair', blockers:'Bloqueios'
  };
  const STATE_LABELS = {
    with_customer:'Com o cliente', awaiting_pickup:'Aguardando coleta', with_driver_pickup:'Com motorista',
    at_laundry:'Na lavanderia', with_driver_delivery:'Com motorista para entrega', bell_desk:'Na recepção / Bell Desk', delivered:'Entregue',
    awaiting_intake:'Aguardando chegada', awaiting_weight:'Aguardando pesagem', awaiting_processing:'Aguardando processamento',
    processing:'Em processamento', ready:'Pronto', pending:'Pendente', invoice_created:'Fatura criada', paid:'Pago',
    failed:'Falhou', void:'Anulado', issued:'Emitida', superseded:'Substituída', accepted:'Aceito', pickup_scheduled:'Coleta agendada', picked_up:'Coletado', weighed:'Pesado',
    ready_for_delivery:'Pronto para entrega', cancelled:'Cancelado', new:'Novo', qualifying:'Qualificando', qualified:'Qualificado',
    not_initialized:'Não informado', operational_blocker:'Bloqueio operacional', cash:'Dinheiro', zelle:'Zelle', stripe:'Stripe', other:'Outro'
  };
  const ACTION_LABELS = {
    order_accepted:'Venda confirmada', pickup_scheduled:'Coleta agendada', pickup_completed:'Coleta concluída',
    order_weighed:'Pesagem concluída', item_weight_recorded:'Peso do item registrado',
    item_weight_corrected:'Peso do item corrigido',
    invoice_issued:'Invoice emitida', invoice_voided:'Invoice anulada',
    order_ready_for_delivery:'Pronto para entrega', order_delivered:'Pedido entregue', schedule_pickup:'Coleta agendada',
    initialize_legacy_order:'Controle operacional iniciado',
    confirm_pickup:'Coleta confirmada', receive_at_laundry:'Recebido na lavanderia', start_processing:'Processamento iniciado',
    mark_ready:'Marcado como pronto', start_delivery:'Saiu para entrega', leave_bell_desk:'Deixado no Bell Desk',
    complete_delivery:'Entrega concluída', set_promised_by:'Prazo Express definido',
    assign_pickup_driver:'Motorista da coleta designado', assign_delivery_driver:'Motorista da entrega designado',
    manual_payment_recorded:'Pagamento registrado'
  };

  function stateLabel(value) { return STATE_LABELS[value] || 'Não informado'; }
  function axisStateLabel(axis, order) {
    if (axis === 'Produção' && order.order_status === 'delivered') return 'Concluída';
    if (axis === 'Produção' && order.order_status === 'cancelled') return 'Encerrada';
    return stateLabel(order[axis === 'Lifecycle' ? 'order_status'
      : axis === 'Custódia' ? 'custody_state'
        : axis === 'Produção' ? 'production_state' : 'payment_status']);
  }
  function slaLabel(order) {
    const labels = { late:'ATRASADO', risk:'RISCO', attention:'ATENÇÃO', ok:'NO PRAZO', not_set:'PRAZO NÃO DEFINIDO', not_configured:'SLA PENDENTE', not_applicable:'STANDARD' };
    if (order.obligation?.overdue) return `ATRASADO · ${order.obligation.obligation === 'pickup' ? 'COLETA' : 'ENTREGA'}`;
    const base = labels[order.sla?.status] || 'SEM SLA';
    if (['late', 'risk', 'attention', 'ok'].includes(order.sla?.status) && Number.isFinite(order.sla?.remaining_minutes)) {
      const minutes = Math.abs(order.sla.remaining_minutes);
      const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}` : `${minutes}min`;
      return order.sla.remaining_minutes < 0 ? `${base} · ${time}` : `${base} · ${time} restantes`;
    }
    return base;
  }

  function operationCard(order) {
    const visualSla = order.obligation?.overdue ? 'late' : (order.sla?.status || 'none');
    const button = node('button', `operation-card sla-${visualSla}${order.is_qa ? ' qa' : ''}`);
    button.type = 'button';
    const top = node('span', 'operation-card-top');
    top.append(node('strong', '', displayOrderNumber(order)), node('span', 'tier-badge', String(order.service_tier || '').toUpperCase()));
    const who = node('span', 'operation-card-who');
    who.append(node('strong', '', order.customer_name), node('small', '', [order.property, order.room ? `Room ${order.room}` : null].filter(Boolean).join(' · ') || 'Local não informado'));
    const facts = node('span', 'operation-card-facts');
    facts.append(node('span', 'state-pill', stateLabel(order.custody_state)), node('span', `sla-pill ${visualSla}`, order.is_qa ? 'QA · LEITURA' : slaLabel(order)));
    const next = node('span', 'operation-card-next');
    next.append(node('small', '', 'PRÓXIMA AÇÃO'), node('strong', '', order.next_action?.label || 'Revisar'));
    button.append(top, who, facts, next);
    button.addEventListener('click', () => openOperationalDetail(order.order_number));
    return button;
  }

  function renderOperationList(target, orders, empty = 'Nenhum pedido nesta fila.') {
    target.replaceChildren();
    if (!orders.length) return target.append(node('section', 'panel operation-empty', empty));
    for (const order of orders) target.append(operationCard(order));
  }

  function renderWaitingLeads(target, leads) {
    target.replaceChildren();
    if (!leads.length) return target.append(node('section', 'panel operation-empty', 'Nenhum atendimento aguardando confirmação.'));
    for (const lead of leads) {
      const button = node('button', 'operation-card lead-card'); button.type = 'button';
      const status = node('span', 'operation-card-top'); status.append(node('strong', '', 'ATENDIMENTO'), node('span', 'tier-badge', stateLabel(lead.status)));
      const who = node('span', 'operation-card-who'); who.append(node('strong', '', lead.customer_name), node('small', '', `${lead.property || 'Local não informado'}${lead.whatsapp_last4 ? ` · WhatsApp final ${lead.whatsapp_last4}` : ''}`));
      const next = node('span', 'operation-card-next'); next.append(node('small', '', 'PRÓXIMA AÇÃO'), node('strong', '', 'CONFIRMAR VENDA'));
      button.append(status, who, next);
      button.addEventListener('click', () => openExistingLead(lead.lead_ref).catch((error) => {
        $('todayError').textContent = error.message;
      }));
      target.append(button);
    }
  }

  async function loadOperationalOrders(queue = activeQueue, query = '') {
    activeQueue = queue;
    $('ordersError').textContent = '';
    const payload = await request('/api/system/operational-orders', {
      method:'POST', body:JSON.stringify({ action:'list', queue, query,
        custody_state:$('custodyFilter').value, production_state:$('productionFilter').value })
    });
    const empty = query
      ? `Nenhum pedido encontrado para “${query}”. Limpe a busca ou tente nome, hotel, telefone ou MCO.`
      : 'Nenhum pedido nesta fila.';
    renderOperationList($('ordersResults'), payload.orders, empty);
    for (const button of $('queueFilters').querySelectorAll('button')) button.classList.toggle('active', button.dataset.queue === queue);
    return payload.orders;
  }

  function buildQueueFilters() {
    const target = $('queueFilters');
    target.replaceChildren();
    for (const queue of ['all', 'new', 'pickups_today', 'with_driver', 'at_laundry', 'awaiting_weight', 'processing', 'ready', 'charge', 'awaiting_payment', 'deliveries', 'express', 'late']) {
      const button = node('button', queue === activeQueue ? 'active' : '', QUEUE_LABELS[queue]);
      button.type = 'button'; button.dataset.queue = queue;
      button.addEventListener('click', () => loadOperationalOrders(queue, '').catch((error) => { $('ordersError').textContent = error.message; }));
      target.append(button);
    }
  }

  function homeValue(value, formatter = String) { return value == null ? '—' : formatter(value); }

  async function openHomeTarget(target) {
    if (!target) return;
    if (target.view === 'attendance') return show('attendanceView');
    if (target.view === 'finance') return openFinance(target.period || { preset:'7d' });
    show('ordersView');
    return loadOperationalOrders(target.queue || 'all', '');
  }

  function metricCard(label, value, detail, target = null) {
    const card = node(target ? 'button' : 'article', 'home-metric');
    if (target) { card.type = 'button'; card.addEventListener('click', () => openHomeTarget(target).catch((error) => { $('todayError').textContent = error.message; })); }
    card.append(node('span', 'home-metric-label', label));
    const result = node('div'); result.append(node('strong', '', value), node('small', '', detail)); card.append(result);
    return card;
  }

  function renderHomeActions(actions) {
    const target = $('todayOrders'); target.replaceChildren();
    if (!actions.length) return target.append(node('section', 'panel operation-empty', 'Nenhuma ação operacional pendente agora.'));
    for (const action of actions) {
      const button = node('button', `operation-card${action.sla_status ? ` sla-${action.sla_status}` : ' lead-card'}`); button.type = 'button';
      const top = node('span', 'operation-card-top');
      top.append(node('strong', '', action.kind === 'order' ? displayOrderNumber(action) : 'ATENDIMENTO'),
        node('span', 'tier-badge', action.kind === 'order' ? String(action.service_tier || '').toUpperCase() : 'LEAD'));
      const who = node('span', 'operation-card-who'); who.append(node('strong', '', action.customer_name), node('small', '', action.property || 'Local não informado'));
      const facts = node('span', 'operation-card-facts');
      if (action.kind === 'order') facts.append(node('span', 'state-pill', stateLabel(action.payment_status)), node('span', `sla-pill ${action.sla_status || ''}`, action.deadline ? shortDate(action.deadline) : 'Sem prazo registrado'));
      const next = node('span', 'operation-card-next'); next.append(node('small', '', 'PRÓXIMA AÇÃO'), node('strong', '', action.next_action.label));
      button.append(top, who, facts, next);
      button.addEventListener('click', () => action.kind === 'order' ? openOperationalDetail(action.order_number)
        : openExistingLead(action.lead_ref).catch((error) => { $('todayError').textContent = error.message; }));
      target.append(button);
    }
  }

  function renderHome(home) {
    const operation = $('homeOperation'); operation.replaceChildren();
    operation.append(
      metricCard('Coletas', String(home.operation.pickups.count), home.operation.pickups.next_window ? `Próxima ${dateTime(home.operation.pickups.next_window)}` : 'Sem próxima janela registrada', home.operation.pickups.target),
      metricCard('Com motorista', String(home.operation.with_driver.count), `${home.operation.with_driver.pickup} coleta · ${home.operation.with_driver.delivery} entrega`, home.operation.with_driver.target),
      metricCard('Processando', String(home.operation.processing.count), `${homeValue(home.operation.processing.actual_lbs, (value) => `${value} lb`)} confirmadas`, home.operation.processing.target),
      metricCard('Prontos', String(home.operation.ready.count), `${home.operation.ready.at_laundry} lavanderia · ${home.operation.ready.with_driver_delivery} rota · ${home.operation.ready.bell_desk} bell desk`, home.operation.ready.target)
    );
    const secondary = home.operation.at_laundry_secondary;
    $('homeAtLaundry').textContent = `${secondary.count} na lavanderia · ${secondary.awaiting_weight} para pesar · ${secondary.awaiting_processing} aguardando · ${secondary.processing} processando · ${secondary.ready} prontos`;

    const attention = $('homeAttention'); attention.replaceChildren();
    for (const item of home.needs_attention) {
      const button = node('button', `home-alert ${item.tone || ''}`); button.type = 'button';
      const copy = node('span', 'home-alert-copy'); copy.append(node('strong', '', item.label));
      const detail = item.key === 'payments_pending' ? 'Valor não disponível neste resumo' : 'Abrir fila correspondente';
      copy.append(node('small', '', detail));
      button.append(node('span', 'home-alert-mark'), copy, node('span', 'home-alert-count', String(item.count)));
      button.addEventListener('click', () => openHomeTarget(item.target).catch((error) => { $('todayError').textContent = error.message; }));
      attention.append(button);
    }
    $('homeAttentionSection').hidden = home.needs_attention.length === 0;
    renderHomeActions(home.next_actions);

    if (home.business_today) {
      const business = $('homeBusiness'); business.replaceChildren();
      const data = home.business_today;
      if (data.availability === 'current') business.append(
        metricCard('Receita hoje', homeValue(data.revenue, money), 'Receita de serviço confirmada'),
        metricCard('Pedidos hoje', String(data.orders_accepted), 'Vendas aceitas hoje'),
        metricCard('Ticket médio pago', homeValue(data.average_paid_order, money), 'Mesmo grupo de pedidos pagos'),
        metricCard('Libras pesadas', homeValue(data.pounds, (value) => `${value} lb`), data.orders_weighed ? `${data.orders_weighed} pedido(s) · média ${data.average_lbs_per_weighed_order} lb` : 'Nenhum peso confirmado hoje')
      );
      else business.append(node('div', 'home-unavailable', 'Faturamento temporariamente indisponível. Os dados operacionais continuam atuais.'));
      $('homeBusinessSection').hidden = false;
    }

    if (home.last_7_days) {
      const target = $('homeSevenDays'); target.replaceChildren();
      const data = home.last_7_days;
      if (data.availability === 'current') {
        const summary = node('article', 'home-period-summary'); summary.append(node('span', '', 'Receita confirmada'), node('strong', '', money(data.current.revenue)), node('small', '', `${data.current.paid_orders} pedidos pagos · ${data.current.period.start_date} a ${data.current.period.end_date}`)); target.append(summary);
        for (const [key, label, formatter] of [['average_paid_order', 'Ticket médio', money], ['paying_customers', 'Clientes pagantes', String], ['repeat_orders', 'Pedidos recorrentes', String]]) {
          const card = node('article', 'home-trend'); card.append(node('span', '', label), node('strong', '', homeValue(data.current[key], formatter)));
          const change = data.delta_percent[key];
          card.append(node('small', `home-delta${change > 0 ? ' positive' : change < 0 ? ' negative' : ''}`, change == null ? 'Comparação indisponível' : `${change > 0 ? '+' : ''}${change}% vs. 7 dias anteriores`)); target.append(card);
        }
      } else target.append(node('div', 'home-unavailable', 'Comparativo financeiro indisponível. Nenhum valor foi inferido.'));
      $('homeSevenDaysSection').hidden = false;
    }
    $('homeOperationSection').hidden = false; $('homeActionsSection').hidden = false;
  }

  async function loadToday() {
    $('todayError').textContent = ''; $('todayView').setAttribute('aria-busy', 'true');
    $('homeLoading').hidden = false;
    for (const id of ['homeAttentionSection', 'homeOperationSection', 'homeActionsSection', 'homeBusinessSection', 'homeSevenDaysSection']) $(id).hidden = true;
    try {
      const payload = await request('/api/system/home');
      const home = payload.home;
      $('todayFreshness').textContent = `Atualizado ${dateTime(home.meta.as_of)} · ${home.meta.timezone}${home.meta.availability === 'partial' ? ' · dados financeiros parciais' : ''}`;
      renderHome(home);
    } catch (error) {
      $('todayError').textContent = error.message;
      $('todayFreshness').textContent = 'Não foi possível atualizar a Home. Nenhum zero foi presumido.';
      throw error;
    } finally {
      $('homeLoading').hidden = true; $('todayView').setAttribute('aria-busy', 'false');
    }
  }

  function renderCustomerResults(customers) {
    const target = $('customerResults');
    target.replaceChildren();
    $('customerDetail').hidden = true;
    if (!customers.length) {
      target.append(node('p', 'customer-empty', 'Nenhum cliente encontrado.'));
      return;
    }
    for (const customer of customers) {
      const button = node('button', 'customer-result');
      button.type = 'button';
      const identity = node('span', 'customer-result-identity');
      identity.append(node('strong', '', customer.name));
      identity.append(node('small', '', `WhatsApp final ${customer.whatsapp_last4 || '—'} · ${customer.order_count} pedido(s)`));
      const context = node('span', 'customer-result-context');
      context.append(node('strong', '', `${money(customer.confirmed_service_revenue)} confirmados`));
      context.append(node('small', '', `Último pedido: ${shortDate(customer.latest_accepted_at)}`));
      button.append(identity, context, node('span', 'customer-chevron', '›'));
      button.addEventListener('click', () => openCustomer(customer.customer_ref));
      target.append(button);
    }
  }

  function renderCustomerDetail(customer) {
    const target = $('customerDetail');
    target.replaceChildren();
    const heading = node('div', 'customer-detail-head');
    const identity = node('div');
    identity.append(node('p', 'eyebrow', 'CLIENTE'), node('h2', '', customer.name));
    identity.append(node('p', 'customer-contact', customer.whatsapp_number || 'WhatsApp não informado'));
    const newOrder = node('button', 'primary', '+ Novo pedido');
    newOrder.type = 'button';
    newOrder.addEventListener('click', () => openNewForCustomer(customer).catch((error) => {
      $('customerSearchError').textContent = error.message;
    }));
    heading.append(identity, newOrder);
    const facts = node('dl', 'customer-facts');
    for (const [label, value] of [
      ['Email', customer.email || 'Não informado'], ['Idioma', customer.language || 'Não informado'],
      ['Tipo', customerType(customer.customer_type)], ['Última propriedade', customer.latest_property || 'Não informado'],
      ['Pedidos', customer.summary?.order_count ?? 0],
      ['Receita confirmada', money(customer.summary?.confirmed_service_revenue || 0)],
      ['Primeiro pedido', shortDate(customer.summary?.first_order_at)],
      ['Último pedido', shortDate(customer.summary?.last_order_at)],
      ['Origem inicial', customer.summary?.acquisition_source || 'Não disponível']
    ]) {
      const item = node('div'); item.append(node('dt', '', label), node('dd', '', value ?? 'Não informado')); facts.append(item);
    }
    const ordersHeading = node('h3', '', 'Pedidos');
    const orders = node('div', 'customer-orders');
    for (const order of customer.orders || []) {
      const row = node('div', 'customer-order');
      const summary = node('div');
      summary.append(node('strong', '', displayOrderNumber(order)));
      summary.append(node('small', '', `${String(order.service_tier || '').toUpperCase()} · ${confirmedMoney(order.confirmed_service_revenue)}${order.is_qa ? ' · QA excluído' : ''}`));
      const status = node('span', `customer-order-status${order.is_qa ? ' qa' : ''}`, order.is_qa ? 'QA' : (order.order_status || 'unknown'));
      const link = node('a', 'pickup-inline-link', 'Pickup Order');
      link.href = order.pickup_order_path;
      link.target = '_blank'; link.rel = 'noopener';
      row.append(summary, status, link); orders.append(row);
    }
    if (!customer.orders?.length) orders.append(node('p', 'customer-empty', 'Nenhum pedido encontrado.'));
    target.append(heading, facts, ordersHeading, orders);
    target.hidden = false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openCustomer(customerRef) {
    $('customerSearchError').textContent = '';
    try {
      const payload = await request('/api/system/customers', {
        method: 'POST', body: JSON.stringify({ action: 'detail', customer_ref: customerRef })
      });
      renderCustomerDetail(payload.customer);
    } catch (error) { $('customerSearchError').textContent = error.message; }
  }

  function financeAvailabilityLabel(value) {
    return ({ current:'Confirmado', partial:'Parcial', unavailable:'Indisponível', no_data:'Sem dados' })[value] || 'Indisponível';
  }

  function financePeriodDate(value) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', timeZone:'UTC' })
      .format(new Date(`${value}T12:00:00.000Z`));
  }

  function financeKpi(label, value, note, primary = false) {
    const card = node('article', `finance-kpi${primary ? ' primary-finance' : ''}`);
    card.append(node('small', '', label), node('strong', '', String(value)), node('span', '', note));
    return card;
  }

  function renderFinanceBreakdown(target, rows) {
    target.replaceChildren();
    if (!rows.length) return target.append(node('p', 'finance-empty', 'Sem receita confirmada neste período.'));
    const table = node('table', 'finance-table');
    const head = node('thead');
    const headRow = node('tr');
    for (const label of ['Grupo', 'Pedidos', 'Receita']) headRow.append(node('th', '', label));
    head.append(headRow); table.append(head);
    const body = node('tbody');
    for (const row of rows) {
      const tr = node('tr');
      tr.append(node('td', '', row.bucket), node('td', '', String(row.paid_order_count)),
        node('td', '', money(row.confirmed_service_revenue)));
      body.append(tr);
    }
    table.append(body); target.append(table);
  }

  function renderFinance(report) {
    const { summary, availability, period } = report;
    $('financePeriod').replaceChildren(
      node('strong', '', `${financePeriodDate(period.start_date)} a ${financePeriodDate(period.end_date)}`),
      node('span', '', `Base: pagamento confirmado · ${period.timezone}`)
    );
    $('financeCustomForm').elements.start_date.value = period.start_date;
    $('financeCustomForm').elements.end_date.value = period.end_date;
    for (const button of $('financePresetButtons').querySelectorAll('button')) {
      button.classList.toggle('active', button.dataset.financePeriod === period.preset);
    }
    const kpis = $('financeKpis'); kpis.replaceChildren();
    kpis.append(
      financeKpi('Receita de serviço confirmada', money(summary.confirmed_service_revenue), 'Sem gorjetas; refunds confirmados deduzidos', true),
      financeKpi('Total recebido', money(summary.gross_received), 'Pagamento reconciliado, líquido de refunds'),
      financeKpi('Gorjetas confirmadas', summary.confirmed_tips == null ? 'Indisponível' : money(summary.confirmed_tips), financeAvailabilityLabel(availability.tips)),
      financeKpi('Pedidos pagos', summary.paid_order_count, `${summary.normal_paid_orders} Normal · ${summary.express_paid_orders} Express`),
      financeKpi('Ticket médio do serviço', summary.average_service_ticket == null ? 'Sem pagamentos' : money(summary.average_service_ticket), 'Receita de serviço ÷ pedidos pagos'),
      financeKpi('Clientes identificados', summary.customer_count, 'Identidade operacional durável'),
      financeKpi('Novos / recorrentes', `${summary.new_customer_orders} / ${summary.repeat_customer_orders}`, 'Classificação no momento do pedido'),
      financeKpi('Pagamentos pendentes', summary.pending_payment_count,
        summary.pending_payment_value == null ? financeAvailabilityLabel(availability.pending_payment_value) : `${money(summary.pending_payment_value)} conhecido`)
    );
    renderFinanceBreakdown($('financeServiceBreakdown'), report.breakdowns.service);
    renderFinanceBreakdown($('financeAcquisitionBreakdown'), report.breakdowns.acquisition);
    renderFinanceBreakdown($('financeHotelBreakdown'), report.breakdowns.hotel);
    const facts = $('financeAvailability'); facts.replaceChildren();
    for (const [label, value] of [
      ['Receita', availability.service_revenue], ['Gorjetas', availability.tips],
      ['Pendências', availability.pending_payment_value], ['Tarifas do processador', availability.processing_fees],
      ['Repasse líquido', availability.net_payout], ['Atualizado', dateTime(report.freshness.generated_at)]
    ]) {
      const item = node('div'); item.append(node('dt', '', label), node('dd', '', label === 'Atualizado' ? value : financeAvailabilityLabel(value))); facts.append(item);
    }
    $('financeSources').textContent = `Fontes: ${report.sources.join(' · ') || 'Indisponíveis'}.`;
  }

  async function loadFinance(requestBody = activeFinanceRequest) {
    if (!['owner', 'manager'].includes(activeUserRole)) throw new Error('Acesso financeiro não autorizado.');
    const nextRequest = { ...requestBody };
    $('financeError').textContent = '';
    $('financeLoading').hidden = false;
    $('financeContent').hidden = true;
    const payload = await request('/api/system/finance', {
      method:'POST', body:JSON.stringify(nextRequest)
    });
    activeFinanceRequest = nextRequest;
    renderFinance(payload.finance);
    $('financeLoading').hidden = true;
    $('financeContent').hidden = false;
  }

  async function openFinance() {
    show('financeView');
    setRoute('/sistema/billing');
    await loadFinance(activeFinanceRequest);
  }

  function factGrid(rows) {
    const facts = node('dl', 'detail-facts');
    for (const [label, value] of rows) {
      const item = node('div'); item.append(node('dt', '', label), node('dd', '', value == null || value === '' ? 'Não informado' : String(value))); facts.append(item);
    }
    return facts;
  }

  function detailSection(title) {
    const section = node('section', 'panel detail-section');
    section.append(node('h2', '', title));
    return section;
  }

  function invoiceFactsCard(facts, title) {
    const card = node('article', 'invoice-card');
    card.append(node('h3', '', title));
    const lines = node('div', 'invoice-lines');
    for (const line of facts.lines || []) {
      const row = node('div', `invoice-line ${line.line_type || ''}`);
      const lineLabel = line.line_type === 'minimum_adjustment' ? 'Ajuste para o mínimo do pedido' : (line.label || 'Serviço');
      const description = node('span'); description.append(node('strong', '', lineLabel));
      const basis = line.unit === 'lb'
        ? `${line.actual_lbs} lb × ${money(line.unit_price)}`
        : line.line_type === 'minimum_adjustment' ? 'Mínimo do pedido'
          : `${line.quantity} × ${money(line.unit_price)}`;
      description.append(node('small', '', basis));
      row.append(description, node('strong', '', money(line.subtotal)));
      lines.append(row);
    }
    const totals = node('dl', 'invoice-totals');
    for (const [label, value] of [
      ['Itens', facts.item_subtotal], ['Ajuste de mínimo', facts.minimum_adjustment],
      ['Tip', 0], ['Total do serviço', facts.service_amount]
    ]) {
      const item = node('div'); item.append(node('dt', '', label), node('dd', '', money(value))); totals.append(item);
    }
    card.append(lines, totals);
    return card;
  }

  function invoiceBlockerLabel(value) {
    const labels = {
      'Order must be weighed before invoice review.':'A invoice poderá ser emitida após a pesagem.',
      'Order must be ready before invoice review.':'A invoice poderá ser emitida após a pesagem.',
      'Paid invoice is immutable.':'Invoice paga é imutável.',
      'QA orders are read-only.':'Pedidos QA são somente leitura.'
    };
    return labels[value] || value;
  }

  async function submitInvoiceAction(orderNumber, action, expectedVersion, reason, button, feedback) {
    button.disabled = true; feedback.textContent = '';
    try {
      await request('/api/system/invoice-draft', { method:'POST' });
      await request('/api/system/order-invoices', {
        method:'POST', body:JSON.stringify({
          action, order_number:orderNumber, expected_invoice_version:expectedVersion,
          ...(reason ? { reason } : {})
        })
      });
      await refreshOperationalDetail(orderNumber);
      await loadToday().catch(() => null);
    } catch (error) {
      feedback.textContent = error.message;
      button.disabled = false;
    }
  }

  async function loadOrderInvoices(orderNumber, section) {
    const payload = await request('/api/system/order-invoices', {
      method:'POST', body:JSON.stringify({ action:'context', order_number:orderNumber })
    });
    if (!section.isConnected || section.dataset.orderNumber !== orderNumber) return;
    const context = payload.context;
    const body = section.querySelector('.invoice-section-body'); body.replaceChildren();
    const feedback = node('p', 'invoice-feedback'); feedback.setAttribute('role', 'status');
    body.append(node('p', 'invoice-intro', 'Valores calculados pelo sistema a partir dos itens confirmados. Tip permanece em US$0.00.'));
    if (context.blocker) body.append(node('p', 'invoice-blocker', invoiceBlockerLabel(context.blocker)));
    const pricing = context.preview || context.pricing;
    if (pricing) {
      if (context.preview) {
        body.append(invoiceTemplatePreview(
          orderNumber,
          feedback,
          context.current_invoice ? 'Prévia oficial da nova versão' : 'Prévia oficial da invoice'
        ));
      } else if (!context.current_invoice) {
        body.append(node('p', 'invoice-blocker', 'Cálculo disponível somente para consulta neste estado.'));
      }
      body.append(invoiceFactsCard(pricing, 'Cálculo financeiro'));
    }

    const current = context.current_invoice;
    if (current) {
      const documents = node('div', 'document-actions');
      const invoicePdf = node('button', 'secondary', 'Baixar invoice PDF');
      invoicePdf.type = 'button';
      invoicePdf.addEventListener('click', () => downloadOrderDocument('invoice', orderNumber, invoicePdf, feedback));
      const invoicePng = node('button', 'secondary', 'Baixar invoice PNG');
      invoicePng.type = 'button';
      invoicePng.addEventListener('click', () => downloadOrderDocument('invoice_png', orderNumber, invoicePng, feedback));
      documents.append(invoicePdf, invoicePng);
      body.append(documents);

      if (['owner', 'manager'].includes(activeUserRole)
        && ['invoice_created', 'failed', 'void'].includes(context.payment_status)) {
        const paymentLink = node('article', 'payment-link-card');
        paymentLink.append(node('h3', '', 'Link de pagamento Stripe'));
        const status = node('p', 'payment-help', 'Consultando o link atual…');
        paymentLink.append(status);
        body.append(paymentLink);
        loadPaymentLink(orderNumber, current.service_amount, paymentLink, status).catch((error) => {
          if (paymentLink.isConnected) status.textContent = error.message;
        });
      }
    }
    if (context.can_review || context.can_replace) {
      const form = node('form', 'invoice-review-form');
      if (context.can_replace) {
        const label = node('label', '', 'Motivo da correção');
        const input = node('input'); input.name = 'reason'; input.required = true; input.maxLength = 240;
        input.autocomplete = 'off'; label.append(input); form.append(label);
      }
      const submit = node('button', 'primary', context.can_replace ? 'Criar nova versão' : 'Emitir invoice');
      submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const reason = new FormData(form).get('reason') || '';
        submitInvoiceAction(orderNumber, 'review', current?.version || 0, reason, submit, feedback);
      });
      body.append(form);
    }

    if (context.can_void && current) {
      const form = node('form', 'invoice-void-form');
      const label = node('label', '', 'Motivo para anular');
      const input = node('input'); input.name = 'reason'; input.required = true; input.maxLength = 240;
      input.autocomplete = 'off'; label.append(input);
      const submit = node('button', 'secondary danger', 'Anular invoice'); submit.type = 'submit';
      form.append(label, submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitInvoiceAction(orderNumber, 'void', current.version, new FormData(form).get('reason'), submit, feedback);
      });
      body.append(form);
    }
    body.append(feedback);

    if (context.invoices?.length) {
      body.append(node('h3', 'invoice-history-title', 'Histórico de versões'));
      const history = node('ol', 'invoice-history');
      for (const invoice of context.invoices) {
        const row = node('li');
        const label = `Versão ${invoice.version} · ${stateLabel(invoice.status)}`;
        row.append(node('strong', '', label), node('span', '', money(invoice.service_amount)),
          node('small', '', invoice.reason || dateTime(invoice.issued_at)));
        history.append(row);
      }
      body.append(history);
    }
  }

  async function loadPaymentLink(orderNumber, serviceAmount, card, status) {
    const payload = await request('/api/system/payment-link', {
      method:'POST', body:JSON.stringify({ action:'context', order_number:orderNumber })
    });
    const current = payload.context.current;
    if (current?.url) {
      status.textContent = `Ativo · Serviço ${money(current.service_amount)} · Gorjeta ${money(current.tip_amount)} · Total ${money(current.total_amount)}`;
      const actions = node('div', 'document-actions');
      const open = node('a', 'primary', 'Abrir link'); open.href = current.url;
      open.target = '_blank'; open.rel = 'noopener noreferrer';
      const copy = node('button', 'secondary', 'Copiar link'); copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(current.url); copy.textContent = 'Link copiado'; }
        catch (_) { status.textContent = 'Não foi possível copiar. Abra o link e copie pela barra do navegador.'; }
      });
      actions.append(open, copy); card.append(actions); return;
    }
    if (!payload.context.can_create) {
      status.textContent = 'Este pedido ainda não está pronto para gerar um link.'; return;
    }
    status.textContent = 'Escolha a gorjeta confirmada pelo cliente. A invoice não será alterada.';
    const form = node('form', 'payment-link-form');
    const service = Number(serviceAmount);
    const tipLabel = node('label', '', 'Gorjeta');
    const tip = node('input'); tip.name = 'tip_amount'; tip.type = 'number'; tip.min = '0'; tip.step = '0.01';
    tip.required = true; tip.value = Number(current?.tip_amount || 0).toFixed(2); tipLabel.append(tip);
    const shortcuts = node('div', 'tip-shortcuts');
    for (const percent of [0, 10, 15, 20]) {
      const button = node('button', 'secondary', percent ? `${percent}%` : 'Sem gorjeta'); button.type = 'button';
      button.addEventListener('click', () => {
        tip.value = (service * percent / 100).toFixed(2);
        tip.dispatchEvent(new Event('input'));
      });
      shortcuts.append(button);
    }
    const total = node('strong', 'payment-link-total', `Total: ${money(service + Number(tip.value))}`);
    tip.addEventListener('input', () => { total.textContent = `Total: ${money(service + Number(tip.value || 0))}`; });
    const submit = node('button', 'primary', 'Gerar Payment Link'); submit.type = 'submit';
    form.append(tipLabel, shortcuts, total, submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); submit.disabled = true; status.textContent = '';
      try {
        await request('/api/system/invoice-draft', { method:'POST' });
        const created = await request('/api/system/payment-link', { method:'POST', body:JSON.stringify({
          action:'create', order_number:orderNumber, tip_amount:tip.value
        }) });
        form.remove();
        const result = created.result;
        status.textContent = `Ativo · Serviço ${money(result.service_amount)} · Gorjeta ${money(result.tip_amount)} · Total ${money(result.total_amount)}`;
        const actions = node('div', 'document-actions');
        const open = node('a', 'primary', 'Abrir link'); open.href = result.url;
        open.target = '_blank'; open.rel = 'noopener noreferrer';
        const copy = node('button', 'secondary', 'Copiar link'); copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(result.url); copy.textContent = 'Link copiado'; }
          catch (_) { status.textContent = 'Não foi possível copiar. Abra o link e copie pela barra do navegador.'; }
        });
        actions.append(open, copy); card.append(actions);
      } catch (error) { status.textContent = error.message; submit.disabled = false; }
    });
    card.append(form);
  }

  function invoiceSection(orderNumber) {
    const section = detailSection('Invoice');
    section.classList.add('invoice-section'); section.dataset.orderNumber = orderNumber;
    const body = node('div', 'invoice-section-body');
    body.append(node('p', 'invoice-intro', 'Carregando invoice…'));
    section.append(body);
    loadOrderInvoices(orderNumber, section).catch((error) => {
      if (section.isConnected) body.replaceChildren(node('p', 'error', error.message));
    });
    return section;
  }

  function driverAssignmentSection(order, leg) {
    const section = detailSection(leg === 'pickup' ? 'Motorista · Coleta' : 'Motorista · Entrega');
    section.classList.add('driver-assignment-section');
    const body = node('div', 'driver-assignment-body');
    body.append(node('p', '', 'Carregando motoristas ativos…'));
    section.append(body);
    request('/api/system/drivers', { method:'POST', body:JSON.stringify({
      action:'list', include_inactive:activeUserRole === 'owner'
    }) }).then((payload) => {
      const form = node('form', 'driver-assignment-form');
      const label = node('label', '', 'Motorista responsável');
      const select = node('select'); select.name = 'driver_id'; select.required = true;
      select.append(new Option('Selecione', ''));
      for (const driver of (payload.drivers || []).filter((row) => row.active)) {
        select.append(new Option(`${driver.full_name} · +${driver.phone}`, driver.driver_id));
      }
      label.append(select); form.append(label);
      const button = node('button', 'primary', 'Designar motorista'); button.type = 'submit'; form.append(button);
      const feedback = node('p', 'error'); feedback.setAttribute('role', 'alert'); form.append(feedback);
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); button.disabled = true; feedback.textContent = '';
        try {
          await request('/api/system/operation-draft', { method:'POST' });
          await request('/api/system/drivers', { method:'POST', body:JSON.stringify({
            action:'assign', order_number:order.order_number, driver_id:select.value, leg
          }) });
          await refreshOperationalDetail(order.order_number);
          await loadToday().catch(() => null);
        } catch (error) { feedback.textContent = error.message; }
        finally { button.disabled = false; }
      });
      body.replaceChildren(form);
      if (activeUserRole === 'owner') {
        const details = node('details', 'driver-create-details');
        details.append(node('summary', '', 'Cadastrar novo motorista'));
        const create = node('form', 'driver-create-form');
        const nameLabel = node('label', '', 'Nome completo'); const name = node('input'); name.name = 'full_name'; name.maxLength = 100; name.required = true; nameLabel.append(name);
        const phoneLabel = node('label', '', 'Telefone internacional'); const phone = node('input'); phone.name = 'phone'; phone.inputMode = 'tel'; phone.placeholder = '+1 407 000 0000'; phone.required = true; phoneLabel.append(phone);
        const save = node('button', 'secondary', 'Salvar motorista'); save.type = 'submit';
        const createFeedback = node('p', 'error'); createFeedback.setAttribute('role', 'alert');
        create.append(nameLabel, phoneLabel, save, createFeedback); details.append(create); body.append(details);
        create.addEventListener('submit', async (event) => {
          event.preventDefault(); save.disabled = true; createFeedback.textContent = '';
          const data = new FormData(create);
          try {
            await request('/api/system/operation-draft', { method:'POST' });
            const created = await request('/api/system/drivers', { method:'POST', body:JSON.stringify({
              action:'save', full_name:data.get('full_name'), phone:data.get('phone'), active:true
            }) });
            const driver = created.result.driver;
            select.append(new Option(`${driver.full_name} · +${driver.phone}`, driver.driver_id, true, true));
            create.reset(); details.open = false;
          } catch (error) { createFeedback.textContent = error.message; }
          finally { save.disabled = false; }
        });

        const directory = node('div', 'driver-directory');
        directory.append(node('h3', '', 'Diretório de motoristas'));
        for (const driver of payload.drivers || []) {
          const row = node('div', 'driver-directory-row');
          const identity = node('span');
          identity.append(node('strong', '', driver.full_name),
            node('small', '', `+${driver.phone} · ${driver.active ? 'Ativo' : 'Inativo'}`));
          const toggle = node('button', 'quiet', driver.active ? 'Desativar' : 'Ativar');
          toggle.type = 'button';
          toggle.addEventListener('click', async () => {
            toggle.disabled = true; createFeedback.textContent = '';
            try {
              await request('/api/system/operation-draft', { method:'POST' });
              await request('/api/system/drivers', { method:'POST', body:JSON.stringify({
                action:'save', driver_id:driver.driver_id, full_name:driver.full_name,
                phone:driver.phone, active:!driver.active
              }) });
              driver.active = !driver.active;
              identity.querySelector('small').textContent = `+${driver.phone} · ${driver.active ? 'Ativo' : 'Inativo'}`;
              toggle.textContent = driver.active ? 'Desativar' : 'Ativar';
              const option = [...select.options].find((item) => item.value === driver.driver_id);
              if (driver.active && !option) select.append(new Option(`${driver.full_name} · +${driver.phone}`, driver.driver_id));
              if (!driver.active && option) option.remove();
            } catch (error) { createFeedback.textContent = error.message; }
            finally { toggle.disabled = false; }
          });
          row.append(identity, toggle); directory.append(row);
        }
        body.append(directory);
      }
    }).catch((error) => body.replaceChildren(node('p', 'error', error.message)));
    return section;
  }

  function manualPaymentSection(order) {
    const section = detailSection('Pagamento'); section.classList.add('manual-payment-section');
    if (order.payment_status === 'paid') {
      section.append(factGrid([['Status', 'Pago'], ['Método', stateLabel(order.manual_payment?.method || 'stripe')],
        ['Serviço', order.service_amount == null ? null : money(order.service_amount)],
        ['Gorjeta', money(order.tip_amount || 0)],
        ['Total pago', money((order.manual_payment?.total_amount ?? order.manual_payment?.amount) || order.service_amount)],
        ['Referência', order.manual_payment?.reference || null], ['Pago em', dateTime(order.paid_at)]]));
      return section;
    }
    const form = node('form', 'manual-payment-form');
    const methodLabel = node('label', '', 'Método');
    const method = node('select'); method.name = 'method'; method.required = true;
    for (const [value, label] of [['stripe','Stripe'],['cash','Cash'],['zelle','Zelle'],['other','Outro']]) method.append(new Option(label, value));
    methodLabel.append(method);
    const serviceAmount = Number(order.service_amount || 0);
    const serviceLabel = node('label', '', 'Valor do serviço'); const service = node('input');
    service.value = serviceAmount.toFixed(2); service.readOnly = true; serviceLabel.append(service);
    const tipLabel = node('label', '', 'Gorjeta'); const tip = node('input');
    tip.name = 'tip_amount'; tip.type = 'number'; tip.min = '0'; tip.step = '0.01'; tip.required = true;
    tip.value = '0.00'; tipLabel.append(tip);
    const shortcuts = node('div', 'tip-shortcuts');
    for (const percent of [0, 10, 15, 20]) {
      const button = node('button', 'secondary', percent ? `${percent}%` : 'Sem gorjeta'); button.type = 'button';
      button.addEventListener('click', () => {
        tip.value = (serviceAmount * percent / 100).toFixed(2);
        tip.dispatchEvent(new Event('input'));
      });
      shortcuts.append(button);
    }
    const amountLabel = node('label', '', 'Total pago'); const amount = node('input');
    amount.name = 'amount'; amount.type = 'number'; amount.readOnly = true; amount.value = serviceAmount.toFixed(2);
    amountLabel.append(amount);
    tip.addEventListener('input', () => { amount.value = (serviceAmount + Number(tip.value || 0)).toFixed(2); });
    const referenceLabel = node('label', '', 'Referência do pagamento'); const reference = node('input');
    reference.name = 'reference'; reference.maxLength = 120; referenceLabel.append(reference);
    const syncReference = () => {
      reference.required = ['stripe', 'zelle'].includes(method.value);
      referenceLabel.firstChild.textContent = reference.required ? 'Referência do pagamento (obrigatória)' : 'Referência do pagamento';
    };
    method.addEventListener('change', syncReference); syncReference();
    const paidAtLabel = node('label', '', 'Data e hora'); const paidAt = node('input');
    paidAt.name = 'paid_at'; paidAt.type = 'datetime-local'; paidAt.required = true; paidAt.value = localFieldValue(new Date()); paidAtLabel.append(paidAt);
    const noteLabel = node('label', '', 'Observação opcional'); const note = node('input'); note.name = 'note'; note.maxLength = 500; noteLabel.append(note);
    const submit = node('button', 'primary', 'Registrar pagamento'); submit.type = 'submit';
    const feedback = node('p', 'error'); feedback.setAttribute('role', 'alert');
    form.append(methodLabel, serviceLabel, tipLabel, shortcuts, amountLabel, referenceLabel, paidAtLabel, noteLabel, submit, feedback);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); submit.disabled = true; feedback.textContent = '';
      const data = new FormData(form);
      try {
        await request('/api/system/operation-draft', { method:'POST' });
        await request('/api/system/manual-payment', { method:'POST', body:JSON.stringify({
          order_number:order.order_number, method:data.get('method'), amount:data.get('amount'),
          tip_amount:data.get('tip_amount'), reference:data.get('reference') || null,
          paid_at:localIso(data.get('paid_at')), note:data.get('note') || null
        }) });
        await refreshOperationalDetail(order.order_number);
        await Promise.all([loadToday().catch(() => null), loadFinance().catch(() => null)]);
      } catch (error) { feedback.textContent = error.message; }
      finally { submit.disabled = false; }
    });
    section.append(node('p', 'payment-help', 'A baixa altera somente o eixo financeiro. A invoice emitida permanece imutável.'), form);
    return section;
  }

  function renderOperationalDetail(order) {
    $('detailNumber').textContent = displayOrderNumber(order);
    $('detailHeadline').textContent = [order.customer_name, order.property || 'Local não informado',
      order.room ? `Room ${order.room}` : null, String(order.service_tier || '').toUpperCase(), stateLabel(order.order_status)]
      .filter(Boolean).join(' · ');
    $('detailPickupLink').href = order.pickup_order_path;
    const target = $('detailContent'); target.replaceChildren();

    const axes = node('section', 'state-axes');
    for (const label of ['Lifecycle', 'Custódia', 'Produção', 'Financeiro']) {
      const card = node('div', 'panel state-axis'); card.append(node('small', '', label), node('strong', '', axisStateLabel(label, order))); axes.append(card);
    }
    target.append(axes);

    const summary = detailSection('Pedido');
    summary.append(factGrid([
      ['Cliente', order.customer_name], ['WhatsApp', order.whatsapp_last4 ? `Final ${order.whatsapp_last4}` : null],
      ['Local', order.property], ['Quarto', order.room], ['Plano', String(order.service_tier || '').toUpperCase()],
      ['Peso estimado', order.estimated_lbs == null ? null : `${order.estimated_lbs} lb`], ['Bags', order.bags_expected],
      ['Coleta', `${dateTime(order.pickup_window_start)} — ${dateTime(order.pickup_window_end)}`],
      ['Needed by', dateTime(order.needed_by)], ['Prometido Express', dateTime(order.promised_by)],
      ['Motorista · Coleta', order.pickup_driver?.name], ['Motorista · Entrega', order.delivery_driver?.name],
      ['Handoff', order.delivery_handoff?.handoff_point ? stateLabel(order.delivery_handoff.handoff_point) : null],
      ['Nota do handoff', order.delivery_handoff?.handoff_note],
      ['Instruções', order.special_instructions]
    ]));
    const itemList = node('ul', 'detail-items');
    for (const item of order.items || []) itemList.append(node('li', '', `${item.label || 'Item'}${item.estimated_lbs != null ? ` · ${item.estimated_lbs} lb estimadas` : ''}${item.quantity != null ? ` · ${item.quantity}` : ''}${item.actual_lbs != null ? ` · ${item.actual_lbs} lb confirmadas` : ''}${item.subtotal != null ? ` · ${money(item.subtotal)}` : ''}`));
    if (!order.items?.length) itemList.append(node('li', '', 'Itens não informados'));
    summary.append(node('h3', '', 'Itens'), itemList); target.append(summary);

    if (!order.is_qa) {
      const documents = detailSection('Documentos');
      const actions = node('div', 'document-actions');
      const feedback = node('p', 'document-feedback'); feedback.setAttribute('role', 'status');
      const labelPdf = node('button', 'secondary', 'Baixar etiqueta térmica 4×6');
      labelPdf.type = 'button';
      labelPdf.addEventListener('click', () => downloadOrderDocument('label', order.order_number, labelPdf, feedback));
      actions.append(labelPdf);
      documents.append(node('p', 'document-intro', 'Documentos são gerados com os dados atuais do pedido. A etiqueta usa marca vetorial própria para impressora térmica.'), actions, feedback);
      target.append(documents);
    }
    const poundItems = (order.items || []).filter((item) => item.unit === 'lb');
    if (['owner', 'manager'].includes(activeUserRole) && order.weight_editable && poundItems.length) {
      const weight = detailSection('Pesagem por item');
      const progress = order.weight_progress || {};
      weight.append(node('p', 'weight-progress', `${progress.completed || 0} de ${progress.required || poundItems.length} item(ns) pesados`));
      const forms = node('div', 'weight-grid');
      for (const item of poundItems) {
        const form = node('form', `weight-card${item.actual_lbs != null ? ' correction' : ''}`);
        form.dataset.itemId = item.item_id || '';
        form.dataset.weightVersion = String(item.weight_version ?? '');
        const head = node('div', 'weight-card-head');
        head.append(node('strong', '', item.label || 'Item por libra'));
        head.append(node('small', '', item.actual_lbs == null ? 'Aguardando peso' : `${item.actual_lbs} lb · ${item.subtotal == null ? 'valor pendente' : money(item.subtotal)}`));
        const weightLabel = node('label', '', item.actual_lbs == null ? 'Peso real (lb)' : 'Corrigir peso real (lb)');
        const weightInput = node('input'); weightInput.name = 'actual_lbs'; weightInput.type = 'number';
        weightInput.min = '0.01'; weightInput.step = '0.01'; weightInput.required = true;
        if (item.actual_lbs != null) weightInput.value = String(item.actual_lbs);
        weightLabel.append(weightInput);
        form.append(head, weightLabel);
        if (item.actual_lbs != null) {
          const reasonLabel = node('label', '', 'Motivo da correção');
          const reason = node('input'); reason.name = 'reason'; reason.maxLength = 240; reason.required = true;
          reasonLabel.append(reason); form.append(reasonLabel);
        }
        const submit = node('button', 'primary', item.actual_lbs == null ? 'Salvar peso' : 'Corrigir peso');
        submit.type = 'submit'; form.append(submit);
        form.addEventListener('submit', (event) => runOperationalTransition(event, order, 'record_weight'));
        forms.append(form);
      }
      weight.append(forms); target.append(weight);
    }

    if (['owner', 'manager'].includes(activeUserRole)
      && (order.weight_progress?.complete || ['awaiting_processing', 'processing', 'ready'].includes(order.production_state)
        || ['invoice_created', 'paid', 'failed', 'void'].includes(order.payment_status))) {
      target.append(invoiceSection(order.order_number));
    }
    if (['owner', 'manager'].includes(activeUserRole) && ['invoice_created', 'failed', 'paid'].includes(order.payment_status)) {
      target.append(manualPaymentSection(order));
    }

    const action = detailSection('Próxima ação');
    const actionBox = node('div', `detail-next${order.next_action?.enabled ? '' : ' disabled'}`);
    actionBox.append(node('div', '', order.next_action?.label || 'Revisar pedido'));
    if (order.next_action?.blocked_by) actionBox.append(node('small', '', `Disponível em ${order.next_action.blocked_by}`));
    if (order.next_action?.code === 'record_weight' && order.next_action.enabled) {
      actionBox.append(node('small', 'weight-action-hint', 'Registre o peso real em cada item acima. O pedido avança automaticamente quando todos estiverem confirmados.'));
    } else if (order.next_action?.code === 'initialize_legacy_order' && order.next_action.enabled) {
      const form = node('form', 'legacy-initialization-form');
      const explanation = node('p', 'legacy-initialization-help',
        'Este pedido foi criado antes do controle operacional. A ação inicia o acompanhamento em “com o cliente”, sem registrar coleta, peso, pagamento ou entrega retroativamente.');
      const reasonLabel = node('label', '', 'Motivo da inicialização');
      const reason = node('input'); reason.name = 'reason'; reason.maxLength = 240; reason.required = true;
      reason.placeholder = 'Ex.: Pedido ativo confirmado antes da implantação do fluxo'; reasonLabel.append(reason);
      const confirmLabel = node('label', 'legacy-initialization-confirm');
      const confirm = node('input'); confirm.type = 'checkbox'; confirm.required = true;
      confirmLabel.append(confirm, document.createTextNode(' Confirmo que o pedido continua ativo e deve iniciar o controle operacional agora.'));
      const submit = node('button', 'primary', 'Iniciar controle operacional'); submit.type = 'submit';
      form.append(explanation, reasonLabel, confirmLabel, submit);
      form.addEventListener('submit', (event) => runOperationalTransition(event, order)); actionBox.append(form);
    } else if (order.next_action?.code === 'set_promised_by' && order.next_action.enabled) {
      const form = node('form', 'promise-form'); form.id = 'promiseForm';
      const promiseLabel = node('label', '', order.promised_by ? 'Corrigir prazo Express (horário de Orlando)' : 'Prazo Express (horário de Orlando)');
      const input = node('input'); input.name = 'promised_by_local'; input.type = 'datetime-local'; input.required = true; promiseLabel.append(input);
      form.append(promiseLabel);
      if (order.promised_by) {
        const reasonLabel = node('label', '', 'Motivo da correção'); const reason = node('input'); reason.name = 'reason'; reason.maxLength = 240; reason.required = true; reasonLabel.append(reason); form.append(reasonLabel);
      }
      const submit = node('button', 'primary', 'Salvar prazo'); submit.type = 'submit'; form.append(submit);
      form.addEventListener('submit', (event) => runOperationalTransition(event, order)); actionBox.append(form);
    } else if (order.next_action?.code === 'review_invoice' && order.next_action.enabled) {
      const run = node('button', 'primary', order.next_action.label); run.type = 'button';
      run.addEventListener('click', () => target.querySelector('.invoice-section')?.scrollIntoView({ behavior:'smooth', block:'start' }));
      actionBox.append(run);
    } else if (order.next_action?.code === 'register_payment' && order.next_action.enabled) {
      const run = node('button', 'primary', order.next_action.label); run.type = 'button';
      run.addEventListener('click', () => target.querySelector('.manual-payment-section')?.scrollIntoView({ behavior:'smooth', block:'start' }));
      actionBox.append(run);
    } else if (['assign_pickup_driver', 'assign_delivery_driver'].includes(order.next_action?.code) && order.next_action.enabled) {
      const leg = order.next_action.code === 'assign_pickup_driver' ? 'pickup' : 'delivery';
      actionBox.append(node('small', '', 'Selecione abaixo quem está fisicamente responsável por esta etapa.'));
      actionBox.append(driverAssignmentSection(order, leg));
    } else if (order.next_action?.code === 'leave_bell_desk' && order.next_action.enabled) {
      const form = node('form', 'handoff-form');
      const pointLabel = node('label', '', 'Ponto de entrega'); const point = node('select');
      point.name = 'handoff_point'; point.required = true;
      point.append(new Option('Selecione', ''), new Option('Bell Desk', 'bell_desk'),
        new Option('Front Desk', 'front_desk'), new Option('Concierge', 'concierge'));
      pointLabel.append(point);
      const noteLabel = node('label', '', 'Observação opcional'); const note = node('input');
      note.name = 'handoff_note'; note.maxLength = 500; noteLabel.append(note);
      const submit = node('button', 'primary', 'Registrar handoff'); submit.type = 'submit';
      form.append(pointLabel, noteLabel, submit);
      form.addEventListener('submit', (event) => runOperationalTransition(event, order)); actionBox.append(form);
    } else if (order.next_action?.code === 'complete_delivery' && order.next_action.enabled
      && order.custody_state === 'with_driver_delivery') {
      const form = node('form', 'handoff-form');
      const pointLabel = node('label', '', 'Entrega confirmada com'); const point = node('select');
      point.name = 'handoff_point'; point.required = true;
      point.append(new Option('Cliente', 'guest'), new Option('Outro', 'other')); pointLabel.append(point);
      const noteLabel = node('label', '', 'Observação (obrigatória para Outro)'); const note = node('input');
      note.name = 'handoff_note'; note.maxLength = 500; noteLabel.append(note);
      const submit = node('button', 'primary', 'Confirmar entrega'); submit.type = 'submit';
      form.append(pointLabel, noteLabel, submit);
      form.addEventListener('submit', (event) => runOperationalTransition(event, order)); actionBox.append(form);
    } else {
      const run = node('button', order.next_action?.enabled ? 'primary' : 'secondary', order.next_action?.label || 'Indisponível');
      run.type = 'button'; run.disabled = !order.next_action?.enabled;
      if (order.next_action?.enabled) run.addEventListener('click', () => runOperationalTransition(null, order));
      actionBox.append(run);
    }
    action.append(actionBox); target.append(action);

    const timeline = detailSection('Histórico');
    const list = node('ol', 'timeline');
    for (const event of order.timeline || []) {
      const row = node('li'); row.append(node('strong', '', ACTION_LABELS[event.action] || stateLabel(event.action)), node('span', '', dateTime(event.occurred_at)), node('small', '', event.actor_label || 'Sistema')); list.append(row);
    }
    if (!order.timeline?.length) list.append(node('li', 'timeline-empty', 'Sem eventos registrados.'));
    timeline.append(list); target.append(timeline);
  }

  async function openOperationalDetail(orderNumber) {
    priorOperationalView = $('todayView').hidden ? 'ordersView' : 'todayView';
    await refreshOperationalDetail(orderNumber, true);
    setRoute(`/sistema/orders/${encodeURIComponent(orderNumber)}`);
  }

  async function refreshOperationalDetail(orderNumber, reveal = false) {
    $('detailError').textContent = '';
    try {
      const payload = await request('/api/system/operational-orders', { method:'POST', body:JSON.stringify({ action:'detail', order_number:orderNumber }) });
      renderOperationalDetail(payload.order);
      if (reveal) show('orderDetailView');
    } catch (error) {
      $('detailError').textContent = error.message;
      if (reveal) show('orderDetailView');
      throw error;
    }
  }

  async function runOperationalTransition(event, order, actionCode = null) {
    if (event) event.preventDefault();
    $('detailError').textContent = '';
    const requestBody = { action:'transition', transition_action:actionCode || order.next_action.code,
      order_number:order.order_number };
    if (event) {
      const data = new FormData(event.currentTarget);
      requestBody.promised_by_local = data.get('promised_by_local'); requestBody.reason = data.get('reason') || null;
      requestBody.handoff_point = data.get('handoff_point') || null;
      requestBody.handoff_note = data.get('handoff_note') || null;
      if ((actionCode || order.next_action.code) === 'record_weight') {
        requestBody.order_item_id = event.currentTarget.dataset.itemId;
        requestBody.expected_weight_version = event.currentTarget.dataset.weightVersion;
        requestBody.actual_lbs = data.get('actual_lbs');
      }
    }
    try {
      await request('/api/system/operation-draft', { method:'POST' });
      const payload = await request('/api/system/operational-orders', {
        method:'POST', body:JSON.stringify(requestBody)
      });
      renderOperationalDetail(payload.result.order);
      await loadToday().catch(() => null);
    } catch (error) { $('detailError').textContent = error.message; }
  }

  function showSuccess(order) {
    $('successNumber').textContent = displayOrderNumber(order);
    $('successDetails').innerHTML = `<dl><div><dt>Cliente</dt><dd>${escapeText(order.customer_name)}</dd></div><div><dt>Local</dt><dd>${escapeText(order.property)}</dd></div><div><dt>Serviço</dt><dd>${escapeText(order.service_tier.toUpperCase())}</dd></div><div><dt>Coleta</dt><dd>${new Date(order.pickup_window_start).toLocaleString()}</dd></div></dl>`;
    $('successNext').textContent = order.next_action;
    const path = order.pickup_order_path || pickupPath(order.order_number);
    $('successPickupLink').href = path;
    $('successPrintLink').href = `${path}?print=1`;
    show('successView');
  }

  async function routeMutation(body) {
    await request('/api/system/operation-draft', { method:'POST' });
    return request('/api/system/routes', { method:'POST', body:JSON.stringify(body) });
  }

  function routeStatusLabel(status) {
    return ({ draft:'Planejada', active:'Em andamento', completed:'Concluída', cancelled:'Cancelada' })[status] || 'Não informado';
  }

  function stopTypeLabel(type) { return type === 'pickup' ? 'COLETA' : 'ENTREGA'; }

  async function openRoutes() {
    if (!['owner', 'manager'].includes(activeUserRole)) throw new Error('Rotas exigem acesso de Owner ou Gestora.');
    show('routesView'); setRoute('/sistema/routes'); $('routesError').textContent = '';
    $('routeDetailPanel').hidden = true; $('routesListPanel').hidden = false;
    const [routePayload, driverPayload] = await Promise.all([
      request('/api/system/routes', { method:'POST', body:JSON.stringify({ action:'list' }) }),
      request('/api/system/drivers', { method:'POST', body:JSON.stringify({ action:'list' }) })
    ]);
    const select = $('routeDriver'); select.replaceChildren(new Option('Selecione', ''));
    for (const driver of driverPayload.drivers || []) if (driver.active) select.append(new Option(driver.full_name, driver.driver_id));
    const list = $('routesList'); list.replaceChildren();
    for (const route of routePayload.routes || []) {
      const button = node('button', 'route-row'); button.type = 'button';
      const identity = node('span', 'route-row-meta');
      identity.append(node('strong', '', `${route.route_date} · ${route.driver.full_name}`),
        node('small', '', `${route.stop_count} paradas · ${route.completed_count} concluídas · ${route.exception_count} ocorrências`));
      button.append(identity, node('span', 'route-chip', routeStatusLabel(route.status)));
      button.addEventListener('click', () => loadRouteDetail(route.route_id).catch((error) => { $('routesError').textContent = error.message; }));
      list.append(button);
    }
    if (!list.children.length) list.append(node('p', 'route-empty', 'Nenhuma rota criada ainda.'));
  }

  function routeOrderSummary(order) {
    const summary = node('div', 'route-stop-meta');
    summary.append(node('strong', '', `${order.property || 'Local não informado'} · ${stopTypeLabel(order.stop_type)}`));
    summary.append(node('span', '', `${order.customer_name || 'Cliente não informado'}${order.room ? ` · Quarto ${order.room}` : ''}`));
    summary.append(node('small', '', `${order.order_number} · ${order.service_tier === 'express' ? 'Express' : 'Normal'}`));
    const windowValue = order.stop_type === 'pickup' ? order.pickup_window_start : order.promised_by;
    const facts = [
      windowValue ? `${order.stop_type === 'pickup' ? 'Janela' : 'Prometido'}: ${dateTime(windowValue)}` : null,
      order.property_address || null,
      order.whatsapp_number ? `WhatsApp: ${order.whatsapp_number}` : null,
      order.bags_expected ? `${order.bags_expected} bag${Number(order.bags_expected) === 1 ? '' : 's'}` : null,
      order.delivery_handoff?.handoff_point ? `Handoff: ${stateLabel(order.delivery_handoff.handoff_point)}` : null,
      order.special_instructions ? `Nota: ${order.special_instructions}` : null
    ].filter(Boolean);
    if (facts.length) summary.append(node('small', 'route-stop-facts', facts.join(' · ')));
    return summary;
  }

  function routeEventLabel(action) {
    return ({ route_created:'Rota criada', stop_added:'Parada adicionada', stop_removed:'Parada removida',
      stops_reordered:'Ordem alterada', stop_eta_set:'ETA atualizado', route_started:'Rota iniciada',
      pickup_completed:'Coleta concluída', delivery_started:'Entrega iniciada', delivery_completed:'Entrega concluída',
      handoff_recorded:'Handoff registrado', stop_exception:'Ocorrência registrada', route_completed:'Rota concluída',
      route_cancelled:'Rota cancelada' })[action] || 'Ação registrada';
  }

  async function loadRouteDetail(routeId) {
    const payload = await request('/api/system/routes', { method:'POST', body:JSON.stringify({ action:'detail', route_id:routeId }) });
    renderRouteDetail(payload.route);
  }

  function renderRouteDetail(route) {
    $('routesListPanel').hidden = true; const panel = $('routeDetailPanel'); panel.hidden = false; panel.replaceChildren();
    const terminal = (route.stops || []).filter((stop) => stop.status !== 'pending').length;
    const head = node('div', 'route-detail-head');
    const title = node('div'); title.append(node('button', 'back', '← Todas as rotas'), node('p', 'eyebrow', 'ROTA'),
      node('h2', '', `${route.route_date} · ${route.driver.full_name}`), node('p', 'route-progress', `${terminal} de ${(route.stops || []).length} paradas concluídas`));
    title.querySelector('button').addEventListener('click', () => openRoutes().catch((error) => { $('routesError').textContent = error.message; }));
    head.append(title, node('span', 'route-chip', routeStatusLabel(route.status))); panel.append(head);

    const stops = node('section', 'route-stops'); const firstPending = (route.stops || []).find((stop) => stop.status === 'pending');
    for (const stop of route.stops || []) {
      const card = node('article', `route-stop${firstPending?.stop_id === stop.stop_id ? ' is-next' : ''}`);
      card.append(node('span', 'route-stop-sequence', String(stop.sequence)));
      const order = { ...(stop.order || {}), stop_type:stop.stop_type }; card.append(routeOrderSummary(order));
      const actions = node('div', 'route-stop-actions');
      card.append(node('small', 'route-stop-eta', stop.eta_at ? `ETA manual: ${dateTime(stop.eta_at)}` : 'ETA indisponível'));
      const open = node('button', 'quiet', 'Abrir pedido'); open.type='button';
      open.addEventListener('click', () => refreshOperationalDetail(order.order_number)); actions.append(open);
      if (route.status === 'draft' && stop.status === 'pending') {
        for (const [label, delta] of [['↑',-1],['↓',1]]) {
          const move=node('button','quiet',label); move.type='button'; move.setAttribute('aria-label', delta<0?'Mover parada para cima':'Mover parada para baixo');
          move.addEventListener('click', async () => {
            const pending=(route.stops||[]).filter((item)=>item.status==='pending'); const index=pending.findIndex((item)=>item.stop_id===stop.stop_id); const target=index+delta;
            if (target<0||target>=pending.length) return; [pending[index],pending[target]]=[pending[target],pending[index]];
            const result=await routeMutation({action:'reorder',route_id:route.route_id,version:route.version,stop_ids:pending.map((item)=>item.stop_id)});
            renderRouteDetail(result.result.route);
          }); actions.append(move);
        }
        const remove=node('button','quiet route-danger','Remover'); remove.type='button'; remove.addEventListener('click',async()=>{
          const result=await routeMutation({action:'remove_stop',route_id:route.route_id,stop_id:stop.stop_id}); renderRouteDetail(result.result.route);
        }); actions.append(remove);
      }
      if (['draft','active'].includes(route.status) && stop.status === 'pending') {
        const etaForm=node('form','route-eta-form'); const eta=node('input'); eta.type='datetime-local';
        eta.setAttribute('aria-label',`ETA de ${order.order_number}`); if (stop.eta_at) eta.value=localFieldValue(new Date(stop.eta_at));
        const save=node('button','quiet bordered',stop.eta_at?'Atualizar ETA':'Definir ETA'); save.type='submit';
        etaForm.append(eta,save); etaForm.addEventListener('submit',async(event)=>{event.preventDefault();
          const result=await routeMutation({action:'set_eta',route_id:route.route_id,stop_id:stop.stop_id,
            version:route.version,eta_at:localIso(eta.value)}); renderRouteDetail(result.result.route);
        }); actions.append(etaForm);
      }
      if (route.status === 'active' && stop.status === 'pending') {
        const orderAction = stop.stop_type === 'pickup' ? 'confirm_pickup'
          : order.custody_state === 'at_laundry' ? 'start_delivery' : 'complete_delivery';
        const execute=node('button','primary', orderAction==='confirm_pickup'?'Confirmar coleta':orderAction==='start_delivery'?'Iniciar entrega':'Confirmar ao hóspede');
        execute.type='button'; execute.addEventListener('click', async()=>{
          const result=await routeMutation({action:'execute_stop',route_id:route.route_id,stop_id:stop.stop_id,
            transition_action:orderAction, handoff_point:orderAction==='complete_delivery'?'guest':null});
          renderRouteDetail(result.result.route);
        }); actions.append(execute);
        if (stop.stop_type==='delivery' && order.custody_state==='with_driver_delivery') {
          const bell=node('button','secondary','Deixar no Bell Desk'); bell.type='button'; bell.addEventListener('click',async()=>{
            const result=await routeMutation({action:'execute_stop',route_id:route.route_id,stop_id:stop.stop_id,
              transition_action:'leave_bell_desk',handoff_point:'bell_desk'}); renderRouteDetail(result.result.route);
          }); actions.append(bell);
        }
        const failed=node('button','quiet route-danger','Não foi possível'); failed.type='button'; failed.addEventListener('click',async()=>{
          const note=window.prompt('Informe brevemente o motivo:'); if (!note) return;
          const result=await routeMutation({action:'exception',route_id:route.route_id,stop_id:stop.stop_id,reason:'other',note}); renderRouteDetail(result.result.route);
        }); actions.append(failed);
      }
      card.append(actions); stops.append(card);
    }
    if (!stops.children.length) stops.append(node('p','route-empty','Adicione coletas e entregas antes de iniciar.'));
    panel.append(stops);
    const routeActions=node('div','route-form-actions');
    if (route.status==='draft') {
      const add=node('button','secondary','Adicionar paradas'); add.type='button'; add.addEventListener('click',()=>loadEligibleStops(route));
      const start=node('button','primary','Iniciar rota'); start.type='button'; start.disabled=!(route.stops||[]).some((stop)=>stop.status==='pending');
      start.addEventListener('click',async()=>{const result=await routeMutation({action:'start',route_id:route.route_id,version:route.version});renderRouteDetail(result.result.route);});
      const cancel=node('button','quiet route-danger','Cancelar rota'); cancel.type='button'; cancel.addEventListener('click',async()=>{
        if (!window.confirm('Cancelar esta rota planejada? Os pedidos continuarão disponíveis para outra rota.')) return;
        const result=await routeMutation({action:'cancel',route_id:route.route_id,version:route.version}); renderRouteDetail(result.result.route);
      }); routeActions.append(add,start,cancel);
    } else if (route.status==='active' && (route.stops||[]).every((stop)=>stop.status!=='pending')) {
      const complete=node('button','primary','Concluir rota'); complete.type='button'; complete.addEventListener('click',async()=>{
        const result=await routeMutation({action:'complete',route_id:route.route_id,version:route.version});renderRouteDetail(result.result.route);
      }); routeActions.append(complete);
    }
    panel.append(routeActions);
    if ((route.events || []).length) {
      const history=node('section','panel route-history'); history.append(node('h3','','Histórico da rota'));
      const list=node('ol','route-history-list');
      for (const event of route.events) list.append(node('li','',`${dateTime(event.occurred_at)} · ${routeEventLabel(event.action)} · ${event.actor_role === 'manager' ? 'Gestora' : 'Owner'}`));
      history.append(list); panel.append(history);
    }
  }

  async function loadEligibleStops(route) {
    const payload=await request('/api/system/routes',{method:'POST',body:JSON.stringify({action:'eligible',route_id:route.route_id})});
    const area=node('section','panel route-add-grid');
    for (const [type,label] of [['pickup','Coletas pendentes'],['delivery','Entregas pendentes']]) {
      const column=node('div'); column.append(node('h3','',label));
      for (const order of payload.eligible[type]||[]) {
        const row=node('div','route-candidate'); row.append(routeOrderSummary({...order,stop_type:type}));
        const add=node('button','secondary','Adicionar'); add.type='button'; add.addEventListener('click',async()=>{
          const result=await routeMutation({action:'add_stop',route_id:route.route_id,order_number:order.order_number,stop_type:type}); renderRouteDetail(result.result.route);
        }); row.append(add); column.append(row);
      }
      if (column.children.length===1) column.append(node('p','route-empty','Nenhum pedido elegível.'));
      area.append(column);
    }
    $('routeDetailPanel').append(area);
  }

  function escapeText(value) {
    const node = document.createElement('span');
    node.textContent = String(value || '');
    return node.innerHTML;
  }

  $('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault(); $('loginError').textContent = '';
    const data = new FormData(event.currentTarget);
    try {
      const payload = await request('/api/system/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      activate(payload.user);
    } catch (error) { $('loginError').textContent = error.message; }
  });

  function activate(user) {
    activeUserRole = user.role;
    $('loginView').hidden = true; $('systemView').hidden = false;
    $('userLabel').textContent = `${user.display_name} · ${user.role}`;
    for (const element of document.querySelectorAll('.owner-only')) element.classList.toggle('access-denied', user.role !== 'owner');
    for (const element of document.querySelectorAll('.manager-access')) element.classList.toggle('access-denied', !['owner', 'manager'].includes(user.role));
    window.A7SystemSession = { ...user };
    window.dispatchEvent(new CustomEvent('a7:session', { detail:{ ...user } }));
    if (user.must_change_password) {
      for (const button of document.querySelectorAll('.workspace nav button')) button.disabled = true;
      show('passwordChangeView');
      return;
    }
    for (const button of document.querySelectorAll('.workspace nav button:not([data-permanent-disabled])')) {
      if (!button.textContent.includes('W3')) button.disabled = false;
    }
    buildQueueFilters();
    restoreCurrentRoute().catch((error) => { $('todayError').textContent = error.message; });
  }

  $('logoutButton').addEventListener('click', async () => { await request('/api/system/logout', { method: 'POST' }).catch(() => null); location.reload(); });
  $('todayNav').addEventListener('click', () => { show('todayView'); setRoute('/sistema'); loadToday().catch((error) => { $('todayError').textContent = error.message; }); });
  $('ordersNav').addEventListener('click', () => { show('ordersView'); setRoute('/sistema/orders'); loadOperationalOrders(activeQueue, '').catch((error) => { $('ordersError').textContent = error.message; }); });
  $('attendanceNav').addEventListener('click', () => { show('attendanceView'); setRoute('/sistema/attendance'); });
  $('customersNav').addEventListener('click', () => {
    $('customerSearchError').textContent = '';
    show('customersView');
    setRoute('/sistema/customers');
  });
  $('financeNav').addEventListener('click', () => openFinance().catch((error) => {
    $('financeLoading').hidden = true; $('financeError').textContent = error.message;
  }));
  $('routesNav').addEventListener('click', () => openRoutes().catch((error) => { $('routesError').textContent = error.message; }));
  $('newRouteButton').addEventListener('click', () => {
    $('routeCreatePanel').hidden = false;
    if (!$('routeDate').value) $('routeDate').value = new Intl.DateTimeFormat('en-CA', { timeZone:'America/New_York' }).format(new Date());
  });
  $('cancelRouteCreate').addEventListener('click', () => { $('routeCreatePanel').hidden = true; });
  $('routeCreateForm').addEventListener('submit', async (event) => {
    event.preventDefault(); $('routesError').textContent = '';
    const data = new FormData(event.currentTarget);
    try {
      const payload = await routeMutation({ action:'create', route_date:data.get('route_date'), driver_id:data.get('driver_id') });
      $('routeCreatePanel').hidden = true; renderRouteDetail(payload.result.route);
    } catch (error) { $('routesError').textContent = error.message; }
  });
  $('passwordChangeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form);
    $('passwordChangeError').textContent = '';
    if (data.get('new_password') !== data.get('confirm_password')) {
      $('passwordChangeError').textContent = 'As novas senhas não coincidem.'; return;
    }
    const button = event.submitter; button.disabled = true;
    try {
      const payload = await request('/api/system/password', { method:'POST', body:JSON.stringify({
        current_password:data.get('current_password'), new_password:data.get('new_password')
      }) });
      form.reset(); activate(payload.user);
    } catch (error) { $('passwordChangeError').textContent = error.message; }
    finally { button.disabled = false; }
  });
  $('homeOpenFinance').addEventListener('click', () => openFinance().catch((error) => {
    $('financeLoading').hidden = true; $('financeError').textContent = error.message;
  }));
  $('newOrderButton').addEventListener('click', () => openNew().catch((error) => { $('lookupError').textContent = error.message; }));
  $('backButton').addEventListener('click', () => { if (confirmOrderFormExit()) { orderFormDirty = false; show('attendanceView'); setRoute('/sistema/attendance'); } });
  $('cancelButton').addEventListener('click', () => { if (confirmOrderFormExit()) { orderFormDirty = false; show('attendanceView'); setRoute('/sistema/attendance'); } });
  $('doneButton').addEventListener('click', () => { show('attendanceView'); setRoute('/sistema/attendance'); });
  $('refreshTodayButton').addEventListener('click', () => loadToday().catch((error) => { $('todayError').textContent = error.message; }));
  $('refreshFinanceButton').addEventListener('click', () => loadFinance().catch((error) => {
    $('financeLoading').hidden = true; $('financeError').textContent = error.message;
  }));
  for (const button of $('financePresetButtons').querySelectorAll('button')) {
    button.addEventListener('click', () => loadFinance({ preset:button.dataset.financePeriod }).catch((error) => {
      $('financeLoading').hidden = true; $('financeError').textContent = error.message;
    }));
  }
  $('financeCustomForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    loadFinance({ preset:'custom', start_date:data.get('start_date'), end_date:data.get('end_date') }).catch((error) => {
      $('financeLoading').hidden = true; $('financeError').textContent = error.message;
    });
  });
  $('todayOpenOrders').addEventListener('click', () => { show('ordersView'); setRoute('/sistema/orders'); loadOperationalOrders('all', '').catch((error) => { $('ordersError').textContent = error.message; }); });
  $('backToOrdersButton').addEventListener('click', () => {
    show(priorOperationalView); setRoute(priorOperationalView === 'todayView' ? '/sistema' : '/sistema/orders');
  });
  $('hotelsNav').addEventListener('click', () => setRoute('/sistema/hotels'));
  $('teamNav').addEventListener('click', () => setRoute('/sistema/team'));
  window.addEventListener('popstate', () => {
    if (orderFormDirty && !$('newOrderView').hidden && !window.confirm('Há dados ainda não salvos. Deseja sair desta tela?')) {
      history.forward(); return;
    }
    orderFormDirty = false;
    restoreCurrentRoute().catch((error) => { $('todayError').textContent = error.message; });
  });
  $('operationalSearchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('query');
    try { await loadOperationalOrders(activeQueue, query); }
    catch (error) { $('ordersError').textContent = error.message; }
  });
  $('operationalSearchForm').elements.query.addEventListener('focus', (event) => event.currentTarget.select());
  for (const id of ['custodyFilter', 'productionFilter']) $(id).addEventListener('change', () => {
    const query = new FormData($('operationalSearchForm')).get('query');
    loadOperationalOrders(activeQueue, query).catch((error) => { $('ordersError').textContent = error.message; });
  });
  $('orderForm').addEventListener('input', (event) => {
    orderFormDirty = true;
    if (event.target.name === 'promised_by') event.target.dataset.userEdited = 'true';
    if (event.target.name === 'pickup_window_start' || event.target.name === 'service_tier') syncExpressPromise();
    if (['name', 'whatsapp_number'].includes(event.target.name)) {
      clearKnownCustomer();
      clearTimeout(customerSuggestionTimer);
      customerSuggestionTimer = setTimeout(() => suggestCustomers(event.target.value), 300);
    }
  });
  $('orderForm').addEventListener('change', refreshCommercial);
  $('orderForm').addEventListener('submit', async (event) => {
    event.preventDefault(); $('orderError').textContent = '';
    const button = event.submitter; button.disabled = true;
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data);
    payload.pickup_window_start = localIso(payload.pickup_window_start);
    payload.pickup_window_end = localIso(payload.pickup_window_end);
    payload.needed_by = localIso(payload.needed_by);
    payload.promised_by = localIso(payload.promised_by);
    payload.items = itemsFromForm(data);
    payload.care_options = data.getAll('care_options');
    delete payload.wash_fold; delete payload.special_code; delete payload.special_quantity; delete payload.estimated_lbs;
    try {
      const result = await request('/api/system/orders', { method: 'POST', body: JSON.stringify(payload) });
      orderFormDirty = false;
      showSuccess(result.order);
    } catch (error) { $('orderError').textContent = error.message; }
    finally { button.disabled = false; }
  });
  window.addEventListener('beforeunload', (event) => {
    if (!orderFormDirty || $('newOrderView').hidden) return;
    event.preventDefault(); event.returnValue = '';
  });
  $('lookupForm').addEventListener('submit', async (event) => {
    event.preventDefault(); $('lookupError').textContent = ''; $('lookupResult').textContent = '';
    const form = event.currentTarget;
    const number = new FormData(form).get('order_number');
    try {
      const result = await request(`/api/system/orders?order_number=${encodeURIComponent(number)}`);
      form.elements.order_number.value = result.order.order_number;
      showOrder(result.order, $('lookupResult'));
    }
    catch (error) { $('lookupError').textContent = error.message; }
  });
  $('customerSearchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const query = new FormData(form).get('customer_query');
    $('customerSearchError').textContent = '';
    $('customerResults').replaceChildren();
    $('customerDetail').hidden = true;
    try {
      const payload = await request('/api/system/customers', {
        method: 'POST', body: JSON.stringify({ action: 'search', query })
      });
      renderCustomerResults(payload.customers);
    } catch (error) { $('customerSearchError').textContent = error.message; }
  });

  request('/api/system/session').then((payload) => activate(payload.user)).catch(() => { $('loginView').hidden = false; $('systemView').hidden = true; });
})();
