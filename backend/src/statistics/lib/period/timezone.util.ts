import { BadRequestException } from '@nestjs/common';

export function resolveStatisticsTimeZone(timeZoneRaw?: string): string {
  const timeZone = timeZoneRaw?.trim() || 'UTC';

  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    throw new BadRequestException('Invalid IANA timezone');
  }
}
