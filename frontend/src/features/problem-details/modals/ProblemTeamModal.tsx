import type { ProblemDetailsTeamMember } from '@/features/problem-details/model/problem-details.types';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { Link } from '@tanstack/react-router';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

export type ProblemTeamModalProps = {
  authorId: string;
  team: ProblemDetailsTeamMember[];
  onClose: () => void;
};

function formatMemberCount(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

export function ProblemTeamModal({
  authorId,
  team,
  onClose,
}: ProblemTeamModalProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

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
          {formatMemberCount(team.length)}
        </p>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ul className="space-y-4 pt-4">
            {team.map(member => {
              const isAuthorRow = member.id === authorId;

              return (
                <li key={member.id}>
                  <Link
                    to="/profile/$profileId"
                    params={{ profileId: member.id }}
                    search={{ tab: 'all' }}
                    onClick={() => onClose()}
                    className="focus-visible:ring-brand-dark-blue hover:bg-brand-gray-100 group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Avatar
                      size="default"
                      className="shrink-0 transition-transform group-hover:scale-105"
                    >
                      {member.avatarUrl ? (
                        <AvatarImage
                          src={member.avatarUrl}
                          alt={member.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-xs font-semibold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-brand-gray-900 group-hover:text-brand-dark-blue truncate text-sm font-semibold transition-colors">
                        {member.name}
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
      </SheetContent>
    </Sheet>
  );
}
