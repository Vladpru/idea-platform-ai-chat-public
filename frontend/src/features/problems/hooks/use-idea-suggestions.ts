import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import {
  useIdeasListQuery,
  useMyIdeasQuery,
} from '@/features/ideas/hooks/use-idea-queries';
import { useSuggestedIdeasQuery } from '@/features/problems/hooks/use-suggested-ideas-query';
import {
  type SuggestedIdeaChip,
  type SuggestedIdeaContext,
  pickSuggestedIdeas,
  toIdeaSelectOptions,
} from '@/features/problems/lib/submit-problem/suggested-ideas';
import { useMemo } from 'react';

type UseIdeaSuggestionsParams = SuggestedIdeaContext & {
  excludeIds: string[];
};

function mergeIdeaFeeds(
  myIdeas: IdeaFormResponseDto[] | undefined,
  publishedIdeas: IdeaFormResponseDto[] | undefined,
): IdeaFormResponseDto[] {
  const byId = new Map<string, IdeaFormResponseDto>();
  for (const idea of myIdeas ?? []) {
    byId.set(idea.id, idea);
  }
  for (const idea of publishedIdeas ?? []) {
    if (!byId.has(idea.id)) {
      byId.set(idea.id, idea);
    }
  }
  return [...byId.values()];
}

export function useIdeaSuggestions({
  title,
  description,
  tags,
  excludeIds,
}: UseIdeaSuggestionsParams) {
  const { data: ideasFeed, isLoading: isIdeasListLoading } = useIdeasListQuery({
    sort: 'newest',
    limit: 50,
  });
  const { data: myIdeasFeed } = useMyIdeasQuery({ limit: 50 });

  const {
    data: suggestedIdeasResponse,
    isLoading: isSuggestedIdeasLoading,
    isError: isSuggestedIdeasError,
  } = useSuggestedIdeasQuery({
    title,
    description,
    tags,
    exclude: excludeIds,
  });

  const suggestionPool = useMemo(
    () => mergeIdeaFeeds(myIdeasFeed?.data, ideasFeed?.data),
    [ideasFeed, myIdeasFeed],
  );

  const allIdeas = useMemo(
    () => toIdeaSelectOptions(suggestionPool),
    [suggestionPool],
  );

  const suggestedIdeas: SuggestedIdeaChip[] = useMemo(() => {
    if (isSuggestedIdeasError) {
      return pickSuggestedIdeas(
        suggestionPool,
        { title, description, tags },
        new Set(excludeIds),
      );
    }
    return toIdeaSelectOptions(suggestedIdeasResponse?.data ?? []);
  }, [
    isSuggestedIdeasError,
    suggestionPool,
    title,
    description,
    tags,
    excludeIds,
    suggestedIdeasResponse,
  ]);

  return {
    allIdeas,
    suggestedIdeas,
    isIdeasListLoading,
    isSuggestionsLoading: isSuggestedIdeasLoading && !isSuggestedIdeasError,
  };
}
