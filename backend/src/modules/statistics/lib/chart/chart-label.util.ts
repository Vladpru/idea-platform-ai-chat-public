import type { StatisticsBucketGranularity } from '../../../../shared/types/statistics.types';
import { bucketDateToZonedInstant } from '../period/period.util';

export type ChartLabelStyle = 'hour' | 'weekday' | 'shortDate' | 'month';

export function resolveChartLabelStyle(
  granularity: StatisticsBucketGranularity,
  bucketCount: number,
): ChartLabelStyle {
  if (granularity === 'hour') {
    return 'hour';
  }

  if (granularity === 'month') {
    return 'month';
  }

  return bucketCount <= 7 ? 'weekday' : 'shortDate';
}

export function formatChartBucketLabel(
  bucketDate: Date,
  timeZone: string,
  style: ChartLabelStyle,
): string {
  const instant = bucketDateToZonedInstant(bucketDate, timeZone);

  if (style === 'hour') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone,
    }).format(instant);
  }

  if (style === 'weekday') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone,
    }).format(instant);
  }

  if (style === 'shortDate') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(instant);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone,
  }).format(instant);
}
