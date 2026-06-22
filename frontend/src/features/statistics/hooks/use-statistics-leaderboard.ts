import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsLeaderboard } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import { useStatisticsStore } from '../model/statistics-store';

export function useStatisticsLeaderboard() {
  const period = useStatisticsStore(s => s.period);
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', 'leaderboard', period, timeZone],
    queryFn: () => fetchStatisticsLeaderboard(period, timeZone),
  });
}
