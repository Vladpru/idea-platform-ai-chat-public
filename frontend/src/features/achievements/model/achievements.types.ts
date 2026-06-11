export type AchievementProgress = {
  current: number;
  threshold: number | null;
};

export type UserAchievementDto = {
  key: string;
  name: string;
  iconPath: string;
  unlocked: boolean;
  unlockedAt: string | null;
  metadata: { month?: string } | null;
  progress: AchievementProgress;
  isNew: boolean;
};
