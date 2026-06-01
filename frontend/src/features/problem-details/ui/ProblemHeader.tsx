import { getInitials } from '@/features/idea-details/lib/get-initials';
import { outlineBtnClass, pageTitleClass } from '@/features/ideas/lib/styles';
import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { type MouseEvent, useState } from 'react';

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
  isCompact?: boolean;
  onDeleteSuccess?: () => void;
  onBackClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const metadataLabelClass =
  'text-brand-gray-600 text-xs font-semibold tracking-wide uppercase';

const DELETE_TITLE = 'Delete problem?';
const DELETE_DESCRIPTION =
  'This will permanently remove the problem and its links. This action cannot be undone.';

function ManageDropdown({
  isAuthor,
  isCompact,
  isDraft,
  problemId,
  onDeleteClick,
}: {
  isAuthor: boolean;
  isCompact: boolean;
  isDraft: boolean;
  problemId: string;
  onDeleteClick: () => void;
}) {
  const navigate = useNavigate();

  if (!isAuthor) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            outlineBtnClass,
            'hover:bg-brand-blue-700 shrink-0 gap-1.5 hover:text-white',
            isCompact ? 'h-8 px-2 text-xs' : 'w-full md:w-auto md:shrink-0',
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
              search: { problemId },
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
            onDeleteClick();
          }}
        >
          Delete problem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProblemHeader({
  problem,
  isAuthor = false,
  isCompact = false,
  onDeleteSuccess,
  onBackClick,
}: ProblemHeaderProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteProblemMutation();
  const isDraft = problem.status === 'DRAFT';
  const title = problem.title || 'Untitled problem';

  const handleConfirmDelete = () => {
    deleteMutation.mutate(problem.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        onDeleteSuccess?.();
      },
    });
  };

  return (
    <header className="relative min-w-0">
      <motion.div
        initial={false}
        animate={{
          opacity: isCompact ? 1 : 0,
          pointerEvents: isCompact ? 'auto' : 'none',
          y: isCompact ? 0 : -10,
        }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 right-0 left-0 z-10 flex min-w-0 items-center gap-2 py-2"
      >
        <button
          type="button"
          onClick={onBackClick}
          className="text-primary hover:text-primary/80 inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <h1 className="text-brand-black line-clamp-1 min-w-0 flex-1 text-sm font-bold">
          {title}
        </h1>
        <ManageDropdown
          isAuthor={isAuthor}
          isCompact={true}
          isDraft={isDraft}
          problemId={problem.id}
          onDeleteClick={() => setDeleteModalOpen(true)}
        />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          opacity: isCompact ? 0 : 1,
          pointerEvents: isCompact ? 'none' : 'auto',
          height: isCompact ? 48 : 'auto',
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <h1 className={cn(pageTitleClass, 'text-brand-black normal-case')}>
              {title}
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
                          <AvatarImage
                            src={member.avatarUrl}
                            alt={member.name}
                          />
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

          <ManageDropdown
            isAuthor={isAuthor}
            isCompact={false}
            isDraft={isDraft}
            problemId={problem.id}
            onDeleteClick={() => setDeleteModalOpen(true)}
          />
        </div>
      </motion.div>

      {isAuthor ? (
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
      ) : null}
    </header>
  );
}
