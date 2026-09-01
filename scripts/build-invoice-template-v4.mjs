import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_INVOICE_V2.png');
const logoAsset = path.join(root, 'assets/system/invoice/A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1.png');
const outputTemplate = path.join(root, 'assets/system/invoice/A7_ORLANDO_INVOICE_V4.png');
const expectedLogoSize = { width:2205, height:392 };
const logoPlate = { left:140, top:20, width:515, height:145 };
const logoPlacement = { left:165, top:50, width:460, height:82 };

const [sourceMetadata, logoMetadata] = await Promise.all([
  sharp(sourceTemplate).metadata(),
  sharp(logoAsset).metadata()
]);
if (sourceMetadata.width !== 1024 || sourceMetadata.height !== 1536) {
  throw new Error('A7_ORLANDO_INVOICE_V2 has unexpected dimensions.');
}
if (logoMetadata.width !== expectedLogoSize.width || logoMetadata.height !== expectedLogoSize.height) {
  throw new Error('A7_LOGO_OFFICIAL_LIGHT_HORIZONTAL_V1 has unexpected dimensions.');
}

const plate = await sharp({
  create:{ width:logoPlate.width, height:logoPlate.height, channels:3, background:'#ffffff' }
}).png().toBuffer();
const logo = await sharp(logoAsset)
  .flatten({ background:'#ffffff' })
  .resize(logoPlacement.width, logoPlacement.height, {
    fit:'contain', position:'centre', background:'#ffffff'
  })
  .removeAlpha()
  .png({ compressionLevel:9, adaptiveFiltering:true })
  .toBuffer();

await sharp(sourceTemplate)
  .composite([
    { input:plate, left:logoPlate.left, top:logoPlate.top },
    { input:logo, left:logoPlacement.left, top:logoPlacement.top }
  ])
  .png({ compressionLevel:9, adaptiveFiltering:true })
  .toFile(outputTemplate);

const [logoBytes, templateBytes] = await Promise.all([
  fs.readFile(logoAsset),
  fs.readFile(outputTemplate)
]);
console.log(JSON.stringify({
  version:'A7_ORLANDO_INVOICE_V4',
  logoPlate,
  logoPlacement,
  logoSha256:crypto.createHash('sha256').update(logoBytes).digest('hex'),
  templateSha256:crypto.createHash('sha256').update(templateBytes).digest('hex')
}, null, 2));
