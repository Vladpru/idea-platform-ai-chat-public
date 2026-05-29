import { bucketDateToZonedInstant } from './statistics-period.util';

export type ChartLabelStyle = 'weekday' | 'shortDate' | 'month';

export function formatChartBucketLabel(
  bucketDate: Date,
  timeZone: string,
  style: ChartLabelStyle,
): string {
  const instant = bucketDateToZonedInstant(bucketDate, timeZone);
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
