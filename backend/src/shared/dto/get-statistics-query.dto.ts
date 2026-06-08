import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import type {
  StatisticsEntityType,
  StatisticsPeriod,
} from '../types/statistics.types';

const STATISTICS_PERIODS = [
  'week',
  'month',
  'year',
] as const satisfies readonly StatisticsPeriod[];

const STATISTICS_ENTITY_TYPES = [
  'idea',
  'problem',
] as const satisfies readonly StatisticsEntityType[];

export class GetStatisticsQueryDto {
  @ApiPropertyOptional({
    enum: STATISTICS_PERIODS,
    default: 'week',
    description:
      'Time range for chart series and activity metrics (uses timeZone for day boundaries)',
  })
  @IsOptional()
  @IsIn(STATISTICS_PERIODS)
  period: StatisticsPeriod = 'week';

  @ApiPropertyOptional({
    example: 'Europe/Kyiv',
    description: 'IANA timezone for chart aggregations (defaults to UTC)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    enum: STATISTICS_ENTITY_TYPES,
    default: 'idea',
    description: 'Whether to aggregate statistics for ideas or problems',
  })
  @IsOptional()
  @IsIn(STATISTICS_ENTITY_TYPES)
  entityType: StatisticsEntityType = 'idea';
}
