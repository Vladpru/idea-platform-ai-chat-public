import { useMemo } from 'react';

import { useSuggestedTagsQuery } from '@/features/problems/hooks/use-suggested-tags-query';
import {
  pickSuggestedTags,
  toSuggestedTagChips,
  type SuggestedTagChip,
  type SuggestedTagContext,
} from '@/features/problems/lib/submit-problem/suggested-tags';
import { useTagsQuery } from '@/shared/hooks/use-tags-query';

type UseTagSuggestionsParams = SuggestedTagContext & {
  excludeNames: string[];
};

export function useTagSuggestions({
  title,
  description,
  excludeNames,
}: UseTagSuggestionsParams) {
  const { data: allTags = [] } = useTagsQuery();

  const {
    data: suggestedTagsResponse,
    isLoading: isSuggestedTagsLoading,
    isError: isSuggestedTagsError,
  } = useSuggestedTagsQuery({
    title,
    description,
    exclude: excludeNames,
  });

  const excludeNameSet = useMemo(
    () => new Set(excludeNames.map(name => name.toLowerCase())),
    [excludeNames],
  );

  const suggestedTags: SuggestedTagChip[] = useMemo(() => {
    if (isSuggestedTagsError) {
      return pickSuggestedTags(
        allTags,
        { title, description },
        excludeNameSet,
      );
    }

    return toSuggestedTagChips(suggestedTagsResponse?.data ?? []);
  }, [
    allTags,
    description,
    excludeNameSet,
    isSuggestedTagsError,
    suggestedTagsResponse,
    title,
  ]);

  return {
    suggestedTags,
    isSuggestionsLoading: isSuggestedTagsLoading && !isSuggestedTagsError,
  };
}
