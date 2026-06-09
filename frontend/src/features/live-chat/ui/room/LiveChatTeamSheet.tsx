import { formatPersonName } from '@/features/idea-details/lib/format-person-name';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import type { LiveChatTeamMemberDto } from '@/features/live-chat/api/live-chat-api.types';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

type LiveChatTeamSheetProps = {
  team: LiveChatTeamMemberDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatMemberCount(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

export function LiveChatTeamSheet({
  team,
  open,
  onOpenChange,
}: LiveChatTeamSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              const fullName = formatPersonName(
                member.firstName,
                member.lastName,
                'Unknown',
              );

              return (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar size="default" className="shrink-0">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={fullName} />
                    ) : null}
                    <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-xs font-semibold">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-brand-gray-900 truncate text-sm font-semibold">
                      {fullName}
                    </p>
                    {member.isAuthor ? (
                      <p className="text-brand-gray-500 text-xs">Author</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
