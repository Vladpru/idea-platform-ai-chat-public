import { Module } from '@nestjs/common';

import { StatisticsBucketRepository } from './statistics-bucket.repository';
import { StatisticsChartsRepository } from './statistics-charts.repository';
import { StatisticsScoringRepository } from './statistics-scoring.repository';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    StatisticsBucketRepository,
    StatisticsChartsRepository,
    StatisticsScoringRepository,
  ],
})
export class StatisticsModule {}
