import { Prisma } from '../../../../generated/prisma/client';

export function asUtcTimestamptz(column: string): Prisma.Sql {
  const columnRef = Prisma.raw(`"${column}"`);
  return Prisma.sql`(${columnRef} AT TIME ZONE 'UTC')`;
}

export function toZonedWallClock(column: string, timeZone: string): Prisma.Sql {
  return Prisma.sql`${asUtcTimestamptz(column)} AT TIME ZONE ${timeZone}`;
}

export function scoringPoints(weight: number): Prisma.Sql {
  return Prisma.raw(String(weight));
}
