import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';

import { useDeleteIdea } from '@/features/ideas/hooks/use-delete-idea';

import {
  IDEA_DELETE_CONFIRM_DESCRIPTION,
  IDEA_DELETE_CONFIRM_TITLE,
} from '@/features/ideas/lib/modals/copy';

import { outlineBtnClass, pageTitleClass } from '@/features/ideas/lib/styles';

import { ChevronDown } from 'lucide-react';

import { useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { ConfirmModal } from '@/shared/ui/confirm-modal';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from '@/shared/ui/avatar';

import { Button } from '@/shared/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { getInitials } from '@/features/idea-details/lib/get-initials';

import { IdeaProjectActions } from '@/features/idea-details/ui/IdeaProjectActions';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

type IdeaHeaderProps = {
  idea: IdeaDetails;
  isAuthor?: boolean;
  isEditing?: boolean;
  showProjectActions?: boolean;
  onStartEdit?: () => void;
  onDeleteSuccess?: () => void;
  onTeamClick?: () => void;
};

const metadataLabelClass =
  'text-brand-gray-600 text-xs font-semibold tracking-wide uppercase';

export function IdeaHeader({
  idea,
  isAuthor = false,
  isEditing = false,
  showProjectActions = true,
  onStartEdit,
  onDeleteSuccess,
  onTeamClick,
}: IdeaHeaderProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { deleteIdea, isPending: isDeletePending } = useDeleteIdea();

  const handleConfirmDelete = () => {
    deleteIdea(idea.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        onDeleteSuccess?.();
      },
    });
  };

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1 space-y-4">
        {isEditing ? (
          <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
            Editing idea
          </p>
        ) : (
          <h1 className={cn(pageTitleClass, 'text-brand-black normal-case')}>
            {idea.title || 'Untitled idea'}
          </h1>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 md:gap-8">
          {idea.team.length > 0 ? (
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
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <StageChevronBadge stage={idea.stage} />
            </div>

            {showProjectActions && !isEditing ? (
              <IdeaProjectActions ideaId={idea.id} viewer={idea.viewer} />
            ) : null}
          </div>
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
              {!isEditing ? (
                <DropdownMenuItem
                  className="focus:bg-brand-blue-700/10 hover:bg-brand-blue-700/10 cursor-pointer px-3 py-2 text-sm font-normal"
                  onSelect={event => {
                    event.preventDefault();
                    onStartEdit?.();
                  }}
                >
                  Edit idea
                </DropdownMenuItem>
              ) : null}

              {!isEditing ? <DropdownMenuSeparator className="my-0" /> : null}

              <DropdownMenuItem
                className="focus:bg-brand-orange/10 hover:bg-brand-orange/10 cursor-pointer px-3 py-2 text-sm font-normal text-amber-600 focus:text-amber-600"
                onSelect={event => {
                  event.preventDefault();

                  setDeleteModalOpen(true);
                }}
              >
                Delete idea
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
        </>
      ) : null}
    </header>
  );
}
