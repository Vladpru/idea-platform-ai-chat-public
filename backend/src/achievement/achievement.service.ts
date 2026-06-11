import { Injectable, Logger } from '@nestjs/common';

import { AchievementRepository } from './achievement.repository';
import type { UserAchievementDto } from './dto/user-achievement.dto';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementKey,
  type AchievementTrigger,
  TRIGGER_TO_BADGE_KEY,
} from './lib/achievement-criteria';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private readonly repo: AchievementRepository) {}

  async checkAndUnlock(
    userId: string,
    trigger: Exclude<AchievementTrigger, 'MONTHLY_CRON'>,
  ): Promise<void> {
    const key = TRIGGER_TO_BADGE_KEY[trigger];
    const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.key === key);

    if (!definition || definition.threshold === null) return;

    try {
      const existing = await this.repo.findUserAchievementByKey(userId, key);
      if (existing) return;

      const current = await this.getCountForKey(userId, key);
      if (current < definition.threshold) return;

      const achievement = await this.repo.findAchievementByKey(key);
      if (!achievement) return;

      await this.repo.createUserAchievement(userId, achievement.id);
      this.logger.log(`Unlocked ${key} for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to check/unlock ${key} for user ${userId}`,
        error,
      );
    }
  }

  async checkAndUnlockTopContributor(
    userId: string,
    month: string,
  ): Promise<void> {
    try {
      const existing = await this.repo.findUserAchievementByKeyAndMonth(
        userId,
        'top_contributor',
        month,
      );
      if (existing) return;

      const achievement =
        await this.repo.findAchievementByKey('top_contributor');
      if (!achievement) return;

      await this.repo.createUserAchievement(userId, achievement.id, { month });
      this.logger.log(`Unlocked top_contributor (${month}) for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to unlock top_contributor for user ${userId}`,
        error,
      );
    }
  }

  async getMyAchievements(userId: string): Promise<UserAchievementDto[]> {
    const [allAchievements, userAchievements] = await Promise.all([
      this.repo.findAllAchievements(),
      this.repo.findUserAchievements(userId),
    ]);

    const counts = await this.getAllCounts(userId);

    return allAchievements.map(achievement => {
      const earned = userAchievements.filter(
        ua => ua.achievementId === achievement.id,
      );
      const isUnlocked = earned.length > 0;
      const latest = earned.sort(
        (a, b) =>
          new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(),
      )[0];

      const metadata =
        achievement.key === 'top_contributor' && earned.length > 0
          ? (latest.metadata as { month?: string } | null)
          : null;

      const current = counts[achievement.key as AchievementKey] ?? 0;

      return {
        key: achievement.key,
        name: achievement.name,
        iconPath: achievement.iconPath,
        unlocked: isUnlocked,
        unlockedAt: latest?.unlockedAt.toISOString() ?? null,
        metadata,
        progress: {
          current,
          threshold: achievement.threshold,
        },
        isNew: isUnlocked && latest?.seenAt === null,
      };
    });
  }

  async getUnlockedAchievementsForUser(
    userId: string,
  ): Promise<UserAchievementDto[]> {
    const userAchievements = await this.repo.findUserAchievements(userId);

    return userAchievements.map(ua => ({
      key: ua.achievement.key,
      name: ua.achievement.name,
      iconPath: ua.achievement.iconPath,
      unlocked: true,
      unlockedAt: ua.unlockedAt.toISOString(),
      metadata: ua.metadata as { month?: string } | null,
      progress: {
        current: ua.achievement.threshold ?? 0,
        threshold: ua.achievement.threshold,
      },
      isNew: ua.seenAt === null,
    }));
  }

  async markSeen(userId: string): Promise<void> {
    await this.repo.markAllSeen(userId);
  }

  private async getCountForKey(
    userId: string,
    key: AchievementKey,
  ): Promise<number> {
    switch (key) {
      case 'innovator':
        return this.repo.countPublishedIdeas(userId);
      case 'active_voice':
        return this.repo.countComments(userId);
      case 'collaborator':
        return this.repo.countJoinedProjects(userId);
      case 'completer':
        return this.repo.countCompletedIdeas(userId);
      case 'connector':
        return 0; // wired by colleague's invite feature
      default:
        return 0;
    }
  }

  private async getAllCounts(
    userId: string,
  ): Promise<Partial<Record<AchievementKey, number>>> {
    const [ideas, comments, joins, completed] = await Promise.all([
      this.repo.countPublishedIdeas(userId),
      this.repo.countComments(userId),
      this.repo.countJoinedProjects(userId),
      this.repo.countCompletedIdeas(userId),
    ]);

    return {
      innovator: ideas,
      active_voice: comments,
      collaborator: joins,
      completer: completed,
      connector: 0,
      top_contributor: 0,
    };
  }
}
