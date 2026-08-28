import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_REGISTRY, SYSTEM_ROUTE_EXCLUSIONS } from '../governance/content-registry.mjs';
import { buildContentCorpora } from './lib/content-corpora.mjs';
import { checkGeneratedContentCatalog, writeContentCatalog } from './lib/content-registry-compiler.mjs';
import { validateContentRegistry } from './validate-content-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function audit(dist = null, observedSitemap = null) {
  const validation = validateContentRegistry({ root });
  const corpora = buildContentCorpora({ root, registry: CONTENT_REGISTRY, exclusions: SYSTEM_ROUTE_EXCLUSIONS, dist, observedSitemap });
  const critical = corpora.rows.filter((row) => ['new_unregistered', 'orphaned_registry', 'canonical_collision', 'route_collision', 'sitemap_drift', 'public_drift'].includes(row.status));
  return { validation, corpora, critical };
}

async function observedRoutes(originValue) {
  if (!originValue) return null;
  const origin = new URL(originValue);
  const preview = /^a7-laundry-orlando-[a-z0-9]+-dennis-a7s-projects\.vercel\.app$/.test(origin.hostname);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || (origin.origin !== 'https://a7laundry.com' && !preview)) throw new Error('observed origin rejected');
  const headers = { Accept: 'application/xml,text/xml' };
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const response = await fetch(`${origin.origin}/sitemap.xml`, { redirect: 'error', cache: 'no-store', headers });
  if (!response.ok || (response.url && response.url !== `${origin.origin}/sitemap.xml`)) throw new Error('observed sitemap unavailable');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2_000_000) throw new Error('observed sitemap too large');
  return [...bytes.toString('utf8').matchAll(/<loc>https:\/\/a7laundry\.com([^<]*)<\/loc>/g)].map((match) => match[1] || '/');
}

const command = process.argv[2] || 'discover';
if (command === 'discover') {
  const result = audit();
  console.log(JSON.stringify({ counts: result.corpora.counts, critical: result.critical, warnings: result.validation.warnings }, null, 2));
  if (!result.validation.ok || result.critical.length) process.exitCode = 1;
} else if (command === 'reconcile') {
  const dist = path.resolve(root, option('--dist') || 'dist');
  const result = audit(dist, await observedRoutes(option('--observed-origin')));
  console.log(JSON.stringify({ counts: result.corpora.counts, critical: result.critical, warnings: result.validation.warnings }, null, 2));
  if (!result.validation.ok || result.critical.length) process.exitCode = 1;
} else if (command === 'compile') {
  const result = writeContentCatalog({ root });
  console.log(`Compiled governed content catalog: ${result.destination}`);
} else if (command === 'check-generated') {
  const result = checkGeneratedContentCatalog({ root });
  if (!result.ok) {
    console.error(`Generated content catalog is stale: ${result.destination}`);
    process.exitCode = 1;
  } else console.log(`Generated content catalog is deterministic and current: ${result.destination}`);
} else {
  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}
