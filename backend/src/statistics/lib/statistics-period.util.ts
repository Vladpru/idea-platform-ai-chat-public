import { addDays, addMonths, subDays, subMonths } from 'date-fns';

import type { StatisticsPeriod } from '../../shared/types/statistics.types';

export type StatisticsPeriodRange = {
  period: StatisticsPeriod;
  start: Date;
  end: Date;
};

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

export function resolveStatisticsPeriodRange(
  period: StatisticsPeriod,
  now = new Date(),
): StatisticsPeriodRange {
  const end = endOfUtcDay(now);
  let start = startOfUtcDay(now);

  switch (period) {
    case 'week':
      start = startOfUtcDay(subDays(start, 6));
      break;
    case 'month':
      start = startOfUtcDay(subDays(start, 29));
      break;
    case 'year':
      start = subMonths(
        new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)),
        11,
      );
      start = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
      );
      break;
    default:
      start = startOfUtcDay(subDays(start, 6));
  }

  return { period, start, end };
}

/** Calendar day in UTC (`YYYY-MM-DD`). */
export function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Calendar month in UTC (`YYYY-MM`). */
export function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function* eachDayInRange(start: Date, end: Date): Generator<Date> {
  let cursor = startOfUtcDay(start);
  const endDay = startOfUtcDay(end);

  while (cursor.getTime() <= endDay.getTime()) {
    yield new Date(cursor);
    cursor = startOfUtcDay(addDays(cursor, 1));
  }
}

export function* eachMonthInRange(start: Date, end: Date): Generator<Date> {
  let cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );
  const endMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
  );

  while (cursor.getTime() <= endMonth.getTime()) {
    yield new Date(cursor);
    cursor = addMonths(cursor, 1);
    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1),
    );
  }
}
