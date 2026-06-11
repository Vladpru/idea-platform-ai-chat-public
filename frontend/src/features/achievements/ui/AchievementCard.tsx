import { cn } from '@/shared/lib/utils';

import activeVoiceIconUrl from '../public/ActiveVoice.svg';
import collaboratorIconUrl from '../public/Collaborator.svg';
import completerIconUrl from '../public/Completer.svg';
import connectorIconUrl from '../public/Connector.svg';
import innovatorIconUrl from '../public/Innovator.svg';
import topContributorIconUrl from '../public/TopContributor.svg';
import type { UserAchievementDto } from '../model/achievements.types';

const BADGE_ICON_URLS: Record<string, string> = {
  innovator: innovatorIconUrl,
  active_voice: activeVoiceIconUrl,
  collaborator: collaboratorIconUrl,
  completer: completerIconUrl,
  connector: connectorIconUrl,
  top_contributor: topContributorIconUrl,
};

type AchievementCardProps = {
  achievement: UserAchievementDto;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const iconUrl = BADGE_ICON_URLS[achievement.key];
  const { unlocked, name, progress } = achievement;

  const progressLabel =
    progress.threshold !== null
      ? `${Math.min(progress.current, progress.threshold)}/${progress.threshold}`
      : null;

  return (
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
}
