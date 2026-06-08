import { api } from '@/shared/api/http';

import { getClientTimeZone } from '../lib/client-time-zone';
import type {
  LeaderboardResponse,
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

export async function fetchStatisticsLeaderboard(
  period: StatisticsPeriod,
  timeZone = getClientTimeZone(),
): Promise<LeaderboardResponse> {
  const { data } = await api.get<LeaderboardResponse>('/statistics/leaderboard', {
    params: { period, timeZone },
  });
  return data;
}
