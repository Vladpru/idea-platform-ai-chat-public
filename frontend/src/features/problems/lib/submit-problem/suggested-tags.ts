import type { TagListItem } from '@/shared/api/tags/tags.types';
import { formatTags, parseTags } from '@/features/ideas/lib/create-idea/tags';

export type SuggestedTagChip = {
  name: string;
  label: string;
};

export function toSuggestedTagChips(
  tags: ReadonlyArray<{ name: string; label?: string | null }>,
): SuggestedTagChip[] {
  return tags.map(tag => ({
    name: tag.name,
    label: tag.label?.trim() || tag.name,
  }));
}

export type SuggestedTagContext = {
  title?: string;
  description?: string;
};

const SUGGESTED_TAGS_LIMIT = 6;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length >= 3);
}

function scoreTagRelevance(tag: TagListItem, context: SuggestedTagContext): number {
  const haystack = `${tag.name} ${tag.label ?? ''}`.toLowerCase();
  const tokens = [
    ...tokenize(context.title ?? ''),
    ...tokenize(context.description ?? ''),
  ];

  let score = 0;
  for (const token of new Set(tokens)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function pickSuggestedTags(
  allTags: TagListItem[],
  context: SuggestedTagContext,
  excludeNames: ReadonlySet<string>,
  limit = SUGGESTED_TAGS_LIMIT,
): SuggestedTagChip[] {
  const candidates = allTags.filter(
    tag => !excludeNames.has(tag.name.toLowerCase()),
  );

  const scored = candidates
    .map((tag, index) => ({
      name: tag.name,
      label: tag.label?.trim() || tag.name,
      score: scoreTagRelevance(tag, context),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    });

  const relevant = scored.some(entry => entry.score > 0);
  const pool = relevant ? scored.filter(entry => entry.score > 0) : scored;

  return pool.slice(0, limit).map(({ name, label }) => ({ name, label }));
}

export function toggleTagInValue(currentValue: string, tagName: string): string {
  const tags = parseTags(currentValue);
  const normalized = tagName.toLowerCase();

  if (tags.some(tag => tag.toLowerCase() === normalized)) {
    return formatTags(tags.filter(tag => tag.toLowerCase() !== normalized));
  }

  return formatTags([...tags, tagName]);
}

export function getSelectedTagNames(value: string | undefined): string[] {
  return parseTags(value);
}
