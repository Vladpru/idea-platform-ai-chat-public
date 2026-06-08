import { getInitials } from '@/features/idea-details/lib/get-initials';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

import { getLeaderboardBreakdownItems } from '../lib/leaderboard-breakdown-labels';
import { formatContributorPoints } from '../lib/format-statistics-values';
import type { LeaderboardEntry } from '../model/statistics.types';

type LeaderboardRowProps = {
  rank: number;
  entry: LeaderboardEntry;
};

export function LeaderboardRow({ rank, entry }: LeaderboardRowProps) {
  const breakdownItems = getLeaderboardBreakdownItems(entry.breakdown);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <li className="border-brand-gray-200 hover:bg-brand-gray-50 flex cursor-default items-center gap-4 border-b px-5 py-4 transition-colors last:border-b-0 sm:px-6">
          <span className="text-brand-gray-500 w-6 shrink-0 text-sm font-semibold tabular-nums">
            {rank}.
          </span>
          <Avatar size="lg" className="size-11 shrink-0">
            {entry.avatarUrl ? (
              <AvatarImage src={entry.avatarUrl} alt={entry.name} />
            ) : null}
            <AvatarFallback className="bg-brand-light-blue text-brand-dark-blue text-sm font-semibold">
              {getInitials(entry.name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-brand-black min-w-0 flex-1 truncate text-sm font-bold">
            {entry.name}
          </p>
          <span className="bg-brand-light-blue text-brand-dark-blue shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums">
            {formatContributorPoints(entry.points)}
          </span>
        </li>
      </TooltipTrigger>
      {breakdownItems.length > 0 ? (
        <TooltipContent
          side="right"
          align="start"
          className="border-brand-gray-200 bg-card text-brand-black min-w-44 rounded-md border px-3 py-2.5 shadow-lg"
        >
          <ul className="space-y-1.5 text-sm">
            {breakdownItems.map(item => (
              <li key={item.key} className="flex items-center justify-between gap-6">
                <span className="text-brand-gray-700">{item.label}</span>
                <span className="font-bold tabular-nums">{item.value}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}
