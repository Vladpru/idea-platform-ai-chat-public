import type { ApiStage } from '@/features/ideas/model/idea.types';
import { memo, useEffect, useRef } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { Button } from '@/shared/ui/button';

import {
  useIdeasDashboardPreferences,
  useIdeasDashboardQuery,
} from '../../hooks/use-ideas-dashboard';
import { IDEAS_DASHBOARD_LABELS } from '../../lib/config/ideas-dashboard-labels';
import {
  DashboardGrid,
  DashboardGridSkeleton,
  LoadMoreFooter,
  type DashboardViewport,
} from '@/shared/dashboard';
import type {
  IdeaDashboardCard,
  IdeaDashboardSort,
} from '../../model/ideas-dashboard.types';
import { DashboardCardCompact } from '../cards/DashboardCardCompact';
import { DashboardCardStandard } from '../cards/DashboardCardStandard';
import { DashboardHeader } from '../header/DashboardHeader';

function renderIdeaCompactCard(
  card: IdeaDashboardCard,
  options: { forceShowLinkedItems: boolean; columnCount: number },
) {
  return (
    <DashboardCardCompact
      card={card}
      detailHref={ROUTES.ideaDetail(card.id)}
      emptyImageText={IDEAS_DASHBOARD_LABELS.emptyImage}
      linkedSectionLabel={IDEAS_DASHBOARD_LABELS.linkedSectionLabel}
      getLinkedItemDetailHref={ROUTES.problemDetail}
      forceShowLinkedItems={options.forceShowLinkedItems}
      columnCount={options.columnCount}
    />
  );
}

function renderIdeaStandardCard(
  card: IdeaDashboardCard,
  options: {
    layout: 'vertical' | 'horizontal';
    linkedItemsExpanded: boolean;
    onToggleLinkedItems: (cardId: string) => void;
    isMobile: boolean;
    columnCount: number;
  },
) {
  return (
    <DashboardCardStandard
      card={card}
      detailHref={ROUTES.ideaDetail(card.id)}
      emptyDescriptionText={IDEAS_DASHBOARD_LABELS.emptyDescription}
      emptyImageText={IDEAS_DASHBOARD_LABELS.emptyImage}
      linkedSectionLabel={IDEAS_DASHBOARD_LABELS.linkedSectionLabel}
      getLinkedItemDetailHref={ROUTES.problemDetail}
      linkedItemsScrollLeftAriaLabel={
        IDEAS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
      }
      layout={options.layout}
      linkedItemsExpanded={options.linkedItemsExpanded}
      onToggleLinkedItems={options.onToggleLinkedItems}
      isMobile={options.isMobile}
      columnCount={options.columnCount}
    />
  );
}

type IdeasDashboardBodyProps = {
  stage: ApiStage | undefined;
  sort: IdeaDashboardSort;
  feedOnly: boolean;
  columnCount: number;
  viewport: DashboardViewport;
  linkedProblemsExpanded: boolean;
};

const IdeasDashboardBody = memo(function IdeasDashboardBody({
  stage,
  sort,
  feedOnly,
  columnCount,
  viewport,
  linkedProblemsExpanded,
}: IdeasDashboardBodyProps) {
  const {
    ideas,
    isLoading,
    isError,
    error,
    refetch,
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useIdeasDashboardQuery(stage, sort, feedOnly);

  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  if (isLoading) {
    return (
      <DashboardGridSkeleton columnCount={columnCount} viewport={viewport} />
    );
  }

  if (isError) {
    return (
      <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
        <p className="text-brand-gray-700 mb-4 text-sm">
          {getApiErrorMessage(error, {
            invalidCredentialsMessage: IDEAS_DASHBOARD_LABELS.loadErrorFallback,
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
        items={ideas}
        columnCount={columnCount}
        viewport={viewport}
        linkedItemsExpanded={linkedProblemsExpanded}
        emptyMessage={IDEAS_DASHBOARD_LABELS.emptyGridMessage}
        onLoadMore={onLoadMore}
        hasNextPage={hasNextPage}
        isFetchingNextPageRef={isFetchingNextPageRef}
        renderCompactCard={renderIdeaCompactCard}
        renderStandardCard={(card, options) =>
          renderIdeaStandardCard(card, {
            ...options,
            isMobile: viewport === 'mobile',
          })
        }
      />
      <LoadMoreFooter
        isFetchingNextPage={isFetchingNextPage}
        loadingMessage={IDEAS_DASHBOARD_LABELS.loadingMore}
      />
    </>
  );
});

export function IdeasDashboardPage() {
  const {
    activeFilter,
    setActiveFilter,
    sort,
    setSort,
    feedOnly,
    setFeedOnly,
    stage,
    columnCount,
    setColumnCount,
    viewport,
    columnSelectOptions,
    showColumnSelect,
    linkedProblemsExpanded,
    expandAllLinkedProblems,
    collapseAllLinkedProblems,
  } = useIdeasDashboardPreferences();

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <DashboardHeader
          activeFilter={activeFilter}
          linkedProblemsExpanded={linkedProblemsExpanded}
          onFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          columnCount={columnCount}
          onColumnCountChange={setColumnCount}
          columnSelectOptions={columnSelectOptions}
          showColumnSelect={showColumnSelect}
          onExpandAll={expandAllLinkedProblems}
          onCollapseAll={collapseAllLinkedProblems}
          feedOnly={feedOnly}
          onFeedOnlyChange={setFeedOnly}
        />

        <div className="pb-8">
          <IdeasDashboardBody
            stage={stage as ApiStage | undefined}
            sort={sort}
            feedOnly={feedOnly}
            columnCount={columnCount}
            viewport={viewport}
            linkedProblemsExpanded={linkedProblemsExpanded}
          />
        </div>
      </div>
    </main>
  );
}
