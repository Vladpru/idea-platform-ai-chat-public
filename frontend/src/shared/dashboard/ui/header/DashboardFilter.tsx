import { cn } from '@/shared/lib/utils';
import { AnimatedTabUnderline } from '@/shared/ui';
import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DashboardFilterTab } from '@/shared/dashboard/model/dashboard.types';

type DashboardFilterProps<TFilter extends string> = {
  filters: DashboardFilterTab<TFilter>[];
  activeFilter: TFilter;
  onFilterChange: (filter: TFilter) => void;
  ariaLabel: string;
  layoutId: string;
  className?: string;
  mobileMode?: 'drawer' | 'row';
};

export function DashboardFilter<TFilter extends string>({
  filters,
  activeFilter,
  onFilterChange,
  ariaLabel,
  layoutId,
  className,
  mobileMode = 'drawer',
}: DashboardFilterProps<TFilter>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const activeTab = filters.find(tab => tab.id === activeFilter);

  const tabsRow = (
    <nav
      className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}
      aria-label={ariaLabel}
    >
      {filters.map(tab => {
        const isActive = tab.id === activeFilter;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              'text-brand-dark-blue relative cursor-pointer pb-2 text-base font-normal tracking-wide uppercase transition-colors',
              isActive ? 'font-bold' : 'hover:text-brand-dark-blue',
            )}
          >
            {tab.label}
            {isActive ? (
              <AnimatedTabUnderline
                layoutId={layoutId}
                className="bg-brand-orange -bottom-0 h-1 rounded-full"
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  if (mobileMode === 'row') {
    return tabsRow;
  }

  return (
    <>
      <nav
        className={cn(
          'hidden flex-wrap items-center gap-x-6 gap-y-2 sm:flex',
          className,
        )}
        aria-label={ariaLabel}
      >
        {filters.map(tab => {
          const isActive = tab.id === activeFilter;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                'text-brand-dark-blue relative cursor-pointer pb-2 text-base font-normal tracking-wide uppercase transition-colors',
                isActive ? 'font-bold' : 'hover:text-brand-dark-blue',
              )}
            >
              {tab.label}
              {isActive ? (
                <AnimatedTabUnderline
                  layoutId={layoutId}
                  className="bg-brand-orange -bottom-0 h-1 rounded-full"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className={cn('sm:hidden', className)}>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="border-brand-gray-200 text-brand-dark-blue bg-card flex min-w-[120px] items-center justify-between gap-2 rounded-md border px-4 py-2 text-sm font-bold shadow-sm"
        >
          <span className="truncate">{activeTab?.label || 'All'}</span>
          <ChevronDown className="text-brand-gray-400 size-4 shrink-0" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="animate-in slide-in-from-bottom-full bg-card relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-lg shadow-xl duration-300">
            <div className="border-brand-gray-200 flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-brand-dark-blue text-xl font-bold">Stage</h2>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-brand-dark-blue rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <ul className="flex flex-col gap-1 pb-6">
                {filters.map(tab => {
                  const isActive = tab.id === activeFilter;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onFilterChange(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          'w-full rounded-xl px-4 py-3.5 text-left text-base font-normal transition-colors',
                          isActive
                            ? 'text-brand-dark-blue bg-brand-gray-100 font-bold'
                            : 'text-brand-black hover:bg-slate-50',
                        )}
                      >
                        {tab.label}
                      </button>
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
    </>
  );
}
