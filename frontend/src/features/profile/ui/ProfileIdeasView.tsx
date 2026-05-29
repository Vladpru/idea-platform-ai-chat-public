import type { IdeasDashboardTab } from '@/features/ideas/api/ideas-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import {
  DashboardCardStandard,
  IDEAS_DASHBOARD_LABELS,
} from '@/features/ideas-dashboard';
import { useDeleteIdeaMutation } from '@/features/ideas/hooks/use-idea-mutations';
import type { TabDefinition } from '@/shared/ui/TabLabelWithBadge';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useMyIdeasDashboard } from '../hooks/use-my-ideas-dashboard';
import { IdeaCardActions } from './IdeaCardActions';
import { ProfileDashboardView } from './ProfileDashboardView';

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

  const getEmptyStateContent = () => {
    switch (tab) {
      case 'drafts':
        return {
          ...IDEAS_DASHBOARD_LABELS.emptyStates.drafts,
          href: ROUTES.ideasNew,
        };
      case 'joined':
        return {
          ...IDEAS_DASHBOARD_LABELS.emptyStates.joined,
          href: ROUTES.ideas,
        };
      case 'published':
      default:
        return {
          ...IDEAS_DASHBOARD_LABELS.emptyStates.published,
          href: ROUTES.ideasNew,
        };
    }
  };

  const emptyContent = getEmptyStateContent();

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
      emptyState={
        <div className="flex flex-col items-center justify-center py-8">
          <h3 className="text-brand-black mb-2 text-lg font-bold">
            {emptyContent.title}
          </h3>
          <p className="text-brand-gray-700 mb-6 text-sm">
            {emptyContent.description}
          </p>
          <Link to={emptyContent.href}>
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {emptyContent.buttonText}
            </Button>
          </Link>
        </div>
      }
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
