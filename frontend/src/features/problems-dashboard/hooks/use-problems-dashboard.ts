import {
  COLUMN_COUNT_MIN,
  getColumnSelectMax,
  getEffectiveColumnCount,
  resolveDashboardViewport,
  type ProblemDashboardFilter,
  type ProblemDashboardSort,
  TABLET_COLUMN_COUNT_MAX,
} from '@/features/ideas-dashboard';
import type { ProblemStage } from '@/features/problems/api/problems-api.types';
import type { ProblemsFeedResponse } from '@/features/problems/api/problems-api.types';
import { fetchProblems } from '@/features/problems/api/problems.api';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';

import { useMediaQuery } from '@/shared/hooks/use-media-query';

import { API_STAGE_TO_FILTER, FILTER_TO_API_STAGE } from '../lib/constants';
import { selectProblemsDashboardCards } from '../lib/select-problems-dashboard-cards';
import { useProblemsDashboardGridPreferencesStore } from '../store/problems-dashboard-grid-preferences.store';

const PROBLEMS_PAGE_SIZE = 20;

function scrollDashboardToTop(): void {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function useProblemsDashboardPreferences() {
  const search = useSearch({ from: '/_auth/problems/' });
  const navigate = useNavigate();

  const sort: ProblemDashboardSort = search.sort ?? 'newest';
  const stage: ProblemStage | undefined = search.stage as
    | ProblemStage
    | undefined;

  const activeFilter: ProblemDashboardFilter = stage
    ? API_STAGE_TO_FILTER[stage]
    : 'ALL';

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search);
    if (!raw.has('sort')) {
      void navigate({
        to: '.',
        search: { sort, stage },
        replace: true,
      });
    }
  }, []);

  const columnCount = useProblemsDashboardGridPreferencesStore(
    s => s.columnCount,
  );
  const setColumnCount = useProblemsDashboardGridPreferencesStore(
    s => s.setColumnCount,
  );
  const linkedIdeasExpanded = useProblemsDashboardGridPreferencesStore(
    s => s.linkedIdeasExpanded,
  );
  const expandAllLinkedIdeas = useProblemsDashboardGridPreferencesStore(
    s => s.expandAllLinkedIdeas,
  );
  const collapseAllLinkedIdeas = useProblemsDashboardGridPreferencesStore(
    s => s.collapseAllLinkedIdeas,
  );

  const setActiveFilter = useCallback(
    (filter: ProblemDashboardFilter) => {
      scrollDashboardToTop();
      const nextStage =
        filter === 'ALL' ? undefined : FILTER_TO_API_STAGE[filter];
      void navigate({
        to: '.',
        search: prev => ({ ...prev, stage: nextStage }),
      });
    },
    [navigate],
  );

  const setSort = useCallback(
    (nextSort: ProblemDashboardSort) => {
      scrollDashboardToTop();
      void navigate({
        to: '.',
        search: prev => ({ ...prev, sort: nextSort }),
      });
    },
    [navigate],
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
    stage,
    columnCount,
    setColumnCount,
    effectiveColumnCount,
    viewport,
    columnSelectOptions,
    showColumnSelect: !isMobile,
    linkedIdeasExpanded,
    expandAllLinkedIdeas,
    collapseAllLinkedIdeas,
  };
}

export function useProblemsDashboardQuery(
  stage: ProblemStage | undefined,
  sort: ProblemDashboardSort,
) {
  const selectCards = useCallback(
    (data: InfiniteData<ProblemsFeedResponse>) =>
      selectProblemsDashboardCards(data),
    [],
  );

  const {
    data: problems = [],
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
    queryKey: ['problems', 'infinite', { stage, sort }],
    queryFn: ({ pageParam }) =>
      fetchProblems({
        stage,
        sort,
        limit: PROBLEMS_PAGE_SIZE,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      return lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined;
    },
    select: selectCards,
  });

  return {
    problems,
    isLoading,
    isError,
    error,
    refetch,
    onLoadMore: fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
