'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  let hotels = [];
  let role = null;

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials:'same-origin',
      headers:{ 'Content-Type':'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
    return payload;
  }

  function money(value) {
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(value) || 0);
  }

  function shortDate(value) {
    if (!value) return 'Sem atendimento';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Sem atendimento' : new Intl.DateTimeFormat('pt-BR', { dateStyle:'short' }).format(date);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }

  function selectedHotel() {
    return hotels.find((hotel) => hotel.hotel_id === $('hotelSelect').value) || null;
  }

  function renderSelector() {
    const select = $('hotelSelect');
    const prior = select.value;
    select.replaceChildren(new Option('Hotel não cadastrado', ''));
    for (const hotel of hotels.filter((item) => item.active)) {
      select.append(new Option(`${hotel.canonical_name}${hotel.region ? ` · ${hotel.region}` : ''}`, hotel.hotel_id));
    }
    if ([...select.options].some((option) => option.value === prior)) select.value = prior;
  }

  function syncLocation() {
    const form = $('orderForm');
    const isHotel = form.elements.accommodation_type.value === 'hotel';
    $('hotelDirectoryField').hidden = !isHotel;
    if (!isHotel) {
      form.elements.hotel_id.value = '';
      form.elements.property.readOnly = false;
      form.elements.property_address.readOnly = false;
      return;
    }
    const hotel = selectedHotel();
    form.elements.property.readOnly = Boolean(hotel);
    form.elements.property_address.readOnly = Boolean(hotel);
    if (hotel) {
      form.elements.property.value = hotel.canonical_name;
      form.elements.property_address.value = hotel.address_line;
      if (!form.elements.location_notes.value && hotel.handoff_notes) form.elements.location_notes.value = hotel.handoff_notes;
    }
  }

  async function loadHotels(query = '', includeInactive = false) {
    const payload = await request('/api/system/hotels', {
      method:'POST',
      body:JSON.stringify({ action:'list', query, include_inactive:includeInactive })
    });
    hotels = payload.hotels || [];
    renderSelector();
    return hotels;
  }

  async function ensureSession() {
    if (role) return role;
    const session = await request('/api/system/session');
    role = session.user.role;
    for (const element of document.querySelectorAll('.manager-access')) {
      element.classList.toggle('access-denied', !['owner', 'manager'].includes(role));
    }
    return role;
  }

  function editHotel(hotel = null) {
    if (!['owner', 'manager'].includes(role)) return;
    const form = $('hotelForm');
    form.reset();
    form.elements.hotel_id.value = hotel?.hotel_id || '';
    form.elements.canonical_name.value = hotel?.canonical_name || '';
    form.elements.address_line.value = hotel?.address_line || '';
    form.elements.region.value = hotel?.region || '';
    form.elements.aliases.value = (hotel?.aliases || []).join(', ');
    form.elements.handoff_notes.value = hotel?.handoff_notes || '';
    form.elements.active.checked = hotel ? hotel.active : true;
    $('hotelEditorTitle').textContent = hotel ? 'Editar hotel' : 'Novo hotel';
    $('hotelEditorError').textContent = '';
    $('hotelEditor').hidden = false;
    $('hotelEditor').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function renderResults(rows) {
    const target = $('hotelResults');
    target.replaceChildren();
    if (!rows.length) {
      target.append(node('p', 'customer-empty', 'Nenhum hotel encontrado.'));
      return;
    }
    for (const hotel of rows) {
      const card = node('article', `hotel-card${hotel.active ? '' : ' inactive'}`);
      const main = node('div', 'hotel-card-main');
      main.append(node('h2', '', hotel.canonical_name), node('p', '', hotel.address_line));
      main.append(node('small', '', [hotel.region, hotel.active ? 'Ativo' : 'Inativo', hotel.aliases?.length ? `Aliases: ${hotel.aliases.join(', ')}` : null].filter(Boolean).join(' · ')));
      const kpis = node('div', 'hotel-kpis');
      for (const [label, value] of [
        ['Pedidos', hotel.order_count],
        ['Receita confirmada', money(hotel.confirmed_service_revenue)],
        ['Ticket confirmado', hotel.average_confirmed_ticket == null ? 'Sem pagamento' : money(hotel.average_confirmed_ticket)],
        ['Normal / Express', `${hotel.normal_orders} / ${hotel.express_orders}`],
        ['Novos / recorrentes', `${hotel.new_customer_orders} / ${hotel.repeat_customer_orders}`],
        ['Último serviço', shortDate(hotel.last_service_at)]
      ]) {
        const item = node('div', 'hotel-kpi');
        item.append(node('strong', '', value), node('small', '', label));
        kpis.append(item);
      }
      card.append(main, kpis);
      if (['owner', 'manager'].includes(role)) {
        const button = node('button', 'quiet bordered hotel-edit', 'Editar');
        button.type = 'button';
        button.addEventListener('click', () => editHotel(hotel));
        card.append(button);
      }
      target.append(card);
    }
  }

  function showHotels() {
    for (const view of document.querySelectorAll('.content > div[id$="View"]')) view.hidden = view.id !== 'hotelsView';
    for (const button of document.querySelectorAll('.workspace nav button')) button.classList.remove('active');
    $('hotelsNav').classList.add('active');
    window.scrollTo({ top:0, behavior:'instant' });
  }

  async function openHotels() {
    await ensureSession();
    $('hotelSearchError').textContent = '';
    showHotels();
    const query = new FormData($('hotelSearchForm')).get('hotel_query') || '';
    const rows = await loadHotels(query, ['owner', 'manager'].includes(role) && $('includeInactiveHotels').checked);
    renderResults(rows);
  }

  async function initialize() {
    await ensureSession();
    await loadHotels();
    syncLocation();
  }

  $('hotelsNav').addEventListener('click', () => openHotels().catch((error) => { $('hotelSearchError').textContent = error.message; }));
  $('hotelSearchForm').addEventListener('submit', (event) => {
    event.preventDefault();
    openHotels().catch((error) => { $('hotelSearchError').textContent = error.message; });
  });
  $('includeInactiveHotels').addEventListener('change', () => openHotels().catch((error) => { $('hotelSearchError').textContent = error.message; }));
  $('newHotelButton').addEventListener('click', () => ensureSession().then(() => editHotel()).catch((error) => { $('hotelSearchError').textContent = error.message; }));
  $('cancelHotelButton').addEventListener('click', () => { $('hotelEditor').hidden = true; });
  $('hotelSelect').addEventListener('change', syncLocation);
  $('orderForm').elements.accommodation_type.addEventListener('change', syncLocation);
  $('newOrderButton').addEventListener('click', () => loadHotels().then(syncLocation).catch(() => {}));
  $('hotelForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    $('hotelEditorError').textContent = '';
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data);
    payload.action = 'save';
    payload.active = data.get('active') === 'on';
    if (!payload.hotel_id) delete payload.hotel_id;
    try {
      await request('/api/system/operation-draft', { method:'POST' });
      await request('/api/system/hotels', { method:'POST', body:JSON.stringify(payload) });
      $('hotelEditor').hidden = true;
      await openHotels();
    } catch (error) {
      $('hotelEditorError').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  initialize().catch(() => {});
})();
