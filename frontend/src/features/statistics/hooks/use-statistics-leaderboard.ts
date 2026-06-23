import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchStatisticsLeaderboard } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import { useStatisticsStore } from '../model/statistics-store';

export const LEADERBOARD_PAGE_SIZE = 10;

export function useStatisticsLeaderboard(page: number) {
  const period = useStatisticsStore(s => s.period);
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', 'leaderboard', period, page, timeZone],
    queryFn: () =>
      fetchStatisticsLeaderboard(period, page, LEADERBOARD_PAGE_SIZE, timeZone),
    placeholderData: keepPreviousData,
  });
}
