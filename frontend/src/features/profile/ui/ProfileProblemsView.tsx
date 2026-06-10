import type { ProblemsDashboardTab } from '@/features/problems/api/problems-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { DashboardCardStandard } from '@/features/ideas-dashboard';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import type { TabDefinition } from '@/shared/ui/TabLabelWithBadge';
import { Button } from '@/shared/ui/button';
import { SkeletonCard } from '@/shared/ui/skeleton';

import { useMyProblemsDashboard } from '../hooks/use-my-problems-dashboard';
import { ProblemCardActions } from './ProblemCardActions';
import { ProfileDashboardView } from './ProfileDashboardView';
import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';

export function ProfileProblemsView() {
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
  } = useMyProblemsDashboard();

  const deleteMutation = useDeleteProblemMutation();

  const tabs = useMemo<TabDefinition<ProblemsDashboardTab>[]>(
    () => [
      { id: 'published', label: 'My Problems', count: totals?.published },
      { id: 'joined', label: 'Joined', count: totals?.joined },
      { id: 'drafts', label: 'Drafts', count: totals?.drafts },
    ],
    [totals],
  );

  const getEmptyStateContent = () => {
    switch (tab) {
      case 'drafts':
        return {
          ...PROBLEMS_DASHBOARD_LABELS.emptyStates.drafts,
          href: ROUTES.problemsNew,
        };
      case 'joined':
        return {
          ...PROBLEMS_DASHBOARD_LABELS.emptyStates.joined,
          href: ROUTES.problems,
        };
      case 'published':
      default:
        return {
          ...PROBLEMS_DASHBOARD_LABELS.emptyStates.published,
          href: ROUTES.problemsNew,
        };
    }
  };

  const emptyContent = getEmptyStateContent();

  type ProblemCard = (typeof items)[number];

  const getProblemDetailHref = (card: ProblemCard) =>
    card.status === 'DRAFT'
      ? ROUTES.problemCreation(card.id)
      : ROUTES.problemDetail(card.id);

  return (
    <ProfileDashboardView<ProblemsDashboardTab, ProblemCard>
      title="My Problems"
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
            <Button className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 text-white">
              {emptyContent.buttonText}
            </Button>
          </Link>
        </div>
      }
      renderErrorMessage={err =>
        getApiErrorMessage(err, {
          invalidCredentialsMessage:
            PROBLEMS_DASHBOARD_LABELS.loadErrorFallback,
        })
      }
      tabsMobileMode="row"
      loadingMoreLabel={PROBLEMS_DASHBOARD_LABELS.loadingMore}
      layoutId="profile-problems-dashboard-tabs-underline"
      deleteMutation={deleteMutation}
      renderSkeletonCard={i => <SkeletonCard key={i} className="h-64" />}
      renderCard={({ item: card, isMobile, isDeleting, onDelete }) => (
        <DashboardCardStandard
          key={card.id}
          card={card}
          detailHref={getProblemDetailHref(card)}
          layout="horizontal"
          emptyDescriptionText={PROBLEMS_DASHBOARD_LABELS.emptyDescription}
          emptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
          linkedSectionLabel={PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel}
          getLinkedItemDetailHref={ROUTES.ideaDetail}
          linkedItemsScrollLeftAriaLabel={
            PROBLEMS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
          }
          linkedItemsExpanded={false}
          isMobile={isMobile}
          hideLinkedItems
          entityType="PROBLEM"
          actionMenu={
            <ProblemCardActions
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
