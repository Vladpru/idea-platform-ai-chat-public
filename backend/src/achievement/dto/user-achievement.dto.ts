export class AchievementProgressDto {
  current: number;
  threshold: number | null;
}

export class UserAchievementDto {
  key: string;
  name: string;
  iconPath: string;
  unlocked: boolean;
  unlockedAt: string | null;
  metadata: { month?: string } | null;
  progress: AchievementProgressDto;
  isNew: boolean;
}
