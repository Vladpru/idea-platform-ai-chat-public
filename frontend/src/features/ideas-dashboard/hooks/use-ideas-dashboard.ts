import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import type { ApiStage } from '@/features/ideas/model/idea.types';
import { fetchIdeas } from '@/features/ideas/api/ideas.api';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';

import {
  API_STAGE_TO_FILTER,
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
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function useIdeasDashboardPreferences() {
  const search = useSearch({ from: '/_auth/ideas/' });
  const navigate = useNavigate();

  const sort: IdeaDashboardSort = search.sort ?? 'newest';
  const stage: ApiStage | undefined = search.stage as ApiStage | undefined;

  const activeFilter: IdeaDashboardFilter = stage
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
    (nextSort: IdeaDashboardSort) => {
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
    linkedProblemsExpanded,
    expandAllLinkedProblems,
    collapseAllLinkedProblems,
  };
}

export function useIdeasDashboardQuery(
  stage: ApiStage | undefined,
  sort: IdeaDashboardSort,
) {
  const selectCards = useCallback(
    (data: InfiniteData<IdeasFeedResponse>) => selectIdeasDashboardCards(data),
    [],
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
    queryKey: ['ideas', 'infinite', { stage, sort }],
    queryFn: ({ pageParam }) =>
      fetchIdeas({
        stage,
        sort,
        limit: IDEAS_PAGE_SIZE,
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
  const query = useIdeasDashboardQuery(preferences.stage, preferences.sort);

  return {
    ...preferences,
    ...query,
  };
}
