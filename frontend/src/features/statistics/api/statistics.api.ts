import { api } from '@/shared/api/http';

import { getClientTimeZone } from '../lib/client-time-zone';
import type {
  StatisticsPeriod,
  StatisticsSnapshot,
} from '../model/statistics.types';

export async function fetchStatisticsSnapshot(
  period: StatisticsPeriod,
  timeZone = getClientTimeZone(),
): Promise<StatisticsSnapshot> {
  const { data } = await api.get<StatisticsSnapshot>('/statistics', {
    params: { period, timeZone },
  });
  return data;
}
