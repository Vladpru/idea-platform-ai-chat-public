import type { IdeasDashboardTab } from '@/features/ideas/api/ideas-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { DashboardCardStandard } from '@/features/ideas-dashboard/ui/DashboardCardStandard';
import { IDEAS_DASHBOARD_LABELS } from '@/features/ideas-dashboard/lib/ideas-dashboard-labels';
import { useDeleteIdeaMutation } from '@/features/ideas/hooks/use-idea-mutations';

import { useMyIdeasDashboard } from '../hooks/use-my-ideas-dashboard';

import type { TabDefinition } from '@/shared/ui/TabLabelWithBadge';
import { IdeaCardActions } from './IdeaCardActions';
import { ProfileDashboardView } from './ProfileDashboardView';
import { useMemo } from 'react';

export function ProfileIdeasView() {
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
  } = useMyIdeasDashboard();

  const deleteMutation = useDeleteIdeaMutation();

  const tabs = useMemo<TabDefinition<IdeasDashboardTab>[]>(
    () => [
      { id: 'published', label: 'My Ideas', count: totals?.published },
      { id: 'joined', label: 'Joined', count: totals?.joined },
      { id: 'drafts', label: 'Drafts', count: totals?.drafts },
    ],
    [totals],
  );

  type IdeaCard = (typeof items)[number];

  return (
    <ProfileDashboardView<IdeasDashboardTab, IdeaCard>
      title="My Ideas"
      tabs={tabs}
      data={{
        tab,
        setTab,
        items,
        totals,
        isLoading,
        isError,
        error,
        refetch,
        hasNextPage: hasNextPage ?? false,
        isFetchingNextPage,
        fetchNextPage,
      }}
      emptyLabel={IDEAS_DASHBOARD_LABELS.emptyGridMessage}
      renderErrorMessage={err =>
        getApiErrorMessage(err, {
          invalidCredentialsMessage: IDEAS_DASHBOARD_LABELS.loadErrorFallback,
        })
      }
      loadingMoreLabel={IDEAS_DASHBOARD_LABELS.loadingMore}
      layoutId="profile-ideas-dashboard-tabs-underline"
      tabsMobileMode="row"
      deleteMutation={deleteMutation}
      renderSkeletonCard={i => (
        <div
          key={i}
          className="border-brand-gray-200 h-64 animate-pulse rounded-lg border bg-white"
        />
      )}
      renderCard={({ item: card, isMobile, isDeleting, onDelete }) => (
        <DashboardCardStandard
          key={card.id}
          card={card}
          detailHref={ROUTES.ideaDetail(card.id)}
          layout="horizontal"
          emptyDescriptionText={IDEAS_DASHBOARD_LABELS.emptyDescription}
          emptyImageText={IDEAS_DASHBOARD_LABELS.emptyImage}
          linkedSectionLabel={IDEAS_DASHBOARD_LABELS.linkedSectionLabel}
          getLinkedItemDetailHref={ROUTES.problemDetail}
          linkedItemsScrollLeftAriaLabel={
            IDEAS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
          }
          linkedItemsExpanded={false}
          isMobile={isMobile}
          hideLinkedItems
          actionMenu={
            <IdeaCardActions
              card={card}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          }
        />
      )}
    />
  );
}
