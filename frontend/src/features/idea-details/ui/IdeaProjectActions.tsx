import type { IdeaDetailsViewer } from '@/features/idea-details/model/idea-details.types';
import {
  IDEA_JOIN_CONFIRM_DESCRIPTION,
  IDEA_JOIN_CONFIRM_TITLE,
  IDEA_LEAVE_CONFIRM_DESCRIPTION,
  IDEA_LEAVE_CONFIRM_TITLE,
} from '@/features/ideas/lib/modals/copy';
import { outlineBtnClass, primaryBtnClass } from '@/features/ideas/lib/styles';
import {
  useJoinIdeaMutation,
  useLeaveIdeaMutation,
} from '@/features/ideas/hooks/use-idea-mutations';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';

const quitBtnClass =
  'border-brand-orange text-brand-orange hover:bg-brand-orange/10 h-10 rounded-sm border bg-card px-5 text-xs font-bold uppercase tracking-wide sm:text-sm';

type IdeaProjectActionsProps = {
  ideaId: string;
  viewer: IdeaDetailsViewer;
  className?: string;
  layout?: 'inline' | 'stacked';
};

export function IdeaProjectActions({
  ideaId,
  viewer,
  className,
  layout = 'inline',
}: IdeaProjectActionsProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const joinMutation = useJoinIdeaMutation(ideaId);
  const leaveMutation = useLeaveIdeaMutation(ideaId);

  const isGlobalPending = joinMutation.isPending || leaveMutation.isPending;

  if (viewer.isAuthor) {
    return null;
  }

  const showJoin = viewer.canJoin;
  const showQuit = viewer.isMember;

  if (!showJoin && !showQuit) {
    return null;
  }

  const handleConfirmJoin = () => {
    joinMutation.mutate(undefined, {
      onSuccess: () => setJoinModalOpen(false),
    });
  };

  const handleConfirmLeave = () => {
    leaveMutation.mutate(undefined, {
      onSuccess: () => setLeaveModalOpen(false),
    });
  };

  return (
    <>
      <div
        className={cn(
          layout === 'stacked'
            ? 'flex w-full flex-col gap-2'
            : 'flex flex-wrap items-center gap-2',
          className,
        )}
      >
        {showJoin ? (
          <Button
            type="button"
            className={cn(primaryBtnClass, 'w-full')}
            disabled={isGlobalPending}
            isLoading={joinMutation.isPending}
            onClick={() => setJoinModalOpen(true)}
          >
            JOIN PROJECT
          </Button>
        ) : null}

        {showQuit ? (
          <Button
            type="button"
            variant="outline"
            className={cn(outlineBtnClass, quitBtnClass, 'w-full')}
            disabled={isGlobalPending}
            isLoading={leaveMutation.isPending}
            onClick={() => setLeaveModalOpen(true)}
          >
            QUIT THE PROJECT
          </Button>
        ) : null}
      </div>

      {showJoin && (
        <ConfirmModal
          open={joinModalOpen}
          onOpenChange={setJoinModalOpen}
          title={IDEA_JOIN_CONFIRM_TITLE}
          description={IDEA_JOIN_CONFIRM_DESCRIPTION}
          confirmLabel="YES"
          cancelLabel="NO"
          onConfirm={handleConfirmJoin}
          isPending={joinMutation.isPending}
        />
      )}

      {showQuit && (
        <ConfirmModal
          open={leaveModalOpen}
          onOpenChange={setLeaveModalOpen}
          title={IDEA_LEAVE_CONFIRM_TITLE}
          description={IDEA_LEAVE_CONFIRM_DESCRIPTION}
          confirmLabel="YES"
          cancelLabel="NO"
          onConfirm={handleConfirmLeave}
          isPending={leaveMutation.isPending}
        />
      )}
    </>
  );
}
