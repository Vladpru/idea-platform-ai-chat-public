import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsSnapshot } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import type {
  StatisticsEntityType,
  StatisticsPeriod,
} from '../model/statistics.types';

export function useStatisticsSnapshot(
  period: StatisticsPeriod,
  entityType: StatisticsEntityType,
) {
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', period, entityType, timeZone],
    queryFn: () => fetchStatisticsSnapshot(period, entityType, timeZone),
  });
}
