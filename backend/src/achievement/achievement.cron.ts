import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { StatisticsScoringRepository } from '../statistics/statistics-scoring.repository';
import { AchievementService } from './achievement.service';

@Injectable()
export class AchievementCronService {
  private readonly logger = new Logger(AchievementCronService.name);

  constructor(
    private readonly achievementService: AchievementService,
    private readonly scoringRepo: StatisticsScoringRepository,
  ) {}

  // Runs at 00:00 on the 1st of every month
  @Cron('0 0 1 * *')
  async awardTopContributor(): Promise<void> {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const end = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const month = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    this.logger.log(`Awarding Top Contributor for ${month}`);

    const entries = await this.scoringRepo.queryLeaderboardEntries(
      start,
      end,
      1,
    );
    if (entries.length === 0) {
      this.logger.log(`No contributors found for ${month}`);
      return;
    }

    const winner = entries[0];
    await this.achievementService.checkAndUnlockTopContributor(
      winner.id,
      month,
    );
    this.logger.log(`Awarded Top Contributor (${month}) to ${winner.id}`);
  }
}
