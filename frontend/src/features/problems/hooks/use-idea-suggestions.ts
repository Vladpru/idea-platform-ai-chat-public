import { useMyIdeasQuery } from '@/features/ideas/hooks/use-idea-queries';
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

export function useIdeaSuggestions({
  title,
  description,
  tags,
  excludeIds,
}: UseIdeaSuggestionsParams) {
  const { data: myIdeasFeed, isLoading: isIdeasListLoading } = useMyIdeasQuery({
    limit: 50,
  });

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

  const suggestionPool = useMemo(() => myIdeasFeed?.data ?? [], [myIdeasFeed]);

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
