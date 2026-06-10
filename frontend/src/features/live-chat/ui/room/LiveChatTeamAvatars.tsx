import { getInitials } from '@/features/idea-details/lib/get-initials';
import type { LiveChatTeamMemberDto } from '@/features/live-chat/api/live-chat-api.types';
import { LiveChatTeamSheet } from '@/features/live-chat/ui/room/LiveChatTeamSheet';
import { formatPersonName } from '@/features/idea-details/lib/format-person-name';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from '@/shared/ui/avatar';

type LiveChatTeamAvatarsProps = {
  team: LiveChatTeamMemberDto[];
  className?: string;
};

function getMemberDisplayName(member: LiveChatTeamMemberDto): string {
  return formatPersonName(member.firstName, member.lastName, 'Unknown');
}

export function LiveChatTeamAvatars({
  team,
  className,
}: LiveChatTeamAvatarsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (team.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="View team members"
        onClick={() => setSheetOpen(true)}
        className={cn(
          'hover:bg-brand-gray-100/80 focus-visible:ring-brand-dark-blue flex shrink-0 cursor-pointer items-center gap-2 rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        )}
      >
        <span className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
          Team
        </span>

        <AvatarGroup aria-label="Team members">
          {team.slice(0, 4).map(member => {
            const name = getMemberDisplayName(member);

            return (
              <Avatar
                key={member.id}
                size="sm"
                className="ring-card ring-2"
                title={name}
              >
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt={name} />
                ) : null}
                <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            );
          })}

          {team.length > 4 ? (
            <Avatar
              size="sm"
              className="flex items-center justify-center bg-slate-700 ring-2 ring-white"
            >
              <span className="text-[11px] font-bold tracking-tight text-white">
                +{team.length - 4}
              </span>
            </Avatar>
          ) : null}
        </AvatarGroup>
      </button>

      <LiveChatTeamSheet
        team={team}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
