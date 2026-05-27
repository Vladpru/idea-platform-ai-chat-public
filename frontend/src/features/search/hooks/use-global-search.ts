import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchSearchResults } from '../api/search.api';
import type {
  GlobalSearchResultResponse,
  SearchTab,
} from '../api/search.types';
import { useDebouncedValue } from './use-debounced-value';

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;
const PAGE_LIMIT = 10;

export function useGlobalSearch(query: string, activeTab: SearchTab) {
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const isQueryValid = debouncedQuery.length >= MIN_QUERY_LENGTH;

  return useInfiniteQuery<GlobalSearchResultResponse, Error>({
    queryKey: ['global-search', debouncedQuery, activeTab],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: ({ pageParam }) =>
      fetchSearchResults({
        q: debouncedQuery,
        page: pageParam as number,
        limit: PAGE_LIMIT,
        activeTab,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: isQueryValid,
  });
}
