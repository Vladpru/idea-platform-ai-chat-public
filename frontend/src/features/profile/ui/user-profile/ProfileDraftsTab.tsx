import { DashboardCardStandard, IDEAS_DASHBOARD_LABELS } from '@/features/ideas-dashboard';
import { useDeleteIdeaMutation } from '@/features/ideas/hooks/use-idea-mutations';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import { useCallback, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { SkeletonCard } from '@/shared/ui/skeleton';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

import { useIdeaDrafts } from '../../hooks/use-idea-drafts';
import { useProblemDrafts } from '../../hooks/use-problem-drafts';
import { IdeaCardActions } from '../dashboard/IdeaCardActions';
import { ProblemCardActions } from '../dashboard/ProblemCardActions';

type DraftType = 'ideas' | 'problems';

export function ProfileDraftsTab() {
  const [draftType, setDraftType] = useState<DraftType>('ideas');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const ideaDrafts = useIdeaDrafts();
  const problemDrafts = useProblemDrafts();
  const deleteIdeaMutation = useDeleteIdeaMutation();
  const deleteProblemMutation = useDeleteProblemMutation();

  const active = draftType === 'ideas' ? ideaDrafts : problemDrafts;

  const handleLoadMore = useCallback(() => {
    void active.fetchNextPage();
  }, [active]);

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="border-brand-gray-200 inline-flex overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setDraftType('ideas')}
            className={cn(
              'w-24 py-2 text-sm font-semibold transition-colors',
              draftType === 'ideas'
                ? 'bg-brand-dark-blue text-white'
                : 'text-brand-gray-700 hover:bg-brand-gray-50',
            )}
          >
            Ideas
          </button>
          <button
            type="button"
            onClick={() => setDraftType('problems')}
            className={cn(
              'border-brand-gray-200 w-24 border-l py-2 text-sm font-semibold transition-colors',
              draftType === 'problems'
                ? 'bg-brand-dark-blue text-white'
                : 'text-brand-gray-700 hover:bg-brand-gray-50',
            )}
          >
            Problems
          </button>
        </div>
      </div>

      {active.isError && (
        <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
          <p className="text-brand-gray-700 mb-4 text-sm">
            {getApiErrorMessage(active.error, {
              invalidCredentialsMessage: 'Failed to load drafts.',
            })}
          </p>
          <Button type="button" variant="outline" onClick={() => void active.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {active.isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      )}

      {!active.isLoading && !active.isError && active.items.length === 0 && (
        <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
          <p className="text-brand-gray-700 text-sm">No {draftType} drafts yet.</p>
        </div>
      )}

      {!active.isLoading && !active.isError && active.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {draftType === 'ideas'
            ? ideaDrafts.items.map(card => (
                <DashboardCardStandard
                  key={card.id}
                  card={card}
                  detailHref={ROUTES.ideaDetail(card.id)}
                  layout="horizontal"
                  isMobile={isMobile}
                  emptyDescriptionText={IDEAS_DASHBOARD_LABELS.emptyDescription}
                  emptyImageText={IDEAS_DASHBOARD_LABELS.emptyImage}
                  linkedSectionLabel={IDEAS_DASHBOARD_LABELS.linkedSectionLabel}
                  getLinkedItemDetailHref={ROUTES.problemDetail}
                  linkedItemsScrollLeftAriaLabel={
                    IDEAS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
                  }
                  linkedItemsExpanded={false}
                  hideLinkedItems
                  actionMenu={
                    <IdeaCardActions
                      card={card}
                      onDelete={id => deleteIdeaMutation.mutate(id)}
                      isDeleting={
                        deleteIdeaMutation.isPending &&
                        deleteIdeaMutation.variables === card.id
                      }
                    />
                  }
                />
              ))
            : problemDrafts.items.map(card => (
                <DashboardCardStandard
                  key={card.id}
                  card={card}
                  detailHref={ROUTES.problemDetail(card.id)}
                  layout="horizontal"
                  isMobile={isMobile}
                  emptyDescriptionText={PROBLEMS_DASHBOARD_LABELS.emptyDescription}
                  emptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
                  linkedSectionLabel={PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel}
                  getLinkedItemDetailHref={ROUTES.ideaDetail}
                  linkedItemsScrollLeftAriaLabel={
                    PROBLEMS_DASHBOARD_LABELS.linkedItemsScrollLeftAriaLabel
                  }
                  linkedItemsExpanded={false}
                  hideLinkedItems
                  actionMenu={
                    <ProblemCardActions
                      card={card}
                      onDelete={id => deleteProblemMutation.mutate(id)}
                      isDeleting={
                        deleteProblemMutation.isPending &&
                        deleteProblemMutation.variables === card.id
                      }
                    />
                  }
                />
              ))}
        </div>
      )}

      {active.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={active.isFetchingNextPage}
          >
            {active.isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
