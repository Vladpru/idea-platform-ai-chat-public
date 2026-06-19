import { Logger } from '@nestjs/common';

import { isValidIanaTimeZone } from '../../../../shared/utils/iana-timezone.util';

const logger = new Logger('StatisticsTimeZone');

export function resolveStatisticsTimeZone(timeZoneRaw?: string): string {
  const timeZone = timeZoneRaw?.trim() || 'UTC';

  if (isValidIanaTimeZone(timeZone)) {
    return timeZone;
  }

  if (timeZoneRaw?.trim()) {
    logger.warn(
      `Invalid IANA timezone "${timeZoneRaw.trim()}", falling back to UTC`,
    );
  }

  return 'UTC';
}
