import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_INVOICE_V1.png');
const qrAsset = path.join(root, 'assets/system/invoice/A7_GOOGLE_REVIEW_QR_V1.png');
const outputTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_INVOICE_V2.png');
const expectedQrSize = { width:370, height:370 };
const qrPlacement = { left:536, top:1388, width:111, height:111 };

const [sourceMetadata, qrMetadata] = await Promise.all([
  sharp(sourceTemplate).metadata(),
  sharp(qrAsset).metadata()
]);
if (sourceMetadata.width !== 1024 || sourceMetadata.height !== 1536) {
  throw new Error('A7_ORLANDO_INVOICE_V1 has unexpected dimensions.');
}
if (qrMetadata.width !== expectedQrSize.width || qrMetadata.height !== expectedQrSize.height) {
  throw new Error('A7_GOOGLE_REVIEW_QR_V1 has unexpected dimensions.');
}

const qr = await sharp(qrAsset)
  .resize(qrPlacement.width, qrPlacement.height, { kernel:'nearest', fit:'fill' })
  .removeAlpha()
  .png({ colours:2, compressionLevel:9 })
  .toBuffer();

await sharp(sourceTemplate)
  .composite([{ input:qr, left:qrPlacement.left, top:qrPlacement.top }])
  .png({ compressionLevel:9, adaptiveFiltering:true })
  .toFile(outputTemplate);

const [qrBytes, templateBytes] = await Promise.all([
  fs.readFile(qrAsset),
  fs.readFile(outputTemplate)
]);
console.log(JSON.stringify({
  version:'A7_ORLANDO_INVOICE_V2',
  qrPlacement,
  qrSha256:crypto.createHash('sha256').update(qrBytes).digest('hex'),
  templateSha256:crypto.createHash('sha256').update(templateBytes).digest('hex')
}, null, 2));
