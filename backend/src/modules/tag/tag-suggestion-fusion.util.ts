import { normalizeTagName, toTagDisplayLabel } from './tag-name.util';
import type {
  RankedTagCandidate,
  SuggestedTagItem,
  TagSuggestionSource,
  TagSuggestionTier,
} from './types/tag-suggestion.types';

const SCORE = {
  AI_TAG: 4,
  MULTI_SOURCE_BONUS: 2,
  STRONG_CATALOG_THRESHOLD: 1.5,
  STRONG_EMBEDDING_THRESHOLD: 1.5,
} as const;

type CatalogLabelLookup = Map<string, string>;

function addSource(
  sources: TagSuggestionSource[],
  source: TagSuggestionSource,
): TagSuggestionSource[] {
  return sources.includes(source) ? sources : [...sources, source];
}

function multiSourceBonus(sourceCount: number): number {
  return sourceCount > 1 ? SCORE.MULTI_SOURCE_BONUS * (sourceCount - 1) : 0;
}

function assignTier(
  sources: TagSuggestionSource[],
  score: number,
): TagSuggestionTier {
  const hasCatalog = sources.includes('catalog');
  const hasEmbedding = sources.includes('embedding');
  const hasAi = sources.includes('ai');

  if (
    sources.length >= 2 ||
    (hasCatalog && hasEmbedding && score >= SCORE.STRONG_CATALOG_THRESHOLD)
  ) {
    return 'strong';
  }

  if (hasAi && !hasCatalog && !hasEmbedding) {
    return 'speculative';
  }

  return 'suggested';
}

export function fuseTagSuggestions(params: {
  catalog: RankedTagCandidate[];
  embedding: RankedTagCandidate[];
  aiTags: string[];
  exclude: Set<string>;
  catalogLabels: CatalogLabelLookup;
  limit: number;
}): SuggestedTagItem[] {
  const merged = new Map<string, RankedTagCandidate>();

  const upsert = (candidate: RankedTagCandidate) => {
    const key = candidate.name.toLowerCase();
    if (params.exclude.has(key)) {
      return;
    }

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...candidate, sources: [...candidate.sources] });
      return;
    }

    existing.score = Math.max(existing.score, candidate.score);
    for (const source of candidate.sources) {
      existing.sources = addSource(existing.sources, source);
    }
  };

  for (const candidate of params.catalog) {
    upsert(candidate);
  }

  for (const candidate of params.embedding) {
    upsert(candidate);
  }

  for (const rawTag of params.aiTags) {
    const name = normalizeTagName(rawTag);
    if (!name || params.exclude.has(name)) {
      continue;
    }

    const catalogLabel = params.catalogLabels.get(name);
    const existing = merged.get(name);
    if (existing) {
      existing.score += SCORE.AI_TAG;
      existing.sources = addSource(existing.sources, 'ai');
      if (catalogLabel) {
        existing.label = catalogLabel;
      }
      continue;
    }

    merged.set(name, {
      name,
      label: toTagDisplayLabel(name, catalogLabel),
      score: SCORE.AI_TAG,
      sources: ['ai'],
    });
  }

  return [...merged.values()]
    .map(candidate => ({
      ...candidate,
      score: candidate.score + multiSourceBonus(candidate.sources.length),
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.name.localeCompare(right.name),
    )
    .slice(0, params.limit)
    .map(candidate => ({
      name: candidate.name,
      label: candidate.label,
      tier: assignTier(candidate.sources, candidate.score),
      sources: candidate.sources,
    }));
}
