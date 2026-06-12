import type { UserAchievementDto } from '../model/achievements.types';
import { AchievementCard } from './AchievementCard';

type AchievementGridProps = {
  achievements: UserAchievementDto[];
};

export function AchievementGrid({ achievements }: AchievementGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {achievements.map(achievement => (
        <AchievementCard key={achievement.key} achievement={achievement} />
      ))}
    </div>
  );
}
