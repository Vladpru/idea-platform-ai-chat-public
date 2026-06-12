import { useQuery } from '@tanstack/react-query';

import { fetchMyAchievements } from '../api/achievements.api';

export function useMyAchievements() {
  return useQuery({
    queryKey: ['achievements', 'me'],
    queryFn: fetchMyAchievements,
  });
}
