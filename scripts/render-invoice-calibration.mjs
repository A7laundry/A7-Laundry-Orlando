import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildInvoicePdf, buildInvoicePng } = require('../lib/system-document-service.js');

const pickupOrder = {
  order_number:'MCO 1230', order_status:'weighed', accepted_at:'2026-08-31T20:00:00.000Z',
  customer:{ name:'Hayley Sanderson', whatsapp_number:'+44 7584 209506', room:'1441' },
  property:{
    name:'Signia by Hilton Orlando Bonnet Creek',
    address:'14100 Bonnet Creek Resort Lane, Orlando, FL 32821'
  },
  service:{ code:'EXPRESS_8H', tier:'express' },
  pickup:{ window_start:'2026-08-31T19:50:00.000Z', location:'front_desk', bags_expected:null },
  delivery:{ estimated_return:'2026-09-01T03:50:00.000Z', needed_by:'2026-09-01T03:50:00.000Z' },
  special_instructions:{ care_options:[], customer_notes:'Invoice reference 230. Express 8-hour service.' }
};

const invoice = {
  version:1, status:'preview', issued_at:'2026-08-31T20:00:00.000Z', external_number:'230',
  currency:'USD', item_subtotal:47.01, minimum_amount:60,
  minimum_adjustment:12.99, service_amount:60, tip_amount:0,
  lines:[
    { line_type:'item', label:'Express Wash, Dry & Fold', unit:'lb', actual_lbs:11.9, unit_price:3.95, subtotal:47.01 },
    { line_type:'minimum_adjustment', label:'Order minimum adjustment', unit:'adjustment', quantity:1, unit_price:12.99, subtotal:12.99 }
  ]
};

const outputDirectory = path.join(process.cwd(), 'output/pdf');
const baseName = 'A7-Invoice-230-Hayley-Sanderson-CALIBRATED-PREVIEW-A7_ORLANDO_INVOICE_V4';
await fs.mkdir(outputDirectory, { recursive:true });
const [png, pdf] = await Promise.all([
  buildInvoicePng({ pickupOrder, invoice }),
  buildInvoicePdf({ pickupOrder, invoice })
]);
await Promise.all([
  fs.writeFile(path.join(outputDirectory, `${baseName}.png`), png),
  fs.writeFile(path.join(outputDirectory, `${baseName}.pdf`), pdf)
]);
console.log(JSON.stringify({
  png:path.join(outputDirectory, `${baseName}.png`),
  pdf:path.join(outputDirectory, `${baseName}.pdf`)
}, null, 2));
