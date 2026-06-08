import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsLeaderboard } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import type { StatisticsPeriod } from '../model/statistics.types';

export function useStatisticsLeaderboard(period: StatisticsPeriod) {
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', 'leaderboard', period, timeZone],
    queryFn: () => fetchStatisticsLeaderboard(period, timeZone),
  });
}
