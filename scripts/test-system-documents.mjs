import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const {
  buildInvoicePdf, buildInvoicePng, buildLabelPdf, buildLabelPng, systemDocumentService,
  invoiceReference, safeFilename, servicePresentation, invoiceBindingFacts,
  invoiceTextLayout, boxTextSvg, INVOICE_FIELD_LAYOUT,
  INVOICE_TEMPLATE_VERSION, INVOICE_TEMPLATE_PATH, INVOICE_TEMPLATE_SHA256,
  LABEL_TEMPLATE_VERSION, LABEL_TEMPLATE_PATH, LABEL_TEMPLATE_SHA256, LABEL_FIELD_LAYOUT,
  DOCUMENT_FONT_PATH, DOCUMENT_FONT_SHA256
} = require('../lib/system-document-service.js');

const pickupOrder = {
  order_number:'MCO 1230', order_status:'weighed',
  customer:{ name:'Hayley Sanderson', whatsapp_number:'+44 7584 209506', room:'1441' },
  property:{ name:'Signia by Hilton Orlando Bonnet Creek', address:'14100 Bonnet Creek Resort Lane, Orlando, FL 32821' },
  service:{ code:'EXPRESS_8H', tier:'express' },
  pickup:{ window_start:'2026-08-31T19:50:00.000Z', location:'front_desk' },
  delivery:{ estimated_return:'2026-09-01T03:50:00.000Z', needed_by:'2026-09-01T03:50:00.000Z' },
  special_instructions:{ care_options:[], customer_notes:'Invoice reference 230. Express 8-hour service.' }
};

const invoice = {
  version:1, status:'issued', issued_at:'2026-08-31T20:00:00.000Z',
  currency:'USD', item_subtotal:47.01, minimum_amount:60,
  minimum_adjustment:12.99, service_amount:60, tip_amount:0,
  lines:[
    { line_type:'item', label:'Express Wash, Dry & Fold', unit:'lb', actual_lbs:11.9, unit_price:3.95, subtotal:47.01 },
    { line_type:'minimum_adjustment', label:'Order minimum adjustment', unit:'adjustment', quantity:1, unit_price:12.99, subtotal:12.99 }
  ]
};

test('thermal label is a real 4x6 PDF and uses a stable filename', async () => {
  const pdf = await buildLabelPdf({ pickupOrder });
  const source = pdf.toString('latin1');
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(source, /MediaBox \[0 0 288 432\]/);
  assert.equal(safeFilename('MCO 1230', 'label'), 'A7-Label-MCO-1230-4x6.pdf');
});

test('official 4x6 label composes order data over immutable A7_ORLANDO_LABEL_V2', async () => {
  const png = await buildLabelPng({ pickupOrder });
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1024);
  assert.equal(metadata.height, 1536);
  assert.equal(LABEL_TEMPLATE_VERSION, 'A7_ORLANDO_LABEL_V2');
  assert.match(LABEL_TEMPLATE_PATH, /A7_ORLANDO_LABEL_V2\.png$/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(LABEL_TEMPLATE_PATH)).digest('hex'),
    LABEL_TEMPLATE_SHA256);
});

test('official label V2 contains the exact supplied Google review QR', async () => {
  const manifest = JSON.parse(fs.readFileSync('assets/system/invoice/A7_ORLANDO_LABEL_V2.json', 'utf8'));
  const qrPath = 'assets/system/invoice/A7_GOOGLE_REVIEW_QR_V1.png';
  const qrBytes = fs.readFileSync(qrPath);
  assert.equal(crypto.createHash('sha256').update(qrBytes).digest('hex'), manifest.qrSha256);
  assert.equal(manifest.cta, 'SCAN TO REVIEW');
  const expectedQr = await sharp(qrPath)
    .resize(manifest.qrPlacement.width, manifest.qrPlacement.height, { kernel:'nearest', fit:'fill' })
    .toColourspace('srgb').removeAlpha().raw().toBuffer();
  const embeddedQr = await sharp(LABEL_TEMPLATE_PATH)
    .extract(manifest.qrPlacement).toColourspace('srgb').removeAlpha().raw().toBuffer();
  assert.equal(crypto.createHash('sha256').update(embeddedQr).digest('hex'),
    crypto.createHash('sha256').update(expectedQr).digest('hex'));
});

