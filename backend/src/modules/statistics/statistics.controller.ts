import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { GetStatisticsQueryDto } from '../../shared/dto/get-statistics-query.dto';
import type {
  LeaderboardResponse,
  StatisticsSnapshotResponse,
} from '../../shared/types/statistics.types';
import { StatisticsService } from './statistics.service';

type AuthenticatedRequest = Request & { user: { id: string } };

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
    @Req() req: AuthenticatedRequest,
  ): Promise<StatisticsSnapshotResponse> {
    return this.statisticsService.getSnapshot(
      query.period,
      req.user.id,
      query.timeZone,
    );
  }

  @Get('leaderboard')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Full contributor leaderboard' })
  @ApiOkResponse({
    description:
      'Ranked contributors with point breakdown for the selected period',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getLeaderboard(
    @Query() query: GetStatisticsQueryDto,
  ): Promise<LeaderboardResponse> {
    return this.statisticsService.getLeaderboard(query.period, query.timeZone);
  }
}
