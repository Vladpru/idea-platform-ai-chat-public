import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { COMPACT_CARD_COLUMN_THRESHOLD } from '@/shared/dashboard/lib/config/constants';
import { cn } from '@/shared/lib/utils';

import { DashboardFeedToggle } from './DashboardFeedToggle';

type DashboardControlsProps<TSort extends string> = {
  sort: TSort;
  onSortChange: (sort: TSort) => void;
  sortOptions: { label: string; value: TSort }[];
  sortLabel: string;
  sortSelectId: string;
  showColumnSelect?: boolean;
  columnCount?: number;
  onColumnCountChange?: (count: number) => void;
  columnOptions?: number[];
  columnsLabel?: string;
  columnsSelectId?: string;
  linkedProblemsExpanded?: boolean;
  expandAllLabel?: string;
  collapseAllLabel?: string;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  feedOnly?: boolean;
  onFeedOnlyChange?: (feedOnly: boolean) => void;
  className?: string;
};

export function DashboardControls<TSort extends string>({
  sort,
  onSortChange,
  sortOptions,
  showColumnSelect = false,
  columnCount,
  onColumnCountChange,
  columnOptions = [],
  linkedProblemsExpanded = false,
  expandAllLabel = '',
  collapseAllLabel = '',
  onExpandAll,
  onCollapseAll,
  feedOnly,
  onFeedOnlyChange,
  className,
}: DashboardControlsProps<TSort>) {
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const [isMobileSortModalOpen, setIsMobileSortModalOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);

  useEffect(() => {
    if (isMobileSortModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSortModalOpen]);

  const activeSort = sortOptions.find(o => o.value === sort);
  const otherSortOptions = sortOptions.filter(o => o.value !== sort);
  const orderedSortOptions = activeSort
    ? [activeSort, ...otherSortOptions]
    : sortOptions;

  const showLinkedItemsToggle =
    columnCount !== undefined && columnCount < COMPACT_CARD_COLUMN_THRESHOLD;

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {onFeedOnlyChange && feedOnly !== undefined && (
        <DashboardFeedToggle
          feedOnly={feedOnly}
          onFeedOnlyChange={onFeedOnlyChange}
        />
      )}

      {showLinkedItemsToggle && (
        <div className="flex items-center gap-4 text-[10px] xl:text-xs">
          <button
            type="button"
            onClick={onExpandAll}
            className={cn(
              'cursor-pointer font-bold tracking-wide uppercase transition-colors',
              linkedProblemsExpanded
                ? 'text-brand-dark-blue'
                : 'text-brand-gray-500 hover:text-brand-dark-blue',
            )}
          >
            {expandAllLabel}
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className={cn(
              'cursor-pointer font-bold tracking-wide uppercase transition-colors',
              !linkedProblemsExpanded
                ? 'text-brand-dark-blue'
                : 'text-brand-gray-500 hover:text-brand-dark-blue',
            )}
          >
            {collapseAllLabel}
          </button>
        </div>
      )}

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSortModalOpen(true)}
          className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[140px] cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-80"
        >
          <span className="truncate">{activeSort?.label}</span>
          <ChevronDown className="text-brand-gray-400 size-4 shrink-0" />
        </button>
      </div>

      {isMobileSortModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsMobileSortModalOpen(false)}
            aria-hidden="true"
          />

          <div className="animate-in slide-in-from-bottom-full bg-card relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-lg shadow-xl duration-300">
            <div className="border-brand-gray-200 flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-brand-dark-blue text-xl font-bold">
                Sorting
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileSortModalOpen(false)}
                className="text-brand-dark-blue cursor-pointer rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <ul className="flex flex-col gap-1 pb-6">
                {orderedSortOptions.map((option, index) => {
                  const isActive = option.value === sort;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          onSortChange(option.value);
                          setIsMobileSortModalOpen(false);
                        }}
                        className={cn(
                          'w-full cursor-pointer rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors',
                          isActive
                            ? 'text-brand-dark-blue bg-brand-gray-100 font-bold'
                            : 'text-brand-black hover:bg-brand-cool-gray-3',
                        )}
                      >
                        {option.label}
                      </button>
                      {index === 0 && (
                        <div className="px-4 py-1">
                          <div className="bg-brand-gray-100 h-px w-full" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-card pt-1 pb-2">
              <div className="bg-brand-black mx-auto h-1.5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      )}

      <div className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
          className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[100px] cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 lg:min-w-[90px] xl:min-w-[130px] xl:px-3 xl:py-2 xl:text-sm"
        >
          <span className="truncate">{activeSort?.label}</span>
          <ChevronDown
            className={cn(
              'text-brand-gray-400 size-4 shrink-0 transition-transform',
              isDesktopSortOpen && 'rotate-180',
            )}
          />
        </button>

        {isDesktopSortOpen && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-pointer"
              onClick={() => setIsDesktopSortOpen(false)}
              aria-hidden="true"
            />
            <div className="bg-card absolute top-full right-0 z-50 mt-1 min-w-[180px] rounded-md py-2 shadow-lg ring-1 ring-black/5">
              <ul className="flex flex-col">
                {orderedSortOptions.map((option, index) => {
                  const isActive = option.value === sort;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          onSortChange(option.value);
                          setIsDesktopSortOpen(false);
                        }}
                        className={cn(
                          'w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors',
                          isActive
                            ? 'text-brand-dark-blue font-bold'
                            : 'text-brand-black hover:text-brand-dark-blue hover:bg-brand-cool-gray-3',
                        )}
                      >
                        {option.label}
                      </button>
                      {index === 0 && (
                        <div className="px-4 py-1">
                          <div className="bg-brand-gray-100 h-px w-full" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>

      {showColumnSelect && columnCount !== undefined && onColumnCountChange && (
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setIsColumnsOpen(!isColumnsOpen)}
            className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[90px] cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 xl:min-w-[110px] xl:px-3 xl:py-2 xl:text-sm"
          >
            <span>Columns {columnCount}</span>
            <ChevronDown
              className={cn(
                'text-brand-gray-400 size-4 shrink-0 transition-transform',
                isColumnsOpen && 'rotate-180',
              )}
            />
          </button>

          {isColumnsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsColumnsOpen(false)}
                aria-hidden="true"
              />
              <div className="bg-card absolute top-full right-0 z-50 mt-1 min-w-[110px] rounded-md py-2 shadow-lg ring-1 ring-black/5">
                <ul className="flex flex-col">
                  {columnOptions.map(count => (
                    <li key={count}>
                      <button
                        type="button"
                        onClick={() => {
                          onColumnCountChange(count);
                          setIsColumnsOpen(false);
                        }}
                        className={cn(
                          'hover:text-brand-dark-blue hover:bg-brand-cool-gray-3 w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors',
                          count === columnCount
                            ? 'text-brand-dark-blue font-medium'
                            : 'text-brand-black',
                        )}
                      >
                        {count}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
