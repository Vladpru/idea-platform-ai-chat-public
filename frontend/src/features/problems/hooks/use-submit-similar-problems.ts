import { useProblemsListQuery } from '@/features/problems/hooks/use-problem-queries';
import { pickSimilarProblems } from '@/features/problems/lib/submit-problem/similar-problems';
import { useDebouncedValue } from '@/features/search/hooks/use-debounced-value';
import { useMemo } from 'react';

const DEBOUNCE_MS = 400;

type UseSubmitSimilarProblemsParams = {
  title?: string;
  description?: string;
  excludeProblemId?: string;
  enabled?: boolean;
};

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

  const hasSearchInput =
    debouncedTitle.trim().length > 0 || debouncedDescription.trim().length > 0;

  const { data: problemsFeed, isLoading, isFetching } = useProblemsListQuery({
    sort: 'newest',
    limit: 50,
  });

  const similarProblems = useMemo(() => {
    if (!enabled || !hasSearchInput) {
      return [];
    }

    return pickSimilarProblems(
      problemsFeed?.data ?? [],
      {
        title: debouncedTitle,
        description: debouncedDescription,
      },
      excludeProblemId,
    );
  }, [
    debouncedDescription,
    debouncedTitle,
    enabled,
    excludeProblemId,
    hasSearchInput,
    problemsFeed?.data,
  ]);

  return {
    similarProblems,
    isLoading: (isLoading || isFetching) && hasSearchInput,
  };
}
