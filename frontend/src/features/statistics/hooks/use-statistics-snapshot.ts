import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsSnapshot } from '../api/statistics.api';
import type { StatisticsPeriod } from '../model/statistics.types';

export function useStatisticsSnapshot(period: StatisticsPeriod) {
  return useQuery({
    queryKey: ['statistics', period],
    queryFn: () => fetchStatisticsSnapshot(period),
  });
}
