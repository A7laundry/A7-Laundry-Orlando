'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const views = ['todayView', 'ordersView', 'orderDetailView', 'attendanceView', 'customersView', 'newOrderView', 'successView'];
  let catalog = null;
  let activeQueue = 'all';
  let priorOperationalView = 'todayView';
  let activeCustomerRef = null;
  let newOrderReturnView = 'attendanceView';

  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload.error || 'Request failed.'), { status: response.status, code: payload.code });
    return payload;
  }

  function show(view) {
    for (const id of views) $(id).hidden = id !== view;
    $('todayNav').classList.toggle('active', view === 'todayView');
    $('ordersNav').classList.toggle('active', ['ordersView', 'orderDetailView'].includes(view));
    $('attendanceNav').classList.toggle('active', ['attendanceView', 'newOrderView', 'successView'].includes(view));
    $('customersNav').classList.toggle('active', view === 'customersView');
    window.scrollTo({ top: 0, behavior: 'instant' });
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

  function refreshCommercial() {
    if (!catalog) return;
    const tier = selectedTier();
    const wash = service(tier === 'express' ? 'wash_fold_express' : 'wash_fold_normal');
    $('normalPrice').textContent = `${money(service('wash_fold_normal').unit_price)}/lb · ${money(service('wash_fold_normal').minimum_amount)} minimum`;
    $('expressPrice').textContent = `${money(service('wash_fold_express').unit_price)}/lb · subject to availability`;
    $('washRule').textContent = `${money(wash.unit_price)}/lb · ${money(wash.minimum_amount)} minimum`;
    const data = new FormData($('orderForm'));
    const lines = [];
    if (data.get('wash_fold')) lines.push(`Wash & Fold ${tier}: ${money(wash.unit_price)}/lb; ${money(wash.minimum_amount)} minimum.`);
    if (data.get('special_code')) {
      const special = service(data.get('special_code'));
      lines.push(`${special.label}: ${money(special.unit_price)} per ${special.unit}.`);
    }
    $('commercialSummary').textContent = lines.join(' ') || 'Select at least one service.';
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
    const field = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    $('orderForm').elements.pickup_window_start.value = field(now);
    $('orderForm').elements.pickup_window_end.value = field(end);
    $('orderForm').elements.needed_by.value = field(needed);
  }

  function applyKnownCustomer(customer) {
    const form = $('orderForm');
    const name = form.elements.name;
    const whatsapp = form.elements.whatsapp_number;
    activeCustomerRef = customer?.customer_ref || null;
    name.readOnly = Boolean(customer);
    whatsapp.readOnly = Boolean(customer);
    $('knownCustomerBanner').hidden = !customer;
    if (!customer) {
      $('knownCustomerSummary').textContent = '';
      return;
    }
    name.value = customer.name || '';
    whatsapp.value = customer.whatsapp_number || '';
    const language = ['en', 'pt', 'es', 'other'].includes(customer.language) ? customer.language : 'other';
    const type = ['guest', 'resident', 'host'].includes(customer.customer_type) ? customer.customer_type : 'guest';
    const accommodation = ['hotel', 'airbnb', 'residence'].includes(customer.latest_accommodation_type)
      ? customer.latest_accommodation_type : 'hotel';
    form.elements.language.value = language;
    form.elements.customer_type.value = type;
    form.elements.accommodation_type.value = accommodation;
    form.elements.property.value = customer.latest_property || '';
    const last4 = String(customer.whatsapp_number || '').replace(/\D/g, '').slice(-4) || '—';
    $('knownCustomerSummary').textContent = `${customer.name || 'Cliente'} · WhatsApp final ${last4}`;
  }

  async function openNew(customer = null) {
    await request('/api/system/order-draft', { method: 'POST' });
    $('orderForm').reset();
    applyKnownCustomer(null);
    $('orderError').textContent = '';
    defaultTimes();
    if (!catalog) await loadCatalog();
    if (customer) applyKnownCustomer(customer);
    newOrderReturnView = customer ? 'customersView' : 'attendanceView';
    $('backButton').textContent = customer ? '← Clientes' : '← Atendimento';
    refreshCommercial();
    show('newOrderView');
  }

  function itemsFromForm(data) {
    const items = [];
    if (data.get('wash_fold')) items.push({ code: 'wash_fold', estimated_lbs: data.get('estimated_lbs') || null });
    if (data.get('special_code')) items.push({ code: data.get('special_code'), quantity: data.get('special_quantity') || 1 });
    return items;
  }

  function showOrder(order, target) {
    target.className = 'lookup-result';
    target.innerHTML = `<strong>${escapeText(order.order_number)}</strong><p>${escapeText(order.customer_name || 'Customer')} · ${escapeText(order.property || 'Property')} · ${escapeText((order.service_tier || '').toUpperCase())}</p><small>Next action: ${escapeText(order.next_action || order.order_status)}</small><a class="pickup-inline-link" href="${pickupPath(order.order_number)}" target="_blank" rel="noopener">Abrir Pickup Order</a>`;
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
    express_attention:'Express em atenção', late:'Atrasados'
  };
  const STATE_LABELS = {
    with_customer:'Com o cliente', awaiting_pickup:'Aguardando coleta', with_driver_pickup:'Com motorista',
    at_laundry:'Na lavanderia', with_driver_delivery:'Com motorista para entrega', bell_desk:'Na recepção / Bell Desk', delivered:'Entregue',
    awaiting_intake:'Aguardando chegada', awaiting_weight:'Aguardando pesagem', awaiting_processing:'Aguardando processamento',
    processing:'Em processamento', ready:'Pronto', pending:'Pendente', invoice_created:'Fatura criada', paid:'Pago',
    failed:'Falhou', void:'Anulado', issued:'Emitida', superseded:'Substituída', accepted:'Aceito', pickup_scheduled:'Coleta agendada', picked_up:'Coletado',
    ready_for_delivery:'Pronto para entrega', cancelled:'Cancelado', new:'Novo', qualifying:'Qualificando', qualified:'Qualificado'
  };
  const ACTION_LABELS = {
    order_accepted:'Venda confirmada', pickup_scheduled:'Coleta agendada', pickup_completed:'Coleta concluída',
    order_weighed:'Pesagem concluída', item_weight_recorded:'Peso do item registrado',
    item_weight_corrected:'Peso do item corrigido',
    invoice_issued:'Invoice emitida', invoice_voided:'Invoice anulada',
    order_ready_for_delivery:'Pronto para entrega', order_delivered:'Pedido entregue', schedule_pickup:'Coleta agendada',
    confirm_pickup:'Coleta confirmada', receive_at_laundry:'Recebido na lavanderia', start_processing:'Processamento iniciado',
    mark_ready:'Marcado como pronto', start_delivery:'Saiu para entrega', leave_bell_desk:'Deixado no Bell Desk',
    complete_delivery:'Entrega concluída', set_promised_by:'Prazo Express definido'
  };

  function stateLabel(value) { return STATE_LABELS[value] || String(value || 'Não inicializado').replaceAll('_', ' '); }
  function slaLabel(order) {
    const labels = { late:'ATRASADO', risk:'RISCO', attention:'ATENÇÃO', ok:'NO PRAZO', not_set:'PRAZO NÃO DEFINIDO', not_configured:'SLA PENDENTE', not_applicable:'STANDARD' };
    if (order.standard_overdue) return 'ATRASADO';
    const base = labels[order.sla?.status] || 'SEM SLA';
    if (['late', 'risk', 'attention', 'ok'].includes(order.sla?.status) && Number.isFinite(order.sla?.remaining_minutes)) {
      const minutes = Math.abs(order.sla.remaining_minutes);
      const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}` : `${minutes}min`;
      return `${base} · ${order.sla.remaining_minutes < 0 ? '-' : ''}${time}`;
    }
    return base;
  }

  function operationCard(order) {
    const visualSla = order.standard_overdue ? 'late' : (order.sla?.status || 'none');
    const button = node('button', `operation-card sla-${visualSla}${order.is_qa ? ' qa' : ''}`);
    button.type = 'button';
    const top = node('span', 'operation-card-top');
    top.append(node('strong', '', order.order_number), node('span', 'tier-badge', String(order.service_tier || '').toUpperCase()));
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
      button.addEventListener('click', () => show('attendanceView'));
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
    renderOperationList($('ordersResults'), payload.orders);
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

  async function loadToday(queue = null) {
    $('todayError').textContent = '';
    $('custodyFilter').value = ''; $('productionFilter').value = '';
    const payload = await request('/api/system/today');
    const today = payload.today;
    $('todayFreshness').textContent = `Atualizado ${dateTime(today.as_of)} · ${today.timezone}`;
    const definitions = [
      ['waiting_confirmation', 'Esperando confirmação', 'attendance'], ['pickups', 'Coletas', 'pickups_today'],
      ['with_driver', 'Com motorista', 'with_driver'], ['at_laundry', 'Na lavanderia', 'at_laundry'],
      ['awaiting_weight', 'Para pesar', 'awaiting_weight'], ['processing', 'Processando', 'processing'],
      ['ready', 'Prontos', 'ready'], ['charge', 'Para cobrar', 'charge'],
      ['awaiting_payment', 'Aguardando pagamento', 'awaiting_payment'], ['deliveries', 'Entregas', 'deliveries'],
      ['express_attention', 'Express em atenção', 'express_attention']
    ];
    const tiles = $('todayTiles'); tiles.replaceChildren();
    for (const [key, label, targetQueue] of definitions) {
      const button = node('button', `today-tile${key === 'express_attention' ? ' express' : ''}`);
      button.type = 'button'; button.append(node('strong', '', today.counters[key] == null ? '—' : String(today.counters[key])), node('span', '', label));
      button.addEventListener('click', async () => {
        if (targetQueue === 'attendance') {
          $('todayQueueTitle').textContent = label;
          renderWaitingLeads($('todayOrders'), today.waiting_leads || []);
          return;
        }
        const orders = await loadOperationalOrders(targetQueue, '');
        $('todayQueueTitle').textContent = label;
        renderOperationList($('todayOrders'), orders);
      });
      tiles.append(button);
    }
    const selected = queue || 'all';
    const orders = selected === 'all' ? today.orders.filter((order) => !order.is_qa).slice(0, 12)
      : await loadOperationalOrders(selected, '');
    $('todayQueueTitle').textContent = selected === 'all' ? 'Fila operacional' : QUEUE_LABELS[selected];
    renderOperationList($('todayOrders'), orders, 'Nenhuma ação pendente agora.');
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
    heading.append(identity);
    if (Number(customer.summary?.order_count) > 0) {
      const reuse = node('button', 'primary', 'Novo pedido para este cliente');
      reuse.type = 'button';
      reuse.addEventListener('click', () => openNew(customer).catch((error) => {
        $('customerSearchError').textContent = error.message;
      }));
      heading.append(reuse);
    }
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
      summary.append(node('strong', '', order.order_number));
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

  function messageStatusLabel(status) {
    return ({ drafted:'Rascunho', approved:'Aprovada', copied:'Copiada', void:'Cancelada' })[status] || 'Revisar';
  }

  function messageDraftCard(orderNumber, draft, reload, errorTarget) {
    const card = node('article', 'message-draft-card');
    const head = node('div', 'message-draft-head');
    head.append(node('strong', '', draft.template_label), node('span', `message-status ${draft.status}`, messageStatusLabel(draft.status)));
    const meta = node('small', '', `${String(draft.language || 'en').toUpperCase()} · ${dateTime(draft.created_at)}`);
    const text = node('textarea', 'message-preview'); text.readOnly = true; text.value = draft.rendered_text || '';
    text.setAttribute('aria-label', `Prévia: ${draft.template_label}`);
    const actions = node('div', 'message-actions');
    if (draft.status === 'drafted') {
      const approve = node('button', 'primary', 'Aprovar texto'); approve.type = 'button';
      approve.addEventListener('click', async () => {
        approve.disabled = true; errorTarget.textContent = '';
        try {
          await request('/api/system/message-draft', { method:'POST' });
          await request('/api/system/order-messages', { method:'POST', body:JSON.stringify({
            action:'approve', order_number:orderNumber, draft_id:draft.draft_id, expected_version:draft.version
          }) });
          await reload();
        } catch (error) { errorTarget.textContent = error.message; approve.disabled = false; }
      });
      actions.append(approve);
    }
    if (['approved', 'copied'].includes(draft.status)) {
      const copy = node('button', 'primary', draft.status === 'copied' ? 'Copiar novamente' : 'Copiar mensagem');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        copy.disabled = true; errorTarget.textContent = '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponível neste navegador.');
          await navigator.clipboard.writeText(draft.rendered_text);
        } catch (error) {
          errorTarget.textContent = `A mensagem não foi copiada: ${error.message}`;
          copy.disabled = false;
          return;
        }
        try {
          await request('/api/system/message-draft', { method:'POST' });
          await request('/api/system/order-messages', { method:'POST', body:JSON.stringify({
            action:'copied', order_number:orderNumber, draft_id:draft.draft_id, expected_version:draft.version
          }) });
          errorTarget.textContent = 'Mensagem aprovada copiada. Cole na conversa correta do WhatsApp Business.';
          await reload();
        } catch (error) {
          errorTarget.textContent = `Mensagem copiada, mas a auditoria não foi confirmada: ${error.message}`;
          copy.disabled = false;
        }
      });
      actions.append(copy);
    }
    card.append(head, meta, text, actions);
    return card;
  }

  async function loadOrderMessages(orderNumber, section) {
    const payload = await request('/api/system/order-messages', {
      method:'POST', body:JSON.stringify({ action:'context', order_number:orderNumber })
    });
    if (!section.isConnected || section.dataset.orderNumber !== orderNumber) return;
    const context = payload.context;
    const body = section.querySelector('.message-section-body'); body.replaceChildren();
    const error = node('p', 'message-feedback'); error.setAttribute('role', 'status');
    const intro = node('p', 'message-intro', `WhatsApp final ${context.whatsapp_last4 || '—'} · idioma ${String(context.language || 'en').toUpperCase()}. Gere, revise e aprove antes de copiar.`);
    body.append(intro);
    const reload = () => loadOrderMessages(orderNumber, section);
    if (context.is_qa) {
      body.append(node('p', 'message-empty', 'Pedido QA: mensagens para cliente estão bloqueadas.'));
      return;
    }
    if (context.available_templates.length) {
      const form = node('form', 'message-create-form');
      const label = node('label', '', 'Atualização');
      const select = node('select'); select.name = 'template_key';
      for (const template of context.available_templates) {
        const option = node('option', '', template.label); option.value = template.key; select.append(option);
      }
      label.append(select);
      const create = node('button', 'secondary', 'Gerar prévia'); create.type = 'submit';
      form.append(label, create);
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); create.disabled = true; error.textContent = '';
        try {
          await request('/api/system/message-draft', { method:'POST' });
          await request('/api/system/order-messages', { method:'POST', body:JSON.stringify({
            action:'create', order_number:orderNumber, template_key:select.value
          }) });
          await reload();
        } catch (requestError) { error.textContent = requestError.message; create.disabled = false; }
      });
      body.append(form);
    } else {
      body.append(node('p', 'message-empty', 'Nenhuma atualização está disponível para o estado atual.'));
    }
    body.append(error);
    const drafts = node('div', 'message-draft-list');
    for (const draft of context.drafts || []) drafts.append(messageDraftCard(orderNumber, draft, reload, error));
    if (!context.drafts?.length) drafts.append(node('p', 'message-empty', 'Nenhum rascunho criado para este pedido.'));
    body.append(drafts);
  }

  function messageSection(orderNumber) {
    const section = detailSection('Atualização por WhatsApp');
    section.classList.add('message-section'); section.dataset.orderNumber = orderNumber;
    const body = node('div', 'message-section-body');
    body.append(node('p', 'message-empty', 'Carregando mensagens…'));
    section.append(body);
    loadOrderMessages(orderNumber, section).catch((error) => {
      if (section.isConnected) body.replaceChildren(node('p', 'error', error.message));
    });
    return section;
  }

  function invoiceFactsCard(facts, title) {
    const card = node('article', 'invoice-card');
    card.append(node('h3', '', title));
    const lines = node('div', 'invoice-lines');
    for (const line of facts.lines || []) {
      const row = node('div', `invoice-line ${line.line_type || ''}`);
      const description = node('span'); description.append(node('strong', '', line.label || 'Serviço'));
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
    if (context.blocker) body.append(node('p', 'invoice-blocker', context.blocker));
    if (context.preview) body.append(invoiceFactsCard(context.preview, context.current_invoice ? 'Prévia da nova versão' : 'Prévia da invoice'));

    const current = context.current_invoice;
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

  function renderOperationalDetail(order) {
    $('detailNumber').textContent = order.order_number;
    $('detailHeadline').textContent = [order.customer_name, order.property || 'Local não informado',
      order.room ? `Room ${order.room}` : null, String(order.service_tier || '').toUpperCase(), stateLabel(order.order_status)]
      .filter(Boolean).join(' · ');
    $('detailPickupLink').href = order.pickup_order_path;
    const target = $('detailContent'); target.replaceChildren();

    const axes = node('section', 'state-axes');
    for (const [label, value] of [['Lifecycle', order.order_status], ['Custódia', order.custody_state], ['Produção', order.production_state], ['Financeiro', order.payment_status]]) {
      const card = node('div', 'panel state-axis'); card.append(node('small', '', label), node('strong', '', stateLabel(value))); axes.append(card);
    }
    target.append(axes);

    const summary = detailSection('Pedido');
    summary.append(factGrid([
      ['Cliente', order.customer_name], ['WhatsApp', order.whatsapp_last4 ? `Final ${order.whatsapp_last4}` : null],
      ['Local', order.property], ['Quarto', order.room], ['Plano', String(order.service_tier || '').toUpperCase()],
      ['Peso estimado', order.estimated_lbs == null ? null : `${order.estimated_lbs} lb`], ['Bags', order.bags_expected],
      ['Coleta', `${dateTime(order.pickup_window_start)} — ${dateTime(order.pickup_window_end)}`],
      ['Needed by', dateTime(order.needed_by)], ['Prometido Express', dateTime(order.promised_by)],
      ['Instruções', order.special_instructions]
    ]));
    const itemList = node('ul', 'detail-items');
    for (const item of order.items || []) itemList.append(node('li', '', `${item.label || 'Item'}${item.estimated_lbs != null ? ` · ${item.estimated_lbs} lb estimadas` : ''}${item.quantity != null ? ` · ${item.quantity}` : ''}${item.actual_lbs != null ? ` · ${item.actual_lbs} lb confirmadas` : ''}${item.subtotal != null ? ` · ${money(item.subtotal)}` : ''}`));
    if (!order.items?.length) itemList.append(node('li', '', 'Itens não informados'));
    summary.append(node('h3', '', 'Itens'), itemList); target.append(summary);
    target.append(messageSection(order.order_number));

    const poundItems = (order.items || []).filter((item) => item.unit === 'lb');
    if (order.weight_editable && poundItems.length) {
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

    if (order.production_state === 'ready' || ['invoice_created', 'paid', 'failed', 'void'].includes(order.payment_status)) {
      target.append(invoiceSection(order.order_number));
    }

    const action = detailSection('Próxima ação');
    const actionBox = node('div', `detail-next${order.next_action?.enabled ? '' : ' disabled'}`);
    actionBox.append(node('div', '', order.next_action?.label || 'Revisar pedido'));
    if (order.next_action?.blocked_by) actionBox.append(node('small', '', `Disponível em ${order.next_action.blocked_by}`));
    if (order.next_action?.code === 'record_weight' && order.next_action.enabled) {
      actionBox.append(node('small', 'weight-action-hint', 'Registre o peso real em cada item acima. O pedido avança automaticamente quando todos estiverem confirmados.'));
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
    $('successNumber').textContent = order.order_number;
    $('successDetails').innerHTML = `<dl><div><dt>Cliente</dt><dd>${escapeText(order.customer_name)}</dd></div><div><dt>Local</dt><dd>${escapeText(order.property)}</dd></div><div><dt>Serviço</dt><dd>${escapeText(order.service_tier.toUpperCase())}</dd></div><div><dt>Coleta</dt><dd>${new Date(order.pickup_window_start).toLocaleString()}</dd></div></dl>`;
    $('successNext').textContent = order.next_action;
    const path = order.pickup_order_path || pickupPath(order.order_number);
    $('successPickupLink').href = path;
    $('successPrintLink').href = `${path}?print=1`;
    show('successView');
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
    $('loginView').hidden = true; $('systemView').hidden = false;
    $('userLabel').textContent = `${user.display_name} · ${user.role}`;
    show('todayView');
    buildQueueFilters();
    loadToday().catch((error) => { $('todayError').textContent = error.message; });
  }

  $('logoutButton').addEventListener('click', async () => { await request('/api/system/logout', { method: 'POST' }).catch(() => null); location.reload(); });
  $('todayNav').addEventListener('click', () => { show('todayView'); loadToday().catch((error) => { $('todayError').textContent = error.message; }); });
  $('ordersNav').addEventListener('click', () => { show('ordersView'); loadOperationalOrders(activeQueue, '').catch((error) => { $('ordersError').textContent = error.message; }); });
  $('attendanceNav').addEventListener('click', () => show('attendanceView'));
  $('customersNav').addEventListener('click', () => {
    $('customerSearchError').textContent = '';
    show('customersView');
  });
  $('newOrderButton').addEventListener('click', () => openNew().catch((error) => { $('lookupError').textContent = error.message; }));
  $('backButton').addEventListener('click', () => show(newOrderReturnView));
  $('cancelButton').addEventListener('click', () => show(newOrderReturnView));
  $('clearKnownCustomerButton').addEventListener('click', () => openNew().catch((error) => {
    $('orderError').textContent = error.message;
  }));
  $('doneButton').addEventListener('click', () => show('attendanceView'));
  $('refreshTodayButton').addEventListener('click', () => loadToday().catch((error) => { $('todayError').textContent = error.message; }));
  $('todayOpenOrders').addEventListener('click', () => { show('ordersView'); loadOperationalOrders('all', '').catch((error) => { $('ordersError').textContent = error.message; }); });
  $('backToOrdersButton').addEventListener('click', () => show(priorOperationalView));
  $('operationalSearchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('query');
    try { await loadOperationalOrders(activeQueue, query); }
    catch (error) { $('ordersError').textContent = error.message; }
  });
  for (const id of ['custodyFilter', 'productionFilter']) $(id).addEventListener('change', () => {
    const query = new FormData($('operationalSearchForm')).get('query');
    loadOperationalOrders(activeQueue, query).catch((error) => { $('ordersError').textContent = error.message; });
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
    payload.items = itemsFromForm(data);
    payload.care_options = data.getAll('care_options');
    if (activeCustomerRef) payload.customer_ref = activeCustomerRef;
    delete payload.wash_fold; delete payload.special_code; delete payload.special_quantity; delete payload.estimated_lbs;
    try {
      const result = await request('/api/system/orders', { method: 'POST', body: JSON.stringify(payload) });
      showSuccess(result.order);
    } catch (error) { $('orderError').textContent = error.message; }
    finally { button.disabled = false; }
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
