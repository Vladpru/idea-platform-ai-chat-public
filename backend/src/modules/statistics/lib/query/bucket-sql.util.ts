import { Prisma } from '../../../../../generated/prisma/client';
import type { StatisticsBucketGranularity } from '../../../../shared/types/statistics.types';
import { toZonedWallClock } from './timestamp-sql.util';

export function getBucketExpression(
  granularity: StatisticsBucketGranularity,
  timeZone: string,
  column: string,
): Prisma.Sql {
  const zonedColumn = toZonedWallClock(column, timeZone);

  if (granularity === 'hour') {
    return Prisma.sql`DATE_TRUNC('hour', ${zonedColumn})`;
  }

  if (granularity === 'month') {
    return Prisma.sql`DATE_TRUNC('month', ${zonedColumn})::date`;
  }

  return Prisma.sql`(${zonedColumn})::date`;
}

export function getBucketSeriesExpression(
  granularity: StatisticsBucketGranularity,
  start: Date,
  end: Date,
  timeZone: string,
): Prisma.Sql {
  if (granularity === 'hour') {
    return Prisma.sql`generate_series(
      DATE_TRUNC('hour', ${start} AT TIME ZONE ${timeZone}),
      DATE_TRUNC('hour', ${end} AT TIME ZONE ${timeZone}),
      INTERVAL '1 hour'
    )`;
  }

  if (granularity === 'month') {
    return Prisma.sql`generate_series(
      DATE_TRUNC('month', ${start} AT TIME ZONE ${timeZone})::date,
      DATE_TRUNC('month', ${end} AT TIME ZONE ${timeZone})::date,
      INTERVAL '1 month'
    )::date`;
  }

  return Prisma.sql`generate_series(
    (${start} AT TIME ZONE ${timeZone})::date,
    (${end} AT TIME ZONE ${timeZone})::date,
    INTERVAL '1 day'
  )::date`;
}
