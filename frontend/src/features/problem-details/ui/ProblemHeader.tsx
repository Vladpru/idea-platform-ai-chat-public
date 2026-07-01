import { getInitials } from '@/features/idea-details/lib/get-initials';
import { outlineBtnClass, pageTitleClass } from '@/features/ideas/lib/styles';
import { EntityLiveChatAction } from '@/features/live-chat/ui/EntityLiveChatAction';
import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { ProblemProjectActions } from '@/features/problem-details/ui/ProblemProjectActions';
import { useExportProblemPdfMutation } from '@/features/problems/hooks/use-export-problem-pdf';
import { useDeleteProblemMutation } from '@/features/problems/hooks/use-problem-mutations';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Download } from 'lucide-react';
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
import { useMediaQuery } from '@/shared/hooks/use-media-query';

type ProblemHeaderProps = {
  problem: ProblemDetails;
  isAuthor?: boolean;
  isCompact?: boolean;
  variant?: 'full' | 'compact-only';
  onScheduleConference?: () => void;
  onDeleteSuccess?: () => void;
  onBackClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onTeamClick?: () => void;
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
  onScheduleConference,
  onDeleteClick,
  onExportPdf,
  isExportPending,
}: {
  isAuthor: boolean;
  isCompact: boolean;
  isDraft: boolean;
  problemId: string;
  onScheduleConference?: () => void;
  onDeleteClick: () => void;
  onExportPdf?: () => void;
  isExportPending?: boolean;
}) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);

  if (!isAuthor) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? 'start' : 'end'}
        className={cn(
          'rounded p-2',
          isMobile ? 'w-[calc(100vw-2rem)] max-w-xs' : 'w-44',
        )}
      >
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
          className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
          onSelect={event => {
            event.preventDefault();
            onScheduleConference?.();
          }}
        >
          Schedule conference
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0" />

        <DropdownMenuItem
          className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 px-3 py-2 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isExportPending}
          onSelect={event => {
            event.preventDefault();
            onExportPdf?.();
          }}
        >
          <Download className="mr-2 size-4" />
          Export as PDF
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
  variant = 'full',
  onScheduleConference,
  onDeleteSuccess,
  onBackClick,
  onTeamClick,
}: ProblemHeaderProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteProblemMutation();
  const exportPdf = useExportProblemPdfMutation();
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
        animate={
          variant === 'compact-only'
            ? {
                opacity: isCompact ? 1 : 0,
                pointerEvents: isCompact ? 'auto' : 'none',
                y: isCompact ? 0 : -4,
              }
            : {
                opacity: isCompact ? 1 : 0,
                pointerEvents: isCompact ? 'auto' : 'none',
                y: isCompact ? 0 : -10,
              }
        }
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'z-10 overflow-hidden',
          variant === 'compact-only'
            ? 'relative h-9'
            : 'absolute top-0 right-0 left-0 py-2 flex min-w-0 items-center gap-2',
        )}
      >
        <div className={cn(variant === 'compact-only' && 'flex min-w-0 items-center gap-2 py-2')}>
          <button
            type="button"
            onClick={onBackClick}
            className="text-primary hover:text-primary/80 inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <h1 className="text-brand-black ml-5 line-clamp-1 min-w-0 flex-1 text-base font-bold">
            {title}
          </h1>
          <ManageDropdown
            isAuthor={isAuthor}
            isCompact={true}
            isDraft={isDraft}
            problemId={problem.id}
            onScheduleConference={onScheduleConference}
            onDeleteClick={() => setDeleteModalOpen(true)}
            onExportPdf={() => exportPdf.mutate(problem.id)}
            isExportPending={exportPdf.isPending}
          />
        </div>
      </motion.div>

      {variant !== 'compact-only' && <motion.div
        initial={false}
        animate={{
          opacity: isCompact ? 0 : 1,
          pointerEvents: isCompact ? 'none' : 'auto',
          height: isCompact ? 48 : 'auto',
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-4 pb-4 shadow-none md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <h1
              className={cn(
                pageTitleClass,
                'text-brand-black min-w-0 break-words normal-case',
              )}
            >
              {title}
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 md:gap-8">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8">
                {problem.team.length > 0 ? (
                  <button
                    type="button"
                    className="hover:bg-brand-gray-100/80 -m-1 flex cursor-pointer items-center gap-1.5 rounded-md p-1 transition-colors outline-none"
                    aria-label="View team members"
                    onClick={onTeamClick}
                  >
                    <span className={metadataLabelClass}>Team</span>
                    <AvatarGroup aria-label="Team members">
                      {problem.team.slice(0, 4).map(member => (
                        <Avatar
                          key={member.id}
                          size="sm"
                          className="ring-card dark:ring-none ring-2"
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
                  </button>
                ) : null}

                <StageChevronBadge stage={problem.stage} />
              </div>

              {!isCompact ? (
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="order-1 flex w-full flex-row gap-2 *:flex-1 md:order-2 md:w-auto md:gap-3">
                    {!isAuthor ? (
                      <ProblemProjectActions
                        problemId={problem.id}
                        viewer={problem.viewer}
                      />
                    ) : null}
                    {!isAuthor ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          outlineBtnClass,
                          'h-10 shrink-0 gap-1.5 rounded-sm border px-3 text-xs font-bold uppercase tracking-wide',
                        )}
                        disabled={exportPdf.isPending}
                        isLoading={exportPdf.isPending}
                        onClick={() => exportPdf.mutate(problem.id)}
                      >
                        <Download className="size-4" />
                        Export PDF
                      </Button>
                    ) : null}
                    <EntityLiveChatAction
                      entityKind="PROBLEM"
                      entityId={problem.id}
                      viewer={problem.viewer}
                    />
                  </div>

                  <div className="order-2 w-full md:order-1 md:w-auto">
                    <ManageDropdown
                      isAuthor={isAuthor}
                      isCompact={false}
                      isDraft={isDraft}
                      problemId={problem.id}
                      onScheduleConference={onScheduleConference}
                      onDeleteClick={() => setDeleteModalOpen(true)}
                      onExportPdf={() => exportPdf.mutate(problem.id)}
          isExportPending={exportPdf.isPending}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>}

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
