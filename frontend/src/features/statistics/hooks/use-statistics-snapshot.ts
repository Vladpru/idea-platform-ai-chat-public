import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsSnapshot } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import type { StatisticsPeriod } from '../model/statistics.types';

export function useStatisticsSnapshot(period: StatisticsPeriod) {
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', period, timeZone],
    queryFn: () => fetchStatisticsSnapshot(period, timeZone),
  });
}
