import { createElement, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { markAchievementsSeen } from '../api/achievements.api';
import { BADGE_EARNED_MESSAGES } from '../lib/badge-icons';
import type { UserAchievementDto } from '../model/achievements.types';
import { BadgeToast } from '../ui/BadgeToast';

export function useAchievementToast(
  achievements: UserAchievementDto[] | undefined,
) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!achievements || shownRef.current) return;

    const newBadges = achievements.filter(a => a.isNew);
    if (newBadges.length === 0) return;

    shownRef.current = true;

    newBadges.forEach(badge => {
      const description =
        BADGE_EARNED_MESSAGES[badge.key] ??
        `You've earned the ${badge.name} badge!`;

      toast.custom(
        () =>
          createElement(BadgeToast, {
            name: badge.name,
            badgeKey: badge.key,
            description,
          }),
        { duration: 6000 },
      );
    });

    void markAchievementsSeen();
  }, [achievements]);
}
