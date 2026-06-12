import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import type { UserAchievementDto } from '../model/achievements.types';
import activeVoiceIconUrl from '../public/ActiveVoice.svg';
import collaboratorIconUrl from '../public/Collaborator.svg';
import completerIconUrl from '../public/Completer.svg';
import connectorIconUrl from '../public/Connector.svg';
import innovatorIconUrl from '../public/Innovator.svg';
import topContributorIconUrl from '../public/TopContributor.svg';

const BADGE_ICON_URLS: Record<string, string> = {
  innovator: innovatorIconUrl,
  active_voice: activeVoiceIconUrl,
  collaborator: collaboratorIconUrl,
  completer: completerIconUrl,
  connector: connectorIconUrl,
  top_contributor: topContributorIconUrl,
};

type BadgePillProps = {
  badge: UserAchievementDto;
  allBadges: UserAchievementDto[];
};

export function BadgePill({ badge, allBadges }: BadgePillProps) {
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
        <Avatar className="size-12">
          {iconUrl ? <AvatarImage src={iconUrl} alt="" aria-hidden /> : null}
          <AvatarFallback className="text-[8px]">
            {badge.name[0]}
          </AvatarFallback>
        </Avatar>
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
