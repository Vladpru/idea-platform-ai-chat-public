import type {
  StatisticsBucketGranularity,
  StatisticsPeriod,
} from '../../../../shared/types/statistics.types';

export function resolveStatisticsBucketGranularity(
  period: StatisticsPeriod,
  start: Date,
  end: Date,
): StatisticsBucketGranularity {
  if (period === 'day') {
    return 'hour';
  }

  if (period === 'year' || period === 'all_time') {
    return 'month';
  }

  const daySpan = (end.getTime() - start.getTime()) / 86_400_000;
  return daySpan > 90 ? 'month' : 'day';
}