test('official 4x6 label fields stay inside their governed boxes', () => {
  const samples = {
    invoiceNumber:['230', { size:52, minSize:28, align:'center', wrap:false }],
    guestName:['Hayley Sanderson', { size:39, minSize:24, maxLines:2 }],
    propertyName:['Signia by Hilton Orlando Bonnet Creek', { size:32, minSize:20, maxLines:2 }],
    room:['1441', { size:40, minSize:25, wrap:false }],
    date:['08/31/2026', { size:29, minSize:19, align:'center', wrap:false }],
    bags:['-', { size:34, minSize:22, align:'center', wrap:false }],
    service:['EXPRESS 8-HOUR', { size:27, minSize:18, align:'center', wrap:false }],
    returnTime:['11:50 PM', { size:29, minSize:19, align:'center', wrap:false }],
    specialInstructions:['Hypoallergenic · No dryer · Hand wash', { size:26, minSize:18, maxLines:3 }]
  };
  for (const [field, [value, options]] of Object.entries(samples)) {
    const result = invoiceTextLayout(value, LABEL_FIELD_LAYOUT[field], options);
    assert.equal(result.fits, true, `${field} must fit`);
    assert.ok(result.width <= LABEL_FIELD_LAYOUT[field].width, `${field} width`);
    assert.ok(result.height <= LABEL_FIELD_LAYOUT[field].height, `${field} height`);
  }
});

test('invoice PDF is letter sized and only accepts issued invoice truth', async () => {
  const pdf = await buildInvoicePdf({ pickupOrder, invoice });
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(pdf.toString('latin1'), /MediaBox \[0 0 612 792\]/);
  assert.equal(invoiceReference('MCO 1230', 1), 'MCO-1230-V1');
  await assert.rejects(buildInvoicePdf({ pickupOrder, invoice:{ ...invoice, status:'void' } }), /issued invoice/i);
});

test('official invoice PNG composes data over immutable A7_ORLANDO_INVOICE_V4', async () => {
  const png = await buildInvoicePng({ pickupOrder, invoice });
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1024);
  assert.equal(metadata.height, 1536);
  assert.equal(INVOICE_TEMPLATE_VERSION, 'A7_ORLANDO_INVOICE_V4');
  assert.match(INVOICE_TEMPLATE_PATH, /A7_ORLANDO_INVOICE_V4\.png$/);
  const actualSha256 = crypto.createHash('sha256').update(fs.readFileSync(INVOICE_TEMPLATE_PATH)).digest('hex');
  assert.equal(actualSha256, INVOICE_TEMPLATE_SHA256);
  assert.equal(safeFilename('MCO 1230', 'invoice_png'), 'A7-Invoice-MCO-1230.png');
  const footerRegion = { left:0, top:1365, width:1024, height:171 };
  const normalizedTemplate = await sharp(INVOICE_TEMPLATE_PATH)
    .png({ compressionLevel:9, adaptiveFiltering:true })
    .withMetadata({ density:144, comment:`invoiceTemplateVersion=${INVOICE_TEMPLATE_VERSION}` })
    .toBuffer();
  const [renderedFooter, templateFooter] = await Promise.all([
    sharp(png).extract(footerRegion).removeAlpha().raw().toBuffer(),
    sharp(normalizedTemplate).extract(footerRegion).removeAlpha().raw().toBuffer()
  ]);
  const renderedFooterSha = crypto.createHash('sha256').update(renderedFooter).digest('hex');
  const templateFooterSha = crypto.createHash('sha256').update(templateFooter).digest('hex');
  assert.equal(renderedFooterSha, templateFooterSha);
});

test('document renderer ships its production font with pinned integrity', () => {
  assert.match(DOCUMENT_FONT_PATH, /Inter-Variable\.ttf$/);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(DOCUMENT_FONT_PATH)).digest('hex'),
    DOCUMENT_FONT_SHA256);
});

