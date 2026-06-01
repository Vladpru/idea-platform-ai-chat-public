import { DashboardCardStandard } from '@/features/ideas-dashboard';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { SearchIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { ROUTES } from '@/shared/config/paths';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui/input';
import { AnimatedTabUnderline } from '@/shared/ui/motion';
import { SkeletonCard } from '@/shared/ui/skeleton';

import type { GlobalSearchResultItem, SearchTab } from '../api/search.types';
import { useGlobalSearch } from '../hooks/use-global-search';
import { mapSearchItemToDashboardCard } from '../lib/map-search-item-to-card';

interface SearchShape {
  q?: string;
  t?: SearchTab;
}

function getDetailHref(item: GlobalSearchResultItem): string {
  return item.entityType === 'IDEA'
    ? ROUTES.ideaDetail(item.id)
    : ROUTES.problemDetail(item.id);
}

function getLinkedItemDetailHref(id: string): string {
  return ROUTES.problemDetail(id);
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} className="h-[260px]" />
      ))}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wide uppercase transition-colors',
        active
          ? 'text-brand-black'
          : 'text-brand-gray-400 hover:text-brand-gray-600',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex min-w-[24px] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold',
          'text-brand-black bg-white',
        )}
      >
        {count}
      </span>
      {active && (
        <AnimatedTabUnderline
          layoutId="global-search-tabs"
          className="bg-brand-orange absolute bottom-0 left-0 h-[3px] w-full rounded-t"
        />
      )}
    </button>
  );
}

export function GlobalSearchPage() {
  const searchParams = useSearch({ strict: false }) as SearchShape;
  const q = searchParams.q || '';
  const activeTab: SearchTab =
    searchParams.t === 'problems' ? 'problems' : 'ideas';
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [localQuery, setLocalQuery] = useState(q);
  const [lastSyncedQ, setLastSyncedQ] = useState(q);

  if (q !== lastSyncedQ) {
    setLastSyncedQ(q);
    if (localQuery !== q) {
      setLocalQuery(q);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== q) {
        navigate({
          to: '.',
          search: { q: localQuery, t: activeTab },
          replace: true,
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery, q, activeTab, navigate]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGlobalSearch(q, activeTab);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const trimmedQuery = q.trim();
  const isQueryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 3;
  const showLoading = isLoading && trimmedQuery.length >= 3;

  const firstPage = data?.pages[0];
  const ideasTotal = firstPage?.data.ideas.total ?? 0;
  const problemsTotal = firstPage?.data.problems.total ?? 0;
  const hasAnyResults = ideasTotal > 0 || problemsTotal > 0;
  const showEmpty = data && !hasAnyResults && trimmedQuery.length >= 3;

  const allItems =
    data?.pages.flatMap(page => page.data[activeTab].items) ?? [];

  const activeTotal = activeTab === 'ideas' ? ideasTotal : problemsTotal;
  const showTabEmpty = data && hasAnyResults && activeTotal === 0;

  const handleToggleLinkedItems = useCallback(() => {}, []);

  const updateTab = (newTab: SearchTab) => {
    navigate({
      to: '.',
      search: { q, t: newTab },
      replace: true,
    });
  };

  const clearSearch = () => {
    setLocalQuery('');
    navigate({
      to: '.',
      search: { q: '', t: activeTab },
      replace: true,
    });
  };

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
        <div className="mb-6 sm:mb-8">
          <div className="mx-auto flex w-full flex-row items-center gap-2 sm:w-[48%]">
            <div className="relative flex-1">
              <SearchIcon className="text-brand-gray-400 absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                value={localQuery}
                onChange={e => setLocalQuery(e.target.value)}
                placeholder="Search ideas or problems..."
                className="border-brand-gray-200 focus:border-brand-dark-blue focus:ring-brand-dark-blue h-12 w-full rounded-lg bg-white pr-4 pl-12 text-base shadow-sm ring-0 focus:ring-1 sm:h-14 sm:rounded-sm"
                autoFocus={!isMobile}
              />
              {isFetching && !isFetchingNextPage && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                  <div className="border-brand-dark-blue size-5 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-brand-gray-400 hover:text-brand-black h-12 w-12 shrink-0 sm:h-14 sm:w-14"
              onClick={clearSearch}
            >
              <XIcon className="size-5 sm:size-6" />
            </Button>
          </div>
          {isQueryTooShort && (
            <p className="text-brand-gray-500 mt-2 text-center text-xs sm:text-sm">
              Type at least 3 characters to search
            </p>
          )}
        </div>

        {showLoading && <SearchSkeleton />}

        {showEmpty && (
          <div className="px-4 py-12 text-center sm:px-6 sm:py-16">
            <p className="text-brand-gray-600 text-sm">
              No matches found for &ldquo;{trimmedQuery}&rdquo;
            </p>
          </div>
        )}

        {data && hasAnyResults && (
          <>
            <div className="border-brand-gray-200 curs mb-6 flex gap-1 border-b">
              <TabButton
                active={activeTab === 'ideas'}
                label="IDEAS"
                count={ideasTotal}
                onClick={() => updateTab('ideas')}
              />
              <TabButton
                active={activeTab === 'problems'}
                label="UPDATE"
                count={problemsTotal}
                onClick={() => updateTab('problems')}
              />
            </div>

            {showTabEmpty && (
              <div className="border-brand-gray-200 rounded-lg border bg-white px-4 py-12 text-center sm:px-6 sm:py-16">
                <p className="text-brand-gray-600 text-sm">
                  No {activeTab} found for &ldquo;{trimmedQuery}&rdquo;
                </p>
              </div>
            )}

            {allItems.length > 0 && (
              <div className="space-y-4">
                {allItems.map(item => (
                  <DashboardCardStandard
                    key={item.id}
                    card={mapSearchItemToDashboardCard(item)}
                    detailHref={getDetailHref(item)}
                    emptyDescriptionText="No description available"
                    emptyImageText="No image"
                    linkedSectionLabel="Linked items"
                    getLinkedItemDetailHref={getLinkedItemDetailHref}
                    linkedItemsScrollLeftAriaLabel="Scroll linked items"
                    layout="horizontal"
                    linkedItemsExpanded={false}
                    onToggleLinkedItems={handleToggleLinkedItems}
                    isMobile={isMobile}
                  />
                ))}

                <div ref={loadMoreRef} className="h-10">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-4">
                      <div className="border-brand-dark-blue size-6 animate-spin rounded-full border-2 border-t-transparent" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
