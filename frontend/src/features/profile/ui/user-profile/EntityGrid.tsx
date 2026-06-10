import { DashboardCardStandard } from '@/features/ideas-dashboard';
import { IDEAS_DASHBOARD_LABELS } from '@/features/ideas-dashboard/lib/config/ideas-dashboard-labels';
import { toProfileContributionCard } from '@/features/profile/lib/profile-contribution.mapper';
import {
  isProfileIdea,
  isProfileProblem,
  type ProfileContribution,
} from '@/features/profile/model/profile-contributions.types';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { ROUTES } from '@/shared/config/paths';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { Button } from '@/shared/ui/button';
import { SkeletonCard } from '@/shared/ui/skeleton';

const SKELETON_COUNT = 6;

type EntityGridProps = {
  items: ProfileContribution[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
};

export function EntityGrid({
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
}: EntityGridProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <SkeletonCard key={index} className="h-56" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-16 text-center">
        <p className="text-brand-gray-700 text-sm">No contributions yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(item => {
          const card = toProfileContributionCard(item);
          const isIdea = isProfileIdea(item);

          if (!isIdea && !isProfileProblem(item)) {
            return null;
          }

          return (
            <DashboardCardStandard
              key={`${item.kind}-${item.id}`}
              card={card}
              detailHref={
                isIdea
                  ? ROUTES.ideaDetail(item.id)
                  : ROUTES.problemDetail(item.id)
              }
              emptyDescriptionText={
                isIdea
                  ? IDEAS_DASHBOARD_LABELS.emptyDescription
                  : PROBLEMS_DASHBOARD_LABELS.emptyDescription
              }
              emptyImageText={
                isIdea
                  ? IDEAS_DASHBOARD_LABELS.emptyImage
                  : PROBLEMS_DASHBOARD_LABELS.emptyImage
              }
              linkedSectionLabel={
                isIdea
                  ? IDEAS_DASHBOARD_LABELS.linkedSectionLabel
                  : PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel
              }
              getLinkedItemDetailHref={
                isIdea ? ROUTES.problemDetail : ROUTES.ideaDetail
              }
              linkedItemsScrollLeftAriaLabel={
                isIdea
                  ? IDEAS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
                  : PROBLEMS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
              }
              layout="vertical"
              linkedItemsExpanded={false}
              isMobile={isMobile}
              hideLinkedItems
              entityType={isIdea ? 'IDEA' : 'PROBLEM'}
            />
          );
        })}
      </div>

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
