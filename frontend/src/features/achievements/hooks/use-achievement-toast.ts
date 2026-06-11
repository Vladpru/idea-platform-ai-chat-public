import { useEffect, useRef } from 'react';

import { toast } from 'sonner';

import { markAchievementsSeen } from '../api/achievements.api';
import type { UserAchievementDto } from '../model/achievements.types';

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
      toast(`Badge unlocked: ${badge.name}`, {
        description: badge.progress.threshold
          ? `You've reached the ${badge.name} milestone!`
          : `You've earned the ${badge.name} badge!`,
      });
    });

    void markAchievementsSeen();
  }, [achievements]);
}
