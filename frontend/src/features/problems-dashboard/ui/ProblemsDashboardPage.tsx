import type { ProblemStage } from '@/features/problems/api/problems-api.types';
import { memo, useEffect, useRef } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import {
  DashboardGrid,
  DashboardGridSkeleton,
  type DashboardViewport,
  LoadMoreFooter,
} from '@/shared/dashboard';
import { Button } from '@/shared/ui/button';

import {
  useProblemsDashboardPreferences,
  useProblemsDashboardQuery,
} from '../hooks/use-problems-dashboard';
import { PROBLEMS_DASHBOARD_LABELS } from '../lib/problems-dashboard-labels';
import type { ProblemDashboardSort } from '../model/problems-dashboard.types';
import type { ProblemDashboardCard } from '../model/problems-dashboard.types';
import { ProblemsDashboardHeader } from './ProblemsDashboardHeader';
import { ProblemDashboardCardCompact } from './cards/ProblemDashboardCardCompact';
import { ProblemDashboardCardStandard } from './cards/ProblemDashboardCardStandard';

function renderProblemCompactCard(
  card: ProblemDashboardCard,
  options: { forceShowLinkedItems: boolean; columnCount: number },
) {
  return (
    <ProblemDashboardCardCompact
      card={card}
      detailHref={ROUTES.problemDetail(card.id)}
      emptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
      linkedSectionLabel={PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel}
      getLinkedItemDetailHref={ROUTES.ideaDetail}
      columnCount={options.columnCount}
    />
  );
}

function renderProblemStandardCard(
  card: ProblemDashboardCard,
  options: {
    layout: 'vertical' | 'horizontal';
    linkedItemsExpanded: boolean;
    onToggleLinkedItems: (cardId: string) => void;
    isMobile: boolean;
    columnCount: number;
  },
) {
  return (
    <ProblemDashboardCardStandard
      card={card}
      detailHref={ROUTES.problemDetail(card.id)}
      emptyDescriptionText={PROBLEMS_DASHBOARD_LABELS.emptyDescription}
      emptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
      linkedSectionLabel={PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel}
      getLinkedItemDetailHref={ROUTES.ideaDetail}
      linkedItemsExpanded={options.linkedItemsExpanded}
      onToggleLinkedItems={options.onToggleLinkedItems}
      isMobile={options.isMobile}
      columnCount={options.columnCount}
      linkedItemEmptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
    />
  );
}

type ProblemsDashboardBodyProps = {
  stage: ProblemStage | undefined;
  sort: ProblemDashboardSort;
  columnCount: number;
  viewport: DashboardViewport;
  linkedIdeasExpanded: boolean;
};

const ProblemsDashboardBody = memo(function ProblemsDashboardBody({
  stage,
  sort,
  columnCount,
  viewport,
  linkedIdeasExpanded,
}: ProblemsDashboardBodyProps) {
  const {
    problems,
    isLoading,
    isError,
    error,
    refetch,
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useProblemsDashboardQuery(stage, sort);

  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  if (isLoading) {
    return (
      <DashboardGridSkeleton
        columnCount={columnCount}
        viewport={viewport}
        standardCardClassName="h-72"
      />
    );
  }

  if (isError) {
    return (
      <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
        <p className="text-brand-gray-700 mb-4 text-sm">
          {getApiErrorMessage(error, {
            invalidCredentialsMessage:
              PROBLEMS_DASHBOARD_LABELS.loadErrorFallback,
          })}
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <DashboardGrid
        items={problems}
        columnCount={columnCount}
        viewport={viewport}
        linkedItemsExpanded={linkedIdeasExpanded}
        emptyMessage={PROBLEMS_DASHBOARD_LABELS.emptyGridMessage}
        onLoadMore={onLoadMore}
        hasNextPage={hasNextPage}
        isFetchingNextPageRef={isFetchingNextPageRef}
        renderCompactCard={renderProblemCompactCard}
        renderStandardCard={(card, options) =>
          renderProblemStandardCard(card, {
            ...options,
            isMobile: viewport === 'mobile',
          })
        }
      />
      <LoadMoreFooter
        isFetchingNextPage={isFetchingNextPage}
        loadingMessage={PROBLEMS_DASHBOARD_LABELS.loadingMore}
      />
    </>
  );
});

export function ProblemsDashboardPage() {
  const {
    activeFilter,
    setActiveFilter,
    sort,
    setSort,
    stage,
    columnCount,
    setColumnCount,
    viewport,
    columnSelectOptions,
    showColumnSelect,
    linkedIdeasExpanded,
    expandAllLinkedIdeas,
    collapseAllLinkedIdeas,
  } = useProblemsDashboardPreferences();

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <ProblemsDashboardHeader
          activeFilter={activeFilter}
          linkedIdeasExpanded={linkedIdeasExpanded}
          onFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          columnCount={columnCount}
          onColumnCountChange={setColumnCount}
          columnSelectOptions={columnSelectOptions}
          showColumnSelect={showColumnSelect}
          onExpandAll={expandAllLinkedIdeas}
          onCollapseAll={collapseAllLinkedIdeas}
        />

        <div className="pb-8">
          <ProblemsDashboardBody
            stage={stage}
            sort={sort}
            columnCount={columnCount}
            viewport={viewport}
            linkedIdeasExpanded={linkedIdeasExpanded}
          />
        </div>
      </div>
    </main>
  );
}
