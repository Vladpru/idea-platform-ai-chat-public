import { api } from '@/shared/api/http';

import type { UserAchievementDto } from '../model/achievements.types';

export async function fetchMyAchievements(): Promise<UserAchievementDto[]> {
  const { data } = await api.get<UserAchievementDto[]>('/achievements/me');
  return data;
}

export async function markAchievementsSeen(): Promise<void> {
  await api.patch('/achievements/me/seen');
}
