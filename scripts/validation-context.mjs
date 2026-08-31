import fs from 'node:fs';
import path from 'node:path';

export const VALIDATION_CONTEXTS = new Set(['repository', 'public']);

export const REPOSITORY_PRIVATE_SOURCES = [
  'MANIFESTO.md',
  'marketing/meta-ads/pricing-rules.md',
  'marketing/google-ads/2026-07-guest-laundry-search/LOVART-HERO-PROMPT.md',
  'marketing/google-ads/2026-07-guest-laundry-search/assets/hero/A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png',
  'marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/MANIFEST.md',
  'marketing/meta-ads/campaigns/2026-07-tourist-laundry-reinforcement/campaign-spec.yaml',
  'marketing/meta-ads/campaigns/2026-07-comforter-dedicated/MANIFEST.md',
  'marketing/whatsapp/message-templates.md'
];

export function resolveValidationContext(argv) {
  const contextArguments = argv.filter((argument) => argument.startsWith('--validation-context'));

  if (contextArguments.length === 0) {
    throw new Error(
      'Validation context is required. Use --validation-context=repository for a complete checkout or --validation-context=public for the publishable Vercel source set.'
    );
  }

  if (contextArguments.length > 1) {
    throw new Error(
      `Contradictory validation context arguments: ${contextArguments.join(', ')}. Supply exactly one --validation-context value.`
    );
  }

  const match = contextArguments[0].match(/^--validation-context=(.+)$/);
  if (!match || !VALIDATION_CONTEXTS.has(match[1])) {
    throw new Error(
      `Unsupported validation context "${match?.[1] ?? contextArguments[0]}". Expected repository or public.`
    );
  }

  return match[1];
}

export function findMissingRepositoryPrivateSources(root) {
  return REPOSITORY_PRIVATE_SOURCES.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
}

export function repositoryPrivateValidationFailures(root) {
  return findMissingRepositoryPrivateSources(root).map((missingSource) => {
    if (missingSource.endsWith('LOVART-HERO-PROMPT.md')) {
      return 'Guest Laundry landing: Lovart hero production brief is missing';
    }
    if (missingSource.endsWith('A7_GUEST_LAUNDRY_HERO_LOVART_MASTER.png')) {
      return 'Guest Laundry landing: Lovart hero master is missing from the campaign archive';
    }
    return `Repository-private validation source is missing: ${missingSource}`;
  });
}
