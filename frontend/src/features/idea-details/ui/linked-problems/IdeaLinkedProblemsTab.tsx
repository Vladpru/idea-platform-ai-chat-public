import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import { LinkExistingProblemModal } from '@/features/idea-details/modals/LinkExistingProblemModal';
import { useUnlinkProblemMutation } from '@/features/ideas/hooks/use-idea-mutations';
import { outlineBtnClass } from '@/features/ideas/lib/styles';
import type { ProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.types';
import { ProblemDashboardCardStandard } from '@/features/problems-dashboard/ui/cards/ProblemDashboardCardStandard';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { MoreVertical, Unlink } from 'lucide-react';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { AppDropdown, type DropdownItem } from '@/shared/ui/AppDropdown';
import { LikeButton } from '@/shared/ui/LikeButton';

type IdeaLinkedProblemsTabProps = {
  ideaId: string;
  problems: IdeaDetails['linkedProblems'];
  isAuthor?: boolean;
};

const headerActionClass = cn(
  outlineBtnClass,
  'h-9 px-4 text-xs whitespace-nowrap sm:w-auto',
);

const headerActionsLayoutClass =
  'flex w-full flex-row gap-3 md:w-auto md:flex-nowrap';

type LinkedProblemsHeaderProps = {
  ideaId: string;
  onLinkExisting: () => void;
};

function LinkedProblemsHeader({
  ideaId,
  onLinkExisting,
}: LinkedProblemsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-brand-black text-lg font-bold tracking-wide sm:text-xl md:text-2xl">
        Linked problems
      </h2>
      <div className={headerActionsLayoutClass}>
        <a
          href={`/problems/new?fromIdeaId=${encodeURIComponent(ideaId)}`}
          className={cn(
            headerActionClass,
            'inline-flex flex-1 items-center justify-center md:flex-initial',
          )}
        >
          Create new problem
        </a>
        <Button
          type="button"
          variant="outline"
          className={cn(headerActionClass, 'flex-1 md:flex-initial')}
          onClick={onLinkExisting}
        >
          Link existing problem
        </Button>
      </div>
    </div>
  );
}

type LinkedProblemCardProps = {
  problem: IdeaDetails['linkedProblems'][number];
  canUnlink: boolean;
  isUnlinking: boolean;
  onUnlink: () => void;
};

function mapLinkedProblemToDashboardCard(
  problem: IdeaDetails['linkedProblems'][number],
): ProblemDashboardCard {
  return {
    id: problem.id,
    authorId: '',
    title: problem.title,
    description: problem.description || 'No description available.',
    imageUrl: problem.imageUrl,
    authorName: problem.authorName,
    authorAvatarUrl: problem.authorAvatarUrl,
    stage: problem.stage || problem.status,
    stageValue: null,
    tags: problem.tags,
    stats: problem.stats,
    linkedItems: [],
    publishedAt: null,
    status: 'PUBLISHED',
    isAuthor: false,
    isLiked: problem.isLiked ?? false,
  };
}

function LinkedProblemCard({
  problem,
  canUnlink,
  isUnlinking,
  onUnlink,
}: LinkedProblemCardProps) {
  const card = mapLinkedProblemToDashboardCard(problem);

  const likeButton = (
    <LikeButton
      entityId={problem.id}
      entityType="PROBLEM"
      isLiked={problem.isLiked ?? false}
      likeCount={problem.stats.likes}
      className="cursor-pointer px-0 py-0 text-xs font-normal hover:bg-transparent"
      iconClassName="size-3.5"
    />
  );

  const unlinkItems: DropdownItem[] = [
    {
      label: isUnlinking ? 'Unlinking...' : 'Unlink problem',
      icon: <Unlink className="size-4" />,
      variant: 'danger',
      disabled: isUnlinking,
      onSelect: () => onUnlink(),
    },
  ];

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="group/btn border-brand-dark-blue hover:bg-brand-dark-blue focus-visible:ring-brand-orange h-8 w-8 shrink-0 rounded-md border bg-white focus-visible:ring-2"
    >
      <MoreVertical className="text-brand-dark-blue size-4 transition-colors group-hover/btn:text-white" />
      <span className="sr-only">Open menu</span>
    </Button>
  );

  const actionMenu = canUnlink ? (
    <AppDropdown
      items={unlinkItems}
      trigger={trigger}
      align="end"
      contentClassName="w-48"
    />
  ) : undefined;

  return (
    <ProblemDashboardCardStandard
      card={card}
      detailHref={ROUTES.problemDetail(problem.id)}
      emptyDescriptionText={PROBLEMS_DASHBOARD_LABELS.emptyDescription}
      emptyImageText={PROBLEMS_DASHBOARD_LABELS.emptyImage}
      linkedSectionLabel={PROBLEMS_DASHBOARD_LABELS.linkedSectionLabel}
      getLinkedItemDetailHref={ROUTES.ideaDetail}
      linkedItemsExpanded={false}
      isMobile={false}
      hideLinkedItems
      actionMenu={actionMenu}
      likeButton={likeButton}
    />
  );
}

export function IdeaLinkedProblemsTab({
  ideaId,
  problems,
  isAuthor = false,
}: IdeaLinkedProblemsTabProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const unlinkMutation = useUnlinkProblemMutation();
  const linkedProblemIds = problems.map(problem => problem.id);

  const handleUnlink = (problemId: string) => {
    unlinkMutation.mutate({ ideaId, problemId });
  };

  return (
    <section className="space-y-6">
      <LinkedProblemsHeader
        ideaId={ideaId}
        onLinkExisting={() => setLinkModalOpen(true)}
      />

      <LinkExistingProblemModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        ideaId={ideaId}
        linkedProblemIds={linkedProblemIds}
      />

      {problems.length === 0 ? (
        <p className="py-16 text-center text-sm font-medium text-gray-500">
          No problems linked to this idea yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {problems.map(problem => (
            <li key={problem.id}>
              <LinkedProblemCard
                problem={problem}
                canUnlink={isAuthor}
                isUnlinking={
                  unlinkMutation.isPending &&
                  unlinkMutation.variables?.problemId === problem.id
                }
                onUnlink={() => handleUnlink(problem.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
