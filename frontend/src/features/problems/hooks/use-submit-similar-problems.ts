import { useDebouncedValue } from '@/features/search/hooks/use-debounced-value';
import { fetchSimilarItems } from '@/features/similarity/api/similarity.api';
import { useQuery } from '@tanstack/react-query';

const DEBOUNCE_MS = 400;
const SIMILAR_PROBLEMS_LIMIT = 3;
const MIN_SIMILARITY_TEXT_LENGTH = 10;

type UseSubmitSimilarProblemsParams = {
  title?: string;
  description?: string;
  excludeProblemId?: string;
  enabled?: boolean;
};

function buildSimilaritySearchText(
  title?: string,
  description?: string,
): string {
  return [title, description]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

export function useSubmitSimilarProblems({
  title,
  description,
  excludeProblemId,
  enabled = true,
}: UseSubmitSimilarProblemsParams) {
  const debouncedTitle = useDebouncedValue(title ?? '', DEBOUNCE_MS);
  const debouncedDescription = useDebouncedValue(
    description ?? '',
    DEBOUNCE_MS,
  );

  const searchText = buildSimilaritySearchText(
    debouncedTitle,
    debouncedDescription,
  );

  const hasSearchInput =
    debouncedTitle.trim().length > 0 || debouncedDescription.trim().length > 0;

  const canFetch = enabled && searchText.length >= MIN_SIMILARITY_TEXT_LENGTH;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'similarity',
      'problem',
      'text',
      searchText,
      excludeProblemId ?? null,
    ] as const,
    queryFn: async () => {
      const items = await fetchSimilarItems({
        entityType: 'problem',
        text: searchText,
        limit: SIMILAR_PROBLEMS_LIMIT,
      });

      return items.filter(
        item => item.status === 'PUBLISHED' && item.id !== excludeProblemId,
      );
    },
    enabled: canFetch,
  });

  return {
    similarProblems: canFetch ? (data ?? []) : [],
    isLoading: (isLoading || isFetching) && hasSearchInput,
  };
}
