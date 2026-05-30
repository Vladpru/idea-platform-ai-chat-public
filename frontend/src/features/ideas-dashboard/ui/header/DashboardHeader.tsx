import { memo } from 'react';
import { cn } from '@/shared/lib/utils';

import {
  IDEA_DASHBOARD_FILTERS,
  IDEA_DASHBOARD_SORT_OPTIONS,
} from '../../lib/config/constants';
import { IDEAS_DASHBOARD_LABELS } from '../../lib/config/ideas-dashboard-labels';
import type {
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from '../../model/ideas-dashboard.types';

import { DashboardControls } from './DashboardControls';
import { DashboardFilter } from './DashboardFilter';

export type DashboardHeaderProps = {
  activeFilter: IdeaDashboardFilter;
  onFilterChange: (filter: IdeaDashboardFilter) => void;
  sort: IdeaDashboardSort;
  onSortChange: (sort: IdeaDashboardSort) => void;
  columnCount: number;
  onColumnCountChange: (count: number) => void;
  columnSelectOptions: number[];
  showColumnSelect: boolean;
  linkedProblemsExpanded: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

function DashboardHeaderInner({
  activeFilter,
  onFilterChange,
  sort,
  onSortChange,
  columnCount,
  onColumnCountChange,
  columnSelectOptions,
  showColumnSelect,
  linkedProblemsExpanded,
  onExpandAll,
  onCollapseAll,
}: DashboardHeaderProps) {
  const controlsProps = {
    sort,
    onSortChange,
    sortOptions: IDEA_DASHBOARD_SORT_OPTIONS,
    sortLabel: IDEAS_DASHBOARD_LABELS.sortLabel,
    sortSelectId: IDEAS_DASHBOARD_LABELS.sortSelectId,
    columnCount,
    onColumnCountChange,
    columnOptions: columnSelectOptions,
    columnsLabel: IDEAS_DASHBOARD_LABELS.columnsLabel,
    columnsSelectId: IDEAS_DASHBOARD_LABELS.columnsSelectId,
    showColumnSelect,
    linkedProblemsExpanded,
    expandAllLabel: IDEAS_DASHBOARD_LABELS.expandAll,
    collapseAllLabel: IDEAS_DASHBOARD_LABELS.collapseAll,
    onExpandAll,
    onCollapseAll,
  };

  return (
    <div className="bg-brand-neutral sticky top-0 z-30 pt-6 pb-6 sm:pt-8 sm:pb-8">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-5 sm:flex sm:flex-col sm:items-stretch sm:gap-6">
        <div className="col-start-1 row-start-1 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-brand-black text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            {IDEAS_DASHBOARD_LABELS.pageTitle}
          </h1>
        </div>

        <div className="col-start-1 row-start-2 min-w-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <DashboardFilter
            filters={IDEA_DASHBOARD_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            ariaLabel={IDEAS_DASHBOARD_LABELS.filterAriaLabel}
            layoutId={IDEAS_DASHBOARD_LABELS.filterLayoutId}
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

function areDashboardHeaderPropsEqual(
  prev: DashboardHeaderProps,
  next: DashboardHeaderProps,
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
    prev.linkedProblemsExpanded === next.linkedProblemsExpanded &&
    prev.onExpandAll === next.onExpandAll &&
    prev.onCollapseAll === next.onCollapseAll
  );
}

export const DashboardHeader = memo(
  DashboardHeaderInner,
  areDashboardHeaderPropsEqual,
);
