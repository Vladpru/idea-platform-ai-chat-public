import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { BADGE_ICON_URLS } from '../lib/badge-icons';
import type { UserAchievementDto } from '../model/achievements.types';

const BADGE_UNLOCK_HINTS: Record<string, string> = {
  innovator: 'Create 5 ideas to unlock the Innovator badge',
  active_voice: 'Add 10 comments to unlock the Active Voice badge',
  top_contributor: 'Earn the highest monthly score to unlock Top Contributor',
  collaborator: 'Join 10 projects to unlock the Collaborator badge',
  completer: 'Complete 3 ideas to unlock the Completer badge',
  connector: 'Invite 5 users to unlock the Connector badge',
};

type AchievementCardProps = {
  achievement: UserAchievementDto;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const iconUrl = BADGE_ICON_URLS[achievement.key];
  const { unlocked, name, progress } = achievement;
  const hint = !unlocked ? BADGE_UNLOCK_HINTS[achievement.key] : undefined;

  const progressLabel =
    progress.threshold !== null
      ? `${Math.min(progress.current, progress.threshold)}/${progress.threshold}`
      : null;

  const card = (
    <article
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-opacity',
        unlocked
          ? 'border-brand-dark-blue opacity-100'
          : 'border-brand-gray-200 opacity-60',
      )}
    >
      <span
        className={cn(
          'flex size-16 items-center justify-center',
          !unlocked && 'grayscale',
        )}
      >
        {iconUrl ? (
          <img src={iconUrl} alt="" aria-hidden className="size-16" />
        ) : null}
      </span>

      <p className="text-brand-black text-sm font-bold leading-tight">{name}</p>

      {progressLabel ? (
        <p className="text-brand-gray-500 text-xs tabular-nums">
          {progressLabel}
        </p>
      ) : null}
    </article>
  );

  if (!hint) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
