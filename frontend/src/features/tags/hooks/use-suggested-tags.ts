import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/features/search/hooks/use-debounced-value';
import {
  hasEnoughTagSuggestionContent,
  pickSuggestedTags,
  toSuggestedTagChips,
  type SuggestedTagChip,
  type SuggestedTagContext,
} from '@/features/tags/lib/tag-suggestions';
import { fetchTagSuggestions } from '@/shared/api/tags/tag-suggestions.api';
import { useTagsQuery } from '@/shared/hooks/use-tags-query';
import { useMemo } from 'react';

const DEBOUNCE_MS = 400;

export const tagSuggestionQueryKeys = {
  all: ['tag-suggestions'] as const,
  list: (params: Record<string, unknown>) =>
    [...tagSuggestionQueryKeys.all, params] as const,
};

type UseSuggestedTagsParams = SuggestedTagContext & {
  excludeNames: string[];
  context?: 'idea' | 'problem';
};

export function useSuggestedTags({
  title,
  description,
  excludeNames,
  context = 'problem',
}: UseSuggestedTagsParams) {
  const debouncedTitle = useDebouncedValue(title ?? '', DEBOUNCE_MS);
  const debouncedDescription = useDebouncedValue(description ?? '', DEBOUNCE_MS);
  const { data: allTags = [] } = useTagsQuery();

  const hasSearchInput = hasEnoughTagSuggestionContent(
    debouncedTitle,
    debouncedDescription,
  );

  const queryParams = {
    title: debouncedTitle || undefined,
    description: debouncedDescription || undefined,
    exclude: [...excludeNames].sort((left, right) => left.localeCompare(right)),
    context,
  };

  const {
    data: suggestedTagsResponse,
    isLoading: isSuggestedTagsLoading,
    isFetching,
    isError: isSuggestedTagsError,
  } = useQuery({
    queryKey: tagSuggestionQueryKeys.list(queryParams),
    queryFn: () => fetchTagSuggestions(queryParams),
    enabled: hasSearchInput,
    staleTime: 30_000,
    retry: false,
  });

  const excludeNameSet = useMemo(
    () => new Set(excludeNames.map(name => name.toLowerCase())),
    [excludeNames],
  );

  const suggestedTags: SuggestedTagChip[] = useMemo(() => {
    if (isSuggestedTagsError) {
      return pickSuggestedTags(
        allTags,
        { title: debouncedTitle, description: debouncedDescription },
        excludeNameSet,
      );
    }

    return toSuggestedTagChips(suggestedTagsResponse?.data ?? []);
  }, [
    allTags,
    debouncedDescription,
    debouncedTitle,
    excludeNameSet,
    isSuggestedTagsError,
    suggestedTagsResponse,
  ]);

  return {
    suggestedTags,
    hasSearchInput,
    isSuggestionsLoading:
      hasSearchInput && (isSuggestedTagsLoading || isFetching) && !isSuggestedTagsError,
  };
}
