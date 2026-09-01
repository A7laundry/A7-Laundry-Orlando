'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fontkit = require('fontkit');
const { InvalidTransitionError } = require('./operational-store.js');
const { systemOrderService, normalizeOrderNumber } = require('./system-order-service.js');
const { systemInvoiceService } = require('./system-invoice-service.js');

const LETTER = [612, 792];
const LABEL_4X6 = [288, 432];
const LABEL_TEMPLATE_VERSION = 'A7_ORLANDO_LABEL_V2';
const LABEL_TEMPLATE_SIZE = [1024, 1536];
const LABEL_TEMPLATE_SHA256 = '3a82de77474f7eea69cad141018218d5152f87fee9292576d7f05c0d977e4397';
const LABEL_TEMPLATE_PATH = path.join(
  process.cwd(), 'assets/system/invoice/A7_ORLANDO_LABEL_V2.png'
);
const INVOICE_TEMPLATE_VERSION = 'A7_ORLANDO_INVOICE_V4';
const INVOICE_TEMPLATE_SIZE = [1024, 1536];
const INVOICE_TEMPLATE_SHA256 = 'fbcde47e06f63f27e66c0d6f416574e11cfc1787b4dc515d6c19be192e14f9fe';
const INVOICE_PAGE = [512, 768];
const INVOICE_TEMPLATE_PATH = path.join(
  process.cwd(), 'assets/system/invoice/A7_ORLANDO_INVOICE_V4.png'
);
const DOCUMENT_FONT_PATH = path.join(
  process.cwd(), 'assets/system/invoice/Inter-Variable.ttf'
);
const DOCUMENT_FONT_SHA256 = '29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031';
const NAVY = '#061421';
const NAVY_2 = '#0b263e';
const BLUE = '#0f8acb';
const AQUA = '#62d7df';
const GOLD = '#f5a623';
const GREEN = '#168a49';
const LIGHT = '#f4f7fa';
const MID = '#d8e1e8';
const TEXT = '#17212b';
const MUTED = '#5d6a76';
const LOGO_PATH = path.join(process.cwd(), 'marketing/meta-ads/brand/a7-logo-05.png');

function clean(value, max = 240) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new InvalidTransitionError('Document amount is unresolved.');
  return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(amount);
}

function localDate(value, options = {}) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not set';
  return new Intl.DateTimeFormat('en-US', {
    timeZone:'America/New_York', month:'2-digit', day:'2-digit', year:'numeric',
    ...(options.time ? { hour:'numeric', minute:'2-digit' } : {})
  }).format(new Date(value));
}

function localTime(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not set';
  return new Intl.DateTimeFormat('en-US', {
    timeZone:'America/New_York', hour:'numeric', minute:'2-digit'
  }).format(new Date(value));
}

function pickupLocation(value) {
  return ({
    bell_services:'Bell Services', front_desk:'Front Desk', guest_room:'Guest Room',
    airbnb_residence:'Airbnb / Residence', meet_customer:'Meet Customer', other:'Confirmed handoff'
  })[value] || 'Confirmed handoff';
}

function collect(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function roundedBox(doc, x, y, width, height, fill = '#ffffff', stroke = MID, radius = 10, lineWidth = 0.8) {
  doc.save().lineWidth(lineWidth).roundedRect(x, y, width, height, radius).fillAndStroke(fill, stroke).restore();
}

function titleBar(doc, title, x, y, width) {
  doc.save().roundedRect(x, y, width, 22, 7).fill(NAVY_2).restore();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.2).text(title.toUpperCase(), x + 11, y + 7, { lineBreak:false });
}

function label(doc, value, x, y, options = {}) {
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(7.2)
    .text(clean(value).toUpperCase(), x, y, { lineBreak:false, ...options });
}

function drawOfficialLogo(doc, x, y, width, height) {
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, x, y, { fit:[width, height], align:'center', valign:'center' });
    return;
  }
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(28).text('A7', x, y + 3, { width, align:'center' });
  doc.fillColor(NAVY_2).fontSize(9).text('LAUNDRY', x, y + 38, { width, align:'center' });
}

function drawThermalMark(doc, x, y) {
  // Vector-only thermal identity: crisp at 203/300 dpi and free of gradient blotting.
  doc.save().lineWidth(2.2).strokeColor('#000000').fillColor('#ffffff')
    .font('Helvetica-Bold').fontSize(31).text('A7', x, y, { width:72, align:'center', stroke:true, fill:true });
  doc.moveTo(x + 36, y + 17)
    .bezierCurveTo(x + 29, y + 28, x + 27, y + 34, x + 36, y + 42)
    .bezierCurveTo(x + 45, y + 34, x + 43, y + 28, x + 36, y + 17)
    .stroke();
  doc.fillColor('#000000').fontSize(8.5).text('LAUNDRY', x, y + 47, { width:72, align:'center' }).restore();
}

