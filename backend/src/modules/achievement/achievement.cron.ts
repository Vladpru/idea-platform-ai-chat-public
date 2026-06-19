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

  // Runs at 00:00 UTC on the 1st of every month
  @Cron('0 0 1 * *', { timeZone: 'UTC' })
  async awardTopContributor(): Promise<void> {
    const nowUtc = new Date();
    const prevYear =
      nowUtc.getUTCMonth() === 0
        ? nowUtc.getUTCFullYear() - 1
        : nowUtc.getUTCFullYear();
    const prevMonthIndex =
      nowUtc.getUTCMonth() === 0 ? 11 : nowUtc.getUTCMonth() - 1;

    const start = new Date(Date.UTC(prevYear, prevMonthIndex, 1));
    const end = new Date(
      Date.UTC(prevYear, prevMonthIndex + 1, 1) - 1,
    );

    const month = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}`;

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
