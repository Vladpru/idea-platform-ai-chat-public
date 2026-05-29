import { api } from '@/shared/api/http';

import type {
  StatisticsPeriod,
  StatisticsSnapshot,
} from '../model/statistics.types';

export async function fetchStatisticsSnapshot(
  period: StatisticsPeriod,
): Promise<StatisticsSnapshot> {
  const { data } = await api.get<StatisticsSnapshot>('/statistics', {
    params: { period },
  });
  return data;
}
