export const FUNNEL_FILTER_KEYS = ['itemId', 'persona', 'pain', 'awareness', 'angle', 'hook', 'format', 'promise', 'cta', 'stage'];

export function normalizeFunnelArtifact(input) {
  if (!input || input.readOnly !== true || input.platformMutation !== false) {
    throw new Error('Funnel artifact must be explicitly read-only.');
  }
  const briefs = Array.isArray(input.briefs) ? input.briefs : [];
  const evidence = input.evidence?.evidence || [];
  return {...input, briefs, evidence: {...input.evidence, evidence}};
}

export function filterFunnelBriefs(input, filters = {}) {
  const artifact = normalizeFunnelArtifact(input);
  return artifact.briefs.filter((brief) => FUNNEL_FILTER_KEYS.every((key) => {
    const expected = filters[key];
    if (!expected || expected === 'all') return true;
    const actual = key === 'itemId' || key === 'stage' ? brief[key] : brief.taxonomy?.[key];
    return actual === expected;
  }));
}

export function funnelViewModel(input, filters = {}) {
  const artifact = normalizeFunnelArtifact(input);
  const briefs = filterFunnelBriefs(artifact, filters);
  const selectedIds = new Set(artifact.experiments.waves.flatMap((wave) => wave.members.map((member) => member.briefId)));
  return {
    availability: artifact.availability,
    catalog: artifact.catalog.items,
    briefs,
    backlog: briefs.filter((brief) => !selectedIds.has(brief.id)),
    selected: briefs.filter((brief) => selectedIds.has(brief.id)),
    coverage: artifact.inventory.coverage,
    stages: artifact.inventory.stages,
    history: artifact.experiments.history,
    evidence: artifact.evidence.evidence,
    research: artifact.research.findings,
    semanticWarnings: artifact.semanticWarnings
  };
}

globalThis.A7_FUNNEL_CONTRACT = {FUNNEL_FILTER_KEYS, normalizeFunnelArtifact, filterFunnelBriefs, funnelViewModel};
