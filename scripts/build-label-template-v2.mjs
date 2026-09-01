import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_LABEL_V1.png');
const qrAsset = path.join(root, 'assets/system/invoice/A7_GOOGLE_REVIEW_QR_V1.png');
const outputTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_LABEL_V2.png');
const expectedQrSize = { width:370, height:370 };
const qrPlate = { left:722, top:1072, width:220, height:220 };
const qrPlacement = { left:740, top:1090, width:185, height:185 };
const ctaPlacement = { left:255, top:1242, width:230, height:44 };

const [sourceMetadata, qrMetadata] = await Promise.all([
  sharp(sourceTemplate).metadata(),
  sharp(qrAsset).metadata()
]);
if (sourceMetadata.width !== 1024 || sourceMetadata.height !== 1536) {
  throw new Error('A7_ORLANDO_LABEL_V1 has unexpected dimensions.');
}
if (qrMetadata.width !== expectedQrSize.width || qrMetadata.height !== expectedQrSize.height) {
  throw new Error('A7_GOOGLE_REVIEW_QR_V1 has unexpected dimensions.');
}

const plate = await sharp({
  create:{ width:qrPlate.width, height:qrPlate.height, channels:3, background:'#ffffff' }
}).png().toBuffer();
const qr = await sharp(qrAsset)
  .resize(qrPlacement.width, qrPlacement.height, { kernel:'nearest', fit:'fill' })
  .removeAlpha()
  .png({ colours:2, compressionLevel:9 })
  .toBuffer();
const cta = Buffer.from(`<svg width="${ctaPlacement.width}" height="${ctaPlacement.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${ctaPlacement.width}" height="${ctaPlacement.height}" rx="10" fill="#000000"/>
  <text x="${ctaPlacement.width / 2}" y="29" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="2.2" fill="#ffffff">SCAN TO REVIEW</text>
</svg>`);

await sharp(sourceTemplate)
  .composite([
    { input:plate, left:qrPlate.left, top:qrPlate.top },
    { input:qr, left:qrPlacement.left, top:qrPlacement.top },
    { input:cta, left:ctaPlacement.left, top:ctaPlacement.top }
  ])
  .png({ compressionLevel:9, adaptiveFiltering:true })
  .toFile(outputTemplate);

const [qrBytes, templateBytes] = await Promise.all([
  fs.readFile(qrAsset),
  fs.readFile(outputTemplate)
]);
console.log(JSON.stringify({
  version:'A7_ORLANDO_LABEL_V2',
  qrPlate,
  qrPlacement,
  ctaPlacement,
  qrSha256:crypto.createHash('sha256').update(qrBytes).digest('hex'),
  templateSha256:crypto.createHash('sha256').update(templateBytes).digest('hex')
}, null, 2));
