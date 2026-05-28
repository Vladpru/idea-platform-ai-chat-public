import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { outlineBtnClass, pageTitleClass } from '@/features/ideas/lib/styles';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

type ProblemHeaderProps = {
  problem: ProblemDetails;
  isAuthor?: boolean;
  onDeleteSuccess?: () => void;
};

const metadataLabelClass =
  'text-brand-gray-600 text-xs font-semibold tracking-wide uppercase';

const DELETE_TITLE = 'Delete problem?';
const DELETE_DESCRIPTION =
  'This will permanently remove the problem and its links. This action cannot be undone.';

export function ProblemHeader({
  problem,
  isAuthor = false,
  onDeleteSuccess,
}: ProblemHeaderProps) {
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteProblemMutation();
  const isDraft = problem.status === 'DRAFT';

  const handleConfirmDelete = () => {
    deleteMutation.mutate(problem.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        onDeleteSuccess?.();
      },
    });
  };

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1 space-y-4">
        <h1 className={cn(pageTitleClass, 'text-brand-black normal-case')}>
          {problem.title || 'Untitled problem'}
        </h1>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 md:gap-8">
          {problem.team.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className={metadataLabelClass}>Team</span>
              <AvatarGroup aria-label="Team members">
                {problem.team.slice(0, 4).map(member => (
                  <Avatar
                    key={member.id}
                    size="sm"
                    className="ring-2 ring-white"
                    title={member.name}
                  >
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {problem.team.length > 4 ? (
                  <Avatar
                    size="sm"
                    className="flex items-center justify-center bg-slate-700 ring-2 ring-white"
                  >
                    <span className="text-[11px] font-bold tracking-tight text-white">
                      +{problem.team.length - 4}
                    </span>
                  </Avatar>
                ) : null}
              </AvatarGroup>
            </div>
          ) : null}

          <StageChevronBadge stage={problem.stage} />
        </div>
      </div>

      {isAuthor ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  outlineBtnClass,
                  'hover:bg-brand-blue-700 w-full gap-1.5 hover:text-white md:w-auto md:shrink-0',
                )}
              >
                Manage
                <ChevronDown className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded p-2">
              <DropdownMenuItem
                className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
                onSelect={event => {
                  event.preventDefault();
                  void navigate({
                    to: ROUTES.problemsNew,
                    search: { problemId: problem.id },
                  });
                }}
              >
                {isDraft ? 'Continue editing' : 'Edit problem'}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-0" />

              <DropdownMenuItem
                className="focus:bg-brand-orange/10 hover:bg-brand-orange/10 cursor-pointer px-3 py-2 text-sm font-normal text-amber-600 focus:text-amber-600"
                onSelect={event => {
                  event.preventDefault();
                  setDeleteModalOpen(true);
                }}
              >
                Delete problem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ConfirmModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            title={DELETE_TITLE}
            description={DELETE_DESCRIPTION}
            confirmLabel="YES"
            cancelLabel="NO"
            onConfirm={handleConfirmDelete}
            isPending={deleteMutation.isPending}
          />
        </>
      ) : null}
    </header>
  );
}
