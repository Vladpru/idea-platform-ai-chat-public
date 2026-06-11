import { getInitials } from '@/features/idea-details/lib/get-initials';
import type { UserAchievementDto } from '@/features/achievements';
import activeVoiceIconUrl from '@/features/achievements/public/ActiveVoice.svg';
import collaboratorIconUrl from '@/features/achievements/public/Collaborator.svg';
import completerIconUrl from '@/features/achievements/public/Completer.svg';
import connectorIconUrl from '@/features/achievements/public/Connector.svg';
import innovatorIconUrl from '@/features/achievements/public/Innovator.svg';
import topContributorIconUrl from '@/features/achievements/public/TopContributor.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { getLeaderboardBreakdownItems } from '../../lib/leaderboard-breakdown-labels';
import { formatContributorPoints } from '../../lib/format-statistics-values';
import type { LeaderboardEntry } from '../../model/statistics.types';
import { Link } from '@tanstack/react-router';

const BADGE_ICON_URLS: Record<string, string> = {
  innovator: innovatorIconUrl,
  active_voice: activeVoiceIconUrl,
  collaborator: collaboratorIconUrl,
  completer: completerIconUrl,
  connector: connectorIconUrl,
  top_contributor: topContributorIconUrl,
};

function BadgePill({
  badge,
  allBadges,
}: {
  badge: UserAchievementDto;
  allBadges: UserAchievementDto[];
}) {
  const iconUrl = BADGE_ICON_URLS[badge.key];
  const isTopContributor = badge.key === 'top_contributor';

  const topContributorMonths = isTopContributor
    ? allBadges
        .filter(b => b.key === 'top_contributor')
        .map(b => b.metadata?.month)
        .filter((m): m is string => Boolean(m))
    : [];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex size-6 items-center justify-center rounded-full">
          {iconUrl ? (
            <img src={iconUrl} alt="" aria-hidden className="size-6" />
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        {isTopContributor && topContributorMonths.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {topContributorMonths.map(month => (
              <li key={month}>Top Contributor {month}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs">{badge.name}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

type LeaderboardRowProps = {
  rank: number;
  entry: LeaderboardEntry;
};

export function LeaderboardRow({ rank, entry }: LeaderboardRowProps) {
  const breakdownItems = getLeaderboardBreakdownItems(entry.breakdown);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/profile/$profileId"
          params={{ profileId: entry.id }}
          search={{ tab: 'all' }}
          className="hover:bg-brand-gray-100 group flex items-center gap-3 rounded-lg p-1 transition-colors"
        >
          <li className="border-brand-gray-200 hover:bg-brand-gray-100 flex cursor-pointer items-center gap-4 border-b px-5 py-4 transition-colors last:border-b-0 sm:px-6">
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
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <p className="text-brand-black truncate text-sm font-bold">
                {entry.name}
              </p>
              {entry.achievements && entry.achievements.length > 0 ? (
                <div className="flex shrink-0 items-center gap-1">
                  {entry.achievements
                    .filter((a, i, arr) =>
                      a.key !== 'top_contributor'
                        ? arr.findIndex(x => x.key === a.key) === i
                        : i === arr.findIndex(x => x.key === 'top_contributor'),
                    )
                    .map(badge => (
                      <BadgePill
                        key={`${badge.key}-${badge.unlockedAt}`}
                        badge={badge}
                        allBadges={entry.achievements}
                      />
                    ))}
                </div>
              ) : null}
            </div>
            <span className="bg-brand-light-blue text-brand-dark-blue shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums">
              {formatContributorPoints(entry.points)}
            </span>
          </li>
        </Link>
      </TooltipTrigger>
      {breakdownItems.length > 0 ? (
        <TooltipContent
          side="right"
          align="start"
          className="border-brand-gray-200 bg-card text-brand-black min-w-44 rounded-md border px-3 py-2.5 shadow-lg"
        >
          <ul className="space-y-1.5 text-sm">
            {breakdownItems.map(item => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-6"
              >
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
