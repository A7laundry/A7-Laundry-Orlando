'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const CARE_LABELS = {
    no_dryer: 'No dryer',
    hand_wash: 'Hand wash',
    hypoallergenic: 'Hypoallergenic',
    custom_care: 'Custom Care'
  };
  const PICKUP_LABELS = {
    bell_services: 'Bell Services',
    front_desk: 'Front Desk',
    guest_room: 'Guest Room',
    airbnb_residence: 'Airbnb / Residence',
    meet_customer: 'Meet Customer',
    other: 'Other'
  };

  function orderNumberFromPath() {
    const match = location.pathname.match(/^\/sistema\/orders\/([^/]+)\/pickup-order\/?$/);
    if (!match) return null;
    try {
      const value = decodeURIComponent(match[1]).toUpperCase();
      if (/^MCO-\d{4,12}$/.test(value)) return value.replace('MCO-', 'MCO ');
      return /^(?:A7-ORL-\d{4,}|MCO \d{4,12})$/.test(value) ? value : null;
    } catch (_) {
      return null;
    }
  }

  async function request(orderNumber) {
    const response = await fetch(`/api/system/pickup-order?order_number=${encodeURIComponent(orderNumber)}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (response.status === 401) {
      location.replace('/sistema');
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Pickup Order could not be loaded.');
    return payload.pickup_order;
  }

  function money(value) {
    return value == null ? 'Review required' : new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD'
    }).format(value);
  }

  function moment(value) {
    if (!value) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(new Date(value));
  }

  function windowLabel(start, end) {
    if (!start || !end) return 'Not provided';
    const date = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }).format(new Date(start));
    const time = (value) => new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit'
    }).format(new Date(value));
    return `${date} · ${time(start)}–${time(end)}`;
  }

  function text(id, value) {
    $(id).textContent = value == null || value === '' ? '—' : String(value);
  }

  function optional(rowId, value, targetId = null) {
    $(rowId).hidden = value == null || value === '';
    if (targetId && !$(rowId).hidden) text(targetId, value);
  }

  function render(order) {
    text('orderNumber', order.order_number);
    text('footerOrderNumber', order.order_number);
    text('orderStatus', String(order.order_status || '').replaceAll('_', ' ').toUpperCase());
    text('customerName', order.customer?.name);
    text('customerPhone', order.customer?.whatsapp_number ? `+${order.customer.whatsapp_number}` : null);
    optional('customerLanguageRow', order.customer?.language, 'customerLanguage');
    optional('customerRoomRow', order.customer?.room, 'customerRoom');
    text('propertyType', String(order.property?.type || '').toUpperCase());
    text('propertyName', order.property?.name);
    optional('propertyAddressRow', order.property?.address, 'propertyAddress');
    text('serviceTier', String(order.service?.tier || '').toUpperCase());
    $('expressNotice').hidden = order.service?.tier !== 'express';

    const body = $('serviceItems');
    body.textContent = '';
    for (const item of order.service?.items || []) {
      const row = document.createElement('tr');
      const expected = item.unit === 'lb'
        ? (item.estimated_lbs ? `${item.estimated_lbs} lb estimated` : 'Weight pending')
        : (item.quantity ? `${item.quantity} ${item.unit}` : '—');
      const values = [
        item.label,
        expected,
        `${money(item.unit_price)} / ${item.unit}`,
        Number(item.minimum_amount) > 0 ? money(item.minimum_amount) : '—'
      ];
      for (const value of values) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      body.append(row);
    }

    text('pickupWindow', windowLabel(order.pickup?.window_start, order.pickup?.window_end));
    text('pickupLocation', PICKUP_LABELS[order.pickup?.location] || order.pickup?.location);
    optional('bagsExpectedRow', order.pickup?.bags_expected, 'bagsExpected');
    optional('pickupInstructionsRow', order.pickup?.instructions, 'pickupInstructions');
    text('neededBy', moment(order.delivery?.needed_by));

    const care = Array.isArray(order.special_instructions?.care_options)
      ? order.special_instructions.care_options : [];
    const notes = order.special_instructions?.customer_notes || '';
    $('specialSection').hidden = care.length === 0 && !notes;
    $('careOptions').textContent = '';
    for (const code of care) {
      const item = document.createElement('li');
      item.textContent = CARE_LABELS[code] || code;
      $('careOptions').append(item);
    }
    $('careOptions').hidden = care.length === 0;
    text('customerNotes', notes);
    $('customerNotes').hidden = !notes;

    document.title = `${order.order_number} · Pickup Order`;
    $('loadingState').hidden = true;
    $('pickupOrder').hidden = false;
    $('printButton').disabled = false;
  }

  function fail(message) {
    $('loadingState').hidden = true;
    $('errorState').textContent = message;
    $('errorState').hidden = false;
  }

  $('printButton').addEventListener('click', () => window.print());
  const orderNumber = orderNumberFromPath();
  if (!orderNumber) {
    fail('Invalid Pickup Order address.');
    return;
  }
  request(orderNumber).then((order) => {
    if (!order) return;
    render(order);
    if (new URLSearchParams(location.search).get('print') === '1') {
      setTimeout(() => window.print(), 250);
    }
  }).catch((error) => fail(error.message));
})();