test('dynamic document text is converted to vector outlines without host font fallback', () => {
  const svg = boxTextSvg('Hayley 230', { x:10, y:10, width:250, height:50 }, {
    size:28, minSize:18, weight:700, wrap:false
  });
  assert.match(svg, /<path d="M/);
  assert.doesNotMatch(svg, /<text|font-family|@font-face/);
  assert.match(svg, /scale\([^)]* -/);
});

test('official V4 footer contains the exact supplied QR with nearest-neighbor modules', async () => {
  const manifest = JSON.parse(fs.readFileSync('assets/system/invoice/A7_ORLANDO_INVOICE_V4.json', 'utf8'));
  const qrPath = 'assets/system/invoice/A7_GOOGLE_REVIEW_QR_V1.png';
  const qrBytes = fs.readFileSync(qrPath);
  assert.equal(crypto.createHash('sha256').update(qrBytes).digest('hex'), manifest.qrSha256);
  const expectedQr = await sharp(qrPath)
    .resize(manifest.qrPlacement.width, manifest.qrPlacement.height, { kernel:'nearest', fit:'fill' })
    .toColourspace('srgb').removeAlpha().raw().toBuffer();
  const embeddedQr = await sharp(INVOICE_TEMPLATE_PATH)
    .extract(manifest.qrPlacement).toColourspace('srgb').removeAlpha().raw().toBuffer();
  assert.equal(crypto.createHash('sha256').update(embeddedQr).digest('hex'),
    crypto.createHash('sha256').update(expectedQr).digest('hex'));
});

test('official V4 header contains the exact supplied horizontal logo on white', async () => {
  const manifest = JSON.parse(fs.readFileSync('assets/system/invoice/A7_ORLANDO_INVOICE_V4.json', 'utf8'));
  const logoPath = 'assets/system/invoice/A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1.png';
  const logoBytes = fs.readFileSync(logoPath);
  assert.equal(crypto.createHash('sha256').update(logoBytes).digest('hex'), manifest.logoSha256);
  const expectedLogo = await sharp(logoPath)
    .flatten({ background:manifest.logoPlacement.background })
    .resize(manifest.logoPlacement.width, manifest.logoPlacement.height, {
      fit:manifest.logoPlacement.fit, position:'centre', background:manifest.logoPlacement.background
    })
    .toColourspace('srgb').removeAlpha().raw().toBuffer();
  const embeddedLogo = await sharp(INVOICE_TEMPLATE_PATH)
    .extract(manifest.logoPlacement).toColourspace('srgb').removeAlpha().raw().toBuffer();
  assert.equal(crypto.createHash('sha256').update(embeddedLogo).digest('hex'),
    crypto.createHash('sha256').update(expectedLogo).digest('hex'));
});

test('official V4 preserves both header illustrations outside the reduced logo plate', async () => {
  const sourcePath = 'assets/system/invoice/A7_ORLANDO_INVOICE_V2.png';
  const preservedRegions = [
    { left:0, top:0, width:140, height:200 },
    { left:655, top:0, width:369, height:200 }
  ];
  for (const region of preservedRegions) {
    const [expected, actual] = await Promise.all([
      sharp(sourcePath).extract(region).toColourspace('srgb').removeAlpha().raw().toBuffer(),
      sharp(INVOICE_TEMPLATE_PATH).extract(region).toColourspace('srgb').removeAlpha().raw().toBuffer()
    ]);
    assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),
      crypto.createHash('sha256').update(expected).digest('hex'));
  }
});

test('service and SLA are derived from the order instead of the artwork', () => {
  assert.deepEqual(servicePresentation(pickupOrder), {
    code:'EXPRESS_8H',
    label:'EXPRESS 8-HOUR\nWASH, DRY & FOLD', banner:'RETURN WITHIN 8 HOURS',
    subline:'EXPRESS SERVICE', returned:true
  });
  assert.equal(servicePresentation({
    service:{ code:'STANDARD_24H' }, delivery:{ estimated_return:'2026-09-01T19:50:00.000Z' }
  }).banner, 'RETURN WITHIN 24 HOURS');
  assert.equal(servicePresentation({
    service:{ code:'CUSTOM_CARE', label:'Delicate care' }, delivery:{ estimated_return:'2026-09-01T19:50:00.000Z' }
  }).banner, 'RETURN BY 3:50 PM');
  assert.throws(() => servicePresentation({ service:{ tier:'express' } }), /service_code/i);
});

test('Hayley correction binding validates Express financial truth, blank instructions and final tip totals', () => {
  const facts = invoiceBindingFacts(pickupOrder, invoice);
  assert.equal(facts.service.code, 'EXPRESS_8H');
  assert.equal(facts.returnAt, '2026-09-01T03:50:00.000Z');
  assert.equal(facts.specialInstructions, '');
  assert.deepEqual(facts.tipTotals, { 10:'$66.00', 15:'$69.00', 20:'$72.00' });
  assert.throws(() => invoiceBindingFacts(pickupOrder, {
    ...invoice,
    item_subtotal:38.68,
    minimum_adjustment:21.32,
    lines:invoice.lines.map((line) => line.line_type === 'item'
      ? { ...line, unit_price:3.25, subtotal:38.68 } : { ...line, unit_price:21.32, subtotal:21.32 })
  }), /EXPRESS_8H price per pound conflicts/i);
});

