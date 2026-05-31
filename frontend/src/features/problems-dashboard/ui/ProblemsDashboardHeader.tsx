import {
  DashboardControls,
  DashboardFilter,
} from '@/shared/dashboard';
import type {
  ProblemDashboardFilter,
  ProblemDashboardSort,
} from '../model/problems-dashboard.types';
import { memo } from 'react';

import { cn } from '@/shared/lib/utils';

import {
  PROBLEM_DASHBOARD_FILTERS,
  PROBLEM_DASHBOARD_SORT_OPTIONS,
} from '../lib/constants';
import { PROBLEMS_DASHBOARD_LABELS } from '../lib/problems-dashboard-labels';

export type ProblemsDashboardHeaderProps = {
  activeFilter: ProblemDashboardFilter;
  onFilterChange: (filter: ProblemDashboardFilter) => void;
  sort: ProblemDashboardSort;
  onSortChange: (sort: ProblemDashboardSort) => void;
  columnCount: number;
  onColumnCountChange: (count: number) => void;
  columnSelectOptions: number[];
  showColumnSelect: boolean;
  linkedIdeasExpanded: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

function ProblemsDashboardHeaderInner({
  activeFilter,
  onFilterChange,
  sort,
  onSortChange,
  columnCount,
  onColumnCountChange,
  columnSelectOptions,
  showColumnSelect,
  linkedIdeasExpanded,
  onExpandAll,
  onCollapseAll,
}: ProblemsDashboardHeaderProps) {
  const controlsProps = {
    sort,
    onSortChange,
    sortOptions: PROBLEM_DASHBOARD_SORT_OPTIONS,
    sortLabel: PROBLEMS_DASHBOARD_LABELS.sortLabel,
    sortSelectId: PROBLEMS_DASHBOARD_LABELS.sortSelectId,
    columnCount,
    onColumnCountChange,
    columnOptions: columnSelectOptions,
    columnsLabel: PROBLEMS_DASHBOARD_LABELS.columnsLabel,
    columnsSelectId: PROBLEMS_DASHBOARD_LABELS.columnsSelectId,
    showColumnSelect,
    linkedProblemsExpanded: linkedIdeasExpanded,
    expandAllLabel: PROBLEMS_DASHBOARD_LABELS.expandAll,
    collapseAllLabel: PROBLEMS_DASHBOARD_LABELS.collapseAll,
    onExpandAll,
    onCollapseAll,
  };

  return (
    <div className="bg-brand-neutral sticky top-0 z-30 pt-6 pb-6 sm:pt-8 sm:pb-8">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-5 sm:flex sm:flex-col sm:items-stretch sm:gap-6">
        <div className="col-start-1 row-start-1 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-brand-black text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            {PROBLEMS_DASHBOARD_LABELS.pageTitle}
          </h1>
        </div>

        <div className="col-start-1 row-start-2 min-w-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <DashboardFilter
            filters={PROBLEM_DASHBOARD_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            ariaLabel={PROBLEMS_DASHBOARD_LABELS.filterAriaLabel}
            layoutId={PROBLEMS_DASHBOARD_LABELS.filterLayoutId}
          />

          <div className="hidden sm:block">
            <DashboardControls {...controlsProps} />
          </div>
        </div>

        <DashboardControls
          {...controlsProps}
          className={cn(
            'contents sm:hidden',
            '[&>*:first-child]:col-start-2 [&>*:first-child]:row-start-2 [&>*:first-child]:justify-self-end',
            '[&>*:last-child]:col-start-2 [&>*:last-child]:row-start-1 [&>*:last-child]:justify-self-end',
          )}
        />
      </div>
    </div>
  );
}

function areProblemsDashboardHeaderPropsEqual(
  prev: ProblemsDashboardHeaderProps,
  next: ProblemsDashboardHeaderProps,
): boolean {
  return (
    prev.activeFilter === next.activeFilter &&
    prev.onFilterChange === next.onFilterChange &&
    prev.sort === next.sort &&
    prev.onSortChange === next.onSortChange &&
    prev.columnCount === next.columnCount &&
    prev.onColumnCountChange === next.onColumnCountChange &&
    prev.columnSelectOptions === next.columnSelectOptions &&
    prev.showColumnSelect === next.showColumnSelect &&
    prev.linkedIdeasExpanded === next.linkedIdeasExpanded &&
    prev.onExpandAll === next.onExpandAll &&
    prev.onCollapseAll === next.onCollapseAll
  );
}

export const ProblemsDashboardHeader = memo(
  ProblemsDashboardHeaderInner,
  areProblemsDashboardHeaderPropsEqual,
);
