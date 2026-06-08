import { api } from '@/shared/api/http';

import { getClientTimeZone } from '../lib/client-time-zone';
import type {
  StatisticsEntityType,
  StatisticsPeriod,
  StatisticsSnapshot,
} from '../model/statistics.types';

export async function fetchStatisticsSnapshot(
  period: StatisticsPeriod,
  entityType: StatisticsEntityType = 'idea',
  timeZone = getClientTimeZone(),
): Promise<StatisticsSnapshot> {
  const { data } = await api.get<StatisticsSnapshot>('/statistics', {
    params: { period, entityType, timeZone },
  });
  return data;
}
