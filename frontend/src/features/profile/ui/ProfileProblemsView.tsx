import type { ProblemsDashboardTab } from '@/features/problems/api/problems-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { DashboardCardStandard } from '@/features/ideas-dashboard';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import type { TabDefinition } from '@/shared/ui/TabLabelWithBadge';

import { useMyProblemsDashboard } from '../hooks/use-my-problems-dashboard';
import { ProblemCardActions } from './ProblemCardActions';
import { ProfileDashboardView } from './ProfileDashboardView';
import { useMemo } from 'react';

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

  type ProblemCard = (typeof items)[number];

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
      emptyLabel={PROBLEMS_DASHBOARD_LABELS.emptyGridMessage}
      renderErrorMessage={err =>
        getApiErrorMessage(err, {
          invalidCredentialsMessage:
            PROBLEMS_DASHBOARD_LABELS.loadErrorFallback,
        })
      }
      loadingMoreLabel={PROBLEMS_DASHBOARD_LABELS.loadingMore}
      layoutId="profile-problems-dashboard-tabs-underline"
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
          detailHref={ROUTES.problemDetail(card.id)}
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
