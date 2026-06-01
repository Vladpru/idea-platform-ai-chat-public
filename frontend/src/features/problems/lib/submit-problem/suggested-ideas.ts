import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { parseTags } from '@/features/ideas/lib/create-idea/tags';
import { API_STAGE, IDEA_STATUS } from '@/features/ideas/model/idea.types';

export type SuggestedIdeaContext = {
  title?: string;
  description?: string;
  tags?: string;
};

export type SuggestedIdeaChip = {
  id: string;
  label: string;
};

export type IdeaSelectOption = SuggestedIdeaChip;

export function toIdeaSelectOptions(
  ideas: ReadonlyArray<{ id: string; title?: string | null }>,
): IdeaSelectOption[] {
  return ideas.map(idea => ({
    id: idea.id,
    label: idea.title?.trim() || 'Untitled idea',
  }));
}

const SUGGESTED_IDEAS_LIMIT = 6;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(token => token.length >= 3);
}

function scoreIdeaRelevance(
  idea: IdeaFormResponseDto,
  context: SuggestedIdeaContext,
): number {
  const problemTags = new Set(
    parseTags(context.tags).map(tag => tag.toLowerCase()),
  );
  let score = 0;

  for (const tag of idea.tags) {
    if (problemTags.has(tag.name.toLowerCase())) {
      score += 3;
    }
  }

  const haystack =
    `${idea.title ?? ''} ${idea.description ?? ''}`.toLowerCase();
  const tokens = [
    ...tokenize(context.title ?? ''),
    ...tokenize(context.description ?? ''),
  ];

  for (const token of new Set(tokens)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  if (idea.status === IDEA_STATUS.PUBLISHED) {
    score += 0.5;
  }

  return score;
}

export function pickSuggestedIdeas(
  ideas: IdeaFormResponseDto[],
  context: SuggestedIdeaContext,
  excludedIds: ReadonlySet<string>,
  limit = SUGGESTED_IDEAS_LIMIT,
): SuggestedIdeaChip[] {
  const candidates = ideas.filter(
    idea =>
      !excludedIds.has(idea.id) &&
      idea.stage !== API_STAGE.ARCHIVED,
  );

  const scored = candidates
    .map((idea, index) => ({
      id: idea.id,
      label: idea.title?.trim() || 'Untitled idea',
      score: scoreIdeaRelevance(idea, context),
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

  return pool.slice(0, limit).map(({ id, label }) => ({ id, label }));
}
