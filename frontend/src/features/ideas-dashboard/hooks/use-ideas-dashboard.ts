import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import { fetchIdeas } from '@/features/ideas/api/ideas.api';
import { ideaMutationKeys } from '@/features/ideas/hooks/use-idea-mutations';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import {
  COLUMN_COUNT_MIN,
  FILTER_TO_API_STAGE,
  TABLET_COLUMN_COUNT_MAX,
} from '../lib/constants';
import {
  getColumnSelectMax,
  getEffectiveColumnCount,
  resolveDashboardViewport,
} from '../lib/dashboard-grid-layout';
import { selectIdeasDashboardCards } from '../lib/select-ideas-dashboard-cards';
import { useDashboardGridPreferencesStore } from '../model/dashboard-grid-preferences.store';
import type {
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from '../model/ideas-dashboard.types';

const IDEAS_PAGE_SIZE = 20;

function scrollDashboardToTop(): void {
  window.scrollTo(0, 0);
}

export function useIdeasDashboardPreferences() {
  const activeFilter = useDashboardGridPreferencesStore(s => s.activeFilter);
  const setActiveFilterStore = useDashboardGridPreferencesStore(
    s => s.setActiveFilter,
  );
  const sort = useDashboardGridPreferencesStore(s => s.sort);
  const setSortStore = useDashboardGridPreferencesStore(s => s.setSort);
  const columnCount = useDashboardGridPreferencesStore(s => s.columnCount);
  const setColumnCount = useDashboardGridPreferencesStore(
    s => s.setColumnCount,
  );
  const linkedProblemsExpanded = useDashboardGridPreferencesStore(
    s => s.linkedProblemsExpanded,
  );
  const expandAllLinkedProblems = useDashboardGridPreferencesStore(
    s => s.expandAllLinkedProblems,
  );
  const collapseAllLinkedProblems = useDashboardGridPreferencesStore(
    s => s.collapseAllLinkedProblems,
  );

  const setActiveFilter = useCallback(
    (filter: IdeaDashboardFilter) => {
      scrollDashboardToTop();
      setActiveFilterStore(filter);
    },
    [setActiveFilterStore],
  );

  const setSort = useCallback(
    (nextSort: IdeaDashboardSort) => {
      scrollDashboardToTop();
      setSortStore(nextSort);
    },
    [setSortStore],
  );

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const viewport = resolveDashboardViewport(isMobile, isTablet);

  useEffect(() => {
    if (isTablet && columnCount > TABLET_COLUMN_COUNT_MAX) {
      setColumnCount(TABLET_COLUMN_COUNT_MAX);
    }
  }, [isTablet, columnCount, setColumnCount]);

  const effectiveColumnCount = useMemo(
    () => getEffectiveColumnCount(columnCount, viewport),
    [columnCount, viewport],
  );

  const columnSelectOptions = useMemo(() => {
    const max = getColumnSelectMax(viewport);
    return Array.from(
      { length: max - COLUMN_COUNT_MIN + 1 },
      (_, index) => COLUMN_COUNT_MIN + index,
    );
  }, [viewport]);

  return {
    activeFilter,
    setActiveFilter,
    sort,
    setSort,
    columnCount,
    setColumnCount,
    effectiveColumnCount,
    viewport,
    columnSelectOptions,
    showColumnSelect: !isMobile,
    linkedProblemsExpanded,
    expandAllLinkedProblems,
    collapseAllLinkedProblems,
  };
}

export function useIdeasDashboardQuery(
  activeFilter: IdeaDashboardFilter,
  sort: IdeaDashboardSort,
) {
  const stage =
    activeFilter === 'ALL' ? undefined : FILTER_TO_API_STAGE[activeFilter];

  const selectCards = useCallback(
    (data: InfiniteData<IdeasFeedResponse>) =>
      selectIdeasDashboardCards(data, sort),
    [sort],
  );

  const {
    data: ideas = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryKey: [
      ...ideaMutationKeys.list({ stage, limit: IDEAS_PAGE_SIZE }),
      'infinite',
    ],
    queryFn: ({ pageParam }) =>
      fetchIdeas({ stage, limit: IDEAS_PAGE_SIZE, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    select: selectCards,
  });

  return {
    ideas,
    isLoading,
    isError,
    error,
    refetch,
    onLoadMore: fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

export function useIdeasDashboard() {
  const preferences = useIdeasDashboardPreferences();
  const query = useIdeasDashboardQuery(
    preferences.activeFilter,
    preferences.sort,
  );

  return {
    ...preferences,
    ...query,
  };
}
