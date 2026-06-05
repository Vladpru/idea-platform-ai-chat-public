import { useMemo, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { TabList, type TabDefinition } from '@/shared/ui/TabLabelWithBadge';
import { LoadMoreFooter } from '@/features/ideas-dashboard';

const SKELETON_CARD_COUNT = 4;

type DeleteMutation<TId extends string> = UseMutationResult<void, unknown, TId>;

export type ProfileDashboardViewData<TTab extends string, TItem> = {
  tab: TTab;
  setTab: (tab: TTab) => void;
  items: TItem[];
  totals?: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
};

type ProfileDashboardViewProps<
  TTab extends string,
  TItem extends { id: string },
> = {
  title: string;
  tabs: TabDefinition<TTab>[];
  data: ProfileDashboardViewData<TTab, TItem>;
  emptyState: React.ReactNode;
  renderErrorMessage: (error: unknown) => string;
  loadingMoreLabel: string;
  layoutId: string;
  tabsMobileMode?: 'drawer' | 'row';
  deleteMutation: DeleteMutation<string>;
  renderCard: (args: {
    item: TItem;
    isMobile: boolean;
    isDeleting: boolean;
    onDelete: (id: string) => void;
  }) => React.ReactNode;
  renderSkeletonCard: (key: number) => React.ReactNode;
};

export function ProfileDashboardView<
  TTab extends string,
  TItem extends { id: string },
>({
  title,
  tabs,
  data,
  emptyState,
  renderErrorMessage,
  loadingMoreLabel,
  layoutId,
  tabsMobileMode,
  deleteMutation,
  renderCard,
  renderSkeletonCard,
}: ProfileDashboardViewProps<TTab, TItem>) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    tab,
    setTab,
    items,
    totals,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = data;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteOpen = deleteId !== null;

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
      onError: () => setDeleteId(null),
    });
  };

  const handleLoadMore = () => {
    void fetchNextPage();
  };

  const resolvedTabs = useMemo(
    () => tabs.map(t => ({ ...t, count: t.count ?? totals?.[t.id] })),
    [tabs, totals],
  );

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-12">
        <ConfirmModal
          open={deleteOpen}
          onOpenChange={open => {
            if (!open) setDeleteId(null);
          }}
          title="Do you really want to delete this draft?"
          description="This draft will be permanently deleted."
          confirmLabel="Yes, delete"
          cancelLabel="No"
          onConfirm={confirmDelete}
          isPending={deleteMutation.isPending}
          confirmClassName="bg-brand-orange text-white hover:bg-brand-orange/90 border-brand-orange"
          reverseButtons
        />

        <div className="bg-brand-neutral sticky top-0 z-30 pt-6 pb-4 sm:pt-8 sm:pb-6">
          <h1 className="text-brand-black mb-5 text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            {title}
          </h1>

          <TabList
            tabs={resolvedTabs}
            activeTab={tab}
            onTabChange={setTab}
            layoutId={layoutId}
            mobileMode={tabsMobileMode}
          />
        </div>

        <div className="pb-8" role="tabpanel" aria-label={tab}>
          {isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) =>
                renderSkeletonCard(i),
              )}
            </div>
          )}

          {isError && (
            <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
              <p className="text-brand-gray-700 mb-4 text-sm">
                {renderErrorMessage(error)}
              </p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-16 text-center">
              {emptyState}
            </div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {items.map(item =>
                renderCard({
                  item,
                  isMobile,
                  isDeleting:
                    deleteMutation.isPending &&
                    deleteMutation.variables === item.id,
                  onDelete: handleDelete,
                }),
              )}
            </div>
          )}

          <LoadMoreFooter
            isFetchingNextPage={isFetchingNextPage}
            loadingMessage={loadingMoreLabel}
          />

          {hasNextPage && !isFetchingNextPage && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={handleLoadMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
