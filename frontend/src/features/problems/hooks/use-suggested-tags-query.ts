import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/features/search/hooks/use-debounced-value';
import { fetchSuggestedTags } from '@/features/problems/api/problems.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';

const DEBOUNCE_MS = 400;

type UseSuggestedTagsQueryParams = {
  title?: string;
  description?: string;
  exclude?: string[];
  enabled?: boolean;
};

export function useSuggestedTagsQuery({
  title,
  description,
  exclude = [],
  enabled = true,
}: UseSuggestedTagsQueryParams) {
  const debouncedTitle = useDebouncedValue(title ?? '', DEBOUNCE_MS);
  const debouncedDescription = useDebouncedValue(description ?? '', DEBOUNCE_MS);

  const queryParams = {
    title: debouncedTitle || undefined,
    description: debouncedDescription || undefined,
    exclude: [...exclude].sort((left, right) => left.localeCompare(right)),
  };

  return useQuery({
    queryKey: problemMutationKeys.suggestedTags(queryParams),
    queryFn: () => fetchSuggestedTags(queryParams),
    enabled,
    staleTime: 30_000,
  });
}
