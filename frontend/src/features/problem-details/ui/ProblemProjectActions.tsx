import type { ProblemDetailsViewer } from '@/features/problem-details/model/problem-details.types';
import {
  PROBLEM_JOIN_CONFIRM_DESCRIPTION,
  PROBLEM_JOIN_CONFIRM_TITLE,
  PROBLEM_LEAVE_CONFIRM_DESCRIPTION,
  PROBLEM_LEAVE_CONFIRM_TITLE,
} from '@/features/problems/lib/modals/copy';
import { outlineBtnClass, primaryBtnClass } from '@/features/ideas/lib/styles';
import {
  useJoinProblemMutation,
  useLeaveProblemMutation,
} from '@/features/problems/hooks/use-problem-mutations';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';

const quitBtnClass =
  'border-brand-orange text-brand-orange hover:bg-brand-orange/10 h-10 rounded-sm border bg-card px-5 text-xs font-bold uppercase tracking-wide sm:text-sm';

type ProblemProjectActionsProps = {
  problemId: string;
  viewer: ProblemDetailsViewer;
  className?: string;
  layout?: 'inline' | 'stacked';
};

export function ProblemProjectActions({
  problemId,
  viewer,
  className,
  layout = 'inline',
}: ProblemProjectActionsProps) {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const joinMutation = useJoinProblemMutation(problemId);
  const leaveMutation = useLeaveProblemMutation(problemId);

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
          title={PROBLEM_JOIN_CONFIRM_TITLE}
          description={PROBLEM_JOIN_CONFIRM_DESCRIPTION}
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
          title={PROBLEM_LEAVE_CONFIRM_TITLE}
          description={PROBLEM_LEAVE_CONFIRM_DESCRIPTION}
          confirmLabel="YES"
          cancelLabel="NO"
          onConfirm={handleConfirmLeave}
          isPending={leaveMutation.isPending}
        />
      )}
    </>
  );
}
