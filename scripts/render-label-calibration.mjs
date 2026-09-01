import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildLabelPdf, buildLabelPng } = require('../lib/system-document-service.js');

const pickupOrder = {
  order_number:'MCO 1003', order_status:'processing', accepted_at:'2026-08-31T20:00:00.000Z',
  invoice_number:'230',
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

const outputDirectory = path.join(process.cwd(), 'output/pdf');
const baseName = 'A7-Label-230-Hayley-Sanderson-4x6-A7_ORLANDO_LABEL_V2';
await fs.mkdir(outputDirectory, { recursive:true });
const [png, pdf] = await Promise.all([
  buildLabelPng({ pickupOrder }),
  buildLabelPdf({ pickupOrder })
]);
await Promise.all([
  fs.writeFile(path.join(outputDirectory, `${baseName}.png`), png),
  fs.writeFile(path.join(outputDirectory, `${baseName}.pdf`), pdf)
]);
console.log(JSON.stringify({
  png:path.join(outputDirectory, `${baseName}.png`),
  pdf:path.join(outputDirectory, `${baseName}.pdf`)
}, null, 2));