test('official template fields stay inside calibrated boxes for short, medium and long content', () => {
  const cases = [
    ['guestName', 'Amy Li', { size:27, minSize:17, maxLines:2 }],
    ['guestName', 'Alexandra Montgomery-Wellington', { size:27, minSize:17, maxLines:2 }],
    ['guestName', 'Christopher Alexander Montgomery-Wellington', { size:27, minSize:17, maxLines:2 }],
    ['propertyName', 'Signia by Hilton Orlando Bonnet Creek', { size:21, minSize:11, wrap:false }],
    ['propertyName', 'The Villas at Disney’s Grand Floridian Resort & Spa', { size:21, minSize:11, wrap:false }],
    ['address', '14100 Bonnet Creek Resort Lane, Orlando, FL 32821', { size:17, minSize:13, weight:600, maxLines:3 }],
    ['address', '12345 Very Long Resort Boulevard, Building Twelve, Lake Buena Vista, Florida 32830', { size:17, minSize:13, weight:600, maxLines:3 }],
    ['specialInstructions', 'Separate colors. Fragrance-free detergent. Call before Bell Desk handoff.', { size:17, minSize:12, weight:600, maxLines:3 }]
  ];
  for (const [field, value, options] of cases) {
    const layout = invoiceTextLayout(value, INVOICE_FIELD_LAYOUT[field], options);
    assert.equal(layout.fits, true, `${field} should fit without clipping: ${value}`);
    assert.ok(layout.width <= layout.box.width, `${field} width escaped its box`);
    assert.ok(layout.height <= layout.box.height, `${field} height escaped its box`);
    assert.ok(layout.baseline >= layout.box.y, `${field} baseline started above its box`);
    assert.ok(layout.baseline + (layout.rows.length - 1) * layout.lineHeight <= layout.box.y + layout.box.height,
      `${field} final baseline escaped its box`);
  }
});

test('service and pickup delivery values use centered orange-box geometry', () => {
  for (const field of ['pickupAt', 'detailNumber', 'returnAt', 'service', 'issuedDate', 'bags', 'pickupSummary', 'returnSummary']) {
    const box = INVOICE_FIELD_LAYOUT[field];
    const value = field === 'service' ? ['EXPRESS 8-HOUR', 'WASH, DRY & FOLD']
      : field === 'bags' ? '2' : ['08/31/2026', '3:50 PM'];
    const layout = invoiceTextLayout(value, box, {
      size:field === 'service' ? 19 : 18, minSize:14, maxLines:Array.isArray(value) ? value.length : 1,
      align:'center', wrap:false
    });
    assert.equal(layout.anchor, 'middle');
    assert.equal(layout.x, box.x + box.width / 2);
    assert.ok(layout.width <= box.width);
  }
  assert.deepEqual(INVOICE_FIELD_LAYOUT.returnSummary, { x:302, y:1148, width:119, height:42 });
});

test('label rendering never depends on invoice schema or mutates financial state', async () => {
  let invoiceCalls = 0;
  const service = systemDocumentService({
    orderService:{ async getPickupOrderByNumber(number) { assert.equal(number, 'MCO 1230'); return pickupOrder; } },
    invoiceService:{ async context() { invoiceCalls += 1; throw new Error('must not be called'); } }
  });
  const result = await service.render('label', '1230');
  assert.equal(result.type, 'label');
  assert.equal(result.filename, 'A7-Label-MCO-1230-4x6.pdf');
  assert.equal(invoiceCalls, 0);
});

test('invoice rendering uses the current immutable invoice and fails closed without it', async () => {
  let context = { current_invoice:invoice, preview:invoice };
  const service = systemDocumentService({
    orderService:{ async getPickupOrderByNumber() { return pickupOrder; } },
    invoiceService:{ async context() { return context; } }
  });
  const result = await service.render('invoice', 'MCO 1230');
  assert.equal(result.filename, 'A7-Invoice-MCO-1230.pdf');
  assert.equal(result.template_version, 'A7_ORLANDO_INVOICE_V4');
  const png = await service.render('invoice_png', 'MCO 1230');
  assert.equal(png.filename, 'A7-Invoice-MCO-1230.png');
  assert.equal(png.mime_type, 'image/png');
  const preview = await service.render('invoice_preview', 'MCO 1230');
  assert.equal(preview.filename, 'A7-Invoice-Preview-MCO-1230.png');
  assert.equal(preview.mime_type, 'image/png');
  assert.equal(preview.template_version, 'A7_ORLANDO_INVOICE_V4');
  assert.equal((await sharp(preview.buffer).metadata()).width, 1024);
  context = { current_invoice:null, preview:null, blocker:'Invoice preview is blocked.' };
  await assert.rejects(service.render('invoice', 'MCO 1230'), /Issue the invoice/i);
  await assert.rejects(service.render('invoice_preview', 'MCO 1230'), /preview is blocked/i);
});

test('unknown document types and missing orders fail closed', async () => {
  const service = systemDocumentService({
    orderService:{ async getPickupOrderByNumber() { return null; } },
    invoiceService:{ async context() { return null; } }
  });
  await assert.rejects(service.render('receipt', 'MCO 1230'), /type is invalid/i);
  assert.equal(await service.render('label', 'MCO 1230'), null);
});
