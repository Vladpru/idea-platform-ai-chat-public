import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { GetStatisticsQueryDto } from '../shared/dto/get-statistics-query.dto';
import type { StatisticsSnapshotResponse } from '../shared/types/statistics.types';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard statistics snapshot' })
  @ApiOkResponse({
    description: 'Aggregated statistics for the statistics page',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSnapshot(
    @Query() query: GetStatisticsQueryDto,
  ): Promise<StatisticsSnapshotResponse> {
    return this.statisticsService.getSnapshot(query.period, query.timeZone);
  }
}
