import {
  endOfDay,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

import type { StatisticsPeriod } from '../../shared/types/statistics.types';

export type StatisticsPeriodRange = {
  period: StatisticsPeriod;
  start: Date;
  end: Date;
};

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTimeZoneParts(date: Date, timeZone: string): TimeZoneParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map(part => [part.type, part.value]));

  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));

  return { year, month, day, hour, minute, second };
}

function getOffsetMs(date: Date, timeZone: string): number {
  const parts = getTimeZoneParts(date, timeZone);
  const utcFromZonedParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds(),
  );
  return utcFromZonedParts - date.getTime();
}

function toZonedTime(date: Date, timeZone: string): Date {
  return new Date(date.getTime() + getOffsetMs(date, timeZone));
}

function fromZonedTime(date: Date, timeZone: string): Date {
  const utcGuess = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );

  const offset1 = getOffsetMs(new Date(utcGuess), timeZone);
  let result = new Date(utcGuess - offset1);
  const offset2 = getOffsetMs(result, timeZone);

  if (offset2 !== offset1) {
    result = new Date(utcGuess - offset2);
  }

  return result;
}

export function resolveStatisticsPeriodRange(
  period: StatisticsPeriod,
  timeZone: string,
  now = new Date(),
): StatisticsPeriodRange {
  const zonedNow = toZonedTime(now, timeZone);
  const end = fromZonedTime(endOfDay(zonedNow), timeZone);
  let start = fromZonedTime(startOfDay(zonedNow), timeZone);

  switch (period) {
    case 'week':
      start = fromZonedTime(startOfDay(subDays(zonedNow, 6)), timeZone);
      break;
    case 'month':
      start = fromZonedTime(startOfDay(subDays(zonedNow, 29)), timeZone);
      break;
    case 'year':
      start = fromZonedTime(
        startOfMonth(subMonths(startOfMonth(zonedNow), 11)),
        timeZone,
      );
      break;
    default:
      start = fromZonedTime(startOfDay(subDays(zonedNow, 6)), timeZone);
  }

  return { period, start, end };
}

export function bucketDateToZonedInstant(
  bucketDate: Date,
  timeZone: string,
): Date {
  return fromZonedTime(
    new Date(
      bucketDate.getUTCFullYear(),
      bucketDate.getUTCMonth(),
      bucketDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
    timeZone,
  );
}
