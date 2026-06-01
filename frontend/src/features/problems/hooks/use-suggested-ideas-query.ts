import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/features/search/hooks/use-debounced-value';
import { fetchSuggestedIdeas } from '@/features/problems/api/problems.api';
import { problemMutationKeys } from '@/features/problems/hooks/use-problem-mutations';

const DEBOUNCE_MS = 400;

type UseSuggestedIdeasQueryParams = {
  title?: string;
  description?: string;
  tags?: string;
  exclude?: string[];
  enabled?: boolean;
};

export function useSuggestedIdeasQuery({
  title,
  description,
  tags,
  exclude = [],
  enabled = true,
}: UseSuggestedIdeasQueryParams) {
  const debouncedTitle = useDebouncedValue(title ?? '', DEBOUNCE_MS);
  const debouncedDescription = useDebouncedValue(
    description ?? '',
    DEBOUNCE_MS,
  );
  const debouncedTags = useDebouncedValue(tags ?? '', DEBOUNCE_MS);

  const queryParams = {
    title: debouncedTitle || undefined,
    description: debouncedDescription || undefined,
    tags: debouncedTags || undefined,
    exclude: [...exclude].sort(),
  };

  return useQuery({
    queryKey: problemMutationKeys.suggestedIdeas(queryParams),
    queryFn: () => fetchSuggestedIdeas(queryParams),
    enabled,
    staleTime: 30_000,
  });
}
