import type {
  IdeaFormAuthorDto,
  IdeaFormMemberDto,
} from '@/features/ideas/api/idea-form-api.types';
import type { IdeaDetailsViewer } from '@/features/idea-details/model/idea-details.types';
import { IdeaProjectActions } from '@/features/idea-details/ui/IdeaProjectActions';
import { formatPersonName } from '@/features/idea-details/lib/format-person-name';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';

export type TeamModalProps = {
  ideaId: string;
  author: IdeaFormAuthorDto;
  members: IdeaFormMemberDto[];
  viewer: IdeaDetailsViewer;
  onClose: () => void;
};

function formatMemberCount(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

export function TeamModal({
  ideaId,
  author,
  members,
  viewer,
  onClose,
}: TeamModalProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const sortedTeam = useMemo(
    () => [author, ...members.map(member => member.user)],
    [author, members],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const showProjectActions = !viewer.isAuthor;

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'bg-card flex flex-col p-0',
          isMobile
            ? 'data-[side=bottom]:data-closed:slide-out-to-bottom-full w-full max-w-full border-none transition duration-300 ease-in-out data-[side=bottom]:h-full data-[side=bottom]:rounded-none'
            : 'sm:border-brand-gray-200 h-[100dvh] max-w-full rounded-none border-none data-[side=right]:w-full sm:max-w-[400px] sm:border-l',
        )}
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <SheetHeader className="border-brand-gray-200 border-b p-6 text-left md:p-8">
          <SheetTitle className="text-brand-gray-900 text-xl font-bold">
            Team
          </SheetTitle>
        </SheetHeader>

        <p className="text-brand-gray-600 font-arial px-6 pt-1 text-base font-normal">
          {formatMemberCount(sortedTeam.length)}
        </p>

        <div className="flex-1 overflow-y-auto px-6">
          <ul className="space-y-4">
            {sortedTeam.map((person, index) => {
              const fullName = formatPersonName(
                person.firstName,
                person.lastName,
                'Unknown',
              );
              const isAuthorRow = index === 0;

              return (
                <li key={`${person.id}-${index}`}>
                  <Link
                    to="/profile/$profileId"
                    params={{ profileId: person.id }}
                    search={{ tab: 'all' }}
                    onClick={() => onClose()}
                    className="focus-visible:ring-brand-dark-blue hover:bg-brand-gray-100 group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Avatar
                      size="default"
                      className="shrink-0 transition-transform group-hover:scale-105"
                    >
                      {person.avatarUrl ? (
                        <AvatarImage src={person.avatarUrl} alt={fullName} />
                      ) : null}
                      <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-xs font-semibold">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-brand-gray-900 group-hover:text-brand-dark-blue truncate text-sm font-semibold transition-colors">
                        {fullName}
                      </p>
                      {isAuthorRow ? (
                        <p className="text-brand-gray-500 text-xs">Author</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {showProjectActions ? (
          <div className="border-brand-gray-200 mt-auto flex flex-col gap-4 border-t p-6">
            <p className="font-arial text-base font-normal">
              Your skills can take the idea to the next level. Join now
            </p>
            <IdeaProjectActions
              ideaId={ideaId}
              viewer={viewer}
              layout="stacked"
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
