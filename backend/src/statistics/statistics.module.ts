import { Module, forwardRef } from '@nestjs/common';

import { AchievementModule } from '../achievement/achievement.module';
import { StatisticsBucketRepository } from './statistics-bucket.repository';
import { StatisticsChartsRepository } from './statistics-charts.repository';
import { StatisticsScoringRepository } from './statistics-scoring.repository';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [forwardRef(() => AchievementModule)],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    StatisticsBucketRepository,
    StatisticsChartsRepository,
    StatisticsScoringRepository,
  ],
  exports: [StatisticsScoringRepository],
})
export class StatisticsModule {}