function invoiceReference(orderNumber, version) {
  return `${clean(orderNumber, 32).replace(/\s+/g, '-')}-V${Number(version) || 1}`;
}

function xml(value) {
  return clean(value, 1000)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

let documentFont = null;
const documentFontVariations = new Map();

function baseDocumentFont() {
  if (documentFont) return documentFont;
  if (!fs.existsSync(DOCUMENT_FONT_PATH)) {
    throw new InvalidTransitionError('The embedded document font is unavailable.');
  }
  const font = fs.readFileSync(DOCUMENT_FONT_PATH);
  const sha256 = crypto.createHash('sha256').update(font).digest('hex');
  if (sha256 !== DOCUMENT_FONT_SHA256) {
    throw new InvalidTransitionError('The embedded document font failed integrity validation.');
  }
  documentFont = fontkit.create(font);
  return documentFont;
}

function documentFontForWeight(rawWeight) {
  const weight = Math.max(100, Math.min(900, Math.round(Number(rawWeight) || 400)));
  if (!documentFontVariations.has(weight)) {
    documentFontVariations.set(weight, baseDocumentFont().getVariation({ wght:weight }));
  }
  return documentFontVariations.get(weight);
}

const INVOICE_FIELD_LAYOUT = Object.freeze({
  headerNumber:{ x:817, y:61, width:169, height:48 },
  guestName:{ x:88, y:305, width:322, height:43 },
  phone:{ x:88, y:402, width:322, height:27 },
  propertyName:{ x:88, y:477, width:322, height:28 },
  room:{ x:88, y:553, width:322, height:28 },
  address:{ x:88, y:627, width:322, height:67 },
  pickupAt:{ x:510, y:315, width:188, height:40 },
  detailNumber:{ x:795, y:315, width:188, height:40 },
  returnAt:{ x:510, y:443, width:188, height:40 },
  service:{ x:788, y:444, width:198, height:72 },
  issuedDate:{ x:510, y:571, width:188, height:35 },
  bags:{ x:788, y:571, width:198, height:35 },
  slaBanner:{ x:535, y:636, width:404, height:40 },
  slaSubline:{ x:535, y:678, width:404, height:24 },
  returnedLine:{ x:282, y:944, width:145, height:64 },
  specialInstructions:{ x:468, y:790, width:514, height:72 },
  minimumLabel:{ x:465, y:1037, width:430, height:23 },
  customCareLabel:{ x:465, y:1088, width:300, height:24 },
  total:{ x:812, y:1072, width:170, height:48 },
  pickupSummary:{ x:86, y:1148, width:127, height:42 },
  returnSummary:{ x:302, y:1148, width:119, height:42 },
  pickupLocation:{ x:86, y:1267, width:127, height:25 },
  returnLocation:{ x:264, y:1267, width:157, height:25 }
});

const LABEL_FIELD_LAYOUT = Object.freeze({
  invoiceNumber:{ x:780, y:101, width:175, height:67 },
  guestName:{ x:215, y:273, width:730, height:58 },
  propertyName:{ x:215, y:412, width:735, height:57 },
  room:{ x:215, y:550, width:735, height:55 },
  date:{ x:205, y:680, width:260, height:48 },
  bags:{ x:660, y:680, width:290, height:48 },
  service:{ x:205, y:806, width:260, height:50 },
  returnTime:{ x:660, y:806, width:290, height:50 },
  specialInstructions:{ x:198, y:939, width:750, height:78 }
});

function glyphFactor(character) {
  if (character === ' ') return 0.28;
  if (/[ilI1|.,:;'`!]/.test(character)) return 0.28;
  if (/[MW@%&#]/.test(character)) return 0.88;
  if (/[A-Z0-9$]/.test(character)) return 0.64;
  if (/[-+()/]/.test(character)) return 0.42;
  return 0.53;
}

function estimatedTextWidth(value, fontSize, weight = 700) {
  const weightFactor = Number(weight) >= 700 ? 1.035 : 1;
  return [...String(value)].reduce((sum, character) => sum + glyphFactor(character), 0) * fontSize * weightFactor;
}

function wrapParagraph(value, width, fontSize, weight, allowWrap) {
  const words = clean(value, 1000).split(/\s+/).filter(Boolean);
  if (!words.length) return ['-'];
  if (!allowWrap) return [words.join(' ')];
  const rows = [];
  for (const word of words) {
    const current = rows[rows.length - 1] || '';
    const candidate = current ? `${current} ${word}` : word;
    if (!current) rows.push(word);
    else if (estimatedTextWidth(candidate, fontSize, weight) <= width) rows[rows.length - 1] = candidate;
    else rows.push(word);
  }
  return rows;
}

function clipRow(value, width, fontSize, weight) {
  if (estimatedTextWidth(value, fontSize, weight) <= width) return value;
  let clipped = String(value);
  while (clipped.length > 1 && estimatedTextWidth(`${clipped}…`, fontSize, weight) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trimEnd()}…`;
}

function invoiceTextLayout(value, box, options = {}) {
  const maxLines = options.maxLines || 1;
  const preferredSize = options.size || 22;
  const minimumSize = Math.min(preferredSize, options.minSize || Math.max(11, preferredSize - 7));
  const weight = options.weight || 700;
  const paragraphs = (Array.isArray(value) ? value : String(value ?? '').split('\n'))
    .map((row) => clean(row, 1000)).filter(Boolean);
  const source = paragraphs.length ? paragraphs : ['-'];
  let selected = null;
  for (let size = preferredSize; size >= minimumSize; size -= 0.5) {
    const rows = source.flatMap((row) => wrapParagraph(row, box.width, size, weight, options.wrap !== false));
    const lineHeight = size * (options.lineHeightFactor || 1.16);
    const height = size + Math.max(0, rows.length - 1) * lineHeight;
    const widest = Math.max(...rows.map((row) => estimatedTextWidth(row, size, weight)));
    if (rows.length <= maxLines && widest <= box.width && height <= box.height) {
      selected = { rows, size, lineHeight, width:widest, height, clipped:false };
      break;
    }
  }
  if (!selected) {
    const size = minimumSize;
    const lineHeight = size * (options.lineHeightFactor || 1.16);
    const wrapped = source.flatMap((row) => wrapParagraph(row, box.width, size, weight, options.wrap !== false));
    const rows = wrapped.slice(0, maxLines);
    rows[maxLines - 1] = clipRow(wrapped.slice(maxLines - 1).join(' '), box.width, size, weight);
    selected = {
      rows, size, lineHeight,
      width:Math.max(...rows.map((row) => estimatedTextWidth(row, size, weight))),
      height:size + Math.max(0, rows.length - 1) * lineHeight,
      clipped:true
    };
  }
  const align = options.align || 'left';
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const x = align === 'center' ? box.x + box.width / 2 : align === 'right' ? box.x + box.width : box.x;
  const top = box.y + Math.max(0, (box.height - selected.height) / 2);
  const baseline = top + selected.size * 0.82;
  return { ...selected, x, baseline, anchor, box:{ ...box }, fits:!selected.clipped };
}

function boxTextSvg(value, box, options = {}) {
  const layout = invoiceTextLayout(value, box, options);
  const weight = options.weight || 700;
  const color = options.color || '#071a3b';
  const font = documentFontForWeight(weight);
  return layout.rows.map((row, index) => {
    const run = font.layout(row);
    const advance = run.positions.reduce((total, position) => total + position.xAdvance, 0);
    const naturalWidth = advance * layout.size / font.unitsPerEm;
    const size = naturalWidth > box.width ? layout.size * box.width / naturalWidth : layout.size;
    const scale = size / font.unitsPerEm;
    const width = advance * scale;
    const startX = layout.anchor === 'middle' ? layout.x - width / 2
      : layout.anchor === 'end' ? layout.x - width : layout.x;
    const baseline = layout.baseline + index * layout.lineHeight;
    let penX = 0;
    const paths = run.glyphs.map((glyph, glyphIndex) => {
      const position = run.positions[glyphIndex];
      const x = penX + position.xOffset;
      const y = position.yOffset;
      penX += position.xAdvance;
      const pathData = glyph.path.toSVG();
      return pathData ? `<path d="${pathData}" transform="translate(${x} ${y})"/>` : '';
    }).join('');
    return `<g fill="${color}" transform="translate(${startX} ${baseline}) scale(${scale} ${-scale})">${paths}</g>`;
  }).join('');
}

function checkSvg(y) {
  return `<path d="M252 ${y + 8} L257 ${y + 14} L268 ${y - 3}" fill="none" stroke="#ff5a00" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function invoiceDisplayNumber(pickupOrder, invoice) {
  const explicit = clean(invoice.external_number || pickupOrder.invoice_number, 32);
  if (explicit) return explicit.replace(/^#/, '');
  const notes = clean(pickupOrder.special_instructions?.customer_notes, 500);
  const noteMatch = notes.match(/invoice\s*(?:reference|number|#)?\s*[:#-]?\s*(\d{1,12})/i);
  if (noteMatch) return noteMatch[1];
  return clean(pickupOrder.order_number, 32).replace(/^MCO\s+/i, 'MCO ');
}

function servicePresentation(pickupOrder) {
  const code = clean(pickupOrder.service?.code, 40).toUpperCase();
  const estimatedReturn = pickupOrder.delivery?.estimated_return || pickupOrder.delivery?.needed_by;
  if (code === 'EXPRESS_8H') return {
    code,
    label:'EXPRESS 8-HOUR\nWASH, DRY & FOLD', banner:'RETURN WITHIN 8 HOURS', subline:'EXPRESS SERVICE', returned:true
  };
  if (code === 'STANDARD_24H') return {
    code,
    label:'STANDARD 24-HOUR\nWASH, DRY & FOLD', banner:'RETURN WITHIN 24 HOURS', subline:'STANDARD SERVICE', returned:false
  };
  if (code === 'CUSTOM_CARE') return {
    code,
    label:(clean(pickupOrder.service?.label, 80) || 'CUSTOM CARE').toUpperCase(),
    banner:estimatedReturn ? `RETURN BY ${localTime(estimatedReturn)}` : 'RETURN AS CONFIRMED',
    subline:'CUSTOM CARE', returned:false
  };
  throw new InvalidTransitionError('Persisted order service_code is missing or unsupported.');
}

function careText(pickupOrder) {
  const names = {
    no_dryer:'No dryer', hand_wash:'Hand wash', hypoallergenic:'Hypoallergenic', custom_care:'Custom Care'
  };
  const options = pickupOrder.special_instructions?.care_options || [];
  return options.map((value) => names[value] || clean(value, 40)).join(' · ');
}

function amountCents(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new InvalidTransitionError(`${label} is unresolved.`);
  return Math.round(amount * 100);
}

function invoiceBindingFacts(pickupOrder, invoice) {
  const service = servicePresentation(pickupOrder);
  const pickupAt = pickupOrder.pickup?.window_start;
  const returnAt = pickupOrder.delivery?.estimated_return || pickupOrder.delivery?.needed_by;
  if (!pickupAt || !Number.isFinite(Date.parse(pickupAt))) {
    throw new InvalidTransitionError('Persisted pickup timestamp is unresolved.');
  }
  if (!returnAt || !Number.isFinite(Date.parse(returnAt))) {
    throw new InvalidTransitionError('Persisted estimated_return timestamp is unresolved.');
  }
  const itemLines = (invoice.lines || []).filter((line) => line.line_type !== 'minimum_adjustment');
  if (!itemLines.length) throw new InvalidTransitionError('Invoice item lines are unresolved.');
  const expectedRate = service.code === 'EXPRESS_8H' ? 395
    : service.code === 'STANDARD_24H' ? 325 : null;
  let computedSubtotal = 0;
  for (const line of itemLines) {
    const price = amountCents(line.unit_price, 'Invoice unit price');
    let lineSubtotal;
    if (line.unit === 'lb') {
      const weight = Number(line.actual_lbs);
      if (!Number.isFinite(weight) || weight <= 0) throw new InvalidTransitionError('Invoice weight is unresolved.');
      if (expectedRate !== null && price !== expectedRate) {
        throw new InvalidTransitionError(`${service.code} price per pound conflicts with the persisted invoice.`);
      }
      lineSubtotal = Math.round(weight * price);
    } else {
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new InvalidTransitionError('Invoice quantity is unresolved.');
      lineSubtotal = Math.round(quantity * price);
    }
    if (amountCents(line.subtotal, 'Invoice line subtotal') !== lineSubtotal) {
      throw new InvalidTransitionError('Invoice line subtotal conflicts with persisted weight, quantity or price.');
    }
    computedSubtotal += lineSubtotal;
  }
  if (amountCents(invoice.item_subtotal, 'Invoice subtotal') !== computedSubtotal) {
    throw new InvalidTransitionError('Invoice subtotal conflicts with persisted invoice lines.');
  }
  const minimumThreshold = amountCents(invoice.minimum_amount || 0, 'Minimum order threshold');
  const expectedAdjustment = Math.max(0, minimumThreshold - computedSubtotal);
  if (amountCents(invoice.minimum_adjustment || 0, 'Minimum order adjustment') !== expectedAdjustment) {
    throw new InvalidTransitionError('Minimum order adjustment conflicts with the persisted threshold and subtotal.');
  }
  if (amountCents(invoice.service_amount, 'Invoice total') !== computedSubtotal + expectedAdjustment) {
    throw new InvalidTransitionError('Invoice total conflicts with subtotal and minimum adjustment.');
  }
  if (amountCents(invoice.tip_amount || 0, 'Invoice tip') !== 0) {
    throw new InvalidTransitionError('Invoice renderer requires a zero persisted tip.');
  }
  const total = Number(invoice.service_amount);
  return {
    service, pickupAt, returnAt,
    specialInstructions:careText(pickupOrder),
    tipTotals:{ 10:money(total * 1.10), 15:money(total * 1.15), 20:money(total * 1.20) }
  };
}

function monetaryBreakdown(invoice) {
  const itemLines = (invoice.lines || []).filter((line) => line.line_type !== 'minimum_adjustment');
  const weightLine = itemLines.find((line) => line.unit === 'lb') || {};
  return {
    weight:weightLine.actual_lbs == null ? '-' : `${Number(weightLine.actual_lbs).toFixed(1)} LB`,
    rate:weightLine.unit_price == null ? '-' : `${money(weightLine.unit_price)} / LB`,
    subtotal:money(invoice.item_subtotal ?? itemLines.reduce((sum, line) => sum + Number(line.subtotal || 0), 0)),
    customCare:money(itemLines.filter((line) => line.unit !== 'lb').reduce((sum, line) => sum + Number(line.subtotal || 0), 0)),
    minimum:money(invoice.minimum_adjustment || 0),
    total:money(invoice.service_amount)
  };
}

function invoiceOverlaySvg({ pickupOrder, invoice }) {
  const customer = pickupOrder.customer || {};
  const property = pickupOrder.property || {};
  const pickup = pickupOrder.pickup || {};
  const binding = invoiceBindingFacts(pickupOrder, invoice);
  const service = binding.service;
  const moneyParts = monetaryBreakdown(invoice);
  const displayNumber = invoiceDisplayNumber(pickupOrder, invoice);
  const minimumApplied = Number(invoice.minimum_adjustment || 0) > 0;
  const minimumLabel = minimumApplied
    ? `MINIMUM ORDER (applied to reach ${money(invoice.minimum_amount || invoice.service_amount)})`
    : 'MINIMUM ORDER (not applied)';
  const customCareAmount = Number(String(moneyParts.customCare).replace(/[^0-9.-]/g, '')) || 0;
  const customCareLabel = customCareAmount > 0 ? 'Custom Care items included.' : 'No Custom Care items.';
  const returnedLine = service.returned
    ? 'Returned within 8 hours\n(Express Service)'
    : service.subline === 'STANDARD SERVICE'
      ? 'Returned within 24 hours\n(Standard Service)'
      : 'Returned by confirmed time\n(Custom Care)';
  const checks = [800, 854, 908, 962].map((y, index) => {
    const enabled = index < 3 || Boolean(service.banner);
    return enabled ? checkSvg(y) : '';
  }).join('');
  return Buffer.from(`<svg width="1024" height="1536" viewBox="0 0 1024 1536" xmlns="http://www.w3.org/2000/svg">
    <rect x="275" y="941" width="155" height="71" rx="4" fill="#ffffff"/>
    <rect x="461" y="1029" width="445" height="32" fill="#ffffff"/>
    <rect x="461" y="1087" width="310" height="27" fill="#ffffff"/>
    ${boxTextSvg(displayNumber, INVOICE_FIELD_LAYOUT.headerNumber, { size:30, minSize:18, align:'center', wrap:false })}
    ${boxTextSvg(customer.name || 'Guest', INVOICE_FIELD_LAYOUT.guestName, { size:27, minSize:17, maxLines:2 })}
    ${boxTextSvg(customer.whatsapp_number || '-', INVOICE_FIELD_LAYOUT.phone, { size:21, minSize:15, wrap:false })}
    ${boxTextSvg(property.name || '-', INVOICE_FIELD_LAYOUT.propertyName, { size:21, minSize:11, wrap:false })}
    ${boxTextSvg(customer.room || '-', INVOICE_FIELD_LAYOUT.room, { size:24, minSize:16, wrap:false })}
    ${boxTextSvg(property.address || '-', INVOICE_FIELD_LAYOUT.address, { size:17, minSize:13, weight:600, maxLines:3 })}

    ${boxTextSvg([localDate(pickup.window_start), localTime(pickup.window_start)], INVOICE_FIELD_LAYOUT.pickupAt, { size:20, minSize:16, maxLines:2, align:'center', wrap:false })}
    ${boxTextSvg(displayNumber, INVOICE_FIELD_LAYOUT.detailNumber, { size:26, minSize:16, align:'center', wrap:false })}
    ${boxTextSvg([localDate(binding.returnAt), localTime(binding.returnAt)], INVOICE_FIELD_LAYOUT.returnAt, { size:20, minSize:16, maxLines:2, align:'center', wrap:false })}
    ${boxTextSvg(service.label.split('\n'), INVOICE_FIELD_LAYOUT.service, { size:19, minSize:14, maxLines:3, align:'center', wrap:false })}
    ${boxTextSvg(localDate(invoice.issued_at || pickupOrder.accepted_at), INVOICE_FIELD_LAYOUT.issuedDate, { size:20, minSize:15, align:'center', wrap:false })}
    ${boxTextSvg(String(pickup.bags_expected || '-'), INVOICE_FIELD_LAYOUT.bags, { size:24, minSize:16, align:'center', wrap:false })}
    ${boxTextSvg(service.banner, INVOICE_FIELD_LAYOUT.slaBanner, { size:26, minSize:19, align:'center', color:'#ff5a00', wrap:false })}
    ${boxTextSvg(service.subline, INVOICE_FIELD_LAYOUT.slaSubline, { size:18, minSize:14, align:'center', wrap:false })}

    ${checks}
    ${boxTextSvg(returnedLine.split('\n'), INVOICE_FIELD_LAYOUT.returnedLine, { size:15, minSize:12, weight:600, maxLines:3 })}
    ${binding.specialInstructions ? boxTextSvg(binding.specialInstructions, INVOICE_FIELD_LAYOUT.specialInstructions, { size:17, minSize:12, weight:600, maxLines:3 }) : ''}

    ${boxTextSvg(moneyParts.weight, { x:912, y:938, width:69, height:21 }, { size:18, minSize:13, align:'right', wrap:false })}
    ${boxTextSvg(moneyParts.rate, { x:912, y:964, width:69, height:21 }, { size:18, minSize:12, align:'right', wrap:false })}
    ${boxTextSvg(moneyParts.subtotal, { x:912, y:990, width:69, height:21 }, { size:18, minSize:12, align:'right', wrap:false })}
    ${boxTextSvg(moneyParts.customCare, { x:912, y:1016, width:69, height:21 }, { size:18, minSize:12, align:'right', wrap:false })}
    ${boxTextSvg(minimumLabel, INVOICE_FIELD_LAYOUT.minimumLabel, { size:14, minSize:11, weight:600, wrap:false })}
    ${boxTextSvg(moneyParts.minimum, { x:912, y:1042, width:69, height:21 }, { size:18, minSize:12, align:'right', wrap:false })}
    ${boxTextSvg(customCareLabel, INVOICE_FIELD_LAYOUT.customCareLabel, { size:14, minSize:11, weight:500, wrap:false })}
    ${boxTextSvg(moneyParts.total.replace('$', ''), INVOICE_FIELD_LAYOUT.total, { size:34, minSize:24, align:'center', wrap:false })}
    ${boxTextSvg(binding.tipTotals[10], { x:478, y:1174, width:135, height:28 }, { size:18, minSize:13, align:'center', wrap:false })}
    ${boxTextSvg(binding.tipTotals[15], { x:656, y:1174, width:135, height:28 }, { size:18, minSize:13, align:'center', wrap:false })}
    ${boxTextSvg(binding.tipTotals[20], { x:834, y:1174, width:135, height:28 }, { size:18, minSize:13, align:'center', wrap:false })}

    ${boxTextSvg([localDate(pickup.window_start), localTime(pickup.window_start)], INVOICE_FIELD_LAYOUT.pickupSummary, { size:18, minSize:14, maxLines:2, align:'center', wrap:false })}
    ${boxTextSvg([localDate(binding.returnAt), localTime(binding.returnAt)], INVOICE_FIELD_LAYOUT.returnSummary, { size:18, minSize:14, maxLines:2, align:'center', wrap:false })}
    ${boxTextSvg(pickupLocation(pickup.location), INVOICE_FIELD_LAYOUT.pickupLocation, { size:16, minSize:12, maxLines:1, wrap:false })}
    ${boxTextSvg(pickupLocation(pickup.location), INVOICE_FIELD_LAYOUT.returnLocation, { size:16, minSize:12, maxLines:1, wrap:false })}
  </svg>`);
}

async function buildInvoicePng({ pickupOrder, invoice }) {
  if (!pickupOrder || !invoice || !['issued', 'preview'].includes(invoice.status)) {
    throw new InvalidTransitionError('An issued invoice or governed preview is required before invoice generation.');
  }
  if (!fs.existsSync(INVOICE_TEMPLATE_PATH)) {
    throw new InvalidTransitionError(`Official invoice template ${INVOICE_TEMPLATE_VERSION} is unavailable.`);
  }
  const template = fs.readFileSync(INVOICE_TEMPLATE_PATH);
  const templateSha256 = crypto.createHash('sha256').update(template).digest('hex');
  if (templateSha256 !== INVOICE_TEMPLATE_SHA256) {
    throw new InvalidTransitionError(`Official invoice template ${INVOICE_TEMPLATE_VERSION} failed integrity validation.`);
  }
  const metadata = await sharp(INVOICE_TEMPLATE_PATH).metadata();
  if (metadata.width !== INVOICE_TEMPLATE_SIZE[0] || metadata.height !== INVOICE_TEMPLATE_SIZE[1]) {
    throw new InvalidTransitionError(`Official invoice template ${INVOICE_TEMPLATE_VERSION} has invalid dimensions.`);
  }
  return sharp(INVOICE_TEMPLATE_PATH)
    .composite([{ input:invoiceOverlaySvg({ pickupOrder, invoice }), top:0, left:0 }])
    .png({ compressionLevel:9, adaptiveFiltering:true })
    .withMetadata({ density:144, comment:`invoiceTemplateVersion=${INVOICE_TEMPLATE_VERSION}` })
    .toBuffer();
}

async function buildInvoicePdf({ pickupOrder, invoice }) {
  const png = await buildInvoicePng({ pickupOrder, invoice });
  const doc = new PDFDocument({ size:LETTER, margin:0, compress:false, info:{
    Title:`A7 Laundry Orlando - Invoice ${invoiceReference(pickupOrder.order_number, invoice.version)}`,
    Author:'A7 Laundry Orlando', Subject:'Customer laundry invoice',
    Keywords:`${INVOICE_TEMPLATE_VERSION}; official template`
  } });
  doc.image(png, 50, 12, { fit:INVOICE_PAGE, align:'center', valign:'center' });
  return collect(doc);
}

function labelOverlaySvg({ pickupOrder }) {
  const customer = pickupOrder.customer || {};
  const property = pickupOrder.property || {};
  const pickup = pickupOrder.pickup || {};
  const returnAt = pickupOrder.delivery?.estimated_return || pickupOrder.delivery?.needed_by;
  const service = servicePresentation(pickupOrder);
  const labelService = service.code === 'EXPRESS_8H' ? 'EXPRESS 8-HOUR'
    : service.code === 'STANDARD_24H' ? 'STANDARD 24-HOUR' : service.subline;
  const displayNumber = invoiceDisplayNumber(pickupOrder, {});
  const specialInstructions = careText(pickupOrder);
  return Buffer.from(`<svg width="1024" height="1536" viewBox="0 0 1024 1536" xmlns="http://www.w3.org/2000/svg">
    ${boxTextSvg(displayNumber, LABEL_FIELD_LAYOUT.invoiceNumber, { size:52, minSize:28, align:'center', color:'#000000', wrap:false })}
    ${boxTextSvg(customer.name || 'Guest', LABEL_FIELD_LAYOUT.guestName, { size:39, minSize:24, maxLines:2, color:'#000000' })}
    ${boxTextSvg(property.name || '-', LABEL_FIELD_LAYOUT.propertyName, { size:32, minSize:20, maxLines:2, color:'#000000' })}
    ${boxTextSvg(customer.room || '-', LABEL_FIELD_LAYOUT.room, { size:40, minSize:25, color:'#000000', wrap:false })}
    ${boxTextSvg(localDate(pickup.window_start), LABEL_FIELD_LAYOUT.date, { size:29, minSize:19, align:'center', color:'#000000', wrap:false })}
    ${boxTextSvg(String(pickup.bags_expected || '-'), LABEL_FIELD_LAYOUT.bags, { size:34, minSize:22, align:'center', color:'#000000', wrap:false })}
    ${boxTextSvg(labelService, LABEL_FIELD_LAYOUT.service, { size:27, minSize:18, align:'center', color:'#000000', wrap:false })}
    ${boxTextSvg(returnAt ? localTime(returnAt) : '-', LABEL_FIELD_LAYOUT.returnTime, { size:29, minSize:19, align:'center', color:'#000000', wrap:false })}
    ${specialInstructions ? boxTextSvg(specialInstructions, LABEL_FIELD_LAYOUT.specialInstructions, { size:26, minSize:18, maxLines:3, color:'#000000' }) : ''}
  </svg>`);
}

async function buildLabelPng({ pickupOrder }) {
  if (!pickupOrder) throw new InvalidTransitionError('Order is required before label generation.');
  if (!fs.existsSync(LABEL_TEMPLATE_PATH)) {
    throw new InvalidTransitionError(`Official label template ${LABEL_TEMPLATE_VERSION} is unavailable.`);
  }
  const template = fs.readFileSync(LABEL_TEMPLATE_PATH);
  const templateSha256 = crypto.createHash('sha256').update(template).digest('hex');
  if (templateSha256 !== LABEL_TEMPLATE_SHA256) {
    throw new InvalidTransitionError(`Official label template ${LABEL_TEMPLATE_VERSION} failed integrity validation.`);
  }
  const metadata = await sharp(LABEL_TEMPLATE_PATH).metadata();
  if (metadata.width !== LABEL_TEMPLATE_SIZE[0] || metadata.height !== LABEL_TEMPLATE_SIZE[1]) {
    throw new InvalidTransitionError(`Official label template ${LABEL_TEMPLATE_VERSION} has invalid dimensions.`);
  }
  return sharp(LABEL_TEMPLATE_PATH)
    .composite([{ input:labelOverlaySvg({ pickupOrder }), top:0, left:0 }])
    .grayscale()
    .png({ compressionLevel:9, adaptiveFiltering:true })
    .withMetadata({ density:256, comment:`labelTemplateVersion=${LABEL_TEMPLATE_VERSION}` })
    .toBuffer();
}

async function buildLabelPdf({ pickupOrder }) {
  const png = await buildLabelPng({ pickupOrder });
  const doc = new PDFDocument({ size:LABEL_4X6, margin:0, compress:false, info:{
    Title:`A7 Laundry Orlando - 4x6 Label - ${pickupOrder.order_number}`,
    Author:'A7 Laundry Orlando', Subject:'Thermal laundry bag label',
    Keywords:`${LABEL_TEMPLATE_VERSION}; official template`
  } });
  doc.image(png, 0, 0, { fit:LABEL_4X6, align:'center', valign:'center' });
  return collect(doc);
}

function safeFilename(orderNumber, type) {
  const base = clean(orderNumber, 32).replace(/[^A-Za-z0-9_-]+/g, '-');
  if (type === 'label') return `A7-Label-${base}-4x6.pdf`;
  if (type === 'invoice_preview') return `A7-Invoice-Preview-${base}.png`;
  if (type === 'invoice_png') return `A7-Invoice-${base}.png`;
  return `A7-Invoice-${base}.pdf`;
}

function systemDocumentService(options = {}) {
  const orders = options.orderService || systemOrderService(options);
  const invoices = options.invoiceService || systemInvoiceService(options);
  return {
    async render(rawType, rawOrderNumber) {
      const type = clean(rawType, 20).toLowerCase();
      if (!['invoice', 'invoice_png', 'invoice_preview', 'label'].includes(type)) throw new InvalidTransitionError('Document type is invalid.');
      const orderNumber = normalizeOrderNumber(rawOrderNumber);
      if (!orderNumber) throw new InvalidTransitionError('Order number is invalid.');
      const pickupOrder = await orders.getPickupOrderByNumber(orderNumber);
      if (!pickupOrder) return null;
      if (type === 'label') {
        return { type, filename:safeFilename(orderNumber, type), buffer:await buildLabelPdf({ pickupOrder }) };
      }
      const context = await invoices.context(orderNumber);
      if (type === 'invoice_preview') {
        if (!context?.preview) throw new InvalidTransitionError(context?.blocker || 'Invoice preview is unavailable.');
        const preview = {
          ...context.preview,
          status:'preview',
          version:Number(context.current_invoice?.version || 0) + 1,
          issued_at:pickupOrder.accepted_at || null
        };
        return {
          type, mime_type:'image/png', template_version:INVOICE_TEMPLATE_VERSION,
          filename:safeFilename(orderNumber, type),
          buffer:await buildInvoicePng({ pickupOrder, invoice:preview })
        };
      }
      if (!context?.current_invoice) throw new InvalidTransitionError('Issue the invoice before generating its PDF.');
      const invoice = context.current_invoice;
      return type === 'invoice_png'
        ? { type, mime_type:'image/png', template_version:INVOICE_TEMPLATE_VERSION,
          filename:safeFilename(orderNumber, type), buffer:await buildInvoicePng({ pickupOrder, invoice }) }
        : { type, mime_type:'application/pdf', template_version:INVOICE_TEMPLATE_VERSION,
          filename:safeFilename(orderNumber, type), buffer:await buildInvoicePdf({ pickupOrder, invoice }) };
    }
  };
}

module.exports = {
  systemDocumentService, buildInvoicePdf, buildInvoicePng, buildLabelPdf, buildLabelPng, invoiceReference,
  invoiceDisplayNumber, servicePresentation, invoiceBindingFacts, safeFilename, localDate, localTime, pickupLocation,
  invoiceTextLayout, estimatedTextWidth, boxTextSvg, INVOICE_FIELD_LAYOUT,
  INVOICE_TEMPLATE_VERSION, INVOICE_TEMPLATE_PATH, INVOICE_TEMPLATE_SIZE, INVOICE_TEMPLATE_SHA256,
  LABEL_TEMPLATE_VERSION, LABEL_TEMPLATE_PATH, LABEL_TEMPLATE_SIZE, LABEL_TEMPLATE_SHA256,
  DOCUMENT_FONT_PATH, DOCUMENT_FONT_SHA256,
  LABEL_FIELD_LAYOUT, LETTER, LABEL_4X6
};
