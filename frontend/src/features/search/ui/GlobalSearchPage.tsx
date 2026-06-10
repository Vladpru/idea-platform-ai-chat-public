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
import { SearchSchema } from '../model/search.schema';

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

function buildSimilarSearches(query: string, activeTab: SearchTab): string[] {
  const normalized = query.replace(/[^\p{L}\p{N}\s]+/gu, ' ').trim();
  const words = normalized.split(/\s+/).filter(word => word.length >= 3);
  const first = words[0];
  const firstTwo = words.slice(0, 2).join(' ');
  const withoutDigits = normalized.replace(/\d+/g, '').trim();
  const singular =
    words.length === 1 && words[0].endsWith('s') ? words[0].slice(0, -1) : '';
  const tabDefaults =
    activeTab === 'ideas'
      ? ['automation', 'mobile app', 'ai assistant']
      : ['workflow issue', 'performance bottleneck', 'team communication'];

  return [first, firstTwo, withoutDigits, singular, ...tabDefaults].filter(
    (value, index, arr): value is string => {
      if (!value) return false;
      if (value.toLowerCase() === query.toLowerCase()) return false;
      return (
        arr.findIndex(item => item.toLowerCase() === value.toLowerCase()) ===
        index
      );
    },
  );
}

function EmptyState({
  query,
  activeTab,
  onSuggestionClick,
  message,
}: {
  query: string;
  activeTab: SearchTab;
  onSuggestionClick: (nextQuery: string) => void;
  message: string;
}) {
  const suggestions = buildSimilarSearches(query, activeTab).slice(0, 5);

  return (
    <div className="rounded-lg border px-4 py-10 text-center sm:px-6 sm:py-12">
      <p className="text-brand-gray-700 text-base">{message}</p>
      {suggestions.length > 0 ? (
        <div className="mt-4">
          <p className="text-brand-gray-500 text-xs font-medium tracking-wide uppercase">
            Similar searches
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="border-brand-gray-300 text-brand-dark-blue hover:bg-brand-light-blue/20 rounded-full border px-4 py-2 text-xs font-medium transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
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
          'text-brand-black bg-card',
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
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);

    const result = SearchSchema.safeParse({ q: value });
    if (!result.success) {
      setError(result.error.issues[0].message);
    } else {
      setError(null);
    }
  };

  if (q !== lastSyncedQ) {
    setLastSyncedQ(q);
    if (localQuery !== q) {
      setLocalQuery(q);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== q && !error) {
        navigate({
          to: '.',
          search: { q: localQuery, t: activeTab },
          replace: true,
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery, q, activeTab, navigate, error]);

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

  const applySuggestion = (nextQuery: string) => {
    setLocalQuery(nextQuery);
    navigate({
      to: '.',
      search: { q: nextQuery, t: activeTab },
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

  const dismissSearch = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({
      to: ROUTES.home,
    });
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismissSearch();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dismissSearch]);

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
        <div className="mb-6 sm:mb-8">
          <div className="mx-auto flex w-full flex-row items-center gap-2 sm:w-[48%]">
            <div className="relative flex-1">
              <SearchIcon className="text-brand-gray-400 absolute top-1/2 left-4 size-5 -translate-y-1/2" />
              <Input
                value={localQuery}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="Search ideas or problems..."
                aria-invalid={!!error}
                aria-describedby={error ? 'search-error' : undefined}
                className={cn(
                  'bg-card h-12 w-full rounded-lg pr-4 pl-12 text-base shadow-sm ring-0 transition-all sm:h-14 sm:rounded-sm',
                  'border-brand-gray-200 focus:ring-1',

                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-brand-gray-200 focus:border-brand-dark-blue focus:ring-brand-dark-blue',
                )}
                autoFocus={!isMobile}
              />

              {error && (
                <p
                  id="search-error"
                  className="absolute -bottom-6 left-0 text-xs text-red-500"
                >
                  {error}
                </p>
              )}
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
          <EmptyState
            query={trimmedQuery}
            activeTab={activeTab}
            onSuggestionClick={applySuggestion}
            message={`No matches found for "${trimmedQuery}"`}
          />
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
                label="PROBLEMS"
                count={problemsTotal}
                onClick={() => updateTab('problems')}
              />
            </div>

            {showTabEmpty && (
              <EmptyState
                query={trimmedQuery}
                activeTab={activeTab}
                onSuggestionClick={applySuggestion}
                message={`No ${activeTab} found for "${trimmedQuery}"`}
              />
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
                    entityType={
                      item.entityType === 'IDEA' ? 'IDEA' : 'PROBLEM'
                    }
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
