import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function isPublicRootHtml(name) {
  return name.endsWith('.html')
    && name !== 'a7-command-center.html'
    && !/^_preview-.*\.html$/.test(name)
    && !/^comforter-cleaning-v[2-6]\.html$/.test(name);
}

export function isPublicBlogHtml(name) {
  return name.endsWith('.html') && name !== '_TEMPLATE.html';
}

export function canonicalFromHtml(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/a7laundry\.com([^"']*)["'][^>]*>/i)?.[1]
    || html.match(/<link\s+[^>]*href=["']https:\/\/a7laundry\.com([^"']*)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1]
    || null;
}

export function sitemapRoutes(xml) {
  return [...xml.matchAll(/<loc>https:\/\/a7laundry\.com([^<]*)<\/loc>/g)]
    .map((match) => match[1])
    .filter((route) => !route.endsWith('.xml'));
}

export function discoverSourceHtml(root) {
  const files = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isPublicRootHtml(entry.name))
    .map((entry) => entry.name);
  const blogRoot = path.join(root, 'blog');
  files.push(...fs.readdirSync(blogRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isPublicBlogHtml(entry.name))
    .map((entry) => `blog/${entry.name}`));
  return files.sort().map((sourceFile) => {
    const bytes = fs.readFileSync(path.join(root, sourceFile));
    return {
      sourceFile,
      canonicalPath: canonicalFromHtml(bytes.toString('utf8')),
      sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex')
    };
  });
}

export function readRouteConfig(root) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  return {
    rewrites: (config.rewrites || []).map((item) => ({ source: item.source, destination: item.destination.replace(/^\//, '') })),
    redirects: (config.redirects || []).map((item) => ({ source: item.source, destination: item.destination, permanent: Boolean(item.permanent) }))
  };
}

export function buildContentCorpora({ root, registry, exclusions, dist = null, observedSitemap = null }) {
  const html = discoverSourceHtml(root);
  const routeConfig = readRouteConfig(root);
  const sourceSitemap = sitemapRoutes(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'));
  const builtSitemap = dist && fs.existsSync(path.join(dist, 'sitemap.xml'))
    ? sitemapRoutes(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')) : [];
  const registryByPath = new Map(registry.map((asset) => [asset.canonicalPath, asset]));
  const exclusionBySource = new Map(exclusions.map((item) => [item.sourceFile, item]));
  const rewriteBySource = new Map(routeConfig.rewrites.map((item) => [item.source, item]));
  const paths = new Set([...sourceSitemap, ...builtSitemap, ...(observedSitemap || []), ...registry.map((item) => item.canonicalPath), ...exclusions.map((item) => item.route)]);
  for (const item of html) {
    const exclusion = exclusionBySource.get(item.sourceFile);
    if (item.canonicalPath) paths.add(item.canonicalPath);
    else if (exclusion) paths.add(exclusion.route);
  }
  return {
    counts: {
      deployableHtml: html.length,
      registryAssets: registry.length,
      systemExclusions: exclusions.length,
      rewrites: routeConfig.rewrites.length,
      sourceSitemap: sourceSitemap.length,
      builtSitemap: builtSitemap.length,
      observedPublicSitemap: observedSitemap === null ? null : observedSitemap.length
    },
    html,
    rewrites: routeConfig.rewrites,
    redirects: routeConfig.redirects,
    sourceSitemap,
    builtSitemap,
    rows: [...paths].sort().map((canonicalPath) => {
      const asset = registryByPath.get(canonicalPath) || null;
      const exclusion = exclusions.find((item) => item.route === canonicalPath) || null;
      const sourceFiles = html.filter((item) => item.canonicalPath === canonicalPath || asset?.sourceFile === item.sourceFile || exclusion?.sourceFile === item.sourceFile).map((item) => item.sourceFile);
      const rewrite = rewriteBySource.get(canonicalPath);
      let status = asset ? 'covered' : exclusion ? 'explicitly_excluded' : 'new_unregistered';
      if (asset && !sourceFiles.length) status = 'orphaned_registry';
      else if (asset && canonicalPath !== '/' && (!rewrite || rewrite.destination !== asset.sourceFile)) status = 'route_collision';
      else if (exclusion && (!rewrite || rewrite.destination !== exclusion.sourceFile)) status = 'route_collision';
      else if (asset && builtSitemap.length && asset.indexationPolicy === 'index' !== builtSitemap.includes(canonicalPath)) status = 'sitemap_drift';
      else if (observedSitemap !== null && builtSitemap.includes(canonicalPath) !== observedSitemap.includes(canonicalPath)) status = 'public_drift';
      return {
        canonicalPath,
        sourceFiles,
        rewriteSources: rewriteBySource.has(canonicalPath) ? [canonicalPath] : [],
        inA: sourceFiles.length > 0,
        inB: sourceSitemap.includes(canonicalPath),
        inC: builtSitemap.includes(canonicalPath),
        inD: observedSitemap === null ? null : observedSitemap.includes(canonicalPath),
        inE: Boolean(asset || exclusion),
        assetId: asset?.assetId || null,
        exclusionClass: exclusion?.exclusionClass || null,
        status
      };
    })
  };
}
