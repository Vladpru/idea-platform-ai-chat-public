import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import type { StatisticsPeriod } from '../types/statistics.types';

const STATISTICS_PERIODS = [
  'week',
  'month',
  'year',
] as const satisfies readonly StatisticsPeriod[];

export class GetStatisticsQueryDto {
  @ApiPropertyOptional({
    enum: STATISTICS_PERIODS,
    default: 'week',
    description:
      'Time range for chart series and activity metrics (UTC day boundaries)',
  })
  @IsOptional()
  @IsIn(STATISTICS_PERIODS)
  period: StatisticsPeriod = 'week';
}
