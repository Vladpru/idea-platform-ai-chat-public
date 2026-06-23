import { useQuery } from '@tanstack/react-query';

import { fetchStatisticsSnapshot } from '../api/statistics.api';
import { getClientTimeZone } from '../lib/client-time-zone';
import { useStatisticsStore } from '../model/statistics-store';

export function useStatisticsSnapshot() {
  const period = useStatisticsStore(s => s.period);
  const timeZone = getClientTimeZone();

  return useQuery({
    queryKey: ['statistics', period, timeZone],
    queryFn: () => fetchStatisticsSnapshot(period, timeZone),
  });
}
