import { getInitials } from '@/features/idea-details/lib/get-initials';
import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import { IdeaProjectActions } from '@/features/idea-details/ui/IdeaProjectActions';
import { useDeleteIdea } from '@/features/ideas/hooks/use-delete-idea';
import { useExportIdeaPdfMutation } from '@/features/ideas/hooks/use-export-idea-pdf';
import {
  IDEA_DELETE_CONFIRM_DESCRIPTION,
  IDEA_DELETE_CONFIRM_TITLE,
} from '@/features/ideas/lib/modals/copy';
import { outlineBtnClass, pageTitleClass } from '@/features/ideas/lib/styles';
import { EntityLiveChatAction } from '@/features/live-chat/ui/EntityLiveChatAction';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Download,
  SquarePen,
  Video,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
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

type IdeaHeaderProps = {
  idea: IdeaDetails;
  isAuthor?: boolean;
  isEditing?: boolean;
  isCompact?: boolean;
  variant?: 'full' | 'compact-only';
  showProjectActions?: boolean;
  onStartEdit?: () => void;
  onScheduleConference?: () => void;
  onDeleteSuccess?: () => void;
  onTeamClick?: () => void;
  onBackClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const metadataLabelClass =
  'text-brand-gray-600 text-xs font-semibold tracking-wide uppercase';

function ManageDropdown({
  isAuthor,
  isEditing,
  isCompact,
  ideaId,
  onStartEdit,
  onScheduleConference,
  onDeleteClick,
}: {
  isAuthor: boolean;
  isEditing: boolean;
  isCompact: boolean;
  ideaId: string;
  onStartEdit?: () => void;
  onScheduleConference?: () => void;
  onDeleteClick: () => void;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);
  const exportPdf = useExportIdeaPdfMutation();

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
        align="end"
        className={cn(
          'rounded p-2',
          isMobile ? 'w-[calc(100vw-2rem)] max-w-xs' : 'w-44',
        )}
      >
        {!isEditing ? (
          <DropdownMenuItem
            className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
            onSelect={() => {
              onStartEdit?.();
            }}
          >
            <SquarePen className="mr-2 size-4" />
            Edit idea
          </DropdownMenuItem>
        ) : null}

        {!isEditing ? (
          <>
            <DropdownMenuSeparator className="my-0" />
            <DropdownMenuItem
              className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
              onSelect={() => {
                onScheduleConference?.();
              }}
            >
              <Video className="mr-2 size-4" />
              Schedule conference
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator className="my-0" />

        <DropdownMenuItem
          className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
          disabled={exportPdf.isPending}
          onSelect={event => {
            event.preventDefault();
            exportPdf.mutate(ideaId);
          }}
        >
          <Download className="mr-2 size-4" />
          Export as PDF
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-0" />

        <DropdownMenuItem
          className="focus:bg-brand-orange/10 hover:bg-brand-orange/10 cursor-pointer px-3 py-2 text-sm font-normal text-amber-600 focus:text-amber-600"
          onSelect={() => {
            onDeleteClick();
          }}
        >
          Delete idea
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function IdeaHeader({
  idea,
  isAuthor = false,
  isEditing = false,
  isCompact = false,
  variant = 'full',
  showProjectActions = true,
  onStartEdit,
  onScheduleConference,
  onDeleteSuccess,
  onTeamClick,
  onBackClick,
}: IdeaHeaderProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { deleteIdea, isPending: isDeletePending } = useDeleteIdea();
  const exportPdf = useExportIdeaPdfMutation();

  const handleConfirmDelete = () => {
    deleteIdea(idea.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        onDeleteSuccess?.();
      },
    });
  };

  const title = idea.title || 'Untitled idea';

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
          {isEditing ? (
            <p className="text-brand-gray-600 line-clamp-1 min-w-0 flex-1 text-xs font-semibold tracking-wide uppercase">
              Editing idea
            </p>
          ) : (
            <h1 className="text-brand-black line-clamp-1 min-w-0 flex-1 text-sm font-bold">
              {title}
            </h1>
          )}
          <ManageDropdown
            isAuthor={isAuthor}
            isEditing={isEditing}
            isCompact={true}
            ideaId={idea.id}
            onStartEdit={onStartEdit}
            onScheduleConference={onScheduleConference}
            onDeleteClick={() => setDeleteModalOpen(true)}
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
        <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              {isEditing ? (
                <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
                  Editing idea
                </p>
              ) : (
                <h1
                  className={cn(
                    pageTitleClass,
                    'text-brand-black min-w-0 flex-1 break-words normal-case',
                  )}
                >
                  {title}
                </h1>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 md:gap-8">
              {idea.team.length > 0 ? (
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="hover:bg-brand-gray-100/80 focus-visible:ring-brand-dark-blue -m-1 flex cursor-pointer items-center gap-1.5 rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label="View team members"
                    onClick={onTeamClick}
                  >
                    <span className={metadataLabelClass}>Team</span>

                    <AvatarGroup aria-label="Team members">
                      {idea.team.slice(0, 4).map(member => (
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

                      {idea.team.length > 4 && (
                        <Avatar
                          size="sm"
                          className="flex items-center justify-center bg-slate-700 ring-2 ring-white"
                        >
                          <span className="text-[11px] font-bold tracking-tight text-white">
                            +{idea.team.length - 4}
                          </span>
                        </Avatar>
                      )}
                    </AvatarGroup>
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <StageChevronBadge stage={idea.stage} />
                  </div>
                </div>
              ) : null}

              {!isEditing ? (
                <div className="grid w-full grid-cols-1 gap-2 sm:w-auto md:flex md:flex-row md:items-end">
                  <div className="order-1 w-full md:order-2 md:w-auto">
                    <ManageDropdown
                      isAuthor={isAuthor}
                      isEditing={isEditing}
                      isCompact={false}
                      ideaId={idea.id}
                      onStartEdit={onStartEdit}
                      onScheduleConference={onScheduleConference}
                      onDeleteClick={() => setDeleteModalOpen(true)}
                    />
                  </div>

                  <div className="mdContext order-2 flex w-full gap-2 *:flex-1 md:order-1 md:w-auto">
                    {showProjectActions ? (
                      <IdeaProjectActions
                        ideaId={idea.id}
                        viewer={idea.viewer}
                      />
                    ) : null}
                    {!isAuthor ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          outlineBtnClass,
                          'h-10 shrink-0 gap-1.5 rounded-sm border px-3 text-xs font-bold tracking-wide uppercase',
                        )}
                        disabled={exportPdf.isPending}
                        isLoading={exportPdf.isPending}
                        onClick={() => exportPdf.mutate(idea.id)}
                      >
                        <Download className="size-4" />
                        Export PDF
                      </Button>
                    ) : null}
                    <EntityLiveChatAction
                      entityKind="IDEA"
                      entityId={idea.id}
                      viewer={idea.viewer}
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
          title={IDEA_DELETE_CONFIRM_TITLE}
          description={IDEA_DELETE_CONFIRM_DESCRIPTION}
          confirmLabel="YES"
          cancelLabel="NO"
          onConfirm={handleConfirmDelete}
          isPending={isDeletePending}
        />
      ) : null}
    </header>
  );
}
