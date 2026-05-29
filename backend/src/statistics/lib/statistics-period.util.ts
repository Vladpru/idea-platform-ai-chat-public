import type { StatisticsPeriod } from '../../shared/types/statistics.types';

export type StatisticsPeriodRange = {
  period: StatisticsPeriod;
  start: Date;
  end: Date;
};

export function resolveStatisticsPeriodRange(
  period: StatisticsPeriod,
  now = new Date(),
): StatisticsPeriodRange {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 6);
      break;
    case 'month':
      start.setDate(start.getDate() - 29);
      break;
    case 'year':
      start.setMonth(start.getMonth() - 11);
      start.setDate(1);
      break;
    default:
      start.setDate(start.getDate() - 6);
  }

  return { period, start, end };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function* eachDayInRange(start: Date, end: Date): Generator<Date> {
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cursor <= endDay) {
    yield new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
}

export function* eachMonthInRange(start: Date, end: Date): Generator<Date> {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    yield new Date(cursor);
    cursor.setMonth(cursor.getMonth() + 1);
  }
}
