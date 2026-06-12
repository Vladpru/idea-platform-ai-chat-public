import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { AchievementController } from './achievement.controller';
import { AchievementCronService } from './achievement.cron';
import { AchievementRepository } from './achievement.repository';
import { AchievementSeeder } from './achievement.seeder';
import { AchievementService } from './achievement.service';

@Module({
  imports: [PrismaModule, forwardRef(() => StatisticsModule)],
  controllers: [AchievementController],
  providers: [
    AchievementService,
    AchievementRepository,
    AchievementSeeder,
    AchievementCronService,
  ],
  exports: [AchievementService],
})
export class AchievementModule {}
