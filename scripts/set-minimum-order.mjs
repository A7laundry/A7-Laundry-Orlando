#!/usr/bin/env node
/**
 * Altera o pedido mínimo em todo o site de forma consistente.
 *
 * O site declara "$50 minimum" em centenas de lugares enquanto os flyers do WhatsApp
 * dizem "$60". Essa divergência custa venda no primeiro contato. Este script existe
 * para que a correção seja atômica e verificável, não manual.
 *
 *   node scripts/set-minimum-order.mjs 60           # dry-run: só mostra o que mudaria
 *   node scripts/set-minimum-order.mjs 60 --apply   # aplica
 *
 * Depois de aplicar: npm run build && npm test
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const [, , rawValue, ...flags] = process.argv;
const apply = flags.includes('--apply');
const novo = Number.parseInt(rawValue, 10);

if (!Number.isInteger(novo) || novo <= 0) {
  console.error('Uso: node scripts/set-minimum-order.mjs <valor> [--apply]');
  console.error('Exemplo: node scripts/set-minimum-order.mjs 60 --apply');
  process.exit(1);
}

// dist/ e .vercel/ são regenerados pelo build — editá-los à mão cria divergência silenciosa.
// Este próprio arquivo contém o padrão que procura; alterá-lo se corromperia.
const IGNORAR = /(^|\/)(node_modules|dist|\.vercel|_archive|_tmp|\.git)(\/|$)|set-minimum-order\.mjs$/;

// Validadores e artefatos gerados NÃO são alterados automaticamente.
// Os validadores existem justamente para travar o valor: mudá-los junto derrotaria o guarda.
// Eles são listados separadamente para alteração consciente.
const NAO_TOCAR = /(^|\/)(scripts\/validate-|scripts\/preflight-|scripts\/test-)|(^|\/)generated(\/|$)/;

const SUBSTITUICOES = [
  { de: /\$50 minimum/g, para: `$${novo} minimum` },
  { de: /Minimum order: \$50/g, para: `Minimum order: $${novo}` },
  { de: /\$50 mínimo/g, para: `$${novo} mínimo` }
];

// Ocorrências que dependem do valor mas não são substituição textual direta.
// Ex.: MANIFESTO diz "~17 lbs" porque 50 ÷ 3.25 ≈ 17. Com outro mínimo, muda.
const REVISAR_MANUALMENTE = /(\d+)\s*lbs?\b|equivale a|equivalent to/i;

const arquivos = globSync('**/*.{html,md,js,mjs,json,txt,yaml,yml}', { withFileTypes: false })
  .filter((f) => !IGNORAR.test(f));

let totalOcorrencias = 0;
const alterados = [];
const revisar = [];
const guardas = [];

for (const arquivo of arquivos) {
  let conteudo;
  try {
    conteudo = readFileSync(arquivo, 'utf8');
  } catch {
    continue;
  }

  let novoConteudo = conteudo;
  let ocorrencias = 0;

  for (const { de, para } of SUBSTITUICOES) {
    const achados = novoConteudo.match(de);
    if (achados) {
      ocorrencias += achados.length;
      novoConteudo = novoConteudo.replace(de, para);
    }
  }

  if (!ocorrencias) continue;

  if (NAO_TOCAR.test(arquivo)) {
    guardas.push({ arquivo, ocorrencias });
    continue;
  }

  totalOcorrencias += ocorrencias;
  alterados.push({ arquivo, ocorrencias });

  // Sinaliza linhas onde o valor aparece junto de um cálculo derivado.
  for (const linha of conteudo.split('\n')) {
    if (/\$50/.test(linha) && REVISAR_MANUALMENTE.test(linha)) {
      revisar.push({ arquivo, linha: linha.trim().slice(0, 110) });
    }
  }

  if (apply) writeFileSync(arquivo, novoConteudo, 'utf8');
}

console.log(`\n${apply ? 'APLICADO' : 'DRY-RUN'} — mínimo $50 → $${novo}\n`);
console.log(`Arquivos afetados: ${alterados.length}`);
console.log(`Ocorrências: ${totalOcorrencias}\n`);

for (const { arquivo, ocorrencias } of alterados.slice(0, 15)) {
  console.log(`  ${String(ocorrencias).padStart(3)}×  ${arquivo}`);
}
if (alterados.length > 15) console.log(`  ... e mais ${alterados.length - 15} arquivos`);

if (revisar.length) {
  console.log(`\n⚠️  ${revisar.length} linha(s) com cálculo derivado — REVISAR À MÃO:`);
  for (const { arquivo, linha } of revisar) console.log(`  ${arquivo}\n     ${linha}`);
  console.log(`\n  (ex.: "$50 ≈ 17 lbs" vira "$${novo} ≈ ${Math.round(novo / 3.25)} lbs" à tarifa normal)`);
}

if (guardas.length) {
  console.log(`\n🔒 ${guardas.length} arquivo(s) de validação/gerado — NÃO alterados automaticamente:`);
  for (const { arquivo, ocorrencias } of guardas) console.log(`  ${ocorrencias}×  ${arquivo}`);
  console.log('  Os validadores travam o valor de propósito. Atualize-os à mão, com intenção.');
  console.log('  Artefatos em generated/ saem do build — regenere em vez de editar.');
}

if (!apply) {
  console.log('\nNada foi alterado. Para aplicar:');
  console.log(`  node scripts/set-minimum-order.mjs ${novo} --apply\n`);
} else {
  console.log('\nAplicado. Agora rode:  npm run build && npm test\n');
}
